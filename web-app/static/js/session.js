(async () => {
  const root = document.getElementById("session");
  const id = root.dataset.sessionId;
  const stateEl = document.getElementById("state");
  const contentEl = document.getElementById("content");

  showState(stateEl, "loading", "Loading session…");

  let s;
  try {
    s = await api.getSession(id);
  } catch (err) {
    const msg = err.status === 404 ? "This session doesn't exist." : `Couldn't load this session: ${err.message}`;
    showState(stateEl, "error", msg, { href: "/", text: "Back to dashboard" });
    return;
  }
  if (s.status === "pending" || s.status === "processing") {
    showState(stateEl, "loading", "This session is still being analyzed. Reload in a few seconds.");
    return;
  }
  if (s.status === "error") {
    showState(stateEl, "error", `Analysis failed: ${s.error || "unknown error"}`, { href: "/record", text: "Record again" });
    return;
  }
  hideState(stateEl);
  contentEl.hidden = false;

  document.getElementById("session-title").textContent = s.label || formatDate(s.created_at);
  document.getElementById("stat-fpm").textContent = s.filler_per_min.toFixed(1);
  document.getElementById("stat-total").textContent = s.filler_total;
  document.getElementById("stat-wpm").textContent = Math.round(s.wpm);
  document.getElementById("stat-duration").textContent = formatDuration(s.duration_sec);

  renderTranscript(s.words, s.pauses);
  const entries = Object.entries(s.filler_counts).sort((a, b) => b[1] - a[1]);
  if (entries.length > 0) {
    barChart("filler-bars", entries.map((e) => e[0]), entries.map((e) => e[1]), "Times used");
  } else {
    const canvas = document.getElementById("filler-bars");
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No filler words in this session.";
    canvas.parentElement.replaceWith(p);
  }
  function renderTranscript(words, pauses) {
    const el = document.getElementById("transcript");
    el.textContent = "";
    const sortedPauses = [...pauses].sort((a, b) => a.start - b.start);
    let p = 0;
    words.forEach((w) => {
      const span = document.createElement("span");
      span.textContent = w.word.trim();
      if (w.is_filler) span.className = "filler";
      el.append(span, " ");
      while (p < sortedPauses.length && sortedPauses[p].start <= w.end + 0.05) {
        const mark = document.createElement("span");
        mark.className = "pause";
        mark.textContent = `⏸ ${sortedPauses[p].duration.toFixed(1)}s`;
        el.append(mark, " ");
        p += 1;
      }
    });
  }
})();