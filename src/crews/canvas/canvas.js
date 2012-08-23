/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  /**
   * An Actor for working with a 2d canvas.
   * @constructor
   * @name theatre.crews.canvas.CanvasActor
   * @augments theatre.Actor
   */
  var CanvasActor = theatre.createActor('CanvasActor', theatre.Actor, function(pData) {
    this.width = pData.width || 0;

    this.height = pData.height || 0;

    this._drawingCache = null;

    this.invalidate();
  });

  var invalidateBackup = theatre.Actor.prototype.invalidate;

  Object.defineProperties(CanvasActor.prototype, /** @lends theatre.crews.dom.CanvasActor# */ {

    /**
     * Get's or creates a drawing cache that can
     * be used to draw on and stored permanently.
     * @return {CanvasRenderingContext2D} The cache.
     */
    getDrawingCache: {
      value: function() {
        if (this._drawingCache !== null) {
          return this._drawingCache;
        }

        var tCanvas = global.document.createElement('canvas');

        tCanvas.width = this.width || this.parent.width || 1;
        tCanvas.height = this.height || this.parent.height || 1;

        return this._drawingCache = tCanvas.getContext('2d');
      }
    },

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
     * Dispatch a request to draw.
     */
    dispatchDraw: {
      value: function(pContext) {
        if (!pContext && this.parent.dispatchDraw === void 0) {
          pContext = this.getDrawingCache();
        }

        pContext.save();
        this.draw(pContext);
        pContext.restore();

        var tActors = this.getActors();
        for (var i = 0, il = tActors.length; i < il; i++) {
          var tActor = tActors[i],
              tMatrix = tActor.matrix;

          if (tActor.dispatchDraw !== void 0) {
            pContext.save();
            pContext.transform(
              tMatrix.a,
              tMatrix.b,
              tMatrix.c,
              tMatrix.d,
              tMatrix.e,
              tMatrix.f
            );
            tActor.dispatchDraw(pContext);
            pContext.restore();
          }
        }

        this.isInvalidated = false;
      }
    },

    /**
     * @override
     */
    act: {
      value: function() {
        this.dispatchDraw();
        
        if (this.isAdded !== true) {
          this.isAdded = true;
          if (theatre.crews.dom && this.parent instanceof theatre.crews.dom.DOMActor) {
            this._drawingCache.canvas.style.zIndex = this.layer;
            this.parent.element.appendChild(this._drawingCache.canvas);
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
