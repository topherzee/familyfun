import Phaser from "phaser";

import constants from "./config/constants";
import GameScene from "./scenes/game";

const config = {
  type: Phaser.AUTO,
  width: constants.WIDTH,
  height: constants.HEIGHT,
  physics: {
    default: "matter",

    matter: {
      gravity: {
        x: 0,
        y: 0.2,
      },
      debug: {
        showAxes: false,
        showAngleIndicator: true,
        angleColor: 0xe81153,

        showBroadphase: false,
        broadphaseColor: 0xffb400,

        showBounds: false,
        boundsColor: 0xffffff,

        showVelocity: true,
        velocityColor: 0x00aeef,

        showCollisions: true,
        collisionColor: 0xf5950c,

        showSeparations: false,
        separationColor: 0xffa500,

        showBody: true,
        showStaticBody: true,
        showInternalEdges: true,

        renderFill: false,
        renderLine: true,

        fillColor: 0x106909,
        fillOpacity: 1,
        lineColor: 0x28de19,
        lineOpacity: 1,
        lineThickness: 1,

        staticFillColor: 0x0d177b,
        staticLineColor: 0x1327e4,

        showSleeping: true,
        staticBodySleepOpacity: 1,
        sleepFillColor: 0x464646,
        sleepLineColor: 0x999a99,

        showSensors: true,
        sensorFillColor: 0x0d177b,
        sensorLineColor: 0x1327e4,

        showPositions: true,
        positionSize: 4,
        positionColor: 0xe042da,

        showJoint: true,
        jointColor: 0xe0e042,
        jointLineOpacity: 1,
        jointLineThickness: 2,

        pinSize: 4,
        pinColor: 0x42e0e0,

        springColor: 0xe042e0,

        anchorColor: 0xefefef,
        anchorSize: 4,

        showConvexHulls: true,
        hullColor: 0xd703d0,
      },
    },
  },
  scene: [GameScene],
};

(() => new Phaser.Game(config))();

if (module.hot) {
  module.hot.accept(() => {});

  module.hot.dispose(() => {
    window.location.reload();
  });
}

// const config = {
//   type: Phaser.AUTO,
//   width: constants.WIDTH,
//   height: constants.HEIGHT,
//   physics: {
//     default: "matter",

//     matter: {
//       enableSleeping: true,
//       gravity: {
//         x: 0,
//         y: 0,
//       },
//       debug: {
//         showAxes: false,
//         showAngleIndicator: true,
//         angleColor: 0xe81153,

//         showBroadphase: false,
//         broadphaseColor: 0xffb400,

//         showBounds: false,
//         boundsColor: 0xffffff,

//         showVelocity: true,
//         velocityColor: 0x00aeef,

//         showCollisions: true,
//         collisionColor: 0xf5950c,

//         showSeparations: false,
//         separationColor: 0xffa500,

//         showBody: true,
//         showStaticBody: true,
//         showInternalEdges: true,

//         renderFill: false,
//         renderLine: true,

//         fillColor: 0x106909,
//         fillOpacity: 1,
//         lineColor: 0x28de19,
//         lineOpacity: 1,
//         lineThickness: 1,

//         staticFillColor: 0x0d177b,
//         staticLineColor: 0x1327e4,

//         showSleeping: true,
//         staticBodySleepOpacity: 1,
//         sleepFillColor: 0x464646,
//         sleepLineColor: 0x999a99,

//         showSensors: true,
//         sensorFillColor: 0x0d177b,
//         sensorLineColor: 0x1327e4,

//         showPositions: true,
//         positionSize: 4,
//         positionColor: 0xe042da,

//         showJoint: true,
//         jointColor: 0xe0e042,
//         jointLineOpacity: 1,
//         jointLineThickness: 2,

//         pinSize: 4,
//         pinColor: 0x42e0e0,

//         springColor: 0xe042e0,

//         anchorColor: 0xefefef,
//         anchorSize: 4,

//         showConvexHulls: true,
//         hullColor: 0xd703d0,
//       },
//     },
//   },
//   scene: [GameScene],
// };
