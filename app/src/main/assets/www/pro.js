(()=>{
if(!S.folders){S.folders=[["Estudios","📚","#3ba4ff"],["Trabajo","💼","#f59e0b"],["Personal","🏠","#10b981"],["Ideas","💡","#eab308"],["Proyectos","🚀","#8b5cf6"]].map(([name,icon,color])=>({name,icon,color}));saveS()}
if(!S.tags){S.tags={};saveS()}
let sf="all",ff="";
const ov=document.createElement("div");ov.id="pro";ov.className="ov";document.body.append(ov);
const pro=(t,h,b)=>{ov.classList.add("on");ov.innerHTML=`<div class="row"><button id="pb" aria-label="Volver">←</button><h2 style="flex:1">${t}</h2></div>${h}`;$("#pb").onclick=closePro;b&&b()};
const closePro=()=>{ov.classList.remove("on");ov.innerHTML=""};
const ob=window.onBack;window.onBack=()=>{if(ov.classList.contains("on")){closePro();return true}return ob()};
const pick=(s,f,k)=>$$(s+" .sw").forEach(b=>{if(b.dataset.v==f[k])b.classList.add("on");b.onclick=()=>{f[k]=b.dataset.v;$$(s+" .sw").forEach(x=>x.classList.toggle("on",x==b))}});
const COL=TXT.slice(4),sws=(id,a,ic)=>`<div class="sg" id="${id}">${a.map(c=>`<button class="sw${ic?" ic":""}" data-v="${c}" ${ic?"":`style="background:${c}"`}>${ic?c:""}</button>`).join("")}</div>`;

/* ---- carpetas ---- */
function folders(){pro("Carpetas",`<div id="fl" style="margin-top:12px"></div><button class="big2 mi" id="fn">＋ Nueva carpeta</button>`,()=>{
  S.folders.forEach((f,i)=>{const d=document.createElement("div");d.className="item";d.innerHTML=`<i class="fi" style="background:${f.color}">${f.icon}</i><b>${esc(f.name)}</b><small>${notes.filter(x=>!x.trash&&x.folder==f.name).length}</small><button aria-label="Opciones">⋮</button>`;
    d.onclick=()=>{closePro();ff=f.name;sec="all";go("home");render()};
    d.querySelector("button").onclick=e=>{e.stopPropagation();menu(f.name,[["✏️ Editar",()=>fedit(i)],["🗑️ Eliminar",()=>confirm("¿Eliminar la carpeta? Tus notas se conservan sin carpeta.")&&fdel(i)]])};$("#fl").append(d)});
  $("#fn").onclick=()=>fedit(-1)})}
function fedit(i){const f=i<0?{name:"",icon:"📁",color:"#3ba4ff"}:{...S.folders[i]},old=f.name;
  sheet(i<0?"Nueva carpeta":"Editar carpeta",`<input id="fnm" placeholder="Nombre" value="${esc(f.name)}"><label>Icono</label>${sws("fic",["📁","📚","💼","🏠","💡","🚀","🎯","🎵","🛒","✈️"],1)}<label>Color</label>${sws("fco",COL)}<button class="big2 mi" id="fsv" style="margin-top:14px">Guardar</button>`,()=>{
    pick("#fic",f,"icon");pick("#fco",f,"color");
    $("#fsv").onclick=async()=>{const n=$("#fnm").value.trim();if(!n)return toast("Escribe un nombre");if(S.folders.some((x,j)=>j!=i&&x.name.toLowerCase()==n.toLowerCase()))return toast("Ya existe esa carpeta");f.name=n;
      if(i<0)S.folders.push(f);else{S.folders[i]=f;if(old!=n)for(const x of notes)if(x.folder==old){x.folder=n;await dbPut(x)}}
      saveS();closeSheet();folders();render();toast("Carpeta guardada ✓")}})}
async function fdel(i){const nm=S.folders[i].name;for(const x of notes)if(x.folder==nm){x.folder="";await dbPut(x)}S.folders.splice(i,1);saveS();folders();render()}
const mv=(n,f,e)=>{if(e){n.folder=f;meta();touch()}else patch(n,{folder:f});toast(f?"Movida a "+f:"Sin carpeta")};
const moveTo=(n,e)=>menu("Mover a carpeta",[["Sin carpeta",()=>mv(n,"",e)],...S.folders.map(f=>[f.icon+" "+f.name,()=>mv(n,f.name,e)])]);

/* ---- etiquetas ---- */
const tcol=t=>S.tags[t]||S.acc,allT=()=>[...new Set([...Object.keys(S.tags),...notes.flatMap(n=>n.tags||[])])];
function tags(){pro("Etiquetas",`<div id="tl" style="margin-top:12px"></div><button class="big2 mi" id="tn">＋ Nueva etiqueta</button>`,()=>{
  allT().forEach(t=>{const d=document.createElement("div");d.className="item";d.innerHTML=`<i class="fi" style="background:${tcol(t)}">#</i><b>${esc(t)}</b><small>${notes.filter(n=>!n.trash&&(n.tags||[]).includes(t)).length}</small><button aria-label="Opciones">⋮</button>`;
    d.onclick=()=>{closePro();$("#q").value=t;sf="tags";$("#q").classList.remove("hid");$("#sfc").classList.remove("hid");go("home");render()};
    d.querySelector("button").onclick=e=>{e.stopPropagation();menu(t,[["✏️ Editar",()=>tedit(t)],["🗑️ Eliminar",()=>confirm("¿Quitar esta etiqueta de todas las notas?")&&tdel(t)]])};$("#tl").append(d)});
  $("#tn").onclick=()=>tedit("")})}
async function tdel(t){delete S.tags[t];for(const n of notes)if((n.tags||[]).includes(t)){n.tags=n.tags.filter(x=>x!=t);await dbPut(n)}saveS();tags();render()}
function tedit(old){const f={color:tcol(old||"_")};
  sheet(old?"Editar etiqueta":"Nueva etiqueta",`<input id="tnm" placeholder="Nombre" value="${esc(old)}"><label>Color</label>${sws("tco",COL)}<button class="big2 mi" id="tsv" style="margin-top:14px">Guardar</button>`,()=>{pick("#tco",f,"color");
    $("#tsv").onclick=async()=>{const n=$("#tnm").value.trim().replace(/[\s,#]/g,"");if(!n)return toast("Escribe un nombre");
      if(old&&old!=n){delete S.tags[old];for(const x of notes)if((x.tags||[]).includes(old)){x.tags=x.tags.map(t=>t==old?n:t);await dbPut(x)}}
      S.tags[n]=f.color;saveS();closeSheet();tags();render();toast("Etiqueta guardada ✓")}})}
function pickTags(n,e){n.tags=n.tags||[];const commit=()=>e?(meta(),touch()):patch(n,{tags:n.tags});
  sheet("Etiquetas de la nota",`<div class="tgs" id="pt">${allT().map(t=>`<button class="tg" data-t="${esc(t)}">#${esc(t)}</button>`).join("")||"<p class='mut'>Aún no hay etiquetas. Crea una abajo.</p>"}</div><input id="pn" placeholder="Nueva etiqueta y Enter" style="margin-top:12px">`,()=>{
    const paint=()=>$$("#pt .tg").forEach(b=>{const on=n.tags.includes(b.dataset.t);b.style.background=on?tcol(b.dataset.t):"";b.style.color=on?"#fff":""});paint();
    $$("#pt .tg").forEach(b=>b.onclick=()=>{const t=b.dataset.t;n.tags=n.tags.includes(t)?n.tags.filter(x=>x!=t):[...n.tags,t];paint();commit()});
    $("#pn").onkeydown=ev=>{if(ev.key=="Enter"){const t=ev.target.value.trim().replace(/[\s,#]/g,"");if(t){S.tags[t]=S.tags[t]||S.acc;if(!n.tags.includes(t))n.tags.push(t);saveS();commit();pickTags(n,e)}}}})}

/* ---- recordatorios ---- */
const nowK=()=>{const d=new Date();return key(d)+"T"+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
function rems(){const L=notes.filter(n=>n.reminder&&!n.trash).sort((a,b)=>a.reminder<b.reminder?-1:1),P=L.filter(n=>!n.rcomp),C=L.filter(n=>n.rcomp),nk=nowK();
  pro("Recordatorios",`<h3>Pendientes (${P.length})</h3><div id="rp"></div><h3>Completados (${C.length})</h3><div id="rc"></div>`,()=>{
    [[P,"#rp",0],[C,"#rc",1]].forEach(([a,s,dn])=>{if(!a.length)$(s).innerHTML="<p class='mut'>Nada por aquí. Añade un recordatorio desde las opciones de una nota.</p>";
      a.forEach(n=>{const r=document.createElement("div"),od=!dn&&n.reminder<=nk;r.className="item";r.innerHTML=`<div style="flex:1"><b>${esc(n.title)}</b><br><small style="${od?"color:#f87171":""}">${od?"⚠️":"⏰"} ${n.reminder.replace("T"," ")}</small></div><button aria-label="${dn?"Reabrir":"Completar"}">${dn?"↩":"✓"}</button>`;
        r.onclick=()=>{closePro();open(n)};r.querySelector("button").onclick=async e=>{e.stopPropagation();await patch(n,{rcomp:!dn});rems()};$(s).append(r)})})})}
function sched(n){if(!window.Android||!Android.schedule)return;if(!n.reminder){if(n.sch){Android.cancel(n.id);n.sch=false}return}
  const t=new Date(n.reminder).getTime();if(!n.rcomp&&!n.trash&&t>Date.now()){Android.schedule(n.id,n.title||"Recordatorio",t);n.sch=true}else{Android.cancel(n.id);n.sch=false}}
const _p=patch;patch=async function(n,o){await _p(n,o);sched(n)};
const _d=del;del=async function(n){window.Android&&Android.cancel&&Android.cancel(n.id);await _d(n)};
setTimeout(()=>notes.forEach(sched),4000);

/* ---- estadísticas ---- */
function stats(){const A=notes.filter(n=>!n.trash);let dn=0,td=0;
  A.forEach(n=>(n.pages.map(p=>p.html).join("").match(/<input[^>]*type="checkbox"[^>]*>/g)||[]).forEach(x=>/checked/.test(x)?dn++:td++));
  const days=[...Array(7)].map((_,i)=>{const d=new Date(Date.now()-(6-i)*864e5),k=key(d);return[d.toLocaleDateString([],{weekday:"short"}),A.filter(n=>key(new Date(n.updated))==k).length]}),mx=Math.max(1,...days.map(x=>x[1])),pc=dn+td?Math.round(dn*100/(dn+td)):0;
  const C=[["📝","Notas",A.length],["⭐","Favoritas",A.filter(n=>n.fav).length],["📦","Archivadas",A.filter(n=>n.arch).length],["📌","Fijadas",A.filter(n=>n.pin).length],["📁","Carpetas",S.folders.length],["🏷️","Etiquetas",allT().length]];
  pro("Estadísticas",`<div class="sgrid" style="margin-top:12px">${C.map(([i,l,v])=>`<div class="stc">${i}<b>${v}</b><small>${l}</small></div>`).join("")}</div><div class="stc" style="margin-bottom:12px"><b>${pc}%</b><small>Tareas completadas: ${dn} de ${dn+td} · Pendientes: ${td}</small><div class="bar"><i style="width:${pc}%"></i></div></div><div class="stc"><small>Actividad reciente (últimos 7 días)</small><div class="cols" style="margin-top:10px">${days.map(([d,v])=>`<div><i style="height:${Math.round(v/mx*70)}px"></i>${v}<br>${d}</div>`).join("")}</div></div>`)}

/* ---- inicio: acciones rápidas, búsqueda avanzada, fijadas ---- */
$(".chips").insertAdjacentHTML("afterend",`<div class="qa">${[["📁","Carpetas"],["🏷️","Etiquetas"],["⏰","Recordatorios"],["📊","Estadísticas"]].map(([i,l])=>`<button><b>${i}</b>${l}</button>`).join("")}</div>`);
$$(".qa button").forEach((b,i)=>b.onclick=[folders,tags,rems,stats][i]);
$("#q").insertAdjacentHTML("afterend",`<div class="chips hid" id="sfc">${[["all","Todo"],["title","Título"],["txt","Contenido"],["folder","Carpeta"],["tags","Etiqueta"]].map(([k,l])=>`<button data-k="${k}" class="${k==sf?"on":""}">${l}</button>`).join("")}</div>`);
$$("#sfc button").forEach(b=>b.onclick=()=>{sf=b.dataset.k;$$("#sfc button").forEach(x=>x.classList.toggle("on",x==b));render()});
$("#sbtn").addEventListener("click",()=>$("#sfc").classList.toggle("hid",$("#q").classList.contains("hid")));
$("#q").oninput=(()=>{let t;return()=>{clearTimeout(t);t=setTimeout(render,150)}})();
$("#fold").onchange=e=>{ff=e.target.value;render()};
filt=function(){const q=$("#q").value.toLowerCase(),w=Date.now()-6048e5,k=S.sort,F={all:["title","txt","folder","tags"],title:["title"],txt:["txt"],folder:["folder"],tags:["tags"]}[sf],val=(n,f)=>f=="tags"?(n.tags||[]).join(" "):f=="txt"?(n.lock?"":n.txt||""):(n[f]||"");
  return notes.filter(n=>{if(sec=="trash")return n.trash;if(n.trash)return false;if(sec=="arc")return n.arch;if(n.arch)return false;if(sec=="fav"&&!n.fav)return false;if(sec=="rec"&&n.updated<w)return false;if(ff&&n.folder!=ff)return false;return!q||F.some(f=>val(n,f).toLowerCase().includes(q))})
  .sort((x,y)=>(y.pin?1:0)-(x.pin?1:0)||(k=="name"?x.title.localeCompare(y.title):k=="cat"?(x.folder||"~").localeCompare(y.folder||"~"):y.updated-x.updated))};
const gh=t=>{const d=document.createElement("div");d.className="gh";d.textContent=t;return d};
const _r=render;render=function(){const names=[...new Set([...S.folders.map(f=>f.name),...notes.map(n=>n.folder).filter(Boolean)])];if(ff&&!names.includes(ff))ff="";_r();
  const fo=$("#fold");fo.innerHTML='<option value="">📁 Todas</option>'+names.map(f=>`<option>${esc(f)}</option>`).join("");fo.value=ff;
  const list=filt(),cs2=$$("#cards .card:not(.newc)");
  list.forEach((n,i)=>{const c=cs2[i];if(!c)return;
    c.querySelectorAll(".tgs em").forEach(e=>{const t=e.textContent.slice(1),col=S.tags[t];if(col){e.style.background=col+"33";e.style.color=col;e.style.border="1px solid "+col+"66"}e.onclick=ev=>{ev.stopPropagation();$("#q").value=t;sf="tags";$("#q").classList.remove("hid");$("#sfc").classList.remove("hid");render()}});
    const sm=c.querySelector("small"),f=n.folder&&S.folders.find(x=>x.name==n.folder);
    if(n.folder)sm.insertAdjacentHTML("beforeend",` · ${f?f.icon:"📁"} ${esc(n.folder)}`);
    if(n.trash)sm.insertAdjacentHTML("beforeend",` · Eliminada ${fmt(n.trash)}`+(S.trashDays?` · se borra en ${Math.max(0,Math.ceil(S.trashDays-(Date.now()-n.trash)/864e5))} d`:""));
    if(n.pin&&sec!="trash")c.classList.add("pinned")});
  if(sec!="trash"){const p=$("#cards .pinned");if(p){p.before(gh("📌 Fijadas"));const o=$("#cards .card:not(.pinned):not(.newc)");o&&o.before(gh("Notas"))}}
  if(sec=="trash"&&list.length){$("#cards").insertAdjacentHTML("afterbegin",'<button class="mi" id="te" style="grid-column:1/-1">🗑️ Vaciar papelera ahora</button>');
    $("#te").onclick=async()=>{if(!confirm("¿Eliminar para siempre todas las notas de la papelera?"))return;for(const n of notes.filter(n=>n.trash))await dbDel(n.id);notes=notes.filter(n=>!n.trash);render();toast("Papelera vacía")}}};
const _c=cmenu;cmenu=function(n){if(n.trash)return menu(n.title,[["♻️ Restaurar",()=>patch(n,{trash:0})],["❌ Eliminar definitivamente",()=>confirm("¿Eliminar para siempre? No se puede deshacer.")&&del(n)]]);
  menu(n.title,[[n.pin?"Desfijar":"📌 Fijar arriba",()=>patch(n,{pin:!n.pin})],[n.fav?"Quitar de favoritas":"⭐ Favorita",()=>patch(n,{fav:!n.fav})],["📁 Mover a carpeta",()=>moveTo(n)],["🏷️ Etiquetas",()=>pickTags(n)],[n.arch?"📂 Desarchivar":"📦 Archivar",()=>patch(n,{arch:!n.arch})],["📤 Compartir como texto",()=>share(n)],["🗑️ A la papelera",()=>confirm("¿Mover a la papelera?")&&patch(n,{trash:Date.now()})]])};

/* ---- editor ---- */
const _o=opts;opts=function(){_o();const b=$("#ob");if(!b)return;[["📁 Mover a carpeta",()=>moveTo(note,1)],["🏷️ Elegir etiquetas",()=>pickTags(note,1)]].forEach(([l,f])=>{const x=document.createElement("button");x.className="mi";x.textContent=l;x.onclick=()=>{closeSheet();f()};b.append(x)})};
const _m=meta;meta=function(){_m();const d=note&&(note.created||note.updated);if(d)$("#meta").insertAdjacentHTML("beforeend",`<small style="width:100%">Creada ${fmt(d)} · Editada ${fmt(note.updated||d)}</small>`)};
const _sv=save;save=async function(){const n=note;await _sv();if(note)meta();if(n){sched(n);const s=$("#stat");s.classList.remove("pu");void s.offsetWidth;s.classList.add("pu")}};

/* ---- ajustes: estilos de tarjeta ---- */
const _rs=renderSet;renderSet=function(){_rs();const s=$("#sc");if(s)s.innerHTML=[["glass","Cristal"],["mini","Minimalista"],["grad","Degradado"],["solid","Sólido"],["clear","Transparente"],["compact","Compacto"]].map(([v,l])=>`<option value="${v}"${S.card==v?" selected":""}>${l}</option>`).join("")};

/* ---- accesibilidad y bienvenida ---- */
[["#sbtn","Buscar"],["#fab","Nueva nota"],["#eback","Volver"],["#efav","Marcar como favorita"],["#emore","Opciones de la nota"],["#vg","Vista de cuadrícula"],["#vl","Vista de lista"],["#prev","Página anterior"],["#next","Página siguiente"],["#addp","Añadir página"],["#delp","Eliminar página"]].forEach(([s,l])=>$(s)&&$(s).setAttribute("aria-label",l));
if(!S.welcome){const w=document.createElement("div");w.id="wel";w.className="ov on";w.style.zIndex=95;
  w.innerHTML=`<div style="text-align:center;margin-top:7vh"><div class="logo" style="margin:0 auto 16px;width:84px;height:84px;font-size:40px">📝</div><h1>Bienvenido a Cpe Notes</h1><p class="mut">Tus ideas, siempre contigo 💙</p></div><div class="grp" style="margin-top:22px">${[["✍️","Escribe con formato","Colores, listas, tareas, imágenes y audio."],["📁","Organiza","Carpetas, etiquetas, fijadas y favoritas."],["⏰","Recuerda","Recordatorios con notificación."],["📊","Mide tu progreso","Estadísticas y tareas completadas."]].map(([i,t,d])=>`<div class="item"><span style="font-size:26px">${i}</span><div style="flex:1"><b>${t}</b><br><small>${d}</small></div></div>`).join("")}</div><button class="big" id="wgo" style="margin-top:20px">Empezar</button>`;
  document.body.append(w);$("#wgo").onclick=()=>{S.welcome=1;saveS();w.remove()}}
render();
})();
