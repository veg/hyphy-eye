/**
 * @module fel-utils
 * @description Utility functions for FEL visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import {html} from "htl";
import * as colors from "../color-maps/custom.js";
import * as utils from "../utils/general-utils.js";

// TODO: this is duplicated in fel-plots.js
const COLORS = {
      'Diversifying' : colors.binary_with_gray[2],
      'Neutral' : colors.binary_with_gray[1],
      'Purifying' : colors.binary_with_gray[0],
    };

/**
 * Extracts some summary attributes from FEL results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the FEL results
 *
 * @returns {Object} An object with the following attributes:
 *   - hasSrv: {boolean} Whether site to site synonymous rate variation was
 *     included in the analysis
 *   - hasCi: {boolean} Whether profile approximate confidence intervals for
 *     site-level dN/dS ratios were computed
 *   - hasPositiveLRT: {boolean} Whether some branches had positive LRT values
 *   - hasPasmt: {boolean} Whether the LRT was computed for some partitions
 *   - numberOfSequences: {number} The number of sequences in the analysis
 *   - numberOfSites: {number} The number of sites in the analysis
 *   - numberOfPartitions: {number} The number of partitions in the analysis
 *   - testedBranchCount: {number} The median number of branches tested for
 *     selection for each partition
 *   - variableSiteCount: {number} The number of sites with dS or dN > 0
 */
export function getAttributes(resultsJson) {
    // Extract common attributes
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // FEL-specific attributes
    const hasSrv = _.chain(resultsJson.MLE.content).some((d) => _.some(d, (dd) => dd[0] > 0 && dd[0] != 1)).value();
    const hasCi = resultsJson["confidence interval"];
    const hasPositiveLRT = _.some(_.map(resultsJson.MLE.content, (d) => _.some(d, (dd) => dd[5] > 0.)));
    const hasPasmt = resultsJson.MLE["LRT"];
    const variableSiteCount = d3.sum(_.chain(resultsJson.MLE.content)
      .map((d) => _.filter(d, (dd) => dd[0] + dd[1] > 0))
      .map(d => d.length)
      .value());

    return {
        hasSrv,
        hasCi,
        hasPositiveLRT,
        hasPasmt,
        numberOfSequences: commonAttrs.numberOfSequences,
        numberOfSites: commonAttrs.numberOfSites,
        numberOfPartitions: commonAttrs.numberOfPartitions,
        testedBranchCount: commonAttrs.testedBranchCount,
        variableSiteCount
    };
}

/**
 * Returns an array of objects suitable for use in the "tileTable" visualization
 * component.  Each object has a `number` property containing a number, a
 * `description` property containing a human-readable description of the number,
 * and an `icon` property containing the name of a simple-line icon to display,
 * and a `color` property containing the name of a color to use for the number.
 *
 * @param {Object} resultsJson - The JSON object containing the FEL results
 * @param {number} pvalueThreshold - The threshold for significance
 * @returns {Array.<Object>} An array of objects with the properties described
 *   above.
 */
export function getTileSpecs(resultsJson, pvalueThreshold) {
    const felAttrs = getAttributes(resultsJson);
    const sitesTable = getSitesTable(resultsJson, pvalueThreshold);

    return [
        {number: felAttrs.numberOfSequences, description: "sequences in the alignment", icon: "icon-options-vertical icons", color: "asbestos"}, 
        {number: felAttrs.numberOfSites, description: "codon sites in the alignment", icon: "icon-options icons", color: "asbestos"}, 
        {number: felAttrs.numberOfPartitions, description: "partitions", icon: "icon-arrow-up icons", color: "asbestos"}, 
        {number: felAttrs.testedBranchCount, description: "median branches/partition used for testing", icon: "icon-share icons", color: "asbestos"}, 
        {number: felAttrs.variableSiteCount, description: "non-invariant sites tested", icon: "icon-check icons", color: "asbestos"},
        {number: resultsJson.simulated || "N/A", description: "parametric bootstrap replicates", icon: "icon-layers icons", color: "asbestos"},
        {number: _.filter (sitesTable[1], (d)=>d.class == "Diversifying").length, description: "sites under diversifying positive selection at p≤"+pvalueThreshold, icon: "icon-plus icons", color: "midnight_blue"},
        {number: _.filter (sitesTable[1], (d)=>d.class == "Purifying").length, description: "sites under purifying negative selection at p≤"+pvalueThreshold, icon: "icon-minus icons", color: "midnight_blue"}
    ]
}

/**
 * Generates a table of site-level results from the FEL analysis.
 *
 * This function processes the provided FEL results JSON object and returns an
 * array containing the formatted results table, with site-specific data,
 * formatting options, and headers. The results include site classification
 * based on the provided p-value threshold.
 *
 * @param {Object} resultsJson - The JSON object containing the FEL analysis results.
 * @param {number} pvalueThreshold - The threshold for significance, used to classify sites.
 * 
 * @returns {Array} An array with three elements:
 *   - {Object} format: A mapping of headers to formatting functions for table values.
 *   - {Array} results: An array of objects, each representing a site with its data and classification.
 *   - {Array} headers: An array of headers for the table, including the classification header.
 */
export function getSitesTable(resultsJson, pvalueThreshold) {
    const felAttrs = getAttributes(resultsJson);

    const results    = [];
    const headers  = _.clone(resultsJson.MLE.headers);
    const format = {};
    

    format [headers[0][0]]  = (d)=>d.toFixed (3);
    format [headers[1][0]]  = (d)=>d.toFixed (3);
    format [headers[2][0]]  = (d)=>d.toFixed (3);
    format [headers[3][0]]  = (d)=>d.toFixed (3);
    format [headers[4][0]]  = (d)=>d <= pvalueThreshold ? html`<b>${d.toFixed (4)}</b>` : d.toFixed (4);
    if (felAttrs.hasPasmt) {
        format[headers[headers.length-1][0]] = format [headers[4][0]];
    }
    format [headers[5][0]]  = (d)=>d.toFixed (3);
    headers.push (["class","Site classification at p<=" + pvalueThreshold]); 
    format["class"] = (d)=>html`<span style = "color:${COLORS[d]}">${d}</span>`;
  
    _.each (resultsJson.MLE.content, (data, part)=> {
        const siteLookup = resultsJson["data partitions"][part].coverage[0];
        _.each (data, (row, i)=> {
              let rowObject = {
                  'partition' : (+part) + 1,
                  'codon' : siteLookup [i] + 1
              };  
              rowObject[headers[0][0]] = +row[0];
              rowObject[headers[1][0]] = +row[1];
              rowObject[headers[2][0]] = +row[2];
              rowObject[headers[3][0]] = +row[3];
              rowObject[headers[4][0]] = +row[4];
              if (felAttrs.hasPositiveLRT) {
                  rowObject[headers[5][0]] = +row[5];
              }
              if (felAttrs.hasCi) {
                  rowObject[headers[6][0]] = row[6];
                  rowObject[headers[7][0]] = row[7];
                  rowObject[headers[8][0]] = row[8];
              }
              if (felAttrs.hasPasmt) {
                  rowObject [headers[headers.length-2][0]] = row[ headers.length-2];
              }
              rowObject[headers[headers.length-1][0]] = row[4] <= pvalueThreshold ? (row[0] < row[1] ? "Diversifying" : "Purifying") : (row[0] + row[1] ? "Neutral" : "Invariable");
              results.push (rowObject);
        });
       
        
    });
    return [format, results, headers];
}
