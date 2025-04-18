import * as d3 from "d3";
import * as _ from "lodash-es";
import * as utils from "../utils/general-utils.js";
import {html} from "htl";

/**
 * Extracts some summary attributes from MEME results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the MEME results
 * @param {number} pvalueThreshold - The P-value threshold used for counting sites with variation
 *
 * @returns {Object} An object with the following attributes:
 *   - testedBranchCount: {number} The median number of branches tested for
 *     selection for each partition
 *   - hasResamples: {number} The number of resamples used in the analysis
 *   - countSitesWithVariation: {number|string} The number of sites with variation
 *     p-value below the threshold, or "N/A" if site LRT is not available
 *   - hasSubstitutions: {boolean} Whether substitution information is available
 *   - hasSiteLRT: {boolean} Whether site-level LRT information is available
 *   - hasBackground: {boolean} Whether background rate distributions are available
 *   - siteIndexPartitionCodon: {Array} Array mapping site indices to partition and codon
 *   - numberOfSequences: {number} The number of sequences in the analysis
 *   - numberOfSites: {number} The number of sites in the analysis
 *   - numberOfPartitions: {number} The number of partitions in the analysis
 *   - partitionSizes: {Array} Array of sizes for each partition
 */
export function getMemeAttributes(resultsJson, pvalueThreshold) {
    // Extract common attributes
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // MEME-specific attributes
    const hasResamples = _.get(resultsJson, ["MLE", "LRT"]) ? _.sample(_.get(resultsJson, ["MLE", "LRT"])["0"]).length : 0;
    const hasSubstitutions = !!_.get(resultsJson, ["substitutions"]);
    const hasSiteLRT = !!_.find(_.get(resultsJson, ["MLE", "headers"]), (d) => d[0] == "Variation p");
    const countSitesWithVariation = 
        hasSiteLRT ? 
        _.chain(resultsJson["MLE"]["content"])
            .mapValues((d) => _.filter(d, (r) => r[11] <= +pvalueThreshold).length)
            .values()
            .sum()
            .value() 
        : "N/A";
    const hasBackground = utils.hasBackground(resultsJson);
    const siteIndexPartitionCodon = _.chain(resultsJson['data partitions'])
        .map((d, k) => _.map(d['coverage'][0], (site) => [+k+1, site+1]))
        .flatten()
        .value();

    return {
        testedBranchCount: commonAttrs.testedBranchCount,
        hasResamples,
        countSitesWithVariation,
        hasSubstitutions,
        hasSiteLRT,
        hasBackground,
        siteIndexPartitionCodon,
        numberOfSequences: commonAttrs.numberOfSequences,
        numberOfSites: commonAttrs.numberOfSites,
        numberOfPartitions: commonAttrs.numberOfPartitions,
        partitionSizes: commonAttrs.partitionSizes
    };
}

/**
 * Counts the number of sites with p-values below the given threshold
 * 
 * @param {Object} resultsJson - The JSON object containing the MEME results
 * @param {number} pvalueThreshold - The P-value threshold
 * @returns {number} The count of sites with p-values below the threshold
 */
export function getCountSitesByPvalue(resultsJson, pvalueThreshold) {
    const countSites = _.chain(resultsJson["MLE"]["content"])
        .mapValues((d) => _.filter(d, (r) => r[6] <= +pvalueThreshold).length)
        .values()
        .sum()
        .value();

    return countSites;
}

/**
 * Calculates the average number of selected branches per selected site
 * 
 * @param {Object} resultsJson - The JSON object containing the MEME results
 * @param {number} pvalueThreshold - The P-value threshold
 * @returns {string|number} The average number of selected branches per selected site,
 *                         or "N/A" if no sites are selected
 */
export function getSelectedBranchesPerSelectedSite(resultsJson, pvalueThreshold) {
    const countSites = getCountSitesByPvalue(resultsJson, pvalueThreshold);
    const selectedBranchesPerSelectedSite = 
        countSites ? 
        (_.chain(resultsJson["MLE"]["content"])
            .mapValues((d) => _.filter(d, (r) => r[6] <= +pvalueThreshold))
            .mapValues((d) => _.sum(_.map(d, (r) => r[7])))
            .values()
            .sum()
            .value() / countSites).toFixed(2) 
        : "N/A";

    return selectedBranchesPerSelectedSite; 
}

export function getTileSpecs(resultsJson, pvalueThreshold) {
    const attrs = getMemeAttributes(resultsJson);
    const countSites = getCountSitesByPvalue(resultsJson, pvalueThreshold);
    const selectedBranchesPerSelectedSite = getSelectedBranchesPerSelectedSite(resultsJson, pvalueThreshold);
    
    return [
        {
            number: resultsJson.input["number of sequences"], 
            color: "asbestos", 
            description: "sequences in the alignment", 
            icon: "icon-options-vertical icons"
        },
        {
            number: resultsJson.input["number of sites"], 
            color: "asbestos", 
            description: "codon sites in the alignment", 
            icon: "icon-options icons"
        },
        {
            number: resultsJson.input["partition count"], 
            color: "asbestos", 
            description: "partitions", 
            icon: "icon-arrow-up icons"
        },
        {
            number: attrs.testedBranchCount, 
            color: "asbestos", 
            description: "median branches/partition used for testing", 
            icon: "icon-share icons"
        },
        {
            number: attrs.hasResamples || "N/A", 
            color: "asbestos", 
            description: "parametric bootstrap replicates", 
            icon: "icon-layers icons"
        },
        {
            number: countSites, 
            color: "midnight_blue", 
            description: "sites subject to episodic diversifying selection", 
            icon: "icon-plus icons"
        },
        {
            number: selectedBranchesPerSelectedSite, 
            color: "midnight_blue", 
            description: "median branches with support for selection/selected site", 
            icon: "icon-share icons"
        },
        {
            number: attrs.countSitesWithVariation, 
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
            L[n.data.name] = [labels[n.data.name], utils.translateAmbiguousCodon (labels[n.data.name]),'',0];
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
            L['root'] = [labels["root"], utils.translateAmbiguousCodon (labels["root"]), "", 0];
          }
        }
    },"pre-order");
    return _.sortBy (_.toPairs (subs), d=>-d[1]);
}

export function siteTableData(resultsJson, tableOptions, pvalueThreshold, siteIndexPartitionCodon, treeObjects) {
  let siteInfo = [];
  let index = 0;
  let showDistribution = tableOptions.indexOf ('Distribution plot') >= 0;
  let showQValues = tableOptions.indexOf ('Show q-values') >= 0;
  let showSubstitutions = tableOptions.indexOf ('Show substitutions (tested branches)') >= 0;
  const mleHeaders = _.map (resultsJson["MLE"]["headers"], (d)=>{
      d[2] = (d[0]);
      return d;
  });

  let qValues = [];
  
  _.each (resultsJson["data partitions"], (pinfo, partition)=> {
       const mleData = resultsJson["MLE"]["content"][partition];
      _.each (pinfo["coverage"][0], (ignore, i)=> {
              let siteRecord = {
                  'Partition' : siteIndexPartitionCodon[index][0],
                  'Codon' : siteIndexPartitionCodon[index][1]
              };

              if (showDistribution) {
                   siteRecord['dN/dS'] = omegaPlot(mleData[i]);
              }
              
              _.each (mleHeaders, (info, idx)=> {
                  if (idx < 8) {
                    siteRecord[info[2]] = mleData[i][idx];
                  }
              });

              let siteClass = "Neutral";
              if (mleData[i][0] == 0 && mleData[i][1] == 0 && mleData[i][3] == 0) {
                   siteClass = "Invariable";
              } else {
                 if (mleData[i][6] <= +pvalueThreshold) {
                    siteClass = "Diversifying";
                 }
              }
          
              if (showQValues) {
                  siteRecord['q'] = 1;
                  qValues.push ([siteInfo.length, mleData[i][6]]);
              }

              if (showSubstitutions) {
                    siteRecord['Substitutions'] = generateSubstitutionLists (treeObjects[partition],resultsJson["substitutions"][partition][i],resultsJson.tested[partition]);
              }
        
              siteRecord['class'] = siteClass;
        
        
              siteInfo.push (siteRecord);
              index++;
          })  
        
      });

      if (showQValues) {
          qValues = _.map (_.sortBy (qValues, (d)=>d[1]), (d,i)=> [d[0],d[1]*resultsJson.input["number of sites"]/(i+1)]);
          _.each (qValues, (d)=> {
            siteInfo[d[0]]['q'] = Math.min (1,d[1]);
          });
      }
     
  
    let options = {
      'Partition' : html`<abbr title = "Partition">Part.</abbr>`,
      'Codon' : html`<abbr title = "Site">Codon</abbr>`,
      'class' :  html`<abbr title = "Site classification">Class</abbr>`,
      'dN/dS' :  html`<abbr title = "dN/dS distribution at this site">dN/dS</abbr>`
    };

    _.each (mleHeaders, (info, idx)=> {
        if (idx == 0) {
          options[info[2]] = html`<abbr title = "${info[1]}">${info[0]}</abbr>`;
        } else 
          if (idx != 8) {
            options[info[2]] = html`<abbr title = "${info[1]}">${info[0]}</abbr>`;
          }
    });

    return [siteInfo, options,mleHeaders];
}

function omegaPlot(record){
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

export function getPosteriorsPerBranchSite(resultsJson, rateClass) {
  rateClass = rateClass || 1;
  let results = [];
  let offset = 0;
  _.each (resultsJson["branch attributes"], (data, partition) => {
      let partitionSize = 0;
      _.each (data, (perBranch, branch)=> {
          
          if (perBranch ["Posterior prob omega class by site"]) {
            _.each (perBranch ["Posterior prob omega class by site"][rateClass], (p,i)=> {
                let prior = resultsJson['MLE']['content'][partition][i][4];
                results.push ({'Branch' : branch, 'Codon' : i + offset + 1, 'Posterior' : p, 'ER' : computeER (prior, p)});
            });     
            partitionSize = perBranch ["Posterior prob omega class by site"][rateClass].length;
          }
      });
      offset += partitionSize;
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