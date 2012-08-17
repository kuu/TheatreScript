/*
 TheatreScript
 Copyright (C) 2012 Jason Parrott.
 This code is licensed under the zlib license.
 See the LICENSE file in the original source for details.
*/
'use strict';(function(e){function k(h,g,f){f||(f=e);for(var j=h.lastIndexOf("."),a=h.substring(j+1),h=h.substring(0,j).split(/\./);j=h.shift();)f=f[j]=f[j]||{};if(void 0!==g)f[a]=g;else return f;return g}var l=k("theatre",{},e);void 0===Object.mixin&&(Object.mixin=function(){for(var h=arguments[0]||{},e=1,f=arguments.length;e<f;e++){var j=arguments[e];if(j)for(var a in j)!0===j.hasOwnProperty(a)&&(h[a]=j[a])}return h});l.define=function(e,g,f){k(e,g,f);return l}})(this);(function(e){e.theatre.define("theatre.Matrix","undefined"!==typeof CSSMatrix?CSSMatrix:WebKitCSSMatrix)})(this);(function(e){function k(){}function l(a,b,c,d){a||(a="");b=this.stage.timeToStep(b);a in this._scenes?a=this._scenes[a].scripts[d]:(a=this._scenes[a]={name:a,isActing:!1,currentStep:0,previousStep:-1,shouldLoop:!0,scripts:[[],[]]},a=a.scripts[d]);a.length<=b?a[b]=[c]:a[b].push(c)}function h(a,b,c){if(void 0!==b[c])for(var b=b[c],c=0,d=b.length;c<d;c++)b[c].call(a)}var g=e.theatre,f=g.Matrix,j=e.Math.max;g.define("theatre.Actor",k);g.define("theatre.createActor",function(a,b,c){b||(b=g.Actor);var a=
e.eval("(function "+a+"(){})"),b=a.prototype=new b,d=b.initialize;void 0!==c&&(b.initialize=function(){d.apply(this,arguments);c.apply(this,arguments)});return a});k.prototype={initialize:function(a,b,c,d,i){this.stage=b;this.matrix=new f;this.layer=c;this.parent=d;this.name=i;this.isInvalidated=this.isActing=!1;this._currentScene={name:"",isActing:!1,currentStep:0,previousStep:-1,shouldLoop:!0,scripts:[[],[]]};this._scenes={"":this._currentScene};this._layerCounter=0},listen:function(a,b){!1==="_cues"in
this&&(this._cues={});!1===a in this._cues?(this._cues[a]=[b],this.stage.registerListener(a,this)):this._cues[a].push(b);return this},ignore:function(a,b){if("_cues"in this&&a in this._cues){for(var c=this._cues[a],d=0,i=c.length;d<i;d++)if(c[d]===b){c.splice(d,1);break}0===c.length&&(delete this._cues[a],this.stage.unregisterListener(a,this))}return this},cue:function(a,b){if("_cues"in this&&a in this._cues)for(var c=this._cues[a].slice(0),d=0,i=c.length;d<i;d++)c[d].call(this,{target:this,data:b,
name:a});return this},invalidate:function(){if(!0!==this.isInvalidated)return this.isInvalidated=!0,this.stage.invalidate(this),this},addPreparationScript:function(a,b,c){l.call(this,c,a,b,0);return this},addScript:function(a,b,c){l.call(this,c,a,b,1);return this},doScripts:function(a,b,c){var d=this._scenes,i=this._currentScene;if(c){if("string"===typeof c){if(!1===c in d)throw Error("Scene doesn't exist: "+c);i=d[c]}}else i=this._currentScene;"number"!==typeof a&&(a=i.currentStep);void 0===b&&(b=
this);h(b,i.scripts[1],a)},startActing:function(){this.stage.activateActor(this);this.isActing=!0;return this},stopActing:function(){this.stage.deactivateActor(this);this.isActing=!1;return this},gotoInScene:function(a,b){if(!1===a in this._scenes)throw Error("Scene doesn't exist: "+a);this.startActingScene(a);var c=this._currentScene,b=this.stage.timeToStep(b);this.step(b-c.currentStep,!1);return this},startActingScene:function(a){if(!1===a in this._scenes)throw Error("Scene doesn't exist: "+a);
if(this._currentScene.name!==a)return this._currentScene.isActing=!1,a=this._scenes[a],a.isActing=!0,this._currentScene=a,this},act:function(){},step:function(a,b){var c=this._currentScene;if(!1!==c.isActing){var d=c.currentStep,i=c.scripts,e=j(i[0].length,i[1].length),f=c.currentStep+=a,g=!1;if(f>=e){if(!1===this.shouldLoop||1===e){c.currentStep=e-1;return}f=c.currentStep-=e;g=!0}if(d===f)!0===g&&!b&&(h(this,i[0],f),h(this,i[1],f));else{if(0>a||!0===g)throw Error("pDelta is less than 0 or we looped");
d+=1;for(e=f;d<=e;d++)c.currentStep=d,h(this,i[0],d)}b||h(this,i[1],f);b||this.cue("update")}},addActor:function(a,b){var b=Object.mixin({data:{}},b),c="number"===typeof b.layer?b.layer:this._layerCounter++,d;d=!1==="_actors"in this?this._actors=Array(c+1):this._actors;if(void 0!==d[c])throw Error("Actor already exists at layer "+c);var e=new a,f="string"!==typeof b.name?b.name:"instance"+tStage._actorNameCounter++;e.initialize(b.data,this.stage,c,this,f);d[c]=e;e.cue("enter");return e},getActors:function(){var a=
[],b=this._actors;if(!b)return[];for(var c=0,d=b.length;c<d;c++)void 0!==b[c]&&a.push(b[c]);return a},findActors:function(){throw Error("Not implemented");},leave:function(){null!==this.parent&&this.parent._actors[this.layer]===this&&(this.cue("leave"),this.stage.deactivateActor(this),this.parent._actors[this.layer]=void 0)},get x(){return this.matrix.e},set x(a){this.matrix.e=a},get y(){return this.matrix.f},set y(a){this.matrix.f=a},get rotation(){return this._rotation},set rotation(a){this._rotation=
a;this.matrix=this.matrix.rotateAxisAngle(0,0,0,a)},get scaleX(){return this.matrix.a},set scaleX(a){this.matrix=this.matrix.scale(a,0)},get scaleY(){return this.matrix.d},set scaleY(a){this.matrix=this.matrix.scale(0,a)}}})(this);(function(e){var e=e.theatre,k=e.createActor("StageManager");e.define("theatre.StageManager",k)})(this);(function(e){function k(a){var b=Date.now();a.step();a.isOpen&&(a.timer=setTimeout(k,a.stepRate-(Date.now()-b),a))}function l(){this._animationFrameId=this._timer=null;this._actingActors=[];this._listeners={};this._invalidatedActors=[];this._actorNameCounter=1;this.stepRate=1E3/30;this.isOpen=!1;var a;Object.defineProperty(this,"stageManager",{get:function(){return a},set:function(b){a=b;b.initialize(null,this);b.isActing=!0;this.activateActor(b,!0)}});this.stageManager=new g.StageManager}function h(){this._animationFrameId=
null;for(var a=this._invalidatedActors,b=0,c=a.length;b<c;b++){var d=a[b];d.act();d.isInvalidated=!1}a.length=0}var g=e.theatre;g.define("theatre.Stage",l);var f=void 0!==e.webkitRequestAnimationFrame?e.webkitRequestAnimationFrame:null,j=/^([\d]+)(ms|[sm])$/;l.prototype={timeToStep:function(a){if("number"===typeof a)return a;a=j.exec(a);if(null===a)throw Error("Bad time string");switch(a[2]){case "ms":return a[1]/this.stepRate|0;case "s":return 1E3*a[1]/this.stepRate|0;case "m":return 6E4*a[1]/this.stepRate|
0}},open:function(){this.isOpen=!0;this.timer=setTimeout(k,this.stepRate,this);return this},close:function(){clearTimeout(this.timer);this.timer=null;this.isOpen=!1;return this},invalidate:function(a){this._invalidatedActors.push(a)},step:function(){var a,b,c;this.cue("enterstep");for(var d=this._actingActors.slice(0),e,g=e=d.length;0!==g--;){c=d[g];a=0;for(b=c.length;a<b;a++)c[a].step(1,!0)}for(g=e;0!==g--;){c=d[g];a=0;for(b=c.length;a<b;a++)c[a].doScripts()}this.cue("update");if(null===this._animationFrameId&&
0!==this._invalidatedActors.length)if(null!==f){var j=this;this._animationFrameId=f(function(){h.call(j)})}else this._animationFrameId=1,h.call(this);this.cue("leavestep")},activateActor:function(a,b){for(var c=a.parent,d=0;null!=c;)d++,c=c.parent;c=this._actingActors;c=c.length<=d?c[d]=[]:c[d];-1===c.indexOf(a)&&(c.push(a),b||a.step(1))},deactivateActor:function(a){for(var b=pReel.parent,c=0;null!=b;)c++,b=b.parent;b=this._actingActors;void 0!==b[c]&&(a=b[c].indexOf(a),0<=a&&b.splice(a,1))},setBackground:function(a){this.background=
a},registerListener:function(a,b){a in this._listeners?this._listeners[a].push(b):this._listeners[a]=[b]},unregisterListener:function(a,b){if(a in this._listeners){for(var c=this._listeners[a],d=0,e=c.length;d<e;d++)if(c[d]===b){c.splice(d,1);break}0===c.length&&delete this._listeners[a]}},cue:function(a,b){if(a in this._listeners)for(var c=this._listeners[a].slice(0),d=0,e=c.length;d<e;d++)c[d].cue(a,b)}}})(this);
