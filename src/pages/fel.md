---
sidebar: false
header: false
footer: false
pager: false
---

```js
import * as d3 from "d3";
import * as _ from "lodash-es";
import * as phylotree from "phylotree";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../fel/fel-utils.js";
import * as plots from "../fel/fel-plots.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as tt from "../components/tile-table/tile-table.js";
import {FileAttachment} from "observablehq:stdlib";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
```

# FEL
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
const attributes = utils.getFelAttributes(resultsJson);
```

Statistical significance is evaluated based on  ${resultsJson.simulated  ? "<tt>" + resultsJson.simulated + "</tt> site-level parametric bootstrap replicates"  : "the asymptotic chi-squared distribution"}. This analysis **${attributes.hasBackground? "included" : "does not include"}** site to site synonymous rate variation. ${attributes.hasCi ? "Profile approximate confidence intervals for site-level dN/dS ratios have been computed." : ""}


```js
const pvalueThreshold = await view(Inputs.text({label: html`<b>p-value threshold</b>`, value: "0.1", submit: "Update"}));
```

```js
const sitesTable = utils.getFelSiteTableData(resultsJson, pvalueThreshold);
const siteTableData = _.filter(sitesTable[1], (x) => tableFilter.indexOf(x.class) >= 0);
const tileSpecs = utils.getFelTileSpecs(resultsJson, pvalueThreshold)
```

<div>${tt.tileTable(tileSpecs)}</div>

```js
const tableFilter = view(Inputs.checkbox(
  ["Diversifying", "Purifying", "Neutral","Invariable"], 
  {
    value: ["Diversifying", "Purifying", "Neutral", "Invariable"], 
    label: html`<b>Show</b>`, 
    format: x => html`<span style="text-transform: capitalize; border-bottom: solid 2px ${plots.COLORS[x]}; margin-bottom: -2px;">${x}`
  }
));
```

```js
function getFig1Data() {
   let inSet = new Set (_.map (table1, (d)=>d.codon));
   return _.filter (siteTableData, (x)=>inSet.has (x.codon));
}
const fig1Data = getFig1Data();
```

```js
const plotType =  view(Inputs.select(_.map (_.filter (plots.getFelPlotOptions(attributes.hasPasmt), (d)=>d[1](resultsJson)), d=>d[0]),{label: html`<b>Plot type</b>`}))
```

```js
const plotDescription = plots.getFelPlotDescription(plotType, pvalueThreshold)
const plotSpec = plots.getFelPlotSpec(plotType, fig1Data, pvalueThreshold, attributes.hasPasmt)
const treeObjects = phylotreeUtils.getTreeObjects(resultsJson)
```

**Figure 1**. <small>${plotDescription}</small>
<div>${vl.render({"spec": plotSpec})}</div>

**Table 1**. <small>Detailed site-by-site results from the FEL analysis</small>

```js
const table1 = view(Inputs.table (siteTableData, {
  rows : 15,
  format: sitesTable[0]
}));
```

<details>
  <summary><b>Table column definitions</b></small></summary>
  <small><dl>
    ${_.map (sitesTable[2], (d)=>html`<dt><tt>${d[0]}</tt></dt><dd>${d[1]}</dd>`)}
  </dl></small>
</details>

```js
const selectedTree = view(Inputs.select(phylotreeUtils.getTreeViewOptions(resultsJson, treeObjects, {includeCodons: false}),{label: html`<b>View tree for </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}));
```

<small>Branches that are shown in <span style = 'color: redbrick'>red color</span> are those that were included in testing for selection</small>

```js
function displayTree(i) {
    return plots.getFelTree(resultsJson, i, treeDim, treeObjects);
}

const treeId = phylotreeUtils.getTreeId(selectedTree);
const figure2 = displayTree(treeId).show()
```
<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div id="tree_container">${figure2}</div>

<hr>

## Suggested Citation

<br>
<p><tt>${resultsJson.analysis["citation"]}</tt></p>

<hr>

## hyphy-eye

<br>

View _more_ results at [hyphy-eye](/)!!

```js
const svgSize = 700