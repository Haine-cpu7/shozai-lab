(function(){
'use strict';
const P=window.JapanPopulationData;if(!P)throw new Error('japan-population-data.js must be loaded before japan-engine.js');
const START_YEAR=2025,END_YEAR=2070,MINI_BASE=1000,START={...P.ACTUAL_2025},SCENARIOS=P.POP;
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function at(year,key='medium'){
 const out=P.at(year,key,true);
 out.dependency=(out.child+out.elder)/(out.work||1);
 out.miniTotal=out.total/START.total*MINI_BASE;out.miniChild=out.child/START.total*MINI_BASE;out.miniWork=out.work/START.total*MINI_BASE;out.miniElder=out.elder/START.total*MINI_BASE;
 out.lossFromStart=1-out.total/START.total;out.workLossFromStart=1-out.work/START.work;out.childLossFromStart=1-out.child/START.child;out.elderChangeFromStart=out.elder/START.elder-1;
 return out;
}
function miniDots(d){
 // 表示専用：年齢3区分を合計人数に正規化し、最大剰余法で端数を配分する。
 // 国勢調査の年齢不詳や推計表の丸め差で、ドットが総人数を超えないようにする。
 const total=Math.max(0,Math.round(d.miniTotal));
 const raw=[d.miniChild,d.miniWork,d.miniElder].map(x=>Math.max(0,Number(x)||0));
 const sum=raw.reduce((a,b)=>a+b,0);
 if(!total||!sum)return{child:0,work:0,elder:0,total:0};
 const scaled=raw.map(x=>x/sum*total);
 const counts=scaled.map(Math.floor);
 let remain=total-counts.reduce((a,b)=>a+b,0);
 const order=[0,1,2].sort((a,b)=>(scaled[b]-Math.floor(scaled[b]))-(scaled[a]-Math.floor(scaled[a]))||a-b);
 for(let i=0;i<remain;i++)counts[order[i]]++;
 return{child:counts[0],work:counts[1],elder:counts[2],total};
}
window.JapanMiniLab={START_YEAR,END_YEAR,MINI_BASE,START,SCENARIOS,at,miniDots,clamp,populationMethod:P.method,selfCheck:P.selfCheck};
})();
