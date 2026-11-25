(async () => {
  const stateEl = document.getElementById("state");
  const contentEl = document.getElementById("content");

  showState(stateEl, "loading", "Loading your sessions…");

  let stats;
  let sessions;
  try {
    [stats, sessions] = await Promise.all([api.getStats(), api.listSessions()]);
  } catch (err) {
    showState(stateEl, "error", `Couldn't load your sessions: ${err.message}`);
    return;
  }

  if (sessions.length === 0) {
    showState(stateEl, "empty", "No sessions yet. Record a practice talk to start tracking your filler words.", {
      href: "/record",
      text: "Record your first talk",
    });
    return;
  }

  hideState(stateEl);
  contentEl.hidden = false;

  const labels = stats.trend.map((point) => formatDate(point.created_at));
  lineChart("filler-chart", labels, stats.trend.map((p) => p.filler_per_min), "Fillers / min");
  lineChart("wpm-chart", labels, stats.trend.map((p) => p.wpm), "Words / min");
  barChart(
    "top-chart",
    stats.top_fillers.map((f) => f.word),
    stats.top_fillers.map((f) => f.count),
    "Times used"
  );

  renderRows(sessions);

  function renderRows(list) {
    const tbody = document.getElementById("session-rows");
    tbody.textContent = "";
    list.forEach((s) => {
      const tr = document.createElement("tr");
      const done = s.status === "done";
      const cells = [
        formatDate(s.created_at),
        s.label || "Untitled session",
        done ? s.filler_per_min.toFixed(1) : "–",
        done ? Math.round(s.wpm) : "–",
      ];
      cells.forEach((text, i) => {
        const td = document.createElement("td");
        td.textContent = text;
        if (i >= 2) td.className = "num";
        tr.append(td);
      });
      const statusTd = document.createElement("td");
      const pill = document.createElement("span");
      pill.className = `pill pill-${s.status}`;
      pill.textContent = s.status;
      statusTd.append(pill);
      tr.append(statusTd);
      if (done) {
        tr.classList.add("clickable");
        tr.tabIndex = 0;
        const open = () => { window.location.href = `/sessions/${s.id}`; };
        tr.addEventListener("click", open);
        tr.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
      }
      tbody.append(tr);
    });
  }
})();
