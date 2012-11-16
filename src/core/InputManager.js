/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

 (function(global) {

  var theatre = global.theatre;

  theatre.InputManager = InputManager;

  /**
  * A class for dispatching input cues (events)
  * @constructor
  */
  function InputManager(pStage) {
    this.stage = pStage;
  }

}(this));