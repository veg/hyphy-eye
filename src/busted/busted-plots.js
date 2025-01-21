import * as utils from "./busted-utils.js"
import * as plotUtils from "../utils/plot-utils.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js"
import * as srv from "../components/srv-plot.js";
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
    
export function get_plot_description(plot_type, srv_hmm) {
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

export function get_plot_options(results_json, bsPositiveSelection) {
    const attrs = utils.get_attributes(results_json);

    const plot_options = [
        ["Evidence ratio for ω>1 (constrained)", (d)=>results_json["Evidence Ratios"]["constrained"]], 
        ["Evidence ratio for ω>1 (optimized)", (d)=>results_json["Evidence Ratios"]["optimized null"]], 
        ["Synonymous rates", (d)=>attrs.srv_rate_classes > 0], 
        ["Support for positive selection", (d)=>bsPositiveSelection.length > 0], 
        ["Error-sink support", (d)=>attrs.has_error_sink_nt && utils.get_error_sink_rate(results_json, "Test")["proportion"] > 0], 
        ["Site-level LR support", (d)=>results_json["Evidence Ratios"]["optimized null"]], 
        ["Support for 2H", (d)=>attrs.mh_rates['DH']], 
        ["Support for 3H", (d)=>attrs.mh_rates['TH']], 
        ["Support for 2H+3H", (d)=>attrs.mh_rates['DH'] && attrs.mh_rates['TH']]
    ]

    return plot_options
}

export function get_plot_spec(
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

    const plot_specs = ({
        "Evidence ratio for ω>1 (constrained)" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return ERPlot (fig1data, d, 70, "ER (constrained)", ev_threshold)
            })
        },
        "Evidence ratio for ω>1 (optimized)" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return ERPlot (fig1data, d, 70, "ER (optimized null)", ev_threshold)
            })
        },
        "Synonymous rates" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return srv.SRVPlot (
                  fig1data, 
                  d, 
                  70, 
                  "SRV posterior mean", 
                  srv_hmm ? "SRV viterbi" : null, 
                  results_json["Evidence Ratios"]["constrained"], 
                  "ER (constrained)",
                  DYN_RANGE_CAP
                )
            })
        },
        "Support for positive selection" : {
            "resolve": {"scale": {"color": "shared"}},
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return BSPosteriorPlot (results_json, tree_objects, bsPositiveSelection, d, step_size, tested_branch_count, fig1_controls)
            })
        },
        "Error-sink support" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return BSPosteriorPlot (results_json, tree_objects, bsErrorSink, d, step_size, tested_branch_count, fig1_controls)
            })
        },
        "Support for 2H" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return BSPosteriorPlot (results_json, tree_objects, twoHBranchSite, d, step_size, tested_branch_count, fig1_controls)
            })
        },
        "Support for 3H" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return BSPosteriorPlot (results_json, tree_objects, threeHBranchSite, d, step_size, tested_branch_count, fig1_controls)
            })
        },
        "Support for 2H+3H" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], step_size), (d)=> {
                return BSPosteriorPlot (results_json, tree_objects, multiHBranchSite, d, step_size, tested_branch_count, fig1_controls)
            })
        },
        "Site-level LR support" : cdsQuant (fig1data, "LR", "Site LR")
    })

    return plot_specs[plot_type];
}


export function countBranchesER(results_json, test_omega,  er) {
    const attrs = utils.get_attributes(results_json);

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
          if (per_branch [key]) {
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




function ERPlot(data, from, step, key, ev_threshold) {
  let scale = d3.extent (data, (d)=>d[key]); 
  scale[1] = Math.min (DYN_RANGE_CAP,Math.max (scale[1], ev_threshold));
  scale = d3.nice (scale[0], scale[1], 10);
  return {
      "width": {"step": 12},
      "data" : {"values" : _.map (
        _.filter (data, (d,i)=>i+1 >= from && i< from + step - 1),
      (d)=> {
          let dd = _.clone (d);
          _.each ([key], (f)=> {
            dd[f] = Math.min (DYN_RANGE_CAP, dd[f]);
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
          "mark": {"stroke": "black", "type": "line", "size" : 2, "interpolate" : "step", "color" : "lightgrey", "opacity" : 0.5},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                "scale" : {"type" : "symlog", "domain" : scale},
                "axis" : {"grid" : false}
            }
          }
        },
        {
          "mark": { "stroke": "black", "type": "point", "size" : 100, "filled" : true,  "color" : "lightgrey", "tooltip" : {"contents" : "data"}, "opacity" : 1.},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                
            },
            "color" : {"condition": {"test": "datum['" + key + "'] > " + ev_threshold, "value": "firebrick"},
                "value": "lightgrey"
            }
          }
        },
        {
          "mark" : {"opacity": 0.5, "type": "line", "color": "steelblue"},
          "encoding" : { "y": {
                "datum": {"expr": "" + ev_threshold},
                "type": "quantitative",
                "scale" : {"domain" : scale}
              },
             
            "size": {"value": 2},
          }
        }
        
      ]
  };
}

function BSPosteriorPlot(results_json, tree_objects, data, from, step, tested_branch_count, fig1_controls) {
  const branch_order = phylotreeUtils.treeNodeOrdering(results_json, tree_objects, 0);
  let N = tested_branch_count;
  let box_size = 10; 
  let font_size = 8;

  var size_field = "subs";
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
  
  if (N > 50) {
      if (N <= 100) {box_size = 8; font_size = 6;}
      else if (N <= 200) {box_size = 5; font_size = 5;}
      else {box_size = 4; font_size = 0;}
  }
  let spec = {
      "width": {"step": box_size}, "height" : {"step" : box_size},
      "data" : {"values" : 
        data
      }, 
      "transform" : [
        {"calculate" : "parseInt (split(datum.Key, '|')[1])", "as" : "Codon"},
        {"calculate" : "split(datum.Key, '|')[0]", "as" : "Branch"},
        {"filter" : {"field" : "Codon", "range" : [from, from+step-1]}}
      ],
      
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Codon", "labelFontSize" : font_size} : null
        },
        "y": {
          "field": "Branch",
          "scale" : {"domain" : branch_order},
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Branch", "labelFontSize" : font_size} : null
        }
      },
      "layer": [
        {
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 1.0,  "tooltip": {"content": "data"}},
          "encoding": {
            "color": {
               "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top"},
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : "redyellowblue", "domainMid" : 1}
            }
          }
        }
      ]
  };
  if (size_field) {
      spec.layer.push (
            {
              "mark": {"type": "circle", "size" : 2, "stroke" : "black", "strokeWidth" : 0.5, "color" : null, "opacity" : 1.0},
              "encoding": {
                "color" : {"value" : null},
                "size": {
                   "field": size_field,
                    "type" : "quantitative",
                    "legend" : {"orient" : "top", "title" : "# substitutions"}
                }
              }
            }
        );
  }
  return spec;
}



function denser_plot(data) {
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



export function display_tree(results_json, ev_threshold, index, T, options, treeDim, treeLabels, branch_length, color_branches) {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
      
      T.branch_length_accessor = (n)=>(n.data.name in results_json["branch attributes"][index] ? results_json["branch attributes"][index][n.data.name][branch_length] : 0) || 0;  
      let alignTips = treeLabels.indexOf ("align tips") >= 0;
      var t = T.render({
        height:dim && dim[0], 
        width:dim && dim[1],
        'align-tips' : alignTips,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=>0,
        'internal-names' : treeLabels.indexOf ("show internal") >= 0
       } );
      
      phylotreeUtils.add_svg_defs (t.svg);
  
      function sort_nodes (asc) {
          T.traverse_and_compute (function (n) {
                  var d = 1;
                  if (n.children && n.children.length) {
                      d += d3.max (n.children, function (d) { return d["count_depth"];});
                  } 

                  n["count_depth"] = d;
              });
          T.resortChildren (function (a,b) {
              return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
          });
        }

        sort_nodes (true);
        t.style_nodes ((e,n) => {
           e.selectAll ("text").style ("font-family", "ui-monospace");
           if (n.children && n.children.length) return; 
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });

        let map2MH = {'Support for 2H' : "Evidence ratio for 2H", 'Support for 3H' : "Evidence ratio for 3H", 'Support for 2H+3H' : "Evidence ratio for 2H+3H"};
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for Selection" || color_branches == "Error-sink support") {
            let branch_values = {};
            const es = color_branches == "Error-sink support";
            let rate_class = es ? 0 : (test_omega.length - 1 + (has_error_sink ? 1 : 0));
            let prior = es ? get_error_sink_rate ("Test")["proportion"] : test_omega[test_omega.length-1].weight;
            prior = prior / (1-prior);
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][index][n.data.name];
                if (posteriors && posteriors["Posterior prob omega clas"]) {
                    posteriors = posteriors["Posterior prob omega class"][rate_class];
                    branch_values [n.data.name] = posteriors/(1-posteriors)/prior;
                    if (branch_values [n.data.name] < 1) branch_values [n.data.name] = null;
                }
            });
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),[0.1,1]);
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("opacity", color_scale(is_tested)).style ("stroke-width", "5").style ("stroke","firebrick"); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Substitutions") {
            let labels = subs_by_branch (index);
            let color_scale = d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolateTurbo);
            t.color_scale = color_scale;
            t.color_scale_title = "Min # of nucleotide substitutions";
            
            t.style_edges ((e,n) => {
             const is_tested = labels[n.target.data.name];
             
             if (is_tested) {
                if (options["branch-labels"]) {
                    add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
                }
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "4").style ("opacity",1.0); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (map2MH [color_branches]) {
            let branch_values = site_support_by_branch (index, map2MH [color_branches], ev_threshold);
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),[0.2,1]);
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("opacity", color_scale(is_tested)).style ("stroke-width", "5").style ("stroke","firebrick"); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        }
        t.placenodes();
        t.update();
        t.nwk = T.getNewick((n)=>results_json["tested"][index][n.data.name] == "test" ? "{Foreground}" : "");
        return t;      
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


export function display_tree_site(results_json, index,T,s,options, treeDim, treeLabels, branch_length, color_branches, partition_sizes) {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    T.branch_length_accessor = (n)=>results_json["branch attributes"][index][n.data.name][branch_length] || 0;  
    let node_labels = phylotreeUtils.generateNodeLabels (T, results_json["substitutions"][index][(+s)-1]);

    let labelDomain = new Set();
    let showAA = treeLabels.indexOf ("amino-acids") >= 0;
    let showCodons = treeLabels.indexOf ("codons") >= 0;
    let showSeqNames = treeLabels.indexOf ("sequence names") >= 0;
    let showOnlyMH = treeLabels.indexOf ("show only multiple hits") >= 0;
    let showOnlyNS = treeLabels.indexOf ("show only non-synonymous changes") >= 0;
    let alignTips = treeLabels.indexOf ("align tips") >= 0;
  
    var t = T.render({
      height:dim && dim[0], 
      width:dim && dim[1],
      'show-scale' : true,
      'is-radial' : false,
      'align-tips' : alignTips,
      'left-right-spacing': 'fit-to-size', 
      'top-bottom-spacing': 'fit-to-size',
      'node_circle_size' : (n)=>0,
      'internal-names' : treeLabels.indexOf ("show internal") >= 0
     } );

      phylotreeUtils.add_svg_defs (t.svg);
      
      let extended_labels = phylotreeUtils.display_tree_handle_neighbors (index,s,node_labels,T,options,results_json, partition_sizes[index]);
      t.nodeLabel ((n)=> {
          if (!n._display_me) {
              return "";
          }
          let label = "";
          let has_extended_label = extended_labels[n.data.name] || node_labels[n.data.name];

          n.data.color_on = "";
          
          if (showCodons) {
                label = has_extended_label[0];
                n.data.color_on = node_labels[n.data.name][0];
                if (showAA) label += "/";
          }
        
          if (showAA) {
              label += has_extended_label[1];
              n.data.color_on = node_labels[n.data.name][1];
          }
          
          labelDomain.add ( n.data.color_on);
          if (showSeqNames) label += ":" + n.data.name;
          return label;
      });
      
      function sort_nodes (asc) {
          T.traverse_and_compute (function (n) {
                  var d = 1;
                  if (n.children && n.children.length) {
                      d += d3.max (n.children, function (d) { return d["count_depth"];});
                  } 

                  n["count_depth"] = d;
              });
          T.resortChildren (function (a,b) {
              return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
          });
        }

       T.traverse_and_compute (function (n) {
            n._display_me = ! (showOnlyMH || showOnlyNS);
         
            if (!n._display_me) {
                if (node_labels[n.data.name]) {
                    if (showOnlyMH && node_labels[n.data.name][3] > 1) n._display_me = true;
                    if (! n._display_me) {
                      if (showOnlyNS) {
                          if (n.parent) {
                              const my_aa = node_labels[n.data.name][1];
                              const parent_aa = node_labels[n.parent.data.name][1];
                              if (my_aa != parent_aa && my_aa != '-' && parent_aa != '-') {
                                  n._display_me = true;
                                  
                                  if (showOnlyMH) n._display_me = node_labels[n.data.name][3] > 1;
                              } else {
                                  n._display_me = false;
                              }
                          }
                      }
                    }
                }
            }
            if (n._display_me && n.parent) {
                n.parent._display_me = true;
            }
            
        },"pre-order");

        sort_nodes (true);
        t.style_nodes ((e,n) => {
           e.selectAll ("text").style ("font-family", "ui-monospace");
           e.selectAll ("text").style ("fill", LABEL_COLOR_SCALE(n.data.color_on));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });

        let map2MH = {'Support for 2H' : "Evidence ratio for 2H", 'Support for 3H' : "Evidence ratio for 3H", 'Support for 2H+3H' : "Evidence ratio for 2H+3H"};
    
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for selection" || color_branches == "Error-sink support") {
            let branch_values = {};
            const es = color_branches == "Error-sink support";
            let rate_class = es ? 0 : (test_omega.length - 1 + (has_error_sink ? 1 : 0));
            let prior = es ? get_error_sink_rate ("Test")["proportion"] : test_omega[test_omega.length-1].weight;
            prior = prior / (1-prior);
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][index][n.data.name];
                if (posteriors && posteriors["Posterior prob omega class by site"]) {
                    posteriors = posteriors["Posterior prob omega class by site"][rate_class][s-1];
                    branch_values [n.data.name] = posteriors/(1-posteriors)/prior;
                    if (branch_values [n.data.name] < 1) branch_values [n.data.name] = null;
                }
            });
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),d3.interpolateTurbo);
            t.color_scale = color_scale;
            t.color_scale_title = "Empirical Bayes Factor";
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "5").style ("opacity",null); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
                if (options["branch-labels"]) {
                    add_branch_label (e, is_tested.toFixed(2), t.font_size, t.svg.selectAll (".phylotree-container"));
                }
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Substitutions") {
            
            let color_scale = d3.scaleOrdinal([0,1,2,3], d3.schemePuOr[4]);
            t.color_scale = color_scale;
            t.color_scale_title = "Min # of nucleotide substitutions";
            t.style_edges ((e,n) => {
             const is_tested = node_labels[n.target.data.name];
             if (is_tested && is_tested[3]) {
                e.style ("stroke", color_scale(is_tested[3])).style ("stroke-width", "5").style ("opacity","1"); 
                const subs = is_tested[2] + "→" + is_tested[0] + "(" + is_tested[3] + ")";
                e.selectAll ("title").data ([is_tested]).join ("title").text (subs);
                if (options["branch-labels"]) {
                    add_branch_label (e, subs, t.font_size, t.svg.selectAll (".phylotree-container"));
                }
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (map2MH [color_branches]) {
            let branch_values = {};
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][index][n.data.name];
                if (posteriors && posteriors[map2MH [color_branches]]) {
                    let supp = _.find (posteriors[map2MH [color_branches]], (d)=>d[0] == s-1);
                    if (supp) {
                        branch_values[n.data.name] = supp[1];
                    }
                }
            });
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),d3.interpolateTurbo);
            t.color_scale = color_scale;
            t.color_scale_title = "Empirical Bayes Factor";
          
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "5").style ("opacity","1"); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
                if (options["branch-labels"]) {
                    add_branch_label (e, is_tested.toFixed(2), t.font_size, t.svg.selectAll (".phylotree-container"));
                }
             } else {
                e.style ("stroke", null); 
             }
          });
        }
        t.placenodes();
        t.update();
        LABEL_COLOR_SCALE.domain (labelDomain);
        return t;      
    }


export function getTreeViewOptions(results_json, tree_objects) {
    let opts = _.map (_.range (1,tree_objects.length+1), (d)=>"Partition " + d);
    if (results_json.substitutions) {
        opts = opts.concat(_.map (_.range (1,results_json.input["number of sites"]+1), (d)=>"Codon " + d));
    }

    return opts;
}

export function tree_color_options(results_json) {
    const attrs = utils.get_attributes(results_json);

    let options = ["Tested"];
    if (results_json.substitutions) {
        options.push ("Support for selection");
        options.push ("Substitutions");
    }

    if (attrs.mh_rates["DH"]) options.push ("Support for 2H");
    if (attrs.mh_rates["TH"]) options.push ("Support for 3H");
    if (attrs.mh_rates["DH"] && attrs.mh_rates["TH"]) options.push ("Support for 2H+3H");
    if (attrs.has_error_sink) options.push ("Error-sink support");

    return options;
}