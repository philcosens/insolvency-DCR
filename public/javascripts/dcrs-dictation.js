(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function initialise() {
    if (!SpeechRecognition) return;
    document.querySelectorAll('[data-dcrs-dictation]').forEach((container) => {
      if (container.dataset.initialised) return;
      const input = container.parentElement?.querySelector('[data-dcrs-dictation-input]');
      const button = container.querySelector('[data-dcrs-dictate]');
      const status = container.querySelector('[data-dcrs-dictation-status]');
      if (!input || !button || !status) return;
      container.dataset.initialised = 'true';
      button.hidden = false;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-GB';
      let listening = false;
      let baseText = '';
      let dictatedText = '';
      const update = (interim = '') => {
        input.value = [baseText, dictatedText, interim].map((text) => text.trim()).filter(Boolean).join(' ');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const stop = (message = '') => {
        listening = false;
        button.textContent = 'Dictate';
        status.textContent = message;
        status.hidden = !message;
      };
      recognition.onstart = () => { listening = true; button.textContent = 'Stop dictation'; status.textContent = 'Listening… speak clearly, then select Stop dictation.'; status.hidden = false; };
      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) dictatedText += `${transcript} `;
          else interim += transcript;
        }
        update(interim);
      };
      recognition.onerror = (event) => stop(event.error === 'not-allowed' ? 'Microphone access was not allowed.' : 'Dictation could not be started. Try again.');
      recognition.onend = () => { if (listening) stop(); };
      button.addEventListener('click', () => {
        if (listening) { recognition.stop(); stop(); return; }
        baseText = input.value.trim();
        dictatedText = '';
        try { recognition.start(); } catch { stop('Dictation is already starting. Try again in a moment.'); }
      });
    });
  }
  document.addEventListener('DOMContentLoaded', initialise);
  document.addEventListener('focusin', initialise);
})();
