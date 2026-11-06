/* ===========================================================
   Estudante360 — script.js
   Carregar com <script src="script.js" defer></script>
   =========================================================== */

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const SUBS = ['Matemática','Física','Química','Biologia','História','Geografia','Português','Inglês'];
const AVS = ['🦊','🐼','🚀','🦉','🐯','🧠','⚡','🌵','🐙','🦄'];
const LV = ['','Crítico','Alto','Médio','Bom','Dominado'];
const CL = ['','#f43f5e','#f97316','#f59e0b','#22c55e','#86efac'];

const IC = {
  dash:'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
  foco:'M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0',
  cad:'M4 4h12a4 4 0 014 4v12H8a4 4 0 01-4-4zM8 8h8M8 12h6',
  ia:'M5 8h14v10H5zM12 4v4M9 13h.01M15 13h.01',
  rank:'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3'
};

const PG = {
  dash:['Painel','Seu desempenho e suas próximas provas'],
  foco:['Modo foco','Estude sem distrações e ganhe XP'],
  cad:['Caderno','Fórmulas e erros que merecem revisão'],
  ia:['Assistente 360','Tire dúvidas rápidas com linguagem simples'],
  rank:['Ranking','Compare seu XP com outros estudantes, de forma anônima']
};

const dISO = n => { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const today = () => dISO(0);

/* ---------- estado padrão ---------- */
const def = {
  xp:60, nick:'EstudanteAnon', av:'🦊', scope:'mun',
  last:'', streak:0, min:0, hist:[],
  conf:{ Matemática:2, Física:1, Química:3, Biologia:4, História:3, Geografia:4, Português:3, Inglês:5 },
  exams:[
    { s:'Física', d:dISO(2), n:'Leis de Newton' },
    { s:'Matemática', d:dISO(6), n:'Funções do 2º grau' },
    { s:'História', d:dISO(15), n:'Revolução Francesa' }
  ],
  formulas:[
    { n:'Bhaskara', s:'Matemática', f:'x = (−b ± √Δ) / 2a' },
    { n:'Segunda lei de Newton', s:'Física', f:'F = m · a' },
    { n:'Velocidade média', s:'Física', f:'v = Δs / Δt' }
  ],
  erros:[
    { s:'Física', t:'Leis de Newton', c:3 },
    { s:'Matemática', t:'Função do 2º grau', c:2 },
    { s:'Química', t:'Balanceamento de equações', c:1 }
  ]
};

let S;
try { S = Object.assign({}, def, JSON.parse(localStorage.getItem('e360v2') || '{}')); }
catch (e) { S = { ...def }; }

const save = () => { try { localStorage.setItem('e360v2', JSON.stringify(S)); } catch(e){} };

/* ---------- toast / XP ---------- */
function toast(t){
  const e = $('toast');
  e.textContent = t;
  e.classList.remove('hidden');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => e.classList.add('hidden'), 2600);
}

const lvl = x => Math.floor(Math.sqrt(x/25)) + 1;

function addXP(n){
  const a = lvl(S.xp);
  S.xp += n;
  save();
  head();
  if (lvl(S.xp) > a) toast('Você subiu para o nível ' + lvl(S.xp) + '!');
}

function head(){
  const l = lvl(S.xp), lo = 25*(l-1)**2, hi = 25*l*l;
  $('xpT').textContent = S.xp;
  $('stk').textContent = S.streak;
  $('avS').textContent = S.av;
  $('nkS').textContent = S.nick;
  $('lvS').textContent = 'Nível ' + l;
  $('xbS').style.width = ((S.xp-lo)/(hi-lo)*100) + '%';
  $('xpS').textContent = (hi - S.xp) + ' XP para o nível ' + (l+1);
}

/* ---------- navegação ---------- */
const tabs = Object.keys(PG);

$('sideNav').innerHTML = tabs.map(t => `
  <button class="nav" data-t="${t}" onclick="go('${t}')">
    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
      <path d="${IC[t]}"/>
    </svg>${PG[t][0]}
  </button>`).join('');

$('botNav').innerHTML = tabs.map(t => `
  <button class="nav !flex-col !gap-0.5 !text-[11px] !px-2 !py-1.5" data-t="${t}" onclick="go('${t}')">
    <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
      <path d="${IC[t]}"/>
    </svg>${PG[t][0]}
  </button>`).join('');

function go(id){
  if (running && id !== 'foco') cancelFoco('Sessão cancelada: você saiu do modo foco.');

  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === id));
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('on', b.dataset.t === id));

  $('pgT').textContent = PG[id][0];
  $('pgS').textContent = PG[id][1];

  if (id === 'rank') renderRank();
  if (id === 'dash') renderDash();
  if (id === 'foco') renderHist();

  scrollTo(0,0);
}

/* ---------- PAINEL ---------- */
const dayTo = d => {
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.round((new Date(d + 'T00:00:00') - t) / 864e5);
};

function renderDash(){
  const avg = (SUBS.reduce((a,s) => a + (S.conf[s]||3), 0) / SUBS.length).toFixed(1);
  const risk = SUBS.filter(s => (S.conf[s]||3) <= 2).length;

  $('kpis').innerHTML = [
    ['Confiança média', avg + ' / 5'],
    ['Matérias em risco', risk],
    ['Minutos focados', S.min],
    ['Erros em revisão', S.erros.length]
  ].map(([l,v]) => `<div class="card !p-4"><div class="lbl">${l}</div><div class="dsp text-2xl font-extrabold mt-1">${v}</div></div>`).join('');

  $('subjects').innerHTML = [...SUBS]
    .sort((a,b) => (S.conf[a]||3) - (S.conf[b]||3))
    .map(s => {
      const v = S.conf[s] || 3;
      return `<div>
        <div class="flex justify-between text-sm mb-1">
          <b>${s}</b><span style="color:${CL[v]}" class="font-bold">${LV[v]}</span>
        </div>
        <input type="range" min="1" max="5" value="${v}" class="w-full" style="accent-color:${CL[v]}"
               aria-label="Confiança em ${s}"
               oninput="S.conf['${s}']=+this.value;save();renderDash()">
      </div>`;
    }).join('');

  /* radar */
  const cx = 160, cy = 140, R = 95, n = SUBS.length;
  const pt = (i,r) => {
    const a = -Math.PI/2 + i*2*Math.PI/n;
    return [cx + r*Math.cos(a), cy + r*Math.sin(a)];
  };

  let g = '';
  for (let k = 1; k <= 5; k++)
    g += `<polygon points="${SUBS.map((_,i)=>pt(i, R*k/5).join(',')).join(' ')}" fill="none" stroke="#1a2b23"/>`;

  g += SUBS.map((_,i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i,R)[0]}" y2="${pt(i,R)[1]}" stroke="#1a2b23"/>`).join('');

  const P = SUBS.map((s,i) => pt(i, R*(S.conf[s]||3)/5));
  g += `<polygon points="${P.map(p=>p.join(',')).join(' ')}" fill="rgba(34,197,94,.22)" stroke="#22c55e" stroke-width="2" stroke-linejoin="round"/>`;

  g += SUBS.map((s,i) => {
    const [x,y] = pt(i, R+22), v = S.conf[s] || 3;
    return `<circle cx="${P[i][0]}" cy="${P[i][1]}" r="4" fill="${CL[v]}"/>
            <text x="${x}" y="${y+4}" text-anchor="middle" font-size="11"
                  fill="${v<=2?'#f43f5e':'#7f9a8b'}" font-family="DM Sans">${s}</text>`;
  }).join('');

  $('radar').innerHTML = g;

  renderExams();
  renderAlerts();
}

function addExam(){
  const d = $('exDate').value;
  if (!d) return toast('Escolha a data da prova');
  S.exams.push({ s: $('exSub').value, d, n: $('exNote').value.trim() });
  $('exNote').value = '';
  save();
  renderDash();
}

function renderExams(){
  const l = S.exams
    .map((e,i) => ({ ...e, i, k: dayTo(e.d) }))
    .sort((a,b) => a.k - b.k);

  $('exams').innerHTML = l.length ? l.map(e => `
    <li class="inset flex justify-between items-center px-3 py-2.5">
      <span>
        <b>${e.s}</b> <span class="mu">${e.n ? '· ' + esc(e.n) : ''}</span><br>
        <span class="lbl">${new Date(e.d + 'T00:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</span>
      </span>
      <span class="flex items-center gap-3">
        <b style="color:${e.k<0?'#7f9a8b':e.k<=3?'#f43f5e':e.k<=7?'#f59e0b':'#22c55e'}">
          ${e.k<0 ? 'passou' : e.k===0 ? 'hoje' : 'em ' + e.k + ' dias'}
        </b>
        <button aria-label="Remover prova"
                onclick="S.exams.splice(${e.i},1);save();renderDash()"
                class="mu hover:text-rose-400">✕</button>
      </span>
    </li>`).join('')
    : '<li class="mu">Nenhuma prova cadastrada. Adicione a primeira acima.</li>';
}

function renderAlerts(){
  const a = S.exams
    .map(e => ({ ...e, k: dayTo(e.d) }))
    .filter(e => e.k >= 0 && e.k <= 7)
    .sort((a,b) => a.k - b.k);

  $('alerts').innerHTML = a.map(e => {
    const r = (S.conf[e.s] || 3) <= 2;
    const hot = e.k <= 3 || r;
    const c = hot ? '#f43f5e' : '#f59e0b';
    return `<div class="flex items-center gap-3 rounded-xl p-3.5 border"
                 style="border-color:${c}66;background:${c}14">
      <div class="w-2 h-10 rounded" style="background:${c}"></div>
      <div class="text-sm flex-1">
        <b>Prova de ${e.s} ${e.k===0 ? 'é hoje' : e.k===1 ? 'é amanhã' : 'em ' + e.k + ' dias'}</b><br>
        <span class="mu">${r ? 'Sua confiança está baixa. Reserve uma sessão de foco agora.' : 'Revise seus erros antes da prova.'}</span>
      </div>
      <button class="btn2 shrink-0" onclick="go('foco')">Estudar</button>
    </div>`;
  }).join('');
}

/* ---------- FOCO ---------- */
let dur = 25, left = 1500, timer = null, running = false, startSub = '';

const DUR = [[25,'25 min'],[45,'45 min'],[15,'15 min'],[0.25,'Demo 15 s']];

function renderDurs(){
  $('durs').innerHTML = DUR.map(([m,l]) =>
    `<button class="chip ${dur===m?'on':''}" onclick="setDur(${m})">${l}</button>`).join('');
}

function setDur(m){
  if (running) return;
  dur = m;
  left = Math.round(m*60);
  draw();
  renderDurs();
}

function draw(){
  const m = Math.floor(left/60), s = left % 60;
  $('clock').textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  $('ring').style.strokeDashoffset = 282.7 * (1 - left / Math.round(dur*60));
}

function toggleFoco(){
  if (running) return cancelFoco('Sessão cancelada. Nenhum XP desta vez.');

  running = true;
  startSub = $('fSub').value;
  $('fSub').disabled = true;
  $('fSubL').textContent = startSub;
  $('focoBtn').textContent = 'Desistir';
  $('focoMsg').textContent = 'Foco total. Não saia desta tela.';
  $('focoMsg').style.color = 'var(--g)';

  timer = setInterval(() => {
    left--;
    draw();
    if (left <= 0) finishFoco();
  }, 1000);
}

function stopT(){
  clearInterval(timer);
  running = false;
  $('fSub').disabled = false;
  $('fSubL').textContent = '';
  $('focoBtn').textContent = 'Iniciar foco';
  left = Math.round(dur*60);
  draw();
}

function cancelFoco(m){
  stopT();
  $('focoMsg').textContent = m;
  $('focoMsg').style.color = '#f43f5e';
}

function finishFoco(){
  const xp = Math.max(5, Math.round(dur*2));
  stopT();

  const t = today();
  if (S.last !== t){
    const y = dISO(-1);
    S.streak = S.last === y ? S.streak + 1 : 1;
    S.last = t;
  }

  S.min += Math.max(1, Math.round(dur));
  S.hist.unshift({
    s: startSub,
    m: dur < 1 ? '15 s' : dur + ' min',
    xp,
    t: new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
  });
  S.hist = S.hist.slice(0,5);

  addXP(xp);
  $('focoMsg').textContent = 'Sessão concluída! +' + xp + ' XP';
  $('focoMsg').style.color = 'var(--g)';
  toast('+' + xp + ' XP ganhos');
  renderHist();
}

function renderHist(){
  $('hist').innerHTML = S.hist.length
    ? S.hist.map(h => `<li class="inset flex justify-between px-3 py-2">
        <span>${h.s} <span class="mu">${h.m} às ${h.t}</span></span>
        <b style="color:var(--g)">+${h.xp}</b></li>`).join('')
    : '<li class="mu">Nenhuma sessão ainda. Comece a primeira.</li>';
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && running) cancelFoco('Você saiu da tela e a sessão foi cancelada.');
});

/* ---------- CADERNO ---------- */
function addF(){
  const n = $('fNome').value.trim(), f = $('fForm').value.trim();
  if (!n || !f) return toast('Preencha o nome e a fórmula');
  S.formulas.push({ n, f, s: $('fSb').value });
  $('fNome').value = $('fForm').value = '';
  save(); renderCad(); toast('Fórmula salva');
}

function addE(){
  const t = $('eTopic').value.trim();
  if (!t) return toast('Informe o tópico do erro');
  const x = S.erros.find(e => e.t.toLowerCase() === t.toLowerCase() && e.s === $('eSub').value);
  x ? x.c++ : S.erros.push({ s: $('eSub').value, t, c: 1 });
  $('eTopic').value = '';
  save(); renderCad(); toast('Erro registrado');
}

function renderCad(){
  const q = $('fBusca').value.toLowerCase();

  const f = S.formulas
    .map((x,i) => ({ ...x, i }))
    .filter(x => (x.n + x.f + x.s).toLowerCase().includes(q));

  $('fList').innerHTML = f.length ? f.map(x => `
    <li class="inset p-3 flex justify-between gap-2">
      <div>
        <b>${esc(x.n)}</b> <span class="lbl">${x.s || ''}</span><br>
        <code style="color:var(--gl)" class="text-base">${esc(x.f)}</code>
      </div>
      <button aria-label="Remover"
              onclick="S.formulas.splice(${x.i},1);save();renderCad()"
              class="mu hover:text-rose-400">✕</button>
    </li>`).join('')
    : '<li class="mu">Nenhuma fórmula encontrada.</li>';

  $('eList').innerHTML = S.erros.length
    ? [...S.erros].sort((a,b) => b.c - a.c).map(x => `
        <li class="inset p-3">
          <div class="flex justify-between">
            <span><b>${esc(x.t)}</b> <span class="lbl">${x.s}</span></span>
            <b style="color:${x.c>=3?'#f43f5e':'#f59e0b'}">${x.c}x</b>
          </div>
          <div class="bar mt-2">
            <i style="width:${Math.min(100,x.c*25)}%;background:${x.c>=3?'#f43f5e':'#f59e0b'}"></i>
          </div>
        </li>`).join('')
    : '<li class="mu">Nenhum erro registrado. Ótimo sinal.</li>';
}

let mz = null;

function micro(){
  if (!S.erros.length) return $('micro').innerHTML = '<p class="mu text-sm">Registre um erro para começar o treino.</p>';

  const pool = S.erros.flatMap(e => Array(e.c).fill(e));
  const pick = [];
  while (pick.length < Math.min(3, S.erros.length)){
    const e = pool[Math.floor(Math.random()*pool.length)];
    if (!pick.includes(e)) pick.push(e);
  }
  mz = { q: pick, i: 0, ok: 0 };
  mStep();
}

function mStep(){
  if (mz.i >= mz.q.length){
    const xp = mz.ok * 5;
    $('micro').innerHTML = `<div class="inset p-4 text-center">
      <div class="dsp text-xl font-bold" style="color:var(--g)">Treino concluído</div>
      <p class="mu text-sm mt-1">Você fixou ${mz.ok} de ${mz.q.length} tópicos${xp ? ' e ganhou ' + xp + ' XP' : ''}.</p>
    </div>`;
    return;
  }

  const e = mz.q[mz.i];
  const f = S.formulas.find(x => x.s === e.s);

  $('micro').innerHTML = `<div class="inset p-4">
    <div class="bar mb-3"><i style="width:${mz.i/mz.q.length*100}%;background:var(--g)"></i></div>
    <div class="lbl">${e.s} · tópico ${mz.i+1} de ${mz.q.length}</div>
    <div class="dsp font-bold text-lg my-1">${esc(e.t)}</div>
    <p class="text-sm mu">Explique este tópico em voz alta e resolva um exercício sem consultar nada.</p>
    <div id="hint" class="text-sm my-3">
      ${f ? `<button class="btn2" onclick="this.outerHTML='Dica do caderno: <b>${esc(f.n)}</b> <code style=\\'color:var(--gl)\\'>${esc(f.f)}</code>'">Mostrar dica</button>` : ''}
    </div>
    <div class="flex gap-2">
      <button class="btn flex-1" onclick="mAns(1)">Acertei</button>
      <button class="btn2 flex-1" onclick="mAns(0)">Preciso rever</button>
    </div>
  </div>`;
}

function mAns(ok){
  const e = mz.q[mz.i];
  if (ok){
    mz.ok++;
    e.c--;
    if (e.c <= 0) S.erros.splice(S.erros.indexOf(e), 1);
    addXP(5);
  } else {
    e.c++;
  }
  mz.i++;
  save(); renderCad(); mStep();
}

/* ---------- IA ---------- */
const KB = [
  [/pit[aá]goras|tri[aâ]ngulo ret/, 'No triângulo retângulo, **a² = b² + c²**: o quadrado da hipotenusa é a soma dos quadrados dos catetos. Exemplo: catetos 3 e 4 dão hipotenusa 5.'],
  [/bhaskara|segundo grau|2º grau|equa[cç][aã]o/, 'Para ax² + bx + c = 0, calcule **Δ = b² − 4ac**. Se Δ > 0 há duas raízes reais, se Δ = 0 há uma, e se Δ < 0 não há raiz real. Depois use x = (−b ± √Δ) / 2a.'],
  [/newton|for[cç]a|in[eé]rcia/, 'Leis de Newton: **1)** sem força resultante, o movimento não muda (inércia); **2)** F = m · a; **3)** toda ação tem uma reação de mesma intensidade em outro corpo.'],
  [/fotoss[ií]ntese/, 'Plantas usam luz para transformar **CO₂ + H₂O em glicose e O₂**, nos cloroplastos. Equação: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.'],
  [/revolu[cç][aã]o francesa/, 'Em 1789 a França tinha crise econômica e forte desigualdade. A **queda da Bastilha** marcou o início, e o lema era liberdade, igualdade e fraternidade.'],
  [/mitoc[oô]ndria|c[eé]lula/, 'A mitocôndria faz a **respiração celular** e produz a maior parte do ATP, a energia usada pela célula.'],
  [/porcentagem|%/, 'Porcentagem é uma fração de 100. Para achar 20% de 80, calcule 80 × 0,20 = **16**. Para aumentar 20%, multiplique por 1,20.'],
  [/\bmol\b|estequiometria/, '**1 mol = 6,02 × 10²³ partículas** (número de Avogadro). Com a massa molar em g/mol você converte massa em quantidade de matéria.'],
  [/guerra fria/, 'A Guerra Fria (1947–1991) foi a disputa política e ideológica entre **EUA e URSS**, sem confronto militar direto entre os dois.'],
  [/\b(oi|ol[aá]|bom dia|boa tarde|boa noite)\b/, 'Olá! Pergunte sobre qualquer matéria e eu explico de um jeito simples.']
];

const md = t => t.replace(/\*\*(.+?)\*\*/g, '<b style="color:var(--gl)">$1</b>');

const sugs = ['Explica Pitágoras','Como funciona Bhaskara?','Leis de Newton','O que é fotossíntese?','Guerra Fria'];

function bubble(t, me){
  const d = document.createElement('div');
  d.className = 'flex ' + (me ? 'justify-end' : '');
  d.innerHTML = `<div class="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${me ? '' : 'inset'}"
                      style="${me ? 'background:var(--g);color:#03130a;font-weight:500' : ''}">${t}</div>`;
  $('chat').appendChild(d);
  $('chat').scrollTop = 1e9;
  return d;
}

function send(t){
  const q = (t || $('msg').value).trim();
  if (!q) return;
  $('msg').value = '';
  bubble(esc(q), true);

  const th = bubble('<span class="mu">Pensando...</span>');

  setTimeout(() => {
    const k = KB.find(([r]) => r.test(q.toLowerCase()));
    th.firstChild.innerHTML = k ? md(k[1])
      : 'Ainda não tenho essa explicação nesta demonstração. Tente Pitágoras, Bhaskara, Newton, fotossíntese, células, porcentagem, mol ou Revolução Francesa. Na versão completa, uma IA real responde qualquer dúvida.';
    $('chat').scrollTop = 1e9;
  }, 650);
}

$('sugs').innerHTML = sugs.map(s => `<button class="chip" onclick="send('${s}')">${s}</button>`).join('');
bubble('Olá! Sou o **Assistente 360**. Tire sua dúvida em linguagem de ensino médio.');

/* ---------- RANKING ---------- */
const B = {
  mun:[
    ['NinjaDaFísica','🥷',940],['ZeroAtraso','🦉',880],['CafeComCálculo','🐙',790],
    ['MestreDoENEM','🧠',720],['PandaFocado','🐼',640],['Lúcia_42','🦄',580],['BioHacker','🌵',410]
  ],
  est:[
    ['SuperNova','⚡',2310],['TigreDaMat','🐯',2150],['ReiDoFoco','🚀',1980],
    ['ClaraCódigo','🦊',1760],['Quimicando','🧪',1620],['HistóriaViva','📜',1500],['Atlas360','🌎',1390]
  ]
};

function setScope(s){ S.scope = s; save(); renderRank(); }

function renderRank(){
  $('tM').classList.toggle('on', S.scope === 'mun');
  $('tE').classList.toggle('on', S.scope === 'est');

  const L = [...B[S.scope].map(([n,a,x]) => ({ n,a,x })), { n:S.nick, a:S.av, x:S.xp, me:1 }]
    .sort((a,b) => b.x - a.x);
  const top = L.slice(0,3);

  const ord = [1,0,2], H = ['h-24','h-32','h-20'];
  $('podium').innerHTML = ord.map((i,k) => {
    const p = top[i];
    return `<div class="card !p-3 text-center flex flex-col justify-end ${H[k]} md:${H[k]}"
                 style="${p.me ? 'border-color:var(--g)' : ''};min-height:${[130,160,115][k]}px">
      <div class="text-3xl">${p.a}</div>
      <div class="font-bold text-sm truncate">${esc(p.n)}</div>
      <div class="lbl">${p.x} XP</div>
      <div class="dsp font-extrabold" style="color:var(--g)">${i+1}º</div>
    </div>`;
  }).join('');

  $('rankList').innerHTML = L.map((p,i) => `
    <li class="flex items-center gap-3 rounded-xl px-3 py-2.5 ${p.me ? '' : 'inset'}"
        style="${p.me ? 'background:rgba(34,197,94,.12);border:1px solid var(--g)' : ''}">
      <span class="w-7 text-center dsp font-bold ${i<3 ? '' : 'mu'}" style="${i<3 ? 'color:var(--g)' : ''}">${i+1}</span>
      <span class="text-2xl">${p.a}</span>
      <span class="flex-1 font-semibold truncate">${esc(p.n)}${p.me ? ' <span class="lbl">(você)</span>' : ''}</span>
      <span class="font-bold" style="color:var(--g)">${p.x} XP</span>
    </li>`).join('');

  $('avPick').innerHTML = AVS.map(a =>
    `<button class="rounded-lg px-1.5 py-0.5"
             style="${a===S.av ? 'background:rgba(34,197,94,.2);outline:2px solid var(--g)' : ''}"
             onclick="S.av='${a}';save();head();renderRank()">${a}</button>`).join('');

  $('nickIn').value = S.nick;
}

function saveNick(){
  const n = $('nickIn').value.trim();
  if (n.length < 3) return toast('Use pelo menos 3 caracteres');
  S.nick = n;
  save(); head(); renderRank();
  toast('Apelido salvo. Nenhum nome real é exibido.');
}

/* ---------- INIT ---------- */
const opts = SUBS.map(s => `<option>${s}</option>`).join('');
['exSub','fSub','fSb','eSub'].forEach(i => $(i).innerHTML = opts);

head();
renderCad();
renderDurs();
draw();
go('dash');
