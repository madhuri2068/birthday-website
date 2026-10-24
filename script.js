/* =========================================
   JASNEHH'S BIRTHDAY WEBSITE
   COMPLETE JAVASCRIPT
   ========================================= */

const correctPassword = "bhakk";

const stage = document.getElementById("stage");
const lights = document.getElementById("lights");

const passwordScreen = document.getElementById("passwordScreen");
const cakeScreen = document.getElementById("cakeScreen");
const birthdayScreen = document.getElementById("birthdayScreen");

const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");
const togglePassword = document.getElementById("togglePassword");
const unlockButton = document.getElementById("unlockButton");

const candle = document.getElementById("candle");
const smoke = document.getElementById("smoke");
const instruction = document.getElementById("instruction");
const subhint = document.getElementById("subhint");

let stream = null;
let audioContext = null;
let animationFrame = null;
let listening = false;
let blown = false;
let requestingMicrophone = false;

/* =========================================
   CREATE FAIRY LIGHTS
   ========================================= */

function addBulb(x, y, delay) {
  const bulb = document.createElement("i");

  bulb.className = "bulb";
  bulb.style.left = `${x}%`;
  bulb.style.top = `${y}%`;
  bulb.style.setProperty("--delay", `${delay}s`);

  lights.appendChild(bulb);
}

for (let i = 0; i < 10; i++) {
  const x = 5 + i * 10;

  addBulb(x, 4, (i % 5) * 0.23);
  addBulb(x, 96, (i % 4) * 0.31);
}

for (let i = 0; i < 11; i++) {
  const y = 9 + i * 8.2;

  addBulb(3.5, y, (i % 4) * 0.29);
  addBulb(96.5, y, (i % 5) * 0.22);
}

/* =========================================
   SCREEN TRANSITIONS
   ========================================= */

function showScreen(target) {
  [passwordScreen, cakeScreen, birthdayScreen, nextScreen].forEach(screen => {
    const active = screen === target;

    screen.classList.toggle("active", active);
    screen.setAttribute("aria-hidden", String(!active));
  });

  lights.style.display =
    target === birthdayScreen || target === nextScreen
      ? "none"
      : "block";
}

/* =========================================
   SHOW / HIDE PASSWORD
   ========================================= */

togglePassword.addEventListener("click", () => {
  const hidden = passwordInput.type === "password";

  passwordInput.type = hidden ? "text" : "password";
  togglePassword.textContent = hidden ? "◉" : "⊘";

  togglePassword.setAttribute(
    "aria-label",
    hidden ? "Hide password" : "Show password"
  );

  passwordInput.focus();
});

/* =========================================
   PASSWORD + MICROPHONE ACCESS
   ========================================= */

passwordForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (requestingMicrophone || listening || blown) {
    return;
  }

  if (passwordInput.value.trim() !== correctPassword) {
    passwordError.textContent =
      "Oops! That's not the secret password. Try again ♡";

    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  passwordError.textContent = "";

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    passwordError.textContent =
      "Please open this website using HTTPS or VS Code Live Server.";
    return;
  }

  requestingMicrophone = true;
  unlockButton.disabled = true;
  unlockButton.textContent = "One moment... ♡";

  try {
    // Ask for microphone permission after Unlock is clicked.
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    await audioContext.resume();

    showScreen(cakeScreen);

    instruction.textContent = "Make a wish and blow! 💨";
    subhint.textContent =
      "Blow gently toward your microphone ✨";

    startBlowDetection();

  } catch (error) {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    if (audioContext) {
      await audioContext.close().catch(() => {});
      audioContext = null;
    }

    passwordError.textContent =
      "Please allow microphone access, then click Unlock again ♡";

  } finally {
    requestingMicrophone = false;
    unlockButton.disabled = false;
    unlockButton.innerHTML = 'Unlock <span>♥</span>';
  }
});

/* =========================================
   AUTOMATIC BLOW DETECTION
   ========================================= */

function startBlowDetection() {
  if (
    listening ||
    blown ||
    !stream ||
    !stream.active ||
    !audioContext
  ) {
    return;
  }

  const source =
    audioContext.createMediaStreamSource(stream);

  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 1024;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);

  listening = true;

  let frames = 0;
  let total = 0;
  let baseline = 0;
  let blowFrames = 0;

  function detectBlow() {
    if (blown || !listening) return;

    analyser.getByteTimeDomainData(data);

    let sum = 0;

    for (let i = 0; i < data.length; i++) {
      const value = (data[i] - 128) / 128;
      sum += value * value;
    }

    const volume = Math.sqrt(sum / data.length);

    // Measure background sound at the beginning.
    if (frames < 22) {
      total += volume;
      frames++;
      baseline = total / frames;

    } else {
      const threshold = Math.max(
        0.045,
        baseline * 2.25
      );

      if (volume > threshold) {
        blowFrames++;
      } else {
        blowFrames = Math.max(0, blowFrames - 1);
      }

      if (blowFrames >= 4) {
        extinguishCandle();
        return;
      }
    }

    animationFrame = requestAnimationFrame(detectBlow);
  }

  detectBlow();
}

/* =========================================
   EXTINGUISH CANDLE
   ========================================= */

function extinguishCandle() {
  if (blown) return;

  blown = true;
  listening = false;

  candle.classList.add("off");
  smoke.style.opacity = "1";

  instruction.textContent = "Wish made ✨";
  subhint.textContent = "";

  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  // Stop microphone access after blowing the candle.
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }

  // Show the scrapbook reveal after a short pause.
  setTimeout(() => {
    showScreen(birthdayScreen);
  }, 1100);
}

/* =========================================
   FALLING CONFETTI
   ========================================= */

function addConfetti() {
  const colors = [
    "#ff5c91",
    "#ffd65a",
    "#fff0d1",
    "#d78bff",
    "#66d5ff",
    "#ff9e71"
  ];

  for (let i = 0; i < 65; i++) {
    const piece = document.createElement("i");

    piece.className = "confetti";

    piece.style.setProperty(
      "--left",
      `${Math.random() * 100}%`
    );

    piece.style.setProperty(
      "--color",
      colors[i % colors.length]
    );

    piece.style.setProperty(
      "--duration",
      `${4 + Math.random() * 5}s`
    );

    piece.style.setProperty(
      "--delay",
      `${Math.random() * 2}s`
    );

    stage.appendChild(piece);
  }
}


/* NAVIGATE TO THE NEXT SURPRISE */
/* =========================================
   PAGE 4: INTERACTIVE ENVELOPE LETTERS
   ========================================= */

const nextScreen = document.getElementById("nextScreen");
const envelopeStack = document.getElementById("envelopeStack");

const envelopes = Array.from(
  document.querySelectorAll(".envelope")
);

const letterReader = document.getElementById("letterReader");
const letterBack = document.getElementById("letterBack");
const letterTitle = document.getElementById("letterTitle");
const letterEyebrow = document.getElementById("letterEyebrow");
const letterMessage = document.getElementById("letterMessage");
const letterSignoff = document.getElementById("letterSignoff");
const flowersVideo = document.getElementById("flowersVideo");
const letterPage = document.getElementById("letterPage");
const lifeVideo = document.getElementById("lifeVideo");
const hushVideo = document.getElementById("hushVideo");

const videoIntro = document.getElementById("videoIntro");
const videoIntroText = document.getElementById("videoIntroText");
const videoIntroNext = document.getElementById("videoIntroNext");

const envelopeVideos = {
  0: flowersVideo,
  1: lifeVideo,
  2: hushVideo
};

const introMessages = {
  2: "Aalas aa raha tha, aur videos dhundne me toh bas abhi ke liye itna 🙄🙄"
};
const sadPhoto = document.getElementById("sadPhoto");
const sadNext = document.getElementById("sadNext");

const sadPhotos = [
  "images/sad.png",
  "images/sad1.png",
  "images/sad2.png"
];

let sadIndex = 0;

function hideSad() {
  sadPhoto.style.display = "none";
  sadNext.style.display = "none";
}

function showSadPhoto() {
  sadPhoto.src = sadPhotos[sadIndex];
  sadPhoto.style.display = "block";

  // The Next button is hidden on the last photo
  sadNext.style.display =
    sadIndex < sadPhotos.length - 1 ? "block" : "none";
}

sadNext.addEventListener("click", () => {
  if (sadIndex < sadPhotos.length - 1) {
    sadIndex++;
    showSadPhoto();
  }
});

let pendingVideo = null;

function stopAllVideos() {
  hideSad();
  [flowersVideo, lifeVideo, hushVideo].forEach(video => {
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    video.style.display = "none";
  });

  videoIntro.style.display = "none";
  pendingVideo = null;
}


let selectedEnvelope = null;
let isOpeningEnvelope = false;
let isAnimating = false;
// Which envelope is allowed next: 0 flowers, 1 life, 2 hush, 3 sad
// Which envelope is allowed next: 0 flowers, 1 life, 2 hush, 3 sad
let nextEnvelope = 0;

const finalButton = document.getElementById("finalButton");
const finalVideoScreen = document.getElementById("finalVideoScreen");
const birthdayVideo = document.getElementById("birthdayVideo");

function updateLocks() {
  envelopes.forEach(envelope => {
    const number = Number(envelope.dataset.letter);
    const locked = nextEnvelope <= 3 && number !== nextEnvelope;
    envelope.classList.toggle("locked", locked);
  });

  // Show "Idhar aa" only after all four envelopes are done
  finalButton.style.display = nextEnvelope > 3 ? "block" : "none";
}

updateLocks();

/* OPEN PAGE 4 */

function goToNextPage() {
  closeLetterReader();

  selectedEnvelope = null;
  isOpeningEnvelope = false;

  envelopes.forEach(envelope => {
    envelope.classList.remove("opening", "ready", "is-back");
  });

  showScreen(nextScreen);
}


/* OPEN AN ENVELOPE */


function openEnvelope(envelope) {
  if (letterReader.classList.contains("visible") || isAnimating) return;

  const envelopeNumber = Number(envelope.dataset.letter);
  if (nextEnvelope <= 3 && envelopeNumber !== nextEnvelope) return;

  // Envelope 4: "Open when you are sad" photos
  if (envelopeNumber === 3) {
    stopAllVideos();

    selectedEnvelope = envelope;
    sadIndex = 0;

    letterReader.classList.add("video-mode", "visible");
    letterReader.setAttribute("aria-hidden", "false");

    showSadPhoto();
    return;
  }

  const video = envelopeVideos[envelopeNumber];

  if (!video) return;

  stopAllVideos();

  selectedEnvelope = envelope;

  letterReader.classList.add("video-mode", "visible");
  letterReader.setAttribute("aria-hidden", "false");

  if (introMessages[envelopeNumber]) {
    pendingVideo = video;
    videoIntroText.textContent = introMessages[envelopeNumber];
    videoIntro.style.display = "flex";
  } else {
    video.style.display = "block";
    video.play().catch(() => {});
  }
}
videoIntroNext.addEventListener("click", () => {
  if (!pendingVideo) return;

  const video = pendingVideo;
  pendingVideo = null;

  videoIntro.style.display = "none";
  video.style.display = "block";
  video.play().catch(() => {});
});

/* CLOSE THE LETTER AND RETURN TO ENVELOPES */

function closeLetterReader() {
  letterReader.classList.remove("visible", "video-mode");
  letterReader.setAttribute("aria-hidden", "true");
  stopAllVideos();
}

letterBack.addEventListener("click", () => {
  closeLetterReader();

  if (!selectedEnvelope) return;

  const envelopeToMove = selectedEnvelope;
  

if (Number(envelopeToMove.dataset.letter) === nextEnvelope) {
  nextEnvelope++;
  updateLocks();
}
  selectedEnvelope = null;
  isOpeningEnvelope = false;
  isAnimating = true;

  envelopeToMove.classList.remove("opening", "ready");

  // 1) Wait for the reader to fade, then slide the envelope out
  setTimeout(() => {
    envelopeToMove.classList.add("leaving");

    // 2) Once it is out, move it to the back of the pile
    setTimeout(() => {
      envelopeStack.prepend(envelopeToMove);

      void envelopeToMove.offsetWidth; // apply the new order first

      // 3) Slide it back in behind the others
      envelopeToMove.classList.remove("leaving");

      setTimeout(() => {
        isAnimating = false;
      }, 750);
    }, 700);
  }, 350);
});

/* CONNECT THE ENVELOPES TO CLICKS */

envelopes.forEach(envelope => {
  envelope.addEventListener("click", () => {
    openEnvelope(envelope);
  });
});


/* TAP THE VIDEO TO PAUSE / PLAY */

[flowersVideo, lifeVideo, hushVideo].forEach(video => {
  video.addEventListener("click", () => {
    video.paused ? video.play() : video.pause();
  });
});
/* FINAL BIRTHDAY VIDEO */

finalButton.addEventListener("click", () => {
  finalVideoScreen.style.display = "block";
  birthdayVideo.currentTime = 0;
  birthdayVideo.play().catch(() => {});
});

// When the video finishes, go back to the password page
birthdayVideo.addEventListener("ended", () => {
  location.reload();
});

// Tap the video to pause / play
birthdayVideo.addEventListener("click", () => {
  birthdayVideo.paused ? birthdayVideo.play() : birthdayVideo.pause();
});
/* IDHAR AA: JUMPS AROUND 10 TIMES */

/* IDHAR AA: JUMPS AROUND 10 TIMES */

const nextSurpriseButton = document.getElementById("nextSurpriseButton");
const IDHAR_CLICKS_NEEDED = 10;
let idharClicks = 0;

// Remove the old one-click jump to the next page, if it is still in the HTML
nextSurpriseButton.removeAttribute("onclick");
nextSurpriseButton.onclick = null;

function moveIdharButton() {
  const margin = 20;

  const maxX = Math.max(margin, window.innerWidth - nextSurpriseButton.offsetWidth - margin);
  const maxY = Math.max(margin, window.innerHeight - nextSurpriseButton.offsetHeight - margin);

  const x = margin + Math.random() * (maxX - margin);
  const y = margin + Math.random() * (maxY - margin);

  nextSurpriseButton.style.right = "auto";
  nextSurpriseButton.style.bottom = "auto";
  nextSurpriseButton.style.left = `${x}px`;
  nextSurpriseButton.style.top = `${y}px`;
}

nextSurpriseButton.addEventListener("click", () => {
  idharClicks++;

  if (idharClicks >= IDHAR_CLICKS_NEEDED) {
    goToNextPage();
    return;
  }

  moveIdharButton();
});