class LobbyScene extends Phaser.Scene {
  constructor() {
    console.log("constructor");
    super({ key: "LobbyScene" });

    //firebase.initializeApp(firebase_config);
    //this.database = firebase.database();

    //this.allPlayers = {};
  }
  preload() {
    console.log("Lobby preload");
  }

  create() {
    console.log("create");
    this.showLobbyScreen();

    this.input.on("gameobjectdown", function (pointer, gameObject) {
      console.log("gameobjectdown: " + gameObject.id);
    });
  }

  showLobbyScreen() {
    var msg1 = "LOBBY";
    var msg2 = "Waiting for Game Boss to start.";
    var msg3 = "-";
    var backColor = 0xffffff;
    var borderColor = 0xffff99;
    var screen = this.showScreen(msg1, msg2, msg3, backColor, borderColor);

    //handle clicks.
    screen.setInteractive();
    screen.id = "win-screen";

    return screen;
  }

  showScreen(msg1, msg2, msg3, backColor, borderColor) {
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

    var group = this.add.container(
      window.GAME_WIDTH / 2,
      window.GAME_HEIGHT / 2,
      [board, label1, label2, label3]
    );

    group.label3 = label3;
    group.setSize(window.GAME_WIDTH / 2, window.GAME_HEIGHT / 2);
    group.setInteractive();
    //screenRef = screen;
    return group;
  }
}

export default LobbyScene;
