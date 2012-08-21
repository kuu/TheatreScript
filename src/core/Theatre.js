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
      return pRoot[tName] = pSymbol;
    } else if (pRoot[tName] !== void 0) {
      return pRoot[tName];
    } else {
      return pRoot[tName] = new Object();
    }
  }

  /**
   * @namespace
   * @name theatre
   */
  var theatre = defineSymbol('theatre', new Object(), global);

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
   * Export the given name as the given object
   * or as an empty Object if pObject is not given.
   * @memberOf theatre
   * @param {string} pName The name to define.
   * @param {Object=} pObject The Object to define.
   * @param {Object=global} pRoot The root Object to define to.
   * @return {Object} The defined object.
   */
  theatre.define = function(pName, pObject, pRoot) {
    return defineSymbol(pName, pObject, pRoot);
  };

}(this));
