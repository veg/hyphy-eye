```js
import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as _ from "lodash-es";
import * as parse_svg from "parse-svg-path";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "./nrm/nrm-utils.js";
import * as plots from "./nrm/nrm-plots.js";
import * as tt from "./components/tile-table/tile-table.js";
import * as phylotreeUtils from "./utils/phylotree-utils.js";
import {FileAttachment} from "observablehq:stdlib";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
const floatFormat = d3.format(".4g")
const percentageFormat = d3.format(".2p")
const proportionFormat = d3.format(".5p")
```

# NRM (non-reversible model) result summary

```js
const results_json = await FileAttachment("./data/nrm_test_data.json").json();
const attrs = utils.get_attributes(results_json);
const tile_specs = utils.get_tile_specs(results_json);
```

<div>${tt.tile_table(tile_specs)}</div>

The best-fitting model (based on AIC-c) is **${attrs.best_model}**. 

Based on the comparison of the general reversible (GTR) and non-reversible models (NREV12), there ${utils.report_result(utils.getTestResult(results_json, "GTR","NREV12"))} for the <b>non-reversibility of the evolutionary process</b>.

Based on the comparison of the non-reversible model which estimate root character frequencies (NREV12+F) and the model which assumes that these equal empirical frequencies (NREV12), there ${utils.report_result(utils.getTestResult(results_json, "NREV12","NREV12+F"))} for the <b>difference in root character frequencies from the distribution implied by the sequences</b>.

```js
const table1 = view(Inputs.table (attrs.model_table_data, {
  sort: "AIC-c",
  rows : 4,
}))
```

**Table 1**. Summary of model fit, overall tree lengths (subs/site), and corresponding equilibrium frequencies (EF) for each model. Note that the GTR model has the same EF as the base composition of the underlying dataset (empirical frequencies).

```js
const modelForQ = view(Inputs.select(_.map (attrs.model_summary, (d)=>d[0]), {value: "NREV12", label: "Substitution model"}))
```

```js
// TODO: we do this a lot.. a helper function to produce standalone legends?
const qMaxRate = utils.get_q_max_rate(results_json, modelForQ)
const schemeElement = document.createElement("div")
const label = document.createElement("text")
label.textContent = "Relative rate"
schemeElement.append(label)
const legend = Plot.legend({
  color: {
    type: "linear",
    interpolate: d3.interpolateWarm,
    domain: [0, qMaxRate],
    ticks: 5
  },
  width: 200
})
schemeElement.appendChild(legend)
schemeElement.appendChild(document.createElement("br"))
```
<div>${schemeElement}</div>


```js
const qMatrixColorScale = d3.scaleSequential([0,qMaxRate],d3.interpolateWarm)
function sparkbar(max) {
  return x => htl.html`<div style="
    background: ${qMatrixColorScale(x)};
    width: ${100 * x / max}%;
    float: right;
    padding-right: 3px;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    justify-content: end;">${x.toLocaleString("en")}`
}

const qMatrixTableData = utils.get_q_matrix_table(results_json, modelForQ)
```

```js
const table2 = view(Inputs.table (qMatrixTableData, {
  rows : 4,
  format: {
      'A' : sparkbar(qMaxRate),
      'C' : sparkbar(qMaxRate),
      'G' : sparkbar(qMaxRate),
      'T' : sparkbar(qMaxRate)
  }
}))
```

**Table 2**. Rate matrix (**Q**) for the substitution model <tt>${modelForQ}</tt>. The A&lrarr;G rate is used as the reference (=1.0) for identifiability.

```js
const fig1x = view(Inputs.select(_.map (attrs.model_summary, (d)=>d[0]), {value: attrs.best_model, label: "x"}))
```

```js
const fig1y = view(Inputs.select(_.filter (_.map (attrs.model_summary, (d)=>d[0]), (d)=>d!=fig1x), {value: "GTR", label: "y"}))
```

**Figure 1**. Compare branch length estimates by model (note that because GTR is not able to properly estimate the relative branch lengths of root descendants, the plot excludes those two branches)

```js
const fig1 = {
  "data": {"values": branch_lengths},
  "width" : 400,
  "height" : 400,
  "layer" : [{
      "mark": {type: "point", "opacity" : 0.5, "size" : 36, tooltip :  {"content": "data"}, filled : true, clip : true},
      "encoding": {
            "x": {"field": fig1x, "type": "quantitative", 
            "title" : fig1x,
            "axis" : {"grid" : false, titleFontSize: 18},
           
            },
            "y": {"field": fig1y ,
                  "title" :  fig1y,
                  "axis" : {"grid" : false, titleFontSize: 18},
                  "type": "quantitative",
           },
            "stroke" : {"value": "black"},
            "color" : {"value" : "grey"}
          }  
      },
      {
      "mark": {
        "type": "line",
        "color": "firebrick",
        "clip": true,
      },
      "transform": [
        {
          "regression": fig1y,
          "on": fig1x,
           "method" : "linear"
        }
      ],
      "encoding": {
        "x": {
          "field": fig1x,
          "type": "quantitative"
        },
        "y": {
          "field": fig1y,
          "type": "quantitative"
        }
      }
    },
    {
      "transform": [
        {
          "regression": fig1y,
          "on": fig1x,
           "method" : "linear",
          "params": true
        },
      {"calculate": "'y=' + format(datum.coef[0], '.4f') + '+' + format(datum.coef[1], '.4f') + 'x; R²: '+format(datum.rSquared, '.2f')", "as": "R2"}      ],
      "mark": {
        "type": "text",
        "color": "firebrick",
        "x": "width",
        "size" : 16,
        "align": "right",
        "y": -5
      },
      "encoding": {
        "text": {"type": "nominal", "field": "R2"}
      }
    }
    ]
}
```
<div>${vl.render({"spec": fig1})}</div>

**Figure 2.** Phylogenetic tree renderings show branch lengths under the selected model, and also how the selected measure of differences in base frequencies evolves over the tree. Node bubbles show the difference between the model induced base frequencies and the frequencies observed in the corresponding sequence.

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}))
```

```js
const treeLabels = view(Inputs.checkbox(
   ["show internal","sequence names","align tips","show frequencies"],
   {"value" : ["sequence names","show internal"], label: html`<b>Tree labels</b>` }
))
```

```js
const modelForTree = view(Inputs.select(_.map (attrs.model_summary, (d)=>d[0]), {value: attrs.best_model, label: "Substitution model"}))
```

```js
const availableDistances = ["Jensen Shannon", "|ΔA|", "|ΔC|", "|ΔG|", "|ΔT|"]
const distanceFunction = view(Inputs.select(availableDistances, {value: "Jensen Shannon", label: "Distance"}))
```

```js
const tree_objects = phylotreeUtils.get_tree_objects(results_json, modelForTree);
const branch_lengths = plots.get_branch_lengths(results_json, attrs.model_summary, tree_objects);
const figure2 = plots.display_tree(results_json, 0, treeDim, treeLabels, tree_objects, availableDistances, distanceFunction, modelForTree)
// TODO: we do this a lot.. a helper function to produce standalone legends?
const schemeElement2 = document.createElement("div")
const label = document.createElement("text")
label.textContent = "Distance"
schemeElement2.append(label)
const legend = Plot.legend({
  color: {
    type: "linear",
    interpolate: figure2.color_scale.interpolate,
    domain: figure2.color_scale.domain(),
    range: figure2.color_scale.range(),
    ticks: 5,
    tickFormat: "g"
  },
  width: 200
})
schemeElement2.appendChild(legend)
schemeElement2.appendChild(document.createElement("br"))
```
<div>${schemeElement2}</div>
<div id="tree_container">${figure2.show()}</div>