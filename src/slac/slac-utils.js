/**
 * @module slac-utils
 * @description Utility functions for SLAC visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import {html} from "htl";
import * as colors from "../color-maps/custom.js";
import * as utils from "../utils/general-utils.js";

const DEFAULT_AMBIGUITY_HANDLING = "AVERAGED";

/**
 * Extracts some summary attributes from SLAC results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the SLAC results
 *
 * @returns {Object} An object with the following attributes:
 *   - hasCi: {boolean} Whether confidence intervals are available
 *   - numberOfSequences: {number} The number of sequences in the analysis
 *   - numberOfSites: {number} The number of sites in the analysis
 *   - numberOfPartitions: {number} The number of partitions in the analysis
 *   - variableSiteCount: {number} The number of sites with dS or dN > 0
 *   - ambiguityOptions: {Array} Available ambiguity handling options
 */
export function getSlacAttributes(resultsJson) {
    // Extract common attributes
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // SLAC-specific attributes
    const hasCi = !!(resultsJson.sample25 && resultsJson.sampleMedian && resultsJson.sample975);
    
    // Get ambiguity handling options from the actual by-site data structure
    let ambiguityOptions = [DEFAULT_AMBIGUITY_HANDLING];
    if (resultsJson.MLE && resultsJson.MLE.content) {
        // Look at the first partition to get available ambiguity handling options
        const firstPartitionKey = Object.keys(resultsJson.MLE.content)[0];
        if (firstPartitionKey && resultsJson.MLE.content[firstPartitionKey]["by-site"]) {
            ambiguityOptions = Object.keys(resultsJson.MLE.content[firstPartitionKey]["by-site"]);
        }
    }
    
    // Count variable sites (sites with dS or dN > 0)
    let variableSiteCount = 0;
    if (resultsJson.MLE && resultsJson.MLE[DEFAULT_AMBIGUITY_HANDLING]) {
        Object.values(resultsJson.MLE[DEFAULT_AMBIGUITY_HANDLING]).forEach(partition => {
            if (Array.isArray(partition)) {
                partition.forEach(site => {
                    if (Array.isArray(site) && site.length >= 3) {
                        const [dS, dN] = site;
                        if (dS > 0 || dN > 0) {
                            variableSiteCount++;
                        }
                    }
                });
            }
        });
    }
    
    return {
        ...commonAttrs,
        hasCi,
        ambiguityOptions,
        variableSiteCount
    };
}

/**
 * Returns an array of objects suitable for use in the "tileTable" visualization
 * component for SLAC results.
 *
 * @param {Object} resultsJson - The JSON object containing the SLAC results
 * @param {number} pvalueThreshold - The threshold for significance
 * @returns {Array.<Object>} An array of tile specification objects
 */
export function getSlacTileSpecs(resultsJson, pvalueThreshold = 0.1) {
    const attributes = getSlacAttributes(resultsJson);
    
    // Count significant sites
    let significantSites = 0;
    let positivelySeletedSites = 0;
    let negativelySelectedSites = 0;
    
    if (resultsJson.MLE && resultsJson.MLE.content) {
        Object.values(resultsJson.MLE.content).forEach(partition => {
            if (partition["by-site"] && partition["by-site"][DEFAULT_AMBIGUITY_HANDLING]) {
                partition["by-site"][DEFAULT_AMBIGUITY_HANDLING].forEach(site => {
                    if (Array.isArray(site) && site.length >= 10) {
                        // Index 8: p-value for positive selection
                        // Index 9: p-value for negative selection
                        const positivePValue = site[8];
                        const negativePValue = site[9];
                        
                        if (positivePValue <= pvalueThreshold) {
                            positivelySeletedSites++;
                            significantSites++;
                        } else if (negativePValue <= pvalueThreshold) {
                            negativelySelectedSites++;
                            significantSites++;
                        }
                    }
                });
            }
        });
    }
    
    return [
        {
            number: attributes.numberOfSequences,
            description: "sequences",
            icon: "icon-people",
            color: "asbestos"
        },
        {
            number: attributes.numberOfSites,
            description: "sites",
            icon: "icon-grid",
            color: "asbestos"
        },
        {
            number: attributes.numberOfPartitions,
            description: "partitions",
            icon: "icon-layers",
            color: "asbestos"
        },
        {
            number: significantSites,
            description: `significant sites (p ≤ ${pvalueThreshold})`,
            icon: "icon-target",
            color: "midnight_blue"
        },
        {
            number: positivelySeletedSites,
            description: "positively selected sites",
            icon: "icon-arrow-up",
            color: "midnight_blue"
        },
        {
            number: negativelySelectedSites,
            description: "negatively selected sites",
            icon: "icon-arrow-down",
            color: "midnight_blue"
        }
    ];
}

/**
 * Generates a table of site-level results from the SLAC analysis.
 *
 * @param {Object} resultsJson - The JSON object containing the SLAC analysis results
 * @param {number} pvalueThreshold - The threshold for significance
 * @param {string} ambiguityHandling - How to handle ambiguous codons
 * @returns {Array} An array with format, results, and headers
 */
export function getSlacSiteTableData(resultsJson, pvalueThreshold = 0.1, ambiguityHandling = DEFAULT_AMBIGUITY_HANDLING) {
    const format = {
        "Site": d3.format("d"),
        "Partition": d3.format("d"),
        "dS": d3.format(".4f"),
        "dN": d3.format(".4f"),
        "dN/dS": d3.format(".4f"),
        "dN-dS": d3.format(".4f"),
        "Positive P-value": d3.format(".4f"),
        "Negative P-value": d3.format(".4f"),
        "Classification": (d) => d
    };
    
    const headers = ["Site", "Partition", "dS", "dN", "dN/dS", "dN-dS", "Positive P-value", "Negative P-value", "Classification"];
    const results = [];
    
    if (!resultsJson.MLE || !resultsJson.MLE.content) {
        return [format, results, headers];
    }
    
    let siteIndex = 1;
    Object.entries(resultsJson.MLE.content).forEach(([partitionKey, partition]) => {
        const partitionIndex = parseInt(partitionKey);
        
        if (partition["by-site"] && partition["by-site"][ambiguityHandling]) {
            partition["by-site"][ambiguityHandling].forEach(site => {
                if (Array.isArray(site) && site.length >= 10) {
                    // Based on SLAC JSON headers:
                    // Index 5: dS (Inferred synonymous substitution rate)
                    // Index 6: dN (Inferred non-synonymous substitution rate)  
                    // Index 8: P [dN/dS > 1] (Positive selection p-value)
                    // Index 9: P [dN/dS < 1] (Negative selection p-value)
                    const dS = site[5];
                    const dN = site[6];
                    const dNdS = dS > 0 ? dN / dS : 0; // Calculate dN/dS ratio
                    const dNminusdS = site[7] != null ? site[7] : 0; // dN-dS from JSON with null check
                    const positivePValue = site[8];
                    const negativePValue = site[9];
                    
                    let classification = "Neutral";
                    if (positivePValue <= pvalueThreshold) {
                        classification = "Positive";
                    } else if (negativePValue <= pvalueThreshold) {
                        classification = "Negative";
                    }
                    
                    results.push({
                        "Site": siteIndex,
                        "Partition": partitionIndex,
                        "dS": dS,
                        "dN": dN,
                        "dN/dS": dNdS,
                        "dN-dS": dNminusdS,
                        "Positive P-value": positivePValue,
                        "Negative P-value": negativePValue,
                        "Classification": classification
                    });
                    
                    siteIndex++;
                }
            });
        }
    });
    
    return [format, results, headers];
}

/**
 * Prepares data for scatter plots from SLAC results
 *
 * @param {Object} resultsJson - The JSON object containing the SLAC results
 * @param {string} xAxis - The x-axis variable name
 * @param {Array} yAxes - Array of y-axis variable names
 * @param {string} ambiguityHandling - How to handle ambiguous codons
 * @returns {Object} Plot data with x and y arrays
 */
export function getSlacPlotData(resultsJson, xAxis = "Site", yAxes = ["dN/dS"], ambiguityHandling = DEFAULT_AMBIGUITY_HANDLING) {
    const plotData = {
        x: [],
        y: yAxes.map(() => [])
    };
    
    if (!resultsJson.MLE || !resultsJson.MLE.content) {
        return plotData;
    }
    
    let siteIndex = 1;
    Object.values(resultsJson.MLE.content).forEach(partition => {
        if (partition["by-site"] && partition["by-site"][ambiguityHandling]) {
            partition["by-site"][ambiguityHandling].forEach(site => {
                if (Array.isArray(site) && site.length >= 10) {
                    // Based on SLAC JSON headers:
                    // Index 5: dS (Inferred synonymous substitution rate)
                    // Index 6: dN (Inferred non-synonymous substitution rate)  
                    // Index 8: P [dN/dS > 1] (Positive selection p-value)
                    // Index 9: P [dN/dS < 1] (Negative selection p-value)
                    const dS = site[5];
                    const dN = site[6];
                    const dNdS = dS > 0 ? dN / dS : 0; // Calculate dN/dS ratio
                    const dNminusdS = site[7] != null ? site[7] : 0; // dN-dS from JSON with null check
                    const positivePValue = site[8];
                    const negativePValue = site[9];
                    
                    // Add x-axis value
                    if (xAxis === "Site") {
                        plotData.x.push(siteIndex);
                    } else if (xAxis === "dS") {
                        plotData.x.push(dS);
                    } else if (xAxis === "dN") {
                        plotData.x.push(dN);
                    } else if (xAxis === "dN-dS") {
                        plotData.x.push(dNminusdS);
                    }
                    
                    // Add y-axis values
                    yAxes.forEach((yAxis, i) => {
                        if (yAxis === "dN/dS") {
                            plotData.y[i].push(dNdS);
                        } else if (yAxis === "dS") {
                            plotData.y[i].push(dS);
                        } else if (yAxis === "dN") {
                            plotData.y[i].push(dN);
                        } else if (yAxis === "dN-dS") {
                            plotData.y[i].push(dNminusdS);
                        } else if (yAxis === "Positive P-value") {
                            plotData.y[i].push(positivePValue);
                        } else if (yAxis === "Negative P-value") {
                            plotData.y[i].push(negativePValue);
                        }
                    });
                    
                    siteIndex++;
                }
            });
        }
    });
    
    return plotData;
}

/**
 * Counts sites by classification for SLAC results
 *
 * @param {Object} resultsJson - The JSON object containing the SLAC results
 * @param {number} pvalueThreshold - The threshold for significance
 * @param {string} ambiguityHandling - How to handle ambiguous codons
 * @returns {Object} Counts of different site classifications
 */
export function countSlacSites(resultsJson, pvalueThreshold = 0.1, ambiguityHandling = DEFAULT_AMBIGUITY_HANDLING) {
    const counts = {
        total: 0,
        significant: 0,
        positive: 0,
        negative: 0,
        neutral: 0
    };
    
    if (!resultsJson.MLE || !resultsJson.MLE.content) {
        return counts;
    }
    
    Object.values(resultsJson.MLE.content).forEach(partition => {
        if (partition["by-site"] && partition["by-site"][ambiguityHandling]) {
            partition["by-site"][ambiguityHandling].forEach(site => {
                if (Array.isArray(site) && site.length >= 10) {
                    const positivePValue = site[8];
                    const negativePValue = site[9];
                    counts.total++;
                    
                    if (positivePValue <= pvalueThreshold) {
                        counts.significant++;
                        counts.positive++;
                    } else if (negativePValue <= pvalueThreshold) {
                        counts.significant++;
                        counts.negative++;
                    } else {
                        counts.neutral++;
                    }
                }
            });
        }
    });
    
    return counts;
}

/**
 * Generates partition information table data for SLAC results
 * Following hyphy-vision's DatamonkeyPartitionTable structure exactly
 *
 * @param {Object} resultsJson - The JSON object containing the SLAC results
 * @param {number} pvalueThreshold - The threshold for significance
 * @param {string} ambiguityHandling - How to handle ambiguous codons
 * @returns {Array} An array with format, results, and headers for partition table
 */
export function getSlacPartitionTableData(resultsJson, pvalueThreshold = 0.1, ambiguityHandling = DEFAULT_AMBIGUITY_HANDLING) {
    const format = {
        "Partition": d3.format("d"),
        "Sites": d3.format("d"),
        "Branches Tested": d3.format("d"),
        "Branches Total": d3.format("d"),
        "Branch Length Tested": d3.format(".3r"),
        "Branch Length % of Total": d3.format(".3%"),
        "Branch Length Total": d3.format(".3r"),
        "Positive": d3.format("d"),
        "Negative": d3.format("d")
    };
    
    const headers = [
        "Partition", "Sites", "Branches Tested", "Branches Total", 
        "Branch Length Tested", "Branch Length % of Total", "Branch Length Total",
        "Positive", "Negative"
    ];
    const results = [];
    
    // Check for required data structures
    if (!resultsJson.MLE || !resultsJson.MLE.content || !resultsJson["data partitions"]) {
        return [format, results, headers];
    }
    
    // Iterate through data partitions (like hyphy-vision does)
    Object.entries(resultsJson["data partitions"]).forEach(([partitionKey, partitionInfo]) => {
        const partitionIndex = parseInt(partitionKey) + 1; // 1-based indexing like hyphy-vision
        
        // Check if this partition has MLE results
        if (!resultsJson.MLE.content[partitionKey] || 
            !resultsJson.MLE.content[partitionKey]["by-site"] ||
            !resultsJson.MLE.content[partitionKey]["by-site"][ambiguityHandling]) {
            return;
        }
        
        const sites = resultsJson.MLE.content[partitionKey]["by-site"][ambiguityHandling];
        const coverage = partitionInfo.coverage ? partitionInfo.coverage[0] : [];
        
        // Calculate sites count (from coverage like hyphy-vision)
        const totalSites = coverage.length;
        
        // Calculate branch information following hyphy-vision's approach
        let branchesTotal = 0;
        let branchesTested = 0;
        let branchLengthTested = 0;
        let branchLengthTotal = 0;
        
        // Get branch attributes for this partition
        if (resultsJson["branch attributes"] && resultsJson["branch attributes"][partitionKey]) {
            const branchAttrs = resultsJson["branch attributes"][partitionKey];
            const testedBranches = resultsJson.tested && resultsJson.tested[partitionKey] ? 
                resultsJson.tested[partitionKey] : {};
            
            // Count total branches and calculate lengths
            Object.entries(branchAttrs).forEach(([branchName, branchData]) => {
                branchesTotal++;
                const branchLength = branchData["Global MG94xREV"] || 0;
                branchLengthTotal += branchLength;
                
                // Check if this branch is tested (following hyphy-vision's case logic)
                if (testedBranches[branchName.toUpperCase()] === "test") {
                    branchesTested++;
                    branchLengthTested += branchLength;
                }
            });
            
        }
        
        // Count positive and negative sites
        let positiveSites = 0;
        let negativeSites = 0;
        
        sites.forEach(site => {
            if (Array.isArray(site) && site.length >= 10) {
                const positivePValue = site[8];  // Index 8: positive selection p-value
                const negativePValue = site[9];  // Index 9: negative selection p-value
                
                if (positivePValue <= pvalueThreshold) {
                    positiveSites++;
                } else if (negativePValue <= pvalueThreshold) {
                    negativeSites++;
                }
            }
        });
        
        results.push({
            "Partition": partitionIndex,
            "Sites": totalSites,
            "Branches Tested": branchesTested,
            "Branches Total": branchesTotal,
            "Branch Length Tested": branchLengthTested,
            "Branch Length % of Total": branchLengthTotal > 0 ? branchLengthTested / branchLengthTotal : 0,
            "Branch Length Total": branchLengthTotal,
            "Positive": positiveSites,
            "Negative": negativeSites
        });
    });
    
    return [format, results, headers];
}

/**
 * Generates model fits table data for SLAC results
 * 
 * @param {Object} resultsJson - The JSON object containing the SLAC results
 * @returns {Array} An array with format, results, and headers for model fits table
 */
export function getSlacModelFitsTableData(resultsJson) {
    const format = {
        "Model": (d) => d,
        "AIC-c": d3.format(".2f"),
        "Log L": d3.format(".2f"),
        "Parameters": d3.format("d"),
        "Rate Distributions": (d) => d
    };
    
    const headers = ["Model", "AIC-c", "Log L", "Parameters", "Rate Distributions"];
    const results = [];
    
    if (!resultsJson.fits) {
        return [format, results, headers];
    }
    
    // Process each model in the fits section
    Object.entries(resultsJson.fits).forEach(([modelName, modelData]) => {
        let rateDistributions = "";
        
        // Format rate distributions based on model type
        if (modelData["Rate Distributions"]) {
            const rateDist = modelData["Rate Distributions"];
            
            if (modelName === "Global MG94xREV") {
                // For MG94xREV, show the non-synonymous/synonymous ratio
                const testRatio = rateDist["non-synonymous/synonymous rate ratio for *test*"];
                if (testRatio && testRatio.length > 0) {
                    const ratio = testRatio[0][0];
                    const weight = testRatio[0][1];
                    rateDistributions = `non-synonymous/synonymous rate ratio for *test*\n${(weight * 100).toFixed(0)}% @ ${ratio.toFixed(3)}`;
                }
            }
        }
        
        results.push({
            "Model": modelName,
            "AIC-c": modelData["AIC-c"] || 0,
            "Log L": modelData["Log Likelihood"] || 0,
            "Parameters": modelData["estimated parameters"] || 0,
            "Rate Distributions": rateDistributions
        });
    });
    
    // Sort by display order if available
    results.sort((a, b) => {
        const aOrder = resultsJson.fits[a.Model] ? resultsJson.fits[a.Model]["display order"] : 999;
        const bOrder = resultsJson.fits[b.Model] ? resultsJson.fits[b.Model]["display order"] : 999;
        return aOrder - bOrder;
    });
    
    return [format, results, headers];
}

/**
 * Generate tree view options for SLAC with codon-to-partition mapping
 * This function provides both the tree view options and the mapping needed
 * for correct partition selection when switching between trees.
 *
 * @param {Object} resultsJson - The JSON object containing the SLAC results
 * @param {Object} options - Options for tree view generation
 * @param {boolean} [options.includeCodons=true] - Whether to include codon options
 * @returns {Array} Array containing [treeViewOptions, codonToPartitionMapping]
 */
export function getSlacTreeViewOptionsWithMapping(resultsJson, options = {}) {
    const includeCodons = options.includeCodons !== false; // Default to true
    let opts = [];
    let codonIdxToPartIdx = {};
    
    // Add partition options
    const partitions = Object.keys(resultsJson.MLE?.content || {});
    if (partitions.length === 1) {
        opts.push("Alignment-wide tree");
    } else {
        opts = opts.concat(partitions.map((_, i) => `Partition ${i + 1}`));
    }
    
    // Add codon options if requested and data is available
    if (includeCodons && resultsJson.input && resultsJson.input["number of sites"]) {
        const numSites = resultsJson.input["number of sites"];
        
        // For SLAC, we typically have single partition, so map all codons to partition 0
        // But we should check if there are multiple partitions and handle accordingly
        const numPartitions = partitions.length;
        
        for (let i = 1; i <= numSites; i++) {
            opts.push(`Codon ${i}`);
            
            // For now, map all codons to partition 0 (single partition case)
            // TODO: If SLAC supports multi-partition, implement proper mapping logic
            codonIdxToPartIdx[i] = [0, i]; // [partitionIndex, siteWithinPartition]
        }
    }
    
    return [opts, codonIdxToPartIdx];
}
