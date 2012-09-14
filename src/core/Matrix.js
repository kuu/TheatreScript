/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  /**
   * An extension of an Array that allows you to use it as
   * a 2D Transformation Matrix.
   * @constructor
   * @name theatre.Matrix
   */
  var Matrix;
  if (typeof CSSMatrix !== 'undefined') {
    Matrix = CSSMatrix;
  } else if (typeof WebKitCSSMatrix !== 'undefined') {
    Matrix = WebKitCSSMatrix;
  } else {
    Matrix = TheatreMatrix;
  }

  /**
   * A polyfill for CSSMatrix support only 2d functions.
   * @constructor
   */
  function TheatreMatrix(pMatrixString) {
    if (pMatrixString) {
      var tMatrix = this.setMatrixValue(pMatrixString);
      this.a = tMatrix.a;
      this.b = tMatrix.b;
      this.c = tMatrix.c;
      this.d = tMatrix.d;
      this.e = tMatrix.e;
      this.f = tMatrix.f;
    } else {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
  }

  TheatreMatrix.prototype.multiply = function(pThat) {
    var tMatrix = new TheatreMatrix();

    var tThisA = this.a;
    var tThisB = this.b;
    var tThisC = this.c;
    var tThisD = this.d;
    var tThisE = this.e;
    var tThisF = this.f;

    var tThatA = pThat.a;
    var tThatB = pThat.b;
    var tThatC = pThat.c;
    var tThatD = pThat.d;
    var tThatE = pThat.e;
    var tThatF = pThat.f;

    tMatrix.a = tThisA * tThatA + tThisB * tThatC;
    tMatrix.b = tThisA * tThatB + tThisB * tThatD;
    tMatrix.c = tThisC * tThatA + tThisD * tThatC;
    tMatrix.d = tThisC * tThatB + tThisD * tThatD;
    tMatrix.e = tThisE * tThatA + tThisF * tThatC + tThatE;
    tMatrix.f = tThisE * tThatB + tThisF * tThatD + tThatF;

    return tMatrix;
  };

  TheatreMatrix.prototype.inverse = function() {
    throw new Error();
  };

  TheatreMatrix.prototype.translate = function(pX, pY) {
    return this.multiply(1, 0, 0, 1, pX, pY);
  };

  TheatreMatrix.prototype.rotate = function(pX, pY) {
    throw new Error();
  };

  TheatreMatrix.prototype.rotateAxisAngle = function() {
    throw new Error();
  };

  TheatreMatrix.prototype.scale = function(pX, pY) {
    return this.multiply(pX, 0, 0, pY, 0, 0);
  };

  TheatreMatrix.prototype.setMatrixValue = function(pValue) {
    if (pValue.indexOf('matrix3d(') === 0) {
      throw Error();
    } else if (pValue.indexOf('matrix(') === 0) {
      throw Error();
    } else {
      throw new Error('Invalid Matrix');
    }
  };

  TheatreMatrix.prototype.skewX = function(pValue) {
    return this.multiply(1, 0, pValue, 1, 0, 0);
  };

  TheatreMatrix.prototype.skewY = function(pValue) {
    return this.multiply(1, pValue, 0, 1, 0, 0);
  };

  TheatreMatrix.prototype.toString = function() {
    return 'matrix3d(' + this.a + ',' + this.b + ',0,0,' + this.c + ',' + this.d + ',0,0,0,0,1,0,' + this.e + ',' + this.f + ',0,1)';
  };

  global.theatre.define('theatre.Matrix', Matrix);

}(this));
