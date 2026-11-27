const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const B = v => `<span class="${v ? 'tv' : 'fv'}">${v ? 'True' : 'False'}</span>`;
const PY = v => v ? 'True' : 'False';
const kw = s => s.replace(/\b(and|or|not)\b/g, '<span class="kw">$1</span>');
const pyStr = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const NUM_RE = /^\s*[+-]?(\d+(\.\d*)?|\.\d+)\s*$/;
const ASKS = {'==': 'equal to', '!=': 'not equal to', '>': 'greater than', '<': 'less than', '>=': 'at least', '<=': 'at most'};
const cmp = (a, op, b) => { a = +a; b = +b; return op === '==' ? a === b : op === '!=' ? a !== b : op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : a <= b; };

/* hero: age slider drives age > 17 */
(() => {
  const sw = $('heroSwitch'), code = $('heroCode'), r = $('heroAge'), lab = $('heroAgeVal');
  function show() {
    const age = +r.value, v = age > 17;
    lab.textContent = age; sw.setAttribute('aria-checked', v);
    code.textContent = `age > 17  →  ${PY(v)}`;
  }
  r.addEventListener('input', show);
  sw.addEventListener('click', () => { r.value = +r.value > 17 ? 17 : 18; show(); });
  show();
})();

/* 01 comparison bench */
(() => {
  const A = $('benchA'), Bx = $('benchB'), out = $('benchOut');
  function run() {
    if (!NUM_RE.test(A.value) || !NUM_RE.test(Bx.value)) { out.innerHTML = '<tr><td style="text-align:left">Type a number in both boxes.</td></tr>'; return; }
    const a = A.value.trim(), b = Bx.value.trim();
    out.innerHTML = '<tr><th>expression</th><th>asks</th><th>result</th></tr>' +
      Object.keys(ASKS).map(op => `<tr><td>${esc(a)} ${esc(op)} ${esc(b)}</td><td style="font-family:var(--sans)">is ${esc(a)} ${ASKS[op]} ${esc(b)}?</td><td>${B(cmp(a, op, b))}</td></tr>`).join('');
  }
  A.addEventListener('input', run); Bx.addEventListener('input', run); run();
})();

/* 02 Voting Age console */
(() => {
  const inp = $('voteIn'), out = $('voteOut'), why = $('voteWhy');
  let first = true;
  inp.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const raw = inp.value;
    if (first) { out.innerHTML = ''; first = false; }
    let s = `What is your age? <span class="in">${esc(raw)}</span>\n`;
    if (!/^\s*[+-]?\d+\s*$/.test(raw)) {
      s += `<span class="err">ValueError: invalid literal for int() with base 10: ${esc(pyStr(raw))}</span>\n`;
      why.innerHTML = '<code>int()</code> only accepts whole numbers, so the program crashes on line 1. A real program would need to check the input first, which you’ll learn later.';
    } else {
      const age = parseInt(raw, 10), v = age > 17;
      s += `Can vote: ${v ? '<span class="ok">True</span>' : '<span class="bad">False</span>'}\n`;
      why.innerHTML = `<code>${age} &gt; 17</code> is ${B(v)}, so <code>old_enough</code> holds ${B(v)}.` +
        (age === 17 || age === 18 ? ` <strong>${age} is right at the boundary.</strong> Try ${age === 17 ? 18 : 17} next.` : ' Now try 17 and 18, the numbers on either side of the boundary.');
    }
    out.innerHTML += s; out.scrollTop = out.scrollHeight; inp.value = '';
  });
})();

/* parser shared by the number line, step evaluator, and truth table */
function perr(msg, head) { const e = new Error(msg); e.head = head; return e; }
const CMP_OPS = ['==', '!=', '>=', '<=', '>', '<'];
function lex(src, opt = {}) {
  const toks = []; let i = 0;
  while (i < src.length) {
    const c = src[i], two = src.substr(i, 2);
    if (/\s/.test(c)) { i++; continue; }
    if (c === '(' || c === ')') { toks.push({k: c}); i++; continue; }
    if (two === '=>' || two === '=<') throw perr(`Python writes this one as <code>${two[1]}=</code>: the equals sign always goes second.`);
    if (CMP_OPS.includes(two)) { toks.push({k: 'cmp', v: two}); i += 2; continue; }
    if (c === '>' || c === '<') { toks.push({k: 'cmp', v: c}); i++; continue; }
    if (c === '=') throw perr('A single <code>=</code> <em>stores</em> a value. To <em>compare</em>, use two: <code>==</code>.');
    if (c === '≠' || c === '≥' || c === '≤') throw perr(`<code>${c}</code> is AP pseudocode. In Python, write <code>${c === '≠' ? '!=' : c === '≥' ? '>=' : '<='}</code>.`);
    if (two === '&&' || c === '&') throw perr('Python doesn’t use <code>&amp;&amp;</code>. Write the word <code>and</code>.');
    if (two === '||' || c === '|') throw perr('Python doesn’t use <code>||</code>. Write the word <code>or</code>.');
    if (c === '!') throw perr('Python doesn’t use <code>!</code> for “not.” Write the word <code>not</code>, or <code>!=</code> for “not equal.”');
    const n = /^(\d+(\.\d*)?|\.\d+)/.exec(src.slice(i));
    if (n) { toks.push({k: 'lit', v: parseFloat(n[0]), raw: n[0]}); i += n[0].length; continue; }
    const m = /^[A-Za-z_]\w*/.exec(src.slice(i));
    if (m) {
      const w = m[0]; i += w.length;
      if (w === 'True' || w === 'False') toks.push({k: 'lit', v: w === 'True'});
      else if (w === 'and' || w === 'or' || w === 'not') toks.push({k: w});
      else if (opt.ap && (w === 'AND' || w === 'OR' || w === 'NOT')) toks.push({k: w.toLowerCase()});
      else if (/^(and|or|not)$/i.test(w)) throw perr(`Python’s operators are all lowercase: write <code>${w.toLowerCase()}</code>. <code>${esc(w.toUpperCase())}</code> in capitals is AP pseudocode.`);
      else if (/^(true|false)$/i.test(w)) throw perr(`The Boolean is spelled <code>${w[0].toUpperCase() + w.slice(1).toLowerCase()}</code>. Python treats <code>${esc(w)}</code> as a variable that doesn’t exist.`, `NameError: name '${w}' is not defined`);
      else toks.push({k: 'var', v: w});
      continue;
    }
    throw perr(`<code>${esc(c)}</code> isn’t something this lab understands. Use numbers, <code>True</code>/<code>False</code>, variable names, the six comparisons, <code>and</code>, <code>or</code>, <code>not</code>, and parentheses.`);
  }
  return toks;
}
function parse(src, opt) {
  const t = lex(src, opt); let p = 0;
  if (!t.length) throw perr('Type an expression first.');
  const eat = k => (t[p] && t[p].k === k) ? t[p++] : null;
  function orE() { let n = andE(); while (eat('or')) n = {t: 'or', a: n, b: andE()}; return n; }
  function andE() { let n = notE(); while (eat('and')) n = {t: 'and', a: n, b: notE()}; return n; }
  function notE() { return eat('not') ? {t: 'not', x: notE()} : cmpE(); }
  function cmpE() {
    const items = [atom()], ops = [];
    while (t[p] && t[p].k === 'cmp') { ops.push(t[p++].v); items.push(atom()); }
    return ops.length ? {t: 'cmp', items, ops} : items[0];
  }
  function atom() {
    const k = t[p], prev = t[p - 1];
    if (!k) throw perr('The expression ends too early. Something is missing at the end.');
    if (k.k === 'lit') { p++; return {t: 'lit', v: k.v, raw: k.raw}; }
    if (k.k === 'var') { p++; return {t: 'var', v: k.v}; }
    if (k.k === '(') { p++; const x = orE(); if (!eat(')')) throw perr('A <code>(</code> is never closed. Count your parentheses.'); return {t: 'paren', x}; }
    if (k.k === 'cmp' && prev && (prev.k === 'and' || prev.k === 'or'))
      throw perr(`Each side of <code>${prev.k}</code> needs its own complete comparison. Write the variable again before <code>${esc(k.v)}</code>, like <code>x &gt;= 80 ${prev.k} x &lt; 90</code>.`);
    if (k.k === 'cmp') throw perr(`<code>${esc(k.v)}</code> needs a value on both sides.`);
    if (k.k === ')') throw perr('There’s a <code>)</code> with nothing useful before it. Check for empty or extra parentheses.');
    throw perr(`<code>${k.k}</code> needs a value ${k.k === 'not' ? 'after it' : 'on both sides'}.`);
  }
  const n = orE();
  if (p < t.length) throw perr(t[p].k === ')' ? 'There’s an extra <code>)</code>.' : 'Two values are sitting next to each other. Python expects an operator between them.');
  return n;
}
function needBool(v, op) {
  if (typeof v !== 'boolean') throw perr(`<code>${op}</code> expects <code>True</code> or <code>False</code> on each side, but got the number <code>${v}</code>. Python would let this run, but it almost always means a comparison is missing.`);
  return v;
}
function evalN(n, env) {
  switch (n.t) {
    case 'lit': return n.v;
    case 'var': return env[n.v];
    case 'paren': return evalN(n.x, env);
    case 'not': return !needBool(evalN(n.x, env), 'not');
    case 'and': return needBool(evalN(n.a, env), 'and') && needBool(evalN(n.b, env), 'and');
    case 'or': return needBool(evalN(n.a, env), 'or') || needBool(evalN(n.b, env), 'or');
    case 'cmp': { const v = n.items.map(x => evalN(x, env)); return n.ops.every((op, i) => cmp(v[i], op, v[i + 1])); }
  }
}
function varsOf(n, out = []) {
  if (n.t === 'var') { if (!out.includes(n.v)) out.push(n.v); }
  else if (n.t === 'cmp') n.items.forEach(x => varsOf(x, out));
  else if (n.x) varsOf(n.x, out);
  else if (n.a) { varsOf(n.a, out); varsOf(n.b, out); }
  return out;
}
const errHTML = e => `<span class="err">${e.head || 'SyntaxError: invalid syntax'}</span>`;
function chipRow(box, items, label, onPick) {
  items.forEach(it => { const b = document.createElement('button'); b.textContent = label(it); b.onclick = () => onPick(it); box.appendChild(b); });
}

/* 03 number line */
(() => {
  const ex = [
    {e: 'grade >= 80 and grade < 90', lo: 70, hi: 100},
    {e: 'grade > 80 and grade < 90', lo: 70, hi: 100},
    {e: 'grade >= 80 and grade <= 90', lo: 70, hi: 100},
    {e: 'grade >= 80 or grade < 90', lo: 70, hi: 100},
    {e: '80 <= grade < 90', lo: 70, hi: 100},
    {e: 'grade >= 80 and < 90', lo: 70, hi: 100},
    {e: 'age > 17', lo: 10, hi: 25},
    {e: 'age >= 18', lo: 10, hi: 25}
  ];
  const inp = $('lineIn'), lo = $('lineLo'), hi = $('lineHi'), out = $('lineOut'), why = $('lineWhy');
  chipRow($('lineChips'), ex, x => x.e, x => { inp.value = x.e; lo.value = x.lo; hi.value = x.hi; run(); });
  function run() {
    out.innerHTML = ''; why.innerHTML = '';
    let ast;
    try { ast = parse(inp.value.trim()); } catch (e) { out.innerHTML = `<pre class="term">${errHTML(e)}</pre>`; why.innerHTML = e.message; return; }
    const vs = varsOf(ast);
    if (vs.length !== 1) { why.innerHTML = vs.length ? `Use just one variable name. This expression has ${vs.length}: ${vs.map(v => `<code>${esc(v)}</code>`).join(', ')}.` : 'Use a variable name, like <code>grade</code>, so there’s something to test on the number line.'; return; }
    let a = Math.round(+lo.value), b = Math.round(+hi.value);
    if (!isFinite(a) || !isFinite(b) || b < a) { why.innerHTML = 'Pick a “from” number that’s smaller than the “to” number.'; return; }
    if (b - a > 60) { b = a + 60; why.innerHTML = 'Showing the first 61 numbers. '; }
    const v = vs[0], res = [];
    try { for (let i = a; i <= b; i++) { const r = evalN(ast, {[v]: i}); if (typeof r !== 'boolean') throw perr('The whole expression should give <code>True</code> or <code>False</code>. Add a comparison.'); res.push(r); } }
    catch (e) { out.innerHTML = `<pre class="term">${errHTML(e)}</pre>`; why.innerHTML = e.message; return; }
    out.innerHTML = '<div class="strip">' + res.map((r, k) => {
      const edge = (k > 0 && res[k - 1] !== r) || (k < res.length - 1 && res[k + 1] !== r);
      return `<div class="cell ${r ? 't' : 'f'}${edge ? ' edge' : ''}" title="${esc(v)} = ${a + k}: ${PY(r)}">${a + k}</div>`;
    }).join('') + '</div>';
    const runs = []; let s = null;
    res.forEach((r, k) => { if (r && s === null) s = k; if ((!r || k === res.length - 1) && s !== null) { const e = r ? k : k - 1; runs.push(s === e ? `${a + s}` : `${a + s}–${a + e}`); s = null; } });
    why.innerHTML += runs.length ? `<p class="summary">True for ${esc(v)} = ${runs.join(', ')}${runs.length === 1 && runs[0] === `${a}–${b}` ? ', which is every number shown. A rule that’s always True isn’t checking anything.' : '.'}</p>` : '<p class="summary">False for every number shown.</p>';
  }
  inp.addEventListener('input', run); lo.addEventListener('input', run); hi.addEventListener('input', run);
  inp.value = ex[0].e; run();
})();

/* 04 input() trap */
(() => {
  const ex = [['10', '9'], ['4', '4'], ['4', ' 4'], ['05', '5'], ['100', '25'], ['7', '7.0']];
  const A = $('trapA'), Bx = $('trapB'), out = $('trapOut'), why = $('trapWhy');
  chipRow($('trapChips'), ex, x => `"${x[0]}" and "${x[1]}"`, x => { A.value = x[0]; Bx.value = x[1]; run(); });
  const isInt = s => /^\s*[+-]?\d+\s*$/.test(s);
  function run() {
    const a = A.value, b = Bx.value, ok = isInt(a) && isInt(b);
    const ia = parseInt(a, 10), ib = parseInt(b, 10);
    const bad = !isInt(a) ? a : b;
    const verr = `<span class="fv" style="font-size:12px">ValueError: invalid literal for int() with base 10: ${esc(pyStr(bad))}</span>`;
    out.innerHTML = '<tr><th>expression</th><th>compares</th><th>result</th></tr>' +
      `<tr><td>a == b</td><td>${esc(pyStr(a))} == ${esc(pyStr(b))}</td><td>${B(a === b)}</td></tr>` +
      `<tr><td>a &gt; b</td><td>${esc(pyStr(a))} &gt; ${esc(pyStr(b))}</td><td>${B(a > b)}</td></tr>` +
      `<tr><td>int(a) == int(b)</td><td>${ok ? `${ia} == ${ib}` : '—'}</td><td>${ok ? B(ia === ib) : verr}</td></tr>` +
      `<tr><td>int(a) &gt; int(b)</td><td>${ok ? `${ia} &gt; ${ib}` : '—'}</td><td>${ok ? B(ia > ib) : verr}</td></tr>`;
    let w;
    if (!ok) w = '<code>int()</code> only accepts whole numbers (spaces at the ends are fine). For a decimal like <code>7.0</code>, use <code>float()</code>.';
    else if (a !== b && a.trim() === b.trim()) w = '<strong>Spaces count in text.</strong> To Python, <code>' + esc(pyStr(a)) + '</code> and <code>' + esc(pyStr(b)) + '</code> are different strings, so <code>==</code> says False, and a space even sorts before every digit for <code>&gt;</code>. <code>int()</code> ignores spaces at the ends, so the numbers match.';
    else if ((a > b) !== (ia > ib)) w = `<strong>Text and numbers disagree.</strong> As text, Python compares the first characters: <code>'${esc(a.trim()[0])}'</code> vs. <code>'${esc(b.trim()[0])}'</code>, like alphabetizing. As numbers, ${ia} &gt; ${ib} is ${B(ia > ib)}.`;
    else if (a !== b && ia === ib) w = `<strong>Different text, same number.</strong> The strings don’t match character for character, but <code>int()</code> turns them into the same number.`;
    else w = 'Here text and numbers happen to agree. Don’t count on it: try <code>"10"</code> and <code>"9"</code>.';
    why.innerHTML = w;
  }
  A.addEventListener('input', run); Bx.addEventListener('input', run); run();
})();

/* 05 step evaluator */
(() => {
  const ex = ['7 == 7.0', '7 != 7', '25 >= 25', '25 > 25', 'not 5 > 3', '45 >= 48 or 45 >= 42 and True', '50 >= 48 or 50 >= 42 and False', '(4 != 6 and 3 > 8) or 2 < 5', '80 <= 85 < 90', '5 = 5', '85 >= 80 and < 90', '10 => 9'];
  const inp = $('evIn'), out = $('evOut'), steps = $('evSteps'), why = $('evWhy');
  chipRow($('evChips'), ex, x => x, x => { inp.value = x; run(); });
  const isLit = n => n.t === 'lit';
  const litS = n => typeof n.v === 'boolean' ? B(n.v) : esc(n.raw ?? String(n.v));
  const show = (n, tg) => {
    let s;
    switch (n.t) {
      case 'lit': s = litS(n); break;
      case 'var': s = n.v; break;
      case 'paren': s = '(' + show(n.x, tg) + ')'; break;
      case 'not': s = 'not ' + show(n.x, tg); break;
      case 'cmp': s = n.items.map((x, i) => show(x, tg) + (i < n.ops.length ? ' ' + esc(n.ops[i]) + ' ' : '')).join(''); break;
      default: s = show(n.a, tg) + ' ' + n.t + ' ' + show(n.b, tg);
    }
    return n === tg ? `<mark>${s}</mark>` : s;
  };
  function target(n) {
    if (n.t === 'paren' || n.t === 'not') return isLit(n.x) ? n : target(n.x);
    if (n.t === 'cmp') { const k = n.items.find(x => !isLit(x)); return k ? target(k) : n; }
    if (!isLit(n.a)) return target(n.a);
    if (!isLit(n.b)) return target(n.b);
    return n;
  }
  function repl(n, tg, nn) {
    if (n === tg) return nn;
    if (n.t === 'paren' || n.t === 'not') return {t: n.t, x: repl(n.x, tg, nn)};
    if (n.t === 'cmp') return {t: 'cmp', ops: n.ops, items: n.items.map(x => repl(x, tg, nn))};
    if (n.t === 'and' || n.t === 'or') return {t: n.t, a: repl(n.a, tg, nn), b: repl(n.b, tg, nn)};
    return n;
  }
  function collapse(n) {
    if (n.t === 'paren') { const x = collapse(n.x); return isLit(x) ? x : {t: 'paren', x}; }
    if (n.t === 'not') return {t: 'not', x: collapse(n.x)};
    if (n.t === 'cmp') return {t: 'cmp', ops: n.ops, items: n.items.map(collapse)};
    if (n.t === 'and' || n.t === 'or') return {t: n.t, a: collapse(n.a), b: collapse(n.b)};
    return n;
  }
  const raw = n => typeof n.v === 'boolean' ? PY(n.v) : (n.raw ?? String(n.v));
  function describe(tg, v) {
    if (tg.t === 'paren') return 'Parentheses around a single value just drop away.';
    if (tg.t === 'not') return `<code>not</code> flips ${PY(tg.x.v)} to ${B(v)}.`;
    if (tg.t === 'cmp') {
      if (tg.ops.length > 1) return `A chain: Python checks each pair (${tg.ops.map((op, i) => `<code>${esc(raw(tg.items[i]))} ${esc(op)} ${esc(raw(tg.items[i + 1]))}</code>`).join(' and ')}). Result: ${B(v)}.`;
      const a = raw(tg.items[0]), b = raw(tg.items[1]);
      return `Is ${esc(a)} ${ASKS[tg.ops[0]]} ${esc(b)}? ${v ? 'Yes' : 'No'}, so ${B(v)}.`;
    }
    const pair = `<code>${PY(tg.a.v)} ${tg.t} ${PY(tg.b.v)}</code>`;
    if (tg.t === 'and') return `${pair} is ${B(v)}: <code>and</code> ${v ? 'got two Trues.' : 'needs both sides True.'}`;
    return `${pair} is ${B(v)}: <code>or</code> ${v ? 'needs only one True.' : 'found no True at all.'}`;
  }
  function run() {
    const src = inp.value.trim(), head = `<span class="dim">&gt;&gt;&gt; print(${esc(src)})</span>\n`;
    steps.innerHTML = ''; why.innerHTML = '';
    let ast, result;
    try {
      ast = parse(src);
      const vs = varsOf(ast);
      if (vs.length) throw perr(`This lab works with numbers and <code>True</code>/<code>False</code> only. Put in a number where <code>${esc(vs[0])}</code> is, or use the number line in section 03.`, `NameError: name '${vs[0]}' is not defined`);
      result = evalN(ast, {});
    } catch (e) { out.innerHTML = head + errHTML(e); why.innerHTML = e.message; return; }
    out.innerHTML = head + (typeof result === 'boolean' ? (result ? '<span class="ok">True</span>' : '<span class="err">False</span>') : esc(raw(ast)));
    let cur = ast, rows = '', guard = 0;
    while (!isLit(cur) && guard++ < 60) {
      const tg = target(cur), v = evalN(tg, {});
      rows += `<div class="stp"><div class="ex">${kw(show(cur, tg))}</div><div class="why">${describe(tg, v)}</div></div>`;
      cur = collapse(repl(cur, tg, {t: 'lit', v}));
    }
    rows += `<div class="stp final"><div class="ex">${show(cur)}</div><div class="why">Done. This is what gets printed.</div></div>`;
    steps.innerHTML = `<div class="steps">${rows}</div>`;
  }
  inp.addEventListener('input', run); run();
})();

/* 06 truth table machine (accepts AP spelling of AND / OR / NOT) */
(() => {
  const ex = [
    {label: 'or over and', a: 'a or (b and c)', b: '(a or b) and (a or c)'},
    {label: 'moved parentheses', a: 'a or (b and c)', b: '(a or b) and c'},
    {label: 'NOT of an AND', a: 'NOT (a AND b)', b: 'NOT a OR NOT b'},
    {label: 'NOT of an AND, wrong', a: 'NOT (a AND b)', b: 'NOT a AND NOT b'}
  ];
  const A = $('ttA'), Bx = $('ttB'), out = $('ttOut'), why = $('ttWhy');
  chipRow($('ttChips'), ex, x => x.label, x => { A.value = x.a; Bx.value = x.b; run(); });
  function run() {
    let a, b = null;
    try { a = parse(A.value.trim(), {ap: true}); } catch (e) { out.innerHTML = `<pre class="term">A: ${errHTML(e)}</pre>`; why.innerHTML = e.message; return; }
    if (Bx.value.trim()) { try { b = parse(Bx.value.trim(), {ap: true}); } catch (e) { out.innerHTML = `<pre class="term">B: ${errHTML(e)}</pre>`; why.innerHTML = e.message; return; } }
    const vs = varsOf(a); if (b) varsOf(b, vs);
    if (vs.length > 4) { out.innerHTML = ''; why.innerHTML = `That’s ${vs.length} different variable names. This machine handles up to 4.`; return; }
    const n = vs.length, total = 1 << n;
    let h = '<table class="tt"><tr>' + vs.map(v => `<th>${esc(v)}</th>`).join('') + '<th>A</th>' + (b ? '<th>B</th>' : '') + '</tr>';
    let diffs = 0, trues = 0;
    try {
      for (let i = 0; i < total; i++) {
        const env = {}; vs.forEach((v, j) => env[v] = !((i >> (n - 1 - j)) & 1));
        const ra = evalN(a, env), rb = b ? evalN(b, env) : null;
        if (ra) trues++;
        const d = b && ra !== rb; if (d) diffs++;
        h += `<tr class="${d ? 'diff' : ''}">` + vs.map(v => `<td>${B(env[v])}</td>`).join('') + `<td>${B(ra)}</td>` + (b ? `<td>${B(rb)}</td>` : '') + '</tr>';
      }
    } catch (e) { out.innerHTML = `<pre class="term">${errHTML(e)}</pre>`; why.innerHTML = e.message; return; }
    out.innerHTML = h + '</table>';
    if (!b) why.innerHTML = `<p class="summary">${total} rows; A is True in ${trues} of them.</p>`;
    else if (!diffs) why.innerHTML = `<p class="summary">A and B agree on all ${total} rows, so they’re <strong>equivalent</strong>.</p>`;
    else why.innerHTML = `<p class="summary">A and B disagree on ${diffs} of ${total} rows (highlighted). They are <strong>not</strong> equivalent.</p>`;
  }
  A.addEventListener('input', run); Bx.addEventListener('input', run);
  A.value = ex[0].a; Bx.value = ex[0].b; run();
})();

/* 08 quiz */
(() => {
  const Q = [
    {q: 'What does this print?', code: 'print(5 == 5.0)', opts: ['True', 'False', 'Error'], a: 0,
     why: '<code>==</code> compares values. 5 and 5.0 are the same number, even though one is an <code>int</code> and one is a <code>float</code>.'},
    {q: 'What does this print?', code: 'age = 18\nprint(age > 18)', opts: ['True', 'False', 'Error'], a: 1,
     why: '<code>&gt;</code> means strictly greater. 18 is not greater than 18. That’s a boundary: <code>age &gt;= 18</code> would be <code>True</code>.'},
    {q: 'What does this print?', code: 'grade = 90\nprint(grade >= 80 and grade < 90)', opts: ['True', 'False'], a: 1,
     why: '<code>90 &gt;= 80</code> is <code>True</code>, but <code>90 &lt; 90</code> is <code>False</code>, and <code>and</code> needs both. A 90 is an A, not a B.'},
    {q: 'What does this print?', code: 'print(not 4 > 2)', opts: ['True', 'False', 'Error'], a: 1,
     why: 'The comparison happens first: <code>4 &gt; 2</code> is <code>True</code>. Then <code>not True</code> is <code>False</code>.'},
    {q: 'What does this print?', code: 'print(3 != 3 or 10 <= 10)', opts: ['True', 'False'], a: 0,
     why: '<code>3 != 3</code> is <code>False</code>. <code>10 &lt;= 10</code> is <code>True</code> because “at most 10” includes 10. One True is enough for <code>or</code>.'},
    {q: 'The user types 10. What happens?', code: 'x = input("Number? ")\nprint(x > 9)', opts: ['It prints True', 'It prints False', 'TypeError', 'ValueError'], a: 2,
     why: '<code>input()</code> gives the string <code>"10"</code>. Python can’t compare a string to an int with <code>&gt;</code>. Wrapping the input in <code>int()</code> fixes it.'},
    {q: 'The user types 10, then 9. What does this print?', code: 'a = input("a? ")\nb = input("b? ")\nprint(a > b)', opts: ['True', 'False', 'TypeError'], a: 1,
     why: 'Both are strings, so Python compares them like words: <code>"1"</code> comes before <code>"9"</code>, so <code>"10" &gt; "9"</code> is <code>False</code>.'},
    {q: 'Which AP pseudocode expression is true when score is 90 or higher?', code: '', opts: ['score >= 90', 'score ≥ 90', 'score ← 90', 'score = 90'], a: 1,
     why: 'AP pseudocode uses the math symbol <code>≥</code>. <code>score = 90</code> is only true for exactly 90, and <code>←</code> stores a value instead of comparing.'}
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
