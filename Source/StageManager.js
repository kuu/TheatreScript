/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

theatre.require([
	'theatre.Actor'
],
function(global) {

var theatre = global.theatre;

/**
 * The overall manager of all Actors on a Stage.
 * @name theatre.StageManager
 * @constructor
 * @extends theatre.Actor
 */
var StageManager = theatre.createActor('StageManager');

theatre.define('theatre.StageManager', StageManager);

});
