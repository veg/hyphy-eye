import * as d3 from "d3";
import * as _ from "lodash-es";
import * as utils from "../utils/general-utils.js";

const floatFormat = d3.format (".4g")

export function get_attributes(results_json) {
    const stages = _.size(results_json.improvements)
    const nSeqs = results_json.input["number of sequences"]
    const nSites = results_json.input["number of sites"]
    const nPartitions = results_json.input["partition count"]
    const nPotentialBreakpoints = results_json.potentialBreakpoints
    const nModelsConsidered = results_json.totalModelCount
    const deltaAICcBaseline = floatFormat(results_json.baselineScore - results_json.bestModelAICc)
    const deltaAICcSingle = floatFormat(results_json.singleTreeAICc - results_json.bestModelAICc)
    const caicImprovements = get_caic_improvements(results_json)
    const breakpointsProfile = get_gard_breakpoints(results_json)
    const siteSupport = _.chain(results_json["siteBreakPointSupport"]).toPairs().map ((d)=>{return {'bp' : +d[0], 'support' : d[1]}}).value()

    return {
        stages: stages,
        nSeqs: nSeqs,
        nSites: nSites,
        nPartitions: nPartitions,
        nPotentialBreakpoints: nPotentialBreakpoints,
        nModelsConsidered: nModelsConsidered,
        deltaAICcBaseline: deltaAICcBaseline,
        deltaAICcSingle: deltaAICcSingle,
        caicImprovements: caicImprovements,
        breakpointsProfile: breakpointsProfile,
        siteSupport: siteSupport
    }
}

/**
 * Takes a GARD results JSON object and returns an array of objects containing
 * the breakpoint coordinates and the number of models the breakpoint is
 * associated with.
 *
 * @param {Object} results_json - The JSON object containing the GARD results
 * @returns {Object[]} An array of objects containing the breakpoint coordinates
 *                     and the number of models the breakpoint is associated with.
 */
function get_gard_breakpoints(results_json) {
  let bp = {};
  return _.chain(results_json.improvements).map ( (d)=> {
      bp
      return _.map (d.breakpoints, (b)=>{
          if (!bp[b[0]]) bp[b[0]] = [];
          bp[b[0]].push (d.breakpoints.length)
          return {'bp' : b[0], 'model' : d.breakpoints.length};
      });
  }).flatten().each ((d)=>d.span = d3.max (bp[d.bp]) - d3.min (bp[d.bp])).value();
}

/**
 * Computes cumulative AICc improvements from the improvements data in the
 * results JSON. Adjusts the deltaAICc value for each improvement stage after
 * the first stage if it exceeds the initial improvement's deltaAICc. The
 * adjustments are accumulated over stages.
 *
 * @param {Object} results_json - The JSON object containing the improvements
 *     data with deltaAICc values and breakpoints.
 * @returns {Array<Object>} An array of objects for each improvement stage,
 *     each containing:
 *     - bp: {number} The number of breakpoints in the stage.
 *     - daic: {number} The adjusted deltaAICc value for the stage.
 */

function get_caic_improvements(results_json) {
    let accumulator = 0;
    return _.map (results_json['improvements'], (d,i)=> {
        let delta = d.deltaAICc;
        if (i > 0 && d.deltaAICc > results_json['improvements'][0].deltaAICc) {
            delta = delta - accumulator;
        }
        accumulator += delta;
        return {'bp' : d.breakpoints.length, 'daic' : delta};
    });
}

export function get_tile_specs(results_json) {
    const attrs = get_attributes(results_json)

    // TODO: turn into an array of objects
    // will be used to populate the tile table
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
            "number": attrs.nPotentialBreakpoints,
            "description": "potential breakpoints",
            "icon": "icon-arrow-up icons",
            "color": "asbestos",
        },
        {
            "number": attrs.stages,
            "description": "inferred breakpoints",
            "icon": "icon-location-pin icons",
            "color": "asbestos",
        },
        {
            "number": attrs.nModelsConsidered,
            "description": "models considered",
            "icon": "icon-info icons",
            "color": "asbestos",
        },
        {
            "number": attrs.deltaAICcBaseline,
            "description": "c-AIC vs the null model",
            "icon": "icon-graph icons",
            "color": "asbestos",
        },
        {
            "number": attrs.deltaAICcSingle,
            "description": "c-AIC vs the single tree multiple partition",
            "icon": "icon-graph icons",
            "color": "asbestos",
        }
    ]

    return tile_table_inputs;
}