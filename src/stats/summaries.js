
/**
 * Computes the weighted mean of a distribution.
 *
 * @param {Array.<{value: number, weight: number}>} distribution - An array of objects representing the distribution, 
 *        where each object contains a 'value' and a 'weight'.
 * @return {number} The weighted mean of the distribution.
 */
export function distMean(distribution) {
    let weightedSum = 0;

    _.each(distribution, ({ value, weight }) => {
        weightedSum += value * weight;
    });

    // TODO ask sergei why we dont divide by anything here
    // thats either a bug, or a thing that needs documenting/ possibly changing some misleading var names or something

    return weightedSum;
}

/**
 * Computes the variance of a distribution specified by an array of objects,
 * where each object has a 'value' and a 'weight' property.
 *
 * @param {Array.<Object>} d - An array of objects, each with a 'value'
 *   property and a 'weight' property.
 * @return {number} The variance of the distribution.
 */

export function distVar(d) {
    let m2 = 0, m = distMean (d);
    _.each (d, (r)=> {
        m2 += r['value']*r['value'] * r['weight'];
    });
    return m2 - m*m;
}