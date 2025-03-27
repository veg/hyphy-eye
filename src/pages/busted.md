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

<span style = 'font-size: 110%;'>Based on the likelihood ratio test, there **is ${results_json["test results"]["p-value"]>0.05 ? "no" : ""}** evidence of _episodic diversifying selection_ in this dataset (<tt>p=${floatFormat(results_json["test results"]["p-value"])}</tt>).
</span>This analysis **${attrs.srvRateClasses > 0 ? "included" : "did not include"}** site-to-site synonymous rate variation${attrs.srvHMM?" with linear autocorrelation (HMM)" : ""}. ${_.isUndefined (attrs.mhRates['DH']) ? "" : (_.isUndefined (attrs.mhRates['TH']) ? "Double nucleotide substitutions were included in the model." : "Double and triple nucleotide substitutions were included in the model.")}
${results_json.analysis.version < 4.0 ? "<small><b>Some of the visualizations are not available for BUSTED analyses before v4.0</b>" : ""} 

```js
//${contributing_sites && contributing_sites.length == 1? "\n><small style = 'color:firebrick'><i class='icon-fire icons'></i>Most of the statistical signal for episodic diversifying selection in this alignment is derived from a single codon site (**codon " + (1+contributing_sites[0])  + "**). This could be a sign of possible data quality issues, or outsized influence of a few substitutions, especially if they involve replacing multiple nucleotides along a short branch. You may want to examine the alignment at this site using BUSTED visualization tools, performing model-averaged inference, or rerunning the alignment with data at that site masked to confirm robustness of the result</small>" : ""} 
```

${results_json.analysis.version >= 4.5 && attrs.hasErrorSink ? "<br><small style = 'color:darkgreen'>This analysis was run with the error sink category enabled</small>" : ""}
${attrs.hasErrorSinkNT? "<details><summary style='background-color: 0xCCC; color: firebrick; font-size: 0.75em;'>Possible alignment errors detected</summary><span style='background-color: 0xCCC; color: darkorange; font-size: 0.75em;'>A " +proportionFormat (utils.getErrorSinkRate ("Test")["proportion"]) + " fraction of the alignment (test branches" + (attrs.hasBackground ? ", and " + proportionFormat (utils.getErrorSinkRate ("Background")["proportion"]) + " of background branches)"  : ")" ) + " was placed in the <b>error sink</b> rate class, meaning that misalignment or other data quality issues may be present. You may use exploratory plots and other components on this page to further explore this.</span></details>" : ""}

```js
const ev_threshold = view(Inputs.text({label: html`<b>Evidence ratio threshold</b>`, value: "10", submit: "Update"}))
```

```js
const siteTableData = utils.siteTableData(results_json, ev_threshold);
const sites_table = [{}, siteTableData[0], siteTableData[1]];
const distributionTable = utils.getDistributionTable(results_json, ev_threshold);
const contributing_sites = utils.getContributingSites(siteTableData);
const test_omega = utils.testOmega(results_json, attrs.hasErrorSink);
const tree_objects = phylotreeUtils.getTreeObjects(results_json);
const bsPositiveSelection = utils.getBSPositiveSelection(results_json, tree_objects, test_omega, attrs.hasErrorSink);
console.log("bsPos", bsPositiveSelection)
console.log("err_sink", attrs.hasErrorSink)
console.log("omega", test_omega)
const bsErrorSink = utils.getBSErrorSink(results_json, tree_objects, attrs.hasErrorSinkNT);
const tile_specs = utils.getTileSpecs(results_json, ev_threshold, bsPositiveSelection, contributing_sites);

```

<div>${tt.tileTable(tile_specs)}</div>

#### Alignment-wide results

```js
const rate_table = view(Inputs.table (distributionTable, {
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
const distComparisonPlot = rate_table.length == 2 ? omegaPlots.renderTwoDiscreteDistributions (rate_table[0].dist[1],rate_table[1].dist[1],{"label" : {"chart" : rate_table[0].plot[0], "series" : [rate_table[0].dist[3],rate_table[1].dist[3]]}, "width" : 700, "height" : 120, "scale" : "sqrt", "margin" : {top: 5, right: 250, bottom: 30, left: 20}}) : "<small>Select exactly two distributions to plot a side-by-side comparison</small>"
```

```js
const plot_type =  view(Inputs.select(_.map (_.filter (plots.getPlotOptions(results_json, bsPositiveSelection), (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`}))
```

```js
const plot_extras = ({
    'Support for positive selection' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs', 'None'], {'label' : 'Circle size'} ),
    'Error-sink support' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs', 'None'], {'label' : 'Circle size'} )
})
```

```js
const fig1_controls = view(plot_extras[plot_type] || Inputs.text({label: "Plot options", value: "None", disabled: true}))
```

**Figure 1**. ${plot_type ? plots.getPlotDescription(plot_type, attrs.srvHMM) : "No plotting options available"}`

```js
function getFig1data() {
   let in_set = new Set (_.map (table1, (d)=>d.Codon));
   return _.filter (siteTableData[0], (x)=>in_set.has (x.Codon));
}
const fig1data = getFig1data()
```

```js
let plot_spec;
if (plot_type) {
  plot_spec = plots.getPlotSpec(plot_type, results_json, fig1data, bsPositiveSelection, bsErrorSink, ev_threshold, attrs.srvHMM, tree_objects, attrs.testedBranchCount, fig1_controls)
}
```
<div>${vl.render({"spec": plot_spec})}</div>

**Table 1**. Detailed site-by-site results from the BUSTED analysis

```js
const table1 = view(Inputs.table (sites_table[1], {
  rows : 10,
  format: sites_table[0],
  layout: "auto",
  header: sites_table[2]
}))
```

**Figure 2**.

```js
const tree_id =  view(Inputs.select (plots.getTreeViewOptions(results_json, tree_objects), {size : 10, label: html`<b>Tree to view</b>`, placeholder : "Select partition / codon tree to view"}))
```

```js
const branch_length =  view(Inputs.select(_.chain (results_json["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "unconstrained", label: html`<b>Branch length </b>`}))
```

```js
const treeLabels = view(Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips","include neighboring codons","show branch labels"],{"value" : ["amino-acids","align tips"], label: html`<b>Tree labels</b>` }
))
```

```js
const color_branches =  view(Inputs.select(plots.treeColorOptions(results_json, tree_objects),{value: "Support for selection", label: html`<b>Color branches </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}))
```

```js
function getFigure2() {

    let toDisplay = tree_id.split (" ");
    if (toDisplay.length > 1) {
      let tree_options = {  
          'branch-labels' : treeLabels.indexOf ("show branch labels") >= 0,
          'neighbors' : treeLabels.indexOf ("include neighboring codons") >= 0
      };
      
      if (toDisplay[0] == "Codon") {  
          let codon_index = (+toDisplay[1]);
          let partition_id = utils.getSiteIndexPartitionCodon(results_json)[codon_index-1][0]-1;
          codon_index -= d3.sum (attrs.partitionSizes.slice (0,partition_id));
          let TT = plots.displayTreeSite(results_json, partition_id, tree_objects[partition_id], codon_index, tree_options, treeDim, treeLabels, branch_length, color_branches, attrs.partitionSizes, test_omega, attrs.hasErrorSink);
          return TT;
      } 
      let pi = (-1) + (+toDisplay[1]);
      let TT = plots.displayTree(results_json, ev_threshold, pi, tree_objects[pi], tree_options, treeDim, treeLabels, branch_length, color_branches);
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
<p><tt>${results_json.analysis["citation"]}</tt></p>

<hr>

## hyphy-eye

<br>

View _more_ results at [hyphy-eye](/)!!