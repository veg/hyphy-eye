import * as utils from "./absrel-utils.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as plotUtils from "../utils/plot-utils.js";
import * as beads from "../components/bead-plot.js";
import * as heat from "../components/posteriors-heatmap.js";
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

export function getPlotDescription(plot_type) {
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
export function getPlotOptions(srv_rate_classes, srv_distribution, bsPositiveSelection, profileBranchSites) {
    const plot_options = [
        ["Synonymous rates", (d)=>srv_rate_classes > 0 && srv_distribution], 
        ["Support for positive selection", (d)=>bsPositiveSelection.length > 0],
        ["Evidence ratio alignment profile", (d)=>profileBranchSites.length > 0]
    ]

    return plot_options;
}

/**
 * Returns a Vega-Lite spec for a plot of the specified type.
 *
 * @param {string} plot_type - The type of plot to generate.
 * @param {Object} results_json - The JSON object containing the aBSREL results
 * @param {array} fig1data - The data object containing the site-level results of interest
 * @param {array} bsPositiveSelection - a thing
 * @param {array} profileBranchSites - profiles of branch sites
 * @param {array<string>} branch_order - display order of branches in tree
 * @param {string} fig1_controls - user input for what figure 1 should display
 * @returns {Object} The Vega-Lite spec for the specified plot type
 */
export function getPlotSpec(
  plot_type, 
  results_json, 
  fig1data, 
  bsPositiveSelection, 
  profileBranchSites,
  branch_order,
  fig1_controls
) { 
  // TODO: can we update the input to handle this?
  var size_field = "subs";
  switch (fig1_controls) {
    case "Syn subs":
      size_field = "syn_subs";
      break;
    case "Nonsyn subs":
      size_field = "nonsyn_subs";
      break;
  }
  
  const plot_specs = ({
        "Synonymous rates" : {
            "width": 800, "height": 150, 
            "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
            return beads.BeadPlot(
              fig1data, 
              d, 
              70, 
              "SRV posterior mean", 
              false,
              DYN_RANGE_CAP
            )
        })},
        "Support for positive selection" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], plotUtils.er_step_size(results_json)), (d)=> {
            return heat.PosteriorsHeatmap(
              bsPositiveSelection, 
              d, 
              plotUtils.er_step_size(results_json),
              branch_order,
              size_field,
              "EBF"
            )
        })},
        "Evidence ratio alignment profile" : {
            "vconcat" : _.map (_.range (1, results_json.input["number of sites"], plotUtils.er_step_size(results_json)), (d)=> {
            return heat.PosteriorsHeatmap(
              profileBranchSites, 
              d, 
              plotUtils.er_step_size(results_json),
              branch_order,
              size_field
            )
        })}
    });

    return plot_specs[plot_type];
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
export function displayTree(results_json, index, T, options, ev_threshold, treeDim, treeLabels, branch_length, color_branches) {
      const attrs = utils.getAttributes(results_json, ev_threshold)
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
      

      phylotreeUtils.addSvgDefs (t.svg);
  
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
                    phylotreeUtils.add_branch_label (e, b_string, t.font_size, t.svg.selectAll (".phylotree-container"));
               }
            });
        } else {
            let labels;
            switch (color_branches) {
              case "Substitutions" : {  
                labels = phylotreeUtils.subs_by_branch(results_json, index);
                 t.color_scale_title = "Min # of nucleotide substitutions";
                } 
                break;
              case "2-hit rate" : {  
                 labels = _.mapValues (attrs.mhRates["DH"], d=>d.toFixed (2));
                 t.color_scale_title = "Double-nucleotide relative substitution rate (δ)";
                } 
                break;
              case "3-hit rate" : {  
                 labels = _.mapValues (attrs.mhRates["TH"], d=>d.toFixed (2));
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
                    phylotreeUtils.add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
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
export function displayTree_site(results_json, index, T,s,options, ev_threshold, treeDim, treeLabels, branch_length, color_branches, partition_sizes) {
    const attrs = utils.getAttributes(results_json, ev_threshold);
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    
    T.branch_length_accessor = (n)=>results_json["branch attributes"][index][n.data.name][branch_length] || 0;  
    let node_labels = phylotreeUtils.generateNodeLabels (T, results_json["substitutions"][index][(+s)-1]);
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

      
      phylotreeUtils.addSvgDefs (t.svg);
      extended_labels = phylotreeUtils.displayTree_handle_neighbors(index,s,node_labels,T,options,results_json, partition_sizes[index]);
  
  
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
                 labels = _.mapValues (attrs.mhRates["DH"], (d)=>d.toFixed(2));
                 t.color_scale_title = "Double-nucleotide relative substitution rate (δ)";
                } 
                break;
              case "3-hit rate" : {  
                 labels = _.mapValues (attrs.mhRates["TH"], (d)=>d.toFixed(2));
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
                    phylotreeUtils.add_branch_label (e, ts, t.font_size, t.svg.selectAll (".phylotree-container"));
                   }
               } else {
                  e.style ("stroke", null); 
               }
             } else {
                 e.style ("stroke", t.color_scale(is_tested)).style ("stroke-width", "4").style ("opacity","1"); 
                 if (options["branch-labels"]) {
                    phylotreeUtils.add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
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

export function treeColorOptions(results_json, ev_threshold) {
  const attrs = utils.getAttributes(results_json, ev_threshold);

  let options = ["Tested"];
  if (results_json.substitutions) {
    options.push ("Support for selection");
    options.push ("Substitutions");
  }
  if (_.size (attrs.mhRates['DH'])) {
      options.push ("2-hit rate");
  }
  if (_.size (attrs.mhRates['TH'])) {
      options.push ("3-hit rate");
  }
  
  return options;
}