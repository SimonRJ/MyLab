(() => {
  'use strict';
  const status = document.querySelector('[data-offline-status]');
  const progress = document.querySelector('[data-offline-progress]');
  const retry = document.querySelector('[data-offline-retry]');
  const installed = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  if (installed) {
    const steps = document.getElementById('installSteps');
    if (steps) steps.hidden = true;
    const link = document.querySelector('[data-install-link]');
    if (link) link.textContent = 'Offline details';
  }
  function paint(state, text, count, total) {
    const details = document.querySelector('[data-download-error]');
    if (details && state !== 'failed') details.textContent = '';
    if (status) {
      status.textContent = text;
      const bar = status.closest('.offlineBar');
      if (bar) bar.dataset.state = state;
    }
    if (progress) {
      progress.hidden = state !== 'saving';
      if (total) {progress.max = total; progress.value = count;}
      else progress.removeAttribute('value');
    }
    if (retry) retry.hidden = state !== 'failed';
  }
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    paint('unsupported', 'Open the published atlas in Safari to save it offline.');
    return;
  }
  const workers = navigator.serviceWorker;
  let reg, connecting = false, ready = false;
  const watched = new WeakSet();
  function check() {
    const active = workers.controller || reg?.active;
    if (active?.state === 'activated') active.postMessage({atlasOffline:'check'});
  }
  function incomplete(reason) {
    const details = document.querySelector('[data-download-error]');
    if (details && reason) details.textContent = reason;
    paint('failed', 'Download incomplete. Connect to the internet and retry.');
  }
  workers.addEventListener('message', event => {
    const {atlasOffline: kind, count, total} = event.data || {};
    if (kind === 'ready') {
      if (event.source !== workers.controller && event.source !== reg?.active) { check(); return; }
      ready = true;
      paint('ready', 'Ready offline');
    } else if (kind === 'failed') {
      if (event.source === workers.controller || event.source === reg?.active) ready = false;
      if (!ready) incomplete(event.data.reason);
    } else if (kind === 'saving' && !ready) {
      paint('saving', 'Saving offline · '+count+' of '+total+' files', count, total);
    }
  });
  function watchInstalling() {
    const worker = reg?.installing;
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant' && !ready) { if (reg?.active) check(); else incomplete(); }
      if (worker.state === 'activated') check();
    });
  }
  function observe(registration) {
    if (reg !== registration) {
      reg = registration;
      reg.addEventListener('updatefound', watchInstalling);
    }
    watchInstalling();
    check();
  }
  async function connect(manual = false) {
    if (connecting) return;
    connecting = true;
    try {
      if (!ready) paint('saving','Preparing offline download…');
      const existing = await workers.getRegistration('./');
      if (existing) observe(existing);
      if (!existing || (!existing.active && !existing.installing && !existing.waiting)) {
        observe(await workers.register('./sw.js', {scope:'./', updateViaCache:'none'}));
      } else if (navigator.onLine && !existing.installing && !existing.waiting) {
        if (manual || !ready) existing.update().catch(() => { if (!existing.active) incomplete(); });
      }
      check();
    } catch (error) {
      if (workers.controller || reg?.active) check();
      else incomplete(error.message);
    } finally {
      connecting = false;
    }
  }
  workers.addEventListener('controllerchange', check);
  window.addEventListener('online', () => connect(true));
  window.addEventListener('pageshow', check);
  if (retry) retry.addEventListener('click', () => connect(true));
  connect();
})();
