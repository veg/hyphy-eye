/**
 * @module slatkin-utils
 * @description Utility functions for Slatkin-Maddison visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as phylotree from "phylotree";

/**
 * Extracts some summary attributes from Slatkin-Maddison results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the Slatkin-Maddison results
 *
 * @returns {Object} An object with the following attributes:
 *   - numberOfSequences: {number} The number of sequences in the analysis (from leaf-count)
 *   - numberOfCompartments: {number} The number of compartments in the analysis
 *   - numberOfMigrations: {number} The number of migration events
 *   - replicates: {number} Number of bootstrap replicates
 *   - panmixiaPValue: {number} P-value for full panmixia test
 *   - structuredPValue: {number} P-value for structured test
 */
export function getSlatkinAttributes(resultsJson) {
    // Slatkin-specific attributes
    const numberOfSequences = resultsJson["leaf-count"] || 0;
    const numberOfCompartments = resultsJson.compartments || 0;
    const numberOfMigrations = resultsJson.migrations || 0;
    const replicates = resultsJson.replicates || 0;
    const panmixiaPValue = resultsJson["p-value"]?.panmictic || 0;
    const structuredPValue = resultsJson["p-value"]?.structured || 0;
    
    return {
        numberOfSequences,
        numberOfCompartments,
        numberOfMigrations,
        replicates,
        panmixiaPValue,
        structuredPValue
    };
}

/**
 * Returns an array of objects suitable for use in the "tileTable" visualization
 * component for Slatkin-Maddison results.
 *
 * @param {Object} resultsJson - The JSON object containing the Slatkin-Maddison results
 * @returns {Array.<Object>} An array of tile specification objects
 */
export function getSlatkinTileSpecs(resultsJson) {
    const attributes = getSlatkinAttributes(resultsJson);
    const floatFormat = d3.format(".4g");
    
    return [
        {
            number: attributes.numberOfSequences || 0,
            description: "sequences in the alignment",
            icon: "icon-options-vertical icons",
            color: "asbestos"
        },
        {
            number: attributes.numberOfCompartments || 0,
            description: "compartments",
            icon: "icon-arrow-up icons",
            color: "asbestos"
        },
        {
            number: attributes.numberOfMigrations || 0,
            description: "migration events",
            icon: "icon-target icons",
            color: "midnight_blue"
        },
        {
            number: attributes.replicates || 0,
            description: "permutations",
            icon: "icon-shuffle icons",
            color: "asbestos"
        },
        {
            number: attributes.panmixiaPValue,
            description: "p-value for compartmentalization test (full panmixia)",
            icon: "icon-calculator icons",
            color: "midnight_blue"
        }
    ];
}

/**
 * Generates migration events table data for Slatkin-Maddison results
 *
 * @param {Object} resultsJson - The JSON object containing the Slatkin-Maddison results
 * @returns {Array} An array with format, results, and headers for migration events table
 */
export function getSlatkinMigrationTableData(resultsJson) {
    const format = {
        "Node": (d) => d,
        "From": (d) => d,
        "To": (d) => d
    };
    
    const headers = ["Node", "From", "To"];
    const results = [];
    
    // Extract migration events from resultsJson.events
    // In Slatkin-Maddison, events is an object where keys are node identifiers
    // and values are objects with 'from' and 'to' properties
    if (resultsJson.events && typeof resultsJson.events === 'object') {
        Object.keys(resultsJson.events).forEach(nodeKey => {
            const event = resultsJson.events[nodeKey];
            if (event.from && event.to) {
                results.push({
                    "Node": nodeKey,
                    "From": event.from,
                    "To": event.to
                });
            }
        });
    }
    
    return [format, results, headers];
}

/**
 * Generates compartment counts table data for Slatkin-Maddison results
 *
 * @param {Object} resultsJson - The JSON object containing the Slatkin-Maddison results
 * @returns {Array} An array with format, results, and headers for compartment counts table
 */
export function getSlatkinCompartmentTableData(resultsJson) {
    const format = {
        "Compartment": (d) => d,
        "Count": d3.format("d")
    };
    
    const headers = ["Compartment", "Count"];
    const results = [];
    
    // Extract compartment counts from resultsJson["partition-counts"]
    if (resultsJson["partition-counts"]) {
        const partitionCounts = resultsJson["partition-counts"];
        
        // Convert the partition counts object to an array of objects for the table
        Object.keys(partitionCounts).forEach(compartment => {
            results.push({
                "Compartment": compartment,
                "Count": partitionCounts[compartment]
            });
        });
    }
    
    return [format, results, headers];
}

/**
 * Generate tree view options for Slatkin-Maddison visualization
 *
 * @param {Object} resultsJson - The JSON object containing the Slatkin-Maddison results
 * @returns {Array} Array of tree view options
 */
export function getSlatkinTreeViewOptions(resultsJson) {
    // Placeholder - for Slatkin there's typically just one tree
    return ["Compartmentalized tree"];
}

/**
 * Extract tree objects from Slatkin-Maddison results JSON
 * Slatkin stores trees differently than other HyPhy methods
 *
 * @param {Object} resultsJson - The JSON object containing the Slatkin-Maddison results
 * @returns {Array} Array of phylotree objects
 */
export function getSlatkinTreeObjects(resultsJson) {
    if (!resultsJson || !resultsJson.tree || !resultsJson.tree.annotated_string) {
        console.error("No tree found in Slatkin results JSON");
        return [];
    }
    
    // Get the tree string from the Slatkin-specific location
    const treeString = resultsJson.tree.annotated_string;
    
    try {
        // Create a new phylotree object with the tree string
        const T = new phylotree.phylotree(treeString);
        
        // Set branch length accessor using Slatkin's branch length format
        if (resultsJson.tree && resultsJson.tree["branch length"]) {
            // Set a direct branch length accessor that doesn't rely on the setBranchLengthAccessor helper
            T.branch_length = (n) => {
                const nodeName = n.name;
                // Return the branch length from the Slatkin-specific format
                const branchLength = resultsJson.tree["branch length"][nodeName];
                return branchLength !== undefined ? branchLength : 0;
            };
        }
        
        return [T]; // Return as array to match getTreeObjects format
    } catch (error) {
        console.error("Error creating phylotree from Slatkin tree string:", error);
        return [];
    }
}
