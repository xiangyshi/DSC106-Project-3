// Load the activity CSVs and process data
d3.csv("../assets/data/male_act.csv").then(maleData => {
    d3.csv("../assets/data/fem_act.csv").then(femaleData => {
      processActivityData(maleData, femaleData);
    });
  });
  
  // Normalization function for activity (average)
  function normalizeActivityData(data) {
    let minAct = d3.min(data, d => Math.min(d.male, d.female));
    let maxAct = d3.max(data, d => Math.max(d.male, d.female));
  
    return data.map(d => ({
      time: d.time,
      male: (d.male - minAct) / (maxAct - minAct),
      female: (d.female - minAct) / (maxAct - minAct)
    }));
  }
  
  // Smooth activity data (for average)
  function smoothActivityData(data, windowSize = 50) {
    return data.map((d, i, arr) => {
      let start = Math.max(0, i - Math.floor(windowSize / 2));
      let end = Math.min(arr.length, i + Math.floor(windowSize / 2));
      let maleAvg = d3.mean(arr.slice(start, end), d => d.male);
      let femaleAvg = d3.mean(arr.slice(start, end), d => d.female);
      return { time: d.time, male: maleAvg, female: femaleAvg };
    });
  }
  
  // Process activity data: compute both average and individual data
  function processActivityData(maleData, femaleData) {
    // ----- Compute Average Data -----
    let avgData = [];
    for (let i = 0; i < maleData.length; i++) {
      let maleActs = Object.values(maleData[i]).map(Number);
      let femaleActs = Object.values(femaleData[i]).map(Number);
      let maleAvg = d3.mean(maleActs);
      let femaleAvg = d3.mean(femaleActs);
      avgData.push({ time: i, male: maleAvg, female: femaleAvg });
    }
    avgData = normalizeActivityData(avgData);
    avgData = smoothActivityData(avgData);
  
    // ----- Process Individual Data for All Cases -----
    // For male: each CSV column is assumed to be one case.
    let maleKeys = Object.keys(maleData[0]);
    let maleIndividual = maleKeys.map(key => ({ name: key, values: [] }));
    for (let i = 0; i < maleData.length; i++) {
      maleKeys.forEach((key, idx) => {
        maleIndividual[idx].values.push({ time: i, value: +maleData[i][key] });
      });
    }
    // For female:
    let femaleKeys = Object.keys(femaleData[0]);
    let femaleIndividual = femaleKeys.map(key => ({ name: key, values: [] }));
    for (let i = 0; i < femaleData.length; i++) {
      femaleKeys.forEach((key, idx) => {
        femaleIndividual[idx].values.push({ time: i, value: +femaleData[i][key] });
      });
    }
    // Normalize individual data using global min/max across both genders.
    let allValues = [];
    maleIndividual.forEach(series => series.values.forEach(d => allValues.push(d.value)));
    femaleIndividual.forEach(series => series.values.forEach(d => allValues.push(d.value)));
    let minValue = d3.min(allValues);
    let maxValue = d3.max(allValues);
    maleIndividual.forEach(series => {
      series.values = series.values.map(d => ({
        time: d.time,
        value: (d.value - minValue) / (maxValue - minValue)
      }));
    });
    femaleIndividual.forEach(series => {
      series.values = series.values.map(d => ({
        time: d.time,
        value: (d.value - minValue) / (maxValue - minValue)
      }));
    });
  
    // Save processed data globally
    window.activityData = {
      average: avgData,
      maleIndividual: maleIndividual,
      femaleIndividual: femaleIndividual
    };
  
    createActModeSelection();
    // Start in average mode.
    createActivityComparisonGraph("average", window.activityData);
  }
  
  // Create mode selection listener for activity chart
  function createActModeSelection() {
    d3.select("#actDataMode").on("change", function() {
      let mode = d3.select(this).property("value");
      createActivityComparisonGraph(mode, window.activityData);
    });
  }
  
  // Create the activity comparison chart
  function createActivityComparisonGraph(mode, activityData) {
    // Clear the chart container
    d3.select("#activity_chart").html("");
  
    // Set up dimensions and margins
    const width = 800,
          height = 400,
          margin = { top: 20, right: 50, bottom: 50, left: 50 };
  
    // Create SVG container
    const svg = d3.select("#activity_chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Define common scales
    let timeExtent;
    if (mode === "average") {
      timeExtent = d3.extent(activityData.average, d => d.time);
    } else {
      timeExtent = [0, activityData.maleIndividual[0].values.length - 1];
    }
    const xScale = d3.scaleLinear()
      .domain(timeExtent)
      .range([0, width - margin.left - margin.right]);
    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height - margin.top - margin.bottom, 0]);
  
    // Draw X-axis
    const ticks = d3.range(0, 20160 + 1, 1440);
    const xAxis = d3.axisBottom(xScale)
        .tickValues(ticks)
        .tickFormat(d => `${Math.floor(d / 1440)}d`);
    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
      .call(xAxis)
      .append("text")
      .attr("x", (width - margin.left - margin.right) / 2)
      .attr("y", 35)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Time (Days)");
  
    // Draw Y-axis
    const yAxis = d3.axisLeft(yScale).ticks(5);
    svg.append("g")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", - (height - margin.top - margin.bottom) / 2)
      .attr("y", -40)
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .text("Normalized Activity Level");
    const estrusDays = [1, 5, 9, 13].map(day => day * 1440);
    estrusDays.forEach(day => {
          svg.append("line")
            .attr("x1", xScale(day))
            .attr("x2", xScale(day))
            .attr("y1", 0)
            .attr("y2", height - margin.top - margin.bottom)
            .attr("stroke", "orange")
            .attr("stroke-dasharray", "3,3")
            .attr("opacity", 0.8);
          
          svg.append("text")
            .attr("x", xScale(day))
            .attr("y", -10)  // positions the label above the chart
            .attr("fill", "orange")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Estrus day");
        });
    if (mode === "average") {
      // ----- Draw average lines -----
      const lineMale = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.male))
        .curve(d3.curveLinear);
      svg.append("path")
        .datum(activityData.average)
        .attr("fill", "none")
        .attr("stroke", "royalblue")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.8)
        .attr("d", lineMale);
  
      const lineFemale = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.female))
        .curve(d3.curveLinear);
      svg.append("path")
        .datum(activityData.average)
        .attr("fill", "none")
        .attr("stroke", "Crimson")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.8)
        .attr("d", lineFemale);
  
      // Add legend
      const legendGroup = svg.append("g")
        .attr("transform", `translate(${width - margin.left - margin.right - 120}, 20)`);
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
  
      // ----- Add tooltip overlay for average mode -----
      let focusGroup = svg.append("g").style("display", "none");
  
      let focusLine = focusGroup.append("line")
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "3,3")
        .attr("y1", 0)
        .attr("y2", height - margin.top - margin.bottom);
  
      let focusCircleMale = focusGroup.append("circle")
        .attr("r", 4)
        .attr("fill", "royalblue");
  
      let focusCircleFemale = focusGroup.append("circle")
        .attr("r", 4)
        .attr("fill", "Crimson");
  
      svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mouseover", () => {
            focusGroup.style("display", null);
            d3.select("#actTooltip").style("display", "block");
        })
        .on("mouseout", () => {
            focusGroup.style("display", "none");
            d3.select("#actTooltip").style("display", "none");
        })
        .on("mousemove", function(event) {
            let mouse = d3.pointer(event);
            let mouseX = mouse[0];
            let timeValue = xScale.invert(mouseX);
            let bisect = d3.bisector(d => d.time).left;
            let idx = bisect(activityData.average, timeValue);
            let d0 = activityData.average[idx - 1];
            let d1 = activityData.average[idx];
            let dPoint = d0 && d1
              ? (timeValue - d0.time > d1.time - timeValue ? d1 : d0)
              : (d0 || d1);
            let xPos = xScale(dPoint.time);
            focusLine.attr("x1", xPos).attr("x2", xPos);
            focusCircleMale.attr("cx", xPos).attr("cy", yScale(dPoint.male));
            focusCircleFemale.attr("cx", xPos).attr("cy", yScale(dPoint.female));
            d3.select("#actTooltip")
              .html(`Time: ${dPoint.time}<br>Male: ${dPoint.male.toFixed(2)}<br>Female: ${dPoint.female.toFixed(2)}`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
        });
  
      // Clear individual controls (if any)
      d3.select("#actIndividualControls").html("");
    } else if (mode === "individual") {
      // ----- For individual mode, create controls if not already present -----
      if (d3.select("#actMaleCaseSelect").empty()) {
        const controls = d3.select("#actIndividualControls");
        // Male case dropdown
        controls.append("label")
          .attr("for", "actMaleCaseSelect")
          .text("Male Case: ");
        const maleSelect = controls.append("select")
          .attr("id", "actMaleCaseSelect");
        activityData.maleIndividual.forEach(series => {
          maleSelect.append("option")
            .attr("value", series.name)
            .text(series.name);
        });
        // Female case dropdown
        controls.append("label")
          .attr("for", "actFemaleCaseSelect")
          .style("margin-left", "20px")
          .text("Female Case: ");
        const femaleSelect = controls.append("select")
          .attr("id", "actFemaleCaseSelect");
        activityData.femaleIndividual.forEach(series => {
          femaleSelect.append("option")
            .attr("value", series.name)
            .text(series.name);
        });
        // Attach change listeners to update only the chart (without recreating controls)
        maleSelect.on("change", () => updateActivityIndividualChart(activityData, xScale, yScale, svg, width, margin));
        femaleSelect.on("change", () => updateActivityIndividualChart(activityData, xScale, yScale, svg, width, margin));
      }
      // Draw the individual chart based on current selections
      updateActivityIndividualChart(activityData, xScale, yScale, svg, width, margin);
    }
  }
  
  // Update function for individual activity chart
  function updateActivityIndividualChart(activityData, xScale, yScale, svg, width, margin) {
    // Remove previous individual lines (if any)
    svg.selectAll(".individualLine").remove();
  
    // Get the currently selected cases
    const selectedMale = d3.select("#actMaleCaseSelect").property("value");
    const selectedFemale = d3.select("#actFemaleCaseSelect").property("value");
  
    const maleSeries = activityData.maleIndividual.find(series => series.name === selectedMale);
    const femaleSeries = activityData.femaleIndividual.find(series => series.name === selectedFemale);
  
    // Create a line generator
    const lineGen = d3.line()
      .x(d => xScale(d.time))
      .y(d => yScale(d.value))
      .curve(d3.curveLinear);
  
    // Draw male series
    if (maleSeries) {
      svg.append("path")
        .datum(maleSeries.values)
        .attr("class", "individualLine")
        .attr("fill", "none")
        .attr("stroke", "royalblue")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.8)
        .attr("d", lineGen);
    }
    // Draw female series
    if (femaleSeries) {
      svg.append("path")
        .datum(femaleSeries.values)
        .attr("class", "individualLine")
        .attr("fill", "none")
        .attr("stroke", "Crimson")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.8)
        .attr("d", lineGen);
    }
  
    // Update legend with selected case names
    svg.selectAll(".legend").remove();
    const legendGroup = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.left - margin.right - 120}, 20)`);
    legendGroup.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", "royalblue");
    legendGroup.append("text")
      .attr("x", 20)
      .attr("y", 10)
      .text(selectedMale)
      .attr("fill", "black")
      .style("font-size", "12px");
    legendGroup.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("y", 20)
      .attr("fill", "Crimson");
    legendGroup.append("text")
      .attr("x", 20)
      .attr("y", 30)
      .text(selectedFemale)
      .attr("fill", "black")
      .style("font-size", "12px");
  
    // ----- Add tooltip overlay for individual mode -----
    // Remove previous overlay if any
    svg.selectAll(".overlay-individual").remove();
    let focusGroup = svg.append("g").style("display", "none");
  
    let focusLine = focusGroup.append("line")
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", height - margin.top - margin.bottom);
  
    let focusCircleMale = focusGroup.append("circle")
      .attr("r", 4)
      .attr("fill", "royalblue");
  
    let focusCircleFemale = focusGroup.append("circle")
      .attr("r", 4)
      .attr("fill", "Crimson");
  
    svg.append("rect")
      .attr("class", "overlay-individual")
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseover", () => {
        focusGroup.style("display", null);
        d3.select("#actTooltip").style("display", "block");
      })
      .on("mouseout", () => {
        focusGroup.style("display", "none");
        d3.select("#actTooltip").style("display", "none");
      })
      .on("mousemove", function(event) {
        let mouse = d3.pointer(event);
        let mouseX = mouse[0];
        let timeValue = xScale.invert(mouseX);
        let bisect = d3.bisector(d => d.time).left;
        // For male series:
        let idxMale = bisect(maleSeries.values, timeValue);
        let dMale0 = maleSeries.values[idxMale - 1];
        let dMale1 = maleSeries.values[idxMale];
        let dMalePoint = dMale0 && dMale1
          ? (timeValue - dMale0.time > dMale1.time - timeValue ? dMale1 : dMale0)
          : (dMale0 || dMale1);
        // For female series:
        let idxFemale = bisect(femaleSeries.values, timeValue);
        let dFemale0 = femaleSeries.values[idxFemale - 1];
        let dFemale1 = femaleSeries.values[idxFemale];
        let dFemalePoint = dFemale0 && dFemale1
          ? (timeValue - dFemale0.time > dFemale1.time - timeValue ? dFemale1 : dFemale0)
          : (dFemale0 || dFemale1);
        let xPos = xScale(dMalePoint ? dMalePoint.time : timeValue);
        focusLine.attr("x1", xPos).attr("x2", xPos);
        focusCircleMale.attr("cx", xPos).attr("cy", yScale(dMalePoint.value));
        focusCircleFemale.attr("cx", xPos).attr("cy", yScale(dFemalePoint.value));
        d3.select("#actTooltip")
          .html(`Time: ${dMalePoint ? dMalePoint.time : ''}<br>
                 Male: ${dMalePoint ? dMalePoint.value.toFixed(2) : ''}<br>
                 Female: ${dFemalePoint ? dFemalePoint.value.toFixed(2) : ''}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      });
  }
  