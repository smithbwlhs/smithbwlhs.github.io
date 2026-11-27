const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const B = v => `<span class="${v ? 'tv' : 'fv'}">${v ? 'True' : 'False'}</span>`;
const PY = v => v ? 'True' : 'False';
const kw = s => s.replace(/\b(and|or|not)\b/g, '<span class="kw">$1</span>');

/* hero switch: each click runs light_on = not light_on */
(() => {
  const b = $('heroSwitch'), c = $('heroCode');
  let on = true;
  b.addEventListener('click', () => {
    on = !on;
    b.setAttribute('aria-checked', on);
    c.textContent = 'light_on = not light_on  # now ' + PY(on);
  });
})();

/* 01 light switch (4.2.3) */
(() => {
  let v, printed;
  const lamp = $('lamp'), val = $('lampVal'), out = $('lampOut');
  function show() {
    lamp.classList.toggle('on', v); lamp.textContent = v ? 'on' : 'off';
    val.textContent = PY(v); val.className = v ? 'tv' : 'fv';
    val.parentElement.classList.remove('changed'); void val.parentElement.offsetWidth; val.parentElement.classList.add('changed');
  }
  function reset() { v = true; printed = false; out.innerHTML = '<span class="dim"># output appears here when you print</span>'; show(); }
  $('flip').onclick = () => { v = !v; show(); };
  $('lprint').onclick = () => {
    if (!printed) { out.innerHTML = ''; printed = true; }
    out.innerHTML += 'Light on? ' + PY(v) + '\n';
    out.scrollTop = out.scrollHeight;
  };
  $('lreset').onclick = reset;
  reset();
})();

/* 02 / 03 gate labs */
function gate(root, cfg) {
  const vals = cfg.init.slice();
  root.innerHTML = `<div class="row" role="group" aria-label="Input variables"></div>
    <div class="gate"><div><pre class="code" style="margin-bottom:10px"></pre><pre class="term" aria-live="polite"></pre><div class="explain"></div></div>
    <div class="scroll" style="margin:0"><table class="tt"></table></div></div>`;
  const row = root.querySelector('.row'), code = root.querySelector('pre.code'), term = root.querySelector('.term'),
        why = root.querySelector('.explain'), tt = root.querySelector('.tt');
  const btns = cfg.vars.map((name, i) => {
    const b = document.createElement('button'); b.className = 'tog';
    b.onclick = () => { vals[i] = !vals[i]; render(); };
    row.appendChild(b); return b;
  });
  const f = (a, b) => cfg.op === 'and' ? a && b : a || b;
  function render() {
    const r = f(vals[0], vals[1]);
    btns.forEach((b, i) => { b.setAttribute('aria-pressed', vals[i]); b.textContent = `${cfg.vars[i]} = ${PY(vals[i])}`; });
    code.innerHTML = cfg.vars.map((n, i) => `${n} = <span class="${vals[i] ? 'bt' : 'bf'}">${PY(vals[i])}</span>`).join('\n') +
      `\n${cfg.result} = ${cfg.vars[0]} <span class="kw">${cfg.op}</span> ${cfg.vars[1]}\n<span class="fn">print</span>(<span class="st">"${cfg.label}"</span> + <span class="fn">str</span>(${cfg.result}))`;
    term.innerHTML = cfg.label + (r ? '<span class="ok">True</span>' : '<span class="err">False</span>');
    const rule = cfg.op === 'and'
      ? (r ? 'both sides are True, so <code>and</code> gives True.' : (vals[0] || vals[1] ? 'one side is False, and <code>and</code> needs both, so the result is False.' : 'neither side is True, so <code>and</code> gives False.'))
      : (r ? (vals[0] && vals[1] ? 'both sides are True. That still counts: <code>or</code> needs at least one.' : 'one side is True, and that’s enough for <code>or</code>.') : 'neither side is True, so <code>or</code> gives False.');
    why.innerHTML = `<code>${PY(vals[0])} ${cfg.op} ${PY(vals[1])}</code> is ${B(r)}: ${rule}`;
    let h = `<tr><th>${cfg.short[0]}</th><th>${cfg.short[1]}</th><th>${cfg.short[0]} ${cfg.op} ${cfg.short[1]}</th></tr>`;
    [[true, true], [true, false], [false, true], [false, false]].forEach(([a, b]) => {
      h += `<tr class="${a === vals[0] && b === vals[1] ? 'cur' : ''}"><td>${B(a)}</td><td>${B(b)}</td><td>${B(f(a, b))}</td></tr>`;
    });
    tt.innerHTML = h;
  }
  render();
}
gate($('gateAnd'), {vars: ['at_least_thirty_five', 'is_us_citizen'], short: ['age', 'citizen'], init: [false, false], op: 'and', result: 'can_be_president', label: 'Can be president: '});
gate($('gateOr'), {vars: ['on_tiktok', 'on_instagram'], short: ['tiktok', 'insta'], init: [true, false], op: 'or', result: 'is_wasting_time', label: 'Wasting time? '});

/* a tiny Boolean-expression parser shared by labs 04 and 05 */
function perr(kind, msg, head) { const e = new Error(msg); e.kind = kind; e.head = head; return e; }
function lex(src) {
  const toks = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '(' || c === ')') { toks.push({k: c}); i++; continue; }
    if (src.startsWith('&&', i) || c === '&') throw perr('syntax', 'Python doesn’t use <code>&amp;&amp;</code>. Write the word <code>and</code>.');
    if (src.startsWith('||', i) || c === '|') throw perr('syntax', 'Python doesn’t use <code>||</code>. Write the word <code>or</code>.');
    if (c === '!') throw perr('syntax', 'Python doesn’t use <code>!</code> for “not.” Write the word <code>not</code>.');
    const m = /^[A-Za-z_]\w*/.exec(src.slice(i));
    if (m) {
      const w = m[0]; i += w.length;
      if (w === 'True' || w === 'False') toks.push({k: 'lit', v: w === 'True'});
      else if (w === 'and' || w === 'or' || w === 'not') toks.push({k: w});
      else if (/^(and|or|not)$/i.test(w)) throw perr('syntax', `Python’s operators are all lowercase: write <code>${w.toLowerCase()}</code>. <code>${esc(w.toUpperCase())}</code> in capitals is how AP pseudocode writes it.`);
      else if (/^(true|false)$/i.test(w)) {
        const fixed = w[0].toUpperCase() + w.slice(1).toLowerCase();
        throw perr('name', `Python has never heard of <code>${esc(w)}</code>, so it assumes you meant a variable that doesn’t exist. The Boolean is spelled <code>${fixed}</code>.`, `NameError: name '${w}' is not defined`);
      }
      else toks.push({k: 'var', v: w});
      continue;
    }
    throw perr('syntax', `<code>${esc(c)}</code> isn’t part of a Boolean expression. Use <code>True</code>, <code>False</code>, variable names, <code>and</code>, <code>or</code>, <code>not</code>, and parentheses.`);
  }
  return toks;
}
function parse(src) {
  const t = lex(src); let p = 0;
  if (!t.length) throw perr('syntax', 'Type an expression first.');
  const eat = k => (t[p] && t[p].k === k) ? t[p++] : null;
  function orE() { let n = andE(); while (eat('or')) n = {t: 'or', a: n, b: andE()}; return n; }
  function andE() { let n = notE(); while (eat('and')) n = {t: 'and', a: n, b: notE()}; return n; }
  function notE() { return eat('not') ? {t: 'not', x: notE()} : atom(); }
  function atom() {
    const k = t[p];
    if (!k) throw perr('syntax', 'The expression ends too early. Something is missing after the last operator.');
    if (k.k === 'lit') { p++; return {t: 'lit', v: k.v}; }
    if (k.k === 'var') { p++; return {t: 'var', v: k.v}; }
    if (k.k === '(') { p++; const x = orE(); if (!eat(')')) throw perr('syntax', 'A <code>(</code> is never closed. Count your parentheses.'); return {t: 'paren', x}; }
    if (k.k === ')') throw perr('syntax', 'There’s a <code>)</code> with nothing useful before it. Check for empty or extra parentheses.');
    throw perr('syntax', `<code>${k.k}</code> needs a value ${k.k === 'not' ? 'after it' : 'on both sides'}.`);
  }
  const n = orE();
  if (p < t.length) throw perr('syntax', t[p].k === ')' ? 'There’s an extra <code>)</code>.' : 'Two values are sitting next to each other. Python expects <code>and</code> or <code>or</code> between them.');
  return n;
}
function evalN(n, env) {
  switch (n.t) {
    case 'lit': return n.v;
    case 'var': return env[n.v];
    case 'paren': return evalN(n.x, env);
    case 'not': return !evalN(n.x, env);
    case 'and': return evalN(n.a, env) && evalN(n.b, env);
    default: return evalN(n.a, env) || evalN(n.b, env);
  }
}
function varsOf(n, out = []) {
  if (n.t === 'var') { if (!out.includes(n.v)) out.push(n.v); }
  else if (n.x) varsOf(n.x, out);
  else if (n.a) { varsOf(n.a, out); varsOf(n.b, out); }
  return out;
}
function errHTML(e) { return `<span class="err">${e.head || 'SyntaxError: invalid syntax'}</span>`; }

/* 04 step-by-step evaluator */
(() => {
  const ex = ['not True', 'not not True', 'True and False', 'True or False', 'not True and False', 'not (True and False)', 'True or False and False', '(True or False) and False', 'true and False', 'True && False', 'True AND False'];
  const box = $('evChips'), inp = $('evIn'), out = $('evOut'), steps = $('evSteps'), why = $('evWhy');
  ex.forEach(e => { const b = document.createElement('button'); b.textContent = e; b.onclick = () => { inp.value = e; run(); }; box.appendChild(b); });
  const show = (n, tg) => {
    let s;
    switch (n.t) {
      case 'lit': s = n.v ? '<span class="tv">True</span>' : '<span class="fv">False</span>'; break;
      case 'var': s = n.v; break;
      case 'paren': s = '(' + show(n.x, tg) + ')'; break;
      case 'not': s = 'not ' + show(n.x, tg); break;
      default: s = show(n.a, tg) + ' ' + n.t + ' ' + show(n.b, tg);
    }
    return n === tg ? `<mark>${s}</mark>` : s;
  };
  const isLit = n => n.t === 'lit';
  function target(n) {
    if (n.t === 'paren' || n.t === 'not') return isLit(n.x) ? n : target(n.x);
    if (!isLit(n.a)) return target(n.a);
    if (!isLit(n.b)) return target(n.b);
    return n;
  }
  function repl(n, tg, nn) {
    if (n === tg) return nn;
    if (n.t === 'paren' || n.t === 'not') return {t: n.t, x: repl(n.x, tg, nn)};
    if (n.t === 'and' || n.t === 'or') return {t: n.t, a: repl(n.a, tg, nn), b: repl(n.b, tg, nn)};
    return n;
  }
  function collapse(n) {
    if (n.t === 'paren') { const x = collapse(n.x); return isLit(x) ? x : {t: 'paren', x}; }
    if (n.t === 'not') return {t: 'not', x: collapse(n.x)};
    if (n.t === 'and' || n.t === 'or') return {t: n.t, a: collapse(n.a), b: collapse(n.b)};
    return n;
  }
  function describe(tg, v) {
    if (tg.t === 'paren') return 'Parentheses around a single value just drop away.';
    if (tg.t === 'not') return `<code>not</code> flips ${PY(tg.x.v)} to ${B(v)}.`;
    const pair = `<code>${PY(tg.a.v)} ${tg.t} ${PY(tg.b.v)}</code>`;
    if (tg.t === 'and') return `${pair} is ${B(v)}: <code>and</code> ${v ? 'got two Trues.' : 'needs both sides True.'}`;
    return `${pair} is ${B(v)}: <code>or</code> ${v ? 'needs only one True.' : 'found no True at all.'}`;
  }
  function run() {
    const src = inp.value.trim();
    let html = `<span class="dim">&gt;&gt;&gt; print(${esc(src)})</span>\n`;
    steps.innerHTML = ''; why.innerHTML = '';
    let ast;
    try {
      ast = parse(src);
      const vs = varsOf(ast);
      if (vs.length) throw perr('name', `This lab only works with the values <code>True</code> and <code>False</code>. For variables like <code>${esc(vs[0])}</code>, use the truth table machine in section 05.`, `NameError: name '${vs[0]}' is not defined`);
    } catch (e) { out.innerHTML = html + errHTML(e); why.innerHTML = e.message; return; }
    const result = evalN(ast, {});
    out.innerHTML = html + (result ? '<span class="ok">True</span>' : '<span class="err">False</span>');
    let cur = ast, rows = '';
    let guard = 0;
    while (!isLit(cur) && guard++ < 50) {
      const tg = target(cur), v = evalN(tg, {});
      rows += `<div class="stp"><div class="ex">${kw(show(cur, tg))}</div><div class="why">${describe(tg, v)}</div></div>`;
      cur = collapse(repl(cur, tg, {t: 'lit', v}));
    }
    rows += `<div class="stp final"><div class="ex">${show(cur)}</div><div class="why">Done. This is what gets printed.</div></div>`;
    steps.innerHTML = `<div class="steps">${rows}</div>`;
  }
  inp.addEventListener('input', run); run();
})();

/* 05 truth table machine */
(() => {
  const ex = [
    {label: 'movies: with vs. without ( )', a: 'has_money and (is_weekend or is_holiday)', b: 'has_money and is_weekend or is_holiday'},
    {label: 'and vs. or', a: 'a and b', b: 'a or b'},
    {label: 'where does not go?', a: 'not (a and b)', b: 'not a and b'},
    {label: 'not of a group', a: 'not (a and b)', b: 'not a or not b'},
    {label: 'just one expression', a: 'is_sunny and not is_busy', b: ''}
  ];
  const box = $('ttChips'), A = $('ttA'), Bx = $('ttB'), out = $('ttOut'), why = $('ttWhy');
  ex.forEach(e => { const b = document.createElement('button'); b.textContent = e.label; b.onclick = () => { A.value = e.a; Bx.value = e.b; run(); }; box.appendChild(b); });
  function run() {
    let a, b = null;
    const hasB = Bx.value.trim() !== '';
    try { a = parse(A.value.trim()); } catch (e) { out.innerHTML = `<pre class="term">A: ${errHTML(e)}</pre>`; why.innerHTML = e.message; return; }
    if (hasB) { try { b = parse(Bx.value.trim()); } catch (e) { out.innerHTML = `<pre class="term">B: ${errHTML(e)}</pre>`; why.innerHTML = e.message; return; } }
    const vs = varsOf(a); if (b) varsOf(b, vs);
    if (vs.length > 4) { out.innerHTML = ''; why.innerHTML = `That’s ${vs.length} different variable names. This machine handles up to 4 (16 rows). Check for typos: <code>is_raining</code> and <code>is_rainy</code> count as two names.`; return; }
    const n = vs.length, total = 1 << n;
    let h = '<table class="tt"><tr>' + vs.map(v => `<th>${esc(v)}</th>`).join('') + '<th>A</th>' + (b ? '<th>B</th>' : '') + '</tr>';
    let diffs = 0, trues = 0;
    for (let i = 0; i < total; i++) {
      const env = {}; vs.forEach((v, j) => env[v] = !((i >> (n - 1 - j)) & 1));
      const ra = evalN(a, env), rb = b ? evalN(b, env) : null;
      if (ra) trues++;
      const d = b && ra !== rb; if (d) diffs++;
      h += `<tr class="${d ? 'diff' : ''}">` + vs.map(v => `<td>${B(env[v])}</td>`).join('') + `<td>${B(ra)}</td>` + (b ? `<td>${B(rb)}</td>` : '') + '</tr>';
    }
    out.innerHTML = h + '</table>';
    if (!b) why.innerHTML = `<p class="summary">${total} row${total === 1 ? '' : 's'}; A is True in ${trues} of them.</p>`;
    else if (!diffs) why.innerHTML = `<p class="summary">A and B agree on all ${total} rows, so they’re <strong>equivalent</strong>: they always give the same answer.</p>`;
    else why.innerHTML = `<p class="summary">A and B disagree on ${diffs} of ${total} rows (highlighted). They are <strong>not</strong> equivalent.</p>`;
  }
  A.addEventListener('input', run); Bx.addEventListener('input', run);
  A.value = ex[0].a; Bx.value = ex[0].b; run();
})();

/* 08 quiz */
(() => {
  const Q = [
    {q: 'What does this print?', code: 'light_on = True\nlight_on = not light_on\nprint(light_on)', opts: ['True', 'False', 'not True', 'Error'], a: 1,
     why: '<code>not light_on</code> flips <code>True</code> to <code>False</code>, and that value is stored back in <code>light_on</code>.'},
    {q: 'What does this print?', code: 'at_least_thirty_five = True\nis_us_citizen = False\nprint(at_least_thirty_five and is_us_citizen)', opts: ['True', 'False', 'True False', 'Error'], a: 1,
     why: '<code>and</code> needs both sides to be <code>True</code>. One side is <code>False</code>, so the result is <code>False</code>.'},
    {q: 'What does this print?', code: 'on_tiktok = True\non_instagram = True\nprint(on_tiktok or on_instagram)', opts: ['True', 'False', 'Error: only one can be True', 'Nothing'], a: 0,
     why: 'Python’s <code>or</code> is <code>True</code> when one, the other, <em>or both</em> are <code>True</code>.'},
    {q: 'What does this print?', code: 'print(True or False and False)', opts: ['True', 'False'], a: 0,
     why: '<code>and</code> goes before <code>or</code>. <code>False and False</code> is <code>False</code>, then <code>True or False</code> is <code>True</code>.'},
    {q: 'What does this print?', code: 'print(not (True and False))', opts: ['True', 'False', 'Error'], a: 0,
     why: 'Parentheses first: <code>True and False</code> is <code>False</code>. Then <code>not False</code> is <code>True</code>.'},
    {q: 'What happens when this runs?', code: 'print("Result: " + (True and False))', opts: ['It prints Result: False', 'It prints Result: (True and False)', 'TypeError', 'It prints Result:False'], a: 2,
     why: 'The expression gives the Boolean <code>False</code>, and <code>+</code> can’t join a string to a Boolean. Wrapping it in <code>str()</code> fixes it.'},
    {q: 'What happens when this runs?', code: 'print(True && False)', opts: ['It prints False', 'It prints True', 'SyntaxError'], a: 2,
     why: '<code>&amp;&amp;</code> is how some other languages write “and.” Python only accepts the word <code>and</code>.'},
    {q: 'Which is the AP pseudocode version of this Python?', code: 'has_ticket and not is_sold_out', opts: ['has_ticket && !is_sold_out', 'has_ticket and not is_sold_out', 'has_ticket AND NOT is_sold_out', 'has_ticket + NOT is_sold_out'], a: 2,
     why: 'AP pseudocode writes the operators in capitals: <code>AND</code>, <code>OR</code>, <code>NOT</code>.'}
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
