(function(){
'use strict';
const START_YEAR=0, YEARS=30, N=100, REAL_YEN=true;
const WORLD_ORDER=['capitalism','socialism','communism'];
const WORLD={
 capitalism:{label:'💰 ごりごり資本主義',short:'資本主義',pool:.16,serviceShare:.35,capitalAccess:1.00,wageDisp:.55,econChoice:.95,baseHours:42,unemp:.075,reward:.95,entre:.13,assetCap:Infinity,safety:.20,provision:.18},
 socialism:{label:'🏥 ごりごり社会主義',short:'社会主義',pool:.44,serviceShare:.60,capitalAccess:.62,wageDisp:.27,econChoice:.78,baseHours:37,unemp:.050,reward:.62,entre:.065,assetCap:25000000,safety:.78,provision:.72},
 communism:{label:'🚩 ごりごり共産主義',short:'共産主義',pool:.84,serviceShare:.76,capitalAccess:.08,wageDisp:.07,econChoice:.42,baseHours:35,unemp:.022,reward:.20,entre:.012,assetCap:3500000,safety:.95,provision:.95}
};
const PRESETS={
 balanced:{label:'⚖️ バランス',w:{material:.25,security:.25,autonomy:.20,leisure:.15,health:.15}},
 wealth:{label:'💰 お金重視',w:{material:.65,security:.06,autonomy:.12,leisure:.05,health:.12}},
 security:{label:'🛟 安心重視',w:{material:.08,security:.65,autonomy:.05,leisure:.10,health:.12}},
 freedom:{label:'🕊️ 自由重視',w:{material:.08,security:.05,autonomy:.65,leisure:.10,health:.12}},
 leisure:{label:'🌿 余暇重視',w:{material:.08,security:.08,autonomy:.04,leisure:.68,health:.12}}
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){let x=(seed>>>0)^Math.imul((a+1)|0,0x9e3779b1)^Math.imul((b+7)|0,0x85ebca6b)^Math.imul((c+13)|0,0xc2b2ae35);return mix32(x)}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function q(arr,p){if(!arr.length)return 0;const a=arr.slice().sort((x,y)=>x-y),i=(a.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return lo===hi?a[lo]:a[lo]*(hi-i)+a[hi]*(i-lo)}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}
function gini(a){const x=a.map(v=>Math.max(0,v)).sort((a,b)=>a-b),n=x.length,s=x.reduce((a,b)=>a+b,0);if(!n||s<=0)return 0;let w=0;for(let i=0;i<n;i++)w+=(i+1)*x[i];return (2*w)/(n*s)-(n+1)/n}
function normalizeWeights(o){let s=Object.values(o).reduce((a,b)=>a+b,0)||1,r={};for(const k in o)r[k]=o[k]/s;return r}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function makePeople(seed){const out=[];for(let i=0;i<N;i++){
 const ability=clamp(.58+N01(seed,0,i,10)*.16,.15,.96),health=clamp(.82+N01(seed,0,i,20)*.10,.45,1),drive=clamp(.56+N01(seed,0,i,30)*.20,.05,.98),family=clamp(.42+N01(seed,0,i,40)*.22,0,1);
 let pref={material:.15+U(seed,0,i,51),security:.15+U(seed,0,i,52),autonomy:.15+U(seed,0,i,53),leisure:.15+U(seed,0,i,54),health:.15+U(seed,0,i,55)};pref=normalizeWeights(pref);
 const initAsset=clamp(420000*Math.exp(N01(seed,0,i,60)*.85),30000,3500000);
 out.push({id:i+1,ability,health0:health,drive,family,pref,initAsset});
 }return out}
function newAgent(p){return{base:p,health:p.health0,assets:p.initAsset,income:0,resources:0,happiness:50,hours:0,basic:1,employed:true,cumIncome:0,cumService:0,lastComp:null}}
function init(seed){const people=makePeople(seed),worlds={};for(const k of WORLD_ORDER)worlds[k]={econ:1,agents:people.map(newAgent),history:[]};return{seed,year:0,people,worlds}}
function scenarioDefaults(){return{incentive:.25,serviceEfficiency:.85}}
function incentiveMultiplier(cfg,drive,incentive=.25){return clamp(1+incentive*cfg.reward*(drive-.5)*1.20,.75,1.30)}
function incentiveGrowth(cfg,incentive=.25){const minReward=Math.min(...WORLD_ORDER.map(k=>WORLD[k].reward));return incentive*Math.max(0,cfg.reward-minReward)*.018}
function macroGrowth(seed,year){let g=.016+N01(seed,year,999,1)*.018;if(U(seed,year,999,3)<.10)g-=.045;if(U(seed,year,999,4)<.07)g+=.030;return clamp(g,-.08,.08)}
function capitalReturn(seed,year){let r=.04+N01(seed,year,998,1)*.11;if(U(seed,year,998,3)<.08)r-=.18;if(U(seed,year,998,4)<.06)r+=.12;return clamp(r,-.35,.35)}
function happinessFromComponents(comp,pref,presetKey){const global=PRESETS[presetKey||'balanced'].w,w={};for(const k of Object.keys(global))w[k]=global[k]*.72+pref[k]*.28;const nw=normalizeWeights(w);let s=0;for(const k in nw)s+=nw[k]*comp[k];return clamp(s,0,100)}
function simulateYear(state,opts={}){if(state.year>=YEARS)return state;const year=state.year+1,incentive=opts.incentive??.25,serviceEff=opts.serviceEfficiency??.85,preset=opts.preset||'balanced',mg=macroGrowth(state.seed,year),cr=capitalReturn(state.seed,year);
 for(const wk of WORLD_ORDER){const cfg=WORLD[wk],ws=state.worlds[wk];const instGrowth=incentiveGrowth(cfg,incentive)+(serviceEff-.85)*(cfg.serviceShare-.5)*.012;ws.econ*=Math.max(.90,1+mg+instGrowth);
   const gross=[];let totalGross=0;
   for(let i=0;i<N;i++){const a=ws.agents[i],p=a.base;const jobU=U(state.seed,year,i,100),luck=N01(state.seed,year,i,110),opp=U(state.seed,year,i,120),oppSize=Math.max(0,N01(state.seed,year,i,121));
     const unemployment=jobU<cfg.unemp*(1-.25*p.ability);a.employed=!unemployment;
     const incentiveMul=incentiveMultiplier(cfg,p.drive,incentive);
     let gi=unemployment?0:3000000*ws.econ*(.55+.72*p.ability)*(.78+.28*a.health)*(.82+.36*p.drive)*Math.exp(luck*cfg.wageDisp)*clamp(incentiveMul,.75,1.30);
     if(opp<cfg.entre*(.55+.6*p.drive)){gi+=300000*ws.econ*(1+oppSize*2.2)*cfg.econChoice}
     gross.push(Math.max(0,gi));totalGross+=Math.max(0,gi);
   }
   const pool=totalGross*cfg.pool,servicePer=(pool*cfg.serviceShare*serviceEff)/N,cashPool=pool*(1-cfg.serviceShare),needWeights=gross.map((g,i)=>.5+1.5*(1-clamp(g/(3000000*ws.econ),0,1))+.6*ws.agents[i].base.family),needSum=needWeights.reduce((a,b)=>a+b,0);
   for(let i=0;i<N;i++){const a=ws.agents[i],p=a.base,g=gross[i],transfer=cashPool*(needWeights[i]/needSum),retained=g*(1-cfg.pool);let disposable=retained+transfer;
     if(!a.employed)disposable+=300000*cfg.safety*ws.econ;
     const need=2050000*ws.econ*(1+.42*p.family),serviceValue=servicePer*(.82+.28*p.family),resources=disposable+serviceValue,basic=clamp(resources/(need||1),0,1.35);
     const commonHealthShock=U(state.seed,year,i,130),healthHit=commonHealthShock<.07?(0.04+U(state.seed,year,i,131)*.12):0,healthGain=.012*cfg.provision*serviceEff;a.health=clamp(a.health-healthHit+healthGain-.006*(1-basic),.25,1);
     const hours=a.employed?clamp(cfg.baseHours+(p.drive-.5)*8+N01(state.seed,year,i,140)*2.5,20,58):Math.max(5,cfg.baseHours*.15);a.hours=hours;
     const capRet=cr*cfg.capitalAccess;a.assets=Math.max(0,a.assets*(1+capRet));
     const surplus=Math.max(0,disposable-Math.max(0,need-serviceValue)),saveRate=.10+.30*p.pref.material+.12*p.drive;a.assets+=surplus*saveRate;
     if(Number.isFinite(cfg.assetCap))a.assets=Math.min(a.assets,cfg.assetCap*ws.econ);
     const resourceScore=clamp(50+34*Math.log(Math.max(.2,resources/(need||1))),0,100),assetScore=clamp(35+24*Math.log(Math.max(.25,(a.assets+250000)/(1200000*ws.econ))),0,100),material=.68*resourceScore+.32*assetScore,security=clamp(100*(.48*clamp(basic,0,1)+.28*(a.employed?1:cfg.safety)+.24*cfg.provision*serviceEff),0,100),autonomy=clamp(100*(.72*cfg.econChoice+.28*clamp(a.assets/(2500000*ws.econ),0,1)),0,100),leisure=clamp(105-(hours-20)*2.2,0,100),health=100*a.health;
     const comp={material,security,autonomy,leisure,health};a.lastComp=comp;a.happiness=happinessFromComponents(comp,p.pref,preset);a.income=disposable;a.resources=resources;a.basic=basic;a.cumIncome+=disposable;a.cumService+=serviceValue;
   }
   ws.history.push(metricsForWorld(ws,state.people,preset));
 }
 state.year=year;return state}
function metricsForWorld(ws,people,preset='balanced'){
 const A=ws.agents,assets=A.map(a=>a.assets),income=A.map(a=>a.income),res=A.map(a=>a.resources),happy=A.map(a=>a.happiness),hours=A.map(a=>a.hours),basic=A.map(a=>a.basic);
 const start=people.map((p,i)=>({i,v:p.initAsset})).sort((a,b)=>a.v-b.v),bottom=new Set(start.slice(0,Math.floor(N*.2)).map(x=>x.i));const finalOrder=res.map((v,i)=>({i,v})).sort((a,b)=>a.v-b.v),topHalf=new Set(finalOrder.slice(Math.floor(N*.5)).map(x=>x.i));let moved=0;for(const i of bottom)if(topHalf.has(i))moved++;
 return{medianAssets:q(assets,.5),meanAssets:mean(assets),giniAssets:gini(assets),medianIncome:q(income,.5),medianResources:q(res,.5),medianHappy:q(happy,.5),bottom10Happy:q(happy,.1),avgHours:mean(hours),basicRate:mean(basic.map(x=>x>=1?1:0)),distressRate:mean(basic.map(x=>x<.85?1:0)),mobility:moved/(bottom.size||1),unemployment:mean(A.map(a=>a.employed?0:1)),top10Share:(assets.slice().sort((a,b)=>b-a).slice(0,10).reduce((s,x)=>s+x,0))/(assets.reduce((s,x)=>s+x,0)||1)}
}
function recomputeHappiness(ws,preset){for(const a of ws.agents)if(a.lastComp)a.happiness=happinessFromComponents(a.lastComp,a.base.pref,preset);return metricsForWorld(ws,ws.agents.map(a=>a.base),preset)}
function run(seed,opts={}){const s=init(seed);while(s.year<YEARS)simulateYear(s,opts);return s}
function summary(state,preset='balanced'){const out={};for(const k of WORLD_ORDER){if(preset)for(const a of state.worlds[k].agents)if(a.lastComp)a.happiness=happinessFromComponents(a.lastComp,a.base.pref,preset);out[k]=metricsForWorld(state.worlds[k],state.people,preset)}return out}
function oneBot(state,id,preset='balanced'){const i=clamp((id|0)-1,0,N-1),out={id:i+1,traits:state.people[i]};for(const k of WORLD_ORDER){const a=state.worlds[k].agents[i];if(a.lastComp)a.happiness=happinessFromComponents(a.lastComp,a.base.pref,preset);out[k]={assets:a.assets,income:a.income,resources:a.resources,happiness:a.happiness,hours:a.hours,basic:a.basic,health:a.health,employed:a.employed}}return out}
function selfCheck(){const issues=[];for(const k of WORLD_ORDER){const cfg=WORLD[k],lo=incentiveMultiplier(cfg,.30,.5),hi=incentiveMultiplier(cfg,.80,.5);if(!(hi>=lo))issues.push(k+' incentive direction');if(incentiveGrowth(cfg,.5)<-1e-12)issues.push(k+' negative incentive growth')}const a=run(12345),b=run(12345);if(JSON.stringify(summary(a,'balanced'))!==JSON.stringify(summary(b,'balanced')))issues.push('seed reproducibility');for(const k of WORLD_ORDER){const m=summary(a,'balanced')[k];for(const x of ['medianAssets','medianIncome','medianHappy','bottom10Happy','avgHours','basicRate'])if(!Number.isFinite(m[x]))issues.push(k+' nonfinite '+x)}return{ok:!issues.length,issues}}
window.SocietyLab={YEARS,N,WORLD,WORLD_ORDER,PRESETS,clamp,q,mean,gini,randomSeed,makePeople,init,simulateYear,run,summary,oneBot,scenarioDefaults,incentiveMultiplier,incentiveGrowth,happinessFromComponents,recomputeHappiness,selfCheck};
})();