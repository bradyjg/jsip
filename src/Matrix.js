/** Imager - An image resizing and compressing tool
Copyright (C) 2021 Brady Geleynse

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>. */

module.exports = class Matrix {
  #m = [[]];   /** Multi-demensional array that holds the matrix values */
  #rows = 0;   /** Number of rows in the matrix */
  #cols = 0;   /** Number of columns in the matrix */
  #chls = 0;   /** Number of channels in the matrix */

  /**
   * @class Matrix
   * @summary A class that holds a matrix with operational prototypes.
   * @param {Number|Array}    - rows Number of rows in the matrix | Predefined Matrix array.
   * @param {Number} cols     - Number of columns in the matrix.
   * @param {Number} [chls=1] - Number of channels in the matrix.
   * @returns {Matrix} Instance of class.
   */
  constructor(rows, cols, chls=1) {
    if (cols === undefined && rows !== undefined) {
      if (!Array.isArray(rows)) throw new TypeError('With no column size given, rows must be a matrix to load.');
      this.load(rows);
    }
    else if (rows !== undefined && cols !== undefined)
      this.generate(rows, cols, chls);
    return this;
  }

  /**
   * @summary Get the value at a specific matrix index.
   * @param {Number} i   - Row to index.
   * @param {Number} j   - Column to index.
   * @param {Number} [k] - Channel to index.
   * @returns {*} The value at row i, column j, [channel k].
   */
  get(i, j, k) {
    if (k !== undefined) {
      if (i >= this.rows || j >= this.cols || k >= this.chls || i < 0 || j < 0 || k < 0) throw new RangeError('Index (' + i + ', ' + j + ', ' + k + ') is out of range (' + this.rows + 'x' + this.cols + 'x' + this.chls + ')');
      return this.m[i][j][k];
    }
    else {
      if (i >= this.rows || j >= this.cols || i < 0 || j < 0) throw new RangeError('Index (' + i + ',' + j + ') is out of range (' + this.rows + 'x' + this.cols + ')');
      return this.m[i][j];
    }
  }

  getRow(i) {
    return this.m[i];
  }

  getCol(j) {
    const col = Array();
    for (let i = 0; i < this.rows; i++)
      col.push(this.m[i][j]);
    return col;
  }

  /**
   * @returns The number of rows in the matrix.
   */
  getRows() {
    return this.rows;
  }

  /**
   * @returns The number of columns in the matrix.
   */
  getCols() {
    return this.cols;
  }

  /**
   * @returns The number of channels in the matrix.
   */
  getChls() {
    return this.chls;
  }

  /**
   * @returns A formatted string of all dimensions in the matrix.
   */
  getSize() {
    if (chls === 1) return this.rows + 'x' + this.cols;
    return this.rows + 'x' + this.cols + 'x' + this.chls;
  }

  /**
   * @summary Sets a value at the given matrix index.
   * @param {Number} i   - Row index.
   * @param {Number} j   - Column index.
   * @param {*} v        - Value to put at location index.
   * @param {Number} [k] - Channel index.
   * @returns Updated matrix.
   */
  set(i, j, v, k) {
    if (k !== undefined) {
      if (i >= this.rows || j >= this.cols || k >= this.chls || i < 0 || j < 0 || k < 0) throw new RangeError('Index (' + i + ', ' + j + ', ' + k + ') is out of range for the Matrix size (' + this.rows + 'x' + this.cols + 'x' + this.chls + ')');
      this.m[i][j][k] = v;
    }
    else {
      if (i >= this.rows || j >= this.cols || i < 0 || j < 0) throw new new RangeError('Index (' + i + ', ' + j + ') is out of range for the Matrix size (' + this.rows + 'x' + this.cols + 'x' + this.chls + ')');
      this.m[i][j] = v;
    }
    return this;
  }

  /**
   * @summary Sets a specific row to a given array.
   * @param {Number} i - Row index.
   * @param {Array} r  - Row array.
   * @returns Updated matrix.
   */
  setRow(i, r) {
    if (r.length !== this.cols) throw new RangeError('Set row length must match number of columns in Matrix.');
    this.m[i] = r;
    return this;
  }

  /**
   * @summary Sets a specific column to a given array.
   * @param {Number} j - Column index.
   * @param {Array} c  - Column array.
   * @returns Updated matrix.
   */
  setCol(j, c) {
    if (c.length !== this.rows) throw new RangeError('Set column length must match number of rows in Matrix.');
    for (let i = 0; i < this.rows; i++) this.m[i][j] = c[i];
    return this;
  }

  /**
   * @summary Sets RGB or RGBA channels for a given matrix index.
   * @param {Number} i   - Row index.
   * @param {Number} j   - Column index.
   * @param {Number} r   - Red value.
   * @param {Number} g   - Green value.
   * @param {Number} b   - Blue value.
   * @param {Number} [a] - Alpha value.
   * @returns Updated matrix.
   */
  setPixel(i, j, r, g, b, a) {
    if (this.chls < 3) throw new Error('Cannot set a pixel that has less than 3 channels.');
    else if (a === undefined && (i >= this.rows || j >= this.cols || i < 0 || j < 0)) throw new RangeError('Index (' + i + ',' + j + ') is out of range for the Matrix size (' + this.rows + 'x' + this.cols + 'x' + this.chls + ')');
    this.set(i, j, r, 0);
    this.set(i, j, g, 1);
    this.set(i, j, b, 2);
    if (a !== undefined && this.chls >= 4) this.set(i, j, a, 3);
    return this;
  }

  /**
   * @summary Fills all matrix indicies with a specific value.
   * @param {*} v - The value to fill the matrix with.
   * @returns Updated matrix.
   */
  fill(v) {
    this.applyAll((i, j, k) => {
      this.set(i, j, v, k);
    })
    return this;
  }
  
  /**
   * @summary Fills all matrix red channels with a specific value.
   * @param {Number} r - The value to fill the red channel with.
   * @returns {Matrix} Updated matrix.
   */
  fillRed(r) {
    this.apply((i, j) => {
      this.set(i, j, r, 0);
    })
    return this;
  }

  /**
   * @summary Fills all matrix green channels with a specific value.
   * @param {Number} g - The value to fill the green channel with.
   * @returns {Matrix} Updated matrix.
   */
  fillGreen(g) {
    this.apply((i, j) => {
      this.set(i, j, g, 1);
    })
    return this;
  }

  /**
   * @summary Fills all matrix blue channels with a specific value.
   * @param {Number} b - The value to fill the blue channel with.
   * @returns {Matrix} Updated matrix.
   */
  fillBlue(b) {
    this.apply((i, j) => {
      this.set(i, j, b, 2);
    })
    return this;
  }

  /**
   * @summary Fills all matrix alpha channels with a specific value.
   * @param {Number} a - The value to fill the alpha channel with.
   * @returns {Matrix} Updated matrix.
   */
  fillAlpha(a) {
    this.apply((i, j) => {
      this.set(i, j, a, 3);
    })
    return this;
  }

  /**
   * @summary Fills all matrix pixels with a specific pixel value.
   * @param {Number} r   - The value to fill the red channel with.
   * @param {Number} g   - The value to fill the green channel with.
   * @param {Number} b   - The value to fill the blue channel with.
   * @param {Number} [a] - The value to fill the pixels with.
   * @returns {Matrix} Updated matrix.
   */
  fillPixel(r, g, b, a) {
    this.apply((i, j) => {
      this.setPixel(i, j, r, g, b, a);
    })
    return this;
  }

  /**
   * @summary Generates a new matrix.
   * @param {Number} rows - Number of rows to generate.
   * @param {Number} cols - Number of columns to generate.
   * @param {Number} chls - Number of channels to generate.
   * @param {*} [v=0]     - Value to fill the new matrix with.
   * @returns {Matrix} The newly generated matrix.
   */
  generate(rows, cols, chls, v=0) {
    if (!parseInt(rows) || !parseInt(cols) || !parseInt(chls)) throw new TypeError('rows, cols, and chls must be integer values.');
    this.rows = parseInt(rows);
    this.cols = parseInt(cols);
    this.chls = parseInt(chls);

    const m = Array(rows)
    for (let r = 0; r < rows; r++) {
      m[r] = Array(cols);
      for (let c = 0; c < cols; c++) {
        if (chls > 1)
          m[r][c] = Array(chls).fill(v);
        else
          m[r][c] = v;
      }
    }
    this.m = m;
    return this;
  }

  /**
   * @summary Loads an premade matrix array into the Matrix class.
   * @param {Matrix} m - A 2D or 3D array of a matrix.
   * @returns {Matrix} Newly formed matrix.
   */
  load(m) {
    if (!Array.isArray(m) || !Array.isArray(m[0])) throw new TypeError('Matrix must be 2D or 3D Array.');

    this.rows = m.length;
    this.cols = m[0].length;
    if (Array.isArray(m[0][0])) this.chls = m[0][0].length;
    else this.chls = 1;
    this.m = m;
    return this;
  }

  /**
   * @summary Generates an all black image matrix.
   * @param {Number} rows     - Number of rows.
   * @param {Number} cols     - Number of columns.
   * @param {Number} [chls=4] - Number of channels.
   * @returns {Matrix} Newly generated matrix.
   */
  black(rows, cols, chls=4) {
    this.zeros(rows, cols, chls);
    this.apply((i, j) => {
      this.set(i, j, 1, 3);
    })
    return this;
  }

  /**
   * @summary Generates an all white image matrix.
   * @param {Number} rows     - Number of rows.
   * @param {Number} cols     - Number of columns.
   * @param {Number} [chls=4] - Number of channels.
   * @returns {Matrix} Newly generated matrix.
   */
  white(rows, cols, chls=4) {
    return this.ones(rows, cols, chls);
  }

  /**
   * @summary Generates a randomized image matrix.
   * @param {Number} rows     - Number of rows.
   * @param {Number} cols     - Number of columns.
   * @param {Number} [chls=4] - Number of channels.
   * @returns {Matrix} Newly generated matrix.
   */
  randomize(rows, cols, chls=1) {
    if (rows !== undefined && cols !== undefined)
      this.zeros(rows, cols, chls);
    this.applyAll((i, j, k) => {
      this.set(i, j, Math.random(), k);
    })
    return this;
  }

  /**
   * @summary Generates an all red image matrix.
   * @param {Number} rows     - Number of rows.
   * @param {Number} cols     - Number of columns.
   * @param {Number} [chls=4] - Number of channels.
   * @returns {Matrix} Newly generated matrix.
   */
  red(rows, cols, chls=4) {
    if (rows === undefined && cols === undefined)
      this.generate(this.rows, this.cols, this.chls);
    else
      this.generate(rows, cols, chls, 0);
    return this.fillRed(1).fillAlpha(1);
  }

  /**
   * @summary Generates an all green image matrix.
   * @param {Number} rows     - Number of rows.
   * @param {Number} cols     - Number of columns.
   * @param {Number} [chls=4] - Number of channels.
   * @returns {Matrix} Newly generated matrix.
   */
  green(rows, cols, chls=4) {
    if (rows === undefined && cols === undefined)
      this.generate(this.rows, this.cols, this.chls);
    else
      this.generate(rows, cols, chls, 0);
    return this.fillGreen(1).fillAlpha(1);
  }

  /**
   * @summary Generates an all blue image matrix.
   * @param {Number} rows     - Number of rows.
   * @param {Number} cols     - Number of columns.
   * @param {Number} [chls=4] - Number of channels.
   * @returns {Matrix} Newly generated matrix.
   */
  blue(rows, cols, chls=4) {
    if (rows === undefined && cols === undefined)
      this.generate(this.rows, this.cols, this.chls);
    else
      this.generate(rows, cols, chls, 0);
    return this.fillBlue(1).fillAlpha(1);
  }

  /**
   * @summary Generates an all zeros matrix.
   * @param {Number} rows     - Number of rows.
   * @param {Number} cols     - Number of columns.
   * @param {Number} [chls=1] - Number of channels.
   * @returns {Matrix} Newly generated matrix.
   */
  zeros(rows, cols, chls=1) {
    if (rows === undefined && cols === undefined)
      return this.generate(this.rows, this.cols, this.chls);
    return this.generate(rows, cols, chls, 0);
  }

  /**
   * @summary Generates an all ones matrix.
   * @param {Number} rows     - Number of rows.
   * @param {Number} cols     - Number of columns.
   * @param {Number} [chls=1] - Number of channels.
   * @returns {Matrix} Newly generated matrix.
   */
  ones(rows, cols, chls=1) {
    if (rows === undefined && cols === undefined)
      return this.generate(this.rows, this.cols, this.chls);
    return this.generate(rows, cols, chls, 1);
  }

  /**
   * @summary Generates an identity matrix.
   * @param {Number} [size=3] - Number of rows and columns.
   * @returns {Matrix} Newly generated matrix.
   */
  identity(size=3) {
    this.generate(size, size, 1, 0);
    for (let i = 0; i < size; i++) this.set(i, i, 1);
    return this;
  }

  /**
   * @summary Copies matrix contents to another matrix.
   * @param {Matrix} to       - Matrix to copy to.
   * @param {Object} offset   - Contains the offset of the source in the copy.
   * @param {Number} offset.i - Row offset.
   * @param {Number} offset.j - Column offset. 
   * @returns {Matrix} The newly copied matrix.
   */
  copy(to, offset={i: 0, j: 0}) {
    this.apply((i, j) => {
      to.set(i + offset.i, j + offset.j, this.get(i, j));
    })
    return to;
  }

  /**
   * @summary Parses all numbers to integers.
   * @returns {Matrix} Newly parsed matrix.
   */
  toInt() {
    this.applyAll((i, j, k) => {
      this.set(i, j, parseInt(this.get(i, j, k)), k)
    })
    return this;
  }

  /**
   * @summary Flattens a matrix into a 1D array.
   * @returns {Array} A 1D representation of the matrix.
   */
  flatten() {
    const flat = Array();
    this.applyAll((i, j, k) => {
      flat.push(this.get(i, j, k));
    })
    return flat;
  }

  /**
   * @summary Extrudes the number of channels to a given number.
   * @param {Number} chls - Number of channels to extrude to.
   * @returns {Matrix} Newly extruded matrix.
   */
  extrude(chls) {
    if (chls <= 1) throw new RangeError('Must extrude to a number greater than 1.');
    if (chls < this.chls) throw new RangeError('Cannot extrude to a number of channels less than current channels.');
    if (this.chls === 1)
      this.apply((i, j) => {
        this.set(i, j, Array(chls).fill(this.get(i, j)));
      })
    else
      this.apply((i, j) => {
        const v = this.m[i][j][this.chls - 1];
        for (let n = this.chls; n < chls; n++)
          this.m[i][j].push(v);
      })
    this.chls = chls;
    return this;
  }

  /**
   * @summary Intrudes the number of channels to a given number.
   * @param {Number} chls - Number of channels to intrude to.
   * @returns {Matrix} Newly intrude matrix.
   */
  intrude(chls) {
    if (chls < 1) throw new RangeError('Cannot intrude Matrix to less than 1 channel.');
    if (this.chls === 1) throw new RangeError('Cannot intrude Matrix that already has 1 channel.');

    if (chls > 1)
      this.apply((i, j) => {
        this.set(i, j, this.get(i, j).slice(0, chls));
      })
    else
      this.apply((i, j) => {
        this.set(i, j, this.get(i, j, 0));
      })
    this.chls = chls;
    return this;
  }

  /**
   * @summary Transposes the matrix.
   * @returns {Matrix} Newly transposed matrix.
   */
  transpose() {
    const t = new Matrix(this.cols, this.rows, this.chls);
    for (let i = 0; i < this.cols; i++)
      for (let j = 0; j < this.rows; j++)
        t.set(i, j, this.get(j, i));
    this.m = t.m;
    this.rows = t.rows;
    this.cols = t.cols;
    this.chls = t.chls;
    return this;
  }

  /**
   * @summary Tests if the image matrix is white.
   * @returns {Boolean} If the image matrix is white.
   */
  isWhite() {
    let flag = true;
    if (this.chls !== 3 && this.chls !== 4) return false;
    this.applyAllPixels((i, j, k) => {
      if (this.get(i, j, k) !== 1) {
        flag = false;
        return;
      }
    })
    return flag;
  }

  /**
   * @summary Tests if the image matrix is black.
   * @returns {Boolean} If the image matrix is black.
   */
  isBlack() {
    let flag = true;
    if (this.chls !== 3 && this.chls !== 4) return false;
    this.applyAllPixels((i, j, k) => {
      if (this.get(i, j, k) !== 0) {
        flag = false;
        return;
      }
    })
    return flag;
  }

  /**
   * @summary Swaps two index positions in the matrix.
   * @param {Number} i  - Row index 1 to swap.
   * @param {Number} j  - Column index 1 to swap.
   * @param {Number} i2 - Row index 2 to swap.
   * @param {Number} j2 - Column index 2 to swap.
   * @returns {Matrix} The newly swapped matrix.
   */
  swap(i, j, i2, j2) {
    const t = this.m[i][j];
    this.m[i][j] = this.m[i2][j2];
    this.m[i2][j2] = t;
    return this;
  }

  /**
   * @summary Swaps two rows in the matrix.
   * @param {Number} i  - Row 1 to swap.
   * @param {Number} i2 - Row 2 to swap.
   * @returns {Matrix} The newly swapped matrix.
   */
  swapRow(i, i2) {
    const t = this.m[i];
    this.m[i] = this.m[i2];
    this.m[i2] = t;
    return this;
  }

  /**
   * @summary Swaps two columns in the matrix.
   * @param {Number} i  - Column 1 to swap.
   * @param {Number} i2 - Column 2 to swap.
   * @returns {Matrix} The newly swapped matrix.
   */
  swapCol(j, j2) {
    for (let i = 0; i < this.rows; i++) {
      const t = this.m[i][j];
      this.m[i][j] = this.m[i][j2];
      this.m[i][j2] = t;
    }
  }

  /**
   * @summary Flips the matrix over the x-axis (column positions).
   * @returns {Matrix} The newly flipped matrix.
   */
  flipX() {
    for (let j = 0; j < Math.floor(this.cols) / 2; j++)
      this.swapCol(j, this.cols - j - 1);
    return this;
  }

  /**
   * @summary Flips the matrix over the y-axis (row positions).
   * @returns {Matrix} The newly flipped matrix.
   */
  flipY() {
    for (let i = 0; i < Math.floor(this.rows) / 2; i++)
      this.swapRow(i, this.rows - i - 1);
    return this;
  }

  /**
   * @summary Flips the matrix over the x-axis and y-axis.
   * @returns {Matrix} The newly flipped matrix.
   */
  flipXY() {
    this.flipX();
    this.flipY();
    return this;
  }

  /**
   * @summary Gives all i, j, k index positions for each row, column, and channel=[0,1,2] in the matrix.
   * @param {Function} callback The callback function for the index positions.
   */
  applyAllPixels(callback) {
    this.apply((i, j) => {
      for (let k = 0; k < 3; k++)
        callback(i, j, k);
    })
  }

  /**
   * @summary Gives all i, j, k index positions for each row, column, and channel in the matrix.
   * @param {Function} callback The callback function for the index positions.
   */
  applyAll(callback) {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.chls > 1)
          for (let k = 0; k < this.chls; k++)
            callback(i, j, k);
        else
          callback(i, j);
      }
    }
  }

  /**
   * @summary Gives all i, j index positions for each row, column in the matrix.
   * @param {Function} callback The callback function for the index positions.
   */
  apply(callback) {
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++)
          callback(i, j);
  }

  /**
   * @summary Adds a value to every index in the matrix.
   * @param {Number} v - Value to add.
   * @returns {Matrix} Newly summed matrix.
   */
  add(v) {
    this.applyAll((i, j, k) => {
      if (k !== undefined) this.m[i][j][k] += v;
      else this.m[i][j] += v;
    })
    return this;
  }

  /**
   * @summary Subtracts a value to every index in the matrix.
   * @param {Number} v - Value to subtract.
   * @returns {Matrix} Newly subtracted matrix.
   */
  sub(v) {
    this.applyAll((i, j, k) => {
      if (k !== undefined) this.m[i][j][k] -= v;
      else this.m[i][j] -= v;
    })
    return this;
  }

  /**
   * @summary Multiplies a value to every index in the matrix.
   * @param {Number} v - Value to multiply.
   * @returns {Matrix} Newly multiplied matrix.
   */
  mul(v) {
    this.applyAll((i, j, k) => {
      if (k !== undefined) this.m[i][j][k] *= v;
      else this.m[i][j] *= v;
    })
    return this;
  }

  /**
   * @summary Divides a value to every index in the matrix.
   * @param {Number} v - Value to divide.
   * @returns {Matrix} Newly divided matrix.
   */
  div(v) {
    if (v == 0) throw new RangeError('Cannot divide by 0.');
    this.applyAll((i, j, k) => {
      if (k !== undefined) this.m[i][j][k] /= v;
      else this.m[i][j] /= v;
    })
    return this;
  }

  /**
   * @summary Accumulates the given value to the current matrix index.
   * @param {Number} i - Row index.
   * @param {Number} j - Column index.
   * @param {Number} v - Value to accumulate.
   * @returns {Matrix} Newly accumulated matrix.
   */
  accum(i, j, v, k) {
    this.set(i, j, this.get(i, j, k) + v, k);
    return this;
  }

  /**
   * @summary Sums two matricies together.
   * @param {Matrix} B        - Matrix to add.
   * @param {Number} [chls=1] - Number of channels to apply to.
   * @returns {Matrix} New sum matrix.
   */
  madd(B, chls=1) {
    if (this.rows !== B.rows || this.cols !== B.cols || this.chls !== B.chls) throw new Error('Matrices must be the same size in order to add: [' + this.getSize() + ']+[' + B.getSize() + ']');

    this.applyAll((i, j, k) => {
      if (k === undefined || (k !== undefined && k < chls))
        this.accum(i, j, B.get(i, j, k), k);
    })
    return this;
  }

  /**
   * @summary Sums two matricies together.
   * @param {Matrix} B        - Matrix to add.
   * @param {Number} [chls=1] - Number of channels to apply to.
   * @returns {Matrix} New sum matrix.
   */
   msub(B, chls=1) {
    if (this.rows !== B.rows || this.cols !== B.cols || this.chls !== B.chls) throw new Error('Matrices must be the same size in order to subtract: [' + this.getSize() + ']+[' + B.getSize() + ']');

    this.applyAll((i, j, k) => {
      if (k === undefined || (k !== undefined && k < chls))
        this.accum(i, j, B.get(i, j, k) * -1, k);
    })
    return this;
  }

  /**
   * @summary Multiply two matricies together.
   * @param {Matrix} B - Matrix to multiply.
   * @returns {Matrix} New product matrix.
   */
  mmul(B) {
    if (this.chls > 1 || B.chls > 1) throw new Error('Cannot matrix multiply a matrix with a chls greater than 1.');
    if (this.cols !== B.rows) throw new Error('Matrix sizes are not compatible for multiplication: [' + this.getSize() + ']*[' + B.getSize() + ']');

    const prod = new Matrix(this.cols, B.rows);
    for (let i = 0; i < this.rows; i++)
      for (let j = 0; j < this.cols; j++)
        for (let k = 0; k < B.cols; k++)
          prod.accum(i, j, this.get(k, j) * B.get(i, k))
    prod.copy(this)
    return this;
  }

  /**
   * @summary Averages the values between two matrices.
   * @param {Matrix} B - Matrix to average.
   * @returns {Matrix} Averaged matrix.
   */
  mavg(B) {
    if (this.rows !== B.rows || this.cols !== B.cols || this.chls !== B.chls) throw new Error('Matrices must be the same size in order to average values: [' + this.getSize() + '], [' + B.getSize() + ']')
    this.applyAll((i, j, k) => {
      this.set(i, j, (this.get(i, j, k) + B.get(i, j, k)) / 2, k)
    })
    return this;
  }

}