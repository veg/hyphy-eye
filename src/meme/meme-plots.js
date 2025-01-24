import * as d3 from "d3";
import * as _ from "lodash-es";
import * as plotUtils from "../utils/plot-utils.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as beads from "../components/bead-plot.js";
import * as heat from "../components/posteriors-heatmap.js";
import * as qq from "../components/qq-plot.js";
import * as rateDist from "../components/rate-summary-plots/rate-densities.js";
import * as rates from "../components/rate-summary-plots/rate-bars.js";

export const TABLE_COLORS = ({
    'Diversifying' : '#e3243b',
    'Neutral' : '#444',
    'Invariable' : '#CCC'
})
const label_color_scale = d3.scaleOrdinal([], d3.schemeCategory10);
const DYN_RANGE_CAP = 10000;
const OMEGA_RATE_CLASSES = 2;

export function get_plot_options(has_site_LRT, has_resamples, bsPositiveSelection) {
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

export function get_plot_description(plot_type, has_resamples) {
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

export function get_tree_color_options(results_json) {
  let options = ["Tested"];
  if (results_json.substitutions) {
    options.push ("Support for selection");
    options.push ("Substitutions");
  }
  return options;
}

// TODO: snake case godammert
export function getTreeViewOptions(results_json, tree_objects) {
  let opts = _.map (_.range (1,tree_objects.length+1), (d)=>"Partition " + d);
  let codonIdxToPartIdx = {};

  if (results_json.substitutions) {
    //opts = opts.concat(_.map (_.range (1,results_json.input["number of sites"]), (d)=>"Codon " + d));
    let offset = 0;
    _.each (results_json.substitutions, (sites, partition)=> {
        _.each (sites, (subs, site)=> {
          if (subs) {
            let idx = ((+site) + 1 + offset);
            codonIdxToPartIdx[idx] = [partition, (+site)+1];
            opts.push ("Codon " + idx);
          }
        })
        offset += results_json["data partitions"][partition].coverage[0].length;
    }); 
  }

  return [opts,codonIdxToPartIdx];
}

export function get_plot_spec(
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
    const branch_order = phylotreeUtils.treeNodeOrdering(results_json, tree_objects, 0);

    const plot_specs = ({
        "p-values for selection" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return beads.BeadPlot(
                  fig1data, 
                  d, 
                  70, 
                  siteTableData[2][6][2], 
                  "p-value for selection", 
                  true, 
                  "log", 
                  pvalue_threshold)
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
                  pvalue_threshold)
            })
        },
        "Site rates" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
                return alpha_beta_plot (fig1data, d, 70)
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

function alpha_beta_plot(data, from, step) {
  let color_d = [];
  let color_r = [];
  _.each (TABLE_COLORS, (v,c)=> {color_d.push (c); color_r.push (v);});
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

export function display_tree(results_json,i, treeDim, treeLabels, branch_length, color_branches, tree_objects) {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
      let T = tree_objects[i];
      T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name][branch_length] || 0;  
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
           if (n.children && n.children.length) return; 
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });


        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][i][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for Selection") {
            let branch_values = {};
            let prior = test_omega[test_omega.length-1].weight;
            prior = prior / (1-prior);
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][i][n.data.name];
                if (posteriors && posteriors["Posterior prob omega clas"]) {
                    posteriors = posteriors["Posterior prob omega clas"][test_omega.length-1];
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
            let labels = subs_by_branch (i);
            let color_scale = d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolatePuOr);
            t.color_scale = color_scale;
            t.color_scale_title = "Min # of nucleotide substitutions";
            t.style_edges ((e,n) => {
             const is_tested = labels[n.target.data.name];
             if (is_tested) {
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "4").style ("opacity",1.0); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        } 
        t.placenodes();
        t.update();
        return t;      
    }


function get_prior_odds(results_json, part, site) {
    const pp = results_json["MLE"]["content"][part][site][4];
    if (pp < 1) return pp/(1-pp);
    return Infinity;
}

export function display_tree_site(results_json, i,s, treeDim, treeLabels, branch_length, color_branches, shade_branches, tree_objects, treeViewOptions) {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    let T = tree_objects[i];
    T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name][branch_length] || 0;  

    s = treeViewOptions[1][s][1];
    
    let node_labels = phylotreeUtils.generateNodeLabels (T, results_json["substitutions"][i][s-1]);

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


      t.nodeLabel ((n)=> {
          if (!n._display_me) {
              return "";
          }
          let label = "";
          if (showCodons) {
              label = node_labels[n.data.name][0];
              if (showAA) label += "/";
          }
          if (showAA) label += node_labels[n.data.name][1];
          labelDomain.add (label);
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
           e.selectAll ("text").style ("fill", label_color_scale(t.nodeLabel ()(n).split (":")[0]));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
           if (shade_branches == "Tested") {
              e.style ("opacity", results_json["tested"][i][n.data.name] == "test" ? 1.0 : 0.25);
           } else {
              e.style ("opacity",1.0);
           }
        });

        if (shade_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][i][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("opacity", 1.0); 
             } else {
                e.style ("opacity", 0.25); 
             }
          });
        }  else {
           t.style_edges ((e,n) => {
              e.style ("opacity", 1.); 
          });
        }
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][i][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
            e.style ("opacity", (shade_branches != "Tested" || is_tested) ? 1.0 : 0.25); 
          });
        } else if (color_branches == "Support for selection") {
            let branch_values = {};
            let prior = get_prior_odds(results_json, i, s-1);
            
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][i][n.data.name];
                if (posteriors && posteriors["Posterior prob omega class by site"]) {
                    posteriors = posteriors["Posterior prob omega class by site"][OMEGA_RATE_CLASSES-1][s-1];
                    branch_values [n.data.name] = posteriors/(1-posteriors)/prior;
                }
            });

            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),d3.interpolateTurbo);
            t.color_scale = color_scale;
            t.color_scale_title = "Empirical Bayes Factor";
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", is_tested > 1 ? "5" : "1").style ("opacity",null); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
             e.style ("opacity", (shade_branches != "Tested" || results_json["tested"][i][n.target.data.name] == "test") ? 1.0 : 0.25); 
          });
        } else if (color_branches == "Substitutions") {
            
            let color_scale = d3.scaleOrdinal([0,1,2,3], d3.schemePuOr[4]);
            t.color_scale = color_scale;
            t.color_scale_title = "Min # of nucleotide substitutions";
            t.style_edges ((e,n) => {
             const is_tested = node_labels[n.target.data.name];
             if (is_tested && is_tested[3]) {
                e.style ("stroke", color_scale(is_tested[3])).style ("stroke-width", "5").style ("opacity","1"); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d[2] + "→" + d[0] + "(" + d[3] + ")");
             } else {
                e.style ("stroke", null); 
             }
             e.style ("opacity", (shade_branches != "Tested" || results_json["tested"][i][n.target.data.name] == "test") ? 1.0 : 0.25); 
          });
        } 
        t.placenodes();
        t.update();
        label_color_scale.domain (labelDomain);
        return t;      
    }
