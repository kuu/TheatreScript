/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.define('theatre.Stage', Stage);

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
    var tTime = Date.now();
    pStage.step();
    if (pStage.isOpen) {
      pStage.timer = setTimeout(tickCallback, pStage.stepRate - (Date.now() - tTime), pStage);
    }
  }

  /**
   * RegExp for converting time strings to step indices.
   * @private
   * @type RegExp
   */
  var mTimeToStepRegex = /^([\d]+)(ms|[sm])$/;

  /**
   * @constructor
   * @name theatre.Stage
   * @param {Object=} pOptions
   */
  function Stage(pOptions) {
    // Private members.

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

    // Public members

    /**
     * The rate at which this Stage updates in milliseconds.
     * Default is 30 frames per second.
     * @type number
     * @default 1000/30
     */
    this.stepRate = 1000 / 30;


    /**
     * A flag for if this Stage is currently playing or not.
     * @type boolean
     * @default false
     */
    this.isOpen = false;

    this.keyManager = new theatre.KeyManager(this);

    this.motionManager = new theatre.MotionManager(this);

    this.scheduler = new theatre.Scheduler();

    var tStageManager;

    /**
     * The main StageManager that manages the whole Stage.
     * @field
     * @name theatre.Stage#stageManager
     * @type theatre.StageManager
     */
    Object.defineProperty(this, 'stageManager', {
      get: function() {
        return tStageManager;
      },
      set: function(pStageManager) {
        tStageManager = pStageManager;
        pStageManager.layer = 0;
        pStageManager.stage = this;
      }
    });

    this.stageManager = new theatre.StageManager();

    /**
     * The main cue manager for this Stage.
     * @private
     * @type {theatre.CueManager}
     */
    this._cueManager = new theatre.CueManager(tStageManager.treeNode);

    tStageManager.startActing();
  }


  /**
   * @private
   * @this {theatre.Stage}
   */
  function runScheduledFunctions() {
    if (this.isOpen === false) {
      return;
    }

    var i, il;
    var tScheduledFunctions = this._scheduledFunctions.splice(0, this._scheduledFunctions.length);

    this._animationFrameId = null;

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

  /**
   * An instance counter for actors to create unique ID's
   * for each Actor instance.
   * @private
   * @type {Number}
   */
  Stage._actorNameCounter = 1;

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

    /**
     * Adds an Actor to this Stage's StageManager.
     * @param {theatre.Actor} pActor The Actor to add.
     * @param {Object=} pOptions Options.
     * @return {theatre.Actor} The new Actor.
     */
    addActor: function(pActor, pOptions) {
      return this.stageManager.addActor(pActor, pOptions);
    },

    /**
     * Schedules a function to run in the animation frame.
     * @param {theatre.Actor} pActor
     */
    schedule: function(pFunction) {
      this._scheduledFunctions.push(pFunction);
    },

    /**
     * Schedules a script to be run.
     * @param {Function} pScript
     */
    scheduleScript: function(pScript, pLevel) {
      this.scheduler.add(pScript, pLevel);
    },

    doScheduledScripts: function(pReverse, pHighPriorityFirst) {
      var tScheduler = this.scheduler;

      while (tScheduler.hasScripts) {
        tScheduler.run(pReverse, pHighPriorityFirst);
      }
    },

    /**
     * Does a single step.
     * Progresses the whole Stage and all active Actors
     * forward by one step.
     * @private
     * @todo Need to implement this correctly.
     */
    step: function() {
      if (this.isOpen === false) {
        return;
      }

      this.doScheduledScripts();

      // Run all prepared scripts from top down first to last.
      this.broadcast('prepare', null, false, false);

      // Run all enterstep handlers from top down first to last.
      this.broadcast('enterstep', null, false, false);

      // Run all update handlers from bottom up last to first.
      this.broadcast('update', null, true, true);

      this.doScheduledScripts(false, false);

      if (this._animationFrameId === null && this._scheduledFunctions.length !== 0) {
        this._animationFrameId = mRequestAnimationFrame((function(pContext) {
          return function() {
            runScheduledFunctions.call(pContext);
          };
        })(this));
      }

      // Run all leavestep handlers from top down first to last.
      this.broadcast('leavestep', null, false, false);
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
