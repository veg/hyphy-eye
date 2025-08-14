/**
 * @module slatkin-plots
 * @description Plotting functions for Slatkin-Maddison visualization
 */

import * as d3 from "d3";
import * as _ from "lodash-es";
import {html} from "htl";
import * as phylotreeUtils from "../utils/phylotree-utils.js";

/**
 * Creates a phylogenetic tree visualization for Slatkin-Maddison results
 * 
 * @param {Object} resultsJson - The JSON object containing the Slatkin-Maddison results
 * @param {string} selectedTree - The selected tree option
 * @param {string} treeDim - Tree dimensions (e.g., "1024 x 800")
 * @param {Array} treeObjects - Array of tree objects
 * @returns {Object} Phylotree object for rendering
 */
export function getSlatkinTree(resultsJson, selectedTree, treeDim, treeObjects) {
    // Parse dimensions like other HyPhy methods do
    let dim = treeDim && treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Get the tree object - Slatkin typically has only one tree
    const treeObject = treeObjects[0];
    
    if (!treeObject) {
        console.error("No tree object available for Slatkin visualization");
        return {
            show: () => html`<div class="alert alert-danger">No tree available</div>`
        };
    }
    
    // Auto-scale based on number of leaves if dimensions not provided
    if (!dim) {
        const leafCount = phylotreeUtils.seqNames(treeObject).length;
        dim = [Math.max(500, leafCount * 20), 1024]; // [height, width]
    }
    
    // Create a mapping of compartments to colors for tree visualization
    const partitions = resultsJson.partitions || {};
    const compartmentColorMap = {};
    const partScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Map each compartment to a color
    Object.keys(partitions).forEach((compartment, index) => {
        compartmentColorMap[compartment] = partScale(index);
    });

    // Helper function to check if a node belongs to a compartment
    const isNodeInCompartment = (nodeName, compartment) => {
        if (!partitions[compartment]) return false;
        
        // Check if node name exists as a value in the compartment object
        return Object.values(partitions[compartment]).includes(nodeName);
    };

    // Configure the tree with Slatkin-specific settings
    const tree = phylotreeUtils.configureTree(treeObject, treeDim, {
        height: dim[0] || 800,
        width: dim[1] || 1024,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 5, // Increase node size to make colors visible
        configureBranches: (rawTree, renderedTree) => {
            // Use default branch styling
            renderedTree.style_edges((element, data) => {
                element
                    .style("stroke", "#555")
                    .style("stroke-width", "2px")
                    .style("stroke-linejoin", "round")
                    .style("stroke-linecap", "round");
            });
        },
        configureNodes: (rawTree, renderedTree) => {
            // Configure nodes based on compartment membership
            renderedTree.style_nodes((element, data) => {
                // Find compartment for this node
                const nodeName = data.data.name;
                let nodeCompartment = null;
                
                // Check which compartment this node belongs to
                if (nodeName) {
                    for (const compartment of Object.keys(partitions)) {
                        if (isNodeInCompartment(nodeName, compartment)) {
                            nodeCompartment = compartment;
                            break;
                        }
                    }
                }
                
                // Set node color based on compartment
                let color = "black"; // Default color
                if (nodeCompartment && compartmentColorMap[nodeCompartment]) {
                    color = compartmentColorMap[nodeCompartment];
                }
                element.style("fill", color);
            });
        }
    });
    
    return tree;
}