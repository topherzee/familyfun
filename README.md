# FamilyFun

A simple networked multiplayer game.

## Developing

Use a local web server.
(I recommend using npm to install 'live-server' globally.
`npm i live-server -g`
https://www.npmjs.com/package/live-server )

Then run:
`live-server --open=index.html`

Note: not using npm to bulid anymore because it was slow and annoying.
Just importing libraries directly.

## more info about game

Play game at: https://topherzee.github.io/familyfun/

The goal is to have a collection of easy to learn mini-games that family can play while video chatting on ZOOM.

- Use arrow keys to move.
- Use SPACEBAR to pickup and throw balls & blocks.

## ADMIN

Hit 'T' to delete all players (and so start over-ish)

## BASKETBALL

Current first game is basketball.
Throw in hoops to get a point.

- Hit Q to change your team! (red or blue)
- After it is thrown in hoop it 'sticks'. Hit 'R' to restart game.

## IMPOSTER mode

There is also an Imposter mode ('Werewolf/Mafia/Among Us') which is now disabled.
You can enable it with /src/scenes/game.js .. IS_IMPOSTER constant.

- One player is the "Imposter", they try to kill as many other players without being detected.

- Imposter can use the 'k' key to kill. (Killed player shows state after 3 seconds.)
- Use the 'r' key to reset the game and choose a new Imposter.
- Use the 't' key to delete all players on firebase.

## A few features.

- Saves name to a browser cookie.
- Playable on touchscreen device.

## Next steps

Football game:

- Get the roators synced.
- Add goals
- Add score object.
- Add teams

Imposter game:

- Tidy up code /scenes/game.js
- Add touchscreen support (iOS and android)
- Way to reset all players in Firebase (remove 'disconnected' players)
- Call a meeting. Win and lose of the imposter. Game ends.
- Dead players should be greyed out.

- Simpler domain name.
- Ability to create 'rooms'
- Intro screen to choose the game, create rooms, start games, choose the game, and explain what it is about.

- More games!
- Capture the flag
- Soccer
- Breakout
- Stackers

## Deploying to the internet.

Use git to save your changes and deploy:

```
> git add --all
> git commit -m"I made this cool change."
> git push
```

## Tech Details

View the Firebase database at:

https://console.firebase.google.com/project/familyfun-d8dec/database/familyfun-d8dec/data

## Key technologies

- Phaser
- Firebase

Based on:
https://github.com/hunttis/phaser-firebase

Built on top of on minimal boilerplate from 22mahmoud: https://github.com/22mahmoud/Phaser.io-v3-Boilerplate

### Code Notes

In the code 'body' refers to the physics body. So its the connectoin to the physics engine for the scene.

### Want to start your own game with your own database?

Set up your firebase application at http://firebase.google.com
And create a "Realtime database".

Copy your firebase app configuration to the `var firebase_config` at the top of file:`src/scenes/game.js`
