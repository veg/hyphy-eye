import * as utils from "./multihit-utils.js";

// Generator for Evidence Ratios (Figure 1)
export function MultihitEvidenceRatiosPlotGenerator(resultsJson, opts = {}) {
  const attrs = utils.getMultihitAttributes(resultsJson);
  return {
    width: opts.width || 400,
    height: opts.height || 200,
    data: { values: attrs.evidenceRatios },
    mark: { type: "rule", tooltip: true },
    encoding: {
      facet: { field: "model", type: "ordinal", columns: opts.columns || 2 },
      x: { field: "site", type: "quantitative", axis: { grid: false, title: "site" } },
      y: { field: "er", type: "quantitative", axis: { grid: false, title: "Evidence Ratio" } },
    }
  };
}

// Generator for Site Log-Likelihood (Figure 2)
export function MultihitSiteLogLikelihoodPlotGenerator(resultsJson, opts = {}) {
  const attrs = utils.getMultihitAttributes(resultsJson);
  return {
    width: opts.width || 400,
    height: opts.height || 200,
    data: { values: attrs.siteLogLikelihood },
    mark: { type: "point", tooltip: true },
    encoding: {
      facet: { field: "model", type: "ordinal", columns: opts.columns || 2 },
      x: { field: "site", type: "quantitative", axis: { grid: false, title: "site" } },
      y: { field: "siteLogLikelihood", type: "quantitative", axis: { grid: false, title: "Site Log-Likelihood" } },
    }
  };
}

// Generator for Model Fitting Benchmarks (Figure 3)
export function MultihitTimerBarPlotGenerator(resultsJson, opts = {}) {
  const attrs = utils.getMultihitAttributes(resultsJson);
  return {
    width: opts.width || 800,
    height: opts.height || 200,
    data: { values: attrs.timers },
    mark: { type: "bar", tooltip: true, point: false },
    encoding: {
      y: { field: "model", type: "ordinal", axis: { grid: false, title: "Model" }, sort: "-x" },
      x: { field: "time", type: "quantitative", axis: { grid: false, title: "Time (seconds)" }, scale: { type: "sqrt" } },
    }
  };
}