const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escC = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function hl(line) {
  let s = escC(line), out = '', last = 0, m;
  const re = /("(?:[^"\\]|\\.)*"|#.*$|\b(?:for|in|if|else)\b|\b(?:print|range|input|int)\b(?=\s*\())/g;
  while ((m = re.exec(s))) {
    out += s.slice(last, m.index); const t = m[0];
    out += t[0] === '"' ? `<span class="st">${t}</span>` : t[0] === '#' ? `<span class="cm">${t}</span>` : /^(for|in|if|else)$/.test(t) ? `<span class="kw">${t}</span>` : `<span class="fn">${t}</span>`;
    last = m.index + t.length;
  }
  return out + s.slice(last);
}
function chipRow(box, items, label, onPick) {
  items.forEach(it => { const b = document.createElement('button'); b.textContent = label(it); b.onclick = () => onPick(it); box.appendChild(b); });
}
/* Python's range, with Python's errors */
function pyRange(a, b, c) {
  if (c === 0) throw {head: 'ValueError: range() arg 3 must not be zero'};
  const out = [];
  if (c > 0) for (let x = a; x < b && out.length < 100000; x += c) out.push(x);
  else for (let x = a; x > b && out.length < 100000; x += c) out.push(x);
  return out;
}
function drawStrip(el, vals, stop, max = 40) {
  const shown = vals.length > max ? vals.slice(0, max - 3).concat(['…'], vals.slice(-2)) : vals;
  el.innerHTML = shown.map(v => `<div class="rbox ${v === '…' ? '' : 'cur'}" style="${v === '…' ? 'border:0;background:none' : ''}">${v}</div>`).join('') + `<div class="rbox stop" title="stop: never included">${stop}</div>`;
}
function explainEmpty(a, b, c) {
  return c > 0 ? `The step is positive, so <code>range</code> counts up, but <code>start</code> (${a}) is not less than <code>stop</code> (${b}). There’s nowhere to go: <strong>no numbers at all</strong>, and the loop body never runs.`
               : `The step is negative, so <code>range</code> counts down, but <code>start</code> (${a}) is not greater than <code>stop</code> (${b}). <strong>No numbers at all</strong>, and the loop body never runs.`;
}

/* hero */
(() => {
  const A = $('hrA'), Bs = $('hrB'), C = $('hrC'), code = $('hrCode'), strip = $('hrStrip'), info = $('hrInfo');
  function run() {
    let c = +C.value; if (c === 0) { c = 1; C.value = 1; }
    const a = +A.value, b = +Bs.value;
    $('hrAv').textContent = a; $('hrBv').textContent = b; $('hrCv').textContent = c;
    code.innerHTML = `range(<span class="a1">${a}</span>, <span class="a2">${b}</span>, <span class="a3">${c}</span>)`;
    const v = pyRange(a, b, c);
    drawStrip(strip, v, b, 24);
    info.innerHTML = v.length ? `<b>${v.length}</b> number${v.length > 1 ? 's' : ''}: first <b>${v[0]}</b>, last <b>${v[v.length - 1]}</b>. ${b} is never included.` : `<b>Empty.</b> ${c > 0 ? 'Counting up, but start isn’t below stop.' : 'Counting down, but start isn’t above stop.'}`;
  }
  [A, Bs, C].forEach(e => e.addEventListener('input', run)); run();
})();

/* 01 explorer */
(() => {
  const A = $('rxA'), Bs = $('rxB'), C = $('rxC'), code = $('rxCode'), strip = $('rxStrip'), why = $('rxWhy');
  const ex = [[0, 5, 1], [2, 7, 1], [1, 11, 1], [0, 101, 2], [0, 100, 2], [10, 0, -1], [10, -1, -1], [0, 8, 3], [5, 1, 1], [1, 10, -1]];
  const label = ([a, b, c]) => c === 1 ? (a === 0 ? `range(${b})` : `range(${a}, ${b})`) : `range(${a}, ${b}, ${c})`;
  chipRow($('rxChips'), ex, label, ([a, b, c]) => { A.value = a; Bs.value = b; C.value = c; run(); });
  function run() {
    const raw = [A.value.trim(), Bs.value.trim(), C.value.trim() || '1'];
    code.textContent = `→  range(${raw[0]}, ${raw[1]}, ${raw[2]})`;
    if (raw.some(r => /^\s*[+-]?\d*\.\d*\s*$/.test(r) && /\d/.test(r))) { strip.innerHTML = ''; why.innerHTML = `<span class="fv">TypeError: 'float' object cannot be interpreted as an integer</span><br><code>range</code> only works with whole numbers.`; return; }
    if (raw.some(r => !/^[+-]?\d+$/.test(r))) { strip.innerHTML = ''; why.innerHTML = 'Type a whole number in each box.'; return; }
    const [a, b, c] = raw.map(Number);
    let v;
    try { v = pyRange(a, b, c); } catch (e) { strip.innerHTML = ''; why.innerHTML = `<span class="fv">${esc(e.head)}</span><br>A step of 0 would never get anywhere, so Python refuses.`; return; }
    drawStrip(strip, v, b);
    if (!v.length) { why.innerHTML = explainEmpty(a, b, c); return; }
    const same = c === 1 ? (a === 0 ? ` This is the same as <code>range(${b})</code>.` : ` A step of 1 is the default, so this is the same as <code>range(${a}, ${b})</code>.`) : '';
    const next = v[v.length - 1] + c;
    why.innerHTML = `<strong>${v.length}</strong> number${v.length > 1 ? 's' : ''}, so the loop body would run ${v.length} time${v.length > 1 ? 's' : ''}. First: <strong>${v[0]}</strong>. Last: <strong>${v[v.length - 1]}</strong>. The next one would be ${next}, which ${c > 0 ? 'reaches or passes' : 'reaches or goes below'} the stop of ${b}, so the loop quits.${same}`;
  }
  [A, Bs, C].forEach(e => e.addEventListener('input', run)); run();
})();

/* 02 countdown */
(() => {
  const src = $('cdSrc'), out = $('cdOut'), why = $('cdWhy');
  let stop = 0;
  chipRow($('cdChips'), [[0, 'stop = 0 (as written)'], [-1, 'stop = -1'], [1, 'stop = 1']], x => x[1], x => { stop = x[0]; run(); });
  function run() {
    const lines = ['# This program prints a countdown from', '# ten down to zero using a for loop.', '', `for i in range (10, ${stop}, -1):`, '    print(i)'];
    src.innerHTML = lines.map((l, i) => `<div class="${i === 3 ? 'cur' : ''}"><b>${i + 1}</b>${hl(l) || ' '}</div>`).join('');
    const v = pyRange(10, stop, -1);
    out.textContent = v.join('\n');
    const has0 = v.includes(0);
    why.innerHTML = `${v.length} numbers, from ${v[0]} down to <strong>${v[v.length - 1]}</strong>. ` + (has0 ? `Now 0 is included, because the stop is one step past it. The program finally does what its comment says.` : stop === 0 ? `The comment promised zero, but <code>stop</code> is never included, so the countdown ends at 1.` : `Stopping at ${stop} leaves out even more: the countdown ends at ${v[v.length - 1]}.`);
  }
  run();
})();

/* 03 hit the target */
(() => {
  const T = [
    {t: 'Count by 5s from 0 up to and including 50', want: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]},
    {t: 'Count by 3s from 3 up to and including 30', want: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30]},
    {t: 'Count down by 10s from 100 to 0, including 0', want: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0]},
    {t: 'The numbers 1 through 12 (no step needed)', want: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
  ];
  const box = $('tasks');
  T.forEach((task, k) => {
    const d = document.createElement('div'); d.className = 'task';
    d.innerHTML = `<div class="t">${k + 1}. ${esc(task.t)}</div><div class="want">wanted: ${task.want.join(', ')}</div>
      <div class="prompt"><span>for i in range(</span><input type="text" autocomplete="off" spellcheck="false" aria-label="Numbers inside range for task ${k + 1}" placeholder="start, stop, step"><span style="margin:0 8px 0 0">):</span></div><div class="res" aria-live="polite"></div>`;
    const inp = d.querySelector('input'), res = d.querySelector('.res');
    inp.addEventListener('input', () => {
      const parts = inp.value.split(',').map(s => s.trim()).filter(s => s !== '');
      if (!parts.length) { res.innerHTML = ''; return; }
      if (parts.length > 3 || parts.some(p => !/^[+-]?\d+$/.test(p))) { res.innerHTML = '<span class="bad">Type one to three whole numbers, separated by commas.</span>'; return; }
      const n = parts.map(Number);
      const [a, b, c] = n.length === 1 ? [0, n[0], 1] : n.length === 2 ? [n[0], n[1], 1] : n;
      let v; try { v = pyRange(a, b, c); } catch (e) { res.innerHTML = `<span class="bad">${esc(e.head)}</span>`; return; }
      const w = task.want, got = v.length > 14 ? v.slice(0, 12).join(', ') + ', … ' + v[v.length - 1] : v.join(', ');
      if (v.length === w.length && v.every((x, i) => x === w[i])) { res.innerHTML = `<span class="ok">✓ Exactly right.</span> got: ${got}`; return; }
      let tip;
      if (!v.length) tip = 'That range is empty. Check the direction of your step.';
      else if (v[0] !== w[0]) tip = `It starts at ${v[0]} instead of ${w[0]}. Check <code>start</code>.`;
      else if (v.length > 1 && w.length > 1 && v[1] - v[0] !== w[1] - w[0]) tip = 'The gap between numbers is wrong. Check <code>step</code>.';
      else if (v[v.length - 1] !== w[w.length - 1]) tip = v.length < w.length ? `It stops too early, at ${v[v.length - 1]}. Remember <code>stop</code> itself is never included.` : `It goes too far, to ${v[v.length - 1]}. Bring <code>stop</code> closer.`;
      else tip = 'Close, but not the same list.';
      res.innerHTML = `<span class="bad">✗ Not yet.</span> got: ${got}<br>${tip}`;
    });
    box.appendChild(d);
  });
})();

/* 04 powers of 3, two ways */
(() => {
  const bug = $('pwBug'), tbl = $('pwTable'), why = $('pwWhy');
  function run() {
    let power = 1; const rows = [];
    for (let i = 0; i < 7; i++) {
      let printed;
      if (bug.checked) { power *= 3; printed = power; } else { printed = power; power *= 3; }
      rows.push(`<tr class="${printed !== 3 ** i ? 'diff' : ''}"><td>${i}</td><td>${3 ** i}</td><td>${printed}</td><td>${power}</td></tr>`);
    }
    tbl.innerHTML = '<table class="tt"><tr><th>i</th><th>Way 1 prints<br><code>3 ** i</code></th><th>Way 2 prints<br><code>power</code></th><th><code>power</code> after<br>the pass</th></tr>' + rows.join('') + '</table>';
    why.innerHTML = bug.checked
      ? 'With the multiply moved first, Way 2 never prints 1 and goes one step too far (2187 is over 1,000). Same number of lines, but every value is shifted by one power. Order inside the loop matters.'
      : 'Both columns match: 1, 3, 9, …, 729. Way 2 prints the current value and <em>then</em> gets the next one ready. Notice <code>power</code> ends at 2187: it was computed but never printed.';
  }
  bug.addEventListener('change', run); run();
})();

/* 05 range decoder */
(() => {
  const E = [
    {label: 'step of 0', code: 'for i in range(0, 10, 0):\n    print(i)', msg: 'ValueError: range() arg 3 must not be zero', why: 'A step of 0 would print 0 forever, so Python refuses to even start.'},
    {label: 'a decimal', code: 'for i in range(0, 5, 0.5):\n    print(i)', msg: "TypeError: 'float' object cannot be interpreted as an integer", why: '<code>range</code> only works with whole numbers. To count by halves, loop over whole numbers and divide inside: <code>print(i / 2)</code>.'},
    {label: 'counting down with a positive step', code: 'for i in range(10, 0):\n    print(i)', msg: '(no error, and no output)', why: 'The default step is +1, so this tries to count <em>up</em> from 10 to 0. That’s impossible, so the range is empty and the body never runs. Counting down needs a negative step: <code>range(10, 0, -1)</code>.'},
    {label: 'input not converted', code: 'n = input("How high? ")\nfor i in range(1, n):\n    print(i)', msg: "TypeError: 'str' object cannot be interpreted as an integer", why: 'Same rule as 4.7: <code>input()</code> gives a string, and every number in <code>range</code> must be an <code>int</code>.'},
    {label: 'a space before (', code: 'for i in range (10, 0, -1):\n    print(i)', msg: '(no error: this works)', why: 'Python allows a space between a function name and its parentheses, which is how 4.8.3 Countdown is written. Most Python programmers leave the space out, but it isn’t a bug.'},
    {label: 'forgot the colon', code: 'for i in range(0, 101, 2)\n    print(i)', msg: "SyntaxError: expected ':'", why: 'Just like <code>if</code>, a <code>for</code> line must end with a colon.'}
  ];
  const code = $('erCode'), msg = $('erMsg'), why = $('erWhy');
  function show(e) { code.innerHTML = e.code.split('\n').map(hl).join('\n'); msg.textContent = e.msg; msg.style.color = e.msg.startsWith('(') ? 'var(--muted)' : ''; why.innerHTML = e.why; }
  chipRow($('erChips'), E, e => e.label, show);
  show(E[0]);
})();

/* 08 quiz */
(() => {
  const Q = [
    {q: 'How many times does the body run?', code: 'for i in range(2, 6):\n    print(i)', opts: ['3', '4', '5', '6'], a: 1, why: '2, 3, 4, 5: four numbers. A quick way to count: stop − start = 6 − 2 = 4.'},
    {q: 'What does this print?', code: 'for i in range(1, 10, 3):\n    print(i)', opts: ['1\n4\n7', '1\n4\n7\n10', '3\n6\n9', '1\n3\n6\n9'], a: 0, why: 'Start at 1 and add 3: 1, 4, 7. The next would be 10, which reaches the stop, so it isn’t printed.'},
    {q: 'What is the last number printed?', code: 'for i in range(10, 0, -2):\n    print(i)', opts: ['0', '1', '2', '10'], a: 2, why: '10, 8, 6, 4, 2. The next would be 0, which reaches the stop, so the loop quits.'},
    {q: 'What does this print?', code: 'for i in range(5, 1):\n    print(i)', opts: ['5\n4\n3\n2', '5\n4\n3\n2\n1', 'Nothing', 'An error'], a: 2, why: 'With no step given, the step is +1, so it tries to count up from 5 to 1. The range is empty and nothing prints.'},
    {q: 'Which loop prints 10, 9, 8, … all the way down to 0?', code: '', opts: ['range(10, 0, -1)', 'range(10, -1, -1)', 'range(0, 10, -1)', 'range(10, 0)'], a: 1, why: 'The stop is never included, so to include 0 you stop one step past it, at -1. That’s the fix for 4.8.3 Countdown’s comment.'},
    {q: 'What happens?', code: 'for i in range(0, 10, 0):\n    print(i)', opts: ['It prints 0 forever', 'It prints nothing', 'ValueError'], a: 2, why: 'Python checks the step before starting, and a step of 0 is not allowed.'},
    {q: 'What does this print?', code: 'power = 1\nfor i in range(4):\n    print(power)\n    power *= 3', opts: ['1\n3\n9\n27', '3\n9\n27\n81', '1\n3\n9\n27\n81', '0\n3\n6\n9'], a: 0, why: 'It prints, then multiplies. Four passes: 1, 3, 9, 27. (81 is computed at the end but never printed.)'},
    {q: 'What does this AP pseudocode display?', code: 'i ← 1\nREPEAT 3 TIMES\n{\n   i ← i + 4\n}\nDISPLAY(i)', opts: ['9', '12', '13', '16'], a: 2, why: '1 → 5 → 9 → 13. Three passes, adding 4 each time.'}
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
