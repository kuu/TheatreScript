(function(global) {

  var theatre = global.theatre;

  theatre.define('crews.canvas.CanvasProp', CanvasProp, theatre);

  var mCache = new theatre.crews.canvas.Cache();

  theatre.crews.canvas.backingCache = mCache;

  function CanvasProp(pBackingCanvas, pWidth, pHeight) {
    this.base();

    this._drawingCache = null;
    this.width = pWidth || pBackingCanvas.width;
    this.height = pHeight || pBackingCanvas.height;
    this.cacheDrawResult = true;
    this.cacheWithClass = true;
    this.backingCanvas = pBackingCanvas;
  }
  theatre.inherit(CanvasProp, theatre.DrawingProp);

  var mDrawingPropOnAdd = theatre.DrawingProp.prototype.onAdd;

  CanvasProp.prototype.onAdd = function(pActor) {
    var tSelf = this;
    mDrawingPropOnAdd.call(this, pActor);

    pActor.on('invalidate', function() {
      var tProps = this.getProps(tSelf.type);
      for (var i = 0, il = tProps.length; i < il; i++) {
        tProps[i].dispatchDraw({
          context: tSelf.backingCanvas.getContext('2d')
        });
      }
    });
  };

  CanvasProp.prototype._classDrawingCache = null;

  CanvasProp.prototype.preDraw = function(pData) {
    var tContext = pData.context;
    var tCacheId;

    if (this.cacheDrawResult === true) {
      pData._isCached = true;

      if (this._drawingCache !== null) {
        tCacheId = this.getDrawingCacheId();
        mCache.drawOnTo(tCacheId, tContext, 0, 0);
        return false;
      } else {
        tCacheId = this.getDrawingCacheId();
        pData.context = mCache.getContext(tCacheId);
        this.draw(pData);
        pData.context = tContext;
        mCache.drawOnTo(tCacheId, tContext, 0, 0);
        return false;
      }
    }

    pData._isCached = false;

    tContext.save();
  };

  /**
   * Overload this in your subclass to draw your Actor.
   * @param {Object} pData The data passed.
   */
  CanvasProp.prototype.draw = function(pData) {
    pData.context.clearRect(0, 0, this.width, this.height);
  };

  CanvasProp.prototype.postDraw = function(pData) {
    if (pData._isCached === false) {
      pData.context.restore();
    }
  }

  CanvasProp.prototype.getDrawingCacheId = function() {
    var tCacheId = null;

    if (this.cacheDrawResult === true) {
      if (this.cacheWithClass === true) {
        if (this.__proto__._classDrawingCache !== null) {
          tCacheId = this._drawingCache = this.__proto__._classDrawingCache;
        } else {
          tCacheId = this._drawingCache = this.__proto__._classDrawingCache = mCache.request(
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
  };

  /**
   * Called right before drawing the actual child.
   * @param {Object} pData The data passed.
   * @param {theatre.Actor} pChildActor The child Actor about to be drawn.
   */
  CanvasProp.prototype.preDrawChild = function(pData, pChildActor) {
    var tMatrix = pChildActor.matrix;
    var tContext = pData.context;

    tContext.save();

    tContext.transform(
      tMatrix.a,
      tMatrix.b,
      tMatrix.c,
      tMatrix.d,
      tMatrix.e,
      tMatrix.f
    );
  };

  /**
   * Called right after dispatchDraw is called.
   * @param {Object} pData The data passed.
   * @param {theatre.Actor} pChildActor The child Actor that was just drawn.
   */
  CanvasProp.prototype.postDrawChild = function(pData, pChildActor) {
    pData.context.restore();
  };

}(this));