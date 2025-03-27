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
import * as utils from "../meme/meme-utils.js";
import * as plots from "../meme/meme-plots.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as statsSummary from "../stats/summaries.js";
import * as omegaPlots from "../components/omega-plots.js";
import * as tt from "../components/tile-table/tile-table.js";
import {FileAttachment} from "observablehq:stdlib";
import {html} from "htl";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
const floatFormat = d3.format (".4g")
const percentageFormat = d3.format (".2p")
const proportionFormat = d3.format (".5p")
```

# MEME
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
const attrs = utils.getAttributes(results_json);
```

<span style = 'font-size: 110%; color;'>Based on the likelihood ratio test, _episodic diversifying selection_ has acted on **${countSites}** sites in this dataset (<tt>p≤${pvalueThreshold}</tt>).</span>
${attrs.hasResamples > 0 ? "This analysis used parametric bootstrap with " + attrs.hasResamples + " replicates to test for significance." : ""} ${+results_json.analysis.version < 3.0 ? "<small><b>Some of the visualizations are not available for MEME analyses before v3.0</b>" : ""}

```js
const pvalueThreshold = view(Inputs.text({label: html`<b>p-value threshold</b>`, value: "0.1", submit: "Update"}))
```

```js
const treeObjects = phylotreeUtils.getTreeObjects(results_json);
const siteTableData = utils.siteTableData(results_json, tableOptions, pvalueThreshold, attrs.siteIndexPartitionCodon, treeObjects);
const tileSpecs = utils.getTileSpecs(results_json, pvalueThreshold);
const bsPositiveSelection = utils.getPosteriorsPerBranchSite(results_json);
const countSites = utils.getCountSitesByPvalue(results_json, pvalueThreshold);
const selectedBranchesPerSelectedSite = utils.getSelectedBranchesPerSelectedSite(results_json, pvalueThreshold);
const testOmega = utils.getRateDistribution(results_json, ["fits","Unconstrained model","Rate Distributions","Test"])
const treeViewOptions = plots.getTreeViewOptions(results_json, treeObjects)
// TODO: clean this up
const sitesTable = [{
    'class' : (d)=>html`<span style = "color:${plots.TABLE_COLORS[d]}">${d}</span>`, 
    'Substitutions' : (d)=>d.length == 0 ? "-" : _.map (d, (c)=>c[1] + " " + c[0]).join('   ,   '),
    'dN/dS' : (d)=>omegaPlots.renderNDiscreteDistributions ([d],{"height" : 20, "width" : 200, "scale" : "sqrt"})
    }, 
    _.filter (siteTableData[0], (x)=>tableFilter.indexOf(x.class)>=0), siteTableData[1]
  ];
```

<div>${tt.tileTable(tileSpecs)}</div>

#### Alignment-wide results

```js
const plotType = view(Inputs.select(_.map (_.filter (plots.getPlotOptions(attrs.hasSiteLRT, attrs.hasResamples, bsPositiveSelection), (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`}))
```

**Figure 1**. ${plotType ? plots.getPlotDescription(plotType, attrs.hasResamples) : "No plotting options available"}

```js
function getFig1data() {
   let in_set = new Set (_.map (table1, (d)=>d.Codon));
   return _.filter (siteTableData[0], (x)=>in_set.has (x.Codon));
}
const fig1data = getFig1data();
```

```js
let plot_spec;
if (plotType) {
  plot_spec = plots.getPlotSpec(results_json, plotType, bsPositiveSelection, fig1data, siteTableData, attrs.hasSiteLRT, attrs.hasResamples, pvalueThreshold, treeObjects)
}
```
<div>${vl.render({"spec": plot_spec})}</div>

```js
const tableFilter = view(Inputs.checkbox(["Diversifying", "Neutral","Invariable"], {value: ["Diversifying", "Neutral", "Invariable"], label: html`<b>Show</b>`}))
```

```js
const tableOptions = view(Inputs.checkbox(["Distribution plot","Show q-values","Show substitutions (tested branches)"], {value: ["Show q-values"], label: html`<b>Options</b>`}))
```

**Table 1**. Detailed site-by-site results from the MEME analysis

```js
const table1 = view(Inputs.table (sitesTable[1], {
  rows : 20,
  format: sitesTable[0],
  layout: "auto",
  header: sitesTable[2]
}))
```

```js
const treeId =  view(Inputs.select(treeViewOptions[0], {size : 10, label: html`<b>Tree to view</b>`, placeholder : "Select partition / codon tree to view"}))
```

```js
const branchLength =  view(Inputs.select(_.chain (results_json["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "unconstrained", label: html`<b>Branch length </b>`}))
```

```js
const treeLabels = view(Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips"],{"value" : ["amino-acids"], label: html`<b>Tree labels</b>` }
))
```

```js
const colorBranches =  view(Inputs.select(plots.getTreeColorOptions(results_json),{value: "Support for selection", label: html`<b>Color branches </b>`}))
```

```js
const shadeBranches =  view(Inputs.select(plots.getTreeColorOptions(results_json).concat ("None"),{value: "None", label: html`<b>Opaqueness of branches </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}))
```

```js
function getFigure2() {
    let toDisplay = treeId.split (" ");
    if (toDisplay.length > 1) {
      if (toDisplay[0] == "Codon") {  
          const codonIndex = (+toDisplay[1]);
          let partitionId = attrs.siteIndexPartitionCodon [codonIndex][0]-1;
          let TT = plots.displayTreeSite(results_json, partitionId, codonIndex, treeDim, treeLabels, branchLength, colorBranches, shadeBranches, treeObjects, treeViewOptions);
          return TT;
      } 
      let TT = plots.displayTree(results_json, (-1) + (+toDisplay[1]), treeDim, treeLabels, branchLength, colorBranches, treeObjects);
      return TT;
    }

    return null;
}
const figure2 = getFigure2();
```

```js
const schemeElement = document.createElement("div")
if (figure2 && figure2.colorScale) {
  const label = document.createElement("text")
  label.textContent = figure2.colorScaleTitle
  schemeElement.append(label)
  const legend = Plot.legend({
        color: {
            type: "linear",
            interpolate: figure2.colorScale.interpolate,
            domain: figure2.colorScale.domain(),
            range: figure2.colorScale.range(),
            ticks: 5
        },
        width: 200
    })
  schemeElement.appendChild(legend)
  schemeElement.appendChild(document.createElement("br"))
}
```
<div>${schemeElement}</div>
<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div id="tree_container">${figure2.show()}</div>

<hr>

## Suggested Citation

<br>
<p><tt>${results_json.analysis["citation"]}</tt></p>

<hr>

## hyphy-eye

<br>

View _more_ results at [hyphy-eye](/)!!