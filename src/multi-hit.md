```js
md`# MULTI-HIT analysis result visualization`
```

```js
md`Load a MULTIHIT <tt>JSON</tt> result file `
```

```js
viewof results_file = html`<input type=file accept="application/json">`
```

```js
html`<table style = 'font-size: 12px; width: 100%;'>
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
  <span>sites in the alignment</span>
  </div> 
  </div>
</td>
</tr>
</table>
`
```

```js
fig1label=md`**Figure 1**. Evidence Ratios.`
```

```js
fig1=vegalite ({
  width: 400,
  height: 200,
  "data": {"values": evidence_ratios},
  "mark": {type: "rule", tooltip : true},
  "encoding": {
    "facet": {
      "field": "model",
      "type": "ordinal",
      "columns": 2
    },
    "x": {"field": "site", "type": "quantitative",  "axis" : {"grid" : false, title : "site"}},
    "y": {"field": "er", "type": "quantitative",  "axis" : {"grid" : false, title : "Evidence Ratio"}},
  }
})
```

```js
fig2_label=md`**Figure 2**. Site Log-Likelihood`
```

```js
fig2=vegalite ({
  width: 400,
  height: 200,
  "data": {"values": site_log_likelihood},
  "mark": {type: "point", tooltip : true},
  "encoding": {
    "facet": {
      "field": "model",
      "type": "ordinal",
      "columns": 2
    },
    "x": {"field": "site", "type": "quantitative",  "axis" : {"grid" : false, title : "site"}},
    "y": {"field": "site_log_likelihood", "type": "quantitative",  "axis" : {"grid" : false, title : "Site Log-Likelihood"}},
  }
})
```

```js
fig3_label=md`**Figure 3**. Model Fitting Benchmarks`
```

```js
fig3=vegalite ({
  width: 800,
  height: 200,
  "data": {"values": timers},
  "mark": {type: "bar", tooltip : true,  point : false},
  "encoding": {
    "y": {"field": "model", "type": "ordinal",  "axis" : {"grid" : false, title : "Model"}, "sort": "-x"},
    "x": {"field": "time", "type": "quantitative",  "axis" : {"grid" : false, title : "Time (seconds)"}, "scale" : {"type" :"sqrt"}},
  }
})
```

```js
html`
      <link rel=stylesheet href='${resolve("phylotree@0.1/phylotree.css")}'>
      <div id="tree_container"></div>`
```

```js
md`---`
```

```js
stages = _.size (results_json.improvements)
```

```js
floatFormat = d3.format ("2g")
```

```js
results_json = await (JSON.parse (await (Files.text(results_file))))
```

```js
evidence_ratios = _.chain(results_json["Evidence Ratios"]).map((d, k) => [_.map(d[0], (x, i) => { return { model: k, site : i, er:x }})]).flatten().flatten().value()
```

```js
site_log_likelihood = _.chain(results_json["Site Log Likelihood"]).map((d, k) => [_.map(d[0], (x, i) => { return { model: k, site : i, site_log_likelihood:x }})]).flatten().flatten().value()
```

```js
timers = _.chain(results_json["timers"]).map((d, k) =>  { return { model: k, time : d.timer}}).value()
```

```js
d3 = require ("d3")
```

```js
floatFmt = d3.format (".2g")
```

```js
seqNames = (tree)=> {
    let seq_names = [];
    tree.traverse_and_compute (n=>{
        if (n.children && n.children.length) return;
        seq_names.push (n.data.name);
    });
    return seq_names;
};
```

```js
_=require("lodash")
```

```js
totalTreeLength = (tree)=> {
  let L = 0;
  tree.traverse_and_compute ( (n)=> {
     if (tree.branch_length (n)) {
      L += +tree.branch_length (n);
     }
  });
  return L;
}
```

```js
import {legend} from "@d3/color-legend"
```

```js
phylotree=require ("https://dl.dropboxusercontent.com/s/i528j2lqnyzknit/phylotree.js")
```

```js
import { table } from "@gampleman/table"
```

```js
vegalite = require ("vega-embed")
```

```js
import {select, text, input, autoSelect} from "@jashkenas/inputs"
```

```js
function multiAutoSelect(config = {}) {
  const {
    value,
    title,
    description,
    disabled,
    autocomplete = "off",
    placeholder,
    size,
    options,
    list = "variants"
  } = Array.isArray(config) ? { options: config } : config;

  const optionsSet = new Set(options);

  const form = input({
    type: "text",
    title,
    description,
    attributes: { disabled },
    action: fm => {
      const addSelectedOption = d => {
        const ele = html`<label style="margin-right: 5px; border: solid 1px #ccc; border-radius: 10px;padding: 2px 5px;">${d} <button style="margin:0px; padding:0px;">✖️</button></label>`;
        ele.querySelector("button").addEventListener("click", b => {
          fm.value.splice(fm.value.indexOf(d), 1);
          renderSelection();
          fm.dispatchEvent(new CustomEvent("input"));
          fm.input.focus();
        });
        return ele;
      };

      function renderSelection() {
        fm.output.innerHTML = "";
        for (let o of fm.value) {
          fm.output.appendChild(addSelectedOption(o));
        }
      }

      fm.input.value = "";
      fm.value = value || [];
      fm.onsubmit = e => e.preventDefault();
      fm.input.oninput = function(e) {
        e.stopPropagation();
        if (
          optionsSet.has(fm.input.value) &&
          fm.value.indexOf(fm.input.value) === -1
        ) {
          fm.value.push(fm.input.value);
          renderSelection();
          fm.dispatchEvent(new CustomEvent("input"));
          fm.input.value = "";
        }
      };

      renderSelection();
    },
    form: html`
      <form>
         <input name="input" type="text" autocomplete="off" 
          placeholder="${placeholder ||
            ""}" style="font-size: 1em;" list=${list}>
          <datalist id="${list}">
              ${options.map(d =>
                Object.assign(html`<option>`, {
                  value: d
                })
              )}
          </datalist>
          <br/>
      </form>
      `
  });

  form.output.style["margin-left"] = "0px";

  return form;
}
```

```js
html`<style>
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
`
```

```js
html`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.css">`
```
