
import * as _ from "lodash-es";

/**
 * Computes the weighted mean of a discrete rate distribution.
 *
 * @param {Array.<{value: number, weight: number}>} distribution - An array of objects representing the distribution, 
 *        where each object contains a 'value' and a 'weight'. Weights should sum to 1.
 * @return {number} The weighted mean of the distribution.
 */
export function distMean(distribution) {
    // TODO: validate the weights sum to 1
    let weightedSum = 0;

    _.each(distribution, ({ value, weight }) => {
        weightedSum += value * weight;
    });

    return weightedSum;
}

/**
 * Computes the variance of a discrete rate distribution specified by an array of objects,
 * where each object has a 'value' and a 'weight' property.
 *
 * @param {Array.<Object>} d - An array of objects, each with a 'value'
 *   property and a 'weight' property. Weights should sum to 1.
 * @return {number} The variance of the distribution.
 */

export function distVar(d) {
    // TODO: validate the weights sum to 1
    let m2 = 0, m = distMean (d);
    _.each (d, (r)=> {
        m2 += r['value']*r['value'] * r['weight'];
    });
    return m2 - m*m;
}