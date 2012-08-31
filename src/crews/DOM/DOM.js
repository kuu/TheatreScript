/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  function onEnter(pData) {
    pData = pData.data;
    this.styles = pData.styles || null;
    this.width = pData.width || 'auto';
    this.height = pData.height || 'auto';
    this.container = pData.container || global.document.body;

    var tElement = this.element = this.elementTemplate.cloneNode(true);
    var tStyle = tElement.style;
    var tProtoStyles = this.styles;

    tStyle.zIndex = this.layer;
    tStyle.position = 'absolute';
    tStyle.width = typeof this.width === 'string' ? this.width : this.width + 'px';
    tStyle.height = typeof this.height === 'string' ? this.height : this.height + 'px';

    if (tProtoStyles !== null) {
      for (var tKey in tProtoStyles) {
        tStyle[tKey] = tProtoStyles[tKey];
      }
    }

    this.invalidate();
  }

  function onLeave() {
    if (this.element.parentNode !== null) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  /**
   * An Actor for working with DOM elements.
   * @constructor
   * @name theatre.crews.dom.DOMActor
   * @augments theatre.Actor
   */
  function DOMActor() {
    this.base();

    /**
     * CSS styles (of a HTMLElement style field) to apply to this Actor.
     * @type Object
     * @default null
     */
    this.styles = null;

    this.width = 'auto';

    this.height = 'auto';

    this.container = global.document.body;

    this.listen('enter', onEnter);
    this.listen('leave', onLeave);
  }
  theatre.inherit(DOMActor, theatre.Actor);

  Object.defineProperties(DOMActor.prototype, /** @lends theatre.crews.dom.DOMActor# */ {
    /**
     * The HTMLElement that the DOMActor uses to create it's own elements.
     * @type HTMLElement
     * @default HTMLDivElement
     */
    elementTemplate: {
      value: document.createElement('div'),
      writable: true
    },

    /**
     * @override
     */
    act: {
      value: function() {
        var tElement = this.element,
            tMatrix = this.matrix;
        tElement.style.webkitTransform = 'matrix3d(' + tMatrix.a + ',' + tMatrix.b + ',0,0,' + tMatrix.c + ',' + tMatrix.d + ',0,0,0,0,1,0,' + tMatrix.e + ',' + tMatrix.f + ',0,1)';
        if (!this.hasParentNode) {
          this.hasParentNode = true;
          if (this.parent instanceof DOMActor) {
            this.parent.element.appendChild(tElement);
          } else {
            this.container.appendChild(tElement);
          }
        }
      },
      writable: true
    }
  });

  theatre.define('theatre.crews.dom.DOMActor', DOMActor);

})(this);
