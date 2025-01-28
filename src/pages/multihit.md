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

# MULTI-HIT result summary

```js
const results_json = await FileAttachment("../data/multihit_test_data.json").json();
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