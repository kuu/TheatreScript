/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.MotionManager = MotionManager;

  function MotionInput() {

  }

  function MotionManager(pStage) {
    this.base(pStage);
  };
  theatre.inherit(MotionManager, theatre.InputManager);

  MotionManager.prototype.obtainMotionInput = function() {

  };


}(this));