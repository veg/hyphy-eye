import * as d3 from "d3";
import * as _ from "lodash-es";
import * as utils from "../utils/general-utils.js";

const floatFormat = d3.format (".4g")

/**
 * Extracts some summary attributes from GARD results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the GARD results
 *
 * @returns {Object} An object with the following attributes:
 *   - stages: {number} The number of stages in the GARD analysis
 *   - numberOfSequences: {number} The number of sequences in the alignment
 *   - numberOfSites: {number} The number of sites in the alignment
 *   - numberOfPartitions: {number} The number of partitions in the analysis
 *   - potentialBreakpoints: {number} The number of potential breakpoints
 *   - modelsConsidered: {number} The total number of models considered
 *   - deltaAICcBaseline: {string} The difference in AICc between the baseline model and the best model
 *   - deltaAICcSingle: {string} The difference in AICc between the single tree model and the best model
 *   - caicImprovements: {Array} An array of objects containing the cumulative AICc improvements
 *   - breakpointsProfile: {Array} An array of objects containing the breakpoint coordinates
 *   - siteSupport: {Array} An array of objects containing the site support for each breakpoint
 */
export function getAttributes(resultsJson) {
    // Extract common attributes
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // GARD-specific attributes
    const stages = _.size(resultsJson.improvements);
    const potentialBreakpoints = resultsJson.potentialBreakpoints;
    const modelsConsidered = resultsJson.totalModelCount;
    const deltaAICcBaseline = floatFormat(resultsJson.baselineScore - resultsJson.bestModelAICc);
    const deltaAICcSingle = floatFormat(resultsJson.singleTreeAICc - resultsJson.bestModelAICc);
    const caicImprovements = getCaicImprovements(resultsJson);
    const breakpointsProfile = getGardBreakpoints(resultsJson);
    const siteSupport = _.chain(resultsJson["siteBreakPointSupport"])
        .toPairs()
        .map((d) => {
            return {'bp': +d[0], 'support': d[1]};
        })
        .value();

    return {
        stages,
        numberOfSequences: commonAttrs.numberOfSequences,
        numberOfSites: commonAttrs.numberOfSites,
        numberOfPartitions: commonAttrs.numberOfPartitions,
        potentialBreakpoints,
        modelsConsidered,
        deltaAICcBaseline,
        deltaAICcSingle,
        caicImprovements,
        breakpointsProfile,
        siteSupport
    };
}

/**
 * Takes a GARD results JSON object and returns an array of objects containing
 * the breakpoint coordinates and the number of models the breakpoint is
 * associated with.
 *
 * @param {Object} resultsJson - The JSON object containing the GARD results
 * @returns {Object[]} An array of objects containing the breakpoint coordinates
 *                     and the number of models the breakpoint is associated with.
 */
function getGardBreakpoints(resultsJson) {
  let bp = {};
  return _.chain(resultsJson.improvements).map((d) => {
      return _.map(d.breakpoints, (b) => {
          if (!bp[b[0]]) bp[b[0]] = [];
          bp[b[0]].push(d.breakpoints.length);
          return {'bp': b[0], 'model': d.breakpoints.length};
      });
  }).flatten().each((d) => d.span = d3.max(bp[d.bp]) - d3.min(bp[d.bp])).value();
}

/**
 * Computes cumulative AICc improvements from the improvements data in the
 * results JSON. Adjusts the deltaAICc value for each improvement stage after
 * the first stage if it exceeds the initial improvement's deltaAICc. The
 * adjustments are accumulated over stages.
 *
 * @param {Object} resultsJson - The JSON object containing the improvements
 *     data with deltaAICc values and breakpoints.
 * @returns {Array<Object>} An array of objects for each improvement stage,
 *     each containing:
 *     - bp: {number} The number of breakpoints in the stage.
 *     - daic: {number} The adjusted deltaAICc value for the stage.
 */
function getCaicImprovements(resultsJson) {
    let accumulator = 0;
    return _.map(resultsJson['improvements'], (d, i) => {
        let delta = d.deltaAICc;
        if (i > 0 && d.deltaAICc > resultsJson['improvements'][0].deltaAICc) {
            delta = delta - accumulator;
        }
        accumulator += delta;
        return {'bp': d.breakpoints.length, 'daic': delta};
    });
}

export function getTileSpecs(resultsJson) {
    const attrs = getAttributes(resultsJson)

    // TODO: turn into an array of objects
    // will be used to populate the tile table
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
        {
            "number": attrs.potentialBreakpoints,
            "description": "potential breakpoints",
            "icon": "icon-arrow-up icons",
            "color": "asbestos",
        },
        {
            "number": attrs.stages,
            "description": "inferred breakpoints",
            "icon": "icon-location-pin icons",
            "color": "asbestos",
        },
        {
            "number": attrs.modelsConsidered,
            "description": "models considered",
            "icon": "icon-info icons",
            "color": "asbestos",
        },
        {
            "number": attrs.deltaAICcBaseline,
            "description": "c-AIC vs the null model",
            "icon": "icon-graph icons",
            "color": "asbestos",
        },
        {
            "number": attrs.deltaAICcSingle,
            "description": "c-AIC vs the single tree multiple partition",
            "icon": "icon-graph icons",
            "color": "asbestos",
        }
    ]

    return tileTableInputs;
}