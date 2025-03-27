```js
import * as tt from "../components/tile-table/tile-table.js";
import * as felUtils from "../fel/fel-utils.js";
```

# TileTable Component Examples

</br>

## A Very Trivial Case

</br>

```js
const trivial_inputs = [
    {
        "number": 12,
        "description": "I'm a number!",
        "icon": "icon-options-vertical icons",
        "color": "asbestos",
    },
    {
        "number": 24,
        "description": "I'm twice the last number!",
        "icon": "icon-options icons",
        "color": "midnight_blue"
    }
]
```

```
import * as tt from "./components/tile-table/tile-table.js";

const trivial_inputs = [
    {
        "number": 12,
        "description": "I'm a number!",
        "icon": "icon-options-vertical icons",
        "color": "asbestos",
    },
    {
        "number": 24,
        "description": "I'm twice the last number!",
        "icon": "icon-options icons",
        "color": "midnight_blue"
    }
]

<div>${tt.tileTable(trivial_inputs)}</div>;
```

<div>${tt.tileTable(trivial_inputs)}</div>
</br>

```js
const results_json = await FileAttachment("../data/fel_test_data.json").json();
const fel_attrs = felUtils.getAttributes(results_json);
const pvalue_threshold = 0.1;
const tile_specs = felUtils.get_tile_specs(results_json, pvalue_threshold);
const sites_table = felUtils.get_sites_table(results_json, pvalue_threshold);
```

## The FEL TileTable Component Test

</br>
<div>${tt.tileTable(tile_specs)}</div>
</br>


## The OG FEL TileTable for Comparison

</br>

<table style = 'font-size: 12px; width: 100%;'>
<tr>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-options-vertical icons"></i>
  <div>
  <b>${fel_attrs.number_sequences}</b>
  <span>sequences in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-options icons"></i>
  <div>
  <b>${fel_attrs.number_sites}</b>
  <span>codon sites in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-arrow-up icons"></i>
  <div>
  <b>${fel_attrs.number_partitions}</b>
  <span>partitions</span>
  </div> 
  </div>
</td>
</tr>
<tr>
<td>
  <div class="stati asbestos left ">
  <i class="icon-share icons"></i>
  <div>
  <b>${fel_attrs.tested_branch_count}</b>
  <span>median branches/partition used for testing</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-check icons"></i>
  <div>
  <b>${fel_attrs.variable_site_count}</b>
  <span>non-invariant sites tested</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-layers icons"></i>
  <div>
  <b>${results_json.simulated || "N/A"}</b>
  <span>parametric bootstrap replicates</span>
  </div> 
  </div>
</td>
</tr>
<tr>
<td style = 'width: 33%;'>
  <div class="stati midnight_blue left ">
  <i class="icon-plus icons"></i>
  <div>
  <b>${_.filter (sites_table[1], (d)=>d.class == "Diversifying").length}</b>
  <span>Sites under diversifying positive selection at p≤${pvalue_threshold}</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati  midnight_blue left ">
  <i class="icon-minus icons"></i>
  <div>
  <b>${_.filter (sites_table[1], (d)=>d.class == "Purifying").length}</b>
  <span>Sites under purifying selection at p≤${pvalue_threshold}</span>
  </div> 
  </div>
</td>
</tr>
</table>