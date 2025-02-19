// Global variables to store raw processed data.
let rawActivityMale, rawActivityFemale, rawTemperatureMale, rawTemperatureFemale;

// Load CSV files and process data.
d3.csv("../assets/data/male_act.csv").then(maleActData => {
  d3.csv("../assets/data/fem_act.csv").then(femaleActData => {
    d3.csv("../assets/data/male_temp.csv").then(maleTempData => {
      d3.csv("../assets/data/fem_temp.csv").then(femaleTempData => {
        processActivityAndTemperatureData(maleActData, femaleActData, maleTempData, femaleTempData);
      });
    });
  });
});

/**
 * Process the two CSV datasets for a metric.
 * For each time step (row), compute the average for male and female.
 * The time property is simply the row index.
 */
function processData(maleData, femaleData) {
  let maleProcessed = [];
  let femaleProcessed = [];
  for (let i = 0; i < maleData.length; i++) {
    // Convert each row's values to numbers.
    let maleValues = Object.values(maleData[i]).map(Number);
    let femaleValues = Object.values(femaleData[i]).map(Number);
    let maleAvg = d3.mean(maleValues);
    let femaleAvg = d3.mean(femaleValues);
    maleProcessed.push({ time: i, value: maleAvg });
    femaleProcessed.push({ time: i, value: femaleAvg });
  }
  return { male: maleProcessed, female: femaleProcessed };
}

/**
 * Normalize two arrays (with {time, value} objects) using a shared scale.
 */
function normalizePair(maleData, femaleData) {
  const combined = maleData.concat(femaleData);
  const minVal = d3.min(combined, d => d.value);
  const maxVal = d3.max(combined, d => d.value);
  const normMale = maleData.map(d => ({ time: d.time, value: (d.value - minVal) / (maxVal - minVal) }));
  const normFemale = femaleData.map(d => ({ time: d.time, value: (d.value - minVal) / (maxVal - minVal) }));
  return { male: normMale, female: normFemale };
}

/**
 * Smooth a single array of data using a moving average.
 */
function smoothDataSingle(data, windowSize = 50) {
  return data.map((d, i, arr) => {
    let start = Math.max(0, i - Math.floor(windowSize / 2));
    let end = Math.min(arr.length, i + Math.floor(windowSize / 2));
    let avg = d3.mean(arr.slice(start, end), d => d.value);
    return { time: d.time, value: avg };
  });
}

/**
 * Process both activity and temperature CSV data,
 * store the raw data for tooltips and then create the comparison graph.
 */
function processActivityAndTemperatureData(maleActData, femaleActData, maleTempData, femaleTempData) {
  // Process activity data.
  let activityProcessed = processData(maleActData, femaleActData);
  // Store raw processed data for tooltip display.
  rawActivityMale = activityProcessed.male;
  rawActivityFemale = activityProcessed.female;
  let normActivity = normalizePair(activityProcessed.male, activityProcessed.female);
  let activityMaleSmoothed = smoothDataSingle(normActivity.male);
  let activityFemaleSmoothed = smoothDataSingle(normActivity.female);

  // Process temperature data.
  let temperatureProcessed = processData(maleTempData, femaleTempData);
  rawTemperatureMale = temperatureProcessed.male;
  rawTemperatureFemale = temperatureProcessed.female;
  let normTemperature = normalizePair(temperatureProcessed.male, temperatureProcessed.female);
  let temperatureMaleSmoothed = smoothDataSingle(normTemperature.male);
  let temperatureFemaleSmoothed = smoothDataSingle(normTemperature.female);

  createComparisonGraph(activityMaleSmoothed, activityFemaleSmoothed,
                          temperatureMaleSmoothed, temperatureFemaleSmoothed);
}

/**
 * Create the comparison graph by plotting four lines (normalized & smoothed) while
 * displaying raw data values in the tooltip.
 */
function createComparisonGraph(activityMaleData, activityFemaleData, temperatureMaleData, temperatureFemaleData) {
  d3.select("#comparison-chart").html("");  // Clear previous chart

  const width = 1600,
        height = 800;
  const margin = { top: 20, right: 50, bottom: 50, left: 50 };

  const svg = d3.select("#comparison-chart")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Determine the maximum time (assumes same time domain for all series).
  const maxTime = d3.max(activityMaleData, d => d.time);
  const xScale = d3.scaleLinear()
      .domain([0, maxTime])
      .range([0, width - margin.left - margin.right]);

  // Add alternating background rectangles.
  const interval = 720; // 720 minutes = half a day
  for (let i = 0; i < maxTime; i += interval) {
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

  // X Axis (time in days).
  const xAxis = d3.axisBottom(xScale)
      .tickValues(d3.range(0, maxTime + 1, 1440))
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

  // Y Axis (normalized values 0-1).
  const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom - margin.top, 0]);
  const yAxis = d3.axisLeft(yScale).ticks(5);
  svg.append("g")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", - (height - margin.top - margin.bottom) / 2)
      .attr("y", -40)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Normalized Activity & Temperature");

  // Add estrus markers.
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
         .attr("y", -10)
         .attr("fill", "red")
         .attr("text-anchor", "middle")
         .attr("font-weight", "bold")
         .style("font-size", "12px")
         .text("Estrus Start");
  });

  // Line generator for our normalized & smoothed data.
  const lineGenerator = d3.line()
      .x(d => xScale(d.time))
      .y(d => yScale(d.value))
      .curve(d3.curveLinear);

  // Draw the four lines.
  svg.append("path")
      .datum(activityMaleData)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8)
      .attr("d", lineGenerator);

  svg.append("path")
      .datum(activityFemaleData)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8)
      .attr("d", lineGenerator);

  svg.append("path")
      .datum(temperatureMaleData)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8)
      .attr("d", lineGenerator);

  svg.append("path")
      .datum(temperatureFemaleData)
      .attr("fill", "none")
      .attr("stroke", "purple")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8)
      .attr("d", lineGenerator);

  // Add a legend.
  const legendGroup = svg.append("g")
  .attr("transform", `translate(${width - 160}, -10)`);

// Create the background rectangle for the legend box
legendGroup.append("rect")
  .attr("x", -10) // Left padding for the box
  .attr("y", -10) // Top padding for the box
  .attr("width", 110) // Width of the box
  .attr("height", 100) // Height of the box
  .attr("fill", "#f5f5f5") // Background color
  .attr("stroke", "black") // Border color
  .attr("stroke-width", 1) // Border width
  .attr("rx", 5) // Rounded corners
  .attr("ry", 5); // Rounded corners

// Function to add each legend item with label and color.
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

addLegend("blue", "Activity (M)", 0);
addLegend("red", "Activity (F)", 20);
addLegend("orange", "Temp C° (M)", 40);
addLegend("purple", "Temp C° (F)", 60);


  // --- Tooltip Setup ---
  // Create a focus group to hold our focus elements.
  const focus = svg.append("g")
      .attr("class", "focus")
      .style("display", "none");

  // A vertical line that follows the mouse.
  focus.append("line")
      .attr("class", "focusLine")
      .attr("stroke", "gray")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", height - margin.top - margin.bottom);

  // Four focus circles—one for each series.
  const focusCircleActivityMale = focus.append("circle").attr("r", 4).attr("fill", "royalblue");
  const focusCircleActivityFemale = focus.append("circle").attr("r", 4).attr("fill", "lightblue");
  const focusCircleTempMale = focus.append("circle").attr("r", 4).attr("fill", "orange");
  const focusCircleTempFemale = focus.append("circle").attr("r", 4).attr("fill", "gold");

  // Overlay rectangle to capture mouse events.
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

  // Use a bisector on the normalized data (they share the same time domain)
  const bisect = d3.bisector(d => d.time).left;

  function mousemove(event) {
    const mouse = d3.pointer(event);
    const x0 = xScale.invert(mouse[0]);
    let i = bisect(activityMaleData, x0, 1);
    const d0 = activityMaleData[i - 1];
    const d1 = activityMaleData[i];
    // Pick the closest point.
    const dActMale = (!d0 || !d1) ? (d0 || d1) : (x0 - d0.time > d1.time - x0 ? d1 : d0);
    const index = dActMale.time; // use time as the index

    // For the normalized/smoothed series (for focus positioning)
    const dActFemale = activityFemaleData[index];
    const dTempMale  = temperatureMaleData[index];
    const dTempFemale = temperatureFemaleData[index];

    const xPos = xScale(index);
    // Update the vertical focus line.
    focus.select(".focusLine")
         .attr("x1", xPos)
         .attr("x2", xPos);

    // Update focus circles using the normalized data positions.
    focusCircleActivityMale.attr("cx", xPos).attr("cy", yScale(dActMale.value));
    focusCircleActivityFemale.attr("cx", xPos).attr("cy", yScale(dActFemale.value));
    focusCircleTempMale.attr("cx", xPos).attr("cy", yScale(dTempMale.value));
    focusCircleTempFemale.attr("cx", xPos).attr("cy", yScale(dTempFemale.value));

    // Lookup corresponding raw data points.
    const raw_dActMale   = rawActivityMale[index];
    const raw_dActFemale = rawActivityFemale[index];
    const raw_dTempMale  = rawTemperatureMale[index];
    const raw_dTempFemale= rawTemperatureFemale[index];

    // Format time (assume each time unit is one minute).
    const totalMinutes = index;
    const days = Math.floor(totalMinutes / 1440);
    const remainder = totalMinutes % 1440;
    const hours = Math.floor(remainder / 60);
    const minutes = remainder % 60;
    const timeFormatted = `${days}d ${hours}h ${minutes}m`;

    d3.select("#tooltip")
      .html(`<strong>Time:</strong> ${timeFormatted}<br>
             <strong>Activity (Male):</strong> ${raw_dActMale.value.toFixed(4)}<br>
             <strong>Activity (Female):</strong> ${raw_dActFemale.value.toFixed(4)}<br>
             <strong>Temp (Male):</strong> ${raw_dTempMale.value.toFixed(2)} C°<br>
             <strong>Temp (Female):</strong> ${raw_dTempFemale.value.toFixed(2)} C°`)
      .style("left", (xPos + margin.left + 20) + "px")
      .style("top", (mouse[1] + margin.top) + "px");
  }
}
