const margin = { top: 80, right: 80, bottom: 80, left: 80 };
const spacing = 50; 
const width = window.innerWidth * 0.4;
const height = window.innerHeight * 0.4;

function createChart(containerID, dropdownID, dataPath, color) {
    const svg = d3.select(containerID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().range([0, width]);  
    const yScaleActivity = d3.scaleLinear().range([height, 0]);  
    const yScaleTemp = d3.scaleLinear().range([height, 0]);  

    const activityLine = d3.line()
        .x(d => xScale(d.minute))
        .y(d => yScaleActivity(d.activity))
        .curve(d3.curveMonotoneX);

    const tempLine = d3.line()
        .x(d => xScale(d.minute))
        .y(d => yScaleTemp(d.temperature))
        .curve(d3.curveMonotoneX);

    d3.csv(dataPath).then(data => {
        data.forEach(d => {
            d.minute = +d.minute;
            d.activity = +d.activity;
            d.temperature = +d.temperature;
        });

        const mouseIDs = [...new Set(data.map(d => d.mouse_id))];

        const select = d3.select(dropdownID);
        select.selectAll("option")
            .data(mouseIDs)
            .enter()
            .append("option")
            .text(d => d)
            .attr("value", d => d);

        xScale.domain(d3.extent(data, d => d.minute));
        yScaleActivity.domain([0, d3.max(data, d => d.activity) * 1.1]);  
        yScaleTemp.domain([d3.min(data, d => d.temperature) - 1, d3.max(data, d => d.temperature) + 1]);

        const xAxis = d3.axisBottom(xScale);
        const yAxisActivity = d3.axisLeft(yScaleActivity);
        const yAxisTemp = d3.axisRight(yScaleTemp);

        svg.append("g").attr("transform", `translate(0, ${height})`).call(xAxis);
        svg.append("g").attr("class", "y-axis-activity").call(yAxisActivity);
        svg.append("g").attr("class", "y-axis-temp").attr("transform", `translate(${width},0)`).call(yAxisTemp);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .attr("text-anchor", "middle")
            .attr("class", "axis-label")
            .text("Time (minutes)");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .attr("class", "axis-label")
            .text("Activity Level");

        svg.append("text")
            .attr("transform", `rotate(90) translate(${-height / 2},${width + 50})`)
            .attr("text-anchor", "middle")
            .attr("class", "axis-label")
            .text("Temperature (°C)");

        function updateChart(selectedMouse) {
            const filteredData = data.filter(d => d.mouse_id === selectedMouse);

            yScaleActivity.domain([0, d3.max(filteredData, d => d.activity) * 1.1]);
            yScaleTemp.domain([d3.min(filteredData, d => d.temperature) - 1, d3.max(filteredData, d => d.temperature) + 1]);

            svg.select(".y-axis-activity").transition().duration(1000).call(yAxisActivity);
            svg.select(".y-axis-temp").transition().duration(1000).call(yAxisTemp);

            const activityPath = svg.selectAll(".activity-line").data([filteredData]);
            const tempPath = svg.selectAll(".temp-line").data([filteredData]);

            activityPath.enter()
                .append("path")
                .attr("class", "line activity-line")
                .merge(activityPath)
                .transition().duration(1000)
                .attr("d", activityLine)
                .attr("stroke", color)
                .attr("fill", "none")
                .attr("stroke-width", 2);

            tempPath.enter()
                .append("path")
                .attr("class", "line temp-line")
                .merge(tempPath)
                .transition().duration(1000)
                .attr("d", tempLine)
                .attr("stroke", "firebrick")
                .attr("fill", "none")
                .attr("stroke-width", 2);

            activityPath.exit().remove();
            tempPath.exit().remove();
        }

        updateChart(mouseIDs[0]);

        select.on("change", function() {
            updateChart(this.value);
        });
    });
}

createChart("#svgFemale", "#mouseSelectFemale", "../assets/data/female_data.csv", "darkgrey");
createChart("#svgMale", "#mouseSelectMale", "../assets/data/male_data.csv", "darkseagreen");
