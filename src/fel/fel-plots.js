import * as phylotree from "phylotree";
import * as _ from "lodash-es";
import * as colors from "../color-maps/custom.js";

const DYN_RANGE_CAP = 10;
export const COLORS = {
      'Diversifying' : colors.binary_with_gray[2],
      'Neutral' : colors.binary_with_gray[1],
      'Purifying' : colors.binary_with_gray[0],
    };

/**
 * Returns an array of arrays, where each sub-array contains a string description
 * of a plot, and a function that takes a data object and returns a boolean
 * indicating whether the plot should be shown for that data object.
 *
 * @param {boolean} has_pasmt - whether the data object has pasmt results
 * @returns {Array.<Array.<string|function>>} The array of arrays described above
 */
export function get_plot_options(has_pasmt) {
  const options = [
    ["Site-level dN/dS estimates",(d)=>d["confidence interval"]],
    ["alpha/beta site-level estimates", (d)=>1], 
    ["Bootstrap vs asymptotic p-value", (d)=>has_pasmt], 
    ["Rate density plots", (d)=>1], 
    ["Q-Q plots", (d)=>has_pasmt], 
    ["Dense rate plot", (d)=>1]
  ];

  return options;
}

/**
 * Returns a human-readable description of the plot identified by the
 * specified string. The description is a string that can be used as a
 * tooltip for the plot.
 *
 * @param {string} plot_type - the type of plot to describe
 * @param {number} pvalue_threshold - the threshold for significance
 * @returns {string} the description of the plot
 */
export function get_plot_description(plot_type, pvalue_threshold) {
  const descriptions = {
    "Site-level dN/dS estimates" : "Maximum likelihood estimates of dN/dS at each site, together with estimated profile condifence intervals (if available). dN/dS = 1 (neutrality) is depicted as a horizontal gray line. Boundaries between partitions (if present) are shown as vertibal dashed lines.",
    "alpha/beta site-level estimates": "Maximum likelihood estimates of synonymous (α) and non-synonymous rates (β) at each site shown as bars. The line shows the estimates under the null model (α=β). Estimates above " + DYN_RANGE_CAP +" are censored at this value.",
    "Dense rate plot" : "Maximum likelihood estimates of synonymous (α) and non-synonymous rates (β) at each site. Estimates above " + DYN_RANGE_CAP +" are censored at this value. p-values are also shown",
    "Bootstrap vs asymptotic p-value" : "Comparison of site-level p-values for non-neutrality using parametric bootstrap and the asymptotic approximation. Rejection region (p ≤ " + pvalue_threshold + ") is shown as a shaded rectangle",
    "Rate density plots" : "Kernel density estimates of site-level rate estimates. Means are shown with red rules. Estimates above " + DYN_RANGE_CAP +" are censored at this value.",
    "Q-Q plots" : "Comparison of asymptotic vs boostrap LRT distributions (limited to 60 sites)."
  };

  return descriptions[plot_type];
}

/**
 * Given a tree, return a list of sequence names (i.e. names of
 * tips in the tree).
 * @param {Object} tree - a tree object
 * @return {Array<String>}
 */
export function seqNames(tree) {
    let seq_names = [];
    tree.traverse_and_compute (n=>{
        if (n.children && n.children.length) return;
        seq_names.push (n.data.name);
    });
    return seq_names;
};

export function get_tree_objects(results_json) {
  const tree_objects = _.map (results_json.input.trees, (tree,i)=> {
    let T = new phylotree.phylotree (tree);
    T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name]["Global MG94xREV"];
    return T;
  });
  
  return tree_objects;
}

/**
 * Compute the total length of a tree.
 * @param {Object} tree - a tree object
 * @return {Number} total length of the tree
 */
export function totalTreeLength(tree) {
  let L = 0;
  tree.traverse_and_compute ( (n)=> {
     if (tree.branch_length (n)) {
      L += +tree.branch_length (n);
     }
  });
  return L;
}

/**
 * Create a Vega-Lite specification for a stacked area chart of rate densities for
 * alpha, beta and omega.
 *
 * @param {array} data - an array of objects, each with the following properties:
 *   - `alpha` - a number representing the synonymous rate
 *   - `beta` - a number representing the non-synonymous rate
 *   - `dN/dS MLE` - the maximum likelihood estimate of the dN/dS ratio
 * @returns {object} - a Vega-Lite specification for the chart
 */
export function rate_density(data) {
    let rate_options = [["alpha","α"],["beta","β"], ["omega", "dN/dS"]];
    
    return {
        "data" : {"values" : _.map (data, 
        (d)=> {
            let dd = _.clone (d);
            _.each (["alpha","beta","dN/dS MLE"], (f)=> {
                dd[f] = Math.min (DYN_RANGE_CAP, dd[f]);
            });
            
            return dd;
        })}, 
        "transform" : [{"calculate" : "min(" + DYN_RANGE_CAP + ",datum.alpha > 0 ? datum.beta/datum.alpha : datum.beta > 0 ? 10000 : 0)", "as" : "omega"}],
        "vconcat" : _.map (rate_options, (rt)=>({"layer" : [{
        "width": 800, "height": 100, 
        "transform":[{
            "density": rt[0],
            "bandwidth": 0.2
        }],
        "mark": {type: "area", "opacity" : 0.5, tooltip : true, line : true},
        "encoding": {
            "x": {
                "field": "value",
                "grid" : null,
                "title": rt[1],
                "type": "quantitative",
                "scale" : {"domain" : [0, DYN_RANGE_CAP]},
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
                "x": {"aggregate": "mean", "field": rt[0]},
                "color": {"value": "firebrick"},
                "size": {"value": 5},
            }
        },
        {
            "transform": [
                {"aggregate": [{"op": "mean", "field": rt[0], "as": "rate_mean_" + rt[0]}]},
                {"calculate": "format(datum['rate_mean_"+rt[0]+"'], '.2f')", "as": "fm1"}
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
                "x" : {"field" : "rate_mean_" + rt[0], "type": "quantitative"},
                "text": {"type": "nominal", "field": "fm1"}
            }
        }]})
        )            
    }
}
export function qq_plot(data, title) {
    return {
    "data": {"values": data},
    "title" : title,
    "layer" : [{
        "mark": {"type" : "line", "color" : "firebrick", "clip" : true},
        "width" : 100,
        "height" : 100,
        "encoding": {
            "x": {
                "field": "bs",
                "type" : "quantitative",
                "scale" : {"domain" : [0,0.25]},
                "axis" : {"grid" : false, "title" : "Bootstrap p-value", "labelFontSize" : 12, "titleFontSize" : 14}
            },
            "y": {"field": "c2", "type" : "quantitative","axis" : {"grid" : false, "title" : "Asymptotic p-value", "labelFontSize" : 12, "titleFontSize" : 14}, "scale" : {"domain" : [0,0.25]}}
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

export function pv_plot(data, pvalue_threshold) {
    let color_d = [];
    let color_r = [];
    _.each (COLORS, (v,c)=> {color_d.push (c); color_r.push (v);});
    
    return {
        "width": 500, "height": 500, 
        "data" : {"values" : data},
        "transform" : [{"calculate" : "(datum['p-value'] -" + pvalue_threshold + ")* (datum['p-asmp'] -" + pvalue_threshold + ") >= 0 ? 'Yes' : 'No'", "as": "agree"}],
        "layer" : [
           {
            "mark" : {"opacity": 0.1, "type": "rect", "color": "#DDD"},
            "encoding": {
                "x": {
                  "datum": {"expr": "0"},
                  "type": "quantitative",
                 
                },
                "y": {
                  "datum": {"expr": "0"},
                  "type": "quantitative",
                  
                },
                "x2": {"datum": {"expr": pvalue_threshold}},
                "y2": {"datum": {"expr": pvalue_threshold}}
              }
          },
           {
             "mark" : {"type" : "point", "size" : 96, "tooltip" : {"content" : "data"}, "filled" : true, "opacity" : 0.4},
             "encoding" : {
               "x": {
                "field": "p-value",
                "type" : "quantitative",
                "scale" : {"type" : "sqrt"},
                "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Bootstrap p-value"}
               },
               "y": {
                  "field": "p-asmp",
                  "type" : "quantitative",
                   "scale" : {"type" : "sqrt"},
                  "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Asymptotic p-value"}
              }, 
              "color" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"},
              "shape": {
                  "field" : "agree",
                  "title" : "Both p-values agree",
                "scale" : {"domain" : ["Yes","No"], "range" : ["circle", "cross"]}
                }
             }
           }
          ]
    }
  }
  
  /**
   * Create a Vega-Lite specification for a plot of dN/dS ratio estimates
   * with bootstrapped confidence intervals.
   *
   * @param {array} data - an array of objects, each with the following properties:
   *   - `codon` - a string representing the codon number
   *   - `dN/dS LB` - the lower bound of the bootstrapped confidence interval
   *   - `dN/dS MLE` - the maximum likelihood estimate of the dN/dS ratio
   *   - `dN/dS UB` - the upper bound of the bootstrapped confidence interval
   *   - `class` - a string indicating the selection class (one of "Diversifying", "Neutral", "Purifying")
   * @param {number} from - the first codon number to include in the plot
   * @param {number} step - the number of codons to include in the plot
   * @returns {object} - a Vega-Lite specification for the plot
   */
  export function dNdS_with_ci(data, from, step) {
    let color_d = [];
    let color_r = [];
    _.each (COLORS, (v,c)=> {color_d.push (c); color_r.push (v);});
    return {
        "width": {"step": 12},
        "data" : {"values" : _.map (
          _.filter (data, (d,i)=>i+1 >= from && i<= from + step),
        (d)=> {
            let dd = _.clone (d);
            _.each (["dN/dS LB","dN/dS UB", "dN/dS MLE"], (f)=> {
              dd[f] = Math.min (DYN_RANGE_CAP, dd[f]);
            });
            return dd;
        })}, 
        "transform" :[{"calculate": "1", "as": "neutral"}],
        "encoding": {
          "x": {
            "field": "codon",
            "type" : "nominal",
            "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Codon"}
          }
        },
        "layer": [
          {
            "mark": {"opacity": 1., "type": "line", "color": "steelblue"},
            "encoding": {
              "y": {
                "field": "dN/dS LB",
                "scale" : {"type" : "sqrt"},
                "type" : "quantitative",
                "axis": {"titleColor": "black", "grid" : false, "titleFontSize" : 14, "title" : "dN/dS"}
              },
              "y2": {
                "field": "dN/dS UB",
                "type" : "quantitative"
              }
            }
          },
          {
            "mark": {"stroke": "black", "type": "point", "filled" : true, "size" : 64, "stroke" : null, "tooltip" : {"contents" : "data"}},
            "encoding": {
              "y": {
                 "field": "dN/dS MLE",
                  "type" : "quantitative",
              },
              "color" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
            }
          },
          /*{
            "mark": {"stroke": "lightgrey", "type": "line", "size" : 1, "opacity" : 1.},
            "encoding": {
              "y": {
                 "field": "dN/dS MLE",
                  "type" : "quantitative",
              },
            }
          }*/
          {
            "mark" : {"opacity": 0.5, "type": "line", "color": "gray"},
            "encoding" : { "y": {
                "field": "neutral",
                "type" : "quantitative",
              },
               
              "x": {
              "field": "codon",
              "type" : "nominal"},
              "size": {"value": 2},
            }
          }
          
        ]
    };
  }
  
  /**
   * Create a Vega-Lite specification for a plot of rate estimates
   * @param {array} data - an array of objects, each with the following properties:
   *   - `codon` - a string representing the codon number
   *   - `alpha` - the maximum likelihood estimate of the alpha rate
   *   - `beta` - the maximum likelihood estimate of the beta rate
   *   - `alpha=beta` - the alpha=beta rate
   *   - `class` - a string indicating the selection class (one of "Diversifying", "Neutral", "Purifying")
   * @param {number} from - the first codon number to include in the plot
   * @param {number} step - the number of codons to include in the plot
   * @param {array} yrange - the range of the y-axis
   * @returns {object} - a Vega-Lite specification for the plot
   */
  export function alpha_beta_plot(data, from, step, yrange) {
    let color_d = [];
    let color_r = [];
    _.each (COLORS, (v,c)=> {color_d.push (c); color_r.push (v);});
    return {
        "width": {"step": 12},
        "data" : {"values" : _.map (
          _.filter (data, (d,i)=>i+1 >= from && i< from + step-1),
        (d)=> {
            let dd = _.clone (d);
            _.each (["alpha","beta", "alpha=beta"], (f)=> {
              dd[f] = Math.min (DYN_RANGE_CAP, dd[f]);
            });
            dd.alpha = -dd.alpha;
            return dd;
        })}, 
        "transform" :[{"calculate": "0", "as": "neutral"},
                      {"calculate": '-datum["alpha=beta"]', "as": "amb2"}],
        "encoding": {
          "x": {
            "field": "codon",
            "type" : "nominal",
            "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Codon"}
          },
          "y": {
            "scale": {"domain": yrange}
          }
        },
        "layer": [
          {
            "mark" : {"opacity": 0.5, "type": "line", "color": "gray"},
            "encoding" : { "y": {
                "field": "neutral",
                "type" : "quantitative",
              },
               
              "x": {
              "field": "codon",
              "type" : "nominal"},
              "size": {"value": 2},
            }
          },
          {
            "mark": {"type": "bar", "filled" : true, "stroke" : null, "opacity" : 0.5, "tooltip" : {"contents" : "data"}},
            "encoding": {
              "y": {
                 "field": "alpha",
                  "type" : "quantitative",
                  "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Rate estimate", "labelExpr": "datum.label > 0 ? 'β = ' + datum.label: (toNumber(datum.label) == '0' ? '0' : 'α = ' + replace (datum.label, /[^0-9\.]/,''))"}
              },
              "fill" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
            }
          },
          {
            "mark": { "type": "bar", "filled" : true, "opacity" : 0.5, "stroke" : null, "tooltip" : {"contents" : "data"}},
            "encoding": {
              "y": {
                 "field": "beta",
                  "type" : "quantitative",
              },
              "fill" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
            }
          },
          {
            "mark": {"opacity": 1., "type": "line", "color": "#444"},
            "encoding": {
              "y": {
                "field": "alpha=beta",
                "type" : "quantitative"
              },
              "y2": {
                "field": "amb2",
                "type" : "quantitative"
              }
            }
          }
          
        ]
    };
  }
  
  export function denser_plot(data) {
    let columns = [["alpha","α"],["beta","β"],["p-value", "p-value"]];
    return {
        "data" : {"values" : _.map (data,
        (d)=> {
            let dd = _.clone (d);
            _.each (columns, (f)=> {
              dd[f[0]] = Math.min (DYN_RANGE_CAP, dd[f[0]]);
            });
            return dd;
        })}, 
        
        "vconcat" : _.map (columns, (cc,i)=> ({
          "width" : 800,
          "height" : 50,
          "mark": {"type": "area", "color" : "lightblue", "stroke" : "black", "interpolate" : "step"},
          "encoding": {
            "x": {
              "field": "codon",
              "type" : "quantitative",
              "axis": {"grid" : false, "titleFontSize" : 14, "title" : i == columns.length -1 ? "Codon" : null}
            },
            "y": {
                   "field": cc[0],
                    "type" : "quantitative",
                    "axis": {"grid" : false, "titleFontSize" : 14, "title" : cc[1]}
                }
          }}))
    };
  }

  function qq(v) {
    let vs = _.map (_.sortBy (v), (v)=> v <0 ? 0. : v);
    let qq = [{'bs' : 0, 'c2' : 0}];

    _.each (vs, (v, i)=> {
        qq.push ({'bs' : (i+1)/vs.length, 'c2' : ss.cdf (v, 1)});
    });
    qq.push ([{'bs' : 1, 'c2' : 1}]);
    
    return _.map (qq, (d)=>({'bs' : 1-d.bs, 'c2' : 1-d.c2}));
}

function get_alpha_beta_yrange(fig1data) {
  let min = _.chain (fig1data).map ("alpha").max ().value ();
  let max = _.chain (fig1data).map ("beta").max ().value ();

  // check if fig1data.alpha=beta exceeds either value
  const maxAB = _.chain (fig1data).map ("alpha=beta").max ().value ();
  if (maxAB > max) max = maxAB;
  if (maxAB > min) min = maxAB;

  // cap min and max at DYN_RANGE_CAP
  if (min > DYN_RANGE_CAP) min = DYN_RANGE_CAP;
  if (max > DYN_RANGE_CAP) max = DYN_RANGE_CAP;

  // add some buffer
  min = min * 1.1;
  max = max * 1.1;

  // alpha is negative
  min = min * -1;

  return [min, max];
}

export function get_plot_spec(plot_type, fig1data, pvalue_threshold, has_pasmt) {
  const plotSpecs = {
    "Site-level dN/dS estimates" : {
      "width": 800, "height": 200, 
      "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
        return dNdS_with_ci (fig1data, d, 70)
      })},
    "alpha/beta site-level estimates" : {
      "width": 800, "height": 200, 
      "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
        return alpha_beta_plot (fig1data, d, 70, get_alpha_beta_yrange (fig1data))
      })},
    "Bootstrap vs asymptotic p-value": pv_plot (fig1data, pvalue_threshold),
    "Rate density plots" : rate_density (fig1data),
    "Dense rate plot" : denser_plot(fig1data),
    "Q-Q plots" : has_pasmt ? {
      "columns": 5,
      "hconcat": _.map (_.map (_.filter (table1, (d)=>d.class != "Invariable").slice (0,60), (d)=>[d.partition, d.codon]), (d)=>qq_plot (qq(_.map (results_json.MLE.LRT[d[0]-1][d[1]-1], (d)=>(d[0]))), "Site "+d[1]))
    } : null
  }

  return plotSpecs[plot_type];
}