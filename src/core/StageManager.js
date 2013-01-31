/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  /**
   * The overall manager of all Actors on a Stage.
   * @class
   * @extends {theatre.Actor}
   */
  var StageManager = (function(pSuper) {
    function StageManager() {
      pSuper.call(this);
    }

    StageManager.prototype = Object.create(pSuper.prototype);
    StageManager.prototype.constructor = StageManager;

    return StageManager;
  })(theatre.Actor);

  theatre.StageManager = StageManager;

}(this));
