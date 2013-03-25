/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  /**
   * @class
   * @extends {theatre.InputManager}
   */
  var PointerManager = (function(pSuper) {
    /**
     * @constructor
     */
    function PointerManager(pStage) {
      pSuper.call(this, pStage);
      this.activePointerTargets = [];
    }

    PointerManager.prototype = Object.create(pSuper.prototype);
    PointerManager.prototype.constructor = PointerManager;

    return PointerManager;
  })(theatre.InputManager);

  global.theatre.PointerManager = PointerManager;

  PointerManager.prototype.down = function(pId, pX, pY, pIsPrimary) {
    var tStage = this.stage;

    if (tStage === null) {
      return;
    }

    var tActors = [];
    var tActor;
    var tMatrix;
    var tPoint;

    function add(pActor) {
      tActors.push(pActor);
    }

    tStage.broadcast('hittest', {
      x: pX,
      y: pY,
      add: add
    }, true, true);

    if (tActors.length > 0) {
      tActor = this.activePointerTargets[pId] = tActors[0];
      tMatrix = tActor.getAbsoluteMatrix();
      tPoint = tMatrix.getPoint(0, 0);
      tActor.cue('pointerdown', {
        id: pId,
        stageX: pX,
        stageY: pY,
        x: pX - tPoint.x, // TODO: rotation and such
        y: pY - tPoint.y // TODO: rotation and such
      }, true, true, true);
    }
  };

  PointerManager.prototype.up = function(pId, pX, pY, pIsPrimary) {
    var tStage = this.stage;
    var tActor = this.activePointerTargets[pId];

    this.activePointerTargets[pId] = void 0;

    if (tStage === null || tActor === void 0 || tActor.stage === null) {
      return;
    }

    var tMatrix = tActor.getAbsoluteMatrix();
    var tPoint = tMatrix.getPoint(0, 0);
    tActor.cue('pointerup', {
      id: pId,
      stageX: pX,
      stageY: pY,
      x: pX - tPoint.x, // TODO: rotation and such
      y: pY - tPoint.y // TODO: rotation and such
    }, true, true, true);
  };

  PointerManager.prototype.cancel = function(pId, pX, pY, pIsPrimary) {
    var tStage = this.stage;
    var tActor = this.activePointerTargets[pId];

    this.activePointerTargets[pId] = void 0;

    if (tStage === null || tActor === void 0 || tActor.stage === null) {
      return;
    }

    var tMatrix = tActor.getAbsoluteMatrix();
    var tPoint = tMatrix.getPoint(0, 0);
    tActor.cue('pointercancel', {
      id: pId,
      stageX: pX,
      stageY: pY,
      x: pX - tPoint.x, // TODO: rotation and such
      y: pY - tPoint.y // TODO: rotation and such
    }, true, true, true);
  };

  PointerManager.prototype.move = function(pId, pX, pY, pIsPrimary) {
    var tStage = this.stage;
    var tActor = this.activePointerTargets[pId];

    if (tStage === null || tActor === void 0 || tActor.stage === null) {
      return;
    }

    var tMatrix = tActor.getAbsoluteMatrix();
    var tPoint = tMatrix.getPoint(0, 0);
    tActor.cue('pointermove', {
      id: pId,
      stageX: pX,
      stageY: pY,
      x: pX - tPoint.x, // TODO: rotation and such
      y: pY - tPoint.y // TODO: rotation and such
    }, true, true, true);
  };

  //TODO: enter/leave/over/out ?

}(this));