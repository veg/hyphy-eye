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
import * as generalUtils from "../utils/general-utils.js";
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
const attrs = utils.getMemeAttributes(resultsJson);
```

<span style = 'font-size: 110%; color;'>Based on the likelihood ratio test, _episodic diversifying selection_ has acted on **${countSites}** sites in this dataset (<tt>p≤${pvalueThreshold}</tt>).</span>
${attrs.hasResamples > 0 ? "This analysis used parametric bootstrap with " + attrs.hasResamples + " replicates to test for significance." : ""} ${+resultsJson.analysis.version < 3.0 ? "<small><b>Some of the visualizations are not available for MEME analyses before v3.0</b>" : ""}

```js
const pvalueThreshold = view(Inputs.text({label: html`<b>p-value threshold</b>`, value: "0.1", submit: "Update"}))
```

```js
const treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
const siteTableData = utils.getMemeSiteTableData(resultsJson, tableOptions, pvalueThreshold, attrs.siteIndexPartitionCodon, treeObjects);
const tileSpecs = utils.getMemeTileSpecs(resultsJson, pvalueThreshold);
const bsPositiveSelection = utils.getMemePosteriorsPerBranchSite(resultsJson);
const countSites = utils.getMemeCountSitesByPvalue(resultsJson, pvalueThreshold);
const selectedBranchesPerSelectedSite = utils.getMemeSelectedBranchesPerSelectedSite(resultsJson, pvalueThreshold);
const testOmega = generalUtils.getRateDistribution(resultsJson, null, ["fits","Unconstrained model","Rate Distributions","Test"])
const treeViewOptions = phylotreeUtils.getTreeViewOptions(resultsJson, {
    onlyWithSubstitutions: true,
    includeMapping: true
  })
// TODO: clean this up
const sitesTable = [{
    'class' : (d)=>html`<span style = "color:${plots.MEME_TABLE_COLORS[d]}">${d}</span>`, 
    'Substitutions' : (d)=>d.length == 0 ? "-" : _.map (d, (c)=>c[1] + " " + c[0]).join('   ,   '),
    'dN/dS' : (d)=>omegaPlots.renderNDiscreteDistributions ([d],{"height" : 20, "width" : 200, "scale" : "sqrt"})
    }, 
    _.filter (siteTableData[0], (x)=>tableFilter.indexOf(x.class)>=0), siteTableData[1]
  ];
```

<div>${tt.tileTable(tileSpecs)}</div>

#### Alignment-wide results

```js
const plotType = view(Inputs.select(_.map (_.filter (plots.getPlotOptions(attrs.hasSiteLRT, attrs.hasResamples, bsPositiveSelection), (d)=>d[1](resultsJson)), d=>d[0]),{label: html`<b>Plot type</b>`}))
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
  plot_spec = plots.getPlotSpec(resultsJson, plotType, bsPositiveSelection, fig1data, siteTableData, attrs.hasSiteLRT, attrs.hasResamples, pvalueThreshold, treeObjects)
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
const selectedTree =  view(Inputs.select(treeViewOptions[0], {size : 10, label: html`<b>Tree to view</b>`, placeholder : "Select partition / codon tree to view"}))
```

```js
const branchLength =  view(Inputs.select(_.chain (resultsJson["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "unconstrained", label: html`<b>Branch length </b>`}))
```

```js
const treeLabels = view(Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips"],{"value" : ["amino-acids"], label: html`<b>Tree labels</b>` }
))
```

```js
const colorBranches =  view(Inputs.select(plots.getTreeColorOptions(resultsJson),{value: "Support for selection", label: html`<b>Color branches </b>`}))
```

```js
const shadeBranches =  view(Inputs.select(plots.getTreeColorOptions(resultsJson).concat ("None"),{value: "None", label: html`<b>Opaqueness of branches </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}))
```

```js
const treeId = phylotreeUtils.getTreeId(selectedTree);
function getFigure2() {
    let toDisplay = selectedTree.split (" ");
    if (toDisplay.length > 1) {
      if (toDisplay[0] == "Codon") {  
          const codonIndex = treeId;
          let partitionId = attrs.siteIndexPartitionCodon [codonIndex][0]-1;
          let TT = plots.displayTreeSite(resultsJson, partitionId, codonIndex, treeDim, treeLabels, branchLength, colorBranches, shadeBranches, treeObjects, treeViewOptions);
          return TT;
      } 
      let TT = plots.displayTree(resultsJson, treeId, treeDim, treeLabels, branchLength, colorBranches, treeObjects);
      return TT;
    }

    return null;
}
const figure2 = getFigure2();
```

```js
const schemeElement = document.createElement("div")
if (figure2 && figure2.color_scale) {
  const label = document.createElement("text")
  label.textContent = figure2.color_scale_title
  schemeElement.append(label)
  const legend = Plot.legend({
        color: {
            type: "linear",
            interpolate: figure2.color_scale.interpolate,
            domain: figure2.color_scale.domain(),
            range: figure2.color_scale.range(),
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
<p><tt>${resultsJson.analysis["citation"]}</tt></p>

<hr>

## hyphy-eye

<br>

View _more_ results at [hyphy-eye](/)!!