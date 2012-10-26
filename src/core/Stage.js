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
     * Currently active Actors that are acting.
     * @private
     * @type Array.<theatre.Actor>
     */
    this._actingActors = [];

    /**
     * An overall map of event listeners.
     * @private
     * @type Object
     */
    this._listeners = {};

    /**
     * Functions to be called in the animation frame.
     * These functions have had their {@link theatre.Actor#schedule}
     * function called in the current step or were added via
     * {@link theatre.Stage#schedule}.
     * @private
     * @type {Array.<function>}
     */
    this._scheduledFunctions = [];

    /**
     * Scripts that are scheduled to be executed on the next pass.
     * @type {Array.<Function>}
     * @private
     */
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
     * A flag for if this Stage is currently playing or not.
     * @type boolean
     * @default false
     */
    this.isOpen = false;

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
        pStageManager.isActing = true;
        this.activateActor(pStageManager, true);
      }
    });

    this.stageManager = new theatre.StageManager();
  }


  /**
   * @private
   * @this {theatre.Stage}
   */
  function runScheduledFunctions() {
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
        return this;
      }
      this.isOpen = true;
      this.timer = setTimeout(tickCallback, this.stepRate, this);
      return this;
    },

    /**
     * Closes the Stage and stops the play.
     * All Actors stop acting.
     * @return theatre.Stage This Stage.
     */
    close: function() {
      if (!this.isOpen) {
        return this;
      }
      clearTimeout(this.timer);
      this.timer = null;
      this.isOpen = false;
      return this;
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
    scheduleScript: function(pScript) {
      this._scheduledScripts.push(pScript);
    },

    /**
     * Does a single step.
     * Progresses the whole Stage and all active Actors
     * forward by one step.
     * @private
     * @todo Need to implement this correctly.
     */
    step: function() {
      var i, il, tActingActors;
      var tScripts = this._scheduledScripts;

      for (i = 0; i < tScripts.length; i++) {
        tScripts[i]();
      }
      this._scheduledScripts = [];

      this.cue('enterstep');

      var tActingActorDepths = this._actingActors.slice(0),
          tDepth,
          tIndex = tDepth = tActingActorDepths.length;

      // Only run prepared callbacks and update
      // the current slide index on each actor.
      while (tIndex-- !== 0) {
        if (tActingActorDepths[tIndex] === void 0) {
          continue;
        }

        tActingActors = tActingActorDepths[tIndex].slice(0);

        for (i = 0, il = tActingActors.length; i < il; i++) {
          tActingActors[i].step(1, true);
        }
      }

      tIndex = tDepth;

      // Run scripts and cues on active actors.
      while (tIndex-- !== 0) {
        if (tActingActorDepths[tIndex] === void 0) {
          continue;
        }
        tActingActors = tActingActorDepths[tIndex].slice(0);

        for (i = 0, il = tActingActors.length; i < il; i++) {
          tActingActors[i].scheduleScripts();
        }
      }

      tScripts = this._scheduledScripts;
      for (i = 0; i < tScripts.length; i++) {
        tScripts[i]();
      }
      this._scheduledScripts = [];

      tScripts = null;
      tActingActorDepths = null;
      tActingActors = null;

      this.cue('update');

      if (this._animationFrameId === null && this._scheduledFunctions.length !== 0) {
        this._animationFrameId = mRequestAnimationFrame((function(pContext) {
          return function() {
            runScheduledFunctions.call(pContext);
          };
        })(this));
      }

      this.cue('leavestep');
    },

    /**
     * Activates an Actor.
     * @private
     * @param {theatre.Actor} pActor
     * @param {boolean} pNoStep
     */
    activateActor: function(pActor, pNoStep) {
      var tParent = pActor.parent,
      tDepth = 0;

      while (tParent !== null) {
        tDepth++;
        tParent = tParent.parent;
      }

      var tActingActors = this._actingActors;
      if (tActingActors.length <= tDepth) {
        tActingActors = tActingActors[tDepth] = new Array();
      } else {
        tActingActors = tActingActors[tDepth];
      }

      if (tActingActors.indexOf(pActor) === -1) {
        tActingActors.push(pActor);
        if (!pNoStep) {
          pActor.step(1);
        }
      }
    },

    /**
     * Deactivates an Actor.
     * @private
     * @param {theatre.Actor} pActor
     */
    deactivateActor: function(pActor) {
      var tParent = pActor.parent,
      tDepth = 0;

      while (tParent !== null) {
        tDepth++;
        tParent = tParent.parent;
      }

      var tActingActors = this._actingActors;
      if (tActingActors[tDepth] === void 0) return;

      var i = tActingActors[tDepth].indexOf(pActor);
      if (i >= 0) {
        tActingActors[tDepth].splice(i, 1);
      }
    },

    /**
     * Registers the given listener for the given cue type.
     * @private
     * @param {string} pName The type of cue.
     * @param {function} pListener The listener.
     */
    on: function(pName, pListener) {
      if (!(pName in this._listeners)) {
        this._listeners[pName] = [pListener];
      } else {
        this._listeners[pName].push(pListener);
      }
    },

    /**
     * Unregisters the given listener from the given cue type.
     * @private
     * @param {string} pName The type of cue.
     * @param {function} pListener The listener.
     */
    ignore: function(pName, pListener) {
      if ((pName in this._listeners)) {
        var tListeners = this._listeners[pName];
        for (var i = 0, il = tListeners.length; i < il; i++) {
          if (tListeners[i] === pListener) {
            tListeners.splice(i, 1);
            break;
          }
        }
        if (tListeners.length === 0) {
          delete this._listeners[pName];
        }
      }
    },

    /**
     * Sends a cue to all listeners for that cue.
     * @param {string} pName The type of cue.
     * @param {Object=} pData Data to send with the cue if any.
     */
    cue: function(pName, pData) {
      if (pName in this._listeners) {
        var tListeners = this._listeners[pName].slice(0);
        for (var i = 0, il = tListeners.length; i < il; i++) {
          var tListener = tListeners[i];
          if (tListener.cue !== void 0) {
            tListener.cue(pName, pData);
          } else {
            tListener.call(this, pName, pData);
          }
        }
      }
    }
  };

  Stage.prototype.constructor = Stage;

}(this));
