/* The Fish of Issyk-Kul — interactions. No libraries. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const NS = 'http://www.w3.org/2000/svg';

  /* ───────── Stars ───────── */
  const stars = $('.stars');
  for (let i = 0; i < 90; i++) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', Math.random() * 1600);
    c.setAttribute('cy', Math.random() * 360);
    c.setAttribute('r', Math.random() * 1.4 + .3);
    c.setAttribute('opacity', Math.random() * .6 + .2);
    c.style.animationDelay = -Math.random() * 4 + 's';
    stars.appendChild(c);
  }

  /* ───────── Eyes in the dark water ───────── */
  const canvas = $('#eyes'), ctx = canvas.getContext('2d');
  let W, H, eyes = [], live = true;
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    eyes = Array.from({ length: Math.round(W / 70) }, spawn);
  }
  function spawn() {
    return { x: Math.random() * W, y: H * (.72 + Math.random() * .24), t: Math.random() * 600, life: 240 + Math.random() * 300, v: (Math.random() - .5) * .4, gap: 5 + Math.random() * 4 };
  }
  function drawEyes() {
    if (!live) return;
    ctx.clearRect(0, 0, W, H);
    for (const e of eyes) {
      e.t++; e.x += e.v;
      const p = e.t / e.life, a = Math.max(0, Math.sin(Math.PI * p)) * (Math.sin(e.t / 9) > -.92 ? 1 : 0);
      if (p >= 1) Object.assign(e, spawn(), { t: 0 });
      ctx.fillStyle = `rgba(240, 210, 120, ${a * .85})`;
      ctx.shadowColor = 'rgba(240, 189, 85, .9)'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(e.x, e.y, 1.6, 0, 7); ctx.arc(e.x + e.gap, e.y, 1.6, 0, 7); ctx.fill();
    }
    requestAnimationFrame(drawEyes);
  }
  addEventListener('resize', size);
  size();
  if (!reduced) {
    new IntersectionObserver(([e]) => { const was = live; live = e.isIntersecting; if (live && !was) requestAnimationFrame(drawEyes); }).observe(canvas);
    requestAnimationFrame(drawEyes);
  }

  /* ───────── Intro ───────── */
  const lines = $$('.intro-line');
  let timers = [];
  function endIntro() {
    timers.forEach(clearTimeout);
    lines.forEach(l => l.classList.remove('on'));
    document.body.classList.remove('is-intro');
    store.set('issyk-seen-intro', true);
  }
  if (reduced || store.get('issyk-seen-intro', false) || location.hash.length > 1) endIntro();
  else {
    lines.forEach((l, i) => {
      timers.push(setTimeout(() => l.classList.add('on'), 600 + i * 3000));
      timers.push(setTimeout(() => l.classList.remove('on'), 600 + i * 3000 + 2000));
    });
    timers.push(setTimeout(endIntro, 600 + lines.length * 3000));
  }
  $('.skip-intro').addEventListener('click', endIntro);

  /* ───────── Top bar + menu ───────── */
  const topbar = $('.topbar');
  new IntersectionObserver(([e]) => topbar.classList.toggle('solid', !e.isIntersecting), { threshold: 0.12 }).observe($('.hero'));
  const menuBtn = $('.menu-btn');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    $('.menu').setAttribute('aria-hidden', !open);
  }
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ───────── Reveals ───────── */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ───────── 1. Search the water with the light ───────── */
  const torch = $('.torch'), tc = $('#torch'), tx = tc.getContext('2d'), tcount = $('.torch-count');
  let TW, TH, fish = [], light = null, seen = new Set();
  function tsize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    TW = tc.clientWidth; TH = tc.clientHeight;
    tc.width = TW * dpr; tc.height = TH * dpr; tx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fish = Array.from({ length: 6 }, (_, i) => ({ id: i, x: Math.random() * TW, y: 60 + Math.random() * (TH - 120), v: (.25 + Math.random() * .4) * (Math.random() < .5 ? -1 : 1), l: 34 + Math.random() * 26, w: Math.random() * 6 }));
  }
  function drawFish(f) {
    tx.save(); tx.translate(f.x, f.y); if (f.v < 0) tx.scale(-1, 1);
    const sw = Math.sin(f.w) * 4;
    tx.fillStyle = '#9fb4c4';
    tx.beginPath(); tx.ellipse(0, 0, f.l / 2, f.l / 7, 0, 0, 7); tx.fill();
    tx.beginPath(); tx.moveTo(-f.l / 2 + 2, 0); tx.lineTo(-f.l / 2 - 10, -7 + sw); tx.lineTo(-f.l / 2 - 10, 7 + sw); tx.fill();
    tx.restore();
  }
  function torchLoop() {
    tx.fillStyle = '#03070b'; tx.fillRect(0, 0, TW, TH);
    for (const f of fish) {
      if (!reduced) { f.x += f.v; f.w += .15; }
      if (f.x < -50) f.x = TW + 50; if (f.x > TW + 50) f.x = -50;
    }
    if (light) {
      tx.save();
      const g = tx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 90);
      g.addColorStop(0, 'rgba(240, 220, 160, .35)'); g.addColorStop(1, 'rgba(240, 220, 160, 0)');
      tx.beginPath(); tx.arc(light.x, light.y, 90, 0, 7); tx.fillStyle = g; tx.fill(); tx.clip();
      fish.forEach(drawFish);
      tx.restore();
      for (const f of fish) if (Math.hypot(f.x - light.x, f.y - light.y) < 80) seen.add(f.id);
      tcount.textContent = seen.size ? (seen.size === fish.length ? 'You found all six. Now turn off the light, and strike.' : `${seen.size} fish found`) : '';
    }
    // eyes always glow, light or not
    for (const f of fish) {
      const ex = f.x + (f.v > 0 ? f.l / 2 - 6 : -f.l / 2 + 6);
      tx.fillStyle = 'rgba(240, 210, 120, .9)'; tx.shadowColor = 'rgba(240, 189, 85, 1)'; tx.shadowBlur = 10;
      tx.beginPath(); tx.arc(ex, f.y - 2, 1.8, 0, 7); tx.fill(); tx.shadowBlur = 0;
    }
    requestAnimationFrame(torchLoop);
  }
  function move(e) {
    const r = tc.getBoundingClientRect();
    light = { x: e.clientX - r.left, y: e.clientY - r.top };
    torch.classList.add('used');
  }
  torch.addEventListener('pointermove', move);
  torch.addEventListener('pointerdown', move);
  torch.addEventListener('pointerleave', () => { light = null; });
  addEventListener('resize', tsize);
  tsize(); requestAnimationFrame(torchLoop);

  /* ───────── 2. The fish ───────── */
  const FISH = {
    chebak: ['Native · Red Book', 'Chebak', 'Issyk-Kul dace. Once the most common commercial fish in the lake. My father says it lived by the shore in huge numbers; this is the fish we found with the light. Today it is close to extinction and has moved into deep water.'],
    marinka: ['Native · Red Book', 'Marinka', 'The biggest native fish, up to 70 cm and 8 kg. It spawns from May to mid-July in shallow, rocky water near the shore (FAO, 2013). I have never seen one in the wild. In Lipenka, villagers raise them in solar-heated tanks to release into the lake.'],
    osman: ['Native · Red Book', 'Naked osman', 'A native fish with almost no scales. Overfishing and poaching pushed it into serious decline. It is one of the two species the UNDP hatcheries have raised since 2008.'],
    sevan: ['Brought in · 1930', 'Sevan trout', 'From Lake Sevan in Armenia. In Issyk-Kul it grew up to 17 kg instead of 4, matured earlier, and laid five to six times more eggs (Bogdanowicz et al., 2017). It is a predator here, and endangered back home.'],
    sudak: ['Brought in · 1954–56', 'Pikeperch · sudak', 'Added with bream to boost the catch. Together with the trout it tipped the lake toward too many predators and too few prey, and total fish production fell (Alamanov & Mikkola, 2011).'],
    rainbow: ['Escaped · since the 1980s', 'Rainbow trout', 'Escaped from cage farms in the lake and spread everywhere (Blua, 2010). It is also my favorite fish to eat, which is the honest problem in this story.'],
  };
  const det = $('.fish-detail'), cards = $$('.fish-card');
  function showFish(k) {
    const [kick, name, text] = FISH[k];
    cards.forEach(c => c.setAttribute('aria-pressed', c.dataset.f === k));
    $('.kicker', det).textContent = kick;
    $('.kicker', det).style.color = kick.startsWith('Native') ? 'var(--blue)' : 'var(--ember)';
    $('h3', det).textContent = name;
    $('p', det).textContent = text;
    det.classList.remove('swap'); void det.offsetWidth; det.classList.add('swap');
  }
  cards.forEach(c => c.addEventListener('click', () => showFish(c.dataset.f)));
  showFish('chebak');

  /* ───────── 4. Counters + lake level ───────── */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const b = $('b', e.target), to = +b.dataset.count, dec = +(b.dataset.dec || 0);
    if (reduced) { b.textContent = to.toFixed(dec); return; }
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min(1, (t - t0) / 1600), v = to * (1 - Math.pow(1 - p, 3));
      b.textContent = v.toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: .5 });
  $$('.stat').forEach(s => cio.observe(s));

  const level = $('#level'), water = $('.lake-water'), out = $('.lvl-out'), eggs = $$('.spawn circle');
  function setLevel() {
    const v = +level.value;
    water.style.transform = `translateY(${70 + v * 1.1}px)`;
    eggs.forEach((c, i) => { c.style.opacity = v > 15 + i * 12 ? .15 : 1; });
    out.textContent = v === 0 ? 'today' : v < 50 ? 'lower' : 'much lower';
  }
  level.addEventListener('input', setLevel);
  setLevel();

  /* ───────── 7. Concept map ───────── */
  const NODES = [
    { id: 'c', x: 500, y: 320, s: 170, c: 'var(--gold)', label: 'Issyk-Kul fish, then and now', kick: 'Center', title: 'The native fish of Issyk-Kul', items: ['Chebak, marinka and naked osman: found nowhere else on Earth', 'All three are now in Kyrgyzstan’s Red Book', 'Tap any circle to follow one branch'] },
    { id: 'then', x: 150, y: 120, s: 120, c: 'var(--blue)', label: 'Then', kick: 'Then', title: 'The lake my father knew', items: ['Chebak by the shore in huge numbers', 'Spear fishing at night with a light', 'My grandfather’s rules, passed to my father, then to me', 'A cleaner lake, full of fish: “the best years of his life”'] },
    { id: 'pred', x: 500, y: 70, s: 120, c: 'var(--ember)', label: 'Predators', kick: 'What changed · 1', title: 'Predators brought in', items: ['Sevan trout from Armenia, 1930–36', 'Pikeperch and bream, 1954–56', 'Rainbow trout escaping cage farms since the 1980s', 'Only ~3% of Soviet introductions paid off (Bogdanowicz et al., 2017)'] },
    { id: 'over', x: 850, y: 120, s: 120, c: 'var(--ember)', label: 'Over-fishing', kick: 'What changed · 2', title: 'The 1990s collapse', items: ['USSR falls; fishing becomes a business', 'Nobody enforces the rules; mass poaching', 'Hatcheries lose their money (Alamanov & Mikkola, 2011)', 'The chebak retreats to deep water'] },
    { id: 'clim', x: 880, y: 400, s: 120, c: '#8fc0ec', label: 'Climate', kick: 'What changed · 3', title: 'The third pressure', items: ['+0.7–1.5°C and 45–130 mm less rain over 80 years (Salamat et al., 2015)', '16% of glacier area gone in 50 years; half could go by 2050', 'No outlet: the lake loses water only by evaporating', 'Kyrgyzstan: ~0.03% of global emissions (Najibullah, 2023)'] },
    { id: 'sol', x: 640, y: 560, s: 120, c: '#7fc59a', label: 'Solutions', kick: 'Solutions', title: 'Who is fixing it', items: ['Commercial fishing ban, 2023 → 2029', 'Lipenka villagers raise native fish in solar-heated tanks', 'Co-management with local fishers (Alamanov & Mikkola, 2011)', 'My grandfather’s rule: never fish during spawning', 'Our family’s own trout ponds'] },
    { id: 'tension', x: 340, y: 560, s: 120, c: 'var(--ember)', label: 'Tension', kick: 'The tension', title: 'Thanks for the trout', items: ['Trout is my favorite fish: red meat, easy to debone', 'It fed my family, just as the Soviets planned', 'It also pushed out the chebak', '“As long as the ecosystem stays balanced.” But it isn’t.'] },
    { id: 'cope', x: 120, y: 400, s: 120, c: 'var(--gold)', label: 'Coping', kick: 'Connections to class', title: 'Three kinds of coping', items: ['Problem-focused: the ban, the hatcheries, our ponds', 'Emotion-focused: sadness for the chebak, gratitude for the trout', 'Meaning-focused: a fishing tradition across three generations', 'Food as a way of remembering relationships (Ch. 4)'] },
  ];
  const svg = $('.cmap-lines'), wrap = $('.cmap-nodes'), cdet = $('.cmap-detail');
  const lineFor = {};
  NODES.slice(1).forEach(n => {
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 500); l.setAttribute('y1', 320); l.setAttribute('x2', n.x); l.setAttribute('y2', n.y);
    svg.appendChild(l); lineFor[n.id] = l;
  });
  const nodeBtns = NODES.map(n => {
    const b = document.createElement('button');
    b.className = 'node' + (n.id === 'c' ? ' center' : '');
    b.textContent = n.label;
    b.style.left = n.x / 10 + '%'; b.style.top = n.y / 6.4 + '%';
    b.style.setProperty('--s', `clamp(${Math.round(n.s * .55)}px, ${n.s / 10}vw, ${n.s}px)`);
    b.style.setProperty('--c', n.c);
    b.addEventListener('click', () => showNode(n.id));
    wrap.appendChild(b);
    return b;
  });
  function showNode(id) {
    const n = NODES.find(x => x.id === id);
    nodeBtns.forEach((b, i) => b.setAttribute('aria-pressed', NODES[i].id === id));
    Object.entries(lineFor).forEach(([k, l]) => l.classList.toggle('on', k === id));
    $('.kicker', cdet).textContent = n.kick;
    $('h3', cdet).textContent = n.title;
    $('ul', cdet).replaceChildren(...n.items.map(t => Object.assign(document.createElement('li'), { textContent: t })));
    cdet.classList.remove('swap'); void cdet.offsetWidth; cdet.classList.add('swap');
  }
  showNode('c');
})();
