// Load and process data
Promise.all([
    d3.csv("../assets/data/male_act.csv"),
    d3.csv("../assets/data/fem_act.csv")
]).then(([maleData, femaleData]) => {
    const processedData = processActivityData(maleData, femaleData);
    createActivityComparisonGraph(processedData);
});

// Normalize activity data
function normalizeActivityData(data) {
    const minAct = d3.min(data, d => Math.min(d.male, d.female));
    const maxAct = d3.max(data, d => Math.max(d.male, d.female));
    
    return data.map(d => ({
        time: d.time,
        male: (d.male - minAct) / (maxAct - minAct),
        female: (d.female - minAct) / (maxAct - minAct)
    }));
}

// Process and smooth activity data
function processActivityData(maleData, femaleData) {
    let processedData = maleData.map((_, i) => {
        const maleAvg = d3.mean(Object.values(maleData[i]).map(Number));
        const femaleAvg = d3.mean(Object.values(femaleData[i]).map(Number));
        return { time: i, male: maleAvg, female: femaleAvg };
    });
    
    return smoothActivityData(normalizeActivityData(processedData));
}

// Smooth data using a moving average
function smoothActivityData(data, windowSize = 50) {
    return data.map((d, i, arr) => {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(arr.length, i + Math.floor(windowSize / 2));
        return {
            time: d.time,
            male: d3.mean(arr.slice(start, end), d => d.male),
            female: d3.mean(arr.slice(start, end), d => d.female)
        };
    });
}

// Create activity comparison graph
function createActivityComparisonGraph(data) {
    d3.select("#activity_chart").html("");
    const width = 800, height = 400, margin = { top: 20, right: 50, bottom: 50, left: 50 };
    const svg = d3.select("#activity_chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Define scales and axes
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.time))
        .range([0, width - margin.left - margin.right]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([height - margin.bottom - margin.top, 0]);
    
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom - margin.top})`)
        .call(d3.axisBottom(xScale).ticks(14).tickFormat(d => `${Math.floor(d / 1440) + 1}d`))
        .append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", 35)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Time (Days)");
    
    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", - (height - margin.bottom - margin.top) / 2)
        .attr("y", -40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Normalized Activity Level");
    
    // Define and draw lines
    const drawLine = (data, color, key) => {
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d[key]))
            .curve(d3.curveLinear);
        
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.8)
            .attr("d", line);
    };
    
    drawLine(data, "royalblue", "male");
    drawLine(data, "crimson", "female");
    
    // Add legend
    const legendGroup = svg.append("g").attr("transform", `translate(${width - 120}, 20)`);
    const legendData = [
        { color: "royalblue", label: "Male" },
        { color: "crimson", label: "Female" }
    ];
    
    legendData.forEach((d, i) => {
        legendGroup.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("y", i * 20)
            .attr("fill", d.color);
        
        legendGroup.append("text")
            .attr("x", 20)
            .attr("y", i * 20 + 10)
            .text(d.label)
            .attr("fill", "black")
            .style("font-size", "12px");
    });
}
