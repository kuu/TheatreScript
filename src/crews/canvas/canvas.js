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

    /**
     * Dispatch a request to draw.
     * @param {CanvasRenderingContext2D} pContext The canvas context to draw to.
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
