// individual.js

d3.csv("../assets/data/male_act.csv").then(maleActData => {
    d3.csv("../assets/data/fem_act.csv").then(femaleActData => {
        d3.csv("../assets/data/male_temp.csv").then(maleTempData => {
            d3.csv("../assets/data/fem_temp.csv").then(femaleTempData => {
                processIndividualData(maleActData, femaleActData, maleTempData, femaleTempData);
            });
        });
    });
});

function processIndividualData(maleActData, femaleActData, maleTempData, femaleTempData) {
    // Function to normalize data (Min-Max normalization across both sexes)
    function normalize(maleData, femaleData) {
        // Flatten both male and female activity data into a single array
        const flatMaleData = maleData.map(d => d.values).flat();
        const flatFemaleData = femaleData.map(d => d.values).flat();
        
        // Find the min and max values across both male and female activity data
        const minVal = d3.min(flatMaleData.concat(flatFemaleData));
        const maxVal = d3.max(flatMaleData.concat(flatFemaleData));
        
        // Normalize the activity data using the min-max scaling
        const normalize = (data) => {
            return data.map(d => {
                const normalizedValues = d.values.map(val => (val - minVal) / (maxVal - minVal));
                return { time: d.time, values: normalizedValues };
            });
        };
    
        let normMale = normalize(maleData);
        let normFem = normalize(femaleData);
    
        return { normMale, normFem };
    }

    // Function to apply moving average
    function applyMovingAverage(data, windowSize) {
        // Assume data is an array of objects: { time: ..., values: [v0, v1, ..., vN] }
        // We'll compute the moving average along time for each series (each index in values).
        const numSeries = data[0].values.length;
        // Initialize the smoothed data structure
        const smoothedData = data.map(d => ({ time: d.time, values: [] }));
        
        for (let j = 0; j < numSeries; j++) {
            // Extract the time series for series j
            const series = data.map(d => d.values[j]);
            
            // Compute moving average for this series along time
            const smoothedSeries = series.map((val, i, arr) => {
                const start = Math.max(0, i - Math.floor(windowSize / 2));
                const end = Math.min(arr.length, i + Math.floor(windowSize / 2) + 1);
                const windowVals = arr.slice(start, end);
                return d3.mean(windowVals);
            });
            
            // Store the smoothed values back into our smoothed data
            smoothedSeries.forEach((val, i) => {
                smoothedData[i].values[j] = val;
            });
        }
        
        return smoothedData;
    }

    // Transform the data
    let maleActivity = transformData(maleActData);
    let femaleActivity = transformData(femaleActData);
    let maleTemperature = transformData(maleTempData);
    let femaleTemperature = transformData(femaleTempData);

    // Normalize the data
    const { normMale: mact, normFem: fact } = normalize(maleActivity, femaleActivity);
    const { normMale: mtemp, normFem: ftemp } = normalize(maleTemperature, femaleTemperature);
    
    const window = 120;
    // Apply moving average (window size of 5 as an example)
    const smoothedMaleActivity = applyMovingAverage(mact, window);
    const smoothedFemaleActivity = applyMovingAverage(fact, window);
    const smoothedMaleTemperature = applyMovingAverage(mtemp, window);
    const smoothedFemaleTemperature = applyMovingAverage(ftemp, window);
    
    createIndividualGraph(smoothedMaleActivity, smoothedFemaleActivity, smoothedMaleTemperature, smoothedFemaleTemperature);
}

function transformData(rawData) {
    return rawData.map((d, i) => {
        const values = Object.values(d).map(Number);
        return { time: i, values };
    });
}



function createIndividualGraph(maleActivity, femaleActivity, maleTemperature, femaleTemperature) {

    // Clear previous chart and controls
    d3.select("#individual-chart").html("");
    d3.select("#individual-chart-controls").html("");

    const width = 1600, height = 800;
    const margin = { top: 20, right: 100, bottom: 50, left: 50 };

    const svg = d3.select("#individual-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(maleActivity, d => d.time))
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

    // Function to draw a line from the given data series.
    function drawLine(data, color, index) {
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.values[index]))
            .curve(d3.curveLinear);

        return svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.8) // initial visible opacity
            .attr("d", line);
    }

    // Draw your lines.
    const maleActivityLine = drawLine(maleActivity, "blue", 0);
    const femaleActivityLine = drawLine(femaleActivity, "red", 0);
    const maleTemperatureLine = drawLine(maleTemperature, "orange", 0);
    const femaleTemperatureLine = drawLine(femaleTemperature, "purple", 0);

    // Function to toggle line visibility.
    function toggleLineVisibility(line, isVisible) {
        line.transition()
            .duration(300)
            .style("opacity", isVisible ? 0.8 : 0);
    }

    // Create checkbox controls in an HTML container.
    const controls = d3.select("#individual-chart-controls");

    // Array of objects representing each category.
    const categories = [
        { label: "Male Activity", color: "blue", line: maleActivityLine },
        { label: "Female Activity", color: "red", line: femaleActivityLine },
        { label: "Male Temperature", color: "orange", line: maleTemperatureLine },
        { label: "Female Temperature", color: "purple", line: femaleTemperatureLine }
    ];

    // Create a checkbox for each category.
    categories.forEach(cat => {
        const container = controls.append("div").style("margin", "5px");
        container.append("input")
            .attr("type", "checkbox")
            .property("checked", true)
            .on("change", function() {
                toggleLineVisibility(cat.line, this.checked);
            });
        container.append("span")
            .text(cat.label)
            .style("color", cat.color)
            .style("margin-left", "5px");
    });
}