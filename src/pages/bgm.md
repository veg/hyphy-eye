```js
import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as _ from "lodash-es";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../bgm/bgm-utils.js";
import * as plots from "../bgm/bgm-plots.js";
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

# BGM (Bayesian Graphical Model)
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
const attributes = utils.getBgmAttributes(resultsJson);
```

```js
const posteriorThreshold = view(Inputs.range([0.1, 0.9], {value: 0.5, step: 0.05, label: html`<b>Posterior probability threshold</b>`}));
```

```js
const coevolvingPairs = utils.countCoevolvingSitePairs(resultsJson, posteriorThreshold);
```

```js
display(html`<p>BGM found <strong>${coevolvingPairs}</strong> pairs of co-evolving sites (posterior probability ≥ <strong>${posteriorThreshold}</strong>).</p>`);
```

```js
const tileSpecs = utils.getBgmTileSpecs(resultsJson, posteriorThreshold);
```

```js
display(tt.tileTable(tileSpecs));
```

<hr>

## Model Fits

```js
const modelFitsData = utils.getBgmModelFitsTableData(resultsJson);
```

```js
display(Inputs.table(modelFitsData, {
  columns: [
    "Model",
    "AIC-c",
    "Log L",
    "Parameters",
    "Rate distributions"
  ],
  header: {
    "Model": "Model",
    "AIC-c": "AIC-c",
    "Log L": "Log L",
    "Parameters": "Parameters",
    "Rate distributions": "Rate distributions"
  },
  layout: "auto",
  width: {
    "Model": 300,
    "AIC-c": 100,
    "Log L": 100,
    "Parameters": 100,
    "Rate distributions": 150
  }
}));
```

<hr>

## Co-evolving Site Pairs

```js
const coevolvingPairsData = utils.getBgmCoevolvingPairsTableData(resultsJson, posteriorThreshold);
```

```js
display(Inputs.table(coevolvingPairsData, {
  columns: [
    "Site 1",
    "Site 2", 
    "P [Site 1 –> Site 2]",
    "P [Site 2 –> Site 1]",
    "P [Site 1 <–> Site 2]",
    "Site 1 subs",
    "Site 2 subs",
    "Shared subs"
  ],
  header: {
    "Site 1": "Site 1",
    "Site 2": "Site 2",
    "P [Site 1 –> Site 2]": "P [Site 1 → Site 2]",
    "P [Site 2 –> Site 1]": "P [Site 2 → Site 1]", 
    "P [Site 1 <–> Site 2]": "P [Site 1 ↔ Site 2]",
    "Site 1 subs": "Site 1 subs",
    "Site 2 subs": "Site 2 subs",
    "Shared subs": "Shared subs"
  },
  format: {
    "P [Site 1 –> Site 2]": x => x,
    "P [Site 2 –> Site 1]": x => x,
    "P [Site 1 <–> Site 2]": x => x
  },
  layout: "auto",
  width: {
    "Site 1": 80,
    "Site 2": 80,
    "P [Site 1 –> Site 2]": 120,
    "P [Site 2 –> Site 1]": 120,
    "P [Site 1 <–> Site 2]": 120,
    "Site 1 subs": 100,
    "Site 2 subs": 100,
    "Shared subs": 100
  }
}));
```

<hr>

## Phylogenetic Tree

```js
const treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
```

```js
const treeViewOptions = utils.getBgmTreeViewOptions(resultsJson);
const selectedTree = view(Inputs.select(treeViewOptions, {label: html`<b>View tree for </b>`}));
```

```js
const treeDim = view(Inputs.text({placeholder: "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}));
```

```js
const figure = plots.getBgmTree(resultsJson, selectedTree, treeDim, treeObjects);
```

<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div id="tree_container">${figure.show()}</div>

## Citation

```js
if (resultsJson.analysis && resultsJson.analysis["citation"] && resultsJson.analysis["citation"] !== "") {
  display(html`<p><tt>${resultsJson.analysis["citation"]}</tt></p>`);
} else {
  display(html`<p><em>Please cite the BGM (Spidermonkey) method when using these results.</em></p>`);
}
```