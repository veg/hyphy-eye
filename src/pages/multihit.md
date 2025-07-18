---
sidebar: false
header: false
footer: false
pager: false
theme: air
---

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

# MULTI-HIT results summary

```js
const results_json = Mutable(
  await FileAttachment("../data/multihit_test_data.json").json(),
);

// Handle data from URL parameters
console.log('[MULTIHIT DEBUG] Starting parameter processing...');
console.log('[MULTIHIT DEBUG] Current URL:', window.location.href);
console.log('[MULTIHIT DEBUG] Search params:', window.location.search);

const urlParams = new URLSearchParams(window.location.search);
const jsonUrl = urlParams.get('json');
const jsonData = urlParams.get('data');
const dataId = urlParams.get('id');
const storageKey = urlParams.get('key');

console.log('[MULTIHIT DEBUG] Extracted parameters:', {jsonUrl, jsonData, dataId, storageKey});

if (jsonUrl) {
  console.log('[MULTIHIT DEBUG] Loading from URL:', jsonUrl);
  // Load JSON from external URL
  fetch(jsonUrl)
    .then(response => response.json())
    .then(data => {
      console.log('[MULTIHIT DEBUG] Fetched data from URL:', data);
      if (data && data.MLE) {
        console.log('[MULTIHIT DEBUG] Setting results_json from URL data');
        results_json.value = data;
      } else {
        console.log('[MULTIHIT DEBUG] URL data missing MLE property');
      }
    })
    .catch(error => console.error('[MULTIHIT DEBUG] Error loading JSON:', error));
} else if (jsonData) {
  console.log('[MULTIHIT DEBUG] Parsing JSON from parameter:', jsonData.substring(0, 100) + '...');
  // Parse JSON from URL parameter
  try {
    const data = JSON.parse(decodeURIComponent(jsonData));
    console.log('[MULTIHIT DEBUG] Parsed data from parameter:', data);
    if (data && data.MLE) {
      console.log('[MULTIHIT DEBUG] Setting results_json from parameter data');
      results_json.value = data;
    } else {
      console.log('[MULTIHIT DEBUG] Parameter data missing MLE property');
    }
  } catch (error) {
    console.error('[MULTIHIT DEBUG] Error parsing JSON from URL:', error);
  }
} else if (dataId || storageKey) {
  // Try to load from localStorage first
  const key = storageKey || `hyphy-results-${dataId}`;
  console.log('[MULTIHIT DEBUG] Looking for localStorage data with key:', key);
  const localData = localStorage.getItem(key);
  
  if (localData) {
    console.log('[MULTIHIT DEBUG] Found localStorage data, length:', localData.length);
    try {
      const data = JSON.parse(localData);
      console.log('[MULTIHIT DEBUG] Parsed localStorage data:', Object.keys(data));
      if (data && data.MLE) {
        console.log('[MULTIHIT DEBUG] Setting results_json from localStorage');
        results_json.value = data;
      } else {
        console.log('[MULTIHIT DEBUG] localStorage data missing MLE property');
      }
    } catch (error) {
      console.error('[MULTIHIT DEBUG] Error parsing localStorage data:', error);
    }
  } else {
    console.log('[MULTIHIT DEBUG] No localStorage data found');
    if (dataId) {
      console.log('[MULTIHIT DEBUG] Requesting data from parent via postMessage');
      // If not in localStorage, request from parent via postMessage
      window.parent.postMessage({ type: 'request-data', id: dataId }, '*');
    }
  }
} else {
  console.log('[MULTIHIT DEBUG] No URL parameters found, using default test data');
}

window.addEventListener(
  "message",
  (event) => {
    console.log('[MULTIHIT DEBUG] Received postMessage:', event.data);
    if (
      event.data &&
      typeof event.data === "object" &&
      event.data.data &&
      typeof event.data.data === "object" &&
      event.data.data.MLE
    ) {
      console.log('[MULTIHIT DEBUG] Setting results_json from postMessage data');
      results_json.value = event.data.data;
    } else if (
      event.data &&
      event.data.type === "data-response" &&
      event.data.data
    ) {
      console.log('[MULTIHIT DEBUG] Received data-response postMessage');
      // Handle response to data request
      if (event.data.data && event.data.data.MLE) {
        console.log('[MULTIHIT DEBUG] Setting results_json from data-response');
        results_json.value = event.data.data;
      } else {
        console.log('[MULTIHIT DEBUG] data-response missing MLE property');
      }
    } else {
      console.log('[MULTIHIT DEBUG] postMessage did not match expected format');
    }
  },
  false,
);
```
<hr>

## Results summary

```js
const attrs = utils.get_attributes(results_json);
const tile_specs = utils.get_tile_specs(results_json);
```

<div>${tt.tile_table(tile_specs)}</div>

**Figure 1**. Evidence Ratios.

```js
const fig1={
  width: 400,
  height: 200,
  "data": {"values": attrs.evidence_ratios},
  "mark": {type: "rule", tooltip : true},
  "encoding": {
    "facet": {
      "field": "model",
      "type": "ordinal",
      "columns": 2
    },
    "x": {"field": "site", "type": "quantitative",  "axis" : {"grid" : false, title : "site"}},
    "y": {"field": "er", "type": "quantitative",  "axis" : {"grid" : false, title : "Evidence Ratio"}},
  }
}
```
<div>${vl.render({"spec": fig1})}</div>

**Figure 2**. Site Log-Likelihood

```js
const fig2={
  width: 400,
  height: 200,
  "data": {"values": attrs.site_log_likelihood},
  "mark": {type: "point", tooltip : true},
  "encoding": {
    "facet": {
      "field": "model",
      "type": "ordinal",
      "columns": 2
    },
    "x": {"field": "site", "type": "quantitative",  "axis" : {"grid" : false, title : "site"}},
    "y": {"field": "site_log_likelihood", "type": "quantitative",  "axis" : {"grid" : false, title : "Site Log-Likelihood"}},
  }
}
```
<div>${vl.render({"spec": fig2})}</div>

**Figure 3**. Model Fitting Benchmarks

```js
const fig3={
  width: 800,
  height: 200,
  "data": {"values": attrs.timers},
  "mark": {type: "bar", tooltip : true,  point : false},
  "encoding": {
    "y": {"field": "model", "type": "ordinal",  "axis" : {"grid" : false, title : "Model"}, "sort": "-x"},
    "x": {"field": "time", "type": "quantitative",  "axis" : {"grid" : false, title : "Time (seconds)"}, "scale" : {"type" :"sqrt"}},
  }
}
```
<div>${vl.render({"spec": fig3})}</div>

<hr>

## hyphy-eye

<br>

View _more_ results at [hyphy-eye](/)!!