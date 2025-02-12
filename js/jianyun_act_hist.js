document.addEventListener("DOMContentLoaded", function () {
    const maleSelect = document.getElementById("male-select");
    const femaleSelect = document.getElementById("female-select");

    ["Male", "Female"].forEach(gender => {
        for (let i = 1; i <= 13; i++) {
            const option = document.createElement("option");
            option.value = `${gender.toLowerCase()[0]}${i}`;
            option.textContent = `${gender} ${i}`;
            document.getElementById(`${gender.toLowerCase()}-select`).appendChild(option);
        }
    });
    
    // Listening for user selection changes
    maleSelect.addEventListener("change", () => updateChart(maleSelect.value, "male"));
    femaleSelect.addEventListener("change", () => updateChart(femaleSelect.value, "female"));

    updateChart("m1", "male");
    updateChart("f1", "female");
});


function updateChart(selectedMouse, gender) {
    const filePath = gender === "male" ? "../assets/data/male_act.csv" : "../assets/data/fem_act.csv";
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            const rows = data.trim().split("\n").map(row => row.split(","));
            const headers = rows[0].map(h => h.trim().replace(/"/g, ""));
            const index = headers.indexOf(selectedMouse.trim());

            const activityValues = rows.slice(1)
                .map(row => parseFloat(row[index]))
                .filter(value => !isNaN(value));

            drawHistogram(activityValues, gender === "male" ? "act-hist-male" : "act-hist-fem", `${selectedMouse} Activity Histogram`);
        })
        .catch(error => console.error(`${filePath} Failed to read:`, error));
}

function drawHistogram(data, canvasId, title) {
    const ctx = document.getElementById(canvasId);

    const bins = {};
    data.forEach(value => {
        const bin = Math.floor(value / 10) * 10;
        bins[bin] = (bins[bin] || 0) + 1;
    });

    const labels = Object.keys(bins).map(Number).sort((a, b) => a - b);
    const values = labels.map(bin => bins[bin]);

    if (ctx.chart) {
        ctx.chart.destroy();
    }

    ctx.chart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels.map(bin => `${bin}-${bin + 9}`),
            datasets: [{
                label: title,
                data: values,
                backgroundColor: 'rgba(192, 75, 75, 0.5)',
                borderColor: 'rgba(192, 75, 75, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { 
                    beginAtZero: true,
                    title: {display: true, text: "Frequency"}
                },
                x: { 
                    title: { display: true, text: "Activity Level" } 
                }
            }
        }
    });
}
