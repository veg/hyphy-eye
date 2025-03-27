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
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../absrel/absrel-utils.js";
import * as plots from "../absrel/absrel-plots.js";
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

# aBSREL
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

Based on the likelihood ratio test, there **are ${attrs.positiveResults}** branches with evidence of _episodic diversifying selection_ in this dataset (<tt>p&leq;${floatFormat(attrs.pvalueThreshold || 0.05)}</tt>).
This analysis **${attrs.srvRateClasses > 0 ? "included" : "did not include"}** site-to-site synonymous rate variation. ${_.size (attrs.mhRates['DH']) == 0 ? "" : (_.size (attrs.mhRates['TH'] == 0) ? "Double nucleotide substitutions were included in the model." : "Double and triple nucleotide substitutions were included in the model.")}

```js
const evThreshold = view(Inputs.text({label: html`<b>Evidence ratio threshold</b>`, value: "100", submit: "Update"}))
```

```js
const treeObjects = phylotreeUtils.getTreeObjects(results_json);
const distributionTable = utils.getDistributionTable(results_json, evThreshold, treeObjects);
const tileSpecs = utils.getTileSpecs(results_json, evThreshold, distributionTable);
const profileBranchSites = utils.getProfileBranchSites(results_json, treeObjects);
const siteTableData = utils.siteTableData(results_json, evThreshold, profileBranchSites);
const sitesTable = [{}, siteTableData[0], siteTableData[1]];
// NOTE: doesnt look like this actually uses evThreshold if doCounts is false anyhow..
const bsPositiveSelection = utils.getPosteriorsPerBranchSite(results_json, false, evThreshold, treeObjects);
```

<div>${tt.tileTable(tileSpecs)}</div>

#### Branch-by-branch results

```js
const rateTable = view(Inputs.table (distributionTable, {
  header : {'LogL' : "Log (L)", "AICc" : "AIC-c", "p" : "<abbr title=\"Number of estimated parameters\">Params.</abbr>", "dist" : "ω distribution", "plot" : "ω plot"},
  format : {
    'branch' : (d)=>!_.isUndefined (results_json["branch attributes"][0][d]["Corrected P-value"]) && results_json["branch attributes"][0][d]["Corrected P-value"]<=0.05 ? html`<b>${d}</b>` : d,
    'LogL' : d3.format ("2g"),
    'AICc' : d3.format ("2g"),
    'dist' : (d)=>{
        return html`<tt>
            ${_.map (d[1], (c,i)=> floatFormat(c.value) + " (" + proportionFormat(c.weight) + ") ")}
            <br>Mean = <b>${floatFormat (statsSummary.distMean (d[1]))}</b>, 
            CoV = <b>${floatFormat(Math.sqrt(statsSummary.distVar (d[1]))/statsSummary.distMean (d[1]))}</b></tt>`},
     'plot' : (d)=>d[1].length > 1 ? omegaPlots.renderDiscreteDistribution (d[1],{"height" : 40, "width" : 150, "ticks" : 2, "scale" : "log", "ref" : [1]}) : ''
  },
  layout: "auto",
  sort: "p-value",
  height: 300
}))
```

```js
const distComparisonPlot = rateTable.length == 2 ? omegaPlots.renderTwoDiscreteDistributions (rateTable[0].dist[1],rateTable[1].dist[1],{"label" : {"chart" : rateTable[0].plot[0], "series" : [rateTable[0].dist[3],rateTable[1].dist[3]]}, "width" : 700, "height" : 120, "scale" : "sqrt", "margin" : {top: 5, right: 250, bottom: 30, left: 20}}) : html`<small>Select exactly two distributions to plot a side-by-side comparison</small>`
```
<div>${distComparisonPlot}</div>

```js
const treeId =  view(Inputs.select (plots.treeViewOptions(results_json), {label: html`<b>Tree to view</b>`, placeholder : "Select something to view", "value" : "Alignment-wide tree"}))
```

```js
const branchLength =  view(Inputs.select(_.chain (results_json["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "Baseline MG94xREV", label: html`<b>Branch length </b>`}))
```

```js
const treeLabels = view(Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips","include neighboring codons","show branch labels"],{"value" : ["amino-acids","align tips"], label: html`<b>Tree labels</b>` }
))
```

```js
const colorBranches =  view(Inputs.select(plots.treeColorOptions(results_json, evThreshold),{value: "Support for selection", label: html`<b>Color branches </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", label: "H x W (pixels)", submit: "Resize", value: "1024 x 800"}))
```

```js
// TODO: consider making a phylotreeProps object or similar for treeDim, treeLabels, branchLength and colorBranches
// TODO: pick either snake case or camel case lol
function getFigure2() {
  const siteIndexPartitionCodon = utils.getSiteIndexPartitionCodon(results_json);

    let toDisplay = treeId.split (" ");
    if (toDisplay.length > 1) {
      let treeOptions = {  
          'branchLabels' : treeLabels.indexOf ("show branch labels") >= 0,
          'neighbors' : treeLabels.indexOf ("include neighboring codons") >= 0
      };
      
      if (toDisplay[0] == "Codon") {  
          const codonIndex = (+toDisplay[1]);
          let partitionId = siteIndexPartitionCodon[codonIndex-1][0]-1;
          console.log("partition", partitionId)
          let TT = plots.displayTreeSite (results_json, partitionId, treeObjects[0], codonIndex, treeOptions, evThreshold, treeDim, treeLabels, branchLength, colorBranches, attrs.partitionSizes);
          return TT;
      } 
      let TT = plots.displayTree(results_json, 0, treeObjects[0], treeOptions, evThreshold, treeDim, treeLabels, branchLength, colorBranches);
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
            //ticks: figure2.colorScale.ticks(),
            //tickFormat: figure2.colorScale.tickFormat()
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

**Figure 1**. ${plotType ? plots.getPlotDescription(plotType) : "No plotting options available"}

```js
const plotType =  view(Inputs.select(_.map (_.filter (plots.getPlotOptions(attrs.srvRateClasses, attrs.srvDistribution, bsPositiveSelection, profileBranchSites), (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`, value : 'Evidence ratio alignment profile'}))
```

```js
const plotExtras = ({
  'Evidence ratio alignment profile' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs'], {'label' : 'Circle size'} ),
  'Support for positive selection' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs'], {'label' : 'Circle size'} )
})
const fig1Controls = view(plotExtras[plotType] || Inputs.text({label: "Plot options", value: "None", disabled: true}))
```

```js
function getFig1data() {
   let inSet = new Set (_.map (table1, (d)=>d.Codon));
   return _.filter (siteTableData[0], (x)=>inSet.has (x.Codon));
}
const fig1data = getFig1data();
const selectedBranches = new Set (_.map (rateTable, (d)=>d.branch));
const branchOrder = _.filter (phylotreeUtils.treeNodeOrdering(results_json, treeObjects, 0), (d)=>attrs.profilableBranches.has (d) && selectedBranches.has (d));
```

```js
let plotSpec;
if (plotType) {
  plotSpec = plots.getPlotSpec(plotType, results_json, fig1data, bsPositiveSelection, profileBranchSites, branchOrder, fig1Controls)
}
```
<div>${vl.render({"spec": plotSpec})}</div>

**Table 2**. Detailed site-by-site results from the aBSREL analysis

```js
const table1 = view(Inputs.table (sitesTable[1], {
  rows : 10,
  format: sitesTable[0],
  layout: "auto",
  header: sitesTable[2]
}))
```

**Table 3**. Detailed site-by-site results for a specific branch in the aBSREL analysis

```js
const whichBranch = view(Inputs.select(
  _.map ([...attrs.profilableBranches], (d)=>d),
  {multiple: true,
  label: "Select some branches"
  }
))
```

```js
function getTable3Data() {
  let rc = _.keyBy (_.filter (profileBranchSites, (d)=>whichBranch.indexOf (d.branch)>=0), (d)=>d.Key);
  _.each (bsPositiveSelection, (d)=> {
      if (d.Key in rc) {
          rc[d.Key].EBF = d.ER;
      }
  });
  return _.values (rc);
     
}

const table3Data = getTable3Data();
```

```js
const table3 = view(Inputs.table (table3Data,
  {
      rows : 10,
      layout: "auto",
      columns : ["branch", "site",  "from", "to", "subs", "ER", "EBF"],
      header: {
          "branch" : "Branch",
          "site" : "Site",
          "ER": "Evidence ratio",
          "from" : "Parent",
          "to" : "Codon",
          "subs" : "# substitutions",
          "EBF" : "Empirical BF",
      }
}))
```

<hr>

## Suggested Citation

<br>
<p><tt>${results_json.analysis["citation"]}</tt></p>

<hr>

## hyphy-eye

<br>

View _more_ results at [hyphy-eye](/)!!