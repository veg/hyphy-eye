import * as _ from "lodash-es";
import * as colors from "../color-maps/custom.js";
import * as qq from "../components/qq-plot.js";
import * as rateDist from "../components/rate-summary-plots/rate-densities.js";
import * as rates from "../components/rate-summary-plots/rate-bars.js";
import * as d3 from "d3";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as utils from "./fel-utils.js";

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
 * @param {boolean} hasPasmt - whether the data object has pasmt results
 * @returns {Array.<Array.<string|function>>} The array of arrays described above
 */
export function getFelPlotOptions(hasPasmt) {
  const options = [
    ["Site-level dN/dS estimates",(d)=>d["confidence interval"]],
    ["alpha/beta site-level estimates", (d)=>1], 
    ["Bootstrap vs asymptotic p-value", (d)=>hasPasmt], 
    ["Rate density plots", (d)=>1], 
    ["Q-Q plots", (d)=>hasPasmt], 
    ["Dense rate plot", (d)=>1]
  ];

  return options;
}

/**
 * Returns a human-readable description of the plot identified by the
 * specified string. The description is a string that can be used as a
 * tooltip for the plot.
 *
 * @param {string} plotType - the type of plot to describe
 * @param {number} pvalueThreshold - the threshold for significance
 * @returns {string} the description of the plot
 */
export function getFelPlotDescription(plotType, pvalueThreshold) {
  const descriptions = {
    "Site-level dN/dS estimates" : "Maximum likelihood estimates of dN/dS at each site, together with estimated profile condifence intervals (if available). dN/dS = 1 (neutrality) is depicted as a horizontal gray line. Boundaries between partitions (if present) are shown as vertibal dashed lines.",
    "alpha/beta site-level estimates": "Maximum likelihood estimates of synonymous (α) and non-synonymous rates (β) at each site shown as bars. The line shows the estimates under the null model (α=β). Estimates above " + DYN_RANGE_CAP +" are censored at this value.",
    "Dense rate plot" : "Maximum likelihood estimates of synonymous (α) and non-synonymous rates (β) at each site. Estimates above " + DYN_RANGE_CAP +" are censored at this value. p-values are also shown",
    "Bootstrap vs asymptotic p-value" : "Comparison of site-level p-values for non-neutrality using parametric bootstrap and the asymptotic approximation. Rejection region (p ≤ " + pvalueThreshold + ") is shown as a shaded rectangle",
    "Rate density plots" : "Kernel density estimates of site-level rate estimates. Means are shown with red rules. Estimates above " + DYN_RANGE_CAP +" are censored at this value.",
    "Q-Q plots" : "Comparison of asymptotic vs boostrap LRT distributions (limited to 60 sites)."
  };

  return descriptions[plotType];
}

export function getFelPvPlot(data, pvalueThreshold) {
    let colorD = [];
    let colorR = [];
    _.each (COLORS, (v,c)=> {colorD.push (c); colorR.push (v);});
    
    return {
        "width": 500, "height": 500, 
        "data" : {"values" : data},
        "transform" : [{"calculate" : "(datum['p-value'] -" + pvalueThreshold + ")* (datum['p-asmp'] -" + pvalueThreshold + ") >= 0 ? 'Yes' : 'No'", "as": "agree"}],
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
                "x2": {"datum": {"expr": pvalueThreshold}},
                "y2": {"datum": {"expr": pvalueThreshold}}
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
              "color" : {"field" : "class", "scale" : {"domain" : colorD, "range" : colorR}, "title" : "Selection class"},
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
  export function getFelDnDsPlot(data, from, step) {
    let colorD = [];
    let colorR = [];
    _.each (COLORS, (v,c)=> {colorD.push (c); colorR.push (v);});
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
              "color" : {"field" : "class", "scale" : {"domain" : colorD, "range" : colorR}, "title" : "Selection class"}
            }
          },
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
  export function getFelAlphaBetaPlot(data, from, step, yrange) {
    let colorD = [];
    let colorR = [];
    _.each (COLORS, (v,c)=> {colorD.push (c); colorR.push (v);});
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
              "fill" : {"field" : "class", "scale" : {"domain" : colorD, "range" : colorR}, "title" : "Selection class"}
            }
          },
          {
            "mark": { "type": "bar", "filled" : true, "opacity" : 0.5, "stroke" : null, "tooltip" : {"contents" : "data"}},
            "encoding": {
              "y": {
                 "field": "beta",
                  "type" : "quantitative",
              },
              "fill" : {"field" : "class", "scale" : {"domain" : colorD, "range" : colorR}, "title" : "Selection class"}
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

/**
 * Generator function for FEL Alpha/Beta plots that follows the standard pattern
 * of taking resultsJson, method, threshold, and opts parameters
 * 
 * @param {Object} resultsJson - The results JSON object from a HyPhy analysis
 * @param {string} method - The method name (should be "FEL")
 * @param {Object} options - Additional options for the visualization
 * @returns {Object} A Vega-Lite specification for the chart
 */
export function FelAlphaBetaPlotGenerator(resultsJson, method, options = {}) {
    // Verify this is being called with the FEL method
    if (method !== "FEL") {
        console.warn(`FelAlphaBetaPlotGenerator called with method ${method}, expected "FEL"`); 
    }
    
    // Get site data from the FEL-specific function
    const threshold = options.threshold || 10;
    const siteRes = utils.getFelSiteTableData(resultsJson, threshold);
    const data = siteRes[0]; // First element contains the site data
    
    // Calculate the y-range for the plot
    const yrange = getFelAlphaBetaYrange(data);
    
    // Extract options or use defaults
    const step = options.step || 70;
    
    // Create a concatenated plot for all sites
    return {
      "width": 800, 
      "height": 200,
      "vconcat": _.map(_.range(1, data.length + 1, step), (d) => {
        return getFelAlphaBetaPlot(data, d, step, yrange);
      })
    };
}

export function getFelAlphaBetaYrange(fig1data) {
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

/**
 * Renders a phylogenetic tree for FEL analysis
 * 
 * @param {Object} resultsJson - The results JSON object
 * @param {number} i - The tree index
 * @param {string} treeDim - Tree dimensions in format "height x width"
 * @param {Array} treeObjects - Array of tree objects
 * @returns {Object} The rendered tree object
 */
export function getFelTree(resultsJson, i, treeDim, treeObjects) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Configure the tree using the helper
    const t = phylotreeUtils.configureTree(treeObjects[i], treeDim, {
        height: dim && dim[0] || 1024,
        width: dim && dim[1] || 600,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        configureBranches: (rawTree, renderedTree) => {
            const configureBranchColors = phylotreeUtils.getConfigureBranchesFn(resultsJson, {
                color_branches: "Tested",
                branch_length: "Branch Length",
                index: i,
                use_site_specific_support: false,
                use_turbo_color: false
            }, null);
            configureBranchColors(rawTree, renderedTree);
        },
        configureNodeDisplay: (rawTree, renderedTree) => {
            const configureNodeDisplay = phylotreeUtils.getConfigureNodesFn(resultsJson.tested[i], null, {
                showAA: false,
                showCodons: false,
                showSeqNames: true,
                showOnlyMH: false,
                showOnlyNS: false,
                alignTips: false
            });
            configureNodeDisplay(rawTree, renderedTree);
        }
    });
    
    return t;
}

export function getFelPlotSpec(plotType, fig1data, pvalueThreshold, hasPasmt) {
  const plotSpecs = {
    "Site-level dN/dS estimates" : {
      "width": 800, "height": 200, 
      "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
        return getFelDnDsPlot (fig1data, d, 70)
      })},
    "alpha/beta site-level estimates" : {
      "width": 800, "height": 200, 
      "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
        return getFelAlphaBetaPlot (fig1data, d, 70, getFelAlphaBetaYrange (fig1data))
      })},
    "Bootstrap vs asymptotic p-value": getFelPvPlot (fig1data, pvalueThreshold),
    "Rate density plots" : 
      rateDist.RateDensities(
        fig1data, 
        [{data_key: "alpha", display_label: "α"},{data_key: "beta", display_label: "β"}],
        true,
        DYN_RANGE_CAP,
        0.2
      ),
    "Dense rate plot" : rates.RateBarPlots(
      fig1data,
      [
        {data_key: "alpha", display_label: "α"},
        {data_key: "beta", display_label: "β"},
        {data_key: "p-value", display_label: "p-value"}
      ],
      "linear",
      DYN_RANGE_CAP
    ),
    "Q-Q plots" : hasPasmt ? {
      "columns": 5,
      "hconcat": _.map (_.map (_.filter (table1, (d)=>d.class != "Invariable").slice (0,60), (d)=>[d.partition, d.codon]), (d)=>qq.QQPlot(_.map(resultsJson.MLE.LRT[d[0]-1][d[1]-1], (d)=>(d[0])), "Site "+d[1]))
    } : null
  }

  return plotSpecs[plotType];
}