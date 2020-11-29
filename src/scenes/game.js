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

var gfx;

class Game extends Phaser.Scene {
  constructor() {
    super({ key: "Game" });
    firebase.initializeApp(config);
    this.database = firebase.database();
    this.playerNumber = Math.random().toString().split(".")[1];
    this.playerName = "noname";
    this.previousX = 0;
    this.previousY = 0;
    this.isDead = false;
    this.updatePlayerPositions.bind(this.updatePlayerPositions);
    this.allPlayers = {};
  }

  preload() {
    this.load.image("sky", sky);
    this.load.image("ground", ground);
    this.load.spritesheet("dude", dude, { frameWidth: 32, frameHeight: 48 });
    //console.log(this.database);
  }

  killPlayer(playerNumber){
    firebase
        .database()
        .ref("players/" + playerNumber)
        .update({
          isDead: true
        }).then(function(){
          //console.log("saved");
        }).catch(function(error) {
          //console.log("not saved" + error);
        });;
  }

  create() {

    gfx = this.add.graphics();

    var that = this;

    this.input.keyboard.on('keydown_R', function (event) {
      console.log('Hello from the R Key!');

      //RESET GAME
      Object.keys(that.allPlayers).forEach((characterKey) => {
      
      firebase
        .database()
        .ref("players/" + characterKey)
        .update({
          isDead: false
        });

      });
    })

  

    this.input.keyboard.on('keydown_K', function (event) {

      console.log('Hello from the K Key!');
            //console.log(that)
      //if (this.player){
        var closest = that.physics.closest(that.player);

        if (closest){
          const pNumber = closest.gameObject.playerNumber;
          console.log('Kill player: ' + pNumber)
          const distance = Phaser.Math.Distance.BetweenPoints(that.player.body.position, closest.position)

          if (distance < 90){
            setTimeout(function(){ 
              that.killPlayer(pNumber);
              console.log("Kill!");
              }, 3000);

          }
          
        }else{
          console.log("no closest");
        }
      //}
    });

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
    var newCharacterData = {
      playerName: this.playerName,
      x: 100,
      y: 450,
      isDead: false,
      playerNumber: this.playerNumber
    }

    this.playerSprite = this.add.sprite(0, 0, "dude");
    this.player = this.createCharacter(newCharacterData, this.playerSprite)

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

    // set collides between Player and grounds
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.allPlayersGroup);

    var thisPlayerRef = firebase.database().ref("players/" + this.playerNumber);
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
      const name = this.getName(this.playerName, this.player.isDead)
      this.player.labelRef.setText(name);
    };
  }

  getName(name, isDead){
    return name + (isDead ? " - DEAD": "");
  }


  updatePlayerDeath(is, incoming){

    
    //console.log("update " + is.playerNumber + ": wasDead:" + is.isDead+ ": isDead:" + incoming.isDead)

    if (is.playerName != incoming.playerName
    || is.isDead != incoming.isDead
    ) {
      //console.log("RENAME!")
      var name = this.getName(incoming.playerName, incoming.isDead)
      is.labelRef.setText(name);
    }

    is.playerName = incoming.playerName;
    is.isDead = incoming.isDead;
  }


  updatePlayerPositions(data) {
    
    //Update current player (died?)
    this.updatePlayerDeath(this.player, data[this.player.playerNumber])
    
    //Unregister missing players
    Object.keys(this.allPlayers).forEach((characterKey) => {
      if (!data[characterKey]) {
        this.allPlayers[characterKey].destroy();
      }
    });

//Update each player (but not the current player.).

    Object.keys(data).forEach((characterKey) => {
      
      if (this.allPlayers[characterKey] && characterKey != this.playerNumber) {
        // UPDATE Existing CHARACTER
        
        const incomingData = data[characterKey];
        const existingCharacter = this.allPlayers[characterKey];

        //Update all existing players - name and death
        this.updatePlayerDeath(existingCharacter, incomingData)

        existingCharacter.x = incomingData.x;
        existingCharacter.y = incomingData.y;
        existingCharacter.body.velocity.x = 0;
        existingCharacter.body.velocity.y = 0;
        existingCharacter.playerNumber = characterKey;

        //console.log(existingCharacter.spriteRef);
        existingCharacter.spriteRef.anims.play(incomingData.animation, true);

      } else if (
        !this.allPlayers[characterKey] &&
        characterKey != this.playerNumber
      ) {
        // CREATE New PLAYERS
        const newCharacterData = data[characterKey];

        var mSprite = this.add.sprite(0, 0, "dude");
        var newCharacter = this.createCharacter(newCharacterData, mSprite)
        this.physics.add.collider(newCharacter, this.platforms);
        this.physics.add.collider(this.player, newCharacter);
        this.allPlayers[characterKey] = newCharacter;
      } else {

      }
    });
  }

// function createStar(x, y, vx, vy)
// {
//     // var star = stars.get();

//     // if (!star) return;

//     // star
//     //     .enableBody(true, x, y, true, true)
//     //     .setVelocity(vx, vy);
//     console.log('collide!')
// }


  createCharacter(newCharacterData, mSprite) {

      var style
      if (newCharacterData.playerNumber == this.playerNumber){
          style = { font: "16px Arial", fill: "#fff" };
      }else{
          style = { font: "16px Arial", fill: "#000" };
      }
      
      var name = this.getName(newCharacterData.playerName, newCharacterData.isDead);
      var label = this.add.text(0, -30, name, style);
      label.setOrigin(0.5);
      
      var newCharacter = this.add.container(
        newCharacterData.x,
        newCharacterData.y,
        [label, mSprite]
      );
      newCharacter.spriteRef = mSprite;
      newCharacter.labelRef = label;
      newCharacter.isDead = newCharacterData.isDead;
      newCharacter.playerNumber = newCharacterData.playerNumber;

      this.physics.world.enable(newCharacter);
      newCharacter.body.setBounce(0.2).setCollideWorldBounds(true);

      newCharacter.body.setSize(40, 55, true);
      newCharacter.setSize(40, 55, true);

      return newCharacter;
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

//Send info to Firebase and the other players.
    if (
      Math.round(this.player.x) != this.previousX ||
      Math.round(this.player.y) != this.previousY ||
      this.player.isDead != this.player.previousIsDead
    ) {
      firebase
        .database()
        .ref("players/" + this.playerNumber)
        .update({
          playerNumber: this.playerNumber,
          playerName: this.playerName,
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          animation: this.playerSprite.anims.currentAnim.key
        });
    }
    this.previousX = Math.round(this.player.x);
    this.previousY = Math.round(this.player.y);
    this.player.previousIsDead = this.player.isDead;


//DUBGGGINNG
      var pointer = this.input.activePointer;
      if (this.player){
        var closest = this.physics.closest(this.player);

        if (closest){
          gfx.clear()
            .lineStyle(2, 0xff3300)
            .lineBetween(closest.x, closest.y, pointer.x, pointer.y)
            // .lineStyle(2, 0x0099ff)
            // .lineBetween(furthest.x, furthest.y, pointer.x, pointer.y);
        }
      }

  }


  
}

export default Game;
