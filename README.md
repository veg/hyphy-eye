# hyphy-vision-components

This repo is a WIP, all that follows should be considered subject to change.

**The idea for this so far is that it may serve as a place where:**
1. visualization components for hyphy-vision/ datamonkey can be built and tested
2. some basic statistics and utility functions that those components rely on can live
3. we can build various demo pages for individual components, which are automatically deployed on commit to main, to try to protect them from regressions
4. we can convert existing Observable Notebooks. These will also get demo pages, to compare to the original Notebook. 
5. new results summaries for HyPhy methods might be prototyped, or new features for existing ones. (If people prefer prototyping in Notebook and converting, also ok!)
6. components and utility functions get bundled into an npm package that get be used in production


**Importantly, though, I do NOT currently expect this project to:**
1. see results summaries go directly from here to production. 
2. publish any artifacts directly through observable hq

If we want to put markdown pages from here into production that will require some additional thinking/ planning/ development.

This is an [Observable Framework](https://observablehq.com/framework/) app. To install the required dependencies, run:

```
npm install
```

Then, to start the local preview server, run:

```
npm run dev
```

Then visit <http://localhost:3000> to preview your app.

For more, see <https://observablehq.com/framework/getting-started>.

## Project structure

Our Framework project looks something like this:

```ini
.
├─ src
│  ├─ components
│  │  └─ omega-plots.js        # an importable module
│  ├─ stats
│  │  └─ chi-squared.js        # an importable module
│  ├─ utils
│  │  └─ phylotree-utils.js    # an importable module
│  ├─ data
│  │  └─ meme.json             # a static data file for testing
│  ├─ component-demo.md        # a page for testing a component
│  ├─ meme.md                  # a page for comparison to a Notebook
│  └─ index.md                 # the home page
├─ .gitignore
├─ observablehq.config.js      # the app config file
├─ package.json
└─ README.md
```

**`src`** - This is the “source root” — where your source files live. Pages go here. Each page is a Markdown file. Observable Framework uses [file-based routing](https://observablehq.com/framework/project-structure#routing), which means that the name of the file controls where the page is served. You can create as many pages as you like. Use folders to organize your pages.

**`src/index.md`** - This is the home page for your app. You can have as many additional pages as you’d like, but you should always have a home page, too.

**`src/data`** - You can put [data loaders](https://observablehq.com/framework/data-loaders) or static data files anywhere in your source root, but we recommend putting them here.

**`src/components`** - You can put shared [JavaScript modules](https://observablehq.com/framework/imports) anywhere in your source root, but we recommend putting them here. This helps you pull code out of Markdown files and into JavaScript modules, making it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`src/stats`** - You can put shared stats functions here, which the various components or demo pages might use. This makes it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`src/utils`** - You can put shared utility functions here, which the various components or demo pages might use. This makes it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`observablehq.config.js`** - This is the [app configuration](https://observablehq.com/framework/config) file, such as the pages and sections in the sidebar navigation, and the app’s title.

## Command reference

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm install`            | Install or reinstall dependencies                        |
| `npm run dev`        | Start local preview server                               |
| `npm run build`      | Build your static site, generating `./dist`              |
| `npm run deploy`     | Deploy your app to Observable                            |
| `npm run clean`      | Clear the local data loader cache                        |
| `npm run observable` | Run commands like `observable help`                      |
