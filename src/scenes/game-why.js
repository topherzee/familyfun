import Phaser from "phaser";

import sky from "../assets/sky.png";
import ground from "../assets/platform.png";
import dude from "../assets/dude.png";
import persons from "../assets/persons.jpg";

// var config = {
//   type: Phaser.AUTO,
//   width: 800,
//   height: 600,
//   backgroundColor: "#1b1464",
//   parent: "phaser-example",
//   physics: {
//     default: "matter",
//     matter: {},
//   },
//   scene: {
//     preload: preload,
//     create: create,
//     update: update,
//   },
// };

// var game = new Phaser.Game(config);
var block;
var gfx;

class Game extends Phaser.Scene {
  constructor() {
    super({ key: "Game" });
  }
  preload() {
    this.load.image("block", persons);
    this.load.image("platform", ground);

    this.load.image("sky", sky);
    this.load.image("ground", ground);
  }

  create() {
    gfx = this.add.graphics();
    this.add.image(400, 300, "sky");

    //this.matter.world.setBounds();
    block = this.matter.add.image(400, 100, "block");

    block.setFriction(0.05);
    block.setFrictionAir(0.0005);
    block.setBounce(0.9);

    var ground = this.matter.add.image(400, 550, "platform", null, {
      restitution: 0.4,
      isStatic: true,
    });

    this.input.on("pointerdown", function (pointer) {
      if (pointer.y > 300) {
        block.setVelocity(0, -10);
      } else if (pointer.x < 400) {
        block.setVelocityX(-8);
      } else {
        block.setVelocityX(8);
      }
    });
  }

  update() {
    this.cursors = this.input.keyboard.createCursorKeys();
    if (this.cursors.left.isDown) {
      console.log("l1");
      block.setVelocityX(-8);
      //this.player.setVelocityX(-10);

      //this.matter.body.setVelocity(this.player, { x: 0, y: -10 });
      //this.playerSprite.anims.play("left", true);
      console.log("l2");
    } else if (this.cursors.right.isDown) {
      var m = this.testBody;
      console.log(m);
      block.setVelocityX(8);
      //debugger;
      //this.testBody.setVelocityX(10);
      // this.matter.body.setVelocity(this.testBody, { x: 10, y: 1 });
      // this.playerSprite.anims.play("right", true);
    } else {
      //this.player.setVelocityX(0);
      //this.playerSprite.anims.play("turn");
    }
  }
}

// /*
// NOTES:
// allPlayers does not include the local player.
// The local player must be always taken into account as well.
// */

// import Phaser from "phaser";

// import sky from "../assets/sky.png";
// import ground from "../assets/platform.png";
// import dude from "../assets/dude.png";
// import persons from "../assets/persons.jpg";

// import firebase from "firebase/app";
// import "firebase/database";
// import _ from "lodash";

// //Firebase config
// var firebase_config = {
//   apiKey: "AIzaSyDwPOmo6jBoi4ZGkt09PB4IVXHnxwlXkqk",
//   authDomain: "familyfun-d8dec.firebaseapp.com",
//   databaseURL: "https://familyfun-d8dec.firebaseio.com",
//   projectId: "familyfun-d8dec",
//   storageBucket: "familyfun-d8dec.appspot.com",
//   messagingSenderId: "700818253828",
//   appId: "1:700818253828:web:62fdcbdc6911df8e0d6d51",
// };

// var gfx;

// class Game extends Phaser.Scene {
//   constructor() {
//     super({ key: "Game" });

//     // firebase.initializeApp(firebase_config);
//     // this.database = firebase.database();

//     this.playerName = "noname";
//     this.previousX = 0;
//     this.previousY = 0;
//     // this.updatePlayers.bind(this.updatePlayers);
//     // this.getName.bind(this.getName);
//     // this.createPlayer.bind(this.createPlayer);
//     this.allPlayers = {};
//   }

//   //////// preload() is a special hook, called by Phaser3 engine. ///////////
//   preload() {
//     this.load.image("sky", sky);
//     this.load.image("ground", ground);
//     this.load.image("persons", persons);
//     this.load.spritesheet("dude", dude, { frameWidth: 32, frameHeight: 48 });
//     //console.log(this.database);
//   }

//   createPlatform(x, y) {
//     this.matter.add
//       .image(x, y, "ground", null, {
//         restitution: 0.4,
//         isStatic: true,
//       })
//       .setFriction(0)
//       .setFrictionStatic(0);
//   }

//   //////// create() is a special hook, called by Phaser3 engine. ///////////
//   create() {
//     gfx = this.add.graphics();

//     this.matter.world.setBounds();
//     var canDrag = this.matter.world.nextGroup();

//     // add Sky background sprit
//     this.add.image(400, 300, "sky");

//     // Create ground platforms

//     //this.matter.add.image(400, 568, 'ground', null, { chamfer: 16 }).setBounce(0.9).setCollisionGroup(canDrag);
//     // this.createPlatform(400, 550);
//     // this.createPlatform(600, 400);
//     // this.createPlatform(50, 250);
//     // this.createPlatform(750, 220);
//     // this.createPlatform(200, 600);

//     //var block = this.matter.add.circle(150, 250, 16);
//     var block = this.matter.add.image(400, 100, "persons");

//     block.setFriction(0.05);
//     block.setFrictionAir(0.0005);
//     block.setBounce(0.9);

//     this.testBody = block;

//     this.input.on("pointerdown", function (pointer) {
//       if (pointer.y > 300) {
//         this.testBody.setVelocity(0, -10);
//       } else if (pointer.x < 400) {
//         this.testBody.setVelocityX(-8);
//       } else {
//         this.testBody.setVelocityX(8);
//       }
//     });

//     // // Create Player
//     // var playerData = {
//     //   playerName: this.playerName,
//     //   x: 100,
//     //   y: 450,
//     //   isDead: false,
//     //   isImposter: false,
//     //   id: Math.random().toString().split(".")[1],
//     // };
//     // this.player = {};
//     // this.player.id = playerData.id;

//     this.playerSprite = this.add.sprite(0, 0, "dude");

//     // this.player = this.createPlayer(playerData, this.playerSprite, true);

//     // Create player animation
//     this.anims.create({
//       key: "left",
//       frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
//       frameRate: 10,
//       repeat: -1,
//     });

//     this.anims.create({
//       key: "turn",
//       frames: [{ key: "dude", frame: 4 }],
//       frameRate: 20,
//     });

//     this.anims.create({
//       key: "right",
//       frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
//       frameRate: 10,
//       repeat: -1,
//     });
//   }

//   //////// update() is a special hook, called by Phaser3 engine. ///////////
//   update() {
//     // Create movement controller

//     this.cursors = this.input.keyboard.createCursorKeys();
//     if (this.cursors.left.isDown) {
//       console.log("l1");
//       //this.player.setVelocityX(-10);

//       //this.matter.body.setVelocity(this.player, { x: 0, y: -10 });
//       this.playerSprite.anims.play("left", true);
//       console.log("l2");
//     } else if (this.cursors.right.isDown) {
//       var m = this.testBody;
//       console.log(m);
//       //debugger;
//       //this.testBody.setVelocityX(10);
//       this.matter.body.setVelocity(this.testBody, { x: 10, y: 1 });
//       this.playerSprite.anims.play("right", true);
//     } else {
//       //this.player.setVelocityX(0);
//       this.playerSprite.anims.play("turn");
//     }
//   }

//   createPlayer(playerData, mSprite, isCurrentPlayer) {
//     var style;
//     if (isCurrentPlayer) {
//       style = { font: "16px Arial", fill: "#fff" };
//     } else {
//       style = { font: "16px Arial", fill: "#000" };
//     }

//     var name = this.getName(playerData.playerName, playerData);
//     var label = this.add.text(0, -30, name, style);
//     label.setOrigin(0.5);

//     // var newPlayer = this.add.container(playerData.x, playerData.y, [
//     //   label,
//     //   mSprite,
//     // ]);
//     var newPlayer = mSprite;

//     newPlayer.spriteRef = mSprite;
//     newPlayer.labelRef = label;
//     newPlayer.isDead = playerData.isDead;
//     newPlayer.isImposter = playerData.isImposter;
//     newPlayer.id = playerData.id;

//     //this.matter.world.enable(newPlayer);
//     var matterText = this.matter.add
//       .gameObject(newPlayer, {
//         shape: { type: "polygon", sides: 4, radius: 20 },
//       })
//       .setFrictionAir(0.001)
//       .setFriction(0)
//       .setFrictionStatic(0)
//       .setBounce(0.9);

//     //debugger;
//     //this.matter.body.rotate(matterText, 20);
//     //this.matter.add.gameObject(newPlayer)
//     //newPlayer.body.setBounce(0.2).setCollideWorldBounds(true);

//     // newPlayer.body.setSize(40, 55, true);
//     // newPlayer.setSize(40, 55, true);

//     return newPlayer;
//   }
// }

// export default Game;
