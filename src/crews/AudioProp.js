/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.define('AudioProp', AudioProp, theatre);

  function AudioProp(pId, pAudio) {
    this.base();
    this.id = pId;
    this.audioElement = pAudio;
  }
  theatre.inherit(AudioProp, theatre.MediaProp);

  AudioProp.prototype.type = 'Audio';

  AudioProp.prototype.onAdd = function(pActor) {
    this.actor = pActor;
    // init
    this.playbackState = theatre.MediaProp.PLAYBACK_STATE_READY;
  };

  AudioProp.prototype.onRemove = function() {
    this.actor = null;
    // term
    this.playbackState = theatre.MediaProp.PLAYBACK_STATE_NOT_READY;
  };

  /**
   * Overload this in your subclass to play back media data.
   */
  AudioProp.prototype.play = function() {
console.log('Play.');
    this.audioElement.play();
    this.playbackState = theatre.MediaProp.PLAYBACK_STATE_PLAYING;
  };

  /**
   * Overload this in your subclass to stop the playback.
   */
  AudioProp.prototype.stop = function() {
console.log('Stop.');
    this.audioElement.stop();
    this.playbackState = theatre.MediaProp.PLAYBACK_STATE_READY;
  };

  /**
   * Overload this in your subclass to pause the playback.
   */
  AudioProp.prototype.pause = function() {
    // pause here.
    this.playbackState = theatre.MediaProp.PLAYBACK_STATE_PAUSED;
  };

  /**
   * Overload this in your subclass to jump to a specific point in the playback.
   * @param {Number} pPoint Specific point in the playback.
   */
  AudioProp.prototype.seek = function(pPoint) {
    // seek here.
  };

}(this));
