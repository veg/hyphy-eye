```js
md`# MEME analysis result visualization`
```

```js
viewof results_file = params.get ("url") ? localFileInput({accept: [".json",".gz"], value : params.get ("url"), disable: true}) : localFileInput({accept: [".json",".gz"]}) 
```

```js
analysis_summary()
```

```js
viewof pv = Inputs.text({label: html`<b>p-value threshold</b>`, value: "0.1", submit: "Update"})
```

```js
citation = md`<small>**Suggested citation**: <tt><small>${results_json.analysis["citation"]}</small></tt></small>`
```

```js
summary_table = html`<table style = 'font-size: 12px; width: 100%;'>
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
  <i class="icon-layers icons"></i>
  <div>
  <b>${has_resamples ? has_resamples : "N/A"}</b>
  <span>bootstrap replicates</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati pomegranate left ">
  <i class="icon-plus icons"></i>
  <div>
  <b>${count_sites} </b>
  <span>sites subject to episodic diversifying selection</span>
  </div> 
  </div>
</td>
</tr>
<tr>
<td>
  <div class="stati midnight_blue left ">
  <i class="icon-share icons"></i>
  <div>
  <b>${selected_branches_per_selected_site}</b>
  <span>median branches with support for selection/selected site</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati midnight_blue left ">
  <i class="icon-energy icons"></i>
  <div>
  <b>${count_sites_with_variation}</b>
  <span>sites with variable &omega; across branches</span>
  </div> 
  </div>
</td>
</tr>
</table>
`
```

#### Alignment-wide results

```js
viewof plot_type =  Inputs.select(_.map (_.filter (plot_options, (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`})
```

```js
fig1caption=md`**Figure 1**. ${plot_type ? plot_legends[plot_type] : "No plotting options available"}`
```

```js
figure1 = plot_type ? vegalite (plot_specs[plot_type]) : md``
```

```js
viewof table_filter = Inputs.checkbox(["Diversifying", "Neutral","Invariable"], {value: ["Diversifying", "Neutral", "Invariable"], label: html`<b>Show</b>`, format: x => html`<span style="text-transform: capitalize; border-bottom: solid 2px ${table_colors[x]}; margin-bottom: -2px;">${x}`})
```

```js
viewof table_options = Inputs.checkbox(["Distribution plot","Show q-values","Show substitutions (tested branches)"], {value: ["Show q-values"], label: html`<b>Options</b>`})
```

```js
table1caption=md`**Table 1**. Detailed site-by-site results from the MEME analysis`
```

```js
viewof table1 = Inputs.table (sites_table[1], {
  rows : 20,
  format: sites_table[0],
  layout: "auto",
  header: sites_table[2]
})
```

```js
viewof tree_id =  autoSelect ({options:treeViewOptions[0], size : 10, title: html`<b>Tree to view</b>`, placeholder : "Select partition / codon tree to view"})
```

```js
viewof branch_length =  Inputs.select(_.chain (results_json["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "unconstrained", label: html`<b>Branch length </b>`})
```

```js
viewof treeLabels = Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips"],{"value" : ["amino-acids"], label: html`<b>Tree labels</b>` }
)
```

```js
viewof color_branches =  Inputs.select(tree_color_options,{value: "Support for selection", label: html`<b>Color branches </b>`})
```

```js
viewof shade_branches =  Inputs.select(tree_color_options.concat ("None"),{value: "None", label: html`<b>Opaqueness of branches </b>`})
```

```js
viewof treeDim = text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"})
```

```js
{
  tree_id;
  if (figure2 && figure2.color_scale) {
      return Legend(figure2.color_scale, {
      title: figure2.color_scale_title,
      tickFormat: "f"
    });
  }
  return html``;
}
```

```js
{
  if (figure2) {
      return figure2.show();
  }
  return md`### Select a tree option from the menu above to view`;
}
```

#### Code, data, and libraries

```js
html`
      <link rel=stylesheet href='${resolve("phylotree@0.1/phylotree.css")}'>
      <div id="tree_container"></div>`
```

```js
results_json = await get_json (params.get ("url"))
```

```js
figure2 = {
    let toDisplay = tree_id.split (" ");
    if (toDisplay.length > 1) {
      if (toDisplay[0] == "Codon") {  
          const codon_index = (+toDisplay[1]);
          let partition_id = siteIndexPartitionCodon [codon_index][0]-1;
          let TT = display_tree_site (partition_id, codon_index);
          return TT;
      } 
      let TT = display_tree((-1) + (+toDisplay[1]));
      return TT;
    }
    return null;
}
```

```js
floatFormat = d3.format (".4g")
```

```js
proportionFormat = d3.format (".5p")
```

```js
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
    return JSON.parse (pako.inflate(await results_file.arrayBuffer(), { to: 'string' }));//results_file.json();
  } catch {}
  return results_file.json();
}
```

```js
count_sites = _.chain (results_json["MLE"]["content"]).mapValues ((d)=>_.filter (d, (r)=>r[6] <= +pv).length).values().sum().value()
```

```js
count_sites_with_variation = has_site_LRT ? _.chain (results_json["MLE"]["content"]).mapValues ((d)=>_.filter (d, (r)=>r[11] <= +pv).length).values().sum().value() : "N/A"
```

```js
selected_branches_per_selected_site = count_sites ? (_.chain (results_json["MLE"]["content"]).mapValues ((d)=>_.filter (d, (r)=>r[6] <= +pv)).mapValues ((d)=>_.sum(_.map (d, (r)=>r[7]))).values().sum().value() / count_sites).toFixed (2) : "N/A"
```

```js
fig1data = {
   let in_set = new Set (_.map (table1, (d)=>d.Codon));
   return _.filter (siteTableData[0], (x)=>in_set.has (x.Codon));
}
```

```js
plot_legends = ({
  "p-values for selection" : "P-values derived from the " + (has_resamples ? "parametric bootstrap" : "asymptotic mixture &Chi;<sup>2</sup> ")  + " test statistic for likelihood ratio tests for episodic diversifying selection. Solid line = user selected significance threshold.",
  "p-values for variability" : "P-values derived from the asymptotic mixture &Chi;<sup>2</sup><sub>2</sub> test statistic for likelihood ratio tests for variable &omega; at this site. Solid line = user selected significance threshold.",
  "Site rates" : "Site-level rate maximum likelihood estimates (MLE). For each site, the horizontal tick depicts the synonymous rate (α) MLE. Circles show non-synonymous (β- and β+) MLEs, and the size of a circle reflects the weight parameter inferred for the corresponding rate. The non-synonymous rate estimates are connected by a vertical line to enhance readability and show the range of inferred non-synonymous rates and their relationship to the synonymous rate. Estimates above " + dyn_range_cap +" are censored at this value.",
  "Dense rate plot" : "Maximum likelihood estimates of synonymous (α), non-synonymous rates (β-, β+), and non-synonymous weights (p-,p+) at each site. Estimates above " + dyn_range_cap +" are censored at this value. p-values for episodic diversifying selection are also shown",
  "Rate density plots" : "Kernel density estimates of site-level rate estimates. Means are shown with red rules. Estimates above " + dyn_range_cap +" are censored at this value.",
  "Support for positive selection": "Empirical Bayes Factors for ω>1 at a particular branch and site (only tested branches are included).",
"Q-Q plots" : "Comparison of asymptotic vs boostrap LRT distributions (limited to 60 sites)."
})
```

```js
plot_options = [["p-values for selection", (d)=>true],["p-values for variability", (d)=>has_site_LRT], ["Site rates", (d)=>true], ["Support for positive selection", (d)=>bsPositiveSelection.length > 0],["Dense rate plot", (d)=>1], ["Rate density plots", (d)=>1],["Q-Q plots", (d)=>has_resamples]]
```

```js
plot_specs = (
{
  "p-values for selection" : {
  "width": 800, "height": 150, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return ERPlot (fig1data, d, 70, siteTableData[2][6][2], "p-value for selection", true, "log")
  })},
  "p-values for variability" : {
  "width": 800, "height": 150, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return ERPlot (fig1data, d, 70, has_site_LRT ? siteTableData[2][11][2] : [], "p-value for variability", true, "log")
  })},
  "Site rates" : {
  "width": 800, "height": 150, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return alpha_beta_plot (fig1data, d, 70)
  })},
  "Rate density plots" : rate_density (fig1data),
  "Dense rate plot" : denser_plot(fig1data),
  "Support for positive selection" : {
    "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return BSPosteriorPlot (bsPositiveSelection, d, er_step_size())
    })},
  "Q-Q plots" : has_resamples ? {
  "columns": 6,
  "hconcat": _.map (_.map (_.filter (table1, (d)=>d.class != "Invariable").slice (0,60), (d)=>[d.Partition, d.Codon]), (d)=>qq_plot (qq(_.map (results_json.MLE.LRT[d[0]-1][d[1]-1], (d)=>(d[0]))), "Site "+d[1]))}
     : null
}
)
```

```js
siteTableData = {
  let site_info = [];
  let index = 0;
  let show_distribution = table_options.indexOf ('Distribution plot') >= 0;
  let show_q_values = table_options.indexOf ('Show q-values') >= 0;
  let show_substitutions = table_options.indexOf ('Show substitutions (tested branches)') >= 0;
  const mle_headers = _.map (results_json["MLE"]["headers"], (d)=>{
      d[2] = ( (md`${d[0]}`).innerText);
      return d;
  });

  let q_values = [];
  
  _.each (results_json["data partitions"], (pinfo, partition)=> {
       const mle_data = results_json["MLE"]["content"][partition];
      _.each (pinfo["coverage"][0], (ignore, i)=> {
              let site_record = {
                  'Partition' : siteIndexPartitionCodon[index][0],
                  'Codon' : siteIndexPartitionCodon[index][1]
              };

              if (show_distribution) {
                   site_record['dN/dS'] = omega_plot (mle_data[i]);
              } 
              _.each (mle_headers, (info, idx)=> {
                  if (idx < 8) {
                    site_record[info[2]] = mle_data[i][idx];
                  }
              });

              let site_class = "Neutral";
              if (mle_data[i][0] == 0 && mle_data[i][1] == 0 && mle_data[i][3] == 0) {
                   site_class = "Invariable";
              } else {
                 if (mle_data[i][6] <= +pv) {
                    site_class = "Diversifying";
                 }
              }
          
              if (show_q_values) {
                  site_record['q'] = 1;
                  q_values.push ([site_info.length, mle_data[i][6]]);
              }

              if (show_substitutions) {
                    site_record['Substitutions'] = generateSubstitutionLists (tree_objects[partition],results_json["substitutions"][partition][i],results_json.tested[partition]);
              }
        
              site_record['class'] = site_class;
        
        
              site_info.push (site_record);
              index++;
          })  
        
      });

      if (show_q_values) {
          q_values = _.map (_.sortBy (q_values, (d)=>d[1]), (d,i)=> [d[0],d[1]*results_json.input["number of sites"]/(i+1)]);
          _.each (q_values, (d)=> {
            site_info[d[0]]['q'] = Math.min (1,d[1]);
          });
      }
     
  
    let options = {
      'Partition' : html`<abbr title = "Partition">Part.</abbr>`,
      'Codon' : html`<abbr title = "Site">Codon</abbr>`,
      'class' :  html`<abbr title = "Site classification">Class</abbr>`,
      'dN/dS' :  html`<abbr title = "dN/dS distribution at this site">dN/dS</abbr>`
    };
    _.each (mle_headers, (info, idx)=> {
        if (idx == 0) {
          options[info[2]] = html`<abbr title = "${info[1]}">${info[0]}</abbr>`;
        } else 
          if (idx != 8) {
            options[info[2]] = html`<abbr title = "${info[1]}">${info[0]}</abbr>`;
          }
    });
    return [site_info, options,mle_headers];
}
```

```js
tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map((d)=>_.filter (_.map (d), (d)=>d=="test").length).value())
```

```js
has_resamples = _.get (results_json, ["MLE","LRT"]) ? _.sample (_.get (results_json, ["MLE","LRT"])["0"]).length : 0
```

```js
has_substitutions = _.get (results_json, ["substitutions"])
```

```js
has_site_LRT = _.find (_.get (results_json, ["MLE","headers"]), (d)=>d[0] == "Variation p")
```

```js
has_background = _.get (results_json, ["fits","Unconstrained model","Rate Distributions","Background"])
```

```js
table_colors = ({
      'Diversifying' : '#e3243b',
      'Neutral' : '#444',
      'Invariable' : '#CCC'
    })
```

```js
omega_rate_classes=2
```

```js
test_omega = getRateDistribution (["fits","Unconstrained model","Rate Distributions","Test"])
```

```js
getRateDistribution = (keys, tags)=> {
    tags = tags || ["omega", "proportion"];
    const rate_info = _.get (results_json, keys);
    if (rate_info) {
      return _.sortBy (_.map (rate_info, (d)=>({
        "value" : d[tags[0]],
        "weight" : d[tags[1]]
      })), (d)=>d.rate);
    }
    return null;
}
```

```js
siteIndexPartitionCodon = {
    return _.chain (results_json['data partitions']).map ((d,k)=>_.map (d['coverage'][0], (site)=>[+k+1,site+1])).flatten().value();
}
```

```js
sites_table = {
    return [
        {'class' : (d)=>html`<span style = "color:${table_colors[d]}">${d}</span>`, 
          'Substitutions' : (d)=>d.length == 0 ? "-" : html`<ul style='margin: 0px; padding: 0px; font-family: monospace; list-style-type: none;'><li>${_.map (d, (c)=>"<b>"+c[1]+"</b> " + c[0]).join ("</li><li>")}</li></ul>`,
         'dN/dS' : (d)=>renderNDiscreteDistributions ([d],{"height" : 20, "width" : 200, "scale" : "sqrt"})}, _.filter (siteTableData[0], (x)=>table_filter.indexOf (x.class)>=0), siteTableData[1]];
}
```

```js
bsPositiveSelection = posteriorsPerBranchSite ()
```

```js
computeER = (prior, posterior) => {
    if (prior < 1) prior = prior / (1-prior); else prior = Infinity;
    if (posterior < 1) posterior = posterior / (1-posterior); else posterior = Infinity;
    if (posterior > 0) {
        return posterior / prior;
    } else {
        if (prior == 0) return 1;
        return Infinity;
    }
}
```

```js
posteriorsPerBranchSite = (rate_class)=> {
  rate_class = rate_class || 1;
  let results = [];
  let offset = 0;
  _.each (results_json["branch attributes"], (data, partition) => {
      let partition_size = 0;
      _.each (data, (per_branch, branch)=> {
          
          if (per_branch ["Posterior prob omega class by site"]) {
            _.each (per_branch ["Posterior prob omega class by site"][rate_class], (p,i)=> {
                let prior = results_json['MLE']['content'][partition][i][4];
                results.push ({'Branch' : branch, 'Codon' : i + offset + 1, 'Posterior' : p, 'ER' : computeER (prior, p)});
            });     
            partition_size = per_branch ["Posterior prob omega class by site"][rate_class].length;
          }
      });
      offset += partition_size;
  });
  return results;
}
```

```js
mutliHitER = (key)=> {
  let results = [];
  let offset = 0;
  _.each (results_json["branch attributes"], (data, partition) => {
      let partition_size = 0;
      _.each (data, (per_branch, branch)=> {
          if (per_branch [key]) {
            _.each (per_branch [key], (p,i)=> {
                results.push ({'Branch' : branch, 'Codon' : p[0] + offset, 'ER' : p[1]});
            });     
            partition_size = results_json["data partitions"][partition]["coverage"][0].length;
          }
      });
      offset += partition_size;
  });
  return results;
}
```

```js
generateNodeLabels = (T, labels)=> {
    let L = {};
    T.traverse_and_compute (function (n) {
        if (n.data.name in labels) {
            L[n.data.name] = [labels[n.data.name], translate_ambiguous_codon (labels[n.data.name]),'',0];
            if (n.parent) {
              L[n.data.name][2] = L[n.parent.data.name][0];             
              _.each (L[n.data.name][0], (c,i)=> {
                  const c2 = L[n.data.name][2][i];
                  if (c2 != c && c != '-' && c2 != '-') {
                    L[n.data.name][3] ++;
                  }
              });
            }
        } else {
          if (n.parent) {
            L[n.data.name] = _.clone (L[n.parent.data.name]);
            L[n.data.name][2] = L[n.data.name][0];
            L[n.data.name][3] = 0;
          } else {
            L['root'] = [labels["root"], translate_ambiguous_codon (labels["root"]), "", 0];
          }
        }
    },"pre-order");
    return L;
}
```

```js
generateSubstitutionLists = (T, labels, test_set)=> {
    if (!labels) return [];
    let L = {};
    let subs = {};
    T.traverse_and_compute (function (n) {
        if (n.data.name in labels) {
            L[n.data.name] = [labels[n.data.name], translate_ambiguous_codon (labels[n.data.name]),'',0];
            if (n.parent) {
              L[n.data.name][2] = L[n.parent.data.name][0];             
              _.each (L[n.data.name][0], (c,i)=> {
                  const c2 = L[n.data.name][2][i];
                  if (c2 != c && c != '-' && c2 != '-') {
                    L[n.data.name][3] ++;
                  }
              });
              if (L[n.data.name][3] && test_set[n.data.name] == "test") {
                  let sub;
                  if (L[n.parent.data.name][0] < L[n.data.name][0]) {
                    sub = L[n.parent.data.name][0] + "(" + L[n.parent.data.name][1] + "):" + L[n.data.name][0] + "(" + L[n.data.name][1] + ")"; } else {
                sub = L[n.data.name][0] + "(" + L[n.data.name][1] + "):" + L[n.parent.data.name][0] + "(" + L[n.parent.data.name][1] + ")";
                  }
                  if (sub in subs) {
                      subs[sub]++;
                  } else {
                      subs[sub] = 1;
                  }
                    
              }
            }
        } else {
          if (n.parent) {
            L[n.data.name] = _.clone (L[n.parent.data.name]);
            L[n.data.name][2] = L[n.data.name][0];
            L[n.data.name][3] = 0;
          } else {
            L['root'] = [labels["root"], translate_ambiguous_codon (labels["root"]), "", 0];
          }
        }
    },"pre-order");
    return _.sortBy (_.toPairs (subs), d=>-d[1]);
}
```

```js
treeNodeOrdering = (index)=> {
    let order = [];
    const T = tree_objects[index];
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
    T.traverse_and_compute (function (n) {
        if (results_json.tested[index][n.data.name] == "test") {
          order.push (n.data.name);
        }
    });
    return order;
}
```

```js
distMean = (d)=> {
    let m = 0;
    _.each (d, (r)=> {
        m += r['value'] * r['weight'];
    });
    return m;
}
```

```js
distVar = (d)=> {
    let m2 = 0, m = distMean (d);
    _.each (d, (r)=> {
        m2 += r['value']*r['value'] * r['weight'];
    });
    return m2 - m*m;
}
```

```js
er_step_size = ()=> {
    let N = results_json.input["number of sequences"];
    if (N < 100) return 70;
    if (N < 200) return 140;
    return 600;
}
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
dyn_range_cap = 10000
```

```js
rate_density = (data)=> {
  let rate_options = [["α","α"],["β-","β-"],["β+","β+"]];
  
  return {
    "data" : {"values" : _.map (data, 
      (d)=> {
          let dd = _.clone (d);
          _.each (["α","β-","β+"], (f)=> {
            dd[f] = Math.min (dyn_range_cap, dd[f]);
          });
          
          return dd;
      })}, 
       "transform" : [{"calculate" : "min(" + dyn_range_cap + ",datum.alpha > 0 ? datum.beta/datum.alpha : datum.beta > 0 ? 10000 : 0)", "as" : "omega"}],
    
       "vconcat" : _.map (rate_options, (rt)=>({"layer" : [{
         "width": 800, "height": 100, 
         "transform":[{
            "density": rt[0],
           // "bandwidth": 0.2
          }],
          "mark": {type: "area", "opacity" : 0.5, tooltip : true, line : true},
          "encoding": {
            "x": {
              "field": "value",
              "grid" : null,
              "title": rt[1],
              "type": "quantitative",
              //"scale" : {"domain" : [0, dyn_range_cap]},
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
          {
            "aggregate": [{"op": "mean", "field": rt[0], "as": "rate_mean_" + rt[0]}]
          },
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
```

```js
qq_plot = (data, title)=> {
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
        }},{
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
```

```js
pv_plot = (data)=> {
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
```

```js
ERPlot = (data, from, step, key, label, low, scale_type)=> {
  let scale = d3.extent (data, (d)=>d[key]); 
  scale_type = scale_type || "linear";
  scale[1] = Math.min (dyn_range_cap,Math.max (scale[1], pv));
  if (scale_type == "log") scale[0] = Math.max (scale[0], 1e-20);
  //scale = d3.nice (scale[0], scale[1], 10);
  return {
      "width": {"step": 12},
      "data" : {"values" : _.map (
        _.filter (data, (d,i)=> i >= from -1 && i < from + step -1), // -1 because 0 indexing && // remove "=" from the latter "<="
      (d)=> {
          let dd = _.clone (d);
          _.each ([key], (f)=> {
            dd[f] = Math.min (dyn_range_cap, dd[f]);
            if (scale_type == "log") {
              dd[f] = Math.max (1e-20, dd[f]);
            }
          });
          return dd;
      })}, 
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "nominal",
          "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Codon"}
        }
      },
      "layer": [
        {
          "mark": {"stroke": "black", "type": "line", "size" : 2, "interpolate" : "step", "color" : "lightgrey", "opacity" : 0.5},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                "scale" : {"type" : scale_type, "domain" : scale},
                "axis" : {"grid" : false, "title" : label}
            }
          }
        },
        {
          "mark": { "stroke": "black", "type": "point", "size" : 100, "filled" : true,  "color" : (low ? "lightgrey" : "firebrick"), "tooltip" : {"contents" : "data"}, "opacity" : 1.},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                
            },
            "color" : {"condition": {"test": "datum['" + key + "'] " + (low ? "<=" : ">=") + pv, "value": "firebrick"},
                "value": "lightgrey"
            }
          }
        },
        {
          "mark" : {"opacity": 0.5, "type": "line", "color": "steelblue"},
          "encoding" : { "y": {
                "datum": {"expr": "" + pv},
                "type": "quantitative",
                "scale" : {"domain" : scale}
              },
             
            "size": {"value": 2},
          }
        }
        
      ]
  };
}
```

```js
BSPosteriorPlot = (data, from, step)=> {
  const branch_order = treeNodeOrdering (0);
  let N = results_json.input["number of sequences"];
  let box_size = 10; 
  let font_size = 8;
  
  if (N > 50) {
      if (N <= 100) {box_size = 8; font_size = 6;}
      else if (N <= 200) {box_size = 5; font_size = 5;}
      else {box_size = 2; font_size = 0;}
  }
  let spec = {
      "width": {"step": box_size}, "height" : {"step" : box_size},
      "data" : {"values" : 
        _.filter (data, (d,i)=> d.Codon >= from && d.Codon < from + step), // remove "=" from the latter "<="
      }, 
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Codon", "labelFontSize" : font_size} : null
        },
        "y": {
          "field": "Branch",
          "scale" : {"domain" : branch_order},
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Branch", "labelFontSize" : font_size} : null
        }
      },
      "layer": [
        {
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 1.0, "tooltip" : true},
          "encoding": {
            "color": {
               "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top"},
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : "redblue", "domainMid" : 1}
            }
          }
        }
      ]
  };
  return spec;
}
```

```js
alpha_beta_plot = (data, from, step)=> {
  let color_d = [];
  let color_r = [];
  _.each (table_colors, (v,c)=> {color_d.push (c); color_r.push (v);});
  return {
      "width": {"step": 12},
      "data" : {"values" : _.map (
        _.filter (data, (d,i)=>i >= from -1 && i< from + step -1), // -1 because 0 indexing && // remove "=" from the latter "<="
      (d)=> {
          let dd = _.clone (d);
          _.each (["α","β-", "β+"], (f)=> {
            dd[f] = Math.min (dyn_range_cap, dd[f]);
          });
          //dd.alpha = -dd.alpha;
          return dd;
      })}, 
      "transform" :[{"calculate": 'max (1,-datum["p-"]*100)', "as": "w-"},
                    {"calculate": 'max (1,-datum["p+"]*100)', "as": "w+"}],
      "encoding": {
        "x": {
          "field": "Codon",
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
            "field": "Codon",
            "type" : "nominal"},
            "size": {"value": 2},
          }
        },
        {
          "mark": {"type": "tick", "filled" : true, "tooltip" : true, thickness : 4, "fill" : "black"},
          "encoding": {
            "y": {
               "field": "α",
                "type" : "quantitative",
                "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Rate MLE"},
                "scale" : {"type" : "symlog"}
                  //"labelExpr": "datum.label > 0 ? 'β = ' + datum.label: (toNumber(datum.label) == '0' ? '0' : 'α = ' + replace (datum.label, /[^0-9\.]/,''))"}
            },
          }
        },
        {
          "mark": {"type": "point", "filled" : true,  "tooltip" : true},
          "encoding": {
            "y": {
               "field": "β-",
                "type" : "quantitative",
                "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Rate MLE"},
                "scale" : {"type" : "symlog"},
              
            },
            "size" : {"field" : "p-","type" : "quantitative", "title" : "weight"},
            "fill" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
          }
        },
        {
          "mark": {"type": "point", "filled" : true,  "tooltip" : true},
          "encoding": {
            "y": {
               "field": "β+",
                "type" : "quantitative",
              
            },
            "size" : {"field" : "p+","type" : "quantitative"},
            "fill" : {"field" : "class", "scale" : {"domain" : color_d, "range" : color_r}, "title" : "Selection class"}
          }
        },
        {
          "mark": {"type": "rule", "tooltip" : true},
          "encoding": {
            "y": {
               "field": "β-",
                "type" : "quantitative",
              
            },
            "y2": {
               "field": "β+",
               "type" : "quantitative",
              
            },
          }
        }
        
        
      ]
  };
}
```

```js
denser_plot = (data)=> {
  let columns = [["α","α"],["β-","β-"],["p-","p-"],["β+","β+"],["p+","p+"],["p-value", "p-value"]];
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
            "field": "Codon",
            "type" : "quantitative",
            "axis": {"grid" : false, "titleFontSize" : 14, "title" : i == columns.length -1 ? "Codon" : null}
          },
          "y": {
                 "field": cc[0],
                  "type" : "quantitative",
                  "axis": {"grid" : false, "titleFontSize" : 14, "title" : cc[1]},
                  "scale" : "symlog"
              }
        }}))
  };
}
```

```js
_=require("lodash")
```

```js
tree_objects = _.map (results_json.input.trees, (tree,i)=> {
  let T = new phylotree.phylotree (tree);
  T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name]["Global MG94xREV"];
  return T;
});
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
subs_by_branch = (i)=>{
    let counts = {};
    _.each (results_json.substitutions[i], (states, site)=> {
        _.each (states, (state, branch)=> {
          if (branch != "root") {
              if (state != '---') {
                    counts[branch] = 1 + (counts[branch] ? counts[branch] : 0);
              }
          }
        });
    });
    return counts;
}
```

```js
site_support_by_branch = (i, key, er)=> {
    let counts = {};
    _.each (results_json["branch attributes"][i], (attribs, branch)=> {
        if (key in attribs) {
          _.each (attribs[key], (d)=> {
            if (d[1] >= er) {
              counts[branch] = 1 + (counts[branch] ? counts[branch] : 0);
            }
          });
        }});
    return counts;
}
```

```js
label_color_scale = d3.scaleOrdinal([], d3.schemeCategory10)
```

```js
qq = (v)=> {
  let vs = _.map (_.sortBy (v), (v)=> v <0 ? 0. : v);
  let qq = [{'bs' : 0, 'c2' : 0}];
  _.each (vs, (v, i)=> {
      qq.push ({'bs' : (i+1)/vs.length, 'c2' : ss.cdf (v, 1)});
  });
  qq.push ([{'bs' : 1, 'c2' : 1}]);
  return _.map (qq, (d)=>({'bs' : 1-d.bs, 'c2' : 1-d.c2}));
}
```

```js
get_prior_odds = (part,site)=> {
    const pp = results_json["MLE"]["content"][part][site][4];
    if (pp < 1) return pp/(1-pp);
    return Infinity;
}
```

```js
display_tree = (i) => {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
      let T = tree_objects[i];
      T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name][branch_length] || 0;  
      let alignTips = treeLabels.indexOf ("align tips") >= 0;
      var t = T.render({
        height:dim && dim[0], 
        width:dim && dim[1],
        'align-tips' : alignTips,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=>0,
        'internal-names' : treeLabels.indexOf ("show internal") >= 0
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
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });


        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][i][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for Selection") {
            let branch_values = {};
            let prior = test_omega[test_omega.length-1].weight;
            prior = prior / (1-prior);
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][i][n.data.name];
                if (posteriors && posteriors["Posterior prob omega clas"]) {
                    posteriors = posteriors["Posterior prob omega clas"][test_omega.length-1];
                    branch_values [n.data.name] = posteriors/(1-posteriors)/prior;
                    if (branch_values [n.data.name] < 1) branch_values [n.data.name] = null;
                }
            });
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),[0.1,1]);
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("opacity", color_scale(is_tested)).style ("stroke-width", "5").style ("stroke","firebrick"); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Substitutions") {
            let labels = subs_by_branch (i);
            let color_scale = d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolatePuOr);
            t.color_scale = color_scale;
            t.color_scale_title = "Min # of nucleotide substitutions";
            t.style_edges ((e,n) => {
             const is_tested = labels[n.target.data.name];
             if (is_tested) {
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "4").style ("opacity",1.0); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        } 
        t.placenodes();
        t.update();
        return t;      
    }

```

```js
display_tree_site = (i,s) => {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    let T = tree_objects[i];
    T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name][branch_length] || 0;  

    s = treeViewOptions[1][s][1];
    
    let node_labels = generateNodeLabels (T, results_json["substitutions"][i][s-1]);

    let labelDomain = new Set();
    let showAA = treeLabels.indexOf ("amino-acids") >= 0;
    let showCodons = treeLabels.indexOf ("codons") >= 0;
    let showSeqNames = treeLabels.indexOf ("sequence names") >= 0;
    let showOnlyMH = treeLabels.indexOf ("show only multiple hits") >= 0;
    let showOnlyNS = treeLabels.indexOf ("show only non-synonymous changes") >= 0;
    let alignTips = treeLabels.indexOf ("align tips") >= 0;
  
    var t = T.render({
      height:dim && dim[0], 
      width:dim && dim[1],
      'show-scale' : true,
      'is-radial' : false,
      'align-tips' : alignTips,
      'left-right-spacing': 'fit-to-size', 
      'top-bottom-spacing': 'fit-to-size',
      'node_circle_size' : (n)=>0,
      'internal-names' : treeLabels.indexOf ("show internal") >= 0
     } );


      t.nodeLabel ((n)=> {
          if (!n._display_me) {
              return "";
          }
          let label = "";
          if (showCodons) {
              label = node_labels[n.data.name][0];
              if (showAA) label += "/";
          }
          if (showAA) label += node_labels[n.data.name][1];
          labelDomain.add (label);
          if (showSeqNames) label += ":" + n.data.name;
          return label;
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

       T.traverse_and_compute (function (n) {
            n._display_me = ! (showOnlyMH || showOnlyNS);
         
            if (!n._display_me) {
                if (node_labels[n.data.name]) {
                    if (showOnlyMH && node_labels[n.data.name][3] > 1) n._display_me = true;
                    if (! n._display_me) {
                      if (showOnlyNS) {
                          if (n.parent) {
                              const my_aa = node_labels[n.data.name][1];
                              const parent_aa = node_labels[n.parent.data.name][1];
                              if (my_aa != parent_aa && my_aa != '-' && parent_aa != '-') {
                                  n._display_me = true;
                                  
                                  if (showOnlyMH) n._display_me = node_labels[n.data.name][3] > 1;
                              } else {
                                  n._display_me = false;
                              }
                          }
                      }
                    }
                }
            }
            if (n._display_me && n.parent) {
                n.parent._display_me = true;
            }
            
        },"pre-order");

        sort_nodes (true);
        t.style_nodes ((e,n) => {
           e.selectAll ("text").style ("fill", label_color_scale(t.nodeLabel ()(n).split (":")[0]));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
           if (shade_branches == "Tested") {
              e.style ("opacity", results_json["tested"][i][n.data.name] == "test" ? 1.0 : 0.25);
           } else {
              e.style ("opacity",1.0);
           }
        });

        if (shade_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][i][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("opacity", 1.0); 
             } else {
                e.style ("opacity", 0.25); 
             }
          });
        }  else {
           t.style_edges ((e,n) => {
              e.style ("opacity", 1.); 
          });
        }
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][i][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
            e.style ("opacity", (shade_branches != "Tested" || is_tested) ? 1.0 : 0.25); 
          });
        } else if (color_branches == "Support for selection") {
            let branch_values = {};
            let prior = get_prior_odds (i,s-1);
            //console.log (prior);
            //console.log (omega_rate_classes);
            
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][i][n.data.name];
                if (posteriors && posteriors["Posterior prob omega class by site"]) {
                    posteriors = posteriors["Posterior prob omega class by site"][omega_rate_classes-1][s-1];
                    branch_values [n.data.name] = posteriors/(1-posteriors)/prior;
                    //if (branch_values [n.data.name] < 1) branch_values [n.data.name] = null;
                    //console.log (n.data.name, posteriors);
                }
            });

            //console.log (branch_values);
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),d3.interpolateTurbo);
            t.color_scale = color_scale;
            t.color_scale_title = "Empirical Bayes Factor";
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", is_tested > 1 ? "5" : "1").style ("opacity",null); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
             e.style ("opacity", (shade_branches != "Tested" || results_json["tested"][i][n.target.data.name] == "test") ? 1.0 : 0.25); 
          });
        } else if (color_branches == "Substitutions") {
            
            let color_scale = d3.scaleOrdinal([0,1,2,3], d3.schemePuOr[4]);
            t.color_scale = color_scale;
            t.color_scale_title = "Min # of nucleotide substitutions";
            t.style_edges ((e,n) => {
             const is_tested = node_labels[n.target.data.name];
             if (is_tested && is_tested[3]) {
                e.style ("stroke", color_scale(is_tested[3])).style ("stroke-width", "5").style ("opacity","1"); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d[2] + "→" + d[0] + "(" + d[3] + ")");
             } else {
                e.style ("stroke", null); 
             }
             e.style ("opacity", (shade_branches != "Tested" || results_json["tested"][i][n.target.data.name] == "test") ? 1.0 : 0.25); 
          });
        } 
        t.placenodes();
        t.update();
        label_color_scale.domain (labelDomain);
        return t;      
    }
```

```js
treeViewOptions = {
  let opts = _.map (_.range (1,tree_objects.length+1), (d)=>"Partition " + d);
  let codonIdxToPartIdx = {};
  if (results_json.substitutions) {
    //opts = opts.concat(_.map (_.range (1,results_json.input["number of sites"]), (d)=>"Codon " + d));
    let offset = 0;
    _.each (results_json.substitutions, (sites, partition)=> {
        _.each (sites, (subs, site)=> {
          if (subs) {
            let idx = ((+site) + 1 + offset);
            codonIdxToPartIdx[idx] = [partition, (+site)+1];
            opts.push ("Codon " + idx);
          }
        })
        offset += results_json["data partitions"][partition].coverage[0].length;
    }); 
  }
  return [opts,codonIdxToPartIdx];
}
```

```js
tree_color_options = {
  let options = ["Tested"];
  if (results_json.substitutions) {
    options.push ("Support for selection");
    options.push ("Substitutions");
  }
  return options;
}
```

```js
omega_plot = (record)=>{
    const ratio = (beta, alpha)=> {
        if (alpha > 0) {
            return beta/alpha;
        }
        if (alpha == 0) {
            if (beta == 0) return 1;
        }
        return 100;
    }
    
    let alpha      = record[0];

    let rateInfo = [
      {'value' : ratio (record[1], alpha),
       'weight' : record[2]},
      {'value' : ratio (record[3], alpha),
       'weight' : record[4]},      
    ];

   return rateInfo;

}
```

```js
async function* analysis_summary () {
  yield "Waiting for the .JSON file to be loaded";

  yield md`<span style = 'font-size: 110%; color: firebrick;'>Based on the likelihood ratio test, _episodic diversifying selection_ has acted on **${count_sites}** sites in this dataset (<tt>p≤${pv}</tt>).</span> <br>MEME analysis (v<tt>${results_json.analysis.version}</tt>) was performed on the alignment from <tt>${results_json.input["file name"]}</tt> using HyPhy v<tt>${results_json.runtime}</tt>. ${has_resamples > 0 ? "This analysis used parametric bootstrap with " + has_resamples + " replicates to test for signicance." : ""} ${+results_json.analysis.version < 3.0 ? "<small><b>Some of the visualizations are not available for MEME analyses before v3.0</b>" : ""}`
}
```

```js
phylotree=require ("phylotree")
```

```js
vegalite = require ("vega-embed")
```

```js
import {select, text, input, autoSelect} from "@jashkenas/inputs"
```

```js
params = new URLSearchParams(location.search)
```

```js
import {legend} from "@d3/color-legend"
```

```js
import {localFileInput} from "@mbostock/localfile"
```

```js
import {renderDiscreteDistribution,renderTwoDiscreteDistributions} from "@spond/omega-plots"
```

```js
import {translate_ambiguous_codon} from "@spond/usual-vs-unusual-mutation-analyses"
```

```js
import {Legend, Swatches} from "@d3/color-legend"
```

```js
import {renderNDiscreteDistributions} from "@spond/omega-plots"
```

```js
ss = require('https://bundle.run/chi-squared@1.1.0')
```

```js
pako = require('pako@2.1.0/dist/pako.min.js')
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
