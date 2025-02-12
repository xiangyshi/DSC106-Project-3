import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
// Get the margin for two histogram plots
const margin = {top: 10, right: 30, bottom: 35, left: 40},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;
// For Female Hist Temperature Plot
// append the svg object to the body of the page
const svg = d3.select("#temp-hist-fem")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          `translate(${margin.left},${margin.top})`);

d3.csv("../assets/data/fem_temp.csv", d3.autoType).then( function(data) {
    let avg_data = []
    
    data.forEach(d => {
        // Compute the mean across the numeric properties, possibly excluding some keys.
        // (See example 2 above)
        let sum = 0;
        let count = 0;
        for (let key in d) {
            sum += d[key];
            count ++;
        }
        avg_data.push(sum / count)
      });
    // X axis: scale and draw:
    const x = d3.scaleLinear()
        .domain([36, 39])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));
  
    // set the parameters for the histogram
    const histogram = d3.histogram()
        .value(function(d) { return d; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(40)); // then the numbers of bins
  
    // And apply this function to data to get the bins
    const bins = histogram(avg_data);
  
    // Y axis: scale and draw:
    const y = d3.scaleLinear()
        .range([height, margin.top]);
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    svg.append("g")
        .call(d3.axisLeft(y));
  
    // append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(bins)
        .join("rect")
          .attr("x", 1)
      .attr("transform", function(d) { return `translate(${x(d.x0)} , ${y(d.length)})`})
          .attr("width", function(d) {
            return Math.max(1, x(d.x1) - x(d.x0) - 1);
          })
          .attr("height", function(d) { return height - y(d.length); })
          .style("fill", "#69b3a2")
    svg.append("text")
            .attr("x", width / 2)               // Center the title horizontally
            .attr("y", 5)         // Position above the chart area (adjust as needed)
            .attr("text-anchor", "middle")      // Center align the text
            .style("font-size", "16px")         // Set a larger font size
            .style("font-weight", "bold")
            .text("Histogram of Average Temperature of Female Mice");
    svg.append("text")
            .attr("x", width / 2)               // Center the label horizontally
            .attr("y", height + 30) // Position below the chart area; adjust -5 as needed for spacing
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Temperature (Celsius)");

  });

// For Male Hist Temperature Plot
const svg_male = d3.select("#temp-hist-male")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          `translate(${margin.left},${margin.top})`);
d3.csv("../assets/data/male_temp.csv", d3.autoType).then( function(data) {
    let avg_data = []

    data.forEach(d => {
        // Compute the mean across the numeric properties, possibly excluding some keys.
        // (See example 2 above)
        let sum = 0;
        let count = 0;
        for (let key in d) {
            sum += d[key];
            count ++;
        }
        avg_data.push(sum / count)
        });
    // X axis: scale and draw:
    const x = d3.scaleLinear()
        .domain([35, 39])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
        .range([0, width]);
    svg_male.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // set the parameters for the histogram
    const histogram = d3.histogram()
        .value(function(d) { return d; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(40)); // then the numbers of bins

    // And apply this function to data to get the bins
    const bins = histogram(avg_data);

    // Y axis: scale and draw:
    const y = d3.scaleLinear()
        .range([height, margin.top]);
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    svg_male.append("g")
        .call(d3.axisLeft(y));

    // append the bar rectangles to the svg element
    svg_male.selectAll("rect")
        .data(bins)
        .join("rect")
            .attr("x", 1)
        .attr("transform", function(d) { return `translate(${x(d.x0)} , ${y(d.length)})`})
            .attr("width", function(d) {
            return Math.max(1, x(d.x1) - x(d.x0) - 1);
            })
            .attr("height", function(d) { return height - y(d.length); })
            .style("fill", "#69b3a2")
    svg_male.append("text")
        .attr("x", width / 2)               // Center the title horizontally
        .attr("y", 5)         // Position above the chart area (adjust as needed)
        .attr("text-anchor", "middle")      // Center align the text
        .style("font-size", "16px")         // Set a larger font size
        .style("font-weight", "bold")
        .text("Histogram of Average Temperature of Male Mice");
    svg_male.append("text")
        .attr("x", width / 2)               // Center the label horizontally
        .attr("y", height + 30) // Position below the chart area; adjust -5 as needed for spacing
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Temperature (Celsius)");

});