(() => {
  const $ = (id) => document.getElementById(id);
  const startBtn = $("startBtn"), stopBtn = $("stopBtn"), status = $("status");
  const captions = $("captions"), language = $("language"), holdBtn = $("holdBtn");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null;
  let listening = false;
  let shouldListen = false;
  let held = false;
  let fontSize = 1.45;
  let finalTranscript = "";
  let sessionId = 0;
  let restartTimer = null;

  const setStatus = (message) => { status.textContent = message; };
  const addLine = (text, className) => {
    const p = document.createElement("p");
    p.className = className;
    p.textContent = text;
    captions.appendChild(p);
    captions.scrollTop = captions.scrollHeight;
    return p;
  };
  const ensurePlaceholderRemoved = () => {
    const placeholder = captions.querySelector(".placeholder");
    if (placeholder) placeholder.remove();
  };
  function updateStoppedUI() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    holdBtn.disabled = true;
  }
  function stopListening() {
    // A user stop invalidates any pending automatic restart.
    shouldListen = false;
    listening = false;
    sessionId++;
    if (restartTimer !== null) {
      window.clearTimeout(restartTimer);
      restartTimer = null;
    }
    const oldRecognition = recognition;
    recognition = null;
    try { if (oldRecognition) oldRecognition.stop(); } catch (_) {}
    updateStoppedUI();
  }
  function scheduleRestart(id, delay = 700) {
    if (!shouldListen || id !== sessionId || restartTimer !== null) return;
    setStatus("Brief pause in recognition. Reconnecting…");
    restartTimer = window.setTimeout(() => {
      restartTimer = null;
      if (shouldListen && id === sessionId) startRecognition(id);
    }, delay);
  }
  function startRecognition(id) {
    if (!shouldListen || id !== sessionId || !SpeechRecognition) return;
    try {
      // Create a NEW recognizer after each onend. Reusing a stopped instance
      // can silently fail on some Android Chrome speech-recognition sessions.
      const current = new SpeechRecognition();
      recognition = current;
      current.lang = language.value;
      current.continuous = true;
      current.interimResults = true;
      current.maxAlternatives = 1;

      current.onstart = () => {
        if (current !== recognition || id !== sessionId) return;
        listening = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        holdBtn.disabled = false;
        setStatus("Listening. Captions will continue until you press Stop.");
      };
      current.onresult = (event) => {
        if (current !== recognition || id !== sessionId || held) return;
        ensurePlaceholderRemoved();
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim();
          if (event.results[i].isFinal && transcript) {
            finalTranscript += (finalTranscript ? " " : "") + transcript;
            addLine(transcript, "final-text");
          } else if (transcript) {
            interim += transcript + " ";
          }
        }
        const old = captions.querySelector(".interim-text");
        if (old) old.remove();
        if (interim.trim()) addLine(interim.trim(), "interim-text");
      };
      current.onerror = (event) => {
        if (current !== recognition || id !== sessionId) return;
        const messages = {
          "not-allowed": "Microphone permission was denied. Allow microphone access in Chrome settings.",
          "service-not-allowed": "Speech recognition is blocked by the browser. Check Chrome and microphone permissions.",
          "audio-capture": "No microphone was found. Check your phone's microphone.",
          "network": "Speech recognition needs a working internet connection.",
          "no-speech": "No speech detected. Still listening for the next sentence…",
          "aborted": "Reconnecting to speech recognition…"
        };
        setStatus(messages[event.error] || ("Speech recognition issue: " + event.error));
        if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) {
          shouldListen = false;
        }
      };
      current.onend = () => {
        if (current !== recognition || id !== sessionId) return;
        listening = false;
        recognition = null;
        if (shouldListen) {
          scheduleRestart(id);
          return;
        }
        updateStoppedUI();
        if (status.textContent.startsWith("Listening") || status.textContent.startsWith("Brief pause") || status.textContent.startsWith("Reconnecting")) {
          setStatus("Captions stopped.");
        }
      };
      current.start();
    } catch (error) {
      if (id !== sessionId) return;
      listening = false;
      recognition = null;
      if (shouldListen) {
        setStatus("Speech recognition paused briefly. Trying again…");
        scheduleRestart(id, 1200);
      } else {
        updateStoppedUI();
        setStatus("Could not start captions. Please check microphone permission and try again.");
      }
    }
  }
  function startListening() {
    if (!SpeechRecognition) {
      setStatus("Live speech recognition is not supported in this browser. Try an updated version of Chrome, or use Android Live Transcribe.");
      return;
    }
    if (shouldListen || listening) return;
    shouldListen = true;
    const id = ++sessionId;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    holdBtn.disabled = false;
    setStatus("Starting captions…");
    startRecognition(id);
  }

  startBtn.addEventListener("click", startListening);
  stopBtn.addEventListener("click", () => {
    stopListening();
    setStatus("Captions stopped.");
  });
  language.addEventListener("change", () => {
    if (shouldListen || listening) {
      stopListening();
      setStatus("Language changed. Tap Start captions to resume.");
    }
  });
  holdBtn.addEventListener("click", () => {
    held = !held;
    holdBtn.textContent = held ? "▶ Resume text" : "Ⅱ Hold text";
    setStatus(held ? "Text held. New speech is not being added to the screen." : "Text resumed.");
  });
  $("clearBtn").addEventListener("click", () => {
    captions.replaceChildren();
    finalTranscript = "";
    addLine("Captions cleared. New speech will appear here.", "placeholder");
  });
  $("smallerBtn").addEventListener("click", () => {
    fontSize = Math.max(1, fontSize - .15);
    captions.style.fontSize = fontSize + "rem";
  });
  $("largerBtn").addEventListener("click", () => {
    fontSize = Math.min(2.6, fontSize + .15);
    captions.style.fontSize = fontSize + "rem";
  });
  $("showReplyBtn").addEventListener("click", () => {
    const reply = $("replyInput").value.trim();
    const display = $("replyDisplay");
    display.textContent = reply || "Please type a reply first.";
    display.hidden = false;
  });
  $("speakReplyBtn").addEventListener("click", () => {
    const reply = $("replyInput").value.trim();
    if (!reply) {
      setStatus("Type a reply before asking the phone to speak.");
      return;
    }
    if (!("speechSynthesis" in window)) {
      setStatus("Spoken replies are not supported by this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = language.value;
    window.speechSynthesis.speak(utterance);
  });
  if (!SpeechRecognition) {
    setStatus("This browser may not support live captions. Try Chrome on Android, or use Android Live Transcribe.");
  }
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();