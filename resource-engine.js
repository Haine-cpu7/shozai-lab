(function(){
'use strict';
const YEARS=30,N=300;
const DEFAULTS={severity:.40,launchYears:5};
const TRAIT_RANGES={ability:[.75,1.25],adapt:[.65,1.20],discipline:[.60,1.15],risk:[.55,1.15],health0:[.82,.98],skill0:[.38,.55]};
const ALL_MASK={cash:true,learning:true,time:true,info:true,recovery:true};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const q=(a,p)=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),v=(s.length-1)*p,i=Math.floor(v),f=v-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])};
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0}
function H(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return(H(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function traits(seed,id){return{ability:.75+.50*U(seed,id,1),adapt:.65+.55*U(seed,id,2),discipline:.60+.55*U(seed,id,3),risk:.55+.60*U(seed,id,4),health0:.82+.16*U(seed,id,5),skill0:.38+.17*U(seed,id,6)}}
function lowFactor(severity,weight){return clamp(1-severity*weight,.25,1)}
function resources(label,year,p,mask){if(label==='standard'||year>=p.launchYears)return{learning:1,time:1,info:1,recovery:1};return{learning:mask.learning?lowFactor(p.severity,.70):1,time:mask.time?lowFactor(p.severity,.58):1,info:mask.info?lowFactor(p.severity,.62):1,recovery:mask.recovery?lowFactor(p.severity,.82):1}}
function startCash(label,p,mask){const base=1400000;return label==='low'&&mask.cash?base*lowFactor(p.severity,.95):base}
function mk(seed,id,label,p,mask){const t=traits(seed,id);return{id:id+1,label,...t,health:t.health0,cash:startCash(label,p,mask),debt:0,skill:t.skill0,employed:U(seed,id,7)<.78,income:0,stress:.10,productiveCapital:0,yearsEmployed:0,training:0,challenges:0,successes:0,blockedLearn:0,blockedChallenge:0,missedInfo:0,recoveryYears:0,options:0,lastEvent:'開始'}}
function netWorth(a){return a.cash-a.debt+a.productiveCapital*.62}
function optionCount(a){let n=0;if(a.employed)n++;if(netWorth(a)>300000)n++;if(a.health>.60)n++;if(a.skill>.58)n++;if(a.debt<500000)n++;if(a.cash>180000||a.productiveCapital>250000)n++;return n}
function stepAgent(a,seed,year,p,mask){const r=resources(a.label,year,p,mask),recession=(year%10===6||year%10===7)?1:0;
  // Common shocks are paired: same BOT id + year gets the same draw in both worlds.
  if(U(seed,a.id,year,20)<.032){const raw=105000*(1+.18*U(seed,a.id,year,201));const cost=raw*(1.30-.30*r.recovery);a.health=clamp(a.health-.075*(1.08-.08*r.recovery),.30,1.02);a.cash-=cost;a.stress=clamp(a.stress+.07*(1.10-.10*r.recovery),.04,.90);a.lastEvent='生活ショック'}
  if(a.employed&&U(seed,a.id,year,21)<(.030+.042*recession)){a.employed=false;a.lastEvent='失業'}

  const wantsLearn=U(seed,a.id,year,22)<clamp(.18+.20*a.adapt+.12*a.discipline-.10*a.stress,.06,.70);
  const learnAccess=clamp(r.learning*r.time,.20,1);
  if(wantsLearn){if(U(seed,a.id,year,23)<learnAccess&&a.health>.46){const cost=65000;if(a.cash+120000*r.recovery>=cost){a.cash-=cost;a.skill=clamp(a.skill+.026*(.82+.36*a.ability),.20,1.60);a.training++;a.lastEvent='学習できた'}else{a.blockedLearn++;a.lastEvent='学習を見送った'}}else{a.blockedLearn++;a.lastEvent='学習機会に届かなかった'}}

  const discoveryBase=clamp(.13+.09*a.adapt+.04*a.discipline,.12,.36),discovered=U(seed,a.id,year,24)<discoveryBase*r.info;
  const wouldDiscover=U(seed,a.id,year,24)<discoveryBase;
  if(wouldDiscover&&!discovered)a.missedInfo++;

  if(!a.employed){const base=clamp(.43+.21*a.skill+.11*a.ability+.08*a.adapt-.08*recession-.05*a.stress,.10,.94);const access=clamp(.84+.16*r.info,.70,1);if(U(seed,a.id,year,25)<base*access){a.employed=true;a.lastEvent='就職'}else a.lastEvent='就職できず'}

  const wantsChallenge=discovered&&U(seed,a.id,year,26)<clamp(.18+.20*a.risk+.12*a.adapt+.08*a.skill-.10*a.stress,.08,.75);
  if(wantsChallenge){const runway=Math.max(0,netWorth(a));const feasible=clamp(.35+.28*r.recovery+.00000012*runway+.10*r.time,.15,.95);if(U(seed,a.id,year,27)<feasible){a.challenges++;const successP=clamp(.43+.16*a.ability+.12*a.skill+.08*a.adapt-.05*recession,.22,.86);if(U(seed,a.id,year,28)<successP){a.successes++;a.productiveCapital+=210000*(.90+.20*a.ability);a.skill=clamp(a.skill+.018,.20,1.60);a.cash+=70000;a.lastEvent='挑戦が実った'}else{const loss=115000*(1.20-.20*r.recovery);a.cash-=loss;a.stress=clamp(a.stress+.055*(1.10-.10*r.recovery),.04,.90);a.lastEvent='挑戦に失敗'}}else{a.blockedChallenge++;a.lastEvent='挑戦を見送った'}}

  const productivity=(.74+.30*a.ability)*(.76+.40*a.skill)*(1+Math.min(.18,a.productiveCapital/2600000));
  const income=a.employed?3250000*(1.012**year)*productivity*(recession?.94:1)*clamp(1+N01(seed,a.id,year,30)*.04,.86,1.14):0;
  a.income=income;if(a.employed)a.yearsEmployed++;
  const living=2280000*(1.012**year),net=income-living-70000;
  if(net>=0){a.cash+=net*.27;a.debt=Math.max(0,a.debt-net*.13)}else{let need=-net;const temporaryHelp=year<p.launchYears?130000*r.recovery:0;need=Math.max(0,need-temporaryHelp);if(a.cash>=need)a.cash-=need;else{a.debt+=need-a.cash;a.cash=0}}
  if(a.cash<0){a.debt+=-a.cash;a.cash=0}
  if(a.debt>0)a.debt*=1.042;
  a.stress=clamp(.08+.17*(a.employed?0:1)+.15*Math.min(1,a.debt/1400000)+.05*(a.blockedLearn+a.blockedChallenge+a.missedInfo)/Math.max(1,year+1),.04,.84);
  if(a.stress>.42||a.debt>800000)a.recoveryYears++;
  a.health=clamp(a.health+.013-.017*a.stress-.006*recession,.30,1.03);
  a.options=optionCount(a);
}
function summarizePair(low,standard){const g=a=>({medianNet:q(a.map(netWorth),.5),medianIncome:q(a.map(x=>x.income),.5),employment:a.filter(x=>x.employed).length/a.length,employmentStability:mean(a.map(x=>x.yearsEmployed/YEARS)),medianSkill:q(a.map(x=>x.skill),.5),medianHealth:q(a.map(x=>x.health),.5),medianOptions:q(a.map(x=>x.options),.5),debtRate:a.filter(x=>x.debt>250000).length/a.length,avgTraining:mean(a.map(x=>x.training)),avgChallenges:mean(a.map(x=>x.challenges)),avgBlockedLearn:mean(a.map(x=>x.blockedLearn)),avgBlockedChallenge:mean(a.map(x=>x.blockedChallenge)),avgMissedInfo:mean(a.map(x=>x.missedInfo)),avgRecoveryYears:mean(a.map(x=>x.recoveryYears))});const L=g(low),S=g(standard),gaps=low.map((x,i)=>netWorth(standard[i])-netWorth(x));return{low:L,standard:S,medianPairedNetGap:q(gaps,.5),standardWins:gaps.filter(x=>x>10000).length,lowWins:gaps.filter(x=>x<-10000).length,ties:gaps.filter(x=>Math.abs(x)<=10000).length}}
function normalizeMask(mask){return{cash:!!mask.cash,learning:!!mask.learning,time:!!mask.time,info:!!mask.info,recovery:!!mask.recovery}}
function run(seed=20261007,over={},mask=ALL_MASK){const p={...DEFAULTS,...over},m=normalizeMask(mask),low=Array.from({length:N},(_,i)=>mk(seed,i,'low',p,m)),standard=Array.from({length:N},(_,i)=>mk(seed,i,'standard',p,m)),history=[];for(let y=0;y<YEARS;y++){low.forEach(a=>stepAgent(a,seed,y,p,m));standard.forEach(a=>stepAgent(a,seed,y,p,m));if([0,4,9,14,19,24,29].includes(y))history.push({year:y+1,...summarizePair(low,standard)})}return{seed,p,mask:m,low,standard,history,summary:summarizePair(low,standard)}}
function sensitivity(seed,levels=[0,.20,.40,.60]){return levels.map(severity=>{const r=run(seed,{severity},ALL_MASK),s=r.summary;return{severity,run:r,summary:s,assetGapRate:s.standard.medianNet?((s.standard.medianNet-s.low.medianNet)/Math.abs(s.standard.medianNet)):0,skillGapRate:s.standard.medianSkill?((s.standard.medianSkill-s.low.medianSkill)/Math.abs(s.standard.medianSkill)):0,employmentGapPP:(s.standard.employmentStability-s.low.employmentStability)*100,optionsGap:s.standard.medianOptions-s.low.medianOptions}})}
function decomposition(seed,severity=.40){const one=k=>({cash:false,learning:false,time:false,info:false,recovery:false,[k]:true});return{all:run(seed,{severity},ALL_MASK),cash:run(seed,{severity},one('cash')),learning:run(seed,{severity},one('learning')),time:run(seed,{severity},one('time')),info:run(seed,{severity},one('info')),recovery:run(seed,{severity},one('recovery')),placebo:run(seed,{severity:0},ALL_MASK)}}
function robust(seed,n=10,severity=.40){const rows=[];for(let i=0;i<n;i++){const s=run((seed+i*104729)>>>0,{severity},ALL_MASK).summary;rows.push(s)}return{standardMedianWins:rows.filter(x=>x.standard.medianNet>x.low.medianNet).length,skillWins:rows.filter(x=>x.standard.medianSkill>x.low.medianSkill).length,stabilityWins:rows.filter(x=>x.standard.employmentStability>x.low.employmentStability).length,avgPairGap:mean(rows.map(x=>x.medianPairedNetGap)),avgGapRate:mean(rows.map(x=>x.standard.medianNet?((x.standard.medianNet-x.low.medianNet)/Math.abs(x.standard.medianNet)):0))}}
function traitBand(key,value){const r=TRAIT_RANGES[key],z=(value-r[0])/(r[1]-r[0]);return z<.33?'低':z>.67?'高':'中'}
function profile(a){return{ability:traitBand('ability',a.ability),adapt:traitBand('adapt',a.adapt),discipline:traitBand('discipline',a.discipline),risk:traitBand('risk',a.risk),health0:traitBand('health0',a.health0),skill0:traitBand('skill0',a.skill0)}}
function pairRows(st){return st.low.map((l,i)=>{const s=st.standard[i],gap=netWorth(s)-netWorth(l);return{id:l.id,low:l,standard:s,gap,frictionLow:l.blockedLearn+l.blockedChallenge+l.missedInfo,frictionStandard:s.blockedLearn+s.blockedChallenge+s.missedInfo}})}
function representativePairs(st){const rows=pairRows(st).slice().sort((a,b)=>Math.abs(b.gap)-Math.abs(a.gap));if(!rows.length)return[];const picks=[rows[0],rows[Math.floor(rows.length/2)],rows[rows.length-1]],seen=new Set();return picks.filter(x=>!seen.has(x.id)&&seen.add(x.id))}
function decompositionRows(seed,severity=.40){const d=decomposition(seed,severity),names={all:'全部',cash:'初期資金だけ',learning:'学習アクセスだけ',time:'時間余裕だけ',info:'情報アクセスだけ',recovery:'失敗後の立て直しだけ'};return Object.keys(names).map(k=>{const s=d[k].summary,groupMedianGap=s.standard.medianNet-s.low.medianNet,groupGapRate=s.standard.medianNet?groupMedianGap/Math.abs(s.standard.medianNet):0,pairedGap=s.medianPairedNetGap,pairedGapRate=s.standard.medianNet?pairedGap/Math.abs(s.standard.medianNet):0;return{key:k,name:names[k],summary:s,groupMedianGap,groupGapRate,pairedGap,pairedGapRate,gap:pairedGap,gapRate:groupGapRate}})}
function selfCheck(){const a=run(12345),b=run(12345),issues=[];if(JSON.stringify(a.summary)!==JSON.stringify(b.summary))issues.push('seed reproducibility');const p=run(54321,{severity:0},ALL_MASK).summary;if(Math.abs(p.medianPairedNetGap)>1)issues.push('placebo paired gap');if(a.low.length!==N||a.standard.length!==N)issues.push('count');for(const row of pairRows(a)){const x=row.low,y=row.standard;if(x.ability!==y.ability||x.adapt!==y.adapt||x.discipline!==y.discipline||x.risk!==y.risk||x.health0!==y.health0||x.skill0!==y.skill0){issues.push('paired traits mismatch');break}}return{ok:!issues.length,issues}}
window.ResourceLab={YEARS,N,DEFAULTS,TRAIT_RANGES,ALL_MASK,run,sensitivity,decomposition,decompositionRows,robust,profile,pairRows,representativePairs,netWorth,selfCheck,q,mean};
})();
