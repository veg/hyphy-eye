import * as d3 from "d3";
import * as _ from "lodash-es";
import * as utils from "../utils/general-utils.js";

export function get_attributes(results_json) {
    const tested_branch_count = d3.median (_.chain (results_json.tested).map ().map((d)=>_.filter (_.map (d), (d)=>d=="test").length).value());
    const has_resamples = _.get (results_json, ["MLE","LRT"]) ? _.sample (_.get (results_json, ["MLE","LRT"])["0"]).length : 0;
    const has_substitutions = _.get (results_json, ["substitutions"])
    const has_site_LRT = _.find (_.get (results_json, ["MLE","headers"]), (d)=>d[0] == "Variation p")
    const count_sites_with_variation = 
        has_site_LRT ? 
        _.chain (results_json["MLE"]["content"])
            .mapValues ((d)=>_.filter (d, (r)=>r[11] <= +pvalue_threshold).length).values().sum().value() 
        : "N/A";
    const has_background = _.get (results_json, ["fits","Unconstrained model","Rate Distributions","Background"])
    // TODO: make this snake case
    const siteIndexPartitionCodon = _.chain(results_json['data partitions']).map ((d,k)=>_.map (d['coverage'][0], (site)=>[+k+1,site+1])).flatten().value();

    return {
        tested_branch_count: tested_branch_count,
        has_resamples: has_resamples,
        count_sites_with_variation: count_sites_with_variation,
        has_substitutions: has_substitutions,
        has_site_LRT: has_site_LRT,
        has_background: has_background,
        siteIndexPartitionCodon: siteIndexPartitionCodon
    }
}

export function get_count_sites_by_pvalue(results_json, pvalue_threshold) {
    const count_sites = _.chain (results_json["MLE"]["content"])
        .mapValues ((d)=>_.filter (d, (r)=>r[6] <= +pvalue_threshold).length)
        .values().sum().value();

    return count_sites;
}

export function get_selected_branches_per_selected_site(results_json, pvalue_threshold) {
    const count_sites = get_count_sites_by_pvalue(results_json, pvalue_threshold)
    const selected_branches_per_selected_site = 
        count_sites ? 
        (_.chain (results_json["MLE"]["content"])
            .mapValues ((d)=>_.filter (d, (r)=>r[6] <= +pvalue_threshold))
            .mapValues ((d)=>_.sum(_.map (d, (r)=>r[7]))).values().sum().value() / count_sites).toFixed(2) 
        : "N/A";

    return selected_branches_per_selected_site; 
}

export function get_tile_specs(results_json, pvalue_threshold) {
    const attrs = get_attributes(results_json)
    const count_sites = get_count_sites_by_pvalue(results_json, pvalue_threshold)
    const selected_branches_per_selected_site = get_selected_branches_per_selected_site(results_json, pvalue_threshold)
    
    return [
        {
            number: results_json.input["number of sequences"], 
            color: "asbestos", 
            description: "sequences in the alignment", 
            icon: "icon-options-vertical icons"
        },
        {
            number: results_json.input["number of sites"], 
            color: "asbestos", 
            description: "codon sites in the alignment", 
            icon: "icon-options icons"
        },
        {
            number: results_json.input["partition count"], 
            color: "asbestos", 
            description: "partitions", 
            icon: "icon-arrow-up icons"
        },
        {
            number: attrs.tested_branch_count, 
            color: "midnight_blue", 
            description: "median branches/partition used for testing", 
            icon: "icon-share icons"
        },
        {
            number: attrs.has_resamples || "N/A", 
            color: "midnight_blue", 
            description: "parametric bootstrap replicates", 
            icon: "icon-layers icons"
        },
        {
            number: count_sites, 
            color: "pomegranate", 
            description: "sites subject to episodic diversifying selection", 
            icon: "icon-plus icons"
        },
        {
            number: selected_branches_per_selected_site, 
            color: "midnight_blue", 
            description: "median branches with support for selection/selected site", 
            icon: "icon-share icons"
        },
        {
            number: attrs.count_sites_with_variation, 
            color: "midnight_blue", 
            description: "sites with variable &omega; across branches", 
            icon: "icon-energy icons"
        } 
    ]
}

function generateSubstitutionLists(T, labels, test_set) {
    if (!labels) return [];
    let L = {};
    let subs = {};
    T.traverse_and_compute (function (n) {
        if (n.data.name in labels) {
            L[n.data.name] = [labels[n.data.name], translate_ambiguous_codon (labels[n.data.name]),'',0];
            if (n.parent) {
              L[n.data.name][2] = L[n.parent.data.name][0];             
              _.each (L[n.data.name][0], (c,i)=> {
                  const c2 = L[n.data.name][2][i];
                  if (c2 != c && c != '-' && c2 != '-') {
                    L[n.data.name][3] ++;
                  }
              });
              if (L[n.data.name][3] && test_set[n.data.name] == "test") {
                  let sub;
                  if (L[n.parent.data.name][0] < L[n.data.name][0]) {
                    sub = L[n.parent.data.name][0] + "(" + L[n.parent.data.name][1] + "):" + L[n.data.name][0] + "(" + L[n.data.name][1] + ")"; } else {
                sub = L[n.data.name][0] + "(" + L[n.data.name][1] + "):" + L[n.parent.data.name][0] + "(" + L[n.parent.data.name][1] + ")";
                  }
                  if (sub in subs) {
                      subs[sub]++;
                  } else {
                      subs[sub] = 1;
                  }
                    
              }
            }
        } else {
          if (n.parent) {
            L[n.data.name] = _.clone (L[n.parent.data.name]);
            L[n.data.name][2] = L[n.data.name][0];
            L[n.data.name][3] = 0;
          } else {
            L['root'] = [labels["root"], utils.translate_ambiguous_codon (labels["root"]), "", 0];
          }
        }
    },"pre-order");
    return _.sortBy (_.toPairs (subs), d=>-d[1]);
}

export function siteTableData(results_json, table_options, pvalue_threshold, siteIndexPartitionCodon, tree_objects) {
  let site_info = [];
  let index = 0;
  let show_distribution = table_options.indexOf ('Distribution plot') >= 0;
  let show_q_values = table_options.indexOf ('Show q-values') >= 0;
  let show_substitutions = table_options.indexOf ('Show substitutions (tested branches)') >= 0;
  const mle_headers = _.map (results_json["MLE"]["headers"], (d)=>{
      d[2] = (d[0]);
      return d;
  });

  let q_values = [];
  
  _.each (results_json["data partitions"], (pinfo, partition)=> {
       const mle_data = results_json["MLE"]["content"][partition];
      _.each (pinfo["coverage"][0], (ignore, i)=> {
              let site_record = {
                  'Partition' : siteIndexPartitionCodon[index][0],
                  'Codon' : siteIndexPartitionCodon[index][1]
              };

              if (show_distribution) {
                   site_record['dN/dS'] = omega_plot (mle_data[i]);
              }
              
              _.each (mle_headers, (info, idx)=> {
                  if (idx < 8) {
                    site_record[info[2]] = mle_data[i][idx];
                  }
              });

              let site_class = "Neutral";
              if (mle_data[i][0] == 0 && mle_data[i][1] == 0 && mle_data[i][3] == 0) {
                   site_class = "Invariable";
              } else {
                 if (mle_data[i][6] <= +pvalue_threshold) {
                    site_class = "Diversifying";
                 }
              }
          
              if (show_q_values) {
                  site_record['q'] = 1;
                  q_values.push ([site_info.length, mle_data[i][6]]);
              }

              if (show_substitutions) {
                    site_record['Substitutions'] = generateSubstitutionLists (tree_objects[partition],results_json["substitutions"][partition][i],results_json.tested[partition]);
              }
        
              site_record['class'] = site_class;
        
        
              site_info.push (site_record);
              index++;
          })  
        
      });

      if (show_q_values) {
          q_values = _.map (_.sortBy (q_values, (d)=>d[1]), (d,i)=> [d[0],d[1]*results_json.input["number of sites"]/(i+1)]);
          _.each (q_values, (d)=> {
            site_info[d[0]]['q'] = Math.min (1,d[1]);
          });
      }
     
  
    let options = {
      'Partition' : '<abbr title = "Partition">Part.</abbr>',
      'Codon' : '<abbr title = "Site">Codon</abbr>',
      'class' :  '<abbr title = "Site classification">Class</abbr>',
      'dN/dS' :  '<abbr title = "dN/dS distribution at this site">dN/dS</abbr>'
    };

    _.each (mle_headers, (info, idx)=> {
        if (idx == 0) {
          options[info[2]] = '<abbr title = "' + info[1] + '">' + info[0] + '</abbr>';
        } else 
          if (idx != 8) {
            options[info[2]] = '<abbr title = "' + info[1] + '">' + info[0] + '</abbr>';
          }
    });

    return [site_info, options,mle_headers];
}

function omega_plot(record){
    const ratio = (beta, alpha)=> {
        if (alpha > 0) {
            return beta/alpha;
        }
        if (alpha == 0) {
            if (beta == 0) return 1;
        }
        return 100;
    }
    
    let alpha      = record[0];

    let rateInfo = [
      {'value' : ratio (record[1], alpha),
       'weight' : record[2]},
      {'value' : ratio (record[3], alpha),
       'weight' : record[4]},      
    ];

   return rateInfo;

}

export function getPosteriorsPerBranchSite(results_json, rate_class) {
  rate_class = rate_class || 1;
  let results = [];
  let offset = 0;
  _.each (results_json["branch attributes"], (data, partition) => {
      let partition_size = 0;
      _.each (data, (per_branch, branch)=> {
          
          if (per_branch ["Posterior prob omega class by site"]) {
            _.each (per_branch ["Posterior prob omega class by site"][rate_class], (p,i)=> {
                let prior = results_json['MLE']['content'][partition][i][4];
                results.push ({'Branch' : branch, 'Codon' : i + offset + 1, 'Posterior' : p, 'ER' : computeER (prior, p)});
            });     
            partition_size = per_branch ["Posterior prob omega class by site"][rate_class].length;
          }
      });
      offset += partition_size;
  });

  return results;
}

export function computeER(prior, posterior) {
    if (prior < 1) prior = prior / (1-prior); else prior = Infinity;
    if (posterior < 1) posterior = posterior / (1-posterior); else posterior = Infinity;
    if (posterior > 0) {
        return posterior / prior;
    } else {
        if (prior == 0) return 1;
        return Infinity;
    }
}

export function getRateDistribution(results_json, keys, tags) {
    tags = tags || ["omega", "proportion"];
    const rate_info = _.get (results_json, keys);
    if (rate_info) {
      return _.sortBy (_.map (rate_info, (d)=>({
        "value" : d[tags[0]],
        "weight" : d[tags[1]]
      })), (d)=>d.rate);
    }
    return null;
}