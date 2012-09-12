(function(global) {

  var theatre = global.theatre;

  theatre.define('theatre.crews.canvas.Cache', Cache);

  var mTotalUsedSize = 0;

  /**
   * @constructor
   */
  function Cache() {
    /**
     * The actual cache.
     * A map of cache ids to canvases.
     * @private
     * @type {Object.<string, HTMLCanvasElement>}
     */
    this._map = {};

    /**
     * The default maximum size of this cache.
     * The minimum maximum supported texture size for GPU's on mobile
     * devices is 2048 x 2048. Therefore for now I've set it like that.
     * @type {number}
     */
    this.maxSize = 2048 * 2048;

    /**
     * The amount of space we have used.
     * @type {number}
     */
    this.usedSize = 0;

    /**
     * A counter for choosing ids.
     * @private
     * @type {number}
     */
    this._idCounter = 0;
  }

  /**
   * The total max size for all caches.
   * -1 means no limit.
   * @type {number}
   */
  Cache.totalMaxSize = -1;

  /**
   * Request some cache space from the cache system.
   * If there is space, this will allocate some cache
   * for you to use and will return a canvas context
   * to draw to that will be cached.
   * If there is not enough space, null will be returned
   * and you will have to handle things yourself.
   * @param  {number} pWidth  The width in pixels you want to allocate
   * @param  {number} pHeight The height in pixels you want to allocate
   * @return {string|null} The cache ID or null.
   */
  Cache.prototype.request = function(pWidth, pHeight) {
    var tDeltaSize = pWidth * pHeight;
    var tUsedSize = this.usedSize;
    var tNewSize = tUsedSize + tDeltaSize;
    var tMaxSize = this.maxSize;

    if (tNewSize > tMaxSize || (Cache.totalMaxSize !== -1 && (tNewSize > Cache.totalMaxSize))) {
      console.warn('Cache maximum size reached!', tMaxSize);
      return null;
    }

    var tNewId = '' + (++this._idCounter);

    var tCanvas = this._map[tNewId] = global.document.createElement('canvas');
    tCanvas.width = pWidth;
    tCanvas.height = pHeight;

    this.usedSize = tNewSize;

    mTotalUsedSize += tDeltaSize;

    return tNewId;
  };

  /**
   * Releases the given cache so that it can not be used
   * and can be freed from memory.
   * @param  {string} pId The ID of the cache to release
   */
  Cache.prototype.release = function(pId) {
    var tCache = this._map[pId];

    if (tCache === void 0) {
      return;
    }

    var tSize = tCache.width * tCache.height;

    this.usedSize -= tSize;
    mTotalUsedSize -= tSize;

    // Force memory to be gone.
    tCache.width = 0;
    tCache.height = 0;

    delete this._map[pId];
  };

  /**
   * Get's a context to draw on from the given cache.
   * @param  {string} pId The ID of the cache
   * @return {CanvasRenderingContext2D} The context.
   */
  Cache.prototype.getContext = function(pId) {
    var tCache = this._map[pId];

    if (tCache === void 0) {
      return null;
    }

    return tCache.getContext('2d');
  };

  /**
   * Draws the given cache on to another context.
   * @param  {string} pId           The cache ID to draw
   * @param  {CanvasRenderingContext2D} pOtherContext The context to render on to
   * @param  {number=0} pX          The X position to draw in to
   * @param  {number=0} pY          The Y position to draw in to
   * @param  {number=} pWidth       The width if given, otherwise the width of the cache
   * @param  {number=} pHeight      The height if given, otherwise the height of the cache
   */
  Cache.prototype.drawOnTo = function(pId, pOtherContext, pX, pY, pWidth, pHeight) {
    var tCanvas = this._map[pId];

    if (tCanvas === void 0) {
      return;
    }

    pOtherContext.drawImage(tCanvas, pX || 0, pY || 0, pWidth || tCanvas.width, pHeight || tCanvas.height);
  };

  /**
   * Destroys this Cache, freeing all memory associated with it.
   */
  Cache.prototype.destroy = function() {
    var tCanvas;
    var tMap = this._map;
    for (var i in tMap) {
      tCanvas = tMap[i];
      tCanvas.width = 0;
      tCanvas.height = 0;
    }

    this._map = null;
  };

}(this));