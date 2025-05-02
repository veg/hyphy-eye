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
import { PosteriorsHeatmapGenerator } from "../components/posteriors-heatmap.js";
import { TileTableGenerator } from "../components/tile-table/tile-table.js";
import { RateDensitiesGenerator } from "../components/rate-summary-plots/rate-densities.js";
import { RateBarPlotsGenerator } from "../components/rate-summary-plots/rate-bars.js";
import { FelAlphaBetaPlotGenerator } from "../fel/fel-plots.js";
import { MemeAlphaBetaPlotGenerator } from "../meme/meme-plots.js";
import { 
  GardBreakpointPlotGenerator, 
  GardSupportPlotGenerator, 
  GardTreeLengthPlotGenerator,
  GardTreeGridGenerator 
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
import { PhylotreeGenerator } from "../utils/phylotree-generator.js";
import { VisualizationOutputType } from "../registry.js";

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

// Make generator functions available in window scope
window.FelAlphaBetaPlotGenerator = FelAlphaBetaPlotGenerator;
window.PhylotreeGenerator = PhylotreeGenerator;
window.MemeAlphaBetaPlotGenerator = MemeAlphaBetaPlotGenerator;
window.BeadPlotGenerator = BeadPlotGenerator;
window.PosteriorsHeatmapGenerator = PosteriorsHeatmapGenerator;
window.TileTableGenerator = TileTableGenerator;
window.RateDensitiesGenerator = RateDensitiesGenerator;
window.RateBarPlotsGenerator = RateBarPlotsGenerator;
window.GardBreakpointPlotGenerator = GardBreakpointPlotGenerator;
window.GardSupportPlotGenerator = GardSupportPlotGenerator;
window.GardTreeLengthPlotGenerator = GardTreeLengthPlotGenerator;
window.GardTreeGridGenerator = GardTreeGridGenerator;
window.MultihitEvidenceRatiosPlotGenerator = MultihitEvidenceRatiosPlotGenerator;
window.MultihitSiteLogLikelihoodPlotGenerator = MultihitSiteLogLikelihoodPlotGenerator;
window.MultihitTimerBarPlotGenerator = MultihitTimerBarPlotGenerator;
window.NrmTreePlotGenerator = NrmTreePlotGenerator;
window.NrmBranchLengthComparisonPlotGenerator = NrmBranchLengthComparisonPlotGenerator;

// Helper functions for visualization handling
function getGeneratorFunction(componentName) {
  const generatorName = `${componentName}Generator`;
  return window[generatorName];
}

async function handleVisualizationOutput(output, outputType, container) {
  switch (outputType) {
    case VisualizationOutputType.VEGA_SPEC:
      const view = await vl.render({ spec: output });
      container.appendChild(view);
      return null;
    case VisualizationOutputType.DOM_ELEMENT:
      container.appendChild(output);
      return null; 
    case VisualizationOutputType.HTML_STRING:
      const htmlContainer = document.createElement("div");
      htmlContainer.innerHTML = output;
      container.appendChild(htmlContainer);
      return null;
    default:
      throw new Error(`Unknown output type: ${outputType}`);
  }
}

// Main visualization rendering function
function renderVisualization(viz, json, method, opts, vizContainer) {
  try {
    const generator = getGeneratorFunction(viz.component);
    if (!generator) {
      throw new Error(`Generator function not found for component: ${viz.component}`);
    }

    // Generate the visualization
    const spec = generator(json, method, opts);

    // Handle the output based on its type
    handleVisualizationOutput(spec, viz.outputType, vizContainer);
  } catch (err) {
    const pErr = document.createElement("p");
    pErr.textContent = `Error in ${viz.component} for ${method}: ${err.message}`;
    vizContainer.appendChild(pErr);
  }
}

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
        renderVisualization(viz, json, method, opts, vizContainer);
        btn.remove();
      } catch (err) {
        const pErr = document.createElement("p");
        pErr.textContent = `Error loading data for ${method}: ${err.message}`;
        vizContainer.appendChild(pErr);
      }
    });
  }
}
```