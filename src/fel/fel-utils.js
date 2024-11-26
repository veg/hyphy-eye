/**
 * @module fel-utils
 * @description Utility functions for FEL visualization
 */

import * as _ from "npm:lodash-es";
import * as d3 from "npm:d3";

/**
 * Extracts some summary attributes from FEL results that are used later in the
 * visualization.
 *
 * @param {Object} results_json - The JSON object containing the FEL results
 *
 * @returns {Object} An object with the following attributes:
 *   - has_srv: {boolean} Whether site to site synonymous rate variation was
 *     included in the analysis
 *   - has_ci: {boolean} Whether profile approximate confidence intervals for
 *     site-level dN/dS ratios were computed
 *   - has_T: {boolean} Whether some branches had positive LRT values
 *   - has_pasmt: {boolean} Whether the LRT was computed for some partitions
 *   - tested_branch_count: {number} The median number of branches tested for
 *     selection for each partition
 *   - variable_site_count: {number} The number of sites with dS or dN > 0
 */
export function get_attributes(results_json) {
    const has_srv = _.chain(results_json.MLE.content).some ((d)=>_.some (d,(dd)=>dd[0] > 0 && dd[0] != 1)).value()
    const has_ci = results_json ["confidence interval"]
    const has_T = _.some (_.map (results_json.MLE.content, (d)=>_.some(d, (dd)=>dd[5] > 0.)))
    const has_pasmt = results_json.MLE["LRT"]
    const number_sequences = results_json.input["number of sequences"]
    const number_sites = results_json.input["number of sites"]
    const number_partitions = results_json.input["partition count"]
    const tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map ((d)=>_.map (d, (dd)=>_.filter (dd, ddd=>ddd == "test"))).map ((d)=>d.length).value())
    const variable_site_count = d3.sum(_.chain (results_json.MLE.content).map ((d)=>_.filter (d, (dd)=>dd[0]+dd[1] > 0)).map (d=>d.length).value())

    return {has_srv, has_ci, has_T, has_pasmt, number_sequences, number_sites, number_partitions, tested_branch_count, variable_site_count}
}

/**
 * Returns an array of objects suitable for use in the "tileTable" visualization
 * component.  Each object has a `number` property containing a number, a
 * `description` property containing a human-readable description of the number,
 * and an `icon` property containing the name of a simple-line icon to display,
 * and a `color` property containing the name of a color to use for the number.
 *
 * @param {Object} results_json - The JSON object containing the FEL results
 * @param {number} pvalue_threshold - The threshold for significance
 * @returns {Array.<Object>} An array of objects with the properties described
 *   above.
 */
export function get_tile_specs(results_json, pvalue_threshold) {
    const fel_attrs = get_attributes(results_json);
    const sites_table = get_sites_table(results_json, pvalue_threshold);

    return [
        {number: fel_attrs.number_sequences, description: "sequences in the alignment", icon: "icon-options-vertical icons", color: "asbestos"}, 
        {number: fel_attrs.number_sites, description: "codon sites in the alignment", icon: "icon-options icons", color: "asbestos"}, 
        {number: fel_attrs.number_partitions, description: "partitions", icon: "icon-arrow-up icons", color: "asbestos"}, 
        {number: fel_attrs.tested_branch_count, description: "median branches/partition used for testing", icon: "icon-share icons", color: "asbestos"}, 
        {number: fel_attrs.variable_site_count, description: "non-invariant sites tested", icon: "icon-check icons", color: "asbestos"},
        {number: results_json.simulated || "N/A", description: "parametric bootstrap replicates", icon: "icon-layers icons", color: "asbestos"},
        {number: _.filter (sites_table[1], (d)=>d.class == "Diversifying").length, description: "sites under diversifying positive selection at p≤"+pvalue_threshold, icon: "icon-plus icons", color: "midnight_blue"},
        {number: _.filter (sites_table[1], (d)=>d.class == "Purifying").length, description: "sites under purifying negative selection at p≤"+pvalue_threshold, icon: "icon-minus icons", color: "midnight_blue"}
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
 * @param {Object} results_json - The JSON object containing the FEL analysis results.
 * @param {number} pvalue_threshold - The threshold for significance, used to classify sites.
 * 
 * @returns {Array} An array with three elements:
 *   - {Object} format: A mapping of headers to formatting functions for table values.
 *   - {Array} results: An array of objects, each representing a site with its data and classification.
 *   - {Array} headers: An array of headers for the table, including the classification header.
 */
export function get_sites_table(results_json, pvalue_threshold) {
    const fel_attrs = get_attributes(results_json);

    const results    = [];
    const headers  = _.clone(results_json.MLE.headers);
    const format = {};
    

    format [headers[0][0]]  = (d)=>d.toFixed (3);
    format [headers[1][0]]  = (d)=>d.toFixed (3);
    format [headers[2][0]]  = (d)=>d.toFixed (3);
    format [headers[3][0]]  = (d)=>d.toFixed (3);
    format [headers[4][0]]  = (d)=>d <= pvalue_threshold ? '<b>${d.toFixed (4)}</b>' : d.toFixed (4);
    if (fel_attrs.has_pasmt) {
        format[headers[headers.length-1][0]] = format [headers[4][0]];
    }
    format [headers[5][0]]  = (d)=>d.toFixed (3);
    headers.push (["class","Site classification at p<=" + pvalue_threshold]); 
    format["class"] = (d)=>'<span style = "color:${COLORS[d]}">${d}</span>';
  
    _.each (results_json.MLE.content, (data, part)=> {
        const site_lookup = results_json["data partitions"][part].coverage[0];
        _.each (data, (row, i)=> {
              let row_object = {
                  'partition' : (+part) + 1,
                  'codon' : site_lookup [i] + 1
              };  
              row_object[headers[0][0]] = +row[0];
              row_object[headers[1][0]] = +row[1];
              row_object[headers[2][0]] = +row[2];
              row_object[headers[3][0]] = +row[3];
              row_object[headers[4][0]] = +row[4];
              if (fel_attrs.has_T) {
                  row_object[headers[5][0]] = +row[5];
              }
              if (fel_attrs.has_ci) {
                  row_object[headers[6][0]] = row[6];
                  row_object[headers[7][0]] = row[7];
                  row_object[headers[8][0]] = row[8];
              }
              if (fel_attrs.has_pasmt) {
                  row_object [headers[headers.length-2][0]] = row[ headers.length-2];
              }
              row_object[headers[headers.length-1][0]] = row[4] <= pvalue_threshold ? (row[0] < row[1] ? "Diversifying" : "Purifying") : (row[0] + row[1] ? "Neutral" : "Invariable");
              results.push (row_object);
        });
       
        
    });
    return [format, results, headers];
}
