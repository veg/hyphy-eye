/**
 * Determines the step size for plotting based on the number of sequences.
 *
 * @param {Object} results_json - The JSON object containing the input data.
 * @returns {number} The step size for plotting. Returns 70 if the number of sequences is less than 100,
 *                   140 if less than 200, and 600 otherwise.
 */

export function er_step_size(results_json) {
    let N = results_json.input["number of sequences"];
    if (N < 100) return 70;
    if (N < 200) return 140;
    return 600;
}