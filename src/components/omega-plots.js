import * as d3 from "d3";

/**
 * Renders a discrete distribution plot using D3.js.
 *
 * @param {Array} data - The data array containing objects with properties used for plotting.
 * @param {Object} options - Configuration options for the plot.
 * @param {number} [options.width=200] - The width of the SVG element.
 * @param {number} [options.height=50] - The height of the SVG element.
 * @param {string} [options.x='value'] - The property name in data objects used for the x-axis.
 * @param {Array} [options.ref=[1]] - Reference lines to draw on the plot.
 * @param {number} [options.ticks=5] - Number of ticks on the x-axis.
 * @param {string} [options.w='weight'] - The property name in data objects used for circle size.
 * @param {Object|null} [options.label=null] - Label options for the plot.
 * @param {Object} [options.margin={top: 5, right: 20, bottom: 20, left: 20}] - Margins around the plot.
 * @param {string} [options.scale='linear'] - The scale type for the x-axis ('linear', 'sqrt', or 'symlog').
 * @returns {SVGSVGElement} A D3-created SVG element representing the discrete distribution plot.
 */

export function renderDiscreteDistribution(data, options) {
    options = options || {};
    options.width = options.width || 200;
    options.height = options.height || 50;
    options.x = options.x || "value";
    options.ref = options.ref || [1];
    options.ticks = options.ticks || 5;
    options.w = options.w || "weight";
    options.label = options.label || null;
    options.margin = options.margin || {top: 5, right: 20, bottom: 20 + (options.label ? 12 : 0), left: 20};
    options.scale = options.scale || "linear";
 
    const x_range = d3.extent(data, d => d[options.x]);
    x_range[1] = Math.max (1, x_range[1]);
    const x = (options.scale == "sqrt" ? d3.scaleSqrt() : (options.scale == "symlog" ? d3.scaleSymlog () : d3.scaleLinear()))
              .domain(x_range).nice()
              .range([options.margin.left, options.width - options.margin.right]);

    const y = d3.scaleLinear()
              .domain([0,1]).nice()
              .range([options.height - options.margin.bottom, options.margin.top]);

    options.size = options.size || ((d)=>Math.sqrt(d["weight"])*(y.range()[0]-y.range()[1])*0.5);
  
    const xAxis = g => g
        .attr("transform", `translate(0,${options.height - options.margin.bottom})`)
        .call(d3.axisBottom(x).ticks(options.ticks));

    const yAxis = g => g
          .attr("transform", `translate(${options.margin.left},0)`)
          .call(d3.axisLeft(y));

    
  
    const svg = d3.create("svg")
      .attr("width", options.width)
      .attr("height", options.height);
  
    const axis_object = svg.append("g")
        .call(xAxis);

    if (options.label && options.label.chart) {
        axis_object.append('text')
        .style('fill', 'black')
        .text(options.label.chart)
        .attr('x', options.margin.left + (options.width - options.margin.left - options.margin.right) / 2)
        .attr('y', 30);
    }
  
    svg.append("g")
      .selectAll("circle")
      .data(data)
      .join("circle")
        .attr("cx", d => x(d[options.x]))
        .attr("cy", d => y(0.5))
        .attr("r", options.size)
        .style ("fill", "grey")
        .style ("stroke", "black")
        .style ("stroke-width", "1")
        .style ("opacity", 0.5)
        .append ("title").text ((d)=>"" + d[options.x] + " (" + d[options.w] + ")");

    if (options.ref [0] != null) {
      svg.append("g")
        .selectAll("line")
        .data(options.ref)
        .join("line")
          .attr("x1", d => x(d))
          .attr("x2", d => x(d))
          .attr("y1", d => y(0))
          .attr("y2", d => y(1))
          .style ("stroke", "firebrick")
          .style ("stroke-width", "2")
          .style ("opacity", 0.5);
    }
  
    return svg.node();
}

/**
 * Renders two discrete distribution plots using D3.js.
 *
 * @param {Array} data - The data array containing objects with properties used for plotting.
 * @param {Array} data2 - The second data array containing objects with properties used for plotting.
 * @param {Object} options - Configuration options for the plot.
 * @param {number} [options.width=200] - The width of the SVG element.
 * @param {number} [options.height=50] - The height of the SVG element.
 * @param {string} [options.x='value'] - The property name in data objects used for the x-axis.
 * @param {Array} [options.ref=[1]] - Reference lines to draw on the plot.
 * @param {number} [options.ticks=5] - Number of ticks on the x-axis.
 * @param {string} [options.w='weight'] - The property name in data objects used for circle size.
 * @param {Object|null} [options.label=null] - Label options for the plot.
 * @param {Object} [options.margin={top: 5, right: 20, bottom: 20 + (options.label ? 12 : 0), left: 20}] - Margins around the plot.
 * @param {string} [options.scale='linear'] - The scale type for the x-axis ('linear', 'sqrt', or 'symlog').
 * @returns {SVGSVGElement} A D3-created SVG element representing the two discrete distribution plots.
 */
export function renderTwoDiscreteDistributions(data, data2, options) {
    options = options || {};
    options.width = options.width || 200;
    options.height = options.height || 50;
    options.x = options.x || "value";
    options.ref = options.ref || [1];
    options.ticks = options.ticks || 5;
    options.w = options.w || "weight";
    options.label = options.label || null;
    options.scale = options.scale || "linear";
    options.margin = options.margin || {top: 5, right: 20, bottom: 20 + (options.label ? 12 : 0), left: 20};

 
    const x_range = d3.extent(data, d => d[options.x]);
    const x_range2 = d3.extent(data2, d => d[options.x])
    x_range[1] = Math.max (1, Math.max (x_range[1], x_range2[1]));
    x_range[0] = Math.min (x_range[0], x_range2[0]);
    const x = (options.scale == "sqrt" ? d3.scaleSqrt() : (options.scale == "symlog" ? d3.scaleSymlog () : d3.scaleLinear()))
              .domain(x_range).nice()
              .range([options.margin.left, options.width - options.margin.right]);

    const y = d3.scaleLinear()
              .domain([0,1]).nice()
              .range([options.height - options.margin.bottom, options.margin.top]);

    options.size = options.size || ((d)=>Math.sqrt(d)*(y.range()[0]-y.range()[1])*0.25);
  
    const xAxis = g => g
        .attr("transform", `translate(0,${options.height - options.margin.bottom})`)
        .call(d3.axisBottom(x).ticks(options.ticks));

    const yAxis = g => g
          .attr("transform", `translate(${options.margin.left},0)`)
          .call(d3.axisLeft(y));

    
  
    const svg = d3.create("svg")
      .attr("width", options.width)
      .attr("height", options.height);
  
    const axis_object = svg.append("g")
        .call(xAxis);

    if (options.label && options.label.chart) {
        axis_object.append('text')
        .style('fill', 'black')
        .text(options.label.chart)
        .attr('x', options.margin.left + (options.width - options.margin.left - options.margin.right) / 2)
        .attr('y', 30);
    }

    if (options.label && options.label.series) {
        svg.append('text')
        .style('fill', 'black')
        .text(options.label.series[0])
        .attr('x', options.width - options.margin.right + 5)
        .style ('font' , '12px courier')
        .attr('y', y (0.25));

       svg.append('text')
        .style('fill', 'black')
        .text(options.label.series[1])
        .attr('x', options.width - options.margin.right + 5)
        .style ('font' , '12px courier')
        .attr('y', y (0.75));
    }

    _.each ([data, data2], (dd,i)=>{
      svg.append("g")
        .selectAll("circle")
        .data(dd)
        .join("circle")
          .attr("cx", d => x(d[options.x]))
          .attr("cy", d => y(0.25+i*0.5))
          .attr("r", (d)=>options.size (d.weight))
          .style ("fill", "lightgrey")
          .style ("stroke", i == 0 ? "firebrick" : "steelblue" )
          .style ("stroke-width", "1")
          .style ("fill-opacity", 0.2)
          .append ("title").text ((d)=>"" + d[options.x] + " (" + d[options.w] + ")");
    });

    const paired = _.map (data, (c, i)=> {
        return {
            'x1' : c[options.x],
            'x2' : data2[i][options.x],
            'w1' : c[options.w],
            'w2' : data2[i][options.w]
          }; 
     });

    svg.append("g")
        .selectAll("path")
        .data(paired)
        .join("path")
        .attr ("d", (d)=> {
            return "M " + (x(d.x1) - options.size (d.w1)) + "," + y(0.25) +
                   " L " + (x(d.x1) + options.size (d.w1)) + "," + y(0.25) +
                   " L " + (x(d.x2) + options.size (d.w2)) + "," + y(0.75) +
                   " L " + (x(d.x2) - options.size (d.w2)) + "," + y(0.75) + " Z";
        })
        .style ("fill", "grey")
        .style('stroke', 'black')
        .style ("stroke-width", "0.5")
        .style ("opacity", 0.5);

    if (options.ref [0] != null) {
      svg.append("g")
        .selectAll("line")
        .data(options.ref)
        .join("line")
          .attr("x1", d => x(d))
          .attr("x2", d => x(d))
          .attr("y1", d => y(0))
          .attr("y2", d => y(1))
          .style ("stroke", "firebrick")
          .style ("stroke-width", "2")
          .style ("opacity", 0.5);
    }
  
    return svg.node();
}

/**
 * Renders multiple discrete distributions as an SVG element.
 *
 * @param {array} data - An array of datasets. Each dataset is an array of objects,
 *   where each object represents a data point with properties for the x-value and weight.
 * @param {object} options - Configuration options for the rendering.
 * @param {number} [options.width=200] - Width of the SVG element.
 * @param {number} [options.height=25*(N+1)] - Height of the SVG element, adjusted for the number of datasets.
 * @param {string} [options.x="value"] - The property name for the x-values in the data objects.
 * @param {array} [options.ref=[1]] - Reference lines to draw on the plot.
 * @param {number} [options.ticks=5] - Number of ticks on the x-axis.
 * @param {string} [options.w="weight"] - The property name for the weight in the data objects.
 * @param {object|null} [options.label=null] - Label options including chart title and series labels.
 * @param {string} [options.scale="linear"] - Scale type for the x-axis ("linear", "sqrt", "symlog", "log").
 * @param {boolean} [options.skip_axis=false] - Whether to skip rendering the axes.
 * @param {object} [options.margin] - Margin settings for the plot, with defaults for top, right, bottom, and left.
 * @returns {SVGElement} - The SVG node containing the rendered distributions.
 */

export function renderNDiscreteDistributions(data, options) {
    const N = data.length;
  
    options = options || {};
    options.width = options.width || 200;
    options.height = (options.height || 25)*(N+1);
    options.x = options.x || "value";
    options.ref = options.ref || [1];
    options.ticks = options.ticks || 5;
    options.w = options.w || "weight";
    options.label = options.label || null;
    options.scale = options.scale || "linear";
    options.skip_axis = options.skip_axis || false;
    options.margin = options.margin || {top: 5, right: 20, bottom: 20 + (options.label ? 12 : 0), left: 20};

  
    let x_range = d3.extent(data[0], d => d[options.x]);

    for (let i = 1; i < N; i++) {
      let x_range2 = d3.extent(data[i], d => d[options.x])
      x_range[1] = Math.max (1, Math.max (x_range[1], x_range2[1]));
      x_range[0] = Math.min (x_range[0], x_range2[0]);
    }

    
  
    const x = (options.scale == "sqrt" ? d3.scaleSqrt() : (options.scale == "symlog" ? d3.scaleSymlog () : options.scale == "log" ? d3.scaleLog () : d3.scaleLinear()))
              .domain(x_range).nice()
              .range([options.margin.left, options.width - options.margin.right]);

    const y = d3.scaleLinear()
              .domain([0,1]).nice()
              .range([options.height - options.margin.bottom, options.margin.top]);

    options.size = options.size || ((d)=>Math.sqrt(d)*(y.range()[0]-y.range()[1])*(0.5/(N+1)));
  
    const xAxis = g => g
        .attr("transform", `translate(0,${options.height - options.margin.bottom})`)
        .call(d3.axisBottom(x).ticks(options.ticks));

    const yAxis = g => g
          .attr("transform", `translate(${options.margin.left},0)`)
          .call(d3.axisLeft(y));

    
  
    const svg = d3.create("svg")
      .attr("width", options.width)
      .attr("height", options.height);

    if (!options.skip_axis) {
      const axis_object = svg.append("g")
          .call(xAxis);
  
      if (options.label && options.label.chart) {
          axis_object.append('text')
          .style('fill', 'black')
          .text(options.label.chart)
          .attr('x', options.margin.left + (options.width - options.margin.left - options.margin.right) / 2)
          .attr('y', 30);
      }
    }

    let y_start = 1. / (N+2),
        y_step  = 1. / (N);
    
    if (options.label && options.label.series) {
        for (let i = 0; i < N; i ++) {
            svg.append('text')
            .style('fill', 'black')
            .text(options.label.series[N-i-1])
            .attr('x', options.width - options.margin.right + 5)
            .style ('font' , '12px courier')
            .attr('y', y (y_start+i*y_step))
        }
    }
  

   

        for (let n = N-1; n > 0; n--) {
            const paired = _.map (data[N-n-1], (c, i)=> {
                return {
                    'x1' : c[options.x],
                    'x2' : data[N-n][i][options.x],
                    'w1' : c[options.w],
                    'w2' : data[N-n][i][options.w]
                  }; 
             });
        
            svg.append("g")
                .selectAll("path")
                .data(paired)
                .join("path")
                .attr ("d", (d)=> {
                    return "M " + (x(d.x1) - options.size (d.w1)) + "," + y(y_start+(n)*y_step) +
                           " L " + (x(d.x1) + options.size (d.w1)) + "," + y(y_start+(n)*y_step) +
                           " L " + (x(d.x2) + options.size (d.w2)) + "," + y(y_start+(n-1)*y_step) +
                           " L " + (x(d.x2) - options.size (d.w2)) + "," + y(y_start+(n-1)*y_step) + " Z";
                })
                .style ("fill", "grey")
                .style('stroke', 'black')
                .style ("stroke-width", "0.5")
                .style ("opacity", 0.5);
        }
    
     _.each (data, (dd,i)=>{
      svg.append("g")
        .selectAll("circle")
        .data(dd)
        .join("circle")
          .attr("cx", d => x(d[options.x]))
          .attr("cy", d => y(y_start+(N-i-1)*y_step))
          .attr("r", (d)=>options.size (d[options.w]))
          .style ("fill", "lightgrey")
          .style ("stroke", i % 2 == 0 ? "firebrick" : "steelblue" )
          .style ("stroke-width", "1")
          .style ("fill-opacity", 0.2)
          .append ("title").text ((d)=>"" + d[options.x].toPrecision (3) + " (" + d[options.w].toPrecision (3) + ")");
    });
  
    if (options.ref [0] != null) {
      svg.append("g")
        .selectAll("line")
        .data(options.ref)
        .join("line")
          .attr("x1", d => x(d))
          .attr("x2", d => x(d))
          .attr("y1", d => y(0))
          .attr("y2", d => y(1))
          .style ("stroke", "firebrick")
          .style ("stroke-width", "2")
          .style ("opacity", 0.5);
    }
  
    return svg.node();
}