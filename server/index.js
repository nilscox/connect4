const http = require('http');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const socketio = require('socket.io');

const Game = require('./game');
const APIError = require('./api-error');

const PORT = process.env.PORT || 4242;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, '..', 'client')));

server.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});

const game = new Game(io);

const renderBoard = (game) => {
  let head = '<title>Connect4 - board</title>';

  head += `
    <style type="text/css">
      table tr td { border: 1px solid #CCC; width: 30px; height: 30px; }
      .player-1 { background-color: #FF6; }
      .player-2 { background-color: #99F; }
    </style>
  `;

  let body = '<table>';

  for (let j = 1; j <= game.grid.height; ++j) {
    body += '<tr>';

    for (let i = 1; i <= game.grid.width; ++i) {
      const v = game.grid.get(i, j);

      body += `<td${v ? ` class="player-${v}"` : ''}></td>`;
    }

    body += '</tr>';
  }

  body += '</table>';

  return `
    <!DOCTYPE html>
    <html>
      <head>${head}</head>
      <body>${body}</body>
    </html>
  `;
};

app.get('/board', (req, res, next) => {
  if (game.state !== 'started')
    return next();

  res.send(renderBoard(game));
});

app.get('/players', (req, res, next) => {
  if (game.state !== 'started')
    return next();

  res.json(game.players.map(p => ({ number: p.number, nick: p.nick })));
});

app.get('/game', (req, res) => {
  const json = {
    state: game.state,
    players: game.players.length,
  };

  if (game.state === 'started') {
    json.turn = game.turn;
    json.grid = [];

    for (let j = 1; j <= game.grid.height; ++j) {
      json.grid.push([]);

      for (let i = 1; i <= game.grid.width; ++i) {
        json.grid[j - 1].push(game.grid.get(i, j));
      }
    }
  }

  return res.json(json)
});

io.on('connection', socket => {
  console.log('connection', socket.id);

  const trycatch = f => {
    try {
      return f();
    } catch (e) {
      if (!(e instanceof APIError))
        console.log(e);

      socket.emit('message', { error: e.message });
    }
  }

  trycatch(() => game.onConnection(socket));

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    trycatch(() => game.onDisconnect(socket));
  });

  socket.on('message', (message) => {
    console.log('message', socket.id, message);
    trycatch(() => game.onMessage(socket, message));
  });
});
