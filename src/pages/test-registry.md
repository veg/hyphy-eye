```js
import * as d3 from "d3";
import * as _ from "lodash-es";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import { BeadPlotGenerator } from "../components/bead-plot.js";
import { FileAttachment } from "observablehq:stdlib";
import * as registry from "../registry.js";

const vl = vegaLiteApi.register(vega, vegaLite);
```

# Test: BeadPlotGenerator
This page exercises the `BeadPlotGenerator` for each HyPhy method using example JSON payloads in `src/data`.

## BUSTED
```js
const bustedJson = await FileAttachment("../data/busted_test_data.json").json();
// Grab all bead-plot viz entries for BUSTED from registry
const bustedVizSpecs = registry.HyPhyMethods.BUSTED.visualizations.filter(v => v.component === 'BeadPlot');
// Generate and render each spec with its options
const bustedSpecs = bustedVizSpecs.map(viz => BeadPlotGenerator(bustedJson, 'BUSTED', 10, 10000, viz.options));
const bustedPlots = await Promise.all(bustedSpecs.map(spec => vl.render({ spec }))); // Render all plots
```
<div>${bustedPlots}</div>

---

## aBSREL
```js
const absrelJson = await FileAttachment("../data/absrel_test_data.json").json();
// Render all bead-plot configs for aBSREL
const absrelVizSpecs = registry.HyPhyMethods.aBSREL.visualizations.filter(v => v.component === 'BeadPlot');
const absrelSpecs = absrelVizSpecs.map(viz => BeadPlotGenerator(absrelJson, 'aBSREL', 0.1, 10000, viz.options));
const absrelPlots = await Promise.all(absrelSpecs.map(spec => vl.render({ spec }))); // Render all plots
```
<div>${absrelPlots}</div>

---

## FEL
```js
const felJson = await FileAttachment("../data/fel_test_data.json").json();
const felVizSpecs = registry.HyPhyMethods.FEL.visualizations.filter(v => v.component === 'BeadPlot');
const felSpecs = felVizSpecs.map(viz => BeadPlotGenerator(felJson, 'FEL', 0.1, 10, viz.options));
const felPlots = await Promise.all(felSpecs.map(spec => vl.render({ spec }))); // Render all plots
```
<div>${felPlots}</div>

---

## MEME
```js
const memeJson = await FileAttachment("../data/meme_test_data.json").json();
const memeVizSpecs = registry.HyPhyMethods.MEME.visualizations.filter(v => v.component === 'BeadPlot');
const memeSpecs = memeVizSpecs.map(viz => BeadPlotGenerator(memeJson, 'MEME', 0.1, 10000, viz.options));
const memePlots = await Promise.all(memeSpecs.map(spec => vl.render({ spec }))); // Render all plots
```
<div>${memePlots}</div>

---

## GARD
```js
const gardJson = await FileAttachment("../data/gard_test_data.json").json();
const gardVizSpecs = registry.HyPhyMethods.GARD.visualizations.filter(v => v.component === 'BeadPlot');
const gardSpecs = gardVizSpecs.map(viz => BeadPlotGenerator(gardJson, 'GARD', 0, 10000, viz.options));
const gardPlots = await Promise.all(gardSpecs.map(spec => vl.render({ spec }))); // Render all plots
```
<div>${gardPlots}</div>

---

## NRM
```js
const nrmJson = await FileAttachment("../data/nrm_test_data.json").json();
const nrmVizSpecs = registry.HyPhyMethods.NRM.visualizations.filter(v => v.component === 'BeadPlot');
const nrmSpecs = nrmVizSpecs.map(viz => BeadPlotGenerator(nrmJson, 'NRM', 0, 10000, viz.options));
const nrmPlots = await Promise.all(nrmSpecs.map(spec => vl.render({ spec }))); // Render all plots
```
<div>${nrmPlots}</div>

---

## MULTIHIT
```js
const mhJson = await FileAttachment("../data/multihit_test_data.json").json();
const mhVizSpecs = registry.HyPhyMethods.MULTIHIT.visualizations.filter(v => v.component === 'BeadPlot');
const mhSpecs = mhVizSpecs.map(viz => BeadPlotGenerator(mhJson, 'MULTIHIT', 0, 10000, viz.options));
const mhPlots = await Promise.all(mhSpecs.map(spec => vl.render({ spec }))); // Render all plots
```
<div>${mhPlots}</div>
