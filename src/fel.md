```js
import * as d3 from "npm:d3";
import * as _ from "npm:lodash-es";
import * as phylotree from "npm:phylotree";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as ss from "./chi-squared.js";
import * as colors from "./color-maps.js";
import {FileAttachment} from "observablehq:stdlib";
```

```js
const table_colors = {
      'Diversifying' : colors.binary_with_gray[0],
      'Neutral' : colors.binary_with_gray[1],
      'Purifying' : colors.binary_with_gray[2],
    };
const dyn_range_cap = 10;
const vl = vegaLiteApi.register(vega, vegaLite);
```

# FEL analysis result visualization


```js
const results_json = await FileAttachment("./data/fel_test_data.json").json();
const has_srv = _.chain(results_json.MLE.content).some ((d)=>_.some (d,(dd)=>dd[0] > 0 && dd[0] != 1)).value()
const has_ci = results_json ["confidence interval"]
const has_T = _.some (_.map (results_json.MLE.content, (d)=>_.some(d, (dd)=>dd[5] > 0.)))
const has_pasmt = results_json.MLE["LRT"]
```

```js
function get_sites_table() {
    const results    = [];
    const headers  = _.clone(results_json.MLE.headers);
    const format = {};
    

    format [headers[0][0]]  = (d)=>d.toFixed (3);
    format [headers[1][0]]  = (d)=>d.toFixed (3);
    format [headers[2][0]]  = (d)=>d.toFixed (3);
    format [headers[3][0]]  = (d)=>d.toFixed (3);
    format [headers[4][0]]  = (d)=>d <= pv ? html`<b>${d.toFixed (4)}</b>` : d.toFixed (4);
    if (has_pasmt) {
        format[headers[headers.length-1][0]] = format [headers[4][0]];
    }
    format [headers[5][0]]  = (d)=>d.toFixed (3);
    headers.push (["class","Site classification at p<=" + pv]); 
    format["class"] = (d)=>html`<span style = "color:${table_colors[d]}">${d}</span>`;
  
    _.each (results_json.MLE.content, (data, part)=> {
        const site_lookup = results_json["data partitions"][part].coverage[0];
        _.each (data, (row, i)=> {
              let row_object = {
                  'partition' : (+part) + 1,
                  'codon' : site_lookup [i] + 1
              };  
              row_object[headers[0][0]] = +row[0];
              row_object[headers[1][0]] = +row[1];
              row_object[headers[2][0]] = +row[2];
              row_object[headers[3][0]] = +row[3];
              row_object[headers[4][0]] = +row[4];
              if (has_T) {
                  row_object[headers[5][0]] = +row[5];
              }
              if (has_ci) {
                  row_object[headers[6][0]] = row[6];
                  row_object[headers[7][0]] = row[7];
                  row_object[headers[8][0]] = row[8];
              }
              if (has_pasmt) {
                  row_object [headers[headers.length-2][0]] = row[ headers.length-2];
              }
              row_object[headers[headers.length-1][0]] = row[4] <= pv ? (row[0] < row[1] ? "Diversifying" : "Purifying") : (row[0] + row[1] ? "Neutral" : "Invariable");
              results.push (row_object);
        });
       
        
    });
    return [format, results, headers];
}

const sites_table = get_sites_table();
const siteTableData = _.filter (sites_table[1], (x)=>table_filter.indexOf (x.class)>=0);
const tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map ((d)=>_.map (d, (dd)=>_.filter (dd, ddd=>ddd == "test"))).map ((d)=>d.length).value())
const variable_site_count = d3.sum(_.chain (results_json.MLE.content).map ((d)=>_.filter (d, (dd)=>dd[0]+dd[1] > 0)).map (d=>d.length).value())
```

```js
function qq(v) {
  let vs = _.map (_.sortBy (v), (v)=> v <0 ? 0. : v);
  let qq = [{'bs' : 0, 'c2' : 0}];
  _.each (vs, (v, i)=> {
      qq.push ({'bs' : (i+1)/vs.length, 'c2' : ss.cdf (v, 1)});
  });
  qq.push ([{'bs' : 1, 'c2' : 1}]);
  return _.map (qq, (d)=>({'bs' : 1-d.bs, 'c2' : 1-d.c2}));
}
```

FEL analysis was performed on the alignment from <tt>${results_json.input["file name"]}</tt>. Statistical significance is evaluated based on  ${results_json.simulated  ? "<tt>" + results_json.simulated + "</tt> site-level parametric bootstrap replicates"  : "the asymptotic &chi;<sup>2</sup> distribution"}. This analysis **${has_srv? "includes" : "does not include"}** site to site synonymous rate variation. ${has_ci ? "Profile approximate confidence intervals for site-level dN/dS ratios have been computed." : ""}

<small>**Suggested citation**: <tt><small>${results_json.analysis["citation"]}</small></tt></small>

```js
const pv = view(Inputs.text({label: html`<b>p-value threshold</b>`, value: "0.1", submit: "Update"}));
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
  <div class="stati midnight_blue left ">
  <i class="icon-share icons"></i>
  <div>
  <b>${tested_branch_count}</b>
  <span>median branches/partition used for testing</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati midnight_blue left ">
  <i class="icon-check icons"></i>
  <div>
  <b>${variable_site_count}</b>
  <span>non-invariant sites tested</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati midnight_blue left ">
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
  <div class="stati amethyst left ">
  <i class="icon-plus icons"></i>
  <div>
  <b>${_.filter (sites_table[1], (d)=>d.class == "Diversifying").length}</b>
  <span>Sites under diversifying positive selection at p≤${pv}</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati  amethyst left ">
  <i class="icon-minus icons"></i>
  <div>
   <b>${_.filter (sites_table[1], (d)=>d.class == "Purifying").length}</b>
  <span>Sites under purifying selection at p≤${pv}</span>
  </div> 
  </div>
</td></tr>
</table>

```js
function get_fig1data() {
   let in_set = new Set (_.map (table1, (d)=>d.codon));
   return _.filter (siteTableData, (x)=>in_set.has (x.codon));
}
const fig1data = get_fig1data();
```

```js
const plot_options = [["Site-level dN/dS estimates",(d)=>d["confidence interval"]],["alpha/beta site-level estimates", (d)=>1], ["Bootstrap vs asymptotic p-value", (d)=>has_pasmt], ["Rate density plots", (d)=>1], ["Q-Q plots", (d)=>has_pasmt], ["Dense rate plot", (d)=>1]]
const plot_legends = {
  "Site-level dN/dS estimates" : "Maximum likelihood estimates of dN/dS at each site, together with estimated profile condifence intervals (if available). dN/dS = 1 (neutrality) is depicted as a horizontal gray line. Boundaries between partitions (if present) are shown as vertibal dashed lines.",
  "alpha/beta site-level estimates": "Maximum likelihood estimates of synonymous (α) and non-synonymous rates (β) at each site shown as bars. The line shows the estimates under the null model (α=β). Estimates above " + dyn_range_cap +" are censored at this value.",
  "Dense rate plot" : "Maximum likelihood estimates of synonymous (α) and non-synonymous rates (β) at each site. Estimates above " + dyn_range_cap +" are censored at this value. p-values are also shown",
  "Bootstrap vs asymptotic p-value" : "Comparison of site-level p-values for non-neutrality using parametric bootstrap and the asymptotic approximation. Rejection region (p ≤ " + pv + ") is shown as a shaded rectangle",
  "Rate density plots" : "Kernel density estimates of site-level rate estimates. Means are shown with red rules. Estimates above " + dyn_range_cap +" are censored at this value.",
  "Q-Q plots" : "Comparison of asymptotic vs boostrap LRT distributions (limited to 60 sites)."
}

function seqNames(tree) {
    let seq_names = [];
    tree.traverse_and_compute (n=>{
        if (n.children && n.children.length) return;
        seq_names.push (n.data.name);
    });
    return seq_names;
};

const tree_objects = _.map (results_json.input.trees, (tree,i)=> {
  let T = new phylotree.phylotree (tree);
  T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name]["Global MG94xREV"];
  return T;
});

function totalTreeLength(tree) {
  let L = 0;
  tree.traverse_and_compute ( (n)=> {
     if (tree.branch_length (n)) {
      L += +tree.branch_length (n);
     }
  });
  return L;
}

function rate_density(data) {
    let rate_options = [["alpha","α"],["beta","β"], ["omega", "dN/dS"]];
    
    return {
        "data" : {"values" : _.map (data, 
        (d)=> {
            let dd = _.clone (d);
            _.each (["alpha","beta","dN/dS MLE"], (f)=> {
                dd[f] = Math.min (dyn_range_cap, dd[f]);
            });
            
            return dd;
        })}, 
        "transform" : [{"calculate" : "min(" + dyn_range_cap + ",datum.alpha > 0 ? datum.beta/datum.alpha : datum.beta > 0 ? 10000 : 0)", "as" : "omega"}],
        "vconcat" : _.map (rate_options, (rt)=>({"layer" : [{
        "width": 800, "height": 100, 
        "transform":[{
            "density": rt[0],
            "bandwidth": 0.2
        }],
        "mark": {type: "area", "opacity" : 0.5, tooltip : true, line : true},
        "encoding": {
            "x": {
                "field": "value",
                "grid" : null,
                "title": rt[1],
                "type": "quantitative",
                "scale" : {"domain" : [0, dyn_range_cap]},
                "axis": {"grid": false}
            },
            "y": {
                "field": "density",
                "type": "quantitative",
                "title" : "",
                "axis": {"grid": false}
            },
            "color" : {"value" : "grey"}
        }},
        {
            "mark": "rule",
            "encoding": {
                "x": {"aggregate": "mean", "field": rt[0]},
                "color": {"value": "firebrick"},
                "size": {"value": 5},
            }
        },
        {
            "transform": [
                {"aggregate": [{"op": "mean", "field": rt[0], "as": "rate_mean_" + rt[0]}]},
                {"calculate": "format(datum['rate_mean_"+rt[0]+"'], '.2f')", "as": "fm1"}
            ],
            "mark": {
                "type": "text",
                "color": "gray",
                "size" : 12,
                "align": "left",
                "y": -5,
                "x": 2
            },
            "encoding": {
                "x" : {"field" : "rate_mean_" + rt[0], "type": "quantitative"},
                "text": {"type": "nominal", "field": "fm1"}
            }
        }]})
        )            
    }
}
function qq_plot(data, title) {
    return {
    "data": {"values": data},
    "title" : title,
    "layer" : [{
        "mark": {"type" : "line", "color" : "firebrick", "clip" : true},
        "width" : 100,
        "height" : 100,
        "encoding": {
            "x": {
                "field": "bs",
                "type" : "quantitative",
                "scale" : {"domain" : [0,0.25]},
                "axis" : {"grid" : false, "title" : "Bootstrap p-value", "labelFontSize" : 12, "titleFontSize" : 14}
            },
            "y": {"field": "c2", "type" : "quantitative","axis" : {"grid" : false, "title" : "Asymptotic p-value", "labelFontSize" : 12, "titleFontSize" : 14}, "scale" : {"domain" : [0,0.25]}}
        }
    },{
        "mark": {
            "type": "rule",
            "color": "grey",
            "strokeWidth": 1,
            "opacity" : 0.5,
            "clip" : true
        },
        "encoding": {
            "x": {
                "datum": {"expr": "0"},
                "type": "quantitative",
            },
            "y": {
                "datum": {"expr": "0"},
                "type": "quantitative",
            },
            "x2": {"datum": {"expr": "1"}},
            "y2": {"datum": {"expr": "1"}}
    }}]
}}

function pv_plot(data) {
    let color_d = [];
    let color_r = [];
    _.each (table_colors, (v,c)=> {color_d.push (c); color_r.push (v);});
    
    return {
        "width": 500, "height": 500, 
        "data" : {"values" : data},
        "transform" : [{"calculate" : "(datum['p-value'] -" + pv + ")* (datum['p-asmp'] -" + pv + ") >= 0 ? 'Yes' : 'No'", "as": "agree"}],
        "layer" : [
           {
            "mark" : {"opacity": 0.1, "type": "rect", "color": "#DDD"},
            "encoding": {
                "x": {
                  "datum": {"expr": "0"},
                  "type": "quantitative",
                 
                },
                "y": {
                  "datum": {"expr": "0"},
                  "type": "quantitative",
                  
                },
                "x2": {"datum": {"expr": pv}},
                "y2": {"datum": {"expr": pv}}
              }
          },
           {
             "mark" : {"type" : "point", "size" : 96, "tooltip" : {"content" : "data"}, "filled" : true, "opacity" : 0.4},
             "encoding" : {
               "x": {
                "field": "p-value",
                "type" : "quantitative",
                "scale" : {"type" : "sqrt"},
                "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Bootstrap p-value"}
               },
               "y": {
                  "field": "p-asmp",
                  "type" : "quantitative",
                   "scale" : {"type" : "sqrt"},
                  "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Asymptotic p-value"}
              }, 
              "color" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"},
              "shape": {
                  "field" : "agree",
                  "title" : "Both p-values agree",
                "scale" : {"domain" : ["Yes","No"], "range" : ["circle", "cross"]}
                }
             }
           }
          ]
    }
  }
  
  function dNdS_with_ci(data, from, step) {
    let color_d = [];
    let color_r = [];
    _.each (table_colors, (v,c)=> {color_d.push (c); color_r.push (v);});
    return {
        "width": {"step": 12},
        "data" : {"values" : _.map (
          _.filter (data, (d,i)=>i+1 >= from && i<= from + step),
        (d)=> {
            let dd = _.clone (d);
            _.each (["dN/dS LB","dN/dS UB", "dN/dS MLE"], (f)=> {
              dd[f] = Math.min (dyn_range_cap, dd[f]);
            });
            return dd;
        })}, 
        "transform" :[{"calculate": "1", "as": "neutral"}],
        "encoding": {
          "x": {
            "field": "codon",
            "type" : "nominal",
            "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Codon"}
          }
        },
        "layer": [
          {
            "mark": {"opacity": 1., "type": "line", "color": "steelblue"},
            "encoding": {
              "y": {
                "field": "dN/dS LB",
                "scale" : {"type" : "sqrt"},
                "type" : "quantitative",
                "axis": {"titleColor": "black", "grid" : false, "titleFontSize" : 14, "title" : "dN/dS"}
              },
              "y2": {
                "field": "dN/dS UB",
                "type" : "quantitative"
              }
            }
          },
          {
            "mark": {"stroke": "black", "type": "point", "filled" : true, "size" : 64, "stroke" : null, "tooltip" : {"contents" : "data"}},
            "encoding": {
              "y": {
                 "field": "dN/dS MLE",
                  "type" : "quantitative",
              },
              "color" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
            }
          },
          /*{
            "mark": {"stroke": "lightgrey", "type": "line", "size" : 1, "opacity" : 1.},
            "encoding": {
              "y": {
                 "field": "dN/dS MLE",
                  "type" : "quantitative",
              },
            }
          }*/
          {
            "mark" : {"opacity": 0.5, "type": "line", "color": "gray"},
            "encoding" : { "y": {
                "field": "neutral",
                "type" : "quantitative",
              },
               
              "x": {
              "field": "codon",
              "type" : "nominal"},
              "size": {"value": 2},
            }
          }
          
        ]
    };
  }
  
  function alpha_beta_plot(data, from, step) {
    let color_d = [];
    let color_r = [];
    _.each (table_colors, (v,c)=> {color_d.push (c); color_r.push (v);});
    return {
        "width": {"step": 12},
        "data" : {"values" : _.map (
          _.filter (data, (d,i)=>i+1 >= from && i< from + step-1),
        (d)=> {
            let dd = _.clone (d);
            _.each (["alpha","beta", "alpha=beta"], (f)=> {
              dd[f] = Math.min (dyn_range_cap, dd[f]);
            });
            dd.alpha = -dd.alpha;
            return dd;
        })}, 
        "transform" :[{"calculate": "0", "as": "neutral"},
                      {"calculate": '-datum["alpha=beta"]', "as": "amb2"}],
        "encoding": {
          "x": {
            "field": "codon",
            "type" : "nominal",
            "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Codon"}
          }
        },
        "layer": [
          {
            "mark" : {"opacity": 0.5, "type": "line", "color": "gray"},
            "encoding" : { "y": {
                "field": "neutral",
                "type" : "quantitative",
              },
               
              "x": {
              "field": "codon",
              "type" : "nominal"},
              "size": {"value": 2},
            }
          },
          {
            "mark": {"type": "bar", "filled" : true, "stroke" : null, "opacity" : 0.5, "tooltip" : {"contents" : "data"}},
            "encoding": {
              "y": {
                 "field": "alpha",
                  "type" : "quantitative",
                  "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Rate estimate", "labelExpr": "datum.label > 0 ? 'β = ' + datum.label: (toNumber(datum.label) == '0' ? '0' : 'α = ' + replace (datum.label, /[^0-9\.]/,''))"}
              },
              "fill" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
            }
          },
          {
            "mark": { "type": "bar", "filled" : true, "opacity" : 0.5, "stroke" : null, "tooltip" : {"contents" : "data"}},
            "encoding": {
              "y": {
                 "field": "beta",
                  "type" : "quantitative",
              },
              "fill" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
            }
          },
          {
            "mark": {"opacity": 1., "type": "line", "color": "#444"},
            "encoding": {
              "y": {
                "field": "alpha=beta",
                "type" : "quantitative"
              },
              "y2": {
                "field": "amb2",
                "type" : "quantitative"
              }
            }
          }
          
        ]
    };
  }
  
  function denser_plot(data) {
    let columns = [["alpha","α"],["beta","β"],["p-value", "p-value"]];
    return {
        "data" : {"values" : _.map (data,
        (d)=> {
            let dd = _.clone (d);
            _.each (columns, (f)=> {
              dd[f[0]] = Math.min (dyn_range_cap, dd[f[0]]);
            });
            return dd;
        })}, 
        
        "vconcat" : _.map (columns, (cc,i)=> ({
          "width" : 800,
          "height" : 50,
          "mark": {"type": "area", "color" : "lightblue", "stroke" : "black", "interpolate" : "step"},
          "encoding": {
            "x": {
              "field": "codon",
              "type" : "quantitative",
              "axis": {"grid" : false, "titleFontSize" : 14, "title" : i == columns.length -1 ? "Codon" : null}
            },
            "y": {
                   "field": cc[0],
                    "type" : "quantitative",
                    "axis": {"grid" : false, "titleFontSize" : 14, "title" : cc[1]}
                }
          }}))
    };
  }

const plot_specs = {
  "Site-level dN/dS estimates" : {
  "width": 800, "height": 200, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return dNdS_with_ci (fig1data, d, 70)
  })},
  "alpha/beta site-level estimates" : {
  "width": 800, "height": 200, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return alpha_beta_plot (fig1data, d, 70)
  })},
  "Bootstrap vs asymptotic p-value": pv_plot (fig1data),
  "Rate density plots" : rate_density (fig1data),
  "Dense rate plot" : denser_plot(fig1data),
  "Q-Q plots" : has_pasmt ? {
    "columns": 5,
    "hconcat": _.map (_.map (_.filter (table1, (d)=>d.class != "Invariable").slice (0,60), (d)=>[d.partition, d.codon]), (d)=>qq_plot (qq(_.map (results_json.MLE.LRT[d[0]-1][d[1]-1], (d)=>(d[0]))), "Site "+d[1]))
  } : null
}
```

```js
const table_filter = view(Inputs.checkbox(
  ["Diversifying", "Purifying", "Neutral","Invariable"], 
  {
    value: ["Diversifying", "Purifying", "Neutral", "Invariable"], 
    label: html`<b>Show</b>`, 
    format: x => html`<span style="text-transform: capitalize; border-bottom: solid 2px ${table_colors[x]}; margin-bottom: -2px;">${x}`
  }
));
```

```js
const plot_type =  view(Inputs.select(_.map (_.filter (plot_options, (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`}))
```

**Figure 1**. ${plot_legends[plot_type]}

```js
const plot = vl.render({"spec": plot_specs[plot_type]});
```
<div>${plot}</div>

**Table 1**. Detailed site-by-site results from the FEL analysis

```js
const table1 = view(Inputs.table (siteTableData, {
  rows : 15,
  format: sites_table[0]
}));
```

<details>
    <summary><b>Table column definitions</b></small></summary>
<small>
<dl>
${_.map (sites_table[2], (d)=>"<dt><tt>"+d[0]+"</tt></dt><dd>" + d[1] + "</dd>")}
</dl>
</small>
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
