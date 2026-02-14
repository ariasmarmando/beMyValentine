(() => {
  const stage = document.getElementById("stage");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const hint = document.getElementById("hint");

  const overlay = document.getElementById("overlay");
  const resetBtn = document.getElementById("resetBtn");

  const canvas = document.getElementById("confetti");
  const ctx = canvas ? canvas.getContext("2d") : null;

  // Views / controls inside overlay
  const celebrateView = document.getElementById("celebrateView");
  const videoView = document.getElementById("videoView");
  const countdownEl = document.getElementById("countdown");
  const playNowBtn = document.getElementById("playNowBtn");
  const closeVideoBtn = document.getElementById("closeVideoBtn");
  const resetBtn2 = document.getElementById("resetBtn2");

  // Container where we dynamically insert the iframe
  const videoContainer = document.getElementById("video-container");

  let confetti = [];
  let confettiRunning = false;

  let countdownTimer = null;
  let secondsLeft = 5;

  const YT_URL =
    "https://www.youtube.com/embed/h6gdF8ynJDo?si=6u8eji_hKLJd5Ti6";

  // ---------- helpers ----------
  function setHint(text) {
    if (hint) hint.textContent = text;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function stageRect() {
    return stage.getBoundingClientRect();
  }

  function btnRect(btn) {
    return btn.getBoundingClientRect();
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // ---------- No button dodge ----------
  function moveNoButtonAwayFrom(pointerX, pointerY) {
    const s = stageRect();
    const b = btnRect(noBtn);

    const px = pointerX - s.left;
    const py = pointerY - s.top;

    const bx = b.left - s.left + b.width / 2;
    const by = b.top - s.top + b.height / 2;

    let dx = bx - px;
    let dy = by - py;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const push = rand(70, 120);
    let newX = b.left - s.left + dx * push;
    let newY = b.top - s.top + dy * push;

    const pad = 10;
    newX = clamp(newX, pad, s.width - b.width - pad);
    newY = clamp(newY, pad, s.height - b.height - pad);

    const leftPct = (newX / s.width) * 100;
    const topPct = (newY / s.height) * 100;

    noBtn.style.left = `${leftPct}%`;
    noBtn.style.top = `${topPct}%`;

    noBtn.animate(
      [
        { transform: "translate(0,0) rotate(0deg)" },
        {
          transform: `translate(${rand(-6, 6)}px, ${rand(-6, 6)}px) rotate(${rand(-8, 8)}deg)`,
        },
        { transform: "translate(0,0) rotate(0deg)" },
      ],
      { duration: 220, easing: "ease-out" },
    );

    const messages = [
      "Nice try 😈",
      "Nope. Not today.",
      "That button is on vacation 🏖️",
      "We both know the answer 💅",
      "The universe said: ‘nah’ ✨",
      "Error 418: I’m a teapot ☕",
    ];
    setHint(messages[Math.floor(Math.random() * messages.length)]);
  }

  function attachNoDodge() {
    stage.addEventListener("mousemove", (e) => {
      const b = btnRect(noBtn);
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < 110) moveNoButtonAwayFrom(e.clientX, e.clientY);
    });

    stage.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        if (!t) return;

        const b = btnRect(noBtn);
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        const dist = Math.hypot(t.clientX - cx, t.clientY - cy);

        if (dist < 160) {
          e.preventDefault();
          moveNoButtonAwayFrom(t.clientX, t.clientY);
        }
      },
      { passive: false },
    );

    noBtn.addEventListener("focus", () => {
      const s = stageRect();
      moveNoButtonAwayFrom(s.left + s.width * 0.5, s.top + s.height * 0.5);
    });

    noBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const s = stageRect();
      moveNoButtonAwayFrom(
        s.left + s.width * rand(0.2, 0.8),
        s.top + s.height * rand(0.2, 0.8),
      );
      setHint("Absolutely not. Try the other one 😇");
    });
  }

  // ---------- Confetti ----------
  function spawnConfettiBurst(count = 160) {
    if (!ctx) return;
    const emojis = ["💖", "💘", "💕", "💗", "✨", "🌹", "🥰"];
    for (let i = 0; i < count; i++) {
      confetti.push({
        x: rand(0, window.innerWidth),
        y: rand(-40, -10),
        vx: rand(-2.2, 2.2),
        vy: rand(2.8, 7.2),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.18, 0.18),
        size: rand(14, 28),
        life: rand(110, 170),
        char: emojis[Math.floor(Math.random() * emojis.length)],
      });
    }
  }

  function tickConfetti() {
    if (!confettiRunning || !ctx) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    confetti = confetti.filter((p) => p.life > 0);
    for (const p of confetti) {
      p.life -= 1;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy += 0.03;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.char, 0, 0);
      ctx.restore();
    }

    if (confetti.length === 0) {
      confettiRunning = false;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      return;
    }

    requestAnimationFrame(tickConfetti);
  }

  // ---------- YouTube embedding ----------
  function isValidYouTubeId(id) {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  }

  function extractYouTubeId(urlOrId) {
    if (!urlOrId) return "";
    const s = String(urlOrId).trim();

    // If it's already an ID
    if (isValidYouTubeId(s)) return s;

    try {
      const url = new URL(s);

      // watch?v=ID
      const v = url.searchParams.get("v");
      if (v && isValidYouTubeId(v)) return v;

      // youtu.be/ID
      if (url.hostname.includes("youtu.be")) {
        const id = url.pathname.split("/").filter(Boolean)[0] || "";
        if (isValidYouTubeId(id)) return id;
      }

      // /embed/ID or /shorts/ID
      const parts = url.pathname.split("/").filter(Boolean);

      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        const id = parts[embedIndex + 1].slice(0, 11);
        if (isValidYouTubeId(id)) return id;
      }

      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex !== -1 && parts[shortsIndex + 1]) {
        const id = parts[shortsIndex + 1].slice(0, 11);
        if (isValidYouTubeId(id)) return id;
      }
    } catch {
      // not a URL
    }

    return "";
  }

  function stopVideo() {
    const container = document.getElementById("video-container");
    if (container) container.innerHTML = "";
  }

  function embedVideo() {
    const container = document.getElementById("video-container");
    if (!container) {
      setHint("Missing #video-container in HTML.");
      return;
    }

    // Clear previous iframe
    container.innerHTML = "";

    let src = YT_URL.trim();
    if (!src) {
      setHint("Missing YouTube embed src (YT_URL).");
      return;
    }

    src += (src.includes("?") ? "&" : "?") + "autoplay=1&playsinline=1";

    const iframe = document.createElement("iframe");
iframe.width = "100%";
iframe.height = "100%";
iframe.style.width = "100%";
iframe.style.height = "100%";
    iframe.src = src;
    iframe.title = "YouTube video player";
    iframe.frameBorder = "0";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    container.appendChild(iframe);
  }

  // ---------- Overlay views ----------
  function showCelebrateView() {
    if (videoView) videoView.hidden = true;
    if (celebrateView) celebrateView.hidden = false;
  }

  function showVideoView() {
    if (celebrateView) celebrateView.hidden = true;
    if (videoView) videoView.hidden = false;
    embedVideo();
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function startCountdown(seconds = 5) {
    stopCountdown();
    secondsLeft = seconds;
    if (countdownEl) countdownEl.textContent = String(secondsLeft);

    countdownTimer = setInterval(() => {
      secondsLeft -= 1;
      if (countdownEl)
        countdownEl.textContent = String(Math.max(0, secondsLeft));

      if (secondsLeft <= 0) {
        stopCountdown();
        showVideoView();
      }
    }, 1000);
  }

  function startCelebration() {
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    showCelebrateView();
    stopVideo();

    confettiRunning = true;
    spawnConfettiBurst(220);
    tickConfetti();

    yesBtn.animate(
      [
        { transform: "scale(1) rotate(0deg)" },
        { transform: "scale(1.06) rotate(-2deg)" },
        { transform: "scale(1.08) rotate(2deg)" },
        { transform: "scale(1.06) rotate(-2deg)" },
        { transform: "scale(1) rotate(0deg)" },
      ],
      { duration: 700, easing: "ease-in-out" },
    );

    setHint("Correct answer detected ✅");
    startCountdown(5);
  }

  function reset() {
    stopCountdown();
    stopVideo();

    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");

    showCelebrateView();
    setHint("Try choosing wisely.");

    noBtn.style.left = "62%";
    noBtn.style.top = "58%";
  }

  // ---------- wire up ----------
  if (yesBtn) yesBtn.addEventListener("click", startCelebration);
  if (resetBtn) resetBtn.addEventListener("click", reset);
  if (resetBtn2) resetBtn2.addEventListener("click", reset);

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) reset();
    });
  }

  if (playNowBtn) {
    playNowBtn.addEventListener("click", () => {
      stopCountdown();
      showVideoView();
    });
  }

  if (closeVideoBtn) {
    closeVideoBtn.addEventListener("click", () => {
      stopCountdown();
      stopVideo();
      showCelebrateView();
      startCountdown(5);
    });
  }

  attachNoDodge();
})();
