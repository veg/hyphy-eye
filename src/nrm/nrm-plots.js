import * as d3 from "d3";
import * as _ from "lodash-es";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as d from "../stats/pairwise-distance.js";

export function getNrmBranchLengths(resultsJson, modelSummary, treeObjects) {
    const rootChildren = phylotreeUtils.rootChildren(treeObjects[0])

    let bl = [];
    _.each (resultsJson["branch attributes"]["0"], (d,b)=> {
        if (!rootChildren.has (b)) {
            let r = {'name' : b};
            _.each (modelSummary, (m)=>r[m[0]] = d[m[0]]);
            bl.push (r);
        }
    });
    return bl;
}

export function getNrmTree(resultsJson, i, treeDim, treeLabels, treeObjects, availableDistances, distanceFunction, modelForTree) {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
 
      let T = treeObjects[i];
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
                let distances = resultsJson["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0];
                if (distanceIndex == 0)
                  label += " " + _.map (resultsJson["characters"][0], (d,i)=> d + ":" + floatFmt (distances[i])).join (', ');
                else 
                  label += " " + resultsJson["characters"][0][distanceIndex-1] + ":" + floatFormat (distances[distanceIndex-1]);
              } catch {};
          }
          return label;
      });

  
      let jsMax = 0;

      _.each (T.getTips(), (n)=> {
              let js = d.distance (resultsJson["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0],resultsJson["branch attributes"]["0"][n.parent.data.name][modelForTree + " frequencies"][0], distanceFunction, distanceIndex);
               jsMax = js > jsMax ? js : jsMax;
               //console.log (n);
          
      });

   
      _.each (T.getInternals(), (n)=> {
          try {
            if (n.parent) {
                let js = d.distance (resultsJson["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0],resultsJson["branch attributes"]["0"][n.parent.data.name][modelForTree + " frequencies"][0], distanceFunction);
                 jsMax = js > jsMax ? js : jsMax;
                 //console.log (n);
            }
          }  catch {};
      });
  
      function sortNodes (asc) {
          T.traverse_and_compute (function (n) {
                  var d = 1;
                  if (n.children && n.children.length) {
                      d += d3.max (n.children, function (d) { return d["countDepth"];});
                  } 

                  n["countDepth"] = d;
              });
          T.resortChildren (function (a,b) {
              return (a["countDepth"] - b["countDepth"]) * (asc ? 1 : -1);
          });
        }

        sortNodes (true);
        t.style_nodes ((e,n) => {
           if (n.children && n.children.length) return; 
           let js = d.distance (resultsJson["branch attributes"]["0"][n.data.name][modelForTree + " frequencies"][0],resultsJson["branch attributes"]["0"][n.data.name]["Observed frequencies"][0], distanceFunction);
           e.selectAll ("circle").style ("fill", t.colorScale (js));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
        });

        t.colorScale = d3.scaleSequentialLog([1e-10,jsMax],d3.interpolateWarm);
        //treeMatrixColorScale.domain ([0,jsMax]);

        t.style_edges ((e,n) => {
           e.style ("stroke", null);
           if (n.source.parent) {
             let js = d.distance (resultsJson["branch attributes"]["0"][n.source.data.name][modelForTree + " frequencies"][0],resultsJson["branch attributes"]["0"][n.target.data.name][modelForTree + " frequencies"][0], distanceFunction);
             e.style ("stroke", t.colorScale (js));
           }
        });
        t.placenodes();
        t.update();
        return t;      
}