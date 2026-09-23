// public/js/voice.js
// Web Speech API wrapper — hold-to-talk using browser-native STT.

(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  window.voiceSupported = !!SR;

  let recognition = null;
  let finalText = '';

  function start(onInterim, onFinal) {
    if (!SR) {
      alert('Speech recognition not supported in this browser. Use Chrome/Edge.');
      return;
    }
    finalText = '';
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      onInterim && onInterim(finalText + interim);
    };
    recognition.onerror = (e) => console.warn('[voice] error:', e.error);
    recognition.onend = () => {
      if (finalText.trim() && onFinal) onFinal(finalText.trim());
    };
    recognition.start();
  }

  function stop() {
    if (recognition) { try { recognition.stop(); } catch (e) {} }
  }

  window.voice = { start, stop };
})();