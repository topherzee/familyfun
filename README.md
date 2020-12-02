# FamilyFun

A simple networked multiplayer game.

Play game at: https://topherzee.github.io/familyfun/dist/

The goal is to have a collection of easy to learn mini-games that family can play while video chatting on ZOOM.

The first game is based on 'Werewolf/Mafia/Among Us'
- One player is the "Imposter", they try to kill as many other players without being detected.

- Use arrow keys to move.
- Imposter can use the 'k' key to kill. (Killed player shows state after 3 seconds.)
- Use the 'r' key to reset the game and choose a new Imposter.


## Next steps
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

## Build and deploy the game

REPO is here: https://github.com/topherzee/familyfun


Get the source-code. Download or Clone:
```
git clone https://github.com/topherzee/familyfun.git
```

Be sure you have `nodejs` installed. https://nodejs.org/en/

Be sure you have `yarn` installed. https://yarnpkg.com/

Open your terminal or 'command prompt' to the location where you installed the repository.

Run:
```
> yarn
> yarn start
```

Navigate to http://localhost:1234

## Deploying to the internet.

Build the game:
(Builds into the `dist` directory.)
```
> yarn build
```

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

### Want to start your own game with your own database?

Set up your firebase application at http://firebase.google.com

Copy your firebase app configuration to `src/scenes/game.js`


 