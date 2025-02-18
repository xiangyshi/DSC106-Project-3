d3.csv("../assets/data/male_act.csv").then(maleActData => {
    d3.csv("../assets/data/fem_act.csv").then(femaleActData => {
        d3.csv("../assets/data/male_temp.csv").then(maleTempData => {
            d3.csv("../assets/data/fem_temp.csv").then(femaleTempData => {
                processActivityAndTemperatureData(maleActData, femaleActData, maleTempData, femaleTempData);
            });
        });
    });
});

function normalizeData(data) {
    let minVal = d3.min(data, d => Math.min(d.male, d.female));
    let maxVal = d3.max(data, d => Math.max(d.male, d.female));

    return data.map(d => ({
        time: d.time,
        male: (d.male - minVal) / (maxVal - minVal),
        female: (d.female - minVal) / (maxVal - minVal)
    }));
}

function processActivityAndTemperatureData(maleActData, femaleActData, maleTempData, femaleTempData) {
    function processData(maleData, femaleData) {
        let processedData = [];
        for (let i = 0; i < maleData.length; i++) {
            let maleValues = Object.values(maleData[i]).map(Number);
            let femaleValues = Object.values(femaleData[i]).map(Number);
            let maleAvg = d3.mean(maleValues);
            let femaleAvg = d3.mean(femaleValues);
            processedData.push({ time: i, male: maleAvg, female: femaleAvg });
        }
        return normalizeData(smoothData(processedData));
    }
    
    let activityData = processData(maleActData, femaleActData);
    let temperatureData = processData(maleTempData, femaleTempData);

    createActivityComparisonGraph(activityData, temperatureData);
}

function createActivityComparisonGraph(activityData, temperatureData) {
    d3.select("#comparison-chart").html("");
    
    const width = 1600, height = 800;
    const margin = { top: 20, right: 50, bottom: 50, left: 50 };
    
    const svg = d3.select("#comparison-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLinear()
        .domain(d3.extent(activityData, d => d.time))
        .range([0, width - margin.left - margin.right]);
    
    
    const xAxis = d3.axisBottom(xScale)
        .tickValues(d3.range(0, 20160 + 1, 1440))
        .tickFormat(d => `${(d / 1440) + 1}d`);

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom - margin.top})`)
        .call(xAxis)
        .append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", 35)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Time (Days)");
    
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
        .text("Normalized Activity & Temperature");
    
    function drawLine(data, color) {
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.male))
            .curve(d3.curveLinear);
        
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.8)
            .attr("d", line);
    }
    
    drawLine(activityData, "royalblue");
    drawLine(temperatureData, "orange");
    
    const legendGroup = svg.append("g")
        .attr("transform", `translate(${width - 120}, 20)`);
    
    function addLegend(color, label, yOffset) {
        legendGroup.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("y", yOffset)
            .attr("fill", color);
        legendGroup.append("text")
            .attr("x", 20)
            .attr("y", yOffset + 10)
            .text(label)
            .attr("fill", "black")
            .style("font-size", "12px");
    }
    
    addLegend("royalblue", "Activity", 0);
    addLegend("orange", "Temperature", 20);
}

function smoothData(data, windowSize = 50) {
    return data.map((d, i, arr) => {
        let start = Math.max(0, i - Math.floor(windowSize / 2));
        let end = Math.min(arr.length, i + Math.floor(windowSize / 2));
        let maleAvg = d3.mean(arr.slice(start, end), d => d.male);
        let femaleAvg = d3.mean(arr.slice(start, end), d => d.female);
        return { time: d.time, male: maleAvg, female: femaleAvg };
    });
}
