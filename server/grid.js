module.exports = class Grid {

  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height).fill(null);
  }

  set(x, y, value) {
    --x;
    --y;

    if (x < 0 || y < 0 || x >= this.width || y >= this.height)
      return;

    this.cells[x * this.height + y] = value;
  }

  get(x, y) {
    --x;
    --y;

    return this.cells[x * this.height + y];
  }

  isFull() {
    return this.cells.filter(v => v !== null).length === 0;
  }

}
