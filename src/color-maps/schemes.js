/**
 * @module color-maps/schemes
 * @description A collection of reusable and accessible color maps 
 * and functions for creating embeddable examples of the same.
 * At some point I may break this out into separate modules like 'crameri' and 'tol', etc
 */

import {FileAttachment} from "observablehq:stdlib";


/**
 * A color map with three colors: dark blue, light gray, dark red
 * @type {Array<String>}
 */
export const binary_with_gray = ["#284073","#a6a4a4","#3f6c22"];

/**
 * JSON Object with crameri color schemes, keys are scheme names, values are arrays of colors in "#RRGGBB" format.
 * These color schemes are all continuous.
 * I may break this into "converging", "diverging", etc.
 * @type {Object}
 */
export const crameri = await FileAttachment("../data/crameri-color-schemes.json").json();

/**
 * JSON Object with tol color schemes, keys are scheme names, values are arrays of colors in "#RRGGBB" format.
 * These color schemes are all categorical.
 * @type {Object}
 */
export const tol = await FileAttachment("../data/tol-color-schemes.json").json();

/**
 * Given an array of colors, returns a function that ramps between them.
 * The returned function takes a value between 0 and 1 and returns a color.
 * Intended for use with continuous color maps.
 * see https://github.com/d3/d3-scale-chromatic/blob/main/src/sequential-multi/viridis.js
 * @param {Array<String>} range - An array of colors in "#RRGGBB" format.
 * @returns {Function} A function that takes a value from 0 to 1 and returns a color.
 */
export function ramp(range) {
    var n = range.length;
    return function(t) {
        return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
    };
}






/**
 * SOME HELPERS FOR VARIOUS COLOR MAP RELATED TASKS EXIST BELOW HERE
 * I WOULD DESCRIBE THEM AS SLIGHTLY EXPERIMENTAL
 * I MAY OR MAY NOT KEEP THEM, HAVENT DECIDED YET HOW USEFUL THEY ARE
 */


/**
 * Convert a color map (xml) to a string that can be used in Vega/d3/etc.
 * see https://observablehq.com/@fil/colormaps
 * @param {Element} cmap - XML element with color map.
 * @returns {string} string of hex color values.
 */
function scheme(cmap) {
    const m = [], fields = ["r", "g", "b"];
    var f = cmap.getElementsByTagName("Point");
    for (var i = 0; i < f.length; i++) {
        for (let c in fields)
            m.push(
                ("0" + (Math.floor(+f[i].getAttribute(fields[c])*0.999999999999 * 256)).toString(16)).slice(-2)
            )
    }
    return m.join("");
}

/**
 * Creates a canvas element showing a ramp of colors from a given color map.
 * The given color map should be a function that takes a value from 0 to 1 and
 * returns a color in "#RRGGBB" format. The returned canvas element is a
 * horizontal strip showing a gradient of those colors.
 * see https://observablehq.com/@mbostock/ramp
 * @param {Function} color - A color map function.
 * @param {Number} [n=512] - The width to assign the canvas element.
 * @returns {HTMLCanvasElement} A canvas element.
 */
export function draw_ramp(color, n = 512) {
    const canvas = document.createElement("canvas");
    canvas.width  = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    canvas.style.margin = "0 -14px";
    canvas.style.width = "calc(100% + 28px)";
    canvas.style.height = "40px";
    canvas.style.imageRendering = "-moz-crisp-edges";
    canvas.style.imageRendering = "pixelated";
    for (let i = 0; i < n; ++i) {
        context.fillStyle = color(i / (n - 1));
        context.fillRect(i, 0, 1, 1);
    }
    return canvas;
}