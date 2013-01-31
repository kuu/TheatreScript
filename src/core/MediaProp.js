/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  /**
   * @class
   * @extends {theatre.Prop}
   */
  var MediaProp = (function(pSuper) {
    function MediaProp() {
      pSuper.call(this);
      this.playbackState = MediaProp.PLAYBACK_STATE_NOT_READY;
      this.callbacks = {endOfStream: []};
    }

    MediaProp.prototype = Object.create(pSuper.prototype);
    MediaProp.prototype.constructor = MediaProp;

    return MediaProp;
  })(theatre.Prop);

  theatre.MediaProp = MediaProp;

  MediaProp.prototype.type = 'Media';

  MediaProp.PLAYBACK_STATE_NOT_READY         = 'notReady';
  MediaProp.PLAYBACK_STATE_READY             = 'ready';
  MediaProp.PLAYBACK_STATE_PLAYING           = 'playing';
  MediaProp.PLAYBACK_STATE_PAUSED            = 'paused';

  /**
   * Overload this in your subclass to play back media data.
   */
  MediaProp.prototype.play = function() {
    // play back here.
  };

  /**
   * Overload this in your subclass to stop the playback.
   */
  MediaProp.prototype.stop = function() {
    // stop here.
  };

  /**
   * Overload this in your subclass to pause the playback.
   */
  MediaProp.prototype.pause = function() {
    // pause here.
  };

  /**
   * Overload this in your subclass to jump to a specific point in the playback.
   * @param {Number} pPoint Specific point in the playback.
   */
  MediaProp.prototype.seek = function(pPoint) {
    // seek here.
  };

  /**
   * Registers an event handler to Prop.
   * @param {string} pName The type of event.
   * @param {function} pCallback The callback.
   * @return {theatre.Actor} This Prop.
   */
  MediaProp.prototype.on = function(pName, pCallback) {
    if (this.callbacks[pName] === void 0) {
      this.callbacks[pName] = [pCallback];
    } else {
      this.callbacks[pName].push(pCallback);
    }
    return this;
  };

  /**
   * Removes an event handler from Prop.
   * @param {string} pName The type of event.
   * @param {function} pCallback The callback.
   * @return {theatre.Actor} This Prop.
   */
  MediaProp.prototype.off = function(pName, pCallback) {
    if (pName in this.callbacks) {
      var tCallbacks = this.callbacks[pName];
      for (var i = 0, il = tCallbacks; i < il; i++) {
        if (tCallbacks[i] === pCallback) {
          tCallbacks.splice(i, 1);
          break;
        }
      }
      if (tCallbacks.length === 0) {
        delete this.callbacks[pName];
      }
    }
    return this;
  };

}(this));
