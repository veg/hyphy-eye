import { getTreeViewOptions } from "../utils/phylotree-utils.js";
import * as utils from "../utils/general-utils.js";
import * as d3 from "d3";

/**
 * Extract summary attributes from FADE results
 * @param {Object} fadeData - The FADE analysis results
 * @returns {Object} Summary attributes for display
 */
export function getFadeAttributes(fadeData) {
  if (!fadeData) return {};
  
  // Extract common attributes
  const commonAttrs = utils.extractCommonAttributes(fadeData);
  
  return { ...commonAttrs };
}

/**
 * Count sites with amino acid selection bias based on Bayes Factor threshold
 * @param {Object} fadeData - The FADE analysis results
 * @param {number} bayesFactorThreshold - Bayes Factor threshold (default 100)
 * @returns {number} Number of sites with selection bias
 */
export function countSelectionBiasSites(fadeData, bayesFactorThreshold = 100) {
  if (!fadeData || !fadeData.MLE || !fadeData.MLE.content) {
    return 0;
  }
  
  let count = 0;
  
  try {
    // Iterate through partitions in MLE content
    Object.values(fadeData.MLE.content).forEach(partition => {
      // Each partition contains amino acid keys (A, C, D, E, etc.)
      Object.values(partition).forEach(aminoAcidData => {
        // Each amino acid has an array of sites
          if (Array.isArray(aminoAcidData)) {
            aminoAcidData.forEach(siteData => {
              // Each site has [rate, bias, Prob[bias>0], BayesFactor[bias>0]]
              // Bayes Factor is at index 3
              if (Array.isArray(siteData) && siteData.length >= 4) {
                const bayesFactor = siteData[3]; // BayesFactor[bias>0]
                if (typeof bayesFactor === 'number' && bayesFactor >= bayesFactorThreshold) {
                  count++;
                }
              }
            });
          }
      });
    });
  } catch (error) {
    console.warn("Error counting selection bias sites:", error);
    return 0;
  }
  
  return count;
}

/**
 * Create tile specifications for FADE summary dashboard
 * @param {Object} fadeData - The FADE analysis results
 * @param {number} bayesFactorThreshold - Bayes Factor threshold for counting sites
 * @returns {Array} Array of tile specifications
 */
export function getFadeTileSpecs(fadeData, bayesFactorThreshold = 100) {
  const attributes = getFadeAttributes(fadeData);
  const selectionBiasSites = countSelectionBiasSites(fadeData, bayesFactorThreshold);
  
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
      number: selectionBiasSites,
      description: `sites with amino acid selection bias (BF ≥ ${bayesFactorThreshold})`,
      icon: "icon-target icons",
      color: "midnight_blue"
    }
  ];
}



/**
 * Get site-level results table data for FADE
 * @param {Object} fadeData - The FADE analysis results
 * @param {number} bayesFactorThreshold - Bayes Factor threshold for filtering
 * @returns {Array} Array containing [format, results, headers] for site table
 */
export function getFadeSiteTableData(fadeData, bayesFactorThreshold = 100) {
  const format = {
    "Amino Acid": (d) => d,
    "Site Index": d3.format("d"),
    "Rate": d3.format(".2f"),
    "Bias": d3.format(".2f"),
    "Prob [bias>0]": d3.format(".2f"),
    "Bayes Factor [bias>0]": d3.format(".2f"),
    "Composition": (d) => d,
    "Substitutions": (d) => d
  };
  
  const headers = ["Amino Acid", "Site Index", "Rate", "Bias", "Prob [bias>0]", "Bayes Factor [bias>0]", "Composition", "Substitutions"];
  const results = [];
  
  if (!fadeData || !fadeData.MLE || !fadeData.MLE.content) {
    return [format, results, headers];
  }
  
  // Get site annotations for composition and substitutions
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
              
              if (typeof bayesFactor === 'number' && bayesFactor >= bayesFactorThreshold) {
                let composition = "N/A";
                let substitutions = "N/A";
                
                // Site annotations are indexed by partitionKey, then by site index
                if (siteAnnotations[partitionKey] && siteAnnotations[partitionKey][siteIndex]) {
                  const annotation = siteAnnotations[partitionKey][siteIndex];
                  if (Array.isArray(annotation) && annotation.length >= 2) {
                    composition = annotation[0] || "N/A";
                    substitutions = annotation[1] || "N/A";
                  }
                }
                
                results.push({
                  "Amino Acid": aminoAcid, // Use the MLE.content key as the amino acid identifier
                  "Site Index": siteIndex + 1,
                  "Rate": rate,
                  "Bias": bias,
                  "Prob [bias>0]": probBias,
                  "Bayes Factor [bias>0]": bayesFactor,
                  "Composition": composition,
                  "Substitutions": substitutions
                });
              }
            }
          });
        }
      });
    });
  } catch (error) {
    console.warn("Error extracting FADE site table data:", error);
  }
  
  // Sort by Bayes Factor (descending) to show most significant sites first
  results.sort((a, b) => b["Bayes Factor [bias>0]"] - a["Bayes Factor [bias>0]"]);
  
  return [format, results, headers];
}



/**
 * Get model fits table data for FADE
 * @param {Object} fadeData - The FADE analysis results
 * @returns {Array} Array containing [format, results, headers] for model fits table
 */
export function getFadeModelFitsTableData(fadeData) {
  const format = {
    "Model": (d) => d,
    "AIC-c": d3.format(".2f"),
    "Log L": d3.format(".2f"),
    "Parameters": d3.format("d"),
    "Rate Distributions": (d) => d || "N/A"
  };
  
  const headers = ["Model", "AIC-c", "Log L", "Parameters", "Rate Distributions"];
  const results = [];
  
  if (!fadeData || !fadeData.fits) {
    return [format, results, headers];
  }
  
  // Process each model in the fits section
  Object.entries(fadeData.fits).forEach(([modelName, modelData]) => {
    let rateDistributions = "N/A";
    
    // Format rate distributions if available
    if (modelData["Rate Distributions"]) {
      const rateDist = modelData["Rate Distributions"];
      if (rateDist && typeof rateDist === 'object') {
        // Convert rate distributions to string representation
        rateDistributions = JSON.stringify(rateDist);
      } else if (rateDist === null) {
        rateDistributions = "N/A";
      } else {
        rateDistributions = String(rateDist);
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
    const aOrder = fadeData.fits[a.Model] ? fadeData.fits[a.Model]["display order"] : 999;
    const bOrder = fadeData.fits[b.Model] ? fadeData.fits[b.Model]["display order"] : 999;
    return aOrder - bOrder;
  });
  
  return [format, results, headers];
}


/**
 * Get tree view options with mapping for FADE
 * @param {Object} fadeData - The FADE analysis results
 * @param {Object} options - Options object with includeCodons flag
 * @returns {Array} Array containing [options, codonToPartitionMapping]
 */
export function getFadeTreeViewOptionsWithMapping(fadeData, options = {}) {
  if (!fadeData || !fadeData.input) {
    return [[], {}];
  }
  
  // Use the updated getTreeViewOptions signature that expects resultsJson
  const result = getTreeViewOptions(fadeData, {
    onlyWithSubstitutions: false, // FADE doesn't have substitution data like MEME
    includeMapping: true,
    includeCodons: options.includeCodons !== false // default true
  });
  
  // getTreeViewOptions returns [options, mapping] when includeMapping is true
  if (Array.isArray(result) && result.length === 2) {
    return result;
  }
  
  // Fallback if the function returns just options
  return [result || [], {}];
}
