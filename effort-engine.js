(function(){
'use strict';
const YEARS=30, WEEKS=52;
const PROFILES={
 grind:{label:'🔥 がむしゃら型',desc:'長時間・高強度・高継続。勝ち筋が薄くても簡単にはやめない。',hours:42,intensity:.88,persistence:.94,sacrifice:.82,practice:.62,strategy:.32,leverage:.22,burst:false},
 steady:{label:'🐢 コツコツ型',desc:'中くらいの努力を長く続ける。無理は少ないが方向転換も速くはない。',hours:28,intensity:.64,persistence:.88,sacrifice:.42,practice:.70,strategy:.48,leverage:.28,burst:false},
 strategist:{label:'🧠 戦略型',desc:'努力量は中くらい。改善・方向転換・勝つ場所選びを重視する。',hours:24,intensity:.64,persistence:.58,sacrifice:.28,practice:.82,strategy:.90,leverage:.62,burst:false},
 selective:{label:'🦥 省エネ選別型',desc:'普段は頑張りすぎない。勝ち筋や興味が見えた時だけ集中し、ダメなら早めに切る。',hours:12,intensity:.46,persistence:.34,sacrifice:.14,practice:.58,strategy:.92,leverage:.78,burst:true},
 leverage:{label:'⚙️ レバレッジ型',desc:'自分の時間を増やすより、資本・AI・仕組み・自動化で増幅する。',hours:16,intensity:.52,persistence:.52,sacrifice:.18,practice:.64,strategy:.78,leverage:.96,burst:false},
 drift:{label:'🎲 流され型',desc:'努力量も改善も方向転換も弱め。外部環境に結果を左右されやすい。',hours:16,intensity:.38,persistence:.38,sacrifice:.30,practice:.22,strategy:.18,leverage:.12,burst:false}
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}
function q(a,p){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),x=(s.length-1)*p,i=Math.floor(x),f=x-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function makePerson(seed,id,profileKey){const p=PROFILES[profileKey];return{id,profileKey,ability:clamp(.75+U(seed,id,1)*.5,.75,1.25),support:clamp(U(seed,id,2),0,1),startCapital:200000+Math.pow(U(seed,id,3),2)*3800000,health:clamp(.82+N(seed,id,4)*.08,.55,1),skill:.35+.2*U(seed,id,5),wealth:0,income:0,freeHours:0,effortHours:0,effortLoad:0,opportunityCost:0,burnoutYears:0,switches:0,fit:.55+.75*U(seed,id,6),alive:true,p:{...p}}}
function effortDimensions(person,year){const p=person.p;let hours=p.hours,intensity=p.intensity;if(p.burst){const promising=person.fit>.95||person.skill>.82;hours=promising?22:10;intensity=promising?.82:.38}return{hours,intensity,persistence:p.persistence,sacrifice:p.sacrifice}}
function yearStep(person,seed,year){const p=person.p,e=effortDimensions(person,year);const market=clamp(1+N(seed,year,100,1)*.10,.72,1.28);const luck=clamp(1+N(seed,person.id,year,1)*.16,.55,1.55);
 // Decide whether to stay or switch. Strategy and timely disengagement are NOT counted as effort.
 const badFit=person.fit<.75; const failSignal=U(seed,person.id,year,9)<clamp(.25+(1-person.fit)*.45,0,.8);
 if(badFit&&failSignal){const switchProb=clamp(p.strategy*.72+(1-p.persistence)*.28,0,1);if(U(seed,person.id,year,10)<switchProb){person.fit=clamp(.55+U(seed,person.id,year,11)*.85,.5,1.4);person.switches++}}
 // Effort input: time × intensity. Persistence/sacrifice are tracked separately, not secretly folded into strategy.
 const effortLoad=e.hours*WEEKS*e.intensity;person.effortHours+=e.hours*WEEKS;person.effortLoad+=effortLoad;person.opportunityCost+=e.hours*WEEKS*e.sacrifice;
 // Skill growth: practice quality matters separately from raw effort.
 const learn=0.020*Math.log1p(effortLoad/500)*(0.45+0.75*p.practice)*(0.75+0.35*person.ability);person.skill=clamp(person.skill+learn,0,1.6);
 // Health/fatigue: sacrifice and very high load have costs.
 const overload=Math.max(0,e.hours-32)/18;const fatigue=.010*overload*(.4+.9*e.intensity)+.006*e.sacrifice;const recovery=.010*(1-e.sacrifice);person.health=clamp(person.health-fatigue+recovery+N(seed,person.id,year,30)*.01,.25,1.05);if(person.health<.48)person.burnoutYears++;
 // Leverage amplifies output but needs some skill/capital; it is deliberately NOT effort.
 const capitalBase=person.startCapital+Math.max(0,person.wealth)*.15;const lev=1+p.leverage*(.10+.12*Math.log1p(capitalBase/1000000))*(.6+.4*person.skill);
 const raw=2400000*(.72+.55*person.ability)*(.62+.58*person.skill)*(.62+.55*person.fit)*(0.72+0.28*person.health);
 const effortReturn=1+0.22*Math.log1p(effortLoad/700); // diminishing returns
 const strategyBonus=1+.16*p.strategy*(1-Math.abs(person.fit-1));
 person.income=Math.max(0,raw*effortReturn*strategyBonus*lev*market*luck);
 const living=2400000*(1.02**year);const investReturn=clamp(.035+N(seed,year,200,1)*.11,-.30,.30);person.wealth=(person.wealth+person.income-living)*(1+investReturn)+person.startCapital*(year===0?1:0);
 const weeklyLife=70;person.freeHours+=Math.max(0,weeklyLife-e.hours)*WEEKS;
}
function runPerson(seed,id,profileKey){const x=makePerson(seed,id,profileKey);for(let y=0;y<YEARS;y++)yearStep(x,seed,y);const wellbeing=clamp(50+22*x.health+10*Math.log10(Math.max(1,x.wealth+500000)/500000)+12*(x.freeHours/(YEARS*WEEKS*70))-10*(x.burnoutYears/YEARS),0,100);return{...x,wellbeing,efficiency:x.effortHours?x.wealth/x.effortHours:0}}
function runPopulation(seed,n=1000,profileKey=null){const keys=profileKey?[profileKey]:Object.keys(PROFILES),rows=[];for(let i=0;i<n;i++){const k=profileKey||keys[i%keys.length];rows.push(runPerson(seed,i,k))}return rows}
function summarize(rows){return{n:rows.length,wealthMedian:q(rows.map(x=>x.wealth),.5),wealthP10:q(rows.map(x=>x.wealth),.1),incomeMedian:q(rows.map(x=>x.income),.5),wellMedian:q(rows.map(x=>x.wellbeing),.5),healthMedian:q(rows.map(x=>x.health),.5),freeMedian:q(rows.map(x=>x.freeHours),.5),effortMedian:q(rows.map(x=>x.effortHours),.5),loadMedian:q(rows.map(x=>x.effortLoad),.5),efficiencyMedian:q(rows.map(x=>x.efficiency),.5),burnoutRate:mean(rows.map(x=>x.burnoutYears>0?1:0)),positiveRate:mean(rows.map(x=>x.wealth>0?1:0))}}
function compareProfiles(seed,nEach=180){return Object.keys(PROFILES).map((k,idx)=>{const rows=[];for(let i=0;i<nEach;i++)rows.push(runPerson((seed+idx*99991)>>>0,i,k));return{key:k,label:PROFILES[k].label,desc:PROFILES[k].desc,...summarize(rows)}})}
function samePeopleEffortOnly(seed,n=500){const levels=[8,16,24,32,42];return levels.map((hours,li)=>{const rows=[];for(let i=0;i<n;i++){const x=makePerson(seed,i,'strategist');x.p={...x.p,hours,intensity:.62,persistence:.60,sacrifice:clamp((hours-8)/50,.08,.72),strategy:.55,leverage:.40,practice:.62,burst:false};for(let y=0;y<YEARS;y++)yearStep(x,seed,y);x.wellbeing=clamp(50+22*x.health+10*Math.log10(Math.max(1,x.wealth+500000)/500000)+12*(x.freeHours/(YEARS*WEEKS*70))-10*(x.burnoutYears/YEARS),0,100);x.efficiency=x.effortHours?x.wealth/x.effortHours:0;rows.push(x)}return{hours,...summarize(rows)}})}
function survivorView(rows,topShare=.10){const s=rows.slice().sort((a,b)=>b.wealth-a.wealth),top=s.slice(0,Math.max(1,Math.floor(s.length*topShare)));const allBy={},topBy={};for(const k of Object.keys(PROFILES)){allBy[k]=rows.filter(x=>x.profileKey===k).length;topBy[k]=top.filter(x=>x.profileKey===k).length}return{allBy,topBy,top}}
window.EffortLab={YEARS,PROFILES,clamp,mean,q,randomSeed,runPerson,runPopulation,summarize,compareProfiles,samePeopleEffortOnly,survivorView};
})();
