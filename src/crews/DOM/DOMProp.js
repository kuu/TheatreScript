/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.crews.dom = theatre.crews.dom || {};

  /**
   * @class
   * @extends {theatre.DrawingProp}
   */
  /*var DOMProp = (function(pSuper) {
    function DOMProp(pElement, pStyles) {
      var tElement = null;

      pSuper.call(this);

      this.element = null;

      if (typeof pElement === 'string') {
        tElement = this.element = global.document.createElement(pElement);
      } else {
        tElement = this.element = pElement || null;
      }

      if (pStyles) {
        if (tElement === null) {
          tElement = this.element = this.elementTemplate.cloneNode(true);
        }

        var tStyle = tElement.style;

        for (var tKey in pStyles) {
          tStyle[tKey] = pStyles[tKey];
        }
      }
    }

    DOMProp.prototype = Object.create(pSuper.prototype);

    return DOMProp;
  })(theatre.DrawingProp);

  theatre.crews.dom.DOMProp = DOMProp;

  var mDrawingPropOnAdd = theatre.DrawingProp.prototype.onAdd;
  var mDrawingPropOnRemove = theatre.DrawingProp.prototype.onRemove;

  DOMProp.prototype.onAdd = function(pActor) {
    var tParentProps;
    var i, il;
    var tParentProp;
    var tSelf = this;

    mDrawingPropOnAdd.call(this, pActor);

    if (this.element === null) {
      this.element = this.elementTemplate.cloneNode(true);
    }

    tParentProps = pActor.parent.getProps(this.type);

    for (i = 0, il = tParentProps.length; i < il; i++) {
      tParentProp = tParentProps[i];
      if (tParentProp.element !== null) {
        tParentProp.element.appendChild(this.element);
        break;
      }
    }

    pActor.on('invalidate', function() {
      var tProps = this.getProps(tSelf.type);
      if (tProps.length > 0) {
        tProps[0].dispatchDraw();
      }
    });
  };

  DOMProp.prototype.onRemove = function() {
    mDrawingPropOnRemove.call(this);

    if (this.element !== null && this.element.parentNode !== null) {
      this.element.parentNode.removeChild(this.element);
    }
  };

  DOMProp.prototype.elementTemplate = global.document.createElement('div');

  DOMProp.prototype.draw = function(pData) {
    var tActor = this.actor;
    var tMatrix = tActor.matrix;
    var tElement = this.element;
    var tStyle;

    if (tElement === null) {
      return;
    }

    tStyle = tElement.style;

    tStyle.zIndex = tActor.layer;

    tStyle.webkitTransform = 'matrix3d(' + tMatrix.a + ',' + tMatrix.b + ',0,0,' + tMatrix.c + ',' + tMatrix.d + ',0,0,0,0,1,0,' + tMatrix.e + ',' + tMatrix.f + ',0,1)';
  };*/

}(this));