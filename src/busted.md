```js
md`# BUSTED analysis result visualization`
```

```js
viewof results_file = params.get ("url") ? localFileInput({accept: [".json",".gz"], value : params.get ("url"), disable: true}) : localFileInput({accept: [".json",".gz"]}) 
```

```js
intro = md`<span style = 'font-size: 110%; color: firebrick;'>Based on the likelihood ratio test, there **is ${results_json["test results"]["p-value"]>0.05 ? "no" : ""}** evidence of _episodic diversifying selection_ in this dataset (<tt>p=${floatFormat(results_json["test results"]["p-value"])}</tt>).</span> <br>BUSTED analysis (v<tt>${results_json.analysis.version}</tt>) was performed on the alignment from <tt>${results_json.input["file name"]}</tt> using HyPhy v<tt>${results_json.runtime}</tt>. This analysis ** ${srv_rate_classes > 0 ? "included" : "did not include"}** site-to-site synonymous rate variation${srv_hmm?" with linear autocorrelation (HMM)" : ""}. ${_.isUndefined (mh_rates['DH']) ? "" : (_.isUndefined (mh_rates['TH']) ? "Double nucleotide substitutions were included in the model." : "Double and triple nucleotide substitutions were included in the model.")}${+results_json.analysis.version < 4.0 ? "<small><b>Some of the visualizations are not available for BUSTED analyses before v4.0</b>" : ""} ${contributing_sites && contributing_sites.length == 1? "\n><small style = 'color:firebrick'><i class='icon-fire icons'></i>Most of the statistical signal for episodic diversifying selection in this alignment is derived from a single codon site (**codon " + (1+contributing_sites[0])  + "**). This could be a sign of possible data quality issues, or outsized influence of a few substitutions, especially if they involve replacing multiple nucleotides along a short branch. You may want to examine the alignment at this site using BUSTED visualization tools, performing model-averaged inference, or rerunning the alignment with data at that site masked to confirm robustness of the result</small>" : ""} ${+results_json.analysis.version >= 4.5 && has_error_sink ? "<br><small style = 'color:darkgreen'>This analysis was run with the error sink category enabled</small>" : ""} 
`
```

```js
md`${has_error_sink_nt? "<details><summary style='background-color: 0xCCC; color: firebrick; font-size: 0.75em;'>Possible alignment errors detected</summary><span style='background-color: 0xCCC; color: darkorange; font-size: 0.75em;'>A " +proportionFormat (get_error_sink_rate ("Test")["proportion"]) + " fraction of the alignment (test branches" + (has_background ? ", and " + proportionFormat (get_error_sink_rate ("Background")["proportion"]) + " of background branches)"  : ")" ) + " was placed in the <b>error sink</b> rate class, meaning that misalignment or other data quality issues may be present. You may use exploratory plots and other components on this page to further explore this.</span></details>" : ""}`
```

```js
citation = md`<small>**Suggested citation**: <tt><small>${results_json.analysis["citation"]}</small></tt></small>`
```

```js
viewof pv = Inputs.text({label: html`<b>Evidence ratio threshold</b>`, value: "10", submit: "Update"})
```

```js
summary_table = html`<table style = 'font-size: 11px; width: 100%;'>
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
  <b>${omega_rate_classes} classes</b>
  <span>non-synonymous rate variation</span>
  </div> 
  </div>
</td>
<td style = 'width: 33%;'>
  <div class="stati midnight_blue left ">
  <i class="icon-layers icons"></i>
  <div>
  <b>${srv_rate_classes ? "" + srv_rate_classes + " classes" : "None"}${srv_hmm ? " HMM" : ""} </b>
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
  <b>${floatFmt(results_json["test results"]["p-value"])}</b>
  <span>p-value for episodic diversifying selection</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati  amethyst left ">
  <i class="icon-energy icons"></i>
  <div>
  <b>${results_json["Evidence Ratios"]["constrained"] ? _.filter (results_json["Evidence Ratios"]["constrained"][0], (d)=>d >= pv).length : 0}</b>
  <span>Sites with ER≥${pv} for positive selection</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati  amethyst left ">
  <i class="icon-target icons"></i>
  <div>
  <b>${!_.isUndefined(mh_rates['DH']) ? floatFmt (mh_rates['DH']) : "N/A"}:${!_.isUndefined(mh_rates['TH']) ? floatFmt (mh_rates['TH']) : "N/A"}</b>
  <span>Multiple hit rates (2H:3H)</span>
  </div> 
  </div>
</td>
</tr>
<tr>
<td style = 'width: 33%;'>
  <div class="stati nephritis left ">
  <i class="icon-bulb icons"></i>
  <div>
  <b>${results_json["Evidence Ratios"]["constrained"] ?_.filter (bsPositiveSelection, d=>d.ER >= 100).length : "N/A"}</b>
  <span>(branch, site) pairs with EBF ≥ 100</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati  nephritis left ">
  <i class="icon-tag icons"></i>
  <div>
  <b>${contributing_sites ? contributing_sites.length : "N/A"}</b>
  <span>Sites contributing most signal to EDS detection</span>
  </div> 
  </div>
</td>
<td>
  <div class="stati  amethyst left ">
  <i class="icon-target icons"></i>
  <div>
  <b>${!_.isUndefined(sub_fractions[0]) ? percentageFormat (sub_fractions[0]) : "N/A"}:${!_.isUndefined(sub_fractions[1]) ? percentageFormat (sub_fractions[1]) : "N/A"}</b>
  <span>Expected fractions of MH subs (2H:3H)</span>
  </div> 
  </div>
</td>
</tr>
</tr>
</table>
`
```

```js
alignmentHeader = md`#### Alignment-wide results`
```

```js
viewof rate_table = Inputs.table (distributionTable, {
  header : {'LogL' : "Log (L)", "AICc" : "AIC-c", "p" : html`<abbr title="Number of estimated parameters">Params.</abbr`, "dist" : "Rate distribution", "plot" : "Rate plot"},
  format : {
    'LogL' : d3.format ("2g"),
    'AICc' : d3.format ("2g"),
    'dist' : (d)=>{
        return html`<b>${d[0] + " " + d[2]}</b><br><tt>
            ${_.map (d[1], (c,i)=> floatFormat(c.value) + " (" + proportionFormat (c.weight) + ") ")}
            <br>Mean = <b>${floatFormat (distMean (d[1]))}</b>, CoV = <b>${floatFormat (Math.sqrt (distVar (d[1]))/distMean (d[1]))}</b></tt>`},
     'plot' : (d)=>renderDiscreteDistribution (d[1],{"height" : 50, "width" : 150, "scale" : "sqrt", "ref" : d[0].length == 0 ? [null] : [1]})
  },
  layout: "auto",
  height: 150 + (srv_rate_classes ? 120 : 0) + (has_background ? 120 :0)
})
```

```js
distComparisonPlot = rate_table.length == 2 ? renderTwoDiscreteDistributions (rate_table[0].dist[1],rate_table[1].dist[1],{"label" : {"chart" : rate_table[0].plot[0], "series" : [rate_table[0].dist[3],rate_table[1].dist[3]]}, "width" : 700, "height" : 120, "scale" : "sqrt", "margin" : {top: 5, right: 250, bottom: 30, left: 20}}) : md`<small>Select exactly two distributions to plot a side-by-side comparison</small>`
```

```js
viewof plot_type =  Inputs.select(_.map (_.filter (plot_options, (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`})
```

```js
viewof fig1_controls = plot_extras[plot_type] || Inputs.text({label: "Plot options", value: "None", disabled: true})
```

```js
fig1caption=md`**Figure 1**. ${plot_type ? plot_legends[plot_type] : "No plotting options available"}`
```

```js
figure1 = plot_type ? vegalite (plot_specs[plot_type]) : md``
```

```js
table1caption=md`**Table 1**. Detailed site-by-site results from the BUSTED analysis`
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
viewof tree_id =  autoSelect ({options:treeViewOptions, size : 10, title: html`<b>Tree to view</b>`, placeholder : "Select partition / codon tree to view"})
```

```js
viewof branch_length =  Inputs.select(_.chain (results_json["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "unconstrained", label: html`<b>Branch length </b>`})
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
viewof treeDim = text({placeholder : "1024 x 800", description: "Tree dimension (height x width in pixels), leave blank to auto-scale", submit: "Resize"})
```

```js
{
  tree_id;
  if (tree_id && figure2.color_scale) {
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
figure2 = {

    let toDisplay = tree_id.split (" ");
    if (toDisplay.length > 1) {
      let tree_options = {  
          'branch-labels' : treeLabels.indexOf ("show branch labels") >= 0,
          'neighbors' : treeLabels.indexOf ("include neighboring codons") >= 0
      };
      
      if (toDisplay[0] == "Codon") {  
          let codon_index = (+toDisplay[1]);
          let partition_id = siteIndexPartitionCodon [codon_index-1][0]-1;
          codon_index -= d3.sum (partition_sizes.slice (0,partition_id));
          let TT = display_tree_site (partition_id, tree_objects[partition_id], codon_index, tree_options);
          return TT;
      } 
      let pi = (-1) + (+toDisplay[1]);
      let TT = display_tree(pi, tree_objects[pi], tree_options);
      return TT;
    }
    return null;
  /*
    let toDisplay = tree_id.split (" ");
    if (toDisplay.length > 1) {
      if (toDisplay[0] == "Codon") {  
          const codon_index = (+toDisplay[1]);
          let partition_id = siteIndexPartitionCodon [codon_index-1][0]-1;
          let TT = display_tree_site (partition_id, codon_index);
          return TT;
      } 
      let TT = display_tree((-1) + (+toDisplay[1]));
      return TT;
    }
  */
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
sub_fractions = _.map (["Fraction of subs rate at which 2 nucleotides are changed instantly within a single codon", "Fraction of subs rate at which 3 nucleotides are changed instantly within a single codon"], (d)=>results_json["fits"]["Unconstrained model"]["Rate Distributions"][d])
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
  "Evidence ratio for ω>1 (constrained)" : "Evidence ratios (site level likelihood ratios) for ω>1, comparing the unrestricted model with the model where max(ω) := 1, and all other parameters are kept at their maximum likelihood values. Solid line = user selected significance threshold. <small>Values capped at " + dyn_range_cap + " for readability</small>",
  "Evidence ratio for ω>1 (optimized)" : "Evidence ratios (site level likelihood ratios) for ω>1, comparing the unrestricted model with the optimized constrained model and all other parameters are kept at their maximum likelihood values. Solid line = user selected significance threshold. <small>Values capped at " + dyn_range_cap + " for readability</small>",
  "Synonymous rates" : "Posterior means for synonymous site-level substitution rates (α). " + (srv_hmm ? "The most likely synonymous rate value, based on the Viterbi HMM path inference, is shown in dark red." : "") + "Dots are colored by the evidence ratio (constrained) in favor of positive selection acting on the corresponding site",
  "Support for positive selection" : "Empirical Bayes Factors for ω>1 at a particular branch and site (only tested branches are included).",
  "Error-sink support" : "Empirical Bayes Factors for branch/codon combinations placed in the error-sink category (only tested branches are included).",
  "Support for 2H" : "Evidence ratios for having a non-zero 2-nucleotide substitution rate (δ), comparing the unrestricted model with the model where this rate is 0 at a particular branch/site, and all other parameters are kept at their maximum likelihood values. Values less than one are **not** reported.",
  "Support for 3H" : "Evidence ratios for having a non-zero 3-nucleotide substitution rate (ψ), comparing the unrestricted model with the model where this rate is 0 at a particular branch/site, and all other parameters are kept at their maximum likelihood values. Values less than one are **not** reported.",
  "Support for 2H+3H" : "Evidence ratios for having non-zero 2 or 3-nucleotide substitution rate (δ or ψ), comparing the unrestricted model with the model where these rates are both 0 at a particular branch/site, and all other parameters are kept at their maximum likelihood values. Values less than one are **not** reported.",
  "Site-level LR support" : "Cumulative distribution of the likelihood ratio test for the BUSTED test broken down by the contributions of individual sites"
})
```

```js
plot_options = [
  ["Evidence ratio for ω>1 (constrained)", (d)=>results_json["Evidence Ratios"]["constrained"]], 
  ["Evidence ratio for ω>1 (optimized)", (d)=>results_json["Evidence Ratios"]["optimized null"]], 
  ["Synonymous rates", (d)=>srv_rate_classes > 0], 
  ["Support for positive selection", (d)=>bsPositiveSelection.length > 0], 
  ["Error-sink support", (d)=>has_error_sink_nt && get_error_sink_rate ("Test")["proportion"] > 0], 
  ["Site-level LR support", (d)=>results_json["Evidence Ratios"]["optimized null"]], 
  ["Support for 2H", (d)=>mh_rates['DH']], 
  ["Support for 3H", (d)=>mh_rates['TH']], 
  ["Support for 2H+3H", (d)=>mh_rates['DH'] && mh_rates['TH']]
]
```

```js
plot_specs = (
{
  "Evidence ratio for ω>1 (constrained)" : {
  "width": 800, "height": 150, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return ERPlot (fig1data, d, 70, "ER (constrained)")
  })},
  "Evidence ratio for ω>1 (optimized)" : {
  "width": 800, "height": 150, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return ERPlot (fig1data, d, 70, "ER (optimized null)")
  })},
  "Synonymous rates" : {
  "width": 800, "height": 150, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return SRVPlot (fig1data, d, 70, "SRV posterior mean", srv_hmm ? "SRV viterbi" : null)
  })},
  "Support for positive selection" : {
    //"autosize": {"resize" : true},
    "resolve": {"scale": {"color": "shared"}},
    "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return BSPosteriorPlot (bsPositiveSelection, d, er_step_size())
    })},//.concat (characterPlot (codonComposition (null, true), bsPositiveSelection))},
  "Error-sink support" : {
     //"autosize": {"resize" : true},
    "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return BSPosteriorPlot (bsErrorSink, d, er_step_size())
    })},//.concat (characterPlot (codonComposition (null, false), bsErrorSink))},
  "Support for 2H" : {
     "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return BSPosteriorPlot (twoHBranchSite, d, er_step_size())
   })},
  "Support for 3H" : {
     "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return BSPosteriorPlot (threeHBranchSite, d, er_step_size())
   })},
   "Support for 2H+3H" : {
     "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return BSPosteriorPlot (multiHBranchSite, d, er_step_size())
   })},
   "Site-level LR support" : cdsQuant (fig1data, "LR", "Site LR")
}
)
```

```js
plot_extras = ({
    'Support for positive selection' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs', 'None'], {'label' : 'Circle size'} ),
    'Error-sink support' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs', 'None'], {'label' : 'Circle size'} )
})
```

```js
contributing_sites = {
  let site_lr = _.sortBy (_.map (fig1data, (d,i)=>[d["LR"],i]), (d)=>-d[0]);
  const lrs = d3.sum (site_lr, (d)=>d[0]);
  if (lrs > 2) {
      let sites = [];
      let s = site_lr[0][0];
      sites.push (site_lr[0][1]);
      let i = 1;
      while (s < lrs * 0.8) {
        s += site_lr[i][0];  
        sites.push (site_lr[i][1]);
        i ++;
      }
      return sites;
  }
  return null;
  
}
```

```js
siteTableData = {
  let site_info = [];
  let index = 0;
  _.each (results_json["data partitions"], (pinfo, partition)=> {
      _.each (pinfo["coverage"][0], (ignore, i)=> {
          
              let site_record = {
                  'Partition' : siteIndexPartitionCodon[index][0],
                  'Codon' : siteIndexPartitionCodon[index][1],
              };
              if (results_json["Evidence Ratios"]['optimized null']) {
                  site_record['ER (constrained)'] = results_json["Evidence Ratios"]['constrained'][0][index];
                  site_record['ER (optimized null)'] = results_json["Evidence Ratios"]['optimized null'][0][index];
              };
              site_record['LogL'] = results_json["Site Log Likelihood"]['unconstrained'][0][index];
              if (srv_rate_classes) {
                  let site_srv = [];
                  _.each (srv_distribution, (d,i)=> {
                       site_srv.push ({'value' : d.value, 'weight' : results_json["Synonymous site-posteriors"][i][index]});
                  });
                  site_record['SRV posterior mean'] = distMean (site_srv);
                  if (srv_hmm) {
                      site_record['SRV viterbi'] = srv_distribution[results_json["Viterbi synonymous rate path"][0][index]].value;
                  }
              }
              if (results_json["Evidence Ratios"]['optimized null']) {
                 site_record['LR'] = 2*Math.log (results_json["Evidence Ratios"]['optimized null'][0][index]);
              }
              site_info.push (site_record);
              index++;
          })  
        
      });
    return [site_info, {
      'Partition' : html`<abbr title = "Partition">Part.</abbr>`,
      'Codon' : html`<abbr title = "Site">Codon</abbr>`,
      'ER (constrained)' : html`<abbr title = "Evidence ratio for positive selection (constrained null)">ER (ω>1, constr.)</abbr>`,
      'ER (optimized null)' : html`<abbr title = "Evidence ratio for positive selection (optimized null)">ER (ω>1, optim.)</abbr>`,
      'SRV posterior mean' : html`<abbr title = "Posterior mean of the synonymous rate, α;">E<sub>post</sub>[α]</abbr>`,
      'SRV viterbi' : html`<abbr title = "Most likely rate value for the synonymous rate α (Viterbi path)">α</abbr>`,
      'logL' : html`<abbr title = "Site log-likelihood under the unconstrained model">log(L)</abbr>`,
      'LR' : html`<abbr title = "Site log-likelihood ratio contribution">LR</abbr>`
    }];
}
```

```js
tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map((d)=>_.filter (_.map (d), (d)=>d=="test").length).value())
```

```js
get_error_sink_rate = (tag) => {
  let rd = _.get (results_json, ["fits","Unconstrained model","Rate Distributions", tag, "0"]);
  return rd;
}
```

```js
srv_rate_classes = _.size (results_json.fits["Unconstrained model"]["Rate Distributions"]["Synonymous site-to-site rates"])
```

```js
srv_distribution = getRateDistribution (["fits","Unconstrained model","Rate Distributions","Synonymous site-to-site rates"], ["rate","proportion"])
```

```js
omega_rate_classes = _.size (test_omega)
```

```js
partition_sizes = {
    return _.chain (results_json['data partitions']).map ((d,k)=>(d['coverage'][0].length)).value();
}
```

```js
has_background = _.get (results_json, ["fits","Unconstrained model","Rate Distributions","Background"])
```

```js
srv_hmm = "Viterbi synonymous rate path" in results_json
```

```js
mh_rates = ({
    'DH' : _.get (results_json, ['fits', 'Unconstrained model','Rate Distributions', 'rate at which 2 nucleotides are changed instantly within a single codon']),
    'TH' : _.get (results_json, ['fits', 'Unconstrained model','Rate Distributions', 'rate at which 3 nucleotides are changed instantly within a single codon'])
})
```

```js
table_colors = ({
      'Diversifying' : '#e3243b',
      'Neutral' : '#444',
      'Purifying' : 'green',
      'Invariable' : '#CCC'
    })
```

```js
countBranchesER = (er)=> {
    let prior = test_omega[omega_rate_classes-1].weight / (1-test_omega[omega_rate_classes-1].weight);
    let count = [];
    _.each (results_json["branch attributes"], (part_info, part)=> {
        _.each (part_info, (data, branch)=> {
            if (data["Posterior prob omega class"]) {
                let post =  data["Posterior prob omega class"][omega_rate_classes-1];
                post = post / (1-post);
                if (post / prior >= er) {
                    count.push ([part, branch, post/prior]);
                }
            }
        });
    });
     return count;
}
```

```js
test_omega = getRateDistribution (["fits","Unconstrained model","Rate Distributions","Test"])
```

```js
distributionTable = {
  let table = [];
  _.each (["Unconstrained model", "Constrained model"], (m)=> {
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
  });
  return table;
  //getRateDistribution (["fits","Unconstrained model","Rate Distributions","Test"])
}
```

```js
getRateDistribution = (keys, tags)=> {
    tags = tags || ["omega", "proportion"];
    const rate_info = _.get (results_json, keys);
    if (rate_info) {
      let clip_first = has_error_sink && tags[0] == 'omega';
      
      return _.sortBy (_.map (clip_first ? _.chain(rate_info).toPairs().filter ((d)=>d[0] != '0').fromPairs().value() : rate_info, (d)=>({
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
    return [{}, siteTableData[0], siteTableData[1]];
}
```

```js
posteriorsPerBranchSite = (rate_class, prior_odds)=> {
  let results = [];
  let offset = 0;
  _.each (results_json["branch attributes"], (data, partition) => {
      let partition_size = 0;
      let subs = _.get (results_json, ["substitutions",partition]);
      let subs_at_site = {};
      _.each (data, (per_branch, branch)=> {
          if (per_branch ["Posterior prob omega class by site"]) {
            _.each (per_branch ["Posterior prob omega class by site"][rate_class], (p,i)=> {
                if ((i in subs_at_site) == false) {
                     subs_at_site[i] = generateNodeLabels (tree_objects[partition], subs[i]);
                }
                const info = subs_at_site[i][branch];
                
                const sub_count = subs_for_pair (info[2],info[0])
                results.push ({
                    'Key' : branch + "|" + (i + offset + 1), 
                    'Posterior' : p, 
                    'ER' : (p/(1-p))/prior_odds,
                    'from' : info[2],
                    'to' : info[0],
                    'subs' : info[3],
                    'syn_subs' : sub_count[0],
                    'nonsyn_subs' : sub_count[1]
                  },
                );
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
viewof aliview_start = Inputs.range([1, sites_table[1].length], {label: "Start position", value : 1, step: 1})
```

```js
viewof window_span = Inputs.range([10, 50], {label: "Window width", value : 30, step: 1})
```

```js
viewof ali_type = Inputs.radio (["Codon", "Amino-acid", "Both"], {label : "Plot type", "value" : "Codon"})
```

```js
viewof color_by =  Inputs.radio (['Aminoacid'].concat (ali_color_options), {label : ali_color_options.length ? "Color By" : "", "value" : "Support for EDS"})
```

```js
{
  let lookup = null;
  if (color_by == 'Error Annotation') lookup = bsErrorSink;
  if (color_by == 'Support for EDS') lookup = bsPositiveSelection;
  
  const ctest = codonComposition ((site,partition)=>site >= aliview_start-1 && site < aliview_start + window_span-1, 0);
  let letters = _.groupBy (ctest, (d)=>d.Key);
  const aa_cut = (d)=>d.aa.length > 1 ? "#" : d.aa;
  if (lookup) {
      _.each (lookup, (d)=> {
            let c = letters[d.Key];
            if (c) {
                c[0].ER = d.ER;
                c[0].sequence = d.Key.split ("|")[0];
                c[0].site = d.Key.split ("|")[1];
            }
      });
  } else {
      _.each (letters, (d)=>{d[0].ER = aa_cut(d[0]); d[0].sequence = d[0].Key.split ("|")[0];
                d[0].site = d[0].Key.split ("|")[1];});
  }

  
  letters = _.flatten (_.map (letters));
  let sites = _.sortBy (_.uniq (_.map (ctest, (d)=>d.site)), (d)=>+d);
  let text_label = ali_type == "Codon" ? "value" : (ali_type == "Both" ? (d)=>d.value + "/" + aa_cut(d) : aa_cut);
  let text_spacing = ali_type == "Codon" ? 3 : (ali_type == "Both" ? 5 : 2.0);
  const branches = treeNodeOrdering (0, false, 1);
  const label_width = 8*d3.max (branches, (d)=>Math.min (15,d.length));
  return Plot.plot({
      marginLeft : 20 + label_width,
      width : (8*text_spacing) * sites.length + 20 + label_width,
      height : 14 * branches.length + 60,
      padding: 0,
      x : {"domain" : sites, "label" : null, tickRotate : 45},
      y : {"domain" : branches, "label" : null, tickSize: 0,  tickFormat: (d) => (d.length <= 16 ? d : d.substr (0,15) + "...")},
      color : lookup ? {scheme: "BuYlRd", "legend" : true, label: color_by, "type" : "diverging-log", "reverse" : false, symmetric: false, pivot : 1} : {"legend" : true, label: color_by, "type" : "categorical"},
      //y: {tickFormat: Plot.formatMonth("en", "short")},
      marks: [
        Plot.cell(letters, {
          y: "sequence",
          x: "site",
          fill: "ER",
          inset: 0.5,
          opacity : 0.4,
          tip : true
        }),
        
        Plot.text(letters, 
          {y: "sequence", x: "site", "text" : text_label, "fill" : "black", "fontFamily" : "monospace", "fontWeight" : 400})
      ]
    });
}
```

```js
ali_color_options = {
  let options = [];
  if (bsPositiveSelection.length) options.push ("Support for EDS");
  if (bsErrorSink.length) options.push ("Error Annotation");
  return options;
}
```

```js
codonComposition = (filter, diff_mode)=> {
  let results = [];
  let offset = 0;
  _.each (results_json["substitutions"], (data, partition) => {
      _.each (data, (per_site, site)=> {
            if (filter && ! filter (site, partition)) return;
            let info = generateNodeLabels (tree_objects[partition], per_site);
            
            if (diff_mode == false) {
                 _.each (info, (p,i)=> {
                    if (!p[4]) {
                      results.push ({'Key' : i + "|" + ((+site) + offset + 1), 'value' : p[0], 'aa' : p[1]});
                      //results.push ({'seq' : i,  "site" : ((+site) + offset + 1), 'value' : p[0], 'aa' : p[1]});
                    }
                 });
             } else {
               const root_label = info['root'][0];
               _.each (info, (p,i)=> {
                    let codon_label = _.map (p[0], (c,i)=>c == root_label[i] ? '.' : c).join ("");
                    if (i == 'root') codon_label = p[0];
                    if (!p[4]) {
                        results.push ({'Key' : i + "|" + ((+site) + offset + 1), 'value' : codon_label, 'aa' : p[1]});
                        // results.push ({'seq' : i,  "site" : ((+site) + offset + 1), 'value' : codon_label, 'aa' : p[1]});
                    }
               });
             }
            
      });
    
      offset += _.size (data);
  });
  return results;
}
```

```js
characterPlot = (data, data2)=> {
  const branch_order = treeNodeOrdering (0, false, 1);
  let N = results_json.input["number of sequences"];
  let box_size = 10; 
  let font_size = 12;

  //console.log (data2);
  
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
          "mark": {"type": "text", "clip" : true, "fontSize" : font_size, "font" : "monospace", "fontWeight" : "normal", "color" : "#444", "opacity" : 1.0, "tooltip" : true},
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
mutliHitER = (key)=> {
  let results = [];
  let offset = 0;
  _.each (results_json["branch attributes"], (data, partition) => {
      let partition_size = 0;
      _.each (data, (per_branch, branch)=> {
          if (per_branch [key]) {
            _.each (per_branch [key], (p,i)=> {
                results.push ({'Key' : branch + "|" + p[0] + offset, 'ER' : p[1]});
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
cdsQuant = (data, key1, title)=> {
  
  return {
      "config": {
          "mark": {"invalid": null}
      },
      "vconcat" : [
        {
          "width" : 400, "height" : 200,
          "data" : {"values" : data}, 
              "transform": [{
                "sort": [{"field": key1}],
                "window": [{"op": "sum", "field": key1, "as": "CC"}],
                "frame": [null, 0]
              }],
              "layer" : [{
                "mark": {"type" : "area", "opacity" : 0.5, "color" : "grey", "tooltip" : true, "interpolate" : "step"},
                "encoding": {
                  "x": {
                    "field": key1,
                    "type": "quantitative",
                    "axis" : {"title" :  null},
                  },
                  "y": {
                    "field": "CC",
                    "type": "quantitative",
                    "scale" : {"type" : "linear"},
                    "axis" : {"title" : "Cumulative LRT", titleFontSize : 14}
                  }
              }},
              {
                "mark": {"type" : "line", "opacity" : 1.0, "color" : "black",  "interpolate" : "step"},
                "encoding": {
                  "x": {
                    "field": key1,
                   // "sort" : "descending",
                    "type": "quantitative",
                  },
                  "y": {
                    "field": "CC",
                    "type": "quantitative",
                    "scale" : {"type" : "linear"},
                    //"title" : "Cumulative count"
                  },
              }}
      ]
  },
  {
      "width" : 400, "height" : 100,
      "data" : {"values" : data}, 
          
        "mark": {"type" : "bar", "color" : "#ccc", "stroke" : "black", "tooltip" : true},
        "encoding": {
          "x": {
            "field": key1,
            "bin": {"maxbins":200},
            "type": "quantitative",
            "axis" : {"title" :  title ? title : key1, titleFontSize : 14},
          },
          "y": {
            "aggregate": "count",
            "type": "quantitative",
            "scale" : {"type" : "sqrt"},
            "axis" : {"title" :  "Count", titleFontSize : 14},
            //"title" : "Cumulative count"
          }
      
    }
  }]}
}
```

```js
bsErrorSink = {
  if (has_error_sink_nt) {
    let weight = get_error_sink_rate ("Test")["proportion"];
    return posteriorsPerBranchSite (0, weight / (1-weight));
  }
  return [];
}
```

```js
bsPositiveSelection = {
  let w =  test_omega[test_omega.length - 1].weight;
  if (w < 1) {
    return posteriorsPerBranchSite (test_omega.length - 1 + (has_error_sink ? 1 :0),w / (1-w));
  }
  return [];
}
```

```js
twoHBranchSite = mutliHitER ("Evidence ratio for 2H")
```

```js
threeHBranchSite = mutliHitER ("Evidence ratio for 3H")
```

```js
multiHBranchSite = mutliHitER ("Evidence ratio for 2H+3H")
```

```js
treeNodeOrdering = (index, root, only_leaves)=> {
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
        if (results_json.tested[index][n.data.name] == "test" && (!only_leaves || _.isUndefined (n.children))) {
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
has_error_sink = {
  const hc = results_json["analysis"]["settings"] && results_json["analysis"]["settings"]["error-sink"];
  if (hc) {
      //if (get_error_sink_rate ("Test")["proportion"] > 0) return true;
      //if (has_background && get_error_sink_rate ("Background")["proportion"] > 0) return true;
      return true;
  }
  return false;
}
```

```js
has_error_sink_nt = {
  if (has_error_sink) {
      if (get_error_sink_rate ("Test")["proportion"] > 0) return true;
      if (has_background && get_error_sink_rate ("Background")["proportion"] > 0) return true;
      return false;
  }
  return false;
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
            "color" : results_json["Evidence Ratios"]["constrained"] ? {"field" : "ER (constrained)", "type" : "quantitative", "scale" : {"type" : "log", "scheme": "turbo"}, "legend" : {"orient" : "top"}} : null
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
  const branch_order = treeNodeOrdering (0);
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
    case "None":
      size_field = null;
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
        data
      }, 
      "transform" : [
        {"calculate" : "parseInt (split(datum.Key, '|')[1])", "as" : "Codon"},
        {"calculate" : "split(datum.Key, '|')[0]", "as" : "Branch"},
        {"filter" : {"field" : "Codon", "range" : [from, from+step-1]}}
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
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 1.0,  "tooltip": {"content": "data"}},
          "encoding": {
            "color": {
               "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top"},
                //"domain" : d3.extent (_.map (data, (d)=>d.ER)),
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : "redyellowblue", "domainMid" : 1}
            }
          }
        }
      ]
  };
  if (size_field) {
      spec.layer.push (
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
        );
  }
  return spec;
}
```

```js
denser_plot = (data)=> {
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
label_color_scale = d3.scaleOrdinal([], d3.schemeCategory10)
```

```js
display_tree = (index, T, options) => {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
      
      T.branch_length_accessor = (n)=>(n.data.name in results_json["branch attributes"][index] ? results_json["branch attributes"][index][n.data.name][branch_length] : 0) || 0;  
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

        let map2MH = {'Support for 2H' : "Evidence ratio for 2H", 'Support for 3H' : "Evidence ratio for 3H", 'Support for 2H+3H' : "Evidence ratio for 2H+3H"};
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for Selection" || color_branches == "Error-sink support") {
            let branch_values = {};
            const es = color_branches == "Error-sink support";
            let rate_class = es ? 0 : (test_omega.length - 1 + (has_error_sink ? 1 : 0));
            let prior = es ? get_error_sink_rate ("Test")["proportion"] : test_omega[test_omega.length-1].weight;
            prior = prior / (1-prior);
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][index][n.data.name];
                if (posteriors && posteriors["Posterior prob omega clas"]) {
                    posteriors = posteriors["Posterior prob omega class"][rate_class];
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
            let labels = subs_by_branch (index);
            let color_scale = d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolateTurbo);
            t.color_scale = color_scale;
            t.color_scale_title = "Min # of nucleotide substitutions";
            
            t.style_edges ((e,n) => {
             const is_tested = labels[n.target.data.name];
             
             if (is_tested) {
                if (options["branch-labels"]) {
                    add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
                }
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "4").style ("opacity",1.0); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (map2MH [color_branches]) {
            let branch_values = site_support_by_branch (index, map2MH [color_branches], pv);
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),[0.2,1]);
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("opacity", color_scale(is_tested)).style ("stroke-width", "5").style ("stroke","firebrick"); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        }
        t.placenodes();
        t.update();
        t.nwk = T.getNewick((n)=>results_json["tested"][index][n.data.name] == "test" ? "{Foreground}" : "");
        return t;      
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
display_tree_site = (index,T,s,options) => {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    T.branch_length_accessor = (n)=>results_json["branch attributes"][index][n.data.name][branch_length] || 0;  
    let node_labels = generateNodeLabels (T, results_json["substitutions"][index][(+s)-1]);

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

      add_svg_defs (t.svg);
      
      let extended_labels = display_tree_handle_neighbors (index,s,node_labels,T,options,results_json, partition_sizes[index]);
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
           e.selectAll ("text").style ("font-family", "ui-monospace");
           e.selectAll ("text").style ("fill", label_color_scale(n.data.color_on));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });

        let map2MH = {'Support for 2H' : "Evidence ratio for 2H", 'Support for 3H' : "Evidence ratio for 3H", 'Support for 2H+3H' : "Evidence ratio for 2H+3H"};
    
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for selection" || color_branches == "Error-sink support") {
            let branch_values = {};
            const es = color_branches == "Error-sink support";
            let rate_class = es ? 0 : (test_omega.length - 1 + (has_error_sink ? 1 : 0));
            let prior = es ? get_error_sink_rate ("Test")["proportion"] : test_omega[test_omega.length-1].weight;
            prior = prior / (1-prior);
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][index][n.data.name];
                if (posteriors && posteriors["Posterior prob omega class by site"]) {
                    posteriors = posteriors["Posterior prob omega class by site"][rate_class][s-1];
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
                if (options["branch-labels"]) {
                    add_branch_label (e, is_tested.toFixed(2), t.font_size, t.svg.selectAll (".phylotree-container"));
                }
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Substitutions") {
            
            let color_scale = d3.scaleOrdinal([0,1,2,3], d3.schemePuOr[4]);
            t.color_scale = color_scale;
            t.color_scale_title = "Min # of nucleotide substitutions";
            t.style_edges ((e,n) => {
             const is_tested = node_labels[n.target.data.name];
             if (is_tested && is_tested[3]) {
                e.style ("stroke", color_scale(is_tested[3])).style ("stroke-width", "5").style ("opacity","1"); 
                const subs = is_tested[2] + "→" + is_tested[0] + "(" + is_tested[3] + ")";
                e.selectAll ("title").data ([is_tested]).join ("title").text (subs);
                if (options["branch-labels"]) {
                    add_branch_label (e, subs, t.font_size, t.svg.selectAll (".phylotree-container"));
                }
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (map2MH [color_branches]) {
            let branch_values = {};
            T.traverse_and_compute ( (n)=> {
                let posteriors = results_json["branch attributes"][index][n.data.name];
                if (posteriors && posteriors[map2MH [color_branches]]) {
                    let supp = _.find (posteriors[map2MH [color_branches]], (d)=>d[0] == s-1);
                    if (supp) {
                        branch_values[n.data.name] = supp[1];
                    }
                }
            });
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),d3.interpolateTurbo);
            t.color_scale = color_scale;
            t.color_scale_title = "Empirical Bayes Factor";
          
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "5").style ("opacity","1"); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
                if (options["branch-labels"]) {
                    add_branch_label (e, is_tested.toFixed(2), t.font_size, t.svg.selectAll (".phylotree-container"));
                }
             } else {
                e.style ("stroke", null); 
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
treeViewOptions = {
  let opts = _.map (_.range (1,tree_objects.length+1), (d)=>"Partition " + d);
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
  if (mh_rates["DH"]) options.push ("Support for 2H");
  if (mh_rates["TH"]) options.push ("Support for 3H");
  if (mh_rates["DH"] && mh_rates["TH"]) options.push ("Support for 2H+3H");
  if (has_error_sink) options.push ("Error-sink support");
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
import {add_svg_defs,add_branch_label,subs_for_pair,display_tree_handle_neighbors} from "@spond/absrel"
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
import {generateNodeLabels} from "@spond/absrel"
```

```js
import {translate_ambiguous_codon} from "@spond/usual-vs-unusual-mutation-analyses"
```

```js
import {Legend, Swatches} from "@d3/color-legend"
```

```js
pako = require('pako@2.1.0/dist/pako.min.js')
```

```js
bustedStyle
```

```js
import {bustedStyle} from "@spond/absrel"
```

```js
simpleIcons = html`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.css">`
```
