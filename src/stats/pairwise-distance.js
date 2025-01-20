import * as d3 from "d3";
import * as _ from "lodash-es";

export function entropy(d) {
    return -d3.sum (_.map (d, (e)=>Math.log2 (e)*e));
}

export function jensenShannonDistance(dist1, dist2) {
    let smoothed = _.map (dist1, (d,i)=> 0.5*(d+dist2[i]));
    return entropy (smoothed) - 0.5 * (entropy (dist1) + entropy (dist2));
}

export function distance(d1, d2, method) {  
    if (method == "Jensen Shannon") return jensenShannonDistance (d1,d2); 
    return Math.abs (d1[i-1]-d2[i-1]);
}
