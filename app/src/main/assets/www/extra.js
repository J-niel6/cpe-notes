(()=>{
if(typeof FB=="undefined")window.FB={apiKey:"",projectId:""};
let au=JSON.parse(localStorage.getItem("cpe_auth")||"null"),tok="",lastRef=0,adm=null,off=false,hbt=null;
const store=()=>au?localStorage.setItem("cpe_auth",JSON.stringify(au)):localStorage.removeItem("cpe_auth");
const stl=document.createElement("style");
stl.textContent=".ov{position:fixed;inset:0;background:var(--bg);color:var(--txt);z-index:100;overflow:auto;padding:22px;display:none}.ov.on{display:block}#adm{z-index:90}.ov input{margin:6px 0}.big{width:100%;padding:13px;margin-top:10px;background:linear-gradient(145deg,var(--acc),var(--acc2));color:#fff}.err{color:#f87171;min-height:22px;font-size:14px}.ur{display:flex;gap:8px;align-items:center;padding:10px;background:var(--card);border-radius:14px;margin-bottom:8px;border:1px solid var(--line)}.ur div{flex:1;font-size:13px}.ur b{font-size:15px}";
document.head.append(stl);
["auth","adm"].forEach(i=>{const d=document.createElement("div");d.id=i;d.className="ov";document.body.append(d)});

/* ---- Firebase por REST ---- */
const U=()=>`https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents`;
const fv=v=>v&&v.ts?{timestampValue:new Date(v.ts).toISOString()}:typeof v=="number"?{integerValue:String(v)}:{stringValue:String(v)};
const tf=o=>({fields:Object.fromEntries(Object.entries(o).map(([k,v])=>[k,fv(v)]))});
const fo=d=>Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,v.integerValue!=null?+v.integerValue:v.timestampValue?Date.parse(v.timestampValue):v.stringValue]));
async function fs(p,m="GET",body){const r=await fetch(U()+p,{method:m,headers:{"Content-Type":"application/json",Authorization:"Bearer "+tok},body:body?JSON.stringify(body):undefined});const j=r.status==204?{}:await r.json().catch(()=>({}));if(!r.ok)throw{code:r.status,message:(j.error&&j.error.message)||"error"};return j}
const fpatch=(p,o)=>fs(p+"?"+Object.keys(o).map(k=>"updateMask.fieldPaths="+k).join("&"),"PATCH",tf(o));
async function idt(a,b){const r=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:"+a+"?key="+FB.apiKey,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});const j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||"error");return j}
async function refresh(){const r=await fetch("https://securetoken.googleapis.com/v1/token?key="+FB.apiKey,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=refresh_token&refresh_token="+au.rt});const j=await r.json();if(!r.ok)throw 0;tok=j.id_token;au.rt=j.refresh_token;lastRef=Date.now();store()}
const msg=x=>{const m=String(x&&x.message||x);return x instanceof TypeError?"Sin conexión a internet":/EMAIL_EXISTS/.test(m)?"Ese correo ya está registrado":/INVALID_LOGIN|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(m)?"Correo o contraseña incorrectos":/WEAK_PASSWORD/.test(m)?"La contraseña necesita al menos 6 caracteres":/INVALID_EMAIL/.test(m)?"Correo no válido":m}

/* ---- cuentas ---- */
async function signup(email,user,pw){const name=user.toLowerCase().replace(/[^a-z0-9_]/g,"");if(name.length<3)throw new Error("El usuario necesita 3 letras o números como mínimo");
  const j=await idt("signUp",{email,password:pw,returnSecureToken:true});tok=j.idToken;au={uid:j.localId,email,user:name,rt:j.refreshToken};lastRef=Date.now();
  try{await fs("/usernames?documentId="+name,"POST",tf({uid:au.uid}))}catch(e){await idt("delete",{idToken:tok});au=null;throw new Error("Ese nombre de usuario ya existe")}
  await fpatch("/users/"+au.uid,{username:name,email,created:Date.now(),lastSeen:Date.now()});store()}
async function signin(email,pw){const j=await idt("signInWithPassword",{email,password:pw,returnSecureToken:true});tok=j.idToken;au={uid:j.localId,email,rt:j.refreshToken};lastRef=Date.now();try{au.user=fo(await fs("/users/"+au.uid)).username}catch(e){}store()}
async function banned(){try{const b=fo(await fs("/bans/"+au.uid));localStorage.setItem("cpe_ban",JSON.stringify(b));return b}catch(e){if(e.code==404){localStorage.removeItem("cpe_ban");return null}return JSON.parse(localStorage.getItem("cpe_ban")||"null")}}
function showBan(b){const a=$("#auth");a.classList.add("on");a.innerHTML=`<h2>🚫 Cuenta suspendida</h2><p>Un administrador suspendió tu acceso.</p><p><b>Razón:</b> ${esc(b.reason||"Sin razón indicada")}</p><button class="big" id="fo">Cerrar sesión</button>`;$("#fo").onclick=logout}
function logout(){au=null;store();localStorage.removeItem("cpe_ban");location.reload()}
async function hb(){if(!au)return;try{if(Date.now()-lastRef>45*6e4)await refresh();await fpatch("/users/"+au.uid,{lastSeen:Date.now()});const b=await banned();if(b)showBan(b)}catch(e){}}
function start(){$("#auth").classList.remove("on");hb();clearInterval(hbt);hbt=setInterval(hb,6e4)}
function forgot(){const a=$("#auth");a.innerHTML=`<h2>🔑 Recuperar contraseña</h2><p class="mut">Escribe el correo de tu cuenta. Te enviaremos un correo con un enlace seguro para crear una contraseña nueva.</p><input id="fe2" type="email" placeholder="Correo electrónico"><div class="err" id="fr2"></div><button class="big" id="fs2">Enviar correo</button><button class="big" id="fb2" style="background:var(--card2);box-shadow:none">Volver</button>`;
  $("#fb2").onclick=()=>showAuth("in");
  $("#fs2").onclick=async()=>{const m=$("#fe2").value.trim(),r=$("#fr2");r.style.color="";if(!/^\S+@\S+\.\S+$/.test(m))return r.textContent="Escribe un correo válido";r.textContent="Enviando…";
    try{await idt("sendOobCode",{requestType:"PASSWORD_RESET",email:m});r.style.color="#4ade80";r.textContent="✅ Listo. Revisa tu correo (y la carpeta de spam), toca el enlace y crea tu contraseña nueva. Después vuelve aquí e inicia sesión."}
    catch(x){r.textContent=/EMAIL_NOT_FOUND/.test(x.message)?"Ese correo no está registrado":msg(x)}}}
function showAuth(mode="in"){const a=$("#auth"),up=mode=="up";a.classList.add("on");
  a.innerHTML=`<h2>📝 Cpe Notes</h2><div class="seg"><button id="ti" class="${up?"":"on"}">Iniciar sesión</button><button id="tu" class="${up?"on":""}">Crear cuenta</button></div><p></p><input id="fe" type="email" placeholder="Correo electrónico"><input id="fu" class="${up?"":"hid"}" placeholder="Nombre de usuario"><input id="fp" type="password" placeholder="Contraseña (mín. 6)"><div class="err" id="fr"></div><button class="big" id="fb">${up?"Registrarme":"Entrar"}</button>${up?"":`<p style="text-align:center;margin-top:18px"><a id="ff" style="color:var(--acc2);text-decoration:underline">¿Has olvidado tu contraseña?</a></p>`}`;
  $("#ti").onclick=()=>showAuth("in");if(!up)$("#ff").onclick=forgot;$("#tu").onclick=()=>showAuth("up");
  $("#fb").onclick=async()=>{$("#fr").textContent="Un momento…";try{const e=$("#fe").value.trim(),p=$("#fp").value;if(up)await signup(e,$("#fu").value,p);else await signin(e,p);const b=await banned();if(b)return showBan(b);start()}catch(x){$("#fr").textContent=msg(x)}}}
async function boot(){if(!FB.apiKey)return;
  if(au){try{await refresh()}catch(e){if(e instanceof TypeError)off=true;else{au=null;store()}}}
  if(!au)return showAuth();
  const b=off?JSON.parse(localStorage.getItem("cpe_ban")||"null"):await banned();if(b)return showBan(b);start()}

/* ---- panel de administración ---- */
async function enterAdmin(){if(!au||!tok)return toast("Inicia sesión con internet primero");const k=prompt("Clave de administrador");if(!k)return;let ok=null;
  for(const l of["owner","staff"]){try{await fpatch("/admins/"+au.uid,{level:l,key:k,until:{ts:Date.now()+72e5}});ok=l;break}catch(e){}}
  if(!ok)return toast("Clave incorrecta");adm={level:ok};$("#adm").classList.add("on");panel("on")}
function lockAdmin(){if(adm&&au)fs("/admins/"+au.uid,"DELETE").catch(()=>{});adm=null;$("#adm").classList.remove("on");$("#adm").innerHTML=""}
async function panel(t){try{const[ud,bd]=await Promise.all([fs("/users?pageSize=500"),fs("/bans?pageSize=500")]);
  const us=(ud.documents||[]).map(d=>({id:d.name.split("/").pop(),...fo(d)})),bs=Object.fromEntries((bd.documents||[]).map(d=>[d.name.split("/").pop(),fo(d)]));draw(us,bs,t)}catch(e){toast("Error: "+msg(e));lockAdmin()}}
function draw(us,bs,t){const own=adm.level=="owner",on=u=>u.lastSeen>Date.now()-12e4,list=(t=="on"||!own)?us.filter(on):us,A=$("#adm");
  A.innerHTML=`<div class="row"><h2 style="flex:1">🛡️ ${own?"Dueño":"Staff"}</h2><button id="ax">Cerrar y bloquear</button></div>${own?`<div class="seg"><button data-t="on" class="${t=="on"?"on":""}">🟢 Conectados (${us.filter(on).length})</button><button data-t="all" class="${t=="all"?"on":""}">👥 Todas (${us.length})</button></div>`:`<p class="mut">Usuarios conectados: ${list.length}</p>`}<div class="mut" style="margin-top:10px">👥 Registrados: ${us.length} · 🟢 Conectados: ${us.filter(on).length} · 🚫 Baneados: ${Object.keys(bs).length}</div><div id="al" style="margin-top:12px"></div>`;
  if(!list.length)$("#al").innerHTML="<p class='mut'>Nadie por aquí.</p>";
  list.forEach(u=>{const b=bs[u.id],r=document.createElement("div");r.className="ur";
    r.innerHTML=`<div><b>${on(u)?"🟢":"⚪"} ${esc(u.username||"?")}</b>${own?`<br>${esc(u.email||"")}<br>Alta: ${new Date(u.created).toLocaleDateString()} · Visto: ${new Date(u.lastSeen).toLocaleString()}`:""}${b?`<br>🚫 ${esc(b.reason)} (por ${esc(b.by)})`:""}</div><button>${b?"Desbanear":"Banear"}</button>`;
    r.querySelector("button").onclick=async()=>{try{if(b)await fs("/bans/"+u.id,"DELETE");else{const m=prompt("Razón del baneo");if(!m)return;await fpatch("/bans/"+u.id,{reason:m,by:au.user||au.email,level:adm.level,at:Date.now()})}panel(t)}catch(e){toast("No se pudo: "+msg(e))}};$("#al").append(r)});
  $("#ax").onclick=lockAdmin;A.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>panel(b.dataset.t))}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&adm)lockAdmin()});
window.addEventListener("pagehide",()=>{if(adm)lockAdmin()});
const ob=window.onBack;window.onBack=()=>{if(adm){lockAdmin();return true}return ob()};

/* ---- papelera automática ---- */
async function purge(){const d=S.trashDays||0;if(!d)return;const old=notes.filter(n=>n.trash&&Date.now()-n.trash>d*864e5);if(!old.length)return;for(const n of old)await dbDel(n.id);notes=notes.filter(n=>!old.includes(n));render()}
setTimeout(purge,3000);setInterval(purge,36e5);

/* ---- ajustes ---- */
const rs=renderSet;
renderSet=function(){rs();const d=S.trashDays||0,o=[[0,"Nunca"],[1,"1 día"],[7,"7 días"],[15,"15 días"],[30,"30 días"],[60,"60 días"],[-1,"Otro…"]],std=o.some(x=>x[0]==d);
  $("#sett").insertAdjacentHTML("beforeend",`<h3>Papelera</h3><div class="item"><b>Vaciar automáticamente</b><select id="st">${o.map(([v,l])=>`<option value="${v}"${(std?v==d:v==-1)?" selected":""}>${v==-1&&!std?d+" días":l}</option>`).join("")}</select></div>`+(FB.apiKey?`<h3>Cuenta</h3><div class="item"><b>${au?esc(au.user||au.email):"Sin sesión"}</b><button id="so">Cerrar sesión</button></div><button class="mi" id="sa">🛡️ Panel de administración</button>`:""));
  $("#st").onchange=e=>{let v=+e.target.value;if(v==-1){v=parseInt(prompt("¿Cada cuántos días vaciar la papelera?","30"));if(!(v>0))return renderSet()}S.trashDays=v;saveS();purge();renderSet()};
  if(FB.apiKey){$("#so").onclick=()=>confirm("¿Cerrar sesión?")&&logout();$("#sa").onclick=enterAdmin}};
window.CPE={fs,fpatch,fo,refresh,au:()=>au};
boot();
})();
