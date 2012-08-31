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
  } else if (typeof MozCSSMatrix !== 'undefined') {
    Matrix = MozCSSMatrix;
  }

  global.theatre.define('theatre.Matrix', Matrix);

}(this));
