```js
import * as bpnet from "../components/bipartite-network.js";

```

# BUSTED Results as a Bipartite Network

This is me exploring bipartite networks again, this time w BUSTED results.
These are the same data as the 'Support for postive selection' heatmap
in the BUSTED results summary demo page. We're filtering ER at >10 and 
only showing codons w links. Thats just for readability, well have to sort
something else for real use if we like this.

Ideas for real use: two filters one for pos ER, another neg.
stroke width for pos and neg ER might be different..
should color by pos or neg too, just two hues like red + blue.

alt idea might be to have a gradient diverging colormap w midpoint at gray = 1,
and rely on the very small stroke width and light color to help w readability ?
that would eliminate the filters, but not the need for different stroke width scales 
for pos and neg ER.. 

```js
// this is derived from busted_test_data.json
const data = await FileAttachment("../data/busted_test_network.json").json();

// pass just ER < 10 for now. add input later maybe
const filteredLinks = data.links.filter(function(d) {
    return(d.value >= 10);
});
// only show contributing codons ??
const filteredCodons = data.column2NodeIds.filter(function(d) {
    return(filteredLinks.some(link => link.target === d));
});
//const filteredCodons = data.column2NodeIds;
const filtered_data = {
    column1NodeIds: data.column1NodeIds,
    column2NodeIds: filteredCodons,
    links: filteredLinks
};
console.log(filtered_data);

const bpnet_svg = bpnet.render(filtered_data, document.createElement("div"));
```

<div>${bpnet_svg}</div>
