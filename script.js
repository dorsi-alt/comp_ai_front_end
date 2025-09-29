// =================================================================================
// START OF THE PATCHED SCRIPT.JS (skip START on return)
// =================================================================================

let startClickSound,
  preloaderSound,
  scrollSound1,
  scrollSound2,
  scrollSound3,
  backgroundMusic;

let isBackgroundPlaying = true;
let currentSection = 1;
let isScrolling = false;
let circleTransitions = [];

const INTRO_FLAG_KEY = 'tbpIntroSeen';     // <-- remember we've started once
const BASE_URL = window.API_CONFIG?.BASE_URL || 'http://localhost:8000';  // API base

function setupGeometricBackground() {
  const gridLinesGroup = document.getElementById("grid-lines");
  const circlesOutlineGroup = document.getElementById("circles-outline");
  const circlesFilledGroup = document.querySelector("#circles-filled > g");
  if (!gridLinesGroup || !circlesOutlineGroup || !circlesFilledGroup) {
    // Not on index page – safe to skip
    return;
  }

  const gridSpacing = 48;
  for (let i = 0; i <= 40; i++) {
    const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    vLine.setAttribute("class", "grid-line");
    vLine.setAttribute("x1", i * gridSpacing);
    vLine.setAttribute("y1", 0);
    vLine.setAttribute("x2", i * gridSpacing);
    vLine.setAttribute("y2", 1080);
    gridLinesGroup.appendChild(vLine);

    if (i <= 22) {
      const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hLine.setAttribute("class", "grid-line");
      hLine.setAttribute("x1", 0);
      hLine.setAttribute("y1", i * gridSpacing);
      hLine.setAttribute("x2", 1920);
      hLine.setAttribute("y2", i * gridSpacing);
      gridLinesGroup.appendChild(hLine);
    }
  }

  const d = 80;
  const centerX = 960;
  const centerY = 540;

  circleTransitions = [
    { initial: { cx: centerX - 3 * d, cy: centerY, r: d * 0.8 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX + 3 * d, cy: centerY, r: d * 0.8 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX, cy: centerY - 3 * d, r: d * 0.8 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX, cy: centerY + 3 * d, r: d * 0.8 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX - 2 * d, cy: centerY - 2 * d, r: d * 0.6 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX + 2 * d, cy: centerY - 2 * d, r: d * 0.6 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX - 2 * d, cy: centerY + 2 * d, r: d * 0.6 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX + 2 * d, cy: centerY + 2 * d, r: d * 0.6 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX - 4 * d, cy: centerY, r: d * 0.4 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX + 4 * d, cy: centerY, r: d * 0.4 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX, cy: centerY - 4 * d, r: d * 0.4 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX, cy: centerY + 4 * d, r: d * 0.4 }, final: { cx: centerX, cy: centerY, r: 4 * d } },
    { initial: { cx: centerX, cy: centerY, r: d * 0.3 }, final: { cx: centerX, cy: centerY, r: 4 * d } }
  ];

  circleTransitions.forEach((transition) => {
    const circleOutline = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleOutline.setAttribute("class", "circle-outline");
    circleOutline.setAttribute("cx", transition.initial.cx);
    circleOutline.setAttribute("cy", transition.initial.cy);
    circleOutline.setAttribute("r", transition.initial.r);
    circlesOutlineGroup.appendChild(circleOutline);

    const circleFilled = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleFilled.setAttribute("class", "circle-filled");
    circleFilled.setAttribute("cx", transition.initial.cx);
    circleFilled.setAttribute("cy", transition.initial.cy);
    circleFilled.setAttribute("r", transition.initial.r);
    circlesFilledGroup.appendChild(circleFilled);

    transition.outlineCircle = circleOutline;
    transition.filledCircle = circleFilled;
  });
}

/* ------------------------------ Boot Helpers ------------------------------ */

function bootMainPage(skipIntro = false) {
  // grab audio refs if present
  startClickSound = document.getElementById("startClickSound");
  preloaderSound = document.getElementById("preloaderSound");
  backgroundMusic = document.getElementById("backgroundMusic");
  scrollSound1 = document.getElementById("scrollSound1");
  scrollSound2 = document.getElementById("scrollSound2");
  scrollSound3 = document.getElementById("scrollSound3");

  const overlay = document.querySelector(".audio-enable");
  const preloader = document.getElementById("preloader");

  if (skipIntro) {
    if (overlay) overlay.style.display = "none";
    if (preloader) preloader.style.display = "none";
    if (backgroundMusic) {
      backgroundMusic.volume = 0.5;
      // Don’t autoplay if user had Sound OFF last time
      if (isBackgroundPlaying) backgroundMusic.play().catch(() => {});
    }
    setupGeometricBackground();
    startAnimations();
    setupSectionScrollSounds();
    return;
  }

  // normal first-time flow continues to be handled by Start button
}

function finishIntroAndStart() {
  if (preloaderSound) {
    preloaderSound.pause();
    preloaderSound.currentTime = 0;
  }
  document.body.classList.remove("loading-active");

  const preloader = document.getElementById("preloader");
  if (preloader) {
    gsap.to(preloader, { opacity: 0, duration: 0.5, onComplete: () => (preloader.style.display = "none") });
  }

  const authContainer = document.getElementById("authContainer");
  if (authContainer) {
    // login page
    gsap.to(authContainer, { opacity: 1, duration: 1, delay: 0.5, onStart: () => (authContainer.style.pointerEvents = "auto") });
  } else {
    // index page
    setupGeometricBackground();
    startAnimations();
    setupSectionScrollSounds();
  }

  // remember we've completed the intro once
  try { localStorage.setItem(INTRO_FLAG_KEY, '1'); } catch (_) {}
}

/* ------------------------------ Sounds Toggle ----------------------------- */
function setupSoundToggle() {
  const soundLink = document.getElementById("soundToggle");
  if (!soundLink) return;
  function updateLabel() {
    soundLink.textContent = isBackgroundPlaying ? "SOUND: ON" : "SOUND: OFF";
  }
  updateLabel();
  soundLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (!backgroundMusic) return;
    if (isBackgroundPlaying) {
      backgroundMusic.pause();
      isBackgroundPlaying = false;
    } else {
      backgroundMusic.play().catch(() => {});
      isBackgroundPlaying = true;
    }
    updateLabel();
  });
}

/* ---------------------------- API helpers --------------------------------- */
async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `GET ${path} failed`);
  return data;
}
async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `POST ${path} failed`);
  return data;
}

/* ----------------------- Section scroll sounds ---------------------------- */
function setupSectionScrollSounds() {
  if (!scrollSound1) return;
  const soundMap = { 1: scrollSound1, 2: scrollSound2, 3: scrollSound3 };

  let scrollTimeout;
  function getCurrentSection() {
    const scrollY = window.scrollY;
    const sectionHeight = window.innerHeight * 2;
    if (scrollY < sectionHeight) return 1;
    else if (scrollY < sectionHeight * 2) return 2;
    else return 3;
  }
  function stopAllScrollSounds() {
    Object.values(soundMap).forEach((sound) => {
      if (sound && !sound.paused) {
        sound.pause();
        sound.currentTime = 0;
      }
    });
  }

  window.addEventListener("scroll", () => {
    const newSection = getCurrentSection();
    isScrolling = true;
    if (newSection !== currentSection) {
      stopAllScrollSounds();
      currentSection = newSection;
    }
    const currentScrollSound = soundMap[currentSection];
    if (currentScrollSound && currentScrollSound.paused) {
      currentScrollSound.currentTime = 0;
      currentScrollSound.play().catch(() => {});
    }
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      stopAllScrollSounds();
      isScrolling = false;
    }, 150);
  });
}

/* ----------------------------- Animations --------------------------------- */
function startAnimations() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll(".main-nav li").forEach((navItem) => {
    const square = navItem.querySelector(".nav-hover-square");
    const hoverSound = document.getElementById("hoverSound");
    navItem.addEventListener("mouseenter", () => {
      gsap.to(square, { scaleX: 1, duration: 0.3, ease: "power2.out" });
      if (hoverSound) {
        hoverSound.currentTime = 0;
        hoverSound.volume = 0.3;
        hoverSound.play().catch(() => {});
      }
    });
    navItem.addEventListener("mouseleave", () => {
      gsap.to(square, { scaleX: 0, duration: 0.2, ease: "power2.in" });
    });
  });

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  gsap.to(".gradient-reveal", { y: "-500vh", duration: 2, ease: "power2.inOut", delay: 0.25 });

  gsap.utils.toArray(".section").forEach((section) => {
    gsap.to(section, {
      backgroundPositionY: "50%",
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1 },
    });
  });

  const circle = document.getElementById("glowCircle");
  const debugLine1 = document.getElementById("debugLine1");
  const debugLine2 = document.getElementById("debugLine2");
  const debugLine3 = document.getElementById("debugLine3");
  const debugLine4 = document.getElementById("debugLine4");
  if (!circle) return;

  let animationFrame;
  function updateAnimations() {
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const progress = Math.min(scrollY / maxScroll, 1);

    const footerStartEl = document.querySelector(".site-footer");
    if (!footerStartEl) return;

    const footerStart = footerStartEl.offsetTop - window.innerHeight;
    const footerProgress = Math.max(0, (scrollY - footerStart) / (window.innerHeight * 0.5));
    const textOpacity = Math.max(0, 1 - footerProgress * 2);
    document.querySelectorAll(".geometric-text").forEach((text) => (text.style.opacity = textOpacity));

    const freq1 = (432 + progress * 108).toFixed(1);
    const freq2 = (528 - progress * 156).toFixed(1);
    const energy = (progress * 99.9).toFixed(1);
    const presence = ((1 - progress) * 100).toFixed(1);

    let awarenessState, becomingState, energyState, presenceState;
    if (progress <= 0.1) {
      awarenessState = `[${freq1}] AWARENESS: SILENCE`;
      becomingState = `.${freq2} STATE: VOID`;
      energyState = `{${energy}} ENERGY: DORMANT`;
    } else if (progress <= 0.25) {
      awarenessState = `[${freq1}] AWARENESS: STIRRING`;
      becomingState = `.${freq2} STATE: EMERGING`;
      energyState = `{${energy}} ENERGY: AWAKENING`;
    } else if (progress <= 0.5) {
      awarenessState = `[${freq1}] AWARENESS: FLOWING`;
      becomingState = `.${freq2} STATE: EXPANDING`;
      energyState = `{${energy}} ENERGY: BUILDING`;
    } else if (progress <= 0.75) {
      awarenessState = `[${freq1}] AWARENESS: ASCENDING`;
      becomingState = `.${freq2} STATE: DISSOLVING`;
      energyState = `{${energy}} ENERGY: RADIATING`;
    } else if (progress <= 0.9) {
      awarenessState = `[${freq1}] AWARENESS: TRANSCENDING`;
      becomingState = `.${freq2} STATE: INFINITE`;
      energyState = `{${energy}} ENERGY: OVERFLOWING`;
    } else {
      awarenessState = `[${freq1}] AWARENESS: UNITY`;
      becomingState = `.${freq2} STATE: ETERNAL`;
      energyState = `{${energy}} ENERGY: PURE`;
    }

    const presenceIntensity = Math.max(0, 1 - progress);
    if (presenceIntensity > 0.8) {
      presenceState = `.${presence} PRESENCE: SOLID`;
    } else if (presenceIntensity > 0.6) {
      presenceState = `.${presence} PRESENCE: SOFTENING`;
    } else if (presenceIntensity > 0.4) {
      presenceState = `.${presence} PRESENCE: TRANSLUCENT`;
    } else if (presenceIntensity > 0.2) {
      presenceState = `.${presence} PRESENCE: ETHEREAL`;
    } else {
      presenceState = `.${presence} PRESENCE: VOID`;
    }

    const scale = 1 + progress * 1.8;
    const shadowSize = progress * 150;
    const shadowSpread = progress * 35;
    const shadowOpacity = progress;
    circle.style.transform = `scale(${scale})`;
    circle.style.boxShadow = `0 0 ${shadowSize}px ${shadowSpread}px rgba(255, 255, 0, ${shadowOpacity})`;

    const gridOpacity = Math.max(0, 0.3 * (1 - progress * 1.5));
    document.querySelectorAll(".grid-line").forEach((line) => {
      line.setAttribute("stroke-opacity", gridOpacity);
    });

    circleTransitions.forEach((transition, index) => {
      const currentCx = transition.initial.cx + (transition.final.cx - transition.initial.cx) * progress;
      const currentCy = transition.initial.cy + (transition.final.cy - transition.initial.cy) * progress;
      const currentR = transition.initial.r + (transition.final.r - transition.initial.r) * progress;
      const rotation = progress * 360 * (index % 2 === 0 ? 1 : -1);
      const opacity = Math.max(0.1, 1 - progress * 0.7);

      if (transition.outlineCircle) {
        transition.outlineCircle.setAttribute("cx", currentCx);
        transition.outlineCircle.setAttribute("cy", currentCy);
        transition.outlineCircle.setAttribute("r", currentR);
        transition.outlineCircle.setAttribute("transform", `rotate(${rotation} ${currentCx} ${currentCy})`);
        transition.outlineCircle.setAttribute("stroke-opacity", opacity);
      }
      if (transition.filledCircle) {
        transition.filledCircle.setAttribute("cx", currentCx);
        transition.filledCircle.setAttribute("cy", currentCy);
        transition.filledCircle.setAttribute("r", currentR);
        transition.filledCircle.setAttribute("transform", `rotate(${rotation} ${currentCx} ${currentCy})`);
        transition.filledCircle.setAttribute("fill-opacity", opacity * 0.05);
      }
    });

    if (debugLine1) debugLine1.textContent = awarenessState;
    if (debugLine2) debugLine2.textContent = becomingState;
    if (debugLine3) debugLine3.textContent = energyState;
    if (debugLine4) debugLine4.textContent = presenceState;
  }

  window.addEventListener("scroll", () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(updateAnimations);
  });
  updateAnimations();
}

/* ----------------------------- DOM Ready ---------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  setupSoundToggle();

  // Wallet modal bindings
  const walletBtn = document.querySelector(".contact-badge");
  const walletClose = document.getElementById("walletClose");
  const walletForm = document.getElementById("walletForm");

  function openWalletModal() {
    const modal = document.getElementById("walletModal");
    if (modal) modal.style.display = "flex";
  }
  function closeWalletModal() {
    const modal = document.getElementById("walletModal");
    if (modal) modal.style.display = "none";
  }

  if (walletBtn) {
    walletBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openWalletModal();
    });
  }
  if (walletClose) walletClose.addEventListener("click", closeWalletModal);

  if (walletForm) {
    const input = document.getElementById("walletInput");
    const submit = document.getElementById("walletSubmit");
    const btnText = submit ? submit.querySelector(".btn-text") : null;
    const loader = submit ? submit.querySelector(".loader") : null;
    const feedback = document.getElementById("walletFeedback");
    function setLoading(flag, text) {
      if (!submit || !btnText || !loader) return;
      submit.disabled = flag;
      btnText.textContent = text || "Continue";
      if (flag) loader.classList.remove("hidden");
      else loader.classList.add("hidden");
    }
    walletForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const wallet = (input?.value || "").trim();
      if (!wallet) return;
      setLoading(true, "Checking...");
      feedback.textContent = "";
      try {
        const existsResp = await apiGet(`/users/${encodeURIComponent(wallet)}/exists`);
        if (existsResp.exists) {
          feedback.innerHTML = `<div class="feedback-message success">Welcome back. Account found for ${wallet}.</div>`;
          setLoading(false, "Continue");
          closeWalletModal();
        } else {
          setLoading(true, "Creating...");
          await apiPost("/users", { username: wallet });
          feedback.innerHTML = `<div class="feedback-message success">Account created for ${wallet}.</div>`;
          setLoading(false, "Continue");
          closeWalletModal();
        }
      } catch (err) {
        feedback.innerHTML = `<div class="feedback-message error">${err.message}</div>`;
        setLoading(false, "Continue");
      }
    });
  }

  // Smooth-scroll only for hash links in the main nav (except sound toggle)
  document.querySelectorAll(".main-nav a.glass-card").forEach((link) => {
    if (link.id === "soundToggle") return;
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Read progress (only exists on main page section-3)
  function updateProgress() {
    const section = document.querySelector(".section-3");
    const progress = document.getElementById("readProgress");
    const thumb = document.getElementById("readThumb");
    if (!section || !progress || !thumb) return;
    const rect = section.getBoundingClientRect();
    const viewH = window.innerHeight;
    const visible = rect.top < viewH && rect.bottom > 0;
    if (!visible) return;
    const total = rect.height + viewH;
    const scrolled = Math.min(Math.max(viewH - rect.top, 0), total);
    const ratio = scrolled / total;
    const trackH = progress.clientHeight - thumb.clientHeight;
    thumb.style.transform = `translateY(${trackH * ratio}px)`;
  }
  window.addEventListener("scroll", updateProgress);
  window.addEventListener("resize", updateProgress);
  updateProgress();

  // ---------- Intro overlay behavior ----------
  const audioOverlay = document.querySelector(".audio-enable");
  const enableBtn = document.getElementById("enableBtn");

  // If overlay exists AND we've already started once, skip intro immediately
  const introSeen = (() => {
    try { return localStorage.getItem(INTRO_FLAG_KEY) === '1'; } catch (_) { return false; }
  })();

  if (audioOverlay) {
    if (introSeen) {
      bootMainPage(true); // no overlay, no preloader, just start
    } else if (enableBtn) {
      enableBtn.onclick = function () {
        document.body.classList.add("loading-active");
        startClickSound = document.getElementById("startClickSound");
        preloaderSound = document.getElementById("preloaderSound");
        backgroundMusic = document.getElementById("backgroundMusic");
        scrollSound1 = document.getElementById("scrollSound1");
        scrollSound2 = document.getElementById("scrollSound2");
        scrollSound3 = document.getElementById("scrollSound3");

        if (startClickSound) startClickSound.play().catch(() => {});
        audioOverlay.style.display = "none";

        const preloader = document.getElementById("preloader");
        if (preloader) preloader.style.display = "flex";
        if (preloaderSound) preloaderSound.play().catch(() => {});

        setTimeout(() => {
          if (backgroundMusic) {
            backgroundMusic.volume = 0.5;
            backgroundMusic.play().catch(() => {});
          }
        }, 500);

        let count = 0;
        const timer = setInterval(() => {
          count++;
          const counterEl = document.getElementById("counter");
          if (counterEl) counterEl.textContent = `[${count.toString().padStart(3, "0")}]`;
          if (count >= 100) {
            clearInterval(timer);
            setTimeout(finishIntroAndStart, 500);
          }
        }, 50);
      };
    }
  } else {
    // Not on index (e.g., internal tools page) — nothing to do
  }
});

// =================================================================================
// END OF THE PATCHED SCRIPT.JS
// =================================================================================
