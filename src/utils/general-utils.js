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

export function subs_for_pair(from, to) {

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
 * Translate a codon to an amino acid, handling ambiguous codes.
 * 
 * If the codon is unambiguous, just return the translation.
 * If the codon is ambiguous, return a string of all possible translations, 
 * sorted alphabetically.
 * 
 * @param {string} codon - a three-nucleotide codon
 * @return {string} the amino acid(s) corresponding to the codon
 */
export function translate_ambiguous_codon(codon) {
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
export function path_diff(from,to,path) {
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
export function get_translation_table() {
  var code = d3.csvParse("Codon,AA\nTTT,F\nTCT,S\nTAT,Y\nTGT,C\nTTC,F\nTCC,S\nTAC,Y\nTGC,C\nTTA,L\nTCA,S\nTAA,*\nTGA,*\nTTG,L\nTCG,S\nTAG,*\nTGG,W\nCTT,L\nCCT,P\nCAT,H\nCGT,R\nCTC,L\nCCC,P\nCAC,H\nCGC,R\nCTA,L\nCCA,P\nCAA,Q\nCGA,R\nCTG,L\nCCG,P\nCAG,Q\nCGG,R\nATT,I\nACT,T\nAAT,N\nAGT,S\nATC,I\nACC,T\nAAC,N\nAGC,S\nATA,I\nACA,T\nAAA,K\nAGA,R\nATG,M\nACG,T\nAAG,K\nAGG,R\nGTT,V\nGCT,A\nGAT,D\nGGT,G\nGTC,V\nGCC,A\nGAC,D\nGGC,G\nGTA,V\nGCA,A\nGAA,E\nGGA,G\nGTG,V\nGCG,A\nGAG,E\nGGG,G\n");
  var mapped_code = {};
  _.each (code, (v,k) => {mapped_code[v.Codon] = v.AA;});
  mapped_code["---"] = "-";
  mapped_code["NNN"] = "?";
  
  return mapped_code;
}