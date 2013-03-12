/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;
  theatre.crews.render = theatre.crews.render || {};

  var mScheduledStages = {};

  /**
   * @class
   * @extends {theatre.Prop}
   */
  var RenderProp = (function(pSuper) {
    /**
     * @constructor
     * @param {benri.render.RenderContext} pRenderContext The RenderContext to render to.
     */
    function RenderProp(pRenderContext) {
      pSuper.call(this);

      /**
       * The RenderContext to render to.
       * @type {benri.render.RenderContext}
       */
      this.context = pRenderContext;

      /**
       * The callback to call when this props Actor
       * is invalidated. Custom built onAdd.
       * @type {Function}
       * @private
       */
      this.callback = null;
    }

    RenderProp.prototype = Object.create(pSuper.prototype);
    RenderProp.prototype.constructor = RenderProp;

    RenderProp.prototype.type = 'Render';

    RenderProp.prototype.onAdd = function(pActor) {
      var tSelf = this;

      pSuper.prototype.onAdd.call(this, pActor);

      // This sets the callback to be called on invalidate.
      // It's customly built here using the Actor
      // that is now it's parent Actor and the RenderContext
      // that is assigned to it to be able to render
      // unique render trees per type of render context and type.
      this.callback = function() {
        var tId = this.stage.id + '';
        var tIndex;

        if (!(tId in mScheduledStages)) {
          mScheduledStages[tId] = [tSelf.context, tSelf.type];
          this.stage.schedule(renderActorTree);
        } else if ((tIndex = mScheduledStages[tId].indexOf(tSelf.context)) === -1 || (mScheduledStages[tId][tIndex + 1] !== tSelf.type)) {
          mScheduledStages[tId].push(tSelf.context, tSelf.type);
          this.stage.schedule(renderActorTree);
        }
      };

      this.actor.on('invalidate', this.callback);
    };

    /**
     * @inheritDoc
     */
    RenderProp.prototype.onRemove = function() {
      this.actor.ignore('invalidate', this.callback);
      pSuper.prototype.onRemove.call(this);
    };

    /**
     * Render this prop.
     * @param {Object} pData Arbitrary data passed to this prop.
     * @return {boolean=} If returning false rendering will stop here.
     *                       No further child props will be rendered.
     *                       However parents and siblings will still render.
     */
    RenderProp.prototype.render = function(pData) {
      return true;
    };

    /**
     * Called after a successfull render of this prop
     * and all child props of this prop's Actor.
     * @param  {Object} pData Arbitrary data passed to this prop.
     */
    RenderProp.prototype.postRender = function(pData) {

    };

    return RenderProp;
  })(theatre.Prop);

  theatre.crews.render.RenderProp = RenderProp;

  /**
   * Renders the Actor tree of the stage for a given
   * type and RenderContext.
   * Called via a callback from the invalidate cue.
   */
  function renderActorTree() {
    var i, il;
    var tContexts = mScheduledStages[this.id];
    mScheduledStages[this.id] = [];

    for (i = 0, il = tContexts.length; i < il; i += 2) {
      // Will call processActorTree for each node.
      this.getStageManager().treeNode.processTopDownFirstToLast('RenderProp', {
        context: tContexts[i],
        type: tContexts[i + 1],
        data: {}
      });

      // Force the RenderContext to output.
      tContexts[i].flush();
    }
  }

  /**
   * Process an individual node in the Actor tree.
   * Renders all props of the correct type for this node.
   * @param  {Object} pData Arbitrary data
   * @return {boolean} If returning false, rendering will stop
   *                      for this node and all child nodes.
   */
  function processActorTree(pData) {
    var tRenderContext = pData.context;
    var tPropType = pData.type;
    var i, il;

    var tProps = this.actor.getProps(tPropType);

    tRenderContext.save();

    tRenderContext.transform(this.actor.matrix);

    for (i = 0, il = tProps.length; i < il; i++) {
      if (tProps[i].render(pData) === false) {
        tRenderContext.restore();
        return false;
      }
    }
  }

  /**
   * Called when leaving a node.
   * Allow props to hook themselves after done rendering
   * themselves and all children via postRender.
   * @param  {Object} pData Arbitrary data.
   */
  processActorTree.onLeave = function(pData) {
    var tRenderContext = pData.context;
    var tPropType = pData.type;
    var i, il;

    var tProps = this.actor.getProps(tPropType);

    for (i = 0, il = tProps.length; i < il; i++) {
      tProps[i].postRender(pData);
    }

    tRenderContext.restore();
  };

  theatre.TreeNode.registerSimpleProcess('RenderProp', processActorTree);

}(this));