(function(){
'use strict';
const YEARS=30;
const CHOICES={
 drift:{label:'🌊 なりゆき型',desc:'学習・貯蓄・方向転換をあまり意識しない。',effort:.72,learn:.28,save:.05,switching:.25,risk:.28},
 steady:{label:'🧱 堅実型',desc:'無理しすぎず、学習・貯蓄・リスク管理を続ける。',effort:.95,learn:.62,save:.16,switching:.58,risk:.72},
 active:{label:'🚀 行動型',desc:'努力・学習・転職を積極的に増やす。',effort:1.18,learn:.78,save:.18,switching:.82,risk:.60},
 selective:{label:'🦥 省エネ選別型',desc:'努力量は少なめ。合わない場所を早く切り、勝ち筋だけ選ぶ。',effort:.70,learn:.56,save:.14,switching:.94,risk:.76},
 grind:{label:'🔥 がむしゃら型',desc:'長時間・高努力で押す。合わなくても粘りやすい。',effort:1.32,learn:.72,save:.15,switching:.24,risk:.46}
};
const OBSERVERS={
 context:{label:'🔎 文脈重視BOT',merit:.25,just:.20,norm:.25,context:.92},
 merit:{label:'🏅 努力重視BOT',merit:.88,just:.48,norm:.65,context:.42},
 just:{label:'⚖️ 公正世界BOT',merit:.58,just:.92,norm:.56,context:.34},
 strict:{label:'📏 規範重視BOT',merit:.62,just:.56,norm:.92,context:.28},
 balanced:{label:'🧭 バランスBOT',merit:.52,just:.42,norm:.46,context:.70}
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}
function q(a,p){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),v=(s.length-1)*p,i=Math.floor(v),f=v-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function makeEnvironment(seed,id=0,scale=1){
 const rf=clamp(.12+.88*U(seed,id,1),0,1),rc=Math.round(100000+Math.pow(U(seed,id,2),2.2)*7000000),rh=clamp(.58+.46*U(seed,id,3),.5,1.04),ra=clamp(.70+.62*U(seed,id,4),.65,1.32),ro=clamp(.66+.72*U(seed,id,5),.62,1.38),rb=clamp(Math.pow(U(seed,id,6),1.25),0,1),rfit=clamp(.55+.82*U(seed,id,7),.5,1.38);
 const family=clamp(.5+(rf-.5)*scale,0,1),startCapital=Math.max(0,Math.round(Math.exp(Math.log(1500001)*(1-scale)+Math.log(rc+1)*scale)-1)),health=clamp(.84+(rh-.84)*scale,.42,1.08),aptitude=clamp(1+(ra-1)*scale,.55,1.45),opportunity=clamp(1+(ro-1)*scale,.5,1.55),burden=clamp(.45+(rb-.45)*scale,0,1),fit0=clamp(.95+(rfit-.95)*scale,.42,1.5);
 const shockSeed=hash(seed,id,90,0);
 return{id,family,startCapital,health,aptitude,opportunity,burden,fit0,shockSeed,scale};
}
function envAdversity(e){
 const capitalBad=1-clamp(Math.log1p(e.startCapital)/Math.log1p(7100000),0,1);
 const healthBad=(1.04-e.health)/(.54);
 const aptitudeBad=(1.32-e.aptitude)/(.67);
 const opportunityBad=(1.38-e.opportunity)/(.76);
 return clamp(mean([1-e.family,capitalBad,healthBad,aptitudeBad,opportunityBad,e.burden]),0,1);
}
function envAdvantage(e){return 1-envAdversity(e)}
function choiceQuality(c){return clamp(mean([c.learn,c.save/.20,c.switching,c.risk,clamp(1-Math.abs(c.effort-.95),0,1)]),0,1)}
function scaledChoice(c,scale=1){const n={effort:.95,learn:.55,save:.12,switching:.55,risk:.55};return{...c,effort:clamp(n.effort+(c.effort-n.effort)*scale,.45,1.55),learn:clamp(n.learn+(c.learn-n.learn)*scale,.05,.98),save:clamp(n.save+(c.save-n.save)*scale,0,.28),switching:clamp(n.switching+(c.switching-n.switching)*scale,.05,.99),risk:clamp(n.risk+(c.risk-n.risk)*scale,.05,.99)}}
function run(seed,choiceKey='steady',envId=0,envScale=1,choiceScale=1){
 const baseChoice=CHOICES[choiceKey],c=scaledChoice(baseChoice,choiceScale),e=makeEnvironment(seed,envId,envScale);let wealth=e.startCapital,skill=.28+.17*e.family+.10*e.aptitude,health=e.health,fit=e.fit0,deficitYears=0,switches=0,shockYears=0,totalIncome=0,totalFree=0;
 for(let y=0;y<YEARS;y++){
  const macro=clamp(1+N(e.shockSeed,y,1,0)*.075*envScale,.72,1.30),luck=clamp(1+N(e.shockSeed,y,2,0)*.13*envScale,.45,1.62);
  const illness=U(e.shockSeed,y,3,0)<(.025+envScale*(.035*(1-e.health)+.012*e.burden)),jobShock=U(e.shockSeed,y,4,0)<(.025+envScale*.055*(1-e.opportunity));
  if((fit<.78||jobShock)&&U(e.shockSeed,y,5,0)<c.switching){fit=clamp(.58+.78*U(e.shockSeed,y,6,0)*(.78+.22*e.opportunity),.5,1.42);switches++}
  skill=clamp(skill+.018*c.learn*(.72+.35*e.aptitude)*(1+.10*Math.log1p(c.effort)),.2,1.65);
  const over=Math.max(0,c.effort-1.05);health=clamp(health-.018*over-.014*e.burden+(c.effort<.9?.006:0)+N(e.shockSeed,y,7,0)*.009-(illness?.055:0),.28,1.06);
  const effortReturn=.80+.22*Math.log1p(c.effort*2.4),learnReturn=.72+.48*skill;
  let income=3200000*(.72+.42*e.aptitude)*learnReturn*(.70+.38*fit)*(.72+.30*e.opportunity)*effortReturn*(.70+.31*health)*macro*luck;
  if(jobShock)income*=.62;if(illness)income*=.76;income=Math.max(0,income);totalIncome+=income;
  const baseLiving=2380000*(1.012**y),burdenCost=e.burden*520000*(1.01**y),insurance=70000*c.risk;
  let shockCost=(illness?520000:0)+(jobShock?260000:0);shockCost*=1-.46*c.risk;if(illness||jobShock)shockYears++;
  const living=baseLiving+burdenCost+insurance+shockCost;
  let net=income-living;if(net<0&&e.family>.55){const help=Math.min(-net,220000*e.family);net+=help}
  if(net<0)deficitYears++;
  const wealthFlow=net>0?Math.min(net,income*c.save):net;
  const invReturn=clamp(.035+N(e.shockSeed,y,8,0)*.09,-.24,.26),preReturn=wealth+wealthFlow;wealth=preReturn>=0?preReturn*(1+invReturn):preReturn;
  totalFree+=clamp(62-38*c.effort-7*c.learn,3,50)*52;
 }
 const wellbeing=clamp(48+18*health+10*Math.log10(Math.max(1,wealth+1000000)/1000000)+12*(totalFree/(YEARS*52*50))-16*(deficitYears/YEARS)-7*e.burden,0,100);
 return{seed,choiceKey,choice:{...c,label:baseChoice.label,desc:baseChoice.desc},env:e,wealth,skill,health,deficitYears,switches,shockYears,totalIncome,totalFree,wellbeing,adversity:envAdversity(e),advantage:envAdvantage(e),choiceQuality:choiceQuality(c),envScale,choiceScale};
}
function compareChoicesSameWorld(seed,envId=0){return Object.keys(CHOICES).map(k=>run(seed,k,envId))}
function compareWorldsSameChoice(seed,choiceKey='steady',n=100,envScale=1){const a=[];for(let i=0;i<n;i++)a.push(run(seed,choiceKey,i,envScale));return a}
function decomposeMatrix(matrix){
 const C=matrix.length,E=matrix[0].length,flat=matrix.flat(),grand=mean(flat),cm=matrix.map(r=>mean(r)),em=Array.from({length:E},(_,j)=>mean(matrix.map(r=>r[j])));
 let ssC=0,ssE=0,ssI=0;for(let i=0;i<C;i++)ssC+=E*(cm[i]-grand)**2;for(let j=0;j<E;j++)ssE+=C*(em[j]-grand)**2;for(let i=0;i<C;i++)for(let j=0;j<E;j++)ssI+=(matrix[i][j]-cm[i]-em[j]+grand)**2;const total=ssC+ssE+ssI||1;return{choice:ssC/total,environment:ssE/total,interaction:ssI/total,grand};
}
function factorial(seed,nEnv=120,envScale=1,choiceScale=1){
 const keys=Object.keys(CHOICES),wealth=[],deficits=[],well=[];for(const k of keys){const rw=[],rd=[],rb=[];for(let e=0;e<nEnv;e++){const x=run(seed,k,e,envScale,choiceScale);rw.push(x.wealth);rd.push(x.deficitYears);rb.push(x.wellbeing)}wealth.push(rw);deficits.push(rd);well.push(rb)}
 return{keys,nEnv,envScale,choiceScale,wealth:decomposeMatrix(wealth),deficits:decomposeMatrix(deficits),wellbeing:decomposeMatrix(well)};
}
function failureSeverity(x){return clamp((x.deficitYears/YEARS)*.55+(x.wealth<0?clamp(-x.wealth/8000000,0,1)*.45:0),0,1)}
function successSeverity(x){return clamp((Math.log1p(Math.max(0,x.wealth))/Math.log1p(50000000))*.70+(1-x.deficitYears/YEARS)*.30,0,1)}
function blameScore(x,observerKey='balanced',revealed=false){
 const o=OBSERVERS[observerKey],c=x.choice,fail=failureSeverity(x),lowEffort=clamp(1-c.effort/1.1,0,1),poorChoice=1-x.choiceQuality;
 let s=16+30*fail+24*poorChoice*o.merit+18*lowEffort*o.norm+22*fail*o.just;
 if(revealed)s-=42*x.adversity*o.context+8*x.adversity*(1-o.just);
 return clamp(s,0,100);
}
function successCredit(x,observerKey='balanced',revealed=false){
 const o=OBSERVERS[observerKey],succ=successSeverity(x),eff=clamp(x.choice.effort/1.25,0,1);let s=28+30*succ+21*eff*o.merit+12*succ*o.just+10*x.choiceQuality;
 if(revealed)s-=34*x.advantage*o.context;
 return clamp(s,0,100);
}
function attributionCase(seed,caseId=0,choiceKey=null){const keys=Object.keys(CHOICES),k=choiceKey||keys[Math.floor(U(seed,caseId,55)*keys.length)],x=run(seed,k,caseId);const blame={},credit={};for(const o of Object.keys(OBSERVERS)){blame[o]={hidden:blameScore(x,o,false),revealed:blameScore(x,o,true)};credit[o]={hidden:successCredit(x,o,false),revealed:successCredit(x,o,true)}}return{x,blame,credit}}
function observerStudy(seed,n=400){
 const keys=Object.keys(CHOICES),cases=[];for(let i=0;i<n;i++)cases.push(run(seed,keys[i%keys.length],i));const sorted=cases.slice().sort((a,b)=>a.wealth-b.wealth),fail=sorted.slice(0,Math.max(1,Math.floor(n*.30))),succ=sorted.slice(-Math.max(1,Math.floor(n*.30)));
 const byObserver={};for(const o of Object.keys(OBSERVERS)){const bh=fail.map(x=>blameScore(x,o,false)),br=fail.map(x=>blameScore(x,o,true)),ch=succ.map(x=>successCredit(x,o,false)),cr=succ.map(x=>successCredit(x,o,true));byObserver[o]={label:OBSERVERS[o].label,blameHidden:mean(bh),blameRevealed:mean(br),blameDrop:mean(bh)-mean(br),creditHidden:mean(ch),creditRevealed:mean(cr),creditDrop:mean(ch)-mean(cr)}}
 return{cases,fail,succ,byObserver};
}
function summarize(rows){return{wealthMedian:q(rows.map(x=>x.wealth),.5),wealthP10:q(rows.map(x=>x.wealth),.1),wealthP90:q(rows.map(x=>x.wealth),.9),deficitMedian:q(rows.map(x=>x.deficitYears),.5),wellMedian:q(rows.map(x=>x.wellbeing),.5),adversityMedian:q(rows.map(x=>x.adversity),.5)}}
function selfCheck(){const issues=[];const f=factorial(20261005,20);for(const k of ['wealth','deficits','wellbeing']){const s=f[k].choice+f[k].environment+f[k].interaction;if(Math.abs(s-1)>.00001)issues.push(k+' share sum')}const x=run(20261005,'steady',0);if(!Number.isFinite(x.wealth)||!Number.isFinite(x.wellbeing))issues.push('non-finite run');return{ok:!issues.length,issues}}
window.ResponsibilityLab={YEARS,CHOICES,OBSERVERS,clamp,mean,q,randomSeed,makeEnvironment,envAdversity,envAdvantage,choiceQuality,scaledChoice,run,compareChoicesSameWorld,compareWorldsSameChoice,factorial,blameScore,successCredit,attributionCase,observerStudy,summarize,selfCheck};
})();
