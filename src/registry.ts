export interface VisualizationCategory {
    id: string;
    name: string;
    description: string;
}

export interface Visualization {
    name: string;
    description: string;
    component: string;
    glyph: string;  // Path to glyph image file under src/glyphs/
    options?: Record<string, any>;
    category: string;
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
                category: 'summary'
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
                category: 'codon'
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
                category: 'codon'
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
                }
            },
                        {
                name: 'Error-Sink Support',
                description: 'Heatmap showing support for error-sink',
                component: 'PosteriorsHeatmap',
                glyph: GLYPH_PATHS.heatmap,
                category: 'codon',
                options: {
                    data: "errorSinkFn",
                    size_field: "subs"
                }
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Tree visualization with branch support values',
                component: 'busted-plots.js',
                glyph: GLYPH_PATHS.tree,
                options: {
                    evThreshold: 10,
                    testOmega: true,
                    hasErrorSink: false
                },
                category: 'summary'
            },
            {
                name: 'Site-Specific Tree',
                description: 'Tree visualization for specific codon sites',
                component: 'busted-plots.js',
                glyph: GLYPH_PATHS.tree,
                options: {
                    partitionSizes: [],
                    evThreshold: 10,
                    testOmega: true,
                    hasErrorSink: false
                },
                category: 'codon'
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
                category: 'summary'
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
                }
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
                }
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
                }
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Tree visualization with branch support values',
                component: 'absrel-plots.js',
                glyph: GLYPH_PATHS.tree,
                options: {
                    evThreshold: 10,
                    colorBranches: true
                },
                category: 'summary'
            },
            {
                name: 'Site-Specific Tree',
                description: 'Tree visualization for specific codon sites',
                component: 'absrel-plots.js',
                glyph: GLYPH_PATHS.tree,
                options: {
                    partitionSizes: [],
                    evThreshold: 10,
                    colorBranches: true
                },
                category: 'codon'
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
                category: 'summary'
            },
            {
                name: 'alpha/beta site-level estimates',
                description: 'Plot of alpha/beta rate estimates',
                component: 'FelAlphaBetaPlot',
                glyph: GLYPH_PATHS.bar,
                category: 'codon'
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
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Tree visualization showing tested branches',
                component: 'fel-plots.js',
                glyph: GLYPH_PATHS.tree,
                options: {
                    pvalueThreshold: 0.1,
                    hasPasmt: false
                },
                category: 'summary'
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
                category: 'summary'
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
                }
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
                }
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
            },
            {
                name: 'Site Details',
                description: 'Detailed site-level information and results',
                component: 'MemeAlphaBetaPlot',
                glyph: GLYPH_PATHS.table,
                category: 'codon'
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Tree visualization with branch support values',
                component: 'meme-plots.js',
                glyph: GLYPH_PATHS.tree,
                options: {
                    treeLabels: true,
                    branchLength: true,
                    colorBranches: true
                },
                category: 'summary'
            },
            {
                name: 'Site-Specific Tree',
                description: 'Tree visualization for specific codon sites',
                component: 'meme-plots.js',
                glyph: GLYPH_PATHS.tree,
                options: {
                    treeLabels: true,
                    branchLength: true,
                    shadeBranches: true
                },
                category: 'codon'
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
                category: 'summary'
            },
            {
                name: 'Evidence Ratios',
                description: 'Evidence ratios by site across models',
                component: 'MultihitEvidenceRatiosPlot',
                glyph: GLYPH_PATHS.bar,
                category: 'codon'
            },
            {
                name: 'Site Log-Likelihood',
                description: 'Site log-likelihood by model',
                component: 'MultihitSiteLogLikelihoodPlot',
                glyph: GLYPH_PATHS.scatter,
                category: 'codon'
            },
            {
                name: 'Model Fitting Benchmarks',
                description: 'Model fitting time benchmarks',
                component: 'MultihitTimerBarPlot',
                glyph: GLYPH_PATHS.bar,
                category: 'summary'
            }
        ],
        // removed siteTableData; handled by generator
    },
    GARD: {
        name: 'GARD',
        visualizations: [
            {
                name: 'Breakpoint Trees',
                description: 'Phylogenetic trees at breakpoint positions',
                component: 'gard-plots.js',
                glyph: GLYPH_PATHS.tree,
                options: {
                    availableDistances: [],
                    distanceFunction: 'default',
                    modelForTree: 'default'
                },
                category: 'summary'
            },
            {
                name: 'Breakpoint Placement',
                description: 'Breakpoint placement and c-AIC improvements',
                component: 'GardBreakpointPlot',
                glyph: GLYPH_PATHS.scatter,
                category: 'summary'
            },
            {
                name: 'Model-averaged support',
                description: 'Support for breakpoint placement',
                component: 'GardSupportPlot',
                glyph: GLYPH_PATHS.scatter,
                category: 'summary'
            },
            {
                name: 'Total Tree Length',
                description: 'Total tree length by partition',
                component: 'GardTreeLengthPlot',
                glyph: GLYPH_PATHS.scatter,
                category: 'summary'
            },
            {
                name: 'Tile Table',
                description: 'Summary statistics in a tile format',
                component: 'TileTable',
                glyph: GLYPH_PATHS.tile,
                category: 'summary'
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
                category: 'summary'
            },
            {
                name: 'Model Summary',
                description: 'Summary of model fit, overall tree lengths (subs/site), and corresponding equilibrium frequencies (EF) for each model.',
                component: 'nrm-plots.js',
                glyph: GLYPH_PATHS.table,
                category: 'model'
            },
            {
                name: 'Rate Matrix',
                description: 'Matrix of rates for each model',
                component: 'nrm-plots.js',
                glyph: GLYPH_PATHS['viz-table'],
                category: 'model'
            },
            {
                name: 'Branch Length Comparisons',
                description: 'Comparisons of branch lengths for each model',
                component: 'nrm-plots.js',
                glyph: GLYPH_PATHS.scatter,
                category: 'model'
            },
            {
                name: 'Phylogenetic Tree',
                description: 'Show how differences in base frequencies are distributed over branches',
                component: 'nrm-plots.js',
                glyph: GLYPH_PATHS.tree,
                options: {
                    availableDistances: [],
                    distanceFunction: 'default',
                    modelForTree: 'default'
                },
                category: 'model'
            }
        ],
        // removed siteTableData; handled by generator
    }
};

// Export type definitions for TypeScript users
export type MethodName = keyof typeof HyPhyMethods;
export type Method = typeof HyPhyMethods[MethodName];
export type VisualizationName = Method['visualizations'][number]['name'];
