import * as d3 from "d3";

/**
 * Creates a D3 ordinal scale for coloring nodes based on their group attribute.
 *
 * @param {Object} data - The input data containing nodes.
 * @param {Array} data.nodes - An array of node objects.
 * @param {string} data.nodes[].group - The group attribute for each node.
 * @returns {d3.ScaleOrdinal} A D3 ordinal scale with domain set to unique node groups and range set to d3.schemeSet2.
 */

function getColorMap(nodes) {
  var allGroups = nodes.map(function(d){return d.group})
  allGroups = [...new Set(allGroups)]
  const scale = d3.scaleOrdinal().domain(allGroups).range(d3.schemeSet2);
  return scale;
}

export function render(x, el, width = 1000, height = 1000) {
    var margin = { top: 20, right: 20, bottom: 30, left: 50 },
        innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;
    
    var svg = d3.select(el).append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      svg.selectAll('*').remove();

      // see insipiration here https://observablehq.com/@chakreshiitgn/bipartite-network-of-teams
      var links = x.links;
      var nodes = x.column1NodeIds.map((node, i) => {
        return {
          id: node,
          group: 2
        };
      }).concat(x.column2NodeIds.map((node, i) => {
        return {
          id: node,
          group: 1
        };
      }));

      var color = getColorMap(nodes);

      // Force Diagram
      var simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(width / 2, height / 2));

      var link = svg
			  .selectAll(".link")
			  .data(links)
			  .enter()
			  .append("polyline") //Create as polyline for arrows
                .attr("stroke", "Gray")
        .attr('stroke-width', function(d) { return d.value / 100; })
			  .attr("marker-mid", "url(#end)");  // Add Marker

      // Create nodes
      var node = svg
			  .append("g")
			  .selectAll(".node")
			  .data(nodes)
        .enter()
        .append("circle")
        .attr("r", d =>5*d.group)
        .attr('stroke', 'black')
        .attr('fill', d => color(d.group))
			  .call(d3.drag(simulation)).attr('class', 'node');
  
       var nodeLinkStatus = {};
       links.forEach(d => {
         nodeLinkStatus[`${d.source.index},${d.target.index}`] = 1;
       });

      function isConnected(a, b) {
        return nodeLinkStatus[`${a.index},${b.index}`] || nodeLinkStatus[`${b.index},${a.index}`] || a.index === b.index;
      }

      // Node interactibility
      node.on('mouseover',function (event, d) {
        node.style('stroke-opacity', function (o) {
          var thisOpacity = 0;
          if(isConnected(d, o)){
            thisOpacity = 1;
          } else{
            thisOpacity = 0.3;
          }
          this.setAttribute('fill-opacity', thisOpacity);

          return thisOpacity;        
        });
    
        link.style('opacity', function(l) {
          if (d === l.source || d === l.target){
            return 1;
          } else{
            return 0.2;
          }
        });
    
   
        var xpos =d.x;
        var ypos = d.y;
        var tgrp = svg.append("g")
          .attr("id", "tooltip")
          .attr("transform", (d, i) => `translate(${xpos+10},${ypos})`);
        tgrp.append("rect")
          .attr("width", "140px")
          .attr("height", "24px")
          .attr("fill", "gray")
        tgrp.append("text")
          .attr("x", 5)
          .attr("y", 14)
          .attr("text-anchor", "left")
          .attr("font-family", "sans-serif")
          .attr("font-size", "11px")
          .attr("font-weight", "bold")
          .attr("fill", "white")
          .text(`${d.id}`);
      });
  
      node.on('mouseout',function (event, d) {
        node.style('stroke-opacity', function (o) {
          this.setAttribute('fill-opacity', 1);
          return 1;
        });
        link.style('opacity',1);
        link.style('stroke-width', function(d) { return d.value / 100; return 2 * Math.abs(d.value); });
        d3.select("#tooltip").remove();
      });
   
      // Simulation tick
      simulation.on("tick", () => {
        link.attr("points", function(d) {
          return d.source.x + "," + d.source.y + " " + 
                (d.source.x + d.target.x)/2 + "," + (d.source.y + d.target.y)/2 + " " +
                 d.target.x + "," + d.target.y; });
        
        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
      });

      return svg.node();
}
