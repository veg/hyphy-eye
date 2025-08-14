```js
import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as _ from "lodash-es";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../relax/relax-utils.js";
import * as plots from "../relax/relax-plots.js";
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

# RELAX
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
const pvalueThreshold = 0.05;
const attributes = utils.getRelaxAttributes(resultsJson);
```

```js
// Generate summary sentence
let summarySentence = "";
if (attributes.kValue !== null && attributes.pValue !== null && attributes.likelihoodRatio !== null) {
    const kFormat = d3.format(".2f");
    const pFormat = attributes.pValue < 0.001 ? "< 0.001" : d3.format(".3f")(attributes.pValue);
    const lrFormat = d3.format(".2f")(attributes.likelihoodRatio);
    const testType = attributes.isIntensification ? "intensification" : "relaxation";
    const isSignificant = attributes.pValue <= pvalueThreshold;
    
    summarySentence = `Test for selection ${testType} (K = ${kFormat(attributes.kValue)}) was ${isSignificant ? "" : "not "}
    significant (p = ${pFormat}, LR = ${lrFormat}).`;
    
    display(html`<p><strong>${summarySentence}</strong></p>`);
}
```

```js
const tileSpecs = utils.getRelaxTileSpecs(resultsJson, pvalueThreshold);
```

```js
display(tt.tileTable(tileSpecs));
```

<hr>

## Model fits

```js
const [modelFormat, modelData, modelHeaders] = utils.getRelaxModelFitsTableData(resultsJson);
```

```js
const modelTable = view(Inputs.table(modelData, {
  header: modelHeaders,
  format: modelFormat,
  sort: "Model",
  reverse: false,
  layout: "auto",
  width: {
    "Model": 120,
    "log L": 100,
    "#. params": 100,
    "AICc": 100,
    "Branch set": 100,
    "ω1": 120,
    "ω2": 120,
    "ω3": 120
  }
}));
```

<hr>

## Rate distributions

```js
// Allow user to adjust the width of the rate distribution plots
const rateDistributionWidth = view(Inputs.range([600, 1200], {
  label: "Width", 
  step: 50, 
  value: 800
}));
```

```js
// Create a container for the rate distribution plots
const rateDistributionContainer = html`<div class="rate-distribution-container">
  <style>
    .rate-distribution-container {
      margin-top: 20px;
    }
    .rate-distribution-description {
      margin-bottom: 10px;
      font-style: italic;
    }
  </style>
  <div class="rate-distribution-description">
    The pie charts below show the proportion of sites in each omega (ω) rate class for both tested and reference branches across different models.
    Each slice represents a rate class, with the size proportional to the percentage of sites in that class.
    The omega value for each class is displayed in the slice and in the legend.
  </div>
  ${plots.createRelaxRateDistributionPlot(resultsJson, {
    width: rateDistributionWidth,
    height: 500
  })}
</div>`;

display(rateDistributionContainer);
```

<hr>

## Tree

```js
// Get tree view options
const treeViewOptions = ["All", "Test", "Reference"];
```

```js
// Tree selection dropdown
const treeSelection = view(Inputs.select(treeViewOptions, {
  label: html`<b>Tree view</b>`,
  value: "All"
}));
```

```js
// Tree dimensions controls
const treeDimensions = view(Inputs.form({
  width: Inputs.range([400, 1200], {label: "Height", step: 50, value: 600}),
  height: Inputs.range([400, 1200], {label: "Width", step: 50, value: 800})
}));
```

```js
// Create tree container with description
const treeContainer = html`<div class="tree-container">
  <style>
    .tree-container {
      margin-top: 20px;
    }
    .tree-description {
      margin-bottom: 15px;
      font-style: italic;
    }
    .phylotree-container {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      background-color: white;
    }
  </style>
  <div class="tree-description">
    This phylogenetic tree shows the branches colored by their partition assignment (Test in red, Reference in blue).
    Branch widths are increased for emphasis.
  </div>
  <div id="relax-tree-container"></div>
</div>`;

display(treeContainer);
```

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css">

```js
// Function to render tree based on current parameters
function getRelaxTree() {
  // Create new tree
  const tree = plots.getRelaxTree(resultsJson, {
    width: treeDimensions.width,
    height: treeDimensions.height,
    selectionType: treeSelection
  });
  
  return tree;
}

// Get the tree visualization
const relaxTree = getRelaxTree();

// Display the tree in the container
if (relaxTree && relaxTree.svg) {
  const container = document.getElementById("relax-tree-container");
  if (container) {
    // Clear previous tree
    container.innerHTML = "";
    container.appendChild(relaxTree.svg.node());
  }
} else {
  display(html`<p>Unable to render tree. Please check that the results file contains valid tree data.</p>`);
}
```

<hr>

## Branch attributes

```js
const [branchFormat, branchData, branchHeaders] = utils.getRelaxBranchTableData(resultsJson);
```

```js
const branchTable = view(Inputs.table(branchData, {
  header: branchHeaders,
  format: branchFormat,
  sort: "Branch",
  reverse: false,
  layout: "auto",
  width: {
    "Branch": 150,
    "Partition": 100,
    "Length": 100,
    "k": 80
  }
}));
```

<hr>

## Suggested Citation

<br>
${resultsJson.analysis["citation"] === "TBD" ? 
  html`<p>Please cite <strong>HyPhy</strong>: <a href="https://academic.oup.com/bioinformatics/article/21/5/676/220389" target="_blank">Kosakovsky Pond, S. L., Frost, S. D. W., & Muse, S. V. (2005). HyPhy: hypothesis testing using phylogenies. Bioinformatics, 21(5), 676-679.</a></p>` :
  html`<p><tt>${resultsJson.analysis["citation"]}</tt></p>`
}