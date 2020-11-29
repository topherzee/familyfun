import Phaser from "phaser";

import sky from "../assets/sky.png";
import ground from "../assets/platform.png";
import dude from "../assets/dude.png";

import firebase from "firebase/app";
import "firebase/database";
import _ from "lodash";

// Add your firebase configs here
// var config = {
//   apiKey: "",
//   authDomain: "",
//   databaseURL: "",
//   projectId: "",
//   storageBucket: "",
//   messagingSenderId: ""
// };

var config = {
  apiKey: "AIzaSyDwPOmo6jBoi4ZGkt09PB4IVXHnxwlXkqk",
  authDomain: "familyfun-d8dec.firebaseapp.com",
  databaseURL: "https://familyfun-d8dec.firebaseio.com",
  projectId: "familyfun-d8dec",
  storageBucket: "familyfun-d8dec.appspot.com",
  messagingSenderId: "700818253828",
  appId: "1:700818253828:web:62fdcbdc6911df8e0d6d51",
};

class Game extends Phaser.Scene {
  constructor() {
    super({ key: "Game" });
    firebase.initializeApp(config);
    this.database = firebase.database();
    this.playerNumber = Math.random().toString().split(".")[1];
    this.playerName = "noname";
    this.previousX = 0;
    this.previousY = 0;
    this.updatePlayerPositions.bind(this.updatePlayerPositions);
    this.allPlayers = {};
  }

  preload() {
    this.load.image("sky", sky);
    this.load.image("ground", ground);
    this.load.spritesheet("dude", dude, { frameWidth: 32, frameHeight: 48 });
    console.log(this.database);
  }

  create() {
    // add Sky background sprit
    this.add.image(400, 300, "sky");

    // Create ground platforms
    this.allPlayersGroup = this.physics.add.staticGroup();
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();
    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    // Create Player

    var style = { font: "10px Arial", fill: "#ffffff" };
    var label = this.add.text(0, -30, this.playerName, style);
    label.setOrigin(0.5);

    //this.playerSprite = this.physics.add.sprite(0, 0, "dude");
    this.playerSprite = this.add.sprite(0, 0, "dude");

    this.player = this.add.container(100, 450, [label, this.playerSprite]);
    this.physics.world.enable(this.player);
    this.player.body.setBounce(0.2).setCollideWorldBounds(true);

    this.player.setSize(32, 40, true);
    //this.player.setCircle(32, 0, 0);

    this.player.label = label;
    //http://labs.phaser.io/edit.html?src=src%5Cgame%20objects%5Ccontainer%5Carcade%20physics%20body%20test.js

    //this.player = this.physics.add.sprite(100, 450, "dude");
    this.player.body.setGravityY(300);
    //this.player.setBounce(0.2);
    //this.player.setCollideWorldBounds(true);

    // this.player = this.physics.add.sprite(100, 450, "dude");
    // this.player.body.setGravityY(300);
    // this.player.setBounce(0.2);
    // this.player.setCollideWorldBounds(true);

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

    // set collides between Player and grounds
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.allPlayersGroup);

    var thisPlayerRef = firebase.database().ref("players/" + this.playerNumber);
    thisPlayerRef.onDisconnect().set({});
    var playersRef = firebase.database().ref("players");
    playersRef.on("value", (snapshot) => {
      this.updatePlayerPositions(snapshot.val());
    });

    const elName = "playerName";
    const el = document.getElementById(elName);
    //that = this;
    el.onchange = (event) => {
      this.playerName = event.target.value;
      this.player.label.setText(this.playerName);
      //console.log("CHANGEY2: " + that.playerName);
    };
  }

  updatePlayerPositions(data) {
    Object.keys(this.allPlayers).forEach((characterKey) => {
      if (!data[characterKey]) {
        this.allPlayers[characterKey].destroy();
      }
    });

    Object.keys(data).forEach((characterKey) => {
      if (this.allPlayers[characterKey] && characterKey != this.playerNumber) {
        // UPDATE CHARACTER
        const incomingData = data[characterKey];
        const existingCharacter = this.allPlayers[characterKey];
        existingCharacter.x = incomingData.x;
        existingCharacter.y = incomingData.y;
        existingCharacter.body.velocity.x = 0;
        existingCharacter.body.velocity.y = 0;
        //console.log(existingCharacter.spriteRef);
        existingCharacter.spriteRef.anims.play(incomingData.animation, true);

        if (existingCharacter.playerName != incomingData.playerName) {
          existingCharacter.playerName = incomingData.playerName;
          existingCharacter.labelRef.setText(existingCharacter.playerName);
        }
      } else if (
        !this.allPlayers[characterKey] &&
        characterKey != this.playerNumber
      ) {
        // CREATE CHARACTER
        const newCharacterData = data[characterKey];

        var style = { font: "10px Arial", fill: "#ffffff" };
        var label = this.add.text(0, -30, newCharacterData.playerName, style);
        label.setOrigin(0.5);
        var mSprite = this.add.sprite(0, 0, "dude");

        var newCharacter = this.add.container(
          newCharacterData.x,
          newCharacterData.y,
          [label, mSprite]
        );
        newCharacter.spriteRef = mSprite;
        newCharacter.labelRef = label;

        this.physics.world.enable(newCharacter);
        newCharacter.body.setBounce(0.2).setCollideWorldBounds(true);

        this.physics.add.collider(newCharacter, this.platforms);
        this.physics.add.collider(this.player, newCharacter);
        this.allPlayers[characterKey] = newCharacter;

        // var newCharacter = this.physics.add.sprite(
        //   newCharacterData.x,
        //   newCharacterData.y,
        //   "dude"
        // );
        // this.physics.add.collider(newCharacter, this.platforms);
        // this.physics.add.collider(this.player, newCharacter);
        // this.allPlayers[characterKey] = newCharacter;
      } else {
      }
    });
  }

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

    if (
      Math.round(this.player.x) != this.previousX ||
      Math.round(this.player.Y) != this.previousY
    ) {
      firebase
        .database()
        .ref("players/" + this.playerNumber)
        .set({
          playerNumber: this.playerNumber,
          playerName: this.playerName,
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          animation: this.playerSprite.anims.currentAnim.key,
        });
    }
    this.previousX = Math.round(this.player.x);
    this.previousY = Math.round(this.player.y);
  }
}

export default Game;
