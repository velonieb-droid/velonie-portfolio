/*
  Velonie AI Assistant (Easy-Peasy.AI) loader.

  Adds the official Easy-Peasy embed to the page exactly once:
    <script src="https://bots.easy-peasy.ai/chat.min.js"
            data-chat-url="https://bots.easy-peasy.ai/bot/0ba5617c-12a5-490e-a396-184ade74c67b"
            defer></script>

  The embed is injected after the window load event so it never competes with
  first render, LCP, or the existing deferred loaders (e.g. the homepage Cal.com
  booking embed). Easy-Peasy itself waits for document.readyState === "complete"
  before building the launcher, so the widget looks and behaves the same.

  Rollback: remove the <script src=".../assets/js/easy-peasy-chat.js" defer></script>
  tag from each page (or delete this file's body).
*/
(function () {
  'use strict';

  var EMBED_SRC = 'https://bots.easy-peasy.ai/chat.min.js';
  var CHAT_URL = 'https://bots.easy-peasy.ai/bot/0ba5617c-12a5-490e-a396-184ade74c67b';

  // Guard against this loader being included twice on the same page.
  if (window.__velonieChatLoader) return;
  window.__velonieChatLoader = true;

  function inject() {
    // Homepage only: keep the sticky mobile "Book a free call" bar clear of the
    // launcher (20px inset + 60px button + 12px gap). Site CSS only; the widget's
    // own styling is untouched. :has() means it applies only once the launcher exists.
    if (document.getElementById('stickyCta') && !document.getElementById('velonie-chat-cta-clearance')) {
      var st = document.createElement('style');
      st.id = 'velonie-chat-cta-clearance';
      st.textContent = 'body:has(#dialoq-btn) .sticky-cta{padding-right:calc(92px + env(safe-area-inset-right,0px))}';
      document.head.appendChild(st);
    }

    // Guard against a hard-coded copy of the official snippet or an existing widget.
    if (document.querySelector('script[src="' + EMBED_SRC + '"]') || document.getElementById('dialoq')) return;
    var s = document.createElement('script');
    s.src = EMBED_SRC;
    s.setAttribute('data-chat-url', CHAT_URL);
    s.defer = true;
    document.body.appendChild(s);
  }

  if (document.readyState === 'complete') inject();
  else window.addEventListener('load', inject, { once: true });
})();
