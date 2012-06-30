/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

use('Theatre', 'StageManager');

(function(global) {

  var theatre = global.theatre;

  theatre.define('theatre.Stage', Stage);

  var mRequestAnimationFrame = global.webkitRequestAnimationFrame !== void 0 ? global.webkitRequestAnimationFrame : null;


  /**
   * @private
   */
  function tickCallback(pStage) {
    var tTime = Date.now();
    pStage.step();
    if (pStage.isOpen) pStage.timer = setTimeout(tickCallback, pStage.stepRate - (Date.now() - tTime), pStage);
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
    this._actingActors = new Array();

    /**
     * An overall map of event listeners.
     * @private
     * @type Object
     */
    this._listeners = new Object();

    /**
     * Actors that need to be rendered.
     * These actors have had their {@link theatre.Actor#invalidate}
     * function called in the current step.
     * @private
     * @type Array.<theatre.Actor>
     */
    this._invalidatedActors = new Array();

    /**
     * An instance counter for actors to create unique ID's
     * for each Actor instance.
     * @private
     * @type number
     */
    this._actorNameCounter = 1;

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
      set: function(pValue) {
        tStageManager = pValue;
        pValue.initialize(null, this);
        pValue.isActing = true;
        this.activateActor(pValue, true);
      }
    });

    this.stageManager = new theatre.StageManager();
  }


  /**
   * @private
   * @this {theatre.Stage}
   */
  function actActors() {
    this._animationFrameId = null;
    var tInvalidated = this._invalidatedActors;

    for (var i = 0, il = tInvalidated.length; i < il; i++) {
      var tActor = tInvalidated[i];
      tActor.act();
      tActor.isInvalidated = false;
    };

    tInvalidated.length = 0;
  }


  Stage.prototype = /** @lends theatre.Stage# */ {

    /**
     * Converts a given time string to a step index
     * based on the current {@link theatre.Stage#stepRate}.
     * @param {(string|number)} pTime The index or a time string.
     * @return {number} A step index.
     */
    timeToStep: function(pTime) {
      if (typeof pTime === 'number') {
        return pTime;
      }

      var tResult = mTimeToStepRegex.exec(pTime);
      if (tResult === null) {
        throw new Error('Bad time string');
      }
      switch (tResult[2]) {
        case 'ms':
          return (tResult[1] / this.stepRate) | 0;
        case 's':
          return ((tResult[1] * 1000) / this.stepRate) | 0;
        case 'm':
          return ((tResult[1] * 60 * 1000) / this.stepRate) | 0;
      }
    },

    /**
     * Opens the Stage and starts the play.
     * Actors will start acting.
     * @return theatre.Stage This Stage.
     */
    open: function() {
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
      clearTimeout(this.timer);
      this.timer = null;
      this.isOpen = false;
      return this;
    },

    /**
     * Invalidates an Actor.
     * @private
     * @param {theatre.Actor} pActor
     */
    invalidate: function(pActor) {
      this._invalidatedActors.push(pActor);
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

      this.cue('enterstep');

      var tActingActorDepths = this._actingActors.slice(0),
          tDepth,
          tIndex = tDepth = tActingActorDepths.length;

      // Only run prepared callbacks and update
      // the current slide index on each actor.
      while (tIndex-- !== 0) {
        tActingActors = tActingActorDepths[tIndex];
        for (i = 0, il = tActingActors.length; i < il; i++) {
          tActingActors[i].step(1, true);
        };
      }

      tIndex = tDepth;

      // Run scripts and cues on active actors.
      while (tIndex-- !== 0) {
        tActingActors = tActingActorDepths[tIndex];
        for (i = 0, il = tActingActors.length; i < il; i++) {
          tActingActors[i].doScripts();
        };
      }

      this.cue('update');

      if (this._animationFrameId === null && this._invalidatedActors.length !== 0) {
        if (mRequestAnimationFrame !== null) {
          this._animationFrameId = mRequestAnimationFrame((function(pContext) {
            return function() {
              actActors.call(pContext);
            }
          })(this));
        } else {
          this._animationFrameId = 1;
          actActors.call(this);
        }
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

      while (tParent != null) {
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
        if (!pNoStep) pActor.step(1);
      }
    },

    /**
     * Deactivates an Actor.
     * @private
     * @param {theatre.Actor} pActor
     */
    deactivateActor: function(pActor) {
      var tParent = pReel.parent,
      tDepth = 0;

      while (tParent != null) {
        tDepth++;
        tParent = tParent.parent;
      }

      var tActingActors = this._actingActors;
      if (tActingActors[tDepth] === void 0) return;

      var i = tActingActors[tDepth].indexOf(pActor);
      if (i >= 0) {
        tActingActors.splice(i, 1);
      }
    },

    /**
     * Sets the background of the Stage.
     * @param {string} pBackground
     */
    setBackground: function(pBackground) {
      this.background = pBackground;
    },

    /**
     * Registers the given listener for the given cue type.
     * @private
     * @param {string} pName The type of cue.
     * @param {function} pListener The listener.
     */
    registerListener: function(pName, pListener) {
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
    unregisterListener: function(pName, pListener) {
      if ((pName in this._listeners)) {
        var tListeners = this._listeners[pName];
        for (var i = 0, il = tListeners.length; i < il; i++) {
          if (tListeners[i] === pListener) {
            tListeners.splice(i, 1);
            break;
          }
        };
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
          tListeners[i].cue(pName, pData);
        };
      }
    }
  }

}(this));
