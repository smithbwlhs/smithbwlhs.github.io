const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escC = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const pyStr = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const PY = v => v ? 'True' : 'False';
const isInt = s => /^\s*[+-]?\d+\s*$/.test(s);
function hl(line) {
  let s = escC(line), out = '', last = 0, m;
  const re = /("(?:[^"\\]|\\.)*"|#.*$|\b(?:for|in|if|else|while|not|and|or|break|continue|import|True|False)\b|\b(?:print|range|input|int|str)\b(?=\s*\())/g;
  while ((m = re.exec(s))) {
    out += s.slice(last, m.index); const t = m[0];
    out += t[0] === '"' ? `<span class="st">${t}</span>` : t[0] === '#' ? `<span class="cm">${t}</span>` : /^(print|range|input|int|str)$/.test(t) ? `<span class="fn">${t}</span>` : `<span class="kw">${t}</span>`;
    last = m.index + t.length;
  }
  return out + s.slice(last);
}
function chipRow(box, items, label, onPick) {
  items.forEach(it => { const b = document.createElement('button'); b.textContent = label(it); b.onclick = () => onPick(it); box.appendChild(b); });
}
/* a small console: re-runs a program function on the list of answers so far */
function konsole(ids, prog) {
  const out = $(ids.out), row = $(ids.row), inp = $(ids.inp);
  let inputs = [];
  function render() {
    const r = prog(inputs);
    out.innerHTML = r.html || '<span class="dim"># type an answer and press Enter</span>';
    out.scrollTop = out.scrollHeight;
    row.style.display = r.done ? 'none' : '';
    if (ids.after) ids.after(r, inputs);
  }
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { inputs.push(inp.value); inp.value = ''; render(); if (row.style.display !== 'none') inp.focus(); } });
  $(ids.reset).onclick = () => { inputs = []; render(); };
  render();
  return {render};
}

/* 01 Adding Up Numbers */
(() => {
  const L = ['SENTINEL = -1', '', 'sum = 0', '', 'while True:', '    num = int(input("Enter a number: "))', '    if num == SENTINEL:', '        break', '    sum += num', '', 'print("The total was: " + str(sum))'];
  const src = $('auSrc'), why = $('auWhy');
  const show = (ran, cond) => { src.innerHTML = L.map((l, i) => `<div class="${ran.includes(i) ? 'ran' : ''}"><b>${i + 1}</b>${hl(l) || ' '}${i in cond ? `<span class="cond ${cond[i] ? 't' : 'f'}">→ ${PY(cond[i])}</span>` : ''}</div>`).join(''); };
  konsole({out: 'auOut', row: 'auRow', inp: 'auIn', reset: 'auReset', after: (r, inputs) => {
    if (!inputs.length) { show([0, 2], {}); why.innerHTML = 'Setup ran. Now type numbers; type <code>-1</code> to stop. The highlighted lines are the most recent pass.'; return; }
    const last = inputs[inputs.length - 1];
    if (!isInt(last)) { show([4, 5], {}); why.innerHTML = '<code>int()</code> can’t convert that, so the program crashes on the first half of the loop.'; return; }
    const n = parseInt(last, 10);
    if (n === -1) { show([4, 5, 6, 7, 10], {6: true}); why.innerHTML = `The check was <span class="tv">True</span>, so <code>break</code> jumped straight past <code>sum += num</code> to the print. The -1 itself was never added: a sentinel is a signal, not data.`; }
    else { show([4, 5, 6, 8], {6: false}); why.innerHTML = `The check was <span class="fv">False</span>, so the second half ran: <code>sum</code> is now ${r.sum}. Back to <code>while True</code> for another pass.`; }
  }}, inputs => {
    let h = '', sum = 0;
    for (const v of inputs) {
      h += `Enter a number: <span class="in">${escC(v)}</span>\n`;
      if (!isInt(v)) return {html: h + `<span class="err">ValueError: invalid literal for int() with base 10: ${escC(pyStr(v))}</span>`, done: true};
      const n = parseInt(v, 10);
      if (n === -1) return {html: h + `The total was: ${sum}\n<span class="dim">(program finished)</span>`, done: true, sum};
      sum += n;
    }
    return {html: h, sum};
  });
})();

/* 02 break vs continue */
(() => {
  const M = [
    {label: 'no if', code: ['for i in range(1, 9):', '    print(i)'], kw: null},
    {label: 'if i % 3 == 0: break', code: ['for i in range(1, 9):', '    if i % 3 == 0:', '        break', '    print(i)'], kw: 'break'},
    {label: 'if i % 3 == 0: continue', code: ['for i in range(1, 9):', '    if i % 3 == 0:', '        continue', '    print(i)'], kw: 'continue'}
  ];
  const code = $('bcCode'), list = $('bcList'), out = $('bcOut'), why = $('bcWhy');
  function show(m) {
    code.innerHTML = m.code.map(hl).join('\n');
    const printed = []; let stopped = false, h = '';
    for (let i = 1; i <= 8; i++) {
      if (stopped) { h += `<span>${i}</span>`; continue; }
      if (m.kw && i % 3 === 0) { if (m.kw === 'break') { stopped = true; h += `<span class="stop">${i} break</span>`; continue; } h += `<span class="skip">${i}</span>`; continue; }
      printed.push(i); h += `<span class="out">${i}</span>`;
    }
    list.innerHTML = h; out.textContent = printed.join('\n');
    why.innerHTML = !m.kw ? 'Every number prints.' : m.kw === 'break' ? 'At 3, <code>break</code> ends the whole loop. 4 through 8 never even get a turn.' : 'At 3 and 6, <code>continue</code> skips the <code>print</code> for that pass only. The loop keeps going.';
  }
  chipRow($('bcChips'), M, m => m.label, show);
  show(M[1]);
})();

/* 03 rating validator */
(() => {
  const why = $('rtWhy');
  konsole({out: 'rtOut', row: 'rtRow', inp: 'rtIn', reset: 'rtReset', after: (r, inputs) => {
    if (!inputs.length) { why.innerHTML = 'Try 0, 9, and -2 before giving a good answer. Then try 1 and 5, the boundaries.'; return; }
    const v = inputs[inputs.length - 1];
    why.innerHTML = !isInt(v) ? '<code>int()</code> crashes on non-numbers. (Making that safe needs something beyond this unit.)' : r.done ? `<code>${parseInt(v, 10)}</code> passed the check, so <code>break</code> ended the loop.` : `<code>${parseInt(v, 10)}</code> failed the check: no <code>break</code>, so the error prints and the loop asks again.`;
  }}, inputs => {
    let h = 'Rate the movie from 1 to 5 stars.\n';
    for (const v of inputs) {
      h += `Stars: <span class="in">${escC(v)}</span>\n`;
      if (!isInt(v)) return {html: h + `<span class="err">ValueError: invalid literal for int() with base 10: ${escC(pyStr(v))}</span>`, done: true};
      const n = parseInt(v, 10);
      if (n >= 1 && n <= 5) return {html: h + 'Thanks for rating!\n<span class="dim">(program finished)</span>', done: true};
      h += 'Please pick a number from 1 to 5.\n';
    }
    return {html: h};
  });
})();

/* 04 guess counter */
(() => {
  const bug = $('gwBug'), code = $('gwCode');
  const showCode = () => {
    const L = bug.checked
      ? ['tries = 0', 'while True:', '    guess = input("Guess: ")', '    if guess == "apple":', '        break', '    tries += 1', '    print("Nope, try again.")', 'print("Got it in " + str(tries) + " tries!")']
      : ['tries = 0', 'while True:', '    guess = input("Guess: ")', '    tries += 1', '    if guess == "apple":', '        break', '    print("Nope, try again.")', 'print("Got it in " + str(tries) + " tries!")'];
    code.innerHTML = L.map(hl).join('\n');
  };
  const k = konsole({out: 'gwOut', row: 'gwRow', inp: 'gwIn', reset: 'gwReset'}, inputs => {
    let h = '', tries = 0;
    for (const g of inputs) {
      h += `Guess: <span class="in">${escC(g)}</span>\n`;
      if (!bug.checked) tries++;
      if (g === 'apple') return {html: h + `Got it in ${tries} tries!` + (bug.checked ? `  <span class="err">← but you actually typed ${inputs.length}</span>` : '') + '\n<span class="dim">(program finished)</span>', done: true};
      if (bug.checked) tries++;
      h += 'Nope, try again.\n';
    }
    return {html: h};
  });
  bug.addEventListener('change', () => { showCode(); k.render(); });
  showCode();
})();

/* 04 dice */
(() => {
  const d1 = $('d1'), d2 = $('d2'), out = $('rollOut');
  const roll = () => 1 + Math.floor(Math.random() * 6);
  let count = 0, lines = [];
  function show(a, b) { d1.textContent = a; d2.textContent = b; const s = a === 1 && b === 1; d1.classList.toggle('snake', s); d2.classList.toggle('snake', s); }
  function flush(extra = '') { out.innerHTML = escC(lines.slice(-300).join('\n')) + extra; out.scrollTop = out.scrollHeight; }
  $('rollOne').onclick = () => { const a = roll(), b = roll(); count++; lines.push(`Rolled: ${a} ${b}`); show(a, b); flush(a === 1 && b === 1 ? `\n<span class="ok">Snake eyes on roll ${count}!</span>` : ''); if (a === 1 && b === 1) { count = 0; lines = []; } };
  $('rollAll').onclick = () => {
    lines = []; count = 0; let a, b;
    do { a = roll(); b = roll(); count++; lines.push(`Rolled: ${a} ${b}`); } while (!(a === 1 && b === 1) && count < 5000);
    show(a, b); flush(`\nIt took you ${count} rolls to get snake eyes.`);
    count = 0; lines = [];
  };
  $('rollReset').onclick = () => { lines = []; count = 0; out.innerHTML = '<span class="dim"># each roll is 1 to 6, so snake eyes is a 1-in-36 chance per roll</span>'; d1.textContent = d2.textContent = '?'; d1.classList.remove('snake'); d2.classList.remove('snake'); };
  $('rollReset').click();
})();

/* 05 decoder */
(() => {
  const E = [
    {label: 'no break at all', code: 'while True:\n    print("hi")', msg: '(no error: it just never stops)', why: '<code>while True</code> is always True. Without a <code>break</code>, the only way out is the Stop button.'},
    {label: 'a break that can’t happen', code: 'while True:\n    x = int(input("Number: "))\n    if x > 10 and x < 5:\n        break', msg: '(no error: it just never stops)', why: 'No number is both greater than 10 and less than 5, so the condition is always False and <code>break</code> never runs. Did you mean <code>or</code>?'},
    {label: 'break not in an if', code: 'while True:\n    name = input("Name: ")\n    break\n    print("Hi " + name)', msg: '(no error, but the print never runs)', why: 'The <code>break</code> runs every time, on the first pass. Anything after it in the loop is unreachable. A <code>break</code> almost always belongs inside an <code>if</code>.'},
    {label: 'break outside a loop', code: 'done = True\nif done:\n    break', msg: "SyntaxError: 'break' outside loop", why: '<code>break</code> only makes sense inside a <code>for</code> or <code>while</code> loop.'},
    {label: 'lowercase true', code: 'while true:\n    answer = input("Again? ")', msg: "NameError: name 'true' is not defined", why: 'Same rule as 4.1: the Boolean is spelled <code>True</code>.'},
    {label: 'forgot int()', code: 'while True:\n    stars = input("Stars: ")\n    if stars >= 1 and stars <= 5:\n        break', msg: "TypeError: '>=' not supported between instances of 'str' and 'int'", why: 'The 4.3 input trap: compare numbers only after converting with <code>int()</code>.'}
  ];
  const code = $('erCode'), msg = $('erMsg'), why = $('erWhy');
  function show(e) { code.innerHTML = e.code.split('\n').map(hl).join('\n'); msg.textContent = e.msg; msg.style.color = e.msg.startsWith('(') ? 'var(--muted)' : ''; why.innerHTML = e.why; }
  chipRow($('erChips'), E, e => e.label, show);
  show(E[0]);
})();

/* 08 quiz */
(() => {
  const Q = [
    {q: 'What does this print?', code: 'x = 0\nwhile True:\n    x += 1\n    if x == 3:\n        break\n    print(x)', opts: ['1\n2', '1\n2\n3', '0\n1\n2', 'It never stops'], a: 0, why: 'When <code>x</code> becomes 3, <code>break</code> happens before the <code>print</code>, so 3 is never printed.'},
    {q: 'What does this print?', code: 'for i in range(5):\n    if i == 2:\n        continue\n    print(i)', opts: ['0\n1', '0\n1\n3\n4', '0\n1\n2\n3\n4', '2'], a: 1, why: '<code>continue</code> skips only the pass where <code>i</code> is 2. The loop keeps going.'},
    {q: 'What does this print?', code: 'for i in range(5):\n    if i == 2:\n        break\n    print(i)', opts: ['0\n1', '0\n1\n3\n4', '0\n1\n2', 'Nothing'], a: 0, why: '<code>break</code> ends the whole loop when <code>i</code> is 2. <code>break</code> works in <code>for</code> loops too.'},
    {q: 'What happens?', code: 'while True:\n    print("hi")', opts: ['It prints hi once', 'It prints hi forever', 'SyntaxError'], a: 1, why: 'There’s no <code>break</code>, and <code>True</code> never changes.'},
    {q: 'What is printed?', code: 'n = 10\ncount = 0\nwhile True:\n    count += 1\n    n = n - 3\n    if n < 0:\n        break\nprint(count)', opts: ['3', '4', '10', '-2'], a: 1, why: '<code>n</code> goes 7, 4, 1, -2. That’s 4 passes, and the counter went up on every one, including the last.'},
    {q: 'What happens?', code: 'answer = input("Quit? ")\nif answer == "yes":\n    break', opts: ['The program stops', 'Nothing special', "SyntaxError: 'break' outside loop"], a: 2, why: '<code>break</code> only works inside a loop. Python won’t run this at all.'},
    {q: 'Which values can random.randint(1, 6) return?', code: '', opts: ['0 to 5', '1 to 5', '1 to 6', '0 to 6'], a: 2, why: 'Unlike <code>range</code>, <code>randint</code> includes <em>both</em> ends.'},
    {q: 'Which AP pseudocode keeps asking until the age is from 0 to 120?', code: '', opts: ['REPEAT UNTIL (age < 0 OR age > 120)', 'REPEAT UNTIL (age ≥ 0 AND age ≤ 120)', 'REPEAT 120 TIMES', 'REPEAT UNTIL (age = 120)'], a: 1, why: 'The UNTIL condition is the “good answer” test: stop once the age is in range.'}
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
