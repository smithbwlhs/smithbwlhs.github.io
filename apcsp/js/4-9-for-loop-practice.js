const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escC = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function hl(line) {
  let s = escC(line), out = '', last = 0, m;
  const re = /("(?:[^"\\]|\\.)*"|#.*$|\b(?:for|in|if|else)\b|\b(?:print|range|input|int|str)\b(?=\s*\())/g;
  while ((m = re.exec(s))) {
    out += s.slice(last, m.index); const t = m[0];
    out += t[0] === '"' ? `<span class="st">${t}</span>` : t[0] === '#' ? `<span class="cm">${t}</span>` : /^(for|in|if|else)$/.test(t) ? `<span class="kw">${t}</span>` : `<span class="fn">${t}</span>`;
    last = m.index + t.length;
  }
  return out + s.slice(last);
}
const toInt = v => /^\s*[+-]?\d+\s*$/.test(String(v)) ? parseInt(v, 10) : null;

/* hero */
(() => {
  const r = $('hsN'), nv = $('hsNv'), terms = $('hsTerms'), big = $('hsBig');
  function run() {
    const n = +r.value; nv.textContent = n;
    let s = 0; for (let i = 1; i <= n; i++) s += i;
    terms.textContent = n <= 12 ? Array.from({length: n}, (_, i) => i + 1).join(' + ') : `1 + 2 + 3 + … + ${n - 1} + ${n}`;
    big.innerHTML = `${s} <small>after ${n} pass${n > 1 ? 'es' : ''}</small>`;
  }
  r.addEventListener('input', run); run();
})();

/* 01 For Loop Sum */
(() => {
  const mn = $('smMin'), mx = $('smMax'), out = $('smOut'), tbl = $('smTable'), why = $('smWhy');
  function run() {
    const a = toInt(mn.value), b = toInt(mx.value);
    if (a === null || b === null) { out.textContent = ''; tbl.innerHTML = ''; why.textContent = 'Type whole numbers for MIN and MAX.'; return; }
    if (b - a > 100000) { out.textContent = ''; tbl.innerHTML = ''; why.textContent = 'That range is too big for this lab. Try MAX − MIN under 100,000.'; return; }
    const rows = []; let s = 0;
    for (let i = a; i < b; i++) { const before = s; s += i; rows.push([i, before, s]); }
    out.innerHTML = `The sum was ${s}`;
    const show = rows.length <= 8 ? rows : rows.slice(0, 4).concat([null], rows.slice(-3));
    tbl.innerHTML = rows.length ? '<table class="tt"><tr><th>pass</th><th>i</th><th>sum before</th><th>sum after</th></tr>' + show.map((r, k) => r === null ? '<tr><td colspan="4">⋮</td></tr>' : `<tr><td>${rows.indexOf(r) + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td><strong>${r[2]}</strong></td></tr>`).join('') + '</table>' : '';
    why.innerHTML = rows.length ? `<code>range(${a}, ${b})</code> gives ${a} through <strong>${b - 1}</strong>: ${rows.length} pass${rows.length > 1 ? 'es' : ''}. The print is not indented, so it runs once, after the loop.` + (b === 100 && a === 1 ? ' Notice the last number added is 99, not 100.' : '')
      : `<code>range(${a}, ${b})</code> is empty, so the loop never runs and the sum stays 0.`;
  }
  mn.addEventListener('input', run); mx.addEventListener('input', run); run();
})();

/* 02 running product */
(() => {
  const bug = $('prBug'), code = $('prCode'), tbl = $('prTable'), why = $('prWhy');
  function run() {
    const start = bug.checked ? 0 : 1;
    code.innerHTML = [`product = ${start}`, 'for i in range(1, 10, 2):', '    product = product * i', 'print(product)'].map(hl).join('\n');
    let p = start; const rows = [];
    for (let i = 1; i < 10; i += 2) { const b = p; p *= i; rows.push(`<tr><td>${i}</td><td>${b} × ${i}</td><td><strong>${p}</strong></td></tr>`); }
    tbl.innerHTML = '<table class="tt"><tr><th>i</th><th>product × i</th><th>product after</th></tr>' + rows.join('') + '</table>';
    why.innerHTML = bug.checked ? 'Stuck at 0. Zero times anything is zero, so the product can never get started. Products start at 1.' : `1 × 3 × 5 × 7 × 9 = <strong>${p}</strong>. Starting at 1 doesn’t change the answer, the same way starting a sum at 0 doesn’t.`;
  }
  bug.addEventListener('change', run); run();
})();

/* 03 filter */
(() => {
  const nIn = $('flN'), tbl = $('flTable'), why = $('flWhy');
  function run() {
    let n = toInt(nIn.value); if (n === null) { tbl.innerHTML = ''; why.textContent = 'Type a whole number.'; return; }
    n = Math.max(1, Math.min(60, n));
    let t1 = 0, t2 = 0; const added = [];
    const rows = [];
    for (let i = 1; i <= n; i++) { const ok = i % 5 === 0; if (ok) { t1 += i; added.push(i); } rows.push(`<tr class="${ok ? '' : 'skip'}"><td>${i}</td><td>${i % 5}</td><td class="${ok ? 'add' : 'skip'}">${ok ? `added → ${t1}` : 'skipped'}</td></tr>`); }
    for (let i = 5; i <= n; i += 5) t2 += i;
    tbl.innerHTML = '<table class="tt"><tr><th>i (Way 1)</th><th>i % 5</th><th>total</th></tr>' + rows.join('') + '</table>';
    why.innerHTML = `Way 1 visits all ${n} numbers and adds ${added.length}: ${added.join(' + ') || 'none'} = <strong>${t1}</strong>. Way 2’s <code>range(5, ${n + 1}, 5)</code> visits only those ${added.length} and gets <strong>${t2}</strong>. ` + (n % 5 ? `Since ${n} isn’t a multiple of 5, the last one added is ${added[added.length - 1] || 'nothing'}.` : `${n} itself is included because the stop is <code>n + 1</code>.`);
  }
  nIn.addEventListener('input', run); run();
})();

/* 04 nested loop order */
(() => {
  const rIn = $('nsR'), cIn = $('nsC'), grid = $('nsGrid'), out = $('nsOut'), why = $('nsWhy'), step = $('nsStep'), play = $('nsPlay');
  let R, C, k, timer;
  const clamp = (v, d) => { const x = toInt(v); return x === null ? d : Math.max(2, Math.min(7, x)); };
  function reset() {
    clearInterval(timer); timer = null; play.textContent = 'Play all';
    R = clamp(rIn.value, 4); C = clamp(cIn.value, 5); k = 0; draw();
  }
  function draw() {
    const total = (R - 1) * (C - 1);
    grid.style.gridTemplateColumns = `40px repeat(${C - 1}, auto)`;
    let h = '<div class="hd"></div>';
    for (let c = 1; c < C; c++) h += `<div class="hd">col ${c}</div>`;
    const lines = [];
    for (let r = 1; r < R; r++) {
      h += `<div class="hd">row ${r}</div>`;
      for (let c = 1; c < C; c++) {
        const idx = (r - 1) * (C - 1) + (c - 1);
        const cls = idx < k - 1 ? 'done' : idx === k - 1 ? 'cur' : '';
        h += `<div class="cell ${cls}">${idx < k ? r * c : ''}</div>`;
        if (idx < k) lines.push(String(r * c));
      }
    }
    grid.innerHTML = h;
    out.textContent = lines.join('\n') || '# output';
    out.scrollTop = out.scrollHeight;
    if (k === 0) why.innerHTML = `Outer loop: ${R - 1} passes. Inner loop: ${C - 1} passes <em>each time</em>. Predict how many numbers get printed, then step through.`;
    else { const r = Math.floor((k - 1) / (C - 1)) + 1, c = (k - 1) % (C - 1) + 1;
      why.innerHTML = `Pass ${k} of ${total}: <code>row = ${r}</code>, <code>col = ${c}</code>, prints ${r * c}.` + (c === C - 1 && r < R - 1 ? ` The inner loop just finished, so next the outer loop moves to row ${r + 1} and the inner loop <strong>starts over</strong> at col 1.` : '') + (k === total ? ` Done: ${R - 1} × ${C - 1} = <strong>${total}</strong> passes in all.` : ''); }
    step.disabled = k >= total;
  }
  step.onclick = () => { if (k < (R - 1) * (C - 1)) { k++; draw(); } };
  play.onclick = () => {
    if (timer) { clearInterval(timer); timer = null; play.textContent = 'Play all'; return; }
    if (k >= (R - 1) * (C - 1)) k = 0;
    if (reduce) { k = (R - 1) * (C - 1); draw(); return; }
    play.textContent = 'Pause';
    timer = setInterval(() => { if (k >= (R - 1) * (C - 1)) { clearInterval(timer); timer = null; play.textContent = 'Play all'; return; } k++; draw(); }, 450);
  };
  $('nsReset').onclick = reset;
  rIn.addEventListener('input', reset); cIn.addEventListener('input', reset);
  reset();
})();

/* 08 quiz */
(() => {
  const Q = [
    {q: 'What is printed?', code: 'MIN = 2\nMAX = 6\ntotal = 0\nfor i in range(MIN, MAX):\n    total += i\nprint(total)', opts: ['14', '20', '18', '6'], a: 0, why: '<code>range(2, 6)</code> is 2, 3, 4, 5. Their sum is 14. 6 is the stop, so it’s not included.'},
    {q: 'What is printed?', code: 'product = 0\nfor i in range(1, 5):\n    product *= i\nprint(product)', opts: ['24', '0', '10', '1'], a: 1, why: 'Starting at 0 means every multiplication gives 0. A product must start at 1.'},
    {q: 'What is printed?', code: 'total = 0\nfor i in range(1, 11):\n    if i % 2 == 1:\n        total += i\nprint(total)', opts: ['25', '30', '55', '5'], a: 0, why: '<code>i % 2 == 1</code> is true for the odd numbers 1, 3, 5, 7, 9. Their sum is 25.'},
    {q: 'How many stars are printed?', code: 'for i in range(3):\n    for j in range(2):\n        print("*")', opts: ['5', '6', '3', '2'], a: 1, why: 'The inner loop runs 2 times for each of the 3 outer passes: 3 × 2 = 6.'},
    {q: 'What does this print?', code: 'for i in range(1, 3):\n    for j in range(1, 3):\n        print(str(i) + "," + str(j))', opts: ['1,1\n1,2\n2,1\n2,2', '1,1\n2,1\n1,2\n2,2', '1,1\n2,2', '1,2\n2,1'], a: 0, why: 'The inner variable <code>j</code> changes fastest. <code>i</code> stays at 1 while <code>j</code> goes 1, 2, then <code>i</code> becomes 2 and <code>j</code> starts over.'},
    {q: 'What does this print?', code: 'print(3, ",", 4)', opts: ['3,4', '3, 4', '3 , 4', '7'], a: 2, why: 'Every comma between values in <code>print</code> adds a space, including around the <code>","</code> string.'},
    {q: 'What is printed?', code: 'result = 1\nfor i in range(1, 4):\n    result *= i\nprint(result)', opts: ['6', '24', '3', '0'], a: 0, why: '<code>range(1, 4)</code> is 1, 2, 3, and 1 × 2 × 3 = 6. That’s 3 factorial.'},
    {q: 'What does this AP pseudocode display?', code: 'count ← 0\nREPEAT 3 TIMES\n{\n   REPEAT 4 TIMES\n   {\n      count ← count + 1\n   }\n}\nDISPLAY(count)', opts: ['7', '12', '4', '34'], a: 1, why: 'The inner line runs 4 times for each of the 3 outer passes: 12.'}
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
