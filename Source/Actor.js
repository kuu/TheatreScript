/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

theatre.require([
	'theatre.Matrix'
],
function(global) {

var theatre = global.theatre,
	Matrix = theatre.Matrix,
	max = global.Math.max;

theatre.define('theatre.Actor', Actor);
theatre.define('theatre.createActor', createActor);

/**
 * The base object for working with something on a stage.
 * @constructor
 * @name theatre.Actor
 */
function Actor() {}

/**
 * Adds a script to a scene with in the given type.
 * @private
 * @memberOf theatre.Actor#
 * @param {string} pSceneName
 * @param {(number|string)} pStep
 * @param {function} pScript
 * @param {number} pType 0 for preparation scripts and 1 for normal scripts.
 */
function addScriptToScene(pSceneName, pStep, pScript, pType) {
	pStep = this.stage.timeToStep(pStep);
	var tScene;
	if (pSceneName in this._scenes) {
		tScene = this._scenes[pSceneName].scripts[pType];
	} else {
		tScene = this._scenes[pSceneName] = {
			isActing: false,
			currentStep: 0,
			previousStep: -1,
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

function executeScripts(pScripts, pStep) {
	if (pScripts[pStep] !== void 0) {
		var self = this;
		pScripts[pStep].forEach(function(pScript) {
			pScript.call(self);
		});
	}
}

Actor.prototype = /** @lends theatre.Actor# */ {

	/**
	 * Initializes this Actor after it is constructed.
	 * @param {!Object} pData Data to pass to each instance of this Actor.
	 * @param {theatre.Stage} pStage The Stage to be added to.
	 * @param {number} pLayer The layer added to.
	 * @param {theatre.Actor} pParent The parent of this Actor.
	 * @param {string} pName The name of this Actor.
	 */
	initialize: function(pData, pStage, pLayer, pParent, pName) {
		/**
		 * The Stage this Actor is part of.
		 * @type theatre.Stage
		 */
		this.stage = pStage;

		/**
		 * The Matrix for the position of this Actor.
		 * @type theatre.Matrix
		 */
		this.matrix = new Matrix();

		/**
		 * The layer this Actor is on.
		 * @type number
		 */
		this.layer = pLayer;

		/**
		 * The parent of this Actor
		 * @type theatre.Actor
		 */
		this.parent = pParent;

		/**
		 * The name of this Actor
		 * @type string
		 */
		this.name = pName;

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
		this._scenes = new Object();


		/**
		 * @private
		 * @type number
		 */
		this._layerCounter = 0;
	},

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
    		this.stage.registerListener(pName, this);
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
    		tCues.some(function(pValue, pIndex) {
    			if (pValue === pCallback) {
    				tCues.splice(pIndex, 1);
    				return true;
    			}
    		});
    		if (tCues.length === 0) {
    			delete this._cues[pName];
    			this.stage.unregisterListener(pName, this);
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
    		var self = this;
    		this._cues[pName].slice(0).forEach(function(pCallback) {
    			pCallback.call(self, {
    				target: self,
    				data: pData,
    				name: pName
    			});
    		});
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
            return;
        }
        this.isInvalidated = true;
        this.stage.invalidate(this);
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
	 * @param {function} pScript
	 * @return {theatre.Actor} This Actor.
	 */
	addPreparationScript: function(pStep, pScript) {
		addScriptToScene.call(this, pSceneName, pStep, pScript, 0);
		return this;
	},

	/**
	 * Adds a script to the given step.
	 * @param {number|string} pStep A step index or a time string.
	 * @param {function} pScript
	 * @return {theatre.Actor} This Actor.
	 */
	addScript: function(pSceneName, pStep, pScript) {
		addScriptToScene.call(this, pSceneName, pStep, pScript, 1);
		return this;
	},

	/**
	 * Runs the scripts of the given scene and step.
	 * @private
	 * @param {(string|Object)} pSceneParam The scene name or the scene itself.
	 * @param {number=} pStep The step to run. Default is the current step.
	 * @param {theatre.Actor} pContext The context to run the scripts from. Default context is this.
	 */
	doScripts: function(pSceneParam, pStep, pContext) {
		var tScenes = this._scenes,
			self = this;

		function _doScripts(pScripts) {
			if (typeof pStep !== 'number') {
				pStep = tScene.currentStep;
			}
			if (pContext === void 0) {
				pContext = this;
			}
			executeScripts(pContext, tScene.scripts[1], pStep);
		}

		if (!pSceneParam) {
			for (tName in tScenes) {
				_doScripts(tScenes[tName].scripts[1]);
			}
		} else if (typeof pSceneParam === 'string') {
			if ((pSceneParam in tScenes) === false) {
				throw new Error('Scene doesn\'t exist: ' + pSceneParam);
			}
			_doScripts(tScenes[pSceneParam].scripts[1]);
		}
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
	 * @param {(number|string)} pStep The step or time to go to.
	 * @return {theatre.Actor} This Actor.
	 */
	gotoInScene: function(pSceneName, pStep) {
		if ((pSceneName in this._scenes) === false) {
			throw new Error('Scene doesn\'t exist: ' + pSceneName);
		}
		var tScene = this._scenes[pSceneName];
		pStep = this.stage.timeToStep(pStep);
		this.step(pStep - tScene.currentStep, tScene, false);
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
		var tScene = this._scenes[pSceneName];
		tScene.isActing = true;
		return this;
	},

	/**
	 * Stops acting a scene if the Actor already hasn't.
	 * @param {string} pSceneName The scene to start acting.
	 * @return {theatre.Actor} This Actor.
	 */
	stopActingScene: function(pSceneName) {
		if ((pSceneName in this._scenes) === false) {
			throw new Error('Scene doesn\'t exist: ' + pSceneName);
		}
		var tScene = this._scenes[pSceneName];
		tScene.isActing = false;
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
	 * Steps through scenes scripts by the delta provided.
	 * @private
	 * @param {number} pDelta
	 * @param {(string|Object)} pSceneParam
	 * @param {boolean} pPreparedScriptsOnly
	 */
	step: function(pDelta, pSceneParam, pPreparedScriptsOnly) {
		var tStage = this.stage,
			self = this,
			tScenes = this._scenes;

		function stepScene(pScene) {
			if (pScene.isActing === false) return;
			var tPreviousStep = pScene.currentStep,
				tScripts = pScene.scripts,
				tLength = max(tScripts[0].length, tScripts[1].length),
				tCurrentStep = pScene.currentStep += pDelta,
				tLooped = false;

			if (tCurrentStep >= tLength) {
				if (self.shouldLoop === false || tLength === 1) {
					pScene.currentStep = tLength - 1;
					return;
				}
				tCurrentStep = pScene.currentStep -= tLength;
				tLooped = true;
			}

			if (tPreviousStep === tCurrentStep) {
				if (tLooped === true && !pPreparedScriptsOnly) {
					executeScripts(self, pScripts[0], tCurrentStep);
					executeScripts(self, pScripts[1], tCurrentStep);
				}
				return;
			}

			if (pDelta < 0 || tLooped === true) {
				// TODO: Support this.
			} else {
				for (var i = tPreviousStep + 1, il = tCurrentStep; i <= il; i++) {
					pScene.currentStep = i;
					executeScripts(self, tScripts[0], i);
				}
			}

			if (!pPreparedScriptsOnly) {
				executeScripts(self, tScripts[1], tCurrentStep);
			}
		}

		if (!pSceneParam) {
			for (tName in tScenes) {
				stepScene(tScenes[tName]);
			}
		} else if (typeof pSceneParam === 'string') {
			if ((pSceneParam in tScenes) === false) {
				throw new Error('Scene doesn\'t exist: ' + pSceneParam);
			}
			stepScene(tScenes[pSceneParam]);
		}

		if (!pPreparedScriptsOnly) {
			this.cue('update');
		}
	},

	/**
	 * Adds a new Actor of the given type to the Stage as a child of
	 * this Actor.
	 * @param {function(new:theatre.Actor)} pClazz The Actor type to add.
	 * @param {Object=} pOptions Options.
	 * @return {theatre.Actor} The new Actor.
	 * @todo Make a sorted dictionary, not a massive array.
	 * @todo Make the layer counter smart.
	 */
	addActor: function(pClazz, pOptions) {
		pOptions = Object.mixin({
			data: null
		}, pOptions);

		var tLayer = typeof pOptions.layer === 'number' ? pOptions.layer : this._layerCounter++,
			tActors;
		if (('_actors' in this) === false) {
			tActors = this._actors = new Array(tLayer + 1);
		} else {
			tActors = this._actors;
		}
		
		if (tActors[tLayer] !== void 0) {
			throw new Error('Actor already exists at layer ' + tLayer);
		}
		
		var tActor = new pClazz(),
			tName = typeof pOptions.name !== 'string' ? pOptions.name : 'instance' + tStage._actorNameCounter++;
		tActor.initialize(pOptions.data, this.stage, tLayer, this, tName);

		tActors[tLayer] = tActor;
		tActor.cue('enter');
		return tActor;
	},

	/**
	 * Removes this Actor from it's parent.
	 */
	leave: function() {
		if (this.parent === null) return;
		if (this.parent._actors[this.layer] !== this) return;
		this.cue('leave');
		this.stage.deactivateActor(this);
		this.parent._actors[this.layer] = void 0;
	},

	/**
	 * The current X position of this Actor.
	 * @field
	 * @type number
	 */
    get x() {
    	return this.matrix.x;
    },
    set x(pValue) {
    	this.matrix.x = pValue;
    },

	/**
	 * The current Y position of this Actor.
	 * @field
	 * @type number
	 */
    get y() {
    	return this.matrix.y;
    },
    set y(pValue) {
    	this.matrix.y = pValue;
    },

	/**
	 * The current rotation of this Actor in radians.
	 * @field
	 * @type number
	 */
    get rotation() {
    	return this.matrix.rotation;
    },
    set rotation(pValue) {
    	this.matrix.rotation = pValue;
    },

	/**
	 * The current scale X value of this Actor.
	 * @field
	 * @type number
	 */
    get scaleX() {
    	return this.matrix.sx;
    },
    set scaleX(pValue) {
    	this.matrix.sx = pValue;
    },
	
	/**
	 * The current scale Y value of this Actor.
	 * @field
	 * @type number
	 */
    get scaleY() {
    	return this.matrix.sy;
    },
    set scaleY(pValue) {
    	this.matrix.sy = pValue;
    }
};

/**
 * Creates a new {@link theatre.Actor} type.
 * Allows you to add an initializer function that works similar to
 * extending a class and object construction in Java.
 * @param {string} pName The name of the Actor type.
 * @param {function(new:theatre.Actor)} pExtends The Actor to prototype off of.
 * @param {function(theatre.Stage)=} pInitializer A function to initialize this Actor.
 * @todo Name might not be needed. Only for debugging...
 */
function createActor(pName, pExtends, pInitializer) {
	if (!pExtends) pExtends = theatre.Actor;
	var tClazz = global.eval('(function ' + pName + '(){})'),
		tPrototype = tClazz.prototype = new pExtends(),
		tSuperInitialize = tPrototype.initialize;
	if (pInitializer !== void 0) {
		tPrototype.initialize = function() {
			tSuperInitialize.apply(this, arguments);
			pInitializer.apply(this, arguments);
		}
	}

	return tClazz;
}

});
