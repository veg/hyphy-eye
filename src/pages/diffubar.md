---
sidebar: false
header: false
footer: false
pager: false
---

```js
import * as d3 from "d3";
import * as _ from "lodash-es";
import * as Plot from "npm:@observablehq/plot";
import * as phylotree from "phylotree";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import { FileAttachment } from "observablehq:stdlib";

// Load test data immediately
const test_data = await FileAttachment("../data/diffubar_test_data.json").json();
```

# difFUBAR

<br>

## Results file

```js
const results_file = view(
  Inputs.file({
    label: html`<b>HyPhy results json:</b>`,
    accept: ".json",
    required: false,
  }),
);
```

```js
const results_json = results_file ? await results_file.json() : test_data;
```

<hr>

## Results summary

```js
const posterior_threshold = view(
  Inputs.text({
    label: html`<b>Posterior probability threshold</b>`,
    value: "0.95",
    submit: "Update",
  }),
);
```

```js
// Helper function to get difFUBAR attributes
function get_diffubar_attributes(json) {
  if (!json) return {};
  return {
    number_sequences: json.input?.["number of sequences"] || 0,
    number_sites: json.input?.["number of sites"] || 0,
    number_partitions: Object.keys(json["data partitions"] || {}).length,
    chain_length: json.settings?.["chain-length"] || 50,
    burn_in: json.settings?.["burn-in"] || 10,
    concentration: json.settings?.concentration || 0.1,
    g1_branches: count_group_branches(json, "G1"),
    g2_branches: count_group_branches(json, "G2"), 
    background_branches: count_group_branches(json, "background")
  };
}

// Helper function to count branches by group
function count_group_branches(json, group) {
  if (!json?.tested) return 0;
  
  // Get the first partition's tested data
  const tested_data = Object.values(json.tested)[0] || {};
  let count = 0;
  
  for (const [branch_name, status] of Object.entries(tested_data)) {
    if (group === "background" && status === "background") {
      count++;
    } else if (group === "G1" && (branch_name.includes("{G1}") || status === "test" && branch_name.includes("G1"))) {
      count++;
    } else if (group === "G2" && (branch_name.includes("{G2}") || status === "test" && branch_name.includes("G2"))) {
      count++;
    }
  }
  
  return count;
}

// Helper function to count significant sites
function count_significant_sites(json, threshold) {
  if (!json?.MLE?.content) return { omega1_greater: 0, omega2_greater: 0, omega1_positive: 0, omega2_positive: 0 };
  const sites = Object.values(json.MLE.content).flat();
  return {
    omega1_greater: sites.filter(row => row[1] > +threshold).length, // P(ω1 > ω2)
    omega2_greater: sites.filter(row => row[2] > +threshold).length, // P(ω2 > ω1)
    omega1_positive: sites.filter(row => row[3] > +threshold).length, // P(ω1 > 1)
    omega2_positive: sites.filter(row => row[4] > +threshold).length  // P(ω2 > 1)
  };
}

const attrs = get_diffubar_attributes(results_json);
const significant_counts = count_significant_sites(results_json, posterior_threshold);

// Custom tile table function for difFUBAR
function display_tile_table(specs) {
  return html`<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
    ${specs.map(spec => html`
      <div style="
        background: var(--theme-background-alt);
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        border-left: 4px solid ${getColorFromName(spec.color)};
      ">
        <div style="font-size: 2rem; font-weight: bold; color: ${getColorFromName(spec.color)};">
          ${spec.number}
        </div>
        <div style="font-size: 0.9rem; color: var(--theme-foreground-muted); margin-top: 0.5rem;">
          ${spec.description}
        </div>
      </div>
    `)}
  </div>`;
}

function getColorFromName(colorName) {
  const colors = {
    "asbestos": "#7f8c8d",
    "midnight_blue": "#2c3e50", 
    "pomegranate": "#c0392b"
  };
  return colors[colorName] || "#7f8c8d";
}
```

difFUBAR (differential Fast Unconstrained Bayesian AppRoximation) compares the non-synonymous to synonymous substitution rate ratio (ω = dN/dS) between two predefined groups of branches on a phylogeny. The analysis uses Markov Chain Monte Carlo with ${attrs.chain_length} iterations and a burn-in of ${attrs.burn_in} to estimate posterior probabilities for differential selection between groups.

```js
const tile_specs = [
  {
    number: attrs.number_sequences,
    description: "sequences in the alignment",
    icon: "icon-options-vertical icons",
    color: "asbestos"
  },
  {
    number: attrs.number_sites,
    description: "codon sites in the alignment", 
    icon: "icon-options icons",
    color: "asbestos"
  },
  {
    number: attrs.number_partitions,
    description: attrs.number_partitions === 1 ? "partition" : "partitions",
    icon: "icon-arrow-up icons",
    color: "asbestos"
  },
  {
    number: attrs.g1_branches,
    description: "branches in group 1",
    icon: "icon-share icons",
    color: "midnight_blue"
  },
  {
    number: attrs.g2_branches,
    description: "branches in group 2",
    icon: "icon-share icons",
    color: "pomegranate"
  },
  {
    number: attrs.background_branches,
    description: "background branches",
    icon: "icon-share icons",
    color: "asbestos"
  },
  {
    number: significant_counts.omega1_greater,
    description: `sites with ω₁ > ω₂ at p≥${posterior_threshold}`,
    icon: "icon-arrow-up icons",
    color: "midnight_blue"
  },
  {
    number: significant_counts.omega2_greater,
    description: `sites with ω₂ > ω₁ at p≥${posterior_threshold}`,
    icon: "icon-arrow-down icons",
    color: "pomegranate"
  },
  {
    number: significant_counts.omega1_positive,
    description: `sites with ω₁ > 1 at p≥${posterior_threshold}`,
    icon: "icon-plus icons",
    color: "midnight_blue"
  },
  {
    number: significant_counts.omega2_positive,
    description: `sites with ω₂ > 1 at p≥${posterior_threshold}`,
    icon: "icon-plus icons",
    color: "pomegranate"
  }
];
```

${display_tile_table(tile_specs)}

## Overview plot

```js
const plot_height = view(
  Inputs.range([300, 800], {
    label: html`<b>Plot height</b>`,
    value: 500,
    step: 50
  })
);
```

**Figure 1**. <small>Overview of posterior probabilities and mean ω values across all codon sites. Sites with posterior probabilities above ${posterior_threshold} are highlighted. The top panel shows posterior probabilities for differential selection hypotheses, while the bottom panel shows mean ω estimates for each group.</small>

```js
const sites_data = Object.values(results_json?.MLE?.content || {}).flat();
const overview_data = sites_data.map(row => ({
  site: row[0],
  p_omega1_greater: row[1], // P(ω1 > ω2)
  p_omega2_greater: row[2], // P(ω2 > ω1)
  p_omega1_positive: row[3], // P(ω1 > 1)
  p_omega2_positive: row[4], // P(ω2 > 1)
  mean_alpha: row[5],       // mean(α)
  mean_omega1: row[6],      // mean(ω1)
  mean_omega2: row[7]       // mean(ω2)
}));

display(Plot.plot({
  width: 900,
  height: plot_height,
  marginLeft: 80,
  marginRight: 80,
  marginBottom: 60,
  facet: {
    data: [
      ...overview_data.map(d => ({...d, panel: "Posterior Probabilities"})),
      ...overview_data.map(d => ({...d, panel: "Mean ω Values"}))
    ],
    y: "panel",
    marginBottom: 40
  },
  x: {
    label: "Codon site",
    domain: [1, Math.max(...overview_data.map(d => d.site))]
  },
  y: {
    label: null
  },
  color: {
    range: ["#3498db", "#e74c3c", "#9b59b6", "#f39c12"],
    legend: true
  },
  marks: [
    // Vertical bars connecting ω1 and ω2 in Mean ω Values panel
    Plot.link(overview_data, {
      fx: null,
      fy: d => "Mean ω Values",
      x1: "site",
      x2: "site", 
      y1: "mean_omega1",
      y2: "mean_omega2",
      stroke: "gray",
      strokeWidth: d => (d.p_omega1_greater > +posterior_threshold || d.p_omega2_greater > +posterior_threshold || 
                        d.p_omega1_positive > +posterior_threshold || d.p_omega2_positive > +posterior_threshold) ? 2 : 1,
      opacity: d => (d.p_omega1_greater > +posterior_threshold || d.p_omega2_greater > +posterior_threshold || 
                     d.p_omega1_positive > +posterior_threshold || d.p_omega2_positive > +posterior_threshold) ? 0.8 : 0.3
    }),
    
    // Posterior probabilities panel
    Plot.dot(overview_data, {
      fx: null,
      fy: d => "Posterior Probabilities",
      x: "site",
      y: "p_omega1_greater",  
      fill: "#3498db",
      r: d => d.p_omega1_greater > +posterior_threshold ? 4 : 2,
      opacity: d => d.p_omega1_greater > +posterior_threshold ? 1 : 0.5,
      title: d => `Site ${d.site}: P(ω₁ > ω₂) = ${d.p_omega1_greater.toFixed(3)}`
    }),
    Plot.dot(overview_data, {
      fx: null,
      fy: d => "Posterior Probabilities", 
      x: "site",
      y: "p_omega2_greater",
      fill: "#e74c3c",
      r: d => d.p_omega2_greater > +posterior_threshold ? 4 : 2,
      opacity: d => d.p_omega2_greater > +posterior_threshold ? 1 : 0.5,
      title: d => `Site ${d.site}: P(ω₂ > ω₁) = ${d.p_omega2_greater.toFixed(3)}`
    }),
    Plot.dot(overview_data, {
      fx: null,
      fy: d => "Posterior Probabilities",
      x: "site", 
      y: "p_omega1_positive",
      fill: "#9b59b6",
      r: d => d.p_omega1_positive > +posterior_threshold ? 4 : 2,
      opacity: d => d.p_omega1_positive > +posterior_threshold ? 1 : 0.5,
      title: d => `Site ${d.site}: P(ω₁ > 1) = ${d.p_omega1_positive.toFixed(3)}`
    }),
    Plot.dot(overview_data, {
      fx: null,
      fy: d => "Posterior Probabilities",
      x: "site",
      y: "p_omega2_positive", 
      fill: "#f39c12",
      r: d => d.p_omega2_positive > +posterior_threshold ? 4 : 2,
      opacity: d => d.p_omega2_positive > +posterior_threshold ? 1 : 0.5,
      title: d => `Site ${d.site}: P(ω₂ > 1) = ${d.p_omega2_positive.toFixed(3)}`
    }),
    
    // Mean ω values panel  
    Plot.dot(overview_data, {
      fx: null,
      fy: d => "Mean ω Values",
      x: "site",
      y: "mean_omega1",
      fill: "#3498db", 
      r: d => (d.p_omega1_greater > +posterior_threshold || d.p_omega1_positive > +posterior_threshold) ? 4 : 2,
      opacity: d => (d.p_omega1_greater > +posterior_threshold || d.p_omega1_positive > +posterior_threshold) ? 1 : 0.5,
      title: d => `Site ${d.site}: mean(ω₁) = ${d.mean_omega1.toFixed(3)}`
    }),
    Plot.dot(overview_data, {
      fx: null, 
      fy: d => "Mean ω Values",
      x: "site",
      y: "mean_omega2",
      fill: "#e74c3c",
      r: d => (d.p_omega2_greater > +posterior_threshold || d.p_omega2_positive > +posterior_threshold) ? 4 : 2,
      opacity: d => (d.p_omega2_greater > +posterior_threshold || d.p_omega2_positive > +posterior_threshold) ? 1 : 0.5,
      title: d => `Site ${d.site}: mean(ω₂) = ${d.mean_omega2.toFixed(3)}`
    }),
    
    // Reference line at ω = 1
    Plot.ruleY([1], {
      fx: null,
      fy: d => "Mean ω Values", 
      stroke: "gray",
      strokeDasharray: "3,3",
      strokeWidth: 1
    }),
    
    // Threshold line for probabilities
    Plot.ruleY([+posterior_threshold], {
      fx: null,
      fy: d => "Posterior Probabilities",
      stroke: "red",
      strokeDasharray: "2,2", 
      strokeWidth: 1
    })
  ]
}))
```

<hr>

## Site-by-site results

```js
const site_table_data = sites_data.map((row, i) => {
  // For difFUBAR, we'll use a simple partition assignment since the structure is different
  // Most difFUBAR analyses have a single partition
  let partition = 1;
  
  // Try to determine partition from data partitions if available
  if (results_json?.["data partitions"]) {
    for (const [key, part] of Object.entries(results_json["data partitions"])) {
      // Check if partition has coverage data and if site index falls within it
      if (part && part.coverage && part.coverage[0] && part.coverage[0].includes(i)) {
        partition = parseInt(key) + 1;
        break;
      }
    }
  }

  return {
    Site: row[0],
    Partition: partition,
    "P(ω₁ > ω₂)": row[1],
    "P(ω₂ > ω₁)": row[2], 
    "P(ω₁ > 1)": row[3],
    "P(ω₂ > 1)": row[4],
    "mean(α)": row[5],
    "mean(ω₁)": row[6],
    "mean(ω₂)": row[7],
    Significance: get_site_significance(row, +posterior_threshold)
  };
});

function get_site_significance(row, threshold) {
  const significant = [];
  if (row[1] > threshold) significant.push("ω₁ > ω₂");
  if (row[2] > threshold) significant.push("ω₂ > ω₁");
  if (row[3] > threshold) significant.push("ω₁ > 1");
  if (row[4] > threshold) significant.push("ω₂ > 1");
  return significant.length > 0 ? significant.join(", ") : "None";
}
```

```js
const significance_filter = view(
  Inputs.checkbox(["ω₁ > ω₂", "ω₂ > ω₁", "ω₁ > 1", "ω₂ > 1", "None"], {
    value: ["ω₁ > ω₂", "ω₂ > ω₁", "ω₁ > 1", "ω₂ > 1", "None"],
    label: "Show sites with",
  }),
);
```

```js
const filtered_sites = site_table_data.filter((d) => {
  if (d.Significance === "None") {
    return significance_filter.includes("None");
  }
  return significance_filter.some(filter => d.Significance.includes(filter));
});
```

```js
display(Inputs.table(filtered_sites, {
  columns: [
    "Site",
    "Partition", 
    "P(ω₁ > ω₂)",
    "P(ω₂ > ω₁)",
    "P(ω₁ > 1)",
    "P(ω₂ > 1)",
    "mean(α)",
    "mean(ω₁)",
    "mean(ω₂)",
    "Significance"
  ],
  format: {
    "P(ω₁ > ω₂)": (d) => d.toFixed(3),
    "P(ω₂ > ω₁)": (d) => d.toFixed(3),
    "P(ω₁ > 1)": (d) => d.toFixed(3), 
    "P(ω₂ > 1)": (d) => d.toFixed(3),
    "mean(α)": (d) => d.toFixed(3),
    "mean(ω₁)": (d) => d.toFixed(3),
    "mean(ω₂)": (d) => d.toFixed(3)
  },
  width: {
    Site: 60,
    Partition: 80,
    Significance: 120
  },
}))
```

<details>
  <summary><b>Column descriptions</b></summary>
  <small>
    <dl>
      <dt>Site</dt><dd>Codon position in the alignment</dd>
      <dt>Partition</dt><dd>Data partition this site belongs to</dd>
      <dt>P(ω₁ > ω₂)</dt><dd>Posterior probability that dN/dS for group 1 exceeds group 2</dd>
      <dt>P(ω₂ > ω₁)</dt><dd>Posterior probability that dN/dS for group 2 exceeds group 1</dd>
      <dt>P(ω₁ > 1)</dt><dd>Posterior probability of positive selection in group 1</dd>
      <dt>P(ω₂ > 1)</dt><dd>Posterior probability of positive selection in group 2</dd>
      <dt>mean(α)</dt><dd>Mean posterior synonymous substitution rate</dd>
      <dt>mean(ω₁)</dt><dd>Mean posterior dN/dS ratio for group 1</dd>
      <dt>mean(ω₂)</dt><dd>Mean posterior dN/dS ratio for group 2</dd>
    </dl>
  </small>
</details>

<hr>

## Model fits

```js
const model_fits = Object.entries(results_json?.fits || {}).map(
  ([name, fit]) => ({
    Model: name,
    "Log Likelihood": fit["Log Likelihood"],
    Parameters: fit["estimated parameters"],
    "AIC-c": fit["AIC-c"],
  }),
);
```

```js
display(Inputs.table(model_fits, {
  format: {
    "Log Likelihood": (d) => d.toFixed(2),
    "AIC-c": (d) => d.toFixed(2),
  },
}))
```

<hr>

## Tree

```js
// difFUBAR doesn't have branch attributes like FEL, so we create tree objects differently
const tree_objects = _.map(results_json.input.trees, (tree, i) => {
  let T = new phylotree.phylotree(tree);
  // Use the original branch lengths from the newick string
  return T;
});
```

```js
const tree_id = view(Inputs.select(_.map(_.range(1, tree_objects.length + 1), (d) => "Partition " + d), {
  label: html`<b>View tree for </b>`
}))
```

```js
const treeDim = view(Inputs.text({
  placeholder: "1024 x 800", 
  description: "Tree dimension (height x width in pixels), leave blank to auto-scale", 
  submit: "Resize"
}));
```

<small>Phylogenetic tree showing branch group assignments: <span style="color: #3498db">Group 1</span>, <span style="color: #e74c3c">Group 2</span>, <span style="color: gray">Background</span></small>

```js
function display_tree(i) {
    let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;
 
    let T = tree_objects[i];
    var t = T.render({
        height: dim && dim[0] || 1024, 
        width: dim && dim[1] || 600,
        'show-scale': true,
        'is-radial': false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size': (n) => 0
    });
      
    function sort_nodes(asc) {
        T.traverse_and_compute(function(n) {
            var d = 1;
            if (n.children && n.children.length) {
                d += d3.max(n.children, function(d) { return d["count_depth"]; });
            } 
            n["count_depth"] = d;
        });
        T.resortChildren(function(a, b) {
            return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
        });
    }

    sort_nodes(true);
    t.style_nodes((e, n) => {
        if (n.children && n.children.length) return; 
        e.selectAll("title").data([n.data.name]).join("title").text((d) => d);
    });

    // Color branches based on group assignment
    t.style_edges((e, n) => {
        // Get the tested data for the first partition
        const tested_data = results_json?.tested?.[0] || {};
        const branch_name = n.target.data.name;
        
        let color = "gray"; // default/background
        let stroke_width = "1";
        
        // Determine group based on branch name and tested status
        if (branch_name.includes("{G1}")) {
            color = "#3498db"; // blue for group 1
            stroke_width = "3";
        } else if (branch_name.includes("{G2}")) {
            color = "#e74c3c"; // red for group 2
            stroke_width = "3";
        } else if (tested_data[branch_name] === "background") {
            color = "gray";
            stroke_width = "1";
        }
        
        e.style("stroke", color).style("stroke-width", stroke_width);
    });

    t.placenodes();
    t.update();
    return t;      
}

const figure_tree = display_tree((-1) + (+tree_id.split(" ")[1])).show()
```

<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div id="tree_container">${figure_tree}</div>

<hr>

## Suggested Citation

<p><tt>difFUBAR: Scalable Bayesian comparison of adaptive evolution. Hassan Sadiq, Patrick Truong, Maximilian Danielsson, Venkatesh Kumar, Hedwig Nora Nordlinder, Darren Patrick Martin, Ben Murrell. bioRxiv 2025.05.19.654647; doi: https://doi.org/10.1101/2025.05.19.654647</tt></p>

<style>
.card {
  padding: 1rem;
  border-radius: 8px;
  background: var(--theme-background-alt);
  text-align: center;
}
.card h2 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 600;
}
.muted {
  color: var(--theme-foreground-muted);
}
</style>