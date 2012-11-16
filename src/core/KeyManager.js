/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.KeyManager = KeyManager;

  function KeyManager(pStage) {
    this.base(pStage);
  };
  theatre.inherit(KeyManager, theatre.InputManager);

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