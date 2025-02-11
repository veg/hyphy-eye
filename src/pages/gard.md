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
const results_file = view(Inputs.file({label: html`<b>HyPhy results json:</b>`, accept: ".json", required: true}));
```

```js
const results_json = Mutable(results_file.json());
```

```js
window.addEventListener(
  "message",
  (event) => {
    if (event.data.data.MLE) {
      results_json.value = event.data.data; // Update the mutable value
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
const tree_objects = plots.get_tree_objects(results_json);
const tree_lengths = plots.get_tree_lengths(tree_objects);
const gard_result_table = _.chain (results_json['siteBreakPointSupport']).toPairs().map ((d)=>{return {'site' : +d[0], 'support' : d[1]}}).value();
```

<div>${tt.tile_table(tile_specs)}</div>

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
  "data": {"values": tree_lengths},
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
  phylotreeUtils.seqNames(tree_objects[0].tree),
  {
    label: "Select some sequences to highlight",
    placeholder: "Select some sequences",
    multiple: true
  }
))
```

```js
// TODO: this mess seems convoluted
const displayed_trees = plots.get_displayed_trees(tree_objects, variants)
const trees_html = plots.makeTreeDivs(tree_objects, displayed_trees)
const trees_container = document.createElement("div")
trees_container.innerHTML = trees_html;
```
<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div>${trees_container}</div>

<hr>

## Suggested Citation

<br>
<p><tt>${results_json.analysis["citation"]}</tt></p>

<hr>

## hyphy-eye

<br>

View _more_ results at [hyphy-eye](/)!!