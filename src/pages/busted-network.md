```js
import * as bpnet from "../components/bipartite-network.js";
import * as forcenet from "../components/force-bp-net.js";
```

# BUSTED Results as a Bipartite Network

This is me exploring bipartite networks again, this time w BUSTED results.
These are the same data as the 'Support for postive selection' heatmap
in the BUSTED results summary demo page. We're filtering ER at >10 and 
only showing codons w links. Thats just for readability, well have to sort
something else for real use if we like this.

## Columnar bipartite network

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

const bpnet_svg = bpnet.render(filtered_data, document.createElement("div"));
```

<div>${bpnet_svg}</div>


## Force directed bipartite network

same idea as the other.. different layout. codons are larger circles, branches smaller.

pros: pretty obvious when a branch doesnt have much going on (bc its off in space), 
or is doing something different to other branches (bc its connected but still kinda off in space lol).

cons: overlaying phylogeny info meaningfully is a bit of a difficulty.. 
i think for realz nodes wouldnt get colored by group, bc we need to color links..
but they might be differentiated by shape or some other form of highlighting upon user-selected clades?
maybe there would be an independently scrolling phylotree to left that a user could choose clades from?
also, the only real opportunity for codon info here is in tooltips or similar.

my 2c, i dont currently think this is a primary result summary viz, but could be a complimentary one.
something offered after we get the primary thing sorted.

```js
const force_net = forcenet.render(filtered_data, document.createElement("div"));
```

<div>${force_net}</div>