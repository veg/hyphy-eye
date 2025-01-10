/**
 * @module absrel-utils
 * @description Utility functions for aBSREL visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import * as phylotree from "phylotree";

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
    const tree_objects = _.map (results_json.input.trees, (tree,i)=> {
        let T = new phylotree.phylotree (tree);
        T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name]["Global MG94xREV"];
        return T;
    });
    const profileBranchSites = getProfileBranchSites(results_json, tree_objects);

    return {
        "positive_results" : positive_results,
        "pvalue_threshold" : pvalue_threshold,
        "profilable_branches" : profilable_branches,
        "tested_branch_count" : tested_branch_count,
        "srv_rate_classes" : srv_rate_classes,
        "srv_distribution" : srv_distribution,
        "omega_rate_classes" : omega_rate_classes,
        "mh_rates" : mh_rates,
        "tree_objects" : tree_objects,
        "profileBranchSites" : profileBranchSites
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
export function get_tile_specs(results_json, ev_threshold) {
    const attrs = get_attributes(results_json)
    const distributionTable = getDistributionTable(results_json, ev_threshold)

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
export function getDistributionTable(results_json, ev_threshold) {
  let table = [];

  const attrs = get_attributes(results_json);
  let site_er = getPosteriorsPerBranchSite(results_json, true, ev_threshold, attrs.tree_objects);
  
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
                      subs_per_site[i] = generateNodeLabels (tree_objects[0], subs[i])
                  }
                 
                  if (do_counts) {
                    results[branch] = (results[branch] ? results[branch] : 0) + ((p/(1-p))/prior_odds >= er);
                  } else {
                    const info = subs_per_site [i][branch];
                    let sub_count = subs_for_pair (info[2], info[0]);
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
        const subs_at_site = generateNodeLabels (tree_objects[0], subs[i]);
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
                    let sub_count = subs_for_pair (bit.from, bit.to);
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

/**
 * Computes the number of synonymous and nonsynonymous substitutions on a given
 * path between two codons.
 *
 * @param {Array} from - The starting codon, represented as an array of 3
 *   single-character strings.
 * @param {Array} to - The ending codon, represented as an array of 3
 *   single-character strings.
 * @param {Array} path - An array of indices indicating the order in which
 *   positions in the codon should be changed to get from the starting codon to
 *   the ending codon.
 *
 * @returns {Array} An array of two elements. The first element is the number
 *   of synonymous substitutions, and the second element is the number of
 *   nonsynonymous substitutions.
 */
function path_diff(from,to,path) {
    let result = [0,0];
    let curr = _.map (from),
        next = _.clone (curr);
   
    next [path[0]] = to[path[0]];
    const is_syn = translate_ambiguous_codon (curr.join ("")) == translate_ambiguous_codon(next.join (""));
    result[is_syn ? 0 : 1] += 1;
    for (let i = 1; i < path.length; i++) {
        curr = _.clone (next);
        next [path[i]] = to[path[i]];
        const is_syn = translate_ambiguous_codon (curr.join ("")) == translate_ambiguous_codon(next.join (""));
        result[is_syn ? 0 : 1] += 1;
    }
  
    return result;
}

/**
 * Calculates the number of possible synonymous and non-synonymous substitutions
 * between two codon sequences as they diverge.
 *
 * @param {string} from - The original codon sequence.
 * @param {string} to - The target codon sequence.
 *
 * @returns {Array<number>} An array with two elements:
 *   - The first element is the count of synonymous substitutions.
 *   - The second element is the count of non-synonymous substitutions.
 *   If either codon sequence is 'NNN', both counts are zero.
 */

function subs_for_pair(from, to) {

    if (from == 'NNN' || to == 'NNN') {
        return [0,0];
    }
  
    let diffs = [];
    _.each (from, (c,i)=> {
      if (c != to[i]) {
          diffs.push (i);
      }
    });
    switch (diffs.length) {
      case 0:
          return [0,0];
      case 1:
          if (translate_ambiguous_codon (from) == translate_ambiguous_codon(to)) {
              return [1,0];
          }
          return [0,1];
      case 2: {
          let res = path_diff (from,to,[diffs[0],diffs[1]]);
          _.each (path_diff (from,to,[diffs[1],diffs[0]]), (d,i) => {res[i] += d;});
          return _.map (res, (d)=>0.5*d);
      }
       case 3: {
          let res = path_diff (from,to,[diffs[0],diffs[1],diffs[2]]);
          _.each (path_diff (from,to,[diffs[0],diffs[2],diffs[1]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[1],diffs[0],diffs[2]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[1],diffs[2],diffs[0]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[2],diffs[0],diffs[1]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[2],diffs[1],diffs[0]]), (d,i) => {res[i] += d;});
          return _.map (res, (d)=>d/6); 
       }
    }
}


    /**
     * Computes a set of labels for each node in a tree.
     *
     * @param {PhyloTree} T - The tree.
     * @param {Object.<string,string>} labels - A mapping of node names to their labels (as strings of length 3).
     * @return {Object.<string,array>} - A mapping of node names to their labels, with the value being an array
     *  of [label, translation, parent label, number of substitutions].  Substitutions are only counted between
     *  non-ambiguous, non-degenerate codons.
     */
export function generateNodeLabels(T, labels) {
    let L = {};
    T.traverse_and_compute (function (n) {
        if (n.data.name in labels) {
            L[n.data.name] = [labels[n.data.name], translate_ambiguous_codon (labels[n.data.name]),'',0];
            if (n.parent) {
              L[n.data.name][2] = L[n.parent.data.name][0];             
              _.each (L[n.data.name][0], (c,i)=> {
                  const c2 = L[n.data.name][2][i];
                  if (c2 != c && c != '-' && c2 != '-' && c != 'N' && c2 != 'N') {
                    L[n.data.name][3] ++;
                  }
              });
            }
        } else {
          if (n.parent) {
            L[n.data.name] = _.clone (L[n.parent.data.name]);
            L[n.data.name][2] = L[n.data.name][0];
            L[n.data.name][3] = 0;
          } else {
            L['root'] = [labels["root"], translate_ambiguous_codon (labels["root"]), "", 0];
          }
        }
        L[n.data.name][4] = !_.isUndefined (n.children);
    },"pre-order");
    return L;
}

/**
 * Computes the weighted mean of a distribution.
 *
 * @param {Array.<{value: number, weight: number}>} distribution - An array of objects representing the distribution, 
 *        where each object contains a 'value' and a 'weight'.
 * @return {number} The weighted mean of the distribution.
 */
export function distMean(distribution) {
    let weightedSum = 0;

    _.each(distribution, ({ value, weight }) => {
        weightedSum += value * weight;
    });

    // TODO ask sergei why we dont divide by sum of weights here
    // thats either a bug, or a thing that needs documenting/ possibly changing some misleading var names or something

    return weightedSum;
}



/**
 * Computes the variance of a distribution specified by an array of objects,
 * where each object has a 'value' and a 'weight' property.
 *
 * @param {Array.<Object>} d - An array of objects, each with a 'value'
 *   property and a 'weight' property.
 * @return {number} The variance of the distribution.
 */

export function distVar(d) {
    let m2 = 0, m = distMean (d);
    _.each (d, (r)=> {
        m2 += r['value']*r['value'] * r['weight'];
    });
    return m2 - m*m;
}

/**
 * Translate a codon to an amino acid, handling ambiguous codes.
 * 
 * If the codon is unambiguous, just return the translation.
 * If the codon is ambiguous, return a string of all possible translations, 
 * sorted alphabetically.
 * 
 * @param {string} codon - a three-nucleotide codon
 * @return {string} the amino acid(s) corresponding to the codon
 */
function translate_ambiguous_codon(codon) {
    const translation_table = get_translation_table();

    if (codon in translation_table) {
      return  translation_table[codon];
    }
  
    let options = {};
    _.each (ambiguous_codes[codon[0]], (n1)=> {
         _.each (ambiguous_codes[codon[1]], (n2)=> {
            _.each (ambiguous_codes[codon[2]], (n3)=> {
                let c = translation_table[n1+n2+n3];
                if (c in options) {
                  options[c] += 1; 
                } else {
                  options [c] = 1; 
                }
            });
          });
    });
  
    options = _.keys(options);
    if (options.length == 0) {
      return "?"; 
    }
    return _.sortBy (options).join ("");
}

/**
 * A dictionary mapping codons to amino acids. The dictionary is
 * constructed from a table of codons and their corresponding amino
 * acids, with the codons as keys and the amino acids as values.
 * 
 * The table is adapted from the GenBank documentation, with the
 * addition of the codon 'NNN' mapping to the amino acid '?', and
 * the codon '---' mapping to the amino acid '-'.
 * 
 * @return {Object} a dictionary mapping codons to amino acids
 */
function get_translation_table() {
  var code = d3.csvParse("Codon,AA\nTTT,F\nTCT,S\nTAT,Y\nTGT,C\nTTC,F\nTCC,S\nTAC,Y\nTGC,C\nTTA,L\nTCA,S\nTAA,*\nTGA,*\nTTG,L\nTCG,S\nTAG,*\nTGG,W\nCTT,L\nCCT,P\nCAT,H\nCGT,R\nCTC,L\nCCC,P\nCAC,H\nCGC,R\nCTA,L\nCCA,P\nCAA,Q\nCGA,R\nCTG,L\nCCG,P\nCAG,Q\nCGG,R\nATT,I\nACT,T\nAAT,N\nAGT,S\nATC,I\nACC,T\nAAC,N\nAGC,S\nATA,I\nACA,T\nAAA,K\nAGA,R\nATG,M\nACG,T\nAAG,K\nAGG,R\nGTT,V\nGCT,A\nGAT,D\nGGT,G\nGTC,V\nGCC,A\nGAC,D\nGGC,G\nGTA,V\nGCA,A\nGAA,E\nGGA,G\nGTG,V\nGCG,A\nGAG,E\nGGG,G\n");
  var mapped_code = {};
  _.each (code, (v,k) => {mapped_code[v.Codon] = v.AA;});
  mapped_code["---"] = "-";
  mapped_code["NNN"] = "?";
  
  return mapped_code;
}

export function siteTableData(results_json, ev_threshold) {
    const attrs = get_attributes(results_json);
    const siteIndexPartitionCodon = getSiteIndexPartitionCodon(results_json);

  let site_info = [];
  let index = 0;
  let bySite = _.groupBy (attrs.profileBranchSites, (d)=>d.site);
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
                  site_record['SRV posterior mean'] = distMean (site_srv);
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