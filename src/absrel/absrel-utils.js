/**
 * @module absrel-utils
 * @description Utility functions for aBSREL visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as utils from "../utils/general-utils.js";
import * as summaryStats from "../stats/summaries.js";
import {html} from "htl";

const floatFormat = d3.format (".2g")

/**
 * Extracts some summary attributes from aBSREL results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the aBSREL results
 *
 * @returns {Object} An object with the following attributes:
 *   - positiveResults: {Object} An object with the number of positive results
 *     for each partition
 *   - pvalueThreshold: {number} The P-value threshold used in the analysis
 *   - profilableBranches: {Set<string>} A set of branch names that were tested
 *     for positive selection
 *   - testedBranchCount: {number} The median number of branches tested for
 *     selection for each partition
 *   - srvRateClasses: {number} The number of rate classes for the synonymous
 *     site-to-site rate distribution
 *   - srvDistribution: {Object} An object with the rate values and their
 *     associated weights for the synonymous site-to-site rate distribution
 *   - omegaRateClasses: {Array<number>} An array of the number of rate
 *     classes for the omega distribution for each partition
 *   - mhRates: {Object} An object with the median rates for two and three
 *     nucleotide changes per codon
 *   - treeObjects: {Array<phylotree.phylotree>} An array of phylotree objects
 *     for each partition
 *   - profileBranchSites: {Array<Object>} An array of objects containing
 *     information about sites that were tested for positive selection
 *   - numberOfSequences: {number} The number of sequences in the analysis
 *   - numberOfSites: {number} The number of sites in the analysis
 *   - numberOfPartitions: {number} The number of partitions in the analysis
 *   - partitionSizes: {Array} Array of sizes for each partition
 */
export function getAbsrelAttributes(resultsJson) {
    // Extract common attributes
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // aBSREL-specific attributes
    const positiveResults = resultsJson["test results"]["positive test results"];
    const pvalueThreshold = resultsJson["test results"]["P-value threshold"];
    const profilableBranches = new Set(Object.keys(_.get(resultsJson, ["Site Log Likelihood", "tested"])));
    const srvRateClasses = resultsJson["Synonymous site-posteriors"] ? resultsJson["Synonymous site-posteriors"].length : 0;
    const srvDistribution = utils.getRateDistribution(resultsJson, null, ["fits", "Full adaptive model", "Rate Distributions", "Synonymous site-to-site rates"], ["rate", "proportion"]);
    
    // Calculate omega rate classes
    const branchAttributes = resultsJson["branch attributes"] || {};
    const omegaRateClasses = Object.values(branchAttributes)
        .map(partition => {
            if (!partition) return 0;
            return Math.max(...Object.values(partition)
                .map(branch => branch?.["Rate Distributions"]?.length || 0));
        }) || [0];

    // Calculate median rates for nucleotide changes
    const mhRates = {
        'DH': d3.median(Object.values(branchAttributes)
            .flatMap(partition => {
                if (!partition) return [];
                return Object.values(partition)
                    .map(branch => branch?.["Rate Distributions"]?.["rate at which 2 nucleotides are changed instantly within a single codon"])
                    .filter(d => d);
            })) || 0,
        'TH': d3.median(Object.values(branchAttributes)
            .flatMap(partition => {
                if (!partition) return [];
                return Object.values(partition)
                    .map(branch => branch?.["Rate Distributions"]?.["rate at which 3 nucleotides are changed instantly within a single codon"])
                    .filter(d => d);
            })) || 0
    };

    const treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
    const profileBranchSites = getAbsrelProfileBranchSites(resultsJson, treeObjects);

    return {
        positiveResults,
        pvalueThreshold,
        profilableBranches,
        testedBranchCount: commonAttrs.testedBranchCount,
        srvRateClasses,
        srvDistribution,
        omegaRateClasses,
        mhRates,
        treeObjects,
        profileBranchSites,
        numberOfSequences: commonAttrs.numberOfSequences,
        numberOfSites: commonAttrs.numberOfSites,
        numberOfPartitions: commonAttrs.numberOfPartitions,
        partitionSizes: commonAttrs.partitionSizes
    };
}

/**
 * Creates the data for the tile table that displays various summary attributes
 * for an aBSREL analysis.
 *
 * @param {Object} resultsJson - The JSON object containing the aBSREL results
 * @param {number} evThreshold - The evidence threshold *
 * @returns {Object} An object with the following attributes:
 *   - tileTableInputs: {Array<Object>} An array of objects with the following
 *     attributes:
 *       - number: {string} A string representation of the number to be displayed
 *       - description: {string} A description of the number being displayed
 *       - icon: {string} The CSS class for the icon associated with the number
 *       - color: {string} The color to use for the icon
 */
export function getAbsrelTileSpecs(resultsJson, evThreshold, distributionTable) {
    const attrs = getAbsrelAttributes(resultsJson)

    const medianDH = _.size(attrs.mhRates['DH']) ? floatFormat (d3.median (_.map (attrs.mhRates['DH']))) : "N/A"
    const medianTH = _.size(attrs.mhRates['TH']) ? floatFormat (d3.median (_.map (attrs.mhRates['TH']))) : "N/A"

    const tileTableInputs = [
        {
            "number": resultsJson.input["number of sequences"],
            "description": "sequences in the alignment",
            "icon": "icon-options-vertical icons",
            "color": "asbestos",
        },
        {
            "number": resultsJson.input["number of sites"],
            "description": "codon sites in the alignment",
            "icon": "icon-options icons",
            "color": "asbestos"
        },
        {
            "number": resultsJson.input["partition count"],
            "description": "partitions",
            "icon": "icon-arrow-up icons",
            "color": "asbestos"
        },
        {
            "number": attrs.testedBranchCount,
            "description": "median branches/ partition used for testing",
            "icon": "icon-share icons",
            "color": "asbestos",
        },
        {
            "number": d3.extent (attrs.omegaRateClasses).join ("-"),
            "description": "rate classes per branch",
            "icon": "icon-grid icons",
            "color": "asbestos"
        },
        {
            "number": attrs.srvRateClasses ? "" + attrs.srvRateClasses + " classes" : "None",
            "description": "synonymous rate variation",
            "icon": "icon-layers icons",
            "color": "asbestos"
        },
        {
            "number": attrs.positiveResults,
            "description": "branches with evidence of selection",
            "icon": "icon-plus icons",
            "color": "midnight_blue",
        },
        {
            "number": floatFormat(d3.mean (_.map (_.filter (distributionTable, (r)=>r.tested == "Yes"), (d)=>d.sites))||0),
            "description": "Sites/tested branch with ER≥" + evThreshold + " for positive selection",
            "icon": "icon-energy icons",
            "color": "midnight_blue"
        },
        {
            "number": medianDH + ":" + medianTH,
            "description": "Median multiple hit rates (2H:3H)",
            "icon": "icon-target icons",
            "color": "midnight_blue"
        }
    ]

    return tileTableInputs;
}

  /**
   * Create a table of results for each branch in the input aBSREL run.
   *
   * @param {Object} resultsJson - The JSON object containing the aBSREL results
   * @param {number} evThreshold - The threshold for the ER statistic
   *
   * @returns {Array} An array of objects each with the following properties:
   *   - branch: The name of the branch
   *   - tested: Whether the branch was tested for positive selection
   *   - p-value: The p-value of the test if tested, null otherwise
   *   - sites: The number of sites with ER >= evThreshold if tested, null
   *     otherwise
   *   - rates: The number of rate classes in the omega distribution for the
   *     branch
   *   - dist: An array of three elements:
   *     1. The string "&omega;"
   *     2. The result of the getAbsrelTestOmega function for this branch
   *     3. An empty string
   *   - plot: An array of two elements:
   *     1. An empty string
   *     2. The second element of the dist array
   */
export function getAbsrelDistributionTable(resultsJson, evThreshold, treeObjects) {
  let table = [];

  const attrs = getAbsrelAttributes(resultsJson);
  let site_er = getAbsrelPosteriorsPerBranchSite(resultsJson, true, evThreshold, treeObjects);
  
  _.each (resultsJson["branch attributes"][0], (info, b)=> {
    let row = {'branch' : b};
    const is_tested = resultsJson["tested"][0][b] == "test";
    if (is_tested) {
        row['tested'] = 'Yes';
        row['p-value'] = info["Corrected P-value"];
        row['sites'] = site_er[b] || 0;
        
                  } else {
        row['tested'] = 'No';
        row['p-value'] = null;
        row['sites'] = null;
    }
    row['rates'] = info['Rate classes'];
    row ['dist'] = ["&omega;",getAbsrelTestOmega(resultsJson, b),""];
    row['plot'] = ["",row['dist'][1]];
    table.push (row);
  });
  
  return table;
}

export function getAbsrelBSPositiveSelection(resultsJson, treeObjects) {
    if (!treeObjects) {
        treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
    }

    return getAbsrelPosteriorsPerBranchSite(resultsJson, false, null, treeObjects);
}

// TODO: this may need to be two functions. I dont like it returns different things
// under different circumstances, uses different params, etc.
/**
 * Computes posterior probabilities for each branch-site combination and returns
 * either a count of sites with evidence ratio (ER) above a threshold or detailed
 * information for each site.
 *
 * @param {Object} resultsJson - The JSON object containing the results of the
 * analysis, including branch attributes and substitution information.
 * @param {boolean} doCounts - If true, returns a count of sites with ER >= er
 * for each branch. If false, returns an array of objects containing detailed
 * information for each site. 
 * @param {number} er - The threshold for the evidence ratio (ER) statistic.
 *
 * @returns {Object|Array} - If doCounts is true, returns an object with branch
 * names as keys and counts of sites with ER >= er as values. If doCounts is
 * false, returns an array of objects, each containing:
 *   - Key: A string combining the branch name and site index
 *   - Posterior: The posterior probability for the site
 *   - ER: The evidence ratio for the site
 *   - subs: Substitution information
 *   - from: The originating state of the substitution
 *   - to: The resulting state of the substitution
 *   - syn_subs: The count of synonymous substitutions
 *   - nonsyn_subs: The count of non-synonymous substitutions
 */
export function getAbsrelPosteriorsPerBranchSite(resultsJson, doCounts, er, treeObjects) {
    if (!treeObjects) {
        treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
    }
  let results = doCounts ? {} : [];
  let offset = 0;
  const subs = _.get (resultsJson, ["substitutions","0"]);
    
  _.each (resultsJson["branch attributes"], (data, partition) => {
      let partition_size = 0;
      let subs_per_site = {};
      _.each (data, (per_branch, branch)=> {
          if (per_branch ["posterior"]) {
            const prior_d = getAbsrelTestOmega (resultsJson, branch);
            let prior_odds = prior_d[prior_d.length-1].weight;
            const rate_class = prior_d.length-1;
            if (prior_odds < 1 && prior_odds > 0) {
              prior_odds = prior_odds / (1-prior_odds);
              _.each (per_branch ["posterior"][rate_class], (p,i)=> {
                  if (! doCounts && (i in subs_per_site) == false) {
                      subs_per_site[i] = phylotreeUtils.generateNodeLabels (treeObjects[0], subs[i])
                  }
                 
                  if (doCounts) {
                    results[branch] = (results[branch] ? results[branch] : 0) + ((p/(1-p))/prior_odds >= er);
                  } else {
                    const info = subs_per_site [i][branch];
                    let sub_count = utils.subsForPair (info[2], info[0]);
                    results.push ({'Key' : branch + "|" + (i + offset + 1), 
                                   'Posterior' : p, 
                                   'ER' : (p/(1-p))/prior_odds,
                                   'subs' : info[3],
                                   'from': info[2],
                                   'to' : info[0],
                                   'syn_subs' : sub_count[0],
                                   'nonsyn_subs' : sub_count[1]
                                  });
                  }
              });
            }
            partition_size = per_branch ["posterior"][rate_class].length;
          }
      });
      offset += partition_size;
  });
  return results;
}

/**
 * Profiles branch sites by calculating metrics based on log likelihoods
 * and substitutions from the provided results JSON.
 *
 * @param {Object} resultsJson - The JSON object containing the results,
 * which includes site log likelihoods and substitution data.
 * @param {Array<Object>} treeObjects - An array of tree objects.
 *
 * @returns {Array<Object>} An array of objects, each representing a site
 * with the following properties:
 *   - Key: {string} A unique identifier for the site in the format "node|site_index".
 *   - branch: {string} The name of the branch that the site belongs to.
 *   - site: {number} The index of the site.
 *   - ER: {number} The evidence ratio for the site.
 *   - subs: {string} The substitution information for the site.
 *   - from: {string} The originating state of the substitution.
 *   - to: {string} The resulting state of the substitution.
 *   - syn_subs: {number} The count of synonymous substitutions.
 *   - nonsyn_subs: {number} The count of non-synonymous substitutions.
**/
export function getAbsrelProfileBranchSites(resultsJson, treeObjects) {
    if (!treeObjects) {
        treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
    }
  let results = [];
  const unc = _.get (resultsJson, ["Site Log Likelihood","unconstrained","0"]);
  const subs = _.get (resultsJson, ["substitutions","0"]);
  if (unc) {
    _.each (unc, (ll, i)=> {
        const subs_at_site = phylotreeUtils.generateNodeLabels (treeObjects[0], subs[i]);
        _.each (subs_at_site, (info, node)=> {
      
             if (node != 'root') {
                const bs_ll = _.get (resultsJson, ["Site Log Likelihood","tested",node,0,i]);
                if (bs_ll) {
                    let bit = {};
                    bit.Key = node + "|" + (i+1);
                    bit.branch = node;
                    bit.site = i+1;
                    bit.ER = Math.exp (unc[i]-bs_ll);
                    bit.subs = info[3];
                    bit.from = info[2];
                    bit.to = info[0];
                    let sub_count = utils.subsForPair (bit.from, bit.to);
                    bit.syn_subs = sub_count[0];
                    bit.nonsyn_subs = sub_count[1];
                    results.push (bit);
                }
              }
              
        });
    });
  }
  return results;
}

/**
 * Generates an array of arrays, where each sub-array contains the partition
 * index and site index for each site in the results. The partition index is
 * one-based, and the site index is zero-based.
 *
 * @param {Object} resultsJson - The JSON object containing the aBSREL results
 * @returns {Array<Array<number>>} The array of arrays containing partition
 *   index and site index for each site
 */
export function getAbsrelSiteIndexPartitionCodon(resultsJson) {
    const partitions = resultsJson['data partitions'];
    const mappedData = Object.entries(partitions).map(([k, d]) => {
        return d['coverage'][0].map(site => [+k + 1, site + 1]);
    });
    return [].concat(...mappedData); // Flatten the array
}

/**
 * Retrieves the rate distribution for a given branch in the results JSON.
 *
 * @param {Object} resultsJson - The JSON object containing the aBSREL results
 * @param {string} branch - The name of the branch for which to retrieve the
 *   rate distribution
 *
 * @returns {Array|null} A sorted array of objects, each containing:
 *   - value: The rate value as specified by the first tag.
 *   - weight: The corresponding weight as specified by the second tag.
 *   The array is sorted by rate value. Returns null if no rate information
 *   is found.
 */
export function getAbsrelTestOmega(resultsJson, branch) {
    return utils.getRateDistributionByBranch(resultsJson, branch, ["branch attributes", "0"], ["0", "1"]);
}

/**
 * Retrieves the corrected P-value for a given branch in the results JSON.
 *
 * @param {Object} resultsJson - The JSON object containing the aBSREL results
 * @param {string} branch - The name of the branch for which to retrieve the
 *   corrected P-value
 *
 * @returns {number|null} The corrected P-value for the given branch, or
 *   null if no P-value information is found.
 */
export function getAbsrelTestPv(resultsJson, branch) {
    return utils.getBranchPvalue(resultsJson, branch, ["branch attributes", "0"]);
}

export function getAbsrelSiteTableData(resultsJson, evThreshold, profileBranchSites) {
    const attrs = getAbsrelAttributes(resultsJson);
    const siteIndexPartitionCodon = getAbsrelSiteIndexPartitionCodon(resultsJson);

  let site_info = [];
  let index = 0;
  if (!profileBranchSites) {
    const treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
    profileBranchSites = getAbsrelProfileBranchSites(resultsJson, treeObjects);
  }
  let bySite = _.groupBy (profileBranchSites, (d)=>d.site);
  _.each (resultsJson["data partitions"], (pinfo, partition)=> {
      _.each (pinfo["coverage"][0], (ignore, i)=> {
          
              let site_record = {
                  'Codon' : siteIndexPartitionCodon[index][1],
              };

              const sll = _.get (resultsJson, ["Site Log Likelihood",'unconstrained',0,index]);
              if (sll) {
                site_record['LogL'] = sll;
              }
        
              if (attrs.srvDistribution) {
                  let site_srv = [];
                  _.each (attrs.srvDistribution, (d,i)=> {
                       site_srv.push ({'value' : d.value, 'weight' : resultsJson["Synonymous site-posteriors"][i][index]});
                  });
                  site_record['SRV posterior mean'] = summaryStats.distMean (site_srv);
              }
              site_record ["Subs"] = d3.sum (bySite[i+1], (d)=>d.subs);
              site_record ["ER"] = _.filter (bySite[i+1], (d)=>d.ER >= evThreshold).length;
              
              site_info.push (site_record);
              index++;
          })  
        
      });
    return [site_info, {
      'Codon' : html`<abbr title = "Site">Codon</abbr>`,
      'SRV posterior mean' : html`<abbr title = "Posterior mean of the synonymous rate, α;">E<sub>post</sub>[α]</abbr>`,
      'LogL' : html`<abbr title = "Site log-likelihood under the unconstrained model">log(L)</abbr>`,
      'Subs' : html`<abbr title = "Total # of substitutions (s+ns)">Subs</abbr>`,
      'ER' : html`<abbr title = "Total # branches with evidence ratio > ${evThreshold}">ER Branch</abbr>`,
    }];
}