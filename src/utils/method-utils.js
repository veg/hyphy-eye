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
    getBustedMultiHitER
} from '../busted/busted-utils.js';
import { 
    getAbsrelAttributes, 
    getAbsrelProfileBranchSites, 
    getAbsrelTileSpecs, 
    getAbsrelSiteTableData, 
    getAbsrelBSPositiveSelection 
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
        profileBranchSitesFn: null
    },
    aBSREL: { 
        attrsFn: getAbsrelAttributes, 
        tableFn: getAbsrelSiteTableData,
        tileFn: getAbsrelTileSpecs, 
        bsPositiveSelectionFn: getAbsrelBSPositiveSelection,
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
        profileBranchSitesFn: null
    },
    MEME: { 
        attrsFn: getMemeAttributes, 
        tableFn: getMemeSiteTableData,
        tileFn: getMemeTileSpecs, 
        bsPositiveSelectionFn: getMemePosteriorsPerBranchSite,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null
    },
    GARD: { 
        attrsFn: getGardAttributes, 
        tableFn: null, 
        tileFn: getGardTileSpecs, 
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null
    },
    NRM: { 
        attrsFn: getNrmAttributes, 
        tableFn: null, 
        tileFn: getNrmTileSpecs, 
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null
    },
    MULTIHIT: { 
        attrsFn: getMultihitAttributes, 
        tableFn: null, 
        tileFn: getMultihitTileSpecs, 
        bsPositiveSelectionFn: null,
        errorSinkFn: null,
        multiHitFn: null,
        profileBranchSitesFn: null
    }
};
