import * as _ from "lodash-es";
import * as utils from "../utils/general-utils.js";
import {html} from "htl";

/**
 * Extracts some summary attributes from MEME results that are used later in the
 * visualization.
 *
 * @param {Object} resultsJson - The JSON object containing the MEME results
 *
 * @returns {Object} An object with the following attributes:
 *   - testedBranchCount: {number} The median number of branches tested for
 *     selection for each partition
 *   - hasResamples: {number} The number of resamples used in the analysis
 *   - hasSubstitutions: {boolean} Whether substitution information is available
 *   - hasSiteLRT: {boolean} Whether site-level LRT information is available
 *   - hasBackground: {boolean} Whether background rate distributions are available
 *   - siteIndexPartitionCodon: {Array} Array mapping site indices to partition and codon
 *   - numberOfSequences: {number} The number of sequences in the analysis
 *   - numberOfSites: {number} The number of sites in the analysis
 *   - numberOfPartitions: {number} The number of partitions in the analysis
 *   - partitionSizes: {Array} Array of sizes for each partition
 */
export function getMemeAttributes(resultsJson) {
    // Extract common attributes
    const commonAttrs = utils.extractCommonAttributes(resultsJson);
    
    // MEME-specific attributes
    const hasResamples = _.get(resultsJson, ["MLE", "LRT"]) ? _.sample(_.get(resultsJson, ["MLE", "LRT"])["0"]).length : 0;
    const hasSubstitutions = !!_.get(resultsJson, ["substitutions"]);
    const hasSiteLRT = !!_.find(_.get(resultsJson, ["MLE", "headers"]), (d) => d[0] == "Variation p");
    const hasBackground = utils.hasBackground(resultsJson);
    const siteIndexPartitionCodon = Object.values(resultsJson['data partitions'])
        .map((d, k) => Object.values(d['coverage'][0]).map((site) => [+k+1, site+1]))
        .flat();

    return {
        testedBranchCount: commonAttrs.testedBranchCount,
        hasResamples,
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
export function getMemeCountSitesByPvalue(resultsJson, pvalueThreshold) {
    const countSites = Object.values(resultsJson["MLE"]["content"])
        .map(d => d.filter(r => r[6] <= +pvalueThreshold).length)
        .reduce((sum, count) => sum + count, 0);

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
export function getMemeSelectedBranchesPerSelectedSite(resultsJson, pvalueThreshold) {
    const countSites = getMemeCountSitesByPvalue(resultsJson, pvalueThreshold);
    const selectedBranchesPerSelectedSite = 
        countSites ? 
        (Object.values(resultsJson["MLE"]["content"])
            .map(d => d.filter(r => r[6] <= +pvalueThreshold))
            .map(d => d.reduce((sum, r) => sum + r[7], 0))
            .reduce((sum, count) => sum + count, 0) / countSites).toFixed(2) 
        : "N/A";

    return selectedBranchesPerSelectedSite; 
}

export function getMemeTileSpecs(resultsJson, pvalueThreshold) {
    const attrs = getMemeAttributes(resultsJson);
    const countSites = getMemeCountSitesByPvalue(resultsJson, pvalueThreshold);
    const selectedBranchesPerSelectedSite = getMemeSelectedBranchesPerSelectedSite(resultsJson, pvalueThreshold);
    // Compute count of sites with ω variation below p-value threshold
    const variationCount = attrs.hasSiteLRT ?
        Object.values(resultsJson['MLE']['content'])
            .map(d => d.filter(r => r[11] <= +pvalueThreshold).length)
            .reduce((sum, count) => sum + count, 0)
        : 0;
    
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
            number: variationCount, 
            color: "midnight_blue", 
            description: "sites with variable &omega; across branches", 
            icon: "icon-energy icons"
        } 
    ]
}

export function getMemeSubstitutionLists(T, labels, test_set) {
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

export function getMemeSiteTableData(resultsJson, pvalueThreshold, siteIndexPartitionCodon, treeObjects, tableOptions) {
  let siteInfo = [];
  let index = 0;
  if (!tableOptions) {
    tableOptions = [];
  }
  if (!siteIndexPartitionCodon) {
    siteIndexPartitionCodon = getMemeAttributes(resultsJson).siteIndexPartitionCodon;
  }
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
                   siteRecord['dN/dS'] = getMemeOmegaPlot(mleData[i]);
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
                if (!treeObjects){
                    treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
                }
                siteRecord['Substitutions'] = getMemeSubstitutionLists (treeObjects[partition],resultsJson["substitutions"][partition][i],resultsJson.tested[partition]);
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

export function getMemeOmegaPlot(record) {
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

export function getMemePosteriorsPerBranchSite(resultsJson, rateClass) {
  rateClass = rateClass || 1;
  let results = [];
  let offset = 0;
  _.each (resultsJson["branch attributes"], (data, partition) => {
      let partitionSize = 0;
      _.each (data, (perBranch, branch)=> {
          
          if (perBranch ["Posterior prob omega class by site"]) {
            _.each (perBranch ["Posterior prob omega class by site"][rateClass], (p,i)=> {
                let prior = resultsJson['MLE']['content'][partition][i][4];
                results.push ({'Branch' : branch, 'Codon' : i + offset + 1, 'Posterior' : p, 'ER' : getMemeComputeER (prior, p)});
            });     
            partitionSize = perBranch ["Posterior prob omega class by site"][rateClass].length;
          }
      });
      offset += partitionSize;
  });

  return results;
}

export function getMemeComputeER(prior, posterior) {
    if (prior < 1) prior = prior / (1-prior); else prior = Infinity;
    if (posterior < 1) posterior = posterior / (1-posterior); else posterior = Infinity;
    if (posterior > 0) {
        return posterior / prior;
    } else {
        if (prior == 0) return 1;
        return Infinity;
    }
}