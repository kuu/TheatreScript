/**
 * @author Yuta Imaya
 * @author Jason Parrott
 *
 * Copyright (C) 2012 TheatreScript Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  global.theatre.TreeNode = TreeNode;
  global.theatre.ComplexProcess = ComplexProcess;

  /** @type {Object.<string, function>} */
  var mSimpleProcs = {};

  /** @type {Object.<string, ComplexProcess>} */
  var mComplexProcs = {};

  function ComplexProcess() {
    // Don't do anything
  }

  ComplexProcess.prototype = {
    enterSelf: function(pData) {},
    enterChildren: function(pData) {},
    enterChild: function(pData) {},
    exitChild: function(pData) {},
    exitChildren: function(pData) {},
    exitSelf: function(pData) {}
  };

  /**
   * A simple tree. Single parent style.
   * Actors that have the same layer (for sorting) will be rejected on insert.
   * @constructor
   * @param {theatre.Actor} pActor The actor to store in this node.
   */
  function TreeNode(pActor) {
    /** @type {Array.<TreeNode>} */
    this.childNodes = [];
    /** @type {TreeNode} */
    this.parentNode = null;
    /** @type {theatre.Actor} */
    this.actor = pActor;
    /** @type {Object} */
    this.cues = {};
  }

  /**
   * @param {TreeNode} pNode
   * @return {boolean} true on success, false on failure.
   */
  TreeNode.prototype.appendChild = function(pNode) {
    /** @type {number} */
    var tIndex;

    if (pNode.parentNode !== null) {
      throw new Error('parent already exists');
    }

    // binary search
    tIndex = this.binarySearch_(pNode, false);

    if (tIndex === -1) {
      return false;
    }

    // insert child
    this.childNodes.splice(tIndex, 0, pNode);
    pNode.parentNode = this;

    return true;
  };

  /**
   * @param {TreeNode} pNode
   */
  TreeNode.prototype.removeChild = function(pNode) {
    /** @type {number} */
    var tIndex;
    /** @type {number} */
    var i;
    /** @type {number} */
    var il;

    // binary search
    tIndex = this.binarySearch_(pNode, true);

    // remove child
    this.childNodes.splice(tIndex, 1);
  };

  /**
   * @param {string} pKey
   * @param {function} pFunc
   */
  TreeNode.registerSimpleProcess = function(pKey, pFunc) {
    mSimpleProcs[pKey] = pFunc;
  };

  /**
   * @param {string} pKey
   */
  TreeNode.removeSimpleProcess = function(pKey) {
    delete mSimpleProcs[pKey];
  };

  /**
   * @param {string} pKey
   * @param {ComplexProcess} pComplexProcess
   */
  TreeNode.registerComplexProcess = function(pKey, pComplexProcess) {
    mComplexProcs[pKey] = pComplexProcess;
  };

  /**
   * @param {string} pKey
   */
  TreeNode.removeComplexProcess = function(pKey) {
    delete mComplexProcs[pKey];
  };

  /**
   * @param {string} pKey
   * @param {Object=} pData Arbitrary data to pass.
   */
  TreeNode.prototype.processTopDown = function(pKey, pData) {
    /** @type {function} */
    var tProc = mSimpleProcs[pKey];
    /** @type {Array.<TreeNode>} */
    var tChildNodes = this.childNodes.slice(0);
    /** @type {number} */
    var i;
    /** @type {number} */
    var il;

    if (tProc === void 0) {
      throw new Error('No simple process named ' + pKey);
    }

    // current node
    tProc.call(this, pData);

    // child nodes
    for (i = 0, il = tChildNodes.length; i < il; ++i) {
      tChildNodes[i].processTopDown(pKey, pData);
    }
  };

  /**
   * @param {string} pKey
   * @param {Object=} pData Arbitrary data to pass.
   */
  TreeNode.prototype.processBottomUp = function(pKey, pData) {
    /** @type {function} */
    var tProc = mSimpleProcs[pKey];
    /** @type {Array.<TreeNode>} */
    var tChildNodes = this.childNodes.slice(0);
    /** @type {number} */
    var i;
    /** @type {number} */
    var il;

    if (tProc === void 0) {
      throw new Error('No simple process named ' + pKey);
    }

    // child nodes
    for (i = 0, il = tChildNodes.length; i < il; ++i) {
      tChildNodes[i].processBottomUp(pKey, pData);
    }

    // current node
    tProc.call(this, pData);
  };

  /**
   * @param {string} pKey
   * @param {Object=} pData Arbitrary data to pass.
   */
  TreeNode.prototype.processTopDownInOut = function(pKey, pData) {
    /** @type {ComplexProcess} */
    var tProc = mComplexProcs[pKey];
    /** @type {Array.<TreeNode>} */
    var tChildNodes = this.childNodes.slice(0);
    /** @type {TreeNode} */
    var tChildNode;
    /** @type {number} */
    var i;
    /** @type {number} */
    var il;
    /** @type {number} */
    var tNumOfChildren = tChildNodes.length;

    if (tProc === void 0) {
      throw new Error('No complex process named ' + pKey);
    }

    // current node, in
    tProc.enterSelf.call(this, pData);

    // child nodes
    if (tNumOfChildren > 0) {
      tProc.enterChildren.call(this, pData);

      for (i = 0; i < tNumOfChildren; ++i) {
        tChildNode = tChildNodes[i];
        tProc.enterChild.call(this, pData, tChildNode);
        tChildNode.processTopDownInOut(pKey, pData);
        tProc.exitChild.call(this, pData, tChildNode);
      }

      tProc.exitChildren.call(this, pData);
    }

    // current node, out
    tProc.exitSelf.call(this, pData);
  };

  /**
   * Compares two nodes.
   * @param  {TreeNode} pA
   * @param  {TreeNode} pB
   * @return {number} 0 on equal, -1 on less than, 1 on greater than.
   */
  TreeNode.prototype.compare = function(pA, pB) {
    var tAActor = pA.actor;
    var tBActor = pB.actor;
    if (tAActor.layer === tBActor.layer) {
      return 0;
    } else if (tAActor.layer < tBActor.layer) {
      return -1;
    } else {
      return 1;
    }
  }

  /**
   * @param {TreeNode} pNode
   * @return {number}
   * @private
   */
  TreeNode.prototype.binarySearch_ = function(pNode, pAllowDuplicates) {
    /** @type {number} */
    var tIndex;
    /** @type {Array.<TreeNode>} */
    var tChildNodes = this.childNodes;
    /** @type {number} */
    var tMin = 0;
    /** @type {number} */
    var tMax = tChildNodes.length - 1;
    /** @type {number} */
    var tCmp;

    if (tMax < 0) {
      return 0;
    }

    while (tMin < tMax) {
      tIndex = (tMin + tMax) / 2 | 0;
      tCmp = this.compare(pNode, tChildNodes[tIndex]);

      if (tCmp < 0) {
        tMax = tIndex;
      } else if (tCmp > 0) {
        tMin = tIndex + 1;
      } else {
        return pAllowDuplicates ? tIndex : -1;
      }
    }

    tCmp = this.compare(pNode, tChildNodes[tMin]);

    if (tCmp > 0) {
      return tMin + 1;
    } else if (tCmp < 0) {
      return tMin;
    } else {
      return pAllowDuplicates ? tMin : -1;
    }
  };

})(this);