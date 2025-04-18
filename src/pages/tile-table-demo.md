```js
import * as tt from "../components/tile-table/tile-table.js";
import * as felUtils from "../fel/fel-utils.js";
```

# TileTable Component Examples

</br>

## A Very Trivial Case

</br>

```js
const trivialInputs = [
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

const trivialInputs = [
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

<div>${tt.tileTable(trivialInputs)}</div>;
```

<div>${tt.tileTable(trivialInputs)}</div>
</br>

```js
const resultsJson = await FileAttachment("../data/fel_test_data.json").json();
const felAttrs = felUtils.getFelAttributes(resultsJson);
const pvalueThreshold = 0.1;
const tileSpecs = felUtils.getTileSpecs(resultsJson, pvalueThreshold);
const sitesTable = felUtils.getSitesTable(resultsJson, pvalueThreshold);
```

## The FEL TileTable Component Test

</br>
<div>${tt.tileTable(tileSpecs)}</div>
</br>


## The OG FEL TileTable for Comparison

</br>

<table style = 'font-size: 12px; width: 100%;'>
<tr>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-options-vertical icons"></i>
  <div>
  <b>${felAttrs.numberSequences}</b>
  <span>sequences in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-options icons"></i>
  <div>
  <b>${felAttrs.numberSites}</b>
  <span>codon sites in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-arrow-up icons"></i>
  <div>
  <b>${felAttrs.numberPartitions}</b>
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
  <b>${felAttrs.testedBranchCount}</b>
  <span>median branches/partition used for testing</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-check icons"></i>
  <div>
  <b>${felAttrs.variableSiteCount}</b>
  <span>non-invariant sites tested</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-layers icons"></i>
  <div>
  <b>${resultsJson.simulated || "N/A"}</b>
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
  <b>${_.filter (sitesTable[1], (d)=>d.class == "Diversifying").length}</b>
  <span>Sites under diversifying positive selection at p≤${pvalueThreshold}</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati  midnight_blue left ">
  <i class="icon-minus icons"></i>
  <div>
  <b>${_.filter (sitesTable[1], (d)=>d.class == "Purifying").length}</b>
  <span>Sites under purifying selection at p≤${pvalueThreshold}</span>
  </div> 
  </div>
</td>
</tr>
</table>