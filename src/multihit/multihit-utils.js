import * as d3 from "d3";
import * as _ from "lodash-es";
import * as utils from "../utils/general-utils.js";

/**
 * Extracts some summary attributes from Multihit results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the Multihit results
 *
 * @returns {Object} An object with the following attributes:
 *   - numberOfSequences: {number} The number of sequences in the alignment
 *   - numberOfSites: {number} The number of sites in the alignment
 *   - stages: {number} The number of stages in the analysis
 *   - evidenceRatios: {Array} An array of objects containing evidence ratios for each site
 *   - siteLogLikelihood: {Array} An array of objects containing site log likelihoods
 *   - timers: {Array} An array of objects containing timing information for each model
 *   - numberOfPartitions: {number} The number of partitions in the analysis
 *   - partitionSizes: {Array} Array of sizes for each partition
 */
export function getMultihitAttributes(resultsJson) {
    // Extract common attributes
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // Multihit-specific attributes
    const stages = _.size(resultsJson.improvements);
    const evidenceRatios = Object.entries(resultsJson["Evidence Ratios"])
        .flatMap(([k, d]) => d[0].map((x, i) => ({ model: k, site: i, er: x })));
    const siteLogLikelihood = Object.entries(resultsJson["Site Log Likelihood"])
        .flatMap(([k, d]) => d[0].map((x, i) => ({ model: k, site: i, siteLogLikelihood: x })));
    const timers = Object.entries(resultsJson["timers"])
        .map(([k, d]) => ({ model: k, time: d.timer }));

    return {
        numberOfSequences: commonAttrs.numberOfSequences,
        numberOfSites: commonAttrs.numberOfSites,
        stages,
        evidenceRatios,
        siteLogLikelihood,
        timers,
        numberOfPartitions: commonAttrs.numberOfPartitions,
        partitionSizes: commonAttrs.partitionSizes
    };
}

/**
 * Generates tile specifications for the Multihit visualization dashboard
 * 
 * @param {Object} resultsJson - The JSON object containing the Multihit results
 * @returns {Array} An array of objects containing specifications for dashboard tiles
 */
export function getMultihitTileSpecs(resultsJson) {
    const attrs = getMultihitAttributes(resultsJson);

    const tileTableInputs = [
        {
            "number": attrs.numberOfSequences,
            "description": "sequences in the alignment",
            "icon": "icon-options-vertical icons",
            "color": "asbestos",
        },
        {
            "number": attrs.numberOfSites,
            "description": "sites in the alignment",
            "icon": "icon-options icons",
            "color": "asbestos",
        },
    ];

    return tileTableInputs;
}