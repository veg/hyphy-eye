
plot_legends = ({
  "Synonymous rates" : "Posterior means for synonymous site-level substitution rates (α). ",
  "Support for positive selection" : "Empirical Bayes Factors for ω>1 at a particular branch and site (only tested branches with 2 or more rate classes are included).",
  "Evidence ratio alignment profile" : "Evidence ratios for for ω>1 at a particular branch and site (only tested branches with an ω>1 distribution component are included). Mouse over for more information"
})


plot_extras = ({
    'Evidence ratio alignment profile' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs'], {'label' : 'Circle size'} ),
    'Support for positive selection' : Inputs.select(['Total subs', 'Syn subs', 'Non-syn subs'], {'label' : 'Circle size'} )
})


plot_options = [
  ["Synonymous rates", (d)=>srv_rate_classes > 0 && srv_distribution], 
  ["Support for positive selection", (d)=>bsPositiveSelection.length > 0],
  ["Evidence ratio alignment profile", (d)=>profileBranchSites.length > 0]
]


plot_specs = (
  { "Synonymous rates" : {
  "width": 800, "height": 150, 
  "vconcat" : _.map (_.range (1, fig1data.length + 1, 70), (d)=> {
      return SRVPlot (fig1data, d, 70, "SRV posterior mean", null)
  })},
  "Support for positive selection" : {
    //"autosize": {"resize" : true},
    "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return BSPosteriorPlot (bsPositiveSelection, d, er_step_size())
    })},
   "Evidence ratio alignment profile" : {
    //"autosize": {"resize" : true},
    "vconcat" : _.map (_.range (1, results_json.input["number of sites"], er_step_size()), (d)=> {
        return ERPosteriorPlot (profileBranchSites, d, er_step_size())
    })}
}
)


dyn_range_cap = 10000



ERPlot = (data, from, step, key)=> {
  let scale = d3.extent (data, (d)=>d[key]); 
  scale[1] = Math.min (dyn_range_cap,Math.max (scale[1], pv));
  scale = d3.nice (scale[0], scale[1], 10);
  return {
      "width": {"step": 12},
      "data" : {"values" : _.map (
        _.filter (data, (d,i)=>i+1 >= from && i< from + step - 1),
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
          "mark": {"stroke": "black", "type": "line", "size" : 2, "interpolate" : "step", "color" : "lightgrey", "opacity" : 0.5},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                "scale" : {"type" : "symlog", "domain" : scale},
                "axis" : {"grid" : false}
            }
          }
        },
        {
          "mark": { "stroke": "black", "type": "point", "size" : 100, "filled" : true,  "color" : "lightgrey", "tooltip" : {"contents" : "data"}, "opacity" : 1.},
          "encoding": {
            "y": {
               "field": key,
                "type" : "quantitative",
                
            },
            "color" : {"condition": {"test": "datum['" + key + "'] > " + pv, "value": "firebrick"},
                "value": "lightgrey"
            }
          }
        },
        {
          "mark" : {"opacity": 0.5, "type": "line", "color": "steelblue"},
          "encoding" : { "y": {
                "datum": {"expr": "" + pv},
                "type": "quantitative",
                "scale" : {"domain" : scale}
              },
             
            "size": {"value": 2},
          }
        }
        
      ]
  };
}



SRVPlot = (data, from, step, key, key2)=> {
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
            //"color" : results_json["Evidence Ratios"]["constrained"] ? {"field" : "ER (constrained)", "type" : "quantitative", "scale" : {"type" : "log", "scheme": "turbo"}, "legend" : {"orient" : "top"}} : null
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



BSPosteriorPlot = (data, from, step)=> {
  const selected_branches = new Set (_.map (rate_table, (d)=>d.branch));
  const branch_order = _.filter (treeNodeOrdering (0), (d)=>profilable_branches.has (d) && selected_branches.has (d));
  let N = tested_branch_count;
  let box_size = 10; 
  let font_size = 8;
  var size_field = "subs";
  switch (fig1_controls) {
    case "Syn subs":
      size_field = "syn_subs";
      break;
    case "Nonsyn subs":
      size_field = "nonsyn_subs";
      break;
  }
  
  if (N > 50) {
      if (N <= 100) {box_size = 8; font_size = 6;}
      else if (N <= 200) {box_size = 5; font_size = 5;}
      else {box_size = 4; font_size = 0;}
  }
  let spec = {
      "width": {"step": box_size}, "height" : {"step" : box_size},
      "data" : {"values" : 
        _.filter (data, (d)=>selected_branches.has (d.Key.split ("|")[0]))
      }, 
      "transform" : [
        {"calculate" : "parseInt (split(datum.Key, '|')[1])", "as" : "Codon"},
        {"calculate" : "split(datum.Key, '|')[0]", "as" : "Branch"},
        {"filter" : {"field" : "Codon", "range" : [from, from+step-1]}}
      ],
      /*"params": [{
        "name": "character_view",
        "select": {
          "type": "interval",
          "encodings": ["x","y"],
          "nearest" : "true",
          "mark" : {"stroke" : "#444", "strokeWidth" : 3},
        },
        "value": {"x": _.range (20), "y": branch_order}
      }],*/
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Codon", "labelFontSize" : font_size} : null
        },
        "y": {
          "field": "Branch",
          "scale" : {"domain" : branch_order},
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Branch", "labelFontSize" : font_size} : null
        }
      },
      "layer": [
        {
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 1.0, "tooltip" : {"contents" : "data"}},
          "encoding": {
            "color": {
               "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top", "title" : "EBF"},
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : "redyellowblue", "domainMid" : 1}
            }
          }
        },
        {
          "mark": {"type": "circle", "size" : 2, "stroke" : "black", "strokeWidth" : 0.5, "color" : null, "opacity" : 1.0},
          "encoding": {
            "color" : {"value" : null},
            "size": {
               "field": size_field,
                "type" : "quantitative",
                "legend" : {"orient" : "top", "title" : "# substitutions"}
            }
          }
        }
      ]
  };
  return spec;
}



ERPosteriorPlot = (data, from, step)=> {
  
  const selected_branches = new Set (_.map (rate_table, (d)=>d.branch));
  const branch_order = _.filter (treeNodeOrdering (0), (d)=>profilable_branches.has (d) && selected_branches.has (d));
  let N = tested_branch_count;
  let box_size = 10; 
  let font_size = 8;

  var size_field = "subs";
  switch (fig1_controls) {
    case "Syn subs":
      size_field = "syn_subs";
      break;
    case "Nonsyn subs":
      size_field = "nonsyn_subs";
      break;
  }
  
  if (N > 50) {
      if (N <= 100) {box_size = 8; font_size = 6;}
      else if (N <= 200) {box_size = 5; font_size = 5;}
      else {box_size = 4; font_size = 0;}
  }
  let spec = {
      "width": {"step": box_size}, "height" : {"step" : box_size},
      "data" : {"values" : 
        _.filter (data, (d)=>selected_branches.has (d.Key.split ("|")[0]))
      }, 
      "transform" : [
        {"calculate" : "parseInt (split(datum.Key, '|')[1])", "as" : "Codon"},
        {"calculate" : "split(datum.Key, '|')[0]", "as" : "Branch"},
        {"filter" : {"field" : "Codon", "range" : [from, from+step-1]}},
      ],
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Codon", "labelFontSize" : font_size} : null
        },
        "y": {
          "field": "Branch",
          "scale" : {"domain" : branch_order},
          "type" : "nominal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Branch", "labelFontSize" : font_size} : null
        }
      },
      "layer": [
        {
          "mark": {"type": "rect", "size" : 2, "color" : "lightgrey", "opacity" : 0.8, "tooltip": {"content": "data"}},
          "encoding": {
            "color": {
               "field": "ER",
                "type" : "quantitative",
                "legend" : {"orient" : "top"},
                "sort": "descending",
                "scale" : {"type" : "log", "scheme" : "redyellowblue", "domainMid" : 1}
            }
          }
        },
        {
          "mark": {"type": "circle", "size" : 2, "stroke" : "black", "strokeWidth" : 0.5, "color" : null, "opacity" : 1.0},
          "encoding": {
            "color" : {"value" : null},
            "size": {
               "field": size_field,
                "type" : "quantitative",
                "legend" : {"orient" : "top", "title" : "# substitutions"}
            }
          }
        }
      ]
  };
  return spec;
}



characterPlot = (data, data2)=> {
  const branch_order = treeNodeOrdering (0, true);
  let N = results_json.input["number of sequences"];
  let box_size = 10; 
  let font_size = 12;

  console.log (data2);
  
  let spec = {
      "width": {"step": 2.5*font_size},  "height" : {"step" : font_size},
      "data" : {"values" : 
        data,
      }, 
      "transform" : [
        {"calculate" : "parseInt (split(datum.Key, '|')[1])", "as" : "Codon"},
        {"calculate" : "split(datum.Key, '|')[0]", "as" : "Branch"},
        {"filter": {"param": "character_view", "empty" : true}},
        {
          "lookup": "Key",
          "from": {
            "data": {"values" : data2},
            "key": "Key",
            "fields": ["ER"]
          }
        }
      ],
     
      "encoding": {
        "x": {
          "field": "Codon",
          "type" : "ordinal",
          "scale": {"domain": {"selection": "character_view", "encoding": "x"}},
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Codon", "labelFontSize" : font_size} : null
        },
        "y": {
          "field": "Branch",
          "scale": {"domain": {"selection": "character_view", "encoding": "y"}},
          "type" : "ordinal",
          "axis": font_size ? {"grid" : false, "titleFontSize" : 14, "title" : "Branch", "labelFontSize" : font_size} : null
        }
      },
      "layer": [
        {
          "mark": {"type": "text", "clip" : true, "fontSize" : font_size, "font" : "monospace", "fontWeight" : "bold", "color" : "#444", "opacity" : 1.0, "tooltip" : true},
          "encoding": {
            "text" : {"field" : "value"},
            "color": {
               "field" : "aa"
            }
          }
        }
      ]
  };
  return spec;
}


function display_tree(index, T, options) {
      let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    
      T.branch_length_accessor = (n)=>(n.data.name in results_json["branch attributes"][index] ? results_json["branch attributes"][index][n.data.name][branch_length] : 0) || 0;  
      let alignTips = treeLabels.indexOf ("align tips") >= 0;
      var t = T.render({
        height: dim && dim[0], 
        width : dim && dim[1],
        'align-tips' : alignTips,
        'selectable' : false,
        'show-scale' : true,
        'is-radial' : false,
        'left-right-spacing': 'fit-to-size', 
        'top-bottom-spacing': 'fit-to-size',
        'node_circle_size' : (n)=>0,
        'internal-names' : treeLabels.indexOf ("show internal") >= 0
       } );
      

      add_svg_defs (t.svg);
  
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
           e.selectAll ("text").style ("font-family", "ui-monospace");
           if (n.children && n.children.length) return; 
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);

        });

    
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for selection") {
            let branch_values = {};
            t.svg.selectAll ("defs").selectAll ("linearGradient").remove();
            let branch_gradients = {};
            T.traverse_and_compute ( (n)=> {
                  let test_omegas = test_omega (n.data.name);
                  if (test_omegas) {
                    let rate_class = test_omegas.length - 1 ;
                    branch_values[n.data.name] = test_omegas[rate_class].value;
                  }
                  
                }
            );
            let color_scale = d3.scaleDivergingLog([1e-4,1,Math.min(1000,d3.max (_.map (branch_values, (d)=>d)))],["rgb(0,0,255)","rgb(128,128,128)","rgb(255,0,0)"]);
          
            let bID = 0;
            let max_omega_by_branch = {};
            T.traverse_and_compute ( (n)=> {
                  let test_omegas = test_omega (n.data.name);
                  if (test_omegas) {
                    let rate_class = test_omegas.length - 1 ;
                    branch_gradients [n.data.name] = "hyphy_phylo_branch_gradient_" + bID;
                    
                    let gradient_def = t.svg.selectAll ("defs").append ("linearGradient").attr ("id", branch_gradients [n.data.name]);
                    bID += 1;
                    let current_frac = 0;
                    _.each (test_omegas, (t)=> {
                        gradient_def.append ("stop").attr ("offset", "" + current_frac*100.0 + "%").style ("stop-color", color_scale (t.value));
                        
                        current_frac += t.weight;
                        gradient_def.append ("stop").attr ("offset", "" + current_frac*100.0 + "%").style ("stop-color", color_scale (t.value));                    });
                      max_omega_by_branch [n.data.name] = test_omegas[test_omegas.length-1];
                  }
                  
                  
                }
            ); 
            
            t.color_scale = color_scale;
            t.color_scale_title = "ω";
            t.style_edges ((e,n) => {
               const is_tested = results_json["tested"][index][n.target.data.name] == "test";
               let t_string = n.target.data.name + " ";
               let b_string = "";
               if (is_tested) {
                   let pv_l = test_pv (n.target.data.name); 
                   t_string += "(p = " + pv_l.toFixed (3) + ")";
                   pv_l = -Math.floor(Math.log10(Math.max (pv_l,1e-6)));
                   let mxo = max_omega_by_branch[n.target.data.name].value;
                   if (mxo > 1) {
                         mxo = mxo > 1000. ? ">1000" : mxo.toFixed (2);
                         b_string = mxo + "/" + (max_omega_by_branch[n.target.data.name].weight*100).toFixed (2) + "%"; 
                   }
                  
                   e.style ("stroke", "url('#" + branch_gradients[n.target.data.name] + "')").style ("stroke-width", 2 + pv_l);
               } else {
                   t_string += "(not tested)";
                   e.style ("stroke", "url('#" + branch_gradients[n.target.data.name] + "')").style ("stroke-width", "2").style ("opacity","0.5");
               }
               t_string += " max ω = " + branch_values[n.target.data.name].toFixed (2);
               e.style ("stroke-linejoin", "round").style("stroke-linecap", "round");
               e.selectAll ("title").data ([t_string]).join ("title").text ((d)=>d);
               if (options["branch-labels"]) {
                    add_branch_label (e, b_string, t.font_size, t.svg.selectAll (".phylotree-container"));
               }
            });
        } else {
            let labels;
            switch (color_branches) {
              case "Substitutions" : {  
                labels = subs_by_branch (index);
                 t.color_scale_title = "Min # of nucleotide substitutions";
                } 
                break;
              case "2-hit rate" : {  
                 labels = _.mapValues (mh_rates["DH"], d=>d.toFixed (2));
                 t.color_scale_title = "Double-nucleotide relative substitution rate (δ)";
                } 
                break;
              case "3-hit rate" : {  
                 labels = _.mapValues (mh_rates["TH"], d=>d.toFixed (2));
                 t.color_scale_title = "Three-nucleotide relative substitution rate (ψ)";
                } 
                break;
            }

            //console.log (labels, options["branch-labels"]);
          
            let color_scale = d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolateTurbo);
            t.color_scale = color_scale;

            t.svg.selectAll (".absrel-branch-labels").remove();
            
            t.style_edges ((e,n) => {
                const is_tested = labels[n.target.data.name];
                if (options["branch-labels"]) {
                    add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
                }
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "4").style ("opacity",1.0); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
                e.style ("stroke-linejoin", "round").style("stroke-linecap", "round");
          });
        }

      
      t.placenodes();
      t.update();

      return t;     
}



function display_tree_handle_neighbors(index, s, node_labels, T, options, results, site_count) {
  let extended_labels = {};
  if (options["neighbors"]) {
        const si = (+s)-1;
        let joint_labels = [];
        for (let idx = si-4; idx <= si+4; idx++) {
              if (idx >= 0 && idx < site_count) {
                    if (idx != si) {
                        joint_labels.push (generateNodeLabels (T, results["substitutions"][index][idx]));
                    } else {
                        joint_labels.push (_.mapValues (node_labels, (d)=> {
                              return ["·" + d[0] + "·", "·" + d[1] + "·"] 
                        }));
                    }
              }
        } 
        _.each (node_labels, (d,k)=> {
            extended_labels [k] = [_.map (joint_labels, (slc)=> {
                return slc[k][0];
            }).join ("|"),_.map (joint_labels, (slc)=> {
                return slc[k][1];
            }).join ("|")];
        });


    }
    return extended_labels;
}




function display_tree_site(index, T,s,options) {
    let dim = treeDim.length ? _.map (treeDim.split ("x"), (d)=>+d) : null;
    
    T.branch_length_accessor = (n)=>results_json["branch attributes"][index][n.data.name][branch_length] || 0;  
    let node_labels = generateNodeLabels (T, results_json["substitutions"][index][(+s)-1]);
    let extended_labels = {};

    let labelDomain = new Set();
    let showAA = treeLabels.indexOf ("amino-acids") >= 0;
    let showCodons = treeLabels.indexOf ("codons") >= 0;
    let showSeqNames = treeLabels.indexOf ("sequence names") >= 0;
    let showOnlyMH = treeLabels.indexOf ("show only multiple hits") >= 0;
    let showOnlyNS = treeLabels.indexOf ("show only non-synonymous changes") >= 0;
    let alignTips = treeLabels.indexOf ("align tips") >= 0;
    

  
    var t = T.render({
      height:dim && dim[0], 
      width:dim && dim[1],
      'show-scale' : true,
      'is-radial' : false,
      'align-tips' : alignTips,
      'left-right-spacing': 'fit-to-size', 
      'top-bottom-spacing': 'fit-to-size',
      'node_circle_size' : (n)=>0,
      'selectable' : false,
      'internal-names' : treeLabels.indexOf ("show internal") >= 0
     } );

      
      add_svg_defs (t.svg);
      extended_labels = display_tree_handle_neighbors (index,s,node_labels,T,options,results_json, partition_sizes[index]);
  
  
      t.nodeLabel ((n)=> {
          if (!n._display_me) {
              return "";
          }
          let label = "";
          let has_extended_label = extended_labels[n.data.name] || node_labels[n.data.name];

          n.data.color_on = "";
          
          if (showCodons) {
                label = has_extended_label[0];
                n.data.color_on = node_labels[n.data.name][0];
                if (showAA) label += "/";
          }
        
          if (showAA) {
              label += has_extended_label[1];
              n.data.color_on = node_labels[n.data.name][1];
          }
          
          labelDomain.add ( n.data.color_on);
          if (showSeqNames) label += ":" + n.data.name;
          return label;
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

       T.traverse_and_compute (function (n) {
            n._display_me = ! (showOnlyMH || showOnlyNS);
         
            if (!n._display_me) {
                if (node_labels[n.data.name]) {
                    if (showOnlyMH && node_labels[n.data.name][3] > 1) n._display_me = true;
                    if (! n._display_me) {
                      if (showOnlyNS) {
                          if (n.parent) {
                              const my_aa = node_labels[n.data.name][1];
                              const parent_aa = node_labels[n.parent.data.name][1];
                              if (my_aa != parent_aa && my_aa != '-' && parent_aa != '-') {
                                  n._display_me = true;
                                  
                                  if (showOnlyMH) n._display_me = node_labels[n.data.name][3] > 1;
                              } else {
                                  n._display_me = false;
                              }
                          }
                      }
                    }
                }
            }
            if (n._display_me && n.parent) {
                n.parent._display_me = true;
            }
            
        },"pre-order");

        sort_nodes (true);
        t.style_nodes ((e,n) => {
           e.selectAll ("text").style ("fill", label_color_scale(n.data.color_on));
           e.selectAll ("title").data ([n.data.name]).join ("title").text ((d)=>d);
           e.selectAll ("text").style ("font-family", "ui-monospace");
        });
       
    
        if (color_branches == "Tested") {
          t.style_edges ((e,n) => {
             const is_tested = results_json["tested"][index][n.target.data.name] == "test";
             if (is_tested) {
                e.style ("stroke", "firebrick"); 
             } else {
                e.style ("stroke", null); 
             }
          });
        } else if (color_branches == "Support for selection") {
            let branch_values = {};
            
            T.traverse_and_compute ( (n)=> {
              
                let posteriors = results_json["branch attributes"][index][n.data.name];
                if (posteriors && posteriors["posterior"]) {
                    let test_omegas = test_omega (n.data.name);
                    let rate_class = test_omegas.length - 1 ;
                    let prior = test_omegas[test_omegas.length-1].weight;
                    prior = prior / (1-prior);
                    posteriors = posteriors["posterior"][rate_class][s-1];
                    branch_values [n.data.name] = posteriors/(1-posteriors)/prior;
                    if (branch_values [n.data.name] < 1) branch_values [n.data.name] = null;
                }
               
            });
            let color_scale = d3.scaleSequentialLog(d3.extent (_.map (branch_values, (d)=>d)),d3.interpolateTurbo);
            t.color_scale = color_scale;
            t.color_scale_title = "Empirical Bayes Factor";
            t.style_edges ((e,n) => {
             const is_tested = branch_values[n.target.data.name];
             if (is_tested) {
                e.style ("stroke", color_scale(is_tested)).style ("stroke-width", "5").style ("opacity",null); 
                e.selectAll ("title").data ([is_tested]).join ("title").text ((d)=>d);
             } else {
                e.style ("stroke", null); 
             }
          });
        } else {
            let labels, color_scale = null;
            switch (color_branches) {
              case "Substitutions" : {  
                 color_scale = d3.scaleOrdinal([0,1,2,3], d3.schemePuOr[4]);
                 labels = node_labels;
                 t.color_scale_title = "Min # of nucleotide substitutions";
                } 
                break;
              case "2-hit rate" : {  
                 labels = _.mapValues (mh_rates["DH"], (d)=>d.toFixed(2));
                 t.color_scale_title = "Double-nucleotide relative substitution rate (δ)";
                } 
                break;
              case "3-hit rate" : {  
                 labels = _.mapValues (mh_rates["TH"], (d)=>d.toFixed(2));
                 t.color_scale_title = "Three-nucleotide relative substitution rate (ψ)";
                } 
                break;
            }
          
            
            t.color_scale = color_scale ||  d3.scaleSequential(d3.extent (_.map (labels, d=>d)), d3.interpolateTurbo);
            
            t.style_edges ((e,n) => {
             const is_tested = labels[n.target.data.name];
             if (color_branches == "Substitutions") {
               if (is_tested && is_tested[3]) {
                  e.style ("stroke", t.color_scale(is_tested[3])).style ("stroke-width", "5").style ("opacity","1"); 
                  const ts = is_tested[2] + "→" + is_tested[0] + "(" + is_tested[3] + ")"
                  e.selectAll ("title").data ([ts]).join ("title").text ((d)=>d);
                  if (options["branch-labels"]) {
                    add_branch_label (e, ts, t.font_size, t.svg.selectAll (".phylotree-container"));
                   }
               } else {
                  e.style ("stroke", null); 
               }
             } else {
                 e.style ("stroke", t.color_scale(is_tested)).style ("stroke-width", "4").style ("opacity","1"); 
                 if (options["branch-labels"]) {
                    add_branch_label (e, is_tested, t.font_size, t.svg.selectAll (".phylotree-container"));
                 }
             }
             
          });
        } 
        t.placenodes();
        t.update();
        label_color_scale.domain (labelDomain);
        return t;      
    }



function add_branch_label(e, text, font_size, container) {
  const where2 = _.get (parse_svg.default(e.attr("d")),["1"]);
  //console.log (text);
  if (where2 && (text.length || _.isNumber (text))) {
      let my_id = e.attr ("id");
      if (!e.attr ("id")) {
          my_id = DOM.uid ("absrel_tree").id;
          e.attr ("id", my_id);
      }
      let branch_label = container.selectAll ("text[label-for='" + my_id + "']").data ([text]).join ("text").attr ("label-for", my_id).text ((d)=>d).classed ("absrel-branch-labels",true).attr ("x", where2[1]).attr ("y", where2[2]).attr ("font-size", font_size * 0.8).attr ("dx","0.5em").attr ("dy", "-0.4em").style ("font-family", "ui-monospace");
      branch_label.attr ("filter","url(#tree_branchlabel_bgfill)");
  }
}



function add_svg_defs(svg) {
    let filter = svg.selectAll ("defs").append ("filter").attr ("x", 0).attr ("y", 0).attr ("width", 1).attr ("height", 1).attr ("id", "tree_branchlabel_bgfill");
    filter.append ("feFlood").attr ("flood-color", "lightgray");
    filter.append ("feComposite").attr ("in", "SourceGraphic").attr ("operator", "atop");
}


/**
 * Computes the number of substitutions for each branch, excluding the root,
 * based on the substitutions data for a given index.
 *
 * @param {number} i - The index of the substitutions data in the results JSON.
 * 
 * @returns {Object} An object where keys are branch names and values are the
 * count of substitutions for each branch.
 */

function subs_by_branch(i) {
    let counts = {};
    _.each (results_json.substitutions[i], (states, site)=> {
        _.each (states, (state, branch)=> {
          if (branch != "root") {
              if (state != '---') {
                    counts[branch] = 1 + (counts[branch] ? counts[branch] : 0);
              }
          }
        });
    });
    return counts;
}