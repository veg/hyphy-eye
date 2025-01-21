# Datamonkey Usage

```js
html`<style>
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>`;
```

```js
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import { weeklyPlot, sitesAndSequences } from "./components/usage.js";
import { html } from "npm:htl";

// A list of methods
const methods = [
  { name: "FEL", url: "//datamonkey.org/fel/usage" },
  { name: "aBSREL", url: "//datamonkey.org/absrel/usage" },
  { name: "BGM", url: "//datamonkey.org/bgm/usage" },
  { name: "BUSTED", url: "//datamonkey.org/busted/usage" },
  { name: "Contrast-FEL", url: "//datamonkey.org/contrast_fel/usage" },
  { name: "FADE", url: "//datamonkey.org/fade/usage" },
  { name: "MEME", url: "//datamonkey.org/meme/usage" },
  { name: "NRM", url: "//datamonkey.org/nrm/usage" },
  { name: "RELAX", url: "//datamonkey.org/relax/usage" },
  { name: "SLAC", url: "//datamonkey.org/slac/usage" },
  { name: "GARD", url: "//datamonkey.org/gard/usage" },
  { name: "MULTI-HIT", url: "//datamonkey.org/multihit/usage" },
];

function loadingCard(method) {
  return html`
    <div class="grid grid-cols-12">
      <div class="card grid-colspan-6" style="padding: 1rem;">
        <h2>${method.name} Weekly Stats</h2>
        <div
          style="height: 400px; display: flex; align-items: center; justify-content: center;"
        >
          <div class="loading-spinner">
            <div
              style="
              width: 50px;
              height: 50px;
              border: 5px solid #f3f3f3;
              border-top: 5px solid var(--theme-foreground-focus);
              border-radius: 50%;
              animation: spin 1s linear infinite;
            "
            ></div>
          </div>
        </div>
      </div>
      <div class="card grid-colspan-6" style="padding: 1rem;">
        <h2>${method.name} Sites vs Sequences</h2>
        <div
          style="height: 400px; display: flex; align-items: center; justify-content: center;"
        >
          <div class="loading-spinner">
            <div
              style="
              width: 50px;
              height: 50px;
              border: 5px solid #f3f3f3;
              border-top: 5px solid var(--theme-foreground-focus);
              border-radius: 50%;
              animation: spin 1s linear infinite;
            "
            ></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderMethodUsage(method) {
  try {
    const usageData = await d3.json(method.url);
    return html`
      <div class="grid grid-cols-12">
        <div class="card grid-colspan-6" style="padding: 1rem;">
          <h2>${method.name} Weekly Stats</h2>
          <div>${weeklyPlot(usageData)}</div>
        </div>
        <div class="card grid-colspan-6" style="padding: 1rem;">
          <h2>${method.name} Sites vs Sequences</h2>
          <div>${sitesAndSequences(usageData)}</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error(`Error fetching data for ${method.name}:`, error);
    return html`
      <div class="grid grid-cols-12">
        <div class="card grid-colspan-12" style="padding: 1rem;">
          <div class="error">
            Failed to load data for ${method.name}: ${error.message}
          </div>
        </div>
      </div>
    `;
  }
}

// Display loading states for all methods
for (const method of methods) {
  display(loadingCard(method));
}

// Start loading all methods in parallel
methods.forEach(async (method, index) => {
  const result = await renderMethodUsage(method);
  // Replace the corresponding loading placeholder with actual content
  document.querySelectorAll(".grid.grid-cols-12")[index].replaceWith(result);
});
```
