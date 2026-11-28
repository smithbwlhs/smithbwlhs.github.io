/* ===== Teacher setting: paste your Apps Script web app URL here (it ends in /exec). Leave "" to turn email off. ===== */
const EMAIL_ENDPOINT = "";

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TOPICS = [
 {
  "id": "t41",
  "title": "4.1 Booleans",
  "page": "4-1-booleans.html",
  "ideas": [
   "Only two values: True and False, capitalized, no quotes.",
   "\"True\" in quotes is a string, and lowercase true is a NameError.",
   "bool() of any non-empty string is True, even bool(\"False\")."
  ],
  "practice": [
   "Store False in a variable named is_weekend and print it with the label \"Weekend: \". Expected output: Weekend: False",
   "Predict, then run: print(type(False)), print(type(\"False\")), and print(bool(\"\")). Explain each result."
  ]
 },
 {
  "id": "t42",
  "title": "4.2 Logical Operators",
  "page": "4-2-logical-operators.html",
  "ideas": [
   "not flips, and needs both, or needs at least one.",
   "Order: parentheses, then not, then and, then or.",
   "Use parentheses whenever you mix and with or."
  ],
  "practice": [
   "Set has_ticket = True and is_sold_out = True. Print whether you can get in: you need a ticket and the show must not be sold out.",
   "Fill in a truth table by hand for not (a or b), then check it with the truth table machine on the 4.2 page."
  ]
 },
 {
  "id": "t43",
  "title": "4.3 Comparison Operators",
  "page": "4-3-comparison-operators.html",
  "ideas": [
   "== asks, = stores. The six: ==, !=, >, <, >=, <=.",
   "Convert input() with int() before comparing numbers.",
   "Test the boundary: the value right at the cutoff and one past it."
  ],
  "practice": [
   "Ask for a temperature and print whether it is freezing (32 or below) as True or False. Test 31, 32, and 33.",
   "Ask for two numbers. Print whether they are equal, and whether the first is bigger."
  ]
 },
 {
  "id": "t44",
  "title": "4.4 If Statements",
  "page": "4-4-if-statements.html",
  "ideas": [
   "if condition: then an indented body that runs only when it is True.",
   "else runs when the if is False; exactly one of the two runs.",
   "Every if and else line ends with a colon."
  ],
  "practice": [
   "Ask for a number and print \"Positive\" only if it is greater than 0. Test 5, 0, and -3.",
   "Ask for an age. Print \"Can drive\" if it is 16 or more, otherwise \"Too young\"."
  ]
 },
 {
  "id": "t45",
  "title": "4.5 If, Elif, Else",
  "page": "4-5-if-elif-else.html",
  "ideas": [
   "Checked top to bottom; the first True branch wins and the rest are skipped.",
   "Order matters: put the most specific (often highest) check first.",
   "Use one cutoff per branch so decimals have no gaps."
  ],
  "practice": [
   "Ask for a score from 0 to 100 and print a letter grade A, B, C, D, or F with one if/elif/else chain. Test 89.5, 90, and 60.",
   "Ask for an hour from 0 to 23 and print Morning (before 12), Afternoon (before 17), or Evening."
  ]
 },
 {
  "id": "t46",
  "title": "4.6 Key Events",
  "page": "4-6-key-events.html",
  "ideas": [
   "Setup runs once; the handler runs on every key press.",
   "add_key_down_handler(key_down): pass the name, no parentheses.",
   "event.key is a string like \"ArrowLeft\" (exact capitals). Up is move(0, -5)."
  ],
  "practice": [
   "Change 4.6.3 Keyboard Square so each arrow moves the square 20 pixels instead of 5.",
   "Make a circle that gets 5 pixels bigger with the up arrow and 5 smaller with the down arrow, and never goes below a radius of 5."
  ]
 },
 {
  "id": "t47",
  "title": "4.7 For Loops",
  "page": "4-7-for-loops.html",
  "ideas": [
   "range(n) gives 0 up to n - 1: n passes.",
   "A running total starts before the loop and changes inside it.",
   "Convert input with int() before using it in range()."
  ],
  "practice": [
   "Print the numbers 1 to 10 using range with only one number inside the parentheses.",
   "Ask for n and print the sum of 1 through n. For n = 4 the answer is 10."
  ]
 },
 {
  "id": "t48",
  "title": "4.8 General For Loops",
  "page": "4-8-general-for-loops.html",
  "ideas": [
   "range(start, stop, step): start is included, stop never is.",
   "A negative step counts down; stop must be past the last number you want.",
   "A step of 0 is a ValueError."
  ],
  "practice": [
   "Print 100, 95, 90, ... down to and including 0.",
   "Print the odd numbers from 1 to 19, one per line."
  ]
 },
 {
  "id": "t49",
  "title": "4.9 For Loop Practice",
  "page": "4-9-for-loop-practice.html",
  "ideas": [
   "Sums start at 0; products start at 1.",
   "Use if with % inside a loop to add only some numbers.",
   "Nested loops multiply: outer passes x inner passes."
  ],
  "practice": [
   "Print the product 1 x 2 x 3 x 4 x 5 x 6. The answer is 720.",
   "Use nested loops to print every pair for row 1 to 3 and col 1 to 2, formatted like 1-2."
  ]
 },
 {
  "id": "t410",
  "title": "4.10 While Loops",
  "page": "4-10-while-loops.html",
  "ideas": [
   "while condition: checks before every pass and stops the first time it is False.",
   "Set up, check, change: miss one and you may loop forever.",
   "Use while when you don't know how many passes you need."
  ],
  "practice": [
   "Start with 1 penny and double it each day. Print how many days until you have more than 100,000 pennies.",
   "Start n at 1000 and keep doing n = n // 2 while n is at least 1. Print how many times it ran."
  ]
 },
 {
  "id": "t411",
  "title": "4.11 Loop and a Half",
  "page": "4-11-loop-and-a-half.html",
  "ideas": [
   "while True: ask first, check, and break when done.",
   "break leaves the loop; continue skips to the next pass.",
   "Counters go up on every pass, including the one that breaks."
  ],
  "practice": [
   "Keep asking for test scores until the user types -1, then print the average of the scores (not counting the -1).",
   "Keep asking \"Continue? (yes/no)\" until the user types exactly yes or no, then print their answer."
  ]
 },
 {
  "id": "t412",
  "title": "4.12 Random Numbers",
  "page": "4-12-random-numbers.html",
  "ideas": [
   "import random at the top; random.randint(a, b) includes both a and b.",
   "Pick once and store it before an if chain.",
   "Call randint inside a loop for a new value each pass."
  ],
  "practice": [
   "Roll two dice 10 times and print each total.",
   "Flip a coin (random.randint(0, 1)) until you get heads 3 times in a row. Print how many flips it took."
  ]
 },
 {
  "id": "tap",
  "title": "AP Pseudocode",
  "page": "4-5-if-elif-else.html#ap",
  "ideas": [
   "AP uses IF/ELSE with braces, and no ELSE IF: nest an IF inside ELSE.",
   "REPEAT n TIMES, and REPEAT UNTIL(condition), which stops when the condition becomes true.",
   "RANDOM(a, b) includes both ends; = compares and ← stores."
  ],
  "practice": [
   "Rewrite your letter-grade chain from 4.5 in AP pseudocode using nested IF/ELSE.",
   "Write AP pseudocode that uses INPUT() and REPEAT UNTIL to keep asking until the number entered is positive."
  ]
 }
];
const QUESTIONS = [
  // 4.1
  {t: 't41', q: 'What does this print?', code: 'print(type("True"))', opts: ["<class 'bool'>", "<class 'str'>", 'True', 'NameError'], a: 1, why: 'The quotes make it a string, even though it spells a Boolean word.'},
  {t: 't41', q: 'What happens?', code: 'is_cold = true\nprint(is_cold)', opts: ['It prints True', 'It prints true', 'NameError'], a: 2, why: 'Lowercase <code>true</code> isn’t a Python value, so Python looks for a variable by that name.'},
  {t: 't41', q: 'What does this print?', code: 'print(bool("False"))', opts: ['False', 'True', 'Error'], a: 1, why: '<code>bool()</code> only checks whether the string is empty. <code>"False"</code> has characters, so it’s <code>True</code>.'},
  // 4.2
  {t: 't42', q: 'What does this print?', code: 'print(True and not False)', opts: ['True', 'False'], a: 0, why: '<code>not False</code> is <code>True</code>, and <code>True and True</code> is <code>True</code>.'},
  {t: 't42', q: 'What does this print?', code: 'print(False or False and True)', opts: ['True', 'False'], a: 1, why: '<code>and</code> goes first: <code>False and True</code> is <code>False</code>. Then <code>False or False</code> is <code>False</code>.'},
  {t: 't42', q: 'Which expression always gives the same answer as not (a and b)?', code: '', opts: ['not a and not b', 'not a or not b', 'a or b', 'not a and b'], a: 1, why: 'Flipping a group flips each part <em>and</em> swaps <code>and</code> for <code>or</code>. Check it with a truth table.'},
  // 4.3
  {t: 't43', q: 'What does this print?', code: 'print(7 >= 7)', opts: ['True', 'False', 'Error'], a: 0, why: '<code>&gt;=</code> means “at least,” so 7 counts.'},
  {t: 't43', q: 'The user types 10. What happens?', code: 'x = input("Number? ")\nprint(x > 9)', opts: ['It prints True', 'It prints False', 'TypeError'], a: 2, why: '<code>input()</code> gives a string, and Python can’t compare a string to an int with <code>&gt;</code>.'},
  {t: 't43', q: 'What does this print?', code: 'grade = 90\nprint(grade >= 80 and grade < 90)', opts: ['True', 'False'], a: 1, why: '<code>90 &lt; 90</code> is False, so the <code>and</code> is False. 90 is the boundary.'},
  // 4.4
  {t: 't44', q: 'What does this print?', code: 'x = 2\nif x > 3:\n    print("A")\nprint("B")', opts: ['A', 'B', 'A\nB', 'Nothing'], a: 1, why: 'The <code>if</code> body is skipped. <code>print("B")</code> isn’t indented, so it always runs.'},
  {t: 't44', q: 'What happens?', code: 'age = 15\nif age >= 13\n    print("teen")', opts: ['It prints teen', 'It prints nothing', 'SyntaxError'], a: 2, why: 'The <code>if</code> line is missing its colon.'},
  {t: 't44', q: 'What does this print?', code: 'n = 9\nif n % 2 == 0:\n    print("even")\nelse:\n    print("odd")', opts: ['even', 'odd', 'even\nodd'], a: 1, why: '<code>9 % 2</code> is 1, so the condition is False and the <code>else</code> runs.'},
  // 4.5
  {t: 't45', q: 'What does this print?', code: 'temp = 80\nif temp >= 80:\n    print("Hot")\nelif temp >= 60:\n    print("Warm")\nelse:\n    print("Cool")', opts: ['Hot', 'Warm', 'Hot\nWarm', 'Cool'], a: 0, why: 'The first True branch wins, and the rest of the chain is skipped.'},
  {t: 't45', q: 'What does this print?', code: 'x = 10\nif x > 5:\n    print("A")\nif x > 8:\n    print("B")', opts: ['A', 'B', 'A\nB', 'Nothing'], a: 2, why: 'Two separate <code>if</code>s are two separate decisions, and both are True.'},
  {t: 't45', q: 'What prints for age 70?', code: 'if age >= 18:\n    print("Adult")\nelif age >= 65:\n    print("Senior")\nelse:\n    print("Child")', opts: ['Adult', 'Senior', 'Adult\nSenior', 'Child'], a: 0, why: '<code>70 &gt;= 18</code> is True first, so the senior check is never reached. Order matters.'},
  // 4.6
  {t: 't46', q: 'Which line makes on_key run every time a key is pressed?', code: '', opts: ['add_key_down_handler(on_key())', 'add_key_down_handler("on_key")', 'add_key_down_handler(on_key)', 'on_key(event)'], a: 2, why: 'Pass the function itself by name: no parentheses, no quotes.'},
  {t: 't46', q: 'Which way does this move the square?', code: 'square.move(0, -5)', opts: ['Up', 'Down', 'Left', 'Right'], a: 0, why: 'On a canvas, y gets smaller going up.'},
  // 4.7
  {t: 't47', q: 'What is the last number printed?', code: 'for i in range(4):\n    print(i)', opts: ['3', '4', '5'], a: 0, why: '<code>range(4)</code> is 0, 1, 2, 3.'},
  {t: 't47', q: 'What does this print?', code: 'total = 0\nfor i in range(4):\n    total = total + i\nprint(total)', opts: ['4', '6', '10', '0\n1\n3\n6'], a: 1, why: '0 + 1 + 2 + 3 = 6, printed once after the loop.'},
  {t: 't47', q: 'The user types 3. What happens?', code: 'n = input("How many? ")\nfor i in range(n):\n    print("hi")', opts: ['hi prints 3 times', 'hi prints 4 times', 'TypeError'], a: 2, why: '<code>range()</code> needs an int. Use <code>int(input(...))</code>.'},
  // 4.8
  {t: 't48', q: 'What does this print?', code: 'for i in range(2, 10, 3):\n    print(i)', opts: ['2\n5\n8', '2\n5\n8\n11', '3\n6\n9', '2\n3\n4'], a: 0, why: 'Start at 2, add 3: 2, 5, 8. The next, 11, would pass the stop.'},
  {t: 't48', q: 'What is the last number printed?', code: 'for i in range(10, 0, -2):\n    print(i)', opts: ['0', '1', '2'], a: 2, why: '10, 8, 6, 4, 2. The stop, 0, is never included.'},
  {t: 't48', q: 'What does this print?', code: 'for i in range(5, 1):\n    print(i)', opts: ['5\n4\n3\n2', 'Nothing', 'An error'], a: 1, why: 'The default step is +1, so it can’t count up from 5 to 1. The range is empty.'},
  // 4.9
  {t: 't49', q: 'How many stars are printed?', code: 'for i in range(3):\n    for j in range(2):\n        print("*")', opts: ['5', '6', '3', '2'], a: 1, why: 'Nested loops multiply: 3 × 2 = 6.'},
  {t: 't49', q: 'What does this print?', code: 'product = 0\nfor i in range(1, 5):\n    product *= i\nprint(product)', opts: ['24', '0', '10'], a: 1, why: 'A product that starts at 0 stays 0. Products start at 1.'},
  // 4.10
  {t: 't410', q: 'What does this print?', code: 'i = 0\nwhile i < 3:\n    print(i)\n    i += 1', opts: ['0\n1\n2', '0\n1\n2\n3', '1\n2\n3'], a: 0, why: 'When <code>i</code> is 3, <code>3 &lt; 3</code> is False and the loop ends.'},
  {t: 't410', q: 'What happens?', code: 'i = 1\nwhile i != 10:\n    i += 2', opts: ['It stops at 10', 'It stops at 11', 'It never stops'], a: 2, why: '<code>i</code> goes 1, 3, 5, 7, 9, 11, … and skips 10.'},
  {t: 't410', q: 'What is printed?', code: 'x = 1\nwhile x < 20:\n    x = x * 2\nprint(x)', opts: ['16', '20', '32'], a: 2, why: '1 → 2 → 4 → 8 → 16 → 32. 16 passes the check, then doubles to 32.'},
  // 4.11
  {t: 't411', q: 'What does this print?', code: 'for i in range(5):\n    if i == 2:\n        continue\n    print(i)', opts: ['0\n1', '0\n1\n3\n4', '0\n1\n2\n3\n4'], a: 1, why: '<code>continue</code> skips only that pass; <code>break</code> would end the loop.'},
  {t: 't411', q: 'What is printed?', code: 'n = 10\ncount = 0\nwhile True:\n    count += 1\n    n = n - 4\n    if n < 0:\n        break\nprint(count)', opts: ['2', '3', '4'], a: 1, why: '<code>n</code> goes 6, 2, -2: three passes, and the counter went up on every one.'},
  // 4.12
  {t: 't412', q: 'Which values can random.randint(1, 6) return?', code: '', opts: ['0 to 5', '1 to 5', '1 to 6', '0 to 6'], a: 2, why: '<code>randint</code> includes both ends.'},
  {t: 't412', q: 'What does this print?', code: 'import random\nroll = random.randint(1, 6)\nfor i in range(3):\n    print(roll)', opts: ['Three different numbers', 'The same number three times', 'An error'], a: 1, why: 'The roll happened once, before the loop.'},
  // AP
  {t: 'tap', q: 'What does this AP pseudocode display?', code: 'x ← 1\nREPEAT UNTIL (x > 10)\n{\n   x ← x + 4\n}\nDISPLAY(x)', opts: ['9', '13', '17'], a: 1, why: '1 → 5 → 9 → 13. It keeps going until x &gt; 10.'},
  {t: 'tap', q: 'What does this display?', code: 'a ← 5\nIF (a > 10)\n{\n   DISPLAY("big")\n}\nELSE\n{\n   IF (a > 3)\n   {\n      DISPLAY("medium")\n   }\n   ELSE\n   {\n      DISPLAY("small")\n   }\n}', opts: ['big', 'medium', 'small'], a: 1, why: '5 isn’t &gt; 10, so the ELSE runs; inside it, 5 &gt; 3.'},
  {t: 'tap', q: 'Which Python loop matches REPEAT UNTIL (count ≥ 5)?', code: '', opts: ['while count >= 5:', 'while count < 5:', 'for i in range(5):'], a: 1, why: '<code>REPEAT UNTIL</code> keeps going while its condition is false, so flip it.'}
];

const T = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const state = QUESTIONS.map(() => null); // null = unanswered, true/false = right/wrong

/* key idea cards */
$('ideaCards').innerHTML = TOPICS.map(t => `<div class="card"><h3>${esc(t.title)}</h3><ul>${t.ideas.map(i => `<li>${esc(i)}</li>`).join('')}</ul><a href="${esc(t.page)}">Open the full page →</a></div>`).join('');
$('qCount').textContent = QUESTIONS.length;
$('scTotal').textContent = QUESTIONS.length;

/* practice test, grouped by topic */
function topicScore(id) {
  let right = 0, answered = 0, total = 0;
  QUESTIONS.forEach((q, i) => { if (q.t !== id) return; total++; if (state[i] !== null) { answered++; if (state[i]) right++; } });
  return {right, answered, total};
}
function updateScore() {
  const answered = state.filter(s => s !== null).length, right = state.filter(s => s === true).length;
  $('scBig').innerHTML = `${answered} / ${QUESTIONS.length}`;
  $('scSub').textContent = `answered · ${right} correct`;
  $('scBar').style.width = (answered / QUESTIONS.length * 100) + '%';
  TOPICS.forEach(t => { const s = topicScore(t.id), el = document.querySelector(`[data-tsc="${t.id}"]`); if (el) el.textContent = s.answered ? `${s.right} / ${s.total} correct` : ''; });
}
function buildQuiz() {
  state.fill(null);
  const box = $('quizBox'); box.innerHTML = '';
  let n = 0;
  TOPICS.forEach(t => {
    const h = document.createElement('div'); h.className = 'topic-h';
    h.innerHTML = `<h3>${esc(t.title)}</h3><span class="tsc" data-tsc="${t.id}"></span>`;
    box.appendChild(h);
    QUESTIONS.forEach((item, qi) => {
      if (item.t !== t.id) return;
      n++;
      const d = document.createElement('div'); d.className = 'quiz';
      d.innerHTML = `<div class="q">${n}. ${item.q}</div>` + (item.code ? `<pre class="code">${esc(item.code)}</pre>` : '') + '<div class="opts"></div><div class="fb"></div>';
      const opts = d.querySelector('.opts'), fb = d.querySelector('.fb');
      item.opts.forEach((o, oi) => {
        const b = document.createElement('button'); b.textContent = o;
        b.onclick = () => {
          opts.querySelectorAll('button').forEach(x => x.disabled = true);
          opts.children[item.a].classList.add('right');
          if (oi !== item.a) b.classList.add('wrong');
          state[qi] = oi === item.a;
          fb.innerHTML = (oi === item.a ? '<strong style="color:var(--true)">Correct.</strong> ' : '<strong style="color:var(--false)">Not quite.</strong> ') + item.why;
          fb.style.display = 'block';
          updateScore(); if (resultsShown) showResults();
        };
        opts.appendChild(b);
      });
      box.appendChild(d);
    });
  });
  updateScore();
}

/* results */
let resultsShown = false;
function analyze() {
  const rows = TOPICS.map(t => ({t, ...topicScore(t.id)}));
  const review = rows.filter(r => r.answered > r.right).sort((a, b) => (a.right / a.answered) - (b.right / b.answered) || (b.answered - b.right) - (a.answered - a.right));
  const unfinished = rows.filter(r => r.answered === r.right && r.right < r.total);
  const solid = rows.filter(r => r.right === r.total);
  const answered = rows.reduce((s, r) => s + r.answered, 0), right = rows.reduce((s, r) => s + r.right, 0);
  return {rows, review, unfinished, solid, answered, right};
}
function showResults() {
  resultsShown = true;
  const a = analyze();
  if (!a.answered) { $('resBody').innerHTML = '<p class="mini">Answer some questions in section 02 first.</p>'; return; }
  const color = r => r.right === r.total ? 'var(--true)' : r.answered === 0 ? 'var(--chip)' : r.right / r.total >= 0.5 ? 'var(--gold)' : 'var(--false)';
  let h = `<p class="summary">${a.right} correct out of ${a.answered} answered` + (a.answered < QUESTIONS.length ? ` (${QUESTIONS.length - a.answered} still unanswered)` : '') + '.</p>';
  h += a.rows.map(r => `<div class="trow"><span>${esc(r.t.title)}</span><div class="bar"><i style="width:${r.total ? r.right / r.total * 100 : 0}%;background:${color(r)}"></i></div><span class="n">${r.right}/${r.total}</span></div>`).join('');
  if (a.review.length) {
    h += '<h3>Review these first</h3>';
    h += a.review.map(r => `<div class="rev"><h4>${esc(r.t.title)}</h4><div class="meta">${r.right} of ${r.answered} correct${r.answered < r.total ? `, ${r.total - r.answered} not answered` : ''} · <a href="${esc(r.t.page)}">open the lesson page</a></div><div class="mini">Remember: ${esc(r.t.ideas[0])}</div><ol>${r.t.practice.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>`).join('');
  } else if (!a.unfinished.length) h += '<div class="okbox">Every topic is at 100%. You’re ready for 4.13.</div>';
  else h += '<div class="okbox">No misses so far. Finish the rest of the test to be sure.</div>';
  if (a.unfinished.length) h += '<h3>Not finished yet</h3><div class="solid unf">' + a.unfinished.map(r => `<span>${esc(r.t.title)} (${r.total - r.answered} left)</span>`).join('') + '</div>';
  if (a.solid.length && (a.review.length || a.unfinished.length)) h += '<h3>You’re solid on</h3><div class="solid">' + a.solid.map(r => `<span>${esc(r.t.title)}</span>`).join('') + '</div>';
  $('resBody').innerHTML = h;
}
$('toResults').onclick = () => { showResults(); $('results').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); };
$('quizReset').onclick = () => { buildQuiz(); resultsShown = false; $('resBody').innerHTML = '<p class="mini">Answer some questions in section 02, then your results show up here.</p>'; };

/* summary text for copy / Gmail */
function summaryText() {
  const a = analyze(), base = location.href.split('#')[0].replace(/[^/]*$/, '');
  const lines = ['AP CSP Unit 4 Review results', '', `Score: ${a.right} correct out of ${a.answered} answered (${QUESTIONS.length} questions total)`, ''];
  if (a.review.length) {
    lines.push('REVIEW THESE FIRST');
    a.review.slice(0, 4).forEach(r => {
      lines.push('', `${r.t.title}: ${r.right}/${r.answered} correct`, `  Lesson page: ${base}${r.t.page}`);
      r.t.practice.forEach((p, i) => lines.push(`  Practice ${i + 1}: ${p}`));
    });
    if (a.review.length > 4) lines.push('', 'Also review: ' + a.review.slice(4).map(r => r.t.title).join(', '));
  } else lines.push(a.unfinished.length ? 'No misses so far.' : 'Every topic at 100%. Ready for 4.13!');
  if (a.unfinished.length) lines.push('', 'Not finished yet: ' + a.unfinished.map(r => r.t.title).join(', '));
  if (a.solid.length && (a.review.length || a.unfinished.length)) lines.push('', 'Solid on: ' + a.solid.map(r => r.t.title).join(', '));
  return lines.join('\n');
}
const status = (html, cls) => { $('emStatus').innerHTML = `<div class="${cls}" style="margin-top:10px">${html}</div>`; };
$('emCopy').onclick = async () => {
  if (!analyze().answered) { status('Answer some questions first.', 'warnbox'); return; }
  try { await navigator.clipboard.writeText(summaryText()); status('Copied. Paste it into an email or a doc.', 'okbox'); }
  catch (e) { status('Your browser blocked copying. Select the text in section 03 and copy it yourself.', 'warnbox'); }
};
$('emGmail').onclick = () => {
  if (!analyze().answered) { status('Answer some questions first.', 'warnbox'); return; }
  const to = $('emIn').value.trim();
  const url = 'https://mail.google.com/mail/?view=cm&fs=1' + (to ? '&to=' + encodeURIComponent(to) : '') + '&su=' + encodeURIComponent('My Unit 4 review results') + '&body=' + encodeURIComponent(summaryText());
  window.open(url, '_blank', 'noopener');
};
const ERRORS = {
  bad_email: 'That doesn’t look like an email address.',
  domain: 'Please use your school email address.',
  cooldown: 'You just sent one. Wait a couple of minutes before sending again.',
  daily: 'The page has sent its limit for today. Use Copy or Gmail below instead.',
  quota: 'The page has sent its limit for today. Use Copy or Gmail below instead.',
  bad_results: 'Something about the results didn’t look right. Reload the page and try again.',
  server: 'The email service had a problem. Use Copy or Gmail below instead.'
};
$('emSend').onclick = async () => {
  const email = $('emIn').value.trim();
  const a = analyze();
  if (!a.answered) { status('Answer some questions first.', 'warnbox'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status(ERRORS.bad_email, 'warnbox'); return; }
  if (!EMAIL_ENDPOINT) { status('Email isn’t turned on for this page yet. Use Copy or Gmail below instead.', 'warnbox'); return; }
  const results = {}; a.rows.forEach(r => results[r.t.id] = [r.right, r.answered]);
  const btn = $('emSend'); btn.disabled = true; btn.textContent = 'Sending…';
  try {
    const res = await fetch(EMAIL_ENDPOINT, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify({email, results})});
    const data = await res.json();
    if (data.ok) status(`Sent to ${esc(email)}. Check your inbox (and spam folder) in a minute or two.`, 'okbox');
    else status(ERRORS[data.error] || ERRORS.server, 'warnbox');
  } catch (e) { status('Couldn’t reach the email service. Use Copy or Gmail below instead.', 'warnbox'); }
  btn.disabled = false; btn.textContent = 'Send my results';
};

buildQuiz();

/* highlight the current section in the nav */
(() => {
  const links = [...document.querySelectorAll('nav a[href^="#"]')];
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); });
  }, {rootMargin: '-30% 0px -60% 0px'});
  links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
})();
