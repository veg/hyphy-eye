```js
md`# aBSREL analysis result visualization`
```

```js
viewof results_file = params.get ("url") ? localFileInput({accept: [".json",".gz"], value : params.get ("url"), disable: true}) : localFileInput({accept: [".json",".gz"]}) 
```

```js
intro = md`<span style = 'font-size: 1.1em; color: firebrick;'>Based on the likelihood ratio test, there **are ${results_json["test results"]["positive test results"]}** branches with evidence of _episodic diversifying selection_ in this dataset (<tt>p&leq;${floatFormat(results_json["test results"]["P-value threshold"] || 0.05)}</tt>).</span> <span style = 'font-size: 0.8em'><br>aBSREL analysis (<samp>${results_json.analysis.version}</samp>) was performed on the alignment from <samp>${results_json.input["file name"]}</samp> using HyPhy v<tt>${results_json.runtime}</tt>. <br>This analysis ** ${srv_rate_classes > 0 ? "included" : "did not include"}** site-to-site synonymous rate variation. ${_.size (mh_rates['DH']) == 0 ? "" : (_.size (mh_rates['TH'] == 0) ? "Double nucleotide substitutions were included in the model." : "Double and triple nucleotide substitutions were included in the model.")}${+results_json.analysis.version < 2.5 ? "<p><small><span class = 'stati bg-pumpkin'>Some of the visualizations are not available for BUSTED analyses before v2.5</span></small>" : ""} </span>
`
```

```js
citation = md`<details><summary><small>**Suggested citation**</summary><tt><small>${results_json.analysis["citation"]}</small></tt></small></details>`
```

```js
viewof pv = Inputs.text({label: html`<b>Evidence ratio threshold</b>`, value: "100", submit: "Update"})
```

```js
summary_table = html`<table style = 'font-size: 11px; width: 100;'>
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
  <i class="icon-grid icons"></i>
  <div>
  <b>${d3.extent (omega_rate_classes).join ("-")} </b>
  <span>&omega; rate classes per branch</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati midnight_blue left ">
  <i class="icon-layers icons"></i>
  <div>
  <b>${srv_rate_classes ? "" + srv_rate_classes + " classes" : "None"} </b>
  <span>synonymous rate variation</span>
  </div> 
  </div>
</td>
</tr>
<tr>
<td style = 'width: 33%;'>
  <div class="stati amethyst left ">
  <i class="icon-plus icons"></i>
  <div>
  <b>${results_json["test results"]["positive test results"]}</b>
  <span>branches with evidence of selection</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati  amethyst left ">
  <i class="icon-energy icons"></i>
  <div>  
  <b>${floatFmt(d3.mean (_.map (_.filter (distributionTable, (r)=>r.tested == "Yes"), (d)=>d.sites))||0)}</b>
  <span>Sites/tested branch with ER≥${pv} for positive selection</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati  amethyst left ">
  <i class="icon-target icons"></i>
  <div>
  <b>${_.size(mh_rates['DH']) ? floatFmt (d3.median (_.map (mh_rates['DH']))) : "N/A"}:${_.size(mh_rates['TH']) ?floatFmt (d3.median (_.map (mh_rates['TH']))) : "N/A"} 
  </b>
  <span>Median multiple hit rates (2H:3H)</span>
  </div> 
  </div>
</td>
</tr>
</tr>
</table>
`
```

```js
alignmentHeader = md`#### Branch-by-branch results`
```

```js
viewof rate_table = Inputs.table (distributionTable, {
  header : {'LogL' : "Log (L)", "AICc" : "AIC-c", "p" : html`<abbr title="Number of estimated parameters">Params.</abbr`, "dist" : "ω distribution", "plot" : "ω plot"},
  format : {
    'branch' : (d)=>!_.isUndefined (results_json["branch attributes"][0][d]["Corrected P-value"]) && results_json["branch attributes"][0][d]["Corrected P-value"]<=0.05 ? html`<b>${d}</b>` : d,
    'LogL' : d3.format ("2g"),
    'AICc' : d3.format ("2g"),
    'dist' : (d)=>{
        return html`<tt>
            ${_.map (d[1], (c,i)=> floatFormat(c.value) + " (" + proportionFormat (c.weight) + ") ")}
            <br>Mean = <b>${floatFormat (distMean (d[1]))}</b>, CoV = <b>${floatFormat (Math.sqrt (distVar (d[1]))/distMean (d[1]))}</b></tt>`},
     'plot' : (d)=>d[1].length > 1 ? renderDiscreteDistribution (d[1],{"height" : 40, "width" : 150, "ticks" : 2, "scale" : "log", "ref" : [1]}) : ''
  },
  layout: "auto",
  sort: "p-value",
  height: 300
})
```

```js
distComparisonPlot = rate_table.length == 2 ? renderTwoDiscreteDistributions (rate_table[0].dist[1],rate_table[1].dist[1],{"label" : {"chart" : rate_table[0].plot[0], "series" : [rate_table[0].dist[3],rate_table[1].dist[3]]}, "width" : 700, "height" : 120, "scale" : "sqrt", "margin" : {top: 5, right: 250, bottom: 30, left: 20}}) : md`<small>Select exactly two distributions to plot a side-by-side comparison</small>`
```

```js
viewof tree_id =  autoSelect ({options:treeViewOptions, size : 10, title: html`<b>Tree to view</b>`, placeholder : "Select something to view", "value" : "Alignment-wide tree"})
```

```js
viewof branch_length =  Inputs.select(_.chain (results_json["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "Baseline MG94xREV", label: html`<b>Branch length </b>`})
```

```js
viewof treeLabels = Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips","include neighboring codons","show branch labels"],{"value" : ["amino-acids","align tips"], label: html`<b>Tree labels</b>` }
)
```

```js
viewof color_branches =  Inputs.select(tree_color_options,{value: "Support for selection", label: html`<b>Color branches </b>`})
```

```js
viewof treeDim = Inputs.text({placeholder : "1024 x 800", label: "H x W (pixels)", submit: "Resize"})
```

```js
{
  tree_id;
  if (figure2 && figure2.color_scale) {
      return Legend(figure2.color_scale, {
      title: figure2.color_scale_title,
      tickFormat: "f",
      marginLeft: "10",
      marginRight: "10"
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

```js
fig1caption=md`**Figure 1**. ${plot_type ? plot_legends[plot_type] : "No plotting options available"}`
```

```js
viewof plot_type =  Inputs.select(_.map (_.filter (plot_options, (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`, value : 'Evidence ratio alignment profile'})
```

```js
viewof fig1_controls = plot_extras[plot_type] || Inputs.text({label: "Plot options", value: "None", disabled: true})
```

```js
figure1 = plot_type ? vegalite (plot_specs[plot_type]) : md``
```

```js
table1caption=md`**Table 2**. Detailed site-by-site results from the aBSREL analysis`
```

```js
viewof table1 = Inputs.table (sites_table[1], {
  rows : 10,
  format: sites_table[0],
  layout: "auto",
  header: sites_table[2]
})
```

```js
table3caption=md`**Table 3**. Detailed site-by-site results for a specific branch in the aBSREL analysis`
```

```js
viewof which_branch = multiAutoSelect({
  options: _.map ([...profilable_branches], (d)=>d),
  placeholder: "Select some branches"
})
```

```js
viewof table3 = Inputs.table (table3_data,
  {
      rows : 10,
      layout: "auto",
      columns : ["branch", "site",  "from", "to", "subs", "ER", "EBF"],
      header: {
          "branch" : "Branch",
          "site" : "Site",
          "ER": "Evidence ratio",
          "from" : "Parent",
          "to" : "Codon",
          "subs" : "# substitutions",
          "EBF" : "Empirical BF",
      }
})
```

```js
html`
      <link rel=stylesheet href='${resolve("phylotree@0.1/phylotree.css")}'>
      <div id="tree_container"></div>`
```

#### Code, data, and libraries

```js
figure2 = {
    let toDisplay = tree_id.split (" ");
    if (toDisplay.length > 1) {
      let tree_options = {  
          'branch-labels' : treeLabels.indexOf ("show branch labels") >= 0,
          'neighbors' : treeLabels.indexOf ("include neighboring codons") >= 0
      };
      
      if (toDisplay[0] == "Codon") {  
          const codon_index = (+toDisplay[1]);
          let partition_id = siteIndexPartitionCodon [codon_index-1][0]-1;
          let TT = display_tree_site (partition_id, tree_objects[0], codon_index, tree_options);
          return TT;
      } 
      let TT = display_tree(0, tree_objects[0], tree_options);
      return TT;
    }
    return null;
}
```

```js
floatFormat = d3.format (".4g")
```

```js
percentageFormat = d3.format (".2p")
```

```js
proportionFormat = d3.format (".5p")
```

```js
results_json = await get_json (params.get ("url"))
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
fig1data = {
   let in_set = new Set (_.map (table1, (d)=>d.Codon));
   return _.filter (siteTableData[0], (x)=>in_set.has (x.Codon));
}
```

```js
plot_legends = ({
  "Synonymous rates" : "Posterior means for synonymous site-level substitution rates (α). ",
  "Support for positive selection" : "Empirical Bayes Factors for ω>1 at a particular branch and site (only tested branches with 2 or more rate classes are included).",
  "Evidence ratio alignment profile" : "Evidence ratios for for ω>1 at a particular branch and site (only tested branches with an ω>1 distribution component are included). Mouse over for more information"
})
```

```js
plot_extras = ({
    'Evidence ratio alignment profile' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs'], {'label' : 'Circle size'} ),
    'Support for positive selection' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs'], {'label' : 'Circle size'} )
})
```

```js
plot_options = [
  ["Synonymous rates", (d)=>srv_rate_classes > 0 && srv_distribution], 
  ["Support for positive selection", (d)=>bsPositiveSelection.length > 0],
  ["Evidence ratio alignment profile", (d)=>profileBranchSites.length > 0]
]
```

```js
plot_specs = (
  { "Synonymous rates" : {
  "width": 800, "height": 150, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return SRVPlot (fig1data, d, 70, "SRV posterior mean", null)
  })},
  "Support for positive selection" : {
    //"autosize": {"resize" : true},
    "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return BSPosteriorPlot (bsPositiveSelection, d, er_step_size())
    })},
   "Evidence ratio alignment profile" : {
    //"autosize": {"resize" : true},
    "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return ERPosteriorPlot (profileBranchSites, d, er_step_size())
    })}
}
)
```

```js
profilable_branches = new Set (_.chain (_.get (results_json, ["Site Log Likelihood","tested"])).keys().value())
```

```js
tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map((d)=>_.filter (_.map (d), (d)=>d=="test").length).value())
```

```js
srv_rate_classes = results_json["Synonymous site-posteriors"] ? results_json["Synonymous site-posteriors"].length: 0
```

```js
srv_distribution = getRateDistribution (["fits","Full adaptive model","Rate Distributions","Synonymous site-to-site rates"], ["rate","proportion"])
```

```js
omega_rate_classes = _.map (results_json["branch attributes"]["0"], (d)=>d["Rate classes"])
```

```js
mh_rates = ({
    'DH' : _.chain(_.map (results_json["branch attributes"][0], (d,k) => [k,_.get (d, ['rate at which 2 nucleotides are changed instantly within a single codon'])])).filter (d=>!_.isUndefined(d[1])).fromPairs().value(),
    'TH' : _.chain(_.map (results_json["branch attributes"][0], (d,k) => [k,_.get (d, ['rate at which 3 nucleotides are changed instantly within a single codon'])])).filter (d=>!_.isUndefined(d[1])).fromPairs().value()
})
```

```js
test_omega = (branch)=> getRateDistribution (["branch attributes","0",branch,"Rate Distributions"],["0","1"])
```

```js
test_pv = (branch)=> _.get (results_json,["branch attributes","0",branch,"Corrected P-value"])
```

```js
distributionTable = {
  let table = [];

  let site_er = posteriorsPerBranchSite (true, pv);
  
  _.each (results_json["branch attributes"][0], (info, b)=> {
    let row = {'branch' : b};
    const is_tested = results_json["tested"][0][b] == "test";
    if (is_tested) {
        row['tested'] = 'Yes';
        row['p-value'] = info["Corrected P-value"];
        row['sites'] = site_er[b] || 0;
        
    } else {
        row['tested'] = 'No';
        row['p-value'] = null;
        row['sites'] = null;
    }
    row['rates'] = info['Rate classes'];
    row ['dist'] = ["&omega;",test_omega(b),""];
    row['plot'] = ["",row['dist'][1]];
    table.push (row);
  });
  
  
  /*_.each (["Unconstrained model", "Constrained model"], (m)=> {
      if (!_.get (results_json,["fits",m])) return;
      let record = {'Model' : m};
      record['LogL'] = _.get (results_json,["fits",m,"Log Likelihood"]);
      record['AICc'] = _.get (results_json,["fits",m,"AIC-c"]);
      record['p'] = _.get (results_json,["fits",m,"estimated parameters"]);
      record['dist'] = ["Tested", getRateDistribution (["fits",m,"Rate Distributions","Test"]),"&omega;",m + " ω tested"];
      record['plot'] = ["ω",record['dist'][1]];
      table.push (record);
      if (has_background) {
          record = {'Model' : m};
          record['dist'] = ["Background", getRateDistribution (["fits",m,"Rate Distributions","Background"]),"&omega;",m + " ω background" ];
          record['plot'] = ["ω",record['dist'][1]];
          table.push (record);
      }
      if (srv_rate_classes) {
        record = {'Model' : m};
        record['dist'] = ["Synonymous rates", getRateDistribution (["fits",m,"Rate Distributions","Synonymous site-to-site rates"], ["rate", "proportion"]),"",m + " syn rates" ];
        record['plot'] = ["",record['dist'][1]];
        table.push (record);
      }
  });*/
  return table;
  //getRateDistribution (["fits","Unconstrained model","Rate Distributions","Test"])
}
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
partition_sizes = {
    return _.chain (results_json['data partitions']).map ((d,k)=>(d['coverage'][0].length)).value();
}
```

```js
siteIndexPartitionCodon = {
    return _.chain (results_json['data partitions']).map ((d,k)=>_.map (d['coverage'][0], (site)=>[+k+1,site+1])).flatten().value();
}
```

```js
siteTableData = {
  let site_info = [];
  let index = 0;
  let bySite = _.groupBy (profileBranchSites, (d)=>d.site);
  _.each (results_json["data partitions"], (pinfo, partition)=> {
      _.each (pinfo["coverage"][0], (ignore, i)=> {
          
              let site_record = {
                  //'Partition' : siteIndexPartitionCodon[index][0],
                  'Codon' : siteIndexPartitionCodon[index][1],
              };

              const sll = _.get (results_json, ["Site Log Likelihood",'unconstrained',0,index]);
              if (sll) {
                site_record['LogL'] = sll;
              }
        
              if (srv_distribution) {
                  let site_srv = [];
                  _.each (srv_distribution, (d,i)=> {
                       site_srv.push ({'value' : d.value, 'weight' : results_json["Synonymous site-posteriors"][i][index]});
                  });
                  site_record['SRV posterior mean'] = distMean (site_srv);
              }

              site_record ["Subs"] = d3.sum (bySite[i+1], (d)=>d.subs);
              site_record ["ER"] = _.filter (bySite[i+1], (d)=>d.ER >= pv).length;
              
              site_info.push (site_record);
              index++;
          })  
        
      });
    return [site_info, {
      'Codon' : html`<abbr title = "Site">Codon</abbr>`,
      'SRV posterior mean' : html`<abbr title = "Posterior mean of the synonymous rate, α;">E<sub>post</sub>[α]</abbr>`,
      'LogL' : html`<abbr title = "Site log-likelihood under the unconstrained model">log(L)</abbr>`,
      'Subs' : html`<abbr title = "Total # of substitutions (s+ns)">Subs</abbr>`,
      'ER' : html`<abbr title = "Total # branches with evidence ratio > ${pv}">ER Branch</abbr>`,
    }];
}
```

```js
sites_table = {
    return [{}, siteTableData[0], siteTableData[1]];
}
```

```js
profileBranchSites =  {
  let results = [];
  const unc = _.get (results_json, ["Site Log Likelihood","unconstrained","0"]);
  const subs = _.get (results_json, ["substitutions","0"]);
  if (unc) {
    _.each (unc, (ll, i)=> {
        const subs_at_site = generateNodeLabels (tree_objects[0], subs[i]);
        _.each (subs_at_site, (info, node)=> {
      
             if (node != 'root') {
                const bs_ll = _.get (results_json, ["Site Log Likelihood","tested",node,0,i]);
                if (bs_ll) {
                    let bit = {};
                    bit.Key = node + "|" + (i+1);
                    bit.branch = node;
                    bit.site = i+1;
                    bit.ER = Math.exp (unc[i]-bs_ll);
                    bit.subs = info[3];
                    bit.from = info[2];
                    bit.to = info[0];
                    let sub_count = subs_for_pair (bit.from, bit.to);
                    bit.syn_subs = sub_count[0];
                    bit.nonsyn_subs = sub_count[1];
                    results.push (bit);
                }
              }
              
        });
    });
  }
  return results;
}
```

```js
posteriorsPerBranchSite = (do_counts, er)=> {
  let results = do_counts ? {} : [];
  let offset = 0;
  const subs = _.get (results_json, ["substitutions","0"]);
    
  _.each (results_json["branch attributes"], (data, partition) => {
      let partition_size = 0;
      let subs_per_site = {};
      _.each (data, (per_branch, branch)=> {
          if (per_branch ["posterior"]) {
            const prior_d = test_omega (branch);
            let prior_odds = prior_d[prior_d.length-1].weight;
            const rate_class = prior_d.length-1;
            if (prior_odds < 1 && prior_odds > 0) {
              prior_odds = prior_odds / (1-prior_odds);
              _.each (per_branch ["posterior"][rate_class], (p,i)=> {
                  if (! do_counts && (i in subs_per_site) == false) {
                      subs_per_site[i] = generateNodeLabels (tree_objects[0], subs[i])
                  }
                 
                  if (do_counts) {
                    results[branch] = (results[branch] ? results[branch] : 0) + ((p/(1-p))/prior_odds >= er);
                  } else {
                    const info = subs_per_site [i][branch];
                    let sub_count = subs_for_pair (info[2], info[0]);
                    results.push ({'Key' : branch + "|" + (i + offset + 1), 
                                   'Posterior' : p, 
                                   'ER' : (p/(1-p))/prior_odds,
                                   'subs' : info[3],
                                   'from': info[2],
                                   'to' : info[0],
                                   'syn_subs' : sub_count[0],
                                   'nonsyn_subs' : sub_count[1]
                                  });
                  }
              });
            }
            partition_size = per_branch ["posterior"][rate_class].length;
          }
      });
      offset += partition_size;
  });
  return results;
}
```

```js
characterPlot = (data, data2)=> {
  const branch_order = treeNodeOrdering (0, true);
  let N = results_json.input["number of sequences"];
  let box_size = 10; 
  let font_size = 12;

  console.log (data2);
  
  let spec = {
      "width": {"step": 2.5*font_size},  "height" : {"step" : font_size},
      "data" : {"values" : 
        data,
      }, 
      "transform" : [
        {"calculate" : "parseInt (split(datum.Key, '|')[1])", "as" : "Codon"},
        {"calculate" : "split(datum.Key, '|')[0]", "as" : "Branch"},
        {"filter": {"param": "character_view", "empty" : true}},
        {
          "lookup": "Key",
          "from": {
            "data": {"values" : data2},
            "key": "Key",
            "fields": ["ER"]
          }
        }
      ],
     
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "ordinal",
          "scale": {"domain": {"selection": "character_view", "encoding": "x"}},
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Codon", "labelFontSize" : font_size} : null
        },
        "y": {
          "field": "Branch",
          "scale": {"domain": {"selection": "character_view", "encoding": "y"}},
          "type" : "ordinal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Branch", "labelFontSize" : font_size} : null
        }
      },
      "layer": [
        {
          "mark": {"type": "text", "clip" : true, "fontSize" : font_size, "font" : "monospace", "fontWeight" : "bold", "color" : "#444", "opacity" : 1.0, "tooltip" : true},
          "encoding": {
            "text" : {"field" : "value"},
            "color": {
               "field" : "aa"
               //"field": "ER",
                //"type" : "quantitative",
                //"legend" : {"orient" : "top"},
                //"sort": "ascending",
                //"scale" : {"scheme" : "lightgreyred"}
            }
          }
        }
      ]
  };
  return spec;
}
```

```js
table3_data = {
  let rc = _.keyBy (_.filter (profileBranchSites, (d)=>which_branch.indexOf (d.branch)>=0), (d)=>d.Key);
  _.each (bsPositiveSelection, (d)=> {
      if (d.Key in rc) {
          rc[d.Key].EBF = d.ER;
      }
  });
  return _.values (rc);
     
}
```

```js
bsPositiveSelection = {
  return posteriorsPerBranchSite ();
}
```

```js
path_diff = (from,to,path)=> {
    let res = [0,0];
    let curr = _.map (from),
        next = _.clone (curr);
   
    next [path[0]] = to[path[0]];
    const is_syn = translate_ambiguous_codon (curr.join ("")) == translate_ambiguous_codon(next.join (""));
    res[is_syn ? 0 : 1] += 1;
    for (let i = 1; i < path.length; i++) {
        curr = _.clone (next);
        next [path[i]] = to[path[i]];
        const is_syn = translate_ambiguous_codon (curr.join ("")) == translate_ambiguous_codon(next.join (""));
        res[is_syn ? 0 : 1] += 1;
    }
  
    return res;
}
```

```js
subs_for_pair = (from, to) => {

    if (from == 'NNN' || to == 'NNN') {
        return [0,0];
    }
  
    let diffs = [];
    _.each (from, (c,i)=> {
      if (c != to[i]) {
          diffs.push (i);
      }
    });
    switch (diffs.length) {
      case 0:
          return [0,0];
      case 1:
          if (translate_ambiguous_codon (from) == translate_ambiguous_codon(to)) {
              return [1,0];
          }
          return [0,1];
      case 2: {
          let res = path_diff (from,to,[diffs[0],diffs[1]]);
          _.each (path_diff (from,to,[diffs[1],diffs[0]]), (d,i) => {res[i] += d;});
          return _.map (res, (d)=>0.5*d);
      }
       case 3: {
          let res = path_diff (from,to,[diffs[0],diffs[1],diffs[2]]);
          _.each (path_diff (from,to,[diffs[0],diffs[2],diffs[1]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[1],diffs[0],diffs[2]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[1],diffs[2],diffs[0]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[2],diffs[0],diffs[1]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[2],diffs[1],diffs[0]]), (d,i) => {res[i] += d;});
          return _.map (res, (d)=>d/6); 
       }
    }
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
                  if (c2 != c && c != '-' && c2 != '-' && c != 'N' && c2 != 'N') {
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
        L[n.data.name][4] = !_.isUndefined (n.children);
    },"pre-order");
    return L;
}
```

```js
treeNodeOrdering = (index, root)=> {
    let order = [];
    if (root) {order.push ('root');}
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
ERPlot = (data, from, step, key)=> {
  let scale = d3.extent (data, (d)=>d[key]); 
  scale[1] = Math.min (dyn_range_cap,Math.max (scale[1], pv));
  scale = d3.nice (scale[0], scale[1], 10);
  return {
      "width": {"step": 12},
      "data" : {"values" : _.map (
        _.filter (data, (d,i)=>i+1 >= from && i< from + step - 1),
      (d)=> {
          let dd = _.clone (d);
          _.each ([key], (f)=> {
            dd[f] = Math.min (dyn_range_cap, dd[f]);
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
                "scale" : {"type" : "symlog", "domain" : scale},
                "axis" : {"grid" : false}
            }
          }
        },
        {
          "mark": { "stroke": "black", "type": "point", "size" : 100, "filled" : true,  "color" : "lightgrey", "tooltip" : {"contents" : "data"}, "opacity" : 1.},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                
            },
            "color" : {"condition": {"test": "datum['" + key + "'] > " + pv, "value": "firebrick"},
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
SRVPlot = (data, from, step, key, key2)=> {
  let spec = {
      "width": {"step": 12},
      "data" : {"values" : _.map (
        _.filter (data, (d,i)=>i+1 >= from && i<= from + step),
      (d)=> {
          let dd = _.clone (d);
          _.each ([key], (f)=> {
            dd[f] = Math.min (dyn_range_cap, dd[f]);
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
          "mark": {"type": "line", "size" : 2, "color" : "lightgrey", "opacity" : 0.5, "interpolate" : "step"},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
            }
          }
        },
        {
          "mark": {"stroke": null, "type": "point", "size" : 100, "filled" : true, "color" : "lightgrey", "tooltip" : {"contents" : "data"}, "opacity" : 1},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                "scale" : {"type" : "symlog"},
                "axis" : {"grid" : false}
            },
            //"color" : results_json["Evidence Ratios"]["constrained"] ? {"field" : "ER (constrained)", "type" : "quantitative", "scale" : {"type" : "log", "scheme": "turbo"}, "legend" : {"orient" : "top"}} : null
          }
        }
      ]
  };
  if (key2) {
      spec.layer.push (
        {
          "mark": {"type": "line", "size" : 4, "color" : "lightgrey", "opacity" : 0.5, "interpolate" : "step", "color" : "firebrick"},
          "encoding": {
            "y": {
               "field": key2,
                "type" : "quantitative",
            }
          }
        }
      );
  }
  return spec;
}
```

```js
BSPosteriorPlot = (data, from, step)=> {
  const selected_branches = new Set (_.map (rate_table, (d)=>d.branch));
  const branch_order = _.filter (treeNodeOrdering (0), (d)=>profilable_branches.has (d) && selected_branches.has (d));
  let N = tested_branch_count;
  let box_size = 10; 
  let font_size = 8;
  var size_field = "subs";
  switch (fig1_controls) {
    case "Syn subs":
      size_field = "syn_subs";
      break;
    case "Nonsyn subs":
      size_field = "nonsyn_subs";
      break;
  }
  
  if (N > 50) {
      if (N <= 100) {box_size = 8; font_size = 6;}
      else if (N <= 200) {box_size = 5; font_size = 5;}
      else {box_size = 4; font_size = 0;}
  }
  let spec = {
      "width": {"step": box_size}, "height" : {"step" : box_size},
      "data" : {"values" : 
        _.filter (data, (d)=>selected_branches.has (d.Key.split ("|")[0]))
      }, 
      "transform" : [
        {"calculate" : "parseInt (split(datum.Key, '|')[1])", "as" : "Codon"},
        {"calculate" : "split(datum.Key, '|')[0]", "as" : "Branch"},
        {"filter" : {"field" : "Codon", "range" : [from, from+step-1]}}
      ],
      /*"params": [{
        "name": "character_view",
        "select": {
          "type": "interval",
          "encodings": ["x","y"],
          "nearest" : "true",
          "mark" : {"stroke" : "#444", "strokeWidth" : 3},
        },
        "value": {"x": _.range (20), "y": branch_order}
      }],*/
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
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 1.0, "tooltip" : {"contents" : "data"}},
          "encoding": {
            "color": {
               "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top", "title" : "EBF"},
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : "redyellowblue", "domainMid" : 1}
            }
          }
        },
        {
          "mark": {"type": "circle", "size" : 2, "stroke" : "black", "strokeWidth" : 0.5, "color" : null, "opacity" : 1.0},
          "encoding": {
            "color" : {"value" : null},
            "size": {
               "field": size_field,
                "type" : "quantitative",
                "legend" : {"orient" : "top", "title" : "# substitutions"}
            }
          }
        }
      ]
  };
  return spec;
}
```

```js
ERPosteriorPlot = (data, from, step)=> {
  
  const selected_branches = new Set (_.map (rate_table, (d)=>d.branch));
  const branch_order = _.filter (treeNodeOrdering (0), (d)=>profilable_branches.has (d) && selected_branches.has (d));
  let N = tested_branch_count;
  let box_size = 10; 
  let font_size = 8;

  var size_field = "subs";
  switch (fig1_controls) {
    case "Syn subs":
      size_field = "syn_subs";
      break;
    case "Nonsyn subs":
      size_field = "nonsyn_subs";
      break;
  }
  
  if (N > 50) {
      if (N <= 100) {box_size = 8; font_size = 6;}
      else if (N <= 200) {box_size = 5; font_size = 5;}
      else {box_size = 4; font_size = 0;}
  }
  let spec = {
      "width": {"step": box_size}, "height" : {"step" : box_size},
      "data" : {"values" : 
        _.filter (data, (d)=>selected_branches.has (d.Key.split ("|")[0]))
      }, 
      "transform" : [
        {"calculate" : "parseInt (split(datum.Key, '|')[1])", "as" : "Codon"},
        {"calculate" : "split(datum.Key, '|')[0]", "as" : "Branch"},
        {"filter" : {"field" : "Codon", "range" : [from, from+step-1]}},
      ],
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
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 0.8, "tooltip": {"content": "data"}},
          "encoding": {
            "color": {
               "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top"},
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : "redyellowblue", "domainMid" : 1}
            }
          }
        },
        {
          "mark": {"type": "circle", "size" : 2, "stroke" : "black", "strokeWidth" : 0.5, "color" : null, "opacity" : 1.0},
          "encoding": {
            "color" : {"value" : null},
            "size": {
               "field": size_field,
                "type" : "quantitative",
                "legend" : {"orient" : "top", "title" : "# substitutions"}
            }
          }
        }
      ]
  };
  return spec;
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
display_tree = (index, T, options) => {
      let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    
      T.branch_length_accessor = (n)=>(n.data.name in results_json["branch attributes"][index] ? results_json["branch attributes"][index][n.data.name][branch_length] : 0) || 0;  
      let alignTips = treeLabels.indexOf ("align tips") >= 0;
      var t = T.render({
        height: dim && dim[0], 
        width : dim && dim[1],
        'align-tips' : alignTips,
        'selectable' : false,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=>0,
        'internal-names' : treeLabels.indexOf ("show internal") >= 0
       } );
      

      add_svg_defs (t.svg);
  
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
           e.selectAll ("text").style ("font-family", "ui-monospace");
           if (n.children && n.children.length) return; 
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);

        });

    
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for selection") {
            let branch_values = {};
            t.svg.selectAll ("defs").selectAll ("linearGradient").remove();
            let branch_gradients = {};
            T.traverse_and_compute ( (n)=> {
                  let test_omegas = test_omega (n.data.name);
                  if (test_omegas) {
                    let rate_class = test_omegas.length - 1 ;
                    branch_values[n.data.name] = test_omegas[rate_class].value;
                  }
                  
                }
            );
            let color_scale = d3.scaleDivergingLog([1e-4,1,Math.min(1000,d3.max (_.map (branch_values, (d)=>d)))],["rgb(0,0,255)","rgb(128,128,128)","rgb(255,0,0)"]);
          
            let bID = 0;
            let max_omega_by_branch = {};
            T.traverse_and_compute ( (n)=> {
                  let test_omegas = test_omega (n.data.name);
                  if (test_omegas) {
                    let rate_class = test_omegas.length - 1 ;
                    branch_gradients [n.data.name] = "hyphy_phylo_branch_gradient_" + bID;
                    
                    let gradient_def = t.svg.selectAll ("defs").append ("linearGradient").attr ("id", branch_gradients [n.data.name]);
                    bID += 1;
                    let current_frac = 0;
                    _.each (test_omegas, (t)=> {
                        gradient_def.append ("stop").attr ("offset", "" + current_frac*100.0 + "%").style ("stop-color", color_scale (t.value));
                        
                        current_frac += t.weight;
                        gradient_def.append ("stop").attr ("offset", "" + current_frac*100.0 + "%").style ("stop-color", color_scale (t.value));                    });
                      max_omega_by_branch [n.data.name] = test_omegas[test_omegas.length-1];
                  }
                  
                  
                }
            ); 
            
            t.color_scale = color_scale;
            t.color_scale_title = "ω";
            t.style_edges ((e,n) => {
               const is_tested = results_json["tested"][index][n.target.data.name] == "test";
               let t_string = n.target.data.name + " ";
               let b_string = "";
               if (is_tested) {
                   let pv_l = test_pv (n.target.data.name); 
                   t_string += "(p = " + pv_l.toFixed (3) + ")";
                   pv_l = -Math.floor(Math.log10(Math.max (pv_l,1e-6)));
                   let mxo = max_omega_by_branch[n.target.data.name].value;
                   if (mxo > 1) {
                         mxo = mxo > 1000. ? ">1000" : mxo.toFixed (2);
                         b_string = mxo + "/" + (max_omega_by_branch[n.target.data.name].weight*100).toFixed (2) + "%"; 
                   }
                  
                   e.style ("stroke", "url('#" + branch_gradients[n.target.data.name] + "')").style ("stroke-width", 2 + pv_l);
               } else {
                   t_string += "(not tested)";
                   e.style ("stroke", "url('#" + branch_gradients[n.target.data.name] + "')").style ("stroke-width", "2").style ("opacity","0.5");
               }
               t_string += " max ω = " + branch_values[n.target.data.name].toFixed (2);
               e.style ("stroke-linejoin", "round").style("stroke-linecap", "round");
               e.selectAll ("title").data ([t_string]).join ("title").text ((d)=>d);
               if (options["branch-labels"]) {
                    add_branch_label (e, b_string, t.font_size, t.svg.selectAll (".phylotree-container"));
               }
            });
        } else {
            let labels;
            switch (color_branches) {
              case "Substitutions" : {  
                labels = subs_by_branch (index);
                 t.color_scale_title = "Min # of nucleotide substitutions";
                } 
                break;
              case "2-hit rate" : {  
                 labels = _.mapValues (mh_rates["DH"], d=>d.toFixed (2));
                 t.color_scale_title = "Double-nucleotide relative substitution rate (δ)";
                } 
                break;
              case "3-hit rate" : {  
                 labels = _.mapValues (mh_rates["TH"], d=>d.toFixed (2));
                 t.color_scale_title = "Three-nucleotide relative substitution rate (ψ)";
                } 
                break;
            }

            //console.log (labels, options["branch-labels"]);
          
            let color_scale = d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolateTurbo);
            t.color_scale = color_scale;

            t.svg.selectAll (".absrel-branch-labels").remove();
            
            t.style_edges ((e,n) => {
                const is_tested = labels[n.target.data.name];
                if (options["branch-labels"]) {
                    add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
                }
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "4").style ("opacity",1.0); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
                e.style ("stroke-linejoin", "round").style("stroke-linecap", "round");
          });
        }

      
      t.placenodes();
      t.update();
      //label_color_scale.domain (labelDomain);
      return t;     
}

```

```js
display_tree_handle_neighbors = (index, s, node_labels, T, options, results, site_count)=> {
  let extended_labels = {};
  if (options["neighbors"]) {
        const si = (+s)-1;
        //const site_count = partition_sizes[index];
        let joint_labels = [];
        for (let idx = si-4; idx <= si+4; idx++) {
              if (idx >= 0 && idx < site_count) {
                    if (idx != si) {
                        joint_labels.push (generateNodeLabels (T, results["substitutions"][index][idx]));
                    } else {
                        joint_labels.push (_.mapValues (node_labels, (d)=> {
                              return ["·" + d[0] + "·", "·" + d[1] + "·"] 
                        }));
                    }
              }
        } 
        _.each (node_labels, (d,k)=> {
            extended_labels [k] = [_.map (joint_labels, (slc)=> {
                return slc[k][0];
            }).join ("|"),_.map (joint_labels, (slc)=> {
                return slc[k][1];
            }).join ("|")];
        });


    }
    return extended_labels;
}

```

```js
display_tree_site = (index, T,s,options) => {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    
    T.branch_length_accessor = (n)=>results_json["branch attributes"][index][n.data.name][branch_length] || 0;  
    let node_labels = generateNodeLabels (T, results_json["substitutions"][index][(+s)-1]);
    let extended_labels = {};

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
      'selectable' : false,
      'internal-names' : treeLabels.indexOf ("show internal") >= 0
     } );

      
      add_svg_defs (t.svg);
      extended_labels = display_tree_handle_neighbors (index,s,node_labels,T,options,results_json, partition_sizes[index]);
  
  
      t.nodeLabel ((n)=> {
          if (!n._display_me) {
              return "";
          }
          let label = "";
          let has_extended_label = extended_labels[n.data.name] || node_labels[n.data.name];

          n.data.color_on = "";
          
          if (showCodons) {
                label = has_extended_label[0];
                n.data.color_on = node_labels[n.data.name][0];
                if (showAA) label += "/";
          }
        
          if (showAA) {
              label += has_extended_label[1];
              n.data.color_on = node_labels[n.data.name][1];
          }
          
          labelDomain.add ( n.data.color_on);
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
           e.selectAll ("text").style ("fill", label_color_scale(n.data.color_on));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
           e.selectAll ("text").style ("font-family", "ui-monospace");
        });
       
    
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for selection") {
            let branch_values = {};
            
            T.traverse_and_compute ( (n)=> {
              
                let posteriors = results_json["branch attributes"][index][n.data.name];
                if (posteriors && posteriors["posterior"]) {
                    let test_omegas = test_omega (n.data.name);
                    let rate_class = test_omegas.length - 1 ;
                    let prior = test_omegas[test_omegas.length-1].weight;
                    prior = prior / (1-prior);
                    posteriors = posteriors["posterior"][rate_class][s-1];
                    branch_values [n.data.name] = posteriors/(1-posteriors)/prior;
                    if (branch_values [n.data.name] < 1) branch_values [n.data.name] = null;
                }
               
            });
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),d3.interpolateTurbo);
            t.color_scale = color_scale;
            t.color_scale_title = "Empirical Bayes Factor";
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "5").style ("opacity",null); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        } else {
            let labels, color_scale = null;
            switch (color_branches) {
              case "Substitutions" : {  
                 color_scale = d3.scaleOrdinal([0,1,2,3], d3.schemePuOr[4]);
                 labels = node_labels;
                 t.color_scale_title = "Min # of nucleotide substitutions";
                } 
                break;
              case "2-hit rate" : {  
                 labels = _.mapValues (mh_rates["DH"], (d)=>d.toFixed(2));
                 t.color_scale_title = "Double-nucleotide relative substitution rate (δ)";
                } 
                break;
              case "3-hit rate" : {  
                 labels = _.mapValues (mh_rates["TH"], (d)=>d.toFixed(2));
                 t.color_scale_title = "Three-nucleotide relative substitution rate (ψ)";
                } 
                break;
            }
          
            
            t.color_scale = color_scale ||  d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolateTurbo);
            
            t.style_edges ((e,n) => {
             const is_tested = labels[n.target.data.name];
             if (color_branches == "Substitutions") {
               if (is_tested && is_tested[3]) {
                  e.style ("stroke", t.color_scale(is_tested[3])).style ("stroke-width", "5").style ("opacity","1"); 
                  const ts = is_tested[2] + "→" + is_tested[0] + "(" + is_tested[3] + ")"
                  e.selectAll ("title").data ([ts]).join ("title").text ((d)=>d);
                  if (options["branch-labels"]) {
                    add_branch_label (e, ts, t.font_size, t.svg.selectAll (".phylotree-container"));
                   }
               } else {
                  e.style ("stroke", null); 
               }
             } else {
                 e.style ("stroke", t.color_scale(is_tested)).style ("stroke-width", "4").style ("opacity","1"); 
                 if (options["branch-labels"]) {
                    add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
                 }
             }
             
          });
        } 
        t.placenodes();
        t.update();
        label_color_scale.domain (labelDomain);
        return t;      
    }
```

```js
add_branch_label = (e, text, font_size, container) => {
  const where2 = _.get (parse_svg.default(e.attr("d")),["1"]);
  //console.log (text);
  if (where2 && (text.length || _.isNumber (text))) {
      let my_id = e.attr ("id");
      if (!e.attr ("id")) {
          my_id = DOM.uid ("absrel_tree").id;
          e.attr ("id", my_id);
      }
      //t.svg.selectAll (".phylotree-container")
      let branch_label = container.selectAll ("text[label-for='" + my_id + "']").data ([text]).join ("text").attr ("label-for", my_id).text ((d)=>d).classed ("absrel-branch-labels",true).attr ("x", where2[1]).attr ("y", where2[2]).attr ("font-size", font_size * 0.8).attr ("dx","0.5em").attr ("dy", "-0.4em").style ("font-family", "ui-monospace");
      branch_label.attr ("filter","url(#tree_branchlabel_bgfill)");
  }
}
```

```js
add_svg_defs = (svg)=> {
    let filter = svg.selectAll ("defs").append ("filter").attr ("x", 0).attr ("y", 0).attr ("width", 1).attr ("height", 1).attr ("id", "tree_branchlabel_bgfill");
    filter.append ("feFlood").attr ("flood-color", "lightgray");
    filter.append ("feComposite").attr ("in", "SourceGraphic").attr ("operator", "atop");
}
```

```js
treeViewOptions = {
  let opts = ["Alignment-wide tree"];
  if (results_json.substitutions) {
    opts = opts.concat(_.map (_.range (1,results_json.input["number of sites"]+1), (d)=>"Codon " + d));
  }
  return opts;
}
```

```js
tree_color_options = {
  let options = ["Tested"];
  if (results_json.substitutions) {
    options.push ("Support for selection");
    options.push ("Substitutions");
  }
  if (_.size (mh_rates['DH'])) {
      options.push ("2-hit rate");
  }
  if (_.size (mh_rates['TH'])) {
      options.push ("3-hit rate");
  }
  
  return options;
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
import {renderDiscreteDistribution,renderNDiscreteDistributions, renderTwoDiscreteDistributions} from "@spond/omega-plots"
```

```js
import {translate_ambiguous_codon} from "@spond/usual-vs-unusual-mutation-analyses"
```

```js
import {Legend, Swatches} from "@d3/color-legend"
```

```js
import {cdsQuant} from "@spond/busted"
```

```js
import {multiAutoSelect} from "@john-guerra/multi-auto-select"
```

```js
pako = require('pako@2.1.0/dist/pako.min.js')
```

```js
parse_svg = import(/* webpackIgnore: true */ 'https://cdn.skypack.dev/parse-svg-path@0.1.2?min')
```

```js
bustedStyle = html`<style>

.stati{
  background: #fff;
  height: 4.5em;
  padding:0.5em;
  margin:0.25em 0; 
    -webkit-transition: margin 0.5s ease,box-shadow 0.5s ease; /* Safari */
    transition: margin 0.5s ease,box-shadow 0.5s ease; 
  -moz-box-shadow:0px 0.2em 0.4em rgb(0, 0, 0,0.8);
-webkit-box-shadow:0px 0.2em 0.4em rgb(0, 0, 0,0.8);
box-shadow:0px 0.2em 0.4em rgb(0, 0, 0,0.8);
}
.stati i{
  font-size:2.0em; 
} 
.stati div{
  width: calc(100% - 3.5em);
  display: block;
  float:right;
  text-align:right;
}
.stati div b {
  font-size:1.8em;
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
