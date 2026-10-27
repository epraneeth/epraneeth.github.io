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
  let texture, colors, phase = .18, course = .04, route = [], routeLength = 1;
  let loop = null, loopQueued = false, nextLoop = 7500, trail = [];
  let cachedPhase = -Infinity;
  let frame = 0, last = 0, visible = true, paused = false;
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
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }

  function playing() { return !paused && !reduced.matches && visible && !document.hidden; }

  function curve(angle) {
    return { x: width * (.5 + .4 * Math.sin(angle)), y: height * (.48 + .25 * Math.sin(angle * 2)) };
  }

  function buildRoute() {
    // Arc-length sampling gives the long sweeps and tight U-turns the same
    // travelling speed. The curve closes with a matching position/tangent.
    route = [0];
    let previous = curve(-.9);
    for (let i = 1; i <= 720; i++) {
      const point = curve(-.9 + tau * i / 720);
      route.push(route[i - 1] + Math.hypot(point.x - previous.x, point.y - previous.y));
      previous = point;
    }
    routeLength = route[720];
  }

  function cruisePose() {
    const distance = course * routeLength;
    let low = 0, high = 720;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (route[middle] <= distance) low = middle;
      else high = middle;
    }
    const fraction = (distance - route[low]) / Math.max(.001, route[high] - route[low]);
    const angle = -.9 + tau * (low + fraction) / 720;
    return { ...curve(angle), angle: Math.atan2(height * .5 * Math.cos(angle * 2), width * .4 * Math.cos(angle)), bank: .88 + .12 * Math.sin(angle) };
  }

  function loopPose(turn, progress) {
    const tangentX = Math.cos(turn.angle), tangentY = Math.sin(turn.angle);
    const along = turn.radius * Math.sin(progress);
    const across = turn.radius * (1 - Math.cos(progress)) * turn.direction;
    return {
      x: turn.x + tangentX * along - tangentY * across,
      y: turn.y + tangentY * along + tangentX * across,
      angle: turn.angle + progress * turn.direction,
      bank: .72 + .28 * Math.cos(progress)
    };
  }

  function beginLoop() {
    if (loop) { loopQueued = true; return; }
    const start = cruisePose();
    let best = null;
    // Choose the inward side and radius that fit the artwork, including on
    // a phone; a stunt must never take the plane into the text or controls.
    for (let attempt = 0; attempt < 5 && !best; attempt++) {
      const radius = Math.min(width * .055, height * .14, 38) * .8 ** attempt;
      for (const direction of [1, -1]) {
        const turn = { ...start, radius, direction, travelled: 0 };
        let fits = true;
        for (let i = 0; i <= 32; i++) {
          const point = loopPose(turn, tau * i / 32);
          if (point.x < 16 || point.x > width - 16 || point.y < 16 || point.y > height - 16) { fits = false; break; }
        }
        if (fits) { best = turn; break; }
      }
    }
    loop = best;
    canvas.dataset.flight = loop ? 'looping' : 'flying';
  }

  function planePose() { return loop ? loopPose(loop, loop.travelled / loop.radius) : cruisePose(); }

  function drawPlane() {
    const point = planePose();
    ctx.fillStyle = colors.accent;
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < trail.length; i++) {
      ctx.globalAlpha = .45 * (1 - trail[i].age / 1400);
      ctx.fillText('.', trail[i].x, trail[i].y);
    }
    const scale = width < 500 ? .8 : 1;
    ctx.save();
    ctx.globalAlpha = .95;
    ctx.translate(point.x, point.y);
    ctx.rotate(point.angle);
    ctx.scale(scale, scale * point.bank);
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
    if (last && now - last < 15) { frame = requestAnimationFrame(tick); return; }
    const delta = last ? Math.min(now - last, 120) : 0;
    last = now;
    phase += delta * .00015;
    const speed = width < 500 ? width * .19 : width * .105;
    if (loop) {
      loop.travelled += speed * delta / 1000;
      if (loop.travelled >= tau * loop.radius) {
        loop = null;
        nextLoop = 16000;
        canvas.dataset.flight = 'flying';
        if (loopQueued) { loopQueued = false; beginLoop(); }
      }
    } else {
      course = (course + speed * delta / 1000 / routeLength) % 1;
      nextLoop -= delta;
      if (nextLoop <= 0) beginLoop();
    }
    for (const dot of trail) dot.age += delta;
    trail = trail.filter(dot => dot.age < 1400);
    const point = planePose(), newest = trail[trail.length - 1];
    if (!newest || Math.hypot(point.x - newest.x, point.y - newest.y) > 5) trail.push({ x: point.x, y: point.y, age: 0 });
    draw();
    frame = requestAnimationFrame(tick);
  }

  function update() {
    stop();
    pauseButton.textContent = paused ? 'resume' : 'pause';
    pauseButton.hidden = reduced.matches;
    scene.classList.toggle('is-still', reduced.matches);
    canvas.dataset.flight = reduced.matches ? 'still' : paused ? 'paused' : loop ? 'looping' : 'flying';
    draw(true);
    if (playing()) frame = requestAnimationFrame(tick);
  }

  function resize() {
    stop();
    const bounds = canvas.getBoundingClientRect();
    const scaleX = width ? bounds.width / width : 1, scaleY = height ? bounds.height / height : 1;
    width = bounds.width;
    height = bounds.height;
    for (const dot of trail) { dot.x *= scaleX; dot.y *= scaleY; }
    if (loop) {
      loop.x *= scaleX; loop.y *= scaleY;
      loop.angle = Math.atan2(Math.sin(loop.angle) * scaleY, Math.cos(loop.angle) * scaleX);
      loop.radius *= Math.min(scaleX, scaleY);
      loop.travelled *= Math.min(scaleX, scaleY);
    }
    buildRoute();
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
    if (reduced.matches || paused) {
      phase += .4;
      course = (course + .16) % 1;
      loop = null;
      loopQueued = false;
      trail = [];
      draw();
    } else beginLoop();
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
