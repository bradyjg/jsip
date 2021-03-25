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

const fs = require('fs');
const getPixels = require('get-pixels');
const savePixels = require('save-pixels');
const ndarray = require('ndarray');
const Matrix = require('./Matrix')
const Kernel = require('./objects/kernels');

module.exports = class Imager {
  /**
   * @class Imager
   * @constructor
   */
  constructor () {
    return this;
  }

  /**
   * @summary Loads an image into a matrix for image processing.
   * @param {String} path - Image path to load from.
   * @returns {Matrix} A matrix of the image pixels.
   */
  async load(path) {
    const ret = getImage(path);
    return await ret.then(stream => {
      return this.convert2Matrix(stream);
    })
    .catch(err => {
      throw err;
    })
  }

  /**
   * @summary Saves the image matrix to a file.
   * @param {Matrix} A    - The image matrix to save.
   * @param {String} path - Image path to save to.
   */
  save(A, path) {
    saveImg(path, this.convert2Stream(A));
  }

  /**
   * @summary Converts an ndarray into a Matrix and normalizes data from 0-255 to 0-1.
   * @param {ndarray} stream - The ndarray to convert.
   * @returns {Matrix} A matrix of the given stream.
   */
  convert2Matrix(stream) {
    const m = new Matrix(stream.shape[0], stream.shape[1], stream.shape[2]);
    for (let i = 0; i < stream.shape[0]; i++)
      for (let j = 0; j < stream.shape[1]; j++)
        for (let k = 0; k < stream.shape[2]; k++)
          m.set(i, j, stream.data[stream.offset + stream.stride[0] * i + stream.stride[1] * j + stream.stride[2] * k], k)
    return m.div(255);
  }

  /**
   * @summary Converts a Matrix into an ndarray and normalizes data from 0-1 to 0-255.
   * @param {Matrix} A - The matrix to convert.
   * @returns {ndarray} An ndarray of the given Matrix.
   */
  convert2Stream(A) {
    const stream = ndarray(new Uint8Array(A.mul(255).toInt().flatten()), [A.getRows(), A.getCols(), A.getChls()]);
    A.div(255);
    return stream;
  }

  /**
   * @summary Performs convolution on an image Matrix with a given kernel.
   * @param {Matrix} A - A Matrix to perform convolution on.
   * @param {Matrix} w - A kernel to use for the convolution.
   * @returns {Matrix} Newly convoluted matrix.
   */
  convolution(A, w) {
    if (w.getRows() % 2 === 0 || w.getCols() % 2 === 0) throw 'ConvolutionError: Kernel must have and odd number of rows and cols.';
    if (w.getChls() === 1 && A.getChls() > 1) w.extrude(A.getChls());
    if (w.getChls() !== A.getChls() && !(A.getChls() === 4 && w.getChls() === 3)) throw 'ConvolutionError: Kernel(' + w.getChls() + ') must be the same Chls as the image(' + A.getChls() + ').';

    w.flipXY();

    const accum = new Matrix().zeros(A.getRows(), A.getCols(), A.getChls()).fillAlpha(1);
    const pad = new Matrix().zeros(A.getRows() + Math.floor(w.getRows() / 2) * 2, A.getCols() + Math.floor(w.getCols() / 2) * 2, A.getChls())
    A.copy(pad, {i: Math.floor(w.getRows() / 2), j: Math.floor(w.getCols() / 2)});

    for (let i = 0; i < accum.getRows(); i++)
      for (let j = 0; j < accum.getCols(); j++)
        for (let k = 0; k < accum.getChls() && k < 3; k++)
          for (let wi = 0; wi < w.getRows(); wi++)
            for (let wj = 0; wj < w.getCols(); wj++)
              accum.set(i, j, accum.get(i, j, k) + pad.get(i + wi, j + wj, k) * w.get(wi, wj, k), k);

    this.normalize(accum);
    accum.copy(A);
    return A;
  }

  /**
   * @summary Clips all pixel channels from 0-1.
   * @param {Matrix} A - A Matrix to normalize.
   * @returns {Matrix} The normalized matrix.
   */
  normalize(A) {
    A.applyAll((i, j, k) => {
      A.set(i, j, clip(A.get(i, j, k), 0, 1), k);
    })
    return A;
  }

  /** SELF-TRANSFORMATIONS **/

  /**
   * @summary Crops an image Matrix between two corners.
   * @param {Matrix} A  - The Matrix to crop.
   * @param {Number} x1 - Corner 1 x-coordinate.
   * @param {Number} y1 - Corner 1 y-coordinate.
   * @param {Number} x2 - Corner 2 x-coordinate.
   * @param {Number} y2 - Corner 2 y-coordinate.
   * @returns {Matrix} The cropped image Matrix.
   */
  crop(A, x1, y1, x2, y2) {
    const offX = Math.min(x1, x2);
    const offY = Math.min(y1, y2);
    const crop = new Matrix(Math.abs(x2 - x1), Math.abs(y2 - y1), A.getChls())
    crop.apply((i, j) => {
      crop.set(i, j, A.get(i + offX, j + offY))
    })
    return crop;
  }

  /**
   * @summary Grayscales an image Matrix.
   * @param {Matrix} A    - The matrix to grayscale.
   * @param {String} type - The type of grayscale to use. ['normal' | 'ITU-R'].
   * @returns {Matrix} The grayscaled Matrix.
   */
  gray(A, type) {
    if (type === 'ITU-R')
      A.apply((i, j) => {
        const v = A.get(i, j, 0) * 0.299 + A.get(i, j, 1) * 0.587 + A.get(i, j, 2) * 0.114;
        A.setPixel(i, j, v, v, v);
      })
    else if (type === 'normal' || type == null)
      A.apply((i, j) => {
        const v = (A.get(i, j, 0) + A.get(i, j, 1) + A.get(i, j, 2)) / 3;
        A.setPixel(i, j, v, v, v);
      })
    else throw 'GrayError: ' + type + ' is not an accepted type for gray.';
    return A;
  }

  /**
   * @summary Inverts the colored pixel channels of an image Matrix.
   * @param {Matrix} A - The Matrix to invert.
   * @returns {Matrix} The inverted Matrix.
   */
  invert(A) {
    A.apply((i, j) => {
      A.setPixel(i, j, 1 - A.get(i, j, 0), 1 - A.get(i, j, 1), 1 - A.get(i, j, 2));
    })
    return A;
  }

  /**
   * @summary Pixelizes an image Matrix.
   * @param {*} A    - The Matrix to pixelize.
   * @param {*} size - The size of each pixel.
   * @returns {Matrix} The pixelized Matrix.
   */
  pixelize(A, size) {
    let pixel = Array();
    const area = size * size;
    for (let i = 0; i < A.rows; i+=size) {
      for (let j = 0; j < A.cols; j+=size) {
        pixel = [0, 0, 0];
        for (let i2 = i; i2 < i + size && i2 < A.rows; i2++)
          for (let j2 = j; j2 < j + size && j2 < A.cols; j2++)
            for (let k = 0; k < 3; k++)
              pixel[k] += A.get(i2, j2, k);

        for (let p = 0; p < 3; p++)
          pixel[p] /= area;

        for (let i2 = i; i2 < i + size && i2 < A.rows; i2++)
          for (let j2 = j; j2 < j + size && j2 < A.cols; j2++)
            A.setPixel(i2, j2, pixel[0], pixel[1], pixel[2], 1);
      }
    }
    return A;
  }

  /** BLENDS **/

  /**
   * @summary Applies additive blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  addition(A, B) {
    A.applyAllPixels((i, j, k) => {
      A.set(i, j, A.get(i, j, k) + B.get(i, j, k), k);
    })
    return A;
  }

  /**
   * @summary Applies subtractive blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  subtraction(A, B) {
    A.applyAllPixels((i, j, k) => {
      A.set(i, j, A.get(i, j, k) - B.get(i, j, k), k);
    })
    return A;
  }

  /**
   * @summary Applies multiplicative blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  multiply(A, B) {
    A.applyAllPixels((i, j, k) => {
      A.set(i, j, A.get(i, j, k) * B.get(i, j, k), k);
    })
    return A;
  }

  /**
   * @summary Applies dividied blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  divide(A, B) {
    A.applyAllPixels((i, j, k) => {
      A.set(i, j, A.get(i, j, k) / B.get(i, j, k), k);
    })
    return A;
  }

  /**
   * @summary Applies differencial blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  difference(A, B) {
    A.applyAllPixels((i, j, k) => {
      A.set(i, j, Math.abs(A.get(i, j, k) + B.get(i, j, k)), k);
    })
    return A;
  }

  /**
   * @summary Applies screened blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  screen(A, B) {
    A.applyAllPixels((i, j, k) => {
      A.set(i, j, 1 - (1 - A.get(i, j, k)) * (1 - B.get(i, j, k)), k);
    })
    return A;
  }

  /**
   * @summary Applies overlay blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  overlay(A, B) {
    A.applyAllPixels((i, j, k) => {
      if (A.get(i, j, k) < 0.5)
        A.set(i, j, 2 * A.get(i, j, k) * B.get(i, j, k), k);
      else
        A.set(i, j, 1 - 2 * (1 - A.get(i, j, k)) * (1 - B.get(i, j, k)), k);
    })
    return A;
  }

  /**
   * @summary Applies normal blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  normal(A, B) {
    A.applyAllPixels((i, j, k) => {
      const nuA = A.get(i, j, 3) + B.get(i, j, 3) * (1 - A.get(i, j, 3));
      A.set(i, j, (A.get(i, j, k) * A.get(i, j, 3) + B.get(i, j, k) * B.get(i, j, 3) * (1 - A.get(i, j, 3))) / nuA, k);
    })
    return A;
  }

  /**
   * @summary Applies light blending to the Matrix.
   * @param {Matrix} A    - The Matrix to apply blend to.
   * @param {Matrix} B    - The Matrix filter to use for blending.
   * @param {String} type - The type of light to apply to the Matrix. ['soft' | 'hard' | 'vivid' | 'linear'].
   * @returns {Matrix} The blended Matrix.
   */
  light(A, B, type) {
    if (type === 'soft')
      A.applyAllPixels((i, j, k) => {
        if (A.get(i, j, k) < 0.5)
          A.set(i, j, 2 * A.get(i, j, k) * B.get(i, j, k) + Math.pow(A.get(i, j, k), 2) * (1 - 2 * B.get(i, j, k)), k);
        else
          A.set(i, j, 2 * A.get(i, j, k) * (1 - B.get(i, j, k)) + Math.sqrt(A.get(i, j, k)) * (2 * B.get(i, j, k) - 1), k);
      })
    else if (type === 'hard')
      A.applyAllPixels((i, j, k) => {
        if (A.get(i, j, k) < 0.5)
          A.set(i, j, 2 * A.get(i, j, k) * B.get(i, j, k), k);
        else
          A.set(i, j, 1 - 2 * (1 - A.get(i, j, k)) * (1 - B.get(i, j, k)), k);
      })
    else if (type === 'vivid') {
      this.dodge(A, B, 'color');
      this.burn(A, B, 'color');
    }
    else if (type === 'linear') {
      this.dodge(A, B, 'linear');
      this.burn(A, B, 'linear');
    }
    else throw 'LightError: ' + type + ' is not an accepted type for light().';
    return A;
  }
  
  /**
   * @summary Applies dodge blending to the Matrix.
   * @param {Matrix} A    - The Matrix to apply blend to.
   * @param {Matrix} B    - The Matrix filter to use for blending.
   * @param {String} type - The type of dodge to apply to the Matrix. ['screen' | 'color' | 'linear' | 'divide'].
   * @returns {Matrix} The blended Matrix.
   */
  dodge(A, B, type) {
    if (type === 'screen') {
      this.invert(A)
      this.invert(B)
      this.multiply(A, B);
      this.invert(A);
      this.invert(B);
    }
    else if (type === 'color') {
      this.invert(B)
      this.divide(A, B);
      this.invert(B);
    }
    else if (type === 'linear') {
      this.addition(A, B);
    }
    else if (type === 'divide') {
      if (!B.isWhite()) {
        this.dodge(A, B, 'color');
      }
    }
    else throw 'DodgeError: ' + type + ' is not an accepted type for dodge().';
    return A;
  }

  /**
   * @summary Applies burn blending to the Matrix.
   * @param {Matrix} A    - The Matrix to apply blend to.
   * @param {Matrix} B    - The Matrix filter to use for blending.
   * @param {String} type - The type of burn to apply to the Matrix. ['multiply' | 'color' | 'linear'].
   * @returns {Matrix} The blended Matrix.
   */
  burn(A, B, type) {
    if (type === 'multiply') {
      this.multiply(A, B);
    }
    else if (type === 'color') {
      this.invert(A);
      this.divide(A, B);
      this.invert(A);
    }
    else if (type === 'linear') {
      A.applyAllPixels((i, j, k) => {
        A.set(i, j, A.get(i, j, k) + B.get(i, j, k) - 1, k);
      })
    }
    else throw 'BurnError: ' + type + ' is not an accepted type for burn().';
    return A;
  }

  /**
   * @summary Applies darken blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  darken(A, B) {
    A.applyAllPixels((i, j, k) => {
      A.set(i, j, Math.min(A.get(i, j, k), B.get(i, j, k)), k);
    })
    return A;
  }

  /**
   * @summary Applies lighten blending to the Matrix.
   * @param {Matrix} A - The Matrix to apply blend to.
   * @param {Matrix} B - The Matrix filter to use for blending.
   * @returns {Matrix} The blended Matrix.
   */
  lighten(A, B) {
    A.applyAllPixels((i, j, k) => {
      A.set(i, j, Math.max(A.get(i, j, k), B.get(i, j, k)), k);
    })
    return A;
  }

  /** CONVOLUTIONS **/

  /**
   * @summary Applies edge detection convolution to the Matrix.
   * @param {Matrix} A     - The Matrix to apply convolution to.
   * @param {Matrix} level - The level of edge detection. [1 | 2 | 3].
   * @returns {Matrix} The convoluted Matrix.
   */
  edgeDetect(A, level=1) {
    if (level === 1)
      this.convolution(A, Kernel.edgeDetection1());
    else if (level === 2)
      this.convolution(A, Kernel.edgeDetection2());
    else if (level === 3)
      this.convolution(A, Kernel.edgeDetection3());
    else throw 'EdgeDectectionError: ' + level + ' is not an accepted level.';
    return A;
  }

  /**
   * @summary Applies emboss convolution to the Matrix.
   * @param {Matrix} A - The Matrix to apply convolution to.
   * @returns {Matrix} The convoluted Matrix.
   */
  emboss(A) {
    this.convolution(A, Kernel.emboss())
    this.gray(A, 'ITU-R');
    return A;
  }

  /**
   * @summary Applies kirsch convolution to the Matrix.
   * @param {Matrix} A    - The Matrix to apply convolution to.
   * @param {String} mode - The direction of kirsch to apply. ['right' | 'topRight' | 'top' | 'topLeft' | 'left' | 'bottomLeft' | 'bottom' | 'bottomRight'].
   * @returns {Matrix} The convoluted Matrix.
   */
  kirsch(A, mode) {
    if (mode === 'right')
      this.convolution(A, Kernel.kirschRight());
    else if (mode === 'topRight')
      this.convolution(A, Kernel.kirschTopRight());
    else if (mode === 'top')
      this.convolution(A, Kernel.kirschTop());
    else if (mode === 'topLeft')
      this.convolution(A, Kernel.kirschTopLeft());
    else if (mode === 'left')
      this.convolution(A, Kernel.kirschLeft());
    else if (mode === 'bottomLeft')
      this.convolution(A, Kernel.kirschBottomLeft());
    else if (mode === 'bottom')
      this.convolution(A, Kernel.kirschBottom());
    else if (mode === 'bottomRight')
      this.convolution(A, Kernel.kirschBottomRight());
    else throw 'KirschError: ' + mode + ' is not an accepted kirsch mode.';
    return A;
  }

  /**
   * @summary Applies laplacian convolution to the matrix.
   * @param {Matrix} A - The matrix to laplace.
   * @returns {Matrix} The laplaced Matrix.
   */
  laplace(A) {
    this.convolution(A, Kernel.laplacian());
    return A;
  }

  /**
   * @summary Applies prewitt convolution to the Matrix.
   * @param {Matrix} A - The Matrix to apply convolution to.
   * @returns {Matrix} The convoluted Matrix.
   */
  prewitt(A) {
    this.convolution(A, Kernel.prewitt());
    return A;
  }

  /**
   * @summary Applies sharp convolution to the Matrix.
   * @param {Matrix} A - The Matrix to apply convolution to.
   * @returns {Matrix} The convoluted Matrix.
   */
  sharp(A, amount) {
    this.convolution(A, Kernel.sharp(amount));
    return A;
  }

  /**
   * @summary Applies sobel convolution to the Matrix.
   * @param {Matrix} A    - The Matrix to apply convolution to.
   * @param {String} mode - The direction of sobel to apply. ['right' | 'top' | 'left' | 'bottom'].
   * @returns {Matrix} The convoluted Matrix.
   */
   sobel(A, mode) {
    if (mode === 'right')
      this.convolution(A, Kernel.sobelRight());
    else if (mode === 'top')
      this.convolution(A, Kernel.sobelTop());
    else if (mode === 'left')
      this.convolution(A, Kernel.sobelLeft());
    else if (mode === 'bottom')
      this.convolution(A, Kernel.sobelBottom());
    else throw 'SobelError: ' + mode + ' is not an accepted sobel mode.';
    return A;
  }

  /**
   * @summary Applies unsharp convolution to the Matrix.
   * @param {Matrix} A - The Matrix to apply convolution to.
   * @returns {Matrix} The convoluted Matrix.
   */
  unsharp(A, size) {
    this.convolution(A, this.getKernel({type: 'unsharp', size: size}));
    return A;
  }

  /**
   * @summary Applies blur convolution to the Matrix.
   * @param {Matrix} A    - The Matrix to apply convolution to.
   * @param {String} mode - The type of blur to apply. ['gaussian' | 'box'].
   * @param {Number} size - The size of the gaussian blur kernel.
   * @returns {Matrix} The convoluted Matrix.
   */
  blur(A, mode, size) {
    if (mode === 'gaussian') 
      Kernel.gaussianBlur(size).forEach(w => {
        this.convolution(A, w);
      });
    else if (mode === 'box')
      this.convolution(A, Kernel.boxBlur());
    else throw 'BlurError: ' + mode + ' is not an accepted type for light().';
    return A;
  }
}

/**
 * @summary Loads pixels from a file into an ndarray.
 * @param {String} path - Path of an image to load.
 * @returns {Promise} The Promise returns an ndarray of the image pixels.
 */
function getImage(path) {
  return new Promise((resolve, reject) => {
    getPixels(path, (err, pixels) => {
      if (err) reject(err);
      else resolve(pixels);
    })
  })
}

/**
 * @summary Saves an ndarray of pixels to a file.
 * @param {String} path    - The path to save the image to.
 * @param {ndarray} stream - The ndarray of pixels to save.
 */
 function saveImg(path, stream) {
  const file = fs.createWriteStream(path);
  const split = path.split('.');
  savePixels(stream, split[split.length - 1]).pipe(file);
}

/**
 * @summary Keeps the val between the inclusive lo and hi range.
 * @param {Number} val - Value to clip.
 * @param {Number} lo  - Range low value.
 * @param {Number} hi  - Range high value.
 * @returns {Number} The clipped value.
 */
function clip(val, lo, hi) {
  if (val < lo) return lo;
  else if (val > hi) return hi;
  else return val;
}