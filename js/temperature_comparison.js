d3.csv("../assets/data/male_temp.csv").then(maleData => {
    d3.csv("../assets/data/fem_temp.csv").then(femaleData => {
        processTemperatureData(maleData, femaleData);
    });
});

// normalization function
function normalizeData(data) {
    let minTemp = d3.min(data, d => Math.min(d.male, d.female));
    let maxTemp = d3.max(data, d => Math.max(d.male, d.female));

    return data.map(d => ({
        time: d.time,
        male: (d.male - minTemp) / (maxTemp - minTemp),
        female: (d.female - minTemp) / (maxTemp - minTemp)
    }));
}

// Process temperature data
function processTemperatureData(maleData, femaleData) {
    let processedData = [];

    for (let i = 0; i < maleData.length; i++) {
        let maleTemps = Object.values(maleData[i]).map(Number);
        let femaleTemps = Object.values(femaleData[i]).map(Number);

        let maleAvg = d3.mean(maleTemps);
        let femaleAvg = d3.mean(femaleTemps);

        processedData.push({ time: i * 1, male: maleAvg, female: femaleAvg }); // i * 1 保持分钟数

    }

    // normalization
    processedData = normalizeData(processedData);

    processedData = smoothData(processedData);

    createComparisonGraph(processedData);
}


function createComparisonGraph(data) {

    d3.select("#comparison_chart").html("");

    const width = 800, height = 400;
    const margin = { top: 20, right: 50, bottom: 50, left: 50 };

    const svg = d3.select("#comparison_chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis (time)
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.time))
        .range([0, width - margin.left - margin.right]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(14) // one tick mark per day
        .tickFormat(d => `${Math.floor(d / 1440)}d`); // convert minutes to days
    
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom - margin.top})`)
        .call(xAxis)
        .append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", 35)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Time (Days)");

    // Y-axis (normalized temperature)
    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height - margin.bottom - margin.top, 0]);

    const yAxis = d3.axisLeft(yScale).ticks(5);
    svg.append("g")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", - (height - margin.bottom - margin.top) / 2)
        .attr("y", -40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Normalized Temperature");

    // Draw male line
    const lineMale = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.male))
        .curve(d3.curveLinear);

    const maleLine = svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "royalblue")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.8)
        .attr("d", lineMale);

    // Draw female line
    const lineFemale = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.female))
        .curve(d3.curveLinear);

    const femaleLine = svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "Crimson")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.8)
        .attr("d", lineFemale);

// Add legend
const legendGroup = svg.append("g")
    .attr("transform", `translate(${width - 120}, 20)`);

// Male legend
legendGroup.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", "royalblue");

legendGroup.append("text")
    .attr("x", 20)
    .attr("y", 10)
    .text("Male")
    .attr("fill", "black")
    .style("font-size", "12px");

// Female legend
legendGroup.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("y", 20)
    .attr("fill", "Crimson");

legendGroup.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text("Female")
    .attr("fill", "black")
    .style("font-size", "12px");
}

// smooth data
function smoothData(data, windowSize = 30) {
    return data.map((d, i, arr) => {
        let start = Math.max(0, i - Math.floor(windowSize / 2));
        let end = Math.min(arr.length, i + Math.floor(windowSize / 2));
        let maleAvg = d3.mean(arr.slice(start, end), d => d.male);
        let femaleAvg = d3.mean(arr.slice(start, end), d => d.female);
        return { time: d.time, male: maleAvg, female: femaleAvg };
    });
}
