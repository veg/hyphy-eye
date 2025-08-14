/**
 * @module relax-plots
 * @description Plotting functions for RELAX visualization
 */

import * as d3 from "d3";
import * as _ from "lodash-es";
import * as phylotree from "phylotree";
import * as phylotreeUtils from "../utils/phylotree-utils.js";


/**
 * Creates rate distribution pie charts for RELAX visualization.
 * Creates two pie charts for each model: one for tested branches and one for reference branches.
 * Each pie chart shows the proportion of sites in each omega rate class.
 *
 * @param {Object} resultsJson - The JSON object containing the RELAX results
 * @param {Object} options - Plot options
 *
 * @returns {Object} Plot object containing pie charts for rate distributions
 */
export function createRelaxRateDistributionPlot(resultsJson, options = {}) {
    const width = options.width || 800;
    const height = options.height || 500;
    const margin = options.margin || { top: 50, right: 30, bottom: 50, left: 30 };
    const pieRadius = Math.min(width, height) / 5;
    const pieWidth = pieRadius * 2;
    const pieHeight = pieRadius * 2;
    
    // Check if resultsJson has the necessary data
    if (!resultsJson || !resultsJson.fits) {
        return createRelaxPlaceholderPlot({}, options);
    }
    
    // Get models with rate distributions
    const models = [];
    for (const modelName in resultsJson.fits) {
        const model = resultsJson.fits[modelName];
        if (model && model["Rate Distributions"]) {
            // Only include models with rate distributions for both Test and Reference
            if (model["Rate Distributions"]["Test"] && model["Rate Distributions"]["Reference"]) {
                models.push({
                    name: modelName,
                    displayOrder: model["display order"] || 999,
                    rateDistributions: model["Rate Distributions"]
                });
            }
        }
    }
    
    // Sort models by display order
    models.sort((a, b) => a.displayOrder - b.displayOrder);
    
    // If no models with rate distributions, return placeholder
    if (models.length === 0) {
        return createRelaxPlaceholderPlot({}, options);
    }
    
    // Create a container for all pie charts
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "20px";
    container.style.width = width + "px";
    
    // Process each model
    models.forEach(model => {
        // Create model container
        const modelContainer = document.createElement("div");
        modelContainer.style.display = "flex";
        modelContainer.style.flexDirection = "column";
        modelContainer.style.border = "1px solid #ddd";
        modelContainer.style.borderRadius = "5px";
        modelContainer.style.padding = "15px";
        modelContainer.style.marginBottom = "20px";
        
        // Add model title
        const modelTitle = document.createElement("h3");
        modelTitle.textContent = model.name;
        modelTitle.style.textAlign = "center";
        modelTitle.style.margin = "0 0 15px 0";
        modelContainer.appendChild(modelTitle);
        
        // Create pie charts container
        const pieChartsContainer = document.createElement("div");
        pieChartsContainer.style.display = "flex";
        pieChartsContainer.style.justifyContent = "space-around";
        pieChartsContainer.style.flexWrap = "wrap";
        
        // Create pie charts for Test and Reference
        const groups = ["Test", "Reference"];
        
        groups.forEach(group => {
            if (!model.rateDistributions[group]) return;
            
            // Create pie chart container
            const pieContainer = document.createElement("div");
            pieContainer.style.display = "flex";
            pieContainer.style.flexDirection = "column";
            pieContainer.style.alignItems = "center";
            pieContainer.style.margin = "10px";
            
            // Add group title
            const groupTitle = document.createElement("h4");
            groupTitle.textContent = group + " Branches";
            groupTitle.style.margin = "0 0 10px 0";
            pieContainer.appendChild(groupTitle);
            
            // Process rate distribution data for pie chart
            const rateDistribution = model.rateDistributions[group];
            const pieData = [];
            
            for (const rateClass in rateDistribution) {
                const rate = rateDistribution[rateClass];
                pieData.push({
                    rateClass,
                    omega: rate.omega,
                    proportion: rate.proportion
                });
            }
            
            // Sort by omega value (ascending)
            pieData.sort((a, b) => a.omega - b.omega);
            
            // Create SVG element for pie chart
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", pieWidth);
            svg.setAttribute("height", pieHeight);
            
            // Create pie chart using D3
            const pie = d3.pie()
                .value(d => d.proportion)
                .sort(null);
            
            const arc = d3.arc()
                .innerRadius(0)
                .outerRadius(pieRadius - 10);
            
            const colorScale = d3.scaleSequential(d3.interpolateViridis)
                .domain([0, pieData.length - 1]);
            
            const g = d3.select(svg)
                .append("g")
                .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);
            
            g.selectAll("path")
                .data(pie(pieData))
                .enter()
                .append("path")
                .attr("d", arc)
                .attr("fill", (d, i) => colorScale(i))
                .attr("stroke", "white")
                .style("stroke-width", "1px");
            
            // Add labels
            const labelArc = d3.arc()
                .innerRadius(pieRadius - 40)
                .outerRadius(pieRadius - 40);
            
            g.selectAll("text")
                .data(pie(pieData))
                .enter()
                .append("text")
                .attr("transform", d => `translate(${labelArc.centroid(d)})`)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text(d => d.data.omega.toFixed(2));
            
            // Add legend
            const legend = document.createElement("div");
            legend.style.display = "flex";
            legend.style.flexDirection = "column";
            legend.style.marginTop = "10px";
            
            pieData.forEach((data, i) => {
                const legendItem = document.createElement("div");
                legendItem.style.display = "flex";
                legendItem.style.alignItems = "center";
                legendItem.style.margin = "2px 0";
                
                const colorBox = document.createElement("div");
                colorBox.style.width = "12px";
                colorBox.style.height = "12px";
                colorBox.style.backgroundColor = colorScale(i);
                colorBox.style.marginRight = "5px";
                
                const label = document.createElement("span");
                label.textContent = `ω = ${data.omega.toFixed(2)} (${(data.proportion * 100).toFixed(1)}%)`;
                label.style.fontSize = "12px";
                
                legendItem.appendChild(colorBox);
                legendItem.appendChild(label);
                legend.appendChild(legendItem);
            });
            
            pieContainer.appendChild(svg);
            pieContainer.appendChild(legend);
            pieChartsContainer.appendChild(pieContainer);
        });
        
        modelContainer.appendChild(pieChartsContainer);
        container.appendChild(modelContainer);
    });
    
    return container;
}

/**
 * Gets the phylogenetic tree for RELAX visualization.
 * Configures the tree to display branch partitions (Test vs Reference) with appropriate styling.
 *
 * @param {Object} resultsJson - The JSON object containing the RELAX results
 * @param {Object} options - Tree options
 * @param {number} options.width - Width of the tree visualization
 * @param {number} options.height - Height of the tree visualization
 * @param {string} options.selectionType - Type of selection to display ("All", "Test", "Reference")
 *
 * @returns {Object} Configured tree visualization object
 */
export function getRelaxTree(resultsJson, options = {}) {
    if (!resultsJson || !resultsJson.input || !resultsJson.input.trees) {
        console.error("Invalid RELAX results JSON or missing trees data");
        return null;
    }
    
    const width = options.width || 800;
    const height = options.height || 600;
    const selectionType = options.selectionType || "All";
    
    // Get the tree from the results JSON
    const newickString = resultsJson.input.trees["0"];
    if (!newickString) {
        console.error("No tree found in RELAX results JSON");
        return null;
    }
    
    // Create a phylotree object from the Newick string
    const tree = new phylotree.phylotree(newickString);
    
    // Configure branch length accessor based on "Nucleotide GTR" model
    phylotreeUtils.setBranchLengthAccessor(tree, resultsJson, 0, "Nucleotide GTR");
    
    // Get the branch partition information (Test vs Reference)
    const branchPartitions = resultsJson.tested && resultsJson.tested["0"] ? resultsJson.tested["0"] : {};
    
    // Configure the tree visualization
    const renderedTree = phylotreeUtils.configureTree(tree, `${width}x${height}`, {
        configureBranches: (tree, renderedTree) => {
            // Set up color scale for branch partitions
            const colorScale = d3.scaleOrdinal()
                .domain(["Test", "Reference"])
                .range(["#d62728", "#1f77b4"]); // Red for Test, Blue for Reference
            
            // Configure branch styling based on partition
            renderedTree.style_edges((edge, node) => {
                if (!node || !node.target || !node.target.data || !node.target.data.name) return;
                
                const branchName = node.target.data.name;
                const partition = branchPartitions[branchName];
                
                // Skip branches that don't match the selected partition type
                if (selectionType !== "All" && partition !== selectionType) return;
                
                // Apply styling based on partition
                if (partition) {
                    // Set stroke color and width based on partition
                    edge.style("stroke", colorScale(partition))
                        .style("stroke-width", "4px")
                        .style("stroke-linejoin", "round")
                        .style("stroke-linecap", "round");
                    
                    // Add tooltip with partition information
                    edge.selectAll("title").data([partition]).join("title").text(d => d);
                }
            });
            
            // Add a legend for the tree
            const svg = renderedTree.svg;
            const legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${width - 150}, 20)`);
            
            // Only show legend items for partitions that are visible
            const legendItems = selectionType === "All" ? ["Test", "Reference"] :
                               [selectionType];
            
            // Add legend items
            legendItems.forEach((partition, i) => {
                // Add colored rectangle
                legend.append("rect")
                    .attr("x", 0)
                    .attr("y", i * 25)
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("fill", colorScale(partition));
                
                // Add text label
                legend.append("text")
                    .attr("x", 30)
                    .attr("y", i * 25 + 15)
                    .text(partition + " branches")
                    .attr("font-size", "14px");
            });
        }
    });
    
    return renderedTree;
}
