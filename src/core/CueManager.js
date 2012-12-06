/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

 (function(global) {

  var theatre = global.theatre;
  var TreeNode = theatre.TreeNode;

  theatre.CueManager = CueManager;

  TreeNode.registerSimpleProcess('broadcastCue', function(pData) {
    var tData = pData.data;
    var tName = pData.name;
    var tListenerPackage, tListenersOfType;
    var tCues = this.cues;
    var i, il;
    var tActor = this.actor;

    if (!(tName in tCues)) {
      return;
    }

    tListenerPackage = tCues[tName];
    tListenersOfType = tListenerPackage[0].slice(0).concat(tListenerPackage[1].slice(0));

    for (i = 0, il = tListenersOfType.length; i < il; i++) {
      tListenersOfType[i].call(tActor, tData);
    }
  });

  function immediateCue(pName, pData, pTargetActor, pCurrentNode) {
    var tCues = pCurrentNode.cues;
    var tShouldStopNow = false;
    var tListenerPackage, tListenersOfType;
    var i, il;

    if (!(pName in tCues)) {
      return;
    }

    pData.stop = function() {
      pData.stopped = true;
    };

    pData.stopNow = function() {
      if (pIsStoppable === true) {
        tShouldStopNow = true;
      }
      pData.stopped = true;
    };

    pData.phase = 2;
    tListenerPackage = tCues[pName];
    tListenersOfType = tListenerPackage[0].slice(0).concat(tListenerPackage[1].slice(0));

    for (i = 0, il = tListenersOfType.length; i < il; i++) {
      tListenersOfType[i].call(pTargetActor, pData);
      if (tShouldStopNow === true) {
        return;
      }
    }
  }

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

  CueManager.prototype.broadcast = function(pName, pData, pTargetActor, pBottomUp, pLastToFirst) {
    var tCurrentNode;
    pData = pData || {};
    var tPackage = {
      data: pData,
      name: pName
    };

    if (!pTargetActor) {
      tCurrentNode = this.rootNode;
    } else {
      tCurrentNode = pTargetActor.treeNode;
    }

    pData.stop = pData.stopNow = function() {};
    pData.phase = 2;

    if (pBottomUp === true) {
      if (pLastToFirst === true) {
        tCurrentNode.processBottomUpLastToFirst('broadcastCue', tPackage);
      } else {
        tCurrentNode.processBottomUpFirstToLast('broadcastCue', tPackage);
      }
    } else {
      if (pLastToFirst === true) {
        tCurrentNode.processTopDownLastToFirst('broadcastCue', tPackage);
      } else {
        tCurrentNode.processTopDownFirstToLast('broadcastCue', tPackage);
      }
    }
  };

  /**
   * Sends a cue to all listeners for that cue.
   * @param {string} pName The type of cue.
   * @param {Object=} pData Data to send with the cue if any.
   * @param {theatre.Actor=} pTargetActor The target actor or none. Default is root.
   * @param {bool=false} pBubbles If this cue bubbles or not.
   * @param {bool=false} pCaptures If this cue captures or not.
   * @param {bool=false} pIsStoppable If this cue can be stopped or not.
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
    pData.stopped = false;

    if (pCaptures === false && pBubbles === false) {
      immediateCue(pName, pData, pTargetActor, tCurrentNode);
      return;
    }

    pData.stop = function() {
      if (pIsStoppable === true) {
        tShouldStop = true;
      }
      pData.stopped = true;
    };

    pData.stopNow = function() {
      if (pIsStoppable === true) {
        tShouldStop = true;
        tShouldStopNow = true;
      }
      pData.stopped = true;
    };

    pData.phase = 1; // Capture

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
