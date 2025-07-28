const yearSelect = document.getElementById("yearSelect");
const districtSelect = document.getElementById("districtSelect");
const subjectSelect = document.getElementById("subjectSelect");
const chartCanvas = document.getElementById("scoreChart");

let chart;
let fileIndex = [];

// Fetch and store file metadata
fetch('data/files.json')
  .then(res => res.json())
  .then(data => {
    fileIndex = data;
    populateSelectors();
  })
  .catch(err => {
    console.error("Failed to load files.json:", err);
  });

// Build dropdowns dynamically
function populateSelectors() {
  const years = new Set();
  const districts = new Set();

  fileIndex.forEach(entry => {
    years.add(entry.year);
    districts.add(entry.district);
  });

  yearSelect.innerHTML = [...years]
    .sort()
    .map(year => `<option value="${year}">${year}</option>`)
    .join("");

  districtSelect.innerHTML = [...districts]
    .sort()
    .map(d => `<option value="${d}">${d}</option>`)
    .join("");
}

function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    Papa.parse(`data/${filePath}`, {
      download: true,
      header: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err)
    });
  });
}

async function loadAndDraw() {
  const selectedYear = yearSelect.value;
  const selectedSubject = subjectSelect.value;
  const selectedDistricts = Array.from(districtSelect.selectedOptions).map(opt => opt.value);

  const filteredFiles = fileIndex.filter(file =>
    file.year === selectedYear &&
    file.subject === selectedSubject &&
    selectedDistricts.includes(file.district)
  );

  const datasets = [];
  const schoolYearLabels = new Set();

  for (const file of filteredFiles) {
    try {
      const rows = await loadCSV(file.filename);

      const points = rows.map(row => {
        const x = row.SchoolYear;
        const y = parseFloat(row.PercentProficient || 0);
        if (!isNaN(y)) {
          schoolYearLabels.add(x);
          return { x, y };
        }
        return null;
      }).filter(Boolean);

      datasets.push({
        label: file.district,
        data: points,
        tension: 0.3
      });

    } catch (err) {
      console.warn(`Could not load file ${file.filename}:`, err);
    }
  }

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: Array.from(schoolYearLabels).sort(),
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `% Proficient in ${selectedSubject}`
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '% Proficient'
          }
        },
        x: {
          title: {
            display: true,
            text: 'School Year'
          }
        }
      }
    }
  });
}
