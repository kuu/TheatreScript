'use strict';(function(global){var theatre=global.theatre;theatre.define("theatre.crews.canvas.Cache",Cache);var mTotalUsedSize=0;function Cache(){this._map={};this.maxSize=2048*2048;this.usedSize=0;this._idCounter=0}Cache.totalMaxSize=-1;Cache.prototype.request=function(pWidth,pHeight){var tDeltaSize=pWidth*pHeight;var tUsedSize=this.usedSize;var tNewSize=tUsedSize+tDeltaSize;var tMaxSize=this.maxSize;if(tNewSize>tMaxSize||Cache.totalMaxSize!==-1&&tNewSize>Cache.totalMaxSize){console.warn("Cache maximum size reached!",
tMaxSize);return null}var tNewId=""+ ++this._idCounter;var tCanvas=this._map[tNewId]=global.document.createElement("canvas");tCanvas.width=pWidth;tCanvas.height=pHeight;this.usedSize=tNewSize;mTotalUsedSize+=tDeltaSize;return tNewId};Cache.prototype.release=function(pId){var tCache=this._map[pId];if(tCache===void 0)return;var tSize=tCache.width*tCache.height;this.usedSize-=tSize;mTotalUsedSize-=tSize;tCache.width=0;tCache.height=0;delete this._map[pId]};Cache.prototype.getContext=function(pId){var tCache=
this._map[pId];if(tCache===void 0)return null;return tCache.getContext("2d")};Cache.prototype.drawOnTo=function(pId,pOtherContext,pX,pY,pWidth,pHeight){var tCanvas=this._map[pId];if(tCanvas===void 0)return;pOtherContext.drawImage(tCanvas,pX||0,pY||0,pWidth||tCanvas.width,pHeight||tCanvas.height)};Cache.prototype.destroy=function(){var tCanvas;var tMap=this._map;for(var i in tMap){tCanvas=tMap[i];tCanvas.width=0;tCanvas.height=0}this._map=null}})(this);(function(global){var theatre=global.theatre;var mCache=new theatre.crews.canvas.Cache;theatre.define("theatre.crews.canvas.CanvasActor",CanvasActor);theatre.crews.canvas.backingCache=mCache;function CanvasActor(){this.base();this._drawingCache=null;this.width=0;this.height=0;this.cacheDrawResult=true;this.cacheWithClass=true;this.listen("enter",function(pData){this.invalidate()})}theatre.inherit(CanvasActor,theatre.Actor);Object.defineProperties(CanvasActor.prototype,{_classDrawingCache:{value:null,
writable:true},preDraw:{value:function(pContext){},writable:true},postDraw:{value:function(pContext){},writable:true},draw:{value:function(pContext){pContext.clearRect(0,0,this.width,this.height)},writable:true},getDrawingContextForChild:{value:function(pParentContext,pActor){return pParentContext},writable:true},preDrawChildren:{value:function(pContext){},writable:true},postDrawChildren:{value:function(pContext){},writable:true},preDispatchDraw:{value:function(pParentContext,pChildContext,pChildActor){var tMatrix=
pChildActor.matrix;pParentContext.transform(tMatrix.a,tMatrix.b,tMatrix.c,tMatrix.d,tMatrix.e,tMatrix.f)},writable:true},postDispatchDraw:{value:function(pParentContext,pChildContext,pChildActor){},writable:true},getDrawingCacheId:{value:function(){var tCacheId=null;if(this.cacheDrawResult===true)if(this.cacheWithClass===true)if(this.__proto__._classDrawingCache!==null)tCacheId=this.__proto__._classDrawingCache;else tCacheId=this.__proto__._classDrawingCache=mCache.request(this.width||this.parent.width||
0,this.height||this.parent.height||0);else if(this._drawingCache!==null)tCacheId=this._drawingCache;else this._drawingCache=tCacheId=mCache.request(this.width||this.parent.width||0,this.height||this.parent.height||0);return tCacheId},writable:true},dispatchDraw:{value:function(pContext){var tCacheId=this.getDrawingCacheId();if(tCacheId!==null)if(!pContext){pContext=mCache.getContext(tCacheId);if(this.isInvalidated===true){pContext.save();this.preDraw(pContext);this.draw(pContext);this.postDraw(pContext);
pContext.restore()}}else if(this.isInvalidated===false){pContext.save();this.preDraw(pContext);mCache.drawOnTo(tCacheId,pContext,0,0);this.postDraw(pContext);pContext.restore()}else{pContext.save();this.preDraw(pContext);this.draw(mCache.getContext(tCacheId));mCache.drawOnTo(tCacheId,pContext,0,0);this.postDraw(pContext);pContext.restore()}else{if(!pContext)return;pContext.save();this.preDraw(pContext);this.draw(pContext);this.postDraw(pContext);pContext.restore()}var tActors=this.getActors();var tNumOfActors=
tActors.length;if(tNumOfActors!==0)this.preDrawChildren(pContext);for(var i=0;i<tNumOfActors;i++){var tActor=tActors[i];if(tActor.dispatchDraw===void 0)continue;var tChildContext=this.getDrawingContextForChild(pContext,tActor);tChildContext.save();if(tChildContext!==pContext)pContext.save();this.preDispatchDraw(pContext,tChildContext,tActor);tChildContext.save();if(tChildContext!==pContext)pContext.save();tActor.dispatchDraw(tChildContext);tChildContext.restore();if(tChildContext!==pContext)pContext.restore();
this.postDispatchDraw(pContext,tChildContext,tActor);tChildContext.restore();if(tChildContext!==pContext)pContext.restore()}if(tNumOfActors!==0)this.postDrawChildren(pContext);this.isInvalidated=false},writable:true},act:{value:function(){this.dispatchDraw();if(this.isAdded!==true){this.isAdded=true;if(theatre.crews.dom&&this.parent instanceof theatre.crews.dom.DOMActor){var tCanvas=mCache.getContext(this._drawingCache).canvas;tCanvas.style.zIndex=this.layer;this.parent.element.appendChild(tCanvas)}}},
writable:true},invalidate:{value:function(){theatre.Actor.prototype.invalidate.call(this);if(this.parent)this.parent.invalidate()},writable:true}})})(this);
