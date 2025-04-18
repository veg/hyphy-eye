import * as d3 from "d3";
import * as _ from "lodash-es";
import * as utils from "../utils/general-utils.js";

const floatFormat = d3.format (".4g")

/**
 * Extracts some summary attributes from NRM results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the NRM results
 *
 * @returns {Object} An object with the following attributes:
 *   - numberOfSequences: {number} The number of sequences in the alignment
 *   - numberOfSites: {number} The number of sites in the alignment
 *   - treeLengthByModel: {Object} An object mapping model names to their tree lengths
 *   - modelSummary: {Array} An array of model names and their AIC-c values, sorted by AIC-c
 *   - bestModel: {string} The name of the best model according to AIC-c
 *   - bestModelTreeLength: {string} The tree length of the best model, formatted as a string
 *   - modelTableData: {Array} An array of objects containing model comparison data
 *   - numberOfPartitions: {number} The number of partitions in the analysis
 *   - partitionSizes: {Array} Array of sizes for each partition
 */
export function getNrmAttributes(resultsJson) {
    // Extract common attributes
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // NRM-specific attributes
    const treeLengthByModel = _.chain(_.keys(resultsJson.fits))
        .map((d) => {
            return [d, d3.sum(_.map(resultsJson["branch attributes"]["0"], (bv) => bv[d]))];
        })
        .fromPairs()
        .value();
    const modelSummary = _.chain(resultsJson["fits"])
        .map((v, m) => [m, v["AIC-c"]])
        .sortBy((d) => d[1])
        .value();
    const bestModel = modelSummary[0][0];
    const bestModelTreeLength = floatFormat(treeLengthByModel[bestModel]);
    const modelTableData = getModelTableData(resultsJson, treeLengthByModel);
    
    return {
        numberOfSequences: commonAttrs.numberOfSequences,
        numberOfSites: commonAttrs.numberOfSites,
        treeLengthByModel,
        modelSummary,
        bestModel,
        bestModelTreeLength,
        modelTableData,
        numberOfPartitions: commonAttrs.numberOfPartitions,
        partitionSizes: commonAttrs.partitionSizes
    };
}

/**
 * Returns the maximum rate value found in the rate distributions of the given model in the given resultsJson object.
 *
 * @param {Object} resultsJson - The JSON object containing the NRM results
 * @param {string} model - The name of the model for which to retrieve the maximum rate value
 *
 * @returns {number} The maximum rate value
 */
export function getQMaxRate(resultsJson, model) {
    console.log("resultsJson", resultsJson)
    console.log("model", model)
    return d3.max(_.map(resultsJson["fits"][model]["Rate Distributions"], (d) => d3.max(d)))
}

/**
 * Returns a table representation of the rate matrix Q for the given model in the given resultsJson object.
 *
 * @param {Object} resultsJson - The JSON object containing the NRM results
 * @param {string} model - The name of the model for which to retrieve the rate matrix
 *
 * @returns {Array} A table (array of objects) containing the rate matrix Q, where each row and column corresponds to a nucleotide (A, C, G, T) and the value is the rate of substitution from the row nucleotide to the column nucleotide.
 */
export function getQMatrixTable(resultsJson, model) {
   let rates = [];
   let rm = resultsJson["fits"][model]["Rate Distributions"];
   const nucs = resultsJson["characters"][0];
   _.each (nucs, (from, i)=> {
      let row = {'From/To' : from};
      _.each (nucs, (to, j)=> {
          if (i!=j) {
            row[to] = rm[i][j];
          } else {
             row[to] = null;
          }
      });
      rates.push (row);
   });
   return rates;
}

/**
 * Returns a table representation of the model comparison data.
 *
 * @param {Object} resultsJson - The JSON object containing the NRM results
 * @param {Object} treeLengthByModel - An object mapping model names to their tree lengths
 *
 * @returns {Array} A table (array of objects) containing the model comparison data
 */
export function getModelTableData(resultsJson, treeLengthByModel) {
  return _.chain (treeLengthByModel).map((i,d)=> {
      return {
        'Model' : d,
        'AIC-c' : resultsJson["fits"][d]["AIC-c"],
        'Tree length' : treeLengthByModel[d],
        'f(A)' : resultsJson["fits"][d]["Equilibrium frequencies"][0][0],
        'f(C)' : resultsJson["fits"][d]["Equilibrium frequencies"][0][1],
        'f(G)' : resultsJson["fits"][d]["Equilibrium frequencies"][0][2],
        'f(T)' : resultsJson["fits"][d]["Equilibrium frequencies"][0][3]

      };
  }).value();
}

/**
 * Returns a string indicating whether the given p-value provides evidence for a hypothesis.
 *
 * @param {number} pvalue - The p-value to evaluate
 *
 * @returns {string} A string indicating whether the p-value provides evidence for a hypothesis
 */
export function reportResult(pvalue) {
  let sup = "";
  if (pvalue <= 0.05) {
      sup = "<b>is</b> evidence";
  } else {
      sup = "<b>is no</b> evidence";
  }
  return sup + " (p-value=" + floatFormat(pvalue) + ")";
}

/**
 * Returns the test result for the given models.
 *
 * @param {Object} resultsJson - The JSON object containing the NRM results
 * @param {string} m1 - The name of the first model
 * @param {string} m2 - The name of the second model
 *
 * @returns {number} The test result
 */
export function getTestResult(resultsJson, m1, m2) {
  return resultsJson["test results"][m1 + " vs " + m2]["Corrected P-value"];
}

/**
 * Returns the tile specifications for the given resultsJson object.
 *
 * @param {Object} resultsJson - The JSON object containing the NRM results
 *
 * @returns {Array} An array of tile specifications
 */
export function getTileSpecs(resultsJson) {
    const attrs = getNrmAttributes(resultsJson);

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
            "number": attrs.bestModelTreeLength,
            "description": "tree length (subs/site)",
            "icon": "icon-arrow-up icons",
            "color": "asbestos",
        },
        {
            "number": attrs.bestModel,
            "description": "best model",
            "icon": "icon-location-pin icons",
            "color": "asbestos",
        },
        {
            "number": floatFormat(getTestResult (resultsJson, "GTR", "NREV12")),
            "description": "p-value non-reversible",
            "icon": "icon-info icons",
            "color": "midnight_blue",
        },
        {
            "number": floatFormat(getTestResult (resultsJson, "NREV12", "NREV12+F")),
            "description": "p-value root frequencies",
            "icon": "icon-info icons",
            "color": "midnight_blue",
        }
    ];

    return tileTableInputs;
}