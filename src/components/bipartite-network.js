import * as d3 from "d3";

function getNodeId(d) {
    return(d);
}

/**
 * Return the x-coordinate for the node with the given id, depending on whether the node is in the first or second column.
 * @param {string} d - id of the node
 * @param {boolean} isColumn1 - boolean indicating whether the node is in the first or second column
 * @param {number} innerWidth - width of the inner container
 * @return {number} - x-coordinate of the node
 */
function findNodeCX(d, isColumn1, innerWidth) {
    var cx = isColumn1 ? innerWidth / 6 : innerWidth / 6 * 5;
    return(cx)
}

/**
 * Return the x-coordinate for the label of the node with the given id, depending on whether the node is in the first or second column.
 * @param {string} d - id of the node
 * @param {boolean} isColumn1 - boolean indicating whether the node is in the first or second column
 * @param {number} innerWidth - width of the inner container
 * @return {number} - x-coordinate of the label
 */
function findNodeLabelX(d, isColumn1, innerWidth) {
    var cx = isColumn1 ? findNodeCX(d, isColumn1, innerWidth) - 50 : findNodeCX(d, isColumn1, innerWidth) + 10;
    return(cx)
}

/**
 * Return the y-coordinate for the node with the given id at the given index i.
 * @param {string} d - id of the node
 * @param {number} i - index of the node in the column
 * @param {number} innerHeight - height of the inner container
 * @param {number} tallestColumnSize - number of nodes in the tallest column
 * @return {number} - y-coordinate of the node
 */
function findNodeCY(d, i, innerHeight, tallestColumnSize) {
    return(i * (innerHeight / tallestColumnSize) + 10)
}

/**
 * Return the y-coordinate for the source node of the given link.
 * @param {Object} d - link object containing source and target node ids
 * @param {Object} x - input data, containing column1NodeIds
 * @param {number} innerHeight - height of the inner container
 * @param {number} tallestColumnSize - number of nodes in the tallest column
 * @return {number} - y-coordinate of the source node
 */
function findLinkY1(d, x, innerHeight, tallestColumnSize) {
    const isCurrentSourceNode = (element) => element === d.source;
    var i = x.column1NodeIds.findIndex(isCurrentSourceNode);
    var y1 = findNodeCY(d, i, innerHeight, tallestColumnSize);
    return(y1);
}

/**
 * Return the y-coordinate for the target node of the given link.
 * @param {Object} d - link object containing source and target node ids
 * @param {Object} x - input data, containing column2NodeIds
 * @param {number} innerHeight - height of the inner container
 * @param {number} tallestColumnSize - number of nodes in the tallest column
 * @return {number} - y-coordinate of the target node
 */
function findLinkY2(d, x, innerHeight, tallestColumnSize) {
    const isCurrentTargetNode = (element) => element === d.target;
    var i = x.column2NodeIds.findIndex(isCurrentTargetNode);
    var y2 = findNodeCY(d, i, innerHeight, tallestColumnSize);
    return(y2);
}

/**
 * Extracts unique values from the 'value' property of each object in the given data array.
 * 
 * @param {Array<Object>} data - An array of objects, each containing a 'value' property.
 * @return {Array<string>} - An array of unique values extracted from the 'value' property of the objects.
 */
function getUniqueLinkValues(data) {
    return [...new Set(data.map(d => d.value))];
}

/**
 * Return an array of colors, one for each category in the given list of unique categories.
 * If there are more unique categories than colors in the color map, throw an error.
 * If there are fewer unique categories than colors in the color map, return only the first n colors.
 * @param {Array<string>} uniqueCategories - list of unique categories
 * @return {Array<string>} - array of colors, one for each category
 */
//function getColorMap(uniqueCategories) {
//    var colorMap = tol.muted.splice(0, 9);

//    if (uniqueCategories.length > colorMap.length) {
//        throw new Error(`There are more unique categories (${uniqueCategories.length}) than colors in the color map (${colorMap.length}).`);
//    }

//    if (uniqueCategories.length < colorMap.length) {
//        colorMap = colorMap.slice(0, uniqueCategories.length);
//    }

//    return colorMap;
//}

/**
 * Return a color for the labels based on the user's preferred color scheme.
 * If the user prefers a dark color scheme, return white; otherwise, return black.
 * @return {string} - hex code for the label color
 */
function getLabelColor() {
    var labelColor = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "#ffffff" : "#000000";
    return(labelColor);
}

// TODO links.value should be optional
// TODO this should be refactored so it can be used for other vizs, ex a correlation network (see https://github.com/microbiomeDB/corGraph)
/**
 * Renders the bipartite network visualization as an SVG element.
 * @param {Object} x - input data, containing column1NodeIds, column2NodeIds, and links
 * where links is an array of objects with source and target node ids and a value
 * @param {Element} el - the element in which to render the visualization
 * @param {number} width - the width of the SVG element. Default is 500
 * @param {number} height - the height of the SVG element. Default is 1000
 */
export function render(x, el, width = 1000, height = 1500) {
    var margin = { top: 20, right: 20, bottom: 30, left: 50 },
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;

    var svg = d3.select(el).append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.selectAll('*').remove();

    var tallestColumnSize = Math.max(x.column1NodeIds.length, x.column2NodeIds.length);
    var shortestColumnSize = Math.min(x.column1NodeIds.length, x.column2NodeIds.length);

    var categories = getUniqueLinkValues(x.links);
    //var colorMap = getColorMap(categories);

    // Legend
    //const legend = svg.selectAll('.legend')
    //    .data(categories)
    //    .enter()
    //    .append('g')
    //    .attr('class', 'legend')
    //    .attr('transform', (d, i) => 'translate(0,' + (i * 20) + ')');

    //legend.append('rect')
    //    .attr('x', width - 18)
    //    .attr('width', 18)
    //    .attr('height', 18)
    //    .attr('fill', d => colorMap[categories.indexOf(d)]);

    // text is white for now bc my eyes hurt, but should be black/ dark gray generally probably
    // even better, itd respond to light/dark mode
    //legend.append('text')
    //    .attr('x', width - 24)
    //    .attr('y', 9)
    //    .attr('dy', '.35em')
    //    .attr('text-anchor', 'end')
    //    .attr('fill', getLabelColor())
    //    .text(d => d);

    // Links
    svg.selectAll('.link')
        .data(x.links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('x1', d => findNodeCX(d, true, innerWidth))
        .attr('y1', d => findLinkY1(d, x, innerHeight, tallestColumnSize))
        .attr('x2', d => findNodeCX(d, false, innerWidth))
        .attr('y2', d => findLinkY2(d, x, innerHeight, shortestColumnSize))
        .attr('stroke', getLabelColor()) // if coloring, this would use colorMap
        .attr('stroke-width', function(d) { return d.value / 100; });

    // Nodes
    let sources = 
    svg.selectAll('.node-source')
        .data(x.column1NodeIds)
        .enter()
        .append('g')
        .attr('class', 'node');

    sources  
        .append('circle')
        .attr('id', d => getNodeId(d))
        .attr('r', 5)
        .attr('cx', d => findNodeCX(d, true, innerWidth))
        .attr('cy', (d,i) => findNodeCY(d, i, innerHeight, tallestColumnSize))
        .style('fill', getLabelColor())
        .style('stroke', 'black');

    sources  
        .append('text')
        .attr('x', d => findNodeLabelX(d, true, innerWidth))
        .attr('y', (d,i) => findNodeCY(d, i, innerHeight, tallestColumnSize))
        .attr('fill', getLabelColor())
        .text(d => getNodeId(d));

    let targets =
    svg.selectAll('.node-target')
        .data(x.column2NodeIds)
        .enter()
        .append('g')
        .attr('class', 'node');

    targets
        .append('circle')
        .attr('id', d => getNodeId(d))
        .attr('r', 5)
        .attr('cx', d => findNodeCX(d, false, innerWidth))
        .attr('cy', (d,i) => findNodeCY(d, i, innerHeight, shortestColumnSize))
        .style('fill', getLabelColor())
        .style('stroke', 'black');

    targets
        .append('text')
        .attr('x', d => findNodeLabelX(d, false, innerWidth)) 
        .attr('y', (d,i) => findNodeCY(d, i, innerHeight, shortestColumnSize))
        .attr('fill', getLabelColor())
        .text(d => getNodeId(d));

    return svg.node();
}