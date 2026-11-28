const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const B = v => `<span class="${v ? 'tv' : 'fv'}">${v ? 'True' : 'False'}</span>`;
const PY = v => v ? 'True' : 'False';
const pyStr = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const toInt = s => /^\s*[+-]?\d+\s*$/.test(s) ? parseInt(s, 10) : null;
const toFloat = s => /^\s*[+-]?(\d+(\.\d*)?|\.\d+)\s*$/.test(s) ? parseFloat(s) : null;
const intErr = s => `ValueError: invalid literal for int() with base 10: ${pyStr(s)}`;
const floatErr = s => `ValueError: could not convert string to float: ${pyStr(s)}`;
function chipRow(box, items, label, onPick) {
  items.forEach(it => { const b = document.createElement('button'); b.textContent = label(it); b.onclick = () => onPick(it); box.appendChild(b); });
}
/* run an if/elif/else chain: first True wins, later conditions are never checked */
function chain(branches, elseLines, v, start = [0]) {
  const ran = start.slice(), cond = {}, nc = [], out = [];
  let won = false;
  for (const br of branches) {
    if (won) { nc.push(br.c); continue; }
    ran.push(br.c); const r = br.t(v); cond[br.c] = r;
    if (r) { ran.push(br.b); out.push(br.out); won = true; }
  }
  if (!won && elseLines) { ran.push(...elseLines.lines); out.push(elseLines.out); }
  return {ran, cond, nc, out, won};
}

/* hero: temperature chain */
(() => {
  const r = $('heroT'), lab = $('heroTVal'), code = $('heroCode');
  function show() {
    const t = +r.value, a = t >= 80, b = !a && t >= 60;
    lab.textContent = t;
    const c = (txt, state) => `<span class="${state}">${txt}</span>`;
    code.innerHTML = [
      c(`if temperature >= 80:    # ${PY(a)}`, a ? '' : 'chk'),
      c('    print("Hot")', a ? 'win' : 'nc'),
      c(`elif temperature >= 60:  # ${a ? 'not checked' : PY(b)}`, a ? 'nc' : b ? '' : 'chk'),
      c('    print("Warm")', b ? 'win' : 'nc'),
      c('else:', a || b ? 'nc' : ''),
      c('    print("Cool")', !a && !b ? 'win' : 'nc')
    ].join('\n');
  }
  r.addEventListener('input', show); show();
})();

/* flow labs: run a tiny program on one input and show which lines ran */
function flow(root, cfg) {
  root.innerHTML = `<div class="chips"></div>
    <div class="prompt"><span>${esc(cfg.prompt)}</span><input type="text" autocomplete="off" spellcheck="false" aria-label="What the user types"></div>
    <div class="${cfg.programs.length > 1 ? 'duo' : ''}">${cfg.programs.map(p => `<div>${p.title ? `<h4>${esc(p.title)}</h4>` : ''}<div class="src"></div><pre class="console" style="margin-top:10px" aria-live="polite"></pre></div>`).join('')}</div>
    <p class="flowkey"><b></b>highlighted lines ran · faded lines were skipped${cfg.programs.some(p => p.chain) ? ' · “not checked” means Python never looked at that condition' : ''}</p>
    <div class="explain"></div>`;
  const inp = root.querySelector('input'), why = root.querySelector('.explain');
  const srcs = root.querySelectorAll('.src'), outs = root.querySelectorAll('.console');
  chipRow(root.querySelector('.chips'), cfg.chips, x => x, x => { inp.value = x; run(); });
  const neutral = l => /^\s*([{}]|ELSE)\s*$/.test(l);
  function run() {
    const raw = inp.value;
    const results = cfg.programs.map((p, k) => {
      const r = p.run(raw); r.nc = r.nc || [];
      srcs[k].innerHTML = p.lines.map((l, i) => {
        const st = r.ran.includes(i) ? 'ran' : (p.ap && neutral(l)) ? '' : 'skip';
        const c = i in r.cond ? `<span class="cond ${r.cond[i] ? 't' : 'f'}">→ ${p.ap ? String(r.cond[i]).toLowerCase() : PY(r.cond[i])}</span>` : r.nc.includes(i) ? '<span class="cond nc">not checked</span>' : '';
        return `<div class="${st}"><b>${i + 1}</b>${esc(l)}${c}</div>`;
      }).join('');
      outs[k].innerHTML = `${esc(cfg.prompt)}<span class="in">${esc(raw)}</span>\n` +
        (r.err ? `<span class="err">${esc(r.err)}</span>` : r.out.length ? r.out.map(esc).join('\n') : '<span class="dim">(nothing printed)</span>');
      return r;
    });
    why.innerHTML = cfg.explain(raw, results);
  }
  inp.addEventListener('input', run);
  inp.value = cfg.init; run();
}

/* 01 Study Plan */
(() => {
  const P = 'How many hours do you have to study? ';
  const lines = [`hours = float(input("${P}"))`,
    'if hours > 5:', '    print("Study plan: Do a full study session")',
    'elif hours > 3:', '    print("Study plan: Review notes and practice")',
    'elif hours > 2:', '    print("Study plan: Focus on key topics")',
    'elif hours > 1:', '    print("Study plan: Quick review")',
    'elif hours > 0:', '    print("Study plan: Look over flashcards")',
    'else:', '    print("Study plan: No time to study")'];
  const cut = [5, 3, 2, 1, 0];
  const br = cut.map((n, k) => ({c: 1 + 2 * k, b: 2 + 2 * k, t: h => h > n, out: lines[2 + 2 * k].trim().slice(7, -2)}));
  flow($('flowStudy'), {
    prompt: P, init: '2.5', chips: ['6', '5', '4', '2.5', '1', '0.5', '0', 'lots'],
    programs: [{chain: true, lines, run: s => { const h = toFloat(s); if (h === null) return {ran: [0], cond: {}, out: [], err: floatErr(s)};
      return chain(br, {lines: [11, 12], out: 'Study plan: No time to study'}, h); }}],
    explain: s => { const h = toFloat(s); if (h === null) return '<code>float()</code> needs a number, so the program crashes on line 1.';
      const k = cut.findIndex(n => h > n);
      const fmt = String(h);
      let w = k === -1 ? `Every condition was ${B(false)}, so the <code>else</code> runs.` :
        `${k === 0 ? 'The very first condition' : `${k === 1 ? 'The first condition was' : `The first ${k} conditions were`} ${B(false)}, then <code>hours &gt; ${cut[k]}</code>`} is ${B(true)}, so ${k === 0 ? 'its body runs' : 'that branch wins'}${k < cut.length - 1 ? ' and everything below is skipped without being checked' : ''}.`;
      if (cut.includes(h)) w += ` <strong>${fmt} is a boundary:</strong> <code>hours &gt; ${h}</code> is False for exactly ${fmt}, so it falls to the next branch down.`;
      return w; }
  });
})();

/* 02 Broken Movie Theater: reorder until the tests pass */
(() => {
  const B2 = [{cond: 'age >= 18', t: a => a >= 18, msg: 'Adult ticket.'}, {cond: 'age >= 65', t: a => a >= 65, msg: 'Senior discount.'}];
  let order = [0, 1];
  const ages = [10, 17, 18, 40, 64, 65, 80];
  const rule = a => a >= 65 ? 'Senior discount.' : a >= 18 ? 'Adult ticket.' : 'Child ticket.';
  const codeEl = $('movieCode'), tests = $('movieTests'), why = $('movieWhy');
  const kw = s => `<span class="kw">${s}</span>`, st = s => `<span class="st">"${esc(s)}"</span>`;
  function program(a) { for (const k of order) if (B2[k].t(a)) return B2[k].msg; return 'Child ticket.'; }
  function render() {
    const ln = (html, mv) => `<div class="ln">${html}${mv !== undefined ? `<span class="mv"><button data-p="${mv}" data-d="-1" aria-label="Move this branch up" ${mv === 0 ? 'disabled' : ''}>↑</button><button data-p="${mv}" data-d="1" aria-label="Move this branch down" ${mv === order.length - 1 ? 'disabled' : ''}>↓</button></span>` : ''}</div>`;
    let h = ln(`age = int(input(${st('Enter customer age: ')}))`);
    order.forEach((k, p) => { h += ln(`${kw(p === 0 ? 'if' : 'elif')} ${esc(B2[k].cond)}:`, p) + ln(`    print(${st(B2[k].msg)})`); });
    h += ln(`${kw('else')}:`) + ln(`    print(${st('Child ticket.')})`);
    codeEl.innerHTML = h;
    codeEl.querySelectorAll('button').forEach(b => b.onclick = () => { const p = +b.dataset.p, q = p + +b.dataset.d; [order[p], order[q]] = [order[q], order[p]]; render(); });
    let pass = 0;
    tests.innerHTML = '<tr><th>age</th><th>rules say</th><th>program prints</th><th></th></tr>' + ages.map(a => {
      const e = rule(a), g = program(a), ok = e === g; if (ok) pass++;
      return `<tr class="${ok ? '' : 'diff'}"><td>${a}</td><td style="font-family:var(--sans)">${e}</td><td style="font-family:var(--sans)">${g}</td><td class="${ok ? 'pass' : 'fail'}">${ok ? '✓ pass' : '✗ fail'}</td></tr>`;
    }).join('');
    why.innerHTML = `<p class="summary">${pass} of ${ages.length} tests pass.</p>` + (pass === ages.length
      ? 'Now the senior check comes first, so 65 and 80 are caught before the adult check can grab them. Ages 18–64 fail the senior check and fall through to the adult branch.'
      : 'Look at 65 and 80. Trace the chain: the first condition, <code>age &gt;= 18</code>, is already True for them, so the chain stops there. The senior condition is never even checked.');
  }
  render();
})();

/* quizzes */
function makeQuiz(boxId, scoreId, resetId, Q, cls = '', doneMsg) {
  const box = $(boxId), sc = $(scoreId);
  let right, tried;
  function build() {
    right = 0; tried = 0; sc.textContent = `Score: 0 / ${Q.length}`;
    box.innerHTML = '';
    Q.forEach((item, qi) => {
      const d = document.createElement('div'); d.className = 'quiz ' + cls;
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
          sc.textContent = `Score: ${right} / ${Q.length}` + (tried === Q.length ? (right === Q.length ? doneMsg : '. Review the explanations, then reset and try again.') : '');
        };
        opts.appendChild(b);
      });
      box.appendChild(d);
    });
  }
  $(resetId).onclick = build;
  build();
}
const PATTERNS = ['if', 'if / else', 'if / elif / else', 'separate ifs', 'nested if'];
makeQuiz('pickBox', 'pickScore', 'pickReset', [
  {q: 'Print “Wear a coat” when it’s below 50°F. Otherwise, print nothing.', opts: PATTERNS, a: 0, why: 'One check, and nothing happens when it’s False. A single <code>if</code> is enough.'},
  {q: 'Print “Pass” or “Fail” for a test score.', opts: PATTERNS, a: 1, why: 'Exactly two outcomes, and one of them always happens.'},
  {q: 'Print a letter grade: A, B, C, D, or F.', opts: PATTERNS, a: 2, why: 'Several categories, and only one can be the winner.'},
  {q: 'A pizza order gets a free drink if it’s over $20 and a free dessert if it’s over $30. A big order gets both.', opts: PATTERNS, a: 3, why: 'Both rewards can happen at once, so each needs its own independent check.'},
  {q: 'Logged-out users see “Please log in.” Logged-in users see the admin panel if they’re an admin, or their dashboard if not.', opts: PATTERNS, a: 4, why: 'The admin question only matters after you know the user is logged in: a decision inside a decision.'}
], 'pick', '. You’ve got the patterns down.');

/* 04 gaps */
(() => {
  const v1 = p => p >= 90 ? 'A' : (p >= 80 && p <= 89) ? 'B' : (p >= 70 && p <= 79) ? 'C' : 'F';
  const v2 = p => p >= 90 ? 'A' : p >= 80 ? 'B' : p >= 70 ? 'C' : 'F';
  const vals = []; for (let p = 65; p <= 95; p += 0.5) vals.push(p);
  const cell = (p, g, d) => `<div class="cell sm g${g}${d ? ' edge' : ''}" title="pct = ${p}: ${g}">${p}<br>${g}</div>`;
  $('gap1').innerHTML = vals.map(p => cell(p, v1(p), v1(p) !== v2(p))).join('');
  $('gap2').innerHTML = vals.map(p => cell(p, v2(p), v1(p) !== v2(p))).join('');
  const d = vals.filter(p => v1(p) !== v2(p));
  $('gapWhy').innerHTML = `They disagree at ${d.join(' and ')}. In version 1, a score of 89.5 is not <code>&gt;= 90</code>, not <code>&lt;= 89</code>, not <code>&lt;= 79</code>… so it falls all the way to the <code>else</code> and gets an <strong>F</strong>. Whole-number tests would never catch this.`;
  document.querySelectorAll('.strip .cell.sm').forEach(c => { c.style.height = '44px'; c.style.lineHeight = '1.15'; c.style.textAlign = 'center'; });
})();

/* 05 the sneaky or */
(() => {
  const L = (c) => ['pet = input("Pet? ")', `if ${c}:`, '    print("Meow!")', 'else:', '    print("Not a cat.")'];
  const run = test => s => { const c = test(s); return {ran: c ? [0, 1, 2] : [0, 1, 3, 4], cond: {1: c}, out: [c ? 'Meow!' : 'Not a cat.']}; };
  flow($('flowPet'), {
    prompt: 'Pet? ', init: 'dog', chips: ['cat', 'Cat', 'dog', 'CAT', 'fish'],
    programs: [
      {title: 'Buggy', lines: L('pet == "cat" or "Cat"'), run: run(() => true)},
      {title: 'Fixed', lines: L('pet == "cat" or pet == "Cat"'), run: run(s => s === 'cat' || s === 'Cat')}
    ],
    explain: s => { const ok = s === 'cat' || s === 'Cat';
      return ok ? `Both agree for <code>${esc(pyStr(s))}</code>. The bug only shows up when the answer should be “no.” Try <code>dog</code>.`
        : `For <code>${esc(pyStr(s))}</code>, the buggy version still says “Meow!” <code>pet == "cat"</code> is False, but the other side of <code>or</code> is just <code>"Cat"</code>, which counts as True.` + (s.toLowerCase() === 'cat' ? ' The fixed version says no to this one because it only accepts two exact spellings.' : ''); }
  });
})();

/* 06 AP nested trace */
(() => {
  const lines = ['IF (temp ≥ 80)', '{', '   DISPLAY("Hot")', '}', 'ELSE', '{', '   IF (temp ≥ 60)', '   {', '      DISPLAY("Warm")', '   }', '   ELSE', '   {', '      DISPLAY("Cool")', '   }', '}'];
  flow($('flowAP'), {
    prompt: 'temp ← ', init: '72', chips: ['95', '80', '79', '60', '59'],
    programs: [{ap: true, chain: true, lines, run: s => { const t = toFloat(s); if (t === null) return {ran: [], cond: {}, out: [], err: 'Type a number.'};
      const a = t >= 80; if (a) return {ran: [0, 2], cond: {0: true}, nc: [6], out: ['Hot']};
      const b = t >= 60; return {ran: [0, 6, b ? 8 : 12], cond: {0: false, 6: b}, out: [b ? 'Warm' : 'Cool']}; }}],
    explain: s => { const t = toFloat(s); if (t === null) return '';
      if (t >= 80) return `<code>${t} ≥ 80</code> is true, so the first block runs and the entire ELSE block, including the inner IF, is skipped.`;
      return `<code>${t} ≥ 80</code> is false, so the program goes into the ELSE block. Inside it, <code>${t} ≥ 60</code> is ${t >= 60 ? 'true' : 'false'}, so it displays ${t >= 60 ? '“Warm”' : '“Cool”'}. Same result as the Python <code>elif</code> version.`; }
  });
})();

/* 08 quiz */
makeQuiz('quizBox', 'score', 'quizReset', [
  {q: 'What does this print?', code: 'temp = 60\nif temp >= 80:\n    print("Hot")\nelif temp >= 60:\n    print("Warm")\nelse:\n    print("Cool")', opts: ['Hot', 'Warm', 'Cool', 'Warm\nCool'], a: 1,
   why: '<code>60 &gt;= 80</code> is False. <code>60 &gt;= 60</code> is True, so “Warm” wins and the <code>else</code> is skipped.'},
  {q: 'What does this print?', code: 'x = 10\nif x > 5:\n    print("A")\nelif x > 8:\n    print("B")\nelse:\n    print("C")', opts: ['A', 'B', 'A\nB', 'C'], a: 0,
   why: '<code>x &gt; 8</code> is also True, but it’s never checked. The first True branch wins and the chain ends.'},
  {q: 'Now with separate ifs. What does this print?', code: 'x = 10\nif x > 5:\n    print("A")\nif x > 8:\n    print("B")', opts: ['A', 'B', 'A\nB', 'Nothing'], a: 2,
   why: 'Separate <code>if</code> statements are separate decisions. Both are checked, and both are True.'},
  {q: 'Using 4.5.4 Study Plan, what prints when hours is 2?', code: 'if hours > 5: ...\nelif hours > 3: ...\nelif hours > 2: print("Study plan: Focus on key topics")\nelif hours > 1: print("Study plan: Quick review")\nelif hours > 0: ...', opts: ['Study plan: Focus on key topics', 'Study plan: Quick review', 'Both lines', 'Nothing'], a: 1,
   why: '<code>2 &gt; 2</code> is False (2 isn’t greater than itself), so the chain moves on. <code>2 &gt; 1</code> is True.'},
  {q: 'In the broken theater program, what prints for age 70?', code: 'if age >= 18:\n    print("Adult ticket.")\nelif age >= 65:\n    print("Senior discount.")\nelse:\n    print("Child ticket.")', opts: ['Adult ticket.', 'Senior discount.', 'Both', 'Child ticket.'], a: 0,
   why: '<code>70 &gt;= 18</code> is True, so the first branch wins. The senior check is never reached.'},
  {q: 'The user types dog. What does this print?', code: 'pet = input("Pet? ")\nif pet == "cat" or "Cat":\n    print("Meow!")\nelse:\n    print("Not a cat.")', opts: ['Meow!', 'Not a cat.', 'Error'], a: 0,
   why: 'The right side of <code>or</code> is the non-empty string <code>"Cat"</code>, which counts as True. The condition is True for any input.'},
  {q: 'What happens when this runs?', code: 'x = 3\nelif x > 2:\n    print("hi")', opts: ['It prints hi', 'It prints nothing', 'SyntaxError'], a: 2,
   why: 'An <code>elif</code> must follow an <code>if</code> (or another <code>elif</code>). On its own, it’s a syntax error.'},
  {q: 'What does this AP pseudocode display?', code: 'x ← 5\nIF (x > 10)\n{\n   DISPLAY("big")\n}\nELSE\n{\n   IF (x > 3)\n   {\n      DISPLAY("medium")\n   }\n   ELSE\n   {\n      DISPLAY("small")\n   }\n}', opts: ['big', 'medium', 'small', 'medium small'], a: 1,
   why: '<code>5 &gt; 10</code> is false, so the ELSE block runs. Inside it, <code>5 &gt; 3</code> is true, so it displays “medium.”'}
], '', '. Perfect, you’re ready for the CodeHS quiz.');

/* highlight the current section in the nav */
(() => {
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); });
  }, {rootMargin: '-30% 0px -60% 0px'});
  links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
})();
