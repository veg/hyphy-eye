# Reusable Color Maps

<br/>
<br/>

```js
import * as colors from "./color-maps.js"
import * as Plot from "npm:@observablehq/plot";

const schemes = colors.crameri;

function getLabeledRamps(schemesJson) {
    const allSchemes = document.createElement('div')
    
    for (let name in schemesJson) {
        const schemeElement = document.createElement('div')
        const label = document.createElement('text')
        label.textContent = name;
        schemeElement.append(label)
        console.log(schemes[name])
        const rampFxn = colors.ramp(schemes[name])
        console.log(rampFxn)
        const exLegend = Plot.legend({
            color: {
                type: "linear",
                interpolate: rampFxn,
            },
            width: 512
        })
        schemeElement.appendChild(exLegend)
        schemeElement.appendChild(document.createElement('br'))
        allSchemes.append(schemeElement)
    }

    return allSchemes
}

console.log(getLabeledRamps(schemes))
```

<div>${getLabeledRamps(schemes)}</div>