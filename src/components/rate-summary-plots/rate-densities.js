import * as _ from "lodash-es";

// @ts-check

/**
 * @typedef {import('./rate-data').RateDataSpec} RateDataSpec
 */

/**
 * Create a Vega-Lite specification for a collection of density plots. Each plot panel in the 
 * collection represents a different rate as specified by the rate_labels parameter. The density
 * plots represent the distribution of that rate across all sites.
 *
 * @param {array} data - an array of objects, with properties defined by the rate_labels parameter
 * @param {RateDataSpec[]} rate_labels - an object defining what properties in `data` to build
 * density plots for, and what labels to use for them in the plot panels.
 * @param {boolean} omega - optional boolean indicating whether to calculate dN/dS. If true, requires `data`
 * to have properties `alpha` and `beta`. Defaults to true.
 * @param {number} dyn_range_cap - optional number indicating where to cap data values. Defauts to 10,000.
 * @param {number} bandwidth - optional number for the bandwidth (standard deviation) of the Gaussian kernel. 
 * If set to zero, the bandwidth value is automatically estimated from the input data using Scott’s rule.
 * @param {boolean} auto_x_scale - optional boolean indicating whether to auto-scale the x-axis. If false,
 * will scale from 0 to dyn_range_cap. If true, scales by the max value across all panels/ rates. Defaults to false.
 * @returns {object} - a Vega-Lite specification for the chart
 */
export function RateDensities(
    data, 
    rate_labels = [{data_key: "alpha", display_label: "α"},{data_key: "beta", display_label: "β"}],
    omega = true,
    dyn_range_cap = 10000,
    bandwidth = 0,
    auto_x_scale = false
) {
    // cap columns in data matching data_keys at dyn_range_cap
    data = _.map(data, (d)=> {
        let dd = _.clone (d);
        _.each (_.map(rate_labels, [0]), (f)=> {
            dd[f] = Math.min (dyn_range_cap, dd[f]);
        });
        
        return dd;
    });
    
    if (omega) {
        // check that alpha and beta are data_keys or err
        if (!rate_labels.some(rate => rate.data_key === 'alpha') || !rate_labels.some(rate => rate.data_key === 'beta')) {
            throw new Error("rate_labels must include alpha and beta if omega is true");
        }
        rate_labels.push({data_key: "omega", display_label: "dN/dS"})
        data = _.map(data, (d)=> {
            let dd = _.clone (d);
            dd["omega"] = Math.min(dyn_range_cap, d.alpha > 0 ? d.beta/d.alpha : d.beta > 0 ? 10000 : 0);
            return dd;
        });
    }

    let x_domain = [0, dyn_range_cap];
    if (auto_x_scale) {
      x_domain = [0, Math.max(..._.map(rate_labels, (rate)=> Math.max(..._.map(data, (d) => d[rate.data_key]))))]
    }
    
    return {
        "data" : {"values" : data}, 
        "vconcat" : _.map(rate_labels, (rt)=>({"layer" : [{
          "width": 800, "height": 100, 
          "transform":[{
            "density": rt.data_key,
            "bandwidth": bandwidth
          }],
          "mark": {type: "area", "opacity" : 0.5, tooltip : true, line : true},
          "encoding": {
            "x": {
                "field": "value",
                "grid" : null,
                "title": rt.display_label,
                "type": "quantitative",
                "scale" : {"domain" : x_domain},
                "axis": {"grid": false}
            },
            "y": {
                "field": "density",
                "type": "quantitative",
                "title" : "",
                "axis": {"grid": false}
            },
            "color" : {"value" : "grey"}
          }},
          {
            "mark": "rule",
            "encoding": {
                "x": {"aggregate": "mean", "field": rt.data_key},
                "color": {"value": "firebrick"},
                "size": {"value": 5},
            }
          },
          {
            "transform": [
                {"aggregate": [{"op": "mean", "field": rt.data_key, "as": "rate_mean_" + rt.data_key}]},
                {"calculate": "format(datum['rate_mean_"+rt.data_key+"'], '.2f')", "as": "fm1"}
            ],
            "mark": {
                "type": "text",
                "color": "gray",
                "size" : 12,
                "align": "left",
                "y": -5,
                "x": 2
            },
            "encoding": {
                "x" : {"field" : "rate_mean_" + rt.data_key, "type": "quantitative"},
                "text": {"type": "nominal", "field": "fm1"}
            }
          }]})
        )            
    }
}