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
    function RenderProp(pRenderContext) {
      pSuper.call(this);
      this.context = pRenderContext;
      this.callback = null;
    }

    RenderProp.prototype = Object.create(pSuper.prototype);
    RenderProp.prototype.constructor = RenderProp;

    RenderProp.prototype.type = 'Render';

    RenderProp.prototype.onAdd = function(pActor) {
      var tSelf = this;

      pSuper.prototype.onAdd.call(this, pActor);

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

    RenderProp.prototype.onRemove = function() {
      this.actor.ignore('invalidate', this.callback);
      pSuper.prototype.onRemove.call(this);
    };

    RenderProp.prototype.render = function(pData) {
      return true;
    };

    RenderProp.prototype.postRender = function(pData) {

    };

    return RenderProp;
  })(theatre.Prop);

  theatre.crews.render.RenderProp = RenderProp;

  function renderActorTree() {
    var i, il;
    var tContexts = mScheduledStages[this.id];
    mScheduledStages[this.id] = [];

    for (i = 0, il = tContexts.length; i < il; i += 2) {
      this.stageManager.treeNode.processTopDownFirstToLast('RenderProp', {
        context: tContexts[i],
        type: tContexts[i + 1],
        data: {}
      });

      tContexts[i].flush();
    }
  }

  function processActorTree(pData) {
    var tRenderContext = pData.context;
    var tPropType = pData.type;
    var i, il;

    var tProps = this.actor.getProps(tPropType);

    tRenderContext.save();

    tRenderContext.matrix.multiply(this.actor.matrix);

    for (i = 0, il = tProps.length; i < il; i++) {
      if (tProps[i].render(pData) === false) {
        tRenderContext.restore();
        return false;
      }
    }
  }

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