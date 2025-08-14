```js
import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as _ from "lodash-es";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../slac/slac-utils.js";
import * as plots from "../slac/slac-plots.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as statsSummary from "../stats/summaries.js";
import * as tt from "../components/tile-table/tile-table.js";
import {FileAttachment} from "observablehq:stdlib";
import {html} from "htl";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
const floatFormat = d3.format(".4g");
const percentageFormat = d3.format(".2p");
const proportionFormat = d3.format(".5p");
```

# SLAC
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
const attributes = utils.getSlacAttributes(resultsJson);
```

```js
const pvalueThreshold = view(Inputs.range([0.001, 0.2], {value: 0.1, step: 0.001, label: html`<b>P-value threshold</b>`}));
```

```js
const ambiguityHandling = view(Inputs.select(attributes.ambiguityOptions, {value: attributes.ambiguityOptions[0], label: html`<b>Ambiguity handling</b>`}));
```

```js
const tileSpecs = utils.getSlacTileSpecs(resultsJson, pvalueThreshold);
```

```js
display(tt.tileTable(tileSpecs));
```

<hr>

## Partition information

```js
const [partitionFormat, partitionData, partitionHeaders] = utils.getSlacPartitionTableData(resultsJson, pvalueThreshold, ambiguityHandling);
```

```js
const partitionTable = view(Inputs.table(partitionData, {
  header: partitionHeaders,
  format: partitionFormat,
  sort: "Partition",
  reverse: false,
  layout: "auto",
  width: {
    "Partition": 80,
    "Sites": 80,
    "Positive Sites": 100,
    "Negative Sites": 100,
    "Neutral Sites": 100,
    "% Positive": 100,
    "% Negative": 100
  }
}));
```

<hr>

## Model fits

```js
const [modelFitsFormat, modelFitsData, modelFitsHeaders] = utils.getSlacModelFitsTableData(resultsJson);
```

```js
const modelFitsTable = view(Inputs.table(modelFitsData, {
  header: modelFitsHeaders,
  format: modelFitsFormat,
  sort: "Model",
  reverse: false,
  layout: "auto",
  width: {
    "Model": 150,
    "AIC-c": 100,
    "Log L": 100,
    "Parameters": 100,
    "Rate Distributions": 200
  }
}));
```

<hr>

## Site-level results

```js
const [siteFormat, siteData, siteHeaders] = utils.getSlacSiteTableData(resultsJson, pvalueThreshold, ambiguityHandling);
```

```js
const tableFilter = view(Inputs.checkbox(
  ["Positive", "Negative", "Neutral"], 
  {
    value: ["Positive", "Negative", "Neutral"], 
    label: html`<b>Show</b>`, 
    format: x => html`<span style="text-transform: capitalize; border-bottom: solid 2px ${x === 'Positive' ? '#3f6c22' : x === 'Negative' ? '#284073' : '#a6a4a4'}; margin-bottom: -2px;">${x}`
  }
));
```

```js
const filteredSiteData = siteData.filter(d => tableFilter.includes(d.Classification));
```

```js
const siteTable = view(Inputs.table(filteredSiteData, {
  header: siteHeaders,
  format: {
    ...siteFormat,
    "Classification": (d) => html`<span style="color: ${d === 'Positive' ? '#3f6c22' : d === 'Negative' ? '#284073' : '#a6a4a4'}; font-weight: bold;">${d}</span>`
  },
  sort: "Site",
  reverse: false,
  rows: 15,
  layout: "auto",
  width: {
    "Site": 60,
    "Partition": 80,
    "dS": 80,
    "dN": 80,
    "dN/dS": 80,
    "Positive P-value": 120,
    "Negative P-value": 120,
    "Classification": 100
  }
}));
```

<hr>

## Site graph

```js
const xAxisOptions = ["Site", "dN", "dS", "dN/dS", "dN-dS", "Positive P-value", "Negative P-value"];
const yAxisOptions = ["dN-dS", "dN/dS", "dN", "dS", "Positive P-value", "Negative P-value"];
```

```js
const selectedXAxis = view(Inputs.select(xAxisOptions, {
  value: "Site",
  label: html`<b>X-axis</b>`
}));
```

```js
const selectedYAxis = view(Inputs.select(yAxisOptions, {
  value: "dN-dS",
  label: html`<b>Y-axis</b>`
}));
```

<div style="margin: 20px 0;">
  <small><em>Note: Changing the x-axis to anything but "Site" results in a scatter plot.</em></small>
</div>

```js
const siteGraph = plots.createSlacSiteGraph(resultsJson, selectedXAxis, selectedYAxis, pvalueThreshold, ambiguityHandling);
```

<div>${siteGraph}</div>

<hr>

## Fitted tree

```js
const treeObjects = phylotreeUtils.getTreeObjects(resultsJson)
```

```js
const [treeViewOptions, codonToPartitionMapping] = utils.getSlacTreeViewOptionsWithMapping(resultsJson, {includeCodons: true});
const selectedTree = view(Inputs.select(treeViewOptions,{label: html`<b>View tree for </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}));
```

<small>Branches that are shown in <span style = 'color: red'>red color</span> are those that were included in testing for selection</small>

```js
const figure2 = plots.getSlacTree(resultsJson, selectedTree, treeDim, treeObjects, codonToPartitionMapping);
```
<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div id="tree_container">${figure2.show()}</div>

<hr>

## Citation

```js
if (resultsJson.analysis && resultsJson.analysis["citation"]) {
  display(html`<p><tt>${resultsJson.analysis["citation"]}</tt></p>`);
} else {
  display(html`<p><em>Please cite the SLAC method when using these results.</em></p>`);
}
```