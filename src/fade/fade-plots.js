import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import * as phylotreeUtils from "../utils/phylotree-utils.js";

/**
 * Get plot data for FADE site scatter plot
 * @param {Object} fadeData - The FADE analysis results
 * @param {string} selectedAminoAcid - Selected amino acid filter ("All" for no filter)
 * @param {number} bayesFactorThreshold - Bayes Factor threshold for filtering
 * @returns {Array} Array of site data for plotting
 */
export function getFadeSitePlotData(fadeData, selectedAminoAcid = "All", bayesFactorThreshold = 100) {
  if (!fadeData || !fadeData.MLE || !fadeData.MLE.content) {
    return [];
  }

  const plotData = [];
  const siteAnnotations = fadeData["site annotations"] && fadeData["site annotations"]["site annotations"] ? 
    fadeData["site annotations"]["site annotations"] : {};

  try {
    // Iterate through amino acids in MLE content
    Object.entries(fadeData.MLE.content).forEach(([aminoAcid, partitionData]) => {
      // Each amino acid has partition data, typically partition "0"
      Object.entries(partitionData).forEach(([partitionKey, siteDataArray]) => {
        if (Array.isArray(siteDataArray)) {
          siteDataArray.forEach((siteData, siteIndex) => {
            if (Array.isArray(siteData) && siteData.length >= 4) {
              const rate = siteData[0];
              const bias = siteData[1];
              const probBias = siteData[2];
              const bayesFactor = siteData[3];
              
              // Filter by amino acid if specified
              if (selectedAminoAcid !== "All" && aminoAcid !== selectedAminoAcid) {
                return;
              }
              
              // Get composition from site annotations
              let composition = "N/A";
              
              if (siteAnnotations[partitionKey] && siteAnnotations[partitionKey][siteIndex]) {
                const annotation = siteAnnotations[partitionKey][siteIndex];
                if (Array.isArray(annotation) && annotation.length >= 2) {
                  composition = annotation[0] || "N/A";
                }
              }
              
              // Determine significance based on Bayes Factor
              const isSignificant = bayesFactor >= bayesFactorThreshold;
              
              plotData.push({
                site: siteIndex + 1, // 1-based indexing
                rate: rate,
                bias: bias,
                probBias: probBias,
                bayesFactor: bayesFactor,
                logBayesFactor: Math.log(bayesFactor),
                aminoAcid: aminoAcid, // Use the MLE.content key as the amino acid identifier
                composition: composition,
                isSignificant: isSignificant,
                significance: isSignificant ? "Significant" : "Not Significant"
              });
            }
          });
        }
      });
    });
  } catch (error) {
    console.warn("Error extracting FADE plot data:", error);
  }

  return plotData;
}

/**
 * Get unique amino acids from FADE data for dropdown options
 * @param {Object} fadeData - The FADE analysis results
 * @returns {Array} Array of unique amino acids
 */
export function getFadeAminoAcidOptions(fadeData) {
  if (!fadeData || !fadeData.MLE || !fadeData.MLE.content) {
    return ["All"];
  }

  try {
    // Get amino acids directly from MLE.content keys
    const aminoAcids = Object.keys(fadeData.MLE.content).sort();
    return ["All", ...aminoAcids];
  } catch (error) {
    console.warn("Error extracting amino acid options:", error);
    return ["All"];
  }
}

/**
 * Create FADE site scatter plot visualization
 * @param {Array} data - Plot data from getFadeSitePlotData
 * @param {string} xAxis - X-axis display name ("Site Index", "Bias", "Rate", "Probability", "Bayes Factor", "Log(Bayes Factor)")
 * @param {string} yAxis - Y-axis display name ("Bias", "Rate", "Probability", "Bayes Factor", "Log(Bayes Factor)")
 * @param {number} bayesFactorThreshold - Bayes Factor threshold for highlighting
 * @param {Object} options - Additional plot options
 * @returns {Object} Observable Plot specification
 */
export function createFadeSiteGraph(data, xAxis = "Site Index", yAxis = "Bayes Factor", bayesFactorThreshold = 100, options = {}) {
  if (!data || data.length === 0) {
    return Plot.plot({
      title: "FADE Site Analysis",
      subtitle: "No data available",
      width: options.width || 800,
      height: options.height || 400,
      x: { label: "Site Position" },
      y: { label: "Value" },
      marks: [
        Plot.text(["No data to display"], {
          x: 400,
          y: 200,
          fontSize: 16,
          fill: "#666"
        })
      ]
    });
  }

  // Map display names to data keys
  const displayToKey = {
    "Site Index": "site",
    "Bias": "bias",
    "Rate": "rate",
    "Probability": "probBias",
    "Bayes Factor": "bayesFactor",
    "Log(Bayes Factor)": "logBayesFactor"
  };

  const xKey = displayToKey[xAxis] || "site";
  const yKey = displayToKey[yAxis] || "bayesFactor";
  const title = `FADE Site Analysis: ${yAxis} vs ${xAxis}`;

  // Filter data to ensure valid values for log scales
  let filteredData = data;
  if (xKey === "bayesFactor" || xKey === "logBayesFactor") {
    filteredData = filteredData.filter(d => d[xKey] > 0 && isFinite(d[xKey]));
  }
  if (yKey === "bayesFactor" || yKey === "logBayesFactor") {
    filteredData = filteredData.filter(d => d[yKey] > 0 && isFinite(d[yKey]));
  }

  // Create plot specification
  const plotSpec = {
    title: title,
    width: options.width || 800,
    height: options.height || 400,
    x: { 
      label: xAxis,
      type: (xKey === "bayesFactor") ? "log" : "linear"
    },
    y: { 
      label: yAxis,
      type: (yKey === "bayesFactor") ? "log" : "linear"
    },
    color: {
      legend: true,
      domain: ["Significant", "Not Significant"],
      range: ["#e74c3c", "#95a5a6"]
    },
    marks: []
  };

  // Add threshold lines for Bayes Factor
  if (yKey === "bayesFactor") {
    plotSpec.marks.push(
      Plot.ruleY([bayesFactorThreshold], {
        stroke: "#e74c3c",
        strokeDasharray: "5,5",
        strokeWidth: 2,
        opacity: 0.7
      })
    );
  } else if (yKey === "logBayesFactor") {
    plotSpec.marks.push(
      Plot.ruleY([Math.log(bayesFactorThreshold)], {
        stroke: "#e74c3c",
        strokeDasharray: "5,5",
        strokeWidth: 2,
        opacity: 0.7
      })
    );
  }
  
  if (xKey === "bayesFactor") {
    plotSpec.marks.push(
      Plot.ruleX([bayesFactorThreshold], {
        stroke: "#e74c3c",
        strokeDasharray: "5,5",
        strokeWidth: 2,
        opacity: 0.7
      })
    );
  } else if (xKey === "logBayesFactor") {
    plotSpec.marks.push(
      Plot.ruleX([Math.log(bayesFactorThreshold)], {
        stroke: "#e74c3c",
        strokeDasharray: "5,5",
        strokeWidth: 2,
        opacity: 0.7
      })
    );
  }

  // Add scatter points
  plotSpec.marks.push(
    Plot.dot(filteredData, {
      x: xKey,
      y: yKey,
      fill: "significance",
      stroke: "black",
      strokeWidth: 0.5,
      r: 4,
      opacity: 0.8,
      title: d => `Site ${d.site}\nAmino Acid: ${d.aminoAcid}\nRate: ${d.rate.toFixed(3)}\nBias: ${d.bias.toFixed(3)}\nProbability: ${d.probBias.toFixed(3)}\nBayes Factor: ${d.bayesFactor.toFixed(2)}\nLog(Bayes Factor): ${d.logBayesFactor.toFixed(2)}`
    })
  );

  return Plot.plot(plotSpec);
}

/**
 * Get FADE tree visualization
 * @param {Object} fadeData - The FADE analysis results
 * @param {string} selectedTree - Selected tree identifier
 * @param {string} treeDim - Tree dimensions string (e.g., "1024 x 800")
 * @param {Object} treeObjects - Tree objects from phylotreeUtils
 * @param {Object} codonToPartitionMapping - Codon to partition mapping
 * @returns {Object} Configured phylotree
 */
export function getFadeTree(fadeData, selectedTree, treeDim, treeObjects, codonToPartitionMapping) {
  if (!fadeData || !selectedTree || !treeObjects || treeObjects.length === 0) {
    return null;
  }

  // Get the appropriate tree object based on selection first
  let treeIndex = 0;
  if (selectedTree.includes("Partition")) {
    treeIndex = parseInt(selectedTree.split(" ")[1]) - 1; // Convert to 0-based index
  }
  
  const treeObject = treeObjects[treeIndex];
  if (!treeObject) {
    return null;
  }
  
  // Parse tree dimensions with dynamic height calculation
  let dimensions;
  if (treeDim && treeDim.trim()) {
    const dimParts = treeDim.split("x").map(d => parseInt(d.trim()));
    if (dimParts.length === 2 && !isNaN(dimParts[0]) && !isNaN(dimParts[1])) {
      dimensions = dimParts;
    } else {
      dimensions = [800, 400]; // Use default height if invalid input
    }
  } else {
    dimensions = [800, 400]; // Default width, height
  }

  // Extract FADE-specific data for tree nodes
  const partitionKey = selectedTree.includes("Partition") ? 
    selectedTree.split(" ")[1] : "0";
  
  // FADE doesn't have traditional "tested" branches, but we can extract branch names
  // from branch attributes to create a tested-like structure
  let testedData = {};
  let nodeLabels = {};
  
  if (fadeData["branch attributes"] && fadeData["branch attributes"][partitionKey]) {
    const branchAttrs = fadeData["branch attributes"][partitionKey];
    Object.keys(branchAttrs).forEach(branchName => {
      // Mark all branches as "available" (similar to tested)
      testedData[branchName] = 1;
      
      // Extract branch-specific information for node labels
      const branchData = branchAttrs[branchName];
      if (branchData && branchData["original name"]) {
        nodeLabels[branchName] = {
          name: branchData["original name"]
        };
      }
    });
  }

  return phylotreeUtils.configureTree(treeObject, treeDim, {
    'align-tips': false,
    'show-scale': true,
    'is-radial': false,
    'left-right-spacing': 'fit-to-size',
    'top-bottom-spacing': 'fit-to-size',
    'node_circle_size': (n) => 0,
    'internal-names': true,
    'selectable': false,
    configureNodes: (rawTree, renderedTree) => {
      const configureNodeDisplay = phylotreeUtils.getConfigureNodesFn(
        testedData, // FADE branch data
        nodeLabels, // FADE node labels
        {
          showAA: false,
          showCodons: false,
          showSeqNames: true,
          showOnlyMH: false,
          showOnlyNS: false,
          alignTips: false
        }
      );
      configureNodeDisplay(rawTree, renderedTree);
    }
  });
}
