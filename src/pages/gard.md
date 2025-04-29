---
sidebar: false
header: false
footer: false
pager: false
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

<hr>

## hyphy-eye

<br>

View _more_ results at [hyphy-eye](/)!!