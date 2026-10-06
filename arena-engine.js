(function(){
'use strict';
const YEARS=20, GROUP_N=30;
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:0}
function q(a,p){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),v=(s.length-1)*p,i=Math.floor(v),f=v-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function net(a){return a.cash+a.invested-a.debt}
function typeCfg(typeKey){return (window.TrapLab&&window.TrapLab.TYPES[typeKey])||(window.HeavenLab&&window.HeavenLab.TYPES[typeKey])}
function qualificationScore(a){
 const n=net(a),netScore=clamp((Math.log1p(Math.max(0,n+2000000))-Math.log(2000000))/Math.log(80),0,1);
 return .20*netScore+.20*clamp(a.skill/1.5,0,1)+.18*clamp(a.health,0,1)+.15*clamp(a.adaptability/1.25,0,1)+.12*clamp(a.options/5,0,1)+.10*clamp(a.wellbeing/100,0,1)+.05*clamp(a.ability/1.35,0,1);
}
function selectGroups(seed){
 const hell=window.TrapLab.init(seed);window.TrapLab.runToEnd(hell);
 const heaven=window.HeavenLab.init(seed);window.HeavenLab.runToEnd(heaven);
 let hc=hell.agents.filter(a=>a.status==='escape'||a.status==='survive');
 if(hc.length<GROUP_N)hc=hell.agents.slice();
 let vc=heaven.agents.filter(a=>a.status==='flourish'||a.status==='stable');
 if(vc.length<GROUP_N)vc=heaven.agents.slice();
 const hs=hc.map(a=>({a,score:qualificationScore(a)})).sort((x,y)=>y.score-x.score).slice(0,GROUP_N).map(x=>x.a);
 const vs=vc.map(a=>({a,score:qualificationScore(a)})).sort((x,y)=>y.score-x.score).slice(0,GROUP_N).map(x=>x.a);
 const hids=new Set(hs.map(a=>a.id));
 const overlap=vs.filter(a=>hids.has(a.id)).length;
 return {hellState:hell,heavenState:heaven,hell:hs,heaven:vs,overlap};
}
function cloneForArena(a,origin,mode){
 const t=typeCfg(a.typeKey);
 const equal=mode==='equal';
 return {origin,id:a.id,typeKey:a.typeKey,type:a.type,ability:a.ability,adaptability:a.adaptability,
  effort:t.effort,learn:t.learn,save:t.save,switching:t.switching,risk:t.risk,
  skill:equal?.78:a.skill,health:equal?.86:a.health,fit:equal?.86:a.fit,care:equal?.15:a.care,
  cash:equal?2000000:Math.max(0,a.cash),invested:equal?0:Math.max(0,a.invested),debt:equal?0:Math.max(0,a.debt),
  employed:true,stress:equal?.18:clamp(a.stress||.2,.08,.85),businessWins:0,businessLosses:0,jobLosses:0,
  totalIncome:0,totalCost:0,wellbeing:equal?65:a.wellbeing,bankrupt:false,entryNet:equal?2000000:net(a),entrySkill:equal?.78:a.skill,entryHealth:equal?.86:a.health};
}
function arenaEnv(){return {label:'ごりごり資本主義',safetyNet:.08,wageDispersion:.62,capitalReturn:.055,capitalVol:.18,entrepreneurship:.085,jobMarket:.78,rentPressure:1.00}}
function stepAgent(a,seed,year,env){
 const macro=clamp(1+.018+N01(seed,7000,year,1)*.055,.84,1.16);
 const recession=macro<.965?1:0;
 // strong private return to skill, ability, fit and effort. Same rules for both origins.
 if(U(seed,a.id,year,10)<a.learn*.22){a.skill=clamp(a.skill+.014*a.learn*a.ability*(.88+.16*a.adaptability),.25,1.85)}
 if(a.employed&&a.fit<.78&&U(seed,a.id,year,11)<a.switching*.30){a.fit=clamp(.58+U(seed,a.id,year,12)*.70*a.adaptability,.48,1.34);a.cash=Math.max(0,a.cash-70000)}
 const jobLossP=(.035+.045*recession+.020*(1-a.fit))*(1.10-.18*a.adaptability);
 if(a.employed&&U(seed,a.id,year,13)<jobLossP){a.employed=false;a.jobLosses++}
 if(!a.employed){const p=clamp(.28+.34*env.jobMarket+.18*a.skill+.10*a.adaptability-.14*recession,.08,.90);if(U(seed,a.id,year,14)<p){a.employed=true;a.fit=clamp(.54+U(seed,a.id,year,15)*.66*a.adaptability,.45,1.28)}}
 const effortPremium=.72+.34*Math.log1p(a.effort*2.5);
 let income=0;
 if(a.employed){income=3900000*(1.012**year)*(.54+.72*a.skill)*(.66+.44*a.ability)*(.68+.38*a.fit)*effortPremium*(.70+.34*a.health)*macro;income*=clamp(1+N01(seed,a.id,year,16)*.10,.68,1.36)}
 // Entrepreneurship: high upside, real downside. Not guaranteed and not group-specific.
 const ventureP=env.entrepreneurship*(.55+.45*a.adaptability)*(.55+.35*a.switching)*(.70+.22*a.skill);
 if(U(seed,a.id,year,20)<ventureP){const stake=Math.min(Math.max(120000,a.cash*.16),900000);if(a.cash>=stake*.5){const good=U(seed,a.id,year,21)<clamp(.40+.10*(a.ability-1)+.10*(a.skill-.8)+.08*(a.adaptability-.8),.22,.68);if(good){const gain=stake*(1.2+4.8*U(seed,a.id,year,22));a.cash+=gain;a.businessWins++}else{a.cash-=Math.min(a.cash,stake*(.55+1.05*U(seed,a.id,year,23)));a.businessLosses++}}}
 const illness=U(seed,a.id,year,30)<(.025+.035*(1-a.health)+.018*a.stress);
 if(illness){a.health=clamp(a.health-.050-.030*U(seed,a.id,year,31),.25,1.04)}
 const over=Math.max(0,a.effort-1.03);a.health=clamp(a.health-.009*over-.0015*a.stress+.008*(a.effort<.85?1:0)+.007*(1-a.stress),.25,1.04);
 const living=(2350000+420000*a.care)*(1.014**year)*env.rentPressure;
 const insurance=60000*a.risk,medical=illness?190000*(1-.42*a.risk):0,cost=living+insurance+medical;
 let transfer=0;if(!a.employed||income<cost)transfer=Math.max(0,cost-income)*env.safetyNet;
 let flow=income+transfer-cost;
 if(flow>=0){a.cash+=flow;if(a.debt>0){const pay=Math.min(a.debt,a.cash*.30);a.debt-=pay;a.cash-=pay}}
 else{const need=-flow;if(a.cash>=need)a.cash-=need;else{const short=need-a.cash;a.cash=0;a.debt+=short}}
 if(a.debt>0)a.debt*=1.06;
 const monthly=cost/12,buffer=monthly>0?a.cash/monthly:0;
 if(buffer>=5&&a.debt<300000&&a.cash>400000){const add=Math.max(0,(a.cash-5*monthly)*.55);a.cash-=add;a.invested+=add}
 if(a.invested>0){const market=env.capitalReturn+N01(seed,7100,year,2)*.105;const idio=N01(seed,a.id,year,40)*env.capitalVol*.40;a.invested*=clamp(1+market+idio,.60,1.48)}
 const nw=net(a);a.bankrupt=a.debt>9000000&&nw<0;
 a.stress=clamp(.16+.18*(a.debt>0?Math.min(1,a.debt/5000000):0)+.14*(!a.employed?1:0)+.10*a.care+.06*a.businessLosses/(1+a.businessWins+a.businessLosses)-.08*Math.min(1,buffer/8),.05,.92);
 a.totalIncome+=income+transfer;a.totalCost+=cost;
 a.wellbeing=clamp(48+16*(a.health-.5)+4*Math.log10(Math.max(1,nw+3000000)/3000000)+9*(a.employed?1:0)-18*a.stress-8*a.care,0,100);
}
function summarizeGroup(arr){const vals=arr.map(net);return {n:arr.length,medianNet:q(vals,.5),p10Net:q(vals,.1),p90Net:q(vals,.9),meanNet:mean(vals),bankruptRate:arr.filter(a=>a.bankrupt).length/arr.length,employedRate:arr.filter(a=>a.employed).length/arr.length,medianHealth:q(arr.map(a=>a.health),.5),medianWell:q(arr.map(a=>a.wellbeing),.5),businessWins:arr.reduce((s,a)=>s+a.businessWins,0),businessLosses:arr.reduce((s,a)=>s+a.businessLosses,0)};}
function profile(arr){const types={};arr.forEach(a=>types[a.type]=(types[a.type]||0)+1);return {ability:mean(arr.map(a=>a.ability)),adaptability:mean(arr.map(a=>a.adaptability)),skill:mean(arr.map(a=>a.skill)),health:mean(arr.map(a=>a.health)),netMedian:q(arr.map(net),.5),wellbeing:mean(arr.map(a=>a.wellbeing)),types};}
function run(seed=20261006,mode='carry'){
 const sel=selectGroups(seed),env=arenaEnv();
 const hell=sel.hell.map(a=>cloneForArena(a,'hell',mode)),heaven=sel.heaven.map(a=>cloneForArena(a,'heaven',mode));
 const entry={hell:profile(hell),heaven:profile(heaven)};
 const all=[...hell,...heaven];
 for(let y=0;y<YEARS;y++)all.forEach(a=>stepAgent(a,seed,y,env));
 const ranked=all.slice().sort((a,b)=>net(b)-net(a));
 const top10=ranked.slice(0,10),top10Hell=top10.filter(a=>a.origin==='hell').length;
 return {seed,mode,env,selection:sel,entry,hell,heaven,summary:{hell:summarizeGroup(hell),heaven:summarizeGroup(heaven),top10Hell,top10Heaven:10-top10Hell,overlap:sel.overlap},ranked};
}
function robust(baseSeed=20261006,n=10){const rows=[];for(const mode of ['carry','equal']){let hMed=0,vMed=0,hTop=0,vTop=0,hWins=0,vWins=0;for(let j=0;j<n;j++){const r=run((baseSeed+j*104729)>>>0,mode),hs=r.summary.hell,vs=r.summary.heaven;hMed+=hs.medianNet;vMed+=vs.medianNet;hTop+=r.summary.top10Hell;vTop+=r.summary.top10Heaven;if(hs.medianNet>vs.medianNet)hWins++;else if(vs.medianNet>hs.medianNet)vWins++;}rows.push({mode,hellMedianAvg:hMed/n,heavenMedianAvg:vMed/n,hellTop10Avg:hTop/n,heavenTop10Avg:vTop/n,hellMedianWins:hWins,heavenMedianWins:vWins});}return rows}
function selfCheck(){const issues=[];const a=run(12345,'equal'),b=run(12345,'equal');const sig=x=>JSON.stringify({s:x.summary,r:x.ranked.slice(0,5).map(y=>[y.origin,y.id,Math.round(net(y))])});if(sig(a)!==sig(b))issues.push('seed reproducibility');if(a.hell.length!==GROUP_N||a.heaven.length!==GROUP_N)issues.push('group count');for(const g of [a.summary.hell,a.summary.heaven])for(const k of ['medianNet','p10Net','p90Net','bankruptRate','medianHealth','medianWell'])if(!Number.isFinite(g[k]))issues.push('nonfinite '+k);return {ok:!issues.length,issues}}
window.ArenaLab={YEARS,GROUP_N,net,qualificationScore,selectGroups,run,robust,profile,selfCheck};
})();
