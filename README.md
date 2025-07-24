# HyPhy-Eye

## Overview

HyPhy-Eye is an Observable Framework application for building, testing, and exporting visualization components for Datamonkey and HyPhy results. It provides a structured environment where you can develop components with example data, view them in example pages, and export them as an npm package for use in production environments.

The project includes:

- Reusable visualization components for HyPhy analysis results
- Utility functions for data processing and manipulation
- Statistical functions for analysis
- Example pages demonstrating each HyPhy method
- A standardized export system for npm packaging

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/veg/hyphy-eye.git
cd hyphy-eye

# Install dependencies
npm install
```

#### Development

This is an [Observable Framework](https://observablehq.com/framework/) app. To start the local preview server, run:

```bash
# Start the development server
npm run dev
```

This will launch the Observable Framework application at http://localhost:3000, where you can browse and interact with the example pages.

## Building Components

Components are located in the `src/components` directory. Each component should:

1. Be in its own file or subdirectory
2. Export a function that returns an Observable-compatible element
3. Include appropriate TypeScript definitions if applicable

Example:

```javascript
// src/components/my-component.js
export function MyComponent(data, options = {}) {
  // Component implementation
  return element;
}
```

## Testing Components

You can test components by creating example pages in the `src/pages` directory:

1. Create a new markdown file in `src/pages`
2. Import and use your component in the page
3. View the page in the development server

Example:

```markdown
# My Component Example

```js
import { MyComponent } from '../components/my-component.js';
const data = { /* example data */ };
```

<div>${MyComponent(data)}</div>
```

## HyPhy Methods Registry

HyPhy-Eye includes a comprehensive registry of all supported HyPhy methods and their visualizations. The registry provides a structured way to discover and use available visualizations for each method.

### Registry Structure

The registry includes:

- All supported HyPhy methods (BUSTED, aBSREL, FEL, MEME, GARD, NRM, MULTIHIT)
- Available visualizations for each method (plots, tables, networks, trees)
- Component paths for each visualization
- Method-specific attribute getter functions
- Default configuration options

### Updating the Registry

To add or update a method in the registry:

1. Edit `src/registry.ts` to add/update the method definition
2. Ensure the method includes:
   - A clear name and description
   - List of visualizations with:
     - Name and description
     - Component path (relative to `src/`)
     - Visualization type (plot, table, network, or tree)
     - Options object with default values
   - Attribute getter function information with parameters

Example of adding a new visualization:

```typescript
// Add a new visualization to an existing method
FEL: {
    name: 'FEL',
    description: 'Fixed Effects Likelihood',
    visualizations: [
        {
            name: 'New Visualization',
            description: 'Description of the visualization',
            component: 'new-component.js',
            type: 'plot',
            options: {
                // Default options
            }
        }
    ],
    attributes: {
        function: 'getFelAttributes',
        parameters: {
            resultsJson: 'Object'
        }
    }
}
```

### Using the Registry

The registry can be imported and used in two ways:

```javascript
// Import the registry
import { HyPhyMethods } from 'hyphy-eye/registry';

// Get available methods
const methods = Object.values(HyPhyMethods);

// Get visualizations for a specific method
const felVisualizations = HyPhyMethods.FEL.visualizations;

// Get the attribute getter function for a method
const getBustedAttrs = HyPhyMethods.BUSTED.attributes.function;
```

## Exporting as an npm Package

All components, utilities and functions are exported through `src/index.js`. The registry is also exported through `src/registry.js`.

### To use HyPhy-Eye in another project:

```bash
# Build the package
npm run build-npm

# Pack it for local testing
npm pack

# Or publish to npm (requires npm credentials)
npm publish
```

Then in your project:

```bash
npm install hyphy-eye
```

```javascript
// Import specific components or utilities
import { TileTable, getAbsrelAttributes } from 'hyphy-eye';
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For more information on Observable Framework, see <https://observablehq.com/framework/getting-started>.

PRs are welcome!

## Project structure

Our Framework project looks something like this:

```ini
.
├─ src
│  ├─ components
│  │  ├─ tile-table            # component subdirectory
│  │  ├─ rate-summary-plots    # component subdirectory
│  │  └─ omega-plots.js        # an importable module
│  ├─ stats
│  │  └─ chi-squared.js        # an importable module
│  ├─ utils
│  │  └─ phylotree-utils.js    # an importable module
│  ├─ data
│  │  └─ meme.json             # a static data file for testing
│  ├─ pages                    # directory for all example pages
│  │  ├─ absrel.md             # aBSREL method page
│  │  ├─ busted.md             # BUSTED method page
│  │  ├─ meme.md               # MEME method page
│  │  └─ component-demo.md     # a page for testing a component
│  ├─ absrel                   # method-specific utilities
│  │  └─ absrel-utils.js       # utility functions for aBSREL
│  ├─ busted                   # method-specific utilities
│  │  └─ busted-utils.js       # utility functions for BUSTED
│  ├─ meme                     # method-specific utilities
│  │  └─ meme-utils.js         # utility functions for MEME
│  └─ index.md                 # the home page
├─ .gitignore
├─ observablehq.config.js      # the demo app config file
├─ package.json
├─ README.md                   # the thing you're reading currently
└─ rollup.config.js            # configuration for distribution
```

**`src`** - This is the “source root” — where your source files live. Pages go here. Each page is a Markdown file. Observable Framework uses [file-based routing](https://observablehq.com/framework/project-structure#routing), which means that the name of the file controls where the page is served. You can create as many pages as you like. Use folders to organize your pages.

**`src/index.md`** - This is the home page for your app. You can have as many additional pages as you’d like, but you should always have a home page, too.

**`src/data`** - You can put [data loaders](https://observablehq.com/framework/data-loaders) or static data files anywhere in your source root, but we recommend putting them here.

**`src/components`** - You can put shared [JavaScript modules](https://observablehq.com/framework/imports) anywhere in your source root, but we recommend putting them here. This helps you pull code out of Markdown files and into JavaScript modules, making it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`src/stats`** - You can put shared stats functions here, which the various components or demo pages might use. This makes it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`src/utils`** - You can put shared utility functions here, which the various components or demo pages might use. This makes it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`observablehq.config.js`** - This is the [app configuration](https://observablehq.com/framework/config) file, such as the pages and sections in the sidebar navigation, and the app’s title.

## Command reference

| Command              | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `npm install`        | Install or reinstall dependencies                        |
| `npm run dev`        | Start local preview server                               |
| `npm run build`      | Build your static site, generating `./dist`              |
| `npm run deploy`     | Deploy your app to Observable                            |
| `npm run clean`      | Clear the local data loader cache                        |
| `npm run observable` | Run commands like `observable help`                      |
| `npm run bundle`     | Prepare javascript modules and types for distribution    |
| `npm run clean-npm`  | Cleans `/dist` from previous `bundle` runs               |
| `npm run build-npm`  | Runs `clean-npm` followed by `bundle`                   |
