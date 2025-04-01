---
sidebar: false
header: false
footer: false
pager: false
---

```js
import * as d3 from "d3";
import * as _ from "lodash-es";
import * as phylotree from "phylotree";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../busted/busted-utils.js";
import * as plots from "../busted/busted-plots.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as omegaPlots from "../components/omega-plots.js";
import * as tt from "../components/tile-table/tile-table.js";
import {FileAttachment} from "observablehq:stdlib";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
const floatFormat = d3.format (".4g")
const percentageFormat = d3.format (".2p")
const proportionFormat = d3.format (".5p")
```

# BUSTED
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
const attrs = utils.getAttributes(resultsJson);
```

<span style = 'font-size: 110%;'>Based on the likelihood ratio test, there **is ${resultsJson["test results"]["p-value"]>0.05 ? "no" : ""}** evidence of _episodic diversifying selection_ in this dataset (<tt>p=${floatFormat(resultsJson["test results"]["p-value"])}</tt>).
</span>This analysis **${attrs.srvRateClasses > 0 ? "included" : "did not include"}** site-to-site synonymous rate variation${attrs.srvHMM?" with linear autocorrelation (HMM)" : ""}. ${_.isUndefined (attrs.mhRates['DH']) ? "" : (_.isUndefined (attrs.mhRates['TH']) ? "Double nucleotide substitutions were included in the model." : "Double and triple nucleotide substitutions were included in the model.")}
${resultsJson.analysis.version < 4.0 ? "<small><b>Some of the visualizations are not available for BUSTED analyses before v4.0</b>" : ""} 

```js
//${contributing_sites && contributing_sites.length == 1? "\n><small style = 'color:firebrick'><i class='icon-fire icons'></i>Most of the statistical signal for episodic diversifying selection in this alignment is derived from a single codon site (**codon " + (1+contributing_sites[0])  + "**). This could be a sign of possible data quality issues, or outsized influence of a few substitutions, especially if they involve replacing multiple nucleotides along a short branch. You may want to examine the alignment at this site using BUSTED visualization tools, performing model-averaged inference, or rerunning the alignment with data at that site masked to confirm robustness of the result</small>" : ""} 
```

${resultsJson.analysis.version >= 4.5 && attrs.hasErrorSink ? "<br><small style = 'color:darkgreen'>This analysis was run with the error sink category enabled</small>" : ""}
${attrs.hasErrorSinkNT? "<details><summary style='background-color: 0xCCC; color: firebrick; font-size: 0.75em;'>Possible alignment errors detected</summary><span style='background-color: 0xCCC; color: darkorange; font-size: 0.75em;'>A " +proportionFormat (utils.getErrorSinkRate ("Test")["proportion"]) + " fraction of the alignment (test branches" + (attrs.hasBackground ? ", and " + proportionFormat (utils.getErrorSinkRate ("Background")["proportion"]) + " of background branches)"  : ")" ) + " was placed in the <b>error sink</b> rate class, meaning that misalignment or other data quality issues may be present. You may use exploratory plots and other components on this page to further explore this.</span></details>" : ""}

```js
const evThreshold = view(Inputs.text({label: html`<b>Evidence ratio threshold</b>`, value: "10", submit: "Update"}))
```

```js
const siteTableData = utils.siteTableData(resultsJson, evThreshold);
const sitesTable = [{}, siteTableData[0], siteTableData[1]];
const distributionTable = utils.getDistributionTable(resultsJson, evThreshold);
const contributingSites = utils.getContributingSites(siteTableData);
const testOmega = utils.testOmega(resultsJson, attrs.hasErrorSink);
const treeObjects = phylotreeUtils.getTreeObjects(resultsJson);
const bsPositiveSelection = utils.getBSPositiveSelection(resultsJson, treeObjects, testOmega, attrs.hasErrorSink);
console.log("bsPos", bsPositiveSelection)
console.log("err_sink", attrs.hasErrorSink)
console.log("omega", testOmega)
const bsErrorSink = utils.getBSErrorSink(resultsJson, treeObjects, attrs.hasErrorSinkNT);
const tileSpecs = utils.getTileSpecs(resultsJson, evThreshold, bsPositiveSelection, contributingSites);

```

<div>${tt.tileTable(tileSpecs)}</div>

#### Alignment-wide results

```js
const rateTable = view(Inputs.table (distributionTable, {
  header : {'LogL' : "Log (L)", "AICc" : "AIC-c", "p" : html`<abbr title="Number of estimated parameters">Params.</abbr`, "dist" : "Rate distribution", "plot" : "Rate plot"},
  format : {
    'LogL' : d3.format ("2g"),
    'AICc' : d3.format ("2g"),
    'dist' : (d)=>{
        return html`<b>${d[0] + " " + d[2]}</b><br><tt>
            ${_.map (d[1], (c,i)=> floatFormat(c.value) + " (" + proportionFormat (c.weight) + ") ")}
            <br>Mean = <b>${floatFormat (utils.distMean (d[1]))}</b>, CoV = <b>${floatFormat (Math.sqrt (utils.distVar (d[1]))/utils.distMean (d[1]))}</b></tt>`},
     'plot' : (d)=>omegaPlots.renderDiscreteDistribution (d[1],{"height" : 50, "width" : 150, "scale" : "sqrt", "ref" : d[0].length == 0 ? [null] : [1]})
  },
  layout: "auto",
  height: 150 + (attrs.srvRateClasses ? 120 : 0) + (attrs.hasBackground ? 120 :0)
}))
```

```js
const distComparisonPlot = rateTable.length == 2 ? omegaPlots.renderTwoDiscreteDistributions (rateTable[0].dist[1],rateTable[1].dist[1],{"label" : {"chart" : rateTable[0].plot[0], "series" : [rateTable[0].dist[3],rateTable[1].dist[3]]}, "width" : 700, "height" : 120, "scale" : "sqrt", "margin" : {top: 5, right: 250, bottom: 30, left: 20}}) : "<small>Select exactly two distributions to plot a side-by-side comparison</small>"
```

```js
const plotType =  view(Inputs.select(_.map (_.filter (plots.getPlotOptions(resultsJson, bsPositiveSelection), (d)=>d[1](resultsJson)), d=>d[0]),{label: html`<b>Plot type</b>`}))
```

```js
const plotExtras = ({
    'Support for positive selection' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs', 'None'], {'label' : 'Circle size'} ),
    'Error-sink support' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs', 'None'], {'label' : 'Circle size'} )
})
```

```js
const fig1Controls = view(plotExtras[plotType] || Inputs.text({label: "Plot options", value: "None", disabled: true}))
```

**Figure 1**. ${plotType ? plots.getPlotDescription(plotType, attrs.srvHMM) : "No plotting options available"}`

```js
function getFig1data() {
   let inSet = new Set (_.map (table1, (d)=>d.Codon));
   return _.filter (siteTableData[0], (x)=>inSet.has (x.Codon));
}
const fig1data = getFig1data()
```

```js
let plotSpec;
if (plotType) {
  plotSpec = plots.getPlotSpec(plotType, resultsJson, fig1data, bsPositiveSelection, bsErrorSink, evThreshold, attrs.srvHMM, treeObjects, attrs.testedBranchCount, fig1Controls)
}
```
<div>${vl.render({"spec": plotSpec})}</div>

**Table 1**. Detailed site-by-site results from the BUSTED analysis

```js
const table1 = view(Inputs.table (sitesTable[1], {
  rows : 10,
  format: sitesTable[0],
  layout: "auto",
  header: sitesTable[2]
}))
```

**Figure 2**.

```js
const selectedTree =  view(Inputs.select (phylotreeUtils.getTreeViewOptions(resultsJson, treeObjects), {size : 10, label: html`<b>Tree to view</b>`, placeholder : "Select partition / codon tree to view"}))
```

```js
const branchLength =  view(Inputs.select(_.chain (resultsJson["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "unconstrained", label: html`<b>Branch length </b>`}))
```

```js
const treeLabels = view(Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips","include neighboring codons","show branch labels"],{"value" : ["amino-acids","align tips"], label: html`<b>Tree labels</b>` }
))
```

```js
const colorBranches =  view(Inputs.select(plots.treeColorOptions(resultsJson, treeObjects),{value: "Support for selection", label: html`<b>Color branches </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}))
```

```js
function getFigure2() {
    
    let toDisplay = selectedTree.split (" ");
    let index = phylotreeUtils.getTreeId(selectedTree);
    if (toDisplay.length > 1) {
      let treeOptions = {  
          'branch-labels' : treeLabels.indexOf ("show branch labels") >= 0,
          'neighbors' : treeLabels.indexOf ("include neighboring codons") >= 0
      };
      
      if (toDisplay[0] == "Codon") {  
          let partitionId = utils.getSiteIndexPartitionCodon(resultsJson)[index][0]-1;
          let codonIndex = index - d3.sum (attrs.partitionSizes.slice (0,partitionId));
          let TT = plots.displayTreeSite(resultsJson, partitionId, treeObjects[partitionId], codonIndex, treeOptions, treeDim, treeLabels, branchLength, colorBranches, attrs.partitionSizes, testOmega, attrs.hasErrorSink);
          return TT;
      } 
      let TT = plots.displayTree(resultsJson, evThreshold, index, treeObjects[index], treeOptions, treeDim, treeLabels, branchLength, colorBranches, testOmega, attrs.hasErrorSink);
      return TT;
    }
    return null;
}
const figure2 = getFigure2();
```

```js
console.log(figure2)
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
<div id="legend">${schemeElement}</div>
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