
function getRateDistribution(keys, tags) {
    tags = tags || ["omega", "proportion"];
    const rate_info = _.get (results_json, keys);
    if (rate_info) {

      
      return _.sortBy (_.map (rate_info, (d)=>({
        "value" : d[tags[0]],
        "weight" : d[tags[1]]
      })), (d)=>d.rate);
    }
    return null;
}



function partition_sizes() {
    return _.chain (results_json['data partitions']).map ((d,k)=>(d['coverage'][0].length)).value();
}



function siteIndexPartitionCodon() {
    return _.chain (results_json['data partitions']).map ((d,k)=>_.map (d['coverage'][0], (site)=>[+k+1,site+1])).flatten().value();
}



function test_omega(branch) {
  getRateDistribution (["branch attributes","0",branch,"Rate Distributions"],["0","1"])
}


function test_pv(branch) {
  _.get (results_json,["branch attributes","0",branch,"Corrected P-value"])
}

function path_diff(from,to,path) {
    let res = [0,0];
    let curr = _.map (from),
        next = _.clone (curr);
   
    next [path[0]] = to[path[0]];
    const is_syn = translate_ambiguous_codon (curr.join ("")) == translate_ambiguous_codon(next.join (""));
    res[is_syn ? 0 : 1] += 1;
    for (let i = 1; i < path.length; i++) {
        curr = _.clone (next);
        next [path[i]] = to[path[i]];
        const is_syn = translate_ambiguous_codon (curr.join ("")) == translate_ambiguous_codon(next.join (""));
        res[is_syn ? 0 : 1] += 1;
    }
  
    return res;
}

function subs_for_pair(from, to) {

    if (from == 'NNN' || to == 'NNN') {
        return [0,0];
    }
  
    let diffs = [];
    _.each (from, (c,i)=> {
      if (c != to[i]) {
          diffs.push (i);
      }
    });
    switch (diffs.length) {
      case 0:
          return [0,0];
      case 1:
          if (translate_ambiguous_codon (from) == translate_ambiguous_codon(to)) {
              return [1,0];
          }
          return [0,1];
      case 2: {
          let res = path_diff (from,to,[diffs[0],diffs[1]]);
          _.each (path_diff (from,to,[diffs[1],diffs[0]]), (d,i) => {res[i] += d;});
          return _.map (res, (d)=>0.5*d);
      }
       case 3: {
          let res = path_diff (from,to,[diffs[0],diffs[1],diffs[2]]);
          _.each (path_diff (from,to,[diffs[0],diffs[2],diffs[1]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[1],diffs[0],diffs[2]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[1],diffs[2],diffs[0]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[2],diffs[0],diffs[1]]), (d,i) => {res[i] += d;});
          _.each (path_diff (from,to,[diffs[2],diffs[1],diffs[0]]), (d,i) => {res[i] += d;});
          return _.map (res, (d)=>d/6); 
       }
    }
}


function generateNodeLabels(T, labels) {
    let L = {};
    T.traverse_and_compute (function (n) {
        if (n.data.name in labels) {
            L[n.data.name] = [labels[n.data.name], translate_ambiguous_codon (labels[n.data.name]),'',0];
            if (n.parent) {
              L[n.data.name][2] = L[n.parent.data.name][0];             
              _.each (L[n.data.name][0], (c,i)=> {
                  const c2 = L[n.data.name][2][i];
                  if (c2 != c && c != '-' && c2 != '-' && c != 'N' && c2 != 'N') {
                    L[n.data.name][3] ++;
                  }
              });
            }
        } else {
          if (n.parent) {
            L[n.data.name] = _.clone (L[n.parent.data.name]);
            L[n.data.name][2] = L[n.data.name][0];
            L[n.data.name][3] = 0;
          } else {
            L['root'] = [labels["root"], translate_ambiguous_codon (labels["root"]), "", 0];
          }
        }
        L[n.data.name][4] = !_.isUndefined (n.children);
    },"pre-order");
    return L;
}



function treeNodeOrdering(index, root) {
    let order = [];
    if (root) {order.push ('root');}
    const T = tree_objects[index];
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
    T.traverse_and_compute (function (n) {
        if (results_json.tested[index][n.data.name] == "test") {
          order.push (n.data.name);
        }
    });
    return order;
}



function distMean(d) {
    let m = 0;
    _.each (d, (r)=> {
        m += r['value'] * r['weight'];
    });
    return m;
}



function distVar(d) {
    let m2 = 0, m = distMean (d);
    _.each (d, (r)=> {
        m2 += r['value']*r['value'] * r['weight'];
    });
    return m2 - m*m;
}



function er_step_size() {
    let N = results_json.input["number of sequences"];
    if (N < 100) return 70;
    if (N < 200) return 140;
    return 600;
}

function seqNames(tree) {
    let seq_names = [];
    tree.traverse_and_compute (n=>{
        if (n.children && n.children.length) return;
        seq_names.push (n.data.name);
    });
    return seq_names;
};

function totalTreeLength(tree) {
  let L = 0;
  tree.traverse_and_compute ( (n)=> {
     if (tree.branch_length (n)) {
      L += +tree.branch_length (n);
     }
  });
  return L;
}

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

function site_support_by_branch(i, key, er) {
    let counts = {};
    _.each (results_json["branch attributes"][i], (attribs, branch)=> {
        if (key in attribs) {
          _.each (attribs[key], (d)=> {
            if (d[1] >= er) {
              counts[branch] = 1 + (counts[branch] ? counts[branch] : 0);
            }
          });
        }});
    return counts;
}

// TODO: we already know busted needs this too, should be a general util.
// possible a lot of these are general utils, idk yet
function cdsQuant(data, key1, title) {
  
  return {
      "config": {
          "mark": {"invalid": null}
      },
      "vconcat" : [
        {
          "width" : 400, "height" : 200,
          "data" : {"values" : data}, 
              "transform": [{
                "sort": [{"field": key1}],
                "window": [{"op": "sum", "field": key1, "as": "CC"}],
                "frame": [null, 0]
              }],
              "layer" : [{
                "mark": {"type" : "area", "opacity" : 0.5, "color" : "grey", "tooltip" : true, "interpolate" : "step"},
                "encoding": {
                  "x": {
                    "field": key1,
                    "type": "quantitative",
                    "axis" : {"title" :  null},
                  },
                  "y": {
                    "field": "CC",
                    "type": "quantitative",
                    "scale" : {"type" : "linear"},
                    "axis" : {"title" : "Cumulative LRT", titleFontSize : 14}
                  }
              }},
              {
                "mark": {"type" : "line", "opacity" : 1.0, "color" : "black",  "interpolate" : "step"},
                "encoding": {
                  "x": {
                    "field": key1,
                   // "sort" : "descending",
                    "type": "quantitative",
                  },
                  "y": {
                    "field": "CC",
                    "type": "quantitative",
                    "scale" : {"type" : "linear"},
                    //"title" : "Cumulative count"
                  },
              }}
      ]
  },
  {
      "width" : 400, "height" : 100,
      "data" : {"values" : data}, 
          
        "mark": {"type" : "bar", "color" : "#ccc", "stroke" : "black", "tooltip" : true},
        "encoding": {
          "x": {
            "field": key1,
            "bin": {"maxbins":200},
            "type": "quantitative",
            "axis" : {"title" :  title ? title : key1, titleFontSize : 14},
          },
          "y": {
            "aggregate": "count",
            "type": "quantitative",
            "scale" : {"type" : "sqrt"},
            "axis" : {"title" :  "Count", titleFontSize : 14},
            //"title" : "Cumulative count"
          }
      
    }
  }]}
}

function translate_ambiguous_codon(codon) {
    if (codon in translation_table) {
      return  translation_table[codon];
    }
  
    let options = {};
    _.each (ambiguous_codes[codon[0]], (n1)=> {
         _.each (ambiguous_codes[codon[1]], (n2)=> {
            _.each (ambiguous_codes[codon[2]], (n3)=> {
                let c = translation_table[n1+n2+n3];
                if (c in options) {
                  options[c] += 1; 
                } else {
                  options [c] = 1; 
                }
            });
          });
    });
  
    options = _.keys(options);
    if (options.length == 0) {
      return "?"; 
    }
    return _.sortBy (options).join ("");
}