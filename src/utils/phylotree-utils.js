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
 * @param {boolean} only_leaves - Whether to include only leaf nodes in the ordering.
 * 
 * @returns {string[]} An array of node names in the computed ordering.
 */
export function treeNodeOrdering(results_json, tree_objects, index, root, only_leaves) {
    let order = [];
    if (root) {order.push ('root');}
    const T = tree_objects[index];
    function sortNodes (asc) {
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
    sortNodes (true);
    T.traverse_and_compute (function (n) {
        if (results_json.tested[index][n.data.name] == "test" && (!only_leaves || _.isUndefined (n.children))) {
          order.push (n.data.name);
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
        T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name][modelForTree];
        return T;
    });

    return tree_objects;
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