'use strict';(function(global){var theatre=global.theatre;function CanvasActor(){this.base();this._drawingCache=null;this.width=0;this.height=0;this.cacheDrawResult=true;this.listen("enter",function(pData){this.invalidate()})}theatre.inherit(CanvasActor,theatre.Actor);Object.defineProperties(CanvasActor.prototype,{getDrawingCache:{value:function(){if(this._drawingCache!==null)return this._drawingCache;var tCanvas=global.document.createElement("canvas");tCanvas.width=this.width||this.parent.width||
1;tCanvas.height=this.height||this.parent.height||1;return this._drawingCache=tCanvas.getContext("2d")},writable:true},draw:{value:function(pContext){pContext.clearRect(0,0,this.width,this.height)},writable:true},getDrawingContextForChild:{value:function(pParentContext,pActor){return pParentContext},writable:true},preDrawChildren:{value:function(pContext){},writable:true},postDrawChildren:{value:function(pContext){},writable:true},preDispatchDraw:{value:function(pParentContext,pChildContext,pChildActor){var tMatrix=
pChildActor.matrix;pParentContext.transform(tMatrix.a,tMatrix.b,tMatrix.c,tMatrix.d,tMatrix.e,tMatrix.f)},writable:true},postDispatchDraw:{value:function(pParentContext,pChildContext,pChildActor){},writable:true},dispatchDraw:{value:function(pContext){if(!pContext&&this.parent.dispatchDraw===void 0)pContext=this.getDrawingCache();pContext.save();this.draw(pContext);pContext.restore();var tActors=this.getActors();var tNumOfActors=tActors.length;if(tNumOfActors!==0)this.preDrawChildren(pContext);for(var i=
0;i<tNumOfActors;i++){var tActor=tActors[i];if(tActor.dispatchDraw===void 0)continue;var tChildContext=this.getDrawingContextForChild(pContext,tActor);tChildContext.save();if(tChildContext!==pContext)pContext.save();this.preDispatchDraw(pContext,tChildContext,tActor);tChildContext.save();if(tChildContext!==pContext)pContext.save();tActor.dispatchDraw(tChildContext);tChildContext.restore();if(tChildContext!==pContext)pContext.restore();this.postDispatchDraw(pContext,tChildContext,tActor);tChildContext.restore();
if(tChildContext!==pContext)pContext.restore()}if(tNumOfActors!==0)this.postDrawChildren(pContext);this.isInvalidated=false},writable:true},act:{value:function(){this.dispatchDraw();if(this.isAdded!==true){this.isAdded=true;if(theatre.crews.dom&&this.parent instanceof theatre.crews.dom.DOMActor){this._drawingCache.canvas.style.zIndex=this.layer;this.parent.element.appendChild(this._drawingCache.canvas)}}},writable:true},invalidate:{value:function(){theatre.Actor.prototype.invalidate.call(this);if(this.parent)this.parent.invalidate()},
writable:true}});theatre.define("theatre.crews.canvas.CanvasActor",CanvasActor)})(this);
