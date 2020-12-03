/*
NOTES:
allPlayers does not include the local player.
The local player must be always taken into account as well.
*/

import Phaser from "phaser";

import sky from "../assets/sky.png";
import ground from "../assets/platform.png";
import dude from "../assets/dude.png";

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

var gfx;

class Game extends Phaser.Scene {
  constructor() {
    super({ key: "Game" });

    firebase.initializeApp(firebase_config);
    this.database = firebase.database();

    this.playerName = "noname";
    this.previousX = 0;
    this.previousY = 0;
    this.updatePlayerPositions.bind(this.updatePlayerPositions);
    this.getName.bind(this.getName);
    this.createPlayer.bind(this.createPlayer);
    this.allPlayers = {};
  }

  //////// preload() is a special hook, called by Phaser3 engine. ///////////
  preload() {
    this.load.image("sky", sky);
    this.load.image("ground", ground);
    this.load.spritesheet("dude", dude, { frameWidth: 32, frameHeight: 48 });
    //console.log(this.database);
  }

  //////// create() is a special hook, called by Phaser3 engine. ///////////
  create() {
    gfx = this.add.graphics();

    // add Sky background sprit
    this.add.image(400, 300, "sky");

    // Create ground platforms
    this.allPlayersGroup = this.physics.add.staticGroup();
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();
    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    //new ground
    this.platforms.create(500, 800, "ground").setScale(3).refreshBody();

    this.platforms.create(900, 675, "ground");

    // Create Player
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

    this.player.body.setGravityY(300);

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

    // set colliders between Player and grounds
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.allPlayersGroup);

    var thisPlayerRef = firebase.database().ref("players/" + this.player.id);
    thisPlayerRef.onDisconnect().set({});
    var playersRef = firebase.database().ref("players");
    playersRef.on("value", (snapshot) => {
      this.updatePlayerPositions(snapshot.val());
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
  }

  //////// update() is a special hook, called by Phaser3 engine. ///////////
  update() {
    // Create movement controller
    this.cursors = this.input.keyboard.createCursorKeys();
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-160);
      this.playerSprite.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(160);
      this.playerSprite.anims.play("right", true);
    } else {
      this.player.body.setVelocityX(0);
      this.playerSprite.anims.play("turn");
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.body.setVelocityY(-450);
    }

    //Send info to Firebase and the other players.
    //If there is a change...
    if (
      Math.round(this.player.x) != this.previousX ||
      Math.round(this.player.y) != this.previousY ||
      this.player.isDead != this.player.previousIsDead
    ) {
      firebase
        .database()
        .ref("players/" + this.player.id)
        .update({
          id: this.player.id,
          playerName: this.playerName,
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          animation: this.playerSprite.anims.currentAnim.key,
        });
    }
    this.previousX = Math.round(this.player.x);
    this.previousY = Math.round(this.player.y);
    this.player.previousIsDead = this.player.isDead;

    //DUBGGGINNG Closeness - draws a line in the black area.
    // var pointer = this.input.activePointer;
    // if (this.player) {
    //   var closest = this.physics.closest(this.player);

    //   if (closest) {
    //     gfx
    //       .clear()
    //       .lineStyle(2, 0xff3300)
    //       .lineBetween(closest.x, closest.y, pointer.x, pointer.y);
    //   }
    // }
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
    console.log("l:" + len);
    var r = that.getRandomInt(0, len - 1);
    console.log("r:" + r);

    var id = allKeys[r];

    console.log("imposter: pn:" + id);

    firebase
      .database()
      .ref("players/" + id)
      .update({
        isImposter: true,
      });
  }

  killPlayer(that) {
    console.log("isImp: " + that.player.isImposter);
    if (that.player.isImposter == false) {
      console.log("Not imposter, cannot kill");
    } else {
      var closest = that.physics.closest(that.player);

      if (closest) {
        const pNumber = closest.gameObject.id;
        console.log("Kill player: " + pNumber);
        const distance = Phaser.Math.Distance.BetweenPoints(
          that.player.body.position,
          closest.position
        );

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

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getName(name, p) {
    //only show imposter if its the current player.
    var name2 = name + (p.isDead ? " - DEAD" : "");
    if (p.id == this.player.id) {
      name2 = name2 + (p.isImposter ? " - IMPOSTER" : "");
    }

    return name2;
  }

  updatePlayerDeath(is, incoming) {
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

  updatePlayerPositions(data) {
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
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.id = id;

        //console.log(player.spriteRef);
        player.spriteRef.anims.play(incomingData.animation, true);
      } else if (!this.allPlayers[id] && id != this.player.id) {
        // CREATE New PLAYERS
        const playerData = data[id];

        var mSprite = this.add.sprite(0, 0, "dude");
        var newPlayer = this.createPlayer(playerData, mSprite, false);
        this.physics.add.collider(newPlayer, this.platforms);
        this.physics.add.collider(this.player, newPlayer);
        this.allPlayers[id] = newPlayer;
      } else {
      }
    });
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

    var newPlayer = this.add.container(playerData.x, playerData.y, [
      label,
      mSprite,
    ]);
    newPlayer.spriteRef = mSprite;
    newPlayer.labelRef = label;
    newPlayer.isDead = playerData.isDead;
    newPlayer.isImposter = playerData.isImposter;
    newPlayer.id = playerData.id;

    this.physics.world.enable(newPlayer);
    newPlayer.body.setBounce(0.2).setCollideWorldBounds(true);

    newPlayer.body.setSize(40, 55, true);
    newPlayer.setSize(40, 55, true);

    return newPlayer;
  }
}

export default Game;
