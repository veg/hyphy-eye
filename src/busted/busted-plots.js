import * as utils from "./busted-utils.js"
import * as plotUtils from "../utils/plot-utils.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js"
import * as beads from "../components/bead-plot.js";
import * as heat from "../components/posteriors-heatmap.js";
import * as _ from "lodash-es";
import * as d3 from "d3";

export const BUSTED_TABLE_COLORS = ({
    'Diversifying' : '#e3243b',
    'Neutral' : '#444',
    'Purifying' : 'green',
    'Invariable' : '#CCC'
})

const DYN_RANGE_CAP = 10000;
const LABEL_COLOR_SCALE = d3.scaleOrdinal([], d3.schemeCategory10)
    
export function getBustedPlotDescription(plot_type, srv_hmm) {
    const plot_descriptions = ({
        "Evidence ratio for ω>1 (constrained)" : "Evidence ratios (site level likelihood ratios) for ω>1, comparing the unrestricted model with the model where max(ω) := 1, and all other parameters are kept at their maximum likelihood values. Solid line = user selected significance threshold. <small>Values capped at " + DYN_RANGE_CAP + " for readability</small>",
        "Evidence ratio for ω>1 (optimized)" : "Evidence ratios (site level likelihood ratios) for ω>1, comparing the unrestricted model with the optimized constrained model and all other parameters are kept at their maximum likelihood values. Solid line = user selected significance threshold. <small>Values capped at " + DYN_RANGE_CAP + " for readability</small>",
        "Synonymous rates" : "Posterior means for synonymous site-level substitution rates (α). " + (srv_hmm ? "The most likely synonymous rate value, based on the Viterbi HMM path inference, is shown in dark red." : "") + "Dots are colored by the evidence ratio (constrained) in favor of positive selection acting on the corresponding site",
        "Support for positive selection" : "Empirical Bayes Factors for ω>1 at a particular branch and site (only tested branches are included).",
        "Error-sink support" : "Empirical Bayes Factors for branch/codon combinations placed in the error-sink category (only tested branches are included).",
        "Support for 2H" : "Evidence ratios for having a non-zero 2-nucleotide substitution rate (δ), comparing the unrestricted model with the model where this rate is 0 at a particular branch/site, and all other parameters are kept at their maximum likelihood values. Values less than one are **not** reported.",
        "Support for 3H" : "Evidence ratios for having a non-zero 3-nucleotide substitution rate (ψ), comparing the unrestricted model with the model where this rate is 0 at a particular branch/site, and all other parameters are kept at their maximum likelihood values. Values less than one are **not** reported.",
        "Support for 2H+3H" : "Evidence ratios for having non-zero 2 or 3-nucleotide substitution rate (δ or ψ), comparing the unrestricted model with the model where these rates are both 0 at a particular branch/site, and all other parameters are kept at their maximum likelihood values. Values less than one are **not** reported.",
        "Site-level LR support" : "Cumulative distribution of the likelihood ratio test for the BUSTED test broken down by the contributions of individual sites"
    })

    return plot_descriptions[plot_type];
}

export function getBustedPlotOptions(results_json, bsPositiveSelection) {
    const attrs = utils.getBustedAttributes(results_json);

    const plot_options = [
        ["Evidence ratio for ω>1 (constrained)", (d)=>results_json["Evidence Ratios"]["constrained"]], 
        ["Evidence ratio for ω>1 (optimized)", (d)=>results_json["Evidence Ratios"]["optimized null"]], 
        ["Synonymous rates", (d)=>attrs.srv_rate_classes > 0], 
        ["Support for positive selection", (d)=>bsPositiveSelection.length > 0], 
        ["Error-sink support", (d)=>attrs.has_error_sink_nt && utils.getBustedErrorSinkRate(results_json, "Test")["proportion"] > 0], 
        ["Site-level LR support", (d)=>results_json["Evidence Ratios"]["optimized null"]], 
        ["Support for 2H", (d)=>attrs.mhRates['DH']], 
        ["Support for 3H", (d)=>attrs.mhRates['TH']], 
        ["Support for 2H+3H", (d)=>attrs.mhRates['DH'] && attrs.mhRates['TH']]
    ]

    return plot_options
}

export function getBustedPlotSpec(
    plot_type, 
    results_json, 
    fig1data, 
    bsPositiveSelection, 
    bsErrorSink, 
    ev_threshold, 
    srv_hmm, 
    tree_objects, 
    tested_branch_count, 
    fig1_controls
) {
    const twoHBranchSite = mutliHitER(results_json, "Evidence ratio for 2H")
    const threeHBranchSite = mutliHitER(results_json, "Evidence ratio for 3H")
    const multiHBranchSite = mutliHitER(results_json, "Evidence ratio for 2H+3H")
    const step_size = plotUtils.er_step_size(results_json)
    const branch_order = phylotreeUtils.treeNodeOrdering(tree_objects[0], results_json.tested[0], false, false);
    let size_field = "subs";
    // TODO: can we update the input to handle this?
    switch (fig1_controls) {
      case "Syn subs":
        size_field = "syn_subs";
        break;
      case "Nonsyn subs":
        size_field = "nonsyn_subs";
        break;
      case "None":
        size_field = null;
        break;
    }
console.log("bsPositiveSelection", bsPositiveSelection)
    const plot_specs = ({
        "Evidence ratio for ω>1 (constrained)" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return beads.BeadPlot(
                  fig1data, 
                  d, 
                  70, 
                  "ER (constrained)", 
                  false,
                  DYN_RANGE_CAP,
                  null,
                  ev_threshold
                )
            })
        },
        "Evidence ratio for ω>1 (optimized)" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return beads.BeadPlot(
                  fig1data, 
                  d, 
                  70, 
                  "ER (optimized null)", 
                  false,
                  DYN_RANGE_CAP,
                  null,
                  ev_threshold
                )
            })
        },
        "Synonymous rates" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return beads.BeadPlot (
                  fig1data, 
                  d, 
                  70, 
                  "SRV posterior mean", 
                  false,
                  DYN_RANGE_CAP,
                  null,
                  null,
                  srv_hmm ? "SRV viterbi" : null, 
                  results_json["Evidence Ratios"]["constrained"], 
                  "ER (constrained)"
                )
            })
        },
        "Support for positive selection" : {
            "resolve": {"scale": {"color": "shared"}},
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return heat.PosteriorsHeatmap(
                  bsPositiveSelection, 
                  d, 
                  step_size, 
                  branch_order,
                  size_field)
            })
        },
        "Error-sink support" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return heat.PosteriorsHeatmap(
                  bsErrorSink, 
                  d, 
                  step_size, 
                  branch_order,
                  size_field)
            })
        },
        "Support for 2H" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return heat.PosteriorsHeatmap(
                  twoHBranchSite, 
                  d, 
                  step_size, 
                  branch_order,
                  size_field)
            })
        },
        "Support for 3H" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return heat.PosteriorsHeatmap(
                  threeHBranchSite, 
                  d, 
                  step_size, 
                  branch_order,
                  size_field)
            })
        },
        "Support for 2H+3H" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return heat.PosteriorsHeatmap(
                  multiHBranchSite, 
                  d, 
                  step_size, 
                  branch_order,
                  size_field)
            })
        },
        "Site-level LR support" : cdsQuant (fig1data, "LR", "Site LR")
    })

    return plot_specs[plot_type];
}


export function countBranchesER(results_json, test_omega,  er) {
    const attrs = utils.getBustedAttributes(results_json);

    let prior = test_omega[attrs.omega_rate_classes-1].weight / (1-test_omega[attrs.omega_rate_classes-1].weight);
    let count = [];
    _.each (results_json["branch attributes"], (part_info, part)=> {
        _.each (part_info, (data, branch)=> {
            if (data["Posterior prob omega class"]) {
                let post =  data["Posterior prob omega class"][attrs.omega_rate_classes-1];
                post = post / (1-post);
                if (post / prior >= er) {
                    count.push ([part, branch, post/prior]);
                }
            }
        });
    });
     return count;
}

export function codonComposition(results_json, tree_objects, filter, diff_mode) {
  let results = [];
  let offset = 0;
  _.each (results_json["substitutions"], (data, partition) => {
      _.each (data, (per_site, site)=> {
            if (filter && ! filter (site, partition)) return;
            let info = phylotreeUtils.generateNodeLabels (tree_objects[partition], per_site);
            
            if (diff_mode == false) {
                 _.each (info, (p,i)=> {
                    if (!p[4]) {
                      results.push ({'Key' : i + "|" + ((+site) + offset + 1), 'value' : p[0], 'aa' : p[1]});
                      //results.push ({'seq' : i,  "site" : ((+site) + offset + 1), 'value' : p[0], 'aa' : p[1]});
                    }
                 });
             } else {
               const root_label = info['root'][0];
               _.each (info, (p,i)=> {
                    let codon_label = _.map (p[0], (c,i)=>c == root_label[i] ? '.' : c).join ("");
                    if (i == 'root') codon_label = p[0];
                    if (!p[4]) {
                        results.push ({'Key' : i + "|" + ((+site) + offset + 1), 'value' : codon_label, 'aa' : p[1]});
                        // results.push ({'seq' : i,  "site" : ((+site) + offset + 1), 'value' : codon_label, 'aa' : p[1]});
                    }
               });
             }
            
      });
    
      offset += _.size (data);
  });
  return results;
}


export function mutliHitER(results_json, key) {
  let results = [];
  let offset = 0;
  _.each (results_json["branch attributes"], (data, partition) => {
      let partition_size = 0;
      _.each (data, (per_branch, branch)=> {
          if (key in per_branch) {
            _.each (per_branch [key], (p,i)=> {
                results.push ({'Key' : branch + "|" + p[0] + offset, 'ER' : p[1]});
            });     
            partition_size = results_json["data partitions"][partition]["coverage"][0].length;
          }
      });
      offset += partition_size;
  });
  return results;
}

function cdsQuant(data, key1, title) {
  
  return {
      "config": {
          "mark": {"invalid": null}
      },
      "vconcat" : [
        {
          "width" : 400, "height" : 200,
          "data" : {"values" : data}, 
              "transform": [{
                "sort": [{"field": key1}],
                "window": [{"op": "sum", "field": key1, "as": "CC"}],
                "frame": [null, 0]
              }],
              "layer" : [{
                "mark": {"type" : "area", "opacity" : 0.5, "color" : "grey", "tooltip" : true, "interpolate" : "step"},
                "encoding": {
                  "x": {
                    "field": key1,
                    "type": "quantitative",
                    "axis" : {"title" :  null},
                  },
                  "y": {
                    "field": "CC",
                    "type": "quantitative",
                    "scale" : {"type" : "linear"},
                    "axis" : {"title" : "Cumulative LRT", titleFontSize : 14}
                  }
              }},
              {
                "mark": {"type" : "line", "opacity" : 1.0, "color" : "black",  "interpolate" : "step"},
                "encoding": {
                  "x": {
                    "field": key1,
                   // "sort" : "descending",
                    "type": "quantitative",
                  },
                  "y": {
                    "field": "CC",
                    "type": "quantitative",
                    "scale" : {"type" : "linear"},
                    //"title" : "Cumulative count"
                  },
              }}
      ]
  },
  {
      "width" : 400, "height" : 100,
      "data" : {"values" : data}, 
          
        "mark": {"type" : "bar", "color" : "#ccc", "stroke" : "black", "tooltip" : true},
        "encoding": {
          "x": {
            "field": key1,
            "bin": {"maxbins":200},
            "type": "quantitative",
            "axis" : {"title" :  title ? title : key1, titleFontSize : 14},
          },
          "y": {
            "aggregate": "count",
            "type": "quantitative",
            "scale" : {"type" : "sqrt"},
            "axis" : {"title" :  "Count", titleFontSize : 14},
            //"title" : "Cumulative count"
          }
      
    }
  }]}
}

export function displayTree(results_json, ev_threshold, index, T, options, treeDim, treeLabels, branch_length, color_branches, test_omega, has_error_sink) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Set the branch length accessor using the utility
    T.branch_length_accessor = phylotreeUtils.setBranchLengthAccessor(T, results_json, index, branch_length);
    
    // Configure the tree using the helper
    const t = phylotreeUtils.configureTree(T, treeDim, {
        height: dim && dim[0],
        width: dim && dim[1],
        'align-tips': options.styleOptions?.alignTips || false,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        'internal-names': options.styleOptions?.showInternalNames || false,
        configureBranches: (rawTree, renderedTree) => {
            phylotreeUtils.getConfigureBranchesFn(results_json, {
                color_branches: color_branches,
                branch_length: branch_length,
                index: index,
                has_error_sink: has_error_sink,
                use_error_sink: true,
                use_site_specific_support: false,
                use_turbo_color: true,
                test_omega: test_omega
            }, options)(rawTree, renderedTree);
        },
        configureNodeDisplay: (rawTree, renderedTree) => {
            phylotreeUtils.getConfigureNodesFn(results_json.tested[0], node_labels, {
                showAA: treeLabels.indexOf("amino-acids") >= 0,
                showCodons: treeLabels.indexOf("codons") >= 0,
                showSeqNames: treeLabels.indexOf("sequence names") >= 0,
                showOnlyMH: treeLabels.indexOf("show only multiple hits") >= 0,
                showOnlyNS: treeLabels.indexOf("show only non-synonymous changes") >= 0,
                alignTips: treeLabels.indexOf("align tips") >= 0
            })(rawTree, renderedTree);
        }
    });
    
    return t;
}

export function displayTreeSite(resultsJson, partitionId, T, codonIndex, treeOptions, treeDim, treeLabels, branchLength, colorBranches, partitionSizes, testOmega, hasErrorSink) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Set the branch length accessor using the utility
    T.branch_length_accessor = phylotreeUtils.setBranchLengthAccessor(T, resultsJson, partitionId, branchLength);
    
    let node_labels = phylotreeUtils.generateNodeLabels(T, resultsJson["substitutions"][partitionId][codonIndex - 1]);

    let showAA = treeLabels.indexOf("amino-acids") >= 0;
    let showCodons = treeLabels.indexOf("codons") >= 0;
    let showSeqNames = treeLabels.indexOf("sequence names") >= 0;
    let showOnlyMH = treeLabels.indexOf("show only multiple hits") >= 0;
    let showOnlyNS = treeLabels.indexOf("show only non-synonymous changes") >= 0;
    let alignTips = treeOptions.alignTips || false;

    const t = phylotreeUtils.configureTree(T, treeDim, {
        height: dim && dim[0],
        width: dim && dim[1],
        'align-tips': alignTips,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        configureBranches: (rawTree, renderedTree) => {
            phylotreeUtils.getConfigureBranchesFn(resultsJson, {
                color_branches: colorBranches,
                branch_length: branchLength,
                index: partitionId,
                s: codonIndex,
                has_error_sink: hasErrorSink,
                use_error_sink: true,
                use_site_specific_support: true,
                use_turbo_color: true,
                test_omega: testOmega
            }, treeOptions)(rawTree, renderedTree);
        },
        configureNodeDisplay: (rawTree, renderedTree) => {
            phylotreeUtils.getConfigureNodesFn(resultsJson.tested[0], node_labels, {
                showAA: showAA,
                showCodons: showCodons,
                showSeqNames: showSeqNames,
                showOnlyMH: showOnlyMH,
                showOnlyNS: showOnlyNS,
                alignTips: alignTips
            })(rawTree, renderedTree);
        }
    });
    
    return t;
}

export function treeColorOptions(results_json) {
    const attrs = utils.getBustedAttributes(results_json);

    let options = ["Tested"];
    if (results_json.substitutions) {
        options.push ("Support for selection");
        options.push ("Substitutions");
    }

    if (attrs.mhRates["DH"]) options.push ("Support for 2H");
    if (attrs.mhRates["TH"]) options.push ("Support for 3H");
    if (attrs.mhRates["DH"] && attrs.mhRates["TH"]) options.push ("Support for 2H+3H");
    if (attrs.has_error_sink) options.push ("Error-sink support");

    return options;
}