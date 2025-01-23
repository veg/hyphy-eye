import * as _ from "lodash-es";

// @ts-check

/**
 * @typedef {import('./rate-data').RateDataSpec} RateDataSpec
 */

// TODO: should this be moved or renamed if it shows more than rates? 
// ex: were often passing pvalues to it

/**
 * Create a Vega-Lite specification for a collection of bar plots. Each 
 * plot panel in the collection represents a different rate as specified 
 * by the rate_labels parameter. The bar plots represent the maximum 
 * likelihood estimate of the specified rate (y-axis) for each site (x-axis).
 * The data is transformed to cap values at the specified dynamic_range_cap 
 * before plotting.
 *
 * @param {array} data - An array of objects, with each object containing
 * rate data for a specific site. Each object should have properties 
 * corresponding to the rate categories defined in the `columns` array.
 * @param {RateDataSpec[]} rate_labels - an object defining what properties 
 * in `data` to build bar plots for, and what labels to use for them in the 
 * plot panels.
 * @param {string} y_scale - a string representing a scale type that Vega
 * knows about. Examples: 'log', 'linear', 'symlog'.
 * @param {number} dyn_range_cap - optional number indicating where to cap
 * data values. Defauts to 10,000.
 * @returns {object} A Vega-Lite specification for the plot, which can 
 * be used to render the visualization.
 */

export function RateBarPlots(
  data,
  rate_labels = [
    {data_key: "alpha", display_label: "α"},
    {data_key: "beta", display_label: "β"},
    {data_key: "p-value", display_label: "p-value"}
  ],
  y_scale = "linear",
  dyn_range_cap = 10000
) {
  data = _.map (data,
        (d)=> {
            let dd = _.clone (d);
            _.each (rate_labels, (f)=> {
              dd[f.data_key] = Math.min (dyn_range_cap, dd[f.data_key]);
            });
            return dd;
        })

    // Check if either codon or Codon is present
    const codonKey = Object.prototype.hasOwnProperty.call(data[0], "codon") ? "codon" : "Codon";

    return {
        "data" : {"values" : data}, 
        
        "vconcat" : _.map(rate_labels, (rate,i)=> ({
          "width" : 800,
          "height" : 50,
          "mark": {"type": "area", "color" : "lightblue", "stroke" : "black", "interpolate" : "step"},
          "encoding": {
            "x": {
              "field": codonKey,
              "type" : "quantitative",
              "axis": {"grid" : false, "titleFontSize" : 14, "title" : i == rate_labels.length -1 ? "Codon" : null}
            },
            "y": {
              "field": rate.data_key,
              "type" : "quantitative",
              "axis": {"grid" : false, "titleFontSize" : 14, "title" : rate.display_label},
              "scale": y_scale
            }
          }
        }))
    };
  }
