function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;
    
    document.getElementById('clock').textContent = currentTime;
}

// Display and update the clock every second
setInterval(updateClock, 1000);
updateClock();

// Function to fetch and display CSV data
async function fetchCSV(filepath) {
    try {
        const response = await fetch(filepath);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.text();
        displayCSVData(data)
    } catch (error) {
        console.error('Error fetching the CSV file:', error);
    }
}

// Function to display CSV data
function displayCSVData(csvData) {
    const rows = csvData.split('\n');
    const table = document.createElement('table');
    
    rows.slice(0, 10).forEach(row => {
        const tr = document.createElement('tr');
        const cells = row.split(',');
        
        cells.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        
        table.appendChild(tr);
    });
    
    document.getElementById('csv-container').innerHTML = ''; // Clear previous content
    document.getElementById('csv-container').appendChild(table); // Append new table
}

// Call the fetchCSV function to load data
csvData = fetchCSV("../assets/data/fem_act.csv");
displayCSVData(csvData);
