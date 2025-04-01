import * as utils from "./busted-utils.js"
import * as plotUtils from "../utils/plot-utils.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js"
import * as beads from "../components/bead-plot.js";
import * as heat from "../components/posteriors-heatmap.js";
import * as _ from "lodash-es";
import * as d3 from "d3";

export const TABLE_COLORS = ({
    'Diversifying' : '#e3243b',
    'Neutral' : '#444',
    'Purifying' : 'green',
    'Invariable' : '#CCC'
})

const DYN_RANGE_CAP = 10000;
const LABEL_COLOR_SCALE = d3.scaleOrdinal([], d3.schemeCategory10)
    
export function getPlotDescription(plot_type, srv_hmm) {
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

export function getPlotOptions(results_json, bsPositiveSelection) {
    const attrs = utils.getAttributes(results_json);

    const plot_options = [
        ["Evidence ratio for ω>1 (constrained)", (d)=>results_json["Evidence Ratios"]["constrained"]], 
        ["Evidence ratio for ω>1 (optimized)", (d)=>results_json["Evidence Ratios"]["optimized null"]], 
        ["Synonymous rates", (d)=>attrs.srv_rate_classes > 0], 
        ["Support for positive selection", (d)=>bsPositiveSelection.length > 0], 
        ["Error-sink support", (d)=>attrs.has_error_sink_nt && utils.get_error_sink_rate(results_json, "Test")["proportion"] > 0], 
        ["Site-level LR support", (d)=>results_json["Evidence Ratios"]["optimized null"]], 
        ["Support for 2H", (d)=>attrs.mhRates['DH']], 
        ["Support for 3H", (d)=>attrs.mhRates['TH']], 
        ["Support for 2H+3H", (d)=>attrs.mhRates['DH'] && attrs.mhRates['TH']]
    ]

    return plot_options
}

export function getPlotSpec(
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
    const branch_order = phylotreeUtils.treeNodeOrdering(results_json, tree_objects, 0);
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
    const attrs = utils.getAttributes(results_json);

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
    const t = phylotreeUtils.configureTree(results_json, T, treeDim, {
        height: dim && dim[0],
        width: dim && dim[1],
        'align-tips': options.styleOptions?.alignTips || false,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        'internal-names': options.styleOptions?.showInternalNames || false,
        configureBranches: (tree, resultsJson) => {
            // Add SVG definitions
            phylotreeUtils.addSvgDefs(tree.svg);
            
            // Sort nodes based on their depth
            function sortNodes(asc) {
                T.traverse_and_compute(function (n) {
                    var d = 1;
                    if (n.children && n.children.length) {
                        d += d3.max(n.children, function (d) { return d["count_depth"]; });
                    }
                    n["count_depth"] = d;
                });
                T.resortChildren(function (a, b) {
                    return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
                });
            }
            
            sortNodes(true);
            
            // Branch coloring logic
            if (color_branches === "Tested") {
                tree.style_edges((e, n) => {
                    const is_tested = resultsJson["tested"][index][n.target.data.name] === "test";
                    if (is_tested) {
                        e.style("stroke", "firebrick");
                    } else {
                        e.style("stroke", null);
                    }
                });
            } else if (color_branches === "Support for selection" || color_branches === "Error-sink support") {
                let branch_values = {};
                const es = color_branches === "Error-sink support";
                let rate_class = es ? 0 : (test_omega.length - 1 + (has_error_sink ? 1 : 0));
                
                T.traverse_and_compute((n) => {
                    let posteriors = resultsJson["branch attributes"][index][n.data.name];
                    if (posteriors && posteriors["Posterior prob omega class"]) {
                        posteriors = posteriors["Posterior prob omega class"][rate_class];
                        branch_values[n.data.name] = posteriors / (1 - posteriors);
                        if (branch_values[n.data.name] < 1) branch_values[n.data.name] = null;
                    }
                });
                
                let color_scale = d3.scaleSequentialLog(d3.extent(_.map(branch_values, (d) => d)), [0.1, 1]);
                tree.style_edges((e, n) => {
                    const is_tested = branch_values[n.target.data.name];
                    if (is_tested) {
                        e.style("opacity", color_scale(is_tested))
                            .style("stroke-width", "5")
                            .style("stroke", es ? "black" : "firebrick");
                        e.selectAll("title").data([is_tested]).join("title").text((d) => d);
                    } else {
                        e.style("stroke", null);
                    }
                });
            } else if (color_branches === "Substitutions") {
                let labels = phylotreeUtils.subsByBranch(resultsJson, index);
                let color_scale = d3.scaleSequential(d3.extent(_.map(labels, d => d)), d3.interpolateTurbo);
                tree.color_scale = color_scale;
                tree.color_scale_title = "Min # of nucleotide substitutions";
                
                tree.style_edges((e, n) => {
                    const is_tested = labels[n.target.data.name];
                    if (is_tested) {
                        e.style("stroke", color_scale(is_tested))
                            .style("stroke-width", "4")
                            .style("opacity", 1.0);
                        e.selectAll("title").data([is_tested]).join("title").text((d) => d);
                    } else {
                        e.style("stroke", null);
                    }
                });
            }
            
            tree.placenodes();
            tree.update();
        }
    });
    
    return t;
}

export function displayTreeSite(resultsJson, partitionId, T, codonIndex, treeOptions, treeDim, treeLabels, branchLength, colorBranches, partitionSizes, testOmega, hasErrorSink) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Set the branch length accessor using the utility
    T.branch_length_accessor = phylotreeUtils.setBranchLengthAccessor(T, resultsJson, partitionId, branchLength);
    
    let node_labels = phylotreeUtils.generateNodeLabels(T, resultsJson["substitutions"][partitionId][codonIndex - 1]);

    let labelDomain = new Set();
    let showAA = treeLabels.indexOf("amino-acids") >= 0;
    let showCodons = treeLabels.indexOf("codons") >= 0;
    let showSeqNames = treeLabels.indexOf("sequence names") >= 0;
    let showOnlyMH = treeLabels.indexOf("show only multiple hits") >= 0;
    let showOnlyNS = treeLabels.indexOf("show only non-synonymous changes") >= 0;
    let alignTips = treeLabels.indexOf("align tips") >= 0;

    // Configure the tree using the helper
    const tree = phylotreeUtils.configureTree(resultsJson, T, treeDim, {
        height: dim && dim[0],
        width: dim && dim[1],
        'show-scale': true,
        'is-radial': false,
        'align-tips': alignTips,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        'internal-names': treeLabels.indexOf("show internal") >= 0,
        configureNodeDisplay: (tree, resultsJson) => {
            tree.style_nodes((e, n) => {
                if (!n._display_me) {
                    e.style("display", "none");
                    return;
                }
                e.selectAll("title").data([n.data.name]).join("title").text((d) => d);
            });
        },
        configureLabels: (tree, resultsJson) => {
            tree.nodeLabel((n) => {
                if (!n._display_me) {
                    return "";
                }
                let label = "";
                if (showCodons) {
                    label = node_labels[n.data.name][0];
                    if (showAA) label += "/";
                }
                if (showAA) {
                    label += node_labels[n.data.name][1];
                }
                if (showSeqNames) {
                    label += "\n" + n.data.name;
                }
                return label;
            });
        },
        configureBranches: (tree, resultsJson) => {
            // Add SVG definitions
            phylotreeUtils.addSvgDefs(tree.svg);
            
            // Sort nodes based on their depth
            function sortNodes(asc) {
                T.traverse_and_compute(function (n) {
                    var d = 1;
                    if (n.children && n.children.length) {
                        d += d3.max(n.children, function (d) { return d["count_depth"]; });
                    }
                    n["count_depth"] = d;
                });
                T.resortChildren(function (a, b) {
                    return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
                });
            }
            
            sortNodes(true);
            
            // Branch coloring logic
            if (colorBranches === "Tested") {
                tree.style_edges((e, n) => {
                    const is_tested = resultsJson["tested"][partitionId][n.target.data.name] === "test";
                    if (is_tested) {
                        e.style("stroke", "firebrick");
                    } else {
                        e.style("stroke", null);
                    }
                });
            } else if (colorBranches === "Support for selection" || colorBranches === "Error-sink support") {
                let branch_values = {};
                const es = colorBranches === "Error-sink support";
                let rate_class = es ? 0 : (testOmega.length - 1 + (hasErrorSink ? 1 : 0));
                
                T.traverse_and_compute((n) => {
                    let posteriors = resultsJson["branch attributes"][partitionId][n.data.name];
                    if (posteriors && posteriors["Posterior prob omega class"]) {
                        posteriors = posteriors["Posterior prob omega class"][rate_class];
                        branch_values[n.data.name] = posteriors / (1 - posteriors);
                        if (branch_values[n.data.name] < 1) branch_values[n.data.name] = null;
                    }
                });
                
                let color_scale = d3.scaleSequentialLog(d3.extent(_.map(branch_values, (d) => d)), [0.1, 1]);
                tree.style_edges((e, n) => {
                    const is_tested = branch_values[n.target.data.name];
                    if (is_tested) {
                        e.style("opacity", color_scale(is_tested))
                            .style("stroke-width", "5")
                            .style("stroke", es ? "black" : "firebrick");
                        e.selectAll("title").data([is_tested]).join("title").text((d) => d);
                    } else {
                        e.style("stroke", null);
                    }
                });
            } else if (colorBranches === "Substitutions") {
                let labels = phylotreeUtils.subsByBranch(resultsJson, partitionId);
                let color_scale = d3.scaleSequential(d3.extent(_.map(labels, d => d)), d3.interpolateTurbo);
                tree.color_scale = color_scale;
                tree.color_scale_title = "Min # of nucleotide substitutions";
                
                tree.style_edges((e, n) => {
                    const is_tested = labels[n.target.data.name];
                    if (is_tested) {
                        e.style("stroke", color_scale(is_tested))
                            .style("stroke-width", "4")
                            .style("opacity", 1.0);
                        e.selectAll("title").data([is_tested]).join("title").text((d) => d);
                    } else {
                        e.style("stroke", null);
                    }
                });
            }
            
            tree.placenodes();
            tree.update();
        }
    });
    
    return tree;
}

function site_support_by_branch(results_json, i, key, er) {
    let counts = {};
    _.each (results_json["branch attributes"][i], (attribs, branch)=> {
        if (key in attribs) {
          _.each (attribs[key], (d)=> {
            if (d[1] >= er) {
              counts[branch] = 1 + (counts[branch] ? counts[branch] : 0);
            }
          });
        }});
    return counts;
}


export function treeColorOptions(results_json) {
    const attrs = utils.getAttributes(results_json);

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