/**
 * @module bgm-plots
 * @description Plotting functions for BGM (Bayesian Graphical Model) visualization
 */

import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as _ from "lodash-es";
import * as phylotreeUtils from "../utils/phylotree-utils.js";

/**
 * Creates a placeholder plot for BGM visualization
 * TODO: Implement actual BGM plotting functions
 *
 * @param {Object} data - The data to plot
 * @returns {Object} A Plot object
 */
export function createBgmPlaceholderPlot(data) {
    return Plot.plot({
        title: "BGM Visualization (Coming Soon)",
        marks: [
            Plot.text([{x: 0, y: 0, text: "BGM visualization will be implemented here"}], {
                x: "x",
                y: "y",
                text: "text",
                fontSize: 16,
                textAnchor: "middle"
            })
        ],
        x: {domain: [-1, 1]},
        y: {domain: [-1, 1]}
    });
}

/**
 * Creates a tree visualization for BGM results
 *
 * @param {Object} resultsJson - The BGM results JSON
 * @param {string} selectedTree - The selected tree view option
 * @param {string} treeDim - Tree dimensions string (e.g., "1024 x 800")
 * @param {Object} treeObjects - Tree objects for phylotree
 * @returns {Object} Configured phylotree object
 */
export function getBgmTree(resultsJson, selectedTree, treeDim, treeObjects) {
    // Parse dimensions like other HyPhy methods do
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Get the tree index from the selected tree option
    const treeIndex = phylotreeUtils.getTreeId(selectedTree);
    const rawTree = treeObjects[treeIndex];
    
    // Set the branch length accessor - BGM uses a different key than other methods
    const bgmBranchLengthKey = "models.codon.MG_REV.ModelDescription";
    rawTree.branch_length_accessor = phylotreeUtils.setBranchLengthAccessor(rawTree, resultsJson, treeIndex, bgmBranchLengthKey);
    
    // Configure the tree exactly like SLAC does, removing redundant options
    const t = phylotreeUtils.configureTree(rawTree, treeDim, {
        configureBranches: (rawTree, renderedTree) => {
            const configureBranchColors = phylotreeUtils.getConfigureBranchesFn(resultsJson, {
                color_branches: "Branch Length",
                branch_length: "Branch Length",
                index: treeIndex,
                use_site_specific_support: false,
                use_turbo_color: false
            }, null);
            configureBranchColors(rawTree, renderedTree);
        },
        configureNodes: (rawTree, renderedTree) => {
            const configureNodeDisplay = phylotreeUtils.getConfigureNodesFn(
                resultsJson.tested ? resultsJson.tested[treeIndex] : {}, 
                {}, // empty node labels
                {
                    showAA: false,
                    showCodons: false,
                    showSeqNames: true,
                    showOnlyMH: false,
                    showOnlyNS: false,
                    alignTips: false
                }
            );
            configureNodeDisplay(rawTree, renderedTree);
        }
    });
    
    return t;
}
