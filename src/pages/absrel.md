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

# aBSREL results summary

```js
const results_json = await FileAttachment("../data/absrel_test_data.json").json();
const attrs = utils.get_attributes(results_json);
```

Based on the likelihood ratio test, there **are ${attrs.positive_results}** branches with evidence of _episodic diversifying selection_ in this dataset (<tt>p&leq;${floatFormat(attrs.pvalue_threshold || 0.05)}</tt>).
This analysis **${attrs.srv_rate_classes > 0 ? "included" : "did not include"}** site-to-site synonymous rate variation. ${_.size (attrs.mh_rates['DH']) == 0 ? "" : (_.size (attrs.mh_rates['TH'] == 0) ? "Double nucleotide substitutions were included in the model." : "Double and triple nucleotide substitutions were included in the model.")}

```js
const ev_threshold = view(Inputs.text({label: html`<b>Evidence ratio threshold</b>`, value: "100", submit: "Update"}))
```

```js
const tree_objects = phylotreeUtils.get_tree_objects(results_json);
const distributionTable = utils.getDistributionTable(results_json, ev_threshold, tree_objects);
const tile_specs = utils.get_tile_specs(results_json, ev_threshold, distributionTable);
const profileBranchSites = utils.getProfileBranchSites(results_json, tree_objects);
const siteTableData = utils.siteTableData(results_json, ev_threshold, profileBranchSites);
const sites_table = [{}, siteTableData[0], siteTableData[1]];
// NOTE: doesnt look like this actually uses ev_threshold if do_counts is false anyhow..
const bsPositiveSelection = utils.getPosteriorsPerBranchSite(results_json, false, ev_threshold, tree_objects);
```

<div>${tt.tile_table(tile_specs)}</div>

#### Branch-by-branch results

```js
const rate_table = view(Inputs.table (distributionTable, {
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
const distComparisonPlot = rate_table.length == 2 ? omegaPlots.renderTwoDiscreteDistributions (rate_table[0].dist[1],rate_table[1].dist[1],{"label" : {"chart" : rate_table[0].plot[0], "series" : [rate_table[0].dist[3],rate_table[1].dist[3]]}, "width" : 700, "height" : 120, "scale" : "sqrt", "margin" : {top: 5, right: 250, bottom: 30, left: 20}}) : html`<small>Select exactly two distributions to plot a side-by-side comparison</small>`
```
<div>${distComparisonPlot}</div>

```js
const tree_id =  view(Inputs.select (plots.treeViewOptions(results_json), {label: html`<b>Tree to view</b>`, placeholder : "Select something to view", "value" : "Alignment-wide tree"}))
```

```js
const branch_length =  view(Inputs.select(_.chain (results_json["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "Baseline MG94xREV", label: html`<b>Branch length </b>`}))
```

```js
const treeLabels = view(Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips","include neighboring codons","show branch labels"],{"value" : ["amino-acids","align tips"], label: html`<b>Tree labels</b>` }
))
```

```js
const color_branches =  view(Inputs.select(plots.tree_color_options(results_json, ev_threshold),{value: "Support for selection", label: html`<b>Color branches </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", label: "H x W (pixels)", submit: "Resize", value: "1024 x 800"}))
```

```js
// TODO: consider making a phylotreeProps object or similar for treeDim, treeLabels, branch_length and color_branches
// TODO: pick either snake case or camel case lol
function getFigure2() {
  const siteIndexPartitionCodon = utils.getSiteIndexPartitionCodon(results_json);

    let toDisplay = tree_id.split (" ");
    if (toDisplay.length > 1) {
      let tree_options = {  
          'branch-labels' : treeLabels.indexOf ("show branch labels") >= 0,
          'neighbors' : treeLabels.indexOf ("include neighboring codons") >= 0
      };
      
      if (toDisplay[0] == "Codon") {  
          const codon_index = (+toDisplay[1]);
          let partition_id = siteIndexPartitionCodon[codon_index-1][0]-1;
          console.log("partition", partition_id)
          let TT = plots.display_tree_site (results_json, partition_id, tree_objects[0], codon_index, tree_options, ev_threshold, treeDim, treeLabels, branch_length, color_branches, attrs.partition_sizes);
          return TT;
      } 
      let TT = plots.display_tree(results_json, 0, tree_objects[0], tree_options, ev_threshold, treeDim, treeLabels, branch_length, color_branches);
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
            //ticks: figure2.color_scale.ticks(),
            //tickFormat: figure2.color_scale.tickFormat()
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

**Figure 1**. ${plot_type ? plots.get_plot_description(plot_type) : "No plotting options available"}

```js
const plot_type =  view(Inputs.select(_.map (_.filter (plots.get_plot_options(attrs.srv_rate_classes, attrs.srv_distribution, bsPositiveSelection, profileBranchSites), (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`, value : 'Evidence ratio alignment profile'}))
```

```js
const plot_extras = ({
  'Evidence ratio alignment profile' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs'], {'label' : 'Circle size'} ),
  'Support for positive selection' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs'], {'label' : 'Circle size'} )
})
const fig1_controls = view(plot_extras[plot_type] || Inputs.text({label: "Plot options", value: "None", disabled: true}))
```

```js
function getFig1data() {
   let in_set = new Set (_.map (table1, (d)=>d.Codon));
   return _.filter (siteTableData[0], (x)=>in_set.has (x.Codon));
}
const fig1data = getFig1data();
const selected_branches = new Set (_.map (rate_table, (d)=>d.branch));
const branch_order = _.filter (phylotreeUtils.treeNodeOrdering(results_json, tree_objects, 0), (d)=>attrs.profilable_branches.has (d) && selected_branches.has (d));
```

```js
let plot_spec;
if (plot_type) {
  plot_spec = plots.get_plot_spec(plot_type, results_json, fig1data, bsPositiveSelection, profileBranchSites, branch_order, fig1_controls)
}
```
<div>${vl.render({"spec": plot_spec})}</div>

**Table 2**. Detailed site-by-site results from the aBSREL analysis

```js
const table1 = view(Inputs.table (sites_table[1], {
  rows : 10,
  format: sites_table[0],
  layout: "auto",
  header: sites_table[2]
}))
```

**Table 3**. Detailed site-by-site results for a specific branch in the aBSREL analysis

```js
const which_branch = view(Inputs.select(
  _.map ([...attrs.profilable_branches], (d)=>d),
  {multiple: true,
  label: "Select some branches"
  }
))
```

```js
function get_table3_data() {
  let rc = _.keyBy (_.filter (profileBranchSites, (d)=>which_branch.indexOf (d.branch)>=0), (d)=>d.Key);
  _.each (bsPositiveSelection, (d)=> {
      if (d.Key in rc) {
          rc[d.Key].EBF = d.ER;
      }
  });
  return _.values (rc);
     
}

const table3_data = get_table3_data();
```

```js
const table3 = view(Inputs.table (table3_data,
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

**Citation**

<p><tt><small>${results_json.analysis["citation"]}</small></tt></p>