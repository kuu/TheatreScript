/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.define('DrawingProp', DrawingProp, theatre);

  function DrawingProp() {
    this.base();
  }
  theatre.inherit(DrawingProp, theatre.Prop);

  DrawingProp.prototype.type = 'Drawing';

  /**
   * Called before draw() is called.
   * This will get called even when redrawing cache.
   * Therefore you should not do anything heavy in here.
   * The context passed here will always be the same as this Actors parent.
   * @param {Object} pContext The rendering context.
   * @return {boolean} false when you do not want the draw'() function
   *                         to be called.
   */
  DrawingProp.prototype.preDraw = function(pContext) {
    // Do nothing by default
    return true;
  };

  /**
   * Called after draw() is called.
   * This will get called even when redrawing cache.
   * Therefore you should not do anything heavy in here.
   * The context passed here will always be the same as this Actors parent.
   * @param {Object} pContext The rendering context.
   */
  DrawingProp.prototype.postDraw = function(pContext) {
    // Do nothing by default
  };

  /**
   * Overload this in your subclass to draw your Actor.
   * @param {Object} pContext The rendering context.
   */
  DrawingProp.prototype.draw = function(pContext) {
    // draw here.
  };

  /**
   * Called just before dispatching the dispatch related
   * functions for children.
   * Will not be called if there are no children.
   * @param {Object} pContext The context for this Actor.
   */
  DrawingProp.prototype.preDrawChildren = function(pContext) {
    // Do nothing. Overload this.
    return true;
  };

  /**
   * Called just before dispatching the dispatch related
   * functions for children.
   * Will not be called if there are no children.
   * @param {Object} pContext The context for this Actor.
   */
  DrawingProp.prototype.postDrawChildren = function(pContext) {
    // Do nothing. Overload this.
  };

  /**
   * Called right before drawing the actual child.
   * @param {Object} pParentContext The context of this Actor.
   * @param {theatre.Actor} pChildActor The child Actor about to be drawn.
   */
  DrawingProp.prototype.preDrawChild = function(pParentContext, pChildActor) {
    // Implement this.
    return true;
  };

  /**
   * Called right after drawing the actual child.
   * @param {Object} pParentContext The context of this Actor.
   * @param {theatre.Actor} pChildActor The child Actor about to be drawn.
   */
  DrawingProp.prototype.postDrawChild = function(pParentContext, pChildActor) {
    // Do this.
  };

  /**
   * Called right after dispatchDraw is called.
   * @param {Object} pParentContext The context of this Actor.
   * @param {Object} pChildContext The context of the child Actor that was just drawn.
   * @param {theatre.Actor} pChildActor The child Actor that was just drawn.
   */
  DrawingProp.prototype.postDispatchDraw = function(pParentContext, pChildContext, pChildActor) {
    // Do nothing. This is for overloading.
  };

  var mPropsToDispatch =[];

  /**
   * Schedules a draw to the Stage.
   * @todo  Need a way to not force a global dispatch.
   * @param  {Object} pData The data to pass.
   */
  DrawingProp.prototype.dispatchDraw = function(pData) {
    var tPropType = this.type;
    var tStage = this.actor.stage;
    var tPropsToDispatchForStage = mPropsToDispatch[tStage.id];
    pData = pData || {};

    if (tPropsToDispatchForStage === void 0) {
      tPropsToDispatchForStage = mPropsToDispatch[tStage.id] = {};
    }

    if (tPropsToDispatchForStage[tPropType] === void 0) {
      tPropsToDispatchForStage[tPropType] = true;

      tStage.schedule(function() {
        pData._propType = tPropType;

        this.stageManager.treeNode.processTopDownInOut('RenderDrawingProp', pData);
        delete tPropsToDispatchForStage[tPropType];
      });
    }
  };



  function DrawingComplexProcess() {
    // Do nothing
  }
  DrawingComplexProcess.prototype = Object.create(theatre.ComplexProcess.prototype);

  DrawingComplexProcess.prototype.enterSelf = function(pData) {
    var tProp;
    var tProps = this.actor.getProps(pData._propType);

    for (var i = 0, il = tProps.length; i < il; i++) {
      tProp = tProps[i];
      if (tProp.preDraw(pData) !== false) {
        tProp.draw(pData);
        tProp.postDraw(pData);
      } else {
        return false;
      }
    }

    return true;
  };

  DrawingComplexProcess.prototype.enterChildren = function(pData) {
    var tProps = this.actor.getProps(pData._propType);

    for (var i = 0, il = tProps.length; i < il; i++) {
      if (tProps[i].preDrawChildren(pData) === false) {
        return false;
      }
    }

    return true;
  };

  DrawingComplexProcess.prototype.enterChild = function(pData, pChildNode) {
    var tProps = this.actor.getProps(pData._propType);
    var tChildActor = pChildNode.actor;

    for (var i = 0, il = tProps.length; i < il; i++) {
      if (tProps[i].preDrawChild(pData, tChildActor) === false) {
        return false;
      }
    }

    return true;
  };

  DrawingComplexProcess.prototype.exitChild = function(pData, pChildNode) {
    var tProps = this.actor.getProps(pData._propType);
    var tChildActor = pChildNode.actor;

    for (var i = 0, il = tProps.length; i < il; i++) {
      tProps[i].postDrawChild(pData, tChildActor);
    }
  };

  DrawingComplexProcess.prototype.exitChildren = function(pData) {
    var tProps = this.actor.getProps(pData._propType);

    for (var i = 0, il = tProps.length; i < il; i++) {
      tProps[i].postDrawChildren(pData);
    }
  };

  theatre.TreeNode.registerComplexProcess('RenderDrawingProp', new DrawingComplexProcess());

}(this));