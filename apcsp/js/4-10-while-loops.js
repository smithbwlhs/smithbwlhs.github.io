const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escC = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const pyStr = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const PY = v => v ? 'True' : 'False';
function hl(line) {
  let s = escC(line), out = '', last = 0, m;
  const re = /("(?:[^"\\]|\\.)*"|#.*$|\/\/.*$|\b(?:for|in|if|else|while|not|and|or|REPEAT|UNTIL|TIMES)\b|\b(?:print|range|input|int|str|DISPLAY)\b(?=\s*\())/g;
  while ((m = re.exec(s))) {
    out += s.slice(last, m.index); const t = m[0];
    out += t[0] === '"' ? `<span class="st">${t}</span>` : (t[0] === '#' || t.startsWith('//')) ? `<span class="cm">${t}</span>` : /^[a-zA-Z]+$/.test(t) && !/^(print|range|input|int|str|DISPLAY)$/.test(t) ? `<span class="kw">${t}</span>` : `<span class="fn">${t}</span>`;
    last = m.index + t.length;
  }
  return out + s.slice(last);
}
function chipRow(box, items, label, onPick) {
  items.forEach(it => { const b = document.createElement('button'); b.textContent = label(it); b.onclick = () => onPick(it); box.appendChild(b); });
}

/* hero */
(() => {
  const g = $('hjG'), gv = $('hjGv'), code = $('hjCode'), big = $('hjBig'), bar = $('hjBar');
  function run() {
    const goal = +g.value; gv.textContent = goal;
    let saved = 0, weeks = 0; while (saved < goal) { saved += 25; weeks++; }
    code.innerHTML = [`saved = 0`, `weeks = 0`, `while saved &lt; ${goal}:`, `    saved += 25`, `    weeks += 1`].join('\n');
    big.innerHTML = `${weeks} <small>week${weeks === 1 ? '' : 's'} · saved $${saved}</small>`;
    bar.style.width = Math.min(100, saved / 5) + '%';
    if (goal === 0) big.innerHTML = '0 <small>weeks · the condition was False from the start</small>';
  }
  g.addEventListener('input', run); run();
})();

/* 01 countdown stepper */
(() => {
  const L = ['i = 10', '', 'while i >= 0:', '    print(i)', '    i -= 1'];
  const states = [{line: -1, i: null, out: [], msg: 'Press <strong>Run next step</strong>. Predict the last number before you get there.'}];
  let i = 10, out = [];
  states.push({line: 0, i, out: [], msg: '<code>i</code> is set up to 10, once, before the loop.'});
  while (true) {
    const c = i >= 0;
    states.push({line: 2, i, out: out.slice(), check: c, msg: `Check: is <code>${i} &gt;= 0</code>? ${c ? '<span class="tv">True</span>, so the body runs.' : '<span class="fv">False</span>, so the loop ends.'}`});
    if (!c) break;
    out.push(String(i));
    states.push({line: 3, i, out: out.slice(), msg: `Prints ${i}.`});
    i -= 1;
    states.push({line: 4, i, out: out.slice(), msg: `<code>i</code> goes down to ${i}. Back to the top to check again.`});
  }
  states[states.length - 1].msg += ' It printed 11 numbers, 10 down to 0, and <code>i</code> ends at -1.';
  let k = 0;
  const src = $('cdSrc'), vars = $('cdVars'), o = $('cdOut'), why = $('cdWhy'), step = $('cdStep');
  function render() {
    const s = states[k];
    src.innerHTML = L.map((l, n) => `<div class="${n === s.line ? 'cur' : ''}"><b>${n + 1}</b>${hl(l) || ' '}${n === s.line && s.check !== undefined ? `<span class="cond ${s.check ? 't' : 'f'}">→ ${PY(s.check)}</span>` : ''}</div>`).join('');
    vars.innerHTML = '<div><span class="h">variable</span><span class="h">value</span></div>' + (s.i === null ? '<div><span style="color:var(--muted)">(none yet)</span><span></span></div>' : `<div><span>i</span><span>${s.i}</span></div>`);
    o.textContent = s.out.join('\n') || '# output'; o.scrollTop = o.scrollHeight;
    why.innerHTML = s.msg;
    step.disabled = k >= states.length - 1; step.textContent = step.disabled ? 'Finished' : 'Run next step';
  }
  step.onclick = () => { if (k < states.length - 1) { k++; render(); } };
  $('cdFast').onclick = () => { k = states.length - 1; render(); };
  $('cdReset').onclick = () => { k = 0; render(); };
  render();
})();

/* 02 loop doctor */
(() => {
  const C = [
    {label: 'healthy loop', code: ['i = 0', 'while i < 5:', '    print(i)', '    i += 1'], run: () => sim(0, i => i < 5, i => i + 1)},
    {label: 'forgot to change i', code: ['i = 0', 'while i < 5:', '    print(i)'], run: () => sim(0, i => i < 5, i => i), why: 'Nothing in the body changes <code>i</code>, so <code>0 &lt; 5</code> is True forever.'},
    {label: 'changes the wrong way', code: ['i = 0', 'while i < 5:', '    print(i)', '    i -= 1'], run: () => sim(0, i => i < 5, i => i - 1), why: '<code>i</code> moves away from 5 (0, -1, -2, …), so it never stops being less than 5.'},
    {label: 'jumps over the target', code: ['i = 0', 'while i != 5:', '    print(i)', '    i += 2'], run: () => sim(0, i => i !== 5, i => i + 2), why: '<code>i</code> goes 0, 2, 4, 6, … and is never exactly 5, so <code>!=</code> stays True. Conditions like <code>&lt;</code> are safer than <code>!=</code>.'},
    {label: 'never starts', code: ['i = 10', 'while i < 5:', '    print(i)', '    i += 1'], run: () => sim(10, i => i < 5, i => i + 1), why: ''},
    {label: 'forgot to set up', code: ['while i < 5:', '    print(i)', '    i += 1'], run: () => ({err: "NameError: name 'i' is not defined", out: []}), why: 'The very first check needs <code>i</code>, but it was never created.'}
  ];
  function sim(start, cond, upd) {
    const out = []; let i = start, n = 0;
    while (cond(i)) { out.push(String(i)); i = upd(i); if (++n >= 25) return {out, inf: true}; }
    return {out, passes: n};
  }
  const code = $('drCode'), outEl = $('drOut'), v = $('drVerdict');
  function show(c) {
    code.innerHTML = c.code.map(hl).join('\n');
    const r = c.run();
    outEl.innerHTML = r.err ? `<span class="err">${esc(r.err)}</span>` : (r.out.join('\n') + (r.inf ? '\n<span class="dim">… still going …</span>' : '')) || '<span class="dim">(nothing printed)</span>';
    v.innerHTML = r.err ? `<div class="warnbox">Crash before the first pass. ${c.why}</div>` : r.inf ? `<div class="warnbox">⚠ Still running after 25 passes: an infinite loop. ${c.why}</div>` : r.passes === 0 ? '<div class="okbox">Zero passes. The condition was False the very first time it was checked, so the body never ran. That’s not an error, but it might not be what you wanted.</div>' : `<div class="okbox">✓ Ends after ${r.passes} passes: set up, check, and change all work together.</div>`;
  }
  chipRow($('drChips'), C, c => c.label, show);
  show(C[0]);
})();

/* 03 sentinel console */
(() => {
  const P = 'Price (0 to finish): ', out = $('tlOut'), row = $('tlRow'), inp = $('tlIn');
  let inputs = [];
  function render() {
    let h = '', total = 0, k = 0, done = false, err = null;
    const ask = () => { if (k >= inputs.length) return null; const v = inputs[k++]; h += `${P}<span class="in">${escC(v)}</span>\n`; if (!/^\s*[+-]?\d+\s*$/.test(v)) { err = `ValueError: invalid literal for int() with base 10: ${pyStr(v)}`; return 'ERR'; } return parseInt(v, 10); };
    let price = ask();
    while (price !== null && price !== 'ERR' && price !== 0) { total += price; h += `Running total: ${total}\n`; price = ask(); }
    if (price === 'ERR') h += `<span class="err">${escC(err)}</span>`;
    else if (price === 0) { h += `Final total: ${total}\n<span class="dim">(program finished)</span>`; done = true; }
    out.innerHTML = h || '<span class="dim"># type a price and press Enter</span>'; out.scrollTop = out.scrollHeight;
    row.style.display = (done || price === 'ERR') ? 'none' : '';
  }
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { inputs.push(inp.value); inp.value = ''; render(); } });
  $('tlReset').onclick = () => { inputs = []; render(); };
  render();
})();

/* 05 order the updates */
(() => {
  const LINES = {A: '    next_num = first + second + 1', B: '    first = second', C: '    second = next_num'};
  let order = ['B', 'C', 'A'];
  const list = $('ordList'), tbl = $('ordTable'), verdict = $('ordVerdict');
  function sim(ord) {
    let first = 1, second = 1, next; const out = ['1']; let n = 0;
    while (second < 100) {
      out.push(String(second));
      for (const k of ord) {
        if (k === 'A') next = first + second + 1;
        if (k === 'B') first = second;
        if (k === 'C') { if (next === undefined) return {out, err: "NameError: name 'next_num' is not defined"}; second = next; }
      }
      if (++n > 30) return {out, inf: true};
    }
    return {out};
  }
  const want = sim(['A', 'B', 'C']).out.join(',');
  function render() {
    list.innerHTML = order.map((k, p) => `<div class="ln"><span>${hl(LINES[k])}</span><button data-p="${p}" data-d="-1" aria-label="Move up" ${p === 0 ? 'disabled' : ''}>↑</button><button data-p="${p}" data-d="1" aria-label="Move down" ${p === 2 ? 'disabled' : ''}>↓</button></div>`).join('');
    list.querySelectorAll('button').forEach(b => b.onclick = () => { const p = +b.dataset.p, q = p + +b.dataset.d; [order[p], order[q]] = [order[q], order[p]]; render(); });
    const r = sim(order);
    tbl.innerHTML = `<pre class="term">${r.out.join(', ')}${r.err ? `\n<span class="err">${esc(r.err)}</span>` : ''}${r.inf ? ' …' : ''}</pre>`;
    const ok = !r.err && !r.inf && r.out.join(',') === want;
    verdict.innerHTML = ok ? '<div class="okbox">✓ 1, 1, 3, 5, 9, 15, 25, 41, 67: correct. Compute the new number first, then slide both values forward: the old <code>second</code> becomes <code>first</code>, and the new number becomes <code>second</code>.</div>'
      : r.err ? '<div class="warnbox">Crash: <code>second = next_num</code> runs before <code>next_num</code> has ever been computed.</div>'
      : `<div class="warnbox">Not the Leonardo numbers. Something gets overwritten before it’s used. Trace one pass by hand: which old value do you lose?</div>`;
  }
  render();
})();

/* 06 REPEAT UNTIL */
(() => {
  const P = [
    {label: 'REPEAT UNTIL (n ≤ 0)', code: ['REPEAT UNTIL (n ≤ 0)', '{', '   DISPLAY(n)', '   n ← n - 3', '}'], stop: n => n <= 0},
    {label: 'REPEAT UNTIL (n = 0)', code: ['REPEAT UNTIL (n = 0)', '{', '   DISPLAY(n)', '   n ← n - 3', '}'], stop: n => n === 0}
  ];
  let cur = P[0];
  const nIn = $('ruN'), code = $('ruCode'), tbl = $('ruTable'), v = $('ruVerdict');
  chipRow($('ruChips'), P, p => p.label, p => { cur = p; run(); });
  function run() {
    code.innerHTML = cur.code.map(hl).join('\n');
    const n0 = parseInt(nIn.value, 10);
    if (isNaN(n0)) { tbl.innerHTML = ''; v.innerHTML = ''; return; }
    let n = n0, k = 0; const rows = [];
    while (!cur.stop(n)) { rows.push(`<tr><td>${k + 1}</td><td>${n}</td><td>${n - 3}</td></tr>`); n -= 3; if (++k >= 12) break; }
    const inf = k >= 12 && !cur.stop(n);
    tbl.innerHTML = rows.length ? '<table class="tt"><tr><th>pass</th><th>displays n</th><th>n after</th></tr>' + rows.join('') + (inf ? '<tr><td colspan="3">⋮ never ends</td></tr>' : '') + '</table>' : '<pre class="term"><span class="dim">(nothing displayed)</span></pre>';
    let x = n0; while (x > 0) x -= 3;
    v.innerHTML = inf ? (n0 < 0 ? `<div class="warnbox">⚠ Infinite loop. n starts below 0 and only gets smaller, so it can never equal 0.</div>` : `<div class="warnbox">⚠ Infinite loop. Starting at ${n0}, n jumps from ${x + 3} straight to ${x}, skipping 0, so the UNTIL condition is never true.</div>`)
      : k === 0 ? `<div class="okbox">Zero passes. The condition is already true when n is ${n0}, so the loop ends before the body ever runs.</div>`
      : `<div class="okbox">${k} pass${k > 1 ? 'es' : ''}. The loop ended when n reached ${n}, the first value that made the condition true.</div>`;
  }
  nIn.addEventListener('input', run); run();
})();

/* 08 quiz */
(() => {
  const Q = [
    {q: 'What does this print?', code: 'i = 0\nwhile i < 3:\n    print(i)\n    i += 1', opts: ['0\n1\n2', '0\n1\n2\n3', '1\n2\n3', 'It never stops'], a: 0, why: 'When <code>i</code> becomes 3, <code>3 &lt; 3</code> is False, so 3 is never printed.'},
    {q: 'How many times is “hi” printed?', code: 'i = 5\nwhile i < 3:\n    print("hi")\n    i += 1', opts: ['0', '2', '3', 'It never stops'], a: 0, why: 'The first check, <code>5 &lt; 3</code>, is already False, so the body never runs.'},
    {q: 'What happens?', code: 'i = 1\nwhile i != 10:\n    i += 2', opts: ['It stops when i is 10', 'It stops when i is 11', 'It never stops'], a: 2, why: '<code>i</code> goes 1, 3, 5, 7, 9, 11, … and is never exactly 10, so <code>i != 10</code> is always True.'},
    {q: 'In 4.10.3 While Loop Countdown, what is the last number printed?', code: 'i = 10\nwhile i >= 0:\n    print(i)\n    i -= 1', opts: ['1', '0', '-1', '10'], a: 1, why: 'When <code>i</code> is 0, <code>0 &gt;= 0</code> is True, so 0 prints. Then <code>i</code> becomes -1 and the check fails.'},
    {q: 'What is printed?', code: 'n = 20\ncount = 0\nwhile n > 1:\n    n = n // 2\n    count += 1\nprint(count)', opts: ['4', '5', '10', '20'], a: 0, why: '<code>n</code> goes 20 → 10 → 5 → 2 → 1. That’s 4 passes, and then <code>1 &gt; 1</code> is False.'},
    {q: 'What is printed?', code: 'x = 1\nwhile x < 50:\n    x = x * 3\nprint(x)', opts: ['27', '50', '81', '243'], a: 2, why: '1 → 3 → 9 → 27 → 81. The check happens before each pass, so 27 passes the check, gets tripled to 81, and then the loop ends.'},
    {q: 'What does this AP pseudocode display?', code: 'x ← 1\nREPEAT UNTIL (x > 10)\n{\n   x ← x + 4\n}\nDISPLAY(x)', opts: ['9', '10', '13', '17'], a: 2, why: '1 → 5 → 9 → 13. The loop keeps going <em>until</em> x &gt; 10, which first happens at 13.'},
    {q: 'Which AP loop does the same thing as this Python loop?', code: 'while count < 5:', opts: ['REPEAT UNTIL (count < 5)', 'REPEAT UNTIL (count ≥ 5)', 'REPEAT 5 TIMES', 'REPEAT UNTIL (count = 4)'], a: 1, why: '<code>REPEAT UNTIL</code> uses the opposite condition: keep going while count &lt; 5 means stop once count ≥ 5.'}
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
