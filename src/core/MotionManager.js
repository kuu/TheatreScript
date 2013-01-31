/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.MotionInput = MotionInput;

  function MotionInput() {
    this.id = 0;
    this.type = 'unknown';
    this.x = 0;
    this.y = 0;
    this.pressure = 0;
    this.size = 0;
  }

  function MotionCue() {
    this.type = '';
    this.inputIndex = -1;
    this.inputs = [];
    this.startTime = 0;
    this.cueTime = 0;
  }

  MotionInput.prototype.addInput = function(pInput) {
    this.inputs.push(pInput);
  };

  /**
   * @class
   * @extends {theatre.InputManager}
   */
  var MotionManager = (function(pSuper) {
    function MotionManager(pStage) {
      pSuper.call(this, pStage);
    }

    MotionManager.prototype = Object.create(pSuper.prototype);
    MotionManager.prototype.constructor = MotionManager;

    return MotionManager;
  })(theatre.InputManager);

  theatre.MotionManager = MotionManager;

  MotionManager.prototype.obtain = function(
    pStartTime,
    pCueTime,
    pType,
    pNumOfInputs
  ) {
    // TODO: Cache the heck out of this. Make a pool we can swim in.
    var tInput = new MotionInput();
    tInput.startTime = pStartTime;
    tInput.cueTime = pCueTime;
    tInput.type = pType;
    tInputs.length = pNumOfInputs;
  };

  MotionManager.prototype.cue = function(pMotionCue) {
    // TODO: write something here other than comments.
  };


}(this));