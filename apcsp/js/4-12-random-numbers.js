const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escC = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const pyStr = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const randint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const isInt = s => /^\s*[+-]?\d+\s*$/.test(s);
function hl(line) {
  let s = escC(line), out = '', last = 0, m;
  const re = /("(?:[^"\\]|\\.)*"|#.*$|\b(?:for|in|if|elif|else|while|import|True|False)\b|\b(?:print|range|input|int|str)\b(?=\s*\())/g;
  while ((m = re.exec(s))) {
    out += s.slice(last, m.index); const t = m[0];
    out += t[0] === '"' ? `<span class="st">${t}</span>` : t[0] === '#' ? `<span class="cm">${t}</span>` : /^(print|range|input|int|str)$/.test(t) ? `<span class="fn">${t}</span>` : `<span class="kw">${t}</span>`;
    last = m.index + t.length;
  }
  return out + s.slice(last);
}
function hist(el, rows) {
  const max = Math.max(1, ...rows.map(r => r.n));
  const tot = rows.reduce((s, r) => s + r.n, 0) || 1;
  el.innerHTML = rows.map(r => `<div class="r"><span>${esc(r.label)}</span><div class="bar"><i class="${r.cls || ''}" style="width:${(r.n / max * 100).toFixed(1)}%"></i></div><span>${r.n}${r.pct ? ` · ${Math.round(r.n / tot * 100)}%` : ''}</span></div>`).join('');
}

/* hero */
(() => {
  const die = $('hdDie'), h = $('hdHist'), counts = [0, 0, 0, 0, 0, 0, 0];
  const draw = () => hist(h, [1, 2, 3, 4, 5, 6].map(k => ({label: String(k), n: counts[k]})));
  function show(v) { die.textContent = v; die.classList.remove('spin'); void die.offsetWidth; die.classList.add('spin'); }
  $('hdOne').onclick = () => { const r = randint(1, 6); counts[r]++; show(r); draw(); };
  $('hdMany').onclick = () => { let r; for (let i = 0; i < 600; i++) { r = randint(1, 6); counts[r]++; } show(r); draw(); };
  draw();
})();

/* 01 randint explorer */
(() => {
  const A = $('riA'), Bx = $('riB'), out = $('riOut'), h = $('riHist'), why = $('riWhy');
  function args() {
    if (!isInt(A.value) || !isInt(Bx.value)) { out.innerHTML = '<span class="err">Type whole numbers for a and b.</span>'; h.innerHTML = ''; why.innerHTML = ''; return null; }
    const a = +A.value, b = +Bx.value;
    if (a > b) { out.innerHTML = `<span class="err">ValueError: empty range for randrange()</span>`; h.innerHTML = ''; why.innerHTML = `The first number has to be less than or equal to the second. (The exact wording of this error varies between Python versions.)`; return null; }
    if (b - a > 30) { out.innerHTML = ''; h.innerHTML = ''; why.innerHTML = 'Python is fine with a big range, but this lab only draws up to 31 different values. Try a smaller range.'; return null; }
    return [a, b];
  }
  $('riOne').onclick = () => { const r = args(); if (!r) return; const v = randint(...r); out.innerHTML = `<span class="dim">&gt;&gt;&gt; random.randint(${r[0]}, ${r[1]})</span>\n${v}`; h.innerHTML = ''; why.innerHTML = `Any whole number from ${r[0]} to ${r[1]} could come back, including ${r[1]}. Click again: you’ll usually get something different.`; };
  $('riMany').onclick = () => {
    const r = args(); if (!r) return;
    const [a, b] = r, c = {};
    for (let k = a; k <= b; k++) c[k] = 0;
    for (let i = 0; i < 3000; i++) c[randint(a, b)]++;
    out.innerHTML = `<span class="dim"># called random.randint(${a}, ${b}) 3,000 times</span>`;
    hist(h, Object.keys(c).map(k => ({label: k, n: c[k]})));
    const n = b - a + 1;
    why.innerHTML = a === b ? `With only one possible value, “random” always gives ${a}.` : `Every value from ${a} to ${b} showed up, about ${Math.round(3000 / n)} times each. Both ends are included, and each value is equally likely; the bars wobble a little because it’s random.`;
  };
  $('riMany').click();
})();

/* 02 coin */
(() => {
  $('cnFlip').onclick = () => {
    let t1 = 0, t2 = 0;
    for (let i = 0; i < 1000; i++) { if (Math.random() < 0.5) t1++; if (randint(0, 1) === 1) t2++; }
    hist($('cnHist'), [
      {label: 'True', n: t1, pct: true}, {label: 'False', n: 1000 - t1, pct: true, cls: 'alt'},
      {label: 'True', n: t2, pct: true}, {label: 'False', n: 1000 - t2, pct: true, cls: 'alt'}
    ]);
    $('cnWhy').innerHTML = `Top two bars: <code>random.choice([True, False])</code>. Bottom two: <code>random.randint(0, 1) == 1</code>. Both land near 50/50 (${t1} vs. ${t2} Trues out of 1,000). Either way, the result is a real Boolean you can use in an <code>if</code>.`;
  };
  $('cnFlip').click();
})();

/* 03 loop placement */
(() => {
  const bug = $('lpBug'), code = $('lpCode'), out = $('lpOut'), why = $('lpWhy');
  const showCode = () => { code.innerHTML = (bug.checked ? ['import random', '', 'roll = random.randint(1, 6)', 'for i in range(10):', '    print(roll)'] : ['import random', '', 'for i in range(10):', '    roll = random.randint(1, 6)', '    print(roll)']).map(hl).join('\n'); };
  function run() {
    const rolls = []; let r = randint(1, 6);
    for (let i = 0; i < 10; i++) { if (!bug.checked) r = randint(1, 6); rolls.push(r); }
    out.textContent = rolls.join('\n');
    why.innerHTML = bug.checked ? `The same number, 10 times. <code>randint</code> ran once, before the loop; the loop just prints that one saved value.` : 'A new roll every pass, because the <code>randint</code> call is inside the loop body.';
  }
  bug.addEventListener('change', () => { showCode(); run(); });
  $('lpRun').onclick = run;
  showCode(); run();
})();

/* 04 weather */
(() => {
  const L = ['Sunny', 'Cloudy', 'Rainy', 'Snowy'];
  $('wxRun').onclick = () => {
    const a = [0, 0, 0, 0], b = [0, 0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) {
      a[randint(1, 4) - 1]++;
      let hit = -1; for (let k = 0; k < 4; k++) if (randint(1, 4) === k + 1) { hit = k; break; }
      b[hit === -1 ? 4 : hit]++;
    }
    hist($('wxA'), L.map((l, k) => ({label: l, n: a[k], pct: true})));
    hist($('wxB'), L.map((l, k) => ({label: l, n: b[k], pct: true, cls: 'alt'})).concat([{label: 'none', n: b[4], pct: true, cls: 'none'}]));
    $('wxWhy').innerHTML = `Picking once gives each forecast about 25%. The buggy version rolls a <em>new</em> number at every check, so later forecasts get rarer and rarer, and about ${Math.round(b[4] / 40)}% of runs print <strong>nothing at all</strong>, because every check missed.`;
  };
  $('wxRun').click();
})();

/* 05 guessing game */
(() => {
  const bug = $('gsBug'), peek = $('gsPeek'), out = $('gsOut'), row = $('gsRow'), inp = $('gsIn'), why = $('gsWhy');
  let inputs = [], secrets = [];
  const secretFor = k => { while (secrets.length <= k) secrets.push(randint(1, 20)); return secrets[k]; };
  function render() {
    let h = 'I’m thinking of a number from 1 to 20.\n', done = false, moved = false;
    let secret = secretFor(0);
    if (peek.checked && !bug.checked) h += `<span class="dim">(debug: secret is ${secret})</span>\n`;
    inputs.forEach((g, k) => {
      if (done) return;
      if (bug.checked) { const s = secretFor(k); if (k > 0 && s !== secret) moved = true; secret = s; if (peek.checked) h += `<span class="dim">(debug: secret is now ${secret})</span>\n`; }
      h += `Your guess: <span class="in">${escC(g)}</span>\n`;
      if (!isInt(g)) { h += `<span class="err">ValueError: invalid literal for int() with base 10: ${escC(pyStr(g))}</span>`; done = true; return; }
      const n = parseInt(g, 10);
      if (n < secret) h += 'Too low\n'; else if (n > secret) h += 'Too high\n'; else { h += `Correct\n<span class="dim">(${k + 1} guess${k ? 'es' : ''})</span>`; done = true; }
    });
    out.innerHTML = h; out.scrollTop = out.scrollHeight;
    row.style.display = done ? 'none' : '';
    why.innerHTML = bug.checked ? (moved ? 'The secret keeps changing, so “Too low” on one guess tells you nothing about the next. Turn on the debug print to watch it move.' : 'Make a few guesses with the bug on, and turn on the debug print to watch what the secret does.') : 'The secret was picked once, before the loop, so every hint points toward the same number.';
  }
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { inputs.push(inp.value); inp.value = ''; render(); if (row.style.display !== 'none') inp.focus(); } });
  $('gsReset').onclick = () => { inputs = []; secrets = []; render(); };
  bug.addEventListener('change', () => { inputs = []; secrets = []; render(); });
  peek.addEventListener('change', render);
  render();
})();

/* 08 quiz */
(() => {
  const Q = [
    {q: 'Which values can this return?', code: 'random.randint(3, 5)', opts: ['3 or 4', '3, 4, or 5', '4 only', '3, 4, 5, or 6'], a: 1, why: '<code>randint</code> includes both ends: 3, 4, and 5.'},
    {q: 'What happens?', code: 'roll = random.randint(1, 6)\nprint(roll)', opts: ['It prints a number from 1 to 6', 'It prints a number from 1 to 5', "NameError: name 'random' is not defined"], a: 2, why: 'There’s no <code>import random</code> at the top, so Python doesn’t know what <code>random</code> is.'},
    {q: 'What does this print?', code: 'import random\nx = random.randint(4, 4)\nprint(x)', opts: ['4 every time', 'A random number', 'An error'], a: 0, why: 'The only number from 4 to 4 is 4. Not very random, but legal.'},
    {q: 'What does this print?', code: 'import random\nroll = random.randint(1, 6)\nfor i in range(3):\n    print(roll)', opts: ['Three different random numbers', 'The same random number three times', 'An error'], a: 1, why: 'The roll happens once, before the loop. Every pass prints that same saved value.'},
    {q: 'What type of value is is_heads?', code: 'is_heads = random.randint(0, 1) == 1', opts: ['int', 'str', 'bool', 'It depends on the roll'], a: 2, why: 'A comparison always produces a Boolean, no matter which number was rolled.'},
    {q: 'Which total is impossible?', code: 'total = random.randint(1, 6) + random.randint(1, 6)', opts: ['1', '2', '7', '12'], a: 0, why: 'Each die is at least 1, so the smallest total is 2.'},
    {q: 'In AP pseudocode, which values can RANDOM(1, 4) return?', code: '', opts: ['0, 1, 2, 3', '1, 2, 3', '1, 2, 3, 4', '1, 2, 3, 4, 5'], a: 2, why: 'Like <code>randint</code>, <code>RANDOM(a, b)</code> includes both <code>a</code> and <code>b</code>.'},
    {q: 'How likely is it that this displays "A"?', code: 'x ← RANDOM(1, 3)\nIF (x = 3)\n{\n   DISPLAY("A")\n}\nELSE\n{\n   DISPLAY("B")\n}', opts: ['1 in 2', '1 in 3', '2 in 3', 'Always'], a: 1, why: 'Three equally likely values, and only one of them (3) leads to “A.”'}
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
