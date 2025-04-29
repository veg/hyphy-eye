import * as d3 from "d3";
import * as _ from "lodash-es";
import * as plotUtils from "../utils/plot-utils.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as beads from "../components/bead-plot.js";
import * as heat from "../components/posteriors-heatmap.js";
import * as qq from "../components/qq-plot.js";
import * as rateDist from "../components/rate-summary-plots/rate-densities.js";
import * as rates from "../components/rate-summary-plots/rate-bars.js";
import * as utils from "./meme-utils.js";

export const MEME_TABLE_COLORS = ({
    'Diversifying' : '#e3243b',
    'Neutral' : '#444',
    'Invariable' : '#CCC'
})
const label_color_scale = d3.scaleOrdinal([], d3.schemeCategory10);
const DYN_RANGE_CAP = 10000;
const OMEGA_RATE_CLASSES = 2;

export function getMemePlotOptions(has_site_LRT, has_resamples, bsPositiveSelection) {
    const plot_options = [
        ["p-values for selection", (d)=>true],
        ["p-values for variability", (d)=>has_site_LRT], 
        ["Site rates", (d)=>true], 
        ["Support for positive selection", (d)=>bsPositiveSelection.length > 0],
        ["Dense rate plot", (d)=>1], 
        ["Rate density plots", (d)=>1],
        ["Q-Q plots", (d)=>has_resamples]
    ];

    return plot_options;
}

export function getMemePlotDescription(plot_type, has_resamples) {
    const plot_legends = ({
        "p-values for selection" : "P-values derived from the " + (has_resamples ? "parametric bootstrap" : "asymptotic mixture &Chi;<sup>2</sup> ")  + " test statistic for likelihood ratio tests for episodic diversifying selection. Solid line = user selected significance threshold.",
        "p-values for variability" : "P-values derived from the asymptotic mixture &Chi;<sup>2</sup><sub>2</sub> test statistic for likelihood ratio tests for variable &omega; at this site. Solid line = user selected significance threshold.",
        "Site rates" : "Site-level rate maximum likelihood estimates (MLE). For each site, the horizontal tick depicts the synonymous rate (α) MLE. Circles show non-synonymous (β- and β+) MLEs, and the size of a circle reflects the weight parameter inferred for the corresponding rate. The non-synonymous rate estimates are connected by a vertical line to enhance readability and show the range of inferred non-synonymous rates and their relationship to the synonymous rate. Estimates above " + DYN_RANGE_CAP +" are censored at this value.",
        "Dense rate plot" : "Maximum likelihood estimates of synonymous (α), non-synonymous rates (β-, β+), and non-synonymous weights (p-,p+) at each site. Estimates above " + DYN_RANGE_CAP +" are censored at this value. p-values for episodic diversifying selection are also shown",
        "Rate density plots" : "Kernel density estimates of site-level rate estimates. Means are shown with red rules. Estimates above " + DYN_RANGE_CAP +" are censored at this value.",
        "Support for positive selection": "Empirical Bayes Factors for ω>1 at a particular branch and site (only tested branches are included).",
        "Q-Q plots" : "Comparison of asymptotic vs boostrap LRT distributions (limited to 60 sites)."
    });

    return plot_legends[plot_type];
}

export function getMemeTreeColorOptions(results_json) {
  let options = ["Tested"];
  if (results_json.substitutions) {
    options.push ("Support for selection");
    options.push ("Substitutions");
  }
  return options;
}

export function getMemePlotSpec(
    results_json, 
    plot_type, 
    bsPositiveSelection, 
    fig1data, 
    siteTableData, 
    has_site_LRT, 
    has_resamples, 
    pvalue_threshold,
    tree_objects
) {
    const step_size = plotUtils.er_step_size(results_json)
    const branch_order = phylotreeUtils.treeNodeOrdering(tree_objects[0], results_json.tested[0], false, false);

    const plot_specs = ({
        "p-values for selection" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return beads.BeadPlot(
                  fig1data, 
                  d, 
                  70, 
                  "p-value", 
                  false,
                  DYN_RANGE_CAP, 
                  "log", 
                  pvalue_threshold,
                  null,
                  null,
                  null,
                  'black',
                  true)
            })
        },
        "p-values for variability" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return beads.BeadPlot(
                  fig1data, 
                  d, 
                  70, 
                  has_site_LRT ? siteTableData[2][11][2] : [], 
                  "p-value for variability", 
                  true, 
                  "log", 
                  pvalue_threshold,
                  null,
                  null,
                  null,
                  'black',
                  true)
            })
        },
        "Site rates" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return getMemeAlphaBetaPlot (fig1data, d, 70)
            })
        },
        "Rate density plots" : rateDist.RateDensities(
          fig1data,
          [{data_key:"&alpha;",display_label:"α"},
            {data_key:"&beta;<sup>1</sup>",display_label:"β-"},
            {data_key:"&beta;<sup>+</sup>",display_label:"β+"}],
          false,
          DYN_RANGE_CAP,
          0,
          true
        ),
        "Dense rate plot" : rates.RateBarPlots(
          fig1data,
          [
            {data_key:"&alpha;",display_label:"α"},
            {data_key:"&beta;<sup>1</sup>",display_label:"β-"},
            {data_key:"p<sup>1</sup>",display_label:"p-"},
            {data_key:"&beta;<sup>+</sup>",display_label:"β+"},
            {data_key:"p<sup>+</sup>",display_label:"p+"},
            {data_key:"p-value",display_label:"p-value"}
          ],
          "symlog",
          DYN_RANGE_CAP
        ),
        "Support for positive selection" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return heat.PosteriorsHeatmap(
                  bsPositiveSelection, 
                  d, 
                  step_size,
                  branch_order,
                  null,
                  "ER",
                  "redblue"
                )
            })
        },
        "Q-Q plots" : has_resamples ? {
            "columns": 6,
            "hconcat": 
                _.map (
                    _.map (_.filter (table1, (d)=>d.class != "Invariable").slice (0,60), (d)=>[d.Partition, d.Codon]), 
                    (d)=>qq.QQPlot(_.map(results_json.MLE.LRT[d[0]-1][d[1]-1], (d)=>(d[0])), "Site "+d[1])
                )
            }
        : null
    })

    return plot_specs[plot_type];
}

export function getMemeAlphaBetaPlot(data, from, step) {
  let color_d = [];
  let color_r = [];
  _.each (MEME_TABLE_COLORS, (v,c)=> {color_d.push (c); color_r.push (v);});
  return {
      "width": {"step": 12},
      "data" : {"values" : _.map (
        _.filter (data, (d,i)=>i >= from -1 && i< from + step -1), 
      (d)=> {
          let dd = _.clone (d);
          _.each (["&alpha;","&beta;<sup>1</sup>", "&beta;<sup>+</sup>"], (f)=> {
            dd[f] = Math.min (DYN_RANGE_CAP, dd[f]);
          });
          return dd;
      })}, 
      "transform" :[{"calculate": 'max (1,-datum["p-"]*100)', "as": "w-"},
                    {"calculate": 'max (1,-datum["p+"]*100)', "as": "w+"}],
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "nominal",
          "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Codon"}
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
            "field": "Codon",
            "type" : "nominal"},
            "size": {"value": 2},
          }
        },
        {
          "mark": {"type": "tick", "filled" : true, "tooltip" : true, thickness : 4, "fill" : "black"},
          "encoding": {
            "y": {
               "field": "&alpha;",
                "type" : "quantitative",
                "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Rate MLE"},
                "scale" : {"type" : "symlog"}
            },
          }
        },
        {
          "mark": {"type": "point", "filled" : true,  "tooltip" : true},
          "encoding": {
            "y": {
               "field": "&beta;<sup>1</sup>",
                "type" : "quantitative",
                "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Rate MLE"},
                "scale" : {"type" : "symlog"},
              
            },
            "size" : {"field" : "p<sup>1</sup>","type" : "quantitative", "title" : "weight"},
            "fill" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
          }
        },
        {
          "mark": {"type": "point", "filled" : true,  "tooltip" : true},
          "encoding": {
            "y": {
               "field": "&beta;<sup>+</sup>",
                "type" : "quantitative",
              
            },
            "size" : {"field" : "p<sup>+</sup>","type" : "quantitative"},
            "fill" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
          }
        },
        {
          "mark": {"type": "rule", "tooltip" : true},
          "encoding": {
            "y": {
               "field": "&beta;<sup>1</sup>",
                "type" : "quantitative",
              
            },
            "y2": {
               "field": "&beta;<sup>+</sup>",
               "type" : "quantitative",
              
            },
          }
        }
        
        
      ]
  };
}

export function getMemeTree(results_json, i, treeDim, treeLabels, branch_length, color_branches, tree_objects) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Configure the tree using the helper
    const t = phylotreeUtils.configureTree(tree_objects[i], treeDim, {
        height: dim && dim[0],
        width: dim && dim[1],
        'align-tips': treeLabels.indexOf("show internal") >= 0,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        'internal-names': treeLabels.indexOf("show internal") >= 0,
        configureBranches: (rawTree, renderedTree) => {
            const configureBranchColors = phylotreeUtils.getConfigureBranchesFn(results_json, {
                color_branches: color_branches,
                branch_length: branch_length,
                index: i,
                use_site_specific_support: false,
                use_turbo_color: false
            }, null);
            configureBranchColors(rawTree, renderedTree);
        },
        configureNodeDisplay: (rawTree, renderedTree) => {
            const configureNodeDisplay = phylotreeUtils.getConfigureNodesFn(results_json.tested[i], node_labels, {
                showAA: treeLabels.indexOf("amino-acids") >= 0,
                showCodons: treeLabels.indexOf("codons") >= 0,
                showSeqNames: treeLabels.indexOf("sequence names") >= 0,
                showOnlyMH: treeLabels.indexOf("show only multiple hits") >= 0,
                showOnlyNS: treeLabels.indexOf("show only non-synonymous changes") >= 0,
                alignTips: treeLabels.indexOf("align tips") >= 0
            });
            configureNodeDisplay(rawTree, renderedTree);
        }
    });
    
    return t;
}

export function getMemeTreeSite(results_json, i, s, treeDim, treeLabels, branch_length, color_branches, shade_branches, tree_objects, treeViewOptions) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    let node_labels = phylotreeUtils.generateNodeLabels(tree_objects[i], results_json["substitutions"][i][s-1]);

    let alignTips = treeViewOptions.alignTips || false;

    const t = phylotreeUtils.configureTree(tree_objects[i], treeDim, {
        height: dim && dim[0],
        width: dim && dim[1],
        'align-tips': alignTips,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        configureBranches: (rawTree, renderedTree) => {
            phylotreeUtils.getConfigureBranchesFn(results_json, {
                color_branches: color_branches,
                branch_length: branch_length,
                index: i,
                s: s,
                use_site_specific_support: true,
                use_turbo_color: false
            }, treeViewOptions)(rawTree, renderedTree);
        },
        configureNodeDisplay: (rawTree, renderedTree) => {
            phylotreeUtils.getConfigureNodesFn(results_json.tested[i], node_labels, {
                showAA: treeLabels.indexOf("amino-acids") >= 0,
                showCodons: treeLabels.indexOf("codons") >= 0,
                showSeqNames: treeLabels.indexOf("sequence names") >= 0,
                showOnlyMH: treeLabels.indexOf("show only multiple hits") >= 0,
                showOnlyNS: treeLabels.indexOf("show only non-synonymous changes") >= 0,
                alignTips: alignTips
            })(rawTree, renderedTree);
        }
    });
    
    return t;
}

// Generator for MEME alpha/beta site-level plots
export function MemeAlphaBetaPlotGenerator(resultsJson, method, threshold, opts = {}) {
  if (method !== "MEME") console.warn(`MemeAlphaBetaPlotGenerator called with method ${method}, expected "MEME"`);
  const siteRes = utils.getMemeSiteTableData(resultsJson, threshold);
  const data = siteRes[0];
  const step = opts.step || 70;
  return {
    width: 800,
    height: 200,
    vconcat: _.map(_.range(1, data.length + 1, step), d => getMemeAlphaBetaPlot(data, d, step))
  };
}
