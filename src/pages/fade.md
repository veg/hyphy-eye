```js
import { FileAttachment } from "npm:@observablehq/stdlib";
import * as d3 from "npm:d3";
import * as utils from "../fade/fade-utils.js";
import * as plots from "../fade/fade-plots.js";
import * as tt from "../components/tile-table/tile-table.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
```

```js
const numberFormat = d3.format(".4f");
const percentageFormat = d3.format(".2p");
const proportionFormat = d3.format(".5p");
```

# FADE
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

## Results Summary

```js
const bayesFactorThreshold = view(Inputs.range([1, 1000], {
  value: 100,
  step: 1,
  label: "Bayes Factor threshold"
}));
```

```js
const fadeAttributes = utils.getFadeAttributes(resultsJson);
const selectionBiasSites = utils.countSelectionBiasSites(resultsJson, bayesFactorThreshold);
const tileSpecs = utils.getFadeTileSpecs(resultsJson, bayesFactorThreshold);
```

<p><strong>FADE found evidence of selection bias toward a particular amino acid at ${selectionBiasSites} sites with Bayes Factor ≥ ${bayesFactorThreshold}</strong></p>

<div>${tt.tileTable(tileSpecs)}</div>

<hr>

## Model Fits

```js
const [modelFitsFormat, modelFitsData, modelFitsHeaders] = utils.getFadeModelFitsTableData(resultsJson);
```

<div>${Inputs.table(modelFitsData, {
  format: modelFitsFormat,
  header: modelFitsHeaders,
  width: {
    "Model": 120,
    "AIC-c": 100,
    "Log L": 100,
    "Parameters": 100,
    "Rate Distributions": 200
  }
})}</div>

<hr>

## Sites with Selection Bias

```js
const [siteFormat, siteData, siteHeaders] = utils.getFadeSiteTableData(resultsJson, bayesFactorThreshold);
```

<div>${Inputs.table(siteData, {
  format: siteFormat,
  header: siteHeaders,
  width: {
    "Amino Acid": 80,
    "Site Index": 80,
    "Rate": 80,
    "Bias": 80,
    "Prob [bias>0]": 100,
    "Bayes Factor [bias>0]": 120,
    "Composition": 200,
    "Substitutions": 300
  },
  maxWidth: 1200
})}</div>

<hr>

## Site Scatter Plot

```js
const aminoAcidOptions = plots.getFadeAminoAcidOptions(resultsJson);
const selectedAminoAcid = view(Inputs.select(aminoAcidOptions, {
  value: "All",
  label: html`<b>Filter by Amino Acid</b>`
}));
```

```js
const xAxisOptions = [
  "Site Index",
  "Bayes Factor",
  "Log(Bayes Factor)",
  "Bias",
  "Rate",
  "Probability"
];
const selectedXAxis = view(Inputs.select(xAxisOptions, {
  value: "Site Index",
  label: html`<b>X-axis</b>`
}));
```

```js
const yAxisOptions = [
  "Bayes Factor",
  "Log(Bayes Factor)",
  "Bias",
  "Rate",
  "Probability"
];
const selectedYAxis = view(Inputs.select(yAxisOptions, {
  value: "Bayes Factor",
  label: html`<b>Y-axis</b>`
}));
```

```js
const sitePlotData = plots.getFadeSitePlotData(resultsJson, selectedAminoAcid, bayesFactorThreshold);
const siteScatterPlot = plots.createFadeSiteGraph(sitePlotData, selectedXAxis, selectedYAxis, bayesFactorThreshold, {
  width: 800,
  height: 400
});
```

<div>${siteScatterPlot}</div>

<hr>

## Fitted tree

```js
const treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
const hasTreeData = treeObjects && treeObjects.length > 0;
```

```js
const [treeViewOptions, codonToPartitionMapping] = hasTreeData ? 
  utils.getFadeTreeViewOptionsWithMapping(resultsJson, {includeCodons: true}) : 
  [[], {}];
const selectedTree = hasTreeData ? 
  view(Inputs.select(treeViewOptions,{label: html`<b>View tree for </b>`})) : 
  null;
```

```js
const treeDim = hasTreeData ? 
  view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"})) : 
  null;
```

${hasTreeData ? 
  html`<small>The phylogenetic tree used for the FADE analysis.</small>` : 
  html`<small><em>Tree visualization is not available for this FADE analysis (no tree data found in results).</em></small>`
}

```js
const fadeTree = hasTreeData ? plots.getFadeTree(resultsJson, selectedTree, treeDim, treeObjects, codonToPartitionMapping) : null;
```
<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div id="tree_container">${hasTreeData && fadeTree ? fadeTree.show() : html`<p><em>Tree visualization not available.</em></p>`}</div>

<hr>

## Suggested Citation

<br>
${resultsJson.analysis["citation"] === "TBD" ? 
  html`<a href="https://academic.oup.com/bioinformatics/article/21/5/676/220389" target="_blank">Kosakovsky Pond, S. L., Frost, S. D. W., & Muse, S. V. (2005). HyPhy: hypothesis testing using phylogenies. Bioinformatics, 21(5), 676-679.</a>` :
  html`<p><tt>${resultsJson.analysis["citation"]}</tt></p>`
}

