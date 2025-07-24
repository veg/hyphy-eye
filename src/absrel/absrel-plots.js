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

export function getAbsrelPlotDescription(plot_type) {
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
export function getAbsrelPlotOptions(srv_rate_classes, srv_distribution, bsPositiveSelection, profileBranchSites) {
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
export function getAbsrelPlotSpec(
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
 console.log("bsPositiveSelection", bsPositiveSelection) 
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
export function getAbsrelTree(results_json, index, T, options, ev_threshold, treeDim, treeLabels, branch_length, color_branches) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Set the branch length accessor
    T.branch_length_accessor = (n) => (n.data.name in results_json["branch attributes"][index] ? results_json["branch attributes"][index][n.data.name][branch_length] : 0) || 0;
    
    // Configure the tree using the helper
    const t = phylotreeUtils.configureTree(T, treeDim, {
        height: dim && dim[0],
        width: dim && dim[1],
        'align-tips': treeLabels.indexOf("align tips") >= 0,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        'internal-names': treeLabels.indexOf("show internal") >= 0,
        configureBranches: (rawTree, renderedTree) => {
            phylotreeUtils.getConfigureBranchesFn(results_json, {
                color_branches: color_branches,
                branch_length: branch_length,
                index: index,
                use_site_specific_support: false,
                use_turbo_color: false,
                add_branch_labels: true,
                use_omega_support: true
            }, options)(rawTree, renderedTree);
        },
        configureNodeDisplay: (rawTree, renderedTree) => {
            const node_labels = phylotreeUtils.generateNodeLabels(T, results_json["substitutions"][index][0]);
            phylotreeUtils.getConfigureNodesFn(results_json.tested[index], node_labels, {
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

/**
 * Render a tree with the given options, and return the
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
 * @param {Array} partition_sizes - partition sizes
 * @return {object} - the rendered tree
 */
export function getAbsrelTreeSite(results_json, index, T, s, options, ev_threshold, treeDim, treeLabels, branch_length, color_branches, partition_sizes) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Set the branch length accessor
    T.branch_length_accessor = (n) => (n.data.name in results_json["branch attributes"][index] ? results_json["branch attributes"][index][n.data.name][branch_length] : 0) || 0;
    
    const node_labels = phylotreeUtils.generateNodeLabels(T, results_json["substitutions"][index][s-1]);

    let showAA = treeLabels.indexOf("amino-acids") >= 0;
    let showCodons = treeLabels.indexOf("codons") >= 0;
    let showSeqNames = treeLabels.indexOf("sequence names") >= 0;
    let showOnlyMH = treeLabels.indexOf("show only multiple hits") >= 0;
    let showOnlyNS = treeLabels.indexOf("show only non-synonymous changes") >= 0;
    let alignTips = treeLabels.indexOf("align tips") >= 0;

    let extended_labels = phylotreeUtils.displayTreeHandleNeighbors(index, s, node_labels, T, options, results_json, partition_sizes.length);
    
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
            phylotreeUtils.getConfigureBranchesFn(results_json, {
                color_branches: color_branches,
                branch_length: branch_length,
                index: index,
                use_site_specific_support: true,
                use_turbo_color: false,
                node_labels: extended_labels,
                add_branch_labels: true,
                use_omega_support: true
            }, options)(rawTree, renderedTree);
        },
        configureNodeDisplay: (rawTree, renderedTree) => {
            phylotreeUtils.getConfigureNodesFn(results_json.tested[index], extended_labels, {
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

export function getAbsrelTreeColorOptions(results_json, ev_threshold) {
  const attrs = utils.getAbsrelAttributes(results_json, ev_threshold);

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