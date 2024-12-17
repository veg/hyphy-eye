/*
 * Any types that are used in the tile-table module should be exported here.
 */

// number could become 'item' or something more generic and take a string
// thatd maximize reuse here
export interface TileSpec {
    number: number;
    description: string;
    icon: string;
    color: string;
}