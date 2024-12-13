/** module
 * @module color-maps/utils
 * @description Utility functions for using color maps
 */


/**
 * Given an array of colors, returns a function that ramps between them.
 * The returned function takes a value between 0 and 1 and returns a color.
 * Intended for use with continuous color maps.
 * see https://github.com/d3/d3-scale-chromatic/blob/main/src/sequential-multi/viridis.js
 * @param {Array<string>} range - An array of colors in "#RRGGBB" format.
 * @returns {(t: number) => string} A function that takes a value from 0 to 1 and returns a color.
 */
export function ramp(range: Array<string>): (t: number) => string {
    var n = range.length;
    return function(t) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
    };
}