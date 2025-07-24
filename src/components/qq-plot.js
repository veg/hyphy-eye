import * as _ from "lodash-es";
import chiSquared from "../stats/chi-squared.js";

/**
   * Generate a quantile-quantile plot data set for a given array of values, v.
   * The input array is first sorted and then the Chi-squared distribution
   * function is used to compute the theoretical quantiles.
   * The output is an array of points (x, y) where x is the observed quantile
   * and y is the theoretical quantile.
   * @param {number[]} v - an array of values
   * @returns {Object[]} - an array of objects with properties "x" and "y"
   */
function qq(v) {
    let vs = _.map (_.sortBy (v), (v)=> v <0 ? 0. : v);
    let qq = [{'x' : 0, 'y' : 0}];

    _.each (vs, (v, i)=> {
        qq.push ({'x' : (i+1)/vs.length, 'y' : chiSquared(v, 1)});
    });
    qq.push ([{'x' : 1, 'y' : 1}]);
    
    return _.map (qq, (d)=>({'x' : 1-d.x, 'y' : 1-d.y}));
}


/**
 * Generates a quantile-quantile plot specification for visualization.
 * 
 * This function takes an array of data and a plot title to create a 
 * visualization specification for a quantile-quantile plot using the 
 * Vega-Lite format. It constructs a plot with a line mark representing 
 * the data and a reference rule for visual guidance.
 * 
 * It specifically compares observed quantiles to theoretical quantiles given a
 * Chi-squared distribution.
 * 
 * @param {Object[]} data - An array of data points used to compute the quantiles.
 * @param {string} title - optional title of the plot. Defaults to 'Q-Q Plot'.
 * @param {string} x_label - optional label of the x-axis. Defaults to 'Bootstrap p-value'.
 * @param {string} y_label - optional label of the y-axis. Defaults to 'Asymptotic p-value'.
 * @returns {Object} A Vega-Lite plot specification object.
 */

export function QQPlot(
    data, 
    title = "Q-Q Plot",
    x_label = "Bootstrap p-value",
    y_label = "Asymptotic p-value"
) {
    const qq_data = qq(data);

    return {
    "data": {"values": qq_data},
    "title" : title,
    "layer" : [{
        "mark": {"type" : "line", "color" : "firebrick", "clip" : true},
        "width" : 100,
        "height" : 100,
        "encoding": {
            "x": {
                "field": "x",
                "type" : "quantitative",
                "scale" : {"domain" : [0,0.25]},
                "axis" : {"grid" : false, "title" : x_label, "labelFontSize" : 12, "titleFontSize" : 14}
            },
            "y": {"field": "y", "type" : "quantitative","axis" : {"grid" : false, "title" : y_label, "labelFontSize" : 12, "titleFontSize" : 14}, "scale" : {"domain" : [0,0.25]}}
        }
    },{
        "mark": {
            "type": "rule",
            "color": "grey",
            "strokeWidth": 1,
            "opacity" : 0.5,
            "clip" : true
        },
        "encoding": {
            "x": {
                "datum": {"expr": "0"},
                "type": "quantitative",
            },
            "y": {
                "datum": {"expr": "0"},
                "type": "quantitative",
            },
            "x2": {"datum": {"expr": "1"}},
            "y2": {"datum": {"expr": "1"}}
    }}]
}}