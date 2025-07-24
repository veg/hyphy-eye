# HyPhy Method Identifier

This page allows you to upload a HyPhy results JSON file and identifies which HyPhy method was used to produce it.

```js
import * as d3 from "d3";
import * as _ from "lodash-es";
import { FileAttachment } from "observablehq:stdlib";
import { html } from "htl";
import { identifyHyPhyMethod } from "../utils/general-utils.js";
```

## Results file

```js
const resultsFile = view(Inputs.file({label: html`<b>HyPhy results json:</b>`, accept: ".json", required: true}));
console.log("resultsFile", resultsFile)
```

```js
let resultsJson = await resultsFile.json();
console.log("resultsJson", resultsJson)
```

```js
let identifiedMethod = identifyHyPhyMethod(resultsJson);
console.log("identifiedMethod", identifiedMethod)
```

## Identified Method

${identifiedMethod}