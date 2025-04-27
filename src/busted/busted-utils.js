// TODO: need to refactor to reduce code duplication. this module may disappear then.

/**
 * @module busted-utils
 * @description Utility functions for BUSTED visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as utils from "../utils/general-utils.js";
import {html} from "htl";

const floatFmt = d3.format (".2g")
const percentageFormat = d3.format (".2p")

/**
 * Extracts attributes from BUSTED results JSON that are used for visualization
 *
 * @param {Object} resultsJson - The JSON object containing the BUSTED results
 * @returns {Object} An object with the following attributes:
 *   - testedBranchCount {number} - The median number of branches tested for selection across partitions
 *   - srvRateClasses {number} - The number of rate classes for the synonymous site-to-site rate distribution
 *   - srvDistribution {Array} - The distribution of synonymous site-to-site rates
 *   - partitionSizes {Array} - Array of sizes for each partition
 *   - hasBackground {boolean} - Whether background rate distributions are available
 *   - hasSrvHmm {boolean} - Whether Viterbi synonymous rate path is present
 *   - hasErrorSink {boolean} - Whether error sink settings are available
 *   - hasErrorSinkNt {boolean} - Whether nucleotide-level error sink is available
 *   - mhRates {Object} - Rates for double-hit and triple-hit substitutions
 */
export function getBustedAttributes(resultsJson) {
    // Extract common attributes using the utility function
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
console.log(resultsJson);
    // BUSTED-specific attributes
    const srvRateClasses = _.size(resultsJson.fits["Unconstrained model"]["Rate Distributions"]["Synonymous site-to-site rates"]);
    const hasBackground = utils.hasBackground(resultsJson);
    const hasSrvHmm = "Viterbi synonymous rate path" in resultsJson;
    const hasErrorSink = utils.hasErrorSink(resultsJson);
    const hasErrorSinkNt = getBustedHasErrorSinkNt(resultsJson, hasErrorSink, hasBackground);
    const srvDistribution = utils.getRateDistribution(
        resultsJson, 
        hasErrorSink, 
        ["fits", "Unconstrained model", "Rate Distributions", "Synonymous site-to-site rates"], 
        ["rate", "proportion"]
    );
    const mhRates = {
        'DH': _.get(resultsJson, ['fits', 'Unconstrained model', 'Rate Distributions', 'rate at which 2 nucleotides are changed instantly within a single codon']),
        'TH': _.get(resultsJson, ['fits', 'Unconstrained model', 'Rate Distributions', 'rate at which 3 nucleotides are changed instantly within a single codon'])
    };

    return {
        testedBranchCount: commonAttrs.testedBranchCount,
        srvRateClasses,
        srvDistribution,
        partitionSizes: commonAttrs.partitionSizes,
        hasBackground,
        hasSrvHmm,
        hasErrorSink,
        hasErrorSinkNt,
        mhRates
    };
}

export function getBustedTileSpecs(resultsJson, evThreshold, bsPositiveSelection, contributingSites) {
    const attrs = getBustedAttributes(resultsJson);
    const subFractions = _.map (
        [
            "Fraction of subs rate at which 2 nucleotides are changed instantly within a single codon", 
            "Fraction of subs rate at which 3 nucleotides are changed instantly within a single codon"
        ], 
        (d)=>resultsJson["fits"]["Unconstrained model"]["Rate Distributions"][d]
    );
    const omegaRateClasses = _.size(getBustedTestOmega(resultsJson, attrs.hasErrorSink));

    const tileTableInputs = [
        {
            number: resultsJson.input["number of sequences"],
            description: "sequences in the alignment",
            icon: "icon-options-vertical icons",
            color: "asbestos"
        },
        {
            number: resultsJson.input["number of sites"],
            description: "codon sites in the alignment",
            icon: "icon-options icons",
            color: "asbestos"
        },
        {
            number: resultsJson.input["partition count"],
            description: "partitions",
            icon: "icon-arrow-up icons",
            color: "asbestos"
        },
        {
            number: attrs.testedBranchCount,
            description: "median branches/partition used for testing",
            icon: "icon-share icons",
            color: "asbestos"
        },
        {
            number: omegaRateClasses + " classes",
            description: "non-synonymous rate variation",
            icon: "icon-grid icons",
            color: "asbestos"
        },
        {
            number: attrs.srvRateClasses ? attrs.srvRateClasses + " classes" + (attrs.hasSrvHmm ? " HMM" : "") : "None",
            description: "synonymous rate variation",
            icon: "icon-layers icons",
            color: "asbestos"
        },
        {
            number: floatFmt(resultsJson["test results"]["p-value"]),
            description: "p-value for episodic diversifying selection",
            icon: "icon-plus icons",
            color: "midnight_blue"
        },
        {
            number: resultsJson["Evidence Ratios"]["constrained"] ? _.filter(resultsJson["Evidence Ratios"]["constrained"][0], (d) => d >= evThreshold).length : 0,
            description: `Sites with ER≥${evThreshold} for positive selection`,
            icon: "icon-energy icons",
            color: "midnight_blue"
        },
        {
            number: !_.isUndefined(attrs.mhRates['DH']) ? floatFmt(attrs.mhRates['DH']) : "N/A" + ":" + !_.isUndefined(attrs.mhRates['TH']) ? floatFmt(attrs.mhRates['TH']) : "N/A",
            description: "Multiple hit rates (2H:3H)",
            icon: "icon-target icons",
            color: "midnight_blue"
        },
        {
            number: resultsJson["Evidence Ratios"]["constrained"] ? _.filter(bsPositiveSelection, (d) => d.ER >= 100).length : "N/A",
            description: "(branch, site) pairs with EBF ≥ 100",
            icon: "icon-bulb icons",
            color: "midnight_blue"
        },
        {
            number: contributingSites ? contributingSites.length : "N/A",
            description: "Sites contributing most signal to EDS detection",
            icon: "icon-tag icons",
            color: "midnight_blue"
        },
        {
            number: !_.isUndefined(subFractions[0]) ? percentageFormat(subFractions[0]) : "N/A" + ":" + !_.isUndefined(subFractions[1]) ? percentageFormat(subFractions[1]) : "N/A",
            description: "Expected fractions of MH subs (2H:3H)",
            icon: "icon-target icons",
            color: "midnight_blue"
        }
    ];

    return tileTableInputs;
}

/**
 * Retrieves the rate distribution for the unconstrained model test from the results JSON.
 *
 * @param {Object} resultsJson - The JSON object containing the BUSTED analysis results.
 * @param {boolean} hasErrorSink - A flag indicating if the error sink should be considered.
 *
 * @returns {Array|null} A sorted array of objects, each containing:
 *   - value: The rate value as specified by the first tag.
 *   - weight: The corresponding weight as specified by the second tag.
 *   The array is sorted by rate value. Returns null if no rate information is found.
 */

export function getBustedTestOmega(resultsJson, hasErrorSink) {
    if (!hasErrorSink) {
        hasErrorSink = getBustedAttributes(resultsJson).hasErrorSink;
    }

    return utils.getRateDistribution (resultsJson, hasErrorSink, ["fits","Unconstrained model","Rate Distributions","Test"])
}

export function getBustedErrorSinkRate(resultsJson, tag) {
    return _.get (resultsJson, ["fits","Unconstrained model","Rate Distributions", tag, "0"]);
}

export function getBustedHasErrorSinkNt(resultsJson, hasErrorSink, hasBackground){
  if (hasErrorSink) {
      if (getBustedErrorSinkRate(resultsJson, "Test")["proportion"] > 0) return true;
      if (hasBackground && getBustedErrorSinkRate(resultsJson, "Background")["proportion"] > 0) return true;
      return false;
  }
  return false;
}

/**
 * Identifies the most contributing sites to the episodic diversifying selection (EDS) signal.
 *
 * @param {Array<Object>} fig1data - An array of objects where each object contains information about a site, including the likelihood ratio (LR).
 *
 * @returns {Array<number>|null} An array of indices representing the sites that contribute the most to the EDS signal,
 * or null if the total LR is not greater than 2. The function accumulates the LR until it reaches 80% of the total LR
 * and returns the indices of these sites.
 */

export function getBustedContributingSites(siteTableData) {
  let site_lr = _.sortBy (_.map (siteTableData, (d,i)=>[d["LR"],i]), (d)=>-d[0]);
  const lrs = d3.sum (site_lr, (d)=>d[0]);
  if (lrs > 2) {
      let sites = [];
      let s = site_lr[0][0];
      sites.push (site_lr[0][1]);
      let i = 1;
      while (s < lrs * 0.8) {
        s += site_lr[i][0];  
        sites.push (site_lr[i][1]);
        i ++;
      }
      return sites;
  }
  return null;
}

export function getBustedSiteTableData(resultsJson) {
    const attrs =  getBustedAttributes(resultsJson);
    const siteIndexPartitionCodon = getBustedSiteIndexPartitionCodon(resultsJson);

  let site_info = [];
  let index = 0;
  _.each (resultsJson["data partitions"], (pinfo, partition)=> {
      _.each (pinfo["coverage"][0], (ignore, i)=> {
          
              let site_record = {
                  'Partition' : siteIndexPartitionCodon[index][0],
                  'Codon' : siteIndexPartitionCodon[index][1],
              };
              if (resultsJson["Evidence Ratios"]['optimized null']) {
                  site_record['ER (constrained)'] = resultsJson["Evidence Ratios"]['constrained'][0][index];
                  site_record['ER (optimized null)'] = resultsJson["Evidence Ratios"]['optimized null'][0][index];
              };
              site_record['LogL'] = resultsJson["Site Log Likelihood"]['unconstrained'][0][index];
              if (attrs.srvRateClasses) {
                  let site_srv = [];
                  _.each (attrs.srvDistribution, (d,i)=> {
                       site_srv.push ({'value' : d.value, 'weight' : resultsJson["Synonymous site-posteriors"][i][index]});
                  });
                  site_record['SRV posterior mean'] = getBustedDistMean (site_srv);
                  if (attrs.hasSrvHmm) {
                      site_record['SRV viterbi'] = attrs.srvDistribution[resultsJson["Viterbi synonymous rate path"][0][index]].value;
                  }
              }
              if (resultsJson["Evidence Ratios"]['optimized null']) {
                 site_record['LR'] = 2*Math.log (resultsJson["Evidence Ratios"]['optimized null'][0][index]);
              }
              site_info.push (site_record);
              index++;
          })  
        
      });
    return [site_info, {
      'Partition' : html`<abbr title = "Partition">Part.</abbr>`,
      'Codon' : html`<abbr title = "Site">Codon</abbr>`,
      'ER (constrained)' : html`<abbr title = "Evidence ratio for positive selection (constrained null)">ER (ω>1, constr.)</abbr>`,
      'ER (optimized null)' : html`<abbr title = "Evidence ratio for positive selection (optimized null)">ER (ω>1, optim.)</abbr>`,
      'SRV posterior mean' : html`<abbr title = "Posterior mean of the synonymous rate, α;">E<sub>post</sub>[α]</abbr>`,
      'SRV viterbi' : html`<abbr title = "Most likely rate value for the synonymous rate α (Viterbi path)">α</abbr>`,
      'logL' : html`<abbr title = "Site log-likelihood under the unconstrained model">log(L)</abbr>`,
      'LR' : html`<abbr title = "Site log-likelihood ratio contribution">LR</abbr>`
    }];
}

export function getBustedSiteIndexPartitionCodon(resultsJson) {
    return _.chain (resultsJson['data partitions']).map ((d,k)=>_.map (d['coverage'][0], (site)=>[+k+1,site+1])).flatten().value();
}

export function getBustedDistMean(d) {
    let m = 0;
    _.each (d, (r)=> {
        m += r['value'] * r['weight'];
    });
    return m;
}

export function getBustedDistVar(d) {
    let m2 = 0, m = getBustedDistMean (d);
    _.each (d, (r)=> {
        m2 += r['value']*r['value'] * r['weight'];
    });
    return m2 - m*m;
}

export function getBustedDistributionTable(resultsJson) {
    const attrs =  getBustedAttributes(resultsJson);

  let table = [];
  _.each (["Unconstrained model", "Constrained model"], (m)=> {
      if (!_.get (resultsJson,["fits",m])) return;
      let record = {'Model' : m};
      record['LogL'] = _.get (resultsJson,["fits",m,"Log Likelihood"]);
      record['AICc'] = _.get (resultsJson,["fits",m,"AIC-c"]);
      record['p'] = _.get (resultsJson,["fits",m,"estimated parameters"]);
      record['dist'] = ["Tested", utils.getRateDistribution (resultsJson, attrs.hasErrorSink, ["fits",m,"Rate Distributions","Test"]),"&omega;",m + " ω tested"];
      record['plot'] = ["ω",record['dist'][1]];
      table.push (record);
      if (attrs.hasBackground) {
          record = {'Model' : m};
          record['dist'] = ["Background", utils.getRateDistribution(resultsJson, attrs.hasErrorSink, ["fits",m,"Rate Distributions","Background"]),"&omega;",m + " ω background" ];
          record['plot'] = ["ω",record['dist'][1]];
          table.push (record);
      }
      if (attrs.srvRateClasses) {
        record = {'Model' : m};
        record['dist'] = ["Synonymous rates", utils.getRateDistribution(resultsJson, attrs.hasErrorSink, ["fits",m,"Rate Distributions","Synonymous site-to-site rates"], ["rate", "proportion"]),"",m + " syn rates" ];
        record['plot'] = ["",record['dist'][1]];
        table.push (record);
      }
  });
  return table;
}

export function getBustedErrorSink(resultsJson, treeObjects, hasErrorSinkNt) {
    if (!treeObjects) {
        treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
    }
    if (!hasErrorSinkNt) {
        const attrs = getBustedAttributes(resultsJson);
        hasErrorSinkNt = attrs.hasErrorSinkNT;
    }
    
    if (hasErrorSinkNt) {
        let weight = getBustedErrorSinkRate(resultsJson, "Test")["proportion"];
        return getBustedPosteriorsPerBranchSite (resultsJson, treeObjects, 0, weight / (1-weight));
    }
    return [];
}

/**
 * Computes the branch-site positive selection sites for a set of results.
 *
 * This function takes the results of a Busted analysis, and returns an array
 * of objects each containing the branch name, site number, posterior probability
 * and evidence ratio for each site that was detected as showing positive selection.
 *
 * @param {Object} resultsJson - The JSON object containing the Busted results
 * @param {Array<phylotree.phylotree>} treeObjects - An array of phylotree objects
 *   for each partition
 * @param {Array<Object>} testOmega - The rate distribution for the tested
 *   branches
 * @param {bool} hasErrorSink - Whether the error sink class was used
 *
 * @returns {Array<Object>} An array of objects each containing the branch name,
 *   site number, posterior probability and evidence ratio for each site that
 *   was detected as showing positive selection
 */
export function getBustedPositiveSelection(resultsJson, treeObjects, testOmega, hasErrorSink) {
    if (!treeObjects) {
        treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
    }
    if (!hasErrorSink) {
        hasErrorSink = getBustedAttributes(resultsJson).hasErrorSink;
    }
    if (!testOmega) {
        testOmega = getBustedTestOmega(resultsJson, hasErrorSink);
    }
    
    let w =  testOmega[testOmega.length - 1].weight;
    
    if (w < 1) {
        return getBustedPosteriorsPerBranchSite (resultsJson, treeObjects, testOmega.length - 1 + (hasErrorSink ? 1 :0),w / (1-w));
    }

    return [];
}

/**
 * Computes posterior probabilities for each branch-site combination and returns
 * detailed information for each site.
 *
 * @param {Object} resultsJson - The JSON object containing the results of the
 * analysis, including branch attributes and substitution information.
 * @param {Array<phylotree.phylotree>} treeObjects - An array of phylotree objects
 *   for each partition
 * @param {number} rateClass - The index of the rate distribution to use for
 *   computing posteriors
 * @param {number} priorOdds - The prior odds for the tested rate distribution
 *
 * @returns {Array<Object>} An array of objects, each containing:
 *   - Key: A string combining the branch name and site index
 *   - Posterior: The posterior probability for the site
 *   - ER: The evidence ratio for the site
 *   - subs: Substitution information
 *   - from: The originating state of the substitution
 *   - to: The resulting state of the substitution
 *   - synSubs: The count of synonymous substitutions
 *   - nonsynSubs: The count of non-synonymous substitutions
 */
export function getBustedPosteriorsPerBranchSite(resultsJson, treeObjects, rateClass, priorOdds) {
    if (!treeObjects) {
        treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
    }
    
  let results = [];
  let offset = 0;
  _.each (resultsJson["branch attributes"], (data, partition) => {
      let partitionSize = 0;
      let subs = _.get (resultsJson, ["substitutions",partition]);
      let subsAtSite = {};
      _.each (data, (perBranch, branch)=> {
          if (perBranch ["Posterior prob omega class by site"]) {
            _.each (perBranch ["Posterior prob omega class by site"][rateClass], (p,i)=> {
                if ((i in subsAtSite) == false) {
                     subsAtSite[i] = phylotreeUtils.generateNodeLabels (treeObjects[partition], subs[i]);
                }
                const info = subsAtSite[i][branch];
                
                const subCount = utils.subsForPair (info[2],info[0])
                results.push ({
                    'Key' : branch + "|" + (i + offset + 1), 
                    'Posterior' : p, 
                    'ER' : (p/(1-p))/priorOdds,
                    'from' : info[2],
                    'to' : info[0],
                    'subs' : info[3],
                    'synSubs' : subCount[0],
                    'nonsynSubs' : subCount[1]
                  },
                );
            });     
            partitionSize = perBranch ["Posterior prob omega class by site"][rateClass].length;
          }
      });
      offset += partitionSize;
  });
  return results;
}

/**
 * Extracts multi-hit evidence ratios from BUSTED results JSON
 *
 * @param {Object} resultsJson - The JSON object containing the BUSTED results
 * @param {string} key - The key to extract from branch attributes
 * @returns {Array<Object>} An array of objects with Key and ER properties
 */
export function getBustedMultiHitER(resultsJson, key) {
  let results = [];
  let offset = 0;
  _.each (resultsJson["branch attributes"], (data, partition) => {
      let partition_size = 0;
      _.each (data, (per_branch, branch)=> {
          if (key in per_branch) {
            _.each (per_branch [key], (p,i)=> {
                results.push ({'Key' : branch + "|" + p[0] + offset, 'ER' : p[1]});
            });     
            partition_size = resultsJson["data partitions"][partition]["coverage"][0].length;
          }
      });
      offset += partition_size;
  });
  return results;
}
