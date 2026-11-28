const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escC = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const B = v => `<span class="${v ? 'tv' : 'fv'}">${v ? 'True' : 'False'}</span>`;
const pyStr = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const ENDINGS = ['', 'The Secret Exit', 'A Very Long Night', 'The Ghost’s Blessing', 'Overdue for Eternity', 'Lights Out, Ghost'];

/* ---------- the program, line by line, tagged with the build step that adds it ---------- */
const CODE = [];
const add = (min, max, t, req = []) => CODE.push({min, max, t, req});
add(1, 9, '# Choose-Your-Path Mini Adventure');
add(1, 9, '# Partner 1 (name): Ada', ['names']);
add(1, 9, '# Partner 2 (name): Grace', ['names']);
add(1, 9, '# Story title: The Haunted Library', ['intro']);
add(1, 9, '');
add(1, 9, '# ---------- INTRO ----------');
add(1, 9, 'print("=== The Haunted Library ===")', ['intro']);
add(1, 9, 'print("You fell asleep in the reading room. Now the lights are out,")', ['intro']);
add(1, 9, 'print("the doors are locked, and something is reshelving books by itself...")', ['intro']);
add(1, 9, 'print()');
add(2, 9, '');
add(2, 9, '# ---------- DECISION 1 ----------');
add(2, 9, 'flashlight_answer = input("There\'s a flashlight on the desk. Grab it? (yes/no): ")', ['input']);
add(2, 9, 'has_flashlight = flashlight_answer == "yes"', ['bool', 'cmp']);
add(3, 9, '');
add(3, 9, '# ---------- DECISION 2: a NUMBER ----------');
add(3, 9, 'courage = int(input("On a scale of 1-10, how brave are you feeling? "))', ['input']);
add(3, 9, 'is_brave = courage >= 7', ['bool', 'cmp']);
add(4, 9, '');
add(4, 9, '# ---------- DECISION 3 ----------');
add(4, 9, 'door = input("Two doors: do you go left or right? (left/right): ")', ['input']);
add(4, 9, 'went_left = door == "left"', ['bool', 'cmp']);
add(4, 9, 'print()');
add(5, 9, '');
add(5, 9, '# ---------- THE STORY BRANCHES ----------');
add(5, 9, 'if went_left:', ['ifelse']);
add(5, 5, '    print("(left path: endings 1 and 2 go here)")');
add(6, 9, '    print("The left door creaks open onto a dark spiral staircase.")');
add(6, 9, '    if has_flashlight and is_brave:', ['and', 'ifelse']);
add(6, 9, '        # ENDING 1', ['ending']);
add(6, 9, '        print("Your flashlight sweeps the walls and finds a hidden lever.")');
add(6, 9, '        print("ENDING 1: The Secret Exit")');
add(6, 9, '    else:', ['ifelse']);
add(6, 9, '        # ENDING 2', ['ending']);
add(6, 9, '        print("You feel your way down the stairs, one shaky step at a time.")');
add(6, 9, '        print("ENDING 2: A Very Long Night")');
add(5, 9, 'else:', ['ifelse']);
add(5, 6, '    print("(right path: endings 3, 4, and 5 go here)")');
add(7, 9, '    print("The right door opens into the archives. A ghostly librarian floats up.")');
add(7, 9, '    books = int(input("The ghost asks: how many books did you return late? "))', ['input']);
add(7, 9, '    if books == 0 or is_brave:', ['or', 'cmp', 'ifelse']);
add(7, 9, '        # ENDING 3', ['ending']);
add(7, 9, '        print("The ghost smiles and points you to the front door.")');
add(7, 9, '        print("ENDING 3: The Ghost\'s Blessing")');
add(7, 9, '    else:', ['ifelse']);
add(7, 9, '        if books > 5 and not has_flashlight:', ['not', 'and', 'cmp', 'ifelse']);
add(7, 9, '            # ENDING 4', ['ending']);
add(7, 9, '            print("The ghost moans: so many overdue books, and no light to read them by!")');
add(7, 9, '            print("ENDING 4: Overdue for Eternity")');
add(7, 9, '        else:', ['ifelse']);
add(7, 9, '            # ENDING 5', ['ending']);
add(7, 9, '            print("You stammer an apology. The ghost sighs and blows out every candle.")');
add(7, 9, '            print("ENDING 5: Lights Out, Ghost")');

function hl(line) {
  let s = escC(line), out = '';
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#.*$|\b(?:if|else|and|or|not)\b|\b(?:print|input|int)\b(?=\())/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    out += s.slice(last, m.index);
    const t = m[0];
    out += t[0] === '"' || t[0] === "'" ? `<span class="st">${t}</span>` : t[0] === '#' ? `<span class="cm">${t}</span>` : /^(if|else|and|or|not)$/.test(t) ? `<span class="kw">${t}</span>` : `<span class="fn">${t}</span>`;
    last = m.index + t.length;
  }
  return out + s.slice(last);
}
function codeView(el, level, cls = () => '') {
  const lines = CODE.filter(l => l.min <= level && level <= l.max);
  el.innerHTML = lines.map((l, i) => `<div class="${cls(l)}"><b>${i + 1}</b>${hl(l.t) || ' '}</div>`).join('');
  return lines;
}

/* ---------- a simulator that runs the program on a list of answers ---------- */
const P = {
  p1: "There's a flashlight on the desk. Grab it? (yes/no): ",
  p2: 'On a scale of 1-10, how brave are you feeling? ',
  p3: 'Two doors: do you go left or right? (left/right): ',
  p4: 'The ghost asks: how many books did you return late? '
};
function story(inputs, level = 7, mut = {}) {
  const ev = [], path = ['start'], vars = {};
  let k = 0, ending = null;
  const say = t => ev.push({o: t});
  const ask = p => { if (k >= inputs.length) throw {need: p}; const v = inputs[k++]; ev.push({p, v}); return v; };
  const toInt = v => { if (!/^\s*[+-]?\d+\s*$/.test(v)) throw {err: `ValueError: invalid literal for int() with base 10: ${pyStr(v)}`}; return parseInt(v, 10); };
  const fin = extra => Object.assign({ev, path, vars, ending}, extra);
  try {
    say('=== The Haunted Library ===');
    say('You fell asleep in the reading room. Now the lights are out,');
    say('the doors are locked, and something is reshelving books by itself...');
    say('');
    if (level < 2) return fin({done: true});
    const fa = ask(P.p1); vars.flashlight_answer = fa;
    const hasF = fa === (mut.Yes ? 'Yes' : 'yes'); vars.has_flashlight = hasF; path.push('in1');
    if (level < 3) return fin({done: true});
    const craw = ask(P.p2);
    if (mut.noInt) { vars.courage = craw; throw {err: "TypeError: '>=' not supported between instances of 'str' and 'int'"}; }
    const c = toInt(craw); vars.courage = c;
    const brave = mut.gt ? c > 7 : c >= 7; vars.is_brave = brave; path.push('in2');
    if (level < 4) return fin({done: true});
    const door = ask(P.p3); vars.door = door;
    const left = door === 'left'; vars.went_left = left; path.push('in3');
    say('');
    if (level < 5) return fin({done: true});
    path.push('d1');
    if (left) {
      if (level === 5) { say('(left path: endings 1 and 2 go here)'); return fin({done: true}); }
      say('The left door creaks open onto a dark spiral staircase.');
      path.push('dL');
      if (hasF && brave) { say('Your flashlight sweeps the walls and finds a hidden lever.'); say('ENDING 1: The Secret Exit'); ending = 1; }
      else { say('You feel your way down the stairs, one shaky step at a time.'); say('ENDING 2: A Very Long Night'); ending = 2; }
    } else {
      if (level < 7) { say('(right path: endings 3, 4, and 5 go here)'); return fin({done: true}); }
      say('The right door opens into the archives. A ghostly librarian floats up.');
      const b = toInt(ask(P.p4)); vars.books = b; path.push('inB', 'd3');
      const e3 = mut.and ? (b === 0 && brave) : (b === 0 || brave);
      if (e3) { say('The ghost smiles and points you to the front door.'); say("ENDING 3: The Ghost's Blessing"); ending = 3; }
      else {
        path.push('d4');
        const e4 = (mut.gte ? b >= 5 : b > 5) && (mut.noNot ? hasF : !hasF);
        if (e4) { say('The ghost moans: so many overdue books, and no light to read them by!'); say('ENDING 4: Overdue for Eternity'); ending = 4; }
        else { say('You stammer an apology. The ghost sighs and blows out every candle.'); say('ENDING 5: Lights Out, Ghost'); ending = 5; }
      }
    }
    path.push('E' + ending);
    return fin({done: true});
  } catch (x) {
    if (x.need) return fin({need: x.need});
    if (x.err) return fin({err: x.err});
    throw x;
  }
}

/* ---------- story map ---------- */
const NODES = {
  start: {x: 380, y: 28, w: 260, t: 'START: locked in the library', k: 'start'},
  in1: {x: 380, y: 84, w: 280, t: 'Grab flashlight? → has_flashlight', k: 'in'},
  in2: {x: 380, y: 140, w: 280, t: 'Brave 1–10? → is_brave', k: 'in'},
  in3: {x: 380, y: 196, w: 280, t: 'Left or right? → went_left', k: 'in'},
  d1: {x: 380, y: 262, w: 170, t: 'went_left?', k: 'dec'},
  dL: {x: 190, y: 352, w: 250, t: 'has_flashlight and is_brave?', k: 'dec'},
  E1: {x: 100, y: 452, w: 170, h: 46, t: 'ENDING 1\nThe Secret Exit', k: 'end'},
  E2: {x: 285, y: 452, w: 170, h: 46, t: 'ENDING 2\nA Very Long Night', k: 'end'},
  inB: {x: 560, y: 340, w: 260, t: 'Ghost: books late? → books', k: 'in'},
  d3: {x: 560, y: 414, w: 220, t: 'books == 0 or is_brave?', k: 'dec'},
  E3: {x: 440, y: 512, w: 180, h: 46, t: 'ENDING 3\nThe Ghost’s Blessing', k: 'end'},
  d4: {x: 660, y: 512, w: 250, t: 'books > 5 and not has_flashlight?', k: 'dec'},
  E4: {x: 568, y: 612, w: 176, h: 46, t: 'ENDING 4\nOverdue for Eternity', k: 'end'},
  E5: {x: 738, y: 612, w: 150, h: 46, t: 'ENDING 5\nLights Out, Ghost', k: 'end'}
};
const EDGES = [['start', 'in1'], ['in1', 'in2'], ['in2', 'in3'], ['in3', 'd1'], ['d1', 'dL', 'True'], ['d1', 'inB', 'False'], ['dL', 'E1', 'True'], ['dL', 'E2', 'False'], ['inB', 'd3'], ['d3', 'E3', 'True'], ['d3', 'd4', 'False'], ['d4', 'E4', 'True'], ['d4', 'E5', 'False']];
function buildMap(svg, idp) {
  svg.setAttribute('viewBox', '0 0 820 650');
  const H = n => n.h || 36;
  let s = `<defs><marker id="${idp}a" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker><marker id="${idp}h" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path class="arrow hot" d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
  EDGES.forEach(([a, b, lab]) => {
    const A = NODES[a], Bn = NODES[b], x1 = A.x, y1 = A.y + H(A) / 2, x2 = Bn.x, y2 = Bn.y - H(Bn) / 2 - 2, my = (y1 + y2) / 2;
    s += `<path class="edge" data-e="${a}-${b}" marker-end="url(#${idp}a)" d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}"/>`;
    if (lab) { const lx = (x1 + x2) / 2, ly = my; s += `<g class="elbl" data-e="${a}-${b}"><rect x="${lx - 22}" y="${ly - 9}" width="44" height="18" rx="4"/><text x="${lx}" y="${ly}">${lab}</text></g>`; }
  });
  Object.entries(NODES).forEach(([id, n]) => {
    const h = H(n), x0 = n.x - n.w / 2, y0 = n.y - h / 2;
    let shape;
    if (n.k === 'in') shape = `<polygon class="nd" points="${x0 + 12},${y0} ${x0 + n.w},${y0} ${x0 + n.w - 12},${y0 + h} ${x0},${y0 + h}"/>`;
    else if (n.k === 'dec') shape = `<polygon class="nd" points="${x0},${n.y} ${x0 + 16},${y0} ${x0 + n.w - 16},${y0} ${x0 + n.w},${n.y} ${x0 + n.w - 16},${y0 + h} ${x0 + 16},${y0 + h}"/>`;
    else shape = `<rect class="nd" x="${x0}" y="${y0}" width="${n.w}" height="${h}" rx="${h / 2}"/>`;
    const parts = n.t.split('\n');
    const txt = parts.length === 1 ? `<text x="${n.x}" y="${n.y}">${esc(parts[0])}</text>` : `<text x="${n.x}" y="${n.y - 8}">${esc(parts[0])}</text><text x="${n.x}" y="${n.y + 9}">${esc(parts[1])}</text>`;
    s += `<g class="node ${n.k}" data-n="${id}">${shape}${txt}</g>`;
  });
  svg.innerHTML = s;
  return path => {
    const on = path && path.length > 1;
    svg.classList.toggle('active', !!on);
    const hotE = new Set(); if (on) for (let i = 1; i < path.length; i++) hotE.add(path[i - 1] + '-' + path[i]);
    svg.querySelectorAll('g.node').forEach(g => g.classList.toggle('hot', !!on && path.includes(g.dataset.n)));
    svg.querySelectorAll('.edge').forEach(e => { const h = hotE.has(e.dataset.e); e.classList.toggle('hot', h); e.setAttribute('marker-end', `url(#${idp}${h ? 'h' : 'a'})`); });
    svg.querySelectorAll('.elbl').forEach(e => e.classList.toggle('hot', hotE.has(e.dataset.e)));
  };
}
buildMap($('mapPlan'), 'mp');

/* ---------- interactive console ---------- */
function konsole(root, cfg) {
  root.innerHTML = `<div class="chips"></div><pre class="console play" aria-live="polite"></pre>
    <div class="playrow"><span></span><input type="text" autocomplete="off" spellcheck="false" aria-label="Your answer"></div>
    <div class="row"><button class="restart">Restart</button></div>`;
  const out = root.querySelector('.console'), row = root.querySelector('.playrow'), lab = row.querySelector('span'), inp = row.querySelector('input');
  let inputs = [];
  const chips = root.querySelector('.chips');
  (cfg.chips || []).forEach(c => { const b = document.createElement('button'); b.textContent = c.join(', '); b.title = 'Fill in these answers'; b.onclick = () => { inputs = c.slice(); render(); }; chips.appendChild(b); });
  if (!(cfg.chips || []).length) chips.style.display = 'none';
  function render() {
    const r = story(inputs, cfg.level, cfg.mut || {});
    let h = r.ev.map(e => e.o !== undefined ? escC(e.o) : `${escC(e.p)}<span class="in">${escC(e.v)}</span>`).join('\n');
    if (r.err) h += `\n<span class="err">${escC(r.err)}</span>`;
    if (r.done) h += r.ending ? `\n\n<span class="end">— you reached Ending ${r.ending} —</span>` : `\n<span class="dim">(program finished)</span>`;
    out.innerHTML = h; out.scrollTop = out.scrollHeight;
    if (r.need) { row.style.display = ''; lab.textContent = r.need; } else row.style.display = 'none';
    if (cfg.onUpdate) cfg.onUpdate(r);
  }
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { inputs.push(inp.value); inp.value = ''; render(); if (row.style.display !== 'none') inp.focus(); } });
  root.querySelector('.restart').onclick = () => { inputs = []; render(); };
  render();
  return {focus: () => inp.focus()};
}

/* ---------- 02 build stepper ---------- */
(() => {
  const STEPS = [
    {t: 'Header and intro', w: 'Start with the parts that can’t break: partner names in comments at the top, then a title and a short intro. Run it to make sure the text looks right. No input yet, so the program just prints and ends.'},
    {t: 'Decision 1: a yes/no question', w: 'Ask the question with <code>input()</code> and save the raw answer. Then store a <strong>comparison</strong> in a Boolean, exactly like 4.3: <code>has_flashlight</code> is <code>True</code> only if they typed exactly <code>yes</code>. The prompt says <code>(yes/no)</code> so the player knows what to type.', chips: [['yes'], ['no'], ['Yes']]},
    {t: 'Decision 2: a number', w: 'The number question needs <code>int(input(...))</code> so you can compare it with <code>&gt;=</code>. The comparison turns a number from 1 to 10 into one Boolean: brave or not. Try typing <code>7</code>, the boundary, and a word like <code>very</code>.', chips: [['yes', '8'], ['yes', '7'], ['no', '6'], ['yes', 'very']]},
    {t: 'Decision 3: the fork in the road', w: 'The third Boolean decides which half of the story runs. That’s three Boolean variables, each storing a comparison, which meets that requirement already.', chips: [['yes', '8', 'left'], ['no', '3', 'right']]},
    {t: 'Skeleton: the first if/else', w: 'Before writing any endings, build the outer <code>if</code>/<code>else</code> with a <strong>placeholder</strong> <code>print</code> in each branch. Run it once going left and once going right. If both placeholders show up at the right time, the structure is correct and you can fill in one branch at a time. This is a good moment to switch drivers.', chips: [['yes', '8', 'left'], ['yes', '8', 'right']]},
    {t: 'The left path: nesting with and', w: 'Replace the left placeholder with a second <code>if</code>/<code>else</code> <em>inside</em> the first one. Each nested level gets one more indent. The condition uses <code>and</code>, so both Booleans must be <code>True</code> for the Secret Exit. Every ending gets a <code># ENDING</code> comment. The right path is still a placeholder, and that’s fine.', chips: [['yes', '8', 'left'], ['no', '8', 'left'], ['yes', '3', 'left']]},
    {t: 'The right path: a question inside a branch, or, and not', w: 'The fourth question is asked <em>only</em> on the right path, so it lives inside the <code>else</code>. The late-book count is compared directly in the conditions instead of being saved to a Boolean first. Ending 3 uses <code>or</code>. Its <code>else</code> holds a third level of nesting with <code>not</code>, which splits the rest into Endings 4 and 5. In lesson 4.5 you’ll learn <code>elif</code>, a shorter way to write this, but nested <code>if</code>/<code>else</code> is all this project needs.', chips: [['yes', '3', 'right', '0'], ['no', '2', 'right', '9'], ['yes', '2', 'right', '9']]}
  ];
  const nav = $('stepNav'), title = $('stepTitle'), why = $('stepWhy'), code = $('stepCode'), run = $('stepRun');
  let cur = 1;
  const btns = STEPS.map((s, i) => { const b = document.createElement('button'); b.textContent = `Step ${i + 1}`; b.setAttribute('role', 'tab'); b.onclick = () => go(i + 1); nav.appendChild(b); return b; });
  function go(n) {
    cur = n; const s = STEPS[n - 1];
    btns.forEach((b, i) => { b.classList.toggle('on', i === n - 1); b.setAttribute('aria-selected', i === n - 1); });
    title.textContent = `Step ${n} of ${STEPS.length}: ${s.t}`;
    why.innerHTML = s.w;
    codeView(code, n, l => (l.min === n ? 'new' : '') + (l.t.includes('go here') ? ' ph' : ''));
    const first = code.querySelector('.new'); if (first) code.scrollTop = Math.max(0, first.offsetTop - 40);
    konsole(run, {level: n, chips: s.chips});
    $('stepPrev').disabled = n === 1;
    $('stepNext').disabled = n === STEPS.length;
    $('stepNext').textContent = n === STEPS.length ? 'Done: play it in 03' : 'Next step →';
  }
  $('stepPrev').onclick = () => go(cur - 1);
  $('stepNext').onclick = () => go(cur + 1);
  go(1);
})();

/* ---------- 03 play + ending tracker ---------- */
(() => {
  const badges = $('badges'), msg = $('foundMsg'), found = new Set();
  for (let i = 1; i <= 5; i++) { const d = document.createElement('div'); d.className = 'badge'; d.textContent = i; d.title = 'Ending ' + i; badges.appendChild(d); }
  const setPath = buildMap($('mapPlay'), 'pp');
  const varsEl = $('playVars');
  const show = v => typeof v === 'boolean' ? B(v) : typeof v === 'number' ? String(v) : esc(pyStr(v));
  konsole($('playRun'), {level: 7, onUpdate: r => {
    setPath(r.path);
    const order = ['flashlight_answer', 'has_flashlight', 'courage', 'is_brave', 'door', 'went_left', 'books'];
    varsEl.innerHTML = '<div><span class="h">variable</span><span class="h">value</span></div>' + order.map(k => `<div><span>${k}</span><span>${k in r.vars ? show(r.vars[k]) : '<span style="color:var(--muted)">not set</span>'}</span></div>`).join('');
    if (r.ending) {
      found.add(r.ending);
      [...badges.children].forEach((b, i) => b.classList.toggle('on', found.has(i + 1)));
      msg.textContent = found.size === 5 ? 'All five found! Every ending is reachable.' : `Ending ${r.ending}: ${ENDINGS[r.ending]}. ${5 - found.size} to go.`;
    }
  }});
})();

/* ---------- 04 / 05 test table ---------- */
const TESTS = [
  {kind: 'Every ending', in: ['yes', '8', 'left'], exp: 1},
  {kind: 'Every ending', in: ['no', '8', 'left'], exp: 2},
  {kind: 'Every ending', in: ['yes', '3', 'right', '0'], exp: 3},
  {kind: 'Every ending', in: ['no', '2', 'right', '9'], exp: 4},
  {kind: 'Every ending', in: ['yes', '2', 'right', '9'], exp: 5},
  {kind: 'Boundary', cmp: 'courage >= 7', in: ['yes', '6', 'left'], exp: 2, note: '6 is not brave'},
  {kind: 'Boundary', cmp: 'courage >= 7', in: ['yes', '7', 'left'], exp: 1, note: '7 is brave: >= includes 7'},
  {kind: 'Boundary', cmp: 'books == 0', in: ['yes', '2', 'right', '0'], exp: 3, note: 'no late books'},
  {kind: 'Boundary', cmp: 'books == 0', in: ['yes', '2', 'right', '1'], exp: 5, note: '1 late book is not 0'},
  {kind: 'Boundary', cmp: 'books > 5', in: ['no', '2', 'right', '5'], exp: 5, note: '5 is not greater than 5'},
  {kind: 'Boundary', cmp: 'books > 5', in: ['no', '2', 'right', '6'], exp: 4, note: '6 is greater than 5'}
];
function runTests(el, mut = {}) {
  let pass = 0, failE = 0, failB = 0;
  const rows = TESTS.map(t => {
    const r = story(t.in, 7, mut);
    const got = r.err ? r.err.split(':')[0] : r.ending ? `Ending ${r.ending}` : 'needs more input';
    const ok = r.ending === t.exp; if (ok) pass++; else if (t.kind === 'Boundary') failB++; else failE++;
    return `<tr class="${ok ? '' : 'diff'}"><td style="font-family:var(--sans)">${t.kind}${t.cmp ? `<br><code>${esc(t.cmp)}</code>` : ''}</td><td>${t.in.join(', ')}</td><td style="font-family:var(--sans)">Ending ${t.exp}${t.note ? `<br><span class="mini">${t.note}</span>` : ''}</td><td style="font-family:var(--sans)">${esc(got)}</td><td class="${ok ? 'pass' : 'fail'}">${ok ? '✓' : '✗'}</td></tr>`;
  });
  el.innerHTML = '<table class="tt"><tr><th>Test</th><th>Inputs (in order)</th><th>Expected</th><th>Program reached</th><th></th></tr>' + rows.join('') + '</table>';
  return {pass, failE, failB};
}
(() => {
  const r = runTests($('testTable'));
  $('testWhy').innerHTML = `<p class="summary">${r.pass} of ${TESTS.length} tests pass.</p>Every ending is reachable, and every inequality behaves correctly right at its cutoff. Your own Test Table should look like this: one row per ending, plus a pair of rows for every <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code>, or <code>==</code> on a number.`;
})();
(() => {
  const M = [
    {k: 'gt', label: '>= became >', old: 'is_brave = courage >= 7', neu: 'is_brave = courage > 7', why: 'Only the boundary test with exactly 7 catches this. The every-ending tests use courage values like 8, 3, and 2, which are nowhere near the cutoff, so they still pass. This is the whole reason boundary tests exist.'},
    {k: 'gte', label: '> became >=', old: '        if books > 5 and not has_flashlight:', neu: '        if books >= 5 and not has_flashlight:', why: 'Again, only a boundary test catches it: with exactly 5 late books, the bug sends the player to Ending 4 instead of 5. The every-ending tests used 9 and 0.'},
    {k: 'and', label: 'or became and', old: '    if books == 0 or is_brave:', neu: '    if books == 0 and is_brave:', why: 'The Ending 3 test catches this right away: with 0 books but courage 3, <code>and</code> needs <em>both</em> to be True, so the Ghost’s Blessing never happens for a nervous player.'},
    {k: 'noNot', label: 'forgot the not', old: '        if books > 5 and not has_flashlight:', neu: '        if books > 5 and has_flashlight:', why: 'Endings 4 and 5 swap whenever the book count is high. The every-ending tests catch it, because they were written to reach each ending on purpose.'},
    {k: 'Yes', label: 'compared to "Yes"', old: 'has_flashlight = flashlight_answer == "yes"', neu: 'has_flashlight = flashlight_answer == "Yes"', why: 'The player types lowercase <code>yes</code>, so <code>has_flashlight</code> is always False and the Secret Exit is unreachable. Match the comparison to exactly what your prompt tells the player to type.'},
    {k: 'noInt', label: 'forgot int()', old: 'courage = int(input("On a scale of 1-10, how brave are you feeling? "))', neu: 'courage = input("On a scale of 1-10, how brave are you feeling? ")', why: 'Every test crashes. <code>input()</code> gives a string, and Python can’t compare a string to a number with <code>&gt;=</code>. (This is the 4.3 input trap.)'}
  ];
  const box = $('muts'), diff = $('mutDiff'), why = $('mutWhy');
  let cur = null;
  const btns = M.map(m => { const b = document.createElement('button'); b.textContent = m.label; b.setAttribute('aria-pressed', 'false'); b.onclick = () => pick(cur === m ? null : m); box.appendChild(b); return b; });
  function pick(m) {
    cur = m;
    btns.forEach((b, i) => b.setAttribute('aria-pressed', M[i] === m));
    if (!m) { diff.innerHTML = '<span class="dim" style="color:#7f8b99"># no bug planted: this is the original exemplar</span>'; const r = runTests($('mutTable')); why.innerHTML = `<p class="summary">${r.pass} of ${TESTS.length} tests pass.</p>Pick a bug above.`; return; }
    diff.innerHTML = `<span class="old">${escC(m.old)}</span>\n<span class="neu">${escC(m.neu)}</span>`;
    const r = runTests($('mutTable'), {[m.k]: true});
    const caught = r.failE && r.failB ? `${r.failE} every-ending test${r.failE > 1 ? 's' : ''} and ${r.failB} boundary test${r.failB > 1 ? 's' : ''}` : r.failE ? `${r.failE} every-ending test${r.failE > 1 ? 's' : ''} only` : `${r.failB} boundary test${r.failB > 1 ? 's' : ''} only`;
    why.innerHTML = `<p class="summary">${TESTS.length - r.pass} of ${TESTS.length} tests fail. Caught by: ${caught}.</p>${m.why}`;
  }
  pick(M[0]);
})();

/* ---------- 06 requirements ---------- */
(() => {
  const R = [
    {k: 'names', t: 'Both partners’ names at the top'},
    {k: 'intro', t: 'A title and a 1–2 line intro'},
    {k: 'input', t: 'At least 3 decisions with input() (4 here), at least 1 with int(input(...)) (2 here)'},
    {k: 'bool', t: 'At least 3 Boolean variables that each store a comparison'},
    {k: 'and', t: 'and used in an if condition'},
    {k: 'or', t: 'or used in an if condition'},
    {k: 'not', t: 'not used in an if condition'},
    {k: 'cmp', t: 'At least 3 different comparison operators: ==, >=, >'},
    {k: 'ifelse', t: 'Endings reached with if and else (nested, no elif)'},
    {k: 'ending', t: 'A # ENDING comment above each of the 5 endings'}
  ];
  const list = $('reqList'), code = $('reqCode');
  let cur = R[0];
  const btns = R.map(r => { const b = document.createElement('button'); b.innerHTML = `<span class="tick">✓</span><span>${esc(r.t)}</span>`; b.onclick = () => { cur = r; draw(); }; list.appendChild(b); return b; });
  function draw() {
    btns.forEach((b, i) => b.setAttribute('aria-pressed', R[i] === cur));
    codeView(code, 7, l => l.req.includes(cur.k) ? 'req' : '');
  }
  draw();
})();

/* ---------- 07 predict the ending ---------- */
(() => {
  const opts = [1, 2, 3, 4, 5].map(n => `Ending ${n}: ${ENDINGS[n]}`);
  const Q = [
    {q: 'The player types: no, 9, left', a: 1, why: '<code>has_flashlight</code> is False, so <code>has_flashlight and is_brave</code> is False even though 9 is brave. The left path’s <code>else</code> runs.'},
    {q: 'The player types: yes, 7, right, 12', a: 2, why: '<code>is_brave</code> is True (7 &gt;= 7), so <code>books == 0 or is_brave</code> is True. 12 late books doesn’t matter: <code>or</code> needs only one True.'},
    {q: 'The player types: no, 4, right, 0', a: 2, why: '<code>books == 0</code> is True, so the <code>or</code> condition is True even though the player isn’t brave.'},
    {q: 'The player types: no, 4, right, 6', a: 3, why: 'Not Ending 3 (6 books, not brave). Then <code>6 &gt; 5</code> is True and <code>not has_flashlight</code> is True, so <code>and</code> gives True.'},
    {q: 'The player types: yes, 4, right, 6', a: 4, why: 'Same as the last one, except they have the flashlight, so <code>not has_flashlight</code> is False. The innermost <code>else</code> runs.'},
    {q: 'The player types: no, 6, right, 5', a: 4, why: 'A boundary case. 6 isn’t brave and 5 isn’t 0, so not Ending 3. Then <code>5 &gt; 5</code> is False, so the <code>and</code> is False and the final <code>else</code> runs.'},
    {q: 'The player types: Yes, 9, left', a: 1, why: 'Capital <code>Yes</code> is not equal to <code>"yes"</code>, so <code>has_flashlight</code> is False. That’s why the prompt says <code>(yes/no)</code> in lowercase.'}
  ].map(x => ({q: x.q, opts, a: x.a, why: x.why}));
  const box = $('quizBox'), sc = $('score');
  let right, tried;
  function build() {
    right = 0; tried = 0; sc.textContent = `Score: 0 / ${Q.length}`;
    box.innerHTML = '';
    Q.forEach((item, qi) => {
      const d = document.createElement('div'); d.className = 'quiz';
      d.innerHTML = `<div class="q">${qi + 1}. ${item.q}</div><div class="opts"></div><div class="fb"></div>`;
      const ob = d.querySelector('.opts'), fb = d.querySelector('.fb');
      item.opts.forEach((o, oi) => {
        const b = document.createElement('button'); b.textContent = o; b.style.fontFamily = 'var(--sans)';
        b.onclick = () => {
          ob.querySelectorAll('button').forEach(x => x.disabled = true);
          ob.children[item.a].classList.add('right');
          if (oi !== item.a) b.classList.add('wrong'); else right++;
          tried++;
          fb.innerHTML = (oi === item.a ? '<strong style="color:var(--true)">Correct.</strong> ' : '<strong style="color:var(--false)">Not quite.</strong> ') + item.why;
          fb.style.display = 'block';
          sc.textContent = `Score: ${right} / ${Q.length}` + (tried === Q.length ? (right === Q.length ? '. Perfect, you can trace nested conditions.' : '. Review the explanations, then reset and try again.') : '');
        };
        ob.appendChild(b);
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
