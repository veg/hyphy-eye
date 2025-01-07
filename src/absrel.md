```js
import * as d3 from "d3";
// TODO sort out this import
import {
  Legend as legend,
  Swatches as swatches
} from "d3/color-legend";
import * as _ from "lodash-es";
import * as parse_svg from "parse-svg-path";
import * as phylotree from "phylotree";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "./absrel/absrel-utils.js";
import * as plots from "./absrel/absrel-plots.js";
import * as omegaPlots from "./components/omega-plots.js";
import * as tt from "./components/tile-table/tile-table.js";
import {FileAttachment} from "observablehq:stdlib";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
```

# aBSREL results summary

```js
const results_json = await FileAttachment("./data/absrel_test_data.json").json();
const attrs = utils.get_attributes(results_json);
```

<span style = 'font-size: 1.1em; color: firebrick;'>Based on the likelihood ratio test, there **are ${results_json["test results"]["positive test results"]}** branches with evidence of _episodic diversifying selection_ in this dataset (<tt>p&leq;${floatFormat(results_json["test results"]["P-value threshold"] || 0.05)}</tt>).</span> <span style = 'font-size: 0.8em'><br>aBSREL analysis (<samp>${results_json.analysis.version}</samp>) was performed on the alignment from <samp>${results_json.input["file name"]}</samp> using HyPhy v<tt>${results_json.runtime}</tt>. <br>This analysis ** ${srv_rate_classes > 0 ? "included" : "did not include"}** site-to-site synonymous rate variation. ${_.size (mh_rates['DH']) == 0 ? "" : (_.size (mh_rates['TH'] == 0) ? "Double nucleotide substitutions were included in the model." : "Double and triple nucleotide substitutions were included in the model.")}${+results_json.analysis.version < 2.5 ? "<p><small><span class = 'stati bg-pumpkin'>Some of the visualizations are not available for BUSTED analyses before v2.5</span></small>" : ""} </span>

<details><summary><small>**Suggested citation**</summary><tt><small>${results_json.analysis["citation"]}</small></tt></small></details>

```js
const pv = view(Inputs.text({label: html`<b>Evidence ratio threshold</b>`, value: "100", submit: "Update"}))
```

```js
const tile_table_inputs = [
    {
        "number": results_json.input["number of sequences"],
        "description": "sequences in the alignment",
        "icon": "icon-options-vertical icons",
        "color": "asbestos",
    },
    {
        "number": results_json.input["number of sites"],
        "description": "codon sites in the alignment",
        "icon": "icon-options icons",
        "color": "asbestos"
    },
    {
        "number": results_json.input["partition count"],
        "description": "partitions",
        "icon": "icon-arrow-up icons",
        "color": "asbestos"
    },
    {
        "number": tested_branch_count,
        "description": "median branches/ partition used for testing",
        "icon": "icon-share icons",
        "color": "asbestos",
    },
    {
        "number": d3.extent (omega_rate_classes).join ("-"),
        "description": "rate classes per branch",
        "icon": "icon-grid icons",
        "color": "asbestos"
    },
    {
        "number": srv_rate_classes ? "" + srv_rate_classes + " classes" : "None",
        "description": "synonymous rate variation",
        "icon": "icon-layers icons",
        "color": "asbestos"
    },
    {
        "number": results_json["test results"]["positive test results"],
        "description": "branches with evidence of selection",
        "icon": "icon-plus icons",
        "color": "midnight_blue",
    },
    {
        "number": floatFmt(d3.mean (_.map (_.filter (distributionTable, (r)=>r.tested == "Yes"), (d)=>d.sites))||0),
        "description": "Sites/tested branch with ER≥" + pv + " for positive selection",
        "icon": "icon-energy icons",
        "color": "midnight_blue"
    },
    {
        "number": _.size(mh_rates['DH']) ? floatFmt (d3.median (_.map (mh_rates['DH']))) : "N/A"}:${_.size(mh_rates['TH']) ?floatFmt (d3.median (_.map (mh_rates['TH']))) : "N/A",
        "description": "Median multiple hit rates (2H:3H)",
        "icon": "icon-target icons",
        "color": "midnight_blue"
    }
]

<div>${tt.tile_table(trivial_inputs)}</div>;
```

#### Branch-by-branch results

```js
const rate_table = view(Inputs.table (distributionTable, {
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
}))
```

```js
distComparisonPlot = rate_table.length == 2 ? renderTwoDiscreteDistributions (rate_table[0].dist[1],rate_table[1].dist[1],{"label" : {"chart" : rate_table[0].plot[0], "series" : [rate_table[0].dist[3],rate_table[1].dist[3]]}, "width" : 700, "height" : 120, "scale" : "sqrt", "margin" : {top: 5, right: 250, bottom: 30, left: 20}}) : md`<small>Select exactly two distributions to plot a side-by-side comparison</small>`
```

```js
const tree_id =  view(autoSelect ({options:treeViewOptions, size : 10, title: html`<b>Tree to view</b>`, placeholder : "Select something to view", "value" : "Alignment-wide tree"}))
```

```js
const branch_length =  view(Inputs.select(_.chain (results_json["branch attributes"]["attributes"]).toPairs().filter (d=>d[1]["attribute type"] == "branch length").map (d=>d[0]).value(),{value: "Baseline MG94xREV", label: html`<b>Branch length </b>`}))
```

```js
const treeLabels = view(Inputs.checkbox(
   ["amino-acids","codons","show internal","show only multiple hits","show only non-synonymous changes","sequence names","align tips","include neighboring codons","show branch labels"],{"value" : ["amino-acids","align tips"], label: html`<b>Tree labels</b>` }
))
```

```js
const color_branches =  view(Inputs.select(tree_color_options,{value: "Support for selection", label: html`<b>Color branches </b>`}))
```

```js
const treeDim = view(Inputs.text({placeholder : "1024 x 800", label: "H x W (pixels)", submit: "Resize"}))
```

```js
function legend() {
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
const legend = legend();
```

```js
function getFigure2() {
  if (figure2) {
      return figure2.show();
  }
  return md`### Select a tree option from the menu above to view`;
}

const fig2 = getFigure2();
```

**Figure 1**. ${plot_type ? plot_legends[plot_type] : "No plotting options available"}

```js
const plot_type =  view(Inputs.select(_.map (_.filter (plot_options, (d)=>d[1](results_json)), d=>d[0]),{label: html`<b>Plot type</b>`, value : 'Evidence ratio alignment profile'}))
```

```js
const fig1_controls = view(plot_extras[plot_type] || Inputs.text({label: "Plot options", value: "None", disabled: true}))
```

```js
if (plot_type) {
  figure1 = vegalite(plot_specs[plot_type])
}
```

**Table 2**. Detailed site-by-site results from the aBSREL analysis

```js
const table1 = view(Inputs.table (sites_table[1], {
  rows : 10,
  format: sites_table[0],
  layout: "auto",
  header: sites_table[2]
}))
```

**Table 3**. Detailed site-by-site results for a specific branch in the aBSREL analysis

```js
const which_branch = view(Inputs.select(
  _.map ([...profilable_branches], (d)=>d),
  {multiple: true,
  label: "Select some branches"
  }
))
```

```js
const table3 = view(Inputs.table (table3_data,
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
}))
```

<link rel=stylesheet href='${resolve("phylotree@0.1/phylotree.css")}'>
<div id="tree_container"></div>


```js
function getFigure2() {
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
const figure2 = getFigure2();
```

TODO

```js
floatFormat = d3.format (".4g")
percentageFormat = d3.format (".2p")
proportionFormat = d3.format (".5p")
results_json = await get_json (params.get ("url"))
```

```js
function fig1data() {
   let in_set = new Set (_.map (table1, (d)=>d.Codon));
   return _.filter (siteTableData[0], (x)=>in_set.has (x.Codon));
}
const fig2data = fig1data();
```

```js
const profilable_branches = new Set (_.chain (_.get (results_json, ["Site Log Likelihood","tested"])).keys().value())
```

```js
const tested_branch_count =  d3.median (_.chain (results_json.tested).map ().map((d)=>_.filter (_.map (d), (d)=>d=="test").length).value())
```

```js
const srv_rate_classes = results_json["Synonymous site-posteriors"] ? results_json["Synonymous site-posteriors"].length: 0
```

```js
const srv_distribution = getRateDistribution (["fits","Full adaptive model","Rate Distributions","Synonymous site-to-site rates"], ["rate","proportion"])
```

```js
const omega_rate_classes = _.map (results_json["branch attributes"]["0"], (d)=>d["Rate classes"])
```

```js
const mh_rates = ({
    'DH' : _.chain(_.map (results_json["branch attributes"][0], (d,k) => [k,_.get (d, ['rate at which 2 nucleotides are changed instantly within a single codon'])])).filter (d=>!_.isUndefined(d[1])).fromPairs().value(),
    'TH' : _.chain(_.map (results_json["branch attributes"][0], (d,k) => [k,_.get (d, ['rate at which 3 nucleotides are changed instantly within a single codon'])])).filter (d=>!_.isUndefined(d[1])).fromPairs().value()
})
```

```js
function distributionTable() {
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
  
  return table;
}

const distributionTable = distributionTable();
```

```js
function siteTableData() {
  let site_info = [];
  let index = 0;
  let bySite = _.groupBy (profileBranchSites, (d)=>d.site);
  _.each (results_json["data partitions"], (pinfo, partition)=> {
      _.each (pinfo["coverage"][0], (ignore, i)=> {
          
              let site_record = {
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
const siteTableData = siteTableData();
```

```js
function sites_table() {
    return [{}, siteTableData[0], siteTableData[1]];
}
const sites_table = sites_table();
```

```js
function profileBranchSites() {
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
const profileBranchSites = profileBranchSites();
```

```js
function posteriorsPerBranchSite(do_counts, er) {
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
const posteriorsPerBranchSite = posteriorsPerBranchSite();
```



```js
function table3_data() {
  let rc = _.keyBy (_.filter (profileBranchSites, (d)=>which_branch.indexOf (d.branch)>=0), (d)=>d.Key);
  _.each (bsPositiveSelection, (d)=> {
      if (d.Key in rc) {
          rc[d.Key].EBF = d.ER;
      }
  });
  return _.values (rc);
     
}

const table3_data = table3_data();
```

```js
const bsPositiveSelection = posteriorsPerBranchSite();
```

```js
const tree_objects = _.map (results_json.input.trees, (tree,i)=> {
  let T = new phylotree.phylotree (tree);
  T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name]["Global MG94xREV"];
  return T;
});
```

```js
const label_color_scale = d3.scaleOrdinal([], d3.schemeCategory10)
```

```js
function treeViewOptions() {
  let opts = ["Alignment-wide tree"];
  if (results_json.substitutions) {
    opts = opts.concat(_.map (_.range (1,results_json.input["number of sites"]+1), (d)=>"Codon " + d));
  }
  return opts;
}
const treeViewOptions = treeViewOptions();
```

```js
function tree_color_options() {
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
const tree_color_options = tree_color_options();
```