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
      this.activeCapturedPointerTargets = [];
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
    var tTarget;

    function add(pActor) {
      tActors.push(pActor);
    }

    function capture(pActor) {
      if (tActor === null) {
        tActor = pActor;
      }
    }

    tStage.broadcast('hittest', {
      x: pX,
      y: pY,
      add: add,
      capture: capture
    }, true, true);

    // Do event bubbling.
    if (tActor) {
      this.activeCapturedPointerTargets[pId] = tActor;
      tMatrix = tActor.getAbsoluteMatrix();
      tPoint = tMatrix.getPoint(0, 0);
      tActor.cue('pointerdown', {
        id: pId,
        stageX: pX,
        stageY: pY,
        x: pX - tPoint.x, // TODO: rotation and such
        y: pY - tPoint.y, // TODO: rotation and such
        isPrimary: pIsPrimary
      }, true, true, true);
    }

    // Do not event bubbling.
    tTarget = this.activePointerTargets[pId];
    for (var i = 0, il = tActors.length; i < il; i++) {
      tActor = tActors[i];
      if (tTarget) {
        tTarget.push(tActor);
      } else {
        tTarget = this.activePointerTargets[pId] = [tActor];
      }
      tMatrix = tActor.getAbsoluteMatrix();
      tPoint = tMatrix.getPoint(0, 0);
      tActor.cue('pointerdown', {
        id: pId,
        stageX: pX,
        stageY: pY,
        x: pX - tPoint.x, // TODO: rotation and such
        y: pY - tPoint.y, // TODO: rotation and such
        isPrimary: pIsPrimary
      }, false, false, false);
    }
  };

  function sendEvent(pType, pId, pX, pY, pIsPrimary, pTerminate) {
    var tStage = this.stage;
    var tActor = this.activeCapturedPointerTargets[pId];
    var tActors = this.activePointerTargets[pId] || [];

    if (pTerminate) {
      this.activeCapturedPointerTargets[pId] = void 0;
      this.activePointerTargets[pId] = void 0;
    }

    if (tStage === null) {
      return;
    }

    if (tActor && tActor.stage !== null) {
      var tMatrix = tActor.getAbsoluteMatrix();
      var tPoint = tMatrix.getPoint(0, 0);
      tActor.cue(pType, {
        id: pId,
        stageX: pX,
        stageY: pY,
        x: pX - tPoint.x, // TODO: rotation and such
        y: pY - tPoint.y, // TODO: rotation and such
        isPrimary: pIsPrimary
      }, true, true, true);
    }

    for (var i = 0, il = tActors.length; i < il; i++) {
      tActor = tActors[i];
      if (!tActor || tActor.stage === null) {
        continue;
      }
      var tMatrix = tActor.getAbsoluteMatrix();
      var tPoint = tMatrix.getPoint(0, 0);
      tActor.cue(pType, {
        id: pId,
        stageX: pX,
        stageY: pY,
        x: pX - tPoint.x, // TODO: rotation and such
        y: pY - tPoint.y, // TODO: rotation and such
        isPrimary: pIsPrimary
      }, false, false, false);
    }
  }

  PointerManager.prototype.up = function(pId, pX, pY, pIsPrimary) {
    sendEvent.call(this, 'pointerup', pId, pX, pY, pIsPrimary, true);
  };

  PointerManager.prototype.cancel = function(pId, pX, pY, pIsPrimary) {
    sendEvent.call(this, 'pointercancel', pId, pX, pY, pIsPrimary, true);
  };

  PointerManager.prototype.move = function(pId, pX, pY, pIsPrimary) {
    sendEvent.call(this, 'pointermove', pId, pX, pY, pIsPrimary);
  };

  //TODO: enter/leave/over/out ?

}(this));
