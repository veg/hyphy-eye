# Reusable Color Maps

<br/>

**All color maps here are designed to be color-deficient friendly and visually consistent.**

<br/>

```js
import * as continuous_schemes from "../color-maps/crameri.js";
import * as categorical_schemes from "../color-maps/tol.js";
import * as custom_schemes from "../color-maps/custom.js";
import * as utils from "../color-maps/utils.js";
import * as Plot from "npm:@observablehq/plot";

console.log(continuous_schemes)
// TODO: refactor, as some of this logic is reused in the function below as well
// and is likely to be reused for any other color schemes we add
function getLabeledRamps(schemesJson) {
    const allSchemes = document.createElement("div")
    
    for (let name in schemesJson) {
        const schemeElement = document.createElement("div")
        const label = document.createElement("text")
        label.textContent = name
        schemeElement.append(label)
        const rampFxn = utils.ramp(continuous_schemes[name])
        const exLegend = Plot.legend({
            color: {
                type: "linear",
                interpolate: rampFxn,
            },
            width: 700
        })
        schemeElement.appendChild(exLegend)
        schemeElement.appendChild(document.createElement("br"))
        allSchemes.append(schemeElement)
    }

    return allSchemes
}
```

## Crameri's Continuous Schemes

</br>
<div>${getLabeledRamps(continuous_schemes)}</div>
</br>

```js
function getLabeledSwatches(schemesJson) {
    const allSchemes = document.createElement("div")

    for (let name in schemesJson) {
        const schemeElement = document.createElement("div")
        const label = document.createElement("text")
        label.textContent = name
        schemeElement.append(label)
        const scheme = categorical_schemes[name]
        const exLegend = Plot.legend({
            color: {
                type: "categorical",
                domain: scheme.map((d, i) => `${i}`),
                range: scheme
            },
            width: scheme.length * 60,
            columns: scheme.length,
            swatchHeight: 25,
            swatchWidth: 25
        })
        schemeElement.appendChild(exLegend)
        schemeElement.appendChild(document.createElement("br"))
        allSchemes.append(schemeElement)
    }
    
    return allSchemes
}
```

</br>

## Tol's Categorical Schemes

</br>
<div>${getLabeledSwatches(categorical_schemes)}</div>
</br>

</br>

## Custom Schemes

```js
const scheme = custom_schemes.binary_with_gray
const legend = 
    Plot.legend({
        color: {
            type: "categorical",
            domain: scheme.map((d, i) => `${i}`),
            range: scheme
        },
        width: scheme.length * 60,
        columns: scheme.length,
        swatchHeight: 25,
        swatchWidth: 25
    })
```

</br>
<div>
    <text>binary_with_gray</text>
    <div>${legend}</div>
</div>