/**
 * @fileoverview This file holds the definition of the theatre namespace.
 * @author Jason Parrott
 * @license TheatreScript
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license.
 * See the LICENSE file in the original source for details.
 */

(function(global){

/**
 * Ensures that a given object exists at the given path.
 * @private
 * @param {string} pPath The path.
 * @param {Object=} pSymbol The symbol.
 * @param {(Object|undefined)} pRoot The root. Defaults to the global context.
 */
function defineSymbol(pPath, pSymbol, pRoot) {
	if (!pRoot) pRoot = global;
    var tLastIndex = pPath.lastIndexOf('.'),
        tName = pPath.substring(tLastIndex + 1),
	    tParts = pPath.substring(0, tLastIndex).split(/\./),
		tPart;
	while ((tPart = tParts.shift())) {
		pRoot = pRoot[tPart] = pRoot[tPart] || new Object();
	}
    if (pSymbol !== void 0) {
        pRoot[tName] = pSymbol;
    } else {
        return pRoot;
    }
	return pSymbol;
}

/**
 * @namespace
 * @name theatre
 */
var theatre = defineSymbol('theatre', new Object(), global);

/**
 * Copy the {@see Array}'s forEach function in to NodeList.
 *     We do this because we can one-line many operations with the DOM.
 *     We also do this because forEach is much faster than a standard
 *     for loop.
 */
HTMLCollection.prototype.forEach = NodeList.prototype.forEach = Array.prototype.forEach;

/**
 * @class Object
 */

if (Object.mixin === void 0) {
    /**
     * Mixes the properties of several objects and returns the result.
     * @param {...Object}
     */
    Object.mixin = function() {
        var tObject = arguments[0] || new Object();
        for (var i = 1, il = arguments.length; i < il; i++) {
            var tArg = arguments[i];
            if (tArg) {
                for (var k in tArg) {
                    if (tArg.hasOwnProperty(k) === true) {
                        tObject[k] = tArg[k];
                    }
                }
            }
        }
        return tObject;
    };
}


/**
 * @constructor
 * @name theatre.Resolver
 */
function Resolver() {

    /**
     * @private
     * @type Object.<string, boolean>
     */
    this._completeMap = new Object();

    /**
     * @private
     * @type Array.<Array>
     */
    this._callbackMap = new Array();

    /**
     * @private
     * @type Array.<function<Object, theatre.Resolver>>
     */
    this._runs = new Array();

    /**
     * @private
     * @type number
     */
    this._status = 0;

    /**
     * @private
     * @type number
     */
    this._remaining = 0;

    /**
     * @private
     * @type number
     */
    this._completed = 0;
}

Resolver.prototype = /** @lends theatre.Resolver# */ {

    /**
     * Add a callback that requires all of the
     * items in pNames to be completed before being
     * executed.
     * @param {Array.<string>} pNames
     * @param {function(Object, theatre.Resolver)} pCallback
     * @return {theatre.Resolver} This Resolver.
     */
    require: function(pNames, pCallback) {
        var tResolved = true,
            self = this;
        pNames.forEach(function(pName) {
            if (self._completeMap[pName] === void 0) {
                tResolved = false;
            }
        });

        if (tResolved === true) {
            pCallback(global, this);
        } else {
            this._callbackMap.push([pCallback, pNames]);
            this._remaining++;
        }

        return this;
    },

    /**
     * Run the given callback when this Resolver is
     * resolved. This callback doesn't require anything.
     * @param {function(Object, theatre.Resolver)} pCallback
     * @return {theatre.Resolver} This Resolver.
     */
    run: function(pCallback) {
        if (this._status === 0) {
            this._runs.push(pCallback);
        } else {
            pCallback(global, this);
        }
        return this;
    },

    /**
     * Flag the given name as complete in this Resolver.
     * This will allow callbacks waiting for this name
     * to be complete to execute.
     * @param {string} pName
     * @return {theatre.Resolver} This Resolver.
     */
    complete: function(pName) {
        this._completeMap[pName] = true;
        this._completed++;
        return this;
    },

    /**
     * Resolve this Resolver, executing each of the
     * callbacks until done.
     */
    resolve: function() {
        this._status = 1;
        var tCallbacks = this._callbackMap,
            tCompleteMap = this._completeMap,
            tRuns = this._runs,
            self = this,
            tToExecute = new Array(),
            tDelete = new Array();
        
        tRuns.forEach(function(pCallback) {
            pCallback(global, self);
        });

        while (true) {
            var tCompletedAtStart = this._completed;
            
            tCallbacks.forEach(function(pPackage, pIndex) {
                var tCallback = pPackage[0],
                    tNames = pPackage[1];
                if (tNames.every(function(pName) {
                    if (tCompleteMap[pName] === void 0) {
                        return false;
                    }
                    return true;
                }) === true) {
                    tToExecute.push(tCallback);
                    tDelete.push(pIndex);
                }
            });

            tDelete.forEach(function(pIndex) {
                tCallbacks.splice(pIndex, 1);
            });
            tDelete.length = 0;

            tToExecute.forEach(function(pCallback) {
                pCallback(global, self);
                self._remaining--;
            });
            tToExecute.length = 0;

            if (this._remaining === 0) {
                break;
            } else if (tCompletedAtStart === this._completed) {
                throw new Error('Could not resolve due to unmet dependancies.');
            }
        }

        this._status = 2;
    }
};

var mStartupResolver = new Resolver();

/**
 * Run the given callback when TheatreScript starts up.
 * @memberOf theatre
 * @param {function(Object)} pCallback The callback to be called.
 */
theatre.run = function(pCallback) {
    if (mStartupResolver === null) {
        pCallback(global);
    } else {
        mStartupResolver.run(function(pGlobal) {
            pCallback(pGlobal);
        });
    }
};

/**
 * Require the defined names before executing the given callback.
 * @memberOf theatre
 * @param {Array.<string>} pNames An array of names that are required.
 * @param {function(Object)} pCallback The callback to be called.
 */
theatre.require = function(pNames, pCallback) {
    if (mStartupResolver === null) {
        throw new Error('TheatreScript has already started up.');
    }
    mStartupResolver.require(pNames, function(pGlobal) {
        pCallback(pGlobal);
    });
};

/**
 * Export the given name as the given object
 * or as an empty Object if pObject is not given.
 * @memberOf theatre
 * @param {string} pName The name to define.
 * @param {Object=} pObject The Object to define.
 * @param {Object=global} pRoot The root Object to define to.
 * @return {Object} The defineed object.
 */
theatre.define = function(pName, pObject, pRoot) {
    defineSymbol(pName, pObject, pRoot);
    if (mStartupResolver !== null) {
        mStartupResolver.complete(pName);
    }
    return theatre;
};

/**
 * @private
 */
theatre.init = function() {
    mStartupResolver.resolve();
    mStartupResolver = null;
};

theatre.define('theatre', theatre)
    .define('theatre.Resolver', Resolver);

}(this));
