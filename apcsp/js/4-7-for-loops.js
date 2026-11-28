const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escC = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const pyStr = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function hl(line) {
  let s = escC(line), out = '', last = 0, m;
  const re = /("(?:[^"\\]|\\.)*"|#.*$|\b(?:for|in|if|else|and|or|not)\b|\b(?:print|range|input|int|str)\b(?=\())/g;
  while ((m = re.exec(s))) {
    out += s.slice(last, m.index); const t = m[0];
    out += t[0] === '"' ? `<span class="st">${t}</span>` : t[0] === '#' ? `<span class="cm">${t}</span>` : /^(for|in|if|else|and|or|not)$/.test(t) ? `<span class="kw">${t}</span>` : `<span class="fn">${t}</span>`;
    last = m.index + t.length;
  }
  return out + s.slice(last);
}
function strip(el, n, cur, done) {
  let h = '';
  for (let k = 0; k < n; k++) h += `<div class="rbox ${k === cur ? 'cur' : (done !== undefined && k < done) ? 'done' : ''}">${k}</div>`;
  h += `<div class="rbox stop" title="range stops before this number">${n}</div>`;
  el.innerHTML = h;
}
function chipRow(box, items, label, onPick) {
  items.forEach(it => { const b = document.createElement('button'); b.textContent = label(it); b.onclick = () => onPick(it); box.appendChild(b); });
}

/* hero */
(() => {
  const r = $('heroN'), lab = $('heroNVal'), st = $('heroStrip'), now = $('heroNow');
  let n = 5, k = 0, timer;
  function tick() {
    if (k < n) { strip(st, n, k, k); now.textContent = `i = ${k}   (pass ${k + 1} of ${n})`; k++; }
    else { strip(st, n, -1, n); now.textContent = `range(${n}) is used up: the loop ran ${n} times`; k = 0; }
  }
  function reset() { n = +r.value; lab.textContent = n; k = 0;
    if (reduce) { strip(st, n, -1); now.textContent = `i takes the values 0 to ${n - 1}: ${n} passes`; return; }
    clearInterval(timer); tick(); timer = setInterval(tick, 750); }
  r.addEventListener('input', reset); reset();
})();

/* generic stepper */
function stepper(ids, build) {
  const src = $(ids.src), vars = $(ids.vars), out = $(ids.out), why = $(ids.why), step = $(ids.step);
  let prog, idx;
  function render() {
    const s = prog.states[idx];
    src.innerHTML = prog.lines.map((l, i) => `<div class="${i === s.line ? 'cur' : ''}"><b>${i + 1}</b>${hl(l)}</div>`).join('');
    const names = Object.keys(s.vars);
    vars.innerHTML = '<div><span class="h">variable</span><span class="h">value</span></div>' +
      (names.length ? names.map(n => `<div><span>${n}</span><span>${s.vars[n]}</span></div>`).join('') : '<div><span style="color:var(--muted)">(none yet)</span><span></span></div>');
    out.innerHTML = s.out.length ? escC(s.out.join('\n')) : '<span class="dim"># output</span>';
    why.innerHTML = s.msg;
    step.disabled = idx >= prog.states.length - 1;
    step.textContent = step.disabled ? 'Finished' : 'Run next step';
    if (ids.onState) ids.onState(s, prog);
  }
  step.onclick = () => { if (idx < prog.states.length - 1) { idx++; render(); } };
  $(ids.reset).onclick = () => { idx = 0; render(); };
  return {load: () => { prog = build(); idx = 0; render(); }};
}

/* 01 tracer */
(() => {
  let N = 3;
  const st = $('trStrip');
  const tr = stepper({src: 'trSrc', vars: 'trVars', out: 'trOut', why: 'trWhy', step: 'trStep', reset: 'trReset',
    onState: s => strip(st, N, s.i, s.doneUpTo)}, () => {
    const lines = [`for i in range(${N}):`, '    print(i)'], states = [], out = [];
    states.push({line: -1, vars: {}, out: [], i: -1, doneUpTo: 0, msg: 'Press <strong>Run next step</strong>. Before you click, predict what <code>i</code> will be.'});
    for (let k = 0; k < N; k++) {
      states.push({line: 0, vars: {i: k}, out: out.slice(), i: k, doneUpTo: k, msg: `<code>i</code> gets the next number from <code>range(${N})</code>: <strong>${k}</strong>. This is pass ${k + 1} of ${N}.`});
      out.push(String(k));
      states.push({line: 1, vars: {i: k}, out: out.slice(), i: k, doneUpTo: k, msg: `The indented body runs: <code>print(i)</code> shows ${k}.`});
    }
    states.push({line: 0, vars: N ? {i: N - 1} : {}, out: out.slice(), i: -1, doneUpTo: N,
      msg: N === 0 ? '<code>range(0)</code> has no numbers at all, so the body never runs and nothing prints.' : `<code>range(${N})</code> has no numbers left, so the loop ends after ${N} pass${N > 1 ? 'es' : ''}. Notice that ${N} itself was never printed, and <code>i</code> stays at its last value, ${N - 1}.`});
    return {lines, states};
  });
  chipRow($('trChips'), [3, 5, 1, 0], n => `range(${n})`, n => { N = n; tr.load(); });
  tr.load();
})();

/* 02 cheer machine */
(() => {
  const code = $('rpCode'), inp = $('rpIn'), out = $('rpOut'), why = $('rpWhy'), bug = $('rpBug');
  const showCode = () => { code.innerHTML = [ 'cheer = "Hip hip hooray!"', bug.checked ? 'times = input("How many cheers? ")' : 'times = int(input("How many cheers? "))', 'for i in range(times):', '    print(cheer)'].map(hl).join('\n'); };
  function run() {
    const raw = inp.value;
    let h = `How many cheers? <span class="in">${escC(raw)}</span>\n`, w;
    if (bug.checked) { h += `<span class="err">TypeError: 'str' object cannot be interpreted as an integer</span>`; w = '<code>input()</code> gives a string like <code>"3"</code>, and <code>range()</code> only accepts whole numbers. Wrapping the input in <code>int()</code> fixes it.'; }
    else if (!/^\s*[+-]?\d+\s*$/.test(raw)) { h += `<span class="err">ValueError: invalid literal for int() with base 10: ${escC(pyStr(raw))}</span>`; w = '<code>int()</code> needs digits, so the program crashes before the loop starts.'; }
    else {
      const n = parseInt(raw, 10), shown = Math.min(Math.max(n, 0), 60);
      h += Array(shown).fill('Hip hip hooray!').join('\n') + (n > 60 ? `\n<span class="dim">… (${n - 60} more)</span>` : '') + (n <= 0 ? '<span class="dim">(nothing printed)</span>' : '');
      w = n <= 0 ? `<code>range(${n})</code> is empty, so the body runs 0 times. No error, just no cheers.` : `<code>range(${n})</code> has ${n} number${n > 1 ? 's' : ''}, so the body ran ${n} time${n > 1 ? 's' : ''}. The body never uses <code>i</code>; the loop is only counting.`;
    }
    out.innerHTML = h; why.innerHTML = w;
  }
  chipRow($('rpChips'), ['3', '1', '0', '-2', 'three', '50'], x => x, x => { inp.value = x; run(); });
  bug.addEventListener('change', () => { showCode(); run(); });
  inp.addEventListener('input', run);
  inp.value = '3'; showCode(); run();
})();

/* 03 expression table: a tiny Python arithmetic evaluator */
function arith(src, iVal) {
  const t = []; let p = 0;
  const re = /\s*(\d+\.\d*|\.\d+|\d+|\*\*|\/\/|[-+*/%()]|[A-Za-z_]\w*|\S)/y;
  let m; re.lastIndex = 0;
  while (re.lastIndex < src.length && (m = re.exec(src))) { if (m[1] !== undefined) t.push(m[1]); }
  if (!t.length) throw {msg: 'Type an expression first.'};
  const num = (v, f) => ({v, f});
  function expr() { let a = term(); while (t[p] === '+' || t[p] === '-') { const o = t[p++], b = term(); a = num(o === '+' ? a.v + b.v : a.v - b.v, a.f || b.f); } return a; }
  function term() { let a = unary(); while (['*', '/', '//', '%'].includes(t[p])) { const o = t[p++], b = unary();
    if ((o === '/' || o === '//' || o === '%') && b.v === 0) throw {head: 'ZeroDivisionError: division by zero', msg: 'On at least one pass, the number you divide by works out to 0, and Python can’t divide by zero. Remember that <code>i</code> starts at 0.'};
    a = o === '*' ? num(a.v * b.v, a.f || b.f) : o === '/' ? num(a.v / b.v, true) : o === '//' ? num(Math.floor(a.v / b.v), a.f || b.f) : num(((a.v % b.v) + b.v) % b.v, a.f || b.f); } return a; }
  function unary() { if (t[p] === '-') { p++; const a = unary(); return num(-a.v, a.f); } if (t[p] === '+') { p++; return unary(); } return power(); }
  function power() { const a = atom(); if (t[p] === '**') { p++; const b = unary(); return num(Math.pow(a.v, b.v), a.f || b.f || b.v < 0); } return a; }
  function atom() {
    const k = t[p++];
    if (k === undefined) throw {msg: 'The expression ends too early.'};
    if (/^[\d.]/.test(k)) return num(parseFloat(k), k.includes('.'));
    if (k === 'i') return num(iVal, false);
    if (k === '(') { const a = expr(); if (t[p++] !== ')') throw {msg: 'A <code>(</code> is never closed.'}; return a; }
    if (k === '=') throw {msg: 'A single <code>=</code> stores a value; it can’t go inside <code>print()</code> like this.'};
    if (/^[A-Za-z_]/.test(k)) throw {head: `NameError: name '${k}' is not defined`, msg: `The only variable in this loop is <code>i</code>.`};
    throw {msg: `<code>${esc(k)}</code> isn’t something this lab understands. Use <code>i</code>, numbers, <code>+ - * / // % **</code>, and parentheses.`};
  }
  const r = expr(); if (p < t.length) throw {msg: 'Something extra is at the end. Is an operator missing between two values?'};
  return r;
}
const fmt = r => r.f ? (Number.isInteger(r.v) ? r.v.toFixed(1) : String(+r.v.toPrecision(15))) : String(r.v);
(() => {
  const inp = $('exIn'), nIn = $('exN'), out = $('exOut'), why = $('exWhy');
  chipRow($('exChips'), ['i', 'i + 1', 'i * 2', '2 * i + 1', 'i % 2', 'i * i', '10 - i', 'i / 2'], x => x, x => { inp.value = x; run(); });
  function run() {
    const n = Math.max(0, Math.min(20, Math.floor(+nIn.value || 0))), e = inp.value.trim();
    if (n === 0) { out.innerHTML = ''; why.innerHTML = '<code>range(0)</code> is empty, so the body never runs and nothing prints.'; return; }
    try {
      const rows = []; for (let k = 0; k < n; k++) rows.push([k, fmt(arith(e, k))]);
      out.innerHTML = '<table class="tt"><tr><th>pass</th><th>i</th><th>prints</th></tr>' + rows.map(([k, v]) => `<tr><td>${k + 1}</td><td>${k}</td><td><strong>${esc(v)}</strong></td></tr>`).join('') + '</table>';
      why.innerHTML = `The loop runs ${n} time${n > 1 ? 's' : ''}. The first line printed is <strong>${esc(rows[0][1])}</strong> and the last is <strong>${esc(rows[n - 1][1])}</strong>.` + (/\//.test(e) && !/\/\//.test(e) ? ' Notice the <code>.0</code>: dividing with <code>/</code> always gives a <code>float</code>.' : '');
    } catch (x) { out.innerHTML = x.head ? `<pre class="term"><span class="err">${esc(x.head)}</span></pre>` : `<pre class="term"><span class="err">SyntaxError: invalid syntax</span></pre>`; why.innerHTML = x.msg; }
  }
  inp.addEventListener('input', run); nIn.addEventListener('input', run); run();
})();

/* 04 worm builder */
(() => {
  const W = 400, H = 300;
  const RS = [['get_width() / NUM_CIRCLES', N => W / N], ['get_width() / NUM_CIRCLES / 2', N => W / N / 2], ['get_width() / 2', () => W / 2], ['NUM_CIRCLES / 2', N => N / 2]];
  const XS = [['RADIUS + i * 2 * RADIUS', (i, r) => r + i * 2 * r], ['i * 2 * RADIUS', (i, r) => i * 2 * r], ['RADIUS + 2 * RADIUS', (i, r) => r + 2 * r], ['i * RADIUS', (i, r) => i * r]];
  const rSel = $('wmR'), xSel = $('wmX'), nIn = $('wmN'), nVal = $('wmNVal'), col = $('wmC'), svg = $('wmSvg'), st = $('wmStatus'), tbl = $('wmTable');
  RS.forEach(([t], k) => rSel.add(new Option(t, k)));
  XS.forEach(([t], k) => xSel.add(new Option(t, k)));
  const nice = v => Number.isInteger(v) ? String(v) : (+v.toFixed(2)).toString();
  function draw() {
    const N = +nIn.value; nVal.textContent = N;
    const r = RS[+rSel.value][1](N), xf = XS[+xSel.value][1], y = H / 2;
    let s = '';
    const xs = []; for (let i = 0; i < N; i++) xs.push(xf(i, r));
    xs.forEach((x, i) => { const c = col.checked ? (i % 2 === 0 ? '#d23b3b' : '#2e9e4f') : '#111'; s += `<circle cx="${x}" cy="${y}" r="${Math.max(r, 0)}" fill="${c}" stroke="#fff" stroke-width="${N > 20 ? 0.5 : 1}"/>`; });
    svg.innerHTML = s;
    const eps = 0.01, left = xs[0] - r, right = xs[N - 1] + r, spacing = N > 1 ? xs[1] - xs[0] : 2 * r, msgs = [];
    if (N > 1 && Math.abs(spacing) < eps) msgs.push('every circle is drawn in the same spot, because x never changes with i');
    else if (spacing < 2 * r - eps) msgs.push('the circles overlap');
    else if (spacing > 2 * r + eps) msgs.push('there are gaps between circles');
    if (left < -eps) msgs.push('the first circle hangs off the left edge');
    else if (left > eps) msgs.push('there’s a gap at the left edge');
    if (right > W + eps) msgs.push('the worm runs off the right edge');
    else if (right < W - eps) msgs.push('the worm doesn’t reach the right edge');
    if (!msgs.length) { st.className = 'status ok'; st.textContent = `✓ Fits exactly: ${N} circles with radius ${nice(r)} touch both edges. Try other values of NUM_CIRCLES.`; }
    else { st.className = 'status bad'; st.textContent = '✗ ' + msgs.join('; ').replace(/^./, c => c.toUpperCase()) + '.'; }
    const show = N <= 6 ? [...Array(N).keys()] : [0, 1, 2, -1, N - 2, N - 1];
    tbl.innerHTML = `<table class="tt"><tr><th>i</th><th>RADIUS</th><th>x (center)</th><th>left edge</th><th>right edge</th>${col.checked ? '<th>i % 2</th>' : ''}</tr>` +
      show.map(i => i < 0 ? `<tr><td colspan="${col.checked ? 6 : 5}">⋮</td></tr>` : `<tr><td>${i}</td><td>${nice(r)}</td><td>${nice(xs[i])}</td><td>${nice(xs[i] - r)}</td><td>${nice(xs[i] + r)}</td>${col.checked ? `<td>${i % 2}</td>` : ''}</tr>`).join('') + '</table>';
  }
  [rSel, xSel, nIn, col].forEach(e => e.addEventListener('input', draw));
  draw();
})();

/* 05 accumulator */
(() => {
  const bug = $('acBug');
  const ac = stepper({src: 'acSrc', vars: 'acVars', out: 'acOut', why: 'acWhy', step: 'acStep', reset: 'acReset'}, () => {
    const B = bug.checked, LAPS = 4;
    const lines = B ? ['for lap in range(4):', '    distance = 0', '    distance = distance + 400', '    print("Distance", distance)']
                    : ['distance = 0', 'for lap in range(4):', '    distance = distance + 400', '    print("Distance", distance)'];
    const states = [{line: -1, vars: {}, out: [], msg: 'Press <strong>Run next step</strong>. Predict the value of <code>distance</code> after each line.'}];
    const out = []; let d, vars = {};
    const forL = B ? 0 : 1, resetL = B ? 1 : 0;
    if (!B) { d = 0; vars = {distance: 0}; states.push({line: 0, vars: {...vars}, out: [], msg: '<code>distance</code> starts at 0. This line is above the loop, so it runs only once.'}); }
    for (let k = 0; k < LAPS; k++) {
      vars = {...vars, lap: k};
      states.push({line: forL, vars: {...vars}, out: out.slice(), msg: `Pass ${k + 1}: <code>lap</code> is ${k}.`});
      if (B) { d = 0; vars.distance = 0; states.push({line: resetL, vars: {...vars}, out: out.slice(), msg: `<code>distance</code> is set back to 0, <strong>again</strong>. This line is inside the loop, so it runs every pass.`}); }
      const before = d; d += 400; vars.distance = d;
      states.push({line: 2, vars: {...vars}, out: out.slice(), msg: `Read ${before}, add 400, store ${d}.`});
      out.push('Distance ' + d);
      states.push({line: 3, vars: {...vars}, out: out.slice(), msg: `Prints <code>Distance ${d}</code>.`});
    }
    states.push({line: forL, vars: {...vars}, out: out.slice(), msg: B ? 'The loop is done, but <code>distance</code> never got past 400, because it was reset to 0 at the start of every pass. A running total must start <em>before</em> the loop.' : `The loop is done. <code>distance</code> kept growing, 400 → 800 → 1200 → 1600, because it was set to 0 only once, before the loop.`});
    return {lines, states};
  });
  bug.addEventListener('change', ac.load);
  ac.load();
})();

/* 08 quiz */
(() => {
  const Q = [
    {q: 'What is the last number printed?', code: 'for i in range(4):\n    print(i)', opts: ['3', '4', '5', '0'], a: 0, why: '<code>range(4)</code> is 0, 1, 2, 3. It stops <em>before</em> 4.'},
    {q: 'How many times is “hi” printed?', code: 'for i in range(0):\n    print("hi")', opts: ['0', '1', 'An error'], a: 0, why: '<code>range(0)</code> has no numbers, so the body never runs. That isn’t an error.'},
    {q: 'What does this print?', code: 'for i in range(3):\n    print(i * 2)', opts: ['0\n2\n4', '2\n4\n6', '0\n1\n2', '6'], a: 0, why: '<code>i</code> is 0, 1, 2, so <code>i * 2</code> is 0, 2, 4.'},
    {q: 'The user types 3. What happens?', code: 'n = input("Number? ")\nfor i in range(n):\n    print("hi")', opts: ['hi is printed 3 times', 'hi is printed 4 times', 'TypeError'], a: 2, why: '<code>n</code> is the string <code>"3"</code>, and <code>range()</code> needs a whole number. Use <code>int(input(...))</code>.'},
    {q: 'What does this print?', code: 'total = 0\nfor i in range(4):\n    total = total + i\nprint(total)', opts: ['4', '6', '10', '0\n1\n3\n6'], a: 1, why: 'It adds 0 + 1 + 2 + 3 = 6. The <code>print</code> isn’t indented, so it runs once, after the loop.'},
    {q: 'What does this print?', code: 'for i in range(3):\n    total = 0\n    total = total + 5\nprint(total)', opts: ['5', '15', '0', 'An error'], a: 0, why: '<code>total</code> is reset to 0 every pass, so it ends as 0 + 5 = 5. Running totals must start before the loop.'},
    {q: 'The canvas is 400 wide and NUM_CIRCLES is 10. If the worm fits exactly, what is RADIUS?', code: '', opts: ['40', '20', '10', '200'], a: 1, why: '10 circles across 400 pixels means each is 40 wide. The radius is half the width: 20.'},
    {q: 'In Caterpillar, even values of i are red and odd values are green. What color is the circle drawn when i is 7?', code: '', opts: ['Red', 'Green'], a: 1, why: '<code>7 % 2</code> is 1, so 7 is odd: green.'},
    {q: 'What does this AP pseudocode display?', code: 'x ← 1\nREPEAT 4 TIMES\n{\n   x ← x * 2\n}\nDISPLAY(x)', opts: ['8', '16', '32', '4'], a: 1, why: '1 → 2 → 4 → 8 → 16. Four passes, each one doubling <code>x</code>.'}
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
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); });
  }, {rootMargin: '-30% 0px -60% 0px'});
  links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
})();
