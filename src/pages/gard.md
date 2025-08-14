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
import * as utils from "../gard/gard-utils.js";
import * as plots from "../gard/gard-plots.js";
import * as statsSummary from "../stats/summaries.js";
import * as omegaPlots from "../components/omega-plots.js";
import * as tt from "../components/tile-table/tile-table.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js"
import {FileAttachment} from "observablehq:stdlib";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
const floatFormat = d3.format(".4g")
const percentageFormat = d3.format(".2p")
const proportionFormat = d3.format(".5p")
```

# GARD
<br>

## Results file

```js
const resultsFile = view(Inputs.file({label: html`<b>HyPhy results json:</b>`, accept: ".json", required: true}));
```

```js
const resultsJson = Mutable(
  await FileAttachment("../data/gard_test_data.json").json(),
);

// Handle data from URL parameters
console.log('[GARD DEBUG] Starting parameter processing...');
console.log('[GARD DEBUG] Current URL:', window.location.href);
console.log('[GARD DEBUG] Search params:', window.location.search);

const urlParams = new URLSearchParams(window.location.search);
const jsonUrl = urlParams.get('json');
const jsonData = urlParams.get('data');
const dataId = urlParams.get('id');
const storageKey = urlParams.get('key');

console.log('[GARD DEBUG] Extracted parameters:', {jsonUrl, jsonData, dataId, storageKey});

if (jsonUrl) {
  console.log('[GARD DEBUG] Loading from URL:', jsonUrl);
  // Load JSON from external URL
  fetch(jsonUrl)
    .then(response => response.json())
    .then(data => {
      console.log('[GARD DEBUG] Fetched data from URL:', data);
      if (data && data.MLE) {
        console.log('[GARD DEBUG] Setting resultsJson from URL data');
        resultsJson.value = data;
      } else {
        console.log('[GARD DEBUG] URL data missing MLE property');
      }
    })
    .catch(error => console.error('[GARD DEBUG] Error loading JSON:', error));
} else if (jsonData) {
  console.log('[GARD DEBUG] Parsing JSON from parameter:', jsonData.substring(0, 100) + '...');
  // Parse JSON from URL parameter
  try {
    const data = JSON.parse(decodeURIComponent(jsonData));
    console.log('[GARD DEBUG] Parsed data from parameter:', data);
    if (data && data.MLE) {
      console.log('[GARD DEBUG] Setting resultsJson from parameter data');
      resultsJson.value = data;
    } else {
      console.log('[GARD DEBUG] Parameter data missing MLE property');
    }
  } catch (error) {
    console.error('[GARD DEBUG] Error parsing JSON from URL:', error);
  }
} else if (dataId || storageKey) {
  // Try to load from localStorage first
  const key = storageKey || `hyphy-results-${dataId}`;
  console.log('[GARD DEBUG] Looking for localStorage data with key:', key);
  const localData = localStorage.getItem(key);
  
  if (localData) {
    console.log('[GARD DEBUG] Found localStorage data, length:', localData.length);
    try {
      const data = JSON.parse(localData);
      console.log('[GARD DEBUG] Parsed localStorage data:', Object.keys(data));
      if (data && data.MLE) {
        console.log('[GARD DEBUG] Setting resultsJson from localStorage');
        resultsJson.value = data;
      } else {
        console.log('[GARD DEBUG] localStorage data missing MLE property');
      }
    } catch (error) {
      console.error('[GARD DEBUG] Error parsing localStorage data:', error);
    }
  } else {
    console.log('[GARD DEBUG] No localStorage data found');
    if (dataId) {
      console.log('[GARD DEBUG] Requesting data from parent via postMessage');
      // If not in localStorage, request from parent via postMessage
      window.parent.postMessage({ type: 'request-data', id: dataId }, '*');
    }
  }
} else {
  console.log('[GARD DEBUG] No URL parameters found, using default test data');
}

window.addEventListener(
  "message",
  (event) => {
    console.log('[GARD DEBUG] Received postMessage:', event.data);
    if (
      event.data &&
      typeof event.data === "object" &&
      event.data.data &&
      typeof event.data.data === "object" &&
      event.data.data.MLE
    ) {
      console.log('[GARD DEBUG] Setting resultsJson from postMessage data');
      resultsJson.value = event.data.data;
    } else if (
      event.data &&
      event.data.type === "data-response" &&
      event.data.data
    ) {
      console.log('[GARD DEBUG] Received data-response postMessage');
      // Handle response to data request
      if (event.data.data && event.data.data.MLE) {
        console.log('[GARD DEBUG] Setting resultsJson from data-response');
        resultsJson.value = event.data.data;
      } else {
        console.log('[GARD DEBUG] data-response missing MLE property');
      }
    } else {
      console.log('[GARD DEBUG] postMessage did not match expected format');
    }
  },
  false,
);
```
<hr>

## Results summary

```js
const attrs = utils.getGardAttributes(resultsJson);
const tileSpecs = utils.getGardTileSpecs(resultsJson);
const treeObjects = plots.getGardTreeObjects(resultsJson);
const treeLengths = plots.getGardTreeLengths(treeObjects);
const gardResultTable = _.chain (resultsJson['siteBreakPointSupport']).toPairs().map ((d)=>{return {'site' : +d[0], 'support' : d[1]}}).value();
```

<div>${tt.tileTable(tileSpecs)}</div>

**Figure 1**. Breakpoint placement and c-AIC improvements

```js
const fig1 = plots.GardBreakpointPlotGenerator(resultsJson);
```
<div>${vl.render({ spec: fig1 })}</div>

**Figure 2**. Model-averaged support

```js
const fig2 = plots.GardSupportPlotGenerator(resultsJson);
```
<div>${vl.render({ spec: fig2 })}</div>

**Figure 3**. Total tree length

```js
const fig3 = plots.GardTreeLengthPlotGenerator(treeLengths);
```
<div>${vl.render({ spec: fig3 })}</div>

**Figure 4.** Trees for individial fragments

```js
const variants = view(Inputs.select(
  phylotreeUtils.seqNames(treeObjects[0].tree),
  {
    label: "Select some sequences to highlight",
    placeholder: "Select some sequences",
    multiple: true
  }
))
```

```js
// TODO: this mess seems convoluted
const displayedTrees = plots.getGardDisplayedTrees(treeObjects, variants)
const treesHtml = plots.getGardTreeDivs(treeObjects, displayedTrees)
const treesContainer = document.createElement("div")
treesContainer.innerHTML = treesHtml;
```
<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div>${treesContainer}</div>

<hr>

## Suggested Citation

<br>
<p><tt>${resultsJson.analysis["citation"]}</tt></p>