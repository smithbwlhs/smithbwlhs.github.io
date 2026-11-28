const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const B = v => `<span class="${v ? 'tv' : 'fv'}">${v ? 'True' : 'False'}</span>`;
const PY = v => v ? 'True' : 'False';
const pyStr = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const toInt = s => /^\s*[+-]?\d+\s*$/.test(s) ? parseInt(s, 10) : null;
const valueErr = s => `ValueError: invalid literal for int() with base 10: ${pyStr(s)}`;
function chipRow(box, items, label, onPick) {
  items.forEach(it => { const b = document.createElement('button'); b.textContent = label(it); b.onclick = () => onPick(it); box.appendChild(b); });
}

/* hero: if raining / else */
(() => {
  const sw = $('heroSwitch'), v = $('heroVar'), code = $('heroCode');
  let on = true;
  function show() {
    sw.setAttribute('aria-checked', on);
    v.textContent = 'raining = ' + PY(on);
    code.innerHTML = `<span>if raining:</span>\n<span class="${on ? 'on' : 'off'}">    print("Bring an umbrella.")</span>\n<span>else:</span>\n<span class="${on ? 'off' : 'on'}">    print("Wear sunglasses.")</span>`;
  }
  sw.addEventListener('click', () => { on = !on; show(); });
  show();
})();

/* flow labs: run a tiny program on one input and show which lines ran */
function flow(root, cfg) {
  root.innerHTML = `<div class="chips"></div>
    <div class="prompt"><span>${esc(cfg.prompt)}</span><input type="text" autocomplete="off" spellcheck="false" aria-label="What the user types"></div>
    <div class="${cfg.programs.length > 1 ? 'duo' : ''}">${cfg.programs.map(p => `<div>${p.title ? `<h4>${esc(p.title)}</h4>` : ''}<div class="src"></div><pre class="console" style="margin-top:10px" aria-live="polite"></pre></div>`).join('')}</div>
    <p class="flowkey"><b></b>highlighted lines ran · faded lines were skipped</p>
    <div class="explain"></div>`;
  const inp = root.querySelector('input'), why = root.querySelector('.explain');
  const srcs = root.querySelectorAll('.src'), outs = root.querySelectorAll('.console');
  chipRow(root.querySelector('.chips'), cfg.chips, x => x, x => { inp.value = x; run(); });
  function run() {
    const raw = inp.value;
    const results = cfg.programs.map((p, k) => {
      const r = p.run(raw);
      srcs[k].innerHTML = p.lines.map((l, i) => {
        const st = r.ran.includes(i) ? 'ran' : 'skip';
        const c = i in r.cond ? `<span class="cond ${r.cond[i] ? 't' : 'f'}">→ ${PY(r.cond[i])}</span>` : '';
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

/* 01 Negative Numbers, both versions */
flow($('flowNeg'), {
  prompt: 'Number: ', init: '-5', chips: ['-5', '7', '0', '-1', 'ten'],
  programs: [
    {title: 'Version 1: if', lines: ['number = int(input("Number: "))', 'if number < 0 :', '    print("Number is negative.")'],
     run: s => { const n = toInt(s); if (n === null) return {ran: [0], cond: {}, out: [], err: valueErr(s)};
       const c = n < 0; return {ran: c ? [0, 1, 2] : [0, 1], cond: {1: c}, out: c ? ['Number is negative.'] : []}; }},
    {title: 'Version 2: stored Boolean', lines: ['number = int(input("Number: "))', 'negative = number < 0', 'print("Number is negative: " + str(negative))'],
     run: s => { const n = toInt(s); if (n === null) return {ran: [0], cond: {}, out: [], err: valueErr(s)};
       return {ran: [0, 1, 2], cond: {}, out: ['Number is negative: ' + PY(n < 0)]}; }}
  ],
  explain: s => { const n = toInt(s); if (n === null) return '<code>int()</code> can’t turn that into a whole number, so both programs crash on line 1.';
    const c = n < 0;
    return `<code>${n} &lt; 0</code> is ${B(c)}. ` + (c ? 'Version 1 runs its indented line. Version 2 prints the Boolean.' : 'Version 1 <strong>skips</strong> line 3 and prints nothing. Version 2 still prints, because its print isn’t inside an <code>if</code>.') +
      (n === 0 ? ' Zero is the boundary: it isn’t negative.' : ''); }
});

/* 03 Even and Odd */
flow($('flowEven'), {
  prompt: 'Number: ', init: '7', chips: ['7', '10', '0', '-3', '2.5'],
  programs: [{lines: ['num = int(input("Number: "))', 'if num % 2 == 0:', '    print("Number is even.")', 'else:', '    print("Number is odd.")'],
    run: s => { const n = toInt(s); if (n === null) return {ran: [0], cond: {}, out: [], err: valueErr(s)};
      const c = ((n % 2) + 2) % 2 === 0; return {ran: c ? [0, 1, 2] : [0, 1, 3, 4], cond: {1: c}, out: [c ? 'Number is even.' : 'Number is odd.']}; }}],
  explain: s => { const n = toInt(s); if (n === null) return '<code>int()</code> only accepts whole numbers, so the program crashes on line 1.';
    const r = ((n % 2) + 2) % 2;
    return `<code>${n} % 2</code> is <code>${r}</code>, so <code>num % 2 == 0</code> is ${B(r === 0)}. ` + (r === 0 ? 'The <code>if</code> body runs and the <code>else</code> body is skipped.' : 'The <code>if</code> body is skipped and the <code>else</code> body runs.') + ' One of the two always runs; never both, never neither.'; }
});

/* 04 Great Names */
flow($('flowName'), {
  prompt: 'Enter name: ', init: 'Alice', chips: ['Jeremy', 'Alice', 'Zoe', 'jeremy', 'Jeremiah', 'Jer'],
  programs: [{lines: ['name = input("Enter name: ")', 'if name <= "Jeremy":', '    print("Great name.")'],
    run: s => { const c = s <= 'Jeremy'; return {ran: c ? [0, 1, 2] : [0, 1], cond: {1: c}, out: c ? ['Great name.'] : []}; }}],
  explain: s => {
    const c = s <= 'Jeremy', t = 'Jeremy';
    if (s === t) return `<code>${esc(pyStr(s))} &lt;= 'Jeremy'</code> is ${B(true)}: the strings are equal, and <code>&lt;=</code> includes equal.`;
    let i = 0; while (i < s.length && i < t.length && s[i] === t[i]) i++;
    let reason;
    if (i === s.length) reason = `every letter matches the start of <code>'Jeremy'</code>, and a shorter string comes first`;
    else if (i === t.length) reason = `it starts with all of <code>'Jeremy'</code> and keeps going, so it comes after`;
    else reason = `the first difference is <code>'${esc(s[i])}'</code> vs. <code>'${esc(t[i])}'</code>, and <code>'${esc(s[i])}'</code> comes ${s[i] < t[i] ? 'before' : 'after'}` + (/[a-z]/.test(s[i]) && /[A-Z]/.test(t[i]) ? ' (every lowercase letter comes after every capital)' : '');
    return `<code>${esc(pyStr(s))} &lt;= 'Jeremy'</code> is ${B(c)}: ${reason}. ` + (c ? 'So it prints “Great name.” even though the name isn’t Jeremy.' : 'So nothing prints.');
  }
});

/* 05 two ifs vs if/else */
flow($('flowBadge'), {
  prompt: 'Score: ', init: '600', chips: ['50', '100', '499', '500', '600'],
  programs: [
    {title: 'Two separate ifs', lines: ['score = int(input("Score: "))', 'if score >= 100:', '    print("Bronze badge!")', 'if score >= 500:', '    print("Silver badge!")'],
     run: s => { const n = toInt(s); if (n === null) return {ran: [0], cond: {}, out: [], err: valueErr(s)};
       const a = n >= 100, b = n >= 500, ran = [0, 1], out = [];
       if (a) { ran.push(2); out.push('Bronze badge!'); } ran.push(3); if (b) { ran.push(4); out.push('Silver badge!'); }
       return {ran, cond: {1: a, 3: b}, out}; }},
    {title: 'One if / else', lines: ['score = int(input("Score: "))', 'if score >= 500:', '    print("Silver badge!")', 'else:', '    print("Bronze badge!")'],
     run: s => { const n = toInt(s); if (n === null) return {ran: [0], cond: {}, out: [], err: valueErr(s)};
       const c = n >= 500; return {ran: c ? [0, 1, 2] : [0, 1, 3, 4], cond: {1: c}, out: [c ? 'Silver badge!' : 'Bronze badge!']}; }}
  ],
  explain: s => { const n = toInt(s); if (n === null) return 'Type a whole number.';
    const k = (n >= 100) + (n >= 500);
    return `On the left, Python checks <strong>both</strong> conditions, so ${k === 0 ? 'neither body runs and nothing prints' : k === 1 ? 'one body runs' : 'both bodies run and two lines print'}. On the right, exactly one body runs, so there’s always exactly one line` + (n < 100 ? ', even though a score this low hasn’t earned a badge. That’s a bug if “no badge” was possible.' : '.'); }
});

/* 02 error decoder */
(() => {
  const AGE = 'age = int(input("Age? "))';
  const E = [
    {label: 'missing colon', lines: [AGE, 'if age >= 13', '    print("Teen.")'], bad: 1, msg: "SyntaxError: expected ':'",
     why: 'Every <code>if</code> line ends with a colon. It tells Python “the condition is over, the body comes next.”'},
    {label: 'body not indented', lines: [AGE, 'if age >= 13:', 'print("Teen.")'], bad: 2, msg: "IndentationError: expected an indented block after 'if' statement on line 2",
     why: 'Python knows a line belongs to the <code>if</code> only because it’s indented. An <code>if</code> with nothing indented under it has no body.'},
    {label: '= instead of ==', lines: [AGE, 'if age = 13:', '    print("Exactly 13!")'], bad: 1, msg: "SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?",
     why: 'One <code>=</code> stores a value. A condition has to <em>ask</em>, so use <code>==</code>. Python’s message even suggests it.'},
    {label: 'capital If', lines: [AGE, 'If age >= 13:', '    print("Teen.")'], bad: 1, msg: 'SyntaxError: invalid syntax',
     why: 'Python keywords are lowercase: <code>if</code>, <code>else</code>. <code>IF</code> in capitals is AP pseudocode.'},
    {label: 'else with a condition', lines: [AGE, 'if age >= 13:', '    print("Teen.")', 'else age < 13:', '    print("Not a teen.")'], bad: 3, msg: "SyntaxError: expected ':'",
     why: '<code>else</code> never takes a condition. It already means “every case the <code>if</code> didn’t catch.” Write just <code>else:</code>. (Checking another condition is what <code>elif</code> does in lesson 4.5.)'},
    {label: 'unexpected indent', lines: [AGE, '    if age >= 13:', '        print("Teen.")'], bad: 1, msg: 'IndentationError: unexpected indent',
     why: 'Only lines inside a block are indented. The <code>if</code> line itself starts at the same level as the code around it.'},
    {label: 'tabs and spaces mixed', lines: [AGE, 'if age >= 13:', '⇥   print("Teen.")', '    print("Welcome!")'], bad: 3, msg: 'TabError: inconsistent use of tabs and spaces in indentation',
     why: 'Line 3 is indented with a Tab (shown as ⇥) and line 4 with four spaces. They look the same on screen, but Python sees different characters. Re-indent the block one way.'},
    {label: 'no error, wrong output', lines: [AGE, 'if age >= 13:', '    print("Teen.")', 'print("Welcome to the teen club!")'], bad: 3, msg: '(no error message, which makes this one sneaky)',
     why: 'Line 4 isn’t indented, so it isn’t part of the <code>if</code>. It runs for everyone, even an 8-year-old. Indentation decides what’s inside the block.'}
  ];
  const src = $('errSrc'), msg = $('errMsg'), why = $('errWhy');
  function show(e) {
    src.innerHTML = e.lines.map((l, i) => `<div class="${i === e.bad ? 'ran' : ''}"><b>${i + 1}</b>${i === e.bad ? `<span class="bad">${esc(l)}</span>` : esc(l)}</div>`).join('');
    msg.textContent = e.msg; msg.style.color = e.msg.startsWith('(') ? 'var(--muted)' : '';
    why.innerHTML = e.why + (e.msg.startsWith('(') ? '' : ' <span class="mini">(The exact wording varies a little between Python versions.)</span>');
  }
  chipRow($('errChips'), E, e => e.label, show);
  show(E[0]);
})();

/* 06 AP trace */
(() => {
  const vars = {sunny: true, warm: false, weekend: true};
  const L = ['IF (NOT (sunny AND warm))', '{', '   DISPLAY("Bring a jacket.")', '}', 'ELSE', '{', '   IF (weekend)', '   {', '      DISPLAY("Beach day!")', '   }', '   ELSE', '   {', '      DISPLAY("Lunch outside.")', '   }', '}'];
  const togs = $('apTogs'), src = $('apSrc'), out = $('apOut'), why = $('apWhy');
  const btns = Object.keys(vars).map(k => { const b = document.createElement('button'); b.className = 'tog'; b.onclick = () => { vars[k] = !vars[k]; render(); }; togs.appendChild(b); return [k, b]; });
  const ap = v => v ? 'true' : 'false';
  function render() {
    btns.forEach(([k, b]) => { b.setAttribute('aria-pressed', vars[k]); b.textContent = `${k} ← ${ap(vars[k])}`; });
    const c1 = !(vars.sunny && vars.warm), cond = {0: c1}, ran = [0];
    let text;
    if (c1) { ran.push(2); text = 'Bring a jacket.'; }
    else { ran.push(6); cond[6] = vars.weekend; if (vars.weekend) { ran.push(8); text = 'Beach day!'; } else { ran.push(12); text = 'Lunch outside.'; } }
    const neutral = l => /^\s*[{}]\s*$/.test(l) || /^\s*ELSE\s*$/.test(l);
    src.innerHTML = L.map((l, i) => `<div class="${ran.includes(i) ? 'ran' : neutral(l) ? '' : 'skip'}"><b>${i + 1}</b>${esc(l)}${i in cond ? `<span class="cond ${cond[i] ? 't' : 'f'}">→ ${ap(cond[i])}</span>` : ''}</div>`).join('');
    out.textContent = text;
    why.innerHTML = `<code>sunny AND warm</code> is ${ap(vars.sunny && vars.warm)}, so <code>NOT (sunny AND warm)</code> is <strong>${ap(c1)}</strong>. ` +
      (c1 ? 'The outer IF’s block runs, and the whole ELSE block (including the inner IF) is skipped.' : `The outer ELSE runs. Inside it, <code>weekend</code> is <strong>${ap(vars.weekend)}</strong>, so the inner ${vars.weekend ? 'IF' : 'ELSE'} block runs.`);
  }
  render();
})();

/* 08 quiz */
(() => {
  const Q = [
    {q: 'What does this print?', code: 'x = 5\nif x > 3:\n    print("big")\nprint("done")', opts: ['big', 'done', 'big\ndone', 'Nothing'], a: 2,
     why: '<code>5 &gt; 3</code> is <code>True</code>, so the body prints <code>big</code>. <code>print("done")</code> isn’t indented, so it runs no matter what.'},
    {q: 'Same program, but x is 2. What does it print?', code: 'x = 2\nif x > 3:\n    print("big")\nprint("done")', opts: ['big', 'done', 'big\ndone', 'Nothing'], a: 1,
     why: '<code>2 &gt; 3</code> is <code>False</code>, so the body is skipped. The unindented line still runs.'},
    {q: 'What does this print?', code: 'n = 7\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")', opts: ['even', 'odd', 'even\nodd', 'Nothing'], a: 1,
     why: '<code>7 % 2</code> is <code>1</code>, so the condition is <code>False</code> and the <code>else</code> body runs. Exactly one branch runs.'},
    {q: 'What does this print?', code: 'score = 600\nif score >= 100:\n    print("Bronze")\nif score >= 500:\n    print("Silver")', opts: ['Bronze', 'Silver', 'Bronze\nSilver', 'Nothing'], a: 2,
     why: 'These are two separate <code>if</code> statements. Python checks both, and both are <code>True</code>.'},
    {q: 'What does this print?', code: 'name = "Zoe"\nif name <= "Jeremy":\n    print("Great name.")', opts: ['Great name.', 'Nothing', 'Error'], a: 1,
     why: '<code>"Z"</code> comes after <code>"J"</code>, so <code>"Zoe" &lt;= "Jeremy"</code> is <code>False</code> and the body is skipped.'},
    {q: 'What happens when this runs?', code: 'age = 15\nif age >= 13\n    print("teen")', opts: ['It prints teen', 'It prints nothing', 'SyntaxError'], a: 2,
     why: 'The <code>if</code> line is missing its colon. Python won’t run any of the program until that’s fixed.'},
    {q: 'Which program prints nothing?', code: '', opts: ['if True:\n    print("hi")', 'if 3 > 2:\n    print("hi")', 'if not True:\n    print("hi")', 'if False:\n    print("hi")\nelse:\n    print("bye")'], a: 2,
     why: '<code>not True</code> is <code>False</code>, so the body is skipped and there’s no <code>else</code>. The last option prints <code>bye</code>.'},
    {q: 'What does this AP pseudocode display?', code: 'a ← 3\nIF (a > 3)\n{\n   DISPLAY("yes")\n}\nELSE\n{\n   DISPLAY("no")\n}', opts: ['yes', 'no', 'yes no', 'Nothing'], a: 1,
     why: '<code>3 &gt; 3</code> is false (3 isn’t greater than itself), so the ELSE block runs.'}
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
