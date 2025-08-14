import * as d3 from "d3";
import * as _ from "lodash-es";
import * as phylotreeUtils from "../utils/phylotree-utils.js"
import * as phylotree from "phylotree";
import * as utils from "./gard-utils.js";

/**
 * Converts the breakpoint data in the results JSON into an array of tree
 * objects which can be used for visualization.
 *
 * @param {Object} results_json - The JSON object containing the results
 *   of the GARD analysis.
 * 
 * @returns {Array<Object>} An array of tree objects, where each tree object
 *   contains the breakpoint positions and a phylotree object.
 */
export function getGardTreeObjects(results_json) {
    const tree_objects = _.map (results_json.breakpointData, (bp)=> {return {
        'bps' : bp.bps[0],
        'tree' : new phylotree.phylotree (bp.tree)
    }});

    return tree_objects;
}

/**
 * Calculate the total branch lengths of trees at specified breakpoints.
 *
 * @param {Array<Object>} tree_objects - An array of tree objects, each containing
 * a `bps` attribute representing breakpoints and a `tree` attribute representing
 * the phylotree.
 * 
 * @returns {Array<Object>} An array of objects with each containing:
 *   - `x`: The breakpoint position.
 *   - `L`: The total branch length of the tree.
 */

export function getGardTreeLengths(tree_objects) {
    const tree_lengths = _.flatten(_.map (tree_objects, (t)=> {
        let L = phylotreeUtils.totalTreeLength (t.tree);
        return [{
            'x' : t.bps[0],
            'L' : L
        },
        {
            'x' : t.bps[1],
            'L' : L
        }]
    }));

    return tree_lengths;
}

export function getGardTreeDivs(tree_objects, displayed_trees) {
    const svgSize = Math.max(phylotreeUtils.seqNames(tree_objects[0].tree).length * 10, 300);

    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = '400px 400px';

    _.each(_.range(tree_objects.length), (i) => {
        const treeDiv = document.createElement('div');
        const svgElement = displayed_trees[i].show();
        svgElement.setAttribute('height', `${svgSize}px`);
        treeDiv.appendChild(svgElement);

        const infoDiv = document.createElement('div');
        infoDiv.textContent = `Tree ${i + 1}, coordinate range ${tree_objects[i].bps[0]}-${tree_objects[i].bps[1]}`;

        container.appendChild(infoDiv);
        container.appendChild(treeDiv);
    });

    return container.outerHTML;
} 

/**
 * Render all trees in the given array of tree objects, and return an array of
 * the rendered trees.
 * 
 * @param {Array<Object>} tree_objects - An array of tree objects, each containing
 * a `bps` attribute representing breakpoints and a `tree` attribute representing
 * the phylotree.
 * 
 * @returns {Array<Phylotree>} An array of the rendered trees.
 */
export function getGardDisplayedTrees(tree_objects, variants) {
    const svgSize = Math.max(phylotreeUtils.seqNames (tree_objects[0].tree).length * 10, 300)

    return _.map (tree_objects, (tree_object,i)=> {
    
        let tree = tree_object.tree;
        var t = tree.render("#tree_" + i, {
        height:svgSize, 
        width:300,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=>0
       } );
      
        //t.node_label((n)=>{
        //    if (n.children && n.children.length) return "";
        //    return n.data.name.substr (0,10);
        //});
      
          function sort_nodes (asc) {
          tree.traverse_and_compute (function (n) {
                  var d = 1;
                  if (n.children && n.children.length) {
                      d += d3.max (n.children, function (d) { return d["count_depth"];});
                  } 

                  n["count_depth"] = d;
              });
          //tree.resort_children (function (a,b) {
          //    return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
          //});
        }

        sort_nodes (true);
        t.style_nodes ((e,n) => {
           if (n.children && n.children.length) return; 
           if (variants.indexOf (n.data.name) >= 0) {
              e.style ("fill", "firebrick"); 
           } else {
              e.style ("fill", null); 
           }
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });
        t.style_edges ((e,n) => {
           if (n.target.children && n.target.children.length) return; 
           if (variants.indexOf (n.target.data.name) >= 0) {
              e.style ("stroke", "firebrick"); 
           } else {
              e.style ("stroke", null); 
           }
        });
        t.placenodes();
        t.update();
         return t;      
    });
}

// Generator for breakpoint placement and c-AIC improvements
export function GardBreakpointPlotGenerator(resultsJson, opts = {}) {
  const attrs = utils.getGardAttributes(resultsJson);
  const {breakpointsProfile, caicImprovements, stages} = attrs;
  return {
    hconcat: [
      {
        width: opts.width || 650,
        height: stages * (opts.rowHeight || 12),
        data: {values: breakpointsProfile},
        mark: {type: "point", tooltip: true, filled: true},
        encoding: {
          x: {field: "bp", type: "quantitative", axis:{grid:false,title:"Coordinate"}},
          y: {field: "model", type: "ordinal", axis:{title:"# breakpoints"}},
          size: {condition:{test:`datum['span'] >= ${stages/2}`,value:64},value:16},
          color: {condition:{test:`datum['span'] >= ${stages/2}`,value:"firebrick"},value:"gray"}
        }
      },
      {
        width: opts.caicWidth || 120,
        height: stages * (opts.rowHeight || 12),
        data: {values: caicImprovements},
        mark: {type:"line",tooltip:true,filled:false,points:true},
        encoding: {
          x: {field:"daic",type:"quantitative",axis:{grid:false,title:"Delta c-AIC"},scale:{type:"log"}},
          y: {field:"bp",type:"ordinal",axis:null}
        }
      }
    ]
  };
}

// Generator for model-averaged support for breakpoint placement
export function GardSupportPlotGenerator(resultsJson, opts = {}) {
  const attrs = utils.getGardAttributes(resultsJson);
  return {
    width: opts.width || 800,
    height: opts.height || 200,
    data: {values: attrs.siteSupport},
    mark: {type:"rule",tooltip:true},
    encoding: {
      x: {field:"bp",type:"quantitative",axis:{grid:false,title:"coordinate"}},
      y: {field:"support",type:"quantitative",axis:{grid:false,title:"Model averaged support"}}
    }
  };
}

// Generator for total tree length by partition
export function GardTreeLengthPlotGenerator(resultsJson, opts = {}) {
    // Accept resultsJson, compute treeLengths internally
    const treeObjects = getGardTreeObjects(resultsJson);
    const lengths = getGardTreeLengths(treeObjects);
    return {
        width: opts.width || 800,
        height: opts.height || 200,
        data: {values: lengths},
        mark: {type: "rule",tooltip:true},
        encoding: {
            x: {field:"x",type:"quantitative",axis:{grid:false,title:"coordinate"}},
            y: {field:"L",type:"quantitative",axis:{grid:false,title:"Total tree length"}}
        }
    };
}

/**
 * Generator for a grid of breakpoint trees
 * @param {Object} resultsJson - GARD results JSON
 * @param {string} method - method name (unused)
 * @param {Object} options - options object, supports 'variants' array to highlight
 * @returns {string} HTML string for the grid of trees
 */
export function GardTreeGridGenerator(resultsJson, method, options = {}) {
    // Verify this is being called with the GARD method
    if (method !== "GARD") {
        console.warn(`GardTreeGridGenerator called with method ${method}, expected "GARD"`); 
    }

     // Ensure phylotree CSS is loaded once
    if (typeof document !== 'undefined' && !document.getElementById('phylotree-css')) {
        const link = document.createElement('link');
        link.id = 'phylotree-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css';
        document.head.appendChild(link);
    }

    const treeObjects = getGardTreeObjects(resultsJson);
    const variants = options.variants || [];
    const displayed = getGardDisplayedTrees(treeObjects, variants);
    return getGardTreeDivs(treeObjects, displayed);
}