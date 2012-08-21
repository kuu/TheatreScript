/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  function onEnter() {
    var tCanvas = global.document.createElement('canvas');

    tCanvas.width = this.width || this.parent.width || 1;
    tCanvas.height = this.height || this.parent.height || 1;

    this.context = tCanvas.getContext('2d');

    this.invalidate();
  }

  /**
   * An Actor for working with a 2d canvas.
   * @constructor
   * @name theatre.crews.canvas.CanvasActor
   * @augments theatre.Actor
   */
  var CanvasActor = theatre.createActor('CanvasActor', theatre.Actor, function(pData) {
    this.width = pData.width || 0;

    this.height = pData.height || 0;

    this.context = null;

    this.listen('enter', onEnter);
  });

  var invalidateBackup = theatre.Actor.prototype.invalidate;

  Object.defineProperties(CanvasActor.prototype, /** @lends theatre.crews.dom.CanvasActor# */ {
    /**
     * Overload this in your subclass to draw your Actor.
     * @param {CanvasRenderingContext2D} pContext The rendering context.
     */
    draw: {
      value: function(pContext) {
        pContext.clearRect(0, 0, this.width, this.height);
      }
    },

    /**
     * Returns the previous draw result
     * @return {HTMLCanvasElement} The draw result.
     */
    getDrawResult: {
      value: function() {
        var tCtx = this.context;
        if (this.isInvalidated !== true) {
          return tCtx.canvas;
        }
        tCtx.save();
        this.draw(tCtx);
        tCtx.restore();
        var tActors = this.getActors();
        for (var i = 0, il = tActors.length; i < il; i++) {
          var tActor = tActors[i],
              tMatrix = tActor.matrix;

          var tResult = tActor.getDrawResult !== void 0 ? tActor.getDrawResult() : null;
          if (tResult !== null) {
            tCtx.save();
            tCtx.transform(
              tMatrix.a,
              tMatrix.b,
              tMatrix.c,
              tMatrix.d,
              tMatrix.e,
              tMatrix.f
            );
            tCtx.drawImage(tResult, 0, 0);
            tCtx.restore();
          }
        }
        return tCtx.canvas;
      }
    },

    /**
     * @override
     */
    act: {
      value: function() {
        var tCanvas = this.getDrawResult();
        
        if (this.isAdded !== true) {
          this.isAdded = true;
          if (theatre.crews.dom && this.parent instanceof theatre.crews.dom.DOMActor) {
            tCanvas.style.zIndex = this.layer;
            this.parent.element.appendChild(tCanvas);
          }
        }
      }
    },

    /**
     * @override
     */
    invalidate: {
      value: function() {
        invalidateBackup.call(this);
        if (this.parent) this.parent.invalidate();
      }
    }
  });

  theatre.define('theatre.crews.canvas.CanvasActor', CanvasActor);

})(this);
