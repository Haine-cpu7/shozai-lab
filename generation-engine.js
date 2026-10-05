(()=>{
'use strict';
const YEARS=30;
const COHORTS={
  y1965:{year:1965,label:'1965 就職',era:'高度成長後半',historical:true,entry:1.12,wage:.012,stability:.93,costPressure:.032,housing:.86,market:.031,shock:.82,scar:.00},
  y1975:{year:1975,label:'1975 就職',era:'安定成長への移行',historical:true,entry:1.00,wage:.009,stability:.91,costPressure:.022,housing:.92,market:.032,shock:.86,scar:.03},
  y1988:{year:1988,label:'1988 就職',era:'バブル期',historical:true,entry:1.12,wage:.007,stability:.92,costPressure:.014,housing:1.22,market:.030,shock:.88,scar:.01},
  y1995:{year:1995,label:'1995 就職',era:'就職氷河期',historical:true,entry:.76,wage:.0045,stability:.83,costPressure:.001,housing:1.03,market:.031,shock:1.10,scar:.13},
  y2000:{year:2000,label:'2000 就職',era:'氷河期後半',historical:false,entry:.73,wage:.0045,stability:.82,costPressure:.000,housing:.99,market:.032,shock:1.10,scar:.15},
  y2008:{year:2008,label:'2008 就職',era:'金融危機前後',historical:false,entry:.80,wage:.006,stability:.85,costPressure:.004,housing:1.02,market:.032,shock:1.08,scar:.08},
  y2020:{year:2020,label:'2020 就職',era:'コロナ期',historical:false,entry:.88,wage:.007,stability:.87,costPressure:.018,housing:1.15,market:.033,shock:1.06,scar:.05}
};
const EFFORTS={
  light:{label:'🦥 薄め',value:.72,hours:32},
  normal:{label:'🐢 標準',value:1.00,hours:40},
  high:{label:'🔥 高め',value:1.24,hours:48},
  extreme:{label:'💥 かなり高い',value:1.43,hours:55}
};
const STRATEGIES={
  steady:{label:'🧱 堅実',learn:.58,switching:.55,save:.15,risk:.66},
  selective:{label:'🦥 選別',learn:.56,switching:.90,save:.14,risk:.68},
  grind:{label:'🔥 粘る',learn:.68,switching:.28,save:.15,risk:.48},
  adaptive:{label:'🧠 適応',learn:.74,switching:.78,save:.16,risk:.62}
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function mean(a){return a.reduce((s,x)=>s+x,0)/(a.length||1)}
function q(a,p){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),v=(s.length-1)*p,i=Math.floor(v),f=v-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return(hash(seed,a,b,c)+.5)/4294967296}
function N(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function person(seed,id=0){return{ability:clamp(.82+.36*U(seed,id,1),.75,1.20),health:clamp(.86+.26*U(seed,id,2),.78,1.14),family:clamp(.25+.50*U(seed,id,3),.2,.8),startCapital:Math.round(900000+1200000*U(seed,id,4))}}
function scaledCohort(c,scale=1){const n={entry:.90,wage:.007,stability:.87,costPressure:.010,housing:1,market:.032,shock:1,scar:.05};const z={...c};for(const k of Object.keys(n))z[k]=n[k]+(c[k]-n[k])*scale;return z}
function macro(c,cohort,y,seed,world){
  // Shared personal luck component is identical across cohorts. Cohort-specific macro intensity changes how hard it hits.
  const common=N(seed,world*37+y,31,0),eraNoise=N(seed,world*41+y,32,c.year%97),cycle=Math.sin((y+1)*.52+(c.year%11)*.21);
  let recession=0;
  if(cohort==='y1988'&&(y===3||y===4||y===5))recession=-.18;
  if(cohort==='y1995'&&(y<7||y===13))recession=-.12;
  if(cohort==='y2000'&&(y<4||y===8))recession=-.11;
  if(cohort==='y2008'&&(y<3||y===12))recession=-.14;
  if(cohort==='y2020'&&y<2)recession=-.16;
  return clamp(1+common*.040*c.shock+eraNoise*.035*c.shock+cycle*.018+recession,.60,1.26);
}
function run(seed,cohortKey='y1995',effortKey='normal',strategyKey='steady',world=0,opts={}){
  const rawC=COHORTS[cohortKey],eraScale=opts.eraScale===undefined?1:opts.eraScale,c=scaledCohort(rawC,eraScale),ef0=EFFORTS[effortKey],st=STRATEGIES[strategyKey],p=person(seed,world);
  const scarScale=opts.scarScale===undefined?1:opts.scarScale,effortSpread=opts.effortSpread===undefined?1:opts.effortSpread;
  const ef={...ef0,value:clamp(1+(ef0.value-1)*effortSpread,.55,1.58),hours:40+(ef0.hours-40)*effortSpread};
  let wealth=p.startCapital,wage=3000000*(.90+.18*p.ability),skill=.72+.10*p.ability,health=p.health,employed=true,scar=0;
  let unemployedYears=0,irregularYears=0,burnoutYears=0,totalIncome=0,totalHours=0,homeAge=null,shockYears=0;
  // Entry shock: same person, different era.
  const entryProb=clamp(.48+.34*c.entry+.14*p.ability+.06*st.switching,.38,.98);
  if(U(seed,world,90,0)>entryProb){employed=false;scar+=c.scar*scarScale;unemployedYears++;}
  for(let y=0;y<YEARS;y++){
    const m=macro(c,cohortKey,y,seed,world),bad=m<.91;
    if(bad)shockYears++;
    const over=Math.max(0,ef.value-1.05);
    health=clamp(health-.012*over+.004*(ef.value<.9?1:0)+N(seed,world*53+y,71,0)*.006,.55,1.12);
    if(health<.72)burnoutYears++;
    skill=clamp(skill+.012*st.learn*(.78+.24*p.ability)*(.70+.32*ef.value),.65,1.55);
    if(!employed){
      const re=clamp(.30+.30*c.entry+.24*st.switching+.09*skill-.12*(1-health),.20,.94);
      if(U(seed,world*67+y,44,0)<re){employed=true;wage*=.90-.10*scar;}
      else{unemployedYears++;scar=clamp(scar+.018*c.scar*scarScale,0,.35)}
    }else{
      const lose=clamp(.016+(1-c.stability)*.16+(bad?.055:0)+(1-health)*.05-.025*st.risk,.008,.24);
      if(U(seed,world*67+y,45,0)<lose){employed=false;unemployedYears++;scar=clamp(scar+.04*c.scar*scarScale,0,.35)}
    }
    const wageGrowth=c.wage+.012*(skill-1)-.010*scar;
    wage*=clamp(1+wageGrowth+N(seed,world*53+y,72,0)*.018,.86,1.13);
    const effortReturn=.62+.42*Math.log1p(ef.value*2.2);
    const income=employed?wage*effortReturn*health*m:wage*.36*m;
    if(!employed)irregularYears++;
    totalIncome+=income;
    const living=2450000*(1+.003*y)*(1+.08*(c.housing-1))*(1+.18*c.costPressure);
    const housingExtra=260000*c.housing;
    const riskCost=70000*st.risk;
    let net=income-living-housingExtra-riskCost;
    if(net<0&&p.family>.55)net+=Math.min(-net,180000*p.family);
    const trim=clamp(st.save*.34,0,.10); net+=living*trim;
    const invest=clamp(c.market+N(seed,world*71+y,73,0)*.075,-.22,.24);
    wealth=(wealth+net)*(1+invest);
    totalHours+=ef.hours*52;
    const housePrice=26000000*c.housing*(1+.006*y);
    if(homeAge===null&&wealth>housePrice*.20&&income>housePrice*.13)homeAge=22+y;
    scar*=.965;
  }
  const freeHours=YEARS*52*70-totalHours;
  const wellbeing=clamp(58+10*Math.log10(Math.max(1,wealth+1500000)/1500000)-9*(unemployedYears/YEARS)-8*(burnoutYears/YEARS)+8*(freeHours/(YEARS*52*70))-.12*scar*100,0,100);
  return{cohortKey,cohort:rawC,effortKey,effort:ef,strategyKey,strategy:st,person:p,wealth,totalIncome,unemployedYears,irregularYears,burnoutYears,homeAge,shockYears,freeHours,wellbeing,scar};
}
function batch(seed,cohortKey,effortKey='normal',strategyKey='steady',n=200,opts={}){const rows=[];for(let i=0;i<n;i++)rows.push(run(seed,cohortKey,effortKey,strategyKey,i,opts));return summarize(rows)}
function summarize(rows){return{n:rows.length,wealthMedian:q(rows.map(x=>x.wealth),.5),wealthP10:q(rows.map(x=>x.wealth),.1),incomeMedian:q(rows.map(x=>x.totalIncome),.5),unempMedian:q(rows.map(x=>x.unemployedYears),.5),irregularMedian:q(rows.map(x=>x.irregularYears),.5),burnoutMedian:q(rows.map(x=>x.burnoutYears),.5),homeRate:mean(rows.map(x=>x.homeAge!==null?1:0)),homeAgeMedian:q(rows.filter(x=>x.homeAge!==null).map(x=>x.homeAge),.5),wellMedian:q(rows.map(x=>x.wellbeing),.5),positiveRate:mean(rows.map(x=>x.wealth>0?1:0)),rows}}
function compareCohorts(seed,effortKey='normal',strategyKey='steady',n=200,opts={}){return Object.keys(COHORTS).map(k=>({key:k,...batch(seed,k,effortKey,strategyKey,n,opts)}))}
function paired(seed,a,b,effortA='normal',effortB='normal',strategy='steady',n=200,opts={}){const diffs=[];let aWin=0;for(let i=0;i<n;i++){const x=run(seed,a,effortA,strategy,i,opts),y=run(seed,b,effortB,strategy,i,opts);diffs.push(x.wealth-y.wealth);if(x.wealth>y.wealth)aWin++}return{medianDiff:q(diffs,.5),winRate:aWin/n,diffs}}
function decomposeMatrix(matrix){const R=matrix.length,C=matrix[0].length,flat=matrix.flat(),grand=mean(flat),rm=matrix.map(r=>mean(r)),cm=Array.from({length:C},(_,j)=>mean(matrix.map(r=>r[j])));let ssR=0,ssC=0,ssI=0;for(let i=0;i<R;i++)ssR+=C*(rm[i]-grand)**2;for(let j=0;j<C;j++)ssC+=R*(cm[j]-grand)**2;for(let i=0;i<R;i++)for(let j=0;j<C;j++)ssI+=(matrix[i][j]-rm[i]-cm[j]+grand)**2;const t=ssR+ssC+ssI||1;return{row:ssR/t,col:ssC/t,interaction:ssI/t,grand}}
function eraEffortFactorial(seed,n=120,strategy='steady',opts={}){const ck=Object.keys(COHORTS),ek=Object.keys(EFFORTS),wealth=[];for(const c of ck){const row=[];for(const e of ek){const r=[];for(let i=0;i<n;i++)r.push(run(seed,c,e,strategy,i,opts).wealth);row.push(mean(r))}wealth.push(row)}const d=decomposeMatrix(wealth);return{cohorts:ck,efforts:ek,wealth,era:d.row,effort:d.col,interaction:d.interaction}}
function selfCheck(){const issues=[];const r=compareCohorts(20261006,'normal','steady',10);if(r.length!==Object.keys(COHORTS).length)issues.push('cohort count');for(const x of r)if(!Number.isFinite(x.wealthMedian))issues.push('non finite');const f=eraEffortFactorial(20261006,8);if(Math.abs(f.era+f.effort+f.interaction-1)>.00001)issues.push('variance share');return{ok:!issues.length,issues}}
window.GenerationLab={YEARS,COHORTS,EFFORTS,STRATEGIES,run,batch,summarize,compareCohorts,paired,eraEffortFactorial,randomSeed,selfCheck,q,mean};
})();
