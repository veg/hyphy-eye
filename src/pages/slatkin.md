```js
import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as _ from "lodash-es";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../slatkin/slatkin-utils.js";
import * as plots from "../slatkin/slatkin-plots.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as tt from "../components/tile-table/tile-table.js";
import {FileAttachment} from "observablehq:stdlib";
import {html} from "htl";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
const floatFormat = d3.format(".4g");
const percentageFormat = d3.format(".2p");
```

# Slatkin-Maddison
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
    if (event.data.data) {
      resultsJson.value = event.data.data; // Update the mutable value
    }
  },
  false,
);
```
<hr>

## Results summary

```js
const attributes = utils.getSlatkinAttributes(resultsJson);
```

```js
display(html`
  <p>
    Based on <b>${attributes.replicates}</b> leaf label permutations, the standard (full panmixia) p-value for 
    compartmentalization test was &lt; <b>${floatFormat(attributes.panmixiaPValue)}</b>.
  </p>
`);
```

```js
const tileSpecs = utils.getSlatkinTileSpecs(resultsJson);
```

```js
display(tt.tileTable(tileSpecs));
```

<hr>

## Full Panmixia Test (Standard)

```js
display(html`
  <p>
    Based on <b>${attributes.replicates}</b> leaf label permutations, the standard (full panmixia) p-value for 
    compartmentalization test was &lt; <b>${floatFormat(attributes.panmixiaPValue)}</b>.
  </p>
`);
```

<hr>

## Structured Test

```js
display(html`
  <p>
    Based on <b>${attributes.replicates}</b> <i>structured</i> permutations, the p-value for 
    compartmentalization test was &lt; <b>${floatFormat(attributes.structuredPValue)}</b>.
  </p>
  
  <p class="alert alert-warning">
    <small>
      This p-value is derived by comparing the distribution of migration events in the observed data 
      to those obtained from permutations that preserve the structure of the compartments. 
      This test is more conservative than the standard test, as it accounts for the underlying 
      structure of the compartments.
    </small>
  </p>
`);
```

<hr>

## Compartments

```js
const [compartmentFormat, compartmentData, compartmentHeaders] = utils.getSlatkinCompartmentTableData(resultsJson);
```

```js
const compartmentTable = view(Inputs.table(compartmentData, {
  header: compartmentHeaders,
  format: compartmentFormat,
  sort: "Compartment",
  reverse: false,
  layout: "auto",
  width: {
    "Compartment": 150,
    "Count": 100
  }
}));
```

<hr>

## Migrations

```js
const [migrationFormat, migrationData, migrationHeaders] = utils.getSlatkinMigrationTableData(resultsJson);
```

```js
const migrationTable = view(Inputs.table(migrationData, {
  header: migrationHeaders,
  format: migrationFormat,
  sort: "Node",
  reverse: false,
  layout: "auto",
  width: {
    "Node": 100,
    "From": 100,
    "To": 100
  }
}));
```

<hr>

## Fitted tree

```js
const treeObjects = utils.getSlatkinTreeObjects(resultsJson)
```

```js
const treeViewOptions = utils.getSlatkinTreeViewOptions(resultsJson);
const selectedTree = view(Inputs.select(treeViewOptions, {label: html`<b>View tree for </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}));
```

<small>Node colors indicate different compartments. Migration events are shown as changes in branch colors.</small>

```js
const figure = plots.getSlatkinTree(resultsJson, selectedTree, treeDim, treeObjects);
```
<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div id="tree_container">${figure.show()}</div>

<hr>

## Citation

```js
if (resultsJson.analysis && resultsJson.analysis["citation"]) {
  display(html`<p><tt>${resultsJson.analysis["citation"]}</tt></p>`);
} else {
  display(html`<p>
    Please cite 
    <a href="http://www.ncbi.nlm.nih.gov/pubmed/2599370" target="_blank">PMID 2599370</a>
    and 
    <a href="http://doi.org/10.1093/bioinformatics/bti079" target="_blank">PMID 15509596</a>
    if you use this result in a publication, presentation, or other scientific work.
  </p>`);
}
```
