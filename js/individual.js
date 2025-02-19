// Main entry point: Load CSV data and call processIndividualData.
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
    // Transform raw CSV data into an array of objects { time, values }
    function transformData(rawData) {
        return rawData.map((d, i) => {
            const values = Object.values(d).map(Number);
            return { time: i, values };
        });
    }

    // Keep raw data for tooltips.
    const rawMaleActivity    = transformData(maleActData);
    const rawFemaleActivity  = transformData(femaleActData);
    const rawMaleTemperature = transformData(maleTempData);
    const rawFemaleTemperature = transformData(femaleTempData);

    // Normalize data (Min-Max normalization across both sexes)
    function normalize(maleData, femaleData) {
        const flatMaleData = maleData.map(d => d.values).flat();
        const flatFemaleData = femaleData.map(d => d.values).flat();
        const minVal = d3.min(flatMaleData.concat(flatFemaleData));
        const maxVal = d3.max(flatMaleData.concat(flatFemaleData));
        const norm = (data) => data.map(d => ({
            time: d.time,
            values: d.values.map(val => (val - minVal) / (maxVal - minVal))
        }));
        return { normMale: norm(maleData), normFem: norm(femaleData) };
    }

    // Apply a moving average (smoothing) along time for each series (each index)
    function applyMovingAverage(data, windowSize) {
        const numSeries = data[0].values.length;
        const smoothedData = data.map(d => ({ time: d.time, values: [] }));
        for (let j = 0; j < numSeries; j++) {
            const series = data.map(d => d.values[j]);
            const smoothedSeries = series.map((val, i, arr) => {
                const start = Math.max(0, i - Math.floor(windowSize / 2));
                const end = Math.min(arr.length, i + Math.floor(windowSize / 2) + 1);
                return d3.mean(arr.slice(start, end));
            });
            smoothedSeries.forEach((val, i) => {
                smoothedData[i].values[j] = val;
            });
        }
        return smoothedData;
    }

    // Transform and normalize the data.
    let maleActivity = transformData(maleActData);
    let femaleActivity = transformData(femaleActData);
    let maleTemperature = transformData(maleTempData);
    let femaleTemperature = transformData(femaleTempData);

    const { normMale: normMaleActivity, normFem: normFemaleActivity } = normalize(maleActivity, femaleActivity);
    const { normMale: normMaleTemperature, normFem: normFemaleTemperature } = normalize(maleTemperature, femaleTemperature);

    // Define updateChart: Given a window size, smooth the normalized data and redraw the chart.
    function updateChart(windowSize) {
        const smoothedMaleActivity    = applyMovingAverage(normMaleActivity, windowSize);
        const smoothedFemaleActivity  = applyMovingAverage(normFemaleActivity, windowSize);
        const smoothedMaleTemperature = applyMovingAverage(normMaleTemperature, windowSize);
        const smoothedFemaleTemperature = applyMovingAverage(normFemaleTemperature, windowSize);

        createIndividualGraph(
            smoothedMaleActivity, 
            smoothedFemaleActivity, 
            smoothedMaleTemperature, 
            smoothedFemaleTemperature,
            rawMaleActivity, 
            rawFemaleActivity, 
            rawMaleTemperature, 
            rawFemaleTemperature
        );
    }
    // Expose updateChart globally so the slider can call it.
    window.updateChart = updateChart;

    // Set an initial smoothing window size and draw the chart.
    const initialWindowSize = 120;
    updateChart(initialWindowSize);
}
let initialWindowSize = 120;
function createIndividualGraph(maleActivity, femaleActivity, maleTemperature, femaleTemperature, 
    rawMaleActivity, rawFemaleActivity, rawMaleTemperature, rawFemaleTemperature) {

    // Clear previous chart and controls
    d3.select("#individual-chart").html("");
    d3.select("#individual-chart-controls").html("");

    const width = 1600, height = 800;
    const margin = { top: 20, right: 100, bottom: 50, left: 50 };

    const svg = d3.select("#individual-chart")
        .append("svg")
        .attr("class", "comp-svg")
        .attr("viewBox", `0 0 ${width} ${height}`)  // Responsive
        .attr("preserveAspectRatio", "xMidYMid meet")  // Keeps aspect ratio
        .style("width", "100%")  // Ensures it stretches
        .style("height", "auto")  // Scales properly
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(maleActivity, d => d.time))
        .range([0, width - margin.left - margin.right]);

    // Add alternating background colors
    const interval = 720; // 720 minutes = half a day
    
    for (let i = 0; i < maleActivity.length; i++) {
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

    // Function to draw a line for a given series.
    function drawLine(data, color, index) {
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.values[index]))
            .curve(d3.curveLinear);  // You can adjust the curve type if desired.
        return svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.8)
            .attr("d", line);
    }

    // Draw the four lines.
    let maleActivityLine = drawLine(maleActivity, "blue", 0);
    let femaleActivityLine = drawLine(femaleActivity, "red", 0);
    let maleTemperatureLine = drawLine(maleTemperature, "orange", 0);
    let femaleTemperatureLine = drawLine(femaleTemperature, "purple", 0);

    // Store drawn lines in a global object for toggling.
    window.chartLines = {
        maleActivityLine: maleActivityLine,
        femaleActivityLine: femaleActivityLine,
        maleTemperatureLine: maleTemperatureLine,
        femaleTemperatureLine: femaleTemperatureLine
    };

    // Function to toggle line visibility.
    function toggleLineVisibility(line, isVisible) {
        line.transition()
            .duration(300)
            .style("opacity", isVisible ? 0.8 : 0);
    }

        // Select the controls container and make it draggable.
    // Select the container and set its position.
    const controls = d3.select("#individual-chart-controls")
    .style("position", "absolute")
    .style("border", "1px solid #ccc")
    .style("left", "1000px") // Initial left position
    .style("top", "-50px"); // Initial top position

    // Create a header bar for dragging.
    const header = controls.append("div")
    .attr("class", "header-bar")
    .style("background-color", "#ddd")
    .style("padding", "5px")
    .style("cursor", "move")
    .text("Drag here");

    // Variable to store the offset between the mouse position and the container's top-left corner.
    let offset = { x: 0, y: 0 };

    // Apply the drag behavior only to the header bar.
    header.call(d3.drag()
    .on("start", function(event) {
        // Get the current position of the container.
        const style = window.getComputedStyle(controls.node());
        const left = parseFloat(style.left);
        const top = parseFloat(style.top);
        // Calculate the offset between where the mouse is and the container's top-left.
        offset.x = event.x - left;
        offset.y = event.y - top;
        controls.raise(); // Bring the container to the front.
    })
    .on("drag", function(event) {
        // Move the container, keeping the initial offset.
        controls.style("left", (event.x - offset.x) + "px")
                .style("top", (event.y - offset.y) + "px");
    })
    .on("end", function() {
        // Optionally reset the offset.
        offset = { x: 0, y: 0 };
    })
    );

    // Create a body for the controls.
    const body = controls.append("div")
    .attr("class", "control-body")
    .style("padding", "5px");

    // Add your control elements to the body.
    body.append("label")
    .attr("for", "windowSizeInput")
    .text("Smoothing Window Size: ");
    
    body.append("input")
    .attr("id", "windowSizeInput")
    .attr("type", "text")
    .attr("value", initialWindowSize)
    .style("margin-left", "5px");

    body.append("button")
    .text("Update")
    .style("margin-left", "5px")
    .on("click", function() {
        const newWindowSize = +d3.select("#windowSizeInput").property("value");
        initialWindowSize = newWindowSize;
        updateChart(newWindowSize);
    });

    // Create dropdown for male mice selection.
    const maleDropdown = body.append("div")
    .append("label")
    .text("Select Male Mouse: ")
    .append("select")
    .attr("id", "male-mouse-dropdown")
    .on("change", updateMouse);

    // Add options for male mice (m1 to m13).
    d3.range(1, 14).forEach(i => {
    maleDropdown.append("option")
        .attr("value", i - 1)
        .text(`m${i}`);
    });

    // Create dropdown for female mice selection.
    const femaleDropdown = body.append("div")
    .append("label")
    .text("Select Female Mouse: ")
    .append("select")
    .attr("id", "female-mouse-dropdown")
    .on("change", updateMouse);

    // Add options for female mice (f1 to f13).
    d3.range(1, 14).forEach(i => {
    femaleDropdown.append("option")
        .attr("value", i - 1)
        .text(`f${i}`);
    });


    // Array representing each category.
    let categories = [
        { label: "Male Activity", color: "blue", line: maleActivityLine },
        { label: "Female Activity", color: "red", line: femaleActivityLine },
        { label: "Male Temperature", color: "orange", line: maleTemperatureLine },
        { label: "Female Temperature", color: "purple", line: femaleTemperatureLine }
    ];

    categories.forEach(cat => {
        const container = controls.append("div").style("margin", "5px").attr("class", "cbox");
        container.append("input")
            .attr("class", "cbox")
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
    
    
    
    // --- Selection Dropdown ---

    

    function updateControls(categories) {
        // Step 1: Remove old controls
        controls.selectAll(".cbox").remove();
    
        // Step 2: Add new controls based on updated categories
        categories.forEach(cat => {
            const container = controls.append("div").style("margin", "5px").attr("class", "cbox");
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
    function updateMouse() {
        const selectedMale = d3.select("#male-mouse-dropdown").property("value");
        const selectedFemale = d3.select("#female-mouse-dropdown").property("value");
        d3.selectAll(".activity-line").remove();
        d3.selectAll(".temperature-line").remove();

        console.log(selectedMale);

        maleActivityLine.remove();
        femaleActivityLine.remove();
        maleTemperatureLine.remove();
        femaleTemperatureLine.remove();

        maleActivityLine = drawLine(maleActivity, "blue", selectedMale);
        femaleActivityLine = drawLine(femaleActivity, "red", selectedFemale);
        maleTemperatureLine = drawLine(maleTemperature, "orange", selectedMale);
        femaleTemperatureLine = drawLine(femaleTemperature, "purple", selectedFemale);

        window.chartLines = {
            maleActivityLine: maleActivityLine,
            femaleActivityLine: femaleActivityLine,
            maleTemperatureLine: maleTemperatureLine,
            femaleTemperatureLine: femaleTemperatureLine
        };

            // Array representing each category.
        categories = [
            { label: "Male Activity", color: "blue", line: maleActivityLine },
            { label: "Female Activity", color: "red", line: femaleActivityLine },
            { label: "Male Temperature", color: "orange", line: maleTemperatureLine },
            { label: "Female Temperature", color: "purple", line: femaleTemperatureLine }
        ];

        updateControls(categories);
    }


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

    const focusCircleMaleAct = focus.append("circle").attr("r", 4).attr("fill", "blue");
    const focusCircleFemaleAct = focus.append("circle").attr("r", 4).attr("fill", "red");
    const focusCircleMaleTemp = focus.append("circle").attr("r", 4).attr("fill", "orange");
    const focusCircleFemaleTemp = focus.append("circle").attr("r", 4).attr("fill", "purple");

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
        const i_raw_mact = bisectTime(rawMaleActivity, x0, 1);
        const d0_raw_mact = rawMaleActivity[i_raw_mact - 1];
        const d1_raw_mact = rawMaleActivity[i_raw_mact];
        const d_raw_mact = (!d0_raw_mact || !d1_raw_mact) ? d0_raw_mact || d1_raw_mact
                              : (x0 - d0_raw_mact.time > d1_raw_mact.time - x0 ? d1_raw_mact : d0_raw_mact);

        const i_raw_fact = bisectTime(rawFemaleActivity, x0, 1);
        const d0_raw_fact = rawFemaleActivity[i_raw_fact - 1];
        const d1_raw_fact = rawFemaleActivity[i_raw_fact];
        const d_raw_fact = (!d0_raw_fact || !d1_raw_fact) ? d0_raw_fact || d1_raw_fact
                              : (x0 - d0_raw_fact.time > d1_raw_fact.time - x0 ? d1_raw_fact : d0_raw_fact);

        const i_raw_mtemp = bisectTime(rawMaleTemperature, x0, 1);
        const d0_raw_mtemp = rawMaleTemperature[i_raw_mtemp - 1];
        const d1_raw_mtemp = rawMaleTemperature[i_raw_mtemp];
        const d_raw_mtemp = (!d0_raw_mtemp || !d1_raw_mtemp) ? d0_raw_mtemp || d1_raw_mtemp
                              : (x0 - d0_raw_mtemp.time > d1_raw_mtemp.time - x0 ? d1_raw_mtemp : d0_raw_mtemp);

        const i_raw_ftemp = bisectTime(rawFemaleTemperature, x0, 1);
        const d0_raw_ftemp = rawFemaleTemperature[i_raw_ftemp - 1];
        const d1_raw_ftemp = rawFemaleTemperature[i_raw_ftemp];
        const d_raw_ftemp = (!d0_raw_ftemp || !d1_raw_ftemp) ? d0_raw_ftemp || d1_raw_ftemp
                              : (x0 - d0_raw_ftemp.time > d1_raw_ftemp.time - x0 ? d1_raw_ftemp : d0_raw_ftemp);

        // Use smoothed data for focus positions.
        const i_mact = bisectTime(maleActivity, x0, 1);
        const d_mact = maleActivity[i_mact - 1];
        const i_fact = bisectTime(femaleActivity, x0, 1);
        const d_fact = femaleActivity[i_fact - 1];
        const i_mtemp = bisectTime(maleTemperature, x0, 1);
        const d_mtemp = maleTemperature[i_mtemp - 1];
        const i_ftemp = bisectTime(femaleTemperature, x0, 1);
        const d_ftemp = femaleTemperature[i_ftemp - 1];

        const xPos = xScale(d_mact.time);
        focus.select(".focusLine")
            .attr("x1", xPos)
            .attr("x2", xPos);

        focusCircleMaleAct.attr("cx", xPos).attr("cy", yScale(d_mact.values[0]));
        focusCircleFemaleAct.attr("cx", xPos).attr("cy", yScale(d_fact.values[0]));
        focusCircleMaleTemp.attr("cx", xPos).attr("cy", yScale(d_mtemp.values[0]));
        focusCircleFemaleTemp.attr("cx", xPos).attr("cy", yScale(d_ftemp.values[0]));

        // Format the time from minutes to day/hour/minute.
        const totalMinutes = d_raw_mact.time;
        const days = Math.floor(totalMinutes / 1440);
        const remainder = totalMinutes % 1440;
        const hours = Math.floor(remainder / 60);
        const minutes = remainder % 60;
        const timeFormatted = `${days}d ${hours}h ${minutes}m`;

        d3.select("#tooltip")
            .html(`<strong>Time:</strong> ${timeFormatted}<br>
                   <strong>Male Activity:</strong> ${d_raw_mact.values[0]}<br>
                   <strong>Female Activity:</strong> ${d_raw_fact.values[0]}<br>
                   <strong>Male Temp:</strong> ${d_raw_mtemp.values[0]} C°<br>
                   <strong>Female Temp:</strong> ${d_raw_ftemp.values[0]} C°`)
            .style("left", (xPos + margin.left + 20) + "px")
            .style("top", (mouse[1] + margin.top) + "px");
    }
}
