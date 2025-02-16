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



// kernel density estimator
// function kernelDensityEstimator(kernel, X) {
//     return function(V) {
//         return X.map(function(x) {
//             return [x, d3.mean(V, function(v) { return kernel(x - v); })];
//         });
//     };
// }

// // Gaussian kernel
// function gaussianKernel(bandwidth) {
//     return function(u) {
//         return Math.exp(-0.5 * (u * u)) / (bandwidth * Math.sqrt(2 * Math.PI));
//     };
// }

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
        tooltip.style("display", "block")
            .html(`Gender: ${gender}<br>Temperature Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}<br>Count: ${d.length}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
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
            .style("fill", "orange")
            .style("opacity", 0.7)
            .on("mouseover", (event, d) => showTooltip(event, d, "Female"))
            .on("mousemove", (event, d) => showTooltip(event, d, "Female"))
            .on("mouseout", hideTooltip);

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
            .on("mouseout", hideTooltip);


    // kernel density estimates
    // const bandwidth = 0.2; // Adjust bandwidth
    // const kde = kernelDensityEstimator(gaussianKernel(bandwidth), x.ticks(40));

    // const femDensity = kde(femAvg);
    // const maleDensity = kde(maleAvg);

    // const yDensity = d3.scaleLinear()
    //     .range([height, 0])
    //     .domain([0, d3.max([...femDensity, ...maleDensity], d => d[1])]);

    // const line = d3.line()
    //     .curve(d3.curveBasis)
    //     .x(d => x(d[0]))
    //     .y(d => yDensity(d[1]));

    // svg.append("path")
    //     .datum(femDensity)
    //     .attr("class", "line")
    //     .attr("d", line)
    //     .style("fill", "none")
    //     .style("stroke", "orange")
    //     .style("stroke-width", 2);


    // svg.append("path")
    //     .datum(maleDensity)
    //     .attr("class", "line")
    //     .attr("d", line)
    //     .style("fill", "none")
    //     .style("stroke", "steelblue")
    //     .style("stroke-width", 2);

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

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "orange");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .style("font-size", "15px")
        .text("Female Mice");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "steelblue");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .style("font-size", "15px")
        .text("Male Mice");    
    
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
            tooltip.style("display", "block")
                .html(`Gender: ${gender}<br>Activity Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}<br>Count: ${d.length}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
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
                .on("mouseout", hideTooltip);

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
                .on("mouseout", hideTooltip);

        
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
            .style("fill", "red");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .style("font-size", "15px")
            .text("Female Mice");

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 20)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "steelblue");

        legend.append("text")
            .attr("x", 20)
            .attr("y", 30)
            .style("font-size", "15px")
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

    // function brushSelector() {
    //     const svg = document.querySelector('svg');
    //     d3.select(svg).call(d3.brush());
    //     d3.select(svg).selectAll('.tooltip, .overlay ~ *').raise();
    // }
    // brushSelector();
    // // Add brushing
    // const brush = d3.brushX()
    //     .extent([[0, 0], [width, height]])
    //     .on("brush end", brushed);

    // svg.append("g")
    //     .attr("class", "brush")
    //     .call(brush);

    // function brushed(event) {
    //     const selection = event.selection;
    //     if (selection === null) {
    //         svg.selectAll(".fem-rect")
    //             .data(femBins)
    //             .join("rect")
    //                 .attr("class", "fem-rect")
    //                 .attr("x", 1)
    //                 .attr("transform", d => `translate(${x(d.x0)} , ${y(d.length)})`)
    //                 .attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
    //                 .attr("height", d => height - y(d.length))
    //                 .style("fill", "orange")
    //                 .style("opacity", 0.7)
    //                 .on("mouseover", (event, d) => showTooltip(event, d, "Female"))
    //                 .on("mousemove", (event, d) => showTooltip(event, d, "Female"))
    //                 .on("mouseout", hideTooltip);

    //         svg.selectAll(".male-rect")
    //             .data(maleBins)
    //             .join("rect")
    //                 .attr("class", "male-rect")
    //                 .attr("x", 1)
    //                 .attr("transform", d => `translate(${x(d.x0)} , ${y(d.length)})`)
    //                 .attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
    //                 .attr("height", d => height - y(d.length))
    //                 .style("fill", "steelblue")
    //                 .style("opacity", 0.7)
    //                 .on("mouseover", (event, d) => showTooltip(event, d, "Male"))
    //                 .on("mousemove", (event, d) => showTooltip(event, d, "Male"))
    //                 .on("mouseout", hideTooltip);
    //         return;
    //     }

    //     const [x0, x1] = selection.map(x.invert);
    //     const filteredFemBins = femBins.filter(d => d.x0 >= x0 && d.x1 <= x1);
    //     const filteredMaleBins = maleBins.filter(d => d.x0 >= x0 && d.x1 <= x1);

    //     svg.selectAll(".fem-rect")
    //         .data(filteredFemBins)
    //         .join("rect")
    //             .attr("class", "fem-rect")
    //             .attr("x", 1)
    //             .attr("transform", d => `translate(${x(d.x0)} , ${y(d.length)})`)
    //             .attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
    //             .attr("height", d => height - y(d.length))
    //             .style("fill", "orange")
    //             .style("opacity", 0.7)
    //             .on("mouseover", (event, d) => showTooltip(event, d, "Female"))
    //             .on("mousemove", (event, d) => showTooltip(event, d, "Female"))
    //             .on("mouseout", hideTooltip);
        
    //     svg.selectAll(".male-rect")
    //         .data(filteredMaleBins)
    //         .join("rect")
    //             .attr("class", "male-rect")
    //             .attr("x", 1)
    //             .attr("transform", d => `translate(${x(d.x0)} , ${y(d.length)})`)
    //             .attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
    //             .attr("height", d => height - y(d.length))
    //             .style("fill", "steelblue")
    //             .style("opacity", 0.7)
    //             .on("mouseover", (event, d) => showTooltip(event, d, "Male"))
    //             .on("mousemove", (event, d) => showTooltip(event, d, "Male"))
    //             .on("mouseout", hideTooltip);
    //     }

    //     svg.on("click", function(event) {
    //     if (event.target.tagName === 'svg') {
    //         svg.select(".brush").call(brush.move, null);
    //         brushed({selection: null});
    //     }
    // });

    // svg.append("rect")
    //     .attr("class", "overlay")
    //     .attr("width", width)
    //     .attr("height", height)
    //     .style("fill", "none")
    //     .style("pointer-events", "all")
    //     .on("mousemove", function(event) {
    //         const [mouseX, mouseY] = d3.pointer(event);
    //         const closestFemBin = femBins.reduce((a, b) => (
    //             Math.abs(x(b.x0) - mouseX) < Math.abs(x(a.x0) - mouseX) ? b : a
    //         ));
    //         const closestMaleBin = maleBins.reduce((a, b) => (
    //             Math.abs(x(b.x0) - mouseX) < Math.abs(x(a.x0) - mouseX) ? b : a
    //         ));

    //         const closestBin = Math.abs(x(closestFemBin.x0) - mouseX) < Math.abs(x(closestMaleBin.x0) - mouseX) ? closestFemBin : closestMaleBin;
    //         const gender = closestBin === closestFemBin ? "Female" : "Male";

    //         showTooltip(event, closestBin, gender);
    //     })
    //     .on("mouseout", hideTooltip)
    //     .on("click", function(event) {
    //         svg.select(".brush").call(brush.move, d3.brushSelection(this));
    //     });

    
    
