---
sidebar: false
header: false
footer: false
pager: false
theme: air
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

# MEME results summary

```js
const results_json = Mutable(
  await FileAttachment("../data/meme_test_data.json").json(),
);

// Handle data from URL parameters
console.log('[MEME DEBUG] Starting parameter processing...');
console.log('[MEME DEBUG] Current URL:', window.location.href);
console.log('[MEME DEBUG] Search params:', window.location.search);

const urlParams = new URLSearchParams(window.location.search);
const jsonUrl = urlParams.get('json');
const jsonData = urlParams.get('data');
const dataId = urlParams.get('id');
const storageKey = urlParams.get('key');

console.log('[MEME DEBUG] Extracted parameters:', {jsonUrl, jsonData, dataId, storageKey});

if (jsonUrl) {
  console.log('[MEME DEBUG] Loading from URL:', jsonUrl);
  // Load JSON from external URL
  fetch(jsonUrl)
    .then(response => response.json())
    .then(data => {
      console.log('[MEME DEBUG] Fetched data from URL:', data);
      if (data && data.MLE) {
        console.log('[MEME DEBUG] Setting results_json from URL data');
        results_json.value = data;
      } else {
        console.log('[MEME DEBUG] URL data missing MLE property');
      }
    })
    .catch(error => console.error('[MEME DEBUG] Error loading JSON:', error));
} else if (jsonData) {
  console.log('[MEME DEBUG] Parsing JSON from parameter:', jsonData.substring(0, 100) + '...');
  // Parse JSON from URL parameter
  try {
    const data = JSON.parse(decodeURIComponent(jsonData));
    console.log('[MEME DEBUG] Parsed data from parameter:', data);
    if (data && data.MLE) {
      console.log('[MEME DEBUG] Setting results_json from parameter data');
      results_json.value = data;
    } else {
      console.log('[MEME DEBUG] Parameter data missing MLE property');
    }
  } catch (error) {
    console.error('[MEME DEBUG] Error parsing JSON from URL:', error);
  }
} else if (dataId || storageKey) {
  // Try to load from localStorage first
  const key = storageKey || `hyphy-results-${dataId}`;
  console.log('[MEME DEBUG] Looking for localStorage data with key:', key);
  const localData = localStorage.getItem(key);
  
  if (localData) {
    console.log('[MEME DEBUG] Found localStorage data, length:', localData.length);
    try {
      const data = JSON.parse(localData);
      console.log('[MEME DEBUG] Parsed localStorage data:', Object.keys(data));
      if (data && data.MLE) {
        console.log('[MEME DEBUG] Setting results_json from localStorage');
        results_json.value = data;
      } else {
        console.log('[MEME DEBUG] localStorage data missing MLE property');
      }
    } catch (error) {
      console.error('[MEME DEBUG] Error parsing localStorage data:', error);
    }
  } else {
    console.log('[MEME DEBUG] No localStorage data found');
    if (dataId) {
      console.log('[MEME DEBUG] Requesting data from parent via postMessage');
      // If not in localStorage, request from parent via postMessage
      window.parent.postMessage({ type: 'request-data', id: dataId }, '*');
    }
  }
} else {
  console.log('[MEME DEBUG] No URL parameters found, using default test data');
}

window.addEventListener(
  "message",
  (event) => {
    console.log('[MEME DEBUG] Received postMessage:', event.data);
    if (event.data.data && event.data.data.MLE) {
      console.log('[MEME DEBUG] Setting results_json from postMessage data');
      results_json.value = event.data.data; // Update the mutable value
    } else if (
      event.data &&
      event.data.type === "data-response" &&
      event.data.data
    ) {
      console.log('[MEME DEBUG] Received data-response postMessage');
      // Handle response to data request
      if (event.data.data && event.data.data.MLE) {
        console.log('[MEME DEBUG] Setting results_json from data-response');
        results_json.value = event.data.data;
      } else {
        console.log('[MEME DEBUG] data-response missing MLE property');
      }
    } else {
      console.log('[MEME DEBUG] postMessage did not match expected format');
    }
  },
  false,
);
```
<hr>

## Results summary

```js
const attrs = utils.get_attributes(results_json);
```

<span style = 'font-size: 110%; color;'>Based on the likelihood ratio test, _episodic diversifying selection_ has acted on **${count_sites}** sites in this dataset (<tt>p≤${pvalue_threshold}</tt>).</span>
${attrs.has_resamples > 0 ? "This analysis used parametric bootstrap with " + attrs.has_resamples + " replicates to test for significance." : ""} ${+results_json.analysis.version < 3.0 ? "<small><b>Some of the visualizations are not available for MEME analyses before v3.0</b>" : ""}

```js
const pvalue_threshold = view(Inputs.text({label: html`<b>p-value threshold</b>`, value: "0.1", submit: "Update"}))
```

```js
const tree_objects = phylotreeUtils.get_tree_objects(results_json);
const siteTableData = utils.siteTableData(results_json, table_options, pvalue_threshold, attrs.siteIndexPartitionCodon, tree_objects);
const tile_specs = utils.get_tile_specs(results_json, pvalue_threshold);
const bsPositiveSelection = utils.getPosteriorsPerBranchSite(results_json);
const count_sites = utils.get_count_sites_by_pvalue(results_json, pvalue_threshold);
const selected_branches_per_selected_site = utils.get_selected_branches_per_selected_site(results_json, pvalue_threshold);
const test_omega = utils.getRateDistribution(results_json, ["fits","Unconstrained model","Rate Distributions","Test"])
const treeViewOptions = plots.getTreeViewOptions(results_json, tree_objects)
// TODO: clean this up
const sites_table = [{
    'class' : (d)=>html`<span style = "color:${plots.TABLE_COLORS[d]}">${d}</span>`, 
    'Substitutions' : (d)=>d.length == 0 ? "-" : _.map (d, (c)=>c[1] + " " + c[0]).join('   ,   '),
    'dN/dS' : (d)=>omegaPlots.renderNDiscreteDistributions ([d],{"height" : 20, "width" : 200, "scale" : "sqrt"})
    }, 
    _.filter (siteTableData[0], (x)=>table_filter.indexOf(x.class)>=0), siteTableData[1]
  ];
```

<div>${tt.tile_table(tile_specs)}</div>

#### Alignment-wide results

```js
const plot_type =  view(Inputs.select(_.map (_.filter (plots.get_plot_options(attrs.has_site_LRT, attrs.has_resamples, bsPositiveSelection), (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`}))
```

**Figure 1**. ${plot_type ? plots.get_plot_description(plot_type, attrs.has_resamples) : "No plotting options available"}

```js
function getFig1data() {
   let in_set = new Set (_.map (table1, (d)=>d.Codon));
   return _.filter (siteTableData[0], (x)=>in_set.has (x.Codon));
}
const fig1data = getFig1data();
```

```js
let plot_spec;
if (plot_type) {
  plot_spec = plots.get_plot_spec(results_json, plot_type, bsPositiveSelection, fig1data, siteTableData, attrs.has_site_LRT, attrs.has_resamples, pvalue_threshold, tree_objects)
}
```
<div>${vl.render({"spec": plot_spec})}</div>

```js
const table_filter = view(Inputs.checkbox(["Diversifying", "Neutral","Invariable"], {value: ["Diversifying", "Neutral", "Invariable"], label: html`<b>Show</b>`}))
```

```js
const table_options = view(Inputs.checkbox(["Distribution plot","Show q-values","Show substitutions (tested branches)"], {value: ["Show q-values"], label: html`<b>Options</b>`}))
```

**Table 1**. Detailed site-by-site results from the MEME analysis

```js
const table1 = view(Inputs.table (sites_table[1], {
  rows : 20,
  format: sites_table[0],
  layout: "auto",
  header: sites_table[2]
}))
```

```js
const tree_id =  view(Inputs.select(treeViewOptions[0], {size : 10, label: html`<b>Tree to view</b>`, placeholder : "Select partition / codon tree to view"}))
```

```js
const branch_length =  view(Inputs.select(_.chain (results_json["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "unconstrained", label: html`<b>Branch length </b>`}))
```

```js
const treeLabels = view(Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips"],{"value" : ["amino-acids"], label: html`<b>Tree labels</b>` }
))
```

```js
const color_branches =  view(Inputs.select(plots.get_tree_color_options(results_json),{value: "Support for selection", label: html`<b>Color branches </b>`}))
```

```js
const shade_branches =  view(Inputs.select(plots.get_tree_color_options(results_json).concat ("None"),{value: "None", label: html`<b>Opaqueness of branches </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}))
```

```js
function getFigure2() {
    let toDisplay = tree_id.split (" ");
    if (toDisplay.length > 1) {
      if (toDisplay[0] == "Codon") {  
          const codon_index = (+toDisplay[1]);
          let partition_id = attrs.siteIndexPartitionCodon [codon_index][0]-1;
          let TT = plots.display_tree_site(results_json, partition_id, codon_index, treeDim, treeLabels, branch_length, color_branches, shade_branches, tree_objects, treeViewOptions);
          return TT;
      } 
      let TT = plots.display_tree(results_json, (-1) + (+toDisplay[1]), treeDim, treeLabels, branch_length, color_branches, tree_objects);
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