/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;

  theatre.define('Scheduler', Scheduler, theatre);

  function Scheduler() {
    this.scripts = [];
    this.defaultLevel = 0;
    this.hasScripts = false;
  }

  Scheduler.prototype.add = function(pScript, pLevel) {
    if (typeof pLevel !== 'number') {
      pLevel = this.defaultLevel;
    }

    var tScripts = this.scripts[pLevel] || (this.scripts[pLevel] = []);

    tScripts.push(pScript);

    this.hasScripts = true;
  };

  Scheduler.prototype.run = function(pReverse, pHighLevelFirst) {
    var tAllScripts = this.scripts;
    var tOriginalScripts, tScripts;
    var i, il, j, jl;

    this.hasScripts = false;

    if (pHighLevelFirst === true) {
      for (i = tAllScripts.length - 1; i >= 0; i--) {
        tOriginalScripts = tAllScripts[i];

        if (tOriginalScripts === void 0) {
          continue;
        }

        jl = tOriginalScripts.length;

        tScripts = tOriginalScripts.splice(0, jl);

        if (pReverse === true) {
          for (j = jl - 1; j >= 0; j--) {
            tScripts[j]();
          }
        } else {
          for (j = 0; j < jl; j++) {
            tScripts[j]();
          }
        }
      }
    } else {
      for (i = 0, il = tAllScripts.length; i < il; i++) {
        tOriginalScripts = tAllScripts[i];

        if (tOriginalScripts === void 0) {
          continue;
        }

        jl = tOriginalScripts.length;

        tScripts = tOriginalScripts.splice(0, jl);

        if (pReverse === true) {
          for (j = jl - 1; j >= 0; j--) {
            tScripts[j]();
          }
        } else {
          for (j = 0; j < jl; j++) {
            tScripts[j]();
          }
        }
      }
    }
  }

}(this));