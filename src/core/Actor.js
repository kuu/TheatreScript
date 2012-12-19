/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre,
      Stage = theatre.Stage,
      Matrix = theatre.Matrix,
      max = global.Math.max,
      TreeNode = theatre.TreeNode;

  theatre.define('theatre.Actor', Actor);


  TreeNode.registerSimpleProcess('onActorEnter', function(pScheduleNow) {
    var tActor = this.actor;

    if (tActor.parent === null) {
      return;
    }

    var tStage = tActor.stage = tActor.parent.stage;

    tStage.registerActor(tActor);

    tActor.cue('enter');

    if (!pScheduleNow) {
      tActor.parent.on('scheduledscripts', function onScheduledScripts() {
        this.ignore('scheduledscripts', onScheduledScripts);
        tActor.scheduleScripts();
        tActor.cue('scheduledscripts');
      });
    }

    if (tStage.isOpen === false) {
      tActor.startNextStep();
    } else {
      tActor.start();
      tActor.invalidate();
      if (pScheduleNow === true) {
        tActor.scheduleScripts();
      }
    }
  });

  TreeNode.registerSimpleProcess('onActorLeave', function() {
    var tActor = this.actor;
    if (tActor.stage === null) {
      return;
    }

    tActor.cue('leave');

    tActor.stop();

    tActor.step(-tActor.currentStep);

    tActor._currentScene.currentStep = -1;
    tActor._currentScene.previousStep = -2;

    tActor.stage.unregisterActor(tActor);

    tActor.stage = null;
  });

  function onPrepare(pData) {
    if (this.isActing === true) {
      this.step(1);
    }
  }

  /**
   * @constructor
   * @private
   * @param {string} pName The name of the scene.
   */
  function _Scene(pName) {
    this.name = pName;
    this.isActing = true;
    this.currentStep = -1;
    this.previousStep = -2;
    this.shouldLoop = true;
    this.length = 0;
    this.labels = new Object();
    this.scripts = [new Array(0), new Array(0)];
  }

  /**
   * The base object for working with something on a stage.
   * @constructor
   * @name theatre.Actor
   */
  function Actor() {

    /**
     * A check to make sure we used inherit properly.
     * @type {boolean}
     * @private
     */
    this._ctorCalled = true;

    /**
     * The Stage this Actor is part of.
     * @type {theatre.Stage}
     */
    this.stage = null;
    /**
     * The Matrix for the position of this Actor.
     * @type {theatre.Matrix}
     */
    this.matrix = new Matrix();

    /**
     * The layer this Actor is on.
     * @type {number}
     */
    this.layer = -1;

    /**
     * Reference to the TreeNode this Actor belongs to.
     * @type {theatre.TreeNode}
     */
    this.treeNode = new TreeNode(this);

    /**
     * True if this Actor is currently active.
     * @type {boolean}
     * @default false
     */
    this.isActing = false;

    /**
     * True if invalidate has been called on this Actor.
     * @type {boolean}
     * @default false
     */
    this.isInvalidated = false;

    /**
     * The parent of this Actor
     * @type {theatre.Actor}
     */
    this.parent = null;

    /**
     * Maps layers to child Actors
     * @private
     * @type {Object.<string, theatre.Actor>}
     */
    this._layerToActorMap = {};

    /**
     * The name of this Actor
     * @private
     * @type {string}
     */
    this._name = null;

    /**
     * A map of child Actor names to child Actors.
     * As multiple children could be added with the same name,
     *  the value is an array of Actors.
     * @type {Object.<string, Array<theatre.Actor>>}
     * @private
     */
    this._nameToActorMap = {};

    /**
     * @private
     * @type {_Scene}
     */
    this._currentScene = new _Scene('');

    /**
     * @private
     * @type {Object.<string, _Scene>}
     */
    this._scenes = {
      '': this._currentScene
    };

    /**
     * @private
     * @type {number}
     */
    this._layerCounter = 0;

    /**
     * Holds the props that this Actor is holding.
     * @private
     * @type {Object.<string, theatre.Prop>}
     */
    this._props = {};
  }

  /**
   * Adds a script to a scene with in the given type.
   * @private
   * @param {string} pSceneName
   * @param {number} pStep
   * @param {function} pScript
   * @param {number} pType 0 for preparation scripts and 1 for normal scripts.
   */
  function addScriptToScene(pSceneName, pStep, pScript, pType) {
    var tScene;
    var tScripts;
    var tOtherScripts;
    if (!pSceneName) {
      pSceneName = '';
    }
    if (pSceneName in this._scenes) {
      tScene = this._scenes[pSceneName];
      tScripts = tScene.scripts[pType];
      tOtherScripts = tScene.scripts[pType ^ 1];
    } else {
      tScene = this._scenes[pSceneName] = new _Scene(pSceneName);
      tScripts = tScene.scripts[pType];
      tOtherScripts = tScene.scripts[pType ^ 1];
    }
    if (pStep >= tScene.length) {
      tScripts[pStep] = [pScript];
      tOtherScripts[pStep] = [];
      tScene.length = pStep + 1;
    } else if (tScripts[pStep] === void 0) {
      tScripts[pStep] = [pScript];
      tOtherScripts[pStep] = [];
    } else {
      tScripts[pStep].push(pScript);
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

  Actor.executeScripts = executeScripts;

  Actor.prototype = /** @lends theatre.Actor# */ {

    /**
     * Listen for a cue and execute the callback when it happens.
     * @param {string} pName The type of cue.
     * @param {function} pListener The listener.
     * @param {bool=false} pCapture True to callback in the capture phase, false for bubble.
     */
    on: function(pName, pListener, pCapture) {
      var tCues = this.treeNode.cues;
      if (!pListener) {
        return;
      }
      pCapture = pCapture || false;

      if (!(pName in tCues)) {
        tCues[pName] = [[], []];
      }
      tCues[pName][pCapture ? 0 : 1].push(pListener);
    },

    /**
     * Ignores a cue this Actor was previously listening to.
     * @param {string} pName The type of cue.
     * @param {function} pListener The listener.
     * @param {bool=false} pCapture True to callback in the capture phase, false for bubble.
     */
    ignore: function(pName, pListener, pCapture) {
      var tCues = this.treeNode.cues;
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
    },

    /**
     * Sends a cue to this Actor. Will only cue if this Actor
     * has a Stage.
     * @param {string} pName The type of cue.
     * @param {Object=} pData Data to send with the cue if any.
     * @param {bool} pBubbles If this cue bubbles or not.
     * @param {bool} pCaptures If this cue captures or not.
     * @param {bool} pIsStoppable If this cue can be stopped or not.
     */
    cue: function(pName, pData, pBubbles, pCaptures, pIsStoppable) {
      if (this.stage === null) {
        return;
      }

      this.stage._cueManager.cue(pName, pData, this, pBubbles, pCaptures, pIsStoppable, false);
    },

    /**
     * Sends a broadcast cue to all listeners for that cue from this Actor.
     * @param {string} pName The type of cue.
     * @param {Object=} pData Data to send with the cue if any.
     * @param {bool=false} pBottomUp Process bottom up if true, top down if false.
     * @param {bool=false} pLastToFirst Process siblings last to first if true.
     *                                  Last to first if false.
     */
    broadcast: function(pName, pData, pBottomUp, pLastToFirst) {
      if (this.stage === null) {
        return;
      }

      this.stage._cueManager.broadcast(pName, pData, this, pBottomUp, pLastToFirst);
    },

    /**
     * Invalidates this Actor, causing it's {@link theatre.Actor#act}
     * function to be called this or next step.
     */
    invalidate: function() {
      if (this.stage === null) {
        return;
      }

      this.cue('invalidate', null, true, true, true);
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
     */
    addPreparationScript: function(pStep, pScript, pSceneName) {
      addScriptToScene.call(this, pSceneName, pStep, pScript, 0);
    },

    /**
     * Adds a script to the given step.
     * @param {number|string} pStep A step index or a time string.
     * @param {function} pScript
     * @param {string} pSceneName The name of the scene to add to.
     */
    addScript: function(pStep, pScript, pSceneName) {
      addScriptToScene.call(this, pSceneName, pStep, pScript, 1);
    },

    /**
     * Sets the length of a scene to the give value.
     * @param {number} pLength The length in steps.
     * @param {string=} pSceneName The name of the scene.
     *                             Default is current.
     */
    setSceneLength: function(pLength, pSceneName) {
      var tScene = this._currentScene;

      if (pSceneName) {
        if ((pSceneName in this._scenes) === false) {
          return false;
        }
        tScene = this._scenes[pSceneName];
      }

      if (pLength === tScene.length) {
        return;
      }

      tScene.length = tScene.scripts[0].length = tScene.scripts[1].length = pLength;
    },

    /**
     * Runs the scripts of the given scene and step.
     * @param {number=} pStep The step to run. Default is the current step.
     * @param {theatre.Actor=} pContext The context to run the scripts from. Default context is this.
     * @param {string=} pSceneName The scene name. Defaults to the current scene.
     */
    doScripts: function(pStep, pContext, pSceneName) {
      var tScenes = this._scenes,
          tScene;

      if (!pSceneName) {
        tScene = this._currentScene;
      } else {
        if ((pSceneName in tScenes) === false) {
          throw new Error('Scene doesn\'t exist: ' + pSceneName);
        }
        tScene = tScenes[pSceneName];
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
     * Schedules the given scene's step's scripts to
     * be executed. Will not be executed right away.
     * @param {number=} pStep The step. Defaults to the current step.
     * @param {theatre.Actor=} pContext The context to run the scripts from. Default context is this.
     * @param {string=} pSceneName The scene. Defaults the current scene.
     * @return {boolean} True on success. False on error.
     */
    scheduleScripts: function(pStep, pContext, pSceneName) {
      if (this.stage === null) {
        return false;
      }

      var tSelf = this;

      var tScenes = this._scenes,
          tScene;

      if (!pSceneName) {
        tScene = this._currentScene;
      } else {
        if ((pSceneName in tScenes) === false) {
          return false;
        }
        tScene = tScenes[pSceneName];
      }

      if (typeof pStep !== 'number') {
        pStep = tScene.currentStep;
      }
      if (!pContext) {
        pContext = this;
      }

      tScenes = null;
      tScene = null;

      this.stage.scheduleScript(function() {
        if (pContext.stage !== null) {
          tSelf.doScripts(pStep, pContext, pSceneName);
        }
      });
    },

    /**
     * Adds a prop to this Actor.
     * @param {theatre.Prop} pProp The prop to add
     */
    addProp: function(pProp) {
      if (!pProp.type) {
        throw new Error('Type not set on Prop');
      }

      var tProps = this._props[pProp.type] || (this._props[pProp.type] = []);

      tProps.push(pProp);

      pProp.onAdd(this);
    },

    /**
     * Removes a prop from this Actor.
     * @param  {theatre.Prop} pProp The prop to remove
     */
    removeProp: function(pProp) {
      if (!pProp.type) {
        throw new Error('Type not set on Prop');
      }

      var tProps = this._props[pProp.type];
      var tIndex;

      if (tProps === void 0) {
        return;
      }

      tIndex = tProps.indexOf(pProp);

      if (tIndex !== -1) {
        pProp.onRemove();

        tProps.splice(tIndex, 1);
        if (tProps.length === 0) {
          delete this._props[pProp.type];
        }
      }
    },

    /**
     * Get's an array of props of the given type that
     * this Actor owns.
     * @param {string} pType The type of prop.
     * @return {Array.<theatre.Prop>} The props.
     */
    getProps: function(pType) {
      var tProps = this._props[pType];

      if (tProps === void 0) {
        return [];
      }

      return tProps.slice(0);
    },

    /**
     * Makes the Actor start acting and playing
     * it's scripts.
     * @return {theatre.Actor} This Actor.
     */
    start: function() {
      if (this.isActing === false) {
        this.on('prepare', onPrepare);
        this.isActing = true;
        this.cue('prepare');
      }
    },

    startNextStep: function() {
      if (this.isActing === false) {
        this.on('prepare', onPrepare);
        this.isActing = true;
      }
    },

    /**
     * Makes the Actor stop acting and playing
     * it's scripts.
     * @return {theatre.Actor} This Actor.
     */
    stop: function() {
      if (this.isActing === true) {
        this.ignore('prepare', onPrepare);
        this.isActing = false;
      }
    },

    /**
     * Goes to the given step or time in the given scene.
     * This will execute scripts instantly in the step given
     * in that scene.
     * @param {string} pSceneName The scene name.
     * @param {number} pStep The step to go to.
     * @return {theatre.Actor|null} This Actor.
     */
    gotoInScene: function(pSceneName, pStep) {
      if ((pSceneName in this._scenes) === false) {
        return false;
      }
      this.startActingScene(pSceneName);
      var tScene = this._currentScene;
      if (pStep >= tScene.length) {
        return false;
      }

      if (pStep === tScene.currentStep) {
        return;
      }

      this.step(pStep - tScene.currentStep);
      this.scheduleScripts();
    },

    /**
     * Goes to the given step or time in the current scene.
     * This will execute scripts instantly in the step given
     * in the current scene.
     * @param {number} pStep The step to go to.
     * @return {theatre.Actor} This Actor.
     */
    goto: function(pStep) {
      var tScene = this._currentScene;
      if (pStep >= tScene.length) {
        return false;
      }
      if (pStep === tScene.currentStep) {
        return;
      }
      this.step(pStep - tScene.currentStep);
      this.scheduleScripts();
    },

    /**
     * Goes to the given label in the current scene.
     * This will execute scripts instantly in the label given.
     * @param {string} pName The label name.
     * @return {theatre.Actor} This Actor.
     */
    gotoLabel: function(pName, pSceneName) {
      var tScene;
      var tStep;

      if (pSceneName) {
        if ((pSceneName in this._scenes) === false) {
          return false;
        }
        this.changeScene(pSceneName);
      }

      tScene = this._currentScene;
      tStep = tScene.labels[pName];

      if (tStep === void 0 || tStep >= tScene.length) {
        return false;
      }

      if (tStep === tScene.currentStep) {
        return;
      }

      this.step(tStep - tScene.currentStep);
      this.scheduleScripts();
    },

    /**
     * Sets a label to easily reference the given step.
     * @param {string} pSceneName The scene name.
     * @param {string} pName The name of the label to set.
     * @param {number} pStep The step for the label to reference.
     * @return {theatre.Actor|null} Returns null on error, otherwise this Actor.
     */
    setLabel: function(pName, pStep, pSceneName) {
      var tScene;

      if (pSceneName) {
        if ((pSceneName in this._scenes) === false) {
          return false;
        }
        tScene = this._scenes[pSceneName];
      } else {
        tScene = this._currentScene;
      }

      tScene.labels[pName] = pStep;
    },

    /**
     * Removes a label previously set with setLabelInScene.
     * @param {string} pSceneName The scene name.
     * @param {string} pName The name of the label to set.
     * @return {theatre.Actor} This Actor.
     */
    removeLabel: function(pName, pSceneName) {
      var tScene;

      if (pSceneName) {
        if ((pSceneName in this._scenes) === false) {
          return false;
        }
        tScene = this._scenes[pSceneName];
      } else {
        tScene = this._currentScene;
      }

      delete tScene.labels[pName];
    },

    /**
     * Gets a label's step index previously set with setLabelInScene.
     * @param {string} pSceneName The scene name.
     * @param {string} pName The name of the label to get.
     * @return {number|null} The step or null if the label doesn't exist.
     */
    getLabelStep: function(pName, pSceneName) {
      var tScene;
      var tStep;

      if (pSceneName) {
        if ((pSceneName in this._scenes) === false) {
          return null;
        }
        tScene = this._scenes[pSceneName];
      } else {
        tScene = this._currentScene;
      }

      tStep = tScene.labels[pName];

      if (tStep === void 0) {
        return null;
      }

      return tStep;
    },

    /**
     * Starts acting a scene if the Actor already hasn't.
     * @param {string} pSceneName The scene to start acting.
     * @return {theatre.Actor} This Actor.
     */
    changeScene: function(pSceneName) {
      if ((pSceneName in this._scenes) === false) {
        throw new Error('Scene doesn\'t exist: ' + pSceneName);
      }
      if (this._currentScene.name === pSceneName) return;

      var tChildren = this.getActors();
      for (var i = 0, il = tChildren.length; i < il; i++) {
        tChildren[i].leave();
      }

      this._currentScene.isActing = false;
      var tScene = this._scenes[pSceneName];
      this._currentScene = tScene;
      this.start();
    },

    /**
     * Steps through scene scripts by the delta provided.
     * @private
     * @param {number} pDelta
     */
    step: function(pDelta) {
      var tSelf = this;

      if (this.stage === null || this.stage.isOpen === false) {
        return;
      }

      var tScene = this._currentScene;
      var tPreviousStep = tScene.currentStep;
      var tScripts = tScene.scripts;
      var tLength = tScene.length;
      var tCurrentStep = tScene.currentStep += pDelta;
      var tLooped = false;
      var i, il;
      var tData;

      if (tCurrentStep >= tLength) {
        if (tScene.shouldLoop === false || tLength === 1) {
          tScene.currentStep = tLength - 1;
          this.stop();
          return;
        }
        tCurrentStep = tScene.currentStep -= tLength;
        tPreviousStep = -1;
        tLooped = true;
      }

      if (pDelta < 0) {
        tPreviousStep = tScene.previousStep = tCurrentStep - 1;
      } else {
        tScene.previousStep = tPreviousStep;
      }

      if (tPreviousStep === tCurrentStep) {
        return;
      }

      for (i = tPreviousStep + 1, il = tCurrentStep; i <= il; i++) {
        tData = {
          delta: pDelta,
          currentStep: i,
          targetStep: tCurrentStep,
          looped: tLooped
        };

        tScene.currentStep = i;

        this.cue('startstep', tData);

        if (tData.stopped === false) {
          executeScripts(this, tScripts[0], i);
          this.cue('endstep', tData);
        }
      }
    },

    /**
     * Adds a new Actor of the given type to the Stage as a child of
     * this Actor.
     * @param {theatre.Actor} pActor The Actor to add.
     * @param {number=} pLayer The layer to add to or auto.
     * @param {bool=true} pDoStep If true, steps this and all children by 1.
     * @return {theatre.Actor} This Actor.
     * @todo Make the layer counter smart.
     */
    addActor: function(pActor, pLayer, pScheduleNow) {
      var tName;
      var tStage = this.stage;
      var tNode = pActor.treeNode;
      var tNameToActorMap;

      if (typeof pScheduleNow !== 'boolean') {
        pScheduleNow = false;
      }

      if (pActor._ctorCalled !== true) {
        throw new Error('Actor not initialized correctly. Call this.base.constructor() first.');
      }

      if (pActor.stage !== null) {
        throw new Error('Actor already belongs to another Actor.');
      }

      pLayer = typeof pLayer === 'number' ? pLayer : this._layerCounter++;

      pActor.layer = pLayer;

      if (!this.treeNode.appendChild(tNode)) {
        throw new Error('Actor already exists at layer ' + pLayer);
      }

      pActor.stage = tStage;
      pActor.parent = this;

      if (pActor._name !== null) {
        tNameToActorMap = this._nameToActorMap;
        if (!(pActor._name in tNameToActorMap)) {
          tNameToActorMap[pActor._name] = [pActor];
        } else {
          tNameToActorMap[pActor._name].push(pActor);
        }
      }

      this._layerToActorMap['' + pLayer] = pActor;

      if (tStage !== null) {
        tNode.processTopDownFirstToLast('onActorEnter', pScheduleNow);
      }

      return this;
    },

    /**
     * Returns an array of children of this Actor.
     * Note that the returned array not live.
     * @return {Array.<theatre.Actor>} An array of Actors.
     */
    getActors: function() {
      var tChildNodes = this.treeNode.childNodes;
      var tLength = tChildNodes.length;
      var tActors = new Array(tLength);

      for (var i = 0; i < tLength; i++) {
        tActors[i] = tChildNodes[i].actor;
      }

      return tActors;
    },

    /**
     * Gets the Actor at the given layer or null if there is
     * no Actor there.
     * @param {Number} pLayer The layer to retrieve from.
     * @return {theatre.Actor|null} The Actor or null.
     */
    getActorAtLayer: function(pLayer) {
      return this._layerToActorMap['' + pLayer] || null;
    },

    /**
     * Gets the Actor at the given layer or null if there is
     * no Actor there.
     * @param {Number} pLayer The layer to retrieve from.
     * @return {theatre.Actor|null} The Actor or null.
     */
    getActorByName: function(pName) {
      if (pName in this._nameToActorMap) {
        //  Returns the child added first.
        return this._nameToActorMap[pName][0];
      }

      return null;
    },

    _removeFromNameToActorMap: function() {
      var tActorArray;

      if (this.parent === null) {
        return;
      }
      if ((tActorArray = this.parent._nameToActorMap[this._name]) === void 0) {
        return;
      }
      // Note that the layer is unique but the name is not.
      for (var i = tActorArray.length - 1; i >= 0; i--) {
        if (tActorArray[i].layer === this.layer) {
          tActorArray.splice(i, 1);
          break;
        }
      }
      if (tActorArray.length === 0) {
        delete this.parent._nameToActorMap[this._name];
      }
    },

    /**
     * Removes this Actor from it's parent.
     */
    leave: function() {
      var tNode = this.treeNode;

      if (tNode.parentNode !== null) {
        tNode.processBottomUpFirstToLast('onActorLeave');
        tNode.parentNode.removeChild(tNode);
      }

      if (this.parent !== null) {
        this.parent.invalidate();

        delete this.parent._layerToActorMap['' + this.layer];
        this._removeFromNameToActorMap();

        this.parent = null;
      }
    },

    /**
     * The name of this Actor.
     * @field
     * @type {string}
     */
    get name() {
      return this._name;
    },
    set name(pValue) {
      this._removeFromNameToActorMap();
      if (this.parent !== null) {
        var tNameToActorMap = this.parent._nameToActorMap;
        if (tNameToActorMap[pValue] === void 0) {
          tNameToActorMap[pValue] = [this];
        } else {
          tNameToActorMap[pValue].push(this);
        }
      }
      this._name = pValue;
    },

    /**
     * The current scene name.
     * @field
     * @return {string}
     */
    get scene() {
      return this._currentScene.name;
    },

    /**
     * The current scene's current step.
     * @field
     * @return {number}
     */
    get currentStep() {
      return this._currentScene.currentStep;
    },

    /**
     * The current scene's number of steps.
     * @field
     * @return {number}
     */
    get numberOfSteps() {
      return this._currentScene.length;
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
    },

    /**
     * The absolute position of this Actor on the Stage.
     * @field
     * @type {theatre.Matrix}
     */
    getAbsoluteMatrix: function() {
      if (this.stage === null) {
        return null;
      }

      var tMatrixStack = [this.matrix];
      var tActor = this;

      while (tActor.parent !== null) {
        tActor = tActor.parent;
        tMatrixStack.push(tActor.matrix);
      }

      var tMatrix = new theatre.Matrix();

      for (var i = tMatrixStack.length - 1; i !== -1; i--) {
        tMatrix = tMatrix.multiply(tMatrixStack[i]);
      }

      return tMatrix;
    }
  };

  Actor.prototype.constructor = Actor;

}(this));
