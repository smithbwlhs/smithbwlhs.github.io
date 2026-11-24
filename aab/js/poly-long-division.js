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
  sub(o){return new Fr(this.n*o.d-o.n*this.d,this.d*o.d)}
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
function colName(deg){return deg===0?'constant':M(varHTML(deg));}
function answerHTML(q,r,D){
  const qz=q.every(c=>c.isZero()), rz=r.every(c=>c.isZero());
  if(rz) return P(q);
  let rr=r,sign='+';
  const nz=r.filter(c=>!c.isZero());
  if(nz.length===1&&nz[0].isNeg()){rr=r.map(c=>c.neg());sign='−';}
  const frac=`<span class="bigfrac"><span>${P(rr)}</span><span>${P(D)}</span></span>`;
  if(qz) return (sign==='−'?'−':'')+frac;
  return `${P(q)} <span class="op">${sign}</span> ${frac}`;
}

/* ---------- Solver: builds every step with a snapshot of the board ---------- */
function solve(N,D){
  const n=N.length-1, m=D.length-1, steps=[];
  const st={q:{},rows:[]};
  const snap=o=>steps.push({...o,
    state:{q:{...st.q},rows:st.rows.map(r=>({kind:r.kind,cells:{...r.cells}}))},
    hl:new Set(o.hl||[])});
  const key=(row,c)=>row<0?`d:${c}`:`r:${row}:${c}`;

  // Setup
  const phN=[]; if(n>0) N.forEach((c,i)=>{if(c.isZero())phN.push(i);});
  const dHasPh=m>0&&D.some(c=>c.isZero());
  let setup=`The divisor ${M(P(D))} goes outside and the dividend goes inside. Both are written in standard form: highest power first.`;
  if(phN.length) setup+=` The dividend skips ${phN.length===1?'a power':'some powers'}, so ${phN.length===1?'a 0 placeholder fills the gap':'0 placeholders fill the gaps'} (highlighted). That keeps every column lined up.`;
  if(dHasPh) setup+=` The divisor skips a power too, so it gets a 0 placeholder as well.`;
  snap({phase:'setup',title:'Set up the problem',html:setup,hl:phN.map(i=>'d:'+i)});

  if(n<m){
    snap({phase:'done',title:'Nothing to divide',
      html:`The dividend has a lower degree (${n}) than the divisor (${m}), so the divisor can’t go into it even once. The quotient is 0 and the whole dividend is the remainder.`,
      final:{q:[ZERO()],r:N},hl:N.map((_,i)=>'d:'+i)});
    return {steps};
  }

  const cur=N.slice(), qArr=[]; let row=-1;
  for(let i=0;i<=n-m;i++){
    const lead=cur[i], qc=lead.div(D[0]), qdeg=n-m-i, col=m+i;
    qArr.push(qc);
    st.q[col]={f:qc,deg:qdeg};
    const leadKey=key(row,i);
    const hasNext=i+m+1<=n;

    if(qc.isZero()){
      const extra=[];
      if(hasNext){
        const c=i+m+1;
        if(row>=0) st.rows[row].cells[c]={f:cur[c],deg:n-c,brought:true};
        extra.push('d:'+c,key(row,c));
      }
      snap({phase:'zero',cycle:hasNext?[0,3]:[0],title:'The first term is 0',
        html:`What you’re dividing now starts with ${M(T(lead,n-i))}. Since 0 divided by anything is 0, the next quotient term is 0. Multiplying and subtracting 0 changes nothing, so skip ahead${hasNext?` and bring down the next term, ${M(T(cur[i+m+1],n-i-m-1))}`:''}.`,
        work:`<div>0 ÷ ${T(D[0],m)} = 0</div>`,
        hl:[leadKey,'div:lead','q:'+col,...extra]});
      continue;
    }

    // Divide
    snap({phase:'divide',cycle:[0],title:'Divide',
      html:`Look only at the first term of what you’re dividing, ${M(T(lead,n-i))}, and the first term of the divisor, ${M(T(D[0],m))}. Divide them, then write the answer on top, above the ${colName(qdeg)} column.`,
      work:`<div>${T(lead,n-i)} ÷ ${T(D[0],m)} = ${T(qc,qdeg)}</div>`,
      hl:[leadKey,'div:lead','q:'+col]});

    // Multiply
    const prod=D.map(c=>c.mul(qc));
    const pr={kind:'product',cells:{}};
    prod.forEach((f,k)=>{pr.cells[i+k]={f,deg:n-i-k};});
    st.rows.push(pr); const pIdx=st.rows.length-1;
    const qShown=(qc.isNeg()||qc.d!==1&&qdeg===0)?`(${T(qc,qdeg)})`:T(qc,qdeg);
    snap({phase:'multiply',cycle:[1],title:'Multiply',
      html:`Multiply ${M(T(qc,qdeg))} by the <b>whole</b> divisor. Write the result underneath, lining each term up under its matching power.`,
      work:`<div>${qShown}(${P(D)}) = ${P(prod)}</div>`,
      hl:['q:'+col,'div:all',...prod.map((_,k)=>`r:${pIdx}:${i+k}`)]});

    // Subtract
    const rr={kind:'result',cells:{}};
    const lines=[];
    const fmtB=(b,deg)=>b.isNeg()?`(${T(b,deg)})`:T(b,deg);
    lines.push(`<div>${T(cur[i],n-i)} − ${fmtB(prod[0],n-i)} = 0<span class="note">first terms always cancel</span></div>`);
    const prevKeys=[leadKey];
    for(let c=i+1;c<=i+m;c++){
      const nv=cur[c].sub(prod[c-i]);
      lines.push(`<div>${T(cur[c],n-c)} − ${fmtB(prod[c-i],n-c)} = ${T(nv,n-c)}</div>`);
      prevKeys.push(key(row,c));
      cur[c]=nv; rr.cells[c]={f:nv,deg:n-c};
    }
    cur[i]=ZERO();
    if(m===0) rr.cells[i]={f:ZERO(),deg:n-i,zeroOnly:true};
    st.rows.push(rr); const rIdx=st.rows.length-1;
    snap({phase:'subtract',cycle:[2],title:'Subtract',
      html:`Subtract the red line from the line above it, one column at a time. A reliable way: change every sign in the red line, then add. Watch the negatives.`,
      work:lines.join(''),
      hl:[...prevKeys,...prod.map((_,k)=>`r:${pIdx}:${i+k}`),...Object.keys(rr.cells).map(c=>`r:${rIdx}:${c}`)]});
    row=rIdx;

    // Bring down
    if(hasNext){
      const c=i+m+1;
      if(rr.cells[i]&&rr.cells[i].zeroOnly) delete rr.cells[i];
      rr.cells[c]={f:cur[c],deg:n-c,brought:true};
      const newLine=cur.slice(i+1,c+1);
      snap({phase:'bring',cycle:[3],title:'Bring down',
        html:`Bring down the next term from the dividend, ${M(T(cur[c],n-c))}. That gives a new line to work with. Now repeat the cycle: divide, multiply, subtract, bring down.`,
        work:`<div>New line: ${P(newLine)}</div>`,
        hl:['d:'+c,`r:${rIdx}:${c}`]});
    }
  }

  const R=m===0?[ZERO()]:cur.slice(n-m+1);
  const rZero=R.every(c=>c.isZero());
  const remKeys=[];
  if(m===0) remKeys.push(key(row,n)); else for(let c=n-m+1;c<=n;c++) remKeys.push(key(row,c));
  const qKeys=Object.keys(st.q).map(c=>'q:'+c);
  snap({phase:'done',title:'Done!',
    html:`There’s nothing left to bring down, and what’s left (${M(P(R))}) has a lower degree than the divisor, so we stop.`+
      (rZero?` The remainder is 0, which means ${M(P(D))} is a factor of the dividend.`:` What’s left is the remainder. It goes over the divisor in the final answer.`),
    final:{q:qArr,r:R},hl:[...qKeys,...remKeys]});
  return {steps};
}

/* ---------- Rendering ---------- */
const $=s=>document.querySelector(s);
let app=null;

function boardHTML(s){
  const {state,hl}=s, N=app.N, D=app.D, cols=N.length, n=cols-1, m=D.length-1;
  const td=(k,inner,cls)=>`<td class="${cls}${hl.has(k)?' hl':''}">${inner}</td>`;
  let h='<table class="ld" aria-label="Long division work"><tbody>';
  const qk=Object.keys(state.q).map(Number), qf=Math.min(...qk);
  h+='<tr><td class="gutter"></td>';
  for(let c=0;c<cols;c++){const e=state.q[c]; h+=e?td('q:'+c,T(e.f,e.deg,c===qf),'q'):'<td></td>';}
  h+='</tr>';
  const dAll=hl.has('div:all'), dLead=hl.has('div:lead');
  const dterms=D.map((c,i)=>`<span class="${c.isZero()&&m>0?'pz':''}${i===0&&dLead?' hlspan':''}">${T(c,m-i,i===0)}</span>`).join('');
  h+=`<tr><td class="gutter"><span class="${dAll?'hlspan':''}">${dterms}</span><span class="bracket">)</span></td>`;
  N.forEach((c,i)=>{h+=td('d:'+i,T(c,n-i,i===0),'dv'+(c.isZero()&&n>0?' pz':''));});
  h+='</tr>';
  state.rows.forEach((r,ri)=>{
    const ks=Object.keys(r.cells).map(Number), f=Math.min(...ks), l=Math.max(...ks);
    h+='<tr><td class="gutter"></td>';
    for(let c=0;c<cols;c++){
      const e=r.cells[c];
      if(!e){h+='<td></td>';continue;}
      let inner=e.zeroOnly?'0':T(e.f,e.deg,c===f);
      if(r.kind==='product'){
        if(c===f) inner='<span class="paren">−(</span>'+inner;
        if(c===l) inner+='<span class="paren">)</span>';
      }
      h+=td(`r:${ri}:${c}`,inner,r.kind==='product'?'prod':('res'+(e.brought?' brought':'')));
    }
    h+='</tr>';
  });
  return h+'</tbody></table>';
}

function finalHTML(f){
  return `<div class="ans-line"><span class="lbl">Quotient</span><span class="m">${P(f.q)}</span></div>`+
    `<div class="ans-line"><span class="lbl">Remainder</span><span class="m">${P(f.r)}</span></div>`+
    `<div class="ans-big m">${answerHTML(f.q,f.r,app.D)}</div>`;
}

function render(){
  const s=app.steps[app.idx], last=app.steps.length-1;
  $('#main').hidden=false;
  $('#problem').innerHTML=`(${P(app.N)}) ÷ (${P(app.D)})`;
  $('#board').innerHTML=boardHTML(s);
  document.querySelectorAll('.phase').forEach((el,i)=>el.classList.toggle('on',(s.cycle||[]).includes(i)));
  $('#count').textContent=`Step ${app.idx+1} of ${app.steps.length}`;
  $('#title').textContent=s.title;
  $('#explain').innerHTML=s.html;
  $('#work').innerHTML=s.work||''; $('#work').hidden=!s.work;
  $('#answer').innerHTML=s.final?finalHTML(s.final):''; $('#answer').hidden=!s.final;
  $('#bar').style.width=`${last?app.idx/last*100:100}%`;
  $('#back').disabled=$('#first').disabled=app.idx===0;
  $('#next').disabled=$('#last').disabled=app.idx===last;
}
function goTo(i){if(!app)return; app.idx=Math.max(0,Math.min(app.steps.length-1,i)); render();}

/* ---------- Inputs ---------- */
const inN=$('#inN'), inD=$('#inD');
function errMsg(e){return e instanceof PErr?e.message:'Those numbers are too big to work with here.';}
function preview(input,out){
  out.classList.remove('err');
  if(!input.value.trim()){out.innerHTML='';return;}
  try{
    const p=parsePoly(input.value); const old=V; V=p.v||'x';
    out.innerHTML=`Reads as ${M(P(toArr(p.coefs)))}`; V=old;
  }catch(e){out.classList.add('err'); out.textContent=errMsg(e);}
}
function fail(msg){$('#status').textContent=msg;}
function run(){
  $('#status').textContent='';
  let a,b;
  try{a=parsePoly(inN.value);}catch(e){return fail('Dividend: '+errMsg(e));}
  try{b=parsePoly(inD.value);}catch(e){return fail('Divisor: '+errMsg(e));}
  if(a.v&&b.v&&a.v!==b.v) return fail(`Use the same variable in both boxes (the dividend uses ${a.v}, the divisor uses ${b.v}).`);
  V=a.v||b.v||'x';
  const N=toArr(a.coefs), D=toArr(b.coefs);
  if(D.length===1&&D[0].isZero()) return fail('The divisor can’t be 0. Dividing by zero is undefined.');
  try{ app={...solve(N,D),N,D,idx:0}; }
  catch(e){ return fail('The numbers in this problem get too big to work with here. Try smaller coefficients.'); }
  render();
}
inN.addEventListener('input',()=>preview(inN,$('#pvN')));
inD.addEventListener('input',()=>preview(inD,$('#pvD')));
[inN,inD].forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter')run();}));
$('#go').addEventListener('click',run);
$('#next').addEventListener('click',()=>goTo(app.idx+1));
$('#back').addEventListener('click',()=>goTo(app.idx-1));
$('#first').addEventListener('click',()=>goTo(0));
$('#last').addEventListener('click',()=>goTo(app.steps.length-1));
document.addEventListener('keydown',e=>{
  if(!app||e.target.tagName==='INPUT'||e.metaKey||e.ctrlKey||e.altKey) return;
  if(e.key==='ArrowRight'){e.preventDefault();goTo(app.idx+1);}
  if(e.key==='ArrowLeft'){e.preventDefault();goTo(app.idx-1);}
});

const EXAMPLES=[
  ['x^3 - 2x^2 - 4','x - 3'],
  ['2x^3 + 3x^2 - 11x - 6','x + 3'],
  ['x^4 - 16','x - 2'],
  ['4x^3 + 2x^2 - 6x + 5','2x^2 - 1'],
];
EXAMPLES.forEach(([a,b])=>{
  const btn=document.createElement('button'); btn.className='chip';
  const pa=parsePoly(a), pb=parsePoly(b); V='x';
  btn.innerHTML=`(${P(toArr(pa.coefs))}) ÷ (${P(toArr(pb.coefs))})`;
  btn.addEventListener('click',()=>{inN.value=a;inD.value=b;preview(inN,$('#pvN'));preview(inD,$('#pvD'));run();});
  $('#examples').appendChild(btn);
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
function randQ(deg,lead){
  const q=[lead]; for(let k=0;k<deg;k++) q.push(Math.random()<.2?0:ri(-5,5));
  return q;
}
function randomProblem(level){
  let D,Q,R;
  if(level==='basic'){
    D=[1,nz(-6,6)];
    Q=randQ(ri(1,2),pick([1,1,2,3]));
    R=Math.random()<.5?[0]:[nz(-9,9)];
  } else if(level==='medium'){
    D=[pick([1,2,2,3]),nz(-5,5)];
    Q=randQ(ri(2,3),nz(-3,3));
    R=Math.random()<.4?[0]:[nz(-9,9)];
  } else {
    D=[pick([1,1,2]),ri(-3,3),nz(-5,5)];
    Q=randQ(ri(1,3),nz(-3,3));
    R=Math.random()<.3?[0]:[ri(-6,6),ri(-6,6)];
  }
  const N=polyAdd(polyMul(Q,D),R);
  return [toInput(N),toInput(D)];
}
$('#rand').addEventListener('click',()=>{
  let a,b,tries=0;
  do{[a,b]=randomProblem($('#level').value);}while(a===inN.value&&b===inD.value&&++tries<10);
  inN.value=a; inD.value=b;
  preview(inN,$('#pvN')); preview(inD,$('#pvD')); run();
});

inN.value=EXAMPLES[0][0]; inD.value=EXAMPLES[0][1];
preview(inN,$('#pvN')); preview(inD,$('#pvD')); run();
