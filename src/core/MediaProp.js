/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.define('MediaProp', MediaProp, theatre);

  function MediaProp() {
    this.base();
    this.playbackState = MediaProp.PLAYBACK_STATE_STOPPED;
    this.callbacks = {endOfStream: []};
  }
  theatre.inherit(MediaProp, theatre.Prop);

  MediaProp.prototype.type = 'Media';

  MediaProp.PLAYBACK_STATE_NOT_READY         = 'notReady';
  MediaProp.PLAYBACK_STATE_READY             = 'ready';
  MediaProp.PLAYBACK_STATE_STARTING_PLAYBACK = 'startingPlayback';
  MediaProp.PLAYBACK_STATE_PLAYING           = 'playing';
  MediaProp.PLAYBACK_STATE_PAUSED            = 'paused';
  MediaProp.PLAYBACK_STATE_STOPPING_PLAYBACK = 'stoppingPlayback';

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
   * Overload this in your subclass to resume the playback.
   */
  MediaProp.prototype.resume = function() {
    // resume here.
  };

  /**
   * Overload this in your subclass to jump to a specific point in the playback.
   * @param {Number} pPoint Specific point in the playback.
   */
  MediaProp.prototype.seek = function(pPoint) {
    // seek here.
  };

  MediaProp.prototype.togglePlay = function() {

    if (this.playbackState === MediaProp.PLAYBACK_STATE_READY) {
      this.playbackState = MediaProp.PLAYBACK_STATE_STARTING_PLAYBACK;
      this.play();
    } else if (this.playbackState === MediaProp.PLAYBACK_STATE_PLAYING) {
      this.playbackState = MediaProp.PLAYBACK_STATE_STOPPING_PLAYBACK;
      this.stop();
    } else if (this.playbackState === MediaProp.PLAYBACK_STATE_PAUSED) {
      this.resume();
      this.playbackState = MediaProp.PLAYBACK_STATE_PLAYING;
    }
  };

  MediaProp.prototype.togglePause = function() {
    if (this.playbackState === MediaProp.PLAYBACK_STATE_PLAYING) {
      this.pause();
      this.playbackState = MediaProp.PLAYBACK_STATE_PAUSED;
    } else if (this.playbackState === MediaProp.PLAYBACK_STATE_PAUSED) {
      this.resume();
      this.playbackState = MediaProp.PLAYBACK_STATE_PLAYING;
    }
  };

  MediaProp.prototype.addEventListener = function(pType, pFunction) {
    if (this.callbacks[pType] === void 0) {
      this.callbacks[pType] = [pFunction];
    } else {
      this.callbacks[pType].push(pFunction);
    }
  };

}(this));
