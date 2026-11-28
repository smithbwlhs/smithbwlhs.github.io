const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pyVal = v => v === true ? '<span class="ok">True</span>' : v === false ? '<span class="err">False</span>' : esc(v);

/* hero switch */
(() => {
  const b = $('heroSwitch'), c = $('heroCode');
  b.addEventListener('click', () => {
    const on = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', on);
    c.textContent = 'power = ' + (on ? 'True' : 'False');
  });
})();

/* a tiny literal parser shared by the two labs */
function parseLiteral(raw) {
  const s = raw.trim();
  if (s === '') return {kind: 'empty'};
  if (s === 'True' || s === 'False') return {kind: 'bool', value: s === 'True'};
  const q = s.match(/^(["'])(.*)\1$/);
  if (q) return {kind: 'str', value: q[2], quote: q[1]};
  if (/^[+-]?\d+$/.test(s)) return {kind: 'int', value: parseInt(s, 10)};
  if (/^[+-]?(\d+\.\d*|\.\d+)$/.test(s)) return {kind: 'float', value: parseFloat(s)};
  if (/^[A-Za-z_]\w*$/.test(s)) return {kind: 'name', value: s};
  return {kind: 'syntax', value: s};
}
function nameErrorHelp(n) {
  if (n.toLowerCase() === 'true' || n.toLowerCase() === 'false') {
    const fixed = n[0].toUpperCase() + n.slice(1).toLowerCase();
    return `Python has never heard of <code>${esc(n)}</code>, so it assumes you meant a variable that doesn’t exist. The Boolean is spelled <code>${fixed}</code>, with a capital first letter and the rest lowercase.`;
  }
  return `<code>${esc(n)}</code> has no quotes, so Python treats it as a variable name, and no variable has that name yet. Add quotes to make it a string.`;
}

/* type detective */
(() => {
  const ex = ['True', 'False', 'true', '"True"', "'False'", '1', '0', '3.5', 'TRUE'];
  const box = $('typeChips'), inp = $('typeIn'), out = $('typeOut'), why = $('typeWhy');
  ex.forEach(e => { const b = document.createElement('button'); b.textContent = e; b.onclick = () => { inp.value = e; run(); }; box.appendChild(b); });
  function run() {
    const p = parseLiteral(inp.value);
    let o = `<span class="dim">&gt;&gt;&gt; type(${esc(inp.value.trim())})</span>\n`, w = '';
    switch (p.kind) {
      case 'bool': o += "&lt;class 'bool'&gt;"; w = `<span class="${p.value ? 'tv' : 'fv'}">${p.value ? 'True' : 'False'}</span> is one of the two Boolean values.`; break;
      case 'str':
        o += "&lt;class 'str'&gt;";
        w = /^(true|false)$/i.test(p.value) ? `The quotes make this a string that happens to spell a Boolean word. It’s text, not a Boolean.` : `Anything in quotes is a string, whatever is inside.`;
        break;
      case 'int': o += "&lt;class 'int'&gt;"; w = (p.value === 0 || p.value === 1) ? `Some languages use 1 and 0 for true and false, but in Python <code>${p.value}</code> is still a whole number.` : `A whole number with no decimal point is an <code>int</code>.`; break;
      case 'float': o += "&lt;class 'float'&gt;"; w = 'A number with a decimal point is a <code>float</code>.'; break;
      case 'name': o += `<span class="err">NameError: name '${esc(p.value)}' is not defined</span>`; w = nameErrorHelp(p.value); break;
      case 'empty': o += '<span class="err">TypeError: type() takes 1 or 3 arguments</span>'; w = 'Type a value inside the parentheses.'; break;
      default: o += '<span class="err">SyntaxError: invalid syntax</span>'; w = 'This little lab only understands single values like <code>True</code>, <code>"hi"</code>, <code>7</code>, or <code>2.5</code>.';
    }
    out.innerHTML = o; why.innerHTML = w;
  }
  inp.addEventListener('input', run); run();
})();

/* light switch */
(() => {
  let v = false;
  const lamp = $('lamp'), val = $('lampVal'), out = $('lampOut');
  let printed = false;
  function set(nv) {
    v = nv;
    lamp.classList.toggle('on', v); lamp.textContent = v ? 'on' : 'off';
    val.textContent = v ? 'True' : 'False'; val.className = v ? 'tv' : 'fv';
    val.parentElement.classList.remove('changed'); void val.parentElement.offsetWidth; val.parentElement.classList.add('changed');
  }
  $('setT').onclick = () => set(true);
  $('setF').onclick = () => set(false);
  $('doPrint').onclick = () => {
    if (!printed) { out.innerHTML = ''; printed = true; }
    out.innerHTML += (v ? 'True' : 'False') + '\n';
    out.scrollTop = out.scrollHeight;
  };
})();

/* stepper */
(() => {
  const lines = [
    {code: 'is_raining = True', run: s => { s.vars.is_raining = true; }, why: 'Creates <code>is_raining</code> and stores <span class="tv">True</span> in it.'},
    {code: 'print(is_raining)', run: s => { s.out.push(s.vars.is_raining); }, why: 'Prints the current value. Notice there are no quotes in the output: Python shows the Boolean itself.'},
    {code: 'has_umbrella = is_raining', run: s => { s.vars.has_umbrella = s.vars.is_raining; }, why: 'Looks up the value of <code>is_raining</code> (<span class="tv">True</span>) and copies it into a new variable.'},
    {code: 'is_raining = False', run: s => { s.vars.is_raining = false; }, why: 'Replaces the value of <code>is_raining</code>. Check the table: <code>has_umbrella</code> did not change.'},
    {code: 'print(is_raining)', run: s => { s.out.push(s.vars.is_raining); }, why: 'Prints the new value of <code>is_raining</code>.'},
    {code: 'print(has_umbrella)', run: s => { s.out.push(s.vars.has_umbrella); }, why: 'Still <span class="tv">True</span>. Line 3 copied a value; it didn’t connect the two variables.'},
    {code: 'print(type(has_umbrella))', run: s => { s.out.push("<class 'bool'>"); }, why: 'Both variables hold Booleans, so their type is <code>bool</code>. The program is done.'}
  ];
  const src = $('src'), vt = $('traceVars'), out = $('traceOut'), why = $('traceWhy'), step = $('stepBtn');
  let st, pc, last = {};
  function render() {
    src.innerHTML = lines.map((l, i) => `<div class="${i === pc ? 'cur' : i < pc ? 'done' : ''}"><b>${i + 1}</b>${esc(l.code)}</div>`).join('');
    const names = Object.keys(st.vars);
    vt.innerHTML = '<div><span class="h">variable</span><span class="h">value</span></div>' +
      (names.length ? names.map(n => { const v = st.vars[n]; return `<div class="${last[n] !== v ? 'changed' : ''}"><span>${n}</span><span class="${v ? 'tv' : 'fv'}">${v ? 'True' : 'False'}</span></div>`; }).join('')
      : '<div><span style="color:var(--muted)">(none yet)</span><span></span></div>');
    last = Object.assign({}, st.vars);
    out.innerHTML = st.out.length ? st.out.map(pyVal).join('\n') : '<span class="dim"># output</span>';
    step.disabled = pc >= lines.length;
    step.textContent = pc >= lines.length ? 'Finished' : `Run line ${pc + 1}`;
  }
  function reset() { st = {vars: {}, out: []}; pc = 0; last = {}; why.innerHTML = 'Press the button to run line 1. Try to predict the result first.'; render(); }
  step.onclick = () => { if (pc >= lines.length) return; lines[pc].run(st); why.innerHTML = `<strong>Line ${pc + 1}:</strong> ${lines[pc].why}`; pc++; render(); };
  $('resetBtn').onclick = reset;
  reset();
})();

/* bool() trap */
(() => {
  const ex = ['"False"', '""', '"no"', '" "', '0', '1', '-5', '0.0', 'False', 'True'];
  const box = $('boolChips'), inp = $('boolIn'), out = $('boolOut'), why = $('boolWhy');
  ex.forEach(e => { const b = document.createElement('button'); b.textContent = e; b.onclick = () => { inp.value = e; run(); }; box.appendChild(b); });
  function run() {
    const p = parseLiteral(inp.value);
    let r, w = '', err = '';
    switch (p.kind) {
      case 'empty': r = false; w = '<code>bool()</code> with nothing inside is <span class="fv">False</span>.'; break;
      case 'bool': r = p.value; w = 'It’s already a Boolean, so nothing changes.'; break;
      case 'str':
        r = p.value.length > 0;
        if (!r) w = 'The empty string is the only string that becomes <span class="fv">False</span>.';
        else if (/^false$/i.test(p.value)) w = '<strong>This is the trap.</strong> <code>bool()</code> never reads the word. The string has characters in it, so the result is <span class="tv">True</span>.';
        else if (p.value.trim() === '') w = 'A space is still a character, so this string isn’t empty.';
        else w = `This string has ${p.value.length} character${p.value.length === 1 ? '' : 's'}, so it isn’t empty, and that’s all <code>bool()</code> checks.`;
        break;
      case 'int': case 'float': r = p.value !== 0; w = r ? 'Any number other than zero becomes <span class="tv">True</span>, even negative numbers.' : 'Zero is the only number that becomes <span class="fv">False</span>.'; break;
      case 'name': err = `NameError: name '${esc(p.value)}' is not defined`; w = nameErrorHelp(p.value); break;
      default: err = 'SyntaxError: invalid syntax'; w = 'Try a single value such as <code>"yes"</code>, <code>0</code>, or <code>True</code>.';
    }
    out.innerHTML = `<span class="dim">&gt;&gt;&gt; bool(${esc(inp.value.trim())})</span>\n` + (err ? `<span class="err">${err}</span>` : pyVal(r));
    why.innerHTML = w;
  }
  inp.addEventListener('input', run); run();
})();

/* quiz */
(() => {
  const Q = [
    {q: 'What does this print?', code: 'print(type(False))', opts: ["<class 'bool'>", "<class 'str'>", 'False', 'NameError'], a: 0,
     why: '<code>False</code> with a capital F and no quotes is a Boolean, so its type is <code>bool</code>.'},
    {q: 'What does this print?', code: 'answer = "True"\nprint(type(answer))', opts: ["<class 'bool'>", "<class 'str'>", 'True', 'Nothing'], a: 1,
     why: 'The quotes make it a string. It spells a Boolean word, but Python sees four letters of text.'},
    {q: 'What happens when this runs?', code: 'is_cold = true\nprint(is_cold)', opts: ['It prints True', 'It prints true', 'NameError', 'It prints nothing'], a: 2,
     why: 'Lowercase <code>true</code> isn’t a Python value, so Python looks for a variable named <code>true</code> and can’t find one.'},
    {q: 'What does this print?', code: 'print(bool("False"))', opts: ['False', 'True', 'Error', '"False"'], a: 1,
     why: '<code>bool()</code> only checks whether the string is empty. <code>"False"</code> has five characters, so the result is <code>True</code>.'},
    {q: 'What happens when this runs?', code: 'has_pet = False\nprint("Has a pet: " + has_pet)', opts: ['It prints Has a pet: False', 'It prints Has a pet: has_pet', 'TypeError', 'NameError'], a: 2,
     why: '<code>+</code> can only join a string to a string, and <code>has_pet</code> is a Boolean. Wrap it in <code>str()</code>, or use a comma instead of <code>+</code>.'},
    {q: 'What does this print?', code: 'a = True\nb = a\na = False\nprint(b)', opts: ['True', 'False', 'a', 'Error'], a: 0,
     why: '<code>b = a</code> copies the value <code>True</code> into <code>b</code>. Changing <code>a</code> afterwards doesn’t affect <code>b</code>.'},
    {q: 'Which line is a correct Boolean assignment in AP exam pseudocode?', code: '', opts: ['done = False', 'done ← false', 'done ← "false"', 'DISPLAY(false)'], a: 1,
     why: 'AP pseudocode uses the arrow <code>←</code> for assignment and lowercase <code>true</code>/<code>false</code>. Quotes would make it a string.'},
    {q: 'How many different values can a Boolean variable hold?', code: '', opts: ['1', '2', '10', 'As many as you want'], a: 1,
     why: 'Exactly two: <code>True</code> and <code>False</code>. That limit is what makes Booleans perfect for yes-or-no decisions.'}
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
