/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

 (function(global) {

  var theatre = global.theatre;
  var document = global.document;

  theatre.crews.dom = theatre.crews.dom || {};

  theatre.crews.dom.enableKeyInput = enableKeyInput;
  theatre.crews.dom.disableKeyInput = disableKeyInput;
  theatre.crews.dom.enablePointerInput = enablePointerInput;
  theatre.crews.dom.disablePointerInput = disablePointerInput;

  var mKeyStages = [];
  var mKeyTargets = [];

  var mPointerStages = [];
  var mPointerTargets = [];

  function onKeyDown(pEvent) {
    var tTarget = pEvent.currentTarget;
    var tTargets = mKeyTargets.slice(0);
    var tStages = mKeyStages.slice(0);

    for (var i = 0, il = tTargets.length; i < il; i++) {
      if (tTargets[i] === tTarget) {
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
  }

  function onKeyUp(pEvent) {
    var tTarget = pEvent.currentTarget;
    var tTargets = mKeyTargets.slice(0);
    var tStages = mKeyStages.slice(0);

    for (var i = 0, il = tTargets.length; i < il; i++) {
      if (tTargets[i] === tTarget) {
        tStages[i].keyManager.up(
          pEvent.keyCode,
          pEvent.altKey,
          pEvent.shiftKey,
          pEvent.ctrlKey,
          pEvent.metaKey
        );
      }
    }
  }

  function onTouchStart(pEvent) {
    var tTarget = pEvent.currentTarget;
    var tTargets = mPointerTargets.slice(0);
    var tStages = mPointerStages.slice(0);
    var tTouches = pEvent.changedTouches;
    var tTouch;
    var i, il, j, jl;
    var tBounds = tTarget.getBoundingClientRect();
    var tY = tBounds.top;
    var tX = tBounds.left;

    for (i = 0, il = tTargets.length; i < il; i++) {
      if (tTargets[i] === tTarget) {
        pEvent.preventDefault();

        for (j = 0, jl = tTouches.length; j < jl; j++) {
          tTouch = tTouches[j];
          tStages[i].pointerManager.down(
            tTouch.identifier, // The ID of this pointer
            tTouch.clientX - tX, // Relative X
            tTouch.clientY - tY, // Relative Y
            tTouch === pEvent.touches[0] // isPrimary
          );
        }
      }
    }
  }

  function onTouchMove(pEvent) {
    var tTarget = pEvent.currentTarget;
    var tTargets = mPointerTargets.slice(0);
    var tStages = mPointerStages.slice(0);
    var tTouches = pEvent.changedTouches;
    var tTouch;
    var i, il, j, jl;
    var tBounds = tTarget.getBoundingClientRect();
    var tY = tBounds.top;
    var tX = tBounds.left;

    for (i = 0, il = tTargets.length; i < il; i++) {
      if (tTargets[i] === tTarget) {
        for (j = 0, jl = tTouches.length; j < jl; j++) {
          tTouch = tTouches[j];
          tStages[i].pointerManager.move(
            tTouch.identifier, // The ID of this pointer
            tTouch.clientX - tX, // Relative X
            tTouch.clientY - tY, // Relative Y
            tTouch === pEvent.touches[0] // isPrimary
          );
        }
      }
    }
  }

  function onTouchEnd(pEvent) {
    var tTarget = pEvent.currentTarget;
    var tTargets = mPointerTargets.slice(0);
    var tStages = mPointerStages.slice(0);
    var tTouches = pEvent.changedTouches;
    var tTouch;
    var i, il, j, jl;
    var tBounds = tTarget.getBoundingClientRect();
    var tY = tBounds.top;
    var tX = tBounds.left;

    for (i = 0, il = tTargets.length; i < il; i++) {
      if (tTargets[i] === tTarget) {
        for (j = 0, jl = tTouches.length; j < jl; j++) {
          tTouch = tTouches[j];
          tStages[i].pointerManager.up(
            tTouch.identifier, // The ID of this pointer
            tTouch.clientX - tX, // Relative X
            tTouch.clientY - tY, // Relative Y
            tTouch === pEvent.touches[0] // isPrimary
          );
        }
      }
    }
  }

  function onMouseDown(pEvent) {
    var tTarget = pEvent.currentTarget;
    var tTargets = mPointerTargets.slice(0);
    var tStages = mPointerStages.slice(0);
    var i, il;
    var tBounds = tTarget.getBoundingClientRect();
    var tY = tBounds.top;
    var tX = tBounds.left;

    for (i = 0, il = tTargets.length; i < il; i++) {
      if (tTargets[i] === tTarget) {
        tStages[i].pointerManager.down(
          1, // The ID of this pointer
          pEvent.clientX - tX, // Relative X
          pEvent.clientY - tY, // Relative Y
          true // isPrimary
        );
      }
    }
  }

  function onMouseMove(pEvent) {
    var tTarget = pEvent.currentTarget;
    var tTargets = mPointerTargets.slice(0);
    var tStages = mPointerStages.slice(0);
    var i, il;
    var tBounds = tTarget.getBoundingClientRect();
    var tY = tBounds.top;
    var tX = tBounds.left;

    for (i = 0, il = tTargets.length; i < il; i++) {
      if (tTargets[i] === tTarget) {
        tStages[i].pointerManager.move(
          1, // The ID of this pointer
          pEvent.clientX - tX, // Relative X
          pEvent.clientY - tY, // Relative Y
          true // isPrimary
        );
      }
    }
  }

  function onMouseUp(pEvent) {
    var tTarget = pEvent.currentTarget;
    var tTargets = mPointerTargets.slice(0);
    var tStages = mPointerStages.slice(0);
    var i, il;
    var tBounds = tTarget.getBoundingClientRect();
    var tY = tBounds.top;
    var tX = tBounds.left;

    for (i = 0, il = tTargets.length; i < il; i++) {
      if (tTargets[i] === tTarget) {
        tStages[i].pointerManager.up(
          1, // The ID of this pointer
          pEvent.clientX - tX, // Relative X
          pEvent.clientY - tY, // Relative Y
          true // isPrimary
        );
      }
    }
  }

  function listenerIndex(pStages, pTargets, pStage, pTarget) {
    for (var i = 0, il = pStages.length; i < il; i++) {
      if (pStages[i] === pStage && pTargets[i] === pTarget) {
        return i;
      }
    }

    pStages.push(pStage);
    pTargets.push(pTarget);

    return -1;
  }

  function enableKeyInput(pStage, pContainer) {
    if (listenerIndex(mKeyStages, mKeyTargets, pStage, pContainer) !== -1) {
      return;
    }

    pContainer.addEventListener('keydown', onKeyDown, false);
    pContainer.addEventListener('keyup', onKeyUp, false);
  }

  function disableKeyInput(pStage, pContainer) {
    var tIndex = listenerIndex(mKeyStages, mKeyTargets, pStage, pContainer);

    if (tIndex !== -1) {
      mKeyStages.splice(tIndex, 1);
      mKeyTargets.splice(tIndex, 1);

      pContainer.removeEventListener('keydown', onKeyDown, false);
      pContainer.removeEventListener('keyup', onKeyUp, false);
    }
  }

  function enablePointerInput(pStage, pContainer) {
    if (listenerIndex(mPointerStages, mPointerTargets, pStage, pContainer) !== -1) {
      return;
    }

    if (global.navigator.pointerEnabled) {
      // for the PointerEvent spec

    } else if ('ontouchstart' in document.documentElement) {
      // for touch event browsers
      pContainer.addEventListener('touchstart', onTouchStart, false);
      pContainer.addEventListener('touchmove', onTouchMove, false);
      pContainer.addEventListener('touchend', onTouchEnd, false);
    } else {
      // fallback to mouse
      pContainer.addEventListener('mousedown', onMouseDown, false);
      pContainer.addEventListener('mousemove', onMouseMove, false);
      pContainer.addEventListener('mouseup', onMouseUp, false);
    }
  }

  function disablePointerInput(pStage, pContainer) {
    var tIndex = listenerIndex(mPointerStages, mPointerTargets, pStage, pContainer);

    if (tIndex !== -1) {
      mPointerStages.splice(tIndex, 1);
      mPointerTargets.splice(tIndex, 1);

      if (global.navigator.pointerEnabled) {
        // for the PointerEvent spec

      } else if ('ontouchstart' in document.documentElement) {
        // for touch event browsers
        pContainer.removeEventListener('touchstart', onTouchStart, false);
        pContainer.removeEventListener('touchmove', onTouchMove, false);
        pContainer.removeEventListener('touchend', onTouchEnd, false);
      } else {
        // fallback to mouse
        pContainer.removeEventListener('mousedown', onMouseDown, false);
        pContainer.removeEventListener('mousemove', onMouseMove, false);
        pContainer.removeEventListener('mouseup', onMouseUp, false);
      }
    }
  }

}(this));