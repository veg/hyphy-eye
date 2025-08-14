---
sidebar: false
header: false
footer: false
pager: false
theme: air
---

```js
import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as _ from "lodash-es";
import * as parse_svg from "parse-svg-path";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../nrm/nrm-utils.js";
import * as plots from "../nrm/nrm-plots.js";
import { NrmTreePlotGenerator } from "../nrm/nrm-plots.js"
import * as tt from "../components/tile-table/tile-table.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import {FileAttachment} from "observablehq:stdlib";
import {html} from "htl";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
const floatFormat = d3.format(".4g")
const percentageFormat = d3.format(".2p")
const proportionFormat = d3.format(".5p")
```

# NRM (non-reversible model) results summary

```js
const resultsJson = Mutable(
  await FileAttachment("../data/nrm_test_data.json").json(),
);

// Handle data from URL parameters
console.log('[NRM DEBUG] Starting parameter processing...');
console.log('[NRM DEBUG] Current URL:', window.location.href);
console.log('[NRM DEBUG] Search params:', window.location.search);

const urlParams = new URLSearchParams(window.location.search);
const jsonUrl = urlParams.get('json');
const jsonData = urlParams.get('data');
const dataId = urlParams.get('id');
const storageKey = urlParams.get('key');

console.log('[NRM DEBUG] Extracted parameters:', {jsonUrl, jsonData, dataId, storageKey});

if (jsonUrl) {
  console.log('[NRM DEBUG] Loading from URL:', jsonUrl);
  // Load JSON from external URL
  fetch(jsonUrl)
    .then(response => response.json())
    .then(data => {
      console.log('[NRM DEBUG] Fetched data from URL:', data);
      if (data && data.MLE) {
        console.log('[NRM DEBUG] Setting resultsJson from URL data');
        resultsJson.value = data;
      } else {
        console.log('[NRM DEBUG] URL data missing MLE property');
      }
    })
    .catch(error => console.error('[NRM DEBUG] Error loading JSON:', error));
} else if (jsonData) {
  console.log('[NRM DEBUG] Parsing JSON from parameter:', jsonData.substring(0, 100) + '...');
  // Parse JSON from URL parameter
  try {
    const data = JSON.parse(decodeURIComponent(jsonData));
    console.log('[NRM DEBUG] Parsed data from parameter:', data);
    if (data && data.MLE) {
      console.log('[NRM DEBUG] Setting resultsJson from parameter data');
      resultsJson.value = data;
    } else {
      console.log('[NRM DEBUG] Parameter data missing MLE property');
    }
  } catch (error) {
    console.error('[NRM DEBUG] Error parsing JSON from URL:', error);
  }
} else if (dataId || storageKey) {
  // Try to load from localStorage first
  const key = storageKey || `hyphy-results-${dataId}`;
  console.log('[NRM DEBUG] Looking for localStorage data with key:', key);
  const localData = localStorage.getItem(key);
  
  if (localData) {
    console.log('[NRM DEBUG] Found localStorage data, length:', localData.length);
    try {
      const data = JSON.parse(localData);
      console.log('[NRM DEBUG] Parsed localStorage data:', Object.keys(data));
      if (data && data.MLE) {
        console.log('[NRM DEBUG] Setting resultsJson from localStorage');
        resultsJson.value = data;
      } else {
        console.log('[NRM DEBUG] localStorage data missing MLE property');
      }
    } catch (error) {
      console.error('[NRM DEBUG] Error parsing localStorage data:', error);
    }
  } else {
    console.log('[NRM DEBUG] No localStorage data found');
    if (dataId) {
      console.log('[NRM DEBUG] Requesting data from parent via postMessage');
      // If not in localStorage, request from parent via postMessage
      window.parent.postMessage({ type: 'request-data', id: dataId }, '*');
    }
  }
} else {
  console.log('[NRM DEBUG] No URL parameters found, using default test data');
}

// Listen for postMessage events to receive data
window.addEventListener(
  "message",
  (event) => {
    console.log('[NRM DEBUG] Received postMessage:', event.data);
    if (
      event.data &&
      typeof event.data === "object" &&
      event.data.data &&
      typeof event.data.data === "object" &&
      event.data.data.MLE
    ) {
      console.log('[NRM DEBUG] Setting resultsJson from postMessage data');
      resultsJson.value = event.data.data;
    } else if (
      event.data &&
      event.data.type === "data-response" &&
      event.data.data
    ) {
      console.log('[NRM DEBUG] Received data-response postMessage');
      // Handle response to data request
      if (event.data.data && event.data.data.MLE) {
        console.log('[NRM DEBUG] Setting resultsJson from data-response');
        resultsJson.value = event.data.data;
      } else {
        console.log('[NRM DEBUG] data-response missing MLE property');
      }
    } else {
      console.log('[NRM DEBUG] postMessage did not match expected format');
    }
  },
  false,
);
```
<hr>

## Results summary

```js
const attrs = utils.getNrmAttributes(resultsJson);
const tileSpecs = utils.getNrmTileSpecs(resultsJson);
```

<div>${tt.tileTable(tileSpecs)}</div>

The best-fitting model (based on AIC-c) is **${attrs.bestModel}**. 

Based on the comparison of the general reversible (GTR) and non-reversible models (NREV12), there ${utils.getNrmReportResult(utils.getNrmTestResult(resultsJson, "GTR","NREV12"))} for the <b>non-reversibility of the evolutionary process</b>.

Based on the comparison of the non-reversible model which estimate root character frequencies (NREV12+F) and the model which assumes that these equal empirical frequencies (NREV12), there ${utils.getNrmReportResult(utils.getNrmTestResult(resultsJson, "NREV12","NREV12+F"))} for the <b>difference in root character frequencies from the distribution implied by the sequences</b>.

```js
const table1 = view(Inputs.table (attrs.modelTableData, {
  sort: "AIC-c",
  rows : 4,
}))
```

**Table 1**. Summary of model fit, overall tree lengths (subs/site), and corresponding equilibrium frequencies (EF) for each model. Note that the GTR model has the same EF as the base composition of the underlying dataset (empirical frequencies).

```js
const modelForQ = view(Inputs.select(_.map (attrs.modelSummary, (d)=>d[0]), {value: "NREV12", label: "Substitution model"}))
```

```js
// TODO: we do this a lot.. a helper function to produce standalone legends?
const qMaxRate = utils.getNrmQMaxRate(resultsJson, modelForQ)
const schemeElement = document.createElement("div")
const label = document.createElement("text")
label.textContent = "Relative rate"
schemeElement.append(label)
const legend = Plot.legend({
  color: {
    type: "linear",
    interpolate: d3.interpolateWarm,
    domain: [0, qMaxRate],
    ticks: 5
  },
  width: 200
})
schemeElement.appendChild(legend)
schemeElement.appendChild(document.createElement("br"))
```
<div>${schemeElement}</div>


```js
const qMatrixColorScale = d3.scaleSequential([0,qMaxRate],d3.interpolateWarm)
function sparkbar(max) {
  return x => htl.html`<div style="
    background: ${qMatrixColorScale(x)};
    width: ${100 * x / max}%;
    float: right;
    padding-right: 3px;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    justify-content: end;">${x.toLocaleString("en")}`
}

const qMatrixTableData = utils.getNrmQMatrixTable(resultsJson, modelForQ)
```

```js
const table2 = view(Inputs.table (qMatrixTableData, {
  rows : 4,
  format: {
      'A' : sparkbar(qMaxRate),
      'C' : sparkbar(qMaxRate),
      'G' : sparkbar(qMaxRate),
      'T' : sparkbar(qMaxRate)
  }
}))
```

**Table 2**. Rate matrix (**Q**) for the substitution model <tt>${modelForQ}</tt>. The A&lrarr;G rate is used as the reference (=1.0) for identifiability.

```js
const fig1x = view(Inputs.select(_.map (attrs.modelSummary, (d)=>d[0]), {value: attrs.bestModel, label: "x"}))
```

```js
const fig1y = view(Inputs.select(_.filter (_.map (attrs.modelSummary, (d)=>d[0]), (d)=>d!=fig1x), {value: "GTR", label: "y"}))
```

**Figure 1**. Compare branch length estimates by model (note that because GTR is not able to properly estimate the relative branch lengths of root descendants, the plot excludes those two branches)

```js
const fig1 = plots.NrmBranchLengthComparisonPlotGenerator(resultsJson, { xField: fig1x, yField: fig1y });
```

```js
<div>${vl.render({ spec: fig1 })}</div>
```

**Figure 2.** Phylogenetic tree renderings show branch lengths under the selected model, and also how the selected measure of differences in base frequencies evolves over the tree. Node bubbles show the difference between the model induced base frequencies and the frequencies observed in the corresponding sequence.

```js
// Configure tree view options
const treeDim = view(Inputs.text({placeholder: "1024 x 800", description: "Tree dimension (height x width)", submit: "Resize"}));
```
```js
const treeLabels = view(Inputs.checkbox(
  ["show internal","sequence names","align tips","show frequencies"],
  {value: ["sequence names","show internal"], label: html`<b>Tree labels</b>`}
));
```
```js
const modelForTree = view(Inputs.select(_.map(attrs.modelSummary, d=>d[0]), {value: attrs.bestModel, label: "Substitution model"}));
```
```js
const availableDistances = ["Jensen Shannon", "|ΔA|", "|ΔC|", "|ΔG|", "|ΔT|"];
const distanceFunction = view(Inputs.select(availableDistances, {value: "Jensen Shannon", label: "Distance"}));
```
```js
// Generate tree plot
const fig2 = NrmTreePlotGenerator(resultsJson, { treeDim, treeLabels, availableDistances, distanceFunction, modelForTree });
```

<div>${fig2}</div>