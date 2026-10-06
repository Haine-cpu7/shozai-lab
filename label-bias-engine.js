(function(){
'use strict';
const YEARS=30,N=300;
const DEFAULTS={hirePenalty:.20,educationPenalty:.20,creditPenalty:.20,removeYear:99};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const q=(a,p)=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),v=(s.length-1)*p,i=Math.floor(v),f=v-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])};
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0}
function H(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return(H(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function traits(seed,id){return{ability:.72+.55*U(seed,id,1),adapt:.65+.55*U(seed,id,2),discipline:.55+.55*U(seed,id,3),health0:.78+.20*U(seed,id,4),cash0:700000+900000*U(seed,id,5),skill0:.34+.18*U(seed,id,6)}}
function mk(seed,id,label){const t=traits(seed,id);return{id:id+1,label,...t,health:t.health0,cash:t.cash0,debt:0,skill:t.skill0,employed:U(seed,id,7)<.88,income:0,stress:.12,options:0,deniedHire:0,deniedEdu:0,deniedCredit:0,training:0,productiveCapital:0,yearsEmployed:0,lastEvent:'開始'}}
function activePenalty(label,year,p){return label==='red'&&year<p.removeYear}
function approval(base,penalty,on){return clamp(base*(on?1-penalty:1),.02,.98)}
function options(a,p,year){let n=0;if(a.employed)n++;if(a.cash-a.debt>300000)n++;if(a.health>.55)n++;if(a.skill>.55)n++;const on=activePenalty(a.label,year,p);const credit=approval(.72+.08*a.ability,p.creditPenalty,on);if(credit>.55)n++;return n}
function stepAgent(a,seed,year,p){const on=activePenalty(a.label,year,p),recession=(year%11===6||year%11===7)?1:0;
 // common shock draws across the paired worlds
 if(U(seed,a.id,year,20)<.025){a.health=clamp(a.health-.08,.35,1.02);a.cash-=90000;a.lastEvent='病気ショック'}
 if(a.employed&&U(seed,a.id,year,21)<(.025+.035*recession)){a.employed=false;a.lastEvent='失業'}
 // education opportunity: same desire/draw, different approval threshold
 const wantsEdu=U(seed,a.id,year,22)<clamp(.20+.22*a.adapt+.10*a.discipline-.10*a.stress,.08,.70);
 if(wantsEdu&&a.health>.48){const base=clamp(.62+.16*a.ability+.10*a.adapt,.2,.95),ap=approval(base,p.educationPenalty,on);if(U(seed,a.id,year,23)<ap){a.skill=clamp(a.skill+.025*(.8+.4*a.ability),.2,1.55);a.training++;a.cash-=45000;a.lastEvent='学習機会を得た'}else{a.deniedEdu++;a.lastEvent='学習機会を逃した'}}
 // hiring: wages are equal conditional on skill/employment; label only affects access
 if(!a.employed){const base=clamp(.48+.20*a.skill+.12*a.ability+.10*a.adapt-.08*recession,.10,.94),ap=approval(base,p.hirePenalty,on);if(U(seed,a.id,year,24)<ap){a.employed=true;a.lastEvent='就職'}else{a.deniedHire++;a.lastEvent='採用されず'}}
 // productive credit opportunity. Approved credit buys equipment/credential that raises productivity.
 const opportunity=U(seed,a.id,year,25)<.16;if(opportunity&&a.health>.50){const base=clamp(.58+.12*a.ability+.12*a.discipline+.00000008*Math.max(0,a.cash-a.debt),.15,.93),ap=approval(base,p.creditPenalty,on);if(U(seed,a.id,year,26)<ap){const invest=250000;a.debt+=invest;a.productiveCapital+=invest;a.lastEvent='成長投資にアクセス'}else{a.deniedCredit++;a.lastEvent='融資に届かず'}}
 const productivity=(.72+.32*a.ability)*(.72+.42*a.skill)*(1+Math.min(.20,a.productiveCapital/2500000));
 let income=a.employed?3300000*(1.012**year)*productivity*(recession?.94:1)*clamp(1+N01(seed,a.id,year,30)*.045,.84,1.16):0;
 const living=2250000*(1.012**year);a.income=income;if(a.employed)a.yearsEmployed++;
 let net=income-living-65000; if(net>=0){a.cash+=net*.26;a.debt=Math.max(0,a.debt-net*.12)}else{const need=-net;if(a.cash>=need)a.cash-=need;else{a.debt+=need-a.cash;a.cash=0}}
 if(a.debt>0)a.debt*=1.035;
 a.stress=clamp(.10+.18*(a.employed?0:1)+.13*Math.min(1,a.debt/1500000)+.05*(a.deniedHire+a.deniedEdu+a.deniedCredit)/Math.max(1,year+1),.05,.78);
 a.health=clamp(a.health+.012-.018*a.stress-.006*recession,.30,1.03);
 a.options=options(a,p,year);
}
function summarizePair(red,blue){const sn=a=>a.cash-a.debt+a.productiveCapital*.65;const g=a=>({medianNet:q(a.map(sn),.5),medianIncome:q(a.map(x=>x.income),.5),employment:a.filter(x=>x.employed).length/a.length,medianSkill:q(a.map(x=>x.skill),.5),medianHealth:q(a.map(x=>x.health),.5),medianOptions:q(a.map(x=>x.options),.5),medianStress:q(a.map(x=>x.stress),.5),deniedHire:mean(a.map(x=>x.deniedHire)),deniedEdu:mean(a.map(x=>x.deniedEdu)),deniedCredit:mean(a.map(x=>x.deniedCredit))});const R=g(red),B=g(blue);const gaps=red.map((r,i)=>sn(blue[i])-sn(r));return{red:R,blue:B,medianPairedNetGap:q(gaps,.5),blueWins:gaps.filter(x=>x>10000).length,redWins:gaps.filter(x=>x<-10000).length,ties:gaps.filter(x=>Math.abs(x)<=10000).length}}
function run(seed=20261006,over={}){const p={...DEFAULTS,...over},red=Array.from({length:N},(_,i)=>mk(seed,i,'red')),blue=Array.from({length:N},(_,i)=>mk(seed,i,'blue')),history=[];for(let y=0;y<YEARS;y++){red.forEach(a=>stepAgent(a,seed,y,p));blue.forEach(a=>stepAgent(a,seed,y,p));if([0,4,9,14,19,24,29].includes(y))history.push({year:y+1,...summarizePair(red,blue)})}return{seed,p,red,blue,history,summary:summarizePair(red,blue)}}
function scenarios(seed){return{full:run(seed),remove15:run(seed,{removeYear:15}),placebo:run(seed,{hirePenalty:0,educationPenalty:0,creditPenalty:0}),hireOnly:run(seed,{educationPenalty:0,creditPenalty:0}),eduOnly:run(seed,{hirePenalty:0,creditPenalty:0}),creditOnly:run(seed,{hirePenalty:0,educationPenalty:0})}}
function robust(seed,n=10){const rows=[];for(let i=0;i<n;i++){const s=run((seed+i*104729)>>>0).summary;rows.push(s)}return{blueMedianWins:rows.filter(x=>x.blue.medianNet>x.red.medianNet).length,skillGapWins:rows.filter(x=>x.blue.medianSkill>x.red.medianSkill).length,employmentGapWins:rows.filter(x=>x.blue.employment>x.red.employment).length,avgPairGap:mean(rows.map(x=>x.medianPairedNetGap))}}
function selfCheck(){const a=run(12345),b=run(12345),issues=[];if(JSON.stringify(a.summary)!==JSON.stringify(b.summary))issues.push('seed reproducibility');const p=scenarios(54321).placebo.summary;if(Math.abs(p.medianPairedNetGap)>1)issues.push('placebo paired gap');if(a.red.length!==300||a.blue.length!==300)issues.push('count');return{ok:!issues.length,issues}}
window.LabelBiasLab={YEARS,N,DEFAULTS,run,scenarios,robust,selfCheck,q,mean};
})();