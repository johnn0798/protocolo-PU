(function () {
  'use strict';
  var script = document.currentScript;
  var endpoint = script && script.dataset.endpoint || '/api/track';
  var enabled = false;
  var collectionMode = script && script.dataset.mode === 'audience_measurement' ? 'audience_measurement' : 'consent';
  var started = false;
  var visitorId;
  var sessionId;
  var params = new URLSearchParams(location.search);
  function read(name, fallback) { return (params.get(name) || fallback || '').slice(0, 100) || undefined; }
  function id(key, storage) {
    var value = storage.getItem(key);
    if (!value) { value = crypto.randomUUID(); storage.setItem(key, value); }
    return value;
  }
  function privacyBlocks() {
    return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  }
  function send(name) {
    if (!enabled || privacyBlocks() || !/^[a-z][a-z0-9_]{0,39}$/.test(name)) return;
    var body = {
      consent: collectionMode === 'consent', collection_mode: collectionMode,
      visitor_id: visitorId, session_id: sessionId, name: name,
      page: location.origin + location.pathname,
      campaign: read('campaign', script && script.dataset.campaign),
      ambassador: read('ambassador', script && script.dataset.ambassador),
      product: read('product', script && script.dataset.product),
      utm_source: read('utm_source'), utm_medium: read('utm_medium'),
      utm_campaign: read('utm_campaign'), utm_content: read('utm_content'),
      utm_term: read('utm_term')
    };
    fetch(endpoint, { method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(function () {});
  }
  function setEnabled(granted) {
    enabled = granted === true && !privacyBlocks();
    if (!enabled || started) return;
    visitorId = id('tracking_visitor', localStorage);
    sessionId = id('tracking_session', sessionStorage);
    started = true;
    send('session_start');
    send('page_view');
  }
  document.addEventListener('click', function (event) {
    var element = event.target && event.target.closest && event.target.closest('[data-track-cta]');
    if (element) send('cta_click');
  });
  window.TrackingPixel = { setConsent: setEnabled, setEnabled: setEnabled, track: send };
  if (script && script.dataset.consent === 'granted' && collectionMode === 'consent') setEnabled(true);
})();

