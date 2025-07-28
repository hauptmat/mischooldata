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

// Load a single CSV using PapaParse
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

// Load selected files and render the line chart
async function loadAndDraw() {
  const selectedYear = yearSelect.value;
  const selectedSubject = subjectSelect.value;
  const selectedDistricts = Array.from(districtSelect.selectedOptions).map(opt => opt.value);

  const filteredFiles = fileIndex.filter(file =>
    file.year === selectedYear &&
    file.subject === selectedSubject &&
    selectedDistricts.includes(file.district)
  );

  const rawData = {}; // { district: { year: % } }
  const allYears = new Set();

  for (const file of filteredFiles) {
    try {
      const rows = await loadCSV(file.filename);

      rows.forEach(row => {
        const rawYear = (row.SchoolYear || "").trim();
        if (!/^\d{4}-\d{4}$/.test(rawYear)) return;

        const percent = parseFloat(row.PercentProficient || 0);
        if (isNaN(percent)) return;

        allYears.add(rawYear);
        if (!rawData[file.district]) rawData[file.district] = {};
        rawData[file.district][rawYear] = percent;
      });
    } catch (err) {
      console.warn(`Could not load file ${file.filename}:`, err);
    }
  }

  const sortedYears = Array.from(allYears).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const datasets = Object.entries(rawData).map(([district, yearMap]) => {
    const data = sortedYears.map(year => yearMap[year] ?? null); // pad missing with null
    return {
      label: district,
      data,
      tension: 0,         // no curve
      spanGaps: false     // don't connect across nulls
    };
  });

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: sortedYears, // x-axis values
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
        },
        tooltip: {
          mode: 'nearest',
          intersect: false,
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw ?? 'No Data'}%`
          }
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
