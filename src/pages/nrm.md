```js
import * as d3 from "d3";
import * as Plot from "npm:@observablehq/plot";
import * as _ from "lodash-es";
import * as parse_svg from "parse-svg-path";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../nrm/nrm-utils.js";
import * as plots from "../nrm/nrm-plots.js";
import { NrmTreePlotGenerator } from "../nrm/nrm-plots.js"
import * as tt from "../components/tile-table/tile-table.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import {FileAttachment} from "observablehq:stdlib";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
const floatFormat = d3.format(".4g")
const percentageFormat = d3.format(".2p")
const proportionFormat = d3.format(".5p")
```

# NRM (non-reversible model) 

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
const attrs = utils.getNrmAttributes(resultsJson);
const tileSpecs = utils.getNrmTileSpecs(resultsJson);
```

<div>${tt.tileTable(tileSpecs)}</div>

The best-fitting model (based on AIC-c) is **${attrs.bestModel}**. 

Based on the comparison of the general reversible (GTR) and non-reversible models (NREV12), there ${utils.getNrmReportResult(utils.getNrmTestResult(resultsJson, "GTR","NREV12"))} for the <b>non-reversibility of the evolutionary process</b>.

Based on the comparison of the non-reversible model which estimate root character frequencies (NREV12+F) and the model which assumes that these equal empirical frequencies (NREV12), there ${utils.getNrmReportResult(utils.getNrmTestResult(resultsJson, "NREV12","NREV12+F"))} for the <b>difference in root character frequencies from the distribution implied by the sequences</b>.

```js
const table1 = view(Inputs.table (attrs.modelTableData, {
  sort: "AIC-c",
  rows : 4,
}))
```

**Table 1**. Summary of model fit, overall tree lengths (subs/site), and corresponding equilibrium frequencies (EF) for each model. Note that the GTR model has the same EF as the base composition of the underlying dataset (empirical frequencies).

```js
const modelForQ = view(Inputs.select(_.map (attrs.modelSummary, (d)=>d[0]), {value: "NREV12", label: "Substitution model"}))
```

```js
// TODO: we do this a lot.. a helper function to produce standalone legends?
const qMaxRate = utils.getNrmQMaxRate(resultsJson, modelForQ)
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

const qMatrixTableData = utils.getNrmQMatrixTable(resultsJson, modelForQ)
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
const fig1x = view(Inputs.select(_.map (attrs.modelSummary, (d)=>d[0]), {value: attrs.bestModel, label: "x"}))
```

```js
const fig1y = view(Inputs.select(_.filter (_.map (attrs.modelSummary, (d)=>d[0]), (d)=>d!=fig1x), {value: "GTR", label: "y"}))
```

**Figure 1**. Compare branch length estimates by model (note that because GTR is not able to properly estimate the relative branch lengths of root descendants, the plot excludes those two branches)

```js
const fig1 = plots.NrmBranchLengthComparisonPlotGenerator(resultsJson, { xField: fig1x, yField: fig1y });
```

```js
<div>${vl.render({ spec: fig1 })}</div>
```

**Figure 2.** Phylogenetic tree renderings show branch lengths under the selected model, and also how the selected measure of differences in base frequencies evolves over the tree. Node bubbles show the difference between the model induced base frequencies and the frequencies observed in the corresponding sequence.

```js
// Configure tree view options
const treeDim = view(Inputs.text({placeholder: "1024 x 800", description: "Tree dimension (height x width)", submit: "Resize"}));
```
```js
const treeLabels = view(Inputs.checkbox(
  ["show internal","sequence names","align tips","show frequencies"],
  {value: ["sequence names","show internal"], label: html`<b>Tree labels</b>`}
));
```
```js
const modelForTree = view(Inputs.select(_.map(attrs.modelSummary, d=>d[0]), {value: attrs.bestModel, label: "Substitution model"}));
```
```js
const availableDistances = ["Jensen Shannon", "|ΔA|", "|ΔC|", "|ΔG|", "|ΔT|"];
const distanceFunction = view(Inputs.select(availableDistances, {value: "Jensen Shannon", label: "Distance"}));
```
```js
// Generate tree plot
const fig2 = NrmTreePlotGenerator(resultsJson, { treeDim, treeLabels, availableDistances, distanceFunction, modelForTree });
```

<div>${fig2}</div>