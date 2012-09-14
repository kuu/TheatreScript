/*
 TheatreScript
 Copyright (C) 2012 Jason Parrott.
 This code is licensed under the zlib license.
 See the LICENSE file in the original source for details.
*/
'use strict';(function(global){function defineSymbol(pPath,pSymbol,pRoot){if(!pRoot)pRoot=global;var tLastIndex=pPath.lastIndexOf("."),tName=pPath.substring(tLastIndex+1),tParts=pPath.substring(0,tLastIndex).split(/\./),tPart;while(tPart=tParts.shift())pRoot=pRoot[tPart]=pRoot[tPart]||new Object;if(pSymbol!==void 0)return pRoot[tName]=pSymbol;else if(pRoot[tName]!==void 0)return pRoot[tName];else return pRoot[tName]=new Object}var theatre=defineSymbol("theatre",new Object,global);if(Object.mixin===
void 0)Object.mixin=function(){var tObject=arguments[0]||new Object;for(var i=1,il=arguments.length;i<il;i++){var tArg=arguments[i];if(tArg)for(var k in tArg)if(tArg.hasOwnProperty(k)===true)tObject[k]=tArg[k]}return tObject};theatre.define=function(pName,pObject,pRoot){return defineSymbol(pName,pObject,pRoot)};theatre.inherit=function(pThis,pBase){var tThisProto=pThis.prototype=Object.create(pBase.prototype);tThisProto.constructor=pThis;tThisProto.base=function(){this.base=pBase.prototype.base;pBase.apply(this,
arguments);this.base=pBase.prototype};var tBaseProto=pBase.prototype;while(tBaseProto!==Object.prototype){var tProps=Object.getOwnPropertyNames(tBaseProto);for(var i=0,il=tProps.length;i<il;i++)if(!tThisProto.hasOwnProperty(tProps[i]))Object.defineProperty(tThisProto,tProps[i],Object.getOwnPropertyDescriptor(tBaseProto,tProps[i]));tBaseProto=tBaseProto.__proto__}}})(this);(function(global){var Matrix;if(typeof CSSMatrix!=="undefined")Matrix=CSSMatrix;else if(typeof WebKitCSSMatrix!=="undefined")Matrix=WebKitCSSMatrix;else Matrix=TheatreMatrix;function TheatreMatrix(pMatrixString){if(pMatrixString){var tMatrix=this.setMatrixValue(pMatrixString);this.a=tMatrix.a;this.b=tMatrix.b;this.c=tMatrix.c;this.d=tMatrix.d;this.e=tMatrix.e;this.f=tMatrix.f}else{this.a=1;this.b=0;this.c=0;this.d=1;this.e=0;this.f=0}}TheatreMatrix.prototype.multiply=function(pThat){var tMatrix=new TheatreMatrix;
var tThisA=this.a;var tThisB=this.b;var tThisC=this.c;var tThisD=this.d;var tThisE=this.e;var tThisF=this.f;var tThatA=pThat.a;var tThatB=pThat.b;var tThatC=pThat.c;var tThatD=pThat.d;var tThatE=pThat.e;var tThatF=pThat.f;tMatrix.a=tThisA*tThatA+tThisB*tThatC;tMatrix.b=tThisA*tThatB+tThisB*tThatD;tMatrix.c=tThisC*tThatA+tThisD*tThatC;tMatrix.d=tThisC*tThatB+tThisD*tThatD;tMatrix.e=tThisE*tThatA+tThisF*tThatC+tThatE;tMatrix.f=tThisE*tThatB+tThisF*tThatD+tThatF;return tMatrix};TheatreMatrix.prototype.inverse=
function(){throw new Error;};TheatreMatrix.prototype.translate=function(pX,pY){return this.multiply(1,0,0,1,pX,pY)};TheatreMatrix.prototype.rotate=function(pX,pY){throw new Error;};TheatreMatrix.prototype.rotateAxisAngle=function(){throw new Error;};TheatreMatrix.prototype.scale=function(pX,pY){return this.multiply(pX,0,0,pY,0,0)};TheatreMatrix.prototype.setMatrixValue=function(pValue){if(pValue.indexOf("matrix3d(")===0)throw Error();else if(pValue.indexOf("matrix(")===0)throw Error();else throw new Error("Invalid Matrix");
};TheatreMatrix.prototype.skewX=function(pValue){return this.multiply(1,0,pValue,1,0,0)};TheatreMatrix.prototype.skewY=function(pValue){return this.multiply(1,pValue,0,1,0,0)};TheatreMatrix.prototype.toString=function(){return"matrix3d("+this.a+","+this.b+",0,0,"+this.c+","+this.d+",0,0,0,0,1,0,"+this.e+","+this.f+",0,1)"};global.theatre.define("theatre.Matrix",Matrix)})(this);(function(global){var theatre=global.theatre,Matrix=theatre.Matrix,max=global.Math.max;theatre.define("theatre.Actor",Actor);function _Scene(pName){this.name=pName;this.isActing=true;this.currentStep=-1;this.previousStep=-2;this.shouldLoop=true;this.length=0;this.labels=new Object;this.scripts=[new Array(0),new Array(0)]}function Actor(){this._ctorCalled=true;this.stage=null;this.matrix=new Matrix;this.layer=-1;this.parent=null;this._actors=new Array(0);this._name=null;this._nameToActorMap={};this.isActing=
false;this.isInvalidated=false;this._currentScene=new _Scene("");this._scenes={"":this._currentScene};this._layerCounter=0}function addScriptToScene(pSceneName,pStep,pScript,pType){var tScene;var tScripts;var tOtherScripts;if(!pSceneName)pSceneName="";if(pSceneName in this._scenes){tScene=this._scenes[pSceneName];tScripts=tScene.scripts[pType];tOtherScripts=tScene.scripts[pType^1]}else{tScene=this._scenes[pSceneName]=new _Scene(pSceneName);tScripts=tScene.scripts[pType];tOtherScripts=tScene.scripts[pType^
1]}if(pStep>=tScene.length){tScripts[pStep]=[pScript];tOtherScripts[pStep]=[];tScene.length=pStep+1}else if(tScripts[pStep]===void 0){tScripts[pStep]=[pScript];tOtherScripts[pStep]=[]}else tScripts[pStep].push(pScript)}function executeScripts(pContext,pScripts,pStep){if(pScripts[pStep]!==void 0){var tScriptStep=pScripts[pStep];for(var i=0,il=tScriptStep.length;i<il;i++)tScriptStep[i].call(pContext)}}Actor.prototype={listen:function(pName,pCallback){if("_cues"in this===false)this._cues=new Object;
if(pName in this._cues===false){this._cues[pName]=[pCallback];if(this.stage!==null)this.stage.registerListener(pName,this)}else this._cues[pName].push(pCallback);return this},ignore:function(pName,pCallback){if("_cues"in this&&pName in this._cues){var tCues=this._cues[pName];for(var i=0,il=tCues.length;i<il;i++)if(tCues[i]===pCallback){tCues.splice(i,1);break}if(tCues.length===0){delete this._cues[pName];if(this.stage!==null)this.stage.unregisterListener(pName,this)}}return this},cue:function(pName,
pData){if("_cues"in this&&pName in this._cues){var tCallbacks=this._cues[pName].slice(0);for(var i=0,il=tCallbacks.length;i<il;i++)tCallbacks[i].call(this,{target:this,data:pData,name:pName})}return this},invalidate:function(){if(this.isInvalidated===true)return this;this.isInvalidated=true;if(this.stage!==null)this.stage.invalidate(this);return this},addPreparationScript:function(pStep,pScript,pSceneName){addScriptToScene.call(this,pSceneName,pStep,pScript,0);return this},addScript:function(pStep,
pScript,pSceneName){addScriptToScene.call(this,pSceneName,pStep,pScript,1);return this},doScripts:function(pStep,pContext,pSceneName){var tScenes=this._scenes,tScene;if(!pSceneName)tScene=this._currentScene;else{if(pSceneName in tScenes===false)throw new Error("Scene doesn't exist: "+pSceneName);tScene=tScenes[pSceneName]}if(typeof pStep!=="number")pStep=tScene.currentStep;if(pContext===void 0)pContext=this;executeScripts(pContext,tScene.scripts[1],pStep)},scheduleScripts:function(pStep,pContext,
pSceneName){if(this.stage===null)return false;var tSelf=this;var tScenes=this._scenes,tScene;if(!pSceneName)tScene=this._currentScene;else{if(pSceneName in tScenes===false)return false;tScene=tScenes[pSceneName]}if(typeof pStep!=="number")pStep=tScene.currentStep;if(pContext===void 0)pContext=this;tScenes=null;tScene=null;this.stage.scheduleScript(function(){tSelf.doScripts(pStep,pContext,pSceneName)})},startActing:function(){if(this.isActing===false){this.stage.activateActor(this);this.isActing=
true}return this},stopActing:function(){if(this.isActing===true){this.stage.deactivateActor(this);this.isActing=false}return this},gotoInScene:function(pSceneName,pStep){if(pSceneName in this._scenes===false)return null;this.startActingScene(pSceneName);var tScene=this._currentScene;if(pStep>=tScene.length)return null;if(pStep===tScene.currentStep)return this;this.step(pStep-tScene.currentStep,false);return this},gotoStep:function(pStep){var tScene=this._currentScene;if(pStep>=tScene.length)return null;
if(pStep===tScene.currentStep)return this;this.step(pStep-tScene.currentStep,false);return this},gotoLabelInScene:function(pSceneName,pName){if(pSceneName in this._scenes===false)return null;this.startActingScene(pSceneName);var tScene=this._currentScene;var tStep=tScene.labels[pName];if(tStep===void 0||tStep>=tScene.length)return null;if(tStep===tScene.currentStep)return this;this.step(tStep-tScene.currentStep,false);return this},gotoLabel:function(pName){var tScene=this._currentScene;var tStep=
tScene.labels[pName];if(tStep===void 0||tStep>=tScene.length)return null;if(tStep===tScene.currentStep)return this;this.step(tStep-tScene.currentStep,false);return this},setLabelInScene:function(pSceneName,pName,pStep){if(pSceneName in this._scenes===false)return null;this._scenes[pSceneName].labels[pName]=pStep;return this},removeLabelFromScene:function(pSceneName,pName){if(pSceneName in this._scenes===false)return this;delete this._scenes[pSceneName].labels[pName];return this},getLabelStepFromScene:function(pSceneName,
pName){if(pSceneName in this._scenes===false)return null;var tStep=this._scenes[pSceneName].labels[pName];if(tStep===void 0)return null;return tStep},startActingScene:function(pSceneName){if(pSceneName in this._scenes===false)throw new Error("Scene doesn't exist: "+pSceneName);if(this._currentScene.name===pSceneName)return this;this._currentScene.isActing=false;var tScene=this._scenes[pSceneName];tScene.isActing=true;this._currentScene=tScene;return this},act:function(){},step:function(pDelta,pPreparedScriptsOnly){var tScene=
this._currentScene;if(tScene.isActing===false)return;var tPreviousStep=tScene.currentStep,tScripts=tScene.scripts,tLength=max(tScripts[0].length,tScripts[1].length),tCurrentStep=tScene.currentStep+=pDelta,tLooped=false;if(tCurrentStep>=tLength){if(tScene.shouldLoop===false||tLength===1){tScene.currentStep=tLength-1;return}tCurrentStep=tScene.currentStep-=tLength;tPreviousStep=-1;tLooped=true}tScene.previousStep=tPreviousStep;var i,il;if(tPreviousStep===tCurrentStep){if(tLooped===true&&!pPreparedScriptsOnly){executeScripts(this,
tScripts[0],tCurrentStep);this.scheduleScripts(tCurrentStep,this)}}else if(pDelta<0||tLooped===true){this.cue("reversestep");for(i=0,il=tCurrentStep;i<=il;i++){tScene.currentStep=i;executeScripts(this,tScripts[0],i)}}else for(i=tPreviousStep+1,il=tCurrentStep;i<=il;i++){tScene.currentStep=i;executeScripts(this,tScripts[0],i)}if(!pPreparedScriptsOnly){this.scheduleScripts(tCurrentStep,this);this.cue("update")}},addActor:function(pActor,pOptions){if(pActor._ctorCalled!==true)throw new Error("Actor not initialized correctly. Call this.base.constructor() first.");
if(pActor.stage!==null)throw new Error("Actor already belongs to another Actor.");pOptions=pOptions||new Object;var tLayer=typeof pOptions.layer==="number"?pOptions.layer:this._layerCounter++;var tActors=this._actors;if(tActors[tLayer]!==void 0)throw new Error("Actor already exists at layer "+tLayer);var tName=typeof pOptions.name==="string"?pOptions.name:pActor.name?pActor.name:"instance"+theatre.Stage._actorNameCounter++;var tStage=this.stage;tActors[tLayer]=pActor;pActor.stage=tStage;pActor.layer=
tLayer;pActor.name=tName;pActor.parent=this;this._nameToActorMap[pActor.name]=pActor;function recursiveEnter(pActor){pActor.stage=tStage;var tActorCues=pActor._cues;if(tActorCues!==void 0)for(var k in tActorCues)tStage.registerListener(k,pActor);if(pActor.isInvalidated===true)tStage.invalidate(pActor);pActor.cue("enter",pActor._pendingAddActorOptions);pActor._pendingAddActorOptions=null;pActor.startActing();var tChildren=pActor.getActors();for(var i=0,il=tChildren.length;i<il;i++)recursiveEnter(tChildren[i])}
if(this.stage!==null){pActor._pendingAddActorOptions=pOptions;recursiveEnter(pActor)}else pActor._pendingAddActorOptions=pOptions;return this},getActors:function(){var tResult=new Array,tActors=this._actors;for(var i=0,il=tActors.length;i<il;i++)if(tActors[i]!==void 0)tResult.push(tActors[i]);return tResult},getActorAtLayer:function(pLayer){return this._actors[pLayer]||null},getActorByName:function(pName){return this._nameToActorMap[pName]||null},leave:function(){if(this.parent===null)return;if(this.parent._actors[this.layer]!==
this)return;this.cue("leave");function recursivelyDeactivate(pActor){var tChildren=pActor.getActors();for(var i=0,il=tChildren.length;i<il;i++){var tChild=tChildren[i];pActor.stage.deactivateActor(tChild);recursivelyDeactivate(tChild);var tActorCues=tChild._cues;if(tActorCues!==void 0)for(var k in tActorCues)tChild.stage.unregisterListener(k,tChild);tChild.stage=null}}if(this.stage!==null){recursivelyDeactivate(this);this.stage.deactivateActor(this);var tActorCues=this._cues;if(tActorCues!==void 0)for(var i in tActorCues)this.stage.unregisterListener(i,
this)}this.parent._actors[this.layer]=void 0;delete this.parent._nameToActorMap[this.name];this.parent=null;this.stage=null},get name(){return this._name},set name(pValue){if(this.parent!==null){delete this.parent._nameToActorMap[this._name];this.parent._nameToActorMap[pValue]=this}this._name=pValue},get scene(){return this._currentScene.name},get currentStep(){return this._currentScene.currentStep},get numberOfSteps(){return this._currentScene.length},get x(){return this.matrix.e},set x(pValue){this.matrix.e=
pValue},get y(){return this.matrix.f},set y(pValue){this.matrix.f=pValue},get rotation(){return this._rotation},set rotation(pValue){this._rotation=pValue;this.matrix=this.matrix.rotateAxisAngle(0,0,0,pValue)},get scaleX(){return this.matrix.a},set scaleX(pValue){this.matrix=this.matrix.scale(pValue,0)},get scaleY(){return this.matrix.d},set scaleY(pValue){this.matrix=this.matrix.scale(0,pValue)},getAbsoluteMatrix:function(){if(this.stage===null)return null;var tMatrixStack=[this.matrix];var tActor=
this;while(tActor.parent!==null){tActor=tActor.parent;tMatrixStack.push(tActor.matrix)}var tMatrix=new theatre.Matrix;for(var i=tMatrixStack.length-1;i!==-1;i--)tMatrix=tMatrix.multiply(tMatrixStack[i]);return tMatrix}};Actor.prototype.constructor=Actor})(this);(function(global){var theatre=global.theatre;function StageManager(){this.base()}theatre.inherit(StageManager,theatre.Actor);theatre.define("theatre.StageManager",StageManager)})(this);(function(global){var theatre=global.theatre;theatre.define("theatre.Stage",Stage);var mRequestAnimationFrame;if(global.requestAnimationFrame!==void 0)mRequestAnimationFrame=global.requestAnimationFrame;else if(global.webkitRequestAnimationFrame!==void 0)mRequestAnimationFrame=global.webkitRequestAnimationFrame;else if(global.mozRequestAnimationFrame!==void 0)mRequestAnimationFrame=global.mozRequestAnimationFrame;else mRequestAnimationFrame=function(pCallback){return setTimeout(pCallback,20)};function tickCallback(pStage){var tTime=
Date.now();pStage.step();if(pStage.isOpen)pStage.timer=setTimeout(tickCallback,pStage.stepRate-(Date.now()-tTime),pStage)}var mTimeToStepRegex=/^([\d]+)(ms|[sm])$/;function Stage(pOptions){this._timer=null;this._animationFrameId=null;this._actingActors=new Array;this._listeners=new Object;this._invalidatedActors=new Array;this._scheduledScripts=new Array;this.stepRate=1E3/30;this.isOpen=false;var tStageManager;Object.defineProperty(this,"stageManager",{get:function(){return tStageManager},set:function(pStageManager){tStageManager=
pStageManager;pStageManager.layer=0;pStageManager.stage=this;pStageManager.isActing=true;this.activateActor(pStageManager,true)}});this.stageManager=new theatre.StageManager}function actActors(){this._animationFrameId=null;var tInvalidated=this._invalidatedActors;function actActorInverse(pActor){var tParent=pActor.parent;if(tParent!==null&&tParent.isInvalidated===true)actActorInverse(tParent);if(pActor.isInvalidated===true){pActor.act();pActor.isInvalidated=false}}for(var i=0,il=tInvalidated.length;i<
il;i++){var tActor=tInvalidated[i];if(tActor.isInvalidated===false||tActor.stage===null)continue;actActorInverse(tActor)}tInvalidated.length=0}Stage.timeToStep=function(pTime,pRate){if(typeof pTime==="number")return pTime;var tResult=mTimeToStepRegex.exec(pTime);if(tResult===null)throw new Error("Bad time string");switch(tResult[2]){case "ms":return tResult[1]/pRate|0;case "s":return tResult[1]*1E3/pRate|0;case "m":return tResult[1]*60*1E3/pRate|0}throw new Error("Bad time string");};Stage._actorNameCounter=
1;Stage.prototype={timeToStep:function(pTime){return Stage.timeToStep(pTime,this.stepRate)},open:function(){if(this.isOpen)return this;this.isOpen=true;this.timer=setTimeout(tickCallback,this.stepRate,this);return this},close:function(){if(!this.isOpen)return this;clearTimeout(this.timer);this.timer=null;this.isOpen=false;return this},addActor:function(pClazz,pOptions){return this.stageManager.addActor(pClazz,pOptions)},invalidate:function(pActor){this._invalidatedActors.push(pActor)},scheduleScript:function(pScript){this._scheduledScripts.push(pScript)},
step:function(){var i,il,tActingActors;var tScripts=this._scheduledScripts;for(i=0;i<tScripts.length;i++)tScripts[i]();this._scheduledScripts=[];this.cue("enterstep");var tActingActorDepths=this._actingActors.slice(0),tDepth,tIndex=tDepth=tActingActorDepths.length;while(tIndex--!==0){if(tActingActorDepths[tIndex]===void 0)continue;tActingActors=tActingActorDepths[tIndex].slice(0);for(i=0,il=tActingActors.length;i<il;i++)tActingActors[i].step(1,true)}tIndex=tDepth;while(tIndex--!==0){if(tActingActorDepths[tIndex]===
void 0)continue;tActingActors=tActingActorDepths[tIndex].slice(0);for(i=0,il=tActingActors.length;i<il;i++)tActingActors[i].scheduleScripts()}tScripts=this._scheduledScripts;for(i=0;i<tScripts.length;i++)tScripts[i]();this._scheduledScripts=[];tScripts=null;tActingActorDepths=null;tActingActors=null;this.cue("update");if(this._animationFrameId===null&&this._invalidatedActors.length!==0)this._animationFrameId=mRequestAnimationFrame(function(pContext){return function(){actActors.call(pContext)}}(this));
this.cue("leavestep")},activateActor:function(pActor,pNoStep){var tParent=pActor.parent,tDepth=0;while(tParent!==null){tDepth++;tParent=tParent.parent}var tActingActors=this._actingActors;if(tActingActors.length<=tDepth)tActingActors=tActingActors[tDepth]=new Array;else tActingActors=tActingActors[tDepth];if(tActingActors.indexOf(pActor)===-1){tActingActors.push(pActor);if(!pNoStep)pActor.step(1)}},deactivateActor:function(pActor){var tParent=pActor.parent,tDepth=0;while(tParent!==null){tDepth++;
tParent=tParent.parent}var tActingActors=this._actingActors;if(tActingActors[tDepth]===void 0)return;var i=tActingActors[tDepth].indexOf(pActor);if(i>=0)tActingActors[tDepth].splice(i,1)},setBackground:function(pBackground){this.background=pBackground},registerListener:function(pName,pListener){if(!(pName in this._listeners))this._listeners[pName]=[pListener];else this._listeners[pName].push(pListener)},unregisterListener:function(pName,pListener){if(pName in this._listeners){var tListeners=this._listeners[pName];
for(var i=0,il=tListeners.length;i<il;i++)if(tListeners[i]===pListener){tListeners.splice(i,1);break}if(tListeners.length===0)delete this._listeners[pName]}},cue:function(pName,pData){if(pName in this._listeners){var tListeners=this._listeners[pName].slice(0);for(var i=0,il=tListeners.length;i<il;i++)tListeners[i].cue(pName,pData)}}};Stage.prototype.constructor=Stage})(this);
