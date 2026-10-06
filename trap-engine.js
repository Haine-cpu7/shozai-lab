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
 label:'地獄プリセット',familySupport:.10,educationAccess:.32,jobMarket:.66,wageLevel:.80,
 rentPressure:1.25,safetyNet:.20,shockRate:1.20,stigma:.68,recessionYears:4
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
 const cash=Math.round(20000+U(seed,id,1)*180000);
 const health=clamp(.60+U(seed,id,2)*.34,.50,.96);
 const care=clamp(.20+U(seed,id,3)*.50,.15,.78);
 const ability=clamp(.72+U(seed,id,4)*.56,.65,1.35);
 const adaptability=clamp(.62+U(seed,id,5)*.56,.55,1.25);
 const family=clamp(env.familySupport*(.55+.9*U(seed,id,6)),0,.28);
 const fit=clamp(.48+U(seed,id,7)*.46,.42,1.02);
 return {id:id+1,typeKey,type:t.label,ability,adaptability,family,care,fit,skill:.30+.13*ability,health,
  cash,debt:0,invested:0,employed:U(seed,id,8)<.72,wage:0,stress:.35+.18*care,options:0,bufferMonths:0,
  status:'survive',shockYears:0,unemployedYears:0,switches:0,trainingYears:0,totalIncome:0,totalCost:0,wellbeing:50,
  lastIncome:0,lastCost:0,lastShock:'なし'};
}
function essentialCost(a,env,year){const infl=1.012**year;return (1320000+650000*env.rentPressure+320000*a.care)*infl}
function calcOptions(a,env,year){const monthly=essentialCost(a,env,year)/12;const liquid=Math.max(0,a.cash-a.debt*.25);const buffer=monthly>0?liquid/monthly:0;
 let n=0;
 if((buffer>=1||env.safetyNet>=.45)&&a.health>.42)n++; // job switch
 if(a.health>.48&&a.care<.72&&(a.cash>50000||env.educationAccess>.30))n++; // train
 if(a.cash-a.debt>120000&&a.health>.45)n++; // move
 if(buffer>=2.5&&a.debt<250000)n++; // invest
 if(buffer>=.75||env.safetyNet>=.40||a.family>.14)n++; // pause/recover
 return {n,buffer};
}
function statusOf(a,env,year){const o=calcOptions(a,env,year),net=a.cash+a.invested-a.debt;
 if(o.buffer>=6&&o.n>=4&&a.health>=.58&&a.employed&&a.debt<250000)return 'escape';
 if((o.n<=1&&a.debt>1200000)||(a.health<.34&&a.debt>500000))return 'crisis';
 if(o.n<=2||a.debt>650000||a.health<.44)return 'trapped';
 return 'survive';
}
function stepAgent(a,seed,year,env){
 const t=TYPES[a.typeKey],recession=year<env.recessionYears?1:0;
 const available=clamp(1-.55*a.care-.42*a.stress,.16,1);
 const canTrain=(a.cash>65000||env.educationAccess>.55)&&a.health>.43;
 if(canTrain&&U(seed,a.id,year,20)<t.learn*env.educationAccess*available){
  a.skill=clamp(a.skill+.020*t.learn*a.ability*available,.18,1.75);a.cash-=Math.max(0,70000*(1-env.educationAccess));a.trainingYears++;
 }
 const o0=calcOptions(a,env,year),canSwitch=o0.n>=1;
 if(a.employed&&a.fit<.68&&canSwitch&&U(seed,a.id,year,21)<t.switching*.42){
  a.fit=clamp(.52+U(seed,a.id,year,22)*.64*a.adaptability,.42,1.25);a.cash-=55000;a.switches++;
 }
 const illnessP=(.035+.050*(1-a.health)+.020*a.care)*env.shockRate;
 const jobLossP=(.045+.060*recession+.025*(1-a.fit))*env.shockRate*(a.employed?1:0);
 const accidentP=.018*env.shockRate;
 const illness=U(seed,a.id,year,30)<illnessP, jobLoss=U(seed,a.id,year,31)<jobLossP, accident=U(seed,a.id,year,32)<accidentP;
 a.lastShock='なし';
 if(illness){a.lastShock='病気';a.health=clamp(a.health-.075-.035*U(seed,a.id,year,33),.20,1);a.shockYears++}
 if(accident){a.lastShock=a.lastShock==='なし'?'事故':a.lastShock+'＋事故';a.cash-=170000*(1-.45*t.risk);a.health=clamp(a.health-.055,.20,1);a.shockYears++}
 if(jobLoss){a.employed=false;a.lastShock=a.lastShock==='なし'?'失業':a.lastShock+'＋失業';a.shockYears++}
 if(!a.employed){
  a.unemployedYears++;
  const rehire=clamp(.25+.30*env.jobMarket+.16*a.skill+.11*a.adaptability-.13*recession-.12*a.care,.06,.82);
  if(U(seed,a.id,year,34)<rehire){a.employed=true;a.fit=clamp(.45+U(seed,a.id,year,35)*.55*a.adaptability,.4,1.18)}
 }
 const over=Math.max(0,t.effort-1.02),under=Math.max(0,.82-t.effort);
 a.health=clamp(a.health-.010*over-.002*a.care-.002*a.stress+.006*under+.012*(1-a.stress),.20,1.02);
 const effortReturn=.79+.22*Math.log1p(t.effort*2.2);
 let income=0;
 if(a.employed){income=3400000*env.wageLevel*(1.012**year)*(.68+.46*a.skill)*(.74+.28*a.ability)*(.74+.28*a.fit)*effortReturn*(.76+.28*a.health);income*=1-recession*.14;income*=clamp(1+N01(seed,a.id,year,40)*.08,.72,1.28)}
 const essential=essentialCost(a,env,year);
 const medical=illness?260000*(1-.35*t.risk):0;
 const riskCost=65000*t.risk;
 let cost=essential+medical+riskCost;
 let transfer=0;
 if(!a.employed||income<cost){const gap=Math.max(0,cost-income);transfer=gap*env.safetyNet*(.65+.35*U(seed,a.id,year,41))+a.family*120000}
 const saveTrim=clamp(t.save*.34,0,.09);cost*=1-saveTrim;
 let net=income+transfer-cost;
 if(net>=0){a.cash+=net; if(a.debt>0){const pay=Math.min(a.debt,a.cash*.35);a.debt-=pay;a.cash-=pay}}
 else {const need=-net;if(a.cash>=need)a.cash-=need;else{const short=need-a.cash;a.cash=0;a.debt+=short}}
 if(a.debt>0)a.debt*=1.04;
 const o1=calcOptions(a,env,year);
 if(o1.buffer>=3&&a.debt<250000&&a.cash>250000){const invest=Math.max(0,(a.cash-3*(essential/12))*.45);a.cash-=invest;a.invested+=invest}
 if(a.invested>0)a.invested*=clamp(1.035+N01(seed,a.id,year,44)*.10,.75,1.30);
 const stigmaHit=env.stigma*((!a.employed||a.debt>500000)?1:.25);
 a.stress=clamp(.24+.22*(a.debt>0?Math.min(1,a.debt/2000000):0)+.20*(!a.employed?1:0)+.16*a.care+.12*stigmaHit-.10*o1.buffer/6,.08,.98);
 a.options=o1.n;a.bufferMonths=o1.buffer;a.status=statusOf(a,env,year);
 a.wage=income;a.lastIncome=income+transfer;a.lastCost=cost;a.totalIncome+=income+transfer;a.totalCost+=cost;
 const netWorth=a.cash+a.invested-a.debt;
 a.wellbeing=clamp(58+20*(a.health-.5)+5*Math.log10(Math.max(1,netWorth+2500000)/2500000)+4*a.options-24*a.stress-10*a.care,0,100);
}
function summarize(agents,year,env){
 const counts={escape:0,survive:0,trapped:0,crisis:0};agents.forEach(a=>counts[a.status]++);
 const net=agents.map(a=>a.cash+a.invested-a.debt),opts=agents.map(a=>a.options),health=agents.map(a=>a.health),well=agents.map(a=>a.wellbeing);
 return {year,counts,escapeRate:counts.escape/N,trappedRate:(counts.trapped+counts.crisis)/N,crisisRate:counts.crisis/N,
  debtRate:agents.filter(a=>a.debt>0).length/N,employedRate:agents.filter(a=>a.employed).length/N,medianNet:q(net,.5),p10Net:q(net,.1),p90Net:q(net,.9),
  medianOptions:q(opts,.5),medianHealth:q(health,.5),medianWell:q(well,.5),avgBuffer:mean(agents.map(a=>a.bufferMonths)),env};
}
function init(seed=20261006,overrides={}){const env=envWith(overrides),agents=Array.from({length:N},(_,i)=>makeAgent(seed,i,env));const state={seed,year:0,env,agents,history:[]};state.agents.forEach(a=>{const o=calcOptions(a,env,0);a.options=o.n;a.bufferMonths=o.buffer;a.status=statusOf(a,env,0)});state.history.push(summarize(state.agents,0,env));return state}
function step(state){if(state.year>=YEARS)return state;const y=state.year;state.agents.forEach(a=>stepAgent(a,state.seed,y,state.env));state.year++;state.history.push(summarize(state.agents,state.year,state.env));return state}
function runToEnd(state){while(state.year<YEARS)step(state);return state}
function typeSummary(state){return TYPE_KEYS.map(k=>{const a=state.agents.filter(x=>x.typeKey===k),s=summarize(a,state.year,state.env);return {key:k,label:TYPES[k].label,n:a.length,escape:a.filter(x=>x.status==='escape').length/a.length,trapped:a.filter(x=>x.status==='trapped'||x.status==='crisis').length/a.length,medianNet:q(a.map(x=>x.cash+x.invested-x.debt),.5),medianOptions:q(a.map(x=>x.options),.5),medianWell:q(a.map(x=>x.wellbeing),.5)}})}
function cloneRun(seed,overrides={}){return runToEnd(init(seed,overrides))}
function compareScenarios(seed){
 const scenarios=[
  {key:'base',label:'地獄プリセット',over:{}},
  {key:'buffer',label:'初期現金を増やす',over:{initialBoost:1}},
  {key:'safety',label:'保障を厚くする',over:{safetyNet:.55}},
  {key:'rent',label:'住居費圧力を下げる',over:{rentPressure:1.00}},
  {key:'jobs',label:'就職機会を増やす',over:{jobMarket:.88,educationAccess:.48}},
  {key:'shock',label:'ショック頻度を下げる',over:{shockRate:.75}}
 ];
 return scenarios.map(sc=>{
   let st=init(seed,sc.over);
   if(sc.over.initialBoost){st.agents.forEach(a=>{a.cash+=900000;const o=calcOptions(a,st.env,0);a.options=o.n;a.bufferMonths=o.buffer;a.status=statusOf(a,st.env,0)});st.history=[summarize(st.agents,0,st.env)]}
   runToEnd(st);const s=summarize(st.agents,YEARS,st.env);return {...sc,s};
 });
}
function selfCheck(){const issues=[];const a=cloneRun(12345),b=cloneRun(12345);if(JSON.stringify(a.history)!==JSON.stringify(b.history))issues.push('seed reproducibility');const s=summarize(a.agents,YEARS,a.env);for(const k of ['escapeRate','trappedRate','debtRate','medianNet','medianOptions','medianHealth'])if(!Number.isFinite(s[k]))issues.push('nonfinite '+k);if(a.agents.length!==300)issues.push('agent count');return {ok:!issues.length,issues}}
window.TrapLab={YEARS,N,TYPES,TYPE_KEYS,BASE_ENV,clamp,mean,q,randomSeed,envWith,init,step,runToEnd,summarize,typeSummary,compareScenarios,selfCheck};
})();
