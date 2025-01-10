import * as utils from "./absrel-utils.js";
import * as _ from "lodash-es";
import * as d3 from "d3";

const DYN_RANGE_CAP = 10000;
const LABEL_COLOR_SCALE = d3.scaleOrdinal([], d3.schemeCategory10)

/**
 * Returns a human-readable description for a given plot type.
 * The description provides context for interpreting the plot, such as
 * describing what is shown and under what conditions the data is applicable.
 *
 * @param {string} plot_type - The identifier of the plot type to describe.
 * @returns {string} A description of the plot type, or undefined if the plot type is not recognized.
 */

export function get_plot_description(plot_type) {
    const plot_legends = ({
        "Synonymous rates" : "Posterior means for synonymous site-level substitution rates (α). ",
        "Support for positive selection" : "Empirical Bayes Factors for ω>1 at a particular branch and site (only tested branches with 2 or more rate classes are included).",
        "Evidence ratio alignment profile" : "Evidence ratios for ω>1 at a particular branch and site (only tested branches with an ω>1 distribution component are included). Mouse over for more information"
    })

    return plot_legends[plot_type];
}

// TODO: i think maybe profileBranchSites -> branchSiteProfiles. i keep forgetting what it means..
/**
 * Returns an array of arrays, where each sub-array contains a string description
 * of a plot, and a function that takes a data object and returns a boolean
 * indicating whether the plot should be shown for that data object.
 *
 * @param {number} srv_rate_classes - the number of rate classes in the synonymous rate distribution
 * @param {boolean} srv_distribution - whether the synonymous rate distribution is shown
 * @param {Array.<Object>} bsPositiveSelection - a thing
 * @param {Array.<Object>} profileBranchSites - profiles of branch sites
 * @returns {Array.<Array.<string|function>>} The array of arrays described above
 */
export function get_plot_options(srv_rate_classes, srv_distribution, bsPositiveSelection, profileBranchSites) {
    const plot_options = [
        ["Synonymous rates", (d)=>srv_rate_classes > 0 && srv_distribution], 
        ["Support for positive selection", (d)=>bsPositiveSelection.length > 0],
        ["Evidence ratio alignment profile", (d)=>profileBranchSites.length > 0]
    ]

    return plot_options;
}

/**
 * Determines the step size for plotting based on the number of sequences.
 *
 * @param {Object} results_json - The JSON object containing the input data.
 * @returns {number} The step size for plotting. Returns 70 if the number of sequences is less than 100,
 *                   140 if less than 200, and 600 otherwise.
 */

function er_step_size(results_json) {
    let N = results_json.input["number of sequences"];
    if (N < 100) return 70;
    if (N < 200) return 140;
    return 600;
}

/**
 * Returns a Vega-Lite spec for a plot of the specified type.
 *
 * @param {string} plot_type - The type of plot to generate.
 * @param {Object} results_json - The JSON object containing the aBSREL results
 * @param {array} fig1data - The data object containing the site-level results of interest
 * @param {array} bsPositiveSelection - a thing
 * @param {array} profileBranchSites - profiles of branch sites
 * @returns {Object} The Vega-Lite spec for the specified plot type
 */
export function get_plot_spec(plot_type, results_json, fig1data, bsPositiveSelection, rate_table, attrs, fig1_controls) {
    const plot_specs = ({
        "Synonymous rates" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
            return SRVPlot (fig1data, d, 70, "SRV posterior mean", null)
        })},
        "Support for positive selection" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size(results_json)), (d)=> {
            return BSPosteriorPlot (results_json, attrs.tree_objects, rate_table, attrs, fig1_controls, bsPositiveSelection, d, er_step_size(results_json))
        })},
        "Evidence ratio alignment profile" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size(results_json)), (d)=> {
            return ERPosteriorPlot (results_json, attrs.tree_objects, rate_table, attrs, fig1_controls, attrs.profileBranchSites, d, er_step_size(results_json))
        })}
    });

    return plot_specs[plot_type];
}

function SRVPlot(data, from, step, key, key2) {
  let spec = {
      "width": {"step": 12},
      "data" : {"values" : _.map (
        _.filter (data, (d,i)=>i+1 >= from && i<= from + step),
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
          "mark": {"type": "line", "size" : 2, "color" : "lightgrey", "opacity" : 0.5, "interpolate" : "step"},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
            }
          }
        },
        {
          "mark": {"stroke": null, "type": "point", "size" : 100, "filled" : true, "color" : "lightgrey", "tooltip" : {"contents" : "data"}, "opacity" : 1},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                "scale" : {"type" : "symlog"},
                "axis" : {"grid" : false}
            }
          }
        }
      ]
  };
  if (key2) {
      spec.layer.push (
        {
          "mark": {"type": "line", "size" : 4, "color" : "lightgrey", "opacity" : 0.5, "interpolate" : "step", "color" : "firebrick"},
          "encoding": {
            "y": {
               "field": key2,
                "type" : "quantitative",
            }
          }
        }
      );
  }
  return spec;
}



function BSPosteriorPlot(results_json, tree_objects, rate_table, attrs, fig1_controls, data, from, step) {
  const selected_branches = new Set (_.map (rate_table, (d)=>d.branch));
  const branch_order = _.filter (treeNodeOrdering (results_json, tree_objects, 0), (d)=>attrs.profilable_branches.has (d) && selected_branches.has (d));
  let N = attrs.tested_branch_count;
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
  }
  
  if (N > 50) {
      if (N <= 100) {box_size = 8; font_size = 6;}
      else if (N <= 200) {box_size = 5; font_size = 5;}
      else {box_size = 4; font_size = 0;}
  }
  let spec = {
      "width": {"step": box_size}, "height" : {"step" : box_size},
      "data" : {"values" : 
        _.filter (data, (d)=>selected_branches.has (d.Key.split ("|")[0]))
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
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 1.0, "tooltip" : {"contents" : "data"}},
          "encoding": {
            "color": {
               "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top", "title" : "EBF"},
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : "redyellowblue", "domainMid" : 1}
            }
          }
        },
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
      ]
  };
  return spec;
}



function ERPosteriorPlot(results_json, tree_objects, rate_table, attrs, fig1_controls, data, from, step) {
  
  const selected_branches = new Set (_.map (rate_table, (d)=>d.branch));
  const branch_order = _.filter (treeNodeOrdering (results_json, tree_objects, 0), (d)=>attrs.profilable_branches.has (d) && selected_branches.has (d));
  let N = attrs.tested_branch_count;
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
  }
  
  if (N > 50) {
      if (N <= 100) {box_size = 8; font_size = 6;}
      else if (N <= 200) {box_size = 5; font_size = 5;}
      else {box_size = 4; font_size = 0;}
  }
  let spec = {
      "width": {"step": box_size}, "height" : {"step" : box_size},
      "data" : {"values" : 
        _.filter (data, (d)=>selected_branches.has (d.Key.split ("|")[0]))
      }, 
      "transform" : [
        {"calculate" : "parseInt (split(datum.Key, '|')[1])", "as" : "Codon"},
        {"calculate" : "split(datum.Key, '|')[0]", "as" : "Branch"},
        {"filter" : {"field" : "Codon", "range" : [from, from+step-1]}},
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
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 0.8, "tooltip": {"content": "data"}},
          "encoding": {
            "color": {
               "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top"},
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : "redyellowblue", "domainMid" : 1}
            }
          }
        },
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
      ]
  };
  return spec;
}

/**
 * Render a tree with the given options, and return the
 * Phylotree object. This is the main tree rendering function used in the
 * application.
 *
 * @param {object} results_json - the results JSON
 * @param {number} index - the index of the site in the partition
 * @param {object} T - the tree object
 * @param {object} options - an object with options
 * @param {number} ev_threshold - the evidence threshold
 * @param {string} treeDim - the dimensions of the tree
 * @param {string} treeLabels - the labels to display
 * @param {string} branch_length - option to display branch lengths by
 * @param {string} color_branches - option to color branches by
 * @return {object} - the rendered tree
 */
export function display_tree(results_json, index, T, options, ev_threshold, treeDim, treeLabels, branch_length, color_branches) {
      const attrs = utils.get_attributes(results_json, ev_threshold)
      let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    
      T.branch_length_accessor = (n)=>(n.data.name in results_json["branch attributes"][index] ? results_json["branch attributes"][index][n.data.name][branch_length] : 0) || 0;  
      let alignTips = treeLabels.indexOf ("align tips") >= 0;
      var t = T.render({
        height: dim && dim[0], 
        width : dim && dim[1],
        'align-tips' : alignTips,
        'selectable' : false,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=>0,
        'internal-names' : treeLabels.indexOf ("show internal") >= 0
       } );
      

      add_svg_defs (t.svg);
  
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

    
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for selection") {
            let branch_values = {};
            t.svg.selectAll ("defs").selectAll ("linearGradient").remove();
            let branch_gradients = {};
            T.traverse_and_compute ( (n)=> {
                  let test_omegas = utils.test_omega(results_json, n.data.name);
                  if (test_omegas) {
                    let rate_class = test_omegas.length - 1 ;
                    branch_values[n.data.name] = test_omegas[rate_class].value;
                  }
                  
                }
            );
            let color_scale = d3.scaleDivergingLog([1e-4,1,Math.min(1000,d3.max (_.map (branch_values, (d)=>d)))],["rgb(0,0,255)","rgb(128,128,128)","rgb(255,0,0)"]);
          
            let bID = 0;
            let max_omega_by_branch = {};
            T.traverse_and_compute ( (n)=> {
                  let test_omegas = utils.test_omega(results_json, n.data.name);
                  if (test_omegas) {
                    let rate_class = test_omegas.length - 1 ;
                    branch_gradients [n.data.name] = "hyphy_phylo_branch_gradient_" + bID;
                    
                    let gradient_def = t.svg.selectAll ("defs").append ("linearGradient").attr ("id", branch_gradients [n.data.name]);
                    bID += 1;
                    let current_frac = 0;
                    _.each (test_omegas, (t)=> {
                        gradient_def.append ("stop").attr ("offset", "" + current_frac*100.0 + "%").style ("stop-color", color_scale (t.value));
                        
                        current_frac += t.weight;
                        gradient_def.append ("stop").attr ("offset", "" + current_frac*100.0 + "%").style ("stop-color", color_scale (t.value));                    });
                      max_omega_by_branch [n.data.name] = test_omegas[test_omegas.length-1];
                  }
                  
                  
                }
            ); 
            
            t.color_scale = color_scale;
            t.color_scale_title = "ω";
            t.style_edges ((e,n) => {
               const is_tested = results_json["tested"][index][n.target.data.name] == "test";
               let t_string = n.target.data.name + " ";
               let b_string = "";
               if (is_tested) {
                   let pv_l = utils.test_pv(results_json, n.target.data.name); 
                   t_string += "(p = " + pv_l.toFixed (3) + ")";
                   pv_l = -Math.floor(Math.log10(Math.max (pv_l,1e-6)));
                   let mxo = max_omega_by_branch[n.target.data.name].value;
                   if (mxo > 1) {
                         mxo = mxo > 1000. ? ">1000" : mxo.toFixed (2);
                         b_string = mxo + "/" + (max_omega_by_branch[n.target.data.name].weight*100).toFixed (2) + "%"; 
                   }
                  
                   e.style ("stroke", "url('#" + branch_gradients[n.target.data.name] + "')").style ("stroke-width", 2 + pv_l);
               } else {
                   t_string += "(not tested)";
                   e.style ("stroke", "url('#" + branch_gradients[n.target.data.name] + "')").style ("stroke-width", "2").style ("opacity","0.5");
               }
               t_string += " max ω = " + branch_values[n.target.data.name].toFixed (2);
               e.style ("stroke-linejoin", "round").style("stroke-linecap", "round");
               e.selectAll ("title").data ([t_string]).join ("title").text ((d)=>d);
               if (options["branch-labels"]) {
                    add_branch_label (e, b_string, t.font_size, t.svg.selectAll (".phylotree-container"));
               }
            });
        } else {
            let labels;
            switch (color_branches) {
              case "Substitutions" : {  
                labels = subs_by_branch (index);
                 t.color_scale_title = "Min # of nucleotide substitutions";
                } 
                break;
              case "2-hit rate" : {  
                 labels = _.mapValues (attrs.mh_rates["DH"], d=>d.toFixed (2));
                 t.color_scale_title = "Double-nucleotide relative substitution rate (δ)";
                } 
                break;
              case "3-hit rate" : {  
                 labels = _.mapValues (attrs.mh_rates["TH"], d=>d.toFixed (2));
                 t.color_scale_title = "Three-nucleotide relative substitution rate (ψ)";
                } 
                break;
            }

            let color_scale = d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolateTurbo);
            t.color_scale = color_scale;

            t.svg.selectAll (".absrel-branch-labels").remove();
            
            t.style_edges ((e,n) => {
                const is_tested = labels[n.target.data.name];
                if (options["branch-labels"]) {
                    add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
                }
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "4").style ("opacity",1.0); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
                e.style ("stroke-linejoin", "round").style("stroke-linecap", "round");
          });
        }

      
      t.placenodes();
      t.update();

      return t;     
}



  /**
   * Takes a tree, a site number, the node labels at that site, and an options object
   * and returns an object with the same keys as node_labels. The value of each key is
   * a two-member array of strings, where the first element is a pipe-separated list of
   * all the codon states at the site numbers that are within 4 of the given site number,
   * and the second element is the same but for the amino acid states. The states at the
   * given site number are marked with a leading and trailing "·".
   * 
   * This is used to generate the visual display of the codon and amino acid states at
   * the sites that are neighbors to the given site number.
   * @param {number} index - the index of the tree in the tree array
   * @param {number|string} s - the site number
   * @param {object} node_labels - an object with the node names as keys and two-member
   *   arrays of strings as values, where the first element is the codon state and the
   *   second element is the amino acid state.
   * @param {object} T - the tree object
   * @param {object} options - an object with options
   * @param {object} results - the results object
   * @param {number} site_count - the number of sites
   * @return {object} - an object with the same keys as node_labels, with values as
   *   described above.
   */
function display_tree_handle_neighbors(index, s, node_labels, T, options, results, site_count) {
  let extended_labels = {};
  if (options["neighbors"]) {
        const si = (+s)-1;
        let joint_labels = [];
        for (let idx = si-4; idx <= si+4; idx++) {
              if (idx >= 0 && idx < site_count) {
                    if (idx != si) {
                        joint_labels.push (utils.generateNodeLabels (T, results["substitutions"][index][idx]));
                    } else {
                        joint_labels.push (_.mapValues (node_labels, (d)=> {
                              return ["·" + d[0] + "·", "·" + d[1] + "·"] 
                        }));
                    }
              }
        } 
        _.each (node_labels, (d,k)=> {
            extended_labels [k] = [_.map (joint_labels, (slc)=> {
                return slc[k][0];
            }).join ("|"),_.map (joint_labels, (slc)=> {
                return slc[k][1];
            }).join ("|")];
        });


    }
    return extended_labels;
}




  /**
   * This function renders a tree with the given options, and returns the
   * Phylotree object. This variant is used when rendering trees for individual sites.
   * 
   * @param {object} results_json - the results object
   * @param {number} index - the index of the site in the partition
   * @param {object} T - the tree object
   * @param {number} s - the site number
   * @param {object} options - an object with options
   * @param {number} ev_threshold - the event threshold
   * @param {string} treeDim - the dimensions of the tree
   * @param {string} treeLabels - the labels to display
   * @param {string} branch_length - option to display branch lengths by
   * @param {string} color_branches - option to color branches by
   * @return {object} - the rendered tree
   */
export function display_tree_site(results_json, index, T,s,options, ev_threshold, treeDim, treeLabels, branch_length, color_branches) {
    const attrs = utils.get_attributes(results_json, ev_threshold);
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    
    T.branch_length_accessor = (n)=>results_json["branch attributes"][index][n.data.name][branch_length] || 0;  
    let node_labels = utils.generateNodeLabels (T, results_json["substitutions"][index][(+s)-1]);
    let extended_labels = {};

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
      'selectable' : false,
      'internal-names' : treeLabels.indexOf ("show internal") >= 0
     } );

      
      add_svg_defs (t.svg);
      extended_labels = display_tree_handle_neighbors (index,s,node_labels,T,options,results_json, partition_sizes[index]);
  
  
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
           e.selectAll ("text").style ("fill", LABEL_COLOR_SCALE(n.data.color_on));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
           e.selectAll ("text").style ("font-family", "ui-monospace");
        });
       
    
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for selection") {
            let branch_values = {};
            
            T.traverse_and_compute ( (n)=> {
              
                let posteriors = results_json["branch attributes"][index][n.data.name];
                if (posteriors && posteriors["posterior"]) {
                    let test_omegas = utils.test_omega(results_json, n.data.name);
                    let rate_class = test_omegas.length - 1 ;
                    let prior = test_omegas[test_omegas.length-1].weight;
                    prior = prior / (1-prior);
                    posteriors = posteriors["posterior"][rate_class][s-1];
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
             } else {
                e.style ("stroke", null); 
             }
          });
        } else {
            let labels, color_scale = null;
            switch (color_branches) {
              case "Substitutions" : {  
                 color_scale = d3.scaleOrdinal([0,1,2,3], d3.schemePuOr[4]);
                 labels = node_labels;
                 t.color_scale_title = "Min # of nucleotide substitutions";
                } 
                break;
              case "2-hit rate" : {  
                 labels = _.mapValues (attrs.mh_rates["DH"], (d)=>d.toFixed(2));
                 t.color_scale_title = "Double-nucleotide relative substitution rate (δ)";
                } 
                break;
              case "3-hit rate" : {  
                 labels = _.mapValues (attrs.mh_rates["TH"], (d)=>d.toFixed(2));
                 t.color_scale_title = "Three-nucleotide relative substitution rate (ψ)";
                } 
                break;
            }
          
            
            t.color_scale = color_scale ||  d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolateTurbo);
            
            t.style_edges ((e,n) => {
             const is_tested = labels[n.target.data.name];
             if (color_branches == "Substitutions") {
               if (is_tested && is_tested[3]) {
                  e.style ("stroke", t.color_scale(is_tested[3])).style ("stroke-width", "5").style ("opacity","1"); 
                  const ts = is_tested[2] + "→" + is_tested[0] + "(" + is_tested[3] + ")"
                  e.selectAll ("title").data ([ts]).join ("title").text ((d)=>d);
                  if (options["branch-labels"]) {
                    add_branch_label (e, ts, t.font_size, t.svg.selectAll (".phylotree-container"));
                   }
               } else {
                  e.style ("stroke", null); 
               }
             } else {
                 e.style ("stroke", t.color_scale(is_tested)).style ("stroke-width", "4").style ("opacity","1"); 
                 if (options["branch-labels"]) {
                    add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
                 }
             }
             
          });
        } 
        t.placenodes();
        t.update();
        LABEL_COLOR_SCALE.domain (labelDomain);
        return t;      
    }



/**
 * Adds a text label to a branch in a phylogenetic tree visualization. The label
 * is positioned based on the branch's SVG path data and is styled with a specific
 * font and background filter.
 *
 * @param {d3.selection} e - The D3 selection of the branch element.
 * @param {string|number} text - The text content to be displayed as the label.
 * @param {number} font_size - The base font size for the label text.
 * @param {d3.selection} container - The SVG container where the label will be added.
 */

function add_branch_label(e, text, font_size, container) {
  const where2 = _.get (parse_svg.default(e.attr("d")),["1"]);
  if (where2 && (text.length || _.isNumber (text))) {
      let my_id = e.attr ("id");
      if (!e.attr ("id")) {
          my_id = DOM.uid ("absrel_tree").id;
          e.attr ("id", my_id);
      }
      let branch_label = container.selectAll ("text[label-for='" + my_id + "']").data ([text]).join ("text").attr ("label-for", my_id).text ((d)=>d).classed ("absrel-branch-labels",true).attr ("x", where2[1]).attr ("y", where2[2]).attr ("font-size", font_size * 0.8).attr ("dx","0.5em").attr ("dy", "-0.4em").style ("font-family", "ui-monospace");
      branch_label.attr ("filter","url(#tree_branchlabel_bgfill)");
  }
}



/**
 * Adds an SVG filter to the given SVG element that can be used to provide a
 * lightgray background for branch labels. The filter is given the id
 * "tree_branchlabel_bgfill".
 *
 * @param {d3.selection} svg - The SVG element to which the filter will be added.
 *
 * @returns {void}
 */
function add_svg_defs(svg) {
    let filter = svg.selectAll ("defs").append ("filter").attr ("x", 0).attr ("y", 0).attr ("width", 1).attr ("height", 1).attr ("id", "tree_branchlabel_bgfill");
    filter.append ("feFlood").attr ("flood-color", "lightgray");
    filter.append ("feComposite").attr ("in", "SourceGraphic").attr ("operator", "atop");
}


/**
 * Computes the number of substitutions for each branch, excluding the root,
 * based on the substitutions data for a given index.
 *
 * @param {number} i - The index of the substitutions data in the results JSON.
 * 
 * @returns {Object} An object where keys are branch names and values are the
 * count of substitutions for each branch.
 */

function subs_by_branch(i) {
    let counts = {};
    _.each (results_json.substitutions[i], (states, site)=> {
        _.each (states, (state, branch)=> {
          if (branch != "root") {
              if (state != '---') {
                    counts[branch] = 1 + (counts[branch] ? counts[branch] : 0);
              }
          }
        });
    });
    return counts;
}

/**
 * Computes a depth-first ordering of the tree nodes for a given index. If `root`
 * is true, the root node is included in the ordering. The ordering is computed
 * by traversing the tree and computing the maximum depth of each node, then
 * sorting the nodes by their maximum depth. The root node comes first, followed
 * by the nodes in a depth-first ordering. The ordering includes only those nodes
 * that are tested and excludes the root node if `root` is false.
 * 
 * @param {Object} results_json - The results JSON object.
 * @param {Array} tree_objects - An array of tree objects.
 * @param {number} index - The index of the tree in the `tree_objects` array.
 * @param {boolean} root - Whether to include the root node in the ordering.
 * 
 * @returns {string[]} An array of node names in the computed ordering.
 */
function treeNodeOrdering(results_json, tree_objects, index, root) {
    let order = [];
    if (root) {order.push ('root');}
    const T = tree_objects[index];
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
    T.traverse_and_compute (function (n) {
        if (results_json.tested[index][n.data.name] == "test") {
          order.push (n.data.name);
        }
    });
    return order;
}

/**
 * Returns an array of strings representing the tree view options for the
 * given results JSON object. The first element is "Alignment-wide tree".
 * If the results JSON contains substitutions data, the remaining elements
 * are strings of the form "Codon X", where X is the site number.
 * 
 * @param {Object} results_json - The results JSON object.
 * 
 * @returns {string[]} An array of strings representing the tree view options.
 */
export function treeViewOptions(results_json) {
  let opts = ["Alignment-wide tree"];
  if (results_json.substitutions) {
    opts = opts.concat(_.map (_.range (1,results_json.input["number of sites"]+1), (d)=>"Codon " + d));
  }
  return opts;
}

/**
 * Returns an array of strings representing the color options for branches
 * in a phylogenetic tree based on the provided results JSON. The options
 * include "Tested" by default. Additional options are included based on
 * the presence of substitutions and multiple-hit rates in the data.
 *
 * @param {Object} results_json - The results JSON object containing tree data.
 * @param {number} ev_threshold - The evidence threshold.
 *
 * @returns {string[]} An array of strings representing the branch color options.
 */

export function tree_color_options(results_json, ev_threshold) {
  const attrs = utils.get_attributes(results_json, ev_threshold);

  let options = ["Tested"];
  if (results_json.substitutions) {
    options.push ("Support for selection");
    options.push ("Substitutions");
  }
  if (_.size (attrs.mh_rates['DH'])) {
      options.push ("2-hit rate");
  }
  if (_.size (attrs.mh_rates['TH'])) {
      options.push ("3-hit rate");
  }
  
  return options;
}