(() => {
  const $ = (id) => document.getElementById(id);
  const startBtn = $("startBtn"), stopBtn = $("stopBtn"), status = $("status");
  const captions = $("captions"), language = $("language"), holdBtn = $("holdBtn");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null, listening = false, held = false, fontSize = 1.45;
  let finalTranscript = "";
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
  function stopListening() {
    listening = false;
    try { if (recognition) recognition.stop(); } catch (_) {}
    startBtn.disabled = false; stopBtn.disabled = true; holdBtn.disabled = true;
  }
  function startListening() {
    if (!SpeechRecognition) {
      setStatus("Live speech recognition is not supported in this browser. Try a current version of Chrome, or use your phone's Live Transcribe feature.");
      return;
    }
    if (listening) return;
    try {
      recognition = new SpeechRecognition();
      recognition.lang = language.value;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        listening = true; startBtn.disabled = true; stopBtn.disabled = false; holdBtn.disabled = false;
        setStatus("Listening. Keep this page open and your phone microphone unobstructed.");
      };
      recognition.onresult = (event) => {
        if (held) return;
        ensurePlaceholderRemoved();
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim();
          if (event.results[i].isFinal && transcript) {
            finalTranscript += (finalTranscript ? " " : "") + transcript;
            addLine(transcript, "final-text");
          } else if (transcript) interim += transcript + " ";
        }
        const old = captions.querySelector(".interim-text");
        if (old) old.remove();
        if (interim.trim()) addLine(interim.trim(), "interim-text");
      };
      recognition.onerror = (event) => {
        const messages = {
          "not-allowed": "Microphone permission was denied. Allow microphone access in your browser settings.",
          "audio-capture": "No microphone was found. Check your phone's microphone.",
          "network": "Speech recognition needs a network connection in this browser.",
          "no-speech": "No speech detected yet. Try moving closer to the speaker."
        };
        setStatus(messages[event.error] || ("Speech recognition issue: " + event.error));
      };
      recognition.onend = () => {
        listening = false; startBtn.disabled = false; stopBtn.disabled = true; holdBtn.disabled = true;
        if (status.textContent.startsWith("Listening")) setStatus("Captions paused. Tap Start captions to continue.");
      };
      recognition.start();
    } catch (error) {
      setStatus("Could not start captions. Please try again and check microphone permission.");
    }
  }
  startBtn.addEventListener("click", startListening);
  stopBtn.addEventListener("click", () => { stopListening(); setStatus("Captions stopped."); });
  language.addEventListener("change", () => {
    if (listening) { stopListening(); setStatus("Language changed. Tap Start captions to resume."); }
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
    fontSize = Math.max(1, fontSize - .15); captions.style.fontSize = fontSize + "rem";
  });
  $("largerBtn").addEventListener("click", () => {
    fontSize = Math.min(2.6, fontSize + .15); captions.style.fontSize = fontSize + "rem";
  });
  $("showReplyBtn").addEventListener("click", () => {
    const reply = $("replyInput").value.trim();
    const display = $("replyDisplay");
    display.textContent = reply || "Please type a reply first.";
    display.hidden = false;
  });
  $("speakReplyBtn").addEventListener("click", () => {
    const reply = $("replyInput").value.trim();
    if (!reply) { setStatus("Type a reply before asking the phone to speak."); return; }
    if (!("speechSynthesis" in window)) { setStatus("Spoken replies are not supported by this browser."); return; }
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