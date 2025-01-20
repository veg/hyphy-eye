import * as d3 from "d3";
import * as _ from "lodash-es";

const floatFormat = d3.format (".4g")

export function get_attributes(results_json) {
    const n_seqs = results_json.input["number of sequences"]
    const n_sites = results_json.input["number of sites"]
    const tree_length_by_model = _.chain (_.keys(results_json.fits))
        .map ((d)=>{return [d,d3.sum (_.map (results_json["branch attributes"]["0"], (bv)=>bv[d]))]}).fromPairs().value()
    const model_summary = _.chain (results_json["fits"]).map ((v,m)=>[m,v ["AIC-c"]]).sortBy((d)=>d[1]).value()
    const best_model = model_summary [0][0]
    const best_model_tree_length = floatFormat(tree_length_by_model[best_model])
    const model_table_data = get_model_table_data(results_json, tree_length_by_model)
    
    return {
        nSeqs: n_seqs,
        nSites: n_sites,
        tree_length_by_model: tree_length_by_model,
        model_summary: model_summary,
        best_model: best_model,
        best_model_tree_length: best_model_tree_length,
        model_table_data: model_table_data
    }
}

/**
 * Returns the maximum rate value found in the rate distributions of the given model in the given results_json object.
 *
 * @param {Object} results_json - The JSON object containing the NRM results
 * @param {string} model - The name of the model for which to retrieve the maximum rate value
 *
 * @returns {number} The maximum rate value
 */
export function get_q_max_rate(results_json, model) {
    console.log("results_json", results_json)
    console.log("model", model)
    return d3.max(_.map (results_json["fits"][model]["Rate Distributions"], (d)=>d3.max(d)))
}

/**
 * Returns a table representation of the rate matrix Q for the given model in the given results_json object.
 *
 * @param {Object} results_json - The JSON object containing the NRM results
 * @param {string} model - The name of the model for which to retrieve the rate matrix
 *
 * @returns {Array} A table (array of objects) containing the rate matrix Q, where each row and column corresponds to a nucleotide (A, C, G, T) and the value is the rate of substitution from the row nucleotide to the column nucleotide.
 */
export function get_q_matrix_table(results_json, model) {
   let rates = [];
   let rm = results_json["fits"][model]["Rate Distributions"];
   const nucs = results_json["characters"][0];
   _.each (nucs, (from, i)=> {
      let row = {'From/To' : from};
      _.each (nucs, (to, j)=> {
          if (i!=j) {
            row[to] = rm[i][j];
          } else {
             row[to] = null;
          }
      });
      rates.push (row);
   });
   return rates;
}

export function get_model_table_data(results_json, tree_length_by_model) {
  return _.chain (tree_length_by_model).map((i,d)=> {
      return {
        'Model' : d,
        'AIC-c' : results_json["fits"][d]["AIC-c"],
        'Tree length' : tree_length_by_model[d],
        'f(A)' : results_json["fits"][d]["Equilibrium frequencies"][0][0],
        'f(C)' : results_json["fits"][d]["Equilibrium frequencies"][0][1],
        'f(G)' : results_json["fits"][d]["Equilibrium frequencies"][0][2],
        'f(T)' : results_json["fits"][d]["Equilibrium frequencies"][0][3]

      };
  }).value();
}

// TODO: is this general-utils.js ??
export function report_result(pvalue) {
  let sup = "";
  if (pvalue <= 0.05) {
      sup = "<b>is</b> evidence";
  } else {
      sup = "<b>is no</b> evidence";
  }
  return sup + " (p-value=" + floatFormat(pvalue) + ")";
}

export function getTestResult(results_json, m1, m2) {
  return results_json["test results"][m1 + " vs " + m2]["Corrected P-value"];
}

export function get_tile_specs(results_json) {
    const attrs = get_attributes(results_json);

    const tile_table_inputs = [
        {
            "number": attrs.nSeqs,
            "description": "sequences in the alignment",
            "icon": "icon-options-vertical icons",
            "color": "asbestos",
        },
        {
            "number": attrs.nSites,
            "description": "sites in the alignment",
            "icon": "icon-options icons",
            "color": "asbestos",
        },
        {
            "number": attrs.best_model_tree_length,
            "description": "tree length (subs/site)",
            "icon": "icon-arrow-up icons",
            "color": "asbestos",
        },
        {
            "number": attrs.best_model,
            "description": "best model",
            "icon": "icon-location-pin icons",
            "color": "asbestos",
        },
        {
            "number": floatFormat(getTestResult (results_json, "GTR", "NREV12")),
            "description": "p-value non-reversible",
            "icon": "icon-info icons",
            "color": "midnight_blue",
        },
        {
            "number": floatFormat(getTestResult (results_json, "NREV12", "NREV12+F")),
            "description": "p-value root frequencies",
            "icon": "icon-info icons",
            "color": "midnight_blue",
        }
    ];

    return tile_table_inputs;
}