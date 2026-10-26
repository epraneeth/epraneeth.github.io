(() => {
  const canvas = document.querySelector('#ambient-art');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const artLayer = document.createElement('canvas');
  const art = artLayer.getContext('2d');
  if (!art) return;
  const scene = canvas.closest('.scene');
  const controls = scene.querySelector('.scene-controls');
  const pauseButton = document.querySelector('#pause-art');
  const planeButton = document.querySelector('#send-plane');
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tau = Math.PI * 2;
  const glyphs = '...::+*';
  let width = 0, height = 0, columns = 0, rows = 0, cellX = 0, cellY = 0;
  let texture, colors, phase = .18, flight = null, resting = 0;
  let cachedPhase = -Infinity;
  let timer = 0, frame = 0, last = 0, visible = true, paused = false;
  try { paused = localStorage.getItem('praneeth-motion') === 'paused'; } catch {}

  const noise = (x, y, salt = 0) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + salt * 73.9) * 43758.5453;
    return n - Math.floor(n);
  };

  function palette() {
    const css = getComputedStyle(root);
    colors = Object.fromEntries(['paper', 'ink', 'link', 'accent', 'muted'].map(k => [k, css.getPropertyValue(`--${k}`).trim()]));
    cachedPhase = -Infinity;
  }

  function stop() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    timer = frame = 0;
    last = 0;
  }

  function playing() { return !paused && !reduced.matches && visible && !document.hidden; }

  function flightPoint(t) {
    return {
      x: width * (-.06 + 1.10 * t),
      y: height * (.73 - .59 * t + .20 * Math.sin(t * tau) * Math.sin(t * Math.PI))
    };
  }

  function drawPlane() {
    let point, angle;
    if (flight !== null) {
      const t = flight / 6400;
      point = flightPoint(t);
      const ahead = flightPoint(t + .002);
      angle = Math.atan2(ahead.y - point.y, ahead.x - point.x);
      ctx.fillStyle = colors.accent;
      ctx.font = '10px Consolas, monospace';
      for (let i = 1; i <= 24; i++) {
        const tt = t - i * .008;
        if (tt < 0) continue;
        const tail = flightPoint(tt);
        ctx.globalAlpha = .5 * (1 - i / 25);
        ctx.fillText('.', tail.x, tail.y);
      }
    } else {
      point = { x: width * (.94 - (resting % 3) * .075), y: height * (.13 + (resting % 3) * .07) };
      angle = -.45;
    }
    const scale = width < 500 ? .8 : 1;
    ctx.save();
    ctx.globalAlpha = .95;
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(14, 0); ctx.lineTo(-13, -8); ctx.lineTo(-7, 0); ctx.lineTo(-13, 8); ctx.closePath();
    ctx.moveTo(-7, 0); ctx.lineTo(14, 0);
    ctx.moveTo(-7, 0); ctx.lineTo(-7, 5);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function draw(force = false) {
    if (!width || !height) return;
    if (force || phase - cachedPhase >= .009) {
      cachedPhase = phase;
      art.clearRect(0, 0, width, height);
      art.font = `${width < 500 ? 8 : 10}px Consolas, monospace`;
      art.textAlign = 'center';
      art.textBaseline = 'middle';

      // Sample two twisted strips into a character grid. Each occupied cell
      // gets one glyph; front-to-back depth keeps the crossing crisp.
      for (let column = 0; column < columns; column++) {
        const u = column / (columns - 1);
        const fade = Math.min(1, u * 15, (1 - u) * 15);
        const curves = [
          { center: .50 + .22 * Math.sin(u * tau * 1.3 - 1.2 + phase), twist: u * tau + phase * .4, color: colors.link },
          { center: .53 + .23 * Math.cos(u * tau + .35 + phase * .72), twist: u * tau - .9 + phase * .3, color: colors.accent }
        ];
        for (let row = 0; row < rows; row++) {
          const v = (row + .5) / rows;
          const grain = texture[row * columns + column] / 255;
          let front = null;
          for (let layer = 0; layer < 2; layer++) {
            const curve = curves[layer];
            const half = .25 * (.85 + .15 * Math.sin(u * Math.PI) ** .5) * (.25 + .75 * Math.abs(Math.cos(curve.twist)));
            const across = (v - curve.center) / half;
            if (Math.abs(across) > 1) continue;
            const edge = 1 - Math.abs(across);
            if (grain > .55 + .43 * edge) continue;
            const depth = Math.sin(curve.twist) + across * .2;
            if (!front || depth > front.depth) {
              const light = .30 + .70 * Math.max(0, Math.cos(curve.twist + across * 1.4));
              front = { depth, color: curve.color, alpha: fade * (.45 + .55 * light) * (.75 + .25 * edge), glyph: glyphs[Math.min(6, Math.floor(grain * 7))] };
            }
          }
          if (front) {
            art.fillStyle = front.color;
            art.globalAlpha = front.alpha;
            art.fillText(front.glyph, (column + .5) * cellX, (row + .5) * cellY);
          }
        }
      }

      // A few steady points keep the negative space open rather than noisy.
      art.fillStyle = colors.muted;
      for (let i = 0; i < 13; i++) {
        art.globalAlpha = .30 + .14 * Math.sin(phase * .7 + i);
        art.fillText(i % 5 === 0 ? '+' : '.', width * (.04 + .91 * noise(i, 9)), height * (.1 + .78 * noise(i, 17)));
      }
      art.globalAlpha = 1;
    }
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(artLayer, 0, 0, width, height);
    drawPlane();
  }

  function tick(now) {
    frame = 0;
    if (!playing()) return;
    const delta = last ? Math.min(now - last, 120) : 0;
    last = now;
    phase += delta * .00015;
    if (flight !== null) {
      flight += delta;
      if (flight >= 6400) {
        flight = null;
        canvas.dataset.flight = 'resting';
      }
    }
    draw();
    if (flight !== null) frame = requestAnimationFrame(tick);
    else timer = setTimeout(() => { frame = requestAnimationFrame(tick); }, 1000 / 15);
  }

  function update() {
    stop();
    pauseButton.textContent = paused ? 'resume' : 'pause';
    pauseButton.hidden = reduced.matches;
    scene.classList.toggle('is-still', reduced.matches);
    if (reduced.matches && flight !== null) {
      flight = null;
      canvas.dataset.flight = 'resting';
    }
    draw(true);
    if (playing()) frame = requestAnimationFrame(tick);
  }

  function resize() {
    stop();
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    artLayer.width = canvas.width;
    artLayer.height = canvas.height;
    art.setTransform(ratio, 0, 0, ratio, 0, 0);
    columns = Math.max(32, Math.round(width / (width < 500 ? 5 : 6.3)));
    rows = Math.round(height / (width < 500 ? 6 : 7));
    cellX = width / columns;
    cellY = height / rows;
    texture = new Uint8Array(columns * rows);
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) texture[row * columns + column] = Math.floor(noise(column, row) * 255);
    update();
  }

  pauseButton.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('praneeth-motion', paused ? 'paused' : 'playing'); } catch {}
    update();
  });
  planeButton.addEventListener('click', () => {
    resting++;
    if (reduced.matches || paused) {
      phase += .4;
      flight = null;
      canvas.dataset.flight = 'resting';
      draw();
    } else {
      flight = 0;
      canvas.dataset.flight = 'flying';
      update();
    }
  });
  root.addEventListener('themechange', () => { palette(); draw(); });
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', update);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  }).observe(scene);
  palette();
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  scene.classList.add('is-ready');
  controls.hidden = false;
})();
