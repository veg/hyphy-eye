/**
 * @module bgm-utils
 * @description Utility functions for BGM (Bayesian Graphical Model) visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import {html} from "htl";
import * as colors from "../color-maps/custom.js";
import * as utils from "../utils/general-utils.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";

/**
 * Extracts some summary attributes from BGM results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the BGM results
 *
 * @returns {Object} An object with the following attributes:
 *   - numberOfSequences: {number} The number of sequences in the analysis
 *   - numberOfSites: {number} The number of sites in the analysis
 *   - numberOfPartitions: {number} The number of partitions in the analysis
 */
export function getBgmAttributes(resultsJson) {
    // Extract common attributes
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // BGM-specific attributes will be added here
    // TODO: Add BGM-specific attribute extraction
    
    return {
        ...commonAttrs,
        // Add BGM-specific attributes here
    };
}

/**
 * Counts the number of co-evolving site pairs based on posterior probability threshold
 *
 * @param {Object} resultsJson - The JSON object containing the BGM results
 * @param {number} posteriorThreshold - The posterior probability threshold (default: 0.5)
 * @returns {number} The number of co-evolving site pairs
 */
export function countCoevolvingSitePairs(resultsJson, posteriorThreshold = 0.5) {
    if (!resultsJson.MLE || !resultsJson.MLE.content) {
        return 0;
    }
    
    let coevolvingPairs = 0;
    
    // Each row in MLE.content represents a site pair
    // Column index 4 is "P [Site 1 <–> Site 2]" - probability of conditional dependence
    resultsJson.MLE.content.forEach(row => {
        if (Array.isArray(row) && row.length > 4) {
            const posteriorProb = row[4]; // P [Site 1 <–> Site 2]
            if (posteriorProb >= posteriorThreshold) {
                coevolvingPairs++;
            }
        }
    });
    
    return coevolvingPairs;
}

/**
 * Returns an array of objects suitable for use in the "tileTable" visualization
 * component for BGM results.
 *
 * @param {Object} resultsJson - The JSON object containing the BGM results
 * @param {number} posteriorThreshold - The posterior probability threshold for co-evolving pairs
 * @returns {Array.<Object>} An array of tile specification objects
 */
export function getBgmTileSpecs(resultsJson, posteriorThreshold = 0.5) {
    const attributes = getBgmAttributes(resultsJson);
    const coevolvingPairs = countCoevolvingSitePairs(resultsJson, posteriorThreshold);
    
    return [
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
            number: coevolvingPairs,
            description: `co-evolving site pairs (p ≥ ${posteriorThreshold})`,
            icon: "icon-link icons",
            color: "midnight_blue"
        }
    ];
}

/**
 * Generates table data for co-evolving site pairs
 *
 * @param {Object} resultsJson - The JSON object containing the BGM results
 * @param {number} posteriorThreshold - The posterior probability threshold for filtering pairs
 * @returns {Array.<Object>} Array of objects representing co-evolving site pairs
 */
export function getBgmCoevolvingPairsTableData(resultsJson, posteriorThreshold = 0.5) {
    if (!resultsJson.MLE || !resultsJson.MLE.content) {
        return [];
    }
    
    const tableData = [];
    
    // Filter and format the data based on the posterior threshold
    resultsJson.MLE.content.forEach(row => {
        if (Array.isArray(row) && row.length >= 8) {
            const [site1, site2, prob1to2, prob2to1, probBidirectional, site1Subs, site2Subs, sharedSubs] = row;
            
            // Filter by posterior probability threshold (P [Site 1 <–> Site 2])
            if (probBidirectional >= posteriorThreshold) {
                tableData.push({
                    "Site 1": site1,
                    "Site 2": site2,
                    "P [Site 1 –> Site 2]": prob1to2.toFixed(2),
                    "P [Site 2 –> Site 1]": prob2to1.toFixed(2),
                    "P [Site 1 <–> Site 2]": probBidirectional.toFixed(2),
                    "Site 1 subs": site1Subs,
                    "Site 2 subs": site2Subs,
                    "Shared subs": sharedSubs
                });
            }
        }
    });
    
    // Sort by Site 1 (ascending)
    return tableData.sort((a, b) => a["Site 1"] - b["Site 1"]);
}

/**
 * Generates table data for model fits from BGM results
 *
 * @param {Object} resultsJson - The JSON object containing the BGM results
 * @returns {Array.<Object>} Array of objects representing model fits
 */
export function getBgmModelFitsTableData(resultsJson) {
    if (!resultsJson.fits) {
        return [];
    }
    
    const tableData = [];
    
    // Extract model fits data
    Object.entries(resultsJson.fits).forEach(([modelName, modelData]) => {
        tableData.push({
            "Model": modelName,
            "AIC-c": modelData["AIC-c"] ? modelData["AIC-c"].toFixed(2) : "N/A",
            "Log L": modelData["Log Likelihood"] ? modelData["Log Likelihood"].toFixed(2) : "N/A",
            "Parameters": modelData["estimated parameters"] || "N/A",
            "Rate distributions": modelData["Rate Distributions"] || ""
        });
    });
    
    // Sort by display order if available, otherwise by model name
    return tableData.sort((a, b) => {
        const orderA = resultsJson.fits[a.Model] ? (resultsJson.fits[a.Model]["display order"] || 0) : 0;
        const orderB = resultsJson.fits[b.Model] ? (resultsJson.fits[b.Model]["display order"] || 0) : 0;
        return orderA - orderB;
    });
}

/**
 * Gets tree view options for BGM results
 *
 * @param {Object} resultsJson - The JSON object containing the BGM results
 * @returns {Array.<string>} Array of tree view option strings
 */
export function getBgmTreeViewOptions(resultsJson) {
    return phylotreeUtils.getTreeViewOptions(resultsJson, {
        includeCodons: false // BGM doesn't typically need codon-level tree options
    });
}
