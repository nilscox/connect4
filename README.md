# Connect4

## Getting started

To launche the API, clone this repo first, then install the node dependencies
and run `server/index.js`.

```
42sh$ git clone <this repo url>
42sh$ npm install
42sh$ [PORT=8000] node server/index.js
```

> run `yarn start` to launch in dev mode

## API Documentation

A player can create a websocket to communicate with the API and play the game.
When a first websocket connection comes to the API, the player automatically
joins a game. When a second connection is made, the player joins the same game
and the game starts.

When a player joins the game, a websocket message is broadcasted to all players.

```js
{
  action: 'join',
}
```

When the game starts, another websocket message is broadcasted.

```js
{
  action: 'start',
}
```

To play, a player can, when it's his turn, emit a message.

```js
{
  query: 'play',
  x: number,
}
```

The x value is the position of the column the player is willing to play,
starting from index 1. If the value is correct, a websocket message is
broadcasted and the game waits for the other player's turn.

```js
{
  action: 'play',
  player: 1 | 2,
  x: number,
}
```

When a player connected 4 cells horizontally, vertically or on a diagonal, he
wons, and a websocket message is broadcasted.

```js
{
  action: 'win',
  player: 1 | 2,
}
```

If the grid is full, then it's a tie. A websocket message...

```js
{
  action: 'tie',
}
```

Finally, when a connected websocket disconnects, the game is reset and nobody
wins. Also a websocket message is broadcasted.

```js
{
  action: 'leave',
}
```

When the game terminates (either by winning it, a tie or websocket
disconnection), the game ends and a websocket message is broadcasted.

```js
{
  action: 'end',
}
```

> When a game terminates, both players must open a new websocket connection to start
> a new game.

Finally, a player can, if he wants to, set his nickname by emitting a websocket message.

```
{
  query: 'nick',
  value: string,
}
```

## Routes

In addition to the websocket API, some routes are available to view the game's status.

- `GET /game`: get the current game status, number of players and the grid (if started)
- `GET /players`: get the players list
- `GET /board`: view the board representation

## Contributing

Contributions are always welcome! Please feel free to [submit a PR](https://github.com/nilscox/connect4/pulls).

## License

[MIT](./LICENSE)
