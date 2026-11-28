const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escC = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const PY = v => v ? 'True' : 'False';
const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
const keyStr = k => JSON.stringify(k);

function hl(line) {
  let s = escC(line), out = '', last = 0, m;
  const re = /("(?:[^"\\]|\\.)*"|#.*$|\b(?:def|if|else|and|or|not)\b|\b(?:print|add|add_key_down_handler|Rectangle)\b(?=\())/g;
  while ((m = re.exec(s))) {
    out += s.slice(last, m.index); const t = m[0];
    out += t[0] === '"' ? `<span class="st">${t}</span>` : t[0] === '#' ? `<span class="cm">${t}</span>` : /^(def|if|else|and|or|not)$/.test(t) ? `<span class="kw">${t}</span>` : `<span class="fn">${t}</span>`;
    last = m.index + t.length;
  }
  return out + s.slice(last);
}

/* a focusable canvas that reports key presses, like the CodeHS canvas */
function stage(el, cfg) {
  const [w, h] = cfg.vb;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"></svg>${cfg.noTap ? '' : `<div class="tap">${cfg.tap || 'Click here, then press the arrow keys'}</div>`}`;
  const svg = el.querySelector('svg');
  if (!cfg.noTap) {
    el.addEventListener('click', () => el.focus());
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
    el.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab') return;
      if (ARROWS.includes(e.key) || e.key === ' ') e.preventDefault();
      cfg.onKey(e.key);
    });
  }
  return {draw: html => { svg.innerHTML = html; }};
}
function pad(el, onKey) {
  const cells = [null, ['ArrowUp', '↑'], null, ['ArrowLeft', '←'], ['ArrowDown', '↓'], ['ArrowRight', '→']];
  el.innerHTML = cells.map(c => c ? `<button data-k="${c[0]}" aria-label="${c[0]}">${c[1]}</button>` : '<button class="sp" tabindex="-1" aria-hidden="true"></button>').join('');
  el.querySelectorAll('button[data-k]').forEach(b => b.onclick = () => onKey(b.dataset.k));
}
const MOVES = {ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5]};

/* hero */
(() => {
  let x = 130, y = 110;
  const read = $('heroRead');
  const st = stage($('heroStage'), {vb: [300, 260], onKey: k => {
    read.innerHTML = `event.key = <b>${esc(keyStr(k))}</b>`;
    if (MOVES[k]) { x += MOVES[k][0] * 2; y += MOVES[k][1] * 2; draw(); }
  }});
  const draw = () => st.draw(`<rect class="shape-sq" x="${x}" y="${y}" width="40" height="40" rx="3"/>`);
  draw();
})();

/* 01 Keyboard Square */
(() => {
  const L = ["# Don't forget to click on the canvas after you run!", '# The keys will not register until you click the canvas!', 'def key_down(event):',
    '    if event.key == "ArrowLeft":', '        square.move(-5, 0)', '    if event.key == "ArrowRight":', '        square.move(5, 0)',
    '    if event.key == "ArrowUp":', '        square.move(0, -5)', '    if event.key == "ArrowDown":', '        square.move(0, 5)', '',
    'square = Rectangle(40, 40)', 'square.set_position(100, 100)', 'add(square)', '', 'add_key_down_handler(key_down)'];
  const SETUP = [2, 12, 13, 14, 16], IFS = {3: 'ArrowLeft', 5: 'ArrowRight', 7: 'ArrowUp', 9: 'ArrowDown'};
  const code = $('ksCode'), log = $('ksLog');
  let x = 100, y = 100;
  function show(ran, cond = {}) {
    code.innerHTML = L.map((l, i) => {
      const cls = ran.includes(i) ? 'ran' : (l.trim() === '' || l.startsWith('#')) ? '' : 'skip';
      const c = i in cond ? `<span class="cond ${cond[i] ? 't' : 'f'}">→ ${PY(cond[i])}</span>` : '';
      return `<div class="${cls}"><b>${i + 1}</b>${hl(l) || ' '}${c}</div>`;
    }).join('');
  }
  const st = stage($('ksStage'), {vb: [400, 300], onKey: press});
  const draw = () => st.draw(`<rect class="shape-sq" x="${x}" y="${y}" width="40" height="40" rx="2"/>`);
  function press(k) {
    const cond = {}; const ran = [2];
    Object.entries(IFS).forEach(([i, name]) => { i = +i; ran.push(i); cond[i] = k === name; if (k === name) ran.push(i + 1); });
    show(ran, cond);
    if (MOVES[k]) {
      x += MOVES[k][0]; y += MOVES[k][1]; draw();
      log.innerHTML += `\n<span class="k">event.key = ${esc(keyStr(k))}</span>  → square.move(${MOVES[k].join(', ')})  → position <span class="ok">(${x}, ${y})</span>`;
    } else {
      log.innerHTML += `\n<span class="k">event.key = ${esc(keyStr(k))}</span>  → <span class="no">no if matched, nothing happens</span>`;
    }
    log.scrollTop = log.scrollHeight;
  }
  pad($('ksPad'), press);
  show(SETUP); draw();
  log.innerHTML = '<span class="dim"># Setup ran once: key_down was defined, the square was made and added,\n# and key_down was connected to key presses. Now the program waits...</span>';
})();

/* 02 key inspector */
(() => {
  const box = $('keyBox'), big = $('keyBig'), hint = $('keyHint'), log = $('keyLog');
  let first = true;
  box.addEventListener('keydown', e => {
    if (e.key === 'Tab') return;
    e.preventDefault();
    big.textContent = 'event.key == ' + keyStr(e.key);
    hint.textContent = e.key === ' ' ? 'The space bar is a string with one space in it.' : e.key.length === 1 ? (e.key !== e.key.toLowerCase() ? 'A capital letter: Shift (or Caps Lock) changes the string.' : 'A single character.') : 'A named key: check the capitals.';
    if (first) { log.innerHTML = ''; first = false; }
    log.innerHTML += (log.innerHTML ? '\n' : '') + `<span class="k">${esc(keyStr(e.key))}</span>`;
    log.scrollTop = log.scrollHeight;
  });
})();

/* 03 move lab with grid */
(() => {
  let x = 100, y = 100;
  const read = $('mvRead'), log = $('mvLog');
  const st = stage($('mvStage'), {vb: [400, 300], noTap: true});
  let grid = '<g class="grid">';
  for (let i = 0; i <= 400; i += 50) grid += `<line x1="${i}" y1="0" x2="${i}" y2="300"/>`;
  for (let j = 0; j <= 300; j += 50) grid += `<line x1="0" y1="${j}" x2="400" y2="${j}"/>`;
  grid += '</g><g class="axis">';
  for (let i = 50; i < 400; i += 50) grid += `<text x="${i + 2}" y="12">${i}</text>`;
  for (let j = 50; j < 300; j += 50) grid += `<text x="3" y="${j - 3}">${j}</text>`;
  grid += '<text x="3" y="12">(0,0)</text></g>';
  const draw = () => { st.draw(grid + `<rect class="shape-sq" x="${x}" y="${y}" width="40" height="40" rx="2"/>`); read.innerHTML = `square position: <b>(${x}, ${y})</b>`; };
  const moves = [[5, 0], [-5, 0], [0, 5], [0, -5], [50, 0], [0, -50]];
  const box = $('mvBtns');
  moves.forEach(([dx, dy]) => { const b = document.createElement('button'); b.innerHTML = `<code style="background:none;padding:0">square.move(${dx}, ${dy})</code>`; b.onclick = () => {
    x += dx; y += dy; draw();
    const dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    log.innerHTML += `\nmove(${dx}, ${dy}) → ${dir}: <span class="ok">(${x}, ${y})</span>` + (dy ? `  <span class="dim">y ${dy > 0 ? 'grew, so it went DOWN' : 'shrank, so it went UP'}</span>` : '');
    log.scrollTop = log.scrollHeight; }; box.appendChild(b); });
  const r = document.createElement('button'); r.textContent = 'Reset to (100, 100)'; r.onclick = () => { x = 100; y = 100; draw(); log.innerHTML = '<span class="dim"># square.set_position(100, 100)</span>'; }; box.appendChild(r);
  log.innerHTML = '<span class="dim"># square.set_position(100, 100)</span>';
  draw();
})();

/* 04 / 05 circle labs */
function circleLab(ids, opts) {
  let r = 100;
  const read = $(ids.read), log = $(ids.log);
  const st = stage($(ids.stage), {vb: [500, 500], tap: 'Click here, then press ← or →', onKey: k => { if (k === 'ArrowLeft' || k === 'ArrowRight') act(k); }});
  const draw = () => {
    st.draw(r > 0 ? `<circle class="shape-ci" cx="250" cy="250" r="${r}"/><text x="250" y="250" text-anchor="middle" dominant-baseline="central" style="font:600 22px var(--mono);fill:var(--ink)">${r}</text>` : `<text x="250" y="250" text-anchor="middle" style="font:600 20px var(--sans);fill:var(--false)">radius ${r}: nothing to draw</text>`);
    read.innerHTML = `get_radius() is now <b>${r}</b>`;
  };
  function act(k) {
    const grow = k === 'ArrowRight', nr = r + (grow ? 10 : -10);
    let line = `<span class="k">${k}</span>  read: get_radius() → ${r}`;
    if (opts.limits && opts.limits() && ((grow && r >= 400) || (!grow && r <= 10))) {
      line += `  → <span class="no">at the ${grow ? '400' : '10'} limit, so the size doesn’t change</span>`;
    } else {
      line += `  change: ${r} ${grow ? '+' : '-'} 10 = ${nr}  write: set_radius(${nr})`;
      if (nr <= 0) line += `  <span class="no">← a radius of ${nr} makes no sense</span>`;
      r = nr;
    }
    log.innerHTML += '\n' + line; log.scrollTop = log.scrollHeight; draw();
  }
  const box = $(ids.btns);
  [['ArrowLeft', '← left arrow'], ['ArrowRight', '→ right arrow']].forEach(([k, t]) => { const b = document.createElement('button'); b.textContent = t; b.onclick = () => act(k); box.appendChild(b); });
  const rs = document.createElement('button'); rs.textContent = 'Reset to 100'; rs.onclick = () => { r = 100; log.innerHTML = '<span class="dim"># my_circle starts with a radius of 100</span>'; draw(); }; box.appendChild(rs);
  log.innerHTML = '<span class="dim"># my_circle starts with a radius of 100</span>';
  draw();
}
circleLab({stage: 'grStage', btns: 'grBtns', read: 'grRead', log: 'grLog'}, {});
circleLab({stage: 'limStage', btns: 'limBtns', read: 'limRead', log: 'limLog'}, {limits: () => $('limOn').checked});

/* 08 quiz */
(() => {
  const Q = [
    {q: 'Which line makes a function named on_key run every time a key is pressed?', code: '', opts: ['add_key_down_handler(on_key())', 'add_key_down_handler("on_key")', 'add_key_down_handler(on_key)', 'on_key(event)'], a: 2,
     why: 'You hand over the function itself, by name, with no parentheses and no quotes. Python calls it later, once per key press.'},
    {q: 'Which way does this move the square?', code: 'square.move(0, -5)', opts: ['Up', 'Down', 'Left', 'Right'], a: 0,
     why: 'dx is 0, so no sideways movement. y gets smaller, and on a canvas smaller y is higher up.'},
    {q: 'In 4.6.3 Keyboard Square, the square starts at (100, 100). The user presses →, →, then ↑. Where is it now?', code: '', opts: ['(110, 105)', '(110, 95)', '(90, 95)', '(105, 95)'], a: 1,
     why: 'Each → adds 5 to x: 100 → 110. ↑ subtracts 5 from y: 100 → 95.'},
    {q: 'The user presses the left arrow. What happens?', code: 'def key_down(event):\n    if event.key == "arrowleft":\n        square.move(-5, 0)', opts: ['The square moves left', 'Nothing happens', 'An error'], a: 1,
     why: '<code>event.key</code> is <code>"ArrowLeft"</code>, and <code>"arrowleft"</code> is a different string, so the condition is False. No error: the <code>if</code> just never runs.'},
    {q: 'In 4.6.3, when does the line square.move(-5, 0) run?', code: '', opts: ['Once, when you press Run', 'Every time any key is pressed', 'Every time the left arrow is pressed', 'Never'], a: 2,
     why: 'It’s inside the handler, so it only runs when a key is pressed, and it’s inside the <code>if</code>, so only for the left arrow.'},
    {q: 'A circle starts with radius 100. Each → reads the radius and sets it 10 bigger; each ← sets it 10 smaller. The user presses → → → ←. What’s the radius?', code: '', opts: ['110', '120', '130', '140'], a: 1,
     why: '100 → 110 → 120 → 130, then ← brings it back to 120.'},
    {q: 'The user presses 5 keys. How many times is “Ready!” printed?', code: 'def key_down(event):\n    square.move(5, 0)\n\nsquare = Rectangle(40, 40)\nadd(square)\nadd_key_down_handler(key_down)\nprint("Ready!")', opts: ['0', '1', '5', '6'], a: 1,
     why: '<code>print("Ready!")</code> is part of the setup, not the handler, so it runs once when you press Run. Only code inside <code>key_down</code> repeats.'},
    {q: 'The radius is already 400. The handler only grows the circle when the radius is less than 400. The user presses →. What’s the radius now?', code: '', opts: ['400', '410', '390', 'An error'], a: 0,
     why: '<code>400 &lt; 400</code> is False, so the change is skipped and the radius stays at the limit.'}
  ];
  const box = $('quizBox'), sc = $('score');
  let right, tried;
  function build() {
    right = 0; tried = 0; sc.textContent = `Score: 0 / ${Q.length}`;
    box.innerHTML = '';
    Q.forEach((item, qi) => {
      const d = document.createElement('div'); d.className = 'quiz';
      d.innerHTML = `<div class="q">${qi + 1}. ${item.q}</div>` + (item.code ? `<pre class="code">${esc(item.code)}</pre>` : '') + '<div class="opts"></div><div class="fb"></div>';
      const opts = d.querySelector('.opts'), fb = d.querySelector('.fb');
      item.opts.forEach((o, oi) => {
        const b = document.createElement('button'); b.textContent = o;
        b.onclick = () => {
          opts.querySelectorAll('button').forEach(x => x.disabled = true);
          opts.children[item.a].classList.add('right');
          if (oi !== item.a) b.classList.add('wrong'); else right++;
          tried++;
          fb.innerHTML = (oi === item.a ? '<strong style="color:var(--true)">Correct.</strong> ' : '<strong style="color:var(--false)">Not quite.</strong> ') + item.why;
          fb.style.display = 'block';
          sc.textContent = `Score: ${right} / ${Q.length}` + (tried === Q.length ? (right === Q.length ? '. Perfect, you’re ready for the CodeHS quiz.' : '. Review the explanations, then reset and try again.') : '');
        };
        opts.appendChild(b);
      });
      box.appendChild(d);
    });
  }
  $('quizReset').onclick = build;
  build();
})();

/* highlight the current section in the nav */
(() => {
  const links = [...document.querySelectorAll('nav a')];
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); });
  }, {rootMargin: '-30% 0px -60% 0px'});
  links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
})();
