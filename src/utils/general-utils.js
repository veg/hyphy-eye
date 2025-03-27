import * as d3 from "d3";
import * as _ from "lodash-es";

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

export function subsForPair(from, to) {

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
          if (translateAmbiguousCodon(from) == translateAmbiguousCodon(to)) {
              return [1,0];
          }
          return [0,1];
      case 2: {
          let res = pathDiff(from,to,[diffs[0],diffs[1]]);
          _.each (pathDiff(from,to,[diffs[1],diffs[0]]), (d,i) => {res[i] += d;});
          return _.map (res, (d)=>0.5*d);
      }
       case 3: {
          let res = pathDiff(from,to,[diffs[0],diffs[1],diffs[2]]);
          _.each (pathDiff(from,to,[diffs[0],diffs[2],diffs[1]]), (d,i) => {res[i] += d;});
          _.each (pathDiff(from,to,[diffs[1],diffs[0],diffs[2]]), (d,i) => {res[i] += d;});
          _.each (pathDiff(from,to,[diffs[1],diffs[2],diffs[0]]), (d,i) => {res[i] += d;});
          _.each (pathDiff(from,to,[diffs[2],diffs[0],diffs[1]]), (d,i) => {res[i] += d;});
          _.each (pathDiff(from,to,[diffs[2],diffs[1],diffs[0]]), (d,i) => {res[i] += d;});
          return _.map (res, (d)=>d/6); 
       }
    }
}

export const ambiguousCodes =  {
      'A' : ['A'],
      'C' : ['C'],
      'G' : ['G'],
      'T' : ['T'],
      'U' : ['T'],
      'R' : ['A','G'],
      'Y' : ['C','T'],
      'K' : ['G','T'],
      'M' : ['A','C'],
      'S' : ['C','G'],
      'W' : ['A','T'],
      'B' : ['C','G','T'],
      'D' : ['A','G','T'],
      'H' : ['A','C','T'],
      'V' : ['A','C','G'],
      'N' : ['A','C','G','T'],
      '?' : ['A','C','G','T']
};

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
export function translateAmbiguousCodon(codon) {
    const translationTable = getTranslationTable();

    if (codon in translationTable) {
      return  translationTable[codon];
    }
  
    let options = {};
    _.each (ambiguousCodes[codon[0]], (n1)=> {
         _.each (ambiguousCodes[codon[1]], (n2)=> {
            _.each (ambiguousCodes[codon[2]], (n3)=> {
                let c = translationTable[n1+n2+n3];
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
export function pathDiff(from,to,path) {
    let result = [0,0];
    let curr = _.map (from),
        next = _.clone (curr);
   
    next [path[0]] = to[path[0]];
    const isSyn = translateAmbiguousCodon (curr.join ("")) == translateAmbiguousCodon(next.join (""));
    result[isSyn ? 0 : 1] += 1;
    for (let i = 1; i < path.length; i++) {
        curr = _.clone (next);
        next [path[i]] = to[path[i]];
        const isSyn = translateAmbiguousCodon (curr.join ("")) == translateAmbiguousCodon(next.join (""));
        result[isSyn ? 0 : 1] += 1;
    }
  
    return result;
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
export function getTranslationTable() {
  var code = d3.csvParse("Codon,AA\nTTT,F\nTCT,S\nTAT,Y\nTGT,C\nTTC,F\nTCC,S\nTAC,Y\nTGC,C\nTTA,L\nTCA,S\nTAA,*\nTGA,*\nTTG,L\nTCG,S\nTAG,*\nTGG,W\nCTT,L\nCCT,P\nCAT,H\nCGT,R\nCTC,L\nCCC,P\nCAC,H\nCGC,R\nCTA,L\nCCA,P\nCAA,Q\nCGA,R\nCTG,L\nCCG,P\nCAG,Q\nCGG,R\nATT,I\nACT,T\nAAT,N\nAGT,S\nATC,I\nACC,T\nAAC,N\nAGC,S\nATA,I\nACA,T\nAAA,K\nAGA,R\nATG,M\nACG,T\nAAG,K\nAGG,R\nGTT,V\nGCT,A\nGAT,D\nGGT,G\nGTC,V\nGCC,A\nGAC,D\nGGC,G\nGTA,V\nGCA,A\nGAA,E\nGGA,G\nGTG,V\nGCG,A\nGAG,E\nGGG,G\n");
  var mappedCode = {};
  _.each (code, (v,k) => {mappedCode[v.Codon] = v.AA;});
  mappedCode["---"] = "-";
  mappedCode["NNN"] = "?";
  
  return mappedCode;
}

var count = 0;

/**
 * Generates a unique identifier string by appending an incrementing number
 * to the provided name.
 *
 * @param {string} name - The base name for the unique identifier. If null or
 *   undefined, an empty string is used.
 *
 * @returns {string} A unique identifier string in the format "name-count",
 *   where "count" is a globally incrementing number.
 */

export function uid(name) {
  name = name == null ? "" : name;
  return name + "-" + ++count;
}

/**
 * Extracts common attributes from HyPhy results JSON that are shared across multiple methods
 * 
 * @param {Object} resultsJson - The results JSON object from a HyPhy analysis
 * @returns {Object} Common attributes extracted from the results
 */
export function extractCommonAttributes(resultsJson) {
  const attributes = {};
  
  // Basic sequence and site information
  if (_.has(resultsJson, 'input.number of sequences')) {
    attributes.numberOfSequences = resultsJson.input["number of sequences"];
  }
  
  if (_.has(resultsJson, 'input.number of sites')) {
    attributes.numberOfSites = resultsJson.input["number of sites"];
  }
  
  if (_.has(resultsJson, 'input.partition count')) {
    attributes.numberOfPartitions = resultsJson.input["partition count"];
  }
  
  // Extract partition sizes if available
  if (_.has(resultsJson, 'data partitions')) {
    attributes.partitionSizes = _.chain(resultsJson['data partitions'])
      .map((d, k) => (d['coverage'][0].length))
      .value();
  }
  
  // Extract tested branch information if available
  if (_.has(resultsJson, 'tested')) {
    attributes.testedBranchCount = d3.median(
      _.chain(resultsJson.tested)
        .map()
        .map((d) => _.filter(_.map(d), (d) => d == "test").length)
        .value()
    );
  }
  
  return attributes;
}

/**
 * Extracts rate distribution information from HyPhy results JSON
 * 
 * @param {Object} resultsJson - The results JSON object from a HyPhy analysis
 * @param {Array<string>} path - Path to the rate distribution in the results JSON
 * @param {Array<string>} fields - Fields to extract from the rate distribution
 * @returns {Object|null} Rate distribution information or null if not available
 */
export function extractRateDistribution(resultsJson, path, fields) {
  const distribution = _.get(resultsJson, path);
  
  if (!distribution) {
    return null;
  }
  
  return _.map(distribution, (d) => {
    return _.fromPairs(_.map(fields, (f) => [f, d[f]]));
  });
}

/**
 * Checks if the results JSON has background rate distributions
 * 
 * @param {Object} resultsJson - The results JSON object from a HyPhy analysis
 * @returns {boolean} Whether background rate distributions are available
 */
export function hasBackground(resultsJson) {
  return !!_.get(resultsJson, ["fits", "Unconstrained model", "Rate Distributions", "Background"]);
}

/**
 * Checks if the results JSON has error sink settings
 * 
 * @param {Object} resultsJson - The results JSON object from a HyPhy analysis
 * @returns {boolean} Whether error sink settings are available
 */
export function hasErrorSink(resultsJson) {
  return !!(resultsJson["analysis"] && 
           resultsJson["analysis"]["settings"] && 
           resultsJson["analysis"]["settings"]["error-sink"]);
}