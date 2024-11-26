```js
import * as tileTable from "./components/tile-table.js";
import * as utils from "./fel-utils.js";
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

const trivial_tile_table = tileTable.tile_table(trivial_inputs);
```

<div>${trivial_tile_table}</div>
</br>

```js
// TODO: we need utils for grabbing out these values, or one util that returns an object w these props
// TODO: also a util for making a TileTable spec from the results
const results_json = await FileAttachment("./data/fel_test_data.json").json();
const has_srv = _.chain(results_json.MLE.content).some ((d)=>_.some (d,(dd)=>dd[0] > 0 && dd[0] != 1)).value()
const has_ci = results_json ["confidence interval"]
const has_T = _.some (_.map (results_json.MLE.content, (d)=>_.some(d, (dd)=>dd[5] > 0.)))
const has_pasmt = results_json.MLE["LRT"]
const tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map ((d)=>_.map (d, (dd)=>_.filter (dd, ddd=>ddd == "test"))).map ((d)=>d.length).value())
const variable_site_count = d3.sum(_.chain (results_json.MLE.content).map ((d)=>_.filter (d, (dd)=>dd[0]+dd[1] > 0)).map (d=>d.length).value())
const pvalue_threshold = 0.01;
const sites_table = utils.get_sites_table(results_json, has_T, has_ci, has_pasmt, pvalue_threshold);
```

<!-- as things are, this inherits stylesheets from the tile-table module, which i dont really like -->
## The OG FEL TileTable for Comparison

</br>

<table style = 'font-size: 12px; width: 100%;'>
<tr>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-options-vertical icons"></i>
  <div>
  <b>${results_json.input["number of sequences"]}</b>
  <span>sequences in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-options icons"></i>
  <div>
  <b>${results_json.input["number of sites"]}</b>
  <span>codon sites in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-arrow-up icons"></i>
  <div>
  <b>${results_json.input["partition count"]}</b>
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
  <b>${tested_branch_count}</b>
  <span>median branches/partition used for testing</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-check icons"></i>
  <div>
  <b>${variable_site_count}</b>
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