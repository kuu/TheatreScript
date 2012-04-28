/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

var theatre = global.theatre;

function onEnter() {
	var tElement = this.element = this.elementTemplate.cloneNode(true),
		tStyle = tElement.style,
		tProtoStyles = this.styles;
	
	tStyle.zIndex = this.layer;
	tStyle.width = typeof this.width === 'string' ? this.width : this.width + 'px';
	tStyle.height = typeof this.height === 'string' ? this.height : this.height + 'px';

	if (tProtoStyles !== null) {
		for (tKey in tProtoStyles) {
			tStyle[tKey] = tProtoStyles[tKey];
		}
	}

    this.invalidate();
}

/**
 * An Actor for working with DOM elements.
 * @constructor
 * @name theatre.crews.dom.DOMActor
 * @augments theatre.Actor
 */
var DOMActor = theatre.createActor('DOMActor', theatre.Actor, function(pData) {
	/**
	 * CSS styles (of a HTMLElement style field) to apply to this Actor.
	 * @type Object
	 * @default null
	 */
	this.styles = pData.styles || null;
	
	this.width = pData.width || 0;

	this.height = pData.height || 0;

	this.listen('enter', onEnter);
});

Object.defineProperties(DOMActor.prototype, /** @lends theatre.crews.dom.DOMActor# */ {
	/**
	 * The HTMLElement that the DOMActor uses to create it's own elements.
	 * @type HTMLElement
	 * @default HTMLDivElement
	 */
	elementTemplate: {
		value: document.createElement('div')
	},

	/**
	 * @override
	 */
	act: {
		value: function() {
			var tMatrix = this.matrix,
				tElement = this.element;
			tElement.style.webkitTransform = 'matrix3d(' + tMatrix[0] + ',' + tMatrix[1] + ',0,0,' + tMatrix[2] + ',' + tMatrix[3] + ',0,0,0,0,1,0,' + tMatrix[4] + ',' + tMatrix[5] + ',0,1)';
			if (tElement.parentNode === null) {
				document.body.appendChild(tElement);
			}
		}
	}
});

theatre.export('theatre.crews.dom.DOMActor', DOMActor);

})(this);
