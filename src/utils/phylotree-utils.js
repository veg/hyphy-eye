// TODO: if we need these so often, do we need to do work in phylotree??

import * as d3 from "d3";
import * as _ from "lodash-es";
import * as parse_svg from "parse-svg-path";
import * as utils from "./general-utils.js";
import * as phylotree from "phylotree";

/**
 * Computes a set of labels for each node in a tree.
 *
 * @param {PhyloTree} T - The tree.
 * @param {Object.<string,string>} labels - A mapping of node names to their labels (as strings of length 3).
 * @return {Object.<string,array>} - A mapping of node names to their labels, with the value being an array
 *  of [label, translation, parent label, number of substitutions].  Substitutions are only counted between
 *  non-ambiguous, non-degenerate codons.
 */
export function generateNodeLabels(T, labels) {
    let L = {};
    T.traverse_and_compute(function (n) {
        if (n.data.name in labels) {
            L[n.data.name] = [labels[n.data.name], utils.translateAmbiguousCodon(labels[n.data.name]),'',0];
            if (n.parent) {
                L[n.data.name][2] = L[n.parent.data.name][0];             
                _.each (L[n.data.name][0], (c,i)=> {
                    const c2 = L[n.data.name][2][i];
                    if (c2 != c && c != '-' && c2 != '-' && c != 'N' && c2 != 'N') {
                        L[n.data.name][3] ++;
                    }
                });
            }
        } else {
            if (n.parent) {
                L[n.data.name] = _.clone (L[n.parent.data.name]);
                L[n.data.name][2] = L[n.data.name][0];
                L[n.data.name][3] = 0;
            } else {
                L['root'] = [labels["root"], utils.translateAmbiguousCodon(labels["root"]), "", 0];
            }
        }
        L[n.data.name][4] = !_.isUndefined (n.children);
    },"pre-order");
    return L;
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
export function addSvgDefs(svg) {
    let filter = svg.selectAll ("defs").append ("filter").attr ("x", 0).attr ("y", 0).attr ("width", 1).attr ("height", 1).attr ("id", "tree_branchlabel_bgfill");
    filter.append ("feFlood").attr ("flood-color", "lightgray");
    filter.append ("feComposite").attr ("in", "SourceGraphic").attr ("operator", "atop");
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
export function addBranchLabel(e, text, font_size, container) {
  const where2 = _.get (parse_svg.default(e.attr("d")),["1"]);
  if (where2 && (text.length || _.isNumber (text))) {
      let my_id = e.attr ("id");
      if (!e.attr ("id")) {
          my_id = utils.uid("absrel_tree");
          e.attr ("id", my_id);
      }
      let branch_label = container.selectAll ("text[label-for='" + my_id + "']").data ([text]).join ("text").attr ("label-for", my_id).text ((d)=>d).classed ("absrel-branch-labels",true).attr ("x", where2[1]).attr ("y", where2[2]).attr ("font-size", font_size * 0.8).attr ("dx","0.5em").attr ("dy", "-0.4em").style ("font-family", "ui-monospace");
      branch_label.attr ("filter","url(#tree_branchlabel_bgfill)");
  }
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
export function displayTreeHandleNeighbors(index, s, node_labels, T, options, results, site_count) {
    let extended_labels = {};
    if (options["neighbors"]) {
        const si = (+s)-1;
        let joint_labels = [];
        for (let idx = si-4; idx <= si+4; idx++) {
            if (idx >= 0 && idx < site_count) {
                if (idx != si) {
                    joint_labels.push (generateNodeLabels (T, results["substitutions"][index][idx]));
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
 * Computes the number of substitutions for each branch, excluding the root,
 * based on the substitutions data for a given index.
 *
 * @param {Object} results_json - hyphy results json 
 * @param {number} i - The index of the substitutions data in the results JSON.
 * 
 * @returns {Object} An object where keys are branch names and values are the
 * count of substitutions for each branch.
 */

export function subsByBranch(results_json, i) {
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
 * Compute a depth-first ordering of tree nodes.
 * 
 * This function computes a depth-first ordering of tree nodes by traversing the tree
 * and computing the maximum depth of each node, then sorting the nodes by their maximum depth.
 * The root node comes first, followed by the nodes in a depth-first ordering. The ordering includes
 * only those nodes that are tested and excludes the root node if `root` is false.
 * 
 * @param {Object} rawTree - The raw phylotree object
 * @param {Object} tested - The tested object containing branch testing information
 * @param {boolean} root - Whether to include the root node in the ordering
 * @param {boolean} only_leaves - Whether to include only leaf nodes in the ordering
 * @returns {string[]} An array of node names in the computed ordering
 */
export function treeNodeOrdering(rawTree, tested, root, only_leaves) {
    let order = [];
    if (root) { order.push('root'); }
    
    function sortNodes(asc) {
        rawTree.traverse_and_compute(function (n) {
            var d = 1;
            if (n.children && n.children.length) {
                d += d3.max(n.children, function (d) { return d["count_depth"]; });
            }
            n["count_depth"] = d;
        });
        rawTree.resortChildren(function (a, b) {
            return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
        });
    }
    sortNodes(true);
    
    rawTree.traverse_and_compute(function (n) {
        if (tested[n.data.name] === "test" && (!only_leaves || _.isUndefined(n.children))) {
            order.push(n.data.name);
        }
    });
    
    return order;
}

/**
 * Compute the total length of a tree.
 * @param {Object} tree - a phylotree object
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
 * Extracts a list of sequence names (i.e., names of the tips) from a phylogenetic tree.
 * 
 * @param {Object} tree - A phylotree object which represents a phylogenetic tree.
 * @return {Array<String>} An array containing the names of the tip sequences in the tree.
 */

export function seqNames(tree) {
    let seq_names = [];
    tree.traverse_and_compute (n=>{
        if (n.children && n.children.length) return;
        seq_names.push (n.data.name);
    });
    
    return seq_names;
};

/**
 * Extracts a set of names of the direct children of the root node in a phylogenetic tree.
 * 
 * @param {Object} tree - A phylotree object which represents a phylogenetic tree.
 * @return {Set<String>} A set containing the names of the direct children of the root node.
 */

export function rootChildren(tree) {
  let rt = new Set();
  tree.traverse_and_compute ((n)=> {
    if (n.parent && !n.parent.parent) {
        rt.add (n.data.name);
    }
  });
  return rt;
}

/**
 * Returns an array of strings representing the tree view options for the
 * given results JSON object. The options depend on the number
 * of partitions and whether substitutions data is available.
 * 
 * @param {Object} resultsJson - The results JSON object containing tree data.
 * @param {Object} options - Configuration options.
 * @param {boolean} [options.onlyWithSubstitutions=false] - If true, only include codons with substitutions.
 * @param {boolean} [options.includeMapping=false] - If true, return a mapping between codon indices and partition indices.
 * @param {boolean} [options.includeCodons=true] - If false, only include partition options, no codons.
 * 
 * @returns {Array|Array[]} If includeMapping is false, returns an array of strings representing 
 * the tree view options. If includeMapping is true, returns an array containing both the options 
 * array and a mapping object.
 */
export function getTreeViewOptions(resultsJson, options = {}) {
  const treeObjects = getTreeObjects(resultsJson);
  const onlyWithSubstitutions = options.onlyWithSubstitutions || false;
  const includeMapping = options.includeMapping || false;
  const includeCodons = options.includeCodons !== false; // Default to true
  
  let opts = [];
  let codonIdxToPartIdx = {};
  
  // Add partition options based on number of partitions
  if (treeObjects.length === 1) {
    opts.push("Alignment-wide tree");
  } else {
    opts = opts.concat(_.map(_.range(1, treeObjects.length + 1), (d) => "Partition " + d));
  }
  
  // Add codon options if substitutions data exists and includeCodons is true
  if (resultsJson.substitutions && includeCodons) {
    if (onlyWithSubstitutions) {
      // Only include codons with substitutions
      let offset = 0;
      _.each(resultsJson.substitutions, (sites, partition) => {
        _.each(sites, (subs, site) => {
          if (subs) {
            let idx = ((+site) + 1 + offset);
            codonIdxToPartIdx[idx] = [partition, (+site) + 1];
            opts.push("Codon " + idx);
          }
        });
        
        // Calculate offset based on partition coverage
        if (resultsJson["data partitions"] && 
            resultsJson["data partitions"][partition] && 
            resultsJson["data partitions"][partition].coverage) {
          offset += resultsJson["data partitions"][partition].coverage[0].length;
        }
      });
    } else {
      // Include all codons
      opts = opts.concat(_.map(_.range(1, resultsJson.input["number of sites"] + 1), (d) => "Codon " + d));
    }
  }
  
  return includeMapping ? [opts, codonIdxToPartIdx] : opts;
}

/**
 * Constructs an array of phylotree objects from the provided results JSON,
 * each with a branch length accessor set according to the specified model.
 *
 * @param {Object} results_json - The JSON object containing input trees and
 * branch attributes for each tree.
 * @param {string} modelForTree - The model name used to access the branch
 * length attributes for each tree. Defaults to "Global MG94xREV".
 * 
 * @returns {Array<phylotree.phylotree>} An array of phylotree objects with
 * branch length accessors set.
 */

export function getTreeObjects(results_json, modelForTree = "Global MG94xREV") {
    const tree_objects = _.map (results_json.input.trees, (tree,i)=> {
        let T = new phylotree.phylotree (tree);
        T.branch_length_accessor = setBranchLengthAccessor(T, results_json, i, modelForTree);
        return T;
    });

    return tree_objects;
}

/**
 * Sets the branch length accessor for a tree based on the results JSON and branch length key.
 * 
 * @param {Object} tree - The phylotree object
 * @param {Object} resultsJson - The results JSON object containing branch attributes
 * @param {number} index - The index of the tree in the results
 * @param {string} branchLengthKey - The key to use for branch lengths
 * @returns {Function} - The branch length accessor function
 */
export function setBranchLengthAccessor(tree, resultsJson, index, branchLengthKey) {
    return (n) => {
        const branchAttributes = resultsJson["branch attributes"][index];
        return (n.data.name in branchAttributes ? branchAttributes[n.data.name][branchLengthKey] : 0) || 0;
    };
}

/**
 * Parses a selected tree view option and returns a 0-based index.
 * For options like 'Partition X' or 'Codon Y', returns (parsed number - 1).
 * For 'Alignment-wide tree', returns 0.
 * 
 * @param {string} option - The selected tree view option
 * @returns {number} The 0-based index
 */
export function getTreeId(option) {
  if (option === 'Alignment-wide tree') {
    return 0;
  }
  
  // Extract number from strings like 'Partition 1' or 'Codon 3'
  const match = option.match(/\d+/);
  return match ? parseInt(match[0], 10) - 1 : 0;
}

/**
 * Configures node display and labeling for a phylogenetic tree.
 * 
 * This helper function provides a flexible way to configure tree visualization
 * by allowing users to provide custom functions that work directly with the tree object.
 * 
 * @param {Object} nodeLabels - Object mapping node names to their labels
 * @param {Object} options - Configuration options
 * @param {Object} tested - The object containing branch testing information. Subset of resultsJson.
 * @returns {Function} - A function that configures the tree
 */
export function getConfigureNodesFn(tested, nodeLabels, options) {
    const {
        showAA = false,
        showCodons = false,
        showSeqNames = false,
        showOnlyMH = false,
        showOnlyNS = false,
        alignTips = false
    } = options;

    return (rawTree, renderedTree) => {
        // Set up node display
        renderedTree.show_internal_names = showSeqNames;
        renderedTree.show_leaf_names = showSeqNames;

        // Get node ordering
        const ordering = treeNodeOrdering(rawTree, tested, false, false);
        
        // Set up node labels
        if (nodeLabels) {
            renderedTree.style_nodes((e, n) => {
                let label = "";
                let has_extended_label = nodeLabels[n.data.name];

                n.data.color_on = "";
                
                if (showCodons) {
                    label = has_extended_label[0];
                    n.data.color_on = nodeLabels[n.data.name][0];
                    if (showAA) label += "/";
                }
                
                if (showAA) {
                    label += has_extended_label[1];
                }

                if (showSeqNames) {
                    label += ":" + n.data.name;
                }

                e.selectAll("text").text(label);
                e.selectAll("title").data([n.data.name]).join("title").text((d) => d);
            });
        }

        // Configure node display based on options
        rawTree.traverse_and_compute((n) => {
            n._display_me = !(showOnlyMH || showOnlyNS);
            
            if (!n._display_me && nodeLabels[n.data.name]) {
                if (showOnlyMH && nodeLabels[n.data.name][3] > 1) {
                    n._display_me = true;
                }
                if (!n._display_me && showOnlyNS) {
                    if (n.parent) {
                        const my_aa = nodeLabels[n.data.name][1];
                        const parent_aa = nodeLabels[n.parent.data.name][1];
                        if (my_aa != parent_aa && my_aa != '-' && parent_aa != '-') {
                            n._display_me = true;
                            if (showOnlyMH) n._display_me = nodeLabels[n.data.name][3] > 1;
                        } else {
                            n._display_me = false;
                        }
                    }
                }
            }
            if (n._display_me && n.parent) {
                n.parent._display_me = true;
            }
        }, "pre-order");

        // Sort nodes by depth
        function sort_nodes(asc) {
            rawTree.traverse_and_compute((n) => {
                let d = 1;
                if (n.children && n.children.length) {
                    d += d3.max(n.children, (d) => d["count_depth"]);
                }
                n["count_depth"] = d;
            });
            rawTree.resortChildren((a, b) => (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1));
        }

        sort_nodes(true);
    };
}

/**
 * Configures branch styling and labeling for a tree visualization.
 * @param {Object} params - Additional parameters specific to the method
 * @param {Object} params.color_branches - The type of branch coloring to apply
 * @param {Object} params.branch_length - The branch length type
 * @param {Object} params.index - The index of the current partition/site
 * @param {Object} params.s - The site index (for site-specific visualizations)
 * @param {Object} params.has_error_sink - Whether error sink is present (for BUSTED)
 * @param {boolean} params.use_error_sink - Whether to support error sink
 * @param {boolean} params.use_site_specific_support - Whether to use site-specific support calculation
 * @param {boolean} params.use_turbo_color - Whether to use turbo color scale instead of PuOr
 * @param {Object} params.test_omega - The object with omega rate classes and weights
 * @param {Object} results - The results object containing branch attributes
 * @returns {Function} - A function that configures the tree
 */
export function getConfigureBranchesFn(results, params, options) {
    const {
        color_branches,
        index,
        s,
        has_error_sink,
        use_error_sink = false,  // Whether to support error sink
        use_site_specific_support = false,  // Whether to use site-specific support calculation
        use_turbo_color = false,  // Whether to use turbo color scale instead of PuOr,
        node_labels = null,
        add_branch_labels = false,
        use_omega_support = false,
        test_omega
    } = params;

    // TODO: decide if the test_* utils should be defined here or in the methods
    // Configure branch colors
    return (rawTree, renderedTree) => {
        if (color_branches === "Tested") {
            configureTestedBranches(results, index, renderedTree);
        } else if (color_branches === "Support for selection" || (color_branches === "Error-sink support" && use_error_sink)) {
            configureSupportBranches(results, index, rawTree, renderedTree, {
                es: color_branches === "Error-sink support",
                rate_class: test_omega?.length - 1 + (has_error_sink ? 1 : 0),
                prior: test_omega?.[test_omega?.length-1]?.weight,
                use_turbo_color,
                use_site_specific_support,
                s,
                add_branch_labels,
                use_omega_support
            });
        } else if (color_branches === "Substitutions") {
            configureSubstitutionBranches(results, index, renderedTree, {
                use_site_specific_support,
                node_labels,
                add_branch_labels,
                s
            });
        }
    };
}

/**
 * Configures branch colors for tested branches.
 * @param {Object} results - The results object containing branch attributes
 * @param {number} index - The index of the current partition/site
 * @param {Object} renderedTree - The rendered tree object
 */
export function configureTestedBranches(results, index, renderedTree) {
    renderedTree.style_edges((e, n) => {
        const is_tested = results["tested"][index][n.target.data.name] === "test";
        if (is_tested) {
            e.style("stroke", "firebrick")
                .style("stroke-width", "5")
                .style("opacity", 1.0);
        } else {
            e.style("stroke", null)
                .style("opacity", 0.25);
        }
    });
}

/**
 * Configures branch colors for support calculations.
 * @param {Object} results - The results object containing branch attributes
 * @param {number} index - The index of the current partition/site
 * @param {Object} rawTree - The raw tree object
 * @param {Object} renderedTree - The rendered tree object
 * @param {Object} params - Configuration parameters
 * @param {boolean} params.es - Whether to use error sink support
 * @param {number} params.rate_class - The rate class to use
 * @param {number} params.prior - The prior value
 * @param {boolean} params.use_turbo_color - Whether to use turbo color scale
 * @param {boolean} params.use_site_specific_support - Whether to use site-specific support
 * @param {number} params.s - The site index
 * @param {boolean} params.use_omega_support - Whether to use omega values as support
 * @param {boolean} params.add_branch_labels - Whether to add branch labels
 */
export function configureSupportBranches(results, index, rawTree, renderedTree, params) {
    const {
        es,
        rate_class,
        prior,
        use_turbo_color,
        use_site_specific_support,
        s,
        add_branch_labels,
        use_omega_support
    } = params;

    const branch_values = {};
    const branch_gradients = {};
    let bID = 0;
    let max_omega_by_branch = {};

    let color_scale;

    if (use_omega_support) {
        
        // Omega-based support calculation
        rawTree.traverse_and_compute((n) => {
            const test_omega = utils.getRateDistributionByBranch(results, n.data.name);
            console.log(test_omega);
            if (test_omega) {
                const rate_class = test_omega.length - 1;
                branch_values[n.data.name] = test_omega[rate_class].value;
                
                // Use diverging log scale for omega values
                color_scale = d3.scaleDivergingLog(
                    [1e-4, 1, Math.min(1000, d3.max(_.map(branch_values, (d) => d)))],
                    ["rgb(0,0,255)", "rgb(128,128,128)", "rgb(255,0,0)"]
                );

                // Create gradient for this branch
                branch_gradients[n.data.name] = "hyphy_phylo_branch_gradient_" + bID;
                bID += 1;
                
                // Create gradient definition
                const gradient_def = renderedTree.svg.selectAll("defs")
                    .append("linearGradient")
                    .attr("id", branch_gradients[n.data.name]);

                let current_frac = 0;
                _.each(test_omega, (t) => {
                    gradient_def.append("stop")
                        .attr("offset", current_frac * 100 + "%")
                        .style("stop-color", color_scale(t.value));
                    
                    current_frac += t.weight;
                    gradient_def.append("stop")
                        .attr("offset", current_frac * 100 + "%")
                        .style("stop-color", color_scale(t.value));
                });
                
                max_omega_by_branch[n.data.name] = test_omega[rate_class];
            }
        });

        renderedTree.color_scale = color_scale;
        renderedTree.color_scale_title = "ω";

        renderedTree.style_edges((e, n) => {
            const is_tested = results["tested"][index][n.target.data.name] === "test";
            let t_string = n.target.data.name + " ";
            let b_string = "";
        
            if (is_tested) {
                const test_pv = utils.getBranchPvalue(results, n.target.data.name);
                const pv_l = test_pv ? test_pv : 0;
                t_string += "(p = " + pv_l.toFixed(3) + ")";
            
                if (pv_l > 0) {
                    const log_p = -Math.floor(Math.log10(Math.max(pv_l, 1e-6)));
                    const mxo = max_omega_by_branch[n.target.data.name]?.value;
                
                    if (mxo && mxo > 1) {
                        const formatted_mxo = mxo > 1000 ? ">1000" : mxo.toFixed(2);
                        b_string = formatted_mxo + "/" + 
                                  (max_omega_by_branch[n.target.data.name].weight * 100).toFixed(2) + "%";
                    }
                
                    e.style("stroke", use_omega_support ? 
                        "url('#" + branch_gradients[n.target.data.name] + "')" : 
                        color_scale(branch_values[n.target.data.name])
                    ).style("stroke-width", 2 + log_p);
                }
            } else {
                t_string += "(not tested)";
                e.style("stroke", use_omega_support ? 
                    "url('#" + branch_gradients[n.target.data.name] + "')" : 
                    color_scale(branch_values[n.target.data.name])
                ).style("stroke-width", "2").style("opacity", "0.5");
            }

            t_string += " max ω = " + (branch_values[n.target.data.name] || 0).toFixed(2);
            e.style("stroke-linejoin", "round").style("stroke-linecap", "round");
            e.selectAll("title").data([t_string]).join("title").text((d) => d);
            
            if (add_branch_labels) {
                addBranchLabel(e, b_string, renderedTree.font_size, 
                    renderedTree.svg.selectAll(".phylotree-container"));
            }
        });

    } else {
        // Empirical Bayes Factor support calculation
        rawTree.traverse_and_compute((n) => {
            const posteriors = results["branch attributes"][index][n.data.name];
            if (posteriors && rate_class) {
                const support = use_site_specific_support 
                    ? posteriors["Posterior prob omega class by site"][rate_class][s-1]
                    : posteriors["Posterior prob omega class"][rate_class];
                branch_values[n.data.name] = support / (1 - support) / prior;
                if (branch_values[n.data.name] < 1) branch_values[n.data.name] = null;
            }
        });

        color_scale = d3.scaleSequentialLog(
            d3.extent(_.map(branch_values, (d) => d)),
            use_turbo_color ? d3.interpolateTurbo : d3.interpolatePuOr
        );
        
        renderedTree.color_scale = color_scale;
        renderedTree.color_scale_title = "Empirical Bayes Factor";
    }
}

/**
 * Configures branch colors for substitutions.
 * @param {Object} results - The results object containing branch attributes
 * @param {number} index - The index of the current partition/site
 * @param {Object} renderedTree - The rendered tree object
 * @param {Object} params - Configuration parameters
 * @param {boolean} params.use_site_specific_support - Whether to use site-specific support
 * @param {Object} params.node_labels - Node labels for substitutions
 * @param {boolean} params.add_branch_labels - Whether to add branch labels
 * @param {number} params.s - The site index (for site-specific visualizations)
 */
export function configureSubstitutionBranches(results, index, renderedTree, params) {
    let labels = params.node_labels === null ? params.use_site_specific_support 
        ? results["substitutions"][index][params.s-1]
        : subsByBranch(results, index) : params.node_labels;

    let color_scale = d3.scaleSequential(
        d3.extent(_.map(labels, d => d)),
        d3.interpolateTurbo
    );
    renderedTree.color_scale = color_scale;
    renderedTree.color_scale_title = "Min # of nucleotide substitutions";

    renderedTree.style_edges((e, n) => {
        const is_tested = labels[n.target.data.name];
        if (is_tested) {
            e.style("stroke", color_scale(is_tested))
                .style("stroke-width", "5")
                .style("opacity", 1.0);
            e.selectAll("title").data([is_tested]).join("title").text((d) => d);
            if (params.add_branch_labels) {
                addBranchLabel(e, is_tested, renderedTree.font_size, renderedTree.svg.selectAll(".phylotree-container"));
            }
        }
    });
}

/**
 * Configures and renders a phylogenetic tree with customizable options.
 * 
 * This helper function provides a flexible way to configure tree visualization
 * by allowing users to provide custom functions that work directly with the tree object.
 * 
 * @param {Object} rawTree - The raw phylotree object
 * @param {string} treeDim - A string in the format "width x height" specifying the tree dimensions
 * @param {Object} [options] - Optional configuration options
 * @param {Function} [options.configureNodes] - Function to configure node display and colors
 * @param {Function} [options.configureBranches] - Function to configure branch colors and shading
 * @param {Object} [options.styleOptions] - Additional style options for the tree
 * @returns {phylotree.phylotree} - The configured and rendered tree object
 */
export function configureTree(rawTree, treeDim, options = {}) {
    // Parse tree dimensions
    const dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;

    // Configure basic tree rendering
    const renderedTree = rawTree.render({
        height: dim && dim[0],
        width: dim && dim[1],
        'align-tips': options['align-tips'] || false,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        'internal-names': options['internal-names'] || false,
        'selectable': false
    });

    // Add SVG definitions for branch labels
    addSvgDefs(renderedTree.svg);

    // Configure branches if provided
    if (options.configureBranches) {
        options.configureBranches(rawTree, renderedTree);
    }

    // Configure node display if provided
    if (options.configureNodes) {
        options.configureNodes(rawTree, renderedTree);
    }

    // Update tree layout
    renderedTree.placenodes();
    renderedTree.update();

    return renderedTree;
}