/**
 * @module method-utils
 * @description Centralized registry of method-specific utility functions
 */

import { 
    getBustedAttributes, 
    getBustedTileSpecs, 
    getBustedErrorSink, 
    getBustedSiteTableData, 
    getBustedPositiveSelection,
    getBustedMultiHitER,
    getBustedTestOmega
} from '../busted/busted-utils.js';
import { 
    getAbsrelAttributes, 
    getAbsrelProfileBranchSites, 
    getAbsrelTileSpecs, 
    getAbsrelSiteTableData, 
    getAbsrelBSPositiveSelection,
    getAbsrelTestOmega
} from '../absrel/absrel-utils.js';
import { 
    getFelAttributes, 
    getFelTileSpecs, 
    getFelSiteTableData 
} from '../fel/fel-utils.js';
import { 
    getMemeAttributes, 
    getMemeTileSpecs, 
    getMemeSiteTableData, 
    getMemePosteriorsPerBranchSite 
} from '../meme/meme-utils.js';
import { 
    getGardAttributes, 
    getGardTileSpecs 
} from '../gard/gard-utils.js';
import { 
    getNrmAttributes, 
    getNrmTileSpecs 
} from '../nrm/nrm-utils.js';
import { 
    getMultihitAttributes, 
    getMultihitTileSpecs 
} from '../multihit/multihit-utils.js';

// Shared mapping of HyPhy methods to their attribute, site-table, and posterior functions
export const methodUtils = {
    BUSTED: { 
        attrsFn: getBustedAttributes, 
        tableFn: getBustedSiteTableData, 
        tileFn: getBustedTileSpecs,
        bsPositiveSelectionFn: getBustedPositiveSelection,
        errorSinkFn: getBustedErrorSink,
        multiHitFn: getBustedMultiHitER,
        testOmegaFn: getBustedTestOmega,
        profileBranchSitesFn: null
    },
    aBSREL: { 
        attrsFn: getAbsrelAttributes, 
        tableFn: getAbsrelSiteTableData,
        tileFn: getAbsrelTileSpecs, 
        bsPositiveSelectionFn: getAbsrelBSPositiveSelection,
        testOmegaFn: getAbsrelTestOmega,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: getAbsrelProfileBranchSites
    },
    FEL: { 
        attrsFn: getFelAttributes, 
        tableFn: getFelSiteTableData, 
        tileFn: getFelTileSpecs,
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null,
        testOmegaFn: null
    },
    MEME: { 
        attrsFn: getMemeAttributes, 
        tableFn: getMemeSiteTableData,
        tileFn: getMemeTileSpecs, 
        bsPositiveSelectionFn: getMemePosteriorsPerBranchSite,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null,
        testOmegaFn: null
    },
    GARD: { 
        attrsFn: getGardAttributes, 
        tableFn: null, 
        tileFn: getGardTileSpecs, 
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null,
        testOmegaFn: null
    },
    NRM: { 
        attrsFn: getNrmAttributes, 
        tableFn: null, 
        tileFn: getNrmTileSpecs, 
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null,
        testOmegaFn: null
    },
    MULTIHIT: { 
        attrsFn: getMultihitAttributes, 
        tableFn: null, 
        tileFn: getMultihitTileSpecs, 
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null,
        testOmegaFn: null
    }
};
