const APIError = require('./api-error');
const Grid = require('./grid');

module.exports = class Game {

  constructor(io) {
    this.io = io;
    this.init();
  }

  init() {
    this.state = 'idle';
    this.players = [];
    this.grid = new Grid(6, 5);
    this.turn = 1;
  }

  start() {
    this.state = 'started';
    this.broadcast({ action: 'start' });
  }

  end() {
    this.broadcast({ action: 'end' });
    this.players.forEach(p => p.socket.conn.close());

    this.init();
  }

  play(player, x) {
    if (!x || x <= 0 || x > this.grid.width)
      throw new APIError('Invalid x');

    let y = this.grid.height;

    for (; y > 0; --y) {
      if (this.grid.get(x, y) === null)
        break;
    }

    if (y === 0)
      throw new APIError('Invalid x');

    this.grid.set(x, y, player.number);
    this.turn++;

    this.broadcast({ action: 'play', player: player.number, x });

    const winner = this.winner();

    if (winner) {
      this.broadcast({ action: 'win', player: winner });
      this.end();
    }

    if (this.grid.isFull()) {
      this.broadcast({ action: 'tie' });
      this.end();
    }

  }

  winner() {
    const win = (x, y, n) => {
      const check = (f, n) => {
        const p = f(n);

        if (n === 0)
          return p;

        return p === check(f, n - 1) ? p : null;
      };

      return [
          check(n => this.grid.get(x + n, y), n - 1),
          check(n => this.grid.get(x, y + n), n - 1),
          check(n => this.grid.get(x + n, y + n), n - 1),
        ].filter(value => !!value)[0];
    };

    for (let j = 1; j <= this.grid.height; ++j) {
      for (let i = 1; i <= this.grid.width; ++i) {
        const winner = win(i, j, 4);

        if (winner)
          return winner;
      }
    }
  }

  broadcast(message) {
    this.io.emit('message', message);
  }

  onConnection(socket) {
    if (this.state === 'started')
      throw new APIError('A game is already running');

    this.players.push({
      socket,
      number: this.players.length + 1,
      nick: undefined,
    });

    this.broadcast({ action: 'join' });

    if (this.players.length === 2)
      this.start();
  }

  onDisconnect(socket) {
    const idx = this.players.findIndex(p => socket.id === p.socket.id);

    if (idx < 0)
      return;

    this.players.splice(idx, 1);

    this.broadcast({ action: 'leave' });

    if (this.state === 'started')
      this.end();
  }

  onMessage(socket, message) {
    const idx = this.players.findIndex(p => socket.id === p.socket.id);
    const { query } = message;

    if (idx < 0)
      throw new APIError('Invalid socket');

    if (!query)
      throw new APIError('Missing query field in message');

    switch (query) {
    case 'play':
      if (this.state !== 'started')
        throw new APIError('The game has not started');

      if (this.turn % 2 === idx)
        throw new APIError('Not your turn');

      this.play(this.players[idx], message.x);
      break;

    case 'nick':
      const { value } = message;

      if (typeof value !== 'string')
        throw new APIError('Invalid value');

      this.players[idx].nick = value;
      this.broadcast({ action: 'nick', player: this.players[idx].number, value: value });
      break;

    default:
      throw new APIError('Invalid query');
    }
  }

}
