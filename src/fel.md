```js
import * as d3 from "npm:d3";
import * as _ from "npm:lodash-es";
import * as phylotree from "npm:phylotree";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as ss from "./stats/chi-squared.js";
import * as utils from "./fel/fel-utils.js";
import * as plots from "./fel/fel-plots.js";
import {FileAttachment} from "observablehq:stdlib";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
```

# FEL results summary

```js
const results_json = await FileAttachment("./data/fel_test_data.json").json();
const has_srv = _.chain(results_json.MLE.content).some ((d)=>_.some (d,(dd)=>dd[0] > 0 && dd[0] != 1)).value()
const has_ci = results_json ["confidence interval"]
const has_T = _.some (_.map (results_json.MLE.content, (d)=>_.some(d, (dd)=>dd[5] > 0.)))
const has_pasmt = results_json.MLE["LRT"]
```

Statistical significance is evaluated based on  ${results_json.simulated  ? "<tt>" + results_json.simulated + "</tt> site-level parametric bootstrap replicates"  : "the asymptotic chi-squared distribution"}. This analysis **${has_srv? "includes" : "does not include"}** site to site synonymous rate variation. ${has_ci ? "Profile approximate confidence intervals for site-level dN/dS ratios have been computed." : ""}

```js
const tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map ((d)=>_.map (d, (dd)=>_.filter (dd, ddd=>ddd == "test"))).map ((d)=>d.length).value())
const variable_site_count = d3.sum(_.chain (results_json.MLE.content).map ((d)=>_.filter (d, (dd)=>dd[0]+dd[1] > 0)).map (d=>d.length).value())
```

```js
const pvalue_threshold = await view(Inputs.text({label: html`<b>p-value threshold</b>`, value: "0.1", submit: "Update"}));
```

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

```js
const sites_table = utils.get_sites_table(results_json, pvalue_threshold);
const siteTableData = _.filter (sites_table[1], (x)=>table_filter.indexOf (x.class)>=0);
```

```js
const table_filter = view(Inputs.checkbox(
  ["Diversifying", "Purifying", "Neutral","Invariable"], 
  {
    value: ["Diversifying", "Purifying", "Neutral", "Invariable"], 
    label: html`<b>Show</b>`, 
    format: x => html`<span style="text-transform: capitalize; border-bottom: solid 2px ${plots.COLORS[x]}; margin-bottom: -2px;">${x}`
  }
));
```

```js
function get_fig1data() {
   let in_set = new Set (_.map (table1, (d)=>d.codon));
   return _.filter (siteTableData, (x)=>in_set.has (x.codon));
}
const fig1data = get_fig1data();
```

```js
const plot_type =  view(Inputs.select(_.map (_.filter (plots.get_options(has_pasmt), (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`}))
```

```js
const plot_description = plots.get_description(plot_type, pvalue_threshold)
const plot_spec = plots.get_spec(plot_type, fig1data, pvalue_threshold, has_pasmt)
const tree_objects = plots.get_tree_objects(results_json)
```

**Figure 1**. <small>${plot_description}</small>
<div>${vl.render({"spec": plot_spec})}</div>

**Table 1**. <small>Detailed site-by-site results from the FEL analysis</small>

```js
const table1 = view(Inputs.table (siteTableData, {
  rows : 15,
  format: sites_table[0]
}));
```

<details>
  <summary><b>Table column definitions</b></small></summary>
  <small><dl>
    ${_.map (sites_table[2], (d)=>"<dt><tt>"+d[0]+"</tt></dt><dd>" + d[1] + "</dd>")}
  </dl></small>
</details>

```js
 const tree_id =  view(Inputs.select(_.map (_.range (1,tree_objects.length+1), (d)=>"Partition " + d),{label: html`<b>View tree for </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"}));
```

<small>Branches that are shown in <span style = 'color: redbrick'>red color</span> are those that were included in testing for selection</small>

```js
function display_tree(i) {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
 
      let T = tree_objects[i];
      var t = T.render({
        height:dim && dim[0] || 1024, 
        width:dim && dim[1] || 600,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=>0
       } );
      
      
      function sort_nodes (asc) {
          T.traverse_and_compute (function (n) {
                  var d = 1;
                  if (n.children && n.children.length) {
                      d += d3.max (n.children, function (d) { return d["count_depth"];});
                  } 

                  n["count_depth"] = d;
              });
          T.resortChildren (function (a,b) {
              return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
          });
        }

        sort_nodes (true);
        t.style_nodes ((e,n) => {
           if (n.children && n.children.length) return; 
           /*if (variants.indexOf (n.data.name) >= 0) {
              e.style ("fill", "firebrick"); 
           } else {
              e.style ("fill", null); 
           }*/
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });
  
        t.style_edges ((e,n) => {
           const is_tested = results_json["tested"][i][n.target.data.name] == "test";
           if (is_tested) {
              e.style ("stroke", "firebrick"); 
           } else {
              e.style ("stroke", null); 
           }
        });
        t.placenodes();
        t.update();
        return t;      
    }

const figure2 = display_tree((-1) + (+tree_id.split (" ")[1])).show()
```

<div id="tree_container">${figure2}</div>

**Citation**

<p><tt><small>${results_json.analysis["citation"]}</small></tt></p>

```js
const floatFormat = d3.format ("2g")
const floatFmt = d3.format (".2g")
const svgSize = 700
```

<style>
.stati{
  background: #fff;
  height: 6em;
  padding:0.5em;
  margin:0.25em 0; 
    -webkit-transition: margin 0.5s ease,box-shadow 0.5s ease; /* Safari */
    transition: margin 0.5s ease,box-shadow 0.5s ease; 
  -moz-box-shadow:0px 0.2em 0.4em rgb(0, 0, 0,0.8);
-webkit-box-shadow:0px 0.2em 0.4em rgb(0, 0, 0,0.8);
box-shadow:0px 0.2em 0.4em rgb(0, 0, 0,0.8);
}
.stati i{
  font-size:3.5em; 
} 
.stati div{
  width: calc(100% - 3.5em);
  display: block;
  float:right;
  text-align:right;
}
.stati div b {
  font-size:2.2em;
  width: 100%;
  padding-top:0px;
  margin-top:-0.2em;
  margin-bottom:-0.2em;
  display: block;
}
.stati div span {
  font-size:1em;
  width: 100%;
  color: rgb(0, 0, 0,0.8); !important;
  display: block;
}

.stati.left div{ 
  float:left;
  text-align:left;
}

.stati.bg-turquoise { background: rgb(26, 188, 156); color:white;} 
.stati.bg-emerald { background: rgb(46, 204, 113); color:white;} 
.stati.bg-peter_river { background: rgb(52, 152, 219); color:white;} 
.stati.bg-amethyst { background: rgb(155, 89, 182); color:white;} 
.stati.bg-wet_asphalt { background: rgb(52, 73, 94); color:white;} 
.stati.bg-green_sea { background: rgb(22, 160, 133); color:white;} 
.stati.bg-nephritis { background: rgb(39, 174, 96); color:white;} 
.stati.bg-belize_hole { background: rgb(41, 128, 185); color:white;} 
.stati.bg-wisteria { background: rgb(142, 68, 173); color:white;} 
.stati.bg-midnight_blue { background: rgb(44, 62, 80); color:white;} 
.stati.bg-sun_flower { background: rgb(241, 196, 15); color:white;} 
.stati.bg-carrot { background: rgb(230, 126, 34); color:white;} 
.stati.bg-alizarin { background: rgb(231, 76, 60); color:white;} 
.stati.bg-clouds { background: rgb(236, 240, 241); color:white;} 
.stati.bg-concrete { background: rgb(149, 165, 166); color:white;} 
.stati.bg-orange { background: rgb(243, 156, 18); color:white;} 
.stati.bg-pumpkin { background: rgb(211, 84, 0); color:white;} 
.stati.bg-pomegranate { background: rgb(192, 57, 43); color:white;} 
.stati.bg-silver { background: rgb(189, 195, 199); color:white;} 
.stati.bg-asbestos { background: rgb(127, 140, 141); color:white;} 
  

.stati.turquoise { color: rgb(26, 188, 156); } 
.stati.emerald { color: rgb(46, 204, 113); } 
.stati.peter_river { color: rgb(52, 152, 219); } 
.stati.amethyst { color: rgb(155, 89, 182); } 
.stati.wet_asphalt { color: rgb(52, 73, 94); } 
.stati.green_sea { color: rgb(22, 160, 133); } 
.stati.nephritis { color: rgb(39, 174, 96); } 
.stati.belize_hole { color: rgb(41, 128, 185); } 
.stati.wisteria { color: rgb(142, 68, 173); } 
.stati.midnight_blue { color: rgb(44, 62, 80); } 
.stati.sun_flower { color: rgb(241, 196, 15); } 
.stati.carrot { color: rgb(230, 126, 34); } 
.stati.alizarin { color: rgb(231, 76, 60); } 
.stati.clouds { color: rgb(236, 240, 241); } 
.stati.concrete { color: rgb(149, 165, 166); } 
.stati.orange { color: rgb(243, 156, 18); } 
.stati.pumpkin { color: rgb(211, 84, 0); } 
.stati.pomegranate { color: rgb(192, 57, 43); } 
.stati.silver { color: rgb(189, 195, 199); } 
.stati.asbestos { color: rgb(127, 140, 141); } 
</style>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.css">
