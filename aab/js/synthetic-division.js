/* ---------- Fractions ---------- */
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return a||1;}
class Fr{
  constructor(n,d=1){
    if(d===0) throw new Error('div0');
    if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)) throw new Error('big');
    if(d<0){n=-n;d=-d;}
    const g=gcd(n,d); this.n=n/g; this.d=d/g; if(this.n===0){this.n=0;this.d=1;}
  }
  add(o){return new Fr(this.n*o.d+o.n*this.d,this.d*o.d)}
  mul(o){return new Fr(this.n*o.n,this.d*o.d)}
  div(o){return new Fr(this.n*o.d,this.d*o.n)}
  neg(){return new Fr(-this.n,this.d)}
  abs(){return new Fr(Math.abs(this.n),this.d)}
  isZero(){return this.n===0}
  isNeg(){return this.n<0}
  isOne(){return this.n===1&&this.d===1}
}
const ZERO=()=>new Fr(0);

/* ---------- Parsing ---------- */
class PErr extends Error{}
const SUP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};
function parsePoly(raw){
  let s=raw.replace(/[\u2212\u2013\u2014]/g,'-').replace(/\s+/g,'').replace(/\*\*/g,'^');
  s=s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,m=>'^'+[...m].map(c=>SUP[c]).join(''));
  if(!s) throw new PErr('Type a polynomial here.');
  if(/^\(.*\)$/.test(s)&&!/[()]/.test(s.slice(1,-1))) s=s.slice(1,-1);
  if(/[()]/.test(s)) throw new PErr('Write it without parentheses — multiply it out first.');
  const bad=s.match(/[^0-9a-zA-Z+\-^.\/*]/);
  if(bad) throw new PErr(`The character “${bad[0]}” isn’t allowed. Use numbers, one letter, +, −, and ^.`);
  const terms=s.match(/[+-]?[^+-]+/g);
  if(!terms||terms.join('')!==s) throw new PErr('Two signs are next to each other, or a sign is hanging at the end.');
  const coefs=new Map(); let v=null;
  for(const t of terms){
    const m=t.match(/^([+-]?)(\d+\/\d+|\d*\.\d+|\d+)?(?:\*?([a-zA-Z])(?:\^(\d+))?)?$/);
    if(!m||(!m[2]&&!m[3])){
      if(/[a-zA-Z]\d/.test(t)) throw new PErr(`In “${t}”, put ^ before the exponent (like x^2).`);
      throw new PErr(`The term “${t}” can’t be read. Check for typos.`);
    }
    let c;
    if(!m[2]) c=new Fr(1);
    else if(m[2].includes('/')){
      const [a,b]=m[2].split('/').map(Number);
      if(b===0) throw new PErr('A fraction has 0 on the bottom.');
      c=new Fr(a,b);
    } else if(m[2].includes('.')){
      const [w,f]=m[2].split('.');
      c=new Fr(Number((w||'0')+f),10**f.length);
    } else c=new Fr(Number(m[2]));
    if(m[1]==='-') c=c.neg();
    let deg=0;
    if(m[3]){
      const L=m[3].toLowerCase();
      if(v&&v!==L) throw new PErr(`Use just one variable (this has ${v} and ${L}).`);
      v=L; deg=m[4]!==undefined?Number(m[4]):1;
    }
    if(deg>12) throw new PErr('Keep exponents at 12 or below.');
    coefs.set(deg,(coefs.get(deg)||ZERO()).add(c));
  }
  return {coefs,v};
}
function toArr(coefs){
  let deg=-1;
  for(const [d,c] of coefs) if(!c.isZero()&&d>deg) deg=d;
  if(deg<0) return [ZERO()];
  const a=[]; for(let d=deg;d>=0;d--) a.push(coefs.get(d)||ZERO());
  return a;
}

/* ---------- Formatting ---------- */
let V='x';
function fracHTML(f){return f.d===1?String(f.n):`<span class="fr"><span>${f.n}</span><span>${f.d}</span></span>`;}
function num(f){return (f.isNeg()?'−':'')+fracHTML(f.abs());}
function varHTML(deg){if(deg===0)return '';if(deg===1)return `<i>${V}</i>`;return `<i>${V}</i><sup>${deg}</sup>`;}
function T(f,deg,first=true){
  const a=f.abs();
  const coef=(deg>0&&a.isOne())?'':fracHTML(a);
  const body=coef+varHTML(deg);
  if(first) return (f.isNeg()?'−':'')+body;
  return `<span class="op">${f.isNeg()?'−':'+'}</span>${body}`;
}
function P(arr){
  const n=arr.length-1; let out='',first=true;
  arr.forEach((c,i)=>{if(c.isZero())return; out+=T(c,n-i,first); first=false;});
  return first?'0':out;
}
const M=h=>`<span class="m">${h}</span>`;
const paren=f=>f.isNeg()?`(${num(f)})`:num(f);

/* ---------- Solver ---------- */
function solve(N,a,b){
  // divisor is a·x + b, so the synthetic-division number is c = −b/a
  const c=b.neg().div(a), n=N.length-1, steps=[];
  const bottom=[], prods=[];
  const snap=o=>steps.push({...o,prods:prods.slice(),bottom:bottom.slice(),hl:new Set(o.hl||[])});
  const phN=[]; N.forEach((v,i)=>{if(v.isZero()&&n>0)phN.push(i);});
  const D=[a,b];
  let setup=`To divide by ${M(P(D))}, find the number that makes the divisor equal 0: ${M(`${T(a,1)}${b.isZero()?'':T(b,0,false)} = 0`)} gives ${M(`<i>${V}</i> = ${num(c)}`)}. Put ${M(num(c))} in the box on the left and write the dividend’s coefficients in a row.`;
  if(phN.length) setup+=` Missing powers get a 0 placeholder (shown dimmed).`;
  snap({phase:'setup',title:'Set up the problem',html:setup,hl:['root']});

  if(n===0){
    bottom.push(N[0]);
    snap({phase:'done',title:'Nothing to divide',html:`The dividend is just a number, so the quotient is 0 and the remainder is ${M(num(N[0]))}.`,hl:['b0'],final:{q:[ZERO()],r:N[0]}});
    return {steps,c,final:{q:[ZERO()],r:N[0]}};
  }

  bottom.push(N[0]);
  snap({phase:'down',title:'Bring down the first coefficient',
    html:`Drop the leading coefficient ${M(num(N[0]))} straight down. It’s the first number of the quotient.`,
    hl:['t0','b0']});

  for(let k=1;k<=n;k++){
    const p=bottom[k-1].mul(c);
    prods[k]=p;
    snap({phase:'mul',title:`Multiply (column ${k})`,
      html:`Multiply the number just brought down, ${M(num(bottom[k-1]))}, by ${M(num(c))} and write the result under the next coefficient.`,
      work:`<div>${paren(bottom[k-1])} · ${paren(c)} = ${num(p)}</div>`,
      hl:['b'+(k-1),'root','p'+k]});
    const s=N[k].add(p);
    bottom.push(s);
    const last=k===n;
    snap({phase:'add',title:last?'Add to get the remainder':'Add (column '+k+')',
      html:`Add the column: ${M(num(N[k]))} + ${M(paren(p))}${last?`. The last sum is the <b>remainder</b>.`:'.'}`,
      work:`<div>${num(N[k])} + ${paren(p)} = ${num(s)}</div>`,
      hl:['t'+k,'p'+k,'b'+k]});
  }

  let q=bottom.slice(0,n), r=bottom[n];
  const mon=a.isOne();
  if(!mon){
    snap({phase:'done',title:'Divide by the leading coefficient',
      html:`The divisor’s leading coefficient is ${M(num(a))}, not 1, so divide every quotient coefficient by ${M(num(a))}. The remainder stays the same.`,
      work:`<div>${q.map(v=>num(v.div(a))).join(',  ')}</div>`,
      hl:q.map((_,i)=>'b'+i),final:{q:q.map(v=>v.div(a)),r}});
    q=q.map(v=>v.div(a));
  } else {
    snap({phase:'done',title:'Read the answer',
      html:`The numbers before the last one are the quotient’s coefficients, starting one degree lower than the dividend. The last number is the remainder.`,
      hl:bottom.map((_,i)=>'b'+i),final:{q,r}});
  }
  return {steps,c,final:{q,r}};
}

/* ---------- UI ---------- */
const $=id=>document.getElementById(id);
let S=null,idx=0,Nref=[],cRef=null;

function board(step){
  const n=Nref.length-1, h=step.hl;
  const cls=(base,key)=>base+(h.has(key)?' hl':'');
  let head=`<tr><td class="lbl"></td><td class="root"></td>`+Nref.map((_,i)=>`<td class="cl">${n-i===0?'const.':varHTML(n-i)}</td>`).join('')+`</tr>`;
  let r1=`<tr><td class="lbl">dividend</td><td class="${cls('root','root')}">${num(cRef)}</td>`+
    Nref.map((v,i)=>`<td class="${cls(v.isZero()?'ph':'',`t${i}`)}">${num(v)}</td>`).join('')+`</tr>`;
  let r2=`<tr><td class="lbl">multiply</td><td class="root"></td>`+
    Nref.map((_,i)=>`<td class="${i>0?cls('prod','p'+i):'prod'}">${i>0&&step.prods[i]!==undefined?num(step.prods[i]):''}</td>`).join('')+`</tr>`;
  let r3=`<tr><td class="lbl">add</td><td class="root"></td>`+
    Nref.map((_,i)=>{
      const has=step.bottom[i]!==undefined;
      const isRem=i===n&&n>0&&has;
      return `<td class="${cls(isRem?'rem':'sum','b'+i)}">${has?num(step.bottom[i]):''}</td>`;
    }).join('')+`</tr>`;
  $('board').innerHTML=`<table class="sd">${head}${r1}${r2}${r3}</table>`;
}

function answerHTML(q,r,a,b){
  const D=[a,b];
  const qz=q.every(c=>c.isZero());
  const qs=P(q);
  if(r.isZero()) return qs;
  const sign=r.isNeg()?'−':'+';
  const frac=`<span class="bigfrac"><span>${num(r.abs())}</span><span>${P(D)}</span></span>`;
  return qz?`${r.isNeg()?'−':''}${frac}`:`${qs} <span class="op">${sign}</span> ${frac}`;
}

function render(){
  const st=S.steps[idx], total=S.steps.length;
  board(st);
  $('count').textContent=`Step ${idx+1} of ${total}`;
  $('title').textContent=st.title;
  $('explain').innerHTML=st.html;
  $('work').innerHTML=st.work||''; $('work').hidden=!st.work;
  const phases=document.querySelectorAll('.phase');
  const on={down:[0],mul:[1],add:[2]}[st.phase]||[];
  phases.forEach((p,i)=>p.classList.toggle('on',on.includes(i)));
  const ans=$('answer');
  if(st.phase==='done'&&st.final){
    const {q,r}=st.final;
    ans.hidden=false;
    ans.innerHTML=`<div class="ans-line"><span class="lbl">Quotient</span><span class="m">${P(q)}</span></div>
      <div class="ans-line"><span class="lbl">Remainder</span><span class="m">${num(r)}</span></div>
      <div class="ans-big m">${answerHTML(q,r,S.a,S.b)}</div>`;
  } else ans.hidden=true;
  $('bar').style.width=((idx+1)/total*100)+'%';
  $('back').disabled=idx===0; $('first').disabled=idx===0;
  $('next').disabled=idx===total-1; $('last').disabled=idx===total-1;
}

function start(){
  $('status').textContent='';
  try{
    const pn=parsePoly($('inN').value), pd=parsePoly($('inD').value);
    const D=toArr(pd.coefs);
    if(D.length!==2) throw new PErr('Synthetic division needs a divisor of degree 1, like x − 3.');
    if(pn.v&&pd.v&&pn.v!==pd.v) throw new PErr(`Use the same variable in both (${pn.v} and ${pd.v}).`);
    V=pn.v||pd.v||'x';
    Nref=toArr(pn.coefs);
    const a=D[0], b=D[1];
    S=solve(Nref,a,b); S.a=a; S.b=b; cRef=S.c;
    $('problem').innerHTML=`(${P(Nref)}) ÷ (${P(D)})`;
    $('main').hidden=false; idx=0; render();
    $('main').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    if(e instanceof PErr) $('status').textContent=e.message;
    else $('status').textContent='Those numbers are too large to work with. Try smaller ones.';
  }
}

const EX=[['x^3 - 2x^2 - 4','x - 3'],['2x^3 + 3x^2 - 5x + 6','x + 2'],['x^4 - 16','x - 2'],['6x^2 + x - 2','2x - 1'],['x^3 + 1','x + 1']];
EX.forEach(([n,d])=>{
  const b=document.createElement('button'); b.className='chip';
  b.innerHTML=`(${P(toArr(parsePoly(n).coefs))}) ÷ (${P(toArr(parsePoly(d).coefs))})`;
  b.onclick=()=>{$('inN').value=n;$('inD').value=d;start();};
  $('examples').appendChild(b);
});
/* ---------- Random problems: build N = Q·D + R so the quotient has integer coefficients ---------- */
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const nz=(a,b)=>{let v;do{v=ri(a,b);}while(v===0);return v;};
const pick=a=>a[Math.floor(Math.random()*a.length)];
function polyMul(a,b){const o=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>{o[i+j]+=x*y;}));return o;}
function polyAdd(a,b){const L=Math.max(a.length,b.length),o=[];for(let k=0;k<L;k++){o.push((a[a.length-L+k]||0)+(b[b.length-L+k]||0));}return o;}
function toInput(arr){
  const n=arr.length-1; let s='';
  arr.forEach((c,i)=>{
    if(c===0) return; const d=n-i, a=Math.abs(c);
    const body=(d>0&&a===1?'':String(a))+(d===0?'':d===1?'x':'x^'+d);
    s+=s?(c<0?' - ':' + ')+body:(c<0?'-':'')+body;
  });
  return s||'0';
}
function randQ(deg,lead,zeroP){
  const q=[lead]; for(let k=0;k<deg;k++) q.push(Math.random()<zeroP?0:ri(-5,5));
  return q;
}
function randomProblem(level){
  let D,N;
  if(level==='basic'){
    D=[1,nz(-5,5)];
    const Q=randQ(ri(1,2),pick([1,1,2,3]),.1);
    N=polyAdd(polyMul(Q,D),Math.random()<.5?[0]:[nz(-9,9)]);
  } else if(level==='medium'){
    /* Dividend itself has gaps, so students must write 0 placeholders */
    D=[1,nz(-4,4)];
    const deg=ri(3,4); let ok=false;
    do{
      const Q=randQ(deg-1,nz(-2,2),.25);
      N=polyAdd(polyMul(Q,D),Math.random()<.4?[0]:[nz(-9,9)]);
      ok=N.slice(1).some(c=>c===0)&&N.every(c=>Math.abs(c)<=40);
    }while(!ok);
  } else {
    let a,b; do{a=pick([2,2,3,4]);b=nz(-5,5);}while(gcd(a,b)!==1);
    D=[a,b];
    const Q=randQ(ri(2,3),nz(-3,3),.2);
    N=polyAdd(polyMul(Q,D),Math.random()<.4?[0]:[nz(-9,9)]);
  }
  return [toInput(N),toInput(D)];
}
$('rand').onclick=()=>{
  let n,d,tries=0;
  do{[n,d]=randomProblem($('level').value);}while(n===$('inN').value&&d===$('inD').value&&++tries<10);
  $('inN').value=n; $('inD').value=d; start();
};

$('go').onclick=start;
['inN','inD'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter')start();}));
$('next').onclick=()=>{if(idx<S.steps.length-1){idx++;render();}};
$('back').onclick=()=>{if(idx>0){idx--;render();}};
$('first').onclick=()=>{idx=0;render();};
$('last').onclick=()=>{idx=S.steps.length-1;render();};
document.addEventListener('keydown',e=>{
  if(!S||$('main').hidden||/INPUT|SELECT/.test(document.activeElement.tagName)) return;
  if(e.key==='ArrowRight')$('next').click();
  if(e.key==='ArrowLeft')$('back').click();
});
