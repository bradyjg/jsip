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

const Matrix = require('../Matrix');

/** A list of common kernels used in image processing */
module.exports = {
  boxBlur: () => new Matrix([
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ]).mul(1/9),
  edgeDetection1: () => new Matrix([
    [1, 0, -1],
    [0, 1, 0],
    [-1, 0, 1],
  ]),
  edgeDetection2: () => new Matrix([
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0],
  ]),
  edgeDetection3: () => new Matrix([
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ]),
  emboss: () => new Matrix([
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2],
  ]),
  gaussianBlur: (size) => {
    const w = [];
    const row = pascal(size);
    w.push(new Matrix([row]));

    const col = [];
    row.forEach(n => {
      col.push([n]);
    });
    w.push(new Matrix(col));

    let sum = 0;
    for (let i = 0; i < size; i++) sum += w[0].get(0, i);

    w[0].div(sum);
    w[1].div(sum);
    return w;
  },
  identity: () => new Matrix([
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ]),
  kirschRight: () => new Matrix([
    [-3, -3, 5],
    [-3, 0, 5],
    [-3, -3, 5],
  ]),
  kirschTopRight: () => new Matrix([
    [-3, 5, 5],
    [-3, 0, 5],
    [-3, -3, -3],
  ]),
  kirschTop: () => new Matrix([
    [5, 5, 5],
    [-3, 0, -3],
    [-3, -3, -3],
  ]),
  kirschTopLeft: () => new Matrix([
    [5, 5, -3],
    [5, 0, -3],
    [-3, -3, -3],
  ]),
  kirschLeft: () => new Matrix([
    [5, -3, -3],
    [5, 0, -3],
    [5, -3, -3],
  ]),
  kirschBottomLeft: () => new Matrix([
    [-3, -3, -3],
    [5, 0, -3],
    [5, 5, -3],
  ]),
  kirschBottom: () => new Matrix([
    [-3, -3, -3],
    [-3, 0, -3],
    [5, 5, 5],
  ]),
  kirschBottomRight: () => new Matrix([
    [-3, -3, -3],
    [-3, 0, 5],
    [-3, 5, 5],
  ]),
  laplacian: () => new Matrix([
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0],
  ]),
  prewitt: () => new Matrix([
    [1, 0, -1],
    [1, 0, -1],
    [1, 0, -1],
  ]).mmul(new Matrix([
    [1, 1, 1],
    [0, 0, 0],
    [-1, -1, -1],
  ])),
  sharp: (amount) => new Matrix([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ]).mul(amount),
  sobelRight: () => new Matrix([
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ]),
  sobelTop: () => new Matrix([
    [1, 2, 1],
    [0, 0, 0],
    [-1, -2, -1],
  ]),
  sobelLeft: () => new Matrix([
    [1, 0, -1],
    [2, 0, -2],
    [1, 0, -1],
  ]),
  sobelBottom: () => new Matrix([
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ]),
}

function pascal(n) {
  if (n === 1)return [1];
  else if (n === 2) return [1, 1];
  else {
    let ans = [1, 1];
    for (let i = 2; i < n; i++) {
      const newline = [];
      for (let j = 0; j < ans.length-1; j++) {
        newline.push(ans[j] + ans[j+1]);
      }
      newline.unshift(1);
      newline.push(1);
      ans = newline;
    }
    return ans;
  }
}