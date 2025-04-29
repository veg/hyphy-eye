import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
import * as _ from "lodash-es";
import * as phylotreeUtils from "../utils/phylotree-utils.js";
import * as d from "../stats/pairwise-distance.js";
import * as utils from "./nrm-utils.js";

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
    let dim = treeDim?.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
 
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

// Generator for phylogenetic tree view with legend (Figure 2)
export function NrmTreePlotGenerator(resultsJson, opts = {}) {
  const attrs = utils.getNrmAttributes(resultsJson);
  const treeDim = opts.treeDim || null;
  const treeLabels = opts.treeLabels || [];
  const availableDistances = opts.availableDistances || [];
  const distanceFunction = opts.distanceFunction || 'default';
  const modelForTree = opts.modelForTree || attrs.bestModel;
  const treeObjects = phylotreeUtils.getTreeObjects(resultsJson, modelForTree);
  const figure = getNrmTree(resultsJson, 0, treeDim, treeLabels, treeObjects, availableDistances, distanceFunction, modelForTree);
  const container = document.createElement('div');
  const scheme = document.createElement('div');
  const label = document.createElement('text');
  label.textContent = opts.label || 'Distance';
  scheme.appendChild(label);
  const legend = Plot.legend({
    color: {
      type: 'linear',
      interpolate: figure.colorScale.interpolate,
      domain: figure.colorScale.domain(),
      range: figure.colorScale.range(),
      ticks: 5,
      tickFormat: 'g'
    },
    width: opts.legendWidth || 200
  });
  scheme.appendChild(legend);
  scheme.appendChild(document.createElement('br'));
  container.appendChild(scheme);
  container.appendChild(figure.show());
  return container;
}

export function NrmBranchLengthComparisonPlotGenerator(resultsJson, opts = {}) {
  const attrs = utils.getNrmAttributes(resultsJson);
  // determine fields for x and y
  const xField = opts.xField || attrs.modelSummary[0][0];
  const yField = opts.yField || attrs.modelSummary[1][0];
  // build tree objects
  const treeObjects = phylotreeUtils.getTreeObjects(resultsJson, opts.modelForTree || attrs.bestModel);
  const branchLengths = getNrmBranchLengths(resultsJson, attrs.modelSummary, treeObjects);
  return {
    data: { values: branchLengths },
    width: opts.width || 400,
    height: opts.height || 400,
    layer: [
      {
        mark: { type: "point", opacity: 0.5, size: 36, tooltip: true, filled: true, clip: true },
        encoding: {
          x: { field: xField, type: "quantitative", title: xField, axis: { grid: false, titleFontSize: 18 } },
          y: { field: yField, type: "quantitative", title: yField, axis: { grid: false, titleFontSize: 18 } },
          stroke: { value: "black" },
          color: { value: "grey" }
        }
      },
      {
        mark: { type: "line", color: "firebrick", clip: true },
        transform: [{ regression: yField, on: xField, method: "linear" }],
        encoding: {
          x: { field: xField, type: "quantitative" },
          y: { field: yField, type: "quantitative" }
        }
      },
      {
        transform: [
          { regression: yField, on: xField, method: "linear", params: true },
          { calculate: `'y=' + format(datum.coef[0], '.4f') + '+' + format(datum.coef[1], '.4f') + 'x; R²: ' + format(datum.rSquared, '.2f')`, as: "R2" }
        ],
        mark: { type: "text", color: "firebrick", x: "width", size: 16, align: "right", y: -5 },
        encoding: { text: { type: "nominal", field: "R2" } }
      }
    ]
  };
}