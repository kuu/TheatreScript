/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.Prop = Prop;

  /**
   * Actors can hold Props.
   * @constructor
   */
  function Prop() {
    /** @type {theatre.Actor} */
    this.actor = null;
  }

  Prop.prototype.onAdd = function(pActor) {
    this.actor = pActor;
  };

  Prop.prototype.onRemove = function() {
    this.actor = null;
  };

  Prop.prototype.type = '';

}(this));