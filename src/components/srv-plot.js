// TODO: swap this for a lollipop plot component ??
// TODO: incorporate ERPlot here as well ?? theyre very similar
import * as _ from "lodash-es";

export function SRVPlot(data, from, step, key, key2, color_data, color_label, dyn_range_cap) {
  let spec = {
      "width": {"step": 12},
      "data" : {"values" : _.map (
        _.filter (data, (d,i)=>i+1 >= from && i<= from + step),
      (d)=> {
          let dd = _.clone (d);
          _.each ([key], (f)=> {
            dd[f] = Math.min (dyn_range_cap, dd[f]);
          });
          return dd;
      })}, 
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "nominal",
          "axis": {"grid" : false, "titleFontSize" : 14, "title" : "Codon"}
        }
      },
      "layer": [
        {
          "mark": {"type": "line", "size" : 2, "color" : "lightgrey", "opacity" : 0.5, "interpolate" : "step"},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
            }
          }
        },
        {
          "mark": {"stroke": null, "type": "point", "size" : 100, "filled" : true, "color" : "lightgrey", "tooltip" : {"contents" : "data"}, "opacity" : 1},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                "scale" : {"type" : "symlog"},
                "axis" : {"grid" : false}
            },
            "color" : color_data ? {"field" : color_label, "type" : "quantitative", "scale" : {"type" : "log", "scheme": "turbo"}, "legend" : {"orient" : "top"}} : null
          }
        }
      ]
  };
  if (key2) {
      spec.layer.push (
        {
          "mark": {"type": "line", "size" : 4, "color" : "lightgrey", "opacity" : 0.5, "interpolate" : "step", "color" : "firebrick"},
          "encoding": {
            "y": {
               "field": key2,
                "type" : "quantitative",
            }
          }
        }
      );
  }
  return spec;
}