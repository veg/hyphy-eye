# NRM (non-reversible model) result summary

```js
viewof nrm_results_file = params.get ("url") ? localFileInput({accept: ".json", value : params.get ("url"), disable: true}) : localFileInput({accept: ".json"}) 
```

```js
summaryBox = html`<table style = 'font-size: 12px; width: 100%;'>
<tr>
<td style = 'width: 33%;'>
  <div class="stati asbestos left ">
  <i class="icon-options-vertical icons"></i>
  <div>
  <b>${nrm_results_json.input["number of sequences"]}</b>
  <span>sequences in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-options icons"></i>
  <div>
  <b>${nrm_results_json.input["number of sites"]}</b>
  <span>sites in the alignment</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati asbestos left ">
  <i class="icon-arrow-up icons"></i>
  <div>
  <b>${floatFmt(tree_length_by_model[nrm_best_model])}</b>
  <span>Tree Length (subs/site)</span>
  </div> 
  </div>
</td>
</tr>
<tr>
<td style = 'width: 33%;'>
  <div class="stati midnight_blue left ">
  <i class="icon-location-pin icons"></i>
  <div>
  <b>${nrm_best_model}</b>
  <span>Best model</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati midnight_blue left ">
  <i class="icon-info icons"></i>
  <div>
  <b>${floatFmt(getTestResult ("GTR","NREV12"))}</b>
  <span>p-value non-reversible</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati midnight_blue left ">
  <i class="icon-info icons"></i>
  <div>
  <b>${floatFmt(getTestResult ("NREV12","NREV12+F"))}</b>
  <span>p-value root frequencies</span>
  </div> 
  </div>
</td>
</tr>
</table>
`
```

```js
summary=md`Model comparison was run on \`${nrm_results_json["input"]["file name"]}\`. The best-fitting model (based on AIC-c) is **${nrm_best_model}**. 

Based on the comparison of the general reversible (GTR) and non-reversible models (NREV12), there ${report_result(getTestResult ("GTR","NREV12"))} for the <b>non-reversibility of the evolutionary process</b>.

Based on the comparison of the non-reversible model which estimate root character frequencies (NREV12+F) and the model which assumes that these equal empirical frequencies (NREV12), there ${report_result(getTestResult ("NREV12","NREV12+F"))} for the <b>difference in root character frequencies from the distribution implied by the sequences</b>.`
```

```js
viewof table1 = Inputs.table (modelTableData, {
  sort: "AIC-c",
  rows : 4,
})
```

```js
table1caption=md`**Table 1**. Summary of model fit, overall tree lengths (subs/site), and corresponding equilibrium frequencies (EF) for each model. Note that the GTR model has the same EF as the base composition of the underlying dataset (empirical frequencies).`
```

```js
viewof modelForQ = Inputs.select(_.map (nrm_model_summary, (d)=>d[0]), {value: "NREV12", label: "Substitution model"})
```

```js
qMatrixColorLegend = Legend(qMatrixColorScale, {
  title: "Relative rate"
})
```

```js
viewof table2 = Inputs.table (qMatrixTableData, {
  rows : 4,
  format: {
      'A' : sparkbar(qMaxRate),
      'C' : sparkbar(qMaxRate),
      'G' : sparkbar(qMaxRate),
      'T' : sparkbar(qMaxRate)
  }
})
```

```js
table2caption=md`**Table 2**. Rate matrix (**Q**) for the substitution model <tt>${modelForQ}</tt>. The A&lrarr;G rate is used as the reference (=1.0) for identifiability.`
```

```js
viewof fig1x = Inputs.select(_.map (nrm_model_summary, (d)=>d[0]), {value: nrm_best_model, label: "x"})
```

```js
viewof fig1y = Inputs.select(_.filter (_.map (nrm_model_summary, (d)=>d[0]), (d)=>d!=fig1x), {value: "GTR", label: "y"})
```

```js
fig1_label=md`**Figure 1**. Compare branch length estimates by model (note that because GTR is not able to properly estimate the relative branch lengths of root descendants, the plot excludes those two branches)`
```

```js
vegalite ({
  "data": {"values": nrm_branch_lengths},
  "width" : 400,
  "height" : 400,
  "layer" : [{
      "mark": {type: "point", "opacity" : 0.5, "size" : 36, tooltip :  {"content": "data"}, filled : true, clip : true},
      "encoding": {
            "x": {"field": fig1x, "type": "quantitative", 
            "title" : fig1x,
            "axis" : {"grid" : false, titleFontSize: 18},
           
            },
            "y": {"field": fig1y ,
                  "title" :  fig1y,
                  "axis" : {"grid" : false, titleFontSize: 18},
                  "type": "quantitative",
           },
            "stroke" : {"value": "black"},
            "color" : {"value" : "grey"}
          }  
      },
      {
      "mark": {
        "type": "line",
        "color": "firebrick",
        "clip": true,
      },
      "transform": [
        {
          "regression": fig1y,
          "on": fig1x,
           "method" : "linear"
        }
        //{"calculate" : "datum.GTR_dsn*1.284", "as" : "rgr"}
      ],
      "encoding": {
        "x": {
          "field": fig1x,
          "type": "quantitative"
        },
        "y": {
          "field": fig1y,
          "type": "quantitative"
        }
      }
    },
    {
      "transform": [
        {
          "regression": fig1y,
          "on": fig1x,
           "method" : "linear",
          "params": true
        },
      {"calculate": "'y=' + format(datum.coef[0], '.4f') + '+' + format(datum.coef[1], '.4f') + 'x; R²: '+format(datum.rSquared, '.2f')", "as": "R2"}      ],
      "mark": {
        "type": "text",
        "color": "firebrick",
        "x": "width",
        "size" : 16,
        "align": "right",
        "y": -5
      },
      "encoding": {
        "text": {"type": "nominal", "field": "R2"}
      }
    }
    ]
})
```

```js
fig2label = md`**Figure 2.** Phylogenetic tree renderings show branch lengths under the selected model, and also how the selected measure of differences in base frequencies evolves over the tree. Node bubbles show the difference between the model induced base frequencies and the frequencies observed in the corresponding sequence.`
```

```js
viewof treeDim = text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"})
```

```js
viewof treeLabels = Inputs.checkbox(
   ["show internal","sequence names","align tips","show frequencies"],{"value" : ["sequence names","show internal"], label: html`<b>Tree labels</b>` })
```

```js
viewof modelForTree = Inputs.select(_.map (nrm_model_summary, (d)=>d[0]), {value: nrm_best_model, label: "Substitution model"})
```

```js
viewof distanceFunction = Inputs.select(availableDistances, {value: "Jensen Shannon", label: "Distance"})
```

```js
treeMatrixColorLegend = Legend(treeMatrixColorScale, {
  title: "Distance",
  tickFormat : "g"
})
```

```js
figure2 = dT.show()
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
nrm_model_summary = _.chain (nrm_results_json["fits"]).map ((v,m)=>[m,v ["AIC-c"]]).sortBy((d)=>d[1]).value()
```

```js
nrm_best_model = nrm_model_summary [0][0]
```

```js
nrm_branch_lengths = {
    let bl = [];
    _.each (nrm_results_json["branch attributes"]["0"], (d,b)=> {
        if (!rootChildren.has (b)) {
          let r = {'name' : b};
          _.each (nrm_model_summary, (m)=>r[m[0]] = d[m[0]]);
          bl.push (r);
        }
    });
    return bl;
}
```

```js
tree_length_by_model = _.chain (_.keys(nrm_results_json.fits)).map ((d)=>{return [d,d3.sum (_.map (nrm_results_json["branch attributes"]["0"], (bv)=>bv[d]))]}).fromPairs().value()
```

```js
floatFormat = d3.format ("2g")
```

```js
getTestResult = (m1,m2)=> {
  return nrm_results_json["test results"][m1 + " vs " + m2]["Corrected P-value"];
}
```

```js
modelTableData = {
  return _.chain (tree_length_by_model).map((i,d)=> {
      return {
        'Model' : d,
        'AIC-c' : nrm_results_json["fits"][d]["AIC-c"],
        'Tree length' : tree_length_by_model[d],
        'f(A)' : nrm_results_json["fits"][d]["Equilibrium frequencies"][0][0],
        'f(C)' : nrm_results_json["fits"][d]["Equilibrium frequencies"][0][1],
        'f(G)' : nrm_results_json["fits"][d]["Equilibrium frequencies"][0][2],
        'f(T)' : nrm_results_json["fits"][d]["Equilibrium frequencies"][0][3]

      };
  }).value();
}
```

```js
qMaxRate = d3.max(_.map (nrm_results_json["fits"][modelForQ]["Rate Distributions"], (d)=>d3.max(d)))
```

```js
qMatrixColorScale = d3.scaleSequential([0,qMaxRate],d3.interpolateWarm)
```

```js
treeMatrixColorScale = dT.color_scale
```

```js
qMatrixTableData = {
   let rates = [];
   let rm = nrm_results_json["fits"][modelForQ]["Rate Distributions"];
   const nucs = nrm_results_json["characters"][0];
   _.each (nucs, (from, i)=> {
      let row = {'From/To' : from};
      _.each (nucs, (to, j)=> {
          if (i!=j) {
            row[to] = rm[i][j];
          } else {
             row[to] = null;
          }
      });
      rates.push (row);
   });
   return rates;
}
```

```js
nrm_results_json = await get_json (params.get ("url"))
```

```js
d3 = require ("d3")
```

```js
dT = display_tree(0)
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
report_result = (p)=> {
  let sup = "";
  if (p <= 0.05) {
      sup = "**is** evidence";
  } else {
      sup = "**is no** evidence";
  }
  return sup + " (p=" + floatFmt(p) + ")";
}
```

```js
_=require("lodash")
```

```js
tree_objects = _.map (nrm_results_json.input.trees, (tree,i)=> {
  let T = new phylotree.phylotree (tree);
  T.branch_length_accessor = (n)=>nrm_results_json["branch attributes"][i][n.data.name][modelForTree];
  return T;
});
```

```js
rootChildren = {
  let rt = new Set();
  tree_objects[0].traverse_and_compute ((n)=> {
    if (n.parent && !n.parent.parent) {
        rt.add (n.data.name);
    }
  });
  return rt;
}
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
import {Legend, Swatches} from "@d3/color-legend"
```

```js
phylotree=require ("phylotree")
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
function sparkbar(max) {
  return x => htl.html`<div style="
    background: ${qMatrixColorScale(x)};
    width: ${100 * x / max}%;
    float: right;
    padding-right: 3px;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    justify-content: end;">${x.toLocaleString("en")}`
}
```

```js
display_tree = (i) => {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
 
      let T = tree_objects[i];
      var t = T.render({
        height:dim && dim[0] || 1024, 
        width:dim && dim[1] || 600,
        'align-tips' : treeLabels.indexOf ("align tips") >= 0,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=> 0,
        'draw-size-bubbles' : true,
        'node-span':(n)=> n.children ? 0.0 : 1,
        'internal-names' : treeLabels.indexOf ("show internal") >= 0
       } );


      let showSeqNames = treeLabels.indexOf ("sequence names") >= 0;
      let showFrequencies = treeLabels.indexOf ("show frequencies") >= 0;
      let distanceIndex = availableDistances.indexOf (distanceFunction);
  
       t.nodeLabel ((n)=> {
          let label = "";
          if (showSeqNames) label += n.data.name;
          if (showFrequencies) {
              try {
                let distances = nrm_results_json["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0];
                if (distanceIndex == 0)
                  label += " " + _.map (nrm_results_json["characters"][0], (d,i)=> d + ":" + floatFmt (distances[i])).join (', ');
                else 
                  label += " " + nrm_results_json["characters"][0][distanceIndex-1] + ":" + floatFormat (distances[distanceIndex-1]);
              } catch {};
          }
          return label;
      });

  
      let js_max = 0;

      _.each (T.getTips(), (n)=> {
              let js = nodeDistance (nrm_results_json["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0],nrm_results_json["branch attributes"]["0"][n.parent.data.name][modelForTree + " frequencies"][0]);
               js_max = js > js_max ? js : js_max;
               //console.log (n);
          
      });

   
      _.each (T.getInternals(), (n)=> {
          try {
            if (n.parent) {
                let js = nodeDistance (nrm_results_json["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0],nrm_results_json["branch attributes"]["0"][n.parent.data.name][modelForTree + " frequencies"][0]);
                 js_max = js > js_max ? js : js_max;
                 //console.log (n);
            }
          }  catch {};
      });
  
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
           let js = nodeDistance (nrm_results_json["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0],nrm_results_json["branch attributes"]["0"][n.data.name]["Observed frequencies"][0]);
           e.selectAll ("circle").style ("fill", t.color_scale (js));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });

        t.color_scale = d3.scaleSequentialLog([1e-10,js_max],d3.interpolateWarm);
        //treeMatrixColorScale.domain ([0,js_max]);

        t.style_edges ((e,n) => {
           e.style ("stroke", null);
           if (n.source.parent) {
             let js = nodeDistance (nrm_results_json["branch attributes"]["0"][n.source.data.name][modelForTree + " frequencies"][0],nrm_results_json["branch attributes"]["0"][n.target.data.name][modelForTree + " frequencies"][0]);
             e.style ("stroke", t.color_scale (js));
           }
        });
        t.placenodes();
        t.update();
        return t;      
    }
```

```js
get_json = async (json_source)=>  {
  if (json_source) {
      return d3.json (json_source);
  }
  return nrm_results_file.json();
}
```

```js
params = new URLSearchParams(location.search)
```

```js
entropy = (d)=> {
    return -d3.sum (_.map (d, (e)=>Math.log2 (e)*e));
}
```

```js
jensenShannonDistance = (dist1, dist2)=> {
    let smoothed = _.map (dist1, (d,i)=> 0.5*(d+dist2[i]));
    return entropy (smoothed) - 0.5 * (entropy (dist1) + entropy (dist2));
}
```

```js
availableDistances = ["Jensen Shannon", "|ΔA|", "|ΔC|", "|ΔG|", "|ΔT|"]
```

```js
nodeDistance = (d1,d2)=> {  
    let i = availableDistances.indexOf (distanceFunction);
    if (i == 0) return jensenShannonDistance (d1,d2); 
    return Math.abs (d1[i-1]-d2[i-1]);
}
  
 
```

```js
import {localFileInput} from "@mbostock/localfile"
```

```js
cssStyles = html`<style>
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
simpleIcons = html`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.css">`
```
