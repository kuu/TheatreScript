/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  /**
   * @class
   * @extends {theatre.InputManager}
   */
  var KeyManager = (function(pSuper) {
    function KeyManager(pStage) {
      pSuper.call(this, pStage);
    }

    KeyManager.prototype = Object.create(pSuper.prototype);
    KeyManager.prototype.constructor = KeyManager;

    return KeyManager;
  })(theatre.InputManager);

  theatre.KeyManager = KeyManager;

  KeyManager.prototype.down = function(pUnicode, pAlt, pShift, pCtrl, pMeta, pRepeat) {
    if (this.stage === null) {
      return;
    }

    // When we support focusing, use this.stage.currentFocus().cue or whatever it is.
    this.stage.cue('keydown', {
      code: pUnicode,
      key: String.fromCharCode(pUnicode),
      alt: pAlt,
      shift: pShift,
      ctrl: pCtrl,
      meta: pMeta,
      repeat: pRepeat
    }, true, true, true);
  };

  KeyManager.prototype.up = function(pUnicode, pAlt, pShift, pCtrl, pMeta) {
    if (this.stage === null) {
      return;
    }

    // When we support focusing, use this.stage.currentFocus().cue or whatever it is.
    this.stage.cue('keyup', {
      code: pUnicode,
      key: String.fromCharCode(pUnicode),
      alt: pAlt,
      shift: pShift,
      ctrl: pCtrl,
      meta: pMeta,
      repeat: false
    }, true, true, true);
  };

}(this));