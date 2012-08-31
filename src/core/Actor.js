/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre,
      Matrix = theatre.Matrix,
      max = global.Math.max;

  theatre.define('theatre.Actor', Actor);

  /**
   * The base object for working with something on a stage.
   * @constructor
   * @name theatre.Actor
   */
  function Actor() {

    /**
     * A check to make sure we used inherit properly.
     * @type {Boolean}
     * @private
     */
    this._ctorCalled = true;

    /**
     * The Stage this Actor is part of.
     * @type theatre.Stage
     */
    this.stage = null;

    /**
     * The Matrix for the position of this Actor.
     * @type theatre.Matrix
     */
    this.matrix = new Matrix();

    /**
     * The layer this Actor is on.
     * @type number
     */
    this.layer = -1;

    /**
     * The parent of this Actor
     * @type theatre.Actor
     */
    this.parent = null;

    /**
     * The name of this Actor
     * @type string
     */
    this.name = null;

    /**
     * True if this Actor is currently active.
     * @type boolean
     * @default false
     */
    this.isActing = false;

    /**
     * True if invalidate has been called on this Actor.
     * @type boolean
     * @default false
     */
    this.isInvalidated = false;

    /**
     * @private
     * @type {Object}
     */
    this._currentScene = {
      name: '',
      isActing: true,
      currentStep: -1,
      previousStep: -2,
      shouldLoop: true,
      scripts: [new Array(0), new Array(0)]
    };

    /**
     * @private
     * @type {Object}
     */
    this._scenes = {
      '': this._currentScene
    };

    /**
     * @private
     * @type number
     */
    this._layerCounter = 0;
  }

  /**
   * Adds a script to a scene with in the given type.
   * @private
   * @memberOf theatre.Actor#
   * @param {string} pSceneName
   * @param {number} pStep
   * @param {function} pScript
   * @param {number} pType 0 for preparation scripts and 1 for normal scripts.
   */
  function addScriptToScene(pSceneName, pStep, pScript, pType) {
    var tScene;
    if (!pSceneName) {
      pSceneName = '';
    }
    if (pSceneName in this._scenes) {
      tScene = this._scenes[pSceneName].scripts[pType];
    } else {
      tScene = this._scenes[pSceneName] = {
        name: pSceneName,
        isActing: false,
        currentStep: -1,
        previousStep: -2,
        shouldLoop: true,
        scripts: [new Array(), new Array()]
      };
      tScene = tScene.scripts[pType];
    }
    if (tScene.length <= pStep){
      tScene[pStep] = [pScript];
    } else {
      tScene[pStep].push(pScript);
    }
  }

  function executeScripts(pContext, pScripts, pStep) {
    if (pScripts[pStep] !== void 0) {
      var tScriptStep = pScripts[pStep];
      for (var i = 0, il = tScriptStep.length; i < il; i++) {
        tScriptStep[i].call(pContext);
      }
    }
  }

  Actor.prototype = /** @lends theatre.Actor# */ {

    /**
     * Listen for a cue and execute the callback when it happens.
     * @param {string} pName The type of cue.
     * @param {function} pCallback The callback.
     * @return {theatre.Actor} This Actor.
     */
    listen: function(pName, pCallback) {
      if (('_cues' in this) === false) {
        this._cues = new Object();
      }
      if ((pName in this._cues) === false) {
        this._cues[pName] = [pCallback];
        if (this.stage !== null) {
          this.stage.registerListener(pName, this);
        }
      } else {
        this._cues[pName].push(pCallback);
      }
      return this;
    },

    /**
     * Ignores a cue this Actor was previously listening to.
     * @param {string} pName The type of cue.
     * @param {function} pCallback The callback.
     * @return {theatre.Actor} This Actor.
     */
    ignore: function(pName, pCallback) {
      if ('_cues' in this && pName in this._cues) {
        var tCues = this._cues[pName];
        for (var i = 0, il = tCues.length; i < il; i++) {
          if (tCues[i] === pCallback) {
            tCues.splice(i, 1);
            break;
          }
        }
        if (tCues.length === 0) {
          delete this._cues[pName];
          if (this.stage !== null) {
            this.stage.unregisterListener(pName, this);
          }
        }
      }
      return this;
    },

    /**
     * Sends a cue to this Actor.
     * @param {string} pName The type of cue.
     * @param {Object=} pData Data to send with the cue.
     * @return {theatre.Actor} This Actor.
     */
    cue: function(pName, pData) {
      if ('_cues' in this && pName in this._cues) {
        var tCallbacks = this._cues[pName].slice(0);
        for (var i = 0, il = tCallbacks.length; i < il; i++) {
          tCallbacks[i].call(this, {
            target: this,
            data: pData,
            name: pName
          });
        }
      }
      return this;
    },

    /**
     * Invalidates this Actor, causing it's {@link theatre.Actor#act}
     * function to be called this or next step.
     * @return {theatre.Actor} This Actor.
     */
    invalidate: function() {
      if (this.isInvalidated === true) {
        return this;
      }
      this.isInvalidated = true;
      if (this.stage !== null) {
        this.stage.invalidate(this);
      }
      return this;
    },

    /**
     * Adds a preparation script to the given step.
     * Preparation scripts are scripts that get executed
     * before all other scripts and always get executed
     * even if steps are skipped (using goto).
     * There is no guaruntee that other Actors and objects
     * will be loaded during a preparation script and therefore
     * it is not recommended to try to access other Actors.
     * @param {number|string} pStep A step index or a time string.
     * @param {function(this:theatre.Actor)} pScript
     * @param {string} pSceneName The name of the scene to add to.
     * @return {theatre.Actor} This Actor.
     */
    addPreparationScript: function(pStep, pScript, pSceneName) {
      addScriptToScene.call(this, pSceneName, pStep, pScript, 0);
      return this;
    },

    /**
     * Adds a script to the given step.
     * @param {number|string} pStep A step index or a time string.
     * @param {function} pScript
     * @param {string} pSceneName The name of the scene to add to.
     * @return {theatre.Actor} This Actor.
     */
    addScript: function(pStep, pScript, pSceneName) {
      addScriptToScene.call(this, pSceneName, pStep, pScript, 1);
      return this;
    },

    /**
     * Runs the scripts of the given scene and step.
     * @private
     * @param {number=} pStep The step to run. Default is the current step.
     * @param {theatre.Actor} pContext The context to run the scripts from. Default context is this.
     * @param {(string|Object)} pSceneParam The scene name or the scene itself.
     */
    doScripts: function(pStep, pContext, pSceneParam) {
      var tScenes = this._scenes,
          tScene = this._currentScene;

      if (!pSceneParam) {
        tScene = this._currentScene;
      } else if (typeof pSceneParam === 'string') {
        if ((pSceneParam in tScenes) === false) {
          throw new Error('Scene doesn\'t exist: ' + pSceneParam);
        }
        tScene = tScenes[pSceneParam];
      }

      if (typeof pStep !== 'number') {
        pStep = tScene.currentStep;
      }
      if (pContext === void 0) {
        pContext = this;
      }
      executeScripts(pContext, tScene.scripts[1], pStep);
    },

    /**
     * Makes the Actor start acting and playing
     * it's scripts.
     * @return {theatre.Actor} This Actor.
     */
    startActing: function() {
      this.stage.activateActor(this);
      this.isActing = true;
      return this;
    },

    /**
     * Makes the Actor start acting and playing
     * it's scripts.
     * @return {theatre.Actor} This Actor.
     */
    stopActing: function() {
      this.stage.deactivateActor(this);
      this.isActing = false;
      return this;
    },

    /**
     * Goes to the given step or time in the given scene.
     * This will execute scripts instantly in the step given
     * in that scene.
     * @param {string} pSceneName The scene name.
     * @param {number} pStep The step to go to.
     * @return {theatre.Actor} This Actor.
     */
    gotoInScene: function(pSceneName, pStep) {
      if ((pSceneName in this._scenes) === false) {
        throw new Error('Scene doesn\'t exist: ' + pSceneName);
      }
      this.startActingScene(pSceneName);
      var tScene = this._currentScene;
      this.step(pStep - tScene.currentStep, false);
      return this;
    },

    /**
     * Starts acting a scene if the Actor already hasn't.
     * @param {string} pSceneName The scene to start acting.
     * @return {theatre.Actor} This Actor.
     */
    startActingScene: function(pSceneName) {
      if ((pSceneName in this._scenes) === false) {
        throw new Error('Scene doesn\'t exist: ' + pSceneName);
      }
      if (this._currentScene.name === pSceneName) return this;
      this._currentScene.isActing = false;
      var tScene = this._scenes[pSceneName];
      tScene.isActing = true;
      this._currentScene = tScene;
      return this;
    },

    /**
     * Called when an Actor is invalid.
     * All updates and cues should be complete by the time
     * this executes.
     * Do your rendering in here.
     */
    act: function() {},

    /**
     * Steps through scene scripts by the delta provided.
     * @private
     * @param {number} pDelta
     * @param {boolean} pPreparedScriptsOnly
     */
    step: function(pDelta, pPreparedScriptsOnly) {
      var tScene = this._currentScene;

      if (tScene.isActing === false) {
        return;
      }
      var tPreviousStep = tScene.currentStep,
          tScripts = tScene.scripts,
          tLength = max(tScripts[0].length, tScripts[1].length),
          tCurrentStep = tScene.currentStep += pDelta,
          tLooped = false;

      if (tCurrentStep >= tLength) {
        if (tScene.shouldLoop === false || tLength === 1) {
          tScene.currentStep = tLength - 1;
          return;
        }
        tCurrentStep = tScene.currentStep -= tLength;
        tPreviousStep = -1;
        tLooped = true;
      }

      tScene.previousStep = tPreviousStep;
      var i, il;

      if (tPreviousStep === tCurrentStep) {
        if (tLooped === true && !pPreparedScriptsOnly) {
          executeScripts(this, tScripts[0], tCurrentStep);
          executeScripts(this, tScripts[1], tCurrentStep);
        }
      } else if (pDelta < 0 || tLooped === true) {
        // TODO: Make this smart with a diff. Need to handle all things made in a prepared script...
        if (tLooped === true) {
          this.cue('sceneloop');
        }
        for (i = 0, il = tCurrentStep; i <= il; i++) {
          tScene.currentStep = i;
          executeScripts(this, tScripts[0], i);
        }
      } else {
        for (i = tPreviousStep + 1, il = tCurrentStep; i <= il; i++) {
          tScene.currentStep = i;
          executeScripts(this, tScripts[0], i);
        }
      }

      if (!pPreparedScriptsOnly) {
        executeScripts(this, tScripts[1], tCurrentStep);
      }

      if (!pPreparedScriptsOnly) {
        this.cue('update');
      }
    },

    /**
     * Adds a new Actor of the given type to the Stage as a child of
     * this Actor.
     * @param {function(new:theatre.Actor)} pActor The Actor to add.
     * @param {Object=} pOptions Options.
     * @return {theatre.Actor} This Actor.
     * @todo Make a sorted dictionary, not a massive array.
     * @todo Make the layer counter smart.
     */
    addActor: function(pActor, pOptions) {
      if (pActor._ctorCalled !== true) {
        throw new Error('Actor not initialized correctly. Call this.base.constructor() first.');
      }
      
      if (pActor.stage !== null) {
        throw new Error('Actor already belongs to another Actor.');
      }

      pOptions = pOptions || new Object();

      var tLayer = typeof pOptions.layer === 'number' ? pOptions.layer : this._layerCounter++;
      var tActors;
      if (('_actors' in this) === false) {
        tActors = this._actors = new Array(tLayer + 1);
      } else {
        tActors = this._actors;
      }

      if (tActors[tLayer] !== void 0) {
        throw new Error('Actor already exists at layer ' + tLayer);
      }

      var tName = typeof pOptions.name === 'string' ? pOptions.name : 'instance' + theatre.Stage._actorNameCounter++;

      var tStage = this.stage;

      tActors[tLayer] = pActor;
      pActor.stage = tStage;
      pActor.layer = tLayer;
      pActor.name = tName;
      pActor.parent = this;

      function recursiveEnter(pActor) {
        pActor.stage = tStage;

        var tActorCues = pActor._cues;
        if (tActorCues !== void 0) {
          for (var k in tActorCues) {
            tStage.registerListener(k, pActor);
          }
        }

        if (pActor.isInvalidated === true) {
          tStage.invalidate(pActor);
        }
        pActor.cue('enter', pActor._pendingAddActorOptions);
        pActor._pendingAddActorOptions = null;
        pActor.startActing();
        var tChildren = pActor.getActors();
        for (var i = 0, il = tChildren.length; i < il; i++) {
          recursiveEnter(tChildren[i]);
        }
      }

      if (this.stage !== null) {
        pActor._pendingAddActorOptions = pOptions;
        recursiveEnter(pActor);
      } else {
        pActor._pendingAddActorOptions = pOptions;
      }

      return this;
    },

    /**
     * Returns an array of children of this Actor.
     * Note that the returned array not live.
     * @return {Array.<theatre.Actor>} An array of Actors.
     */
    getActors: function() {
      var tResult = new Array(),
          tActors = this._actors;

      if (!tActors) return new Array(0);

      for (var i = 0, il = tActors.length; i < il; i++) {
        if (tActors[i] !== void 0) {
          tResult.push(tActors[i]);
        }
      }
      return tResult;
    },

    /**
     * Gets the Actor at the given layer or null if there is
     * no Actor there.
     * @param {Number} pLayer The layer to retrieve from.
     * @return {theatre.Actor|null} The Actor or null.
     */
    getActorAtLayer: function(pLayer) {
      if (('_actors' in this) === false) {
        return null;
      }
      return this._actors[pLayer] || null;
    },

    /**
     * Searches this Actor's children and their children recursivly until
     * it finds the Actor given in the query or null if it could not be
     * found.
     * @param {string} pQuery The query to search for.
     * @return {theatre.Actor=} The Actor or null.
     */
    findActors: function(pQuery) {
      throw new Error('Not implemented');
    },

    /**
     * Removes this Actor from it's parent.
     */
    leave: function() {
      if (this.parent === null) {
        return;
      }
      if (this.parent._actors[this.layer] !== this) {
        return;
      }
      this.cue('leave');

      function recursivelyDeactivate(pActor) {
        var tChildren = pActor.getActors();
        for (var i = 0, il = tChildren.length; i < il; i++) {
          var tChild = tChildren[i];
          pActor.stage.deactivateActor(tChild); // TODO: How to reactivate afterwards?
          recursivelyDeactivate(tChild);

          var tActorCues = tChild._cues;
          if (tActorCues !== void 0) {
            for (var k in tActorCues) {
              tChild.stage.unregisterListener(k, tChild);
            }
          }

          tChild.stage = null;
        }
      }

      if (this.stage !== null) {
        recursivelyDeactivate(this);

        this.stage.deactivateActor(this);

        var tActorCues = this._cues;
        if (tActorCues !== void 0) {
          for (var i in tActorCues) {
            this.stage.unregisterListener(i, this);
          }
        }
      }

      this.parent._actors[this.layer] = void 0;
      this.parent = null;
      this.stage = null;
    },

    /**
     * The current X position of this Actor.
     * @field
     * @type number
     */
    get x() {
      return this.matrix.e;
    },
    set x(pValue) {
      this.matrix.e = pValue;
    },

    /**
     * The current Y position of this Actor.
     * @field
     * @type number
     */
    get y() {
      return this.matrix.f;
    },
    set y(pValue) {
      this.matrix.f = pValue;
    },

    /**
     * The current rotation of this Actor in radians.
     * @field
     * @type number
     */
    get rotation() {
      return this._rotation;
    },
    set rotation(pValue) {
      this._rotation = pValue;
      this.matrix = this.matrix.rotateAxisAngle(0, 0, 0, pValue);
    },

    /**
     * The current scale X value of this Actor.
     * @field
     * @type number
     */
    get scaleX() {
      return this.matrix.a;
    },
    set scaleX(pValue) {
      this.matrix = this.matrix.scale(pValue, 0);
    },

    /**
     * The current scale Y value of this Actor.
     * @field
     * @type number
     */
    get scaleY() {
      return this.matrix.d;
    },
    set scaleY(pValue) {
      this.matrix = this.matrix.scale(0, pValue);
    }
  };

  Actor.prototype.constructor = Actor;

}(this));
