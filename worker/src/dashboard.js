// Dashboard "libro de bolsa nocturno": una sola pagina, mobile-first, sin framework.
// El script se construye con DOM (el(), sv()) y nunca inyecta texto como HTML. Sin plantillas con backticks.
export const MANIFEST = {
  name: 'Trader Coach', short_name: 'Coach', start_url: '/', display: 'standalone', orientation: 'portrait',
  background_color: '#0c0e12', theme_color: '#0c0e12', lang: 'es',
  icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
};
export const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0c0e12"/><g stroke-width="26" stroke-linecap="round"><path d="M150 120v270" stroke="#ff6b57"/><path d="M256 80v300" stroke="#c6ff5a"/><path d="M362 150v270" stroke="#c6ff5a"/></g><rect x="118" y="190" width="64" height="120" rx="10" fill="#ff6b57"/><rect x="224" y="140" width="64" height="150" rx="10" fill="#c6ff5a"/><rect x="330" y="210" width="64" height="130" rx="10" fill="#c6ff5a"/></svg>';

export const DASHBOARD_HTML = String.raw`<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0c0e12"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Coach"><meta name="color-scheme" content="dark light">
<link rel="manifest" href="/manifest.webmanifest" crossorigin="use-credentials"><link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Instrument+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<title>Trader Coach</title>
<style>
:root{--bg:#0c0e12;--bg2:#12151c;--card:#161a23;--card2:#1d222d;--ink:#f3efe4;--mut:#9aa0ad;--dim:#666d7c;--line:#262b37;
--buy:#c6ff5a;--buyI:#10150a;--sell:#ff6b57;--sellI:#1a0b08;--wait:#ffbf47;--acc:#8fb3ff;
--buyB:rgba(198,255,90,.11);--sellB:rgba(255,107,87,.12);--waitB:rgba(255,191,71,.11);
--serif:"Fraunces",Georgia,"Times New Roman",serif;--sans:"Instrument Sans",ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:"DM Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
--r:18px;--sb:env(safe-area-inset-bottom,0px);--st:env(safe-area-inset-top,0px)}
:root[data-theme=light]{--bg:#f4efe3;--bg2:#ece6d6;--card:#fffdf7;--card2:#f6f0e2;--ink:#17140d;--mut:#6a6455;--dim:#9b9482;--line:#e1d9c4;
--buy:#2f8a00;--buyI:#fff;--sell:#d6402a;--sellI:#fff;--wait:#b97800;--acc:#2f55c8;--buyB:rgba(47,138,0,.10);--sellB:rgba(214,64,42,.10);--waitB:rgba(185,120,0,.11)}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html{scrollbar-width:thin}
body{margin:0;background:var(--bg);color:var(--ink);font:400 15.5px/1.5 var(--sans);overscroll-behavior-y:contain;-webkit-font-smoothing:antialiased;
background-image:radial-gradient(900px 420px at 85% -10%,rgba(143,179,255,.10),transparent 60%),radial-gradient(700px 380px at -10% 8%,rgba(198,255,90,.07),transparent 60%);background-attachment:fixed}
body.lock{overflow:hidden}
button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;padding:0}
button:focus-visible,summary:focus-visible,input:focus-visible,.tile:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.num{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.02em}.serif{font-family:var(--serif)}
.up{color:var(--buy)}.dn{color:var(--sell)}.mut{color:var(--mut)}.sm{font-size:13px}.xs{font-size:11.5px}
/* barra superior */
.top{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:10px;padding:calc(10px + var(--st)) 14px 10px;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.logo{display:flex;align-items:center;gap:9px;font-family:var(--serif);font-weight:700;font-size:21px;letter-spacing:-.02em;flex:none;white-space:nowrap}.top .mk{margin-left:auto}
.logo svg{width:28px;height:28px;border-radius:8px;flex:none}
.mk{display:inline-flex;align-items:center;gap:7px;padding:5px 11px 5px 9px;border-radius:99px;font-size:12px;font-weight:600;background:var(--card);border:1px solid var(--line);white-space:nowrap;min-width:0;flex:0 1 auto;overflow:hidden;text-overflow:ellipsis}.mk span{overflow:hidden;text-overflow:ellipsis}.mk i{flex:none}
.mk i{width:8px;height:8px;border-radius:50%;background:var(--wait)}.mk.on i{background:var(--buy);box-shadow:0 0 0 0 var(--buy);animation:pulse 2s infinite}
@keyframes pulse{70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
.ib{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--card);border:1px solid var(--line)}.ib svg{width:20px;height:20px}.ib.spin svg{animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
main{max-width:1080px;margin:0 auto;padding:16px 14px calc(96px + var(--sb))}
/* barra de pestanas */
.tabs{position:fixed;z-index:20;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(4,1fr);padding:6px 8px calc(6px + var(--sb));background:color-mix(in srgb,var(--bg2) 88%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid var(--line)}
.tabs button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 0;border-radius:14px;color:var(--mut);font-size:11px;font-weight:600;min-height:52px}
.tabs svg{width:23px;height:23px}.tabs button[aria-selected=true]{color:var(--ink);background:var(--card2)}.tabs button[aria-selected=true] svg{color:var(--buy)}
/* hero */
.hero{position:relative;overflow:hidden;border-radius:26px;padding:20px 18px 18px;background:linear-gradient(160deg,var(--card2),var(--card));border:1px solid var(--line);margin-bottom:18px}
.hero:after{content:"";position:absolute;right:-60px;top:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(198,255,90,.18),transparent 65%);pointer-events:none}
.hello{font-size:13px;color:var(--mut);font-weight:500}.big{font-family:var(--serif);font-weight:500;font-size:31px;line-height:1.08;letter-spacing:-.025em;margin:6px 0 14px}
.big b{font-weight:700}.big .g{color:var(--buy)}.big .r{color:var(--sell)}
.split{display:flex;height:10px;border-radius:99px;overflow:hidden;gap:3px;background:var(--bg)}.split span{display:block;min-width:6px;border-radius:99px;transition:flex .8s cubic-bezier(.2,.8,.2,1)}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px;font-size:12.5px;color:var(--mut)}.legend b{color:var(--ink);font-family:var(--mono);font-weight:500}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}
.meta{margin-top:12px;font-size:12px;color:var(--dim)}
/* secciones */
.sec{display:flex;align-items:baseline;justify-content:space-between;margin:22px 2px 10px}.sec h2{margin:0;font-family:var(--serif);font-size:21px;font-weight:700;letter-spacing:-.02em}.sec span{font-size:12.5px;color:var(--mut)}
.help{font-size:13.5px;color:var(--mut);margin:-4px 2px 12px}
.grid{display:grid;gap:12px;grid-template-columns:1fr}@media(min-width:640px){.grid{grid-template-columns:1fr 1fr}}@media(min-width:960px){.grid{grid-template-columns:1fr 1fr 1fr}}
/* tarjeta de accion */
.tile{position:relative;display:block;width:100%;text-align:left;border-radius:var(--r);padding:14px 15px 13px;background:var(--card);border:1px solid var(--line);overflow:hidden;transition:transform .15s,border-color .2s;animation:rise .5s both;animation-delay:calc(var(--i,0)*45ms)}
.tile:active{transform:scale(.985)}.tile:hover{border-color:var(--dim)}
.tile:before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--c)}.tile.buy{--c:var(--buy);background:linear-gradient(100deg,var(--buyB),var(--card) 55%)}.tile.sell{--c:var(--sell);background:linear-gradient(100deg,var(--sellB),var(--card) 55%)}.tile.wait{--c:var(--wait)}
@keyframes rise{from{opacity:0;transform:translateY(10px)}}
.trow{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.sym{font-family:var(--serif);font-weight:700;font-size:24px;letter-spacing:-.02em;line-height:1}.xtb{font-family:var(--mono);font-size:11px;color:var(--dim);margin-left:6px;font-weight:400}
.px{text-align:right}.px .num{font-size:19px;font-weight:500;display:block}.chg{font-size:13px;font-family:var(--mono)}
.chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 8px;border-radius:99px;font-size:12px;font-weight:700;background:var(--b);color:var(--c)}.chip.buy{--c:var(--buy);--b:var(--buyB)}.chip.sell{--c:var(--sell);--b:var(--sellB)}.chip.wait{--c:var(--wait);--b:var(--waitB)}
.say{margin:9px 0 6px;font-size:14px;line-height:1.42;color:var(--ink)}.spark{display:block;width:100%;height:46px;margin-top:8px}
.tfoot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:6px;font-size:12px;color:var(--mut)}.pin{color:var(--acc);font-weight:600}
.skeleton{height:150px;border-radius:var(--r);background:linear-gradient(100deg,var(--card) 30%,var(--card2) 50%,var(--card) 70%);background-size:200% 100%;animation:sh 1.3s infinite}@keyframes sh{to{background-position:-200% 0}}
/* filtros */
.chips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 10px;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}
.fc{flex:none;padding:8px 14px;border-radius:99px;font-size:13.5px;font-weight:600;background:var(--card);border:1px solid var(--line);color:var(--mut);min-height:38px}.fc[aria-pressed=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.search{width:100%;padding:12px 14px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;margin-bottom:10px}
/* hoja (detalle) */
.shade{position:fixed;inset:0;z-index:40;background:rgba(5,6,9,.6);opacity:0;pointer-events:none;transition:opacity .25s;backdrop-filter:blur(3px)}.shade.on{opacity:1;pointer-events:auto}
.sheet{position:fixed;z-index:41;left:0;right:0;bottom:0;max-height:94dvh;height:94dvh;display:flex;flex-direction:column;background:var(--bg);border-radius:26px 26px 0 0;border:1px solid var(--line);border-bottom:0;transform:translateY(105%);transition:transform .38s cubic-bezier(.2,.85,.25,1);max-width:560px;margin:0 auto;box-shadow:0 -20px 60px rgba(0,0,0,.45)}
.sheet{visibility:hidden}.sheet.on{transform:none;visibility:visible;transition:transform .38s cubic-bezier(.2,.85,.25,1),visibility 0s}.sheet:not(.on){transition:transform .38s cubic-bezier(.2,.85,.25,1),visibility 0s .38s}.sheet.drag{transition:none}
.grab{padding:9px 0 4px;touch-action:none;cursor:grab}.grab i{display:block;width:44px;height:5px;border-radius:9px;background:var(--line);margin:0 auto}
.sh-h{display:flex;align-items:center;gap:10px;padding:4px 16px 10px}.sh-h .back{width:38px;height:38px;border-radius:12px;background:var(--card);border:1px solid var(--line);display:grid;place-items:center;flex:none}
.sh-b{flex:1;overflow-y:auto;padding:0 16px calc(24px + var(--sb));-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;padding:4px;margin:0 16px 12px;background:var(--card);border:1px solid var(--line);border-radius:14px}
.seg button{padding:9px 4px;border-radius:10px;font-size:13px;font-weight:700;color:var(--mut);min-height:40px}.seg button[aria-selected=true]{background:var(--ink);color:var(--bg)}
.pane{animation:fade .3s both}@keyframes fade{from{opacity:0;transform:translateY(6px)}}
@media(min-width:600px){.sheet{bottom:auto;top:3vh;height:94vh;border-radius:26px;border-bottom:1px solid var(--line)}}
/* bloques */
.box{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:15px;margin-bottom:12px}.box h3{margin:0 0 4px;font-family:var(--serif);font-size:18px;font-weight:700;letter-spacing:-.015em}.box .lead{margin:0 0 12px;font-size:13.5px;color:var(--mut)}
.bigv{border-radius:22px;padding:18px;margin-bottom:12px;background:linear-gradient(150deg,var(--b),var(--card) 70%);border:1px solid var(--line)}.bigv.buy{--b:var(--buyB)}.bigv.sell{--b:var(--sellB)}.bigv.wait{--b:var(--waitB)}
.bigv .t{font-family:var(--serif);font-size:27px;font-weight:700;letter-spacing:-.025em;line-height:1.1;margin:8px 0 6px}.bigv.buy .t{color:var(--buy)}.bigv.sell .t{color:var(--sell)}.bigv.wait .t{color:var(--wait)}
.gauge{display:block;width:100%;max-width:300px;margin:0 auto}.needle{transition:transform 1.1s cubic-bezier(.2,1.2,.3,1);transform-origin:150px 150px}
.why{display:grid;gap:9px}.why .r{display:grid;grid-template-columns:44px 1fr;gap:10px;align-items:start;font-size:13.5px}.why .p{font-family:var(--mono);font-weight:500;font-size:13px;text-align:center;padding:4px 0;border-radius:9px}.why .p.pos{background:var(--buyB);color:var(--buy)}.why .p.neg{background:var(--sellB);color:var(--sell)}.why .p.zero{background:var(--card2);color:var(--mut)}
.pbar{height:5px;border-radius:9px;margin-top:6px;background:var(--card2);overflow:hidden}.pbar i{display:block;height:100%;border-radius:9px}
.tip{display:flex;gap:10px;padding:12px 13px;border-radius:14px;background:var(--waitB);font-size:13.5px;margin-top:12px}.tip b{color:var(--wait)}
.warn{display:flex;gap:10px;padding:11px 13px;border-radius:14px;background:var(--sellB);font-size:13.5px;margin-bottom:12px}
.kv{display:grid;grid-template-columns:1fr auto;gap:2px 12px;font-size:14px}.kv div:nth-child(odd){color:var(--mut)}.kv div:nth-child(even){text-align:right;font-family:var(--mono)}
/* grafico */
.tt{min-height:64px;padding:10px 12px;border-radius:14px;background:var(--card2);margin-bottom:10px;font-size:13px}.tt .h{display:flex;justify-content:space-between;gap:8px;font-family:var(--mono);font-size:12px;color:var(--mut)}.tt .s{margin-top:5px;line-height:1.4}
.chart{display:block;width:100%;height:auto;touch-action:pan-y;user-select:none;-webkit-user-select:none;border-radius:14px;background:var(--bg2)}
.opts{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0 2px}.opt{padding:7px 12px;border-radius:99px;font-size:12.5px;font-weight:600;background:var(--card2);color:var(--mut);border:1px solid transparent;min-height:36px}.opt[aria-pressed=true]{color:var(--ink);border-color:var(--dim);background:var(--card)}
.sw{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:6px}
/* escalera de precios */
.ladder{position:relative;display:grid;gap:7px}.lr{display:grid;grid-template-columns:18px 1fr auto;gap:10px;align-items:center;padding:9px 11px;border-radius:12px;background:var(--card2);font-size:13.5px}.lr .d{width:11px;height:11px;border-radius:50%;background:var(--c);justify-self:center}.lr .n{font-family:var(--mono);font-size:13px;text-align:right}.lr small{display:block;color:var(--mut);font-size:11.5px}
.lr.now{background:var(--ink);color:var(--bg)}.lr.now small{color:inherit;opacity:.7}.lr.now .d{background:var(--bg)}
.rr{display:flex;height:34px;border-radius:12px;overflow:hidden;gap:3px;font-size:12px;font-weight:700}.rr div{display:grid;place-items:center;white-space:nowrap;overflow:hidden;padding:0 6px}
.rng{width:100%;accent-color:var(--buy);height:32px}.calc{display:grid;gap:14px}.calc label{display:flex;justify-content:space-between;font-size:13.5px;color:var(--mut);margin-bottom:2px}.calc label b{color:var(--ink);font-family:var(--mono);font-weight:500}
.inp{width:100%;padding:11px 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg2);color:var(--ink);font:inherit;font-family:var(--mono)}
.res{display:grid;grid-template-columns:1fr 1fr;gap:8px}.res>div{padding:11px 12px;border-radius:14px;background:var(--card2)}.res small{display:block;color:var(--mut);font-size:11.5px}.res b{font-family:var(--serif);font-size:23px;font-weight:700;letter-spacing:-.02em}
.steps{counter-reset:s;display:grid;gap:9px;margin:0;padding:0;list-style:none}.steps li{counter-increment:s;display:grid;grid-template-columns:28px 1fr;gap:10px;font-size:13.5px}.steps li:before{content:counter(s);width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--buy);color:var(--buyI);font-weight:800;font-size:13px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 18px;border-radius:14px;font-weight:700;background:var(--buy);color:var(--buyI);min-height:46px}.btn.sec2{background:var(--card2);color:var(--ink);border:1px solid var(--line)}.btn.dng{background:var(--sellB);color:var(--sell)}.btn.full{width:100%}.btn svg{width:18px;height:18px;flex:none}.btn:disabled{opacity:.5}
/* indicadores */
details.ind{background:var(--card);border:1px solid var(--line);border-radius:var(--r);margin-bottom:10px;overflow:hidden}details.ind summary{list-style:none;cursor:pointer;padding:14px 15px;display:grid;gap:10px}details.ind summary::-webkit-details-marker{display:none}
.ih{display:flex;justify-content:space-between;align-items:center;gap:8px}.ih b{font-family:var(--serif);font-size:17px}.ih .chip{font-size:11.5px}
.ind .ex{padding:0 15px 15px;font-size:13.5px;color:var(--mut);border-top:1px solid var(--line);padding-top:12px}.ind .ex p{margin:0 0 8px}.ind .ex b{color:var(--ink)}.car{transition:transform .2s;flex:none}details[open] .car{transform:rotate(180deg)}
.meter{position:relative;height:12px;border-radius:99px;overflow:visible;background:var(--card2)}.meter .z{position:absolute;top:0;bottom:0}.meter .m{position:absolute;top:-5px;width:4px;height:22px;border-radius:3px;background:var(--ink);transform:translateX(-50%);box-shadow:0 0 0 3px var(--card);transition:left .9s cubic-bezier(.2,1.2,.3,1)}
.mlab{display:flex;justify-content:space-between;font-size:11px;color:var(--dim);margin-top:5px;font-family:var(--mono)}
/* aprender */
.lesson{background:var(--card);border:1px solid var(--line);border-radius:var(--r);margin-bottom:10px;overflow:hidden}.lesson summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;padding:14px}.lesson summary::-webkit-details-marker{display:none}
.lesson .em{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:var(--card2);font-size:22px}.lesson h3{margin:0;font-family:var(--serif);font-size:17px}.lesson .sub{font-size:12.5px;color:var(--mut)}
.lesson .body{padding:2px 15px 16px;font-size:14px}.lesson .body p{margin:0 0 10px;color:var(--mut)}.lesson .body b{color:var(--ink)}.lesson svg.ill{display:block;width:100%;height:auto;margin:6px 0 12px;border-radius:14px;background:var(--bg2)}
.quiz .q{font-family:var(--serif);font-size:19px;line-height:1.25;margin:6px 0 14px}.opt2{display:block;width:100%;text-align:left;padding:13px 14px;border-radius:14px;background:var(--card2);border:1.5px solid transparent;margin-bottom:8px;font-size:14.5px;min-height:48px}.opt2.ok{border-color:var(--buy);background:var(--buyB)}.opt2.no{border-color:var(--sell);background:var(--sellB)}.opt2:disabled{cursor:default}
.score{display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--mut)}.score b{font-family:var(--mono);color:var(--ink)}
/* posiciones */
.pcard{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:14px 15px;margin-bottom:12px}.track{position:relative;height:12px;border-radius:99px;background:linear-gradient(90deg,var(--sellB),var(--card2) 38%,var(--buyB));margin:20px 0 6px}.track .tk{position:absolute;top:-4px;width:2px;height:20px;background:var(--dim)}.track .me{position:absolute;top:-6px;width:18px;height:24px;border-radius:7px;background:var(--ink);transform:translateX(-50%);display:grid;place-items:center;transition:left .8s}
.empty{text-align:center;padding:34px 18px;color:var(--mut);border:1.5px dashed var(--line);border-radius:var(--r)}.empty .e{font-size:38px;margin-bottom:6px}
.note{font-size:12px;color:var(--dim);margin:22px 4px 0;line-height:1.5}
.toast{position:fixed;z-index:60;left:50%;bottom:calc(86px + var(--sb));transform:translate(-50%,20px);padding:11px 16px;border-radius:14px;background:var(--ink);color:var(--bg);font-weight:600;font-size:14px;opacity:0;pointer-events:none;transition:.25s;max-width:calc(100% - 28px)}.toast.on{opacity:1;transform:translate(-50%,0)}
.cfgchips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.cc{display:inline-flex;align-items:center;gap:6px;padding:7px 8px 7px 12px;border-radius:99px;background:var(--card2);font-family:var(--mono);font-size:13px}.cc button{width:22px;height:22px;border-radius:50%;background:var(--line);display:grid;place-items:center;font-size:14px;line-height:1}
.f2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fl{display:block;font-size:12.5px;color:var(--mut);margin:12px 0 5px}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
</style></head><body>
<header class="top"><div class="logo"><svg viewBox="0 0 512 512" aria-hidden="true"><use href="#ic-logo"/></svg><span>Coach</span></div>
<span class="mk" id="mk"><i></i><span id="mkt">…</span></span>
<button class="ib" id="rf" aria-label="Actualizar ahora"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg></button>
<button class="ib" id="cfgb" aria-label="Ajustes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg></button></header>
<main id="view"></main>
<nav class="tabs" role="tablist" aria-label="Secciones" id="tabs"></nav>
<div class="shade" id="shade"></div>
<section class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="Detalle"><div class="grab" id="grab"><i></i></div><div class="sh-h" id="shh"></div><div id="shseg"></div><div class="sh-b" id="shb"></div></section>
<div class="toast" id="toast" role="status"></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="ic-logo" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0c0e12"/><path d="M150 120v270" stroke="#ff6b57" stroke-width="26" stroke-linecap="round"/><path d="M256 80v300M362 150v270" stroke="#c6ff5a" stroke-width="26" stroke-linecap="round"/><rect x="118" y="190" width="64" height="120" rx="10" fill="#ff6b57"/><rect x="224" y="140" width="64" height="150" rx="10" fill="#c6ff5a"/><rect x="330" y="210" width="64" height="130" rx="10" fill="#c6ff5a"/></symbol></defs></svg>
<script>
"use strict";
var NS="http://www.w3.org/2000/svg",S=null,TAB="hoy",FLT="todos",QRY="",SORT="senal",SEL=null,PANE="resumen",ST=[];
var CO={n:60,ma:true,bb:false,lv:true,zn:true},T0=Date.now();
/* ---------- utilidades ---------- */
function add(e,k){if(k==null||k===false)return;if(Array.isArray(k)){k.forEach(function(c){add(e,c)});return}e.appendChild(typeof k==="object"?k:document.createTextNode(String(k)))}
function el(t,a,k){var e=document.createElement(t);if(a)for(var n in a){var v=a[n];if(v==null||v===false)continue;if(n==="class")e.className=v;else if(n==="text")e.textContent=v;else if(n==="style")e.style.cssText=v;else if(n.slice(0,2)==="on")e.addEventListener(n.slice(2),v);else e.setAttribute(n,v===true?"":v)}add(e,k);return e}
function sv(t,a,k){var e=document.createElementNS(NS,t);if(a)for(var n in a){var v=a[n];if(v==null||v===false)continue;if(n==="text")e.textContent=v;else if(n.slice(0,2)==="on")e.addEventListener(n.slice(2),v);else e.setAttribute(n,v)}add(e,k);return e}
function $(i){return document.getElementById(i)}
function f2(x){return x==null||isNaN(x)?"n/d":Number(x).toFixed(2)}
function usd(x,d){return x==null||isNaN(x)?"n/d":(x<0?"-":"")+"$"+Math.abs(x).toLocaleString("en-US",{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d})}
function pc(x,d){return x==null?"n/d":(x>0?"+":"")+Number(x).toFixed(d==null?2:d)+"%"}
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function toast(m){var t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove("on")},2600)}
function api(m,p,b){return fetch(p,{method:m,headers:{"Content-Type":"application/json","X-Requested-With":"dashboard"},body:b?JSON.stringify(b):undefined}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||("Error "+r.status));return j})})}
function dayLabel(t){return new Date(t*1000).toLocaleDateString("es-CO",{timeZone:"UTC",weekday:"short",day:"numeric",month:"short"})}
function ago(iso){var m=Math.round((Date.now()-new Date(iso).getTime())/60000);return m<1?"ahora mismo":m<60?"hace "+m+" min":m<1440?"hace "+Math.round(m/60)+" h":"hace "+Math.round(m/1440)+" d"}
var ICON={
 home:"M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",list:"M4 6h16M4 12h16M4 18h10",book:"M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 8h7",wallet:"M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-3v3M16 14h2",
 back:"M15 5l-7 7 7 7",chev:"M6 9l6 6 6-6",x:"M6 6l12 12M18 6L6 18",plus:"M12 5v14M5 12h14"};
function tq(n){return n+(n===1?" toque":" toques")}
function ico(n,w){return sv("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":w||2,"stroke-linecap":"round","stroke-linejoin":"round","aria-hidden":"true"},[sv("path",{d:ICON[n]})])}
/* ---------- lenguaje sencillo ---------- */
function info(a){var v=a.verdict;
 if(v.indexOf("ZONA DE COMPRA")===0)return{k:"buy",l:"Comprar",ic:"▲",sub:"Zona de compra"};
 if(v.indexOf("ZONA DE VENTA")===0)return{k:"sell",l:"Vender o reducir",ic:"▼",sub:"Zona de venta"};
 if(v.indexOf("COMPRA D")===0)return{k:"wait",l:"Compra débil",ic:"●",sub:"El riesgo no compensa"};
 if(v.indexOf("FUERTE")===0)return{k:"wait",l:"Fuerte, pero caro",ic:"●",sub:"En máximos: no persigas"};
 if(v.indexOf("SESGO ALCISTA")===0)return{k:"wait",l:"Esperar mejor precio",ic:"●",sub:"Sesgo alcista"};
 if(v.indexOf("SESGO BAJISTA")===0)return{k:"wait",l:"No comprar aún",ic:"●",sub:"Sesgo bajista"};
 return{k:"wait",l:"Esperar",ic:"●",sub:"Sin ventaja clara"}}
function say(a){var i=info(a),bp=a.buy_plan,sp=a.sell_plan,s=a.supports[0],r=a.resistances[0];
 if(i.k==="buy")return "Está cerca de un suelo ("+usd(s?s.level:bp.buy_zone[0])+") y las señales acompañan. Plan: entrar cerca de "+usd(bp.entry)+", stop en "+usd(bp.stop)+", objetivo "+usd(bp.target1)+".";
 if(i.k==="sell")return "Las señales se debilitan"+(sp.price_is_in_sell_zone?" y el precio está en zona de ganancias":"")+". Si la tienes, protege con un stop cerca de "+usd(sp.trailing_stop)+".";
 if(a.verdict.indexOf("FUERTE")===0)return "Sube con fuerza pero no hay techo cerca para medir el objetivo. Mejor esperar un retroceso hacia "+usd(bp.buy_zone[0])+"–"+usd(bp.buy_zone[1])+".";
 if(a.verdict.indexOf("COMPRA D")===0)return "Se ve bien, pero arriesgas más de lo que puedes ganar (R:R "+bp.rr_target1+"). Espera un precio más cerca de "+usd(bp.buy_zone[1])+".";
 if(a.score>=1)return "Tendencia a favor, pero el precio aún no llega a su zona de compra ("+usd(bp.buy_zone[0])+"–"+usd(bp.buy_zone[1])+").";
 if(a.score<=-1)return "Las señales apuntan abajo. No es momento de comprar; vigila el soporte en "+usd(s?s.level:bp.buy_zone[0])+".";
 return "Sin señales claras. Esperar también es una posición."}
function candleStory(c){var o=c.o,h=c.h,l=c.l,cl=c.c,rg=h-l||1e-9,b=Math.abs(cl-o)/rg,up=(h-Math.max(o,cl))/rg,lo=(Math.min(o,cl)-l)/rg,col=cl>o?"verde":cl<o?"roja":"neutra",t=[];
 t.push(b>=.7?"Vela "+col+" fuerte: un bando dominó toda la sesión.":b<=.12?"Cuerpo mínimo: abrió y cerró casi igual, hubo duda.":"Vela "+col+" normal.");
 if(up>=.35)t.push("Mecha superior larga: los vendedores rechazaron los precios altos.");
 if(lo>=.35)t.push("Mecha inferior larga: los compradores defendieron el precio abajo.");
 return t.join(" ")}
/* ---------- piezas visuales ---------- */
function spark(cs,k){var d=cs.slice(-30).map(function(c){return c.c}),lo=Math.min.apply(0,d),hi=Math.max.apply(0,d),W=300,H=46,p=3;
 var pts=d.map(function(v,i){return[p+i*(W-2*p)/(d.length-1),p+(hi-v)/(hi-lo||1)*(H-2*p)]}),col=k==="sell"?"var(--sell)":k==="buy"?"var(--buy)":d[d.length-1]>=d[0]?"var(--buy)":"var(--sell)",line=pts.map(function(q,i){return(i?"L":"M")+q[0].toFixed(1)+" "+q[1].toFixed(1)}).join("");
 var s=sv("svg",{viewBox:"0 0 "+W+" "+H,preserveAspectRatio:"none",class:"spark","aria-hidden":"true"});
 s.appendChild(sv("path",{d:line+"L"+(W-p)+" "+H+"L"+p+" "+H+"Z",fill:col,opacity:".13"}));s.appendChild(sv("path",{d:line,fill:"none",stroke:col,"stroke-width":"2","stroke-linejoin":"round","stroke-linecap":"round"}));
 var l=pts[pts.length-1];s.appendChild(sv("circle",{cx:l[0],cy:l[1],r:"3.5",fill:col}));return s}
function arc(cx,cy,r,a0,a1){var p=function(a){var t=(180+a)*Math.PI/180;return[cx+r*Math.cos(t),cy+r*Math.sin(t)]},s=p(a0),e=p(a1);return"M"+s[0].toFixed(1)+" "+s[1].toFixed(1)+"A"+r+" "+r+" 0 0 1 "+e[0].toFixed(1)+" "+e[1].toFixed(1)}
function gauge(score){var g=sv("svg",{viewBox:"0 0 300 175",class:"gauge",role:"img","aria-label":"Puntaje "+score}),R=112;
 [[0,60,"var(--sell)"],[60,120,"var(--wait)"],[120,180,"var(--buy)"]].forEach(function(z){g.appendChild(sv("path",{d:arc(150,150,R,z[0],z[1]),fill:"none",stroke:z[2],"stroke-width":"20","stroke-linecap":"butt",opacity:".9"}))});
 for(var i=-6;i<=6;i++){var a=(180+(i+6)*15)*Math.PI/180,r1=R+14,r2=R+(i%3===0?22:18);g.appendChild(sv("line",{x1:150+r1*Math.cos(a),y1:150+r1*Math.sin(a),x2:150+r2*Math.cos(a),y2:150+r2*Math.sin(a),stroke:"var(--dim)","stroke-width":i%3===0?2:1}))}
 g.appendChild(sv("text",{x:"30",y:"172","text-anchor":"middle","font-size":"11",fill:"var(--sell)","font-weight":"700",text:"VENDER"}));g.appendChild(sv("text",{x:"270",y:"172","text-anchor":"middle","font-size":"11",fill:"var(--buy)","font-weight":"700",text:"COMPRAR"}));
 var n=sv("g",{class:"needle"});n.style.transform="rotate(-90deg)";n.appendChild(sv("path",{d:"M146 150L150 52L154 150Z",fill:"var(--ink)"}));g.appendChild(n);g.appendChild(sv("circle",{cx:"150",cy:"150",r:"9",fill:"var(--ink)"}));g.appendChild(sv("circle",{cx:"150",cy:"150",r:"3.5",fill:"var(--bg)"}));
 requestAnimationFrame(function(){requestAnimationFrame(function(){n.style.transform="rotate("+(clamp(score,-6,6)*15)+"deg)"})});return g}
function minis(list,w,h,hl){var W=w||200,H=h||110,lo=Infinity,hi=-Infinity;list.forEach(function(c){lo=Math.min(lo,c[2]);hi=Math.max(hi,c[1])});
 var s=sv("svg",{viewBox:"0 0 "+W+" "+H,class:"ill"}),y=function(v){return 10+(hi-v)/(hi-lo)*(H-20)},bw=W/(list.length*1.7);
 list.forEach(function(c,i){var x=(i+.5)*W/list.length,up=c[3]>=c[0],col=up?"var(--buy)":"var(--sell)";
  s.appendChild(sv("line",{x1:x,x2:x,y1:y(c[1]),y2:y(c[2]),stroke:col,"stroke-width":"2.5","stroke-linecap":"round"}));
  s.appendChild(sv("rect",{x:x-bw/2,y:y(Math.max(c[0],c[3])),width:bw,height:Math.max(2,Math.abs(y(c[0])-y(c[3]))),rx:"3",fill:col}))});return s}
/* ---------- grafico interactivo de velas ---------- */
function chartView(a,onSel){var W=360,H=250,VH=34,pr=46,pl=6,pt=10,pb=VH+18,n=CO.n,cs=a.candles.slice(-n),off=a.candles.length-cs.length,se=a.series||{};
 var lo=Infinity,hi=-Infinity;cs.forEach(function(c){lo=Math.min(lo,c.l);hi=Math.max(hi,c.h)});
 var bp=a.buy_plan;if(CO.lv){a.supports.concat(a.resistances).forEach(function(x){if(x.level>lo*.93&&x.level<hi*1.07){lo=Math.min(lo,x.level);hi=Math.max(hi,x.level)}});lo=Math.min(lo,bp.stop)}
 if(CO.bb&&se.bbl)cs.forEach(function(c,i){var l=se.bbl[off+i],u=se.bbu[off+i];if(l!=null)lo=Math.min(lo,l);if(u!=null)hi=Math.max(hi,u)});
 var pad=(hi-lo)*.05;lo-=pad;hi+=pad;var y=function(v){return pt+(hi-v)/(hi-lo)*(H-pt-pb)},bw=(W-pl-pr)/cs.length,x=function(i){return pl+i*bw+bw/2};
 var svg=sv("svg",{viewBox:"0 0 "+W+" "+H,class:"chart",role:"img","aria-label":"Gráfico de velas de "+a.symbol}),g=function(e){svg.appendChild(e);return e};
 for(var k=0;k<5;k++){var v=lo+(hi-lo)*k/4;g(sv("line",{x1:pl,x2:W-pr,y1:y(v),y2:y(v),stroke:"var(--line)","stroke-width":".6"}));g(sv("text",{x:W-pr+4,y:y(v)+3,"font-size":"9.5",fill:"var(--dim)","font-family":"DM Mono, monospace",text:v.toFixed(v>100?0:1)}))}
 if(CO.zn){var bz=bp.buy_zone,sz=a.sell_plan.sell_zone;g(sv("rect",{x:pl,y:y(bz[1]),width:W-pl-pr,height:Math.max(2,y(bz[0])-y(bz[1])),fill:"var(--buy)",opacity:".16"}));g(sv("rect",{x:pl,y:y(sz[1]),width:W-pl-pr,height:Math.max(2,y(sz[0])-y(sz[1])),fill:"var(--sell)",opacity:".16"}))}
 var used=[];function hl(v,col,lab,dash){if(v<lo||v>hi)return;var yy=y(v),clash=used.some(function(u){return Math.abs(u-yy)<11});used.push(yy);if(clash)lab="";g(sv("line",{x1:pl,x2:W-pr,y1:y(v),y2:y(v),stroke:col,"stroke-width":"1","stroke-dasharray":dash?"4 3":"",opacity:".9"}));if(lab)g(sv("text",{x:pl+3,y:y(v)-3,"font-size":"9.5",fill:col,"font-weight":"700",text:lab+" "+f2(v)}))}
 if(CO.lv){a.supports.forEach(function(s){hl(s.level,"var(--buy)","Suelo")});a.resistances.forEach(function(r){hl(r.level,"var(--sell)","Techo")});hl(bp.stop,"var(--sell)","Stop",1)}
 function path(arr,col,w,dash){var d="";arr.slice(off).slice(-n).forEach(function(v,i){if(v==null)return;d+=(d&&d.slice(-1)!=="M"?"L":"M")+x(i).toFixed(1)+" "+y(v).toFixed(1)});if(d)g(sv("path",{d:d.replace(/MM/g,"M"),fill:"none",stroke:col,"stroke-width":w,"stroke-dasharray":dash||"","stroke-linejoin":"round"}))}
 if(CO.bb&&se.bbl){path(se.bbu,"var(--acc)",1,"3 3");path(se.bbl,"var(--acc)",1,"3 3")}
 if(CO.ma&&se.sma20){path(se.sma50,"var(--wait)",1.6);path(se.sma20,"var(--acc)",1.6)}
 var vmax=Math.max.apply(0,cs.map(function(c){return c.v||0}))||1;
 cs.forEach(function(c,i){var up=c.c>=c.o,col=up?"var(--buy)":"var(--sell)",t=y(Math.max(c.o,c.c)),b=y(Math.min(c.o,c.c)),vh=(c.v||0)/vmax*VH;
  g(sv("rect",{x:x(i)-bw*.34,y:H-14-vh,width:bw*.68,height:vh,fill:col,opacity:".28"}));
  g(sv("line",{x1:x(i),x2:x(i),y1:y(c.h),y2:y(c.l),stroke:col,"stroke-width":Math.max(1,bw*.12)}));
  g(sv("rect",{x:x(i)-bw*.36,y:t,width:bw*.72,height:Math.max(1.2,b-t),fill:col,rx:Math.min(1.5,bw*.15)}))});
 var lastY=y(a.price);g(sv("line",{x1:pl,x2:W-pr,y1:lastY,y2:lastY,stroke:"var(--ink)","stroke-width":".8","stroke-dasharray":"2 3"}));
 g(sv("rect",{x:W-pr+1,y:lastY-8,width:pr-2,height:16,rx:"4",fill:"var(--ink)"}));g(sv("text",{x:W-pr+4,y:lastY+3.5,"font-size":"10","font-weight":"700",fill:"var(--bg)","font-family":"DM Mono, monospace",text:f2(a.price)}));
 g(sv("text",{x:pl,y:H-2,"font-size":"9",fill:"var(--dim)",text:dayLabel(cs[0].t)}));g(sv("text",{x:W-pr,y:H-2,"font-size":"9","text-anchor":"end",fill:"var(--dim)",text:dayLabel(cs[cs.length-1].t)}));
 var cross=g(sv("line",{y1:pt,y2:H-14,stroke:"var(--ink)","stroke-width":"1",opacity:"0"})),ring=g(sv("rect",{rx:"3",fill:"none",stroke:"var(--ink)","stroke-width":"1.5",opacity:"0"}));
 function pick(ev){var r=svg.getBoundingClientRect(),px=(ev.clientX-r.left)/r.width*W,i=clamp(Math.round((px-pl-bw/2)/bw),0,cs.length-1);cross.setAttribute("x1",x(i));cross.setAttribute("x2",x(i));cross.setAttribute("opacity",".6");
  var c=cs[i];ring.setAttribute("x",x(i)-bw*.5);ring.setAttribute("width",bw);ring.setAttribute("y",y(c.h)-2);ring.setAttribute("height",y(c.l)-y(c.h)+4);ring.setAttribute("opacity","1");onSel(c,i>0?cs[i-1]:null)}
 var down=false;svg.addEventListener("pointerdown",function(e){down=true;pick(e)});svg.addEventListener("pointermove",function(e){if(down||e.pointerType==="mouse")pick(e)});["pointerup","pointercancel"].forEach(function(n){svg.addEventListener(n,function(){down=false})});
 onSel(cs[cs.length-1],cs[cs.length-2]);return svg}
/* ---------- barra/medidor ---------- */
function meter(zones,val,min,max,labels){var m=el("div",{class:"meter"}),pos=function(v){return clamp((v-min)/(max-min),0,1)*100};
 zones.forEach(function(z){m.appendChild(el("div",{class:"z",style:"left:"+pos(z[0])+"%;width:"+(pos(z[1])-pos(z[0]))+"%;background:"+z[2]+";opacity:.35"}))});
 var mk=el("div",{class:"m",style:"left:"+pos(min)+"%"});m.appendChild(mk);requestAnimationFrame(function(){requestAnimationFrame(function(){mk.style.left=pos(val)+"%"})});
 return el("div",null,[m,el("div",{class:"mlab"},(labels||[]).map(function(l){return el("span",{text:l})}))])}
function chipK(k,t,ic){return el("span",{class:"chip "+k},[ic||"",t])}
/* ---------- Pestana HOY ---------- */
function greet(){var h=+new Date().toLocaleString("en-US",{timeZone:"America/Bogota",hour:"numeric",hour12:false})%24;return h<12?"Buenos días":h<19?"Buenas tardes":"Buenas noches"}
function mktText(m){var mm=function(n){return n>=60?Math.floor(n/60)+" h "+(n%60?(n%60)+" min":""):n+" min"},dn=["","mañana"];
 if(m.open)return"Cierra en "+mm(Math.max(1,m.closesInMin-Math.floor((Date.now()-T0)/60000)));
 if(m.opensInMin!=null)return"Abre en "+mm(m.opensInMin);
 if(m.holiday)return"Feriado NYSE";if(!m.nextOpen)return"Cerrado";
 var d=m.nextOpen.days,lab=d===1?"mañana":new Date(m.nextOpen.date+"T12:00:00Z").toLocaleDateString("es-CO",{timeZone:"UTC",weekday:"long"});return"Abre "+lab+" "+m.session.open}
function tile(a,i){var inf=info(a),pos=S.cfg.positions[a.symbol],t=el("button",{class:"tile "+inf.k,style:"--i:"+(i||0),"aria-label":a.symbol+": "+inf.l,onclick:function(){openDetail(a.symbol)}},[
 el("div",{class:"trow"},[el("div",null,[el("div",null,[el("span",{class:"sym",text:a.symbol}),el("span",{class:"xtb",text:a.symbol+".US"})]),el("div",{style:"margin-top:8px"},chipK(inf.k,inf.l,inf.ic+" "))]),
  el("div",{class:"px"},[el("span",{class:"num",text:usd(a.price)}),el("span",{class:"chg "+(a.change_pct>=0?"up":"dn"),text:(a.change_pct>=0?"▲ ":"▼ ")+pc(a.change_pct)})])]),
 el("div",{class:"say",text:say(a)}),spark(a.candles,inf.k),
 el("div",{class:"tfoot"},[el("span",{text:"RSI "+a.indicators.rsi14+" · puntaje "+(a.score>0?"+":"")+a.score}),pos?el("span",{class:"pin",text:"📌 "+pos.shares+" @ "+f2(pos.entry)}):el("span",{text:"Ver análisis ›"})])]);
 if(a.stale)t.appendChild(el("div",{class:"xs dn",text:"datos viejos"}));return t}
function viewHoy(v){var it=S.snapshot.items||{},ks=Object.keys(it).sort(function(a,b){return Math.abs(it[b].score)-Math.abs(it[a].score)}),B=[],V=[],W=[];
 ks.forEach(function(k){var i=info(it[k]).k;(i==="buy"?B:i==="sell"?V:W).push(it[k])});
 var tot=ks.length||1,hero=el("div",{class:"hero"});
 add(hero,[el("div",{class:"hello",text:greet()+" · "+new Date().toLocaleDateString("es-CO",{timeZone:"America/Bogota",weekday:"long",day:"numeric",month:"long"})}),
  el("div",{class:"big"},ks.length?[B.length?el("b",{class:"g",text:B.length+(B.length===1?" acción":" acciones")}):null,B.length?" en zona de compra":"",B.length&&V.length?", ":"",V.length?el("b",{class:"r",text:V.length+" en zona de venta"}):"",!B.length&&!V.length?["Hoy ",el("b",{text:"toca esperar"}),": nada tiene ventaja clara."]:"",B.length||V.length?".":""]:"Aún no hay datos. Pulsa actualizar."),
  el("div",{class:"split","aria-hidden":"true"},[el("span",{style:"flex:"+B.length+";background:var(--buy)"}),el("span",{style:"flex:"+W.length+";background:var(--wait)"}),el("span",{style:"flex:"+V.length+";background:var(--sell)"})]),
  el("div",{class:"legend"},[el("span",null,[el("i",{class:"dot",style:"background:var(--buy)"}),"Comprar ",el("b",{text:B.length})]),el("span",null,[el("i",{class:"dot",style:"background:var(--wait)"}),"Esperar ",el("b",{text:W.length})]),el("span",null,[el("i",{class:"dot",style:"background:var(--sell)"}),"Vender ",el("b",{text:V.length})])]),
  el("div",{class:"meta",text:S.snapshot.updated?"Datos "+ago(S.snapshot.updated)+" · Yahoo con retraso · hora de Bogotá":"Sin datos todavía"})]);v.appendChild(hero);
 var pa=[];ks.forEach(function(k){var p=S.cfg.positions[k],a=it[k];if(!p||!a)return;var d=p.stop?(a.price-p.stop)/a.indicators.atr14:99;if(a.price<=(p.stop||0)||(p.target&&a.price>=p.target)||info(a).k==="sell"||d<1)pa.push(a)});
 if(pa.length){v.appendChild(el("div",{class:"sec"},[el("h2",{text:"⚠ Tus posiciones piden atención"})]));v.appendChild(el("div",{class:"grid"},pa.map(tile)))}
 var n=0;function secc(t,sub,arr,help){if(!arr.length)return;v.appendChild(el("div",{class:"sec"},[el("h2",{text:t}),el("span",{text:sub})]));if(help)v.appendChild(el("div",{class:"help",text:help}));v.appendChild(el("div",{class:"grid"},arr.map(function(a){return tile(a,n++)})))}
 secc("Para comprar","zona de compra",B,"Estas están cerca de un suelo y con señales a favor. Toca una para ver el plan paso a paso.");
 secc("Para vender o reducir","zona de venta",V,"Las señales se debilitan. Si las tienes, revisa el stop.");
 secc("A vigilar","esperar",W,"Sin ventaja clara todavía. Esperar también es una decisión.");
 if(!ks.length){v.appendChild(el("div",{class:"empty"},[el("div",{class:"e",text:"📈"}),el("div",{text:"Todavía no hay análisis guardado."}),el("div",{style:"margin-top:14px"},el("button",{class:"btn",onclick:refresh,text:"Actualizar ahora"}))]))}
 var er=S.snapshot.errors||{};Object.keys(er).forEach(function(k){if(!it[k])v.appendChild(el("div",{class:"warn"},["⚠ ",el("div",null,[el("b",{text:k+": "}),er[k]])]))});
 v.appendChild(el("div",{class:"note",text:"Educación y aritmética sobre datos con retraso; no es consejo financiero. Este panel no coloca órdenes: tú las ejecutas a mano en XTB. El precio de XTB incluye su spread y puede diferir."}))}
/* ---------- Pestana ACCIONES ---------- */
function viewLista(v){var it=S.snapshot.items||{},ks=Object.keys(it);
 v.appendChild(el("input",{class:"search",type:"search",placeholder:"Buscar ticker…","aria-label":"Buscar",value:QRY,oninput:function(e){QRY=e.target.value.toUpperCase();renderList()}}));
 var ch=el("div",{class:"chips",role:"group","aria-label":"Filtros"});[["todos","Todas"],["buy","Comprar"],["sell","Vender"],["wait","Esperar"],["pos","Mis posiciones"]].forEach(function(f){ch.appendChild(el("button",{class:"fc","aria-pressed":FLT===f[0],onclick:function(){FLT=f[0];render()},text:f[1]}))});v.appendChild(ch);
 var so=el("div",{class:"chips"});[["senal","Por señal"],["cambio","Por cambio del día"],["rsi","Por RSI"]].forEach(function(f){so.appendChild(el("button",{class:"fc","aria-pressed":SORT===f[0],onclick:function(){SORT=f[0];render()},text:f[1]}))});v.appendChild(so);
 var box=el("div",{class:"grid",id:"lst"});v.appendChild(box);renderList()}
function renderList(){var b=$("lst");if(!b)return;var it=S.snapshot.items||{},ks=Object.keys(it).filter(function(k){var a=it[k];return(!QRY||k.indexOf(QRY)===0)&&(FLT==="todos"||(FLT==="pos"?!!S.cfg.positions[k]:info(a).k===FLT))});
 ks.sort(function(a,b){var x=it[a],y=it[b];return SORT==="cambio"?Math.abs(y.change_pct)-Math.abs(x.change_pct):SORT==="rsi"?x.indicators.rsi14-y.indicators.rsi14:Math.abs(y.score)-Math.abs(x.score)});
 b.textContent="";if(!ks.length)b.appendChild(el("div",{class:"empty",style:"grid-column:1/-1"},[el("div",{class:"e",text:"🔍"}),"Nada coincide con ese filtro."]));ks.forEach(function(k,i){b.appendChild(tile(it[k],i))})}
/* ---------- Pestana APRENDER ---------- */
var LESS=[
{e:"🕯️",t:"Cómo leer una vela",s:"Apertura, cierre y mechas",ill:function(){var s=sv("svg",{viewBox:"0 0 320 190",class:"ill"}),L=function(x1,y1,x2,y2,t,al){s.appendChild(sv("line",{x1:x1,y1:y1,x2:x2,y2:y2,stroke:"var(--dim)","stroke-dasharray":"3 3"}));s.appendChild(sv("text",{x:x2+(al==="e"?6:-6),y:y2+4,"font-size":"12",fill:"var(--ink)","text-anchor":al==="e"?"start":"end",text:t}))};
  s.appendChild(sv("line",{x1:"90",x2:"90",y1:"20",y2:"170",stroke:"var(--buy)","stroke-width":"3"}));s.appendChild(sv("rect",{x:"68",y:"60",width:"44",height:"80",rx:"5",fill:"var(--buy)"}));L(112,22,160,22,"Máximo (lo más alto)","e");L(112,60,160,60,"Cierre","e");L(112,140,160,140,"Apertura","e");L(90,170,160,170,"Mínimo (lo más bajo)","e");
  s.appendChild(sv("text",{x:"20",y:"100","font-size":"12",fill:"var(--ink)",text:"Cuerpo"}));s.appendChild(sv("text",{x:"6",y:"40","font-size":"11",fill:"var(--mut)",text:"mecha"}));s.appendChild(sv("text",{x:"6",y:"160","font-size":"11",fill:"var(--mut)",text:"mecha"}));
  s.appendChild(sv("text",{x:"160",y:"96","font-size":"11.5",fill:"var(--mut)",text:"Verde: cerró arriba."}));s.appendChild(sv("text",{x:"160",y:"112","font-size":"11.5",fill:"var(--mut)",text:"Roja: cerró abajo."}));return s},
 p:["Cada vela resume una sesión con 4 precios: <b>apertura, máximo, mínimo y cierre</b>.","El <b>cuerpo</b> muestra quién ganó la sesión. Las <b>mechas</b> son lo que el precio visitó y fue rechazado: mecha larga = rechazo fuerte.","Una vela sola dice poco. Importa <b>dónde</b> aparece (cerca de un suelo o un techo) y qué hace la siguiente."]},
{e:"🔨",t:"Patrones que reconoce el coach",s:"Martillo, envolvente, estrella…",ill:function(){var s=sv("svg",{viewBox:"0 0 360 150",class:"ill"}),P=[["Martillo",[[110,111,100,109],[107,108,98,106],[104,105,92,104.8]],"alcista"],["Envolvente alcista",[[108,109,104,105],[104,111,103,110]],"alcista"],["Estrella fugaz",[[100,104,99,103],[103,111,102.5,103.5]],"bajista"]];
  P.forEach(function(p,i){var g=minis(p[1],110,90);g.setAttribute("x",i*120);g.setAttribute("y",8);g.setAttribute("width",116);g.setAttribute("height",100);s.appendChild(g);s.appendChild(sv("text",{x:i*120+58,y:"126","text-anchor":"middle","font-size":"11.5","font-weight":"700",fill:"var(--ink)",text:p[0]}));s.appendChild(sv("text",{x:i*120+58,y:"142","text-anchor":"middle","font-size":"10.5",fill:p[2]==="alcista"?"var(--buy)":"var(--sell)",text:p[2]}))});return s},
 p:["<b>Alcistas:</b> martillo, martillo invertido, envolvente alcista, línea penetrante, estrella de la mañana, tres soldados blancos.","<b>Bajistas:</b> hombre colgado, estrella fugaz, envolvente bajista, nube oscura, estrella de la tarde, tres cuervos negros.","<b>Regla de oro:</b> un patrón alcista <b>sobre un soporte</b> o uno bajista <b>bajo una resistencia</b> vale el doble. En medio de la nada, fiabilidad media."]},
{e:"🧱",t:"Soporte y resistencia",s:"Suelos y techos del precio",ill:function(){var s=sv("svg",{viewBox:"0 0 320 150",class:"ill"}),pts=[[10,110],[50,60],[85,100],[125,55],[160,98],[200,58],[235,92],[275,40]];
  s.appendChild(sv("rect",{x:"0",y:"50",width:"320",height:"16",fill:"var(--sell)",opacity:".18"}));s.appendChild(sv("rect",{x:"0",y:"92",width:"320",height:"16",fill:"var(--buy)",opacity:".18"}));
  s.appendChild(sv("text",{x:"8",y:"46","font-size":"11",fill:"var(--sell)","font-weight":"700",text:"TECHO (resistencia): aquí vendes o no persigues"}));s.appendChild(sv("text",{x:"8",y:"128","font-size":"11",fill:"var(--buy)","font-weight":"700",text:"SUELO (soporte): aquí compras con stop corto"}));
  s.appendChild(sv("path",{d:pts.map(function(p,i){return(i?"L":"M")+p[0]+" "+p[1]}).join(""),fill:"none",stroke:"var(--ink)","stroke-width":"2.5","stroke-linejoin":"round"}));return s},
 p:["Un <b>soporte</b> es un precio donde los compradores ya aparecieron antes. Una <b>resistencia</b>, donde aparecieron los vendedores.","Más toques = nivel más respetado. Si se rompe con fuerza, suele cambiar de rol: el suelo roto se vuelve techo.","Compras cerca del soporte porque tu <b>stop queda corto</b> (arriesgas poco). Vendes cerca de la resistencia porque ahí cuesta más subir."]},
{e:"⚖️",t:"Riesgo y beneficio (R:R)",s:"Por qué casi nunca se acierta todo",ill:function(){var s=sv("svg",{viewBox:"0 0 320 120",class:"ill"});s.appendChild(sv("rect",{x:"20",y:"30",width:"60",height:"30",rx:"8",fill:"var(--sell)"}));s.appendChild(sv("rect",{x:"84",y:"30",width:"190",height:"30",rx:"8",fill:"var(--buy)"}));
  s.appendChild(sv("text",{x:"50",y:"50","text-anchor":"middle","font-size":"12","font-weight":"700",fill:"var(--sellI)",text:"Arriesgas 1"}));s.appendChild(sv("text",{x:"179",y:"50","text-anchor":"middle","font-size":"12","font-weight":"700",fill:"var(--buyI)",text:"Puedes ganar 3"}));
  s.appendChild(sv("text",{x:"20",y:"90","font-size":"12",fill:"var(--ink)",text:"R:R 3 a 1: aciertas solo 3 de cada 10 y empatas."}));return s},
 p:["<b>R</b> es lo que arriesgas: entrada menos stop. Si el objetivo está a 2R, ganas el doble de lo que arriesgas.","Con R:R de 2 a 1 puedes acertar solo el 40 % y aun así ganar dinero. Con R:R menor a 1,5 casi nunca compensa.","Arriesga entre 0,5 y 1 % de tu cuenta por operación: cinco pérdidas seguidas deben doler poco."]},
{e:"📏",t:"ATR y el stop",s:"Cuánto se mueve el precio por día",ill:null,
 p:["El <b>ATR</b> es el rango promedio por vela. Si una acción se mueve $3 al día, un stop a $0,50 saltará por puro ruido.","Pon el stop <b>debajo del soporte menos medio ATR</b>: fuera del ruido, pero dentro de la lógica.","Las acciones a comprar salen de: <b>(cuenta × % de riesgo) ÷ (entrada − stop)</b>. Así una pérdida cuesta siempre lo mismo, sea la acción que sea."]},
{e:"🌡️",t:"RSI: calor del precio",s:"Sobrecompra y sobreventa",ill:function(){var s=sv("svg",{viewBox:"0 0 320 80",class:"ill"});[[20,96,"var(--buy)","Sobreventa <30"],[96,224,"var(--card2)","Normal"],[224,300,"var(--sell)","Sobrecompra >70"]].forEach(function(z){s.appendChild(sv("rect",{x:z[0],y:"26",width:z[1]-z[0],height:"20",fill:z[2],opacity:z[2]==="var(--card2)"?"1":".55"}));s.appendChild(sv("text",{x:(z[0]+z[1])/2,y:"64","text-anchor":"middle","font-size":"11",fill:"var(--mut)",text:z[3]}))});return s},
 p:["El <b>RSI</b> (0 a 100) compara las subidas y bajadas recientes. Bajo 30 cayó mucho y rápido; sobre 70 subió mucho y rápido.","En una tendencia fuerte puede quedarse sobre 70 semanas: <b>sobrecompra no es «vende ya»</b>.","Úsalo como filtro: sobreventa + soporte + vela de giro = tres cosas alineadas."]},
{e:"〰️",t:"Medias móviles y MACD",s:"La tendencia sin ruido",ill:null,
 p:["Las <b>medias</b> (20, 50 y 200 días) promedian los últimos cierres. Precio sobre la 50 y la 50 sobre la 200 = tendencia alcista sana.","Bajo la media de 200 no compres «porque está barato»: es un cuchillo cayendo hasta que gire.","El <b>MACD</b> mide si el impulso gana o pierde fuerza. Llega tarde: sirve para confirmar, no para adivinar."]},
{e:"📊",t:"Volumen: la convicción",s:"Quién empuja realmente",ill:null,
 p:["El volumen es cuánta gente está detrás del movimiento.","Una ruptura con volumen 1,5× o más es creíble. Sin volumen, sospecha de <b>falsa ruptura</b>.","Una vela de giro con volumen alto pesa mucho más que la misma vela con volumen bajo."]},
{e:"🧠",t:"Disciplina",s:"Lo que separa a quien dura",ill:null,
 p:["<b>1.</b> Escribe el plan antes de entrar: entrada, stop y objetivo.","<b>2.</b> El stop no se mueve en contra. Solo a favor (a break-even cuando llevas 1R).","<b>3.</b> No promedies a la baja una operación perdedora.","<b>4.</b> Perder una operación no es fallar; romper tus reglas sí.","<b>5.</b> Lleva un diario: ticker, razón, resultado, qué aprendiste."]}];
var QZ=[
{q:"Una vela con cuerpo pequeño y mecha inferior larga aparece tras 5 días de caída, justo sobre un soporte. ¿Qué es?",o:["Martillo: posible suelo","Estrella fugaz: posible techo","Doji: no significa nada"],a:0,x:"Los vendedores empujaron abajo pero los compradores devolvieron el precio. Espera que la siguiente vela cierre arriba antes de entrar."},
{q:"Compras a $50 con stop en $48 y objetivo en $53. ¿Cuál es el R:R?",o:["0,67 a 1","1,5 a 1","3 a 1"],a:1,x:"Arriesgas $2 para ganar $3: 1,5 a 1. Es el mínimo aceptable; mejor 2 a 1 o más."},
{q:"Cuenta de $10.000, riesgo 1 %, entrada $50, stop $48. ¿Cuántas acciones?",o:["20","50","200"],a:1,x:"Riesgo = $100. $100 ÷ $2 de distancia = 50 acciones ($2.500 de capital)."},
{q:"El RSI marca 78 en una acción que sube fuerte sobre su media de 50. ¿Vendes todo?",o:["Sí, es sobrecompra","No automáticamente: busca confirmación","Compro más"],a:1,x:"En tendencia fuerte el RSI aguanta alto. Espera una vela bajista en resistencia o un cierre bajo tu stop de seguimiento."},
{q:"Una envolvente bajista aparece lejos de cualquier resistencia. ¿Es tan fiable como en una resistencia?",o:["Igual","Vale la mitad","No vale nada"],a:1,x:"Sin resistencia cerca los patrones valen la mitad: el contexto pesa más que la forma."},
{q:"Rompe una resistencia con volumen de 0,6× el promedio. ¿Qué haces?",o:["Compro con todo","Cautela: puede ser falsa ruptura","Vendo en corto"],a:1,x:"Volumen bajo sugiere falsa ruptura. Espera un retesteo de la resistencia como nuevo soporte."},
{q:"Tu operación lleva 1R a favor. ¿Qué haces con el stop?",o:["Lo quito","Lo subo a tu precio de entrada","Lo bajo para darle espacio"],a:1,x:"Lo subes a break-even: ya no puedes perder dinero y dejas correr la ganancia."}];
function viewLearn(v){v.appendChild(el("div",{class:"sec"},[el("h2",{text:"Aprende a leer el mercado"}),el("span",{text:LESS.length+" lecciones"})]));
 v.appendChild(el("div",{class:"help",text:"Toca una lección. Todo se explica con dibujos y con lo que ves en tus acciones."}));
 LESS.forEach(function(l,i){var d=el("details",{class:"lesson"},[el("summary",null,[el("div",{class:"em",text:l.e}),el("div",null,[el("h3",{text:l.t}),el("div",{class:"sub",text:l.s})]),el("span",{class:"car"},ico("chev"))]),el("div",{class:"body"},[l.ill?l.ill():null,l.p.map(function(t){var p=el("p");p.innerHTML=t;return p})])]);v.appendChild(d)});
 v.appendChild(el("div",{class:"sec"},[el("h2",{text:"Ponte a prueba"})]));var box=el("div",{class:"box quiz"});v.appendChild(box);quiz(box)}
function quiz(box){var st=lsGet("quiz",{i:0,ok:0,n:0}),q=QZ[st.i%QZ.length],done=false;box.textContent="";
 add(box,[el("div",{class:"score"},["Aciertos ",el("b",{text:st.ok+"/"+st.n})]),el("div",{class:"q",text:q.q})]);
 q.o.forEach(function(o,k){var b=el("button",{class:"opt2",text:o,onclick:function(){if(done)return;done=true;st.n++;if(k===q.a)st.ok++;st.i++;lsSet("quiz",st);
  Array.prototype.forEach.call(box.querySelectorAll(".opt2"),function(x,j){x.disabled=true;if(j===q.a)x.classList.add("ok");else if(j===k)x.classList.add("no")});
  box.appendChild(el("div",{class:"tip"},[el("span",{text:k===q.a?"✅":"💡"}),el("div",null,[el("b",{text:k===q.a?"¡Correcto! ":"Casi. "}),q.x])]));box.appendChild(el("button",{class:"btn sec2 full",style:"margin-top:12px",onclick:function(){quiz(box)},text:"Siguiente pregunta"}))}});box.appendChild(b)})}
/* ---------- Pestana POSICIONES ---------- */
function viewPos(v){var ps=S.cfg.positions,ks=Object.keys(ps),it=S.snapshot.items||{},tot=0;
 v.appendChild(el("div",{class:"sec"},[el("h2",{text:"Mis posiciones"}),el("button",{class:"btn sec2",style:"min-height:38px;padding:6px 14px",onclick:function(){openPosForm()}},[ico("plus"),"Agregar"])]));
 v.appendChild(el("div",{class:"help",text:"Registra lo que abres en XTB y recibirás un push si toca tu stop o tu objetivo."}));
 if(!ks.length){v.appendChild(el("div",{class:"empty"},[el("div",{class:"e",text:"📌"}),el("div",{text:"Aún no tienes posiciones registradas."}),el("div",{class:"sm",style:"margin:6px 0 14px",text:"Abre una acción, ve a «Plan» y toca «Registrar esta operación»."}),el("button",{class:"btn",onclick:function(){openPosForm()},text:"Agregar una"})]));return}
 ks.forEach(function(k){var p=ps[k],a=it[k],pr=a?a.price:p.entry,pl=(pr-p.entry)*p.shares;tot+=pl;
  var lo=p.stop||p.entry*.9,hi=p.target||p.entry*1.15,pos=function(x){return clamp((x-lo)/(hi-lo),0,1)*100},card=el("div",{class:"pcard"});
  add(card,[el("div",{class:"trow"},[el("div",null,[el("span",{class:"sym",text:k}),el("span",{class:"xtb",text:k+".US"}),el("div",{class:"sm mut",style:"margin-top:4px",text:p.shares+" acciones @ "+usd(p.entry)})]),el("div",{class:"px"},[el("span",{class:"num "+(pl>=0?"up":"dn"),style:"font-size:21px",text:(pl>=0?"+":"")+usd(pl)}),el("span",{class:"chg "+(pl>=0?"up":"dn"),text:pc((pr/p.entry-1)*100)})])]),
   el("div",{class:"track","aria-label":"Posición entre stop y objetivo"},[el("div",{class:"tk",style:"left:"+pos(p.entry)+"%"}),el("div",{class:"me",style:"left:"+pos(pr)+"%"},el("span",{style:"width:6px;height:6px;border-radius:50%;background:var(--bg)"}))]),
   el("div",{class:"mlab"},[el("span",{text:"Stop "+usd(p.stop)}),el("span",{text:"Entrada "+usd(p.entry)}),el("span",{text:"Obj. "+usd(p.target)})]),
   el("div",{style:"display:flex;gap:8px;margin-top:12px"},[a?el("button",{class:"btn sec2",style:"flex:1;min-height:42px",onclick:function(){openDetail(k)},text:"Ver análisis"}):null,el("button",{class:"btn dng",style:"min-height:42px",onclick:function(){if(confirm("¿Quitar "+k+" de tus posiciones?"))api("DELETE","/api/positions?symbol="+encodeURIComponent(k)).then(load).then(function(){toast("Posición quitada")})},text:"Quitar"})])]);v.appendChild(card)});
 v.appendChild(el("div",{class:"box"},[el("div",{class:"kv"},[el("div",{text:"Resultado total (en papel)"}),el("div",{class:tot>=0?"up":"dn",text:(tot>=0?"+":"")+usd(tot)})])]))}
/* ---------- Hoja de detalle ---------- */
function openSheet(){$("shade").classList.add("on");$("sheet").classList.add("on");document.body.classList.add("lock")}
function closeSheet(){$("shade").classList.remove("on");$("sheet").classList.remove("on");document.body.classList.remove("lock");SEL=null;ST=[]}
function shHead(title,sub,back){var h=$("shh");h.textContent="";add(h,[el("button",{class:"back","aria-label":back?"Volver":"Cerrar",onclick:back||closeSheet},ico(back?"back":"x")),el("div",{style:"flex:1;min-width:0"},[el("div",{class:"serif",style:"font-size:20px;font-weight:700;letter-spacing:-.02em",text:title}),sub?el("div",{class:"xs mut",text:sub}):null])])}
function openDetail(sym){SEL=sym;PANE="resumen";openSheet();renderDetail()}
function renderDetail(){var a=(S.snapshot.items||{})[SEL];if(!a)return;var inf=info(a);
 shHead(a.symbol,"XTB: "+a.symbol+".US · "+usd(a.price)+" "+pc(a.change_pct)+" · datos al "+a.as_of);
 var sg=$("shseg");sg.textContent="";var seg=el("div",{class:"seg",role:"tablist"});[["resumen","Resumen"],["grafico","Gráfico"],["plan","Plan"],["ind","Indicadores"]].forEach(function(p){seg.appendChild(el("button",{role:"tab","aria-selected":PANE===p[0],onclick:function(){PANE=p[0];renderDetail()},text:p[1]}))});sg.appendChild(seg);
 var b=$("shb");b.textContent="";var pane=el("div",{class:"pane"});b.appendChild(pane);b.scrollTop=0;({resumen:paneResumen,grafico:paneGrafico,plan:panePlan,ind:paneInd})[PANE](pane,a,inf)}
function paneResumen(p,a,inf){var lc=a.last_candle,c=a.candles[a.candles.length-1];
 p.appendChild(el("div",{class:"bigv "+inf.k},[chipK(inf.k,inf.sub,inf.ic+" "),el("div",{class:"t",text:inf.l}),el("div",{class:"sm",text:say(a)}),el("div",{style:"margin-top:8px"},gauge(a.score)),el("div",{class:"sm mut",style:"text-align:center;margin-top:-4px",text:"Puntaje "+(a.score>0?"+":"")+a.score+" · sobre +3 compra · bajo −3 venta"})]));
 if(a.live_candle)p.appendChild(el("div",{class:"tip"},[el("span",{text:"⏳"}),el("div",null,[el("b",{text:"La vela de hoy aún se forma. "}),"Un patrón solo es firme cuando la vela cierra."])]));
 var why=el("div",{class:"why"});a.reasons.forEach(function(r){var pos=r.points>0,neg=r.points<0;why.appendChild(el("div",{class:"r"},[el("div",{class:"p "+(pos?"pos":neg?"neg":"zero"),text:(r.points>0?"+":"")+r.points}),el("div",null,[r.text,el("div",{class:"pbar"},el("i",{style:"width:"+Math.min(100,Math.abs(r.points)*40)+"%;background:"+(pos?"var(--buy)":neg?"var(--sell)":"var(--dim)")}))])]))});
 if(!a.reasons.length)why.appendChild(el("div",{class:"sm mut",text:"Ninguna señal activa. Esperar también es información."}));
 p.appendChild(el("div",{class:"box"},[el("h3",{text:"¿Por qué este veredicto?"}),el("p",{class:"lead",text:"Cada señal suma o resta puntos. Aquí están todas, con su razón."}),why]));
 var an=el("div",{class:"box"});add(an,[el("h3",{text:"La vela de hoy, por dentro"}),el("p",{class:"lead",text:candleStory(c)}),candleAnat(c),
  a.patterns.length?a.patterns.map(function(q){return el("div",{class:"tip"},[el("span",{text:q.bias==="alcista"?"🟢":q.bias==="bajista"?"🔴":"🟡"}),el("div",null,[el("b",{text:q.name+" ("+q.bias+"). "}),q.why])])}):el("div",{class:"sm mut",style:"margin-top:8px",text:"Sin patrón clásico hoy. Una vela normal también cuenta: no fuerces una señal."})]);p.appendChild(an);
 p.appendChild(el("div",{class:"tip"},[el("span",{text:"🎓"}),el("div",null,[el("b",{text:"Para aprender: "}),lessonFor(a)])]))}
function lessonFor(a){var r=a.indicators.rsi14,bp=a.buy_plan;if(r<30||r>70)return"RSI "+r+": bajo 30 es sobreventa, sobre 70 sobrecompra. En tendencia fuerte puede quedarse extremo: úsalo como filtro, no como señal única.";
 if(bp.rr_target1!=null&&bp.rr_target1<1.5&&!bp.no_resistance_above)return"R:R "+bp.rr_target1+": arriesgas 1 para ganar "+bp.rr_target1+". Con menos de 1,5 casi nunca compensa. Espera un precio más cerca del soporte.";
 if(bp.no_resistance_above)return"Sin resistencia arriba no hay techo claro para el objetivo. Perseguir el precio en máximos es lo que más duele: compra retrocesos.";
 return"ATR "+usd(a.indicators.atr14)+": es lo que se mueve el precio por vela. Tu stop debe quedar fuera de ese ruido."}
function candleAnat(c){var W=300,H=170,hi=c.h,lo=c.l,y=function(v){return 14+(hi-v)/((hi-lo)||1)*(H-28)},up=c.c>=c.o,col=up?"var(--buy)":"var(--sell)",x=70,s=sv("svg",{viewBox:"0 0 "+W+" "+H,class:"ill","aria-hidden":"true"});
 s.appendChild(sv("line",{x1:x,x2:x,y1:y(hi),y2:y(lo),stroke:col,"stroke-width":"4","stroke-linecap":"round"}));s.appendChild(sv("rect",{x:x-22,y:y(Math.max(c.o,c.c)),width:"44",height:Math.max(3,Math.abs(y(c.o)-y(c.c))),rx:"5",fill:col}));
 function lab(v,t,ty){s.appendChild(sv("line",{x1:x+24,x2:150,y1:y(v),y2:ty,stroke:"var(--dim)","stroke-dasharray":"2 3"}));s.appendChild(sv("text",{x:"154",y:ty+4,"font-size":"12",fill:"var(--ink)",text:t+" "+f2(v)}))}
 var ty=[18,H*.38,H*.62,H-14];lab(hi,"Máximo",ty[0]);lab(up?c.c:c.o,up?"Cierre":"Apertura",ty[1]);lab(up?c.o:c.c,up?"Apertura":"Cierre",ty[2]);lab(lo,"Mínimo",ty[3]);return s}
/* grafico */
function paneGrafico(p,a){var tt=el("div",{class:"tt"}),cv=el("div");
 function sel(c,pv){tt.textContent="";var ch=pv?(c.c/pv.c-1)*100:null;add(tt,[el("div",{class:"h"},[el("span",{text:dayLabel(c.t)}),el("span",{text:"Vol "+(c.v/1e6).toFixed(1)+"M"+(ch!=null?" · "+pc(ch):"")})]),el("div",{class:"num",style:"margin-top:4px;font-size:13px"},"A "+f2(c.o)+"  M "+f2(c.h)+"  m "+f2(c.l)+"  C "+f2(c.c)),el("div",{class:"s",text:candleStory(c)})])}
 function draw(){cv.textContent="";cv.appendChild(chartView(a,sel))}
 p.appendChild(el("div",{class:"help",style:"margin:0 2px 8px",text:"Desliza el dedo sobre el gráfico para leer cada vela."}));p.appendChild(tt);p.appendChild(cv);draw();
 var op=el("div",{class:"opts"});[["n:30","30 velas"],["n:60","60"],["n:120","120"]].forEach(function(r){var n=+r[0].slice(2);op.appendChild(el("button",{class:"opt","aria-pressed":CO.n===n,onclick:function(){CO.n=n;renderDetail()},text:r[1]}))});
 [["ma","Medias"],["bb","Bollinger"],["lv","Suelos y techos"],["zn","Zonas"]].forEach(function(r){op.appendChild(el("button",{class:"opt","aria-pressed":CO[r[0]],onclick:function(){CO[r[0]]=!CO[r[0]];renderDetail()},text:r[1]}))});p.appendChild(op);
 p.appendChild(el("div",{class:"box",style:"margin-top:12px"},[el("h3",{text:"Cómo leer este gráfico"}),el("div",{class:"sm mut"},[
  el("p",null,[el("i",{class:"sw",style:"background:var(--buy)"}),"Verde = cerró arriba de su apertura. ",el("i",{class:"sw",style:"background:var(--sell);margin-left:8px"}),"Roja = cerró abajo."]),
  el("p",null,[el("i",{class:"sw",style:"background:var(--buy);opacity:.5"}),"Banda verde: zona de compra · ",el("i",{class:"sw",style:"background:var(--sell);opacity:.5"}),"banda roja: zona de venta."]),
  el("p",null,[el("i",{class:"sw",style:"background:var(--acc)"}),"Media de 20 días · ",el("i",{class:"sw",style:"background:var(--wait)"}),"media de 50. Precio sobre ellas = tendencia sana."]),
  el("p",{style:"margin:0"},"Las barritas grises de abajo son el volumen: más altas = más gente operando.")])]))}
/* plan */
function panePlan(p,a){var bp=a.buy_plan,sp=a.sell_plan,e=bp.entry,r=e-bp.stop,rw=bp.target1-e,rows=[];
 var P=function(l,v,c,sub){rows.push({l:l,v:v,c:c,s:sub})};
 if(Math.abs(bp.target2-bp.target1)>.01)P("Objetivo 2 (2R)",bp.target2,"var(--buy)");P("Objetivo 1",bp.target1,"var(--buy)",bp.no_resistance_above?"sin techo cerca: referencia matemática":"próximo techo");
 a.resistances.forEach(function(x){if(Math.abs(x.level-bp.target1)>.01)P("Techo ("+tq(x.touches)+")",x.level,"var(--sell)")});
 P("Zona de venta",sp.sell_zone[0],"var(--sell)",usd(sp.sell_zone[0])+" – "+usd(sp.sell_zone[1]));P("AHORA",a.price,"var(--ink)");P("Zona de compra",bp.buy_zone[1],"var(--buy)",usd(bp.buy_zone[0])+" – "+usd(bp.buy_zone[1]));
 P("Entrada de referencia",e,"var(--acc)");a.supports.slice(0,2).forEach(function(x){P("Suelo ("+tq(x.touches)+")",x.level,"var(--buy)")});P("Stop",bp.stop,"var(--sell)","si lo toca, el plan se invalida");
 rows.sort(function(x,y){return y.v-x.v});
 var lad=el("div",{class:"ladder"});rows.forEach(function(x){var d=(x.v/a.price-1)*100;lad.appendChild(el("div",{class:"lr"+(x.l==="AHORA"?" now":"")},[el("i",{class:"d",style:"--c:"+x.c}),el("div",null,[el("b",{text:x.l}),x.s?el("small",{text:x.s}):null]),el("div",{class:"n"},[usd(x.v),el("small",{text:x.l==="AHORA"?"precio actual":pc(d,1)})])]))});
 p.appendChild(el("div",{class:"box"},[el("h3",{text:"El mapa de precios"}),el("p",{class:"lead",text:"De arriba (vender) a abajo (comprar y protegerte), ordenado por precio."}),lad]));
 var rr=bp.rr_target1,tot=r+rw;
 p.appendChild(el("div",{class:"box"},[el("h3",{text:"Lo que arriesgas vs. lo que puedes ganar"}),el("p",{class:"lead",text:"Entrando en "+usd(e)+" con stop en "+usd(bp.stop)+" y objetivo en "+usd(bp.target1)+"."}),
  el("div",{class:"rr"},[el("div",{style:"flex:"+Math.max(r,.01)+";background:var(--sell);color:var(--sellI)",text:"Riesgo "+usd(r)}),el("div",{style:"flex:"+Math.max(rw,.01)+";background:var(--buy);color:var(--buyI)",text:"Ganancia "+usd(rw)})]),
  el("div",{class:"sm",style:"margin-top:10px"},["Relación ",el("b",{class:"num",text:"1 : "+(rr==null?"n/d":rr)}),rr!=null&&rr<1.5&&!bp.no_resistance_above?el("div",{class:"warn",style:"margin:10px 0 0"},["⚠ ","Por debajo de 1,5 casi nunca compensa. Espera un precio mejor."]):rr!=null&&rr>=2?el("span",{class:"up",text:"  ✔ buena relación"}):null])]));
 var cfg=S.cfg,acc=cfg.account||5000,rk=cfg.riskPct||1,out=el("div",{class:"res"}),slA=el("input",{class:"inp",type:"number",inputmode:"decimal",min:"0",step:"100",value:acc}),slR=el("input",{class:"rng",type:"range",min:"0.25",max:"3",step:"0.25",value:rk}),lblR=el("b",{text:rk+" %"});
 function calc(){var A=+slA.value||0,R=+slR.value;lblR.textContent=R+" %";var sh=r>0?Math.floor(A*R/100/r):0,cap=Math.floor(A*.25/e),n=Math.min(sh,cap),cost=n*e;out.textContent="";
  [["Acciones a comprar",String(n)],["Capital que usas",usd(cost,0)],["Pérdida máxima",usd(-n*r)],["Ganancia en objetivo 1","+"+usd(n*rw)]].forEach(function(z,i){out.appendChild(el("div",null,[el("small",{text:z[0]}),el("b",{class:i===2?"dn":i===3?"up":"",text:z[1]})]))});
  note.textContent=sh>cap?"Tope del 25 % de tu cuenta: pediría "+sh+" por riesgo, pero te limita a "+cap+".":"Arriesgas el "+R+" % de tu cuenta ("+usd(A*R/100,0)+") si toca el stop."}
 var note=el("div",{class:"sm mut",style:"margin-top:10px"});slA.addEventListener("input",calc);slR.addEventListener("input",calc);
 p.appendChild(el("div",{class:"box"},[el("h3",{text:"¿Cuántas acciones compro?"}),el("p",{class:"lead",text:"Mueve los controles y mira cómo cambia. El tamaño sale de tu riesgo, no de las ganas."}),
  el("div",{class:"calc"},[el("div",null,[el("label",null,["Tamaño de tu cuenta (USD)"]),slA]),el("div",null,[el("label",null,["Riesgo por operación ",lblR]),slR]),out])," ",note]));calc();
 p.appendChild(el("div",{class:"box"},[el("h3",{text:"Si decides entrar, en XTB"}),el("ol",{class:"steps"},[el("li",{text:"Busca "+a.symbol+".US (acción real, no CFD, si puedes) y revisa el spread y la comisión."}),el("li",{text:"Compra "+(bp.sizing?bp.sizing.shares_capped_25pct:"las acciones calculadas")+" cerca de "+usd(e)+" (orden límite, no a mercado)."}),el("li",{text:"Pon el stop loss en "+usd(bp.stop)+" y el take profit en "+usd(bp.target1)+" en la misma orden."}),el("li",{text:"Si el precio avanza 1R, sube el stop a tu entrada. Nunca lo bajes."}),el("li",{text:"Si es CFD, recuerda el swap nocturno y no uses apalancamiento alto."})]),
  el("div",{style:"margin-top:14px"},el("button",{class:"btn full",onclick:function(){openPosForm({symbol:a.symbol,entry:e,stop:bp.stop,target:bp.target1,shares:bp.sizing?bp.sizing.shares_capped_25pct:"",back:function(){renderDetail()}})},text:"Registrar esta operación"}))]));
 p.appendChild(el("div",{class:"note",text:"Es un plan, no una orden ni consejo financiero. El precio de XTB incluye spread y puede diferir del de Yahoo."}))}
/* indicadores */
function ind(p,o){var d=el("details",{class:"ind"},[el("summary",null,[el("div",{class:"ih"},[el("b",{text:o.t}),el("span",{style:"display:flex;gap:8px;align-items:center"},[o.chip,el("span",{class:"car"},ico("chev"))])]),o.vis,el("div",{class:"sm",text:o.now})]),el("div",{class:"ex"},o.ex.map(function(t){var q=el("p");q.innerHTML=t;return q}))]);p.appendChild(d)}
function paneInd(p,a){var i=a.indicators,px=a.price;p.appendChild(el("div",{class:"help",style:"margin:0 2px 10px",text:"Toca cada tarjeta para ver qué significa en palabras simples."}));
 var above=[i.sma20,i.sma50,i.sma200].filter(function(m){return m!=null&&px>m}).length;
 var lo=Math.min(px,i.sma20||px,i.sma50||px,i.sma200||px),hi=Math.max(px,i.sma20||px,i.sma50||px,i.sma200||px),pos=function(v){return(v-lo)/((hi-lo)||1)*92+4},tr=el("div",{style:"position:relative;height:46px"});
 tr.appendChild(el("div",{style:"position:absolute;left:0;right:0;top:20px;height:3px;background:var(--line);border-radius:3px"}));
 [[i.sma200,"200","var(--sell)"],[i.sma50,"50","var(--wait)"],[i.sma20,"20","var(--acc)"],[px,"Precio","var(--ink)"]].forEach(function(m,k){if(m[0]==null)return;tr.appendChild(el("div",{style:"position:absolute;left:"+pos(m[0])+"%;top:"+(k%2?0:26)+"px;transform:translateX(-50%);font-size:10.5px;font-weight:700;color:"+m[2]+";white-space:nowrap",text:m[1]}));tr.appendChild(el("div",{style:"position:absolute;left:"+pos(m[0])+"%;top:15px;width:12px;height:12px;border-radius:50%;background:"+m[2]+";transform:translateX(-50%)"}))});
 ind(p,{t:"Tendencia (medias)",chip:chipK(above>=2?"buy":above===0?"sell":"wait",above+" de 3 por encima"),vis:tr,now:"Precio "+usd(px)+" · media 20: "+usd(i.sma20)+" · 50: "+usd(i.sma50)+" · 200: "+usd(i.sma200),ex:["Las <b>medias</b> promedian los últimos cierres y muestran hacia dónde va el precio sin el ruido diario.","Precio sobre las tres = tendencia sana: buscas compras en retrocesos. Bajo la de 200, <b>no compres «porque está barato»</b>."]});
 var r=i.rsi14;ind(p,{t:"RSI (calor del precio)",chip:chipK(r<30?"buy":r>70?"sell":"wait",r<30?"sobreventa":r>70?"sobrecompra":"normal"),vis:meter([[0,30,"var(--buy)"],[30,70,"var(--dim)"],[70,100,"var(--sell)"]],r,0,100,["0","30","70","100"]),now:"RSI "+r+(r<30?": cayó mucho y rápido, zona de posibles rebotes.":r>70?": subió mucho y rápido, riesgo de pausa.":": zona neutral, sin extremos."),ex:["El <b>RSI</b> va de 0 a 100. Compara cuánto subió y cuánto bajó en las últimas 14 velas.","Bajo 30: sobreventa. Sobre 70: sobrecompra. En tendencia fuerte puede quedarse extremo mucho tiempo: úsalo como filtro, no como señal única."]});
 var h=i.macd_hist,sc=Math.max(i.atr14*.4,.01);ind(p,{t:"MACD (impulso)",chip:chipK(h>0?"buy":"sell",h>0?"alcista":"bajista"),vis:meter([[-1,0,"var(--sell)"],[0,1,"var(--buy)"]],clamp(h/sc,-1,1),-1,1,["Bajista","0","Alcista"]),now:"Histograma "+h+(h>0?": el impulso comprador pesa más.":": el impulso vendedor pesa más.")+" MACD "+i.macd+" vs señal "+i.macd_signal+".",ex:["El <b>MACD</b> es la diferencia entre una media rápida (12) y una lenta (26). El histograma muestra si ese impulso gana o pierde fuerza.","Sobre 0 y creciendo: el impulso alcista se acelera. Llega tarde: sirve para <b>confirmar</b>, no para adivinar."]});
 var pb=i.boll_up>i.boll_low?(px-i.boll_low)/(i.boll_up-i.boll_low):.5;ind(p,{t:"Bandas de Bollinger",chip:chipK(pb<0?"buy":pb>1?"sell":"wait",pb<0?"bajo la banda":pb>1?"sobre la banda":Math.round(pb*100)+"% del canal"),vis:meter([[-.2,0,"var(--buy)"],[0,1,"var(--dim)"],[1,1.2,"var(--sell)"]],clamp(pb,-.2,1.2),-.2,1.2,["Banda baja","media","Banda alta"]),now:"El precio está al "+Math.round(pb*100)+" % del canal entre "+usd(i.boll_low)+" y "+usd(i.boll_up)+".",ex:["Las bandas rodean la media de 20 días a ±2 desviaciones: cuando el precio se sale, está <b>estirado</b>.","Tocar una banda no es señal por sí solo: pide un soporte o una vela de giro cerca."]});
 var vr=i.volume_ratio;ind(p,{t:"Volumen (convicción)",chip:chipK(vr>=1.5?"buy":"wait",vr==null?"n/d":vr+"× el promedio"),vis:meter([[0,1,"var(--dim)"],[1,1.5,"var(--wait)"],[1.5,3,"var(--buy)"]],clamp(vr||0,0,3),0,3,["0×","1×","1,5×","3×"]),now:vr>=1.5?"Hay mucha más gente de lo normal: el movimiento tiene convicción.":"Volumen normal o bajo: el movimiento de hoy tiene poca convicción.",ex:["El volumen es cuánta gente operó hoy comparado con el promedio de 20 días.","Una ruptura con 1,5× o más es creíble. Sin volumen, sospecha de <b>falsa ruptura</b>."]});
 var dist=(a.buy_plan.entry-a.buy_plan.stop)/i.atr14;ind(p,{t:"ATR (cuánto se mueve)",chip:chipK("wait","$"+f2(i.atr14)+" por día"),vis:meter([[0,1,"var(--sell)"],[1,2,"var(--wait)"],[2,4,"var(--buy)"]],clamp(dist,0,4),0,4,["0","1","2","4 ATR"]),now:"Se mueve ~"+usd(i.atr14)+" ("+i.atr_pct+" %) por vela. Tu stop está a "+f2(dist)+" ATR de la entrada.",ex:["El <b>ATR</b> es el rango promedio por vela. Un stop más corto que 1 ATR salta por puro ruido.","Con 1 a 2 ATR de distancia, el stop queda fuera del ruido pero sigue protegiéndote."]});
 var rg=(px-i.lo52)/((i.hi52-i.lo52)||1);ind(p,{t:"Rango de 52 semanas",chip:chipK(rg>.9?"sell":rg<.15?"buy":"wait",Math.round(rg*100)+"% del rango"),vis:meter([[0,.15,"var(--buy)"],[.15,.85,"var(--dim)"],[.85,1,"var(--sell)"]],rg,0,1,[usd(i.lo52,0),"",usd(i.hi52,0)]),now:rg>.9?"Está pegada a su máximo del año: comprar aquí es lo más caro del último año.":rg<.15?"Cerca de su mínimo del año.":"En la zona media de su rango anual.",ex:["Muestra dónde está el precio entre su mínimo y su máximo de las últimas 52 semanas.","Cerca del máximo no hay techo cercano para fijar objetivos: mejor esperar un retroceso."]})}
/* ---------- formularios (posicion, ajustes) ---------- */
function field(l,id,v,t,ph){return el("div",null,[el("label",{class:"fl",for:id,text:l}),el("input",{class:"inp",id:id,type:t||"number",inputmode:t==="text"?"text":"decimal",step:"any",value:v==null?"":v,placeholder:ph||"",autocomplete:"off"})])}
function openPosForm(pre){pre=pre||{};var back=pre.back||function(){closeSheet()};openSheet();shHead("Registrar posición","Para alertas de stop y objetivo",back);$("shseg").textContent="";var b=$("shb");b.textContent="";var msg=el("div",{class:"dn sm",style:"min-height:20px;margin-top:8px"});
 b.appendChild(el("div",{class:"pane"},[el("div",{class:"box"},[field("Ticker (sin .US)","pf-s",pre.symbol,"text"),el("div",{class:"f2"},[field("Acciones","pf-q",pre.shares),field("Entrada (USD)","pf-e",pre.entry)]),el("div",{class:"f2"},[field("Stop (USD)","pf-st",pre.stop),field("Objetivo (USD)","pf-t",pre.target)]),msg]),
  el("button",{class:"btn full",onclick:function(){api("POST","/api/positions",{symbol:$("pf-s").value,shares:$("pf-q").value,entry:$("pf-e").value,stop:$("pf-st").value,target:$("pf-t").value}).then(load).then(function(){toast("Posición guardada");pre.back?pre.back():(closeSheet(),TAB="pos",render())}).catch(function(e){msg.textContent=e.message})},text:"Guardar"})]))}
function openCfg(){openSheet();shHead("Ajustes","Tus acciones, tu cuenta y los avisos");$("shseg").textContent="";var c=S.cfg,b=$("shb");b.textContent="";var wl=c.watchlist.slice(),chipsBox=el("div",{class:"cfgchips"}),msg=el("div",{class:"sm",style:"min-height:20px;margin-top:8px"});
 function drawChips(){chipsBox.textContent="";wl.forEach(function(s,i){chipsBox.appendChild(el("span",{class:"cc"},[s,el("button",{"aria-label":"Quitar "+s,onclick:function(){wl.splice(i,1);drawChips()},text:"×"})]))})}drawChips();
 var ni=el("input",{class:"inp",placeholder:"Agregar ticker (ej. MSFT)",autocapitalize:"characters",style:"flex:1"});function addT(){var v=ni.value.trim().toUpperCase().replace(/\.US$/,"");if(v&&wl.indexOf(v)<0)wl.push(v);ni.value="";drawChips()}
 ni.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();addT()}});
 var th=el("button",{class:"btn sec2",onclick:function(){var n=document.documentElement.getAttribute("data-theme")==="light"?"dark":"light";document.documentElement.setAttribute("data-theme",n);lsSet("theme",n);document.querySelector('meta[name=theme-color]').setAttribute("content",n==="light"?"#f4efe3":"#0c0e12")},text:"Cambiar claro / oscuro"});
 b.appendChild(el("div",{class:"pane"},[el("div",{class:"box"},[el("h3",{text:"Acciones que sigues"}),el("p",{class:"lead",text:"Hasta 25. Escríbelas sin el .US de XTB."}),chipsBox,el("div",{style:"display:flex;gap:8px"},[ni,el("button",{class:"btn sec2",onclick:addT,"aria-label":"Agregar"},ico("plus"))])]),
  el("div",{class:"box"},[el("h3",{text:"Tu cuenta"}),el("p",{class:"lead",text:"Con esto el coach calcula cuántas acciones comprar."}),el("div",{class:"f2"},[field("Cuenta (USD)","cf-a",c.account,"number","ej. 5000"),field("Riesgo por operación (%)","cf-r",c.riskPct)])]),
  el("div",{class:"box"},[el("h3",{text:"Avisos al celular"}),el("p",{class:"lead",text:S.push.ntfy||S.push.telegram?"Canales activos: "+[S.push.ntfy?"ntfy":"",S.push.telegram?"Telegram":""].filter(Boolean).join(" + ")+".":"No hay canal configurado (ver README del Worker)."}),
   el("button",{class:"btn sec2 full",onclick:function(){api("POST","/api/test-push").then(function(r){msg.textContent=r.error||("Enviado por: "+(r.sent||[]).join(", ")+((r.failed||[]).length?" · falló: "+r.failed.join(", "):""))}).catch(function(e){msg.textContent=e.message})},text:"Enviarme un push de prueba"})]),
  el("div",{class:"box"},[el("h3",{text:"Apariencia"}),th,el("p",{class:"sm mut",style:"margin:12px 0 0",text:"Para usarlo como app: en el navegador del celular elige «Añadir a pantalla de inicio»."})]),msg,
  el("button",{class:"btn full",onclick:function(){addT();api("POST","/api/config",{watchlist:wl,account:$("cf-a").value,riskPct:$("cf-r").value}).then(function(){closeSheet();toast("Guardado. Actualizando…");return refresh(true)}).catch(function(e){msg.className="dn sm";msg.textContent=e.message})},text:"Guardar y actualizar"})]))}
/* ---------- armado general ---------- */
var TABS=[["hoy","Hoy","home"],["lista","Acciones","list"],["aprende","Aprender","book"],["pos","Posiciones","wallet"]];
function render(){var tb=$("tabs");tb.textContent="";TABS.forEach(function(t){tb.appendChild(el("button",{role:"tab","aria-selected":TAB===t[0],onclick:function(){TAB=t[0];render();window.scrollTo(0,0)}},[ico(t[2],1.9),t[1]]))});
 var v=$("view");v.textContent="";if(!S){for(var i=0;i<3;i++)v.appendChild(el("div",{class:"skeleton",style:"margin-bottom:12px"}));return}
 var m=S.market;$("mk").className="mk"+(m.open?" on":"");$("mkt").textContent=mktText(m);
 ({hoy:viewHoy,lista:viewLista,aprende:viewLearn,pos:viewPos})[TAB](v);if(SEL&&$("sheet").classList.contains("on")&&ST.length===0&&(S.snapshot.items||{})[SEL]&&document.querySelector(".seg"))renderDetailKeep()}
function renderDetailKeep(){/* mantiene el scroll al refrescar en segundo plano */var b=$("shb"),y=b.scrollTop;if(document.activeElement&&/INPUT/.test(document.activeElement.tagName))return;renderDetail();b.scrollTop=y}
function load(){return fetch("/api/state").then(function(r){if(r.status===401){location.reload();return}return r.json()}).then(function(j){if(!j)return;S=j;T0=Date.now();render()}).catch(function(){toast("Sin conexión; reintentaré en un momento")})}
function refresh(silent){var b=$("rf");b.classList.add("spin");return api("POST","/api/refresh").then(function(r){return load().then(function(){if(!silent)toast(r.skipped?"Listo: "+r.skipped:"Actualizado")})}).catch(function(e){toast(e.message)}).then(function(){b.classList.remove("spin")})}
$("rf").onclick=function(){refresh()};$("cfgb").onclick=function(){if(S)openCfg()};$("shade").onclick=closeSheet;
document.addEventListener("keydown",function(e){if(e.key==="Escape")closeSheet()});
(function(){var g=$("grab"),sh=$("sheet"),y0=null;g.addEventListener("pointerdown",function(e){y0=e.clientY;sh.classList.add("drag");g.setPointerCapture(e.pointerId)});
 g.addEventListener("pointermove",function(e){if(y0==null)return;var d=Math.max(0,e.clientY-y0);sh.style.transform="translateY("+d+"px)"});
 function up(e){if(y0==null)return;var d=e.clientY-y0;y0=null;sh.classList.remove("drag");sh.style.transform="";if(d>110)closeSheet()}g.addEventListener("pointerup",up);g.addEventListener("pointercancel",up)})();
var th=lsGet("theme",null);if(th){document.documentElement.setAttribute("data-theme",th);document.querySelector('meta[name=theme-color]').setAttribute("content",th==="light"?"#f4efe3":"#0c0e12")}
render();load();setInterval(function(){if(!document.hidden&&!$("sheet").classList.contains("on"))load()},60000);setInterval(function(){if(S)$("mkt").textContent=mktText(S.market)},30000);
document.addEventListener("visibilitychange",function(){if(!document.hidden)load()});
</script></body></html>`;
