// Entrance + lazy 3D boot. No frameworks, no dependencies.
(function () {
  function boot() {
    document.body.classList.add('loaded');

    var processSection = document.getElementById('process');
    if (!processSection || !('IntersectionObserver' in window)) return;

    var started = false;
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !started) {
        started = true;
        io.disconnect();
        import('./three-process.js')
          .then(function (m) { m.initProcessScene(); })
          .catch(function () { showFallback(); });
      }
    }, { rootMargin: '600px 0px' });
    io.observe(processSection);
  }

  function showFallback() {
    var c = document.getElementById('layers-canvas');
    var f = document.getElementById('layers-fallback');
    if (c) c.style.display = 'none';
    if (f) f.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
