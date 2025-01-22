// TODO: swap this for a lollipop plot component ??
// TODO: make a demo page for this

import * as _ from "lodash-es";
import * as d3 from "d3";

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
    string_color
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

    if (color_data && color_label) {
        color_spec = {"field" : color_label, "type" : "quantitative", "scale" : {"type" : "log", "scheme": "turbo"}, "legend" : {"orient" : "top"}}
    } else if (color_data) {
        // TODO: an error?
    } else if (color_label) {
        // TODO: an error?
    } else {
        if (threshold) {
            string_color = string_color || "black";
            color_spec = {
                "condition": {"test": "datum['" + key + "'] > " + threshold, "value": "firebrick"},
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