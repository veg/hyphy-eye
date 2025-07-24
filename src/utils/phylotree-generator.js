import * as _ from "lodash-es";
import { 
  getTreeObjects, 
  setBranchLengthAccessor, 
  generateNodeLabels, 
  configureTree, 
  getConfigureBranchesFn, 
  getConfigureNodesFn 
} from "./phylotree-utils.js";
import { methodUtils } from "./method-utils.js";

/**
 * Creates a standardized phylogenetic tree visualization from HyPhy results JSON.
 * This generator follows the same pattern as other HyPhy-Eye visualization generators.
 * 
 * @param {Object} resultsJson - The HyPhy results JSON
 * @param {string} method - The HyPhy method name (e.g., 'BUSTED', 'aBSREL')
 * @param {Object} options - Configuration options for the tree visualization
 * @param {string} options.treeIndex - Index of the tree to display (default: 0)
 * @param {string} options.treeDim - Tree dimensions as "heightxwidth" (default: null for auto-sizing)
 * @param {Array} options.treeLabels - Array of label options (e.g., ["sequence names", "show internal"])
 * @param {string} options.branchLength - Branch length key to use (default: method-specific)
 * @param {boolean} options.colorBranches - Whether to color branches (default: true)
 * @param {boolean} options.testOmega - Whether to test for omega values (default: false)
 * @param {boolean} options.hasErrorSink - Whether the results have an error sink (default: false)
 * @param {Object} options.styleOptions - Additional styling options
 * @param {boolean} options.styleOptions.alignTips - Whether to align tips (default: false)
 * @param {boolean} options.styleOptions.showInternalNames - Whether to show internal node names (default: false)
 * @param {boolean} options.styleOptions.showAA - Whether to show amino acids (default: false)
 * @param {boolean} options.styleOptions.showCodons - Whether to show codons (default: false)
 * @param {boolean} options.styleOptions.showSeqNames - Whether to show sequence names (default: true)
 * @param {boolean} options.styleOptions.showOnlyMH - Whether to show only multiple hits (default: false)
 * @param {boolean} options.styleOptions.showOnlyNS - Whether to show only non-synonymous changes (default: false)
 * 
 * @returns {Object} - A configured phylotree object ready for display
 */
export function PhylotreeGenerator(resultsJson, method, options = {}) {
    // Ensure phylotree CSS is loaded once
    if (typeof document !== 'undefined' && !document.getElementById('phylotree-css')) {
        const link = document.createElement('link');
        link.id = 'phylotree-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/phylotree@0.1/phylotree.css';
        document.head.appendChild(link);
    }

    // Lookup util functions centrally using methodUtils
    const utilsFns = methodUtils[method];
    if (!utilsFns) throw new Error(`No utilities defined for method: ${method}`);
    
    // Get method-specific attributes
    const attrs = utilsFns.attrsFn(resultsJson);
    
    // Set defaults based on method and provided options
    const treeIndex = options.treeIndex || 0;
    const treeDim = options.treeDim || "800x600";
    const treeLabels = options.treeLabels || ["sequence names"];
    const branchLength = options.branchLength || null;
    if (branchLength === null) {
        // error
        throw new Error("Branch length must be specified");
    }
    const colorBranches = options.colorBranches !== undefined ? options.colorBranches : "Support for selection";
    const testOmega = options.testOmega !== undefined
        ? options.testOmega
        : utilsFns.testOmegaFn !== null
            ? utilsFns.testOmegaFn(resultsJson, attrs.error_sink)
            : null;
    const hasErrorSink = attrs.error_sink !== undefined ? attrs.error_sink : false;
    const useErrorSink = options.useErrorSink !== undefined ? options.useErrorSink : false;
    const useSiteSpecificSupport = options.useSiteSpecificSupport !== undefined ? options.useSiteSpecificSupport : false;
    const useTurboColor = options.useTurboColor !== undefined ? options.useTurboColor : true;
    // Codon site index for site-specific trees (1-based), default to first site
    const siteIndex = Number(options.siteIndex || 1);
    const useOmegaSupport = options.useOmegaSupport !== undefined ? options.useOmegaSupport : false;

    // Get tree objects using the utility function
    const treeObjects = getTreeObjects(resultsJson);
    if (!treeObjects || treeObjects.length === 0) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Error: No tree data found in results';
        return errorDiv;
    }
    
    const T = treeObjects[treeIndex];
    
    // Set branch length accessor
    T.branch_length_accessor = setBranchLengthAccessor(T, resultsJson, treeIndex, branchLength);
    
    // Generate node labels based on method
    let nodeLabels = null;
    // For site-specific trees, we need to generate labels from substitutions
    if (useSiteSpecificSupport && resultsJson.substitutions?.[treeIndex]?.[siteIndex-1]) {
        nodeLabels = generateNodeLabels(T, resultsJson.substitutions[treeIndex][siteIndex-1]);
    }
    
    // Parse tree dimensions
    const dim = treeDim.length ? _.map(treeDim.split("x"), (d) => +d) : [800, 600];
    
    // Configure the tree
    const styleOptions = options.styleOptions || {};
    const t = configureTree(T, treeDim, {
        'align-tips': treeLabels.includes("align tips"),
        'internal-names': treeLabels.includes("show internal"),
        'height': dim[0],
        'width': dim[1],
        configureBranches: (rawTree, renderedTree) => {
            // Configure branches based on method
            getConfigureBranchesFn(resultsJson, {
                color_branches: colorBranches,
                branch_length: branchLength,
                index: treeIndex,
                has_error_sink: hasErrorSink,
                use_error_sink: useErrorSink,
                use_site_specific_support: useSiteSpecificSupport,
                use_turbo_color: useTurboColor,
                s: siteIndex,
                use_omega_support: useOmegaSupport,
                test_omega: testOmega,
                node_labels: nodeLabels
            }, options)(rawTree, renderedTree);
        },
        configureNodes: (rawTree, renderedTree) => {
            // Configure nodes based on method and labels
            getConfigureNodesFn(resultsJson.tested ? resultsJson.tested[treeIndex] : {}, nodeLabels, {
                showAA: treeLabels.includes("amino-acids"),
                showCodons: treeLabels.includes("codons"),
                showSeqNames: treeLabels.includes("sequence names"),
                showOnlyMH: treeLabels.includes("show only multiple hits"),
                showOnlyNS: treeLabels.includes("show only non-synonymous changes"),
                alignTips: treeLabels.includes("align tips")
            })(rawTree, renderedTree);
        }
    });
    
    // Create a container for the tree
    const container = document.createElement('div');
    container.style.width = dim[1] + 'px';
    container.style.height = dim[0] + 'px';
    container.appendChild(t.show());
    
    return container;
}