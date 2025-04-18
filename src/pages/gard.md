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
const tileSpecs = utils.getTileSpecs(resultsJson);
const treeObjects = plots.getTreeObjects(resultsJson);
const treeLengths = plots.getTreeLengths(treeObjects);
const gardResultTable = _.chain (resultsJson['siteBreakPointSupport']).toPairs().map ((d)=>{return {'site' : +d[0], 'support' : d[1]}}).value();
```

<div>${tt.tileTable(tileSpecs)}</div>

**Figure 1**. Left: the best placement of breakpoints inferred by the algorithm for each number of breakpoints considered. Right: the improvement in the c-AIC score between successive breakpoint numbers (log scale).

```js
// TODO: move these plots into gard-plots.js
const fig1={
  hconcat: [
    {
      width: 650,
      height: attrs.stages*12,
      "data": {"values": attrs.breakpointsProfile},
      "mark": {type: "point", tooltip : true, filled : true},
      "encoding": {
        "x": {"field": "bp", "type": "quantitative", "axis" : {"grid" : false, "title" : "Coordinate"}},
        "y": {"field": "model", "type": "ordinal", "axis" : {title: "# breakpoints"}},
        "size" : {"condition": {"test": "datum['span'] >= " + attrs.stages/2, "value": "64"}, "value": "16"},
        "color" : {"condition": {"test": "datum['span'] >= " + attrs.stages/2, "value": "firebrick"}, "value": "gray"}
      }
    },
    {
      width: 120,
      height: attrs.stages*12,
      "data": {"values": attrs.caicImprovements},
      "mark": {type: "line", tooltip : true, filled : false, points: true},
      "encoding": {
        "x": {"field": "daic", "type": "quantitative", "axis" : {"grid" : false, "title" : "Delta c-AIC"}, scale : {"type" : "log"}},
        "y": {"field": "bp", "type": "ordinal", "axis" : null},
      }
    }
  ]}
```
<div>${vl.render({"spec": fig1})}</div>

**Figure 2**. Model-averaged support for breakpoint placement

```js
const fig2={
  width: 800,
  height: 200,
  "data": {"values": attrs.siteSupport},
  "mark": {type: "rule", tooltip : true},
  "encoding": {
    "x": {"field": "bp", "type": "quantitative",  "axis" : {"grid" : false, title : "coordinate"}},
    "y": {"field": "support", "type": "quantitative",  "axis" : {"grid" : false, title : "Model averaged support"}},
  }
}
```
<div>${vl.render({"spec": fig2})}</div>

**Figure 3**. Total tree length by partition

```js
const fig3= {
  width: 800,
  height: 200,
  "data": {"values": treeLengths},
  "mark": {type: "line", tooltip : true,  point : false},
  "encoding": {
    "x": {"field": "x", "type": "quantitative",  "axis" : {"grid" : false, title : "Coordinate"}},
    "y": {"field": "L", "type": "quantitative",  "axis" : {"grid" : false, title : "Total tree length"}, "scale" : {"type" :"sqrt"}},
  }
}
```
<div>${vl.render({"spec": fig3})}</div>

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
const displayedTrees = plots.getDisplayedTrees(treeObjects, variants)
const treesHtml = plots.makeTreeDivs(treeObjects, displayedTrees)
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