/*
NOTES:
allPlayers does not include the local player.
The local player must be always taken into account as well.
*/

const IS_MULTIPLAYER = true;

import Phaser from "phaser";

import sky from "../assets/sky.png";
import ground from "../assets/rock.png";
import dude from "../assets/dude-mzimm1.png";
import persons from "../assets/persons.jpg";
import block from "../assets/block.png";
import ball from "../assets/ball-64.png";

import firebase from "firebase/app";
import "firebase/database";
import _ from "lodash";

//Firebase config
var firebase_config = {
  apiKey: "AIzaSyDwPOmo6jBoi4ZGkt09PB4IVXHnxwlXkqk",
  authDomain: "familyfun-d8dec.firebaseapp.com",
  databaseURL: "https://familyfun-d8dec.firebaseio.com",
  projectId: "familyfun-d8dec",
  storageBucket: "familyfun-d8dec.appspot.com",
  messagingSenderId: "700818253828",
  appId: "1:700818253828:web:62fdcbdc6911df8e0d6d51",
};

// var game = new Phaser.Game(config);

var gfx;
var platforms = [];
var blocks = [];
var balls = [];
var spaceWasDown = false;

class Game extends Phaser.Scene {
  constructor() {
    console.log("constructor");
    super({ key: "Game" });

    firebase.initializeApp(firebase_config);
    this.database = firebase.database();

    this.playerName = "noname";
    this.previousX = 0;
    this.previousY = 0;
    this.updatePlayers.bind(this.updatePlayers);
    this.getName.bind(this.getName);
    this.createPlayer.bind(this.createPlayer);
    this.closestPlayer.bind(this.closestPlayer);
    this.killPlayer.bind(this.killPlayer);
    this.killPlayer2.bind(this.killPlayer2);

    this.allPlayers = {};
  }
  preload() {
    console.log("preload");

    this.load.image("platform", ground);

    this.load.image("sky", sky);
    this.load.image("block", block);
    this.load.image("ball", ball);
    this.load.image("ground", ground);
    this.load.spritesheet("dude", dude, { frameWidth: 32, frameHeight: 48 });
  }

  create() {
    console.log("create");
    gfx = this.add.graphics();

    this.matter.world.setBounds();

    // add Sky background sprit
    this.add.image(400, 300, "sky");

    // Create ground platforms

    this.createPlatform(400, 550);
    this.createPlatform(600, 400);
    this.createPlatform(50, 250);
    const tt = this.createPlatform(600, 220, false);
    this.createPlatform(200, 600);

    this.matter.add.worldConstraint(tt, 0, 1, { pointA: { x: 600, y: 220 } });

    // this.createBlock(280, 220);
    // this.createBlock(280, 260);
    // this.createBlock(280, 300);

    this.createBall(280, 220);

    this.createHoop(100, 100);
    this.createHoop(600, 100);

    // this.input.on("pointerdown", function (pointer) {
    //   if (pointer.y > 300) {
    //     block.setVelocity(0, -10);
    //   } else if (pointer.x < 400) {
    //     block.setVelocityX(-8);
    //   } else {
    //     block.setVelocityX(8);
    //   }
    // });

    // // Create Player
    var playerData = {
      playerName: this.playerName,
      x: 100,
      y: 450,
      isDead: false,
      isImposter: false,
      id: Math.random().toString().split(".")[1],
    };
    this.player = {};
    this.player.id = playerData.id;

    this.playerSprite = this.add.sprite(0, 0, "dude");
    this.player = this.createPlayer(playerData, this.playerSprite, true);

    // Create player animation
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    // Other playcers

    var thisPlayerRef = firebase.database().ref("players/" + this.player.id);
    thisPlayerRef.onDisconnect().set({});

    //Handle player events from Firebase.
    var playersRef = firebase.database().ref("players");
    playersRef.on("value", (snapshot) => {
      this.updatePlayers(snapshot.val());
    });

    //Handle object events from Firebase.
    var objectsRef = firebase.database().ref("objects");
    objectsRef.on("value", (snapshot) => {
      this.updateObjects(snapshot.val());
    });

    //Handle changing player name with input field.
    const elName = "playerName";
    const el = document.getElementById(elName);

    el.onchange = (event) => {
      this.playerName = event.target.value;
      const name = this.getName(this.playerName, this.player);
      this.player.labelRef.setText(name);
    };

    var that = this;

    this.input.keyboard.on("keydown_R", function (event) {
      console.log("Hello from the R Key!");
      that.resetGame(that);
    });

    this.input.keyboard.on("keydown_K", function (event) {
      console.log("Hello from the K Key!");

      that.killPlayer(that);
    });

    this.input.keyboard.on("keydown_T", function (event) {
      console.log("Hello from the T Key!");

      that.removeAllPlayers(that);
    });

    //Could be better in future: https://github.com/dxu/matter-collision-events
    this.matter.world.on("collisionactive", function (event, bodyA, bodyB) {
      that.handleCollisions(event, that, bodyA, bodyB);
      //bodyA.gameObject.setTint(0xff0000);
      //bodyB.gameObject.setTint(0x00ff00);
    });
    this.matter.world.on("collisionstart", function (event, bodyA, bodyB) {
      that.handleCollisions(event, that, bodyA, bodyB);
    });

    // add some custom config object
    // first index is Phaser.Scene, second is config object
    // PhaserGUIAction(this, {
    //   alpha: 0.6, // 0.0 ~ 1.0 (any value, you can change it in GUI)
    //   right: 100, // any value
    //   top: 50, // any value
    //   side: true, // boolean (default is true)
    // });
  }

  //////// update() is a special hook, called by Phaser3 engine. ///////////

  update() {
    // Create movement controller
    this.cursors = this.input.keyboard.createCursorKeys();
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-2);
      this.playerSprite.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(2);
      this.playerSprite.anims.play("right", true);
    } else {
      //this.player.setVelocityX(0);
      this.playerSprite.anims.play("turn");
    }

    // if (this.cursors.up.isDown && this.player.body.touching.down) {
    //CHECK for on the ground.
    //jump
    if (this.cursors.up.isDown) {
      //console.log("v:" + this.player.body.velocity.y);
      //   debugger;

      //Hack that does not work.
      // if (Math.abs(this.player.body.velocity.y) < 0.01) {
      //   this.player.setVelocityY(-4);
      // }

      //var intersects = this.matter.intersectBody(this.player.body, platforms);
      var intersects = this.matter.intersectBody(this.player.jumpSensor);
      //console.log("int:" + intersects.length);
      if (intersects.length > 0) {
        //debugger;
        this.player.setVelocityY(-4);
      }
    }

    //pick up ball
    if (this.cursors.space.isDown) {
      spaceWasDown = true;

      //blocks
      var intersects = this.matter.intersectBody(this.player.body, blocks);
      if (intersects.length > 0) {
        this.matter.body.setPosition(intersects[0], {
          x: this.player.body.position.x,
          y: this.player.body.position.y - 20,
        });
      }

      //ball
      var intersects = this.matter.intersectBody(this.player.body, balls[0]);
      if (intersects.length > 0) {
        this.matter.body.setPosition(intersects[0], {
          x: this.player.body.position.x,
          y: this.player.body.position.y - 20,
        });

        this.sendBall(balls[0]);
      }
    }

    //throw ball
    if (spaceWasDown && this.cursors.space.isUp) {
      spaceWasDown = false;

      //blocks
      var intersects = this.matter.intersectBody(this.player.body, blocks);
      if (intersects.length > 0) {
        this.matter.body.setVelocity(intersects[0], {
          x: this.player.body.velocity.x * 2,
          y: -4,
        });
      }

      //ball
      var intersects = this.matter.intersectBody(this.player.body, balls[0]);
      if (intersects.length > 0) {
        const newXVel = this.player.body.velocity.x * 2;
        const newYVel = -4;
        this.matter.body.setVelocity(intersects[0], {
          x: newXVel,
          y: newYVel,
        });
        this.sendBall(balls[0]); //, null, null, newXVel, newYVel);
      }
    }

    //Send info to Firebase and the other players.
    //If there is a change...

    const THRESHOLD = 0.2;
    if (
      Math.abs(this.player.x - this.previousX) > THRESHOLD ||
      Math.abs(this.player.y - this.previousY) > THRESHOLD ||
      this.player.isDead != this.player.previousIsDead
    ) {
      //console.log("write player change to firebase.");

      // Write player to firebase! NOTE.

      firebase
        .database()
        .ref("players/" + this.player.id)
        .update({
          id: this.player.id,
          playerName: this.playerName,
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          angle: Math.round(this.player.angle),
          animation: this.playerSprite.anims.currentAnim.key,
        });
    }
    this.previousX = Math.round(this.player.x);
    this.previousY = Math.round(this.player.y);
    this.player.previousIsDead = this.player.isDead;
  }

  handleCollisions(event, that, bodyA, bodyB) {
    if (that.player) {
      //console.log("c!");
      if (bodyA == that.player.body || bodyB == that.player.body) {
        //console.log("collide!");

        const collidedBody = bodyA == that.player.body ? bodyB : bodyA;
        const ball = balls[0];
        if (collidedBody == ball.body) {
          console.log("collide ball!");

          that.sendBall(ball);
        }
      }
    }
  }

  sendBall(ball, newX, newY, newXVel, newYVel) {
    console.log("sendBall");
    firebase
      .database()
      .ref("objects/" + ball.id)
      .update({
        id: ball.id,

        x: Math.round(newX || ball.x),
        y: Math.round(newY || ball.y),
        angle: Math.round(ball.angle),
        xVel: newXVel || ball.body.velocity.x,
        yVel: newYVel || ball.body.velocity.y,
      });
  }

  createHoop(x, y) {
    console.log("create hoop");

    var r1 = this.add.rectangle(100, 100, 120, 160, 0x9966ff);
    r1.setStrokeStyle(4, 0xefc53f);

    //this.matter.add.gameObject(r1);
    //this.matter.add.gameObject(r1, { shape: { type: 'fromVerts', verts: arrow, flagInternal: true } });

    // const hoopSide1 = this.matter.add.rectangle(x, y, 10, 60, {
    //   restitution: 0.4,
    // });
    // const hoopSide2 = this.matter.add.rectangle(x + 100, y, 10, 60, {
    //   restitution: 0.4,
    // });

    // const hoopScore = this.matter.add.rectangle(x, y + 50, 60, 10, {
    //   restitution: 0.4,
    // });
  }

  createBlock(x, y) {
    console.log("create block");
    var block = this.matter.add
      .image(x, y, "block", null, {
        restitution: 0.4,
      })
      .setScale(0.5);

    block.setBody({
      type: "rectangle",
      width: 40,
      height: 40,
    });

    // const block = this.matter.add.rectangle(x, y, 40, 40, {
    //   render: {
    //     sprite: {
    //       texture: "ground",

    //       //Is there a 'width:' or 'height' property?
    //     },
    //   },
    // });
    blocks.push(block);
  }

  createBall(x, y) {
    console.log("create ball");
    var ball = this.matter.add
      .image(x, y, "ball", null, {
        restitution: 0.4,
      })
      .setScale(0.5);

    ball.setBody({
      type: "circle",
      radius: 20,
    });

    ball.id = 2;

    // const block = this.matter.add.rectangle(x, y, 40, 40, {
    //   render: {
    //     sprite: {
    //       texture: "ground",

    //       //Is there a 'width:' or 'height' property?
    //     },
    //   },
    // });
    balls.push(ball);
  }

  createPlatform(x, y, isStaticD) {
    var p = this.matter.add
      .image(x, y, "ground", null, {
        restitution: 0.4,
        isStatic: isStaticD != null ? isStaticD : true,
      })
      .setScale(0.75);
    // .setPosition({ x: 0, y: -50 });

    //var arrow = "40 0 40 20 100 20 100 80 40 80 40 100 0 50";
    //Clockwise from upper left.
    var arrow = "-130 -120 170 -120 170 -50 -30 -10";

    p.setBody({
      type: "fromVerts",
      verts: arrow,
    });

    // var arrow = '40 0 40 20 100 20 100 80 40 80 40 100 0 50';
    // var poly = this.add.polygon(400, 300, arrow, 0x0000ff, 0.2);
    // this.matter.add.gameObject(poly, { shape: { type: 'fromVerts', verts: arrow, flagInternal: true } });

    // .setFriction(0)
    // .setFrictionStatic(0);

    platforms.push(p);
    return p;
  }

  createPlayer(playerData, mSprite, isCurrentPlayer) {
    var style;
    if (isCurrentPlayer) {
      style = { font: "16px Arial", fill: "#fff" };
    } else {
      style = { font: "16px Arial", fill: "#000" };
    }
    var name = this.getName(playerData.playerName, playerData);
    var label = this.add.text(0, -30, name, style);
    label.setOrigin(0.5);

    var group = this.add.container(playerData.x, playerData.y, [
      label,
      mSprite,
    ]);
    //var newPlayer = mSprite;

    var newPlayer = this.matter.add
      .gameObject(group, {
        shape: { type: "polygon", sides: 4, radius: 30 },
      })
      .setFrictionAir(0.01)
      .setFriction(0.9)
      .setFrictionStatic(0)
      .setBounce(0.5)
      .setFixedRotation();

    newPlayer.spriteRef = mSprite;
    newPlayer.labelRef = label;
    newPlayer.isDead = playerData.isDead;
    newPlayer.isImposter = playerData.isImposter;
    newPlayer.id = playerData.id;

    return newPlayer;
  }

  getName(name, p) {
    //only show imposter if its the current player.
    var name2 = name + (p.isDead ? " - DEAD" : "");
    if (p.id == this.player.id) {
      name2 = name2 + (p.isImposter ? " - IMPOSTER" : "");
    }

    return name2;
  }

  // Bring everyone back to life. Set a random player as the imposter.
  resetGame(that) {
    //RESET GAME
    var allKeys = Object.keys(that.allPlayers);
    allKeys.push(that.player.id);

    console.log(allKeys);
    allKeys.forEach((id) => {
      firebase
        .database()
        .ref("players/" + id)
        .update({
          isDead: false,
          isImposter: false,
        });
    });

    //Set the imposter

    //Get r - a random number between 0 and numplayers-1.
    var len = allKeys.length;
    //console.log("l:" + len);
    var r = that.getRandomInt(0, len - 1);
    //console.log("r:" + r);

    var id = allKeys[r];

    console.log("imposter: pn:" + id);

    firebase
      .database()
      .ref("players/" + id)
      .update({
        isImposter: true,
      });

    const ball = balls[0];
    ball.x = 280;
    ball.y = 220;
    ball.body.velocity.x = 0;
    ball.body.velocity.y = 0;

    that.sendBall(ball);
  }

  closestPlayer() {
    var closest = null;
    var closestDistance = 10000000;

    Object.keys(this.allPlayers).forEach((id) => {
      console.log("closest id? " + id);
      if (id != this.player.id) {
        const distance = Phaser.Math.Distance.BetweenPoints(
          this.player.body.position,
          this.allPlayers[id].body.position
        );
        console.log("dist? " + distance);
        if (distance < closestDistance) {
          closest = this.allPlayers[id];
          closestDistance = distance;
        }
      }
    });
    console.log("closest:" + closest);
    return closest;
  }

  killPlayer2(id) {
    firebase
      .database()
      .ref("players/" + id)
      .update({
        isDead: true,
      })
      .then(function () {
        //console.log("saved");
      })
      .catch(function (error) {
        //console.log("not saved" + error);
      });
  }

  killPlayer() {
    console.log("isImp: " + this.player.isImposter);
    if (this.player.isImposter == false) {
      console.log("Not imposter, cannot kill");
    } else {
      //var closest = that.matter.closest(that.player);
      var closest = this.closestPlayer();

      if (closest) {
        //console.log
        const pNumber = closest.id;
        console.log("Kill player: " + pNumber);
        const distance = Phaser.Math.Distance.BetweenPoints(
          this.player.body.position,
          closest.body.position
        );
        var that = this;
        if (distance < 90) {
          setTimeout(function () {
            that.killPlayer2(pNumber);
            console.log("Kill!");
          }, 3000);
        }
      } else {
        console.log("no closest");
      }
    } //is imposter
  }

  removeAllPlayers(that) {
    firebase
      .database()
      .ref("players/")
      .set({})
      .then(function () {
        //console.log("saved");
      })
      .catch(function (error) {
        //console.log("not saved" + error);
      });
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  updatePlayerDeath(is, incoming) {
    //console.log(incoming);
    if (!incoming) {
      return;
    }

    if (
      is.playerName != incoming.playerName ||
      is.isDead != incoming.isDead ||
      is.isImposter != incoming.isImposter
    ) {
      //console.log("RENAME!")
      var name = this.getName(incoming.playerName, incoming);
      is.labelRef.setText(name);
    }

    is.playerName = incoming.playerName;
    is.isDead = incoming.isDead;
    is.isImposter = incoming.isImposter;
  }

  updateObjects(data) {
    console.log("updateObjects");
    if (!data) return;

    //Update each ojbect
    const ball = balls[0];

    Object.keys(data).forEach((id) => {
      //ball
      if (id == ball.id) {
        const incomingData = data[id];

        ball.x = incomingData.x;
        ball.y = incomingData.y;
        ball.angle = incomingData.angle;
        // ball.body.velocity.x = incomingData.xVel;
        // ball.body.velocity.y = incomingData.yVel;
        this.matter.body.setVelocity(ball.body, {
          x: incomingData.xVel,
          y: incomingData.yVel,
        });

        //console.log("ball yvel:" + balls[0].body.velocity.y);
      }
    });
  }

  updatePlayers(data) {
    //console.log("updatePlayers" + data);
    if (!data) return;
    //Update current player (died?)
    this.updatePlayerDeath(this.player, data[this.player.id]);

    //Unregister missing players
    Object.keys(this.allPlayers).forEach((id) => {
      if (!data[id]) {
        this.allPlayers[id].destroy();
      }
    });

    //Update each player (but not the current player.).

    Object.keys(data).forEach((id) => {
      if (this.allPlayers[id] && id != this.player.id) {
        // UPDATE Existing CHARACTER

        const incomingData = data[id];
        const player = this.allPlayers[id];

        //Update all existing players - name and death
        this.updatePlayerDeath(player, incomingData);

        player.x = incomingData.x;
        player.y = incomingData.y;
        player.angle = incomingData.angle;
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.id = id;

        //console.log(player.spriteRef);
        player.spriteRef.anims.play(incomingData.animation, true);
      } else if (!this.allPlayers[id] && id != this.player.id) {
        // CREATE New PLAYERS
        if (IS_MULTIPLAYER) {
          const playerData = data[id];
          var mSprite = this.add.sprite(0, 0, "dude");
          var newPlayer = this.createPlayer(playerData, mSprite, false);
          this.allPlayers[id] = newPlayer;
        }
      } else {
      }
    });
  }
}
export default Game;
