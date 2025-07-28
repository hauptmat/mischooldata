const yearSelect = document.getElementById("yearSelect");
const districtSelect = document.getElementById("districtSelect");
const subjectSelect = document.getElementById("subjectSelect");
const chartCanvas = document.getElementById("scoreChart");

let chart;

// ---- Static: This should reflect your actual files ----
const fileList = [
  "2018-2019_Waterford_School_District_ELA.csv",
  "2018-2019_Waterford_School_District_Mathematics.csv",
  "2018-2019_West_Bloomfield_School_District_ELA.csv",
  "2018-2019_West_Bloomfield_School_District_Mathematics.csv",
  "2019-2020_Academy_of_Southfield_ELA.csv",
  "2019-2020_Academy_of_Southfield_Mathematics.csv",
  "2019-2020_Academy_of_Waterford_ELA.csv",
  "2019-2020_Academy_of_Waterford_Mathematics.csv",
  "2019-2020_AGBU_Alex_Marie_Manoogian_School_ELA.csv",
  "2019-2020_AGBU_Alex_Marie_Manoogian_School_Mathematics.csv"
  // Add more as needed
];

// ---- Parse filenames into metadata ----
const getOptions = () => {
  const years = new Set();
  const districts = new Set();

  fileList.forEach(name => {
    const [year, ...rest] = name.replace(".csv", "").split("_");
    const subject = rest.pop();
    const district = rest.join(" ");
    years.add(year);
    districts.add(district);
  });

  return {
    years: Array.from(years).sort(),
    districts: Array.from(districts).sort()
  };
};

// ---- Populate dropdowns ----
const populateSelectors = () => {
  const { years, districts } = getOptions();

  yearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join("");
  districtSelect.innerHTML = districts.map(d => `<option value="${d}">${d}</option>`).join("");
};

const filePathFor = (year, district, subject) => {
  const safeName = `${year}_${district.replace(/ /g, "_")}_${subject}.csv`;
  return `data/${safeName}`;
};

const loadCSV = async (path) => {
  return new Promise((resolve, reject) => {
    Papa.parse(path, {
      download: true,
      header: true,
      complete: (result) => resolve(result.data),
      error: (err) => reject(err)
    });
  });
};

const loadAndDraw = async () => {
  const year = yearSelect.value;
  const subject = subjectSelect.value;
  const selectedDistricts = Array.from(districtSelect.selectedOptions).map(o => o.value);

  const datasets = [];
  const labelsSet = new Set();

  for (const district of selectedDistricts) {
    const path = filePathFor(year, district, subject);

    try {
      const rows = await loadCSV(path);
      const points = rows.map(row => ({
        x: row.SchoolYear,
        y: parseFloat(row.PercentProficient || 0)
      })).filter(p => !isNaN(p.y));

      points.forEach(p => labelsSet.add(p.x));

      datasets.push({
        label: district,
        data: points,
        tension: 0.2
      });

    } catch (err) {
      console.warn(`File not found: ${path}`);
    }
  }

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: Array.from(labelsSet).sort(),
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `% Proficient in ${subject}`
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '% Proficient' }
        },
        x: {
          title: { display: true, text: 'School Year' }
        }
      }
    }
  });
};

populateSelectors();
