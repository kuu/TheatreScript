/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;
  theatre.crews.render = theatre.crews.render || {};

  var Canvas = global.benri.draw.Canvas;
  var CanvasRenderable = global.benri.render.CanvasRenderable;

  /**
   * @class
   * @extends {theatre.crews.render.RenderProp}
   */
  var CanvasRenderProp = (function(pSuper) {
    function CanvasRenderProp(pRenderContext, pWidth, pHeight) {
      pSuper.call(this, pRenderContext);
      this.canvas = new Canvas(pWidth, pHeight);
      this.renderable = new CanvasRenderable(this.canvas);
    }

    CanvasRenderProp.prototype = Object.create(pSuper.prototype);
    CanvasRenderProp.prototype.constructor = CanvasRenderProp;

    CanvasRenderProp.prototype.render = function(pData) {
      this.context.render(this.renderable);
    };

    return CanvasRenderProp;
  })(theatre.crews.render.RenderProp);

  theatre.crews.render.CanvasRenderProp = CanvasRenderProp;

}(this));