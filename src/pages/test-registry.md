# Registry and Generator Tests
This page exercises the registry and generators for each HyPhy method using example JSON payloads in `src/data`.

```js
import * as d3 from "d3";
import * as _ from "lodash-es";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import { FileAttachment } from "observablehq:stdlib";
import * as registry from "../registry.js";
import { BeadPlotGenerator } from "../components/bead-plot.js";
import { HeatmapGenerator } from "../components/posteriors-heatmap.js";
import { TileTableGenerator } from "../components/tile-table/tile-table.js";
import { RateDensitiesGenerator } from "../components/rate-summary-plots/rate-densities.js";
import { RateBarPlotsGenerator } from "../components/rate-summary-plots/rate-bars.js";
import { FelAlphaBetaPlotGenerator } from "../fel/fel-plots.js";
import { MemeAlphaBetaPlotGenerator } from "../meme/meme-plots.js";
import { 
  GardBreakpointPlotGenerator, 
  GardSupportPlotGenerator, 
  GardTreeLengthPlotGenerator 
} from "../gard/gard-plots.js";
import { 
  MultihitEvidenceRatiosPlotGenerator, 
  MultihitSiteLogLikelihoodPlotGenerator, 
  MultihitTimerBarPlotGenerator 
} from "../multihit/multihit-plots.js";
import { 
  NrmTreePlotGenerator,
  NrmBranchLengthComparisonPlotGenerator 
} from "../nrm/nrm-plots.js";
import { PhylotreeGenerator } from "../utils/phylotree-utils.js";


const vl = vegaLiteApi.register(vega, vegaLite);

// Preload attachments to satisfy FileAttachment literal requirement
const attachments = {
    BUSTED: FileAttachment("../data/busted_test_data.json"),
    aBSREL: FileAttachment("../data/absrel_test_data.json"),
    FEL: FileAttachment("../data/fel_test_data.json"),
    MEME: FileAttachment("../data/meme_test_data.json"),
    GARD: FileAttachment("../data/gard_test_data.json"),
    NRM: FileAttachment("../data/nrm_test_data.json"),
    MULTIHIT: FileAttachment("../data/multihit_test_data.json")
  };

const methods = ["BUSTED","aBSREL","FEL","MEME","GARD","NRM","MULTIHIT"];
const thresholds = {BUSTED:10,aBSREL:0.1,FEL:0.1,MEME:0.1,GARD:0.1,NRM:0.1,MULTIHIT:0.1};
const dynCaps = {BUSTED:10000,aBSREL:10000,FEL:10,MEME:10000,GARD:10000,NRM:10000,MULTIHIT:10000};

// Use the main notebook container
const root = document.getElementById("observablehq-main");

// Lazy-load plots per method
for (const method of methods) {
  const container = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = method;
  container.appendChild(title);
  root.appendChild(container);
  let jsonPromise;
  const vizs = registry.HyPhyMethods[method].visualizations;
  for (const viz of vizs) {
    const vizContainer = document.createElement("div");
    const vizName = document.createElement("h3");
    vizName.textContent = viz.name;
    vizContainer.appendChild(vizName);
    const btn = document.createElement("button");
    btn.textContent = `Load ${viz.name}`;
    vizContainer.appendChild(btn);
    container.appendChild(vizContainer);
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Loading...";
      try {
        if (!jsonPromise) jsonPromise = attachments[method].json();
        const json = await jsonPromise;
        const opts = viz.options || {};
        let spec;
        if (viz.component === "BeadPlot") {
          spec = BeadPlotGenerator(json, method, thresholds[method], dynCaps[method], opts);
        } else if (viz.component === "PosteriorsHeatmap") {
          spec = HeatmapGenerator(json, method, thresholds[method], opts);
        } else if (viz.component === "TileTable") {
          spec = TileTableGenerator(json, method, thresholds[method], opts);
          vizContainer.appendChild(spec);
          btn.remove();
          return;
        } else if (viz.component === "RateDensities") {
          spec = RateDensitiesGenerator(json, method, thresholds[method], opts);
        } else if (viz.component === "RateBarPlots") {
          spec = RateBarPlotsGenerator(json, method, thresholds[method], opts);
        } else if (viz.component === "FelAlphaBetaPlot") {
          spec = FelAlphaBetaPlotGenerator(json, method, thresholds[method], opts);
        } else if (viz.component === "MemeAlphaBetaPlot") {
          spec = MemeAlphaBetaPlotGenerator(json, method, thresholds[method], opts);
        } else if (viz.component === "GardBreakpointPlot") {
          spec = GardBreakpointPlotGenerator(json, opts);
        } else if (viz.component === "GardSupportPlot") {
          spec = GardSupportPlotGenerator(json, opts);
        } else if (viz.component === "GardTreeLengthPlot") {
          spec = GardTreeLengthPlotGenerator(json, opts);
        } else if (viz.component === "MultihitEvidenceRatiosPlot") {
          spec = MultihitEvidenceRatiosPlotGenerator(json);
        } else if (viz.component === "MultihitSiteLogLikelihoodPlot") {
          spec = MultihitSiteLogLikelihoodPlotGenerator(json);
        } else if (viz.component === "MultihitTimerBarPlot") {
          spec = MultihitTimerBarPlotGenerator(json);
        } else if (viz.component === "NrmBranchLengthComparisonPlot") {
          spec = NrmBranchLengthComparisonPlotGenerator(json);
        } else if (viz.component === "NrmTreePlot") {
          spec = NrmTreePlotGenerator(json);
          vizContainer.appendChild(spec);
          btn.remove();
          return;
        } else if (viz.component === "Phylotree") {
          // Merge visualization options with any threshold values
          console.log('Tree options:', opts);
          spec = PhylotreeGenerator(json, method, opts);
          vizContainer.appendChild(spec);
          btn.remove();
          return;
        } else {
          const p = document.createElement("p");
          p.textContent = `${viz.component} not supported yet`;
          vizContainer.appendChild(p);
          return;
        }
        const view = await vl.render({ spec });
        vizContainer.appendChild(view);
      } catch (err) {
        const pErr = document.createElement("p");
        pErr.textContent = `Error in ${viz.component} for ${method}: ${err.message}`;
        vizContainer.appendChild(pErr);
      }
      btn.remove();
    });
  }
}
```