/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.crews.webgl = theatre.crews.webgl || {};
  theatre.crews.webgl.GLDrawingState = GLDrawingState;

  /**
   * @class
   * @extends {theatre.DrawingProp}
   */
  var WebGLProp = (function(pSuper) {
    function WebGLProp(pBackingCanvas, pWidth, pHeight) {
      pSuper.call(this);

      this.width = pWidth || pBackingCanvas.width;
      this.height = pHeight || pBackingCanvas.height;
      this.backingCanvas = pBackingCanvas;
    }

    WebGLProp.prototype = Object.create(pSuper.prototype);

    return WebGLProp;
  })(theatre.DrawingProp);

  theatre.crews.webgl.WebGLProp = WebGLProp;

  var mDrawingPropOnAdd = theatre.DrawingProp.prototype.onAdd;

  WebGLProp.prototype.onAdd = function(pActor) {
    var tSelf = this;
    mDrawingPropOnAdd.call(this, pActor);

    pActor.on('invalidate', function() {
      var tProps = this.getProps(tSelf.type);
      for (var i = 0, il = tProps.length; i < il; i++) {
        tProps[i].dispatchDraw(new GLDrawingState(tSelf.backingCanvas.getContext('experimental-webgl')));
      }
    });
  };

  /**
   * @constructor
   */
  function GLDrawingState(pContext) {
    var tCanvas = pContext.canvas;

    this.context = pContext;

    pContext.disable(pContext.DEPTH_TEST);
    pContext.enable(pContext.BLEND);
    pContext.blendFunc(pContext.ONE, pContext.ONE_MINUS_SRC_ALPHA);

    // Make this context orthographic

    var tMatrix = new theatre.Matrix().translate(-1, 1);

    var tRight = tCanvas.width / 2;
    var tLeft = -tRight;
    var tBottom = tCanvas.height / 2;
    var tTop = -tBottom;
    var tFar = 1;
    var tNear = 0;

    var tWidth = tRight - tLeft;
    var tHeight = tTop - tBottom;
    var tDistance = tFar - tNear;

    var tX = (tRight + tLeft) / tWidth;
    var tY = (tTop + tBottom) / tHeight;
    var tZ = (tFar + tNear) / tDistance;

    var tViewportMatrix = new theatre.Matrix();
    tViewportMatrix.m11 = 2 / tWidth;
    tViewportMatrix.m22 = 2 / tHeight;
    tViewportMatrix.m33 = -2 / tDistance;
    tViewportMatrix.m41 = -tX;
    tViewportMatrix.m42 = -tY;
    tViewportMatrix.m43 = -tZ;

    //tViewportMatrix = tViewportMatrix.scale(1, -1, 1);

    this.matrix = tMatrix.multiply(tViewportMatrix);

    this.stack = [];
  }

  GLDrawingState.prototype.save = function() {
    this.stack.push({
      matrix: this.matrix,
      context: this.context
    });
  };

  GLDrawingState.prototype.restore = function() {
    var tState = this.stack.pop();
    this.matrix = tState.matrix;
    this.context = tState.context;
  };

  /**
   * Called right before drawing the actual child.
   * @param {Object} pData The data passed.
   * @param {theatre.Actor} pChildActor The child Actor about to be drawn.
   */
  WebGLProp.prototype.preDrawChild = function(pData, pChildActor) {
    var tChildMatrix = pChildActor.matrix;

    pData.save();

    pData.matrix = pData.matrix.multiply(tChildMatrix);

    return true;
  };

  /**
   * Called right after dispatchDraw is called.
   * @param {Object} pData The data passed.
   * @param {theatre.Actor} pChildActor The child Actor that was just drawn.
   */
  WebGLProp.prototype.postDrawChild = function(pData, pChildActor) {
    pData.restore();
  };
});