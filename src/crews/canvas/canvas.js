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
  function CanvasActor() {
    this.base();

    this._drawingCache = null;
    this.width = 0;
    this.height = 0;

    this.listen('enter', function(pData) {
      this.invalidate();
    });
  }
  theatre.inherit(CanvasActor, theatre.Actor);

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
      },
      writable: true
    },

    /**
     * Overload this in your subclass to draw your Actor.
     * @param {CanvasRenderingContext2D} pContext The rendering context.
     */
    draw: {
      value: function(pContext) {
        pContext.clearRect(0, 0, this.width, this.height);
      },
      writable: true
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
        var tClipUntil = -1;
        var tClipCanvas = null;
        var tClippedCanvas = null;
        var tClippedContext = null;
        var tMainContext = pContext;
        for (var i = 0, il = tActors.length; i < il; i++) {
          var tActor = tActors[i];
          var tMatrix = tActor.matrix;
          var tCurrentContext = tMainContext;

          if (tActor.dispatchDraw !== void 0) {
            if (tActor.clipDepth > 0) {
              tClipUntil = tActor.layer + tActor.clipDepth;
              tClipCanvas = global.document.createElement('canvas');
              tClipCanvas.width = pContext.canvas.width;
              tClipCanvas.height = pContext.canvas.height;
              tClippedCanvas = global.document.createElement('canvas');
              tClippedCanvas.width = pContext.canvas.width;
              tClippedCanvas.height = pContext.canvas.height;
              tCurrentContext = tClipCanvas.getContext('2d');
              tCurrentContext.scale(0.05, 0.05);
              tClippedContext = tClippedCanvas.getContext('2d');
              tClippedContext.scale(0.05, 0.05);
            } else if (!tActor.clipDepth && tActor.layer < tClipUntil) {
              tCurrentContext = tClippedContext;
            }
            tCurrentContext.save();
            tCurrentContext.transform(
              tMatrix.a,
              tMatrix.b,
              tMatrix.c,
              tMatrix.d,
              tMatrix.e,
              tMatrix.f
            );
            tActor.dispatchDraw(tCurrentContext);
            tCurrentContext.restore();

            if (tClipUntil !== -1) {

              if (i === il - 1 || !tActor.clipDepth && tActor.layer >= tClipUntil) {
                var tBackup = tCurrentContext.globalCompositeOperation;
                tCurrentContext.globalCompositeOperation = 'destination-in';
                tCurrentContext.save();
                tCurrentContext.scale(20, 20);
                tCurrentContext.drawImage(tClipCanvas, 0, 0);
                tCurrentContext.restore();
                tCurrentContext.globalCompositeOperation = tBackup;

                tMainContext.save();
                tMainContext.scale(20, 20);
                tMainContext.drawImage(tClippedCanvas, 0, 0);
                tMainContext.restore();

                tClipUntil = -1;
                tClipCanvas = null;
                tClippedCanvas = null;
                tClippedContext = null;
              }
            }
          }
        }

        this.isInvalidated = false;
      },
      writable: true
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
      },
      writable: true
    },

    /**
     * @override
     */
    invalidate: {
      value: function() {
        theatre.Actor.prototype.invalidate.call(this);
        if (this.parent) {
          this.parent.invalidate();
        }
      },
      writable: true
    }
  });

  theatre.define('theatre.crews.canvas.CanvasActor', CanvasActor);

})(this);
