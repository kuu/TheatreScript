/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

 (function(global) {

  var theatre = global.theatre;

  theatre.CueListener = CueListener;

  function CueListener() {
    this._cues = {};
  }

  CueListener.prototype.on = function(pName, pListener) {
    var tCues = this._cues;

    if (!pListener) {
      return;
    }

    if (!(pName in tCues)) {
      tCues[pName] = [pListener];
      return;
    }

    tCues[pName].push(pListener);
  };

  CueListener.prototype.ignore = function(pName, pListener) {
    var tCues = this._cues;

    if (!pListener) {
      return;
    }

    if (!(pName in tCues)) {
      return;
    }

    var tListeners = tCues[pName];
    var tIndex = tListeners.indexOf(pListener);

    if (tIndex !== -1) {
      tListeners.splice(tIndex, 1);
    }
  };

  CueListener.prototype.cue = function(pName, pData) {
    var tCues = this._cues;
    var tListeners;
    var i, il;
    var tPackage = {
      data: pData,
      name: pName,
      target: this
    };

    if (!(pName in tCues)) {
      return;
    }

    tListeners = tCues[pName].slice(0);

    for (i = 0, il = tListeners.length; i < il; i++) {
      tListeners[i].call(this, tPackage);
    }
  };

  CueListener.init = function(pObject) {
    pObject._cues = {};
  };

  CueListener.extend = function(pObject) {
    pObject.on = CueListener.prototype.on;
    pObject.ignore = CueListener.prototype.ignore;
    pObject.cue = CueListener.prototype.cue;
  };


  /**
   * @class
   * @extends {CueListener}
   */
  var PersistentCueListener = (function(pSuper) {
    function PersistentCueListener() {
      pSuper.call(this);
      this._cueResults = {};
    }

    PersistentCueListener.prototype = Object.create(pSuper.prototype);

    PersistentCueListener.prototype.on = function(pName, pListener) {
      pSuper.prototype.on.call(this, pName, pListener);

      var tCueResults = this._cueResults;
      if (pName in tCueResults) {
        pListener.call(this, {
          name: pName,
          data: tCueResults[pName],
          target: this
        });
      }
    };

    PersistentCueListener.prototype.ignore = function(pName, pListener) {
      pSuper.prototype.ignore.call(this, pName, pListener);
    };

    PersistentCueListener.prototype.cue = function(pName, pData) {
      pSuper.prototype.cue.call(this, pName, pData);

      this._cueResults[pName] = pData;
    };

    return PersistentCueListener;
  })(CueListener);

  theatre.PersistentCueListener = PersistentCueListener;

  PersistentCueListener.init = function(pObject) {
    pObject._cues = {};
    pObject._cueResults = {};
  };

  PersistentCueListener.extend = function(pObject) {
    pObject.on = PersistentCueListener.prototype.on;
    pObject.ignore = PersistentCueListener.prototype.ignore;
    pObject.cue = PersistentCueListener.prototype.cue;
  };

}(this));