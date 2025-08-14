/**
 * @module slac-plots
 * @description Plotting functions for SLAC visualization using Observable Plot
 */

import * as Plot from "npm:@observablehq/plot";
import * as d3 from "d3";
import * as _ from "lodash-es";
import * as phylotree from "phylotree";
import * as utils from "./slac-utils.js";
import * as colors from "../color-maps/custom.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";

const DEFAULT_AMBIGUITY_HANDLING = "AVERAGED";





/**
 * Creates an interactive site graph similar to hyphy-vision's SLACGraphs
 * Allows selection of x and y axes and switches between line and scatter plot
 *
 * @param {Object} resultsJson - The JSON object containing the SLAC results
 * @param {string} xAxis - The x-axis variable ("Site" or column name)
 * @param {string} yAxis - The y-axis variable (column name)
 * @param {number} pvalueThreshold - The threshold for significance
 * @param {string} ambiguityHandling - How to handle ambiguous codons
 * @param {Object} options - Additional plotting options
 * @returns {Object} Observable Plot specification
 */
export function createSlacSiteGraph(resultsJson, xAxis = "Site", yAxis = "dN-dS", pvalueThreshold = 0.1, ambiguityHandling = DEFAULT_AMBIGUITY_HANDLING, options = {}) {
    // Get site data
    const [, siteResults] = utils.getSlacSiteTableData(resultsJson, pvalueThreshold, ambiguityHandling);
    
    if (siteResults.length === 0) {
        return Plot.plot({
            title: "No data available",
            width: options.width || 800,
            height: options.height || 400
        });
    }
    
    // Prepare data for plotting
    const data = siteResults.map((siteData, i) => {
        let xValue, yValue;
        
        // Handle x-axis
        if (xAxis === "Site") {
            xValue = siteData.Site;
        } else {
            // Map other x-axis options
            switch (xAxis) {
                case "dN": xValue = siteData.dN; break;
                case "dS": xValue = siteData.dS; break;
                case "dN/dS": xValue = siteData["dN/dS"]; break;
                case "dN-dS": xValue = siteData["dN-dS"]; break;
                case "Positive P-value": xValue = siteData["Positive P-value"]; break;
                case "Negative P-value": xValue = siteData["Negative P-value"]; break;
                default: xValue = siteData.Site;
            }
        }
        
        // Handle y-axis
        switch (yAxis) {
            case "dN-dS": yValue = siteData["dN-dS"]; break;
            case "dN/dS": yValue = siteData["dN/dS"]; break;
            case "dN": yValue = siteData.dN; break;
            case "dS": yValue = siteData.dS; break;
            case "Positive P-value": yValue = siteData["Positive P-value"]; break;
            case "Negative P-value": yValue = siteData["Negative P-value"]; break;
            default: yValue = siteData["dN-dS"];
        }
        
        return {
            site: siteData.Site,
            partition: siteData.Partition,
            x: xValue,
            y: yValue,
            classification: siteData.Classification,
            positivePValue: siteData["Positive P-value"],
            negativePValue: siteData["Negative P-value"],
            significant: siteData["Positive P-value"] <= pvalueThreshold || siteData["Negative P-value"] <= pvalueThreshold
        };
    });
    
    // Determine if this should be a scatter plot (when x-axis is not "Site")
    const isScatterPlot = xAxis !== "Site";
    
    // Create plot specification
    const plotSpec = {
        title: `${yAxis} ${isScatterPlot ? 'vs' : 'by'} ${xAxis}`,
        width: options.width || 800,
        height: options.height || 400,
        marginLeft: 80,
        marginBottom: 60,
        x: {
            label: xAxis,
            grid: true
        },
        y: {
            label: yAxis,
            grid: true
        },
        color: {
            legend: true,
            domain: ["Neutral", "Positive", "Negative"],
            range: [colors.binary_with_gray[1], colors.binary_with_gray[2], colors.binary_with_gray[0]]
        },
        marks: []
    };
    
    // Add reference lines for certain y-axes
    if (yAxis === "dN/dS") {
        plotSpec.marks.push(Plot.ruleY([1], {stroke: "red", strokeDasharray: "5,5", opacity: 0.7}));
    } else if (yAxis === "dN-dS") {
        plotSpec.marks.push(Plot.ruleY([0], {stroke: "red", strokeDasharray: "5,5", opacity: 0.7}));
    }
    
    // Add main data marks
    if (isScatterPlot) {
        // Scatter plot
        plotSpec.marks.push(
            Plot.dot(data, {
                x: "x",
                y: "y",
                fill: "classification",
                stroke: "black",
                strokeWidth: 0.5,
                r: d => d.significant ? 4 : 2,
                opacity: 0.7,
                title: d => `Site ${d.site}: ${xAxis} = ${d.x !== null ? d.x.toFixed(3) : 'N/A'}, ${yAxis} = ${d.y !== null ? d.y.toFixed(3) : 'N/A'} (${d.classification})`
            })
        );
    } else {
        // Line plot with points
        plotSpec.marks.push(
            Plot.line(data, {
                x: "x",
                y: "y",
                stroke: "steelblue",
                strokeWidth: 1.5,
                opacity: 0.6
            }),
            Plot.dot(data, {
                x: "x",
                y: "y",
                fill: "classification",
                stroke: "black",
                strokeWidth: 0.5,
                r: d => d.significant ? 4 : 2,
                opacity: 0.8,
                title: d => `Site ${d.site}: ${yAxis} = ${d.y !== null ? d.y.toFixed(3) : 'N/A'} (${d.classification})`
            })
        );
    }
    
    return Plot.plot(plotSpec);
}

/**
 * Creates a phylogenetic tree visualization for SLAC results showing tested vs background branches
 * or site-specific codon/amino acid states
 *
 * @param {Object} resultsJson - The JSON object containing the SLAC results
 * @param {number|string} treeSelection - The tree index (partition index) or codon selection string
 * @param {string} treeDim - Tree dimensions in format "width x height"
 * @param {Array} treeObjects - Array of phylotree objects
 * @returns {Object} Configured phylotree object
 */
export function getSlacTree(resultsJson, treeSelection, treeDim, treeObjects, codonToPartitionMapping = {}) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
    
    // Determine if this is a codon-specific tree or partition tree
    const isCodonTree = typeof treeSelection === 'string' && treeSelection.startsWith('Codon ');
    let partitionIndex = 0;
    let codonIndex = null;
    
    if (isCodonTree) {
        // Extract codon number from selection like "Codon 42"
        codonIndex = parseInt(treeSelection.replace('Codon ', ''));
        
        // Use codon-to-partition mapping if available
        if (codonToPartitionMapping[codonIndex]) {
            partitionIndex = codonToPartitionMapping[codonIndex][0]; // First element is partition index
        } else {
            // Fallback to partition 0 if mapping not available
            partitionIndex = 0;
        }
    } else {
        // Handle partition selection
        if (typeof treeSelection === 'string') {
            if (treeSelection === 'Alignment-wide tree') {
                partitionIndex = 0;
            } else if (treeSelection.startsWith('Partition ')) {
                partitionIndex = parseInt(treeSelection.replace('Partition ', '')) - 1;
            }
        } else {
            partitionIndex = treeSelection;
        }
    }
    
    // Configure the tree using the helper
    const t = phylotreeUtils.configureTree(treeObjects[partitionIndex], treeDim, {
        height: dim && dim[0] || 1024,
        width: dim && dim[1] || 600,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size',
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0,
        configureBranches: (rawTree, renderedTree) => {
            const configureBranchColors = phylotreeUtils.getConfigureBranchesFn(resultsJson, {
                color_branches: "Tested",
                branch_length: "Branch Length",
                index: partitionIndex,
                use_site_specific_support: false,
                use_turbo_color: false
            }, null);
            configureBranchColors(rawTree, renderedTree);
        },
        configureNodes: (rawTree, renderedTree) => {
            
            // Extract node labels for site-specific trees
            let nodeLabels = null;
            if (isCodonTree && resultsJson["branch attributes"] && resultsJson["branch attributes"][partitionIndex]) {
                nodeLabels = {};
                const branchAttributes = resultsJson["branch attributes"][partitionIndex];
                
                // Extract codon and amino acid information for each branch at the selected site
                Object.keys(branchAttributes).forEach(branchName => {
                    const branchData = branchAttributes[branchName];
                    
                    // Get codon and amino acid data
                    const hasCodonData = branchData["codon"] && branchData["codon"][0] && branchData["codon"][0].length > codonIndex - 1;
                    const hasAAData = branchData["amino-acid"] && branchData["amino-acid"][0] && branchData["amino-acid"][0].length > codonIndex - 1;
                    
                    if (hasCodonData || hasAAData) {
                        const codon = hasCodonData ? branchData["codon"][0][codonIndex - 1] : "?";
                        const aminoAcid = hasAAData ? branchData["amino-acid"][0][codonIndex - 1] : "?";
                        
                        // Format: [codon, amino_acid, ?, ?] - following the expected format
                        nodeLabels[branchName] = [codon, aminoAcid, "?", "?"];
                    }
                });
            }
            
            const configureNodeDisplay = phylotreeUtils.getConfigureNodesFn(
                resultsJson.tested[partitionIndex], 
                nodeLabels, 
                {
                    showAA: false,
                    showCodons: isCodonTree,
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
