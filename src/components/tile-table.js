/**
 * @module tile-table
 * @description Function to create a table of tiles with each tile showing a number, 
 * an icon and a description
 */


/**
 * Creates a table of tiles with each tile showing a number, 
 * an icon and a description. The table will have a variable number of columns.
 * Icons support currently are from simple-line-icons.com and colors are
 * custom defined. See `supported_colors` for a list of recognized color names.
 * @param {Array} table_spec - An array of objects with properties number, description, icon and color
 * @param {number} columns - The number of columns in the table, defaults to 3
 * @returns {HTMLTableElement} - A table with the specified tiles
 */
export function tile_table(table_spec, columns = 3) {
    const table = document.createElement('table');
    const rows = calculate_rows(table_spec, columns);
    
    for (let i = 0; i < rows; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < columns; j++) {
            const index = i * columns + j;
            if (index < table_spec.length) {
                const width = 100 / columns + '%';
                tr.appendChild(build_tile(table_spec[index], width));
            }
        }
        table.appendChild(tr);
    }
    
    // TODO: this is bad form i suppose, wip
    // needs to only affect the returned element rather than the whole page
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/simple-line-icons/2.4.1/css/simple-line-icons.css";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.innerHTML = stati_styles;
    document.head.appendChild(style);

    return table;
}

/**
 * Returns an array of all the colors that are currently supported by the
 * stati CSS styles. These are the colors that can be used when creating a
 * tile table.
 * @returns {Array<String>} - An array of color names as strings.
 */
export function supported_colors() {
    const colorRegex = /\.stati\.(\w+)\s*\{/g;
    const colors = [];
    let match;
    while ((match = colorRegex.exec(stati_styles)) !== null) {
        colors.push(match[1]);
    }
    
    return colors;
}

export const stati_styles = `
.stati{
  background: #fff;
  height: 6em;
  padding:0.5em;
  margin:0.25em 0; 
    -webkit-transition: margin 0.5s ease,box-shadow 0.5s ease; /* Safari */
    transition: margin 0.5s ease,box-shadow 0.5s ease; 
    -moz-box-shadow:0px 0.2em 0.4em rgb(0, 0, 0,0.8);
    -webkit-box-shadow:0px 0.2em 0.4em rgb(0, 0, 0,0.8);
  box-shadow:0px 0.2em 0.4em rgb(0, 0, 0,0.8);
}
.stati i{
  font-size:3.5em; 
} 
.stati div{
  width: calc(100% - 3.5em);
  display: block;
  float:right;
  text-align:right;
}
.stati div b {
  font-size:2.2em;
  width: 100%;
  padding-top:0px;
  margin-top:-0.2em;
  margin-bottom:-0.2em;
  display: block;
}
.stati div span {
  font-size:1em;
  width: 100%;
  color: rgb(0, 0, 0,0.8); !important;
  display: block;
}

.stati.left div{ 
  float:left;
  text-align:left;
}

.stati.bg-turquoise { background: rgb(26, 188, 156); color:white;} 
.stati.bg-emerald { background: rgb(46, 204, 113); color:white;} 
.stati.bg-peter_river { background: rgb(52, 152, 219); color:white;} 
.stati.bg-amethyst { background: rgb(155, 89, 182); color:white;} 
.stati.bg-wet_asphalt { background: rgb(52, 73, 94); color:white;} 
.stati.bg-green_sea { background: rgb(22, 160, 133); color:white;} 
.stati.bg-nephritis { background: rgb(39, 174, 96); color:white;} 
.stati.bg-belize_hole { background: rgb(41, 128, 185); color:white;} 
.stati.bg-wisteria { background: rgb(142, 68, 173); color:white;} 
.stati.bg-midnight_blue { background: rgb(44, 62, 80); color:white;} 
.stati.bg-sun_flower { background: rgb(241, 196, 15); color:white;} 
.stati.bg-carrot { background: rgb(230, 126, 34); color:white;} 
.stati.bg-alizarin { background: rgb(231, 76, 60); color:white;} 
.stati.bg-clouds { background: rgb(236, 240, 241); color:white;} 
.stati.bg-concrete { background: rgb(149, 165, 166); color:white;} 
.stati.bg-orange { background: rgb(243, 156, 18); color:white;} 
.stati.bg-pumpkin { background: rgb(211, 84, 0); color:white;} 
.stati.bg-pomegranate { background: rgb(192, 57, 43); color:white;} 
.stati.bg-silver { background: rgb(189, 195, 199); color:white;} 
.stati.bg-asbestos { background: rgb(127, 140, 141); color:white;} 
  

.stati.turquoise { color: rgb(26, 188, 156); } 
.stati.emerald { color: rgb(46, 204, 113); } 
.stati.peter_river { color: rgb(52, 152, 219); } 
.stati.amethyst { color: rgb(155, 89, 182); } 
.stati.wet_asphalt { color: rgb(52, 73, 94); } 
.stati.green_sea { color: rgb(22, 160, 133); } 
.stati.nephritis { color: rgb(39, 174, 96); } 
.stati.belize_hole { color: rgb(41, 128, 185); } 
.stati.wisteria { color: rgb(142, 68, 173); } 
.stati.midnight_blue { color: rgb(44, 62, 80); } 
.stati.sun_flower { color: rgb(241, 196, 15); } 
.stati.carrot { color: rgb(230, 126, 34); } 
.stati.alizarin { color: rgb(231, 76, 60); } 
.stati.clouds { color: rgb(236, 240, 241); } 
.stati.concrete { color: rgb(149, 165, 166); } 
.stati.orange { color: rgb(243, 156, 18); } 
.stati.pumpkin { color: rgb(211, 84, 0); } 
.stati.pomegranate { color: rgb(192, 57, 43); } 
.stati.silver { color: rgb(189, 195, 199); } 
.stati.asbestos { color: rgb(127, 140, 141); } 
`;

/**
 * Calculates the number of rows needed for the table.
 * @param {Array} table_spec - An array of objects containing tile specifications.
 * @param {number} columns - The number of columns in the table.
 * @returns {number} The number of rows required to accommodate all tiles.
 */
function calculate_rows(table_spec, columns) {
    const numElements = table_spec.length;
    const numRows = Math.ceil(numElements / columns);

    return numRows;
}

/**
 * Creates a table cell with a tile with a number, an icon and a description.
 * @param {Object} tile_json - Object with properties number, description, icon and color
 * @param {string} width - The width of the table cell
 * @returns {HTMLTableCellElement} - A table cell containing the tile 
 */
function build_tile(tile_json, width) {
    const td = document.createElement('td');
    td.style.width = width;

    const div = document.createElement('div');
    div.classList.add('stati', tile_json.color, 'left');
    const icon = document.createElement('i');
    const iconClasses = tile_json.icon.split(' ');
    icon.classList.add(...iconClasses);
    div.appendChild(icon);

    const div2 = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = tile_json.number;
    div2.appendChild(b);
    const span = document.createElement('span');
    span.textContent = tile_json.description;
    div2.appendChild(span);
    div.appendChild(div2);

    td.appendChild(div);
    return td;
}