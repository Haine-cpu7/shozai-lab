(function(){
'use strict';
const YEARS=30,N=300;
const DEFAULTS={rewardBlock:.70,failurePenalty:1.7,restoreYear:99};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const q=(a,p)=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),v=(s.length-1)*p,i=Math.floor(v),f=v-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])};
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0}
function H(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return(H(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}

// personality/state traits are fixed for a paired BOT in both worlds.
// feedback = how quickly the BOT updates "is the next action worth it?" from observed outcomes.
function traits(seed,id){
  return{
    ability:.72+.55*U(seed,id,1),
    adapt:.58+.60*U(seed,id,2),
    drive:.58+.58*U(seed,id,3),
    health0:.80+.18*U(seed,id,4),
    skill0:.34+.18*U(seed,id,5),
    feedback:.15+.80*U(seed,id,6)
  };
}
function mk(seed,id,world){
  const t=traits(seed,id);
  return{id:id+1,world,...t,health:t.health0,skill:t.skill0,belief:.70,effort:.85,challenge:.55,stress:.12,income:3600000,promotions:0,penalties:0,challengeCount:0,rewardedCount:0,burnoutYears:0,lastEvent:'開始'};
}
function blocked(a,year,p){return a.world==='blocked'&&year<p.restoreYear}
function step(a,seed,year,p){
  const bad=blocked(a,year,p),recession=(year%10===5||year%10===6)?1:0;
  const effort=clamp(.42+.34*a.drive+.34*a.belief-.16*a.stress+.06*N01(seed,a.id,year,10),.25,1.30);
  a.effort=effort;
  const challengeP=clamp(.12+.35*a.adapt+.30*a.belief-.18*a.stress,.05,.90);
  const challenged=U(seed,a.id,year,11)<challengeP;
  if(challenged)a.challengeCount++;
  const perf=clamp((.48+.42*a.ability)*(.58+.45*a.skill)*(.62+.42*effort)+(challenged?.06:0)+.035*N01(seed,a.id,year,12),.15,1.65);
  const success=perf>.78;
  let reward=0;
  if(success){
    const base=clamp(.22+.42*(perf-.70)+.10*a.adapt,.10,.82),prob=bad?base*(1-p.rewardBlock):base;
    if(U(seed,a.id,year,13)<prob){
      reward=1;a.promotions++;a.rewardedCount++;a.income*=1.035+.018*Math.min(1,perf);a.lastEvent='成果が報われた';
    }else{
      a.lastEvent=bad?'成果が報われず':'今回は昇給なし';
    }
  }
  const failure=!success&&perf<.58;
  if(failure){
    const penProb=(.12+.08*recession)*(bad?p.failurePenalty:1);
    if(U(seed,a.id,year,14)<penProb){reward=-.45;a.penalties++;a.income*=.96;a.lastEvent='失敗が重く評価された'}
  }
  // The observation is the same kind of evidence for everyone, but update speed differs by feedback sensitivity.
  const obs=success?(reward>0?1:.12):(failure&&reward<0?0:.38);
  const alpha=.02+.38*a.feedback; // about 0.077..0.381; average stays close to the old fixed 0.22.
  a.belief=clamp((1-alpha)*a.belief+alpha*obs,.04,.96);
  const learnGain=.008+.018*effort*(.65+.35*a.belief)+(challenged?.008:0);
  a.skill=clamp(a.skill+learnGain,.2,1.55);
  a.stress=clamp(.10+.20*(1-a.belief)+.10*recession+.10*Math.max(0,effort-1.05)+.04*a.penalties/Math.max(1,year+1),.05,.82);
  a.health=clamp(a.health+.010-.018*a.stress-.012*Math.max(0,effort-1.0),.30,1.03);
  if(a.health<.60||a.stress>.58)a.burnoutYears++;
  a.challenge=challengeP;
  a.income*=clamp(1+.006*(a.skill-.55)+.004*N01(seed,a.id,year,15),.97,1.05);
}
function subgroup(a){
  const s=a.slice().sort((x,y)=>x.feedback-y.feedback),k=Math.max(1,Math.floor(s.length*.20)),low=s.slice(0,k),high=s.slice(-k);
  return{
    lowBelief:q(low.map(x=>x.belief),.5),highBelief:q(high.map(x=>x.belief),.5),
    lowEffort:q(low.map(x=>x.effort),.5),highEffort:q(high.map(x=>x.effort),.5),
    lowChallenges:q(low.map(x=>x.challengeCount),.5),highChallenges:q(high.map(x=>x.challengeCount),.5)
  };
}
function summarize(fair,blockedG){
  const g=a=>({
    medianEffort:q(a.map(x=>x.effort),.5),medianBelief:q(a.map(x=>x.belief),.5),medianSkill:q(a.map(x=>x.skill),.5),medianIncome:q(a.map(x=>x.income),.5),medianHealth:q(a.map(x=>x.health),.5),medianStress:q(a.map(x=>x.stress),.5),medianChallenges:q(a.map(x=>x.challengeCount),.5),burnoutRate:a.filter(x=>x.burnoutYears>=2).length/a.length,medianPromotions:q(a.map(x=>x.promotions),.5),notice:subgroup(a)
  });
  const F=g(fair),B=g(blockedG);
  return{fair:F,blocked:B,pairedBeliefGap:q(fair.map((x,i)=>x.belief-blockedG[i].belief),.5),pairedSkillGap:q(fair.map((x,i)=>x.skill-blockedG[i].skill),.5)};
}
function run(seed=20261006,over={}){
  const p={...DEFAULTS,...over},fair=Array.from({length:N},(_,i)=>mk(seed,i,'fair')),blockedG=Array.from({length:N},(_,i)=>mk(seed,i,'blocked')),history=[];
  for(let y=0;y<YEARS;y++){
    fair.forEach(a=>step(a,seed,y,p));blockedG.forEach(a=>step(a,seed,y,p));
    if([0,4,9,14,19,24,29].includes(y))history.push({year:y+1,...summarize(fair,blockedG)});
  }
  return{seed,p,fair,blocked:blockedG,history,summary:summarize(fair,blockedG)};
}
function scenarios(seed){return{full:run(seed),restore15:run(seed,{restoreYear:15}),mild:run(seed,{rewardBlock:.40,failurePenalty:1.25}),severe:run(seed,{rewardBlock:.90,failurePenalty:2.0}),placebo:run(seed,{rewardBlock:0,failurePenalty:1})}}
function robust(seed,n=10){const rows=[];for(let i=0;i<n;i++)rows.push(run((seed+i*104729)>>>0).summary);return{beliefLower:rows.filter(x=>x.blocked.medianBelief<x.fair.medianBelief).length,effortLower:rows.filter(x=>x.blocked.medianEffort<x.fair.medianEffort).length,skillLower:rows.filter(x=>x.blocked.medianSkill<x.fair.medianSkill).length,incomeLower:rows.filter(x=>x.blocked.medianIncome<x.fair.medianIncome).length}}
function score(x,min,max){return Math.round(100*clamp((x-min)/(max-min),0,1))}
function describe(a){
  const ability=score(a.ability,.72,1.27),adapt=score(a.adapt,.58,1.18),drive=score(a.drive,.58,1.16),feedback=score(a.feedback,.15,.95);
  let label='標準型';
  if(feedback<30&&drive>65)label='マイペース継続型';
  else if(feedback<30)label='変化に気づきにくい型';
  else if(feedback>75&&adapt>65)label='観察・切替型';
  else if(feedback>75)label='反応の早い観察型';
  else if(drive>75)label='行動先行型';
  else if(adapt>75)label='試行錯誤型';
  const notice=feedback<34?'気づきにくい':feedback>66?'気づきやすい':'中くらい';
  return{label,ability,adapt,drive,feedback,notice};
}
function selfCheck(){
  const a=run(12345),b=run(12345),issues=[];
  if(JSON.stringify(a.summary)!==JSON.stringify(b.summary))issues.push('seed reproducibility');
  const p=scenarios(54321).placebo.summary;
  if(Math.abs(p.pairedBeliefGap)>1e-10||Math.abs(p.pairedSkillGap)>1e-10)issues.push('placebo paired gap');
  const pair=run(24680);for(let i=0;i<N;i++){if(pair.fair[i].feedback!==pair.blocked[i].feedback||pair.fair[i].drive!==pair.blocked[i].drive||pair.fair[i].adapt!==pair.blocked[i].adapt) {issues.push('paired traits mismatch');break}}
  return{ok:!issues.length,issues};
}
window.UnrewardedLab={YEARS,N,DEFAULTS,run,scenarios,robust,selfCheck,q,mean,describe};
})();
