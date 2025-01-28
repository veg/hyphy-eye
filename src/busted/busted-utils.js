// TODO: need to refactor to reduce code duplication. this module may disappear then.

/**
 * @module busted-utils
 * @description Utility functions for aBSREL visualization
 */

import * as _ from "lodash-es";
import * as d3 from "d3";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as utils from "../utils/general-utils.js";
import {html} from "htl";

const floatFmt = d3.format (".2g")
const percentageFormat = d3.format (".2p")

export function get_attributes(results_json) {
    const tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map((d)=>_.filter (_.map (d), (d)=>d=="test").length).value())
    const srv_rate_classes = _.size (results_json.fits["Unconstrained model"]["Rate Distributions"]["Synonymous site-to-site rates"])
    const partition_sizes = _.chain (results_json['data partitions']).map ((d,k)=>(d['coverage'][0].length)).value();
    const has_background = _.get (results_json, ["fits","Unconstrained model","Rate Distributions","Background"])
    const srv_hmm = "Viterbi synonymous rate path" in results_json
    const has_error_sink = results_json["analysis"]["settings"] && results_json["analysis"]["settings"]["error-sink"] ? true : false;
    const has_error_sink_nt = get_has_error_sink_nt(results_json, has_error_sink, has_background);
    const omega_rate_classes = _.size (test_omega(results_json, has_error_sink))
    const srv_distribution = getRateDistribution (results_json, has_error_sink, ["fits","Unconstrained model","Rate Distributions","Synonymous site-to-site rates"], ["rate","proportion"])
    const mh_rates = ({
        'DH' : _.get (results_json, ['fits', 'Unconstrained model','Rate Distributions', 'rate at which 2 nucleotides are changed instantly within a single codon']),
        'TH' : _.get (results_json, ['fits', 'Unconstrained model','Rate Distributions', 'rate at which 3 nucleotides are changed instantly within a single codon'])
    })

    return {
        "tested_branch_count" : tested_branch_count,
        "srv_rate_classes" : srv_rate_classes,
        "srv_distribution" : srv_distribution,
        "omega_rate_classes" : omega_rate_classes,
        "partition_sizes" : partition_sizes,
        "has_background" : has_background,
        "srv_hmm" : srv_hmm,
        "has_error_sink" : has_error_sink,
        "has_error_sink_nt" : has_error_sink_nt,
        "mh_rates" : mh_rates
    }
}

export function get_tile_specs(results_json, ev_threshold, bsPositiveSelection, contributing_sites) {
    const attrs = get_attributes(results_json);
    const sub_fractions = _.map (
        [
            "Fraction of subs rate at which 2 nucleotides are changed instantly within a single codon", 
            "Fraction of subs rate at which 3 nucleotides are changed instantly within a single codon"
        ], 
        (d)=>results_json["fits"]["Unconstrained model"]["Rate Distributions"][d]
    );

    const tile_table_inputs = [
        {
            number: results_json.input["number of sequences"],
            description: "sequences in the alignment",
            icon: "icon-options-vertical icons",
            color: "asbestos"
        },
        {
            number: results_json.input["number of sites"],
            description: "codon sites in the alignment",
            icon: "icon-options icons",
            color: "asbestos"
        },
        {
            number: results_json.input["partition count"],
            description: "partitions",
            icon: "icon-arrow-up icons",
            color: "asbestos"
        },
        {
            number: attrs.tested_branch_count,
            description: "median branches/partition used for testing",
            icon: "icon-share icons",
            color: "asbestos"
        },
        {
            number: attrs.omega_rate_classes + " classes",
            description: "non-synonymous rate variation",
            icon: "icon-grid icons",
            color: "asbestos"
        },
        {
            number: attrs.srv_rate_classes ? attrs.srv_rate_classes + " classes" + (attrs.srv_hmm ? " HMM" : "") : "None",
            description: "synonymous rate variation",
            icon: "icon-layers icons",
            color: "asbestos"
        },
        {
            number: floatFmt(results_json["test results"]["p-value"]),
            description: "p-value for episodic diversifying selection",
            icon: "icon-plus icons",
            color: "midnight_blue"
        },
        {
            number: results_json["Evidence Ratios"]["constrained"] ? _.filter(results_json["Evidence Ratios"]["constrained"][0], (d) => d >= ev_threshold).length : 0,
            description: `Sites with ER≥${ev_threshold} for positive selection`,
            icon: "icon-energy icons",
            color: "midnight_blue"
        },
        {
            number: !_.isUndefined(attrs.mh_rates['DH']) ? floatFmt(attrs.mh_rates['DH']) : "N/A" + ":" + !_.isUndefined(attrs.mh_rates['TH']) ? floatFmt(attrs.mh_rates['TH']) : "N/A",
            description: "Multiple hit rates (2H:3H)",
            icon: "icon-target icons",
            color: "midnight_blue"
        },
        {
            number: results_json["Evidence Ratios"]["constrained"] ? _.filter(bsPositiveSelection, (d) => d.ER >= 100).length : "N/A",
            description: "(branch, site) pairs with EBF ≥ 100",
            icon: "icon-bulb icons",
            color: "midnight_blue"
        },
        {
            number: contributing_sites ? contributing_sites.length : "N/A",
            description: "Sites contributing most signal to EDS detection",
            icon: "icon-tag icons",
            color: "midnight_blue"
        },
        {
            number: !_.isUndefined(sub_fractions[0]) ? percentageFormat(sub_fractions[0]) : "N/A" + ":" + !_.isUndefined(sub_fractions[1]) ? percentageFormat(sub_fractions[1]) : "N/A",
            description: "Expected fractions of MH subs (2H:3H)",
            icon: "icon-target icons",
            color: "midnight_blue"
        }
    ];

    return tile_table_inputs;
}

/**
 * Retrieves and sorts rate distribution data from the results JSON.
 *
 * @param {Object} results_json - The JSON object containing the results
 * @param {boolean} has_error_sink - A flag indicating if the error sink should be
 *   considered.
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
function getRateDistribution(results_json, has_error_sink, keys, tags) {
    tags = tags || ["omega", "proportion"];
    const rate_info = _.get(results_json, keys);
    if (rate_info) {
        let clip_first = has_error_sink && tags[0] == 'omega';

        return _.sortBy(_.map(clip_first ? _.chain(rate_info).toPairs().filter((d) => d[0] != '0').fromPairs().value() : rate_info, (d) => ({
            "value": d[tags[0]],
            "weight": d[tags[1]]
        })), (d) => d.rate);
    }
    return null;
}

/**
 * Retrieves the rate distribution for the unconstrained model test from the results JSON.
 *
 * @param {Object} results_json - The JSON object containing the BUSTED analysis results.
 * @param {boolean} has_error_sink - A flag indicating if the error sink should be considered.
 *
 * @returns {Array|null} A sorted array of objects, each containing:
 *   - value: The rate value as specified by the first tag.
 *   - weight: The corresponding weight as specified by the second tag.
 *   The array is sorted by rate value. Returns null if no rate information is found.
 */

export function test_omega(results_json, has_error_sink) {
    return getRateDistribution (results_json, has_error_sink, ["fits","Unconstrained model","Rate Distributions","Test"])
}

export function get_error_sink_rate(results_json, tag) {
    return _.get (results_json, ["fits","Unconstrained model","Rate Distributions", tag, "0"]);
}

function get_has_error_sink_nt(results_json, has_error_sink, has_background){
  if (has_error_sink) {
      if (get_error_sink_rate(results_json, "Test")["proportion"] > 0) return true;
      if (has_background && get_error_sink_rate(results_json, "Background")["proportion"] > 0) return true;
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

export function get_contributing_sites(siteTableData) {
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

export function siteTableData(results_json) {
    const attrs =  get_attributes(results_json);
    const siteIndexPartitionCodon = getSiteIndexPartitionCodon(results_json);

  let site_info = [];
  let index = 0;
  _.each (results_json["data partitions"], (pinfo, partition)=> {
      _.each (pinfo["coverage"][0], (ignore, i)=> {
          
              let site_record = {
                  'Partition' : siteIndexPartitionCodon[index][0],
                  'Codon' : siteIndexPartitionCodon[index][1],
              };
              if (results_json["Evidence Ratios"]['optimized null']) {
                  site_record['ER (constrained)'] = results_json["Evidence Ratios"]['constrained'][0][index];
                  site_record['ER (optimized null)'] = results_json["Evidence Ratios"]['optimized null'][0][index];
              };
              site_record['LogL'] = results_json["Site Log Likelihood"]['unconstrained'][0][index];
              if (attrs.srv_rate_classes) {
                  let site_srv = [];
                  _.each (attrs.srv_distribution, (d,i)=> {
                       site_srv.push ({'value' : d.value, 'weight' : results_json["Synonymous site-posteriors"][i][index]});
                  });
                  site_record['SRV posterior mean'] = distMean (site_srv);
                  if (attrs.srv_hmm) {
                      site_record['SRV viterbi'] = attrs.srv_distribution[results_json["Viterbi synonymous rate path"][0][index]].value;
                  }
              }
              if (results_json["Evidence Ratios"]['optimized null']) {
                 site_record['LR'] = 2*Math.log (results_json["Evidence Ratios"]['optimized null'][0][index]);
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

export function getSiteIndexPartitionCodon(results_json) {
    return _.chain (results_json['data partitions']).map ((d,k)=>_.map (d['coverage'][0], (site)=>[+k+1,site+1])).flatten().value();
}

export function distMean(d) {
    let m = 0;
    _.each (d, (r)=> {
        m += r['value'] * r['weight'];
    });
    return m;
}

export function distVar(d) {
    let m2 = 0, m = distMean (d);
    _.each (d, (r)=> {
        m2 += r['value']*r['value'] * r['weight'];
    });
    return m2 - m*m;
}

export function getDistributionTable(results_json) {
    const attrs =  get_attributes(results_json);

  let table = [];
  _.each (["Unconstrained model", "Constrained model"], (m)=> {
      if (!_.get (results_json,["fits",m])) return;
      let record = {'Model' : m};
      record['LogL'] = _.get (results_json,["fits",m,"Log Likelihood"]);
      record['AICc'] = _.get (results_json,["fits",m,"AIC-c"]);
      record['p'] = _.get (results_json,["fits",m,"estimated parameters"]);
      record['dist'] = ["Tested", getRateDistribution (results_json, attrs.has_error_sink, ["fits",m,"Rate Distributions","Test"]),"&omega;",m + " ω tested"];
      record['plot'] = ["ω",record['dist'][1]];
      table.push (record);
      if (attrs.has_background) {
          record = {'Model' : m};
          record['dist'] = ["Background", getRateDistribution(results_json, attrs.has_error_sink, ["fits",m,"Rate Distributions","Background"]),"&omega;",m + " ω background" ];
          record['plot'] = ["ω",record['dist'][1]];
          table.push (record);
      }
      if (attrs.srv_rate_classes) {
        record = {'Model' : m};
        record['dist'] = ["Synonymous rates", getRateDistribution(results_json, attrs.has_error_sink, ["fits",m,"Rate Distributions","Synonymous site-to-site rates"], ["rate", "proportion"]),"",m + " syn rates" ];
        record['plot'] = ["",record['dist'][1]];
        table.push (record);
      }
  });
  return table;
}

export function getBSErrorSink(results_json, tree_objects, has_error_sink_nt) {
  if (has_error_sink_nt) {
    let weight = get_error_sink_rate(results_json, "Test")["proportion"];
    return posteriorsPerBranchSite (results_json, tree_objects, 0, weight / (1-weight));
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
 * @param {Object} results_json - The JSON object containing the Busted results
 * @param {Array<phylotree.phylotree>} tree_objects - An array of phylotree objects
 *   for each partition
 * @param {Array<Object>} test_omega - The rate distribution for the tested
 *   branches
 * @param {bool} has_error_sink - Whether the error sink class was used
 *
 * @returns {Array<Object>} An array of objects each containing the branch name,
 *   site number, posterior probability and evidence ratio for each site that
 *   was detected as showing positive selection
 */
export function getBSPositiveSelection(results_json, tree_objects, test_omega, has_error_sink) {
    let w =  test_omega[test_omega.length - 1].weight;
    
    if (w < 1) {
        return posteriorsPerBranchSite (results_json, tree_objects, test_omega.length - 1 + (has_error_sink ? 1 :0),w / (1-w));
    }

    return [];
}

/**
 * Computes posterior probabilities for each branch-site combination and returns
 * detailed information for each site.
 *
 * @param {Object} results_json - The JSON object containing the results of the
 * analysis, including branch attributes and substitution information.
 * @param {Array<phylotree.phylotree>} tree_objects - An array of phylotree objects
 *   for each partition
 * @param {number} rate_class - The index of the rate distribution to use for
 *   computing posteriors
 * @param {number} prior_odds - The prior odds for the tested rate distribution
 *
 * @returns {Array<Object>} An array of objects, each containing:
 *   - Key: A string combining the branch name and site index
 *   - Posterior: The posterior probability for the site
 *   - ER: The evidence ratio for the site
 *   - subs: Substitution information
 *   - from: The originating state of the substitution
 *   - to: The resulting state of the substitution
 *   - syn_subs: The count of synonymous substitutions
 *   - nonsyn_subs: The count of non-synonymous substitutions
 */
function posteriorsPerBranchSite(results_json, tree_objects, rate_class, prior_odds) {
  let results = [];
  let offset = 0;
  _.each (results_json["branch attributes"], (data, partition) => {
      let partition_size = 0;
      let subs = _.get (results_json, ["substitutions",partition]);
      let subs_at_site = {};
      _.each (data, (per_branch, branch)=> {
          if (per_branch ["Posterior prob omega class by site"]) {
            _.each (per_branch ["Posterior prob omega class by site"][rate_class], (p,i)=> {
                if ((i in subs_at_site) == false) {
                     subs_at_site[i] = phylotreeUtils.generateNodeLabels (tree_objects[partition], subs[i]);
                }
                const info = subs_at_site[i][branch];
                
                const sub_count = utils.subs_for_pair (info[2],info[0])
                results.push ({
                    'Key' : branch + "|" + (i + offset + 1), 
                    'Posterior' : p, 
                    'ER' : (p/(1-p))/prior_odds,
                    'from' : info[2],
                    'to' : info[0],
                    'subs' : info[3],
                    'syn_subs' : sub_count[0],
                    'nonsyn_subs' : sub_count[1]
                  },
                );
            });     
            partition_size = per_branch ["Posterior prob omega class by site"][rate_class].length;
          }
      });
      offset += partition_size;
  });
  return results;
}
