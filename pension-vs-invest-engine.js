/* No.22 Pension × Work × Investing — deterministic educational model.
 * Public pension approximation: post-April-2003 remuneration-proportional accrual;
 * NOT an official pension estimate and NOT an option to redirect compulsory premiums.
 */
(function(root){'use strict';
const TYPES=[
 {id:'invest',name:'投資だけ',icon:'🌱',short:'投資だけ'},
 {id:'pension',name:'働いて厚生年金',icon:'🏢',short:'働いて年金'},
 {id:'both',name:'働いて年金＋投資',icon:'🏢🌱',short:'働いて両方'},
 {id:'shadow',name:'保険料相当額を投資（仮想）',icon:'🧪',short:'同額投資（仮想）'}
];
const DEFAULT={age:30,retireAge:65,endAge:95,workYears:20,monthlyGross:120000,monthlyHouseholdInvest:10000,initialInvest:1000000,saveRate:.50,otherDeduction:.10,marketMu:.05,marketSigma:.15,inflation:.02,pensionRealDrag:.003,retireBudget:140000,basePension:70608,seed:20261008,worlds:300};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function normalized(x={}){const c={...DEFAULT,...x};const ints=['age','retireAge','endAge','workYears','monthlyGross','monthlyHouseholdInvest','initialInvest','retireBudget','basePension','seed','worlds'];for(const k of ints)c[k]=Math.round(+c[k]);for(const k of ['saveRate','otherDeduction','marketMu','marketSigma','inflation','pensionRealDrag'])c[k]=+c[k];c.age=clamp(c.age,20,64);c.retireAge=clamp(c.retireAge,c.age+1,75);c.endAge=clamp(c.endAge,c.retireAge+1,110);c.workYears=clamp(c.workYears,0,c.retireAge-c.age);c.monthlyGross=clamp(c.monthlyGross,0,600000);c.monthlyHouseholdInvest=clamp(c.monthlyHouseholdInvest,0,100000);c.initialInvest=clamp(c.initialInvest,0,100000000);c.retireBudget=clamp(c.retireBudget,0,1000000);c.basePension=clamp(c.basePension,0,500000);c.saveRate=clamp(c.saveRate,0,1);c.otherDeduction=clamp(c.otherDeduction,0,.35);c.marketMu=clamp(c.marketMu,-.04,.14);c.marketSigma=clamp(c.marketSigma,0,.35);c.inflation=clamp(c.inflation,0,.06);c.pensionRealDrag=clamp(c.pensionRealDrag,0,.03);c.seed=(c.seed||DEFAULT.seed)>>>0;c.worlds=clamp(c.worlds,10,1000);return c}
// Simplified premium, excluding future grade changes, annual bonuses, transitional rules, benefits and taxation.
const EMPLOYEE_PENSION_RATE=.0915;
const BENEFIT_FACTOR=.005481;
function pensionDetails(c){const premiumMonthly=c.monthlyGross*EMPLOYEE_PENSION_RATE;
const coveredMonths=c.workYears*12;const annualExtra=c.monthlyGross*BENEFIT_FACTOR*coveredMonths;
const netSalaryMonthly=c.monthlyGross*(1-EMPLOYEE_PENSION_RATE-c.otherDeduction);
return{premiumMonthly,coveredMonths,annualExtra,monthlyExtra:annualExtra/12,netSalaryMonthly,
workHours:c.workYears*52*20, // fixed illustrative 20h/week, not labor participation eligibility.
workingNetCash:netSalaryMonthly*12*c.workYears,
workingExtraSavings:netSalaryMonthly*c.saveRate*12*c.workYears,
shadowOutsideFunding:premiumMonthly*12*c.workYears};}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296}}
function gaussian(rand){const u=Math.max(1e-10,rand()),v=rand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function worldPath(c,index){const rand=rng((c.seed+Math.imul(index,104729))>>>0),path=[];for(let age=c.age;age<c.endAge;age++){
let r=clamp(c.marketMu+c.marketSigma*gaussian(rand),-.80,.70);
// Fixed crash event convention for toy tail risk; nominal simple-return perturbation.
if(rand()<.025)r=Math.max(-.80,r-.25);
path.push((1+r)/(1+c.inflation)-1);}
return path}
function runPath(c,type,path){const p=pensionDetails(c),endWorkAge=c.age+c.workYears;
let assets=c.initialInvest,shortage=0,shortYears=0,firstShort=null,assetsAtRetirement=0,baseSpendYears=0;
for(let age=c.age;age<c.endAge;age++){
 const market=path[age-c.age];
 if(age<c.retireAge){const work=age<endWorkAge && (type==='pension'||type==='both');
 let save=c.monthlyHouseholdInvest*12;
 if(work&&type==='both')save+=p.netSalaryMonthly*c.saveRate*12;
 if(age<endWorkAge&&type==='shadow')save+=p.premiumMonthly*12;
 assets=Math.max(0,assets*(1+market)+save*(1+market/2));
 if(age===c.retireAge-1)assetsAtRetirement=assets;
 }else{
 const pensionFactor=Math.pow(1-c.pensionRealDrag,age-c.retireAge);
 const publicPension=(c.basePension*12+(type==='pension'||type==='both'?p.annualExtra:0))*pensionFactor;
 const required=Math.max(0,c.retireBudget*12-publicPension);
 if(required>assets+1e-7){shortage+=required-assets;shortYears++;if(firstShort===null)firstShort=age;assets=0}
 else assets-=required;
 assets=Math.max(0,assets*(1+market));baseSpendYears++;
 }
}
return{endAssets:assets,assetsAtRetirement,shortage,shortYears,firstShort,fullyFunded:shortYears===0}}
function q(values,p){if(!values.length)return 0;let arr=[...values].sort((a,b)=>a-b),z=(arr.length-1)*p,a=Math.floor(z),b=Math.ceil(z);return arr[a]+(arr[b]-arr[a])*(z-a)}
function summarize(values){const sum={n:values.length,solvent:values.filter(v=>v.fullyFunded).length,
assetsAt65:q(values.map(v=>v.assetsAtRetirement),.5),
assetsAt65Low:q(values.map(v=>v.assetsAtRetirement),.1),
endAssets:q(values.map(v=>v.endAssets),.5),
endAssetsLow:q(values.map(v=>v.endAssets),.1),
shortageMedian:q(values.map(v=>v.shortage),.5),
shortageBad:q(values.map(v=>v.shortage),.9),
shortYearsMedian:q(values.map(v=>v.shortYears),.5),
shortAgeMedian:q(values.filter(v=>v.firstShort!==null).map(v=>v.firstShort),.5)};
return sum}
function batch(settings={}){const c=normalized(settings),p=pensionDetails(c),runs=Object.fromEntries(TYPES.map(t=>[t.id,[]]));
for(let i=0;i<c.worlds;i++){let path=worldPath(c,i);for(let t of TYPES)runs[t.id].push(runPath(c,t.id,path))}
const results=Object.fromEntries(TYPES.map(t=>[t.id,summarize(runs[t.id])]));
const cmp=(a,b)=>{let x=0,equal=0;for(let i=0;i<c.worlds;i++){const d=runs[a][i].shortage-runs[b][i].shortage;if(d<-.01)x++;else if(Math.abs(d)<.01)equal++}return{aBetter:x,tie:equal,bBetter:c.worlds-x-equal}};
return{config:c,details:p,results,compare:{pensionVsShadow:cmp('pension','shadow'),bothVsInvest:cmp('both','invest')},runs}}
function selfCheck(){const errors=[];let c=normalized(),p=pensionDetails(c);if(Math.abs(p.annualExtra-120000*.005481*240)>1e-5)errors.push('pension_formula');let a=batch({...DEFAULT,worlds:10});if(a.results.invest.n!==10)errors.push('world_count');if(a.results.both.solvent<a.results.pension.solvent)errors.push('paired_monotonicity_both');if(a.results.pension.assetsAt65!==a.results.invest.assetsAt65)errors.push('equal_baseline_asset_pre65');if(a.results.shadow.assetsAt65<a.results.invest.assetsAt65)errors.push('shadow_funding');let b=batch({...DEFAULT,worlds:10});if(JSON.stringify(a.results)!==JSON.stringify(b.results))errors.push('seed_determinism');return {ok:errors.length===0,errors}}
const api={TYPES,DEFAULT,EMPLOYEE_PENSION_RATE,BENEFIT_FACTOR,normalized,pensionDetails,worldPath,runPath,batch,selfCheck,q};root.PensionLab=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
