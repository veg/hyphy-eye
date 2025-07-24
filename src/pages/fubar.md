---
sidebar: false
header: false
footer: false
pager: false
---

```js
import * as d3 from "d3";
import * as _ from "lodash-es";
import * as tt from "../components/tile-table/tile-table.js";
import { FileAttachment } from "observablehq:stdlib";

// Load test data immediately
const test_data = await FileAttachment("../data/fubar_test_data.json").json();
```

# FUBAR

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
const results_json = Mutable(results_file ? results_file.json() : test_data);
```

```js
window.addEventListener(
  "message",
  (event) => {
    if (event.data.data.MLE) {
      results_json.value = event.data.data;
    }
  },
  false,
);
```

<hr>

## Results summary

```js
const posterior_threshold = view(
  Inputs.text({
    label: html`<b>Posterior probability threshold</b>`,
    value: "0.9",
    submit: "Update",
  }),
);
```

```js
// Helper function to get FUBAR attributes
function get_fubar_attributes(json) {
  if (!json) return {};
  return {
    number_sequences: json.input?.["number of sequences"] || 0,
    number_sites: json.input?.["number of sites"] || 0,
    number_partitions: Object.keys(json["data partitions"] || {}).length,
    grid_size: json.settings?.["grid size"] || 20,
    chains: json.settings?.chains || 5,
    samples: json.settings?.samples || 100
  };
}

// Helper function to count sites under selection
function count_selection_sites(json, threshold) {
  if (!json?.MLE?.content) return { positive: 0, negative: 0 };
  const sites = Object.values(json.MLE.content).flat();
  return {
    positive: sites.filter(row => row[4] > +threshold).length,
    negative: sites.filter(row => row[3] > +threshold).length
  };
}

const attrs = get_fubar_attributes(results_json);
const selection_counts = count_selection_sites(results_json, posterior_threshold);
```

FUBAR (Fast, Unconstrained Bayesian AppRoximation) uses a Bayesian approach to infer nonsynonymous (dN) and synonymous (dS) substitution rates on a per-site basis. The method employs a Markov Chain Monte Carlo (MCMC) routine that runs ${attrs.chains} chains to ensure convergence, with a ${attrs.grid_size}×${attrs.grid_size} grid of (α,β) rate categories. Statistical significance is determined using posterior probabilities.

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
    number: attrs.grid_size * attrs.grid_size,
    description: "rate categories in grid",
    icon: "icon-grid icons",
    color: "asbestos"
  },
  {
    number: attrs.chains,
    description: "independent MCMC chains",
    icon: "icon-share icons",
    color: "asbestos"
  },
  {
    number: attrs.samples,
    description: "samples drawn per chain",
    icon: "icon-layers icons",
    color: "asbestos"
  },
  {
    number: selection_counts.positive,
    description: `sites under diversifying positive selection at p≤${posterior_threshold}`,
    icon: "icon-plus icons",
    color: "midnight_blue"
  },
  {
    number: selection_counts.negative,
    description: `sites under purifying negative selection at p≤${posterior_threshold}`,
    icon: "icon-minus icons",
    color: "midnight_blue"
  }
];
```

<div>${tt.tile_table(tile_specs)}</div>


## Posterior rate distribution

```js
const selected_site = view(
  Inputs.text({
    label: html`<b>Site number (leave empty for alignment-wide)</b>`,
    placeholder: "e.g., 42",
  }),
);
```

```js
const grid_data =
  results_json.grid?.map((row, i) => {
    if (!selected_site || selected_site === "") {
      return { alpha: row[0], beta: row[1], weight: row[2] };
    }

    // Find site in partitions
    const site_num = parseInt(selected_site) - 1;
    let partition_idx = 0;
    let site_idx = -1;

    for (const [key, partition] of Object.entries(
      results_json["data partitions"] || {},
    )) {
      const idx = partition.coverage[0].indexOf(site_num);
      if (idx > -1) {
        partition_idx = parseInt(key);
        site_idx = idx;
        break;
      }
    }

    const posterior =
      results_json.posterior?.[partition_idx]?.[site_idx]?.[0]?.[i] || 0;
    return { alpha: row[0], beta: row[1], weight: posterior };
  }) || [];
```

```js
const max_weight = Math.max(...grid_data.map((d) => d.weight));
```

**Figure 1**. <small>Posterior distribution of synonymous (α) and non-synonymous (β) substitution rates ${selected_site ? `for site ${selected_site}` : "across the entire alignment"}. Circle size is proportional to the posterior weight allocated to each rate combination. The diagonal line indicates ω = 1 (neutral evolution).</small>

```js
Plot.plot({
  width: 640,
  height: 640,
  margin: 60,
  x: {
    label: "Synonymous substitution rate (α)",
    domain: [0, Math.max(...grid_data.map((d) => d.alpha)) * 1.05],
  },
  y: {
    label: "Non-synonymous substitution rate (β)",
    domain: [0, Math.max(...grid_data.map((d) => d.beta)) * 1.05],
  },
  color: {
    type: "diverging",
    scheme: "RdBu",
    domain: [0, 10],
    reverse: true,
    label: "ω = β/α",
    legend: true,
  },
  marks: [
    Plot.dot(grid_data, {
      x: "alpha",
      y: "beta",
      r: (d) => Math.sqrt(d.weight / max_weight) * 20,
      fill: (d) => (d.alpha > 0 ? d.beta / d.alpha : 10),
      stroke: "currentColor",
      strokeWidth: 0.5,
      opacity: 0.8,
    }),
    Plot.line(
      [
        [0, 0],
        [
          Math.max(...grid_data.map((d) => Math.max(d.alpha, d.beta))),
          Math.max(...grid_data.map((d) => Math.max(d.alpha, d.beta))),
        ],
      ],
      {
        stroke: "gray",
        strokeDasharray: "3,3",
        strokeWidth: 2,
      },
    ),
  ],
});
```

<hr>

## Site-by-site results

```js
const site_table_data = sites.map((row, i) => {
  // Find partition for this site
  let partition = 1;
  for (const [key, part] of Object.entries(
    results_json["data partitions"] || {},
  )) {
    if (part.coverage[0].includes(i)) {
      partition = parseInt(key) + 1;
      break;
    }
  }

  return {
    Site: i + 1,
    Partition: partition,
    α: row[0],
    β: row[1],
    "β-α": row[2],
    "Prob[α>β]": row[3],
    "Prob[α<β]": row[4],
    "BF[α<β]": row[5],
    PSRF: row[6],
    Neff: row[7],
    Selection:
      row[4] > posterior_threshold
        ? "Positive"
        : row[3] > posterior_threshold
          ? "Negative"
          : "Neutral",
  };
});
```

```js
const selection_filter = view(
  Inputs.checkbox(["Positive", "Negative", "Neutral"], {
    value: ["Positive", "Negative", "Neutral"],
    label: "Show sites with",
  }),
);
```

```js
const filtered_sites = site_table_data.filter((d) =>
  selection_filter.includes(d.Selection),
);
```

```js
Inputs.table(filtered_sites, {
  columns: [
    "Site",
    "Partition",
    "α",
    "β",
    "β-α",
    "Prob[α>β]",
    "Prob[α<β]",
    "BF[α<β]",
    "Selection",
  ],
  format: {
    α: (d) => d.toFixed(3),
    β: (d) => d.toFixed(3),
    "β-α": (d) => d.toFixed(3),
    "Prob[α>β]": (d) => d.toFixed(3),
    "Prob[α<β]": (d) => d.toFixed(3),
    "BF[α<β]": (d) => d.toExponential(2),
    PSRF: (d) => d.toFixed(3),
    Neff: (d) => d.toFixed(1),
  },
  width: {
    Site: 60,
    Partition: 80,
    Selection: 80,
  },
});
```

<details>
  <summary><b>Column descriptions</b></summary>
  <small>
    <dl>
      <dt>Site</dt><dd>Codon position in the alignment</dd>
      <dt>Partition</dt><dd>Data partition this site belongs to</dd>
      <dt>α</dt><dd>Mean posterior synonymous substitution rate</dd>
      <dt>β</dt><dd>Mean posterior non-synonymous substitution rate</dd>
      <dt>β-α</dt><dd>Difference between non-synonymous and synonymous rates</dd>
      <dt>Prob[α>β]</dt><dd>Posterior probability of negative selection</dd>
      <dt>Prob[α<β]</dt><dd>Posterior probability of positive selection</dd>
      <dt>BF[α<β]</dt><dd>Empirical Bayes Factor for positive selection</dd>
      <dt>PSRF</dt><dd>Potential scale reduction factor (convergence diagnostic)</dd>
      <dt>Neff</dt><dd>Effective sample size for Markov chain</dd>
    </dl>
  </small>
</details>

<hr>

## Model fits

```js
const model_fits = Object.entries(results_json.fits || {}).map(
  ([name, fit]) => ({
    Model: name,
    "Log Likelihood": fit["Log Likelihood"],
    Parameters: fit["estimated parameters"],
    "AIC-c": fit["AIC-c"],
  }),
);
```

```js
Inputs.table(model_fits, {
  format: {
    "Log Likelihood": (d) => d.toFixed(2),
    "AIC-c": (d) => d.toFixed(2),
  },
});
```

<hr>

## Suggested Citation

<p><tt>${results_json.analysis?.citation || "Citation not available"}</tt></p>

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
