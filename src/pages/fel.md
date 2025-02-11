```js
import * as d3 from "d3";
import * as _ from "lodash-es";
import * as phylotree from "phylotree";
import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";
import * as utils from "../fel/fel-utils.js";
import * as plots from "../fel/fel-plots.js";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as tt from "../components/tile-table/tile-table.js";
import { FileAttachment } from "observablehq:stdlib";
```

```js
const vl = vegaLiteApi.register(vega, vegaLite);
```

# FEL results summary

```js
const results_json = Mutable(
  await FileAttachment("../data/fel_test_data.json").json(),
);

window.addEventListener(
  "message",
  (event) => {
    if (
      event.data &&
      typeof event.data === "object" &&
      event.data.data &&
      typeof event.data.data === "object" &&
      event.data.data.MLE
    ) {
      results_json.value = event.data.data;
    }
  },
  false,
);
```

```js
var attrs = utils.get_attributes(results_json);
```

Statistical significance is evaluated based on ${results_json.simulated  ? "<tt>" + results_json.simulated + "</tt> site-level parametric bootstrap replicates"  : "the asymptotic chi-squared distribution"}. This analysis **${attrs.has_srv? "included" : "does not include"}\*\* site to site synonymous rate variation. ${attrs.has_ci ? "Profile approximate confidence intervals for site-level dN/dS ratios have been computed." : ""}

```js
const pvalue_threshold = await view(
  Inputs.text({
    label: html`<b>p-value threshold</b>`,
    value: "0.1",
    submit: "Update",
  }),
);
```

```js
const sites_table = utils.get_sites_table(results_json, pvalue_threshold);
const siteTableData = _.filter(
  sites_table[1],
  (x) => table_filter.indexOf(x.class) >= 0,
);
const tile_specs = utils.get_tile_specs(results_json, pvalue_threshold);
```

<div>${tt.tile_table(tile_specs)}</div>

```js
const table_filter = view(
  Inputs.checkbox(["Diversifying", "Purifying", "Neutral", "Invariable"], {
    value: ["Diversifying", "Purifying", "Neutral", "Invariable"],
    label: html`<b>Show</b>`,
    format: (x) =>
      html`<span
        style="text-transform: capitalize; border-bottom: solid 2px ${plots
          .COLORS[x]}; margin-bottom: -2px;"
        >${x}</span
      >`,
  }),
);
```

```js
function get_fig1data() {
  let in_set = new Set(_.map(table1, (d) => d.codon));
  return _.filter(siteTableData, (x) => in_set.has(x.codon));
}
const fig1data = get_fig1data();
```

```js
const plot_type = view(
  Inputs.select(
    _.map(
      _.filter(plots.get_plot_options(attrs.has_pasmt), (d) =>
        d[1](results_json),
      ),
      (d) => d[0],
    ),
    { label: html`<b>Plot type</b>` },
  ),
);
```

```js
const plot_description = plots.get_plot_description(
  plot_type,
  pvalue_threshold,
);
const plot_spec = plots.get_plot_spec(
  plot_type,
  fig1data,
  pvalue_threshold,
  attrs.has_pasmt,
);
const tree_objects = phylotreeUtils.get_tree_objects(results_json);
```

**Figure 1**. <small>${plot_description}</small>

<div>${vl.render({"spec": plot_spec})}</div>

**Table 1**. <small>Detailed site-by-site results from the FEL analysis</small>

```js
const table1 = view(
  Inputs.table(siteTableData, {
    rows: 15,
    format: sites_table[0],
  }),
);
```

<details>
  <summary><b>Table column definitions</b></small></summary>
  <small><dl>
    ${_.map (sites_table[2], (d)=>html`<dt><tt>${d[0]}</tt></dt><dd>${d[1]}</dd>`)}
  </dl></small>
</details>

```js
const tree_id = view(
  Inputs.select(
    _.map(_.range(1, tree_objects.length + 1), (d) => "Partition " + d),
    { label: html`<b>View tree for </b>` },
  ),
);
```

```js
const treeDim = view(
  Inputs.text({
    placeholder: "1024 x 800",
    description:
      "Tree dimension (height x width in pixels), leave blank to auto-scale",
    submit: "Resize",
  }),
);
```

<small>Branches that are shown in <span style = 'color: redbrick'>red color</span> are those that were included in testing for selection</small>

```js
function display_tree(i) {
  let dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : null;

  let T = tree_objects[i];
  var t = T.render({
    height: (dim && dim[0]) || 1024,
    width: (dim && dim[1]) || 600,
    "show-scale": true,
    "is-radial": false,
    "left-right-spacing": "fit-to-size",
    "top-bottom-spacing": "fit-to-size",
    node_circle_size: (n) => 0,
  });

  function sort_nodes(asc) {
    T.traverse_and_compute(function (n) {
      var d = 1;
      if (n.children && n.children.length) {
        d += d3.max(n.children, function (d) {
          return d["count_depth"];
        });
      }

      n["count_depth"] = d;
    });
    T.resortChildren(function (a, b) {
      return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
    });
  }

  sort_nodes(true);
  t.style_nodes((e, n) => {
    if (n.children && n.children.length) return;
    /*if (variants.indexOf (n.data.name) >= 0) {
              e.style ("fill", "firebrick"); 
           } else {
              e.style ("fill", null); 
           }*/
    e.selectAll("title")
      .data([n.data.name])
      .join("title")
      .text((d) => d);
  });

  t.style_edges((e, n) => {
    const is_tested = results_json["tested"][i][n.target.data.name] == "test";
    if (is_tested) {
      e.style("stroke", "firebrick");
    } else {
      e.style("stroke", null);
    }
  });
  t.placenodes();
  t.update();
  return t;
}

const figure2 = display_tree(-1 + +tree_id.split(" ")[1]).show();
```

<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css'>
<div id="tree_container">${figure2}</div>

**Citation**

<p><tt><small>${results_json.analysis["citation"]}</small></tt></p>

```js
const svgSize = 700;
```
