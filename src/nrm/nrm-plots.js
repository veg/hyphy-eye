import * as d3 from "d3";
import * as _ from "lodash-es";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as d from "../stats/pairwise-distance.js";
import * as phylotree from "phylotree";

export function get_tree_objects(results_json, modelForTree) {
    const tree_objects = _.map (results_json.input.trees, (tree,i)=> {
        let T = new phylotree.phylotree (tree);
        T.branch_length_accessor = (n)=>results_json["branch attributes"][i][n.data.name][modelForTree];
        return T;
    });

    return tree_objects;
}

export function get_branch_lengths(results_json, model_summary, tree_objects) {
    const rootChildren = phylotreeUtils.rootChildren(tree_objects[0])

    let bl = [];
    _.each (results_json["branch attributes"]["0"], (d,b)=> {
        if (!rootChildren.has (b)) {
            let r = {'name' : b};
            _.each (model_summary, (m)=>r[m[0]] = d[m[0]]);
            bl.push (r);
        }
    });
    return bl;
}

export function display_tree(results_json, i, treeDim, treeLabels, tree_objects, availableDistances, distanceFunction, modelForTree) {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
 
      let T = tree_objects[i];
      var t = T.render({
        height:dim && dim[0] || 1024, 
        width:dim && dim[1] || 600,
        'align-tips' : treeLabels.indexOf ("align tips") >= 0,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=> 0,
        'draw-size-bubbles' : true,
        'node-span':(n)=> n.children ? 0.0 : 1,
        'internal-names' : treeLabels.indexOf ("show internal") >= 0
       } );


      let showSeqNames = treeLabels.indexOf ("sequence names") >= 0;
      let showFrequencies = treeLabels.indexOf ("show frequencies") >= 0;
      let distanceIndex = availableDistances.indexOf (distanceFunction);
  
       t.nodeLabel ((n)=> {
          let label = "";
          if (showSeqNames) label += n.data.name;
          if (showFrequencies) {
              try {
                let distances = results_json["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0];
                if (distanceIndex == 0)
                  label += " " + _.map (results_json["characters"][0], (d,i)=> d + ":" + floatFmt (distances[i])).join (', ');
                else 
                  label += " " + results_json["characters"][0][distanceIndex-1] + ":" + floatFormat (distances[distanceIndex-1]);
              } catch {};
          }
          return label;
      });

  
      let js_max = 0;

      _.each (T.getTips(), (n)=> {
              let js = d.distance (results_json["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0],results_json["branch attributes"]["0"][n.parent.data.name][modelForTree + " frequencies"][0], distanceFunction);
               js_max = js > js_max ? js : js_max;
               //console.log (n);
          
      });

   
      _.each (T.getInternals(), (n)=> {
          try {
            if (n.parent) {
                let js = d.distance (results_json["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0],results_json["branch attributes"]["0"][n.parent.data.name][modelForTree + " frequencies"][0], distanceFunction);
                 js_max = js > js_max ? js : js_max;
                 //console.log (n);
            }
          }  catch {};
      });
  
      function sort_nodes (asc) {
          T.traverse_and_compute (function (n) {
                  var d = 1;
                  if (n.children && n.children.length) {
                      d += d3.max (n.children, function (d) { return d["count_depth"];});
                  } 

                  n["count_depth"] = d;
              });
          T.resortChildren (function (a,b) {
              return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
          });
        }

        sort_nodes (true);
        t.style_nodes ((e,n) => {
           if (n.children && n.children.length) return; 
           let js = d.distance (results_json["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0],results_json["branch attributes"]["0"][n.data.name]["Observed frequencies"][0], distanceFunction);
           e.selectAll ("circle").style ("fill", t.color_scale (js));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });

        t.color_scale = d3.scaleSequentialLog([1e-10,js_max],d3.interpolateWarm);
        //treeMatrixColorScale.domain ([0,js_max]);

        t.style_edges ((e,n) => {
           e.style ("stroke", null);
           if (n.source.parent) {
             let js = d.distance (results_json["branch attributes"]["0"][n.source.data.name][modelForTree + " frequencies"][0],results_json["branch attributes"]["0"][n.target.data.name][modelForTree + " frequencies"][0], distanceFunction);
             e.style ("stroke", t.color_scale (js));
           }
        });
        t.placenodes();
        t.update();
        return t;      
    }