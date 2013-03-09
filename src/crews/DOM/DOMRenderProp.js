/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  /**
   * @class
   * @extends {theatre.crews.render.RenderProp}
   */
  var DOMRenderProp = (function(pSuper) {
    /**
     * @constructor
     */
    function DOMRenderProp() {
      pSuper.call(this);

    }

    DOMRenderProp.prototype = Object.create(pSuper.prototype);
    DOMRenderProp.prototype.constructor = DOMRenderProp;

    return DOMRenderProp;
  })(theatre.crews.render.RenderProp);

}(this));