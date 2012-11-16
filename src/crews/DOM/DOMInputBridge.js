/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

 (function(global) {

  var theatre = global.theatre;
  var document = global.document;

  theatre.define('crews.dom.enableKeyInput', enableKeyInput, theatre);
  theatre.define('crews.dom.disableKeyInput', disableKeyInput, theatre);
  theatre.define('crews.dom.enableMotionInput', enableMotionInput, theatre);
  theatre.define('crews.dom.disableMotionInput', disableMotionInput, theatre);

  var mKeyStages = [];
  var mMotionStages = [];

  var mKeyHooked = false;
  var mMotionHooked = false;

  function onKeyDown(pEvent) {
    var tStages = mKeyStages.slice(0);
    for (var i = 0, il = tStages.length; i < il; i++) {
      tStages[i].keyManager.down(
        pEvent.keyCode,
        pEvent.altKey,
        pEvent.shiftKey,
        pEvent.ctrlKey,
        pEvent.metaKey,
        pEvent.repeat
      );
    }
  }

  function onKeyUp(pEvent) {
    var tStages = mKeyStages.slice(0);
    for (var i = 0, il = tStages.length; i < il; i++) {
      tStages[i].keyManager.up(
        pEvent.keyCode,
        pEvent.altKey,
        pEvent.shiftKey,
        pEvent.ctrlKey,
        pEvent.metaKey
      );
    }
  }

  function enableKeyInput(pStage) {
    if (mKeyStages.indexOf(pStage) === -1) {
      mKeyStages.push(pStage);
    }

    if (mKeyHooked === false) {
      document.addEventListener('keydown', onKeyDown, false);
      document.addEventListener('keyup', onKeyUp, false);
      mKeyHooked = true;
    }
  }

  function disableKeyInput(pStage) {
    var tIndex = mKeyStages.indexOf(pStage);
    if (tIndex !== -1) {
      mKeyStages.splice(tIndex, 1);
    }

    if (mKeyHooked === true && mKeyStages.length === 0) {
      document.removeEventListener('keydown', onKeyDown, false);
      document.removeEventListener('keyup', onKeyUp, false);
      mKeyHooked = false;
    }
  }

  function enableMotionInput(pStage) {
    if (mMotionStages.indexOf(pStage) === -1) {
      mMotionStages.push(pStage);
    }

    if (mMotionHooked === false) {
      mMotionHooked = true;
    }
  }

  function disableMotionInput(pStage) {
    var tIndex = mMotionStages.indexOf(pStage);
    if (tIndex !== -1) {
      mMotionStages.splice(tIndex, 1);
    }

    if (mMotionHooked === true && mMotionStages.length === 0) {
      mMotionHooked = false;
    }
  }

}(this));