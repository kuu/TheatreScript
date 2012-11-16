/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

 (function(global) {

  var theatre = global.theatre;

  theatre.CueManager = CueManager;

  /**
  * A class for handling cues (events)
  * @constructor
  */
  function CueManager(pRootNode) {
    this.rootNode = pRootNode;
  }

  /**
   * Registers the given listener for the given cue type.
   * @param {theatre.Actor=} pTarget The target Actor. Defaults to the root.
   * @param {string} pName The type of cue.
   * @param {function} pListener The listener.
   * @param {bool=false} pCapture True to callback in the capture phase, false for bubble.
   */
  CueManager.prototype.on = function(pTarget, pName, pListener, pCapture) {
    var tCues = pTarget ? pTarget.treeNode.cues : this.rootNode.cues;
    if (!pListener) {
      return;
    }
    pCapture = pCapture || false;

    if (!(pName in tCues)) {
      tCues[pName] = [[], []];
    }
    tCues[pName][pCapture ? 0 : 1].push(pListener);
  };

  /**
   * Unregisters the given listener from the given cue type.
   * @param {theatre.Actor=} pTarget The target Actor. Defaults to the root.
   * @param {string} pName The type of cue.
   * @param {function} pListener The listener.
   * @param {bool=false} pCapture True to callback in the capture phase, false for bubble.
   */
  CueManager.prototype.ignore = function(pTarget, pName, pListener, pCapture) {
    var tCues = pTarget ? pTarget.treeNode.cues : this.rootNode.cues;
    if (!pListener) {
      return;
    }
    pCapture = pCapture || false;

    if (!(pName in tCues)) {
      return;
    }

    var tListeners = tCues[pName][pCapture ? 0 : 1];
    var tIndex = tListeners.indexOf(pListener);
    if (tIndex !== -1) {
      tListeners.splice(tIndex, 1);
    }
  };

  /**
   * Sends a cue to all listeners for that cue.
   * @param {string} pName The type of cue.
   * @param {Object=} pData Data to send with the cue if any.
   * @param {theatre.Actor=} pTargetActor The target actor or none. Default is root.
   * @param {bool} pBubbles If this cue bubbles or not.
   * @param {bool} pCaptures If this cue captures or not.
   * @param {bool} pIsStoppable If this cue can be stopped or not.
   */
  CueManager.prototype.cue = function(pName, pData, pTargetActor, pBubbles, pCaptures, pIsStoppable) {
    var tListeners = [];
    var tTargetNode;
    pData = pData || {};
    pBubbles = pBubbles || false;
    pCaptures = pCaptures || false;
    pIsStoppable = pIsStoppable || false;
    var tCurrentNode;
    var tCues;
    var i, j, jl;
    var tListenersLength = 0;
    var tListenersOfType;
    var tListenerPackage;
    var tTempActor;

    var tShouldStop = false;
    var tShouldStopNow = false;

    if (!pTargetActor) {
      pTargetActor = this.rootNode.actor;
    }

    tTargetNode = pTargetActor ? pTargetActor.treeNode : this.rootNode;
    tCurrentNode = tTargetNode;

    pData.target = pTargetActor;
    pData.bubbles = pBubbles;
    pData.stoppable = pIsStoppable;
    pData.type = pName;
    pData.phase = 1; // Capture

    pData.stop = function() {
      if (pIsStoppable === true) {
        tShouldStop = true;
      }
    };

    pData.stopNow = function() {
      if (pIsStoppable === true) {
        tShouldStopNow = true;
        tShouldStop = true;
      }
    };

    if (pCaptures === false && pBubbles === false) {
      tCues = tCurrentNode.cues;

      if (!(pName in tCues)) {
        return;
      }

      pData.phase = 2;
      tListenerPackage = tCues[pName];
      tListenersOfType = tListenerPackage[0].slice(0).concat(tListenerPackage[1].slice(0));

      for (j = 0, jl = tListenersOfType.length; j < jl; j++) {
        tListenersOfType[j].call(pTargetActor, pData);
        if (tShouldStopNow === true) {
          return;
        }
      }
      return;
    }

    // Collect all the listeners
    for (; tCurrentNode !== null; tCurrentNode = tCurrentNode.parentNode) {
      tCues = tCurrentNode.cues;
      tTempActor = tCurrentNode.actor;

      if (pName in tCues) {
        tListenerPackage = tCues[pName];
        tListeners.push([tTempActor, [tListenerPackage[0].slice(0), tListenerPackage[1].slice(0)]]);
      }
    }

    tListenersLength = tListeners.length;

    if (tListenersLength === 0) {
      return;
    }

    // Capture phase.
    for (i = tListenersLength - 1; i >= 1; i--) {
      tListenerPackage = tListeners[i];
      tListenersOfType = tListenerPackage[1][0];
      for (j = 0, jl = tListenersOfType.length; j < jl; j++) {
        tListenersOfType[j].call(tListenerPackage[0], pData);
        if (tShouldStopNow === true) {
          return;
        }
      }

      if (tShouldStop === true) {
        return;
      }
    }

    // Target phase.
    pData.phase = 2;
    tListenerPackage = tListeners[0];

    tListenersOfType = tListenerPackage[1][0];

    for (j = 0, jl = tListenersOfType.length; j < jl; j++) {
      tListenersOfType[j].call(pTargetActor, pData);
      if (tShouldStopNow === true) {
        return;
      }
    }

    tListenersOfType = tListenerPackage[1][1];

    for (j = 0, jl = tListenersOfType.length; j < jl; j++) {
      tListenersOfType[j].call(pTargetActor, pData);
      if (tShouldStopNow === true) {
        return;
      }
    }

    if (tShouldStop === true) {
      return;
    }

    // Bubble phase.
    if (pBubbles === false) {
      return;
    }

    pData.phase = 3;

    for (i = 1; i < tListenersLength; i++) {
      tListenerPackage = tListeners[i];
      tListenersOfType = tListenerPackage[1][0];
      for (j = 0, jl = tListenersOfType.length; j < jl; j++) {
        tListenersOfType[j].call(tListenerPackage[0], pData);
        if (tShouldStopNow === true) {
          return;
        }
      }

      if (tShouldStop === true) {
        return;
      }
    }
  };
}(this));
