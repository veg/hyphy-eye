import * as d3 from "d3";
import * as _ from "lodash-es";

export function get_attributes(results_json) {
    const nSeqs = results_json.input["number of sequences"]
    const nSites = results_json.input["number of sites"]
    const stages = _.size(results_json.improvements)
    const evidence_ratios = _.chain(results_json["Evidence Ratios"])
        .map((d, k) => [_.map(d[0], (x, i) => { return { model: k, site : i, er:x }})]).flatten().flatten().value()
    const site_log_likelihood = _.chain(results_json["Site Log Likelihood"])
        .map((d, k) => [_.map(d[0], (x, i) => { return { model: k, site : i, site_log_likelihood:x }})]).flatten().flatten().value()
    const timers = _.chain(results_json["timers"]).map((d, k) =>  { return { model: k, time : d.timer}}).value()

    return {
        nSeqs: nSeqs,
        nSites: nSites,
        stages: stages,
        evidence_ratios: evidence_ratios,
        site_log_likelihood: site_log_likelihood,
        timers: timers
    }
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
    ];

    return tile_table_inputs;
}