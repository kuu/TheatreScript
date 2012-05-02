/**
 * @author Jason Parrott
 * 
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

theatre.run(function(global) {

global.theatre.define('theatre.Matrix', Matrix);

/**
 * An extension of an Array that allows you to use it as
 * a 2D Transformation Matrix.
 * @constructor
 * @name theatre.Matrix
 * @extends Array
 * @param {(number=1|Array.<number>)} xScale
 * @param {number=0} ySkew
 * @param {number=0} xSkew
 * @param {number=1} yScale
 * @param {number=0} xTrans
 * @param {number=0} yTrans
 */
function Matrix(xScale, ySkew, xSkew, yScale, xTrans, yTrans) {
    if (xScale !== void 0 && typeof xScale !== 'number' &&  xScale.__proto__ === Array.prototype) {
        this.concat(xScale);
    } else {
        this[0] = typeof xScale !== 'number' ? 1 : xScale;
        this[1] = typeof ySkew !== 'number' ? 0 : ySkew;
        this[2] = typeof xSkew !== 'number' ? 0 : xSkew;
        this[3] = typeof yScale !== 'number' ? 1 : yScale;
        this[4] = typeof xTrans !== 'number' ? 0 : xTrans;
        this[5] = typeof yTrans !== 'number' ? 0 : yTrans;
    }

    /**
     * @private
     */
    this._rotation = 0;
}

/**
 * @class Array
 */

Matrix.prototype = new Array();

Object.defineProperties(Matrix.prototype, /** @lends theatre.Matrix# */{

    /**
     * The current X translate.
     * @type number
     */
    x: {
        get: function() {
            return this[4];
        },
        set: function(pValue) {
            this.translateTo(pValue, null);
        }
    },

    /**
     * The current Y translate.
     * @type number
     */
    y: {
        get: function() {
            return this[5];
        },
        set: function(pValue) {
            this.translateTo(null, pValue);
        }
    },

    /**
     * Get's the current rotation of this matrix.
     * @type number
     * @todo Do this correctly
     */
    rotation: {
        get: function() {
            return this._rotation;
        },
        set: function(pValue) {
            var tArr = this.slice(0);
            this.identity()
                .scale(tArr[0], tArr[3])
                .rotate(pValue)
                .translate(tArr[4], tArr[5]);
            this._rotation = pValue;
        }
    },

    /**
     * The X scale of this matrix.
     * @type number
     */
    scaleX: {
        get: function() {
            return this[0];
        },
        set: function(pValue) {
            this[0] = pValue;
        }
    },

    /**
     * The Y scale of this matrix.
     * @type number
     */
    scaleY: {
        get: function() {
            return this[3];
        },
        set: function(pValue) {
            this[3] = pValue;
        }
    },

    /**
     * Clones the current Matrix and returns the cloned Matrix.
     * @function
     * @return {theatre.Matrix}
     */
    clone: {
        value: function() {
            return new Matrix(this[0], this[1], this[2], this[3], this[4], this[5]);
        }
    },

    /**
     * Adds another Matrix on to this one.
     * @function
     * @param {(Array.<number>|theatre.Matrix)} matrix
     * @return {theatre.Matrix}
     */
    add: {
        value: function(m) {
            var t = this.splice(0, 6);
            this.push(
                t[0] + m[0],
                t[1] + m[1],
                t[2] + m[2],
                t[3] + m[3],
                t[4] + m[4],
                t[5] + m[5]
            );
            return this;
        }
    },

    /**
     * Concatenates another Matrix on to this one.
     * @function
     * @param {(Array.<number>|theatre.Matrix)} matrix
     * @return {theatre.Matrix}
     */
    concat: {
        value: function(m) {
            var t = this;
            var t0 = t[0],
                t1 = t[1],
                t2 = t[2],
                t3 = t[3],
                t4 = t[4],
                t5 = t[5],
                m0 = m[0],
                m1 = m[1],
                m2 = m[2],
                m3 = m[3],
                m4 = m[4],
                m5 = m[5];
            this.length = 0;
            this.push(
                Math.round((t0 * m0 + t1 * m2) * 1e15) / 1e15,
                Math.round((t0 * m1 + t1 * m3) * 1e15) / 1e15,
                Math.round((t2 * m0 + t3 * m2) * 1e15) / 1e15,
                Math.round((t2 * m1 + t3 * m3) * 1e15) / 1e15,
                Math.round((t4 * m0 + t5 * m2 + m4) * 1e15) / 1e15,
                Math.round((t4 * m1 + t5 * m3 + m5) * 1e15) / 1e15
            );
            return this;
        }
    },

    /**
     * Translates the matrix by the given x and y.
     * @function
     * @param {!number} x
     * @param {!number=} y
     * @return {theatre.Matrix}
     */
    translate: {
        value: function(x, y) {
            this.concat([
                1, 0,
                0, 1,
                x, y
            ]);
            return this;
        }
    },

    /**
     * Translates the matrix to the given x and y.
     * @function
     * @param {!number} x
     * @param {!number=} y
     * @return {theatre.Matrix}
     */
    translateTo: {
        value: function(x, y) {
            if (typeof x === "number") this[4] = x;
            if (typeof y === "number") this[5] = y;
            return this;
        }
    },

    /**
     * Rotates the matrix in radians.
     * @function
     * @param {number} radians
     * @return {theatre.Matrix}
     */
    rotate: {
        value: function(radians) {
            var sin = Math.round(Math.sin(radians) * 1e15) / 1e15;
            var cos = Math.round(Math.cos(radians) * 1e15) / 1e15;
            this.concat([
                cos, sin,
                -sin, cos,
                0, 0
            ]);
            return this;
        }
    },

    /**
     * Scales the matrix.
     * @function
     * @param {!number} x
     * @param {!number=} y
     * @return {theatre.Matrix}
     */
    scale: {
        value: function(x, y) {
            this.concat([
                x, 0, 0, y, 0, 0
            ]);
            return this;
        }
    },

    /**
     * Skews the matrix.
     * @function
     * @param {!number} x
     * @param {!number=} y
     * @return {theatre.Matrix}
     */
    skew: {
        value: function(x, y) {
            this.concat([
                1, y, x, 1, 0, 0
            ]);
            return this;
        }
    },

    /**
     * Resets this Matrix to the indentity.
     * @function
     * @return {theatre.Matrix}
     */
    identity: {
        value: function() {
            this.length = 0;
            this.push(1, 0, 0, 1, 0, 0);
            return this;
        }
    },

    /**
     * Inverses the current matrix.
     * @function
     * @return {theatre.Matrix}
     */
    inverse: {
        value: function() {
            var m = this.splice(0, 6),
                d = 1 / (m[0] * m[3] - m[1] * m[2]);
            this.length = 6;
            this[0] = d * m[3];
            this[1] = -d * m[1];
            this[2] = -d * m[2];
            this[3] = d * m[0];
            this[4] = d * (m[2] * m[5] - m[3] * m[4]);
            this[5] = d * (m[1] * m[4] - m[0] * m[5]);
            return this;
        }
    },

    /**
     * Calculates a point from the given x and y
     * through this matrix.
     * @function
     * @param {number} x
     * @param {number} y
     * @return {{x: number, y: number}}
     */
    getPoint: {
        value: function(x, y) {
            return {
                x: Math.round((x * this[0] + y * this[2] + this[4]) * 1e15) / 1e15,
                y: Math.round((x * this[1] + y * this[3] + this[5]) * 1e15) / 1e15
            };
        }
    },

    /**
     * Returns a string representation of this Matrix.
     * @function
     * @return {string}
     */
    _toString: {
        value: function() {
            return this.join(', ');
        }
    }
});

});
