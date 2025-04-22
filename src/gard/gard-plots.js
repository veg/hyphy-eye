import * as d3 from "d3";
import * as _ from "lodash-es";
import * as phylotreeUtils from "../utils/phylotree-utils.js"
import * as phylotree from "phylotree";

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