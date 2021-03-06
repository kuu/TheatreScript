/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;
  var StageManager = theatre.StageManager;

  theatre.Stage = Stage;

  var mRequestAnimationFrame;
  if (global.requestAnimationFrame !== void 0) {
    mRequestAnimationFrame = global.requestAnimationFrame;
  } else if (global.webkitRequestAnimationFrame !== void 0) {
    mRequestAnimationFrame = global.webkitRequestAnimationFrame;
  } else if (global.mozRequestAnimationFrame !== void 0) {
    mRequestAnimationFrame = global.mozRequestAnimationFrame;
  } else {
    mRequestAnimationFrame = function(pCallback) {
      return setTimeout(pCallback, 20);
    };
  }

  /**
   * @private
   */
  function tickCallback(pStage) {
    if (pStage.isOpen === false) {
      return;
    }

    var tTime = Date.now();
    pStage.step();

    if (pStage.isOpen === true) {
      pStage.timer = setTimeout(tickCallback, pStage.stepRate - (Date.now() - tTime), pStage);
    }
  }

  /**
   * RegExp for converting time strings to step indices.
   * @private
   * @type RegExp
   */
  var mTimeToStepRegex = /^([\d]+)(ms|[sm])$/;

  var mStageCounter = 0;

  /**
   * @constructor
   * @name theatre.Stage
   * @param {Object=} pOptions
   */
  function Stage(pOptions) {
    // Private members.

    this.id = ++mStageCounter;

    /**
     * The timer reference set by setTimeout.
     * @private
     * @type number
     */
    this._timer = null;

    /**
     * The animation frame id for rendering.
     * @private
     * @type number
     */
    this._animationFrameId = null;

    /**
     * Functions to be called in the animation frame.
     * These functions have had their {@link theatre.Actor#schedule}
     * function called in the current step or were added via
     * {@link theatre.Stage#schedule}.
     * @private
     * @type {Array.<function>}
     */
    this._scheduledFunctions = [];

    this._scheduledScripts = [];

    // Public members

    /**
     * The rate at which this Stage updates in milliseconds.
     * Default is 30 frames per second.
     * @type number
     * @default 1000/30
     */
    this.stepRate = 1000 / 30;

    /**
     * @private
     * @type {Array}
     */
    this._actors = [];

    this._registeredActors = [];

    /**
     * @private
     * @type {Object}
     */
    this._data = {};


    /**
     * A flag for if this Stage is currently playing or not.
     * @type boolean
     * @default false
     */
    this.isOpen = false;

    this.keyManager = new theatre.KeyManager(this);

    this.pointerManager = new theatre.PointerManager(this);

    this.state = Stage.STATE_IDLING;

    var tStageManager = new StageManager();

    tStageManager.layer = 0;
    tStageManager.stage = this;

    this._actors.push(tStageManager);

    /**
     * The main StageManager that manages the whole Stage.
     * @return theatre.StageManager
     */
    this.getStageManager = function() {
      return tStageManager;
    };

    /**
     * The main cue manager for this Stage.
     * @private
     * @type {theatre.CueManager}
     */
    this._cueManager = new theatre.CueManager(tStageManager.treeNode);

    tStageManager.start();
  }

  Stage.STATE_IDLING = 1;
  Stage.STATE_STEPPING = 2;
  Stage.STATE_PREPARING = 3;
  Stage.STATE_ENTERING = 4;
  Stage.STATE_SCHEDULING = 5;
  Stage.STATE_UPDATING = 6;
  Stage.STATE_SCRIPTING = 7;
  Stage.STATE_LEAVING = 8;

  /**
   * @private
   * @this {theatre.Stage}
   */
  function runScheduledFunctions() {
    this._animationFrameId = null;

    if (this.isOpen === false) {
      return;
    }

    var i, il;
    var tScheduledFunctions = this._scheduledFunctions.splice(0, this._scheduledFunctions.length);

    for (i = 0, il = tScheduledFunctions.length; i < il; i++) {
      tScheduledFunctions[i].call(this);
    }

    if (this._animationFrameId === null && this._scheduledFunctions.length > 0) {
      this._animationFrameId = mRequestAnimationFrame((function(pContext) {
        return function() {
          runScheduledFunctions.call(pContext);
        };
      })(this));
    }
  }

  /**
   * Converts a given time string to a step index
   * based on the current {@link theatre.Stage#stepRate}.
   * @param {(String|Number)} pTime The index or a time string.
   * @param {Number} pRate The step rate to calculate against.
   * @return {Number} A step index.
   */
  Stage.timeToStep = function(pTime, pRate) {
    if (typeof pTime === 'number') {
      return pTime;
    }

    var tResult = mTimeToStepRegex.exec(pTime);
    if (tResult === null) {
      throw new Error('Bad time string');
    }
    switch (tResult[2]) {
      case 'ms':
        return (tResult[1] / pRate) | 0;
      case 's':
        return ((tResult[1] * 1000) / pRate) | 0;
      case 'm':
        return ((tResult[1] * 60 * 1000) / pRate) | 0;
    }

    throw new Error('Bad time string');
  };

  Stage.prototype = /** @lends theatre.Stage# */ {

    /**
     * Converts a given time string to a step index
     * based on the current {@link theatre.Stage#stepRate}.
     * @param {(string|number)} pTime The index or a time string.
     * @return {number} A step index.
     */
    timeToStep: function(pTime) {
      return Stage.timeToStep(pTime, this.stepRate);
    },

    /**
     * Opens the Stage and starts the play.
     * Actors will start acting.
     * @return theatre.Stage This Stage.
     */
    open: function() {
      if (this.isOpen) {
        return;
      }
      this.isOpen = true;

      this.execute();

      this.timer = setTimeout(tickCallback, 0, this);
    },

    /**
     * Closes the Stage and stops the play.
     * All Actors stop acting.
     * @return theatre.Stage This Stage.
     */
    close: function() {
      if (!this.isOpen) {
        return;
      }

      clearTimeout(this.timer);
      this.timer = null;
      this.isOpen = false;
    },

    registerActor: function(pActor) {
      this._actors.push(pActor);
      this._registeredActors.push(pActor);
    },

    unregisterActor: function(pActor) {
      var tActors = this._actors;
      var tIndex = tActors.indexOf(pActor);

      if (tIndex !== -1) {
        this._actors.splice(tIndex, 1);
      }
    },

    /**
     * Adds an Actor to this Stage's StageManager.
     * @param {theatre.Actor} pActor The Actor to add.
     * @param {number=} pLayer The layer to add to.
     * @return {theatre.Actor} The new Actor.
     */
    addActor: function(pActor, pLayer) {
      return this.getStageManager().addActor(pActor, pLayer);
    },

    /**
     * Schedules a function to run in the animation frame.
     * @param {function} The function to schedule.
     */
    schedule: function(pFunction) {
      this._scheduledFunctions.push(pFunction);
    },

    /**
     * Schedules a script to be run.
     * @param {function} pScript
     */
    scheduleScript: function(pScript) {
      this._scheduledScripts.push(pScript);
    },

    /**
     * @private
     */
    doScheduledScripts: function() {
      var tStageScripts = this._scheduledScripts;
      var tLength = tStageScripts.length;
      var tScripts;
      var i;

      while (tLength !== 0) {
        tScripts = tStageScripts.splice(0, tLength);

        for (i = 0; i < tLength; i++) {
          tScripts[i]();
        }

        tLength = tStageScripts.length;
      }
    },

    /**
     * @private
     */
    execute: function() {
      // Run all prepared scripts from top down first to last.
      this.state = Stage.STATE_PREPARING;
      this.broadcast('prepare', null, true, true);

      // Run all enterstep handlers from top down first to last.
      this.state = Stage.STATE_ENTERING;
      this.broadcast('enterstep', null, false, false);

      var tActors = this._actors.slice(0);
      var tActor;
      var tRegisteredActors = this._registeredActors;

      this.state = Stage.STATE_SCHEDULING;

      for (var i = tActors.length - 1; i >= 0; i--) {
        tActor = tActors[i];

        if (tActor.isActing === true) {
          tActor.scheduleScripts();
        }
      }

      // Run all update handlers from bottom up last to first.
      this.state = Stage.STATE_UPDATING;
      this.broadcast('update', null, true, true);

      this.state = Stage.STATE_SCRIPTING;
      this.doScheduledScripts();

      if (this._animationFrameId === null && this._scheduledFunctions.length !== 0) {
        this._animationFrameId = mRequestAnimationFrame((function(pContext) {
          return function() {
            runScheduledFunctions.call(pContext);
          };
        })(this));
      }

      // Run all leavestep handlers from top down first to last.
      this.state = Stage.STATE_LEAVING;
      this.broadcast('leavestep', null, false, false);

      tRegisteredActors.length = 0;

      this.state = Stage.STATE_IDLING;
    },

    /**
     * Does a single step.
     * Progresses the whole Stage and all active Actors
     * forward by one step.
     * @private
     */
    step: function() {
      this.state = Stage.STATE_SCRIPTING;

      this.doScheduledScripts();

      this.state = Stage.STATE_STEPPING;

      var tActors = this._actors;
      var tActor;

      // Step all Actors by 1. This might loop things.
      // This will not execute any scripts.
      // This only updates the states of Actors.
      for (var i = 0, il = tActors.length; i < il; i++) {
        tActor = tActors[i];

        if (tActor.isActing === true) {
          tActor.step(1);
        }
      }

      this.execute();
    },

    setData: function(pKey, pValue) {
      this._data[pKey] = pValue;
    },

    getData: function(pKey, pValue) {
      return this._data[pKey];
    },

    clearData: function() {
      this._data = {};
    },

    /**
     * Registers the given listener for the given cue type.
     * @param {string} pName The type of cue.
     * @param {function} pListener The listener.
     * @param {bool=false} pCapture True to callback in the capture phase, false for bubble.
     */
    on: function(pName, pListener, pCapture) {
      this._cueManager.on(null, pName, pListener, pCapture);
    },

    /**
     * Unregisters the given listener from the given cue type.
     * @param {string} pName The type of cue.
     * @param {function} pListener The listener.
     * @param {bool=false} pCapture True to callback in the capture phase, false for bubble.
     */
    ignore: function(pName, pListener, pCapture) {
      this._cueManager.ignore(null, pName, pListener, pCapture);
    },

    /**
     * Sends a cue to all listeners for that cue.
     * @param {string} pName The type of cue.
     * @param {Object=} pData Data to send with the cue if any.
     * @param {bool} pBubbles If this cue bubbles or not.
     * @param {bool} pCaptures If this cue captures or not.
     * @param {bool} pIsStoppable If this cue can be stopped or not.
     */
    cue: function(pName, pData, pBubbles, pCaptures, pIsStoppable) {
      this._cueManager.cue(pName, pData, null, pBubbles, pCaptures, pIsStoppable, false);
    },

    /**
     * Sends a broadcast cue to all listeners for that cue.
     * @param {string} pName The type of cue.
     * @param {Object=} pData Data to send with the cue if any.
     * @param {bool=false} pBottomUp Process bottom up if true, top down if false.
     * @param {bool=false} pLastToFirst Process siblings last to first if true.
     *                                  Last to first if false.
     */
    broadcast: function(pName, pData, pBottomUp, pLastToFirst) {
      this._cueManager.broadcast(pName, pData, null, pBottomUp, pLastToFirst);
    }
  };

  Stage.prototype.constructor = Stage;

}(this));
