(()=>{
if(!window.CPE||!FB.apiKey)return;
const Q=JSON.parse(localStorage.getItem("cpe_q")||"{}"),RS=new Set(JSON.parse(localStorage.getItem("cpe_rs")||"[]")),bigs=new Set();
const sQ=()=>localStorage.setItem("cpe_q",JSON.stringify(Q)),sR=()=>localStorage.setItem("cpe_rs",JSON.stringify([...RS]));
let busy=false,again=false,lastErr="",kt,st2;
const C=()=>window.CPE,U=()=>C().au().uid;
const badge=document.createElement("span");badge.id="syn";$(".top p").insertAdjacentElement("afterend",badge);
function ui(){const n=Object.keys(Q).length;badge.textContent=!C().au()?"☁️ Sin cuenta":bigs.size?`⚠️ ${bigs.size} nota(s) muy grande(s) sin subir`:lastErr?"⚠️ "+lastErr:!navigator.onLine?"📴 Sin conexión"+(n?` · ${n} pendientes`:""):busy?"🔄 Sincronizando…":n?`⏳ ${n} pendientes`:"✅ Sincronizado"}
async function call(f){try{return await f()}catch(e){if(e.code==401){await C().refresh();return await f()}throw e}}
const _dp=dbPut,_dd=dbDel;
dbPut=async n=>{const r=await _dp(n);Q[n.id]="p";sQ();ui();kick();return r};
dbDel=async id=>{const r=await _dd(id);Q[id]="d";sQ();ui();kick();return r};
const kick=()=>{clearTimeout(kt);kt=setTimeout(()=>run(false),1200)};

async function flush(){for(const id of Object.keys(Q)){const p="/users/"+U()+"/notes/"+id;
  if(Q[id]=="d"){try{await call(()=>C().fs(p,"DELETE"))}catch(e){if(e.code!=404)throw e}RS.delete(id)}
  else{const n=notes.find(x=>x.id==id);if(n){const d=JSON.stringify({...n,thumb:"",txt:""});
    if(d.length>9e5)bigs.add(id);else{bigs.delete(id);await call(()=>C().fpatch(p,{data:d,updated:n.updated||0}));RS.add(id)}}}
  delete Q[id];sQ();sR()}}
async function pull(){const u=U();let tk="",ids=new Set(),ch=0;
  do{const r=await call(()=>C().fs("/users/"+u+"/notes?pageSize=100"+(tk?"&pageToken="+encodeURIComponent(tk):"")));
    for(const d of r.documents||[]){const id=d.name.split("/").pop();ids.add(id);if(Q[id]=="d")continue;let rem;try{rem=JSON.parse(d.fields.data.stringValue)}catch(e){continue}
      const loc=notes.find(x=>x.id==id);RS.add(id);
      if(!loc||(rem.updated||0)>(loc.updated||0)){idx(rem);await _dp(rem);if(loc)notes[notes.indexOf(loc)]=rem;else notes.push(rem);ch++}}
    tk=r.nextPageToken||""}while(tk);
  for(const x of[...notes])if(RS.has(x.id)&&!ids.has(x.id)&&!Q[x.id]){await _dd(x.id);notes.splice(notes.indexOf(x),1);RS.delete(x.id);ch++}
  notes.forEach(n=>{if(!RS.has(n.id)&&!Q[n.id])Q[n.id]="p"});sQ();sR();if(ch){render();cal()}}
async function pushS(){await call(()=>C().fpatch("/users/"+U()+"/meta/settings",{data:JSON.stringify(S),ts:S.ts||0}))}
async function pullS(first){let r=null;try{r=await call(()=>C().fs("/users/"+U()+"/meta/settings"))}catch(e){if(e.code!=404)throw e}
  if(!r)return pushS();const rem=JSON.parse(r.fields.data.stringValue);
  if(first||(rem.ts||0)>(S.ts||0)){Object.assign(S,rem);localStorage.setItem("cpe",JSON.stringify(S));theme();render();go(tab)}else if((S.ts||0)>(rem.ts||0))await pushS()}
async function run(full){if(!C().au()||!navigator.onLine)return ui();if(busy){again=true;return}busy=true;lastErr="";ui();
  try{if(full){const own=localStorage.getItem("cpe_owner"),u=U();
      if(own&&own!=u){if(Object.keys(Q).length)throw{code:"owner"};for(const x of[...notes])await _dd(x.id);notes=[];RS.clear();sR()}
      await pullS(own!=u);await pull();localStorage.setItem("cpe_owner",u)}
    await flush()}
  catch(e){lastErr=e.code=="owner"?"Hay cambios sin subir de otra cuenta":e instanceof TypeError?"Sin conexión":e.code==403?"Sin permiso: publica las reglas nuevas":"Error de sincronización ("+(e.code||"red")+")"}
  busy=false;ui();if(again){again=false;run(false)}}
const _s=saveS;saveS=function(){S.ts=Date.now();_s();clearTimeout(st2);st2=setTimeout(()=>{if(C().au()&&navigator.onLine)call(pushS).catch(()=>{})},1500)};
const _rs=renderSet;renderSet=function(){_rs();const b=$("#so");if(b){b.closest(".grp").insertAdjacentHTML("beforeend",'<button class="mi" id="sy">☁️ Sincronizar ahora</button>');$("#sy").onclick=()=>{toast("Sincronizando…");run(true)}}};
addEventListener("online",()=>run(true));document.addEventListener("visibilitychange",()=>{if(!document.hidden)run(true)});
setInterval(()=>run(true),6e4);setInterval(ui,5e3);
const w=setInterval(()=>{if(C().au()){clearInterval(w);run(true)}},2000);ui();
})();
