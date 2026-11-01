/**
 * Constellation / data-flow field. Lazy-loaded (dynamic import) by HeroMotionComponent so it
 * never touches the initial bundle. Colours come from the theme CSS variables.
 */
interface Node { x: number; y: number; vx: number; vy: number; z: number; }
interface Link { a: number; b: number; d: number; }
interface Packet { link: Link; t: number; speed: number; }

export interface FieldHandle { destroy(): void; }

const FRAME_MS = 1000 / 30;   // 30 fps cap: drifting dots do not need more, and it halves CPU
const BUDGET_MS = 2;          // adaptive: shed nodes if the average frame cost exceeds this

export function startField(host: HTMLElement, canvas: HTMLCanvasElement): FieldHandle {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) { return { destroy() { /* nothing */ } }; }
  const root = document.documentElement;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  let w = 0, h = 0, dpr = 1;
  let nodes: Node[] = [];
  let links: Link[] = [];
  let packets: Packet[] = [];
  let linkDist = 140;
  let color = '100,255,218';
  let nodeAlpha = 0.55;
  let running = false, visible = true, destroyed = false;
  let raf = 0, last = 0, spent = 0, frames = 0;
  let px = 0, py = 0, tx = 0, ty = 0;   // eased / target pointer offset (-1..1)
  let maxNodes = 0;

  const readTheme = () => {
    const cs = getComputedStyle(root);
    color = cs.getPropertyValue('--green-rgb').trim() || '100,255,218';
    nodeAlpha = root.dataset['theme'] === 'light' ? 0.5 : 0.55;
  };

  const seed = () => {
    const target = Math.round(Math.min(64, Math.max(16, (w * h) / 24000)));
    maxNodes = target;
    nodes = Array.from({ length: target }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      z: 0.4 + Math.random() * 0.6,
    }));
    linkDist = w < 600 ? 100 : 150;
  };

  const resize = () => {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) { return; }
    const nw = Math.round(r.width), nh = Math.round(r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(nw * dpr);
    canvas.height = Math.round(nh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const first = nodes.length === 0;
    const sx = w ? nw / w : 1, sy = h ? nh / h : 1;
    w = nw; h = nh;
    if (first) { seed(); } else { nodes.forEach(n => { n.x *= sx; n.y *= sy; }); }
    if (!running) { draw(0); }
  };

  const buildLinks = () => {
    links = [];
    const D2 = linkDist * linkDist;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < D2) { links.push({ a: i, b: j, d: Math.sqrt(d2) / linkDist }); }
      }
    }
  };

  const draw = (dt: number) => {
    const step = dt / 16.7;
    px += (tx - px) * 0.06; py += (ty - py) * 0.06;
    for (const n of nodes) {
      n.x += n.vx * step; n.y += n.vy * step;
      if (n.x < -20) { n.x = w + 20; } else if (n.x > w + 20) { n.x = -20; }
      if (n.y < -20) { n.y = h + 20; } else if (n.y > h + 20) { n.y = -20; }
    }
    buildLinks();
    ctx.clearRect(0, 0, w, h);
    const ox = (i: number) => nodes[i].x + px * 14 * nodes[i].z;
    const oy = (i: number) => nodes[i].y + py * 14 * nodes[i].z;

    // links, batched into 4 alpha buckets (4 strokes instead of one per line)
    for (let b = 0; b < 4; b++) {
      ctx.beginPath();
      for (const l of links) {
        if (Math.min(3, Math.floor(l.d * 4)) !== b) { continue; }
        ctx.moveTo(ox(l.a), oy(l.a)); ctx.lineTo(ox(l.b), oy(l.b));
      }
      ctx.strokeStyle = `rgba(${color},${(0.2 - b * 0.045).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // nodes
    ctx.fillStyle = `rgba(${color},${nodeAlpha})`;
    ctx.beginPath();
    for (let i = 0; i < nodes.length; i++) {
      const r = 1 + nodes[i].z * 1.3, x = ox(i), y = oy(i);
      ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832);
    }
    ctx.fill();
    // data packets travelling along links
    if (packets.length < 4 && links.length && Math.random() < 0.04) {
      packets.push({ link: links[(Math.random() * links.length) | 0], t: 0, speed: 0.012 + Math.random() * 0.01 });
    }
    ctx.fillStyle = `rgba(${color},0.95)`;
    ctx.beginPath();
    packets = packets.filter(p => {
      p.t += p.speed * step;
      if (p.t >= 1 || p.link.a >= nodes.length || p.link.b >= nodes.length) { return false; }
      const x = ox(p.link.a) + (ox(p.link.b) - ox(p.link.a)) * p.t;
      const y = oy(p.link.a) + (oy(p.link.b) - oy(p.link.a)) * p.t;
      ctx.moveTo(x + 2, y); ctx.arc(x, y, 2, 0, 6.2832);
      return true;
    });
    ctx.fill();
  };

  const loop = (now: number) => {
    if (!running) { return; }
    raf = requestAnimationFrame(loop);
    if (now - last < FRAME_MS - 1) { return; }
    const dt = Math.min(now - last, 100);
    last = now;
    const t0 = performance.now();
    draw(dt);
    spent += performance.now() - t0;
    if (++frames === 45) {
      if (spent / frames > BUDGET_MS && nodes.length > 10) {   // over budget: shed 25% of nodes
        nodes.length = Math.max(10, Math.floor(nodes.length * 0.75));
        packets = [];
      }
      spent = 0; frames = 0;
    }
  };

  const sync = () => {
    const should = visible && !document.hidden && !destroyed;
    if (should && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  };

  const io = new IntersectionObserver(e => { visible = e[e.length - 1].isIntersecting; sync(); });
  const ro = new ResizeObserver(() => resize());
  const mo = new MutationObserver(() => { readTheme(); if (!running) { draw(0); } });
  const onVis = () => sync();
  const onMove = (e: PointerEvent) => {
    tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2;
  };

  readTheme();
  resize();
  io.observe(host); ro.observe(host);
  mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', onVis);
  if (finePointer) { window.addEventListener('pointermove', onMove, { passive: true }); }
  sync();

  return {
    destroy() {
      destroyed = true; sync();
      io.disconnect(); ro.disconnect(); mo.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
    },
  };
}
