/* No.22 v2.02: conditional frontier for pension/work/investment and freedom-time trade-off.
   Same seeded market path across all alternatives in each sensitivity case.
   Results are model-conditional, NOT employment eligibility or investment advice. */
(function(root){'use strict';
const L=root.PensionLab;if(!L)return;
const HOURS_PER_WEEK=20,WEEKS_PER_YEAR=52;
const fmt=n=>Math.round(n).toLocaleString('ja-JP');
const median=arr=>L.q(arr,.5);
function analyze(settings,target=.8,light=false){
 const c=L.normalized(settings),worlds=c.worlds,limitYears=c.retireAge-c.age,goal=Math.ceil(worlds*target-1e-9);
 const paths=Array.from({length:worlds},(_,i)=>L.worldPath(c,i));
 const outcomeCache=new Map();
 function outcome(type,opts={}){
  const years=opts.workYears??c.workYears, extra=opts.extraInitial||0, addMonthly=opts.extraMonthly||0;
  const key=[type,years,extra,addMonthly].join('/');if(outcomeCache.has(key))return outcomeCache.get(key);
  // The starting balance and outside monthly savings are additive funded inputs, not free money.
  const x=L.normalized({...c,workYears:years,initialInvest:c.initialInvest+extra,monthlyHouseholdInvest:c.monthlyHouseholdInvest+addMonthly});
  const runs=paths.map(p=>L.runPath(x,type,p)),solvent=runs.reduce((n,r)=>n+(r.fullyFunded?1:0),0);
  const o={n:worlds,solvent,rate:solvent/worlds,shortageMedian:median(runs.map(r=>r.shortage)),assetsMedian:median(runs.map(r=>r.assetsAtRetirement)),runs,workYears:years};
  outcomeCache.set(key,o);return o;
 }
 const base=outcome('invest',{workYears:0});
 function workThreshold(type){
  if(base.solvent>=goal)return {years:0,rate:base.rate,atBaseline:true,reachable:true};
  const mx=outcome(type,{workYears:limitYears});if(mx.solvent<goal)return {years:null,rate:mx.rate,reachable:false,maxYears:limitYears};
  let lo=0,hi=limitYears;
  while(lo+1<hi){const md=Math.floor((lo+hi)/2);if(outcome(type,{workYears:md}).solvent>=goal)hi=md;else lo=md}
  const o=outcome(type,{workYears:hi});return {years:hi,rate:o.rate,solvent:o.solvent,reachable:true,hours:hi*WEEKS_PER_YEAR*HOURS_PER_WEEK,monthlyExtra:L.pensionDetails(L.normalized({...c,workYears:hi})).monthlyExtra};
 }
 function capitalThreshold(kind){
  if(base.solvent>=goal)return {extra:0,rate:base.rate,reachable:true,atBaseline:true};
  const gap=kind==='initial'?100000000-c.initialInvest:100000-c.monthlyHouseholdInvest;
  const step=kind==='initial'?10000:100;
  let maxSteps=Math.floor(Math.max(0,gap)/step);
  function count(k){return outcome('invest',{workYears:0,...(kind==='initial'?{extraInitial:k*step}:{extraMonthly:k*step})}).solvent}
  if(count(maxSteps)<goal)return {extra:null,reachable:false,limit:maxSteps*step};
  let lo=0,hi=maxSteps;while(lo+1<hi){const m=Math.floor((lo+hi)/2);if(count(m)>=goal)hi=m;else lo=m}
  const o=outcome('invest',{workYears:0,...(kind==='initial'?{extraInitial:hi*step}:{extraMonthly:hi*step})});
  return{extra:hi*step,rate:o.rate,solvent:o.solvent,reachable:true};
 }
 const pensionYears=workThreshold('control');
 const bothYears=workThreshold('both');
 const initialGap=capitalThreshold('initial');
 const monthlyGap=light?null:capitalThreshold('monthly');
 const observedYears=c.workYears,pay=L.pensionDetails(c),pen=outcome('control',{workYears:observedYears}),both=outcome('both',{workYears:observedYears});
 function comparison(x){const changes=base.runs.map((r,i)=>r.shortage-x.runs[i].shortage);return {improved:changes.filter(v=>v>.01).length,unchanged:changes.filter(v=>Math.abs(v)<=.01).length,medianReduction:median(changes),meanReduction:changes.reduce((v,x)=>v+x,0)/worlds};}
 return {config:c,target,goal,base,pensionYears,bothYears,initialGap,monthlyGap,observed:{years:observedYears,hours:observedYears*52*HOURS_PER_WEEK,netPay:pay.netSalaryMonthly*12*observedYears,pensionExtra:pay.monthlyExtra,pension:pen,both,penVsBase:comparison(pen),bothVsBase:comparison(both)},hoursPerWeek:HOURS_PER_WEEK,workYearMax:limitYears};
}
function selfCheck(){const errors=[];
 for(const target of [.5,.8,.9]){
  const a=analyze({...L.DEFAULT,worlds:40},target),b=analyze({...L.DEFAULT,worlds:40},target);
  if(a.base.solvent!==b.base.solvent || a.initialGap.extra!==b.initialGap.extra)errors.push('determinism');
  if(a.pensionYears.reachable&&a.pensionYears.years>0&&a.pensionYears.rate+1e-9<target)errors.push('work_threshold');
  if(a.bothYears.reachable&&a.bothYears.years>0&&a.bothYears.rate+1e-9<target)errors.push('both_threshold');
  if(a.initialGap.reachable&&a.initialGap.rate+1e-9<target)errors.push('capital_threshold');
  if(a.bothYears.reachable && a.pensionYears.reachable && a.bothYears.years>a.pensionYears.years)errors.push('saving_work_threshold');
 }
 const abundant=analyze({...L.DEFAULT,initialInvest:90000000,worlds:40},.8,true);
 if(abundant.base.rate>=.8 && (abundant.bothYears.years!==0 || abundant.initialGap.extra!==0))errors.push('no_work_needed_with_assets');
 return {ok:!errors.length,errors};
}
root.RetirementFreedom={analyze,selfCheck,HOURS_PER_WEEK};
if(typeof module!=='undefined'&&module.exports)module.exports=root.RetirementFreedom;
})(typeof window!=='undefined'?window:globalThis);
