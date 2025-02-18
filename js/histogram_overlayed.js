const margin = {top: 60, right: 30, bottom: 60, left: 80},
    width = 760 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

function computeAverage(data) {
    let avg_data = [];
    data.forEach(d => {
        let sum = 0;
        let count = 0;
        for (let key in d) {
            sum += d[key];
            count ++;
        }
        avg_data.push(sum / count);
    });
    return avg_data;
}
function drawTemperatureHistogram() {
const svg = d3.select("#temp-hist")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

Promise.all([
    d3.csv("../assets/data/fem_temp.csv", d3.autoType),
    d3.csv("../assets/data/male_temp.csv", d3.autoType)
]).then(function([femData, maleData]) {
    let femAvg = computeAverage(femData);
    let maleAvg = computeAverage(maleData);

    let combinedData = femAvg.concat(maleAvg);

    const x = d3.scaleLinear()
        .domain([d3.min(combinedData), d3.max(combinedData)])
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    const histogram = d3.histogram()
        .value(d => d)
        .domain(x.domain())
        .thresholds(x.ticks(40));

    const femBins = histogram(femAvg);
    const maleBins = histogram(maleAvg);

    const y = d3.scaleLinear()
        .range([height, margin.top]);
        y.domain([0, d3.max([...femBins, ...maleBins], d => d.length)]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgrey")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("display", "none");

    function showTooltip(event, d, gender) {
        // Only show the tooltip if the opacity is 0.7
        const opacity = gender === "Female" ? d3.select(".fem-rect").style("opacity") : d3.select(".male-rect").style("opacity");
    
        if (opacity === "0.7") {
            tooltip.style("display", "block")
                .html(`Sex: ${gender}<br>Temperature Range: ${d.x0.toFixed(2)} C° - ${d.x1.toFixed(2)}C° <br>Count: ${d.length}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        }
    }
    function hideTooltip() {
        tooltip.style("display", "none");
    }

    svg.selectAll(".fem-rect")
    .data(femBins)
    .join("rect")
        .attr("class", "fem-rect")
        .attr("x", 1)
        .attr("transform", d => `translate(${x(d.x0)} , ${y(d.length)})`)
        .attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => height - y(d.length))
        .style("fill", "red")
        .style("opacity", 0.7)
        .on("mouseover", (event, d) => showTooltip(event, d, "Female"))
        .on("mousemove", (event, d) => showTooltip(event, d, "Female"))
        .on("mouseout", hideTooltip)
        .on("click", function () {
            const isMaleDimmed = svg.selectAll(".male-rect").style("opacity") === "0.3";

            // Toggle opacity of male bins
            svg.selectAll(".male-rect")
                .style("opacity", isMaleDimmed ? 0.7 : 0.3); // If male bins are dimmed, restore them, otherwise dim them

            // Toggle opacity of female bins
            svg.selectAll(".fem-rect")
                .style("opacity", isMaleDimmed ? 0.3 : 0.7); // If male bins are dimmed, restore female bins, otherwise dim them

            svg.selectAll(".fem-rect").raise();  // Bring clicked female bin to the front
        });

svg.selectAll(".male-rect")
    .data(maleBins)
    .join("rect")
        .attr("class", "male-rect")
        .attr("x", 1)
        .attr("transform", d => `translate(${x(d.x0)} , ${y(d.length)})`)
        .attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => height - y(d.length))
        .style("fill", "steelblue")
        .style("opacity", 0.7)
        .on("mouseover", (event, d) => showTooltip(event, d, "Male"))
        .on("mousemove", (event, d) => showTooltip(event, d, "Male"))
        .on("mouseout", hideTooltip)
        .on("click", function () {
            const isFemaleDimmed = svg.selectAll(".fem-rect").style("opacity") === "0.3";

            // Toggle opacity of female bins
            svg.selectAll(".fem-rect")
                .style("opacity", isFemaleDimmed ? 0.7 : 0.3); // If female bins are dimmed, restore them, otherwise dim them

            // Toggle opacity of male bins
            svg.selectAll(".male-rect")
                .style("opacity", isFemaleDimmed ? 0.3 : 0.7); // If female bins are dimmed, restore male bins, otherwise dim them

            svg.selectAll(".male-rect").raise();  // Bring clicked male bin to the front
        });

    // title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 5)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Average Temperature of Male and Female Mice");

    // x-axis
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Temperature (Celsius)");

    // y-axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Frequency");

// legend
const legend = svg.append("g")
    .attr("transform", `translate(${width - 100}, 0)`);

// Female legend
legend.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", "red")
    .style("cursor", "pointer")
    .on("click", function () {
        // Show female bars and dim male bars
        svg.selectAll(".fem-rect")
            .style("opacity", 0.7);  // Make female bars fully visible

        svg.selectAll(".male-rect")
            .style("opacity", 0.3);  // Dim male bars

        svg.selectAll(".fem-rect").raise();  // Bring female bars to the front
    });

legend.append("text")
    .attr("x", 20)
    .attr("y", 10)
    .style("font-size", "15px")
    .style("cursor", "pointer")
    .text("Female Mice")
    .on("click", function () {
        // Show female bars and dim male bars
        svg.selectAll(".fem-rect")
            .style("opacity", 0.7);  // Make female bars fully visible

        svg.selectAll(".male-rect")
            .style("opacity", 0.3);  // Dim male bars

        svg.selectAll(".fem-rect").raise();  // Bring female bars to the front
    });

// Male legend
legend.append("rect")
    .attr("x", 0)
    .attr("y", 20)
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", "steelblue")
    .style("cursor", "pointer")
    .on("click", function () {
        // Show male bars and dim female bars
        svg.selectAll(".male-rect")
            .style("opacity", 1);  // Make male bars fully visible

        svg.selectAll(".fem-rect")
            .style("opacity", 0.3);  // Dim female bars

        svg.selectAll(".male-rect").raise();  // Bring male bars to the front
    });

legend.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .style("font-size", "15px")
    .style("cursor", "pointer")
    .text("Male Mice")
    .on("click", function () {
        // Show male bars and dim female bars
        svg.selectAll(".male-rect")
            .style("opacity", 1);  // Make male bars fully visible

        svg.selectAll(".fem-rect")
            .style("opacity", 0.3);  // Dim female bars

        svg.selectAll(".male-rect").raise();  // Bring male bars to the front
    });

});
}

function drawActivityHistogram() {
    const svg = d3.select("#activity-hist")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    Promise.all([
        d3.csv("../assets/data/fem_act.csv", d3.autoType),
        d3.csv("../assets/data/male_act.csv", d3.autoType)
    ]).then(function ([femData, maleData]) {

        let femAvg = computeAverage(femData);
        let maleAvg = computeAverage(maleData);

        let combinedData = femAvg.concat(maleAvg);

        const x = d3.scaleLinear()
            .domain([d3.min(combinedData), d3.max(combinedData)])
            .range([0, width]);
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        const histogram = d3.histogram()
            .value(d => d)
            .domain(x.domain())
            .thresholds(x.ticks(40));

        const femBins = histogram(femAvg);
        const maleBins = histogram(maleAvg);

        const y = d3.scaleLinear()
            .range([height, margin.top]);
            y.domain([0, d3.max([...femBins, ...maleBins], d => d.length)]);
        svg.append("g")
            .call(d3.axisLeft(y));

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "lightgrey")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("display", "none");;

        function showTooltip(event, d, gender) {
            // Only show the tooltip if the opacity is 0.7 for the selected gender
            const rects = gender === "Female" ? svg.selectAll(".fem-rect") : svg.selectAll(".male-rect");
            const opacity = rects.style("opacity");
        
            if (opacity === "0.7") {
                tooltip.style("display", "block")
                    .html(`Sex: ${gender}<br>Activity Range: ${d.x0.toFixed(0)} - ${d.x1.toFixed(0)}<br>Count: ${d.length}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            }
        }

        function hideTooltip() {
            tooltip.style("display", "none");
        }


    svg.selectAll(".fem-rect")
        .data(femBins)
        .join("rect")
            .attr("class", "fem-rect")
            .attr("x", 1)
            .attr("transform", d => `translate(${x(d.x0)} , ${y(d.length)})`)
            .attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
            .attr("height", d => height - y(d.length))
            .style("fill", "red")
            .style("opacity", 0.7)
            .on("mouseover", (event, d) => showTooltip(event, d, "Female"))
            .on("mousemove", (event, d) => showTooltip(event, d, "Female"))
            .on("mouseout", hideTooltip)
            .on("click", function () {
                // Check if male bins are dimmed, then toggle opacity
                const isMaleDimmed = svg.selectAll(".male-rect").style("opacity") === "0.3";

                // Toggle opacity of male bins
                svg.selectAll(".male-rect")
                    .style("opacity", isMaleDimmed ? 0.7 : 0.3);  // If male bins are dimmed, restore them, otherwise dim them

                // Toggle opacity of female bins
                svg.selectAll(".fem-rect")
                    .style("opacity", isMaleDimmed ? 0.3 : 0.7);  // If male bins are dimmed, restore female bins, otherwise dim them

                if (isMaleDimmed) {
                    svg.selectAll(".male-rect").raise();
                } else {
                    svg.selectAll(".fem-rect").raise();
                }  // Bring clicked female bin to the front
            });

    svg.selectAll(".male-rect")
        .data(maleBins)
        .join("rect")
            .attr("class", "male-rect")
            .attr("x", 1)
            .attr("transform", d => `translate(${x(d.x0)} , ${y(d.length)})`)
            .attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
            .attr("height", d => height - y(d.length))
            .style("fill", "steelblue")
            .style("opacity", 0.8)
            .on("mouseover", (event, d) => showTooltip(event, d, "Male"))
            .on("mousemove", (event, d) => showTooltip(event, d, "Male"))
            .on("mouseout", hideTooltip)
            .on("click", function () {
                // Check if female bins are dimmed, then toggle opacity
                const isFemaleDimmed = svg.selectAll(".fem-rect").style("opacity") === "0.3";

                // Toggle opacity of female bins
                svg.selectAll(".fem-rect")
                    .style("opacity", isFemaleDimmed ? 0.7 : 0.3);  // If female bins are dimmed, restore them, otherwise dim them

                // Toggle opacity of male bins
                svg.selectAll(".male-rect")
                    .style("opacity", isFemaleDimmed ? 0.3 : 0.7);  // If female bins are dimmed, restore male bins, otherwise dim them

                if (isFemaleDimmed) {
                    svg.selectAll(".fem-rect").raise();
                } else {
                    svg.selectAll(".male-rect").raise();
                }
                  // Bring clicked male bin to the front
            });

        
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Activity Levels of Male and Female Mice");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Activity Level");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Frequency");

            const legend = svg.append("g")
            .attr("transform", `translate(${width - 100}, 0)`);
        
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "red")
            .style("cursor", "pointer")  // Add cursor to indicate interactivity
            .on("click", function () {
                // Show female bars, hide male bars
                svg.selectAll(".fem-rect")
                    .style("opacity", 0.7);  // Make female bars fully visible
        
                svg.selectAll(".male-rect")
                    .style("opacity", 0.3);  // Dim male bars
        
                // Bring female bars to the front
                svg.selectAll(".fem-rect").raise();
            });
        
        legend.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .style("font-size", "15px")
            .style("cursor", "pointer")  // Add cursor to text as well
            .text("Female Mice");
        
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 20)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "steelblue")
            .style("cursor", "pointer")  // Add cursor to indicate interactivity
            .on("click", function () {
                // Show male bars, hide female bars
                svg.selectAll(".male-rect")
                    .style("opacity", 0.7);  // Make male bars fully visible
        
                svg.selectAll(".fem-rect")
                    .style("opacity", 0.3);  // Dim female bars
        
                // Bring male bars to the front
                svg.selectAll(".male-rect").raise();
            });
        
        legend.append("text")
            .attr("x", 20)
            .attr("y", 30)
            .style("font-size", "15px")
            .style("cursor", "pointer")  // Add cursor to text as well
            .text("Male Mice");
        

    });
}

function switchHistogram() {
    const selection = document.getElementById("dataSelection").value;
    document.getElementById("temp-hist").style.display = selection === "temp" ? "block" : "none";
    document.getElementById("activity-hist").style.display = selection === "activity" ? "block" : "none";
}

document.getElementById("dataSelection").addEventListener("change", switchHistogram);

drawTemperatureHistogram();
drawActivityHistogram();
switchHistogram();


