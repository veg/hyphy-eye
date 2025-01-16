# hyphy-eye

</br>

**This is an Observable Framework app where visualization components for hyphy-vision can be built and tested.**

</br>

It is an experimental WIP, and so much of what follows is subject to change, but the idea is this:

1. People can develop standalone components and give them a home here. Those are vanilla js and can be
exported for use in other contexts by rolling up and making an npm package of the whole lot.
2. Components can have demo pages here where they are tested, and those demo pages can be auto-deployed
to ObservableHQ with new commits. Devs can then easily identify when they've broken someone else's work.
3. As we decide we're happy with components we can update the Observable Notebooks that inspired them to switch 
to using the component. Eventually we can cut Observable Notebooks out of the process entirely, except for
use in building rapid prototypes.
4. Components and demo pages should be designed, as much as is reasonable, to reduce code duplication and maximize
reusability in other contexts. I think I'd like to generally follow the design proposed [here](https://bost.ocks.org/mike/chart/).
5. Eventually, and as needed, this repo can grow to incorporate formal unit testing, automated linting, other fun
stuffs.

