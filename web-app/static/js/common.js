const USE_MOCKS = true;
const MOCK_SESSION_ID = "6650a1f2c3d4e5f6a7b8c9d0";

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(res.status === 404 ? "Not found" : `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const api = {
  async createSession(blob, filename) {
    if (USE_MOCKS) return { id: MOCK_SESSION_ID };
    const form = new FormData();
    form.append("audio", blob, filename);
    const res = await fetch("/api/sessions", { method: "POST", body: form });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return res.json();
  },

  getSession(id) {
    return getJSON(USE_MOCKS ? "/static/mock/session.json" : `/api/sessions/${id}`);
  },

  listSessions() {
    return getJSON(USE_MOCKS ? "/static/mock/sessions.json" : "/api/sessions");
  },

  getStats() {
    return getJSON(USE_MOCKS ? "/static/mock/stats.json" : "/api/stats");
  },
};

function showState(el, kind, message, link) {
  el.hidden = false;
  el.className = `state state-${kind}`;
  el.textContent = "";
  const p = document.createElement("p");
  p.textContent = message;
  el.append(p);
  if (link) {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.text;
    a.className = "btn btn-primary";
    el.append(a);
  }
}

function hideState(el) {
  el.hidden = true;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds) {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: cssVar("--muted") } },
      y: { beginAtZero: true, grid: { color: cssVar("--grid") }, ticks: { color: cssVar("--muted") } },
    },
  };
}

function lineChart(canvasId, labels, values, label) {
  return new Chart(document.getElementById(canvasId), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: cssVar("--accent"),
        backgroundColor: cssVar("--accent"),
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.25,
      }],
    },
    options: baseOptions(),
  });
}

function barChart(canvasId, labels, values, label) {
  const options = baseOptions();
  options.indexAxis = "y";
  options.scales = {
    x: { beginAtZero: true, grid: { color: cssVar("--grid") }, ticks: { color: cssVar("--muted"), precision: 0 } },
    y: { grid: { display: false }, ticks: { color: cssVar("--text") } },
  };
  return new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label, data: values, backgroundColor: cssVar("--filler"), borderRadius: 4 }],
    },
    options,
  });
}