// Dashboard de una sola pagina (sin dependencias externas). El script usa concatenacion, sin plantillas.
export const DASHBOARD_HTML = String.raw`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Trader Coach</title>
<style>
:root{--bg:#f6f7f9;--card:#fff;--ink:#14181f;--mut:#667085;--line:#e4e7ec;--buy:#12805c;--sell:#c4301c;--wait:#8a6d00;--acc:#2456d6;--buyBg:#e6f5ef;--sellBg:#fdeceb;--waitBg:#f6f1dc}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#0f1218;--card:#171b24;--ink:#e8ebf1;--mut:#94a0b4;--line:#2a3140;--buy:#4cd0a0;--sell:#ff7a6b;--wait:#e3c35a;--acc:#7da2ff;--buyBg:#12332a;--sellBg:#3a1b19;--waitBg:#33300f}}
:root[data-theme=dark]{--bg:#0f1218;--card:#171b24;--ink:#e8ebf1;--mut:#94a0b4;--line:#2a3140;--buy:#4cd0a0;--sell:#ff7a6b;--wait:#e3c35a;--acc:#7da2ff;--buyBg:#12332a;--sellBg:#3a1b19;--waitBg:#33300f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--line);background:var(--card);position:sticky;top:0;z-index:5}
h1{font-size:18px;margin:0}.sub{color:var(--mut);font-size:13px}
main{max-width:1200px;margin:0 auto;padding:16px}
button{font:inherit;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:7px 12px;border-radius:8px;cursor:pointer}
button.p{background:var(--acc);border-color:var(--acc);color:#fff}button:disabled{opacity:.5;cursor:wait}
.pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:12px;font-weight:600}
.open{background:var(--buyBg);color:var(--buy)}.closed{background:var(--waitBg);color:var(--wait)}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.stat{flex:1;min-width:130px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px}
.stat b{display:block;font-size:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;cursor:pointer;border-left:5px solid var(--line)}
.card.buy{border-left-color:var(--buy)}.card.sell{border-left-color:var(--sell)}.card.wait{border-left-color:var(--wait)}.card:hover,.card.sel{outline:2px solid var(--acc)}
.row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.sym{font-weight:700;font-size:17px}.price{font-variant-numeric:tabular-nums;font-weight:600}
.up{color:var(--buy)}.dn{color:var(--sell)}.v{margin:6px 0 2px;font-size:12px;font-weight:700}.v.buy{color:var(--buy)}.v.sell{color:var(--sell)}.v.wait{color:var(--wait)}
.mini{color:var(--mut);font-size:12.5px}.stale{opacity:.6}
#detail{margin-top:18px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
#detail h2{margin:0 0 4px;font-size:20px}h3{font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut);margin:18px 0 6px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}@media(max-width:760px){.two{grid-template-columns:1fr}}
table{border-collapse:collapse;width:100%;font-size:13.5px}td,th{padding:5px 6px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}td.n{text-align:right;font-variant-numeric:tabular-nums}
ul{margin:4px 0;padding-left:18px}li{margin:3px 0}.pos{color:var(--buy);font-weight:700}.neg{color:var(--sell);font-weight:700}
svg{width:100%;height:auto;display:block;background:var(--bg);border-radius:8px}.note{font-size:12.5px;color:var(--mut);margin-top:14px}
dialog{border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);max-width:560px;width:calc(100% - 32px)}
dialog::backdrop{background:#0008}label{display:block;margin:10px 0 3px;font-size:13px;color:var(--mut)}input,textarea{width:100%;font:inherit;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}
.f{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}@media(max-width:560px){.f{grid-template-columns:1fr 1fr}}
.err{color:var(--sell);font-size:13px}.tip{background:var(--waitBg);border-radius:8px;padding:8px 10px;margin-top:8px;font-size:13.5px}
</style></head><body>
<header><div><h1>Trader Coach</h1><div class="sub" id="meta">cargando…</div></div>
<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span id="mk" class="pill"></span>
<button id="rf" class="p">Actualizar ahora</button><button id="cfgb">Ajustes</button></div></header>
<main><div class="stats" id="stats"></div><div class="grid" id="grid"></div><div id="detail" hidden></div>
<p class="note">Educación y aritmética sobre datos de Yahoo con retraso; no es consejo financiero. Este panel no coloca órdenes: tú las ejecutas a mano en XTB. El precio de XTB incluye su spread y puede diferir.</p></main>
<dialog id="dlg"><form method="dialog" id="cf"><h2 style="margin-top:0">Ajustes</h2>
<label>Acciones que sigues (separadas por coma, sin .US)</label><textarea id="wl" rows="2"></textarea>
<div class="f" style="grid-template-columns:1fr 1fr"><div><label>Tamaño de cuenta (USD)</label><input id="acc" type="number" min="0" step="any"></div><div><label>Riesgo por operación (%)</label><input id="rk" type="number" min="0.1" max="5" step="0.1"></div></div>
<h3>Mis posiciones abiertas (para alertas de stop y objetivo)</h3><div id="pl"></div>
<div class="f"><div><label>Ticker</label><input id="ps"></div><div><label>Acciones</label><input id="pq" type="number" step="any"></div><div><label>Entrada</label><input id="pe" type="number" step="any"></div><div><label>Stop</label><input id="pst" type="number" step="any"></div></div>
<div class="f"><div><label>Objetivo</label><input id="pt" type="number" step="any"></div><div style="align-self:end"><button type="button" id="padd">Guardar posición</button></div></div>
<div id="pushinfo" class="mini" style="margin-top:12px"></div><div id="msg" class="err"></div>
<div style="display:flex;gap:8px;justify-content:space-between;margin-top:14px"><button type="button" id="tp">Probar push</button><span><button type="button" id="cl">Cerrar</button> <button class="p" id="sv" value="x">Guardar</button></span></div></form></dialog>
<script>
var S=null,SEL=null,$=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function f2(x){return x==null?'n/d':Number(x).toFixed(2)}function usd(x){return x==null?'n/d':'$'+Number(x).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function bog(d){return new Date(d).toLocaleString('es-CO',{timeZone:'America/Bogota',dateStyle:'short',timeStyle:'short'})}
function api(m,p,b){return fetch(p,{method:m,headers:{'Content-Type':'application/json','X-Requested-With':'dashboard'},body:b?JSON.stringify(b):undefined}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||r.status);return j})})}
function load(){return fetch('/api/state').then(function(r){return r.json()}).then(function(j){S=j;draw()})}
function lessonFor(a){var r=a.indicators.rsi14,bp=a.buy_plan;
 if(r<30||r>70)return '<b>RSI '+r+'</b>: por debajo de 30 es sobreventa, por encima de 70 sobrecompra. En tendencia fuerte puede quedarse extremo; úsalo como filtro, no como señal única.';
 if(bp.rr_target1!=null&&bp.rr_target1<1.5&&!bp.no_resistance_above)return '<b>R:R '+bp.rr_target1+'</b>: arriesgas 1 para ganar '+bp.rr_target1+'. Con menos de 1,5 casi nunca compensa, aunque el gráfico se vea bonito. Espera un precio más cercano al soporte.';
 if(bp.no_resistance_above)return '<b>Máximos</b>: sin resistencia arriba no hay un techo claro para fijar el objetivo. Perseguir el precio en máximos es lo que más duele; compra retrocesos hacia el soporte.';
 return '<b>ATR '+usd(a.indicators.atr14)+'</b>: es lo que se mueve el precio por vela. Tu stop debe quedar fuera de ese ruido (soporte menos 0,5 ATR) y las acciones salen de dividir tu riesgo en dólares entre (entrada − stop).'}
function draw(){
 var it=S.items=S.snapshot.items||{},keys=Object.keys(it).sort(function(a,b){return Math.abs(it[b].score)-Math.abs(it[a].score)});
 var mk=S.market;$('mk').className='pill '+(mk.open?'open':'closed');$('mk').textContent=mk.open?'NYSE abierto':(mk.holiday?'Feriado NYSE':(mk.tradingDay?'NYSE cerrado':'Fin de semana'));
 $('meta').textContent=(S.snapshot.updated?'Actualizado '+bog(S.snapshot.updated)+' (hora Bogotá)':'Sin datos todavía: pulsa «Actualizar ahora»')+' · push: '+(S.push.ntfy||S.push.telegram?[S.push.ntfy?'ntfy':'',S.push.telegram?'Telegram':''].filter(Boolean).join(' + '):'sin configurar');
 var b=0,s=0,w=0;keys.forEach(function(k){var x=it[k].kind;if(x=='buy')b++;else if(x=='sell')s++;else w++});
 $('stats').innerHTML='<div class="stat"><span class="mini">Zona de compra</span><b class="up">'+b+'</b></div><div class="stat"><span class="mini">Zona de venta</span><b class="dn">'+s+'</b></div><div class="stat"><span class="mini">Esperar</span><b>'+w+'</b></div><div class="stat"><span class="mini">Posiciones abiertas</span><b>'+Object.keys(S.cfg.positions).length+'</b></div>';
 var err=S.snapshot.errors||{},h='';
 keys.forEach(function(k){var a=it[k],c=a.change_pct>=0?'up':'dn';
  h+='<div class="card '+a.kind+(SEL==k?' sel':'')+(a.stale?' stale':'')+'" data-s="'+esc(k)+'"><div class="row"><span class="sym">'+esc(k)+'</span><span class="price">'+usd(a.price)+' <span class="'+c+'">'+(a.change_pct>=0?'+':'')+f2(a.change_pct)+'%</span></span></div><div class="v '+a.kind+'">'+esc(a.verdict)+'</div><div class="mini">Puntaje '+(a.score>0?'+':'')+a.score+' · RSI '+a.indicators.rsi14+' · compra '+f2(a.buy_plan.buy_zone[0])+'–'+f2(a.buy_plan.buy_zone[1])+'</div>'+(S.cfg.positions[k]?'<div class="mini">📌 posición: '+S.cfg.positions[k].shares+' @ '+f2(S.cfg.positions[k].entry)+'</div>':'')+(a.stale?'<div class="mini err">datos viejos</div>':'')+'</div>'});
 Object.keys(err).forEach(function(k){if(!it[k])h+='<div class="card"><span class="sym">'+esc(k)+'</span><div class="err">'+esc(err[k])+'</div></div>'});
 $('grid').innerHTML=h||'<p class="mini">Agrega acciones en Ajustes.</p>';
 Array.prototype.forEach.call(document.querySelectorAll('.card[data-s]'),function(el){el.onclick=function(){SEL=el.getAttribute('data-s');draw();$('detail').scrollIntoView({behavior:'smooth'})}});
 if(!SEL&&keys.length)SEL=keys[0];if(SEL&&it[SEL])detail(it[SEL]);else $('detail').hidden=true}
function chart(a){var cs=a.candles,W=900,H=300,pl=8,pr=62,pt=10,pb=18,lo=Infinity,hi=-Infinity;
 cs.forEach(function(c){lo=Math.min(lo,c.l);hi=Math.max(hi,c.h)});
 var lv=[].concat(a.supports.map(function(x){return [x.level,'s']}),a.resistances.map(function(x){return [x.level,'r']}));
 lv.forEach(function(x){if(x[0]>lo*0.9&&x[0]<hi*1.1){lo=Math.min(lo,x[0]);hi=Math.max(hi,x[0])}});lo=Math.min(lo,a.buy_plan.stop);
 var pad=(hi-lo)*0.04;lo-=pad;hi+=pad;var y=function(v){return pt+(hi-v)/(hi-lo)*(H-pt-pb)},bw=(W-pl-pr)/cs.length,x=function(i){return pl+i*bw+bw/2};
 var g='',bz=a.buy_plan.buy_zone,sz=a.sell_plan.sell_zone;
 g+='<rect x="'+pl+'" y="'+y(bz[1])+'" width="'+(W-pl-pr)+'" height="'+Math.max(2,y(bz[0])-y(bz[1]))+'" fill="var(--buy)" opacity=".16"/>';
 g+='<rect x="'+pl+'" y="'+y(sz[1])+'" width="'+(W-pl-pr)+'" height="'+Math.max(2,y(sz[0])-y(sz[1]))+'" fill="var(--sell)" opacity=".16"/>';
 function line(v,col,lab,dash){if(v<lo||v>hi)return '';return '<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="'+col+'" stroke-width="1" '+(dash?'stroke-dasharray="5 4"':'')+'/><text x="'+(W-pr+4)+'" y="'+(y(v)+4)+'" font-size="11" fill="'+col+'">'+lab+' '+f2(v)+'</text>'}
 a.supports.forEach(function(s){g+=line(s.level,'var(--buy)','S',0)});a.resistances.forEach(function(r){g+=line(r.level,'var(--sell)','R',0)});g+=line(a.buy_plan.stop,'var(--sell)','Stop',1);
 cs.forEach(function(c,i){var up=c.c>=c.o,col=up?'var(--buy)':'var(--sell)',t=y(Math.max(c.o,c.c)),bt=y(Math.min(c.o,c.c));
  g+='<line x1="'+x(i)+'" x2="'+x(i)+'" y1="'+y(c.h)+'" y2="'+y(c.l)+'" stroke="'+col+'"/><rect x="'+(x(i)-bw*0.35)+'" y="'+t+'" width="'+(bw*0.7)+'" height="'+Math.max(1,bt-t)+'" fill="'+col+'"/>'});
 g+='<text x="'+pl+'" y="'+(H-4)+'" font-size="11" fill="var(--mut)">últimas '+cs.length+' velas diarias · banda verde = zona de compra · banda roja = zona de venta</text>';
 return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Velas de '+esc(a.symbol)+'">'+g+'</svg>'}
function detail(a){var ind=a.indicators,bp=a.buy_plan,sp=a.sell_plan,pos=S.cfg.positions[a.symbol],d=$('detail');d.hidden=false;
 var h='<div class="row"><h2>'+esc(a.symbol)+' <span class="mini">XTB: '+esc(a.symbol)+'.US</span></h2><span class="price">'+usd(a.price)+'</span></div><div class="v '+a.kind+'">'+esc(a.verdict)+' · puntaje '+(a.score>0?'+':'')+a.score+'</div>';
 if(a.live_candle)h+='<div class="mini">La vela de hoy puede estar formándose; un patrón solo es firme cuando cierra.</div>';
 h+=chart(a)+'<div class="two"><div><h3>Por qué ese veredicto</h3><ul>'+(a.reasons.map(function(r){return '<li><span class="'+(r.points>0?'pos':r.points<0?'neg':'')+'">['+(r.points>0?'+':'')+r.points+']</span> '+esc(r.text)+'</li>'}).join('')||'<li>Sin señales activas: esperar también es una posición.</li>')+'</ul>';
 h+='<h3>Última vela (' + a.last_candle.color + ')</h3><div class="mini">Cuerpo '+Math.round(a.last_candle.body_pct*100)+'% · mecha superior '+Math.round(a.last_candle.upper_pct*100)+'% · inferior '+Math.round(a.last_candle.lower_pct*100)+'%</div><ul>'+(a.patterns.map(function(p){return '<li><b>'+esc(p.name)+'</b> ('+p.bias+'): '+esc(p.why)+'</li>'}).join('')||'<li>Sin patrón clásico: no fuerces una señal.</li>')+'</ul><div class="tip">🎓 '+lessonFor(a)+'</div></div>';
 h+='<div><h3>Dónde comprar</h3><table><tr><td>Zona</td><td class="n">'+usd(bp.buy_zone[0])+' – '+usd(bp.buy_zone[1])+(bp.price_is_in_buy_zone?' ← aquí':'')+'</td></tr><tr><td>Entrada de referencia</td><td class="n">'+usd(bp.entry)+'</td></tr><tr><td>Stop</td><td class="n">'+usd(bp.stop)+'</td></tr><tr><td>Objetivo 1 / 2R</td><td class="n">'+usd(bp.target1)+' / '+usd(bp.target2)+'</td></tr><tr><td>R:R al objetivo 1</td><td class="n">'+(bp.rr_target1==null?'n/d':bp.rr_target1)+(bp.no_resistance_above?' (sin resistencia arriba)':'')+'</td></tr>';
 if(bp.sizing)h+='<tr><td>Acciones (riesgo '+bp.sizing.risk_pct+'% de '+usd(bp.sizing.account)+')</td><td class="n"><b>'+bp.sizing.shares_capped_25pct+'</b> ('+usd(bp.sizing.cost_usd)+'; pérdida máx. '+usd(bp.sizing.max_loss_usd)+')</td></tr>';else h+='<tr><td>Acciones</td><td class="n mini">define tu cuenta en Ajustes</td></tr>';
 h+='</table>'+((bp.rr_target1!=null&&bp.rr_target1<1.5&&!bp.no_resistance_above)?'<div class="err">R:R menor a 1,5: la matemática no compensa. Espera un precio mejor.</div>':'');
 h+='<h3>Dónde vender</h3><table><tr><td>Zona de ganancias</td><td class="n">'+usd(sp.sell_zone[0])+' – '+usd(sp.sell_zone[1])+(sp.price_is_in_sell_zone?' ← aquí':'')+'</td></tr><tr><td>Stop de seguimiento</td><td class="n">'+usd(sp.trailing_stop)+'</td></tr></table>';
 if(pos)h+='<h3>Mi posición</h3><table><tr><td>'+pos.shares+' acciones @ '+usd(pos.entry)+'</td><td class="n '+(a.price>=pos.entry?'pos':'neg')+'">'+usd((a.price-pos.entry)*pos.shares)+' ('+f2((a.price/pos.entry-1)*100)+'%)</td></tr><tr><td>Stop / objetivo</td><td class="n">'+usd(pos.stop)+' / '+usd(pos.target)+'</td></tr></table>';
 h+='<h3>Mapa</h3><div class="mini">Resistencias: '+(a.resistances.map(function(r){return usd(r.level)+' ('+r.touches+')'}).join(', ')||'ninguna a la vista')+'<br>Soportes: '+(a.supports.map(function(r){return usd(r.level)+' ('+r.touches+')'}).join(', ')||'ninguno claro')+'</div></div></div>';
 h+='<h3>Indicadores</h3><table><tr><td>Medias 20/50/200</td><td class="n">'+f2(ind.sma20)+' / '+f2(ind.sma50)+' / '+f2(ind.sma200)+'</td><td>RSI 14</td><td class="n">'+ind.rsi14+'</td></tr><tr><td>MACD / señal / hist</td><td class="n">'+ind.macd+' / '+ind.macd_signal+' / '+ind.macd_hist+'</td><td>ATR 14</td><td class="n">'+usd(ind.atr14)+' ('+ind.atr_pct+'%)</td></tr><tr><td>Bollinger inf/med/sup</td><td class="n">'+f2(ind.boll_low)+' / '+f2(ind.boll_mid)+' / '+f2(ind.boll_up)+'</td><td>Volumen vs prom.</td><td class="n">'+(ind.volume_ratio==null?'n/d':ind.volume_ratio+'x')+'</td></tr><tr><td>Mín / máx 52 sem</td><td class="n">'+usd(ind.lo52)+' / '+usd(ind.hi52)+'</td><td>Datos al</td><td class="n">'+a.as_of+'</td></tr></table>';
 h+='<div class="note">En XTB: revisa spread, comisión y, si es CFD, el swap nocturno; pon tu stop y take-profit en la orden. Tu precio de ejecución es el de XTB, no el de Yahoo.</div>';d.innerHTML=h}
function openCfg(){var c=S.cfg;$('wl').value=c.watchlist.join(', ');$('acc').value=c.account==null?'':c.account;$('rk').value=c.riskPct;$('msg').textContent='';
 var ps=Object.keys(c.positions);$('pl').innerHTML=ps.length?'<table>'+ps.map(function(k){var p=c.positions[k];return '<tr><td><b>'+esc(k)+'</b> '+p.shares+' @ '+f2(p.entry)+' · stop '+f2(p.stop)+' · obj. '+f2(p.target)+'</td><td class="n"><button type="button" data-d="'+esc(k)+'">Quitar</button></td></tr>'}).join('')+'</table>':'<div class="mini">Ninguna. Agrega las que abras en XTB para recibir push de stop y objetivo.</div>';
 Array.prototype.forEach.call($('pl').querySelectorAll('button[data-d]'),function(b){b.onclick=function(){api('DELETE','/api/positions?symbol='+encodeURIComponent(b.getAttribute('data-d'))).then(function(){return load()}).then(openCfg)}});
 $('pushinfo').textContent='Canales de push: '+(S.push.ntfy||S.push.telegram?[S.push.ntfy?'ntfy':'',S.push.telegram?'Telegram':''].filter(Boolean).join(' + '):'ninguno configurado (ver README del Worker)');
 if(!$('dlg').open)$('dlg').showModal()}
$('cfgb').onclick=openCfg;$('cl').onclick=function(){$('dlg').close()};
$('sv').onclick=function(e){e.preventDefault();api('POST','/api/config',{watchlist:$('wl').value.split(/[\s,]+/).filter(Boolean),account:$('acc').value,riskPct:$('rk').value}).then(function(){$('dlg').close();return refresh()}).catch(function(x){$('msg').textContent=x.message})};
$('padd').onclick=function(){api('POST','/api/positions',{symbol:$('ps').value,shares:$('pq').value,entry:$('pe').value,stop:$('pst').value,target:$('pt').value}).then(function(){['ps','pq','pe','pst','pt'].forEach(function(i){$(i).value=''});return load()}).then(openCfg).catch(function(x){$('msg').textContent=x.message})};
$('tp').onclick=function(){api('POST','/api/test-push').then(function(r){$('msg').textContent=r.error||('Enviado por: '+(r.sent||[]).join(', ')+((r.failed||[]).length?' · falló: '+r.failed.join(', '):''))}).catch(function(x){$('msg').textContent=x.message})};
function refresh(){$('rf').disabled=true;$('rf').textContent='Actualizando…';return api('POST','/api/refresh').then(load).catch(function(x){alert(x.message)}).then(function(){$('rf').disabled=false;$('rf').textContent='Actualizar ahora'})}
$('rf').onclick=refresh;load();setInterval(function(){if(!document.hidden)load()},60000);
</script></body></html>`;
