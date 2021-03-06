/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.crews.audio = theatre.crews.audio || {};

  var mAudioContext;
  if ('webkitAudioContext' in global) {
    mAudioContext = new webkitAudioContext();
  }

  /**
   * @class
   * @extends {theatre.MediaProp}
   */
  var AudioProp = (function(pSuper) {
    function AudioProp(pId, pAudio) {
      pSuper.call(this);
      this.id = pId;
      if (mAudioContext) {
        // Web Audio API
        console.log('Use Web Audio API.');
        var tSource = this.sourceNode = mAudioContext.createBufferSource();
        tSource.buffer = pAudio;
        tSource.connect(mAudioContext.destination);
      } else {
        // HTML Audio Element
        console.log('Use HTML Audio Element.');
        this.audioElement = pAudio;
      }
    }

    AudioProp.prototype = Object.create(pSuper.prototype);
    AudioProp.prototype.constructor = AudioProp;

    return AudioProp;
  })(theatre.MediaProp);

  theatre.crews.audio.AudioProp = AudioProp;

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
console.log('AudioProp#play');
    if (mAudioContext) {
      this.sourceNode.noteOn(0);
    } else {
      this.audioElement.play();
    }
    this.playbackState = theatre.MediaProp.PLAYBACK_STATE_PLAYING;
  };

  /**
   * Overload this in your subclass to stop the playback.
   */
  AudioProp.prototype.stop = function() {
console.log('AudioProp#stop');
    if (mAudioContext) {
      this.sourceNode.noteOff(0);
    } else {
      this.audioElement.stop();
    }
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
