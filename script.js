let chart;

// 📍 Get REAL GPS location
function getGPSLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported!");
      reject();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        alert("Location access denied! Please enable GPS.");
        reject(error);
      }
    );
  });
}

// 🌆 Get city name from coordinates
async function getCityName(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();
    return data.address.city || data.address.town || data.address.village || "Unknown";
  } catch {
    return "Unknown";
  }
}

// ☀️ NASA API
async function getNASASolarData(lat, lon) {
  try {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&start=20240101&end=20241231&format=JSON`;

    const res = await fetch(url);
    const data = await res.json();

    const values = data.properties.parameter.ALLSKY_SFC_SW_DWN;

    const avg =
      Object.values(values).reduce((a, b) => a + b, 0) /
      Object.values(values).length;

    return avg;
  } catch (err) {
    console.error(err);
    return 5;
  }
}

// 🇮🇳 ISRO-style correction
function applyISROCorrection(irradiance, lat) {
  if (lat > 20) return irradiance * 0.95;
  if (lat > 10) return irradiance * 1.05;
  return irradiance * 1.1;
}

// ⚡ MAIN
async function calculate() {
  let systemSize = parseFloat(document.getElementById("systemSize").value);
  let efficiency = parseFloat(document.getElementById("efficiency").value) / 100;
  let rate = parseFloat(document.getElementById("electricityRate").value);
  let cost = parseFloat(document.getElementById("installationCost").value);

  if (!systemSize || !efficiency || !rate || !cost) {
    alert("Please fill all fields!");
    return;
  }

  try {
    // 📍 Get GPS location
    const loc = await getGPSLocation();

    // 🌆 Get city name
    const city = await getCityName(loc.lat, loc.lon);

    // ☀️ NASA data
    let irradiance = await getNASASolarData(loc.lat, loc.lon);

    // 🇮🇳 ISRO correction
    irradiance = applyISROCorrection(irradiance, loc.lat);

    const sunlightHours = irradiance;

    const daily = systemSize * sunlightHours * efficiency;
    const monthly = daily * 30;
    const yearly = daily * 365;

    const monthlySavings = monthly * rate;
    const yearlySavings = yearly * rate;

    const payback = cost / yearlySavings;
    const battery = daily * 0.5;

    // UI Update
    document.getElementById("location").innerText =
      `${city} (${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)})`;

    document.getElementById("irradiance").innerText =
      irradiance.toFixed(2);

    document.getElementById("daily").innerText = daily.toFixed(2);
    document.getElementById("monthly").innerText = monthly.toFixed(2);
    document.getElementById("yearly").innerText = yearly.toFixed(2);

    document.getElementById("monthlySavings").innerText =
      monthlySavings.toFixed(0);

    document.getElementById("yearlySavings").innerText =
      yearlySavings.toFixed(0);

    document.getElementById("payback").innerText =
      payback.toFixed(1);

    document.getElementById("battery").innerText =
      battery.toFixed(2);

    document.getElementById("results").style.display = "block";

    renderChart(monthly);

  } catch (err) {
    console.error(err);
  }
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
        label: "Monthly Generation (kWh)",
        data: Array(12).fill(monthlyValue),
        borderColor: "orange",
        fill: false,
        tension: 0.3
      }]
    }
  });
}
