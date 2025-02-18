d3.csv("../assets/data/male_act.csv").then(maleActData => {
    d3.csv("../assets/data/fem_act.csv").then(femaleActData => {
        d3.csv("../assets/data/male_temp.csv").then(maleTempData => {
            d3.csv("../assets/data/fem_temp.csv").then(femaleTempData => {
                processActivityAndTemperatureData(maleActData, femaleActData, maleTempData, femaleTempData);
            });
        });
    });
});

let rawActivity, rawTemperature;

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
        return processedData;
    }
    
    let activityData = normalizeData(smoothData(processData(maleActData, femaleActData)));
    rawActivity = processData(maleActData, femaleActData);
    let temperatureData = normalizeData(smoothData(processData(maleTempData, femaleTempData)));
    rawTemperature = processData(maleTempData, femaleTempData);
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
    
    // Add alternating background colors
    const interval = 720; // 720 minutes = half a day
    
    for (let i = 0; i < activityData.length; i++) {
        if (i % interval === 0) {
            const start = xScale(i);
            const end = xScale(i + interval);
            const bgColor = (Math.floor(i / interval) % 2 === 0) ? "yellow" : "black";
            
            svg.append("rect")
                .attr("x", start)
                .attr("y", 0)
                .attr("width", end - start)
                .attr("height", height - margin.top - margin.bottom)
                .attr("fill", bgColor)
                .attr("opacity", 0.05);
        }
    }
    
    
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

    const estrusDays = [1, 5, 9, 13].map(day => day * 1440);
    estrusDays.forEach(day => {
        svg.append("line")
            .attr("x1", xScale(day))
            .attr("x2", xScale(day))
            .attr("y1", 0)
            .attr("y2", height - margin.top - margin.bottom)
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "3,3")
            .attr("opacity", 1);
            
            svg.append("text")
            .attr("x", xScale(day))
            .attr("y", -10)  // positions the label above the chart
            .attr("fill", "red")
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .style("font-size", "12px")
            .text("Estrus Start");
    });
    
    function drawLine(data, color) {
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(((d.male + d.female) / 2).toFixed(2)))
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
    

    // --- Tooltip Setup ---
    const focus = svg.append("g")
    .attr("class", "focus")
    .style("display", "none");

    focus.append("line")
    .attr("class", "focusLine")
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3")
    .attr("y1", 0)
    .attr("y2", height - margin.top - margin.bottom);

    const focusCircleAct = focus.append("circle").attr("r", 4).attr("fill", "royalblue");
    const focusCircleTemp = focus.append("circle").attr("r", 4).attr("fill", "orange");

    svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseover", function() {
        focus.style("display", null);
        d3.select("#tooltip").style("display", "block");
    })
    .on("mouseout", function() {
        focus.style("display", "none");
        d3.select("#tooltip").style("display", "none");
    })
    .on("mousemove", mousemove);

    const bisectTime = d3.bisector(d => d.time).left;

    function mousemove(event) {
        const mouse = d3.pointer(event);
        const x0 = xScale.invert(mouse[0]);
    
        // Find closest raw data points for tooltip (using raw data arrays).
        const i_raw_act = bisectTime(rawActivity, x0, 1);
        const d0_raw_act = rawActivity[i_raw_act - 1];
        const d1_raw_act = rawActivity[i_raw_act];
        const d_raw_act = (!d0_raw_act || !d1_raw_act) ? d0_raw_act || d1_raw_act
                                  : (x0 - d0_raw_act.time > d1_raw_act.time - x0 ? d1_raw_act : d0_raw_act);
    
        const i_raw_temp = bisectTime(rawTemperature, x0, 1);
        const d0_raw_temp = rawTemperature[i_raw_temp - 1];
        const d1_raw_temp = rawTemperature[i_raw_temp];
        const d_raw_temp = (!d0_raw_temp || !d1_raw_temp) ? d0_raw_temp || d1_raw_temp
                                  : (x0 - d0_raw_temp.time > d1_raw_temp.time - x0 ? d1_raw_temp : d0_raw_temp);
    
    
        // Use smoothed data for focus positions.
        const i_act = bisectTime(activityData, x0, 1);
        const d_act = activityData[i_act - 1];
        const i_temp = bisectTime(temperatureData, x0, 1);
        const d_temp = temperatureData[i_temp - 1];

        const xPos = xScale(d_act.time);
        focus.select(".focusLine")
            .attr("x1", xPos)
            .attr("x2", xPos);
    
        focusCircleAct.attr("cx", xPos).attr("cy", yScale(((d_act.male + d_act.female) / 2).toFixed(2)));
        focusCircleTemp.attr("cx", xPos).attr("cy", yScale(((d_temp.male + d_temp.female) / 2).toFixed(2)));
    
        // Format the time from minutes to day/hour/minute.
        const totalMinutes = d_raw_act.time;
        const days = Math.floor(totalMinutes / 1440);
        const remainder = totalMinutes % 1440;
        const hours = Math.floor(remainder / 60);
        const minutes = remainder % 60;
        const timeFormatted = `${days}d ${hours}h ${minutes}m`;
    
        d3.select("#tooltip")
            .html(`<strong>Time:</strong> ${timeFormatted}<br>
                   <strong>Activity (Average):</strong> ${((d_raw_act.male + d_raw_act.female) / 2).toFixed(4)}<br>
                   <strong>Temperature (Average):</strong> ${((d_raw_temp.male + d_raw_temp.female) / 2).toFixed(2)} C°<br>`)
            .style("left", (xPos + margin.left + 20) + "px")
            .style("top", (mouse[1] + margin.top) + "px");
    }

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
    addLegend("orange", "Temp", 20);
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
