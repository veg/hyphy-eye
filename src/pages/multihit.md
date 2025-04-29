```js
import * as d3 from "d3";
import * as _ from "lodash-es";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../multihit/multihit-utils.js";
import * as plots from "../multihit/multihit-plots.js";
import * as tt from "../components/tile-table/tile-table.js";
import {FileAttachment} from "observablehq:stdlib";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
const floatFormat = d3.format(".4g")
const percentageFormat = d3.format(".2p")
const proportionFormat = d3.format(".5p")
```

# MULTI-HIT
<br>

## Results file

```js
const resultsFile = view(Inputs.file({label: html`<b>HyPhy results json:</b>`, accept: ".json", required: true}));
```

```js
const resultsJson = Mutable(resultsFile.json());
```

```js
window.addEventListener(
  "message",
  (event) => {
    if (event.data.data.MLE) {
      resultsJson.value = event.data.data; // Update the mutable value
    }
  },
  false,
);
```
<hr>

## Results summary

```js
const attrs = utils.getMultihitAttributes(resultsJson);
const tileSpecs = utils.getMultihitTileSpecs(resultsJson);
```

<div>${tt.tileTable(tileSpecs)}</div>

**Figure 1**. Evidence Ratios.

```js
const fig1 = plots.MultihitEvidenceRatiosPlotGenerator(resultsJson);
```
<div>${vl.render({ spec: fig1 })}</div>

**Figure 2**. Site Log-Likelihood

```js
const fig2 = plots.MultihitSiteLogLikelihoodPlotGenerator(resultsJson);
```
<div>${vl.render({ spec: fig2 })}</div>

**Figure 3**. Model Fitting Benchmarks

```js
const fig3 = plots.MultihitTimerBarPlotGenerator(resultsJson);
```
<div>${vl.render({ spec: fig3 })}</div>