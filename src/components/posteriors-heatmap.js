import * as _ from 'lodash-es';
import * as plotUtils from "../utils/plot-utils.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import { methodUtils } from '../utils/method-utils.js';

// TODO: change this color scheme to something from crameri
// i think we want linear, fewer hues?

// TODO: allow for changing field from ER? take a key or similar to bead-plot?

/**
 * Generates a Vega-Lite specification for a heatmap of posterior probabilities.
 *
 * @param {Array} data - The data array containing objects with properties used for plotting. 
 * The objects must have a "ER" property, and either a "Key" property or "Branch" and "Codon" properties. 
 * @param {number} from - The starting index for filtering codons.
 * @param {number} step - The step size for codon range filtering.
 * @param {Array[string]} branch_order - A set of branch identifiers to order the y-axis.
 * @param {string|null} size_field - The property name in data objects used for circle size, if applicable.
 * @param {string} [color_label="ER"] - The label for the color legend, defaulting to "ER".
 * @param {string} [color_scheme="redyellowblue"] - The color scheme for the heatmap, defaulting to "redyellowblue".
 * @returns {object} - A Vega-Lite specification object for the heatmap plot.
 */
export function PosteriorsHeatmap( 
  data, 
  from, 
  step, 
  branch_order,
  size_field,
  color_label = "ER",
  color_scheme = "redyellowblue"
) {

  let N = branch_order.length;
  let box_size = 10; 
  let font_size = 8;
  
  if (N > 50) {
      if (N <= 100) {box_size = 8; font_size = 6;}
      else if (N <= 200) {box_size = 5; font_size = 5;}
      else {box_size = 4; font_size = 0;}
  }

  let spec = {
      "width": {"step": box_size}, "height" : {"step" : box_size},
      "data" : {"values" : 
        _.filter(data, (d) => branch_order.includes(d.Key ? d.Key.split("|")[0] : d.Branch))
      }, 
      "transform" : [
        {"calculate" : "datum.Key ? parseInt (split(datum.Key, '|')[1]) : datum.Codon", "as" : "Codon"},
        {"calculate" : "datum.Key ? split(datum.Key, '|')[0] : datum.Branch", "as" : "Branch"},
        {"filter" : {"field" : "Codon", "range" : [from, from+step-1]}}
      ],
      
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Codon", "labelFontSize" : font_size} : null
        },
        "y": {
          "field": "Branch",
          "scale" : {"domain" : branch_order},
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Branch", "labelFontSize" : font_size} : null
        }
      },
      "layer": [
        {
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 1.0,  "tooltip": {"content": "data"}},
          "encoding": {
            "color": {
                "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top", "title" : color_label},
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : color_scheme, "domainMid" : 1}
            }
          }
        }
      ]
  };
  if (size_field) {
      spec.layer.push (
            {
              "mark": {"type": "circle", "size" : 2, "stroke" : "black", "strokeWidth" : 0.5, "color" : null, "opacity" : 1.0},
              "encoding": {
                "color" : {"value" : null},
                "size": {
                    "field": size_field,
                    "type" : "quantitative",
                    "legend" : {"orient" : "top", "title" : "# substitutions"}
                }
              }
            }
        );
  }
  return spec;
}

/**
 * Generator for posterior heatmaps across methods.
 * @param {Object} resultsJson - HyPhy JSON.
 * @param {String} method - Method key (e.g. 'BUSTED', 'aBSREL', 'MEME').
 * @param {number} threshold - p-value or evidence ratio threshold.
 * @param {Object} options - Optional settings: flavor override, size_field, color_label, color_scheme.
 * @returns {Object} Vega-Lite spec for a vconcat of posterior heatmaps.
 */
export function HeatmapGenerator(resultsJson, method, threshold, options = {}) {
    // Evaluate dynamic string options referencing attrs or results_json
    const finalOpts = { ...options };
    const utilsFns = methodUtils[method];
    if (!utilsFns) throw new Error(`No utilities defined for method: ${method}`);
    const attrs = utilsFns.attrsFn(resultsJson);
    Object.entries(finalOpts).forEach(([opt, val]) => {
        if (typeof val === 'string' && /\battrs\b|\bresults_json\b/.test(val)) {
            const fn = new Function('attrs', 'results_json', `return ${val}`);
            finalOpts[opt] = fn(attrs, resultsJson);
        }
    });
    const { 
      data = "bsPositiveSelection", 
      size_field = null, 
      color_label = "ER", 
      color_scheme = "redyellowblue" 
    } = finalOpts;
    const key = method;
    const fn = methodUtils[key]?.[data];
    if (!fn) throw new Error(`No ${data} function for ${key}`);
    // Use raw data override if provided
    const posteriorData = fn(resultsJson);
    const step = plotUtils.er_step_size(resultsJson);
    const treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
    const branch_order = phylotreeUtils.treeNodeOrdering(treeObjects[0], resultsJson.tested[0], false, false);

    const numCodons = _.chain(posteriorData)
        .map(d => 
            d.Codon != null
                ? d.Codon
                : (d.Key ? +d.Key.split("|")[1] : undefined)
        )
        .max()
  .value();
    // split into vconcat if many sites
    if (numCodons > step) {
        const specs = [];
        // split into chunks by codon indices
        for (let fromCodon = 1; fromCodon <= numCodons; fromCodon += step) {
            const count = Math.min(step, numCodons - fromCodon + 1);
            specs.push(
                PosteriorsHeatmap(
                    posteriorData,
                    fromCodon,
                    count,
                    branch_order,
                    size_field,
                    color_label,
                    color_scheme
                )
            );
        }
        return { vconcat: specs };
    }
    return PosteriorsHeatmap(
        posteriorData,
        1,
        posteriorData.length,
        branch_order,
        size_field,
        color_label,
        color_scheme
    );
}
