/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  var mCache = new theatre.crews.canvas.Cache();

  theatre.define('theatre.crews.canvas.CanvasActor', CanvasActor);

  theatre.crews.canvas.backingCache = mCache;

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
    this.cacheDrawResult = true;
    this.cacheWithClass = true;

    this.listen('enter', function(pData) {
      if (this.width === 0) {
        this.width = this.parent.width || 1;
      }
      if (this.height === 0) {
        this.height = this.parent.height || 1;
      }
      this.invalidate();
    });
  }
  theatre.inherit(CanvasActor, theatre.Actor);

  Object.defineProperties(CanvasActor.prototype, /** @lends theatre.crews.dom.CanvasActor# */ {

    _classDrawingCache: {
      value: null,
      writable: true
    },

    /**
     * Called before draw() is called.
     * This will get called even when redrawing cache.
     * Therefore you should not do anything heavy in here.
     * The context passed here will always be the same as this Actors parent.
     * @param {CanvasRenderingContext2D} pContext The rendering context.
     */
    preDraw: {
      value: function(pContext) {
        // Do nothing by default
      },
      writable: true
    },

    /**
     * Called after draw() is called.
     * This will get called even when redrawing cache.
     * Therefore you should not do anything heavy in here.
     * The context passed here will always be the same as this Actors parent.
     * @param {CanvasRenderingContext2D} pContext The rendering context.
     */
    postDraw: {
      value: function(pContext) {
        // Do nothing by default
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
     * Gets the drawing canvas context to use for
     * drawing the given child Actor.
     * This allows customizing each individual child
     * Actor while drawing.
     * @param {CanvasRenderingContext2D} pParentContext The context that the parent is currently using.
     * @param {theatre.Actor} pActor The child Actor.
     * @return {CanvasRenderingContext2D} The context to render to for this child.
     */
    getDrawingContextForChild: {
      value: function(pParentContext, pActor) {
        return pParentContext;
      },
      writable: true
    },

    /**
     * Called just before dispatching the dispatch related
     * functions for children.
     * Will not be called if there are no children.
     * @param {CanvasRenderingContext2D} pContext The context for this Actor.
     */
    preDrawChildren: {
      value: function(pContext) {
        // Do nothing. Overload this.
      },
      writable: true
    },

    /**
     * Called just before dispatching the dispatch related
     * functions for children.
     * Will not be called if there are no children.
     * @param {CanvasRenderingContext2D} pContext The context for this Actor.
     */
    postDrawChildren: {
      value: function(pContext) {
        // Do nothing. Overload this.
      },
      writable: true
    },

    /**
     * Called right before dispatchDraw is called.
     * @param {CanvasRenderingContext2D} pParentContext The context of this Actor.
     * @param {CanvasRenderingContext2D} pChildContext The context of the child Actor about to be drawn.
     * @param {theatre.Actor} pChildActor The child Actor about to be drawn.
     */
    preDispatchDraw: {
      value: function(pParentContext, pChildContext, pChildActor) {
        var tMatrix = pChildActor.matrix;
        pParentContext.transform(
          tMatrix.a,
          tMatrix.b,
          tMatrix.c,
          tMatrix.d,
          tMatrix.e,
          tMatrix.f
        );
      },
      writable: true
    },

    /**
     * Called right after dispatchDraw is called.
     * @param {CanvasRenderingContext2D} pParentContext The context of this Actor.
     * @param {CanvasRenderingContext2D} pChildContext The context of the child Actor that was just drawn.
     * @param {theatre.Actor} pChildActor The child Actor that was just drawn.
     */
    postDispatchDraw: {
      value: function(pParentContext, pChildContext, pChildActor) {
        // Do nothing. This is for overloading.
      },
      writable: true
    },

    getDrawingCacheId: {
      value: function() {
        var tCacheId = null;

        if (this.cacheDrawResult === true) {
          if (this.cacheWithClass === true) {
            if (this.__proto__._classDrawingCache !== null) {
              tCacheId = this.__proto__._classDrawingCache;
            } else {
              tCacheId = this.__proto__._classDrawingCache = mCache.request(
                this.width || this.parent.width || 0,
                this.height || this.parent.height || 0
              );
            }
          } else {
            if (this._drawingCache !== null) {
              tCacheId = this._drawingCache;
            } else {
              this._drawingCache = tCacheId = mCache.request(
                this.width || this.parent.width || 0,
                this.height || this.parent.height || 0
              );
            }
          }
        }

        return tCacheId;
      },
      writable: true
    },

    /**
     * Dispatch a request to draw.
     * @param {CanvasRenderingContext2D} pContext The canvas context to draw to.
     */
    dispatchDraw: {
      value: function(pContext) {
        var tCacheId = this.getDrawingCacheId();

        if (tCacheId !== null) {
          if (!pContext) {
            pContext = mCache.getContext(tCacheId);
            if (this.isInvalidated === true) {
              pContext.save();
              this.preDraw(pContext);
              this.draw(pContext);
              this.postDraw(pContext);
              pContext.restore();
            }
          } else {
            if (this.isInvalidated === false) {
              pContext.save();
              this.preDraw(pContext);
              mCache.drawOnTo(tCacheId, pContext, 0, 0);
              this.postDraw(pContext);
              pContext.restore();
            } else {
              pContext.save();
              this.preDraw(pContext);
              this.draw(mCache.getContext(tCacheId));
              mCache.drawOnTo(tCacheId, pContext, 0, 0);
              this.postDraw(pContext);
              pContext.restore();
            }
          }
        } else {
          if (!pContext) {
            return;
          }
          pContext.save();
          this.preDraw(pContext);
          this.draw(pContext);
          this.postDraw(pContext);
          pContext.restore();
        }

        var tActors = this.getActors();
        var tNumOfActors = tActors.length;

        if (tNumOfActors !== 0) {
          this.preDrawChildren(pContext);
        }

        for (var i = 0; i < tNumOfActors; i++) {
          var tActor = tActors[i];
          if (tActor.dispatchDraw === void 0) {
            continue;
          }
          var tChildContext = this.getDrawingContextForChild(pContext, tActor);

          tChildContext.save();
          if (tChildContext !== pContext) {
            pContext.save();
          }

          this.preDispatchDraw(pContext, tChildContext, tActor);

          tChildContext.save();
          if (tChildContext !== pContext) {
            pContext.save();
          }

          tActor.dispatchDraw(tChildContext);

          tChildContext.restore();
          if (tChildContext !== pContext) {
            pContext.restore();
          }

          this.postDispatchDraw(pContext, tChildContext, tActor);

          tChildContext.restore();
          if (tChildContext !== pContext) {
            pContext.restore();
          }
        }

        if (tNumOfActors !== 0) {
          this.postDrawChildren(pContext);
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
            var tCanvas = mCache.getContext(this._drawingCache).canvas;
            tCanvas.style.zIndex = this.layer;
            this.parent.element.appendChild(tCanvas);
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

})(this);
