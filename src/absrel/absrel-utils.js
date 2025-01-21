/**
 * @module absrel-utils
 * @description Utility functions for aBSREL visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as utils from "../utils/general-utils.js";
import * as summaryStats from "../stats/summaries.js";

const floatFormat = d3.format (".2g")

/**
 * Extracts some summary attributes from aBSREL results that are used later in the
 * visualization.
 *
 * @param {Object} results_json - The JSON object containing the aBSREL results
 *
 * @returns {Object} An object with the following attributes:
 *   - positive_results: {Object} An object with the number of positive results
 *     for each partition
 *   - pvalue_threshold: {number} The P-value threshold used in the analysis
 *   - profilable_branches: {Set<string>} A set of branch names that were tested
 *     for positive selection
 *   - tested_branch_count: {number} The median number of branches tested for
 *     selection for each partition
 *   - srv_rate_classes: {number} The number of rate classes for the synonymous
 *     site-to-site rate distribution
 *   - srv_distribution: {Object} An object with the rate values and their
 *     associated weights for the synonymous site-to-site rate distribution
 *   - omega_rate_classes: {Array<number>} An array of the number of rate
 *     classes for the omega distribution for each partition
 *   - mh_rates: {Object} An object with the median rates for two and three
 *     nucleotide changes per codon
 *   - tree_objects: {Array<phylotree.phylotree>} An array of phylotree objects
 *     for each partition
 *   - profileBranchSites: {Array<Object>} An array of objects containing
 *     information about sites that were tested for positive selection
 */
export function get_attributes(results_json) {
    const positive_results = results_json["test results"]["positive test results"]
    const pvalue_threshold = results_json["test results"]["P-value threshold"]
    const profilable_branches = new Set (_.chain (_.get (results_json, ["Site Log Likelihood","tested"])).keys().value())
    const tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map((d)=>_.filter (_.map (d), (d)=>d=="test").length).value())
    const srv_rate_classes = results_json["Synonymous site-posteriors"] ? results_json["Synonymous site-posteriors"].length: 0
    const srv_distribution = getRateDistribution (results_json, ["fits","Full adaptive model","Rate Distributions","Synonymous site-to-site rates"], ["rate","proportion"])
    const omega_rate_classes = _.map (results_json["branch attributes"]["0"], (d)=>d["Rate classes"])
    const mh_rates = ({
        'DH' : _.chain(_.map (results_json["branch attributes"][0], (d,k) => [k,_.get (d, ['rate at which 2 nucleotides are changed instantly within a single codon'])])).filter (d=>!_.isUndefined(d[1])).fromPairs().value(),
        'TH' : _.chain(_.map (results_json["branch attributes"][0], (d,k) => [k,_.get (d, ['rate at which 3 nucleotides are changed instantly within a single codon'])])).filter (d=>!_.isUndefined(d[1])).fromPairs().value()
    })
    

    return {
        "positive_results" : positive_results,
        "pvalue_threshold" : pvalue_threshold,
        "profilable_branches" : profilable_branches,
        "tested_branch_count" : tested_branch_count,
        "srv_rate_classes" : srv_rate_classes,
        "srv_distribution" : srv_distribution,
        "omega_rate_classes" : omega_rate_classes,
        "mh_rates" : mh_rates
    }
}

/**
 * Creates the data for the tile table that displays various summary attributes
 * for an aBSREL analysis.
 *
 * @param {Object} results_json - The JSON object containing the aBSREL results
 * @param {number} ev_threshold - The evidence threshold *
 * @returns {Object} An object with the following attributes:
 *   - tile_table_inputs: {Array<Object>} An array of objects with the following
 *     attributes:
 *       - number: {string} A string representation of the number to be displayed
 *       - description: {string} A description of the number being displayed
 *       - icon: {string} The CSS class for the icon associated with the number
 *       - color: {string} The color to use for the icon
 */
export function get_tile_specs(results_json, ev_threshold, tree_objects) {
    const attrs = get_attributes(results_json)
    const distributionTable = getDistributionTable(results_json, ev_threshold, tree_objects)

    const median_DH = _.size(attrs.mh_rates['DH']) ? floatFormat (d3.median (_.map (attrs.mh_rates['DH']))) : "N/A"
    const median_TH = _.size(attrs.mh_rates['TH']) ? floatFormat (d3.median (_.map (attrs.mh_rates['TH']))) : "N/A"

    const tile_table_inputs = [
        {
            "number": results_json.input["number of sequences"],
            "description": "sequences in the alignment",
            "icon": "icon-options-vertical icons",
            "color": "asbestos",
        },
        {
            "number": results_json.input["number of sites"],
            "description": "codon sites in the alignment",
            "icon": "icon-options icons",
            "color": "asbestos"
        },
        {
            "number": results_json.input["partition count"],
            "description": "partitions",
            "icon": "icon-arrow-up icons",
            "color": "asbestos"
        },
        {
            "number": attrs.tested_branch_count,
            "description": "median branches/ partition used for testing",
            "icon": "icon-share icons",
            "color": "asbestos",
        },
        {
            "number": d3.extent (attrs.omega_rate_classes).join ("-"),
            "description": "rate classes per branch",
            "icon": "icon-grid icons",
            "color": "asbestos"
        },
        {
            "number": attrs.srv_rate_classes ? "" + attrs.srv_rate_classes + " classes" : "None",
            "description": "synonymous rate variation",
            "icon": "icon-layers icons",
            "color": "asbestos"
        },
        {
            "number": attrs.positive_results,
            "description": "branches with evidence of selection",
            "icon": "icon-plus icons",
            "color": "midnight_blue",
        },
        {
            "number": floatFormat(d3.mean (_.map (_.filter (distributionTable, (r)=>r.tested == "Yes"), (d)=>d.sites))||0),
            "description": "Sites/tested branch with ER≥" + ev_threshold + " for positive selection",
            "icon": "icon-energy icons",
            "color": "midnight_blue"
        },
        {
            "number": median_DH + ":" + median_TH,
            "description": "Median multiple hit rates (2H:3H)",
            "icon": "icon-target icons",
            "color": "midnight_blue"
        }
    ]

    return tile_table_inputs;
}

  /**
   * Create a table of results for each branch in the input aBSREL run.
   *
   * @param {Object} results_json - The JSON object containing the aBSREL results
   * @param {number} ev_threshold - The threshold for the ER statistic
   *
   * @returns {Array} An array of objects each with the following properties:
   *   - branch: The name of the branch
   *   - tested: Whether the branch was tested for positive selection
   *   - p-value: The p-value of the test if tested, null otherwise
   *   - sites: The number of sites with ER >= ev_threshold if tested, null
   *     otherwise
   *   - rates: The number of rate classes in the omega distribution for the
   *     branch
   *   - dist: An array of three elements:
   *     1. The string "&omega;"
   *     2. The result of the test_omega function for this branch
   *     3. An empty string
   *   - plot: An array of two elements:
   *     1. An empty string
   *     2. The second element of the dist array
   */
export function getDistributionTable(results_json, ev_threshold, tree_objects) {
  let table = [];

  const attrs = get_attributes(results_json);
  let site_er = getPosteriorsPerBranchSite(results_json, true, ev_threshold, tree_objects);
  
  _.each (results_json["branch attributes"][0], (info, b)=> {
    let row = {'branch' : b};
    const is_tested = results_json["tested"][0][b] == "test";
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
    row ['dist'] = ["&omega;",test_omega(results_json, b),""];
    row['plot'] = ["",row['dist'][1]];
    table.push (row);
  });
  
  return table;
}


// TODO: this may need to be two functions. I dont like it returns different things
// under different circumstances, uses different params, etc.
/**
 * Computes posterior probabilities for each branch-site combination and returns
 * either a count of sites with evidence ratio (ER) above a threshold or detailed
 * information for each site.
 *
 * @param {Object} results_json - The JSON object containing the results of the
 * analysis, including branch attributes and substitution information.
 * @param {boolean} do_counts - If true, returns a count of sites with ER >= er
 * for each branch. If false, returns an array of objects containing detailed
 * information for each site. 
 * @param {number} er - The threshold for the evidence ratio (ER) statistic.
 *
 * @returns {Object|Array} - If do_counts is true, returns an object with branch
 * names as keys and counts of sites with ER >= er as values. If do_counts is
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
export function getPosteriorsPerBranchSite(results_json, do_counts, er, tree_objects) {
  let results = do_counts ? {} : [];
  let offset = 0;
  const subs = _.get (results_json, ["substitutions","0"]);
    
  _.each (results_json["branch attributes"], (data, partition) => {
      let partition_size = 0;
      let subs_per_site = {};
      _.each (data, (per_branch, branch)=> {
          if (per_branch ["posterior"]) {
            const prior_d = test_omega (results_json, branch);
            let prior_odds = prior_d[prior_d.length-1].weight;
            const rate_class = prior_d.length-1;
            if (prior_odds < 1 && prior_odds > 0) {
              prior_odds = prior_odds / (1-prior_odds);
              _.each (per_branch ["posterior"][rate_class], (p,i)=> {
                  if (! do_counts && (i in subs_per_site) == false) {
                      subs_per_site[i] = phylotreeUtils.generateNodeLabels (tree_objects[0], subs[i])
                  }
                 
                  if (do_counts) {
                    results[branch] = (results[branch] ? results[branch] : 0) + ((p/(1-p))/prior_odds >= er);
                  } else {
                    const info = subs_per_site [i][branch];
                    let sub_count = utils.subs_for_pair (info[2], info[0]);
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
 * @param {Object} results_json - The JSON object containing the results,
 * which includes site log likelihoods and substitution data.
 * @param {Array<Object>} tree_objects - An array of tree objects.
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
export function getProfileBranchSites(results_json, tree_objects) {
  let results = [];
  const unc = _.get (results_json, ["Site Log Likelihood","unconstrained","0"]);
  const subs = _.get (results_json, ["substitutions","0"]);
  if (unc) {
    _.each (unc, (ll, i)=> {
        const subs_at_site = phylotreeUtils.generateNodeLabels (tree_objects[0], subs[i]);
        _.each (subs_at_site, (info, node)=> {
      
             if (node != 'root') {
                const bs_ll = _.get (results_json, ["Site Log Likelihood","tested",node,0,i]);
                if (bs_ll) {
                    let bit = {};
                    bit.Key = node + "|" + (i+1);
                    bit.branch = node;
                    bit.site = i+1;
                    bit.ER = Math.exp (unc[i]-bs_ll);
                    bit.subs = info[3];
                    bit.from = info[2];
                    bit.to = info[0];
                    let sub_count = utils.subs_for_pair (bit.from, bit.to);
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
 * Retrieves and sorts rate distribution data from the results JSON.
 *
 * @param {Object} results_json - The JSON object containing the results
 * @param {Array} keys - The keys used to access the rate distribution data
 *   within the results JSON.
 * @param {Array} [tags=["omega", "proportion"]] - Optional tags to specify
 *   the fields for rate value and weight in the rate distribution data.
 *
 * @returns {Array|null} A sorted array of objects, each containing:
 *   - value: The rate value as specified by the first tag.
 *   - weight: The corresponding weight as specified by the second tag.
 *   The array is sorted by rate value. Returns null if no rate information
 *   is found.
 */

function getRateDistribution(results_json, keys, tags) {
    tags = tags || ["omega", "proportion"];
    const rate_info = _.get (results_json, keys);

    if (rate_info) { 
      const rate_distribution = _.sortBy (_.map (rate_info, (d)=>({
        "value" : d[tags[0]],
        "weight" : d[tags[1]]
      })), (d)=>d.rate);
      return rate_distribution;
    }

    return null;
}

/**
 * Generates an array of arrays, where each sub-array contains the partition
 * index and site index for each site in the results. The partition index is
 * one-based, and the site index is zero-based.
 *
 * @param {Object} results_json - The JSON object containing the aBSREL results
 * @returns {Array<Array<number>>} The array of arrays containing partition
 *   index and site index for each site
 */
export function getSiteIndexPartitionCodon(results_json) {
    return _.chain (results_json['data partitions']).map ((d,k)=>_.map (d['coverage'][0], (site)=>[+k+1,site+1])).flatten().value();
}



/**
 * Retrieves the rate distribution for a given branch in the results JSON.
 *
 * @param {Object} results_json - The JSON object containing the aBSREL results
 * @param {string} branch - The name of the branch for which to retrieve the
 *   rate distribution
 *
 * @returns {Array|null} A sorted array of objects, each containing:
 *   - value: The rate value as specified by the first tag.
 *   - weight: The corresponding weight as specified by the second tag.
 *   The array is sorted by rate value. Returns null if no rate information
 *   is found.
 */
export function test_omega(results_json, branch) {
  return getRateDistribution (results_json, ["branch attributes","0",branch,"Rate Distributions"],["0","1"])
}

/**
 * Retrieves the corrected P-value for a given branch in the results JSON.
 *
 * @param {Object} results_json - The JSON object containing the aBSREL results
 * @param {string} branch - The name of the branch for which to retrieve the
 *   corrected P-value
 *
 * @returns {number|null} The corrected P-value for the given branch, or
 *   null if no P-value information is found.
 */
export function test_pv(results_json, branch) {
    return _.get (results_json,["branch attributes","0",branch,"Corrected P-value"])
}

export function siteTableData(results_json, ev_threshold, profileBranchSites) {
    const attrs = get_attributes(results_json);
    const siteIndexPartitionCodon = getSiteIndexPartitionCodon(results_json);

  let site_info = [];
  let index = 0;
  let bySite = _.groupBy (profileBranchSites, (d)=>d.site);
  _.each (results_json["data partitions"], (pinfo, partition)=> {
      _.each (pinfo["coverage"][0], (ignore, i)=> {
          
              let site_record = {
                  'Codon' : siteIndexPartitionCodon[index][1],
              };

              const sll = _.get (results_json, ["Site Log Likelihood",'unconstrained',0,index]);
              if (sll) {
                site_record['LogL'] = sll;
              }
        
              if (attrs.srv_distribution) {
                  let site_srv = [];
                  _.each (attrs.srv_distribution, (d,i)=> {
                       site_srv.push ({'value' : d.value, 'weight' : results_json["Synonymous site-posteriors"][i][index]});
                  });
                  site_record['SRV posterior mean'] = summaryStats.distMean (site_srv);
              }
              site_record ["Subs"] = d3.sum (bySite[i+1], (d)=>d.subs);
              site_record ["ER"] = _.filter (bySite[i+1], (d)=>d.ER >= ev_threshold).length;
              
              site_info.push (site_record);
              index++;
          })  
        
      });
    return [site_info, {
      'Codon' : "<abbr title = \"Site\">Codon</abbr>",
      'SRV posterior mean' : "<abbr title = \"Posterior mean of the synonymous rate, α;\">E<sub>post</sub>[α]</abbr>",
      'LogL' : "<abbr title = \"Site log-likelihood under the unconstrained model\">log(L)</abbr>",
      'Subs' : "<abbr title = \"Total # of substitutions (s+ns)\">Subs</abbr>",
      'ER' : "<abbr title = \"Total # branches with evidence ratio > ${ev_threshold}\">ER Branch</abbr>",
    }];
}