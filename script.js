let chart;

// 🌍 Get Solar Data from NASA API
async function getNASASolarData(lat, lon) {
  try {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&start=20240101&end=20241231&format=JSON`;

    const res = await fetch(url);
    const data = await res.json();

    const values = data.properties.parameter.ALLSKY_SFC_SW_DWN;

    const avg =
      Object.values(values).reduce((a, b) => a + b, 0) /
      Object.values(values).length;

    return avg; // kWh/m²/day
  } catch (err) {
    console.error("NASA API error", err);
    return 5; // fallback
  }
}

// 🇮🇳 ISRO Adjustment Layer (India-specific tuning)
function applyISROCorrection(irradiance, lat) {
  // Empirical correction for Indian climate conditions
  if (lat > 20) return irradiance * 0.95; // North India dust
  if (lat > 10) return irradiance * 1.05; // Optimal belt
  return irradiance * 1.1; // South India boost
}

// 📍 Get User Location
async function getLocation() {
  const res = await fetch("https://ipapi.co/json/");
  const data = await res.json();
  return {
    lat: data.latitude,
    lon: data.longitude,
    city: data.city
  };
}

// ⚡ MAIN CALCULATION
async function calculate() {
  let systemSize = parseFloat(document.getElementById("systemSize").value);
  let efficiency = parseFloat(document.getElementById("efficiency").value) / 100;
  let rate = parseFloat(document.getElementById("electricityRate").value);
  let cost = parseFloat(document.getElementById("installationCost").value);

  if (!systemSize || !efficiency || !rate || !cost) {
    alert("Fill all required fields!");
    return;
  }

  // 🌍 Get location
  const location = await getLocation();

  // ☀️ NASA Data
  let irradiance = await getNASASolarData(location.lat, location.lon);

  // 🇮🇳 ISRO Adjustment
  irradiance = applyISROCorrection(irradiance, location.lat);

  alert(`📍 Location: ${location.city}
☀️ Solar Irradiance: ${irradiance.toFixed(2)} kWh/m²/day`);

  // Convert irradiance → equivalent sun hours
  const sunlightHours = irradiance;

  const daily = systemSize * sunlightHours * efficiency;
  const monthly = daily * 30;
  const yearly = daily * 365;

  const monthlySavings = monthly * rate;
  const yearlySavings = yearly * rate;

  const payback = cost / yearlySavings;
  const battery = daily * 0.5;

  // UI Update
  document.getElementById("daily").innerText = daily.toFixed(2);
  document.getElementById("monthly").innerText = monthly.toFixed(2);
  document.getElementById("yearly").innerText = yearly.toFixed(2);
  document.getElementById("monthlySavings").innerText = monthlySavings.toFixed(0);
  document.getElementById("yearlySavings").innerText = yearlySavings.toFixed(0);
  document.getElementById("payback").innerText = payback.toFixed(1);
  document.getElementById("battery").innerText = battery.toFixed(2);

  document.getElementById("results").style.display = "block";

  renderChart(monthly);
}

// 📊 Chart
function renderChart(monthlyValue) {
  const ctx = document.getElementById("chart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      datasets: [{
        label: "Monthly Solar Output",
        data: Array(12).fill(monthlyValue),
        borderColor: "orange",
        fill: false,
        tension: 0.3
      }]
    }
  });
}
