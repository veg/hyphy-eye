```js
md`# GARD analysis result visualization`
```

```js
md`Load a GARD <tt>JSON</tt> result file `
```

```js
viewof gard_results_file = params.get ("url") ? localFileInput({accept: [".json",".gz"], value : params.get ("url"), disable: true}) : localFileInput({accept: [".json",".gz"]})
```

```js
html`<table style = 'font-size: 12px; width: 100%;'>
<tr>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-options-vertical icons"></i>
  <div>
  <b>${gard_results_json.input["number of sequences"]}</b>
  <span>sequences in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-options icons"></i>
  <div>
  <b>${gard_results_json.input["number of sites"]}</b>
  <span>sites in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-arrow-up icons"></i>
  <div>
  <b>${gard_results_json.potentialBreakpoints}</b>
  <span>potential breakpoints</span>
  </div> 
  </div>
</td>
</tr>
<tr>
<td style = 'width: 33%;'>
  <div class="stati midnight_blue left ">
  <i class="icon-location-pin icons"></i>
  <div>
  <b>${_.size(gard_results_json.improvements)}</b>
  <span>inferred breakpoints</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati midnight_blue left ">
  <i class="icon-info icons"></i>
  <div>
  <b>${gard_results_json.totalModelCount}</b>
  <span>models considered</span>
  </div> 
  </div>
</td>
</tr>
<tr>
<td style = 'width: 33%;'>
  <div class="stati amethyst left ">
  <i class="icon-graph icons"></i>
  <div>
  <b>${floatFormat(gard_results_json.baselineScore - gard_results_json.bestModelAICc)}</b>
  <span>&Delta; c-AIC vs the null model</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati  amethyst left ">
  <i class="icon-graph icons"></i>
  <div>
  <b>${floatFormat(gard_results_json.singleTreeAICc - gard_results_json.bestModelAICc)}</b>
  <span>&Delta; c-AIC vs the single tree multiple partition</span>
  </div> 
  </div>
</td></tr>
</table>
`
```

```js
fig1label=md`**Figure 1**. Left: the best placement of breakpoints inferred by the algorithm for each number of breakpoints considered. Right: the improvement in the c-AIC score between successive breakpoint numbers (log scale).`
```

```js
fig1=vegalite ({
  hconcat: [
    {
      width: 650,
      height: stages*12,
      "data": {"values": gard_breakpoints},
      "mark": {type: "point", tooltip : true, filled : true},
      "encoding": {
        "x": {"field": "bp", "type": "quantitative", "axis" : {"grid" : false, "title" : "Coordinate"}},
        "y": {"field": "model", "type": "ordinal", "axis" : {title: "# breakpoints"}},
        "size" : {"condition": {"test": "datum['span'] >= " + stages/2, "value": "64"}, "value": "16"},
        "color" : {"condition": {"test": "datum['span'] >= " + stages/2, "value": "firebrick"}, "value": "gray"}
      }
    },
    {
      width: 120,
      height: stages*12,
      "data": {"values": caic_improvements},
      "mark": {type: "line", tooltip : true, filled : false, points: true},
      "encoding": {
        "x": {"field": "daic", "type": "quantitative", "axis" : {"grid" : false, "title" : "Delta c-AIC"}, scale : {"type" : "log"}},
        "y": {"field": "bp", "type": "ordinal", "axis" : null},
      }
    }
  ]})
```

```js
fig2_label=md`**Figure 2**. Model-averaged support for breakpoint placement`
```

```js
fig2=vegalite ({
  width: 800,
  height: 200,
  "data": {"values": site_support},
  "mark": {type: "rule", tooltip : true},
  "encoding": {
    "x": {"field": "bp", "type": "quantitative",  "axis" : {"grid" : false, title : "coordinate"}},
    "y": {"field": "support", "type": "quantitative",  "axis" : {"grid" : false, title : "Model averaged support"}},
  }
})
```

```js
fig3_label=md`**Figure 3**. Total tree length by partition`
```

```js
fig3=vegalite ({
  width: 800,
  height: 200,
  "data": {"values": tree_lengths},
  "mark": {type: "line", tooltip : true,  point : false},
  "encoding": {
    "x": {"field": "x", "type": "quantitative",  "axis" : {"grid" : false, title : "Coordinate"}},
    "y": {"field": "L", "type": "quantitative",  "axis" : {"grid" : false, title : "Total tree length"}, "scale" : {"type" :"sqrt"}},
  }
})
```

```js
fig4_label = md`**Figure 4.** Trees for individial fragments`
```

```js
viewof variants = multiAutoSelect({
  options: seqNames (tree_objects[0].tree),
  title: "Select some sequences to highlight",
  placeholder: "Select some sequences"
})
```

```js
fig4=html`${makeTreeDivs()}`
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
stages = _.size (gard_results_json.improvements)
```

```js
floatFormat = d3.format ("2g")
```

```js
gard_results_json =await get_json (params.get ("url"))
```

```js echo
get_json = async (json_source)=>  {
  if (json_source) {
      if (json_source.substr (json_source.length-3) == ".gz") {
        return JSON.parse (pako.inflate(await d3.buffer(json_source), { to: 'string' }));
      }
      return d3.json (json_source);
      try {
        return d3.json (json_source);
      } catch {}
      //results_file.json();
  }
  try {
    return JSON.parse (pako.inflate(await gard_results_file.arrayBuffer(), { to: 'string' }));//results_file.json();
  } catch {}
  return gard_results_file.json();
}
```

```js
caic_improvements = {
  let accumulator = 0;
  return _.map (gard_results_json['improvements'], (d,i)=> {
      let delta = d.deltaAICc;
      if (i > 0 && d.deltaAICc > gard_results_json['improvements'][0].deltaAICc) {
         delta = delta - accumulator;
      }
      accumulator += delta;
      return {'bp' : d.breakpoints.length, 'daic' : delta};
  });
}
```

```js
gard_breakpoints = {
  let bp = {};
  return _.chain(gard_results_json.improvements).map ( (d)=> {
      bp
      return _.map (d.breakpoints, (b)=>{
          if (!bp[b[0]]) bp[b[0]] = [];
          bp[b[0]].push (d.breakpoints.length)
          return {'bp' : b[0], 'model' : d.breakpoints.length};
      });
  }).flatten().each ((d)=>d.span = d3.max (bp[d.bp]) - d3.min (bp[d.bp])).value();
}
```

```js
gard_result_table = {
    return _.chain (gard_results_json['siteBreakPointSupport']).toPairs().map ((d)=>{return {'site' : +d[0], 'support' : d[1]}}).value();
} 
```

```js echo
params = new URLSearchParams(location.search)
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
svgSize = Math.max (seqNames (tree_objects[0].tree).length * 10, 300)
```

```js
site_support = _.chain(gard_results_json["siteBreakPointSupport"]).toPairs().map ((d)=>{return {'bp' : +d[0], 'support' : d[1]}}).value()
```

```js
_=require("lodash")
```

```js
tree_objects = _.map (gard_results_json.breakpointData, (bp)=> {return {
  'bps' : bp.bps[0],
  'tree' : new phylotree.phylotree (bp.tree)
}});
```

```js
tree_lengths = _.flatten(_.map (tree_objects, (t)=> {
    let L = totalTreeLength (t.tree);
    return [{
        'x' : t.bps[0],
        'L' : L
    },
    {
        'x' : t.bps[1],
        'L' : L
    }]
}));
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
makeTreeDivs = ()=> {
     let rows = _.map (_.range (tree_objects.length), (i)=>[]);
     _.each (_.range (tree_objects.length), (i)=> {
        let m2 = Math.floor (i/2);
        rows[m2+1].push ("<div><svg height = '" + svgSize + "px' id = 'tree_" + i + "'></div>");
        rows[m2].push ("<div>Tree " + (i+1) + ", coordinate range " + tree_objects[i].bps[0] + '-' + tree_objects[i].bps[1] + " </div>");
     });

  return "<div style = 'display: grid; grid-template-columns: 400px 400px'>" +
      _.flatten(rows).join ("\n")
      + "</div>";
} 
```

```js
import {legend} from "@d3/color-legend"
```

```js
displayed_trees = {
    return _.map (tree_objects, (tree_object,i)=> {
    
        let tree = tree_object.tree;
        var t = tree.render("#tree_" + i, {
        height:svgSize, 
        width:300,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=>0
       } );
      
        t.node_label ((n)=>{
            if (n.children && n.children.length) return "";
            return n.data.name.substr (0,10);
        });
      
          function sort_nodes (asc) {
          tree.traverse_and_compute (function (n) {
                  var d = 1;
                  if (n.children && n.children.length) {
                      d += d3.max (n.children, function (d) { return d["count_depth"];});
                  } 

                  n["count_depth"] = d;
              });
          tree.resort_children (function (a,b) {
              return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
          });
        }

        sort_nodes (true);
        t.style_nodes ((e,n) => {
           if (n.children && n.children.length) return; 
           if (variants.indexOf (n.data.name) >= 0) {
              e.style ("fill", "firebrick"); 
           } else {
              e.style ("fill", null); 
           }
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });
        t.style_edges ((e,n) => {
           if (n.target.children && n.target.children.length) return; 
           if (variants.indexOf (n.target.data.name) >= 0) {
              e.style ("stroke", "firebrick"); 
           } else {
              e.style ("stroke", null); 
           }
        });
        t.placenodes();
        t.update();
         return t;      
    });
}
```

```js
phylotree=require ("https://dl.dropboxusercontent.com/s/i528j2lqnyzknit/phylotree.js")
```

```js
import { table } from "@gampleman/table"
```

```js echo
pako = require('pako@2.1.0/dist/pako.min.js')
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
import {localFileInput} from "@mbostock/localfile"
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
