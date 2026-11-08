(()=>{
const CY="#3ba4ff";
const rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255].join(",")};
const h2x=(h,s=.75,l=.55)=>{const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,"0")};return"#"+f(0)+f(8)+f(4)};
const _t=theme;theme=function(){_t();document.documentElement.style.setProperty("--accrgb",rgb(S.acc))};
const _s=saveS;saveS=function(){const r=document.documentElement;r.classList.add("tt");clearTimeout(window._tt);window._tt=setTimeout(()=>r.classList.remove("tt"),500);_s()};
THEMES.splice(0,1,["Celeste",CY]);
if(!S.v2){if(S.acc=="#7c3aed")S.acc=CY;S.v2=1;saveS()}else theme();

/* iconos y cabecera */
const IC={home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',themes:'<path d="M12 3a9 9 0 1 0 0 18c1.7 0 2-1 1.4-2-.6-1 0-2.3 1.4-2.3H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',sett:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>'};
const svg=p=>`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
$$("#nav button").forEach(b=>b.querySelector("span").innerHTML=svg(IC[b.dataset.t]));
$(".logo").innerHTML=svg('<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/>');
$(".top p").textContent="Tus ideas, siempre contigo 💙";

/* estados vacíos */
const _r=render;render=function(){_r();const c=$("#cards"),q=$("#q").value;
  if(c.querySelector(".card:not(.newc)"))return;
  const E=q?["🔍","Sin resultados","Prueba con otra palabra."]:{all:["✨","Aún no tienes notas","Toca “Nueva nota” y empieza a escribir."],rec:["🕘","Nada reciente","Aquí verás las notas de los últimos 7 días."],fav:["⭐","Sin favoritas","Marca una nota con ⭐ para verla aquí."],arc:["📦","Nada archivado","Las notas archivadas se guardan aquí."],trash:["🗑️","Papelera vacía","Lo que borres se queda aquí hasta vaciarla."]}[sec];
  c.querySelectorAll("p.mut").forEach(x=>x.remove());
  c.insertAdjacentHTML("beforeend",`<div class="empty"><div class="ei">${E[0]}</div><b>${E[1]}</b><p>${E[2]}</p></div>`)};

/* calendario */
const _c=cal;cal=function(){_c();const h=$("#cal h3");if(!h)return;
  const[y,m,d]=cs.split("-");h.textContent=new Date(y,m-1,d).toLocaleDateString([],{weekday:"long",day:"numeric",month:"long"});
  const p=document.createElement("div");p.className="dayp";h.before(p);p.append(h,$("#cl"));
  if(!$("#cl .item"))$("#cl").innerHTML='<div class="empty"><div class="ei">😴</div><b>¡Qué día tan tranquilo!</b><p>Sin notas ni recordatorios este día.</p></div>'};

/* ajustes en secciones */
const _rs=renderSet;renderSet=function(){_rs();const s=$("#sett"),I={Apariencia:"🎨",Seguridad:"🔒",Papelera:"🗑️",Datos:"💾",Cuenta:"👤"},B={"Tipo de letra":"🔤","Diseño de tarjetas":"🧩","Vaciar automáticamente":"⏱️"};let g=null;
  [...s.children].slice(1).forEach(k=>{if(k.tagName=="H3"){const t=k.textContent;k.innerHTML=`<span>${I[t]||"•"}</span>${t}`;g=document.createElement("div");g.className="grp";k.after(g)}else if(g)g.append(k)});
  s.querySelectorAll(".item b").forEach(b=>{if(B[b.textContent])b.textContent=B[b.textContent]+" "+b.textContent})};

/* temas */
const pre=c=>{$("#pv").style.background=`linear-gradient(135deg,${c},${mix(c)})`};
renderThemes=function(){
  $("#themes").innerHTML=`<div class="ph"><h2>Temas</h2><i>🎨</i></div><h3>Color principal</h3><div class="tgrid">${THEMES.map(([n,c])=>`<button class="tcard${S.acc==c?" sel":""}" data-c="${c}" style="background:linear-gradient(135deg,${c},${mix(c)})">${n}${S.acc==c?'<i class="ck">✓</i>':""}</button>`).join("")}</div><h3>Modo</h3><div class="seg"><button data-m="0" class="${S.light?"":"on"}">🌙 Oscuro</button><button data-m="1" class="${S.light?"on":""}">☀️ Claro</button></div><h3>Color personalizado</h3><div class="grp"><div id="pv">Vista previa</div><input id="hue" type="range" min="0" max="360" value="200"><input id="hx" placeholder="#3BA4FF" value="${S.acc}"><div class="row" style="margin:10px 0 0"><button class="big2" id="hxb">Aplicar</button><button id="hxr">Restaurar tema</button></div></div>`;
  pre(S.acc);
  $$(".tcard").forEach(b=>b.onclick=()=>{S.acc=b.dataset.c;saveS();renderThemes()});
  $$("[data-m]").forEach(b=>b.onclick=()=>{S.light=b.dataset.m=="1";saveS();renderThemes()});
  $("#hue").oninput=e=>{const c=h2x(+e.target.value);$("#hx").value=c;pre(c)};
  $("#hx").oninput=e=>{if(/^#[0-9a-fA-F]{6}$/.test(e.target.value))pre(e.target.value)};
  $("#hxb").onclick=()=>{const v=$("#hx").value.trim();if(/^#[0-9a-fA-F]{6}$/.test(v)){S.acc=v;saveS();renderThemes()}else toast("Usa el formato #RRGGBB")};
  $("#hxr").onclick=()=>{S.acc=CY;S.light=false;saveS();renderThemes();toast("Tema restaurado")}};
if(tab=="themes")renderThemes();
render();
})();
