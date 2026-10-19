// The single 3D moment: a website deconstructed into layers
// (design / code / content) assembling on scroll. Vanilla Three.js + GSAP.
// Budgets: ~786KB vendored libs, 3 draw calls, DPR capped at 2,
// frameloop = demand (renders only on scroll updates).
import * as THREE from 'three';

var PHASES = [
  { title: 'We talk', text: 'A 20-minute call. You describe your business in plain words; I ask what\u2019s costing you customers.' },
  { title: 'I design', text: 'One direction, shown to you early. You react to something real, not a mood board.' },
  { title: 'I build', text: 'Clean code, fast pages, tested on phones. You see progress, not promises.' },
  { title: 'You launch', text: 'Live in weeks. You own the code, the domain, everything.' }
];

var INK = '#1a140e';
var PAPER = '#f6f1e7';
var PAPER_DEEP = '#ece2cc';
var AMBER = '#f59e0b';

function showFallback() {
  var c = document.getElementById('layers-canvas');
  var f = document.getElementById('layers-fallback');
  if (c) c.style.display = 'none';
  if (f) f.hidden = false;
}

function texture(w, h, draw) {
  var cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  var ctx = cv.getContext('2d');
  draw(ctx, w, h);
  var t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function frame(ctx, w, h) {
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.strokeRect(5, 5, w - 10, h - 10);
}

function designTexture() {
  return texture(920, 640, function (ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.strokeRect(70, 70, w - 140, 110);          // header bar
    ctx.strokeRect(70, 230, w - 140, 180);          // hero block
    var cw = (w - 140 - 48) / 3;
    for (var i = 0; i < 3; i++) ctx.strokeRect(70 + i * (cw + 24), 450, cw, 120); // columns
    ctx.fillStyle = AMBER; ctx.fillRect(w - 210, 92, 120, 66); // the one accent
    frame(ctx, w, h);
  });
}

function codeTexture() {
  return texture(920, 640, function (ctx, w, h) {
    ctx.fillStyle = INK; ctx.fillRect(0, 0, w, h);
    var colors = [PAPER, AMBER, '#8a9a5b', '#7d8ca3'];
    var y = 90, i = 0;
    while (y < h - 70) {
      var indent = (i % 4) * 46 + 70;
      var len = 180 + ((i * 137) % 480);
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.9;
      ctx.fillRect(indent, y, Math.min(len, w - indent - 70), 22);
      y += 52; i++;
    }
    ctx.globalAlpha = 1;
    frame(ctx, w, h);
  });
}

function contentTexture() {
  return texture(920, 640, function (ctx, w, h) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = INK;
    ctx.fillRect(70, 70, 420, 44);                  // headline bars
    ctx.fillRect(70, 130, 300, 44);
    ctx.fillStyle = PAPER_DEEP;
    ctx.fillRect(70, 220, w - 140, 200);            // image block
    ctx.strokeStyle = INK; ctx.lineWidth = 6;
    ctx.strokeRect(70, 220, w - 140, 200);
    ctx.fillStyle = INK;
    for (var r = 0; r < 3; r++) ctx.fillRect(70, 460 + r * 40, w - 140 - r * 90, 18); // text lines
    frame(ctx, w, h);
  });
}

export function initProcessScene() {
  var canvas = document.getElementById('layers-canvas');
  var gsap = window.gsap;
  if (!canvas || !gsap || !window.ScrollTrigger) { showFallback(); return; }
  gsap.registerPlugin(window.ScrollTrigger);

  // Designed fallbacks: no WebGL, reduced motion, small screens, save-data.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var smallScreen = window.matchMedia('(max-width: 860px)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  var gl = null;
  try { gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl'); } catch (e) { gl = null; }
  if (!gl || reduceMotion || smallScreen || saveData) { showFallback(); return; }

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(PAPER_DEEP);

  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.6, 10.5);
  camera.lookAt(0, 0, 0);

  var geo = new THREE.PlaneGeometry(4.8, 3.34);
  var layers = [
    { mesh: new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: designTexture() })), label: 'design' },
    { mesh: new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: codeTexture() })), label: 'code' },
    { mesh: new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: contentTexture() })), label: 'content' }
  ];
  layers.forEach(function (l) { scene.add(l.mesh); });

  function size() {
    var w = canvas.clientWidth || canvas.parentElement.clientWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  size();
  window.addEventListener('resize', size);

  // Exploded -> assembled, driven by scroll. Demand rendering: only on update.
  var explodedY = [2.6, 0, -2.6];
  var assembledY = [0.62, 0, -0.62];
  layers.forEach(function (l, i) {
    l.mesh.position.y = explodedY[i];
    l.mesh.rotation.x = -0.35;
    l.mesh.rotation.z = (i - 1) * 0.06;
  });
  renderer.render(scene, camera);

  var titleEl = document.getElementById('phase-title');
  var textEl = document.getElementById('phase-text');
  var lastPhase = -1;

  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.process-sticky',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: function (self) {
        layers.forEach(function (l, i) {
          var p = self.progress;
          l.mesh.position.y = explodedY[i] + (assembledY[i] - explodedY[i]) * p;
          l.mesh.rotation.x = -0.35 * (1 - p);
          l.mesh.rotation.z = (i - 1) * 0.06 * (1 - p);
        });
        camera.position.z = 10.5 - 1.2 * self.progress;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);

        var phase = Math.min(3, Math.floor(self.progress * 4));
        if (phase !== lastPhase && titleEl && textEl) {
          lastPhase = phase;
          titleEl.textContent = PHASES[phase].title;
          textEl.textContent = PHASES[phase].text;
        }
      }
    }
  });
  tl.to({}, { duration: 1 }); // timeline exists so scrub has range
}
