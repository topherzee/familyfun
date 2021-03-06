/*
NOTES:
allPlayers does not include the local player.
The local player must be always taken into account as well.
*/

const GAME_POINT_SECONDS = 2;
const SCORE_TO_WIN = 3;

const FLAG_Y = 400; //100 // 500
const IS_MULTIPLAYER = true;
const IS_IMPOSTER = false;
const HAS_BLOCKS = false;

const GAME_TYPE = "CAPTURE_THE_FLAG";
// "BASKETBALL", "CAPTURE_THE_FLAG"

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

//var gameCode = "rty";
var gameCode = "rty";

const State = {
  CLEAR: "CLEAR",
  RESET: "RESET",
  LOBBY: "LOBBY",
  PREGAME: "PREGAME",
  PLAYING: "PLAYING",
  POINT: "POINT",
  PREP_ROUND: "PREP_ROUND",
  GAMEOVER: "GAMEOVER",
};

const GAMEJOINMODE = {
  JOIN: "JOIN",
  CREATE: "CREATE",
};

const NAME_ELEMENT_ID = "playerName";
const GAMECODE_ELEMENT_ID = "gameCode";

const AUTONAME = false;
const AUTOGRAB = true;

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

var gameState = State.PLAYING;

var gfx;
var platforms = [];
var blocks = [];
var balls = [];
var spaceWasDown = false;
var goal1;
var goal2;
var flags = [];
var flag1;
var flag2;
var isTouch = false;

var grabbed = null;
var screenRef = null;
var lobbyScreenRef = null;
var isGameMaster = false;
var gameMasterID = null;

var lobbyListRef = null;

var scoreSign = [];

var buttonLeft = { isPressed: false };
var buttonRight = { isPressed: false };
var buttonUp = { isPressed: false };
var buttonGrab = { isPressed: false };

const COLOR_BUTTON = 0x000066;
const COLOR_1 = 0xff0000;
const COLOR_2 = 0x6666ff;
const COLOR_1_HEX = "#ff0000";
const COLOR_2_HEX = "#6666ff";

var TEAM = [
  { x: 50, y: 450, name: "Red Team", score: 0 },
  { x: 800, y: 450, name: "Blue Team", score: 0 },
];

const SPAWN_FLAG = [
  { x: 150, y: FLAG_Y },
  { x: 650, y: FLAG_Y },
];

class Game extends Phaser.Scene {
  constructor() {
    console.log("constructor");
    super({ key: "GameScene" });

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
    this.handleGoal.bind(this.handleGoal);
    this.resetRound.bind(this.resetRound);

    this.allPlayers = {};
  }
  preload() {
    console.log("preload");

    this.load.image("platform", "./src/assets/rock.png");

    this.load.image("sky", "./src/assets/sky.png");
    this.load.image("block", "./src/assets/block.png");
    this.load.image("ball", "./src/assets/ball-64.png");
    this.load.image("ground", "./src/assets/rock.png");
    this.load.spritesheet("dude", "./src/assets/dude-mzimm1.png", {
      frameWidth: 32,
      frameHeight: 48,
    });

    if (this.sys.game.device.os.android || this.sys.game.device.os.iOS) {
      isTouch = true;
    }
    console.log("is touch:" + isTouch);
  }

  create() {
    console.log("create");

    gfx = this.add.graphics();

    //enable multitouch.
    this.input.addPointer(3);

    this.matter.world.setBounds();
    //this.matter.world.walls.left.setFriction(0);
    this.matter.world.walls.left.friction = 0;
    //console.log(this.matter.world.walls.left);

    // add Sky background sprit
    this.add.image(400, 300, "sky");

    if (GAME_TYPE == "CAPTURE_THE_FLAG" || GAME_TYPE == "BASKETBALL") {
      var line = new Phaser.Geom.Line(400, 0, 400, 600);
      this.add
        .graphics({
          lineStyle: { width: 4, color: 0xffffff },
        })
        .strokeLineShape(line);
      line = new Phaser.Geom.Line(395, 0, 395, 600);
      this.add
        .graphics({
          lineStyle: { width: 3, color: COLOR_1 },
        })
        .strokeLineShape(line);
      line = new Phaser.Geom.Line(405, 0, 405, 600);
      this.add
        .graphics({
          lineStyle: { width: 3, color: COLOR_2 },
        })
        .strokeLineShape(line);

      var style = {
        font: "24px Arial",
        fill: "#fff",
        backgroundColor: COLOR_1_HEX,
      };
      scoreSign[0] = this.add.text(GAME_WIDTH / 2 - 40, 10, "0", style);
      style = {
        font: "24px Arial",
        fill: "#fff",
        backgroundColor: COLOR_2_HEX,
      };
      scoreSign[1] = this.add.text(GAME_WIDTH / 2 + 20, 10, "0", style);
    }

    // Create ground platforms
    this.createPlatform(400, 200, true, "platform-1");

    this.createPlatform(50, 350, true, "platform-2");
    this.createPlatform(750, 350, true, "platform-3");

    this.createPlatform(400, 490, true, "platform-4");

    // this.createPlatform(600, 400);

    // this.createPlatform(200, 600);

    //const tt = this.createPlatform(600, 220, false);
    //this.matter.add.worldConstraint(tt, 0, 1, { pointA: { x: 600, y: 220 } });

    // this.createBlock(280, 220);
    // this.createBlock(280, 260);
    // this.createBlock(280, 300);

    if (GAME_TYPE == "BASKETBALL") {
      this.createBall(0, 0);
      this.basketBallNextPoint();

      goal1 = this.createHoop(150, 500, COLOR_1);
      goal2 = this.createHoop(625, 500, COLOR_2);
    }

    if (GAME_TYPE == "CAPTURE_THE_FLAG") {
      flag1 = this.createFlag(
        1,
        "flag_1",
        SPAWN_FLAG[0].x,
        SPAWN_FLAG[0].y,
        COLOR_1
      );
      flag2 = this.createFlag(
        2,
        "flag_2",
        SPAWN_FLAG[1].x,
        SPAWN_FLAG[1].y,
        COLOR_2
      );
    }
    // this.input.on("pointerdown", function (pointer) {
    //   if (pointer.y > 300) {
    //     block.setVelocity(0, -10);
    //   } else if (pointer.x < 400) {
    //     block.setVelocityX(-8);
    //   } else {
    //     block.setVelocityX(8);
    //   }
    // });

    //Handle changing player name with input field.

    const playerID = Math.random().toString().split(".")[1].substring(0, 3);

    //Create or join game
    if (window.gameJoinMode == GAMEJOINMODE.JOIN) {
      isGameMaster = false;
      //TODO check if game is valid.
    } else if (window.gameJoinMode == GAMEJOINMODE.CREATE) {
      isGameMaster = true;
    } else {
      console.log("No valid game join mode.");
    }

    const elName = document.getElementById(NAME_ELEMENT_ID);

    var nameFromCookie = "";
    if (document.cookie) {
      var aCook = document.cookie.split("; ");

      const pair = aCook.find((row) => row.startsWith("username"));
      if (pair) {
        nameFromCookie = pair.split("=")[1];
      }
    }
    //TODO - during development easiest to have these names.
    if (AUTONAME) {
      nameFromCookie = "N-" + playerID;
    }

    elName.oninput = (event) => {
      this.playerName = event.target.value;
      const name = this.getName(this.playerName, this.player);
      this.player.labelRef.setText(name);
      this.updateLobbyList();

      document.cookie = "username=" + event.target.value;

      firebase
        .database()
        .ref(gameCode + "/players/" + this.player.id)
        .update({
          playerName: this.playerName,
        });
    };

    if (nameFromCookie) {
      elName.value = nameFromCookie;

      this.playerName = nameFromCookie;
      const name = this.getName(this.playerName, this.player);
      //this.player.labelRef.setText(name);
    }

    // // Create Player
    var team = 1;

    var playerData = {
      playerName: this.playerName,
      x: TEAM[team].x,
      y: TEAM[team].y,
      isDead: false,
      isImposter: false,
      isGameMaster: isGameMaster,
      team: 1,
      id: playerID,
    };
    this.player = {};
    this.player.id = playerData.id;

    this.playerSprite = this.add.sprite(0, 0, "dude");
    this.player = this.createPlayer(playerData, this.playerSprite, true);

    if (window.gameJoinMode == GAMEJOINMODE.JOIN) {
      gameCode = document.getElementById("joinGameCode").value.toLowerCase();
      console.log("JOIN GAME:" + gameCode);
      isGameMaster = false;
      //TODO check if game is valid.
    } else if (window.gameJoinMode == GAMEJOINMODE.CREATE) {
      gameCode = this.makeid(3);
      console.log("CREATE NEW GAME:" + gameCode);
      isGameMaster = true;
      this.fullReset(this);
    } else {
      console.log("No valid game join mode.");
    }

    //Push player to firebase
    this.pushThisPlayerToFirebase();

    const codeEl = document.getElementById(GAMECODE_ELEMENT_ID);
    codeEl.innerText = gameCode;

    // this.player.setOnCollide(function (collisionData) {
    //   console.log("player collided.");
    //   var that = this;
    //   this.handlePlayerCollide(collisionData, that);
    // });

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

    var thisPlayerRef = firebase
      .database()
      .ref(gameCode + "/players/" + this.player.id);
    thisPlayerRef.onDisconnect().set({});

    //Handle player events from Firebase.
    var playersRef = firebase.database().ref(gameCode + "/players");
    playersRef.on("value", (snapshot) => {
      this.updatePlayers(snapshot.val());
    });

    //Handle object events from Firebase.
    var objectsRef = firebase.database().ref(gameCode + "/objects/ball");
    objectsRef.on("value", (snapshot) => {
      this.updateBall(snapshot.val());
    });

    var objectsRef = firebase.database().ref(gameCode + "/objects/flag_1");
    objectsRef.on("value", (snapshot) => {
      this.updateFlag("flag_1", snapshot.val());
    });

    var objectsRef = firebase.database().ref(gameCode + "/objects/flag_2");
    objectsRef.on("value", (snapshot) => {
      this.updateFlag("flag_2", snapshot.val());
    });

    //Handle 'meta' events from Firebase.
    var metaRef = firebase.database().ref(gameCode + "/meta");
    metaRef.on("value", (snapshot) => {
      this.updateMeta(snapshot.val());
    });

    var that = this;

    this.input.keyboard.on("keydown_UP", function (event) {
      if (that.keyboardOK(event)) {
        console.log("Hello from the UP Key!");
        that.actionUp();
      }
    });

    this.input.keyboard.on("keydown_SPACE", function (event) {
      if (that.keyboardOK(event)) {
        console.log("Hello from the SPACE DOWN Key!");
        that.actionGrab();
      }
    });
    this.input.keyboard.on("keyup_SPACE", function (event) {
      if (that.keyboardOK(event)) {
        console.log("Hello from the SPACE UP Key!");
        that.actionThrow();
      }
    });

    this.input.keyboard.on("keydown_R", function (event) {
      if (that.keyboardOK(event)) {
        console.log("Hello from the R Key!");
        that.resetGame(that);
      }
    });

    this.input.keyboard.on("keydown_T", function (event) {
      if (that.keyboardOK(event)) {
        console.log("Hello from the T Key!");

        that.fullReset(that);
      }
    });

    this.input.keyboard.on("keydown_Q", function (event) {
      if (that.keyboardOK(event)) {
        console.log("Hello from the Q Key!");

        that.changeTeam(that);
      }
    });

    if (IS_IMPOSTER) {
      this.input.keyboard.on("keydown_K", function (event) {
        if (that.keyboardOK(event)) {
          console.log("Hello from the K Key!");

          that.killPlayer(that);
        }
      });
    }

    //Could be better in future: https://github.com/dxu/matter-collision-events
    this.matter.world.on("collisionactive", function (event, bodyA, bodyB) {
      //that.checkForScoreCollision(event, that);

      that.handleCollisions(event, that, bodyA, bodyB);
      //bodyA.gameObject.setTint(0xff0000);
      //bodyB.gameObject.setTint(0x00ff00);
    });
    this.matter.world.on("collisionstart", function (event, bodyA, bodyB) {
      that.handleCollisions(event, that, bodyA, bodyB);
    });

    //virtual buttons
    //touch events.
    const BUTTON_ALPHA = 0.2;
    buttonRight = this.add
      .circle(700, 500, 80, COLOR_BUTTON)
      .setAlpha(BUTTON_ALPHA)
      .setInteractive();
    buttonRight.id = "right";
    buttonRight.isPressed = false;

    buttonLeft = this.add
      .circle(500, 500, 80, COLOR_BUTTON)
      .setAlpha(BUTTON_ALPHA)
      .setInteractive();
    buttonLeft.id = "left";
    buttonLeft.isPressed = false;

    buttonUp = this.add
      .circle(600, 370, 80, COLOR_BUTTON)
      .setAlpha(BUTTON_ALPHA)
      .setInteractive();
    buttonUp.id = "up";
    buttonUp.isPressed = false;

    buttonGrab = this.add
      .circle(100, 500, 80, COLOR_BUTTON)
      .setAlpha(BUTTON_ALPHA)
      .setInteractive();
    buttonGrab.id = "grab";
    buttonGrab.isPressed = false;

    let lastTime = 0;

    this.input.on("gameobjectdown", (pointer, gameObject) => {
      console.log(gameObject.id);

      let clickDelay = this.time.now - lastTime;
      lastTime = this.time.now;

      if (gameObject.id == "win-screen") {
        if (!isGameMaster) {
          console.log("Gamemaster must click start - not you!");
        } else {
          console.log("OK Gamemaster, Start new game!");
          console.log(that);
          //console.log(gameObject);
          //TODO add timeout.
          gameObject.destroy();
          that.resetGame(that);
        }

        return;
      }

      if (gameObject.id == "lobby-screen") {
        console.log("Lobby Click!");
        if (isGameMaster) {
          console.log("I hear you GameMaster. Reset!");
          gameObject.destroy();
          that.resetGame(that);
        }
        // console.log(that);
        // //console.log(gameObject);
        // //TODO add timeout.
        // gameObject.destroy();
        // that.resetGame(that);
        //}

        return;
      }

      if (gameState != State.PLAYING) return;

      //console.log(gameObject);

      gameObject.setFillStyle(0x0000ff);
      gameObject.isPressed = true;
      if (gameObject.id == "up") {
        that.actionUp();
      } else if (gameObject.id == "grab") {
        that.actionGrab();
      }

      //Also treat double taps as a jump!
      if (clickDelay < 350) {
        that.actionUp();
      }
    });

    this.input.on("gameobjectup", function (pointer, gameObject) {
      if (gameObject.id == "win-screen") {
        return;
      }
      if (gameObject.id == "lobby-screen") {
        return;
      }
      if (gameState != State.PLAYING) return;
      console.log(gameObject.id + " up");
      gameObject.setFillStyle(COLOR_BUTTON);
      gameObject.isPressed = false;
      if (gameObject.id == "grab") {
        that.actionThrow();
      }
    });

    //Testing this.endRound(1);
    //this.showWinScreen(1);
    this.createLobby();
    this.updateLobbyList();
    gameState = State.LOBBY;

    if (window.DEV_AUTOSTART) {
      //gameObject.destroy();
      //TODO get rid of the lobby screen.
      lobbyScreenRef && lobbyScreenRef.destroy();
      this.resetGame(this);
    }
  }

  pushThisPlayerToFirebase() {
    console.log(
      "pushThisPlayerToFirebase() " + gameCode + "/players/" + this.player.id
    );
    firebase
      .database()
      .ref(gameCode + "/players/" + this.player.id)
      .set({
        id: this.player.id,
        team: this.player.team,
        playerName: this.playerName,
        isGameMaster: isGameMaster,
      });
  }

  updateLobbyList() {
    if (lobbyListRef) {
      var list = "Players:\n";
      list =
        list +
        this.player.playerName +
        (this.player.id == gameMasterID ? " (GM)" : "") +
        "\n";

      var that = this;
      Object.keys(that.allPlayers).forEach((id) => {
        if (that.allPlayers[id] && id != that.player.id) {
          var pName = that.allPlayers[id].playerName;
          list = list + pName + (id == gameMasterID ? " (GM)" : "") + "\n";
        }
      });
      //console.log("lobby: " + list);
      //console.log("all:");
      //console.log(that.allPlayers);
      lobbyListRef.setText(list);
    }
  }

  createLobby(headline) {
    lobbyScreenRef && lobbyScreenRef.destroy();
    var msg1 = headline ? headline : "Lobby";
    var msg2 = "-";
    var msg3 = "-";
    var backColor = 0xffffff;
    var borderColor = 0xffff99;
    var board = this.add.rectangle(0, 0, 500, 400, backColor);
    board.setStrokeStyle(4, borderColor);
    //board.setInteractive();
    //board.id = "lobby-screen";

    var style;

    style = { font: "32px Arial", fill: "#000" };

    var label1 = this.add.text(0, -150, msg1, style);
    label1.setOrigin(0.5);

    style = { font: "20px Arial", fill: "#444" };

    if (isGameMaster) {
      msg2 =
        "You are the Gamemaster. \nGive people the game code:   " + gameCode;
    } else {
      msg2 = "Waiting for Gamemaster to start the game.";
    }
    var label2 = this.add.text(0, -100, msg2, style);
    label2.setOrigin(0.5);

    style = { font: "18px Arial", fill: "#666" };
    var label3 = this.add.text(0, -50, msg3, style);
    label3.setOrigin(0.5, 0);

    var msg4 = "";
    style = { font: "20px Arial", fill: "#444" };
    if (isGameMaster) {
      msg4 = "Once everyone has joined, click to start the game.";
    }
    var label4 = this.add.text(0, 150, msg4, style);
    label4.setOrigin(0.5, 0);

    var group = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [
      board,
      label1,
      label2,
      label3,
      label4,
    ]);

    group.label3 = label3;
    group.setSize(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    group.setInteractive();
    group.id = "lobby-screen";
    lobbyListRef = label3;

    lobbyScreenRef = group; //so we can destroy it.

    return group;
  }

  //a full reset was called. wipe the players.
  clearThisClient() {
    console.log("clearThisClient()");

    Object.keys(this.allPlayers).forEach((id) => {
      //this.allPlayers[id].body.destroy();
      //this.matter.world.remove(this.allPlayers[id].body);
      this.allPlayers[id].destroy();
    });
    this.allPlayers = {};

    this.updateLobbyList();
    this.pushThisPlayerToFirebase();
  }

  //////// update() is a special hook, called by Phaser3 engine. ///////////

  update() {
    //console.log("left:" + (cursorLeftButton && cursorLeftButton.isPressed));
    //console.log("right:" + (cursorRightButton && cursorRightButton.isPressed));

    //console.log("update() gameState=" + gameState);
    // Create movement controller
    if (gameState != State.PLAYING) {
      return;
    }

    this.cursors = this.input.keyboard.createCursorKeys();

    if (this.cursors.left.isDown || (isTouch && buttonLeft.isPressed)) {
      this.player.setVelocityX(-2);
      this.playerSprite.anims.play("left", true);
    } else if (
      this.cursors.right.isDown ||
      (isTouch && buttonRight.isPressed)
    ) {
      this.player.setVelocityX(2);
      this.playerSprite.anims.play("right", true);
    } else {
      //this.player.setVelocityX(0);
      this.playerSprite.anims.play("turn");
    }

    //Send info to Firebase and the other players.
    //If there is a change...

    if (grabbed) {
      this.matter.body.setPosition(grabbed, {
        x: this.player.body.position.x,
        y: this.player.body.position.y - 60,
      });

      if (GAME_TYPE == "CAPTURE_THE_FLAG") {
        var fieldSide = Math.round(this.player.x / GAME_WIDTH) + 1;
        if (fieldSide == this.player.team) {
          console.log("got the flag to my side!");
          this.endRound(this.player.team);
        }
      }
    }

    //for efficiencies sake - only send to db when player has moved a significant amount.
    const THRESHOLD = 2.1;
    const dx = Math.abs(this.player.x - this.previousX);
    const dy = Math.abs(this.player.y - this.previousY);
    //console.log("dx:" + dx + " dy:" + dy);

    if (
      dx > THRESHOLD ||
      dy > THRESHOLD ||
      this.player.isDead != this.player.previousIsDead ||
      this.player.team != this.player.previousTeam ||
      this.playerSprite.anims.currentAnim.key != this.player.previousAnimation
    ) {
      //this.previousX = Math.round(this.player.x);
      //this.previousY = Math.round(this.player.y);
      this.previousX = this.player.x;
      this.previousY = this.player.y;

      //console.log("write player change to firebase.");

      // Write player to firebase! NOTE. Send info
      //console.log("send animation:" + this.playerSprite.anims.currentAnim.key);
      firebase
        .database()
        .ref(gameCode + "/players/" + this.player.id)
        .update({
          id: this.player.id,
          team: this.player.team,
          playerName: this.playerName,
          x: this.player.x,
          y: this.player.y,
          xVel: this.player.body.velocity.x,
          yVel: this.player.body.velocity.y,
          angle: Math.round(this.player.angle),
          animation: this.playerSprite.anims.currentAnim.key,
        });

      if (grabbed) {
        if (GAME_TYPE == "CAPTURE_THE_FLAG") {
          //this.sendFlag(grabbed.gameObject);
          const flag = grabbed.gameObject;
          firebase
            .database()
            .ref(gameCode + "/objects/" + flag.id)
            .update({
              x: Math.round(flag.x),
              y: Math.round(flag.y),
            });
        }
      }
    }

    this.player.previousIsDead = this.player.isDead;
    this.player.previousTeam = this.player.team;
    this.player.previousAnimation = this.playerSprite.anims.currentAnim.key;
    //console.log("anim:" + this.playerSprite.anims.currentAnim.key);
  }

  updateScores() {
    scoreSign[0].text = TEAM[0].score;
    scoreSign[1].text = TEAM[1].score;
  }

  showPointScreen(team) {
    console.log("showPointScreen()");
    var msg1 = TEAM[team - 1].name + " scored!";
    var msg2 = "Next round starts soon";
    var msg3 = "-";
    var backColor = 0xffffff;
    var borderColor = 0x666666;
    return this.showScreen(
      team,
      msg1,
      msg2,
      msg3,
      backColor,
      borderColor,
      true
    );
  }

  // showWinScreen(team) {
  //   console.log("showWinScreen()");
  //   var msg1 = TEAM[team - 1].name + "  WINS!";
  //   var msg2;
  //   if (isGameMaster) {
  //     msg2 = "Gamemaster, click to start new game.";
  //   } else {
  //     msg2 = "Waiting for Gamemaster to start new game.";
  //   }
  //   var msg3 = "";
  //   var backColor = 0xffffff;
  //   var borderColor = 0xffff99;
  //   var screen = this.showScreen(
  //     team,
  //     msg1,
  //     msg2,
  //     msg3,
  //     backColor,
  //     borderColor,
  //     false
  //   );

  //   //handle clicks.
  //   screen.setInteractive();
  //   screen.id = "win-screen";

  //   return screen;
  // }

  showScreen(team, msg1, msg2, msg3, backColor, borderColor, isCountdown) {
    var board = this.add.rectangle(0, 0, 500, 200, backColor);
    board.setStrokeStyle(4, borderColor);
    //board.setInteractive();
    board.id = "screen";

    var style;

    style = { font: "32px Arial", fill: "#000" };

    var label1 = this.add.text(0, -30, msg1, style);
    label1.setOrigin(0.5);

    style = { font: "24px Arial", fill: "#666" };

    var label2 = this.add.text(0, 10, msg2, style);
    label2.setOrigin(0.5);
    var label3 = this.add.text(0, 20, msg3, style);
    label3.setOrigin(0.5);

    var group = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [
      board,
      label1,
      label2,
      label3,
    ]);

    //This does the countdown.
    var intervalRef;
    var seconds = GAME_POINT_SECONDS;
    if (isCountdown) {
      intervalRef = setInterval(function () {
        label2.text = "Next round starts in " + seconds + ".";
        seconds--;
      }, 1000);
    }

    group.intervalRef = intervalRef;
    group.label3 = label3;
    group.setSize(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    group.setInteractive();
    screenRef = group;
    return group;
  }

  endRound(team) {
    if (gameState != State.PLAYING) {
      return;
    }
    console.log("endRound");

    grabbed = null;

    //Things that only the point maker should run.
    TEAM[team - 1].score++;

    if (TEAM[team - 1].score >= SCORE_TO_WIN) {
      gameState = State.GAMEOVER;
    } else {
      gameState = State.POINT;
    }

    //this.updateScores();
    firebase
      .database()
      .ref(gameCode + "/meta/")
      .update({
        scores: [TEAM[0].score, TEAM[1].score],
        teamThatScored: team,
        gameState: gameState,
      });

    // Block all input.
    // gameState = State.PREP_ROUND;
    // firebase
    //   .database()
    //   .ref(gameCode + "/meta/")
    //   .set({
    //     gameState: State.PREP_ROUND,
    //   });

    if (gameState == State.POINT) {
      setTimeout(() => {
        this.resetRound(this);
      }, 1000 * (GAME_POINT_SECONDS + 0.5));
    }

    //TRY GETTING RID OF THIS - And merge the firebase update with the next one.
    // endRoundEveryone / this.resetRound.
    //this.resetRound(this);
  }

  //Things that all devices must do.
  endRoundEveryone(team) {
    const score = TEAM[team - 1].score;
    console.log("endRoundEveryone() SCORE:" + score);
    var screen;
    grabbed = null;
    this.playerSprite.anims.play("turn"); //stop running.
    //WORKING
    buttonLeft.isPressed = false;
    buttonRight.isPressed = false;
    buttonUp.isPressed = false;
    buttonGrab.isPressed = false;

    var that = this;

    if (score >= SCORE_TO_WIN) {
      //screen = this.showWinScreen(team);

      this.createLobby(TEAM[team - 1].name + " WINS!");
      this.updateLobbyList();
      gameState = State.LOBBY;
    } else {
      screen = this.showPointScreen(team);

      setTimeout(function () {
        clearInterval(screen.intervalRef);
        screen.destroy();
      }, GAME_POINT_SECONDS * 1000);
    }
  }

  actionLeft(that) {}
  actionRight(that) {}
  actionUp() {
    var intersects = this.matter.intersectBody(this.player.jumpSensor);
    if (intersects.length > 1) {
      this.player.setVelocityY(-8);
    }
  }

  actionGrab() {
    console.log("actionGrab");
    spaceWasDown = true;
    if (grabbed) {
      return; //Already have something grabbed.
    }

    //blocks
    if (HAS_BLOCKS) {
      var aInt = this.matter.intersectBody(this.player.body, blocks);
      if (aInt.length > 0) {
        this.matter.body.setPosition(aInt[0], {
          x: this.player.body.position.x,
          y: this.player.body.position.y - 20,
        });
      }
    }

    if (GAME_TYPE == "BASKETBALL") {
      //ball
      var aInt = this.matter.intersectBody(this.player.body, balls[0]);
      if (aInt.length > 0) {
        this.matter.body.setPosition(aInt[0], {
          x: this.player.body.position.x,
          y: this.player.body.position.y - 20,
        });

        this.sendBall(balls[0]);
      }
    }

    if (GAME_TYPE == "CAPTURE_THE_FLAG") {
      //flag
      var aInt = this.matter.intersectBody(this.player.body, flags);
      console.log("actionGrab flag length: " + aInt.length);
      if (aInt.length > 0) {
        // console.log(
        //   "teams: flag:" + aInt[0].gameObject.team + " mine:" + this.player.team
        // );
        //can only grab other teams flag.
        if (aInt[0].gameObject.team != this.player.team) {
          grabbed = aInt[0];
          console.log("actionGrab flag grabbed");
        }
      }
    }
  }

  actionThrow() {
    if (spaceWasDown) {
      spaceWasDown = false;

      //blocks
      var intersects = this.matter.intersectBody(this.player.body, blocks);
      if (intersects.length > 0) {
        this.matter.body.setVelocity(intersects[0], {
          x: this.player.body.velocity.x * 2,
          y: -8,
        });
      }

      if (GAME_TYPE == "BASKETBALL") {
        //ball
        var intersects = this.matter.intersectBody(this.player.body, balls[0]);
        if (intersects.length > 0) {
          const newXVel = this.player.body.velocity.x * 2;
          const newYVel = -8;
          this.matter.body.setVelocity(intersects[0], {
            x: newXVel,
            y: newYVel,
          });
          this.sendBall(balls[0]); //, null, null, newXVel, newYVel);
        }
      }

      if (GAME_TYPE == "CAPTURE_THE_FLAG") {
        //flag - put it down.
        if (grabbed) {
          this.matter.body.setPosition(grabbed, {
            x: this.player.body.position.x,
            y: this.player.body.position.y,
          });
          this.sendFlag(grabbed.gameObject);
        }
        grabbed = null;
      }
    }
  }

  keyboardOK(event) {
    const elName = document.getElementById(NAME_ELEMENT_ID);
    return elName != document.activeElement;
  }

  handleCollisions(event, that, bodyA, bodyB) {
    //console.log("handleCollisions");

    if (that.player) {
      //console.log("c! " + bodyA.label + " - " + bodyB.label);
      //console.log(that.player.body.label);
      if (bodyA.gameObject == that.player || bodyB.gameObject == that.player) {
        //console.log("active player collide!");

        const collidedBody = bodyA.gameObject == that.player ? bodyB : bodyA;

        if (GAME_TYPE == "BASKETBALL") {
          const ball = balls[0];
          if (collidedBody == ball.body) {
            //console.log("collide ball!");
            that.sendBall(ball);
          }
        }

        if (GAME_TYPE == "CAPTURE_THE_FLAG") {
          //console.log("playerCollided");

          //See if they collided with another player.

          //const collidedBody = c.bodyA == that.player.body ? c.bodyB : c.bodyA;
          const collided = collidedBody.gameObject;
          //console.log("with:" + collidedBody.label);
          if (collided && collided.type && collided.type == "PLAYER") {
            //console.log("collided with another player");

            var fieldSide = Math.round(that.player.x / GAME_WIDTH) + 1;
            if (fieldSide != that.player.team) {
              // var allKeys = Object.keys(that.allPlayers);
              if (collided.team != that.player.team) {
                // Send the player back to starting point.
                that.player.x = TEAM[that.player.team - 1].x;
                that.player.y = TEAM[that.player.team - 1].y;
                grabbed = null;
              }
            }
          } else if (
            AUTOGRAB &&
            collided &&
            collided.type &&
            collided.type == "FLAG"
          ) {
            console.log("bumped into flag:" + collided);
            if (collided.team != this.player.team) {
              grabbed = collided.body;
              console.log("flag grabbed");
            }
          }
        }
      }
    }
  }

  handlePlayerCollide(c, that) {
    console.log("playerCollided");

    const collidedBody = c.bodyA == that.player.body ? c.bodyB : c.bodyA;
    const collided = collidedBody.gameObject;

    if (collided.id) {
      var allKeys = Object.keys(data);
      if (allKeys.includes(collided)) {
        that.player.x = TEAM[0].x;
        that.player.y = TEAM[0].y;
      }
    }
  }

  checkBallForScore(c, that) {
    const ball = balls[0];

    if (c.bodyA == ball.body || c.bodyB == ball.body) {
      console.log("ball collision");
      const collidedBody = c.bodyA == ball.body ? c.bodyB : c.bodyA;
      if (collidedBody == goal1.body) {
        //console.log("goal 1");
        that.handleGoal(1, goal1);
      }
      if (collidedBody == goal2.body) {
        //console.log("goal 2");
        that.handleGoal(2, goal2);
      }
    }
  }

  handleGoal(id, goal) {
    console.log("handleGoal:" + id);

    balls[0].x = goal.x;
    balls[0].y = goal.y - 80;
    this.matter.body.setStatic(balls[0].body, true);
  }
  basketBallNextPoint() {
    console.log("basketBallNextPoint:");

    balls[0].x = 800 / 2;
    balls[0].y = 300;
    this.matter.body.setStatic(balls[0].body, false);

    this.sendBall(balls[0]);
  }

  sendBall(ball) {
    console.log("sendBall");
    if (gameState != State.PLAYING) return;
    firebase
      .database()
      .ref(gameCode + "/objects/" + ball.id)
      .update({
        id: ball.id,

        x: Math.round(ball.x),
        y: Math.round(ball.y),
        angle: Math.round(ball.angle),
        xVel: ball.body.velocity.x,
        yVel: ball.body.velocity.y,
      });
  }

  // GAME OBJECT
  sendFlag(flag) {
    //if (gameState != State.PLAYING) return;
    //console.log(flag);
    console.log("sendFlag: " + flag.id);
    firebase
      .database()
      .ref(gameCode + "/objects/" + flag.id)
      .update({
        x: Math.round(flag.x),
        y: Math.round(flag.y),
      });
  }

  createHoop(x, y, color) {
    console.log("create hoop");

    const WIDTH = 100;
    var r1 = this.add.rectangle(x, y, 10, 60, color);
    r1.setStrokeStyle(4, color);
    this.matter.add.gameObject(r1, {
      isStatic: true,
    });
    r1.setFriction(0.0);

    var r2 = this.add.rectangle(x + WIDTH, y, 10, 60, color);
    r2.setStrokeStyle(4, color);
    this.matter.add.gameObject(r2, {
      isStatic: true,
    });
    r2.setFriction(0.0);

    var r3 = this.add.rectangle(x + WIDTH / 2, y + 30, WIDTH, 10, color);
    r3.setStrokeStyle(4, color);
    this.matter.add.gameObject(r3, {
      isStatic: true,
    });

    var rGoal = this.add.rectangle(x + WIDTH / 2, y + 20, WIDTH, 10, 0xff99ff);

    var goal = this.matter.add.gameObject(rGoal, {
      isStatic: true,
    });
    rGoal.id = "goalo";
    return rGoal;

    // var Bodies = Phaser.Physics.Matter.Matter.Bodies;
    // var hoopSensor = Bodies.circle(-70, 0, 24, { isSensor: true, label: 'hoop-goal' });

    // var rect = Bodies.rectangle(x + WIDTH / 2, y + 20, WIDTH, 10);

    // var compoundBody = Phaser.Physics.Matter.Matter.Body.create({
    //   parts: [ rect, hoopSensor ],
    //   inertia: Infinity
  }

  createFlag(team, id, x, y, color) {
    console.log("create flag");

    const WIDTH = 100;

    var flagVerts = "0 0 30 15 10 30 10 50 0 50 0 0";

    var flag = this.add.polygon(x, y, flagVerts, color, 1.0);
    flag.id = id;
    flag.team = team;
    flag.type = "FLAG";
    // this.matter.add.gameObject(flag, {
    //   shape: { type: "fromVerts", verts: flagVerts, flagInternal: true },
    // });

    this.matter.add.gameObject(flag, {
      isStatic: true,
    });

    this.matter.body.setMass(flag, 0);
    this.matter.body.setInertia(flag, 0);

    // flag.setVelocity(0, 3);
    // flag.setAngularVelocity(0.01);
    // flag.setBounce(1);
    // flag.setFriction(0, 0, 0);

    flags.push(flag);
    return flag;
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

    var that = this;
    ball.setOnCollide(function (collisionData) {
      that.checkBallForScore(collisionData, that);
    });
    balls.push(ball);
  }

  createPlatform(x, y, isStaticD, label) {
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
    p.body.label = label;

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

    // var newPlayer = this.matter.add.gameObject(group, {
    //   shape: { type: "polygon", sides: 4, radius: 30 },
    // });
    var newPlayer = this.matter.add.gameObject(group, {
      render: { gameObject: { xOffset: 0, yOffset: 100 } },
    });

    //player = this.matter.add.image(0, 0, 'block');

    //var newPlayer = mSprite;
    var Bodies = Phaser.Physics.Matter.Matter.Bodies;
    var rect = Bodies.rectangle(0, 0, 40, 40);
    rect.label = "player-rect";
    var jumpSensor = Bodies.rectangle(0, 30, 38, 10, {
      isSensor: true,
      label: "jump-sensor",
    });
    //hack to get the vertical offset of the body right
    var headSensor = Bodies.rectangle(0, -55, 38, 10, {
      isSensor: true,
      label: "head-sensor",
    });

    var compoundBody = Phaser.Physics.Matter.Matter.Body.create({
      parts: [rect, jumpSensor, headSensor],
      inertia: Infinity,
    });

    newPlayer.setExistingBody(compoundBody);
    newPlayer.body.label = "a player";

    newPlayer
      // .setFrictionAir(0.01)
      // .setFriction(0.0)
      // // .setFrictionStatic(0)
      .setBounce(0.0);
    // .setFixedRotation();

    //newPlayer.setPosition(400, 300);
    //newPlayer.body.setOffset(0, -200);

    //   var triangle = this.matter.add.sprite(400, 100, 'triangle', null, {
    //     shape: { type: 'fromVerts', verts: shapes.triangle },
    //     render: { sprite: { xOffset: 0.30, yOffset: 0.15 } }
    // });

    newPlayer.spriteRef = mSprite;
    newPlayer.labelRef = label;
    newPlayer.isDead = playerData.isDead;
    newPlayer.isImposter = playerData.isImposter;
    newPlayer.team = playerData.team;
    newPlayer.id = playerData.id;
    newPlayer.jumpSensor = jumpSensor;
    newPlayer.type = "PLAYER";
    newPlayer.playerName = name;
    newPlayer.isGameMaster = playerData.isGameMaster;

    return newPlayer;
  }

  getName(name, p) {
    var name2 = name;

    if (p) {
      if (IS_IMPOSTER) {
        //only show imposter if its the current player.
        var name2 = name + (p.isDead ? " - DEAD" : "");
        if (p.id == this.player.id) {
          name2 = name2 + (p.isImposter ? " - IMPOSTER" : "");
        }
      }
      name2 += " - " + p.team;
    }

    return name2;
  }

  resetGame(that) {
    console.log("resetGame()");

    if (that.player.id != gameMasterID) {
      console.log("Must be GameMaser to start a round!");
      return;
    }

    if (GAME_TYPE == "CAPTURE_THE_FLAG") {
      gameState = State.PREP_ROUND;
      isGameMaster = true;

      firebase
        .database()
        .ref(gameCode + "/meta/")
        .set({
          scores: [0, 0],
          gameMaster: this.player.id,
          gameState: State.PREP_ROUND,
          teamThatScored: -1,
        });

      setTimeout(function () {
        // Assign teams
        var team = 1;
        that.player.team = team;

        Object.keys(that.allPlayers).forEach((id) => {
          if (that.allPlayers[id] && id != that.player.id) {
            // set team for players - alternating.
            const player = that.allPlayers[id];
            team = team == 1 ? 2 : 1;
            that.allPlayers[id].team = team;
            that.updatePlayerLabel(player.playerName, player.labelRef, player);

            console.log("resetGame. set team:" + player.id + "- " + team);
          }
        });

        that.resetRound(that);
      }, 1000);
    }
  }

  // Bring everyone back to life.
  // Set a random player as the imposter.
  // Set positions based on teams.
  resetRound(that) {
    //RESET GAME
    console.log("resetRound (" + that.player.id + ")");

    var team;
    if (GAME_TYPE == "BASKETBALL") {
      this.basketBallNextPoint();
      const ball = balls[0];
      ball.x = 280;
      ball.y = 220;
      ball.body.velocity.x = 0;
      ball.body.velocity.y = 0;

      that.sendBall(ball);
    }

    if (GAME_TYPE == "CAPTURE_THE_FLAG") {
      grabbed = null;

      flag1.x = SPAWN_FLAG[0].x;
      flag1.y = SPAWN_FLAG[0].y;

      flag2.x = SPAWN_FLAG[1].x;
      flag2.y = SPAWN_FLAG[1].y;

      this.sendFlag(flag1);
      this.sendFlag(flag2);

      team = this.player.team;

      // Set current player.
      this.player.x = TEAM[team - 1].x;
      this.player.y = TEAM[team - 1].y;
      this.player.setVelocityX(0);
      this.player.setVelocityY(0);

      // Object.keys(this.allPlayers).forEach((id) => {
      //   console.log("block:" + id);
      //   if (this.allPlayers[id] && id != this.player.id) {
      //     //BLOCK INPUT in order for the position setting not to get
      //     //clobbered by parallel input from the others.
      //     const player = this.allPlayers[id];
      //     firebase
      //       .database()
      //       .ref(gameCode + "/players/" + player.id)
      //       .update({
      //         blockInput: true,
      //       });
      //   }
      // });

      // Block all input.
      // gameState = State.PREP_ROUND;
      // firebase.database().ref(gameCode + "/meta/").set({
      //   gameState: State.PREP_ROUND,
      // });

      var that = this;

      Object.keys(that.allPlayers).forEach((id) => {
        const player = that.allPlayers[id];
        console.log(
          "resetRound Check player:" + player.id + " team:" + player.team
        );
      });

      // setTimeout(function () {
      const INDENT = 60;
      var count = 1;
      var x;

      Object.keys(that.allPlayers).forEach((id) => {
        if (that.allPlayers[id] && id != that.player.id) {
          // set position based on team.
          const player = that.allPlayers[id];

          count += 1;
          var indent;
          if (player.team == 1) {
            indent = INDENT * (count / 2);
          } else {
            indent = -INDENT * (count / 2);
          }
          var newX = TEAM[player.team - 1].x + indent;

          console.log(
            "p:" +
              player.id +
              " team:" +
              player.team +
              " indent:" +
              indent +
              " x:" +
              newX
          );
          //console.log("resetRound for p:" + player.id);
          //write to DB:
          firebase
            .database()
            .ref(gameCode + "/players/" + player.id)
            .update({
              team: player.team,
              x: newX,
              y: TEAM[player.team - 1].y,
              xVel: 0,
              yVel: 0,
              angle: 0,
              forceExceptionalUpdate: true,
            });
        }
      });

      this.startRound();

      // }, 1000);

      // Spawn players
    }

    if (IS_IMPOSTER) {
      //Clear imposter and death.
      var allKeys = Object.keys(that.allPlayers);
      allKeys.push(that.player.id);

      console.log(allKeys);
      allKeys.forEach((id) => {
        firebase
          .database()
          .ref(gameCode + "/players/" + id)
          .update({
            isDead: false,
            isImposter: false,
          });
      });

      //Set the imposter

      //Get r - a random number between 0 and numplayers-1.
      var len = allKeys.length;
      var r = that.getRandomInt(0, len - 1);
      var id = allKeys[r];

      console.log("imposter: pn:" + id);

      firebase
        .database()
        .ref(gameCode + "/players/" + id)
        .update({
          isImposter: true,
        });
    }

    //gameState = State.PLAYING;
  }

  startRound() {
    console.log("startRound()");
    firebase
      .database()
      .ref(gameCode + "/meta/")
      .update({
        gameState: State.PLAYING,
      });
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
      .ref(gameCode + "/players/" + id)
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

  changeTeam() {
    if (this.player.team == 1) {
      this.player.team = 2;
    } else {
      this.player.team = 1;
    }
    firebase
      .database()
      .ref(gameCode + "/players/" + this.player.id)
      .update({
        team: this.player.team,
      })
      .then(function () {
        //console.log("saved");
      })
      .catch(function (error) {
        //console.log("not saved" + error);
      });

    const name = this.getName(this.playerName, this.player);
    this.player.labelRef.setText(name);
    this.player.labelRef.style.setBackgroundColor(
      this.player.team == 1 ? COLOR_1_HEX : COLOR_2_HEX
    );
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

  // removeAllPlayers(that) {
  //   console.log("removeAllPlayers()");

  //   firebase
  //     .database()
  //     .ref(gameCode + "/players/")
  //     .set({})
  //     .then(function () {})
  //     .catch(function (error) {});

  //   firebase
  //     .database()
  //     .ref(gameCode + "/objects/")
  //     .set({})
  //     .then(function () {})
  //     .catch(function (error) {});
  // }

  //wipe out all players and ensure that they wipe out their game state.
  fullReset(that) {
    console.log("fullReset()");

    //broadcast to all playes.
    firebase
      .database()
      .ref(gameCode)
      .set({
        meta: {
          gameState: State.LOBBY,
          gameMaster: this.player.id,
          scores: [0, 0],
        },
      })
      .then(function () {})
      .catch(function (error) {});

    //clear out other players!
    // firebase
    //   .database()
    //   .ref(gameCode)
    //   .set({
    //     meta: {
    //       gameState: State.RESET,
    //       gameMaster: this.player.id,
    //       scores: [0, 0],
    //     },
    //   })
    //   .then(function () {})
    //   .catch(function (error) {});

    // firebase
    //   .database()
    //   .ref(gameCode + "/meta/")
    //   .set({
    //     gameState: gameState,
    //   }).then(function () {})
    //   .catch(function (error) {});

    // firebase
    //   .database()
    //   .ref(gameCode)
    //   .set({})
    //   .then(function () {})
    //   .catch(function (error) {});
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  updatePlayerLabel(playerName, labelRef, player) {
    //console.log("updatePlayerLabel:" + playerName + " - " + player.team);
    var name = this.getName(playerName, player);
    labelRef.setText(name);

    labelRef.style.setBackgroundColor(
      player.team == 1 ? COLOR_1_HEX : COLOR_2_HEX
    );
  }

  updatePlayerNameDeathAndStuff(is, incoming) {
    //console.log(incoming);
    if (!incoming) {
      return;
    }

    if (
      is.playerName != incoming.playerName ||
      is.team != incoming.team ||
      is.isDead != incoming.isDead ||
      is.isImposter != incoming.isImposter
    ) {
      this.updatePlayerLabel(incoming.playerName, is.labelRef, incoming);
    }

    is.playerName = incoming.playerName;
    is.isDead = incoming.isDead;
    is.isImposter = incoming.isImposter;
  }

  updateMeta(data) {
    console.log("updateMeta() is:" + gameState + " new:" + data.gameState);
    if (!data) return;

    gameMasterID = data.gameMaster;
    if (data.gameMaster == this.player.id) {
      isGameMaster = true;
    } else {
      isGameMaster = false;
    }

    if (gameState != State.PLAYING) {
      if (data.gameState == State.PLAYING) {
        console.log("updateMeta Start Playing!");
        gameState = State.PLAYING;
        grabbed = null;
        screenRef && screenRef.destroy();
        lobbyScreenRef && lobbyScreenRef.destroy();
        console.log("lobbyScreenRef" + lobbyScreenRef);
        console.log("updateMeta Start Playing 2");
      }
    }

    gameState = data.gameState;

    if (data.gameState == State.CLEAR) {
      this.clearThisClient();
      return;
    }

    if (GAME_TYPE == "BASKETBALL" || GAME_TYPE == "CAPTURE_THE_FLAG") {
      if (data.scores) {
        TEAM[0].score = data.scores[0];
        TEAM[1].score = data.scores[1];

        this.updateScores();
      }
      if (data.gameState == State.POINT || data.gameState == State.GAMEOVER) {
        this.endRoundEveryone(data.teamThatScored);
      }
    }
  }

  updateBall(data) {
    //console.log("updateBall");
    if (!data) return;

    //Update each ojbect
    const ball = balls[0];

    Object.keys(data).forEach((id) => {
      if (GAME_TYPE == "BASKETBALL") {
        //ball
        if (id == ball.id) {
          const incomingData = data[id];

          ball.x = incomingData.x;
          ball.y = incomingData.y;
          ball.angle = incomingData.angle;
          this.matter.body.setVelocity(ball.body, {
            x: incomingData.xVel,
            y: incomingData.yVel,
          });

          //console.log("ball yvel:" + balls[0].body.velocity.y);
        }
      }
    });
  }

  updateFlag(flagID, data) {
    if (!data) return;
    console.log("upateFlag:" + flagID + " d:" + data);
    if (GAME_TYPE == "CAPTURE_THE_FLAG") {
      //flag

      if (flagID == flag1.id || flagID == flag2.id) {
        var flag = flagID == flag1.id ? flag1 : flag2;

        flag.x = data.x;
        flag.y = data.y;

        //console.log("ball yvel:" + balls[0].body.velocity.y);
      }
    }
  }

  updatePlayers(data) {
    //console.log("updatePlayers");

    if (!data) {
      console.log("updatePlayers - no data.");
      return;
    }

    //Update current player (died?)
    this.updatePlayerNameDeathAndStuff(this.player, data[this.player.id]);

    //Unregister missing players
    Object.keys(this.allPlayers).forEach((id) => {
      if (!data[id]) {
        console.log("updatePlayers - DESTROY:" + id);
        this.allPlayers[id].destroy();
      }
    });

    //Update each player
    var allKeys = Object.keys(data);

    //console.log("updatePlayers. length:" + allKeys.length);

    Object.keys(data).forEach((id) => {
      const incomingData = data[id];
      if (id == this.player.id) {
        //rare - does it cause loops, when we update the current player?
        if (incomingData.forceExceptionalUpdate == true) {
          console.log("update me! team:" + incomingData.team);

          this.updatePlayer(this.player, incomingData);

          grabbed = null;
          firebase
            .database()
            .ref(gameCode + "/players/" + this.player.id)
            .update({
              forceExceptionalUpdate: false,
            });
        }
      } else if (this.allPlayers[id]) {
        // UPDATE Existing CHARACTER

        const player = this.allPlayers[id];
        this.updatePlayer(player, incomingData);
      } else if (!this.allPlayers[id] && id != this.player.id) {
        // ADD New PLAYERS

        if (IS_MULTIPLAYER) {
          const playerData = data[id];
          console.log(
            "updatePlayers - ADD! id:" + id + " name:" + playerData.playerName
          );
          var mSprite = this.add.sprite(0, 0, "dude");
          console.log(playerData);

          var newPlayer = this.createPlayer(playerData, mSprite, false);
          this.allPlayers[id] = newPlayer;
          //console.log("allPlayers length:" + this.allPlayers.l)
          console.log(this.allPlayers);
        }
      } else {
      }

      this.updateLobbyList();
    });
  }

  updatePlayer(player, incomingData) {
    // console.log(
    //   "updatePlayer:" + player.id + " x:" + player.x + " ix:" + incomingData.x
    // );
    if (!incomingData.x) {
      console.log("BAD UPDATE. SKIP.");
      return;
    }

    //Update all existing players - name and death
    this.updatePlayerNameDeathAndStuff(player, incomingData);

    //console.log(player);

    // console.log(
    //   "updatePlayer:" +
    //     player.id +
    //     " team was:" +
    //     player.team +
    //     " team new:" +
    //     incomingData.team
    // );

    // console.log("U. x:" + player.x + " nx:" + incomingData.x);
    // console.log("U. v:" + player.body.velocityX + " nx:" + incomingData.xVel);
    player.x = incomingData.x;
    player.y = incomingData.y;
    player.angle = incomingData.angle;
    player.id = incomingData.id;
    player.team = incomingData.team;
    this.matter.body.setVelocity(player.body, {
      x: incomingData.xVel,
      y: incomingData.yVel,
    });

    //console.log(player.spriteRef);
    //console.log("incomgin anim: " + incomingData.animation);
    if (incomingData.animation) {
      player.spriteRef.anims.play(incomingData.animation, true);
    }
  }

  makeid(length) {
    var result = "";
    //var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var characters = "abcdefghjkmnopqrstuvwxyz";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
export default Game;
