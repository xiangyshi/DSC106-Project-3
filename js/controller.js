// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", function () {
    const histogramButton = document.getElementById("showHistogram");
    const comparisonButton = document.getElementById("showComparison");
    const writeupButton = document.getElementById("showWriteup");

    const histogramContainer = document.getElementById("histogram-container");
    const comparisonContainer = document.getElementById("comparison-container");
    const writeupContainer = document.getElementById("writeup-container");

    // Function to show histogram and hide comparison
    function showHistogram() {
        histogramContainer.style.display = "block";
        comparisonContainer.style.display = "none";
        writeupContainer.style.display = "none";

        // Add active class to histogram button and remove from comparison
        histogramButton.classList.add("active");
        comparisonButton.classList.remove("active");
        writeupContainer.classList.remove("active");
    }

    // Function to show comparison and hide histogram
    function showComparison() {
        histogramContainer.style.display = "none";
        comparisonContainer.style.display = "block";
        writeupContainer.style.display = "none";

        // Add active class to comparison button and remove from histogram
        comparisonButton.classList.add("active");
        histogramButton.classList.remove("active");
        writeupContainer.classList.remove("active");
    }

    function showWriteup() {
        histogramContainer.style.display = "none";
        comparisonContainer.style.display = "none";
        writeupContainer.style.display = "block";

        // Add active class to comparison button and remove from histogram
        comparisonButton.classList.remove("active");
        histogramButton.classList.remove("active");
        writeupContainer.classList.add("active");
    }

    // Initially show histogram (default state)
    showHistogram();

    // Event listeners for the buttons
    histogramButton.addEventListener("click", showHistogram);
    comparisonButton.addEventListener("click", showComparison);
    writeupButton.addEventListener("click", showWriteup);
});


document.getElementById("dataMode").addEventListener("change", function() {
    const mode = this.value;
    const avgChart = document.getElementById("comparison-chart");
    const indChart = document.getElementById("individual-chart");
    const indContr = document.getElementById("individual-chart-controls");
    
    if (mode === "average") {
        avgChart.style.display = "block";
        indChart.style.display = "none";
        indContr.style.display = "none";
    } else {
        avgChart.style.display = "none";
        indChart.style.display = "block";
        indContr.style.display = "block";
    }
});