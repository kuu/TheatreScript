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
   * @name theatre.StageManager
   * @constructor
   * @extends theatre.Actor
   */
  function StageManager() {
    this.base();
  }
  theatre.inherit(StageManager, theatre.Actor);

  theatre.define('theatre.StageManager', StageManager);

}(this));
