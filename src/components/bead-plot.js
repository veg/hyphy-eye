// TODO: swap this for a lollipop plot component ??
// TODO: make a demo page for this

import * as _ from "lodash-es";
import * as d3 from "d3";
import { 
    getBustedAttributes, 
    getBustedTileSpecs, 
    getBustedErrorSink, 
    getBustedSiteTableData, 
    getBustedPositiveSelection 
} from '../busted/busted-utils.js';
import { 
    getAbsrelAttributes, 
    getAbsrelProfileBranchSites, 
    getAbsrelTileSpecs, 
    getAbsrelSiteTableData, 
    getAbsrelBSPositiveSelection 
} from '../absrel/absrel-utils.js';
import { getFelAttributes, getFelTileSpecs, getFelSiteTableData } from '../fel/fel-utils.js';
import { 
    getMemeAttributes, 
    getMemeTileSpecs, 
    getMemeSiteTableData, 
    getMemePosteriorsPerBranchSite 
} from '../meme/meme-utils.js';
import { getGardAttributes, getGardTileSpecs } from '../gard/gard-utils.js';
import { getNrmAttributes, getNrmTileSpecs } from '../nrm/nrm-utils.js';
import { getMultihitAttributes, getMultihitTileSpecs } from '../multihit/multihit-utils.js';
import { mutliHitER } from "../busted/busted-plots.js";

// Shared mapping of HyPhy methods to their attribute, site-table, and posterior functions
export const methodUtils = {
    BUSTED: { 
        attrsFn: getBustedAttributes, 
        tableFn: getBustedSiteTableData, 
        tileFn: getBustedTileSpecs,
        bsPositiveSelectionFn: getBustedPositiveSelection,
        errorSinkFn: getBustedErrorSink,
        multiHitFn: mutliHitER,
        profileBranchSitesFn: null
    },
    aBSREL: { 
        attrsFn: getAbsrelAttributes, 
        tableFn: getAbsrelSiteTableData,
        tileFn: getAbsrelTileSpecs, 
        bsPositiveSelectionFn: getAbsrelBSPositiveSelection,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: getAbsrelProfileBranchSites
    },
    FEL: { 
        attrsFn: getFelAttributes, 
        tableFn: getFelSiteTableData, 
        tileFn: getFelTileSpecs,
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null
    },
    MEME: { 
        attrsFn: getMemeAttributes, 
        tableFn: getMemeSiteTableData,
        tileFn: getMemeTileSpecs, 
        bsPositiveSelectionFn: getMemePosteriorsPerBranchSite,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null
    },
    GARD: { 
        attrsFn: getGardAttributes, 
        tableFn: null, 
        tileFn: getGardTileSpecs, 
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null
    },
    NRM: { 
        attrsFn: getNrmAttributes, 
        tableFn: null, 
        tileFn: getNrmTileSpecs, 
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null
    },
    MULTIHIT: { 
        attrsFn: getMultihitAttributes, 
        tableFn: null, 
        tileFn: getMultihitTileSpecs, 
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null
    }
};

/**
 * Plot a bead plot of the given data, with an optional threshold marking. 
 * These are so named because they look like beads on a string.
 * 
 * @param {Array<Object>} data - data to plot
 * @param {Number} from - first data point to plot
 * @param {Number} step - number of data points to plot
 * @param {String} key - data attribute to use for the Y axis
 * @param {Boolean} log_scale - whether to use log scale for the Y axis
 * @param {Number} dyn_range_cap - cap for dynamic range of the plot
 * @param {String} y_label - optional label for the Y axis. If not provided, defaults to key.
 * @param {Number} threshold - optional threshold marking the Y axis
 * @param {String} key2 - optional data attribute to use for a secondary line
 * @param {String} string_color - optional color to use for the "string" of points. If not provided, defaults to "lightgrey" 
 * unless threshold is provided in which case it defaults to "black".
 * @param {Array<Object>} color_data - optional color scale data. If not provided but threshold is, will color 
 * points based on the value of threshold and whether it is above or below the threshold. If color_label is 
 * provided, this is required.
 * @param {String} color_label - optional label for color scale (i.e. the name of the data attribute). If color_data 
 * is provided, this is required.
 * @param {Boolean} rev_threshold_color - swap the way points are colored based on the threshold value. Default false.
 * 
 * @returns {Object} Vega-Lite spec
 */
export function BeadPlot(
    data, 
    from, 
    step, 
    key,
    log_scale = false,
    dyn_range_cap,
    y_label,
    threshold,
    key2,
    color_data, 
    color_label,
    string_color,
    rev_threshold_color = false
) {
    const false_zero = 1e-20;

    let scale_type = log_scale ? "log" : "symlog";
    let scale_domain = d3.extent(data, (d)=>d[key]);
    let color_spec = null;
    let threshold_spec = null;
    y_label = y_label || key;

    // this is a hack to prevent log scale from going to 0
    if (log_scale) {
        scale_domain[0] = Math.max (scale_domain[0], false_zero);
    }

    if (threshold) {
        scale_domain[1] = Math.min(dyn_range_cap, Math.max(scale_domain[1], threshold));
        
        threshold_spec = {
            "mark" : {"opacity": 0.5, "type": "line", "color": "steelblue"},
            "encoding" : { 
                "y": {
                    "datum": {"expr": "" + threshold},
                    "type": "quantitative",
                    "scale" : {"domain" : scale_domain}
                },
                "size": {"value": 2},
            }
        }
    }

    // TODO: no longer remember why we need the color_data here.. isnt this in the main data param?
    if (color_data && color_label) {
        color_spec = {"field" : color_label, "type" : "quantitative", "scale" : {"type" : "log", "scheme": "turbo"}, "legend" : {"orient" : "top"}}
    } else if (color_data) {
        // TODO: an error?
    } else if (color_label) {
        // TODO: an error?
    } else {
        if (threshold) {
            let threshold_operation = '>'
            if (rev_threshold_color) {
                threshold_operation = '<'
            }
            string_color = string_color || "black";
            color_spec = {
                "condition": {"test": "datum['" + key + "'] "+ threshold_operation + threshold, "value": "firebrick"},
                "value": "lightgrey"
                }
        }
    }

    string_color = string_color || "lightgrey";

    let spec = {
        "width": {"step": 12},
        "data" : {"values" : _.map (
            _.filter (data, (d,i)=> i >= from -1 && i < from + step -1),
        (d)=> {
            let dd = _.clone (d);
            _.each ([key], (f)=> {
                dd[f] = Math.min (dyn_range_cap, dd[f]);
                if (log_scale) {
                    // this sets the value to 1e-20 if its below that, which is the smallest representable value in log scale
                    dd[f] = Math.max(false_zero, dd[f]);
                }
            });
            return dd;
        })}, 
        "encoding": {
            "x": {
                "field": "Codon",
                "type" : "nominal",
                "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Codon"}
            }   
        },
        "layer": [
            {
                "mark": {"stroke": string_color, "type": "line", "size" : 2, "interpolate" : "step", "color" : "lightgrey", "opacity" : 0.5},
                "encoding": {
                    "y": {
                        "field": key,
                        "type" : "quantitative",
                        "scale" : {"type" : scale_type, "domain" : scale_domain},
                        "axis" : {"grid" : false, "title" : y_label}
                    }
                }
            },
            {
                "mark": { "stroke": string_color, "type": "point", "size" : 100, "filled" : true,  "color" : "lightgrey", "tooltip" : {"contents" : "data"}, "opacity" : 1.},
                "encoding": {
                    "y": {
                        "field": key,
                        "type" : "quantitative",
                        "scale" : {"type" : scale_type, "domain" : scale_domain},
                        "axis" : {"grid" : false, "title" : y_label}
                    },
                    "color" : color_spec
                }
            }
        ]
    };

    if (threshold) {
        spec.layer.push (threshold_spec);
    }

    if (key2) {
        spec.layer.push ({
            "mark": {"type": "line", "size" : 4, "color" : "lightgrey", "opacity" : 0.5, "interpolate" : "step", "color" : "firebrick"},
            "encoding": {
                "y": {
                    "field": key2,
                    "type" : "quantitative",
                }
            }
        });
    }

    return spec;
}

// TODO: make this BeadPlotGenerator, work for all methods, reads from registry
// Wrapper that takes HyPhy results JSON and prepares data for BeadPlot
export function BeadPlotGenerator(resultsJson, method, threshold = 10, dyn_range_cap = 10000, options = {}) {
    const finalOpts = { ...options };
    // Lookup util functions centrally
    const utilsFns = methodUtils[method];
    if (!utilsFns) throw new Error(`No utilities defined for method: ${method}`);
    const attrs = utilsFns.attrsFn(resultsJson);
    // Evaluate any string options referencing attrs or results_json
    Object.entries(finalOpts).forEach(([opt, val]) => {
        if (typeof val === 'string' && /\battrs\b|\bresults_json\b/.test(val)) {
            const fn = new Function('attrs', 'results_json', `return ${val}`);
            finalOpts[opt] = fn(attrs, resultsJson);
        }
    });
    // Build data via centralized table function
    const siteRes = utilsFns.tableFn(resultsJson, threshold);
    const data = Array.isArray(siteRes[0]) ? siteRes[0] : siteRes;
    // Assemble arguments: data, from, step, then only defined finalOpts in order
    const beadArgs = [data, 1, data.length];
    const optOrder = [
        'key', 'log_scale', 'dyn_range_cap', 'y_label',
        'threshold', 'key2', 'color_data', 'color_label',
        'string_color', 'rev_threshold_color'
    ];
    // Loop through options in order, pushing values or skipping as needed
    for (const opt of optOrder) {
        if (opt === 'threshold') {
            beadArgs.push(threshold);
            continue;
        }
        if (opt === 'dyn_range_cap') {
            beadArgs.push(dyn_range_cap);
            continue;
        }
        if (finalOpts[opt] !== undefined) {
            beadArgs.push(finalOpts[opt]);
        } else {
            beadArgs.push(null);
        }
    }

    // If too many codons, split into multiple vconcat plots
    const maxCodons = 70;
    if (data.length > maxCodons) {
        const specs = [];
        for (let i = 0; i < data.length; i += maxCodons) {
            const subFrom = i + 1;
            const subStep = Math.min(maxCodons, data.length - i);
            // reuse options args (after data/from/step)
            const restArgs = beadArgs.slice(3);
            specs.push(BeadPlot(data, subFrom, subStep, ...restArgs));
        }
        return { vconcat: specs };
    }
    return BeadPlot(...beadArgs);
}