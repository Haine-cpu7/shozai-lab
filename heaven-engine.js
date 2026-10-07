(function(){
'use strict';
const YEARS=30, N=300;
const TYPES={
 drift:{label:'🌊 なりゆき型',effort:.78,learn:.25,save:.05,switching:.22,risk:.25},
 steady:{label:'🧱 堅実型',effort:.94,learn:.58,save:.14,switching:.55,risk:.70},
 active:{label:'🚀 行動型',effort:1.18,learn:.76,save:.17,switching:.82,risk:.55},
 selective:{label:'🦥 省エネ選別型',effort:.72,learn:.52,save:.13,switching:.92,risk:.74},
 grind:{label:'🔥 がむしゃら型',effort:1.32,learn:.68,save:.12,switching:.22,risk:.40}
};
const TYPE_KEYS=Object.keys(TYPES);
const BASE_ENV={
 label:'超天国プリセット',familySupport:.72,educationAccess:.94,jobMarket:.94,wageLevel:1.08,
 rentPressure:.70,safetyNet:.90,shockRate:.72,stigma:.06,recessionYears:2,startBuffer:1
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:0}
function q(a,p){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),v=(s.length-1)*p,i=Math.floor(v),f=v-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function envWith(overrides={}){return {...BASE_ENV,...overrides}}
function makeAgent(seed,id,env){
 const typeKey=TYPE_KEYS[id%TYPE_KEYS.length],t=TYPES[typeKey];
 // ability/adaptability use the same draws as No.11 so the same Seed creates the same intrinsic 300 BOTs.
 const ability=clamp(.72+U(seed,id,4)*.56,.65,1.35);
 const adaptability=clamp(.62+U(seed,id,5)*.56,.55,1.25);
 const cash=Math.round((950000+U(seed,id,1)*1250000)*env.startBuffer);
 const health=clamp(.78+U(seed,id,2)*.24,.72,1.02);
 const care=clamp(.05+U(seed,id,3)*.26,.03,.35);
 const family=clamp(env.familySupport*(.72+.48*U(seed,id,6)),0,.98);
 const fit=clamp(.68+U(seed,id,7)*.48,.62,1.18);
 return {id:id+1,typeKey,type:t.label,ability,adaptability,family,care,fit,skill:.32+.13*ability,health,
  cash,debt:0,invested:0,employed:U(seed,id,8)<.93,wage:0,stress:.14+.10*care,options:0,bufferMonths:0,
  status:'stable',shockYears:0,unemployedYears:0,switches:0,trainingYears:0,totalIncome:0,totalCost:0,wellbeing:62,
  lastIncome:0,lastCost:0,lastShock:'なし',recoveredShocks:0,pendingRecoveries:[]};
}
function essentialCost(a,env,year){const infl=1.012**year;return (1260000+650000*env.rentPressure+260000*a.care)*infl}
function calcOptions(a,env,year){const monthly=essentialCost(a,env,year)/12;const liquid=Math.max(0,a.cash+a.invested*.75-a.debt*.25);const buffer=monthly>0?liquid/monthly:0;let n=0;
 if((buffer>=1||env.safetyNet>=.45)&&a.health>.42)n++;
 if(a.health>.48&&a.care<.72&&(a.cash>50000||env.educationAccess>.30))n++;
 if(a.cash-a.debt>120000&&a.health>.45)n++;
 if(buffer>=2.5&&a.debt<250000)n++;
 if(buffer>=.75||env.safetyNet>=.40||a.family>.14)n++;
 return {n,buffer};
}
function statusOf(a,env,year){const o=calcOptions(a,env,year),monthly=essentialCost(a,env,year)/12,cashBuffer=monthly>0?Math.max(0,a.cash)/monthly:0;
 if(cashBuffer>=8&&o.n===5&&a.health>=.82&&a.employed&&a.debt<100000)return 'flourish';
 if(o.n>=4&&a.health>=.58&&a.debt<350000)return 'stable';
 if(o.n>=2&&a.health>=.42&&a.debt<1000000)return 'recovering';
 return 'strained';
}
function stepAgent(a,seed,year,env){
 const t=TYPES[a.typeKey],recession=year<env.recessionYears?1:0;
 const available=clamp(1-.45*a.care-.30*a.stress,.30,1);
 const canTrain=(a.cash>25000||env.educationAccess>.70)&&a.health>.43;
 if(canTrain&&U(seed,a.id,year,20)<t.learn*env.educationAccess*available){a.skill=clamp(a.skill+.022*t.learn*a.ability*available,.18,1.80);a.cash-=Math.max(0,50000*(1-env.educationAccess));a.trainingYears++}
 const o0=calcOptions(a,env,year),canSwitch=o0.n>=1;
 if(a.employed&&a.fit<.76&&canSwitch&&U(seed,a.id,year,21)<t.switching*.50){a.fit=clamp(.64+U(seed,a.id,year,22)*.64*a.adaptability,.55,1.32);a.cash-=25000;a.switches++}
 const illnessP=(.028+.038*(1-a.health)+.012*a.care)*env.shockRate;
 const jobLossP=(.035+.045*recession+.018*(1-a.fit))*env.shockRate*(a.employed?1:0);
 const accidentP=.014*env.shockRate;
 const illness=U(seed,a.id,year,30)<illnessP, jobLoss=U(seed,a.id,year,31)<jobLossP, accident=U(seed,a.id,year,32)<accidentP;
 a.lastShock='なし';let shocks=0;
 if(illness){a.lastShock='病気';a.health=clamp(a.health-.055-.025*U(seed,a.id,year,33),.25,1.04);shocks++}
 if(accident){a.lastShock=a.lastShock==='なし'?'事故':a.lastShock+'＋事故';a.cash-=100000*(1-.50*t.risk);a.health=clamp(a.health-.035,.25,1.04);shocks++}
 if(jobLoss){a.employed=false;a.lastShock=a.lastShock==='なし'?'失業':a.lastShock+'＋失業';shocks++}
 if(shocks>0){a.shockYears++;a.pendingRecoveries.push(3)}
 if(!a.employed){a.unemployedYears++;const rehire=clamp(.38+.34*env.jobMarket+.16*a.skill+.12*a.adaptability-.10*recession-.08*a.care,.12,.94);if(U(seed,a.id,year,34)<rehire){a.employed=true;a.fit=clamp(.60+U(seed,a.id,year,35)*.58*a.adaptability,.55,1.28)}}
 const over=Math.max(0,t.effort-1.05),under=Math.max(0,.82-t.effort);
 a.health=clamp(a.health-.008*over-.0015*a.care-.0015*a.stress+.007*under+.016*(1-a.stress),.25,1.04);
 const effortReturn=.79+.22*Math.log1p(t.effort*2.2);let income=0;
 if(a.employed){income=3600000*env.wageLevel*(1.012**year)*(.68+.46*a.skill)*(.74+.28*a.ability)*(.74+.28*a.fit)*effortReturn*(.76+.28*a.health);income*=1-recession*.08;income*=clamp(1+N01(seed,a.id,year,40)*.07,.76,1.24)}
 const essential=essentialCost(a,env,year),medical=illness?150000*(1-.40*t.risk):0,riskCost=55000*t.risk;let cost=essential+medical+riskCost,transfer=0;
 if(!a.employed||income<cost){const gap=Math.max(0,cost-income);transfer=gap*env.safetyNet*(.82+.18*U(seed,a.id,year,41))+a.family*140000}
 let net=income+transfer-cost;
 if(net>=0){let surplus=net;if(a.debt>0){const pay=Math.min(a.debt,surplus);a.debt-=pay;surplus-=pay}const saved=Math.min(surplus,Math.max(0,income)*t.save);a.cash+=Math.max(0,saved)}
 else{const need=-net;if(a.cash>=need)a.cash-=need;else{const short=need-a.cash;a.cash=0;a.debt+=short*(1-env.safetyNet*.15)}}
 if(a.debt>0)a.debt*=1.025;
 const o1=calcOptions(a,env,year);
 if(o1.buffer>=4&&a.debt<150000&&a.cash>300000){const invest=Math.max(0,(a.cash-4*(essential/12))*.48);a.cash-=invest;a.invested+=invest}
 if(a.invested>0)a.invested*=clamp(1.038+N01(seed,a.id,year,44)*.09,.78,1.28);
 const stigmaHit=env.stigma*((!a.employed||a.debt>500000)?1:.25);
 a.stress=clamp(.14+.14*(a.debt>0?Math.min(1,a.debt/1800000):0)+.11*(!a.employed?1:0)+.12*a.care+.08*stigmaHit-.12*Math.min(1,o1.buffer/9),.04,.80);
 a.options=o1.n;a.bufferMonths=o1.buffer;a.status=statusOf(a,env,year);
 if(a.pendingRecoveries.length){if(a.options>=4&&a.health>=.58&&a.employed&&a.debt<350000){a.recoveredShocks+=a.pendingRecoveries.length;a.pendingRecoveries=[]}else a.pendingRecoveries=a.pendingRecoveries.map(x=>x-1).filter(x=>x>0)}
 a.wage=income;a.lastIncome=income+transfer;a.lastCost=cost;a.totalIncome+=income+transfer;a.totalCost+=cost;
 const netWorth=a.cash+a.invested-a.debt;
 a.wellbeing=clamp(50+16*(a.health-.5)+3*Math.log10(Math.max(1,netWorth+2500000)/2500000)+3*a.options-14*a.stress-6*a.care,0,100);
}
function summarize(agents,year,env){const counts={flourish:0,stable:0,recovering:0,strained:0};agents.forEach(a=>counts[a.status]++);const net=agents.map(a=>a.cash+a.invested-a.debt),opts=agents.map(a=>a.options),health=agents.map(a=>a.health),well=agents.map(a=>a.wellbeing),buffers=agents.map(a=>a.bufferMonths),denom=agents.length||1;return {year,counts,flourishRate:counts.flourish/denom,secureRate:(counts.flourish+counts.stable)/denom,strainedRate:counts.strained/denom,debtRate:agents.filter(a=>a.debt>0).length/denom,employedRate:agents.filter(a=>a.employed).length/denom,medianNet:q(net,.5),p10Net:q(net,.1),p90Net:q(net,.9),medianOptions:q(opts,.5),medianHealth:q(health,.5),medianWell:q(well,.5),medianBuffer:q(buffers,.5),p10Buffer:q(buffers,.1),avgBuffer:mean(buffers),recoveryRate:agents.reduce((s,a)=>s+a.recoveredShocks,0)/Math.max(1,agents.reduce((s,a)=>s+a.shockYears,0)),env};}
function init(seed=20261006,overrides={}){const env=envWith(overrides),agents=Array.from({length:N},(_,i)=>makeAgent(seed,i,env));const state={seed,year:0,env,agents,history:[]};state.agents.forEach(a=>{const o=calcOptions(a,env,0);a.options=o.n;a.bufferMonths=o.buffer;a.status=statusOf(a,env,0)});state.history.push(summarize(state.agents,0,env));return state}
function step(state){if(state.year>=YEARS)return state;const y=state.year;state.agents.forEach(a=>stepAgent(a,state.seed,y,state.env));state.year++;state.history.push(summarize(state.agents,state.year,state.env));return state}
function runToEnd(state){while(state.year<YEARS)step(state);return state}
function typeSummary(state){return TYPE_KEYS.map(k=>{const a=state.agents.filter(x=>x.typeKey===k),s=summarize(a,state.year,state.env);return {key:k,label:TYPES[k].label,n:a.length,flourish:a.filter(x=>x.status==='flourish').length/a.length,secure:a.filter(x=>x.status==='flourish'||x.status==='stable').length/a.length,medianNet:q(a.map(x=>x.cash+x.invested-x.debt),.5),medianOptions:q(a.map(x=>x.options),.5),medianWell:q(a.map(x=>x.wellbeing),.5),medianBuffer:s.medianBuffer,p10Buffer:s.p10Buffer}})}
function cloneRun(seed,overrides={}){return runToEnd(init(seed,overrides))}
function compareScenarios(seed){const scenarios=[
 {key:'base',label:'超天国プリセット',over:{}},
 {key:'buffer',label:'初期余力を減らす',over:{startBuffer:.35}},
 {key:'safety',label:'保障を薄くする',over:{safetyNet:.48}},
 {key:'rent',label:'住居費を上げる',over:{rentPressure:1.05}},
 {key:'jobs',label:'就職・学習機会を減らす',over:{jobMarket:.72,educationAccess:.62}},
 {key:'shock',label:'ショック頻度を上げる',over:{shockRate:1.10}}
 ];return scenarios.map(sc=>{const st=cloneRun(seed,sc.over),s=summarize(st.agents,YEARS,st.env);return {...sc,s}})}
function selfCheck(){const issues=[];const a=cloneRun(12345),b=cloneRun(12345);if(JSON.stringify(a.history)!==JSON.stringify(b.history))issues.push('seed reproducibility');const s=summarize(a.agents,YEARS,a.env);for(const k of ['flourishRate','secureRate','strainedRate','debtRate','medianNet','medianOptions','medianHealth','medianBuffer','p10Buffer','recoveryRate'])if(!Number.isFinite(s[k]))issues.push('nonfinite '+k);if(s.recoveryRate<0||s.recoveryRate>1)issues.push('recovery rate range');if(a.agents.length!==300)issues.push('agent count');const probe=makeAgent(9,0,a.env);probe.cash=2_000_000;probe.invested=5_000_000;probe.debt=0;probe.health=.95;probe.employed=true;probe.skill=.20;if(statusOf(probe,a.env,0)!=='flourish')issues.push('flourish improperly depends on skill');return {ok:!issues.length,issues}}
window.HeavenLab={YEARS,N,TYPES,TYPE_KEYS,BASE_ENV,clamp,mean,q,randomSeed,envWith,init,step,runToEnd,summarize,typeSummary,compareScenarios,selfCheck};
})();
