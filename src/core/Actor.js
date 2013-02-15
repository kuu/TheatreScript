/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre,
      Stage = theatre.Stage,
      Matrix2D = global.benri.geometry.Matrix2D,
      max = global.Math.max,
      TreeNode = theatre.TreeNode;

  theatre.Actor = Actor;

  TreeNode.registerSimpleProcess('onActorEnter', function() {
    var tActor = this.actor;

    if (tActor.parent === null) {
      return;
    }

    var tStage = tActor.stage = tActor.parent.stage;

    tStage.registerActor(tActor);

    tActor.cue('enter');

    /*if (!pScheduleNow) {
      tActor.parent.on('scheduledscripts', function onScheduledScripts() {
        this.ignore('scheduledscripts', onScheduledScripts);
        tActor.scheduleScripts();
        tActor.cue('scheduledscripts');
      });
    }*/

    /*if (tStage.isOpen === false) {
      tActor.startNextStep();
    } else {
      tActor.start();
      tActor.invalidate();
      if (pScheduleNow === true) {
        tActor.scheduleScripts();
      }
    }*/
  });

  TreeNode.registerSimpleProcess('onActorLeave', function() {
    var tActor = this.actor;

    if (tActor.stage === null) {
      return;
    }

    tActor.cue('leave');

    //tActor.stop();

    //tActor.step(-tActor.currentStep);

    //tActor._currentScene.currentStep = -1;
    //tActor._currentScene.previousStep = -2;

    tActor.stage.unregisterActor(tActor);

    tActor.stage = null;
  });

  function onPrepare(pData) {
    if (this.isActing === false) {
      return;
    }

    this._prepare();
  }

  /**
   * @constructor
   * @private
   * @param {string} pName The name of the scene.
   */
  function _Scene(pName) {
    this.name = pName;
    this.stepInfo = {
      previousStep: -1,
      looped: false
    };
    this.currentStep = 0;
    this.length = 0;
    this.labels = null;
    this.scripts = [new Array(0), new Array(0)];
    this.data = null;
  }

  var mGlobalIds = 0;

  /**
   * The base object for working with something on a stage.
   * @constructor
   * @name theatre.Actor
   */
  function Actor() {

    this.id = ++mGlobalIds;

    Matrix2D.initExtention(this);

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
   * @param {number} pStep
   * @param {function} pScript
   * @param {number} pType 0 for preparation scripts and 1 for normal scripts.
   * @param {number=} pIndex The index to insert at or append as default.
   */
  function addScriptToScene(pStep, pScript, pType, pIndex) {
    var tScene = this._currentScene;
    var tScripts = tScene.scripts[pType];
    var tOtherScripts = tScene.scripts[pType ^ 1];

    if (pStep >= tScene.length) {
      tScene.length = pStep + 1;
    }

    if (tScripts[pStep] === void 0) {
      if (typeof pIndex === 'number') {
        tScripts[pStep] = new Array(pIndex + 1);
        tScripts[pStep][pIndex] = pScript;
      } else {
        tScripts[pStep] = [pScript];
      }

      tOtherScripts[pStep] = [];
    } else {
      if (typeof pIndex === 'number') {
        tScripts[pStep].splice(pIndex, 0, pScript);
      } else {
        tScripts[pStep].push(pScript);
      }
    }
  }

  function executeScripts(pContext, pScripts, pStep) {
    if (pScripts[pStep] !== void 0) {
      var tScriptStep = pScripts[pStep];
      for (var i = 0, il = tScriptStep.length; i < il; i++) {
        if (tScriptStep[i].call(pContext) === false) {
          tScriptStep.splice(i, 1);
          il--;
          i--;
        }
      }
    }
  }

  Actor.executeScripts = executeScripts;

  var mActorTotalCueListeners = 0;

  /**
   * For debug
   */
  Actor.getTotalCueListeners = function() {
    return mActorTotalCueListeners;
  };

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

      mActorTotalCueListeners++;
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

      mActorTotalCueListeners--;
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
     * @param {function} pScript
     * @param {number=} pIndex The index to add the script at.
     *                         The default is to append.
     */
    addPreparationScript: function(pStep, pScript, pIndex) {
      addScriptToScene.call(this, pStep, pScript, 0, pIndex);
    },

    /**
     * Adds a script to the given step.
     * @param {number|string} pStep A step index or a time string.
     * @param {function} pScript
     * @param {number=} pIndex The index to add the script at.
     *                         The default is to append.
     */
    addScript: function(pStep, pScript, pIndex) {
      addScriptToScene.call(this, pStep, pScript, 1, pIndex);
    },

    getNumberOfPreparationScripts: function(pStep) {
      var tStepScripts = this._currentScene.scripts[0][pStep];

      if (tStepScripts) {
        return tStepScripts.length;
      } else {
        return 0;
      }
    },

    getNumberOfScripts: function(pStep) {
      var tStepScripts = this._currentScene.scripts[1][pStep];

      if (tStepScripts) {
        return tStepScripts.length;
      } else {
        return 0;
      }
    },

    /**
     * Sets the length of a scene to the give value.
     * @param {number} pLength The length in steps.
     * @param {string=} pSceneName The name of the scene.
     *                             Default is current.
     */
    setSceneLength: function(pLength) {
      var tScene = this._currentScene;

      if (pLength === tScene.length) {
        return;
      }

      tScene.length = tScene.scripts[0].length = tScene.scripts[1].length = pLength;
    },

    _prepare: function() {
      var tScene = this._currentScene;
      var tLength = tScene.length;
      var tCurrentStep;
      var tInfo = tScene.stepInfo;
      var tLooped = tInfo.looped;
      var tPreviousStep;
      var tDelta;
      var tData;
      var tScripts;
      var i, il;

      if (tLooped === true && tLength <= 1) {
        this.stop();
        return;
      }

      tCurrentStep = tScene.currentStep;
      tPreviousStep = tInfo.previousStep;

      tDelta = tCurrentStep - tPreviousStep;

      if (tDelta < 0) {
        tPreviousStep = -1;
      }

      tScripts = tScene.scripts[0];

      for (i = tPreviousStep + 1, il = tCurrentStep; i <= il; i++) {
        tData = {
          delta: tDelta,
          currentStep: i,
          targetStep: tCurrentStep,
          looped: tLooped
        };

        tScene.currentStep = i;

        this.cue('startstep', tData);

        if (tData.stopped === false) {
          executeScripts(this, tScripts, i);
          this.cue('endstep', tData);
        }
      }
    },

    /**
     * Execute all prepared scripts for the current step.
     */
    doPreparedScripts: function() {
      executeScripts(this, this._currentScene.scripts[0], this.currentStep);
    },

    /**
     * Runs the scripts of the given scene and step.
     * @param {number=} pStep The step to run. Default is the current step.
     * @param {theatre.Actor=} pContext The context to run the scripts from. Default context is this.
     */
    doScripts: function(pStep, pContext) {
      var tScene = this._currentScene;

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
     * @return {boolean} True on success. False on error.
     */
    scheduleScripts: function(pStep, pContext) {
      if (this.stage === null) {
        return false;
      }

      var tSelf = this;
      var tScene = this._currentScene;

      if (typeof pStep !== 'number') {
        pStep = tScene.currentStep;
      }

      if (this.hasScripts(pStep) === false) {
        return;
      }

      if (!pContext) {
        pContext = this;
      }

      tScene = null;

      this.stage.scheduleScript(function() {
        if (pContext.stage !== null) {
          tSelf.doScripts(pStep, pContext);
        }
      });
    },

    /**
     * Checks to see if the given scene
     * at the given step has any scripts
     * that can be executed or scheduled.
     * @param  {number}  pStep      The step.
     * @return {boolean}            True if there are scripts. False otherwise.
     */
    hasScripts: function(pStep) {
      var tScene = this._currentScene;
      var tScripts = tScene.scripts[1][pStep];

      if (!tScripts || tScripts.length === 0) {
        return false;
      }

      return true;
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
     */
    start: function() {
      if (this.isActing === false) {
        this.on('prepare', onPrepare);
        this.isActing = true;
        this.cue('prepare');
      }
    },

    /**
     * Makes the Actor starting acting and playing
     * next step. However, the Actor is set to
     * an acting state now (isActing is true).
     */
    startNextStep: function() {
      if (this.isActing === false) {
        this.on('prepare', onPrepare);
        this.isActing = true;
      }
    },

    /**
     * Makes the Actor stop acting and playing
     * it's scripts.
     */
    stop: function() {
      if (this.isActing === true) {
        this.ignore('prepare', onPrepare);
        this.isActing = false;
      }
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
      this._prepare();
      this.scheduleScripts();
    },

    /**
     * Goes to the given label in the current scene.
     * This will execute scripts instantly in the label given.
     * @param {string} pName The label name.
     * @return {theatre.Actor} This Actor.
     */
    gotoLabel: function(pName) {
      var tScene = this._currentScene;
      var tLabels = tScene.labels;

      if (tLabels === null) {
        return;
      }

      var tStep = tLabels[pName];

      if (tStep === void 0 || tStep >= tScene.length) {
        return false;
      }

      if (tStep === tScene.currentStep) {
        return;
      }

      this.step(tStep - tScene.currentStep);
      this._prepare();
      this.scheduleScripts();
    },

    /**
     * Sets the current step to the specified step.
     * This will differs from goto in that it will not
     * step the steps inbetween and not run any
     * preparation scripts or scripts at all.
     * This function could cause many logic bugs
     * so use wisely.
     * @param  {number} pStep The step to set to
     */
    setStep: function(pStep) {
      var tScene = this._currentScene;

      if (pStep >= tScene.length || pStep < 0) {
        return false;
      }

      tScene.stepInfo.previousStep = pStep - 1;
      tScene.stepInfo.looped = false;
      tScene.currentStep = pStep;
    },

    setData: function(pKey, pData) {
      var tData = this._currentScene.data = (this._currentScene.data || {});

      tData[pKey] = pData;
    },

    getData: function(pKey, pDefault) {
      var tData = this._currentScene.data;

      if (tData === null || !(pKey in tData)) {
        return pDefault;
      }

      return tData[pKey];
    },

    clearData: function() {
      this._currentScene.data = null;
    },

    /**
     * Sets a label to easily reference the given step.
     * @param {string} pSceneName The scene name.
     * @param {string} pName The name of the label to set.
     */
    setLabel: function(pName, pStep) {
      var tCurrentScene = this._currentScene;

      if (tCurrentScene.labels === null) {
        tCurrentScene.labels = {};
      }

      tCurrentScene.labels[pName] = pStep;
    },

    /**
     * Removes a label previously set with setLabel.
     * @param {string} pName The name of the label to set.
     */
    removeLabel: function(pName) {
      var tLabels = this._currentScene.labels;

      if (tLabels !== null) {
        delete tLabels[pName];
      }
    },

    /**
     * Gets a label's step index previously set with setLabel.
     * @param {string} pName The name of the label to get.
     * @return {number|null} The step or null if the label doesn't exist.
     */
    getLabelStep: function(pName) {
      var tLabels = this._currentScene.labels;

      if (tLabels === null) {
        return null;
      }

      var tStep = tLabels[pName];

      if (tStep === void 0) {
        return null;
      }

      return tStep;
    },

    /**
     * Starts acting a scene if the Actor already hasn't.
     * This will remove all children currently belonging
     * to this Actor.
     * The current acting status (isActing) will stay unchanged.
     * @param {string} pSceneName The scene to change to.
     */
    changeScene: function(pSceneName) {
      if ((pSceneName in this._scenes) === false) {
        this._scenes[pSceneName] = new _Scene(pSceneName);
      }

      if (this._currentScene.name === pSceneName) {
        return;
      }

      var tChildren = this.getActors();

      for (var i = 0, il = tChildren.length; i < il; i++) {
        tChildren[i].leave();
      }

      var tScene = this._scenes[pSceneName];
      this._currentScene = tScene;
    },

    /**
     * Steps through scene scripts by the delta provided.
     * @private
     * @param {number} pDelta
     */
    step: function(pDelta) {
      if (this.stage === null || this.stage.isOpen === false) {
        return;
      }

      var tScene = this._currentScene;
      var tInfo = tScene.stepInfo;
      var tPreviousStep = tInfo.previousStep = tScene.currentStep;
      var tLength = tScene.length;
      var tCurrentStep = tScene.currentStep += pDelta;
      var i, il;

      if (tCurrentStep >= tLength) {
        tScene.currentStep = 0;
        tInfo.previousStep = -1;
        tInfo.looped = true;
      } else {
        tInfo.looped = false;
      }
    },

    /**
     * Adds a new Actor of the given type to the Stage as a child of
     * this Actor.
     * @param {theatre.Actor} pActor The Actor to add.
     * @param {number=} pLayer The layer to add to or auto.
     * @param {bool=true} pDoStep If true, steps this and all children by 1.
     * @return {theatre.Actor} The Actor added.
     * @todo Make the layer counter smart.
     */
    addActor: function(pActor, pLayer) {
      var tName;
      var tStage = this.stage;
      var tNode = pActor.treeNode;
      var tNameToActorMap;

      /*if (typeof pScheduleNow !== 'boolean') {
        pScheduleNow = false;
      }*/

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
        tNode.processTopDownFirstToLast('onActorEnter');
      }

      return pActor;
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
     * @param {number} pLayer The layer to retrieve from.
     * @return {theatre.Actor|null} The Actor or null.
     */
    getActorAtLayer: function(pLayer) {
      return this._layerToActorMap['' + pLayer] || null;
    },

    /**
     * Gets the Actor at the given layer or null if there is
     * no Actor there.
     * @param {number} pLayer The layer to retrieve from.
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
     * Gets the name of this Actor.
     * @return {string} The name of the Actor.
     */
    getName: function() {
      return this._name;
    },

    /**
     * Sets the name of this Actor.
     * @param {string} pName The name to set to.
     */
    setName: function(pName) {
      // First remove the current name of maps.
      this._removeFromNameToActorMap();

      if (this.parent !== null) {
        // Register this name with the parent.
        var tNameToActorMap = this.parent._nameToActorMap;

        if (tNameToActorMap[pName] === void 0) {
          tNameToActorMap[pName] = [this];
        } else {
          tNameToActorMap[pName].push(this);
        }
      }

      this._name = pName;
    },

    /**
     * Gets the current scene name.
     * @return {string}
     */
    getSceneName: function() {
      return this._currentScene.name;
    },

    /**
     * Gets the current scene's current step.
     * @return {number}
     */
    getCurrentStep: function() {
      return this._currentScene.currentStep;
    },

    /**
     * Gets the current scene's number of steps.
     * @return {number}
     */
    getNumberOfSteps: function() {
      return this._currentScene.length;
    },

    /**
     * The absolute position of this Actor on the Stage.
     * @return {benri.geometry.Matrix2D}
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

      var tMatrix = new Matrix2D();

      for (var i = tMatrixStack.length - 1; i !== -1; i--) {
        tMatrix.multiply(tMatrixStack[i]);
      }

      return tMatrix;
    }
  };

  Matrix2D.extend(Actor.prototype);

  Actor.prototype.constructor = Actor;

}(this));
