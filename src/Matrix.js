/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

use('Theatre');

(function(global) {

  /**
   * An extension of an Array that allows you to use it as
   * a 2D Transformation Matrix.
   * @constructor
   * @name theatre.Matrix
   */
  var Matrix = typeof CSSMatrix !== 'undefined' ? CSSMatrix : WebKitCSSMatrix;

  global.theatre.define('theatre.Matrix', Matrix);

}(this));
