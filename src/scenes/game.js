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
    this.isImposter = false;
    this.updatePlayerPositions.bind(this.updatePlayerPositions);
    this.getName.bind(this.getName);
    this.allPlayers = {};
  }

  //////// preload() is a special hook, called by Phaser3 engine. ///////////
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

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


//////// create() is a special hook, called by Phaser3 engine. ///////////
  create() {

    gfx = this.add.graphics();

    var that = this;

    this.input.keyboard.on('keydown_R', function (event) {
      console.log('Hello from the R Key!');

      //RESET GAME
      var allKeys = Object.keys(that.allPlayers) 
      allKeys.push(that.playerNumber) 

      console.log(allKeys)
      allKeys.forEach((id) => {
        firebase
          .database()
          .ref("players/" + id)
          .update({
            isDead: false,
            isImposter: false
          });
      });
      
      //Set the imposter
      //Get r - a random number between 0 and numplayers-1.
      var len = allKeys.length; 
      console.log("l:" + len);
      var r = that.getRandomInt(0, (len-1))
      console.log("r:" + r)

      var playerNumber = allKeys[r];
      // var count = 1;
      // allKeys.forEach((id) => {
      //   if (count == r){
      //     playerNumber = id;
      //   }
      //   count++;
      // });
      

      //var pn = that.allPlayers[r].playerNumber;
      console.log("imposter: pn:" + playerNumber)

      firebase
        .database()
        .ref("players/" + playerNumber)
        .update({
          isImposter: true
        });

    })

  

    this.input.keyboard.on('keydown_K', function (event) {

      console.log('Hello from the K Key!');
            //console.log(that)
      //if (this.player){

        console.log("isImp: " + that.player.isImposter)
        if (that.player.isImposter == false){
          console.log("Not imposter, cannot kill")
        }else{

       
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
         }//is imposter

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
      isImposter: false,
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
      const name = this.getName(this.playerName, this.player)
      this.player.labelRef.setText(name);
    };
  }

  getName(name, p){
    //only show imposter if its the current player.
    var name2 = name + (p.isDead ? " - DEAD": "");
    if (p.playerNumber == this.playerNumber){
      name2 = name2 + (p.isImposter ? " - IMP": "") 
    }

    //name2 = name2 + (p.isImposter ? " - IMP": "") 

    return name2
  }


  updatePlayerDeath(is, incoming){

    
    //console.log("update " + is.playerNumber + ": wasDead:" + is.isDead+ ": isDead:" + incoming.isDead)

    if (is.playerName != incoming.playerName
    || is.isDead != incoming.isDead
    || is.isImposter != incoming.isImposter
    ) {
      //console.log("RENAME!")
      var name = this.getName(incoming.playerName, incoming)
      is.labelRef.setText(name);
    }

    is.playerName = incoming.playerName;
    is.isDead = incoming.isDead;
    is.isImposter = incoming.isImposter;
  }


  updatePlayerPositions(data) {
    
    //Update current player (died?)
    this.updatePlayerDeath(this.player, data[this.player.playerNumber])
    
    //Unregister missing players
    Object.keys(this.allPlayers).forEach((id) => {
      if (!data[id]) {
        this.allPlayers[id].destroy();
      }
    });

//Update each player (but not the current player.).

    Object.keys(data).forEach((id) => {
      
      if (this.allPlayers[id] && id != this.playerNumber) {
        // UPDATE Existing CHARACTER
        
        const incomingData = data[id];
        const player = this.allPlayers[id];

        //Update all existing players - name and death
        this.updatePlayerDeath(player, incomingData)

        player.x = incomingData.x;
        player.y = incomingData.y;
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.playerNumber = id;

        //console.log(player.spriteRef);
        player.spriteRef.anims.play(incomingData.animation, true);

      } else if (
        !this.allPlayers[id] && id != this.playerNumber
      ) {
        // CREATE New PLAYERS
        const newCharacterData = data[id];

        var mSprite = this.add.sprite(0, 0, "dude");
        var newCharacter = this.createCharacter(newCharacterData, mSprite)
        this.physics.add.collider(newCharacter, this.platforms);
        this.physics.add.collider(this.player, newCharacter);
        this.allPlayers[id] = newCharacter;
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
      
      var name = this.getName(newCharacterData.playerName, newCharacterData);
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
      newCharacter.isImposter = newCharacterData.isImposter;
      newCharacter.playerNumber = newCharacterData.playerNumber;

      this.physics.world.enable(newCharacter);
      newCharacter.body.setBounce(0.2).setCollideWorldBounds(true);

      newCharacter.body.setSize(40, 55, true);
      newCharacter.setSize(40, 55, true);

      return newCharacter;
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
