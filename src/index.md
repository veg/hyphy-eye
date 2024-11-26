# hyphy-vision-components

</br>

**This is an Observable Framework app where visualization components for hyphy-vision can be built and tested.**

</br>

It is an experimental WIP, and so much of what follows is subject to change, but the idea is this:

1. People can develop standalone components and give them a home here. Those are vanilla js and can be
exported for use in other contexts by adding something like the following to the app config:
```
export default {
  dynamicPaths: [
    "/component.js"
  ]
};
```
and then importing them elsewhere like:
```
<script type="module">

import {Chart} from "https://my-workspace.observablehq.cloud/my-app/component.js";

document.body.append(await Component());

</script>
```
2. Components can have demo pages here where they are tested, and those demo pages can be auto-deployed
to ObservableHQ with new commits.
3. If needed, entire demo pages can be embedded by first turning off some Observerable Framework defaults in the
markdown file like:
```
---
sidebar: false
header: false
footer: false
pager: false
---
```
and then dropping the entire page in an iframe:
```
<iframe scrolling="no" src="https://my-workspace.observablehq.cloud/my-app/component"></iframe>
```
4. Components and demo pages should be designed, as much as is reasonable, to reduce code duplication and maximize
reusability in other contexts.
5. Eventually, and as needed, this repo can grow to incorporate formal unit testing, automated linting, other fun
stuffs.

