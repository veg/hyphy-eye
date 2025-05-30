export interface VisualizationCategory {
    id: string;
    name: string;
    description: string;
}

export enum VisualizationOutputType {
    VEGA_SPEC = 'vega-spec',
    DOM_ELEMENT = 'dom-element',
    HTML_STRING = 'html-string'
}

export interface Visualization {
    name: string;
    description: string;
    component: string;
    glyph: string;  // Path to glyph image file under src/glyphs/
    options?: Record<string, any>;
    category: string;
    outputType: VisualizationOutputType;  
}

export interface HyPhyMethod {
    name: string;
    visualizations: Visualization[];
}

// Mapping of glyph names to their file paths
const GLYPH_PATHS = {
    'lollipop': 'lollipop.png',
    'table': 'table.png',
    'network': 'network.png',
    'tree': 'tree.png',
    'tile': 'tile.png',
    'viz-table': 'viz-table.png',
    'scatter': 'scatter.png',
    'heatmap': 'heatmap.png',
    'bar': 'bar.png',
    'density': 'density.png'
};

// Define visualization categories that are consistent across methods
export const VisualizationCategories: Record<string, VisualizationCategory> = {
    summary: {
        id: 'summary',
        name: 'Summary Views',
        description: 'Overview visualizations that summarize key results'
    },
    model: {
        id: 'model',
        name: 'Model Summaries',
        description: 'Visualizations that show model parameters and fit'
    },
    codon: {
        id: 'codon',
        name: 'Codon Summaries',
        description: 'Visualizations focused on individual codon-level results'
    },
    network: {
        id: 'network',
        name: 'Branch-Codon Relationships',
        description: 'Network-based visualizations showing relationships between branches and codons'
    },
};

export const HyPhyMethods: Record<string, HyPhyMethod> = {
    BUSTED: {
        name: 'BUSTED',
        visualizations: [
            {
                name: 'Tile Table',
                description: 'Summary statistics in a tile format',
                component: 'TileTable',
                glyph: GLYPH_PATHS.tile,
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            },
            {
                name: 'Evidence Ratio for ω>1',
                description: 'Lollipop plot showing evidence ratios for positive selection',
                component: 'BeadPlot',
                glyph: GLYPH_PATHS.lollipop,
                options: {
                    key: 'ER (constrained)',
                    log_scale: false,
                    y_label: null
                },
                category: 'codon',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Synonymous Rates',
                description: 'Posterior means for synonymous site-level substitution rates',
                component: 'BeadPlot',
                glyph: GLYPH_PATHS.lollipop,
                options: {
                    key: 'SRV posterior mean',
                    log_scale: false,
                    y_label: null,
                    key2: 'attrs.srv_hmm ? "SRV viterbi" : null', 
                    color_data: 'results_json["Evidence Ratios"]["constrained"]', 
                    color_label: "ER (constrained)"
                },
                category: 'codon',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Support for Positive Selection',
                description: 'Heatmap showing support for positive selection',
                component: 'PosteriorsHeatmap',
                glyph: GLYPH_PATHS.heatmap,
                category: 'codon',
                options: {
                    data: "bsPositiveSelectionFn",
                    size_field: "subs"
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Tree visualization with branch support values',
                component: 'Phylotree',
                glyph: GLYPH_PATHS.tree,
                options: {
                    useErrorSink: true,
                    treeLabels: ['sequence names', 'show internal'],
                    branchLength: 'unconstrained',
                    colorBranches: true
                },
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            },
            {
                name: 'Site-Specific Tree',
                description: 'Tree visualization for specific codon sites',
                component: 'Phylotree',
                glyph: GLYPH_PATHS.tree,
                options: {
                    useErrorSink: true,
                    treeLabels: ['sequence names', 'show internal', 'codons'],
                    branchLength: 'unconstrained',
                    colorBranches: true,
                    useSiteSpecificSupport: true,
                    useOmegaSupport: true
                },
                category: 'codon',
                outputType: VisualizationOutputType.DOM_ELEMENT
            }
        ],
        // removed attributes and siteTableData; handled by generator
    },
    aBSREL: {
        name: 'aBSREL',
        visualizations: [
            {
                name: 'Tile Table',
                description: 'Summary statistics in a tile format',
                component: 'TileTable',
                glyph: GLYPH_PATHS.tile,
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            },
            {
                name: 'Synonymous Rates',
                description: 'Posterior means for synonymous site-level substitution rates',
                component: 'BeadPlot',
                glyph: GLYPH_PATHS.lollipop,
                category: 'codon',
                options: {
                    key: 'SRV posterior mean',
                    log_scale: false,
                    y_label: null,
                    threshold: false,
                    string_color: "gray"
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Support for Positive Selection',
                description: 'Heatmap showing support for positive selection',
                component: 'PosteriorsHeatmap',
                glyph: GLYPH_PATHS.heatmap,
                category: 'codon',
                options: {
                    data: "bsPositiveSelectionFn",
                    size_field: "subs",
                    color_label: "EBF"
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Evidence Ratio Alignment Profile',
                description: 'Evidence ratios for ω>1 at a particular branch and site',
                component: 'PosteriorsHeatmap',
                glyph: GLYPH_PATHS.heatmap,
                category: 'codon',
                options: {
                    data: "profileBranchSitesFn",
                    size_field: "subs",
                    color_label: "ER"
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Tree visualization showing tested branches',
                component: 'Phylotree',
                glyph: GLYPH_PATHS.tree,
                options: {
                    treeLabels: ["sequence names", "show internal"],
                    branchLength: "Baseline MG94xREV",
                    colorBranches: true,
                    useErrorSink: false,
                    useSiteSpecificSupport: false,
                    useTurboColor: true
                },
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            },
            {
                name: 'Site-Specific Tree',
                description: 'Tree visualization for specific codon sites',
                component: 'Phylotree',
                glyph: GLYPH_PATHS.tree,
                options: {
                    treeLabels: ["sequence names", "show internal", "codons"],
                    branchLength: "Baseline MG94xREV",
                    colorBranches: true,
                    useErrorSink: false,
                    useSiteSpecificSupport: true,
                    useTurboColor: false,
                    useOmegaSupport: true
                },
                category: 'codon',
                outputType: VisualizationOutputType.DOM_ELEMENT
            }
        ],
        // removed attributes and siteTableData; handled by generator
    },
    FEL: {
        name: 'FEL',
        visualizations: [
            {
                name: 'Tile Table',
                description: 'Summary statistics in a tile format',
                component: 'TileTable',
                glyph: GLYPH_PATHS.tile,
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            },
            {
                name: 'alpha/beta site-level estimates',
                description: 'Plot of alpha/beta rate estimates',
                component: 'FelAlphaBetaPlot',
                glyph: GLYPH_PATHS.bar,
                category: 'codon',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Rate Density Plots',
                description: 'Density plots for synonymous and non-synonymous rates',
                component: 'RateDensities',
                glyph: GLYPH_PATHS.density,
                category: 'model',
                options: {
                    omega: true,
                    rateLabels: [
                        {data_key: "alpha", display_label: "α"},
                        {data_key: "beta", display_label: "β"}
                    ],
                    bandwidth: 0.2,
                    dynRangeCap: 10,
                    
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Rates by Site',
                description: 'Maximum likelihood estimates for synonymous and non-synonymous rates',
                component: 'RateBarPlots',
                glyph: GLYPH_PATHS.bar,
                category: 'codon',
                options: {
                    yScale: 'linear',
                    rateLabels: [
                        {data_key: "alpha", display_label: "α"},
                        {data_key: "beta", display_label: "β"},
                        {data_key: "p-value", display_label: "p-value"}
                    ],
                    dynRangeCap: 10
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Tree visualization showing tested branches',
                component: 'Phylotree',
                glyph: GLYPH_PATHS.tree,
                options: {
                    treeLabels: ["sequence names", "show internal"],
                    branchLength: "Global MG94xREV",
                    colorBranches: true,
                    useErrorSink: false,
                    useSiteSpecificSupport: false,
                    useTurboColor: true
                },
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            }
        ],
        // removed siteTableData; handled by generator
    },
    MEME: {
        name: 'MEME',
        visualizations: [
            {
                name: 'Tile Table',
                description: 'Summary statistics in a tile format',
                component: 'TileTable',
                glyph: GLYPH_PATHS.tile,
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            },
            {
                name: 'p-values for positive selection',
                description: 'p-values for selection by site',
                component: 'BeadPlot',
                glyph: GLYPH_PATHS.lollipop,
                category: 'codon',
                options: {
                    key: 'p-value',
                    log_scale: false,
                    y_label: "log",
                    string_color: "black",
                    rev_threshold_color: true
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'support for positive selection',
                description: 'Empirical Bayes Factors for ω>1 at a particular branch and site',
                component: 'PosteriorsHeatmap',
                glyph: GLYPH_PATHS.heatmap,
                category: 'codon',
                options: {
                    data: "bsPositiveSelectionFn",
                    color_label: "ER",
                    color_scheme: "redblue"
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Rate Density Plots',
                description: 'Density plots for synonymous and non-synonymous rates',
                component: 'RateDensities',
                glyph: GLYPH_PATHS.density,
                category: 'model',
                options: {
                    omega: false,
                    rateLabels: [
                        {data_key:"&alpha;",display_label:"α"},
                        {data_key:"&beta;<sup>1</sup>",display_label:"β-"},
                        {data_key:"&beta;<sup>+</sup>",display_label:"β+"}
                    ],
                    autoXScale: true
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Rates by Site',
                description: 'Maximum likelihood estimates for synonymous and non-synonymous rates',
                component: 'RateBarPlots',
                glyph: GLYPH_PATHS.bar,
                category: 'codon',
                options: {
                    yScale: 'log',
                    rateLabels: [
                        {data_key:"&alpha;",display_label:"α"},
                        {data_key:"&beta;<sup>1</sup>",display_label:"β-"},
                        {data_key:"p<sup>1</sup>",display_label:"p-"},
                        {data_key:"&beta;<sup>+</sup>",display_label:"β+"},
                        {data_key:"p<sup>+</sup>",display_label:"p+"},
                        {data_key:"p-value",display_label:"p-value"}
                    ]
                },
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Site Details',
                description: 'Detailed site-level information and results',
                component: 'MemeAlphaBetaPlot',
                glyph: GLYPH_PATHS.table,
                category: 'codon',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Tree visualization with branch support values',
                component: 'Phylotree',
                glyph: GLYPH_PATHS.tree,
                options: {
                    treeLabels: ["sequence names", "show internal"],
                    branchLength: "Global MG94xREV",
                    useErrorSink: false,
                    useSiteSpecificSupport: false,
                    useTurboColor: true
                },
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            },
            {
                name: 'Site-Specific Tree',
                description: 'Tree visualization for specific codon sites',
                component: 'Phylotree',
                glyph: GLYPH_PATHS.tree,
                options: {
                    treeLabels: ["sequence names", "show internal", "codons"],
                    branchLength: "Global MG94xREV",
                    useErrorSink: false,
                    useSiteSpecificSupport: true,
                    useTurboColor: false
                },
                category: 'codon',
                outputType: VisualizationOutputType.DOM_ELEMENT
            }
        ],
        // removed siteTableData; handled by generator
    },
    MULTIHIT: {
        name: 'MULTIHIT',
        visualizations: [
            {
                name: 'Tile Table',
                description: 'Summary statistics in a tile format',
                component: 'TileTable',
                glyph: GLYPH_PATHS.tile,
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            },
            {
                name: 'Evidence Ratios',
                description: 'Evidence ratios by site across models',
                component: 'MultihitEvidenceRatiosPlot',
                glyph: GLYPH_PATHS.bar,
                category: 'codon',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Site Log-Likelihood',
                description: 'Site log-likelihood by model',
                component: 'MultihitSiteLogLikelihoodPlot',
                glyph: GLYPH_PATHS.scatter,
                category: 'codon',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Model Fitting Benchmarks',
                description: 'Model fitting time benchmarks',
                component: 'MultihitTimerBarPlot',
                glyph: GLYPH_PATHS.bar,
                category: 'summary',
                outputType: VisualizationOutputType.VEGA_SPEC
            }
        ],
        // removed siteTableData; handled by generator
    },
    GARD: {
        name: 'GARD',
        visualizations: [
            {
                name: 'Breakpoint Tree Grid',
                description: 'Grid of breakpoint trees',
                component: 'GardTreeGrid',
                glyph: GLYPH_PATHS.tree,
                category: 'summary',
                options: {
                    variants: []
                },
                outputType: VisualizationOutputType.HTML_STRING
            },
            {
                name: 'Breakpoint Placement',
                description: 'Breakpoint placement and c-AIC improvements',
                component: 'GardBreakpointPlot',
                glyph: GLYPH_PATHS.scatter,
                category: 'summary',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Model-averaged support',
                description: 'Support for breakpoint placement',
                component: 'GardSupportPlot',
                glyph: GLYPH_PATHS.scatter,
                category: 'summary',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Total Tree Length',
                description: 'Total tree length by partition',
                component: 'GardTreeLengthPlot',
                glyph: GLYPH_PATHS.scatter,
                category: 'summary',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Tile Table',
                description: 'Summary statistics in a tile format',
                component: 'TileTable',
                glyph: GLYPH_PATHS.tile,
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            }
        ],
        // removed siteTableData; handled by generator
    },
    NRM: {
        name: 'NRM',
        visualizations: [
            {
                name: 'Tile Table',
                description: 'Summary statistics in a tile format',
                component: 'TileTable',
                glyph: GLYPH_PATHS.tile,
                category: 'summary',
                outputType: VisualizationOutputType.DOM_ELEMENT
            },
            {
                name: 'Branch Length Comparisons',
                description: 'Comparisons of branch lengths for each model',
                component: 'NrmBranchLengthComparisonPlot',
                glyph: GLYPH_PATHS.scatter,
                category: 'model',
                outputType: VisualizationOutputType.VEGA_SPEC
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Show how differences in base frequencies are distributed over branches',
                component: 'NrmTreePlot',
                glyph: GLYPH_PATHS.tree,
                options: {
                    availableDistances: [],
                    distanceFunction: 'default',
                    modelForTree: 'default'
                },
                category: 'model',
                outputType: VisualizationOutputType.DOM_ELEMENT
            }
        ],
        // removed siteTableData; handled by generator
    }
};

// Export type definitions for TypeScript users
export type MethodName = keyof typeof HyPhyMethods;
export type Method = typeof HyPhyMethods[MethodName];
export type VisualizationName = Method['visualizations'][number]['name'];
