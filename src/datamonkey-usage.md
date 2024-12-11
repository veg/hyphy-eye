```js
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import { weeklyPlot, sitesAndSequences } from "./components/usage.js";

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
  { name: "PRIME", url: "//datamonkey.org/prime/usage" },
  { name: "RELAX", url: "//datamonkey.org/relax/usage" },
  { name: "SLAC", url: "//datamonkey.org/slac/usage" },
  { name: "GARD", url: "//datamonkey.org/gard/usage" },
  { name: "MULTI-HIT", url: "//datamonkey.org/multi-hit/usage" },
];
```

# Datamonkey Usage Statistics

This dashboard visualizes data related to the usage of Datamonkey over time, including the number of sites and sequences utilized.

## FEL

```js
// Load the usage data from a JSON file
let usageData = await d3.json("//datamonkey.org/fel/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(usageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(usageData)}
  </div>
</div>

## aBSREL

```js
// Load the usage data from a JSON file
let absrelUsageData = await d3.json("//datamonkey.org/absrel/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(absrelUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(absrelUsageData)}
  </div>
</div>

## BGM

```js
// Load the usage data from a JSON file
let bgmUsageData = await d3.json("//datamonkey.org/bgm/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(bgmUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(bgmUsageData)}
  </div>
</div>

## BUSTED

```js
// Load the usage data from a JSON file
let bustedUsageData = await d3.json("//datamonkey.org/busted/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(bustedUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(bustedUsageData)}
  </div>
</div>

## Contrast-FEL

```js
// Load the usage data from a JSON file
let cFelUsageData = await d3.json("//datamonkey.org/contrast_fel/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(cFelUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(cFelUsageData)}
  </div>
</div>

## FADE

```js
// Load the usage data from a JSON file
let fadeUsageData = await d3.json("//datamonkey.org/fade/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(fadeUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(fadeUsageData)}
  </div>
</div>

## MEME

```js
// Load the usage data from a JSON file
let memeUsageData = await d3.json("//datamonkey.org/meme/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(memeUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(memeUsageData)}
  </div>
</div>

## RELAX

```js
// Load the usage data from a JSON file
let relaxUsageData = await d3.json("//datamonkey.org/relax/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(relaxUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(relaxUsageData)}
  </div>
</div>

## SLAC

```js
// Load the usage data from a JSON file
let slacUsageData = await d3.json("//datamonkey.org/slac/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(slacUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(slacUsageData)}
  </div>
</div>

## GARD

```js
// Load the usage data from a JSON file
let gardUsageData = await d3.json("//datamonkey.org/gard/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(gardUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(gardUsageData)}
  </div>
</div>

## MULTI-HIT

```js
// Load the usage data from a JSON file
let multiUsageData = await d3.json("//datamonkey.org/multihit/usage");
```

<div class="grid grid-cols-12">
  <div class="card">
    <h2>Weekly Stats</h2>
    ${weeklyPlot(multiUsageData)}
  </div>

  <div class="card">
    <h2>Sites vs Sequences</h2>
    ${sitesAndSequences(multiUsageData)}
  </div>
</div>
