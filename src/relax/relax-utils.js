/**
 * @module relax-utils
 * @description Utility functions for RELAX visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import * as utils from "../utils/general-utils.js";

/**
 * Extracts attributes from RELAX results JSON that are used for visualization
 *
 * @param {Object} resultsJson - The JSON object containing the RELAX results
 * @returns {Object} An object with the following attributes:
 *   - numberOfSequences {number} - The number of sequences in the alignment
 *   - numberOfSites {number} - The number of sites in the alignment
 *   - numberOfPartitions {number} - The number of partitions
 *   - testBranchCount {number} - The number of branches in the test set
 *   - referenceBranchCount {number} - The number of branches in the reference set
 *   - kValue {number|null} - The relaxation or intensification parameter (K)
 *   - pValue {number|null} - The p-value from the likelihood ratio test
 *   - likelihoodRatio {number|null} - The likelihood ratio test statistic
 *   - isIntensification {boolean} - Whether selection is intensified (K > 1) or relaxed (K < 1)
 */
export function getRelaxAttributes(resultsJson) {
    // Extract common attributes using the utility function
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // Count test and reference branches
    let testBranchCount = 0;
    let referenceBranchCount = 0;
    
    if (resultsJson.tested && resultsJson.tested[0]) {
        Object.values(resultsJson.tested[0]).forEach(branchSet => {
            if (branchSet === "Test") {
                testBranchCount++;
            } else if (branchSet === "Reference") {
                referenceBranchCount++;
            }
        });
    }
    
    // Extract RELAX-specific attributes
    let kValue = null;
    let pValue = null;
    let likelihoodRatio = null;
    let isIntensification = false;
    
    if (resultsJson["test results"]) {
        kValue = resultsJson["test results"]["relaxation or intensification parameter"];
        pValue = resultsJson["test results"]["p-value"];
        likelihoodRatio = resultsJson["test results"]["LRT"];
        isIntensification = kValue > 1;
    }
    
    return {
        numberOfSequences: commonAttrs.numberOfSequences,
        numberOfSites: commonAttrs.numberOfSites,
        numberOfPartitions: commonAttrs.numberOfPartitions,
        testBranchCount,
        referenceBranchCount,
        kValue,
        pValue,
        likelihoodRatio,
        isIntensification
    };
}

/**
 * Creates tile specifications for the RELAX results summary.
 *
 * @param {Object} resultsJson - The JSON object containing the RELAX results
 * @param {number} [pvalueThreshold=0.05] - The p-value threshold for significance
 *
 * @returns {Array} An array of tile specifications for the tile table
 */
export function getRelaxTileSpecs(resultsJson, pvalueThreshold = 0.05) {
    const attributes = getRelaxAttributes(resultsJson);
    
    // Basic tiles
    const tiles = [
        {
            number: attributes.numberOfSequences,
            description: "sequences in the alignment",
            icon: "icon-options-vertical icons",
            color: "asbestos"
        },
        {
            number: attributes.numberOfSites,
            description: "codon sites in the alignment",
            icon: "icon-options icons",
            color: "asbestos"
        },
        {
            number: attributes.numberOfPartitions,
            description: "partitions",
            icon: "icon-arrow-up icons",
            color: "asbestos"
        },
        {
            number: attributes.testBranchCount,
            description: "branches in test set",
            icon: "icon-share icons",
            color: "asbestos"
        },
        {
            number: attributes.referenceBranchCount,
            description: "branches in reference set",
            icon: "icon-share icons",
            color: "asbestos"
        }
    ];
    
    // Add RELAX-specific tiles if the test results are available
    if (attributes.kValue !== null && attributes.pValue !== null && attributes.likelihoodRatio !== null) {
        // K value tile
        tiles.push({
            number: d3.format(".2f")(attributes.kValue),
            description: "selection intensity parameter (K)",
            icon: attributes.isIntensification ? "icon-plus icons" : "icon-minus icons",
            color: "midnight_blue"
        });
        
        // p-value tile
        const isSignificant = attributes.pValue <= pvalueThreshold;
        tiles.push({
            number: attributes.pValue < 0.001 ? "< 0.001" : d3.format(".3f")(attributes.pValue),
            description: `p-value for selection ${attributes.isIntensification ? "intensification" : "relaxation"} (threshold: ${pvalueThreshold})`,
            icon: isSignificant ? "icon-check icons" : "icon-close icons",
            color: "midnight_blue"
        });
        
        // Likelihood ratio tile
        tiles.push({
            number: d3.format(".2f")(attributes.likelihoodRatio),
            description: "likelihood ratio test statistic",
            icon: "icon-chart icons",
            color: "midnight_blue"
        });
        
        // Test result tile - only show if significant
        if (isSignificant) {
            const testResult = attributes.isIntensification ? "intensification" : "relaxation";
            tiles.push({
                number: testResult,
                description: `significant selection ${testResult} detected`,
                icon: attributes.isIntensification ? "icon-plus icons" : "icon-minus icons",
                color: "midnight_blue"
            });
        }
    }
    
    return tiles;
}

/**
 * Prepares data for the model fits table.
 *
 * @param {Object} resultsJson - The JSON object containing the RELAX results
 *
 * @returns {Array} An array containing [format, results, headers] for the model fits table
 */
export function getRelaxModelFitsTableData(resultsJson) {
    const format = {
        "Model": x => x,
        "log L": d3.format(".2f"),
        "#. params": d3.format("d"),
        "AICc": d3.format(".1f"),
        "Branch set": x => x,
        "ω1": x => x,
        "ω2": x => x,
        "ω3": x => x
    };
    
    const headers = ["Model", "log L", "#. params", "AICc", "Branch set", "ω1", "ω2", "ω3"];
    const results = [];
    
    // Check if fits data is available
    if (!resultsJson.fits) {
        return [format, results, headers];
    }
    
    // Get all model fits and sort by display order if available
    const modelFits = Object.entries(resultsJson.fits)
        .filter(([key]) => key !== "Nucleotide GTR" && key !== "MG94xREV with separate rates for branch sets")
        .sort(([, a], [, b]) => {
            if (a.display_order !== undefined && b.display_order !== undefined) {
                return a.display_order - b.display_order;
            }
            if (a["display order"] !== undefined && b["display order"] !== undefined) {
                return a["display order"] - b["display order"];
            }
            return 0;
        });
    
    // Find the minimum AICc value for calculating delta AICc
    const minAICc = Math.min(
        ...modelFits.map(([, model]) => model["AIC-c"])
    );
    
    // Process each model
    modelFits.forEach(([modelName, model]) => {
        // Extract basic model information
        const logL = model["Log Likelihood"];
        const params = model["estimated parameters"];
        const aicc = model["AIC-c"];
        
        // Extract rate distributions
        const rateDistributions = model["Rate Distributions"];
        if (!rateDistributions) {
            return;
        }
        
        // Process each branch set in the rate distributions
        Object.entries(rateDistributions).forEach(([branchSet, rates]) => {
            // Skip if not a proper branch set
            if (!rates || typeof rates !== 'object') {
                return;
            }
            
            // Format omega values and proportions
            const omegas = [];
            for (let i = 0; i < 3; i++) {
                if (rates[i] && rates[i].omega !== undefined) {
                    const omega = rates[i].omega;
                    const proportion = rates[i].proportion;
                    omegas[i] = `${d3.format('.2f')(omega)} (${d3.format('.2%')(proportion)})`;
                } else {
                    omegas[i] = "N/A";
                }
            }
            
            // Add row to results
            results.push({
                "Model": modelName,
                "log L": logL,
                "#. params": params,
                "AICc": aicc,
                "Branch set": branchSet,
                "ω1": omegas[0],
                "ω2": omegas[1],
                "ω3": omegas[2]
            });
        });
    });
    
    return [format, results, headers];
}

/**
 * Prepares data for the branch attributes table.
 *
 * @param {Object} resultsJson - The JSON object containing the RELAX results
 *
 * @returns {Array} An array containing [format, results, headers] for the branch attributes table
 */
export function getRelaxBranchTableData(resultsJson) {
    const format = {
        "Branch": x => x,
        "Partition": x => x,
        "Length": d3.format(".5f"),
        "k": d3.format(".2f")
    };
    
    const headers = ["Branch", "Partition", "Length", "k"];
    const results = [];
    
    // Check if required data is available
    if (!resultsJson.tested || !resultsJson.tested[0] || !resultsJson["branch attributes"] || !resultsJson["branch attributes"][0]) {
        return [format, results, headers];
    }
    
    // Get branch partition mapping (test/reference)
    const branchPartitions = resultsJson.tested[0];
    const branchAttributes = resultsJson["branch attributes"][0];
    
    // Process each branch
    Object.entries(branchPartitions).forEach(([branchName, partition]) => {
        // Skip if not a proper branch or not in branch attributes
        if (!branchAttributes[branchName] || typeof branchAttributes[branchName] !== 'object') {
            return;
        }
        
        // Get branch length from "Nucleotide GTR" model (matches hyphy-vision)
        const branchLength = branchAttributes[branchName]["Nucleotide GTR"] || 0;
        
        // Get k value from "k (general descriptive)" field
        const kValue = branchAttributes[branchName]["k (general descriptive)"] || 0;
        
        // Add row to results
        results.push({
            "Branch": branchName,
            "Partition": partition,
            "Length": branchLength,
            "k": kValue
        });
    });
    
    // Sort results by partition and then by branch name
    results.sort((a, b) => {
        if (a.Partition === b.Partition) {
            return a.Branch.localeCompare(b.Branch);
        }
        return a.Partition === "Test" ? -1 : 1;
    });
    
    return [format, results, headers];
}

/**
 * Gets tree view options for RELAX visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the RELAX results
 * @param {boolean} includeMapping - Whether to include mapping between codon indices and partition indices
 *
 * @returns {Object} An object containing tree view options and mapping
 */
export function getRelaxTreeViewOptionsWithMapping(resultsJson, includeMapping = false) {
    // TODO: Implement tree view options for RELAX
    return {
        options: ["Test", "Reference", "All"],
        mapping: includeMapping ? {} : null
    };
}
