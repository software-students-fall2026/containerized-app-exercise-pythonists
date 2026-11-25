(() => {
  const btn = document.getElementById("record-btn");
  const timerEl = document.getElementById("timer");
  const statusEl = document.getElementById("status");
  const MIME = ["audio/webm", "audio/mp4"].find(
    (type) => window.MediaRecorder && MediaRecorder.isTypeSupported(type)
  );
  const POLL_MS = 2000;
  const MAX_POLLS = 90; 
  const MIN_SECONDS = 3;

  let recorder = null;
  let chunks = [];
  let startedAt = 0;
  let timerId = null;

  function setStatus(text, kind = "") {
    statusEl.textContent = text;
    statusEl.className = `status ${kind}`;
  }

  function reset() {
    btn.disabled = false;
    btn.textContent = "Start recording";
    btn.classList.remove("recording");
    timerEl.textContent = "0:00";
  }

  function fail(message) {
    setStatus(message, "error");
    reset();
  }

  async function start() {
    if (!MIME || !navigator.mediaDevices) {
      fail("This browser can't record audio. Use a current version of Chrome or Safari.");
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (err.name === "NotAllowedError") {
        fail("Microphone access is blocked. Allow it in your browser's site settings, then reload the page.");
      } else if (err.name === "NotFoundError") {
        fail("No microphone found. Connect one and try again.");
      } else {
        fail(`Couldn't open the microphone: ${err.message}`);
      }
      return;
    }

    chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: MIME });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = upload;
    recorder.start();
    startedAt = Date.now();
    timerId = setInterval(() => {
      timerEl.textContent = formatDuration((Date.now() - startedAt) / 1000);
    }, 250);
    btn.textContent = "Stop and analyze";
    btn.classList.add("recording");
    setStatus("Recording…");
  }

  function stop() {
    clearInterval(timerId);
    recorder.stop(); // fires onstop -> upload()
    recorder.stream.getTracks().forEach((track) => track.stop()); // release the mic
    btn.disabled = true;
    btn.classList.remove("recording");
  }

  async function upload() {
    const seconds = (Date.now() - startedAt) / 1000;
    if (seconds < MIN_SECONDS) {
      fail(`That was under ${MIN_SECONDS} seconds. Record a little longer.`);
      return;
    }
    const blob = new Blob(chunks, { type: MIME });
    const filename = MIME === "audio/mp4" ? "talk.mp4" : "talk.webm";
    setStatus("Uploading…");
    try {
      const { id } = await api.createSession(blob, filename);
      setStatus("Transcribing and counting filler words…");
      poll(id, 0);
    } catch (err) {
      fail(`Upload failed: ${err.message}`);
    }
  }

  async function poll(id, attempt) {
    if (attempt >= MAX_POLLS) {
      fail("Analysis is taking too long. Check the dashboard in a few minutes.");
      return;
    }
    try {
      const session = await api.getSession(id);
      if (session.status === "done") {
        window.location.href = `/sessions/${id}`;
        return;
      }
      if (session.status === "error") {
        fail(`Analysis failed: ${session.error || "unknown error"}`);
        return;
      }
    } catch (err) {
    }
    setTimeout(() => poll(id, attempt + 1), POLL_MS);
  }

  btn.addEventListener("click", () => {
    if (recorder && recorder.state === "recording") {
      stop();
    } else {
      start();
    }
  });
})();
