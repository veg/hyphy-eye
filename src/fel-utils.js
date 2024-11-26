import * as _ from "npm:lodash-es";

export function get_sites_table(results_json, has_T, has_ci, has_pasmt, pvalue_threshold) {
    console.log(results_json)

    const results    = [];
    const headers  = _.clone(results_json.MLE.headers);
    const format = {};
    

    format [headers[0][0]]  = (d)=>d.toFixed (3);
    format [headers[1][0]]  = (d)=>d.toFixed (3);
    format [headers[2][0]]  = (d)=>d.toFixed (3);
    format [headers[3][0]]  = (d)=>d.toFixed (3);
    format [headers[4][0]]  = (d)=>d <= pvalue_threshold ? '<b>${d.toFixed (4)}</b>' : d.toFixed (4);
    if (has_pasmt) {
        format[headers[headers.length-1][0]] = format [headers[4][0]];
    }
    format [headers[5][0]]  = (d)=>d.toFixed (3);
    headers.push (["class","Site classification at p<=" + pvalue_threshold]); 
    format["class"] = (d)=>'<span style = "color:${COLORS[d]}">${d}</span>';
  
    _.each (results_json.MLE.content, (data, part)=> {
        const site_lookup = results_json["data partitions"][part].coverage[0];
        _.each (data, (row, i)=> {
              let row_object = {
                  'partition' : (+part) + 1,
                  'codon' : site_lookup [i] + 1
              };  
              row_object[headers[0][0]] = +row[0];
              row_object[headers[1][0]] = +row[1];
              row_object[headers[2][0]] = +row[2];
              row_object[headers[3][0]] = +row[3];
              row_object[headers[4][0]] = +row[4];
              if (has_T) {
                  row_object[headers[5][0]] = +row[5];
              }
              if (has_ci) {
                  row_object[headers[6][0]] = row[6];
                  row_object[headers[7][0]] = row[7];
                  row_object[headers[8][0]] = row[8];
              }
              if (has_pasmt) {
                  row_object [headers[headers.length-2][0]] = row[ headers.length-2];
              }
              row_object[headers[headers.length-1][0]] = row[4] <= pvalue_threshold ? (row[0] < row[1] ? "Diversifying" : "Purifying") : (row[0] + row[1] ? "Neutral" : "Invariable");
              results.push (row_object);
        });
       
        
    });
    return [format, results, headers];
}