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
function miniDots(d){const c=Math.max(0,Math.round(d.miniChild)),w=Math.max(0,Math.round(d.miniWork)),e=Math.max(0,Math.round(d.miniElder));return{child:c,work:w,elder:e,total:c+w+e}}
window.JapanMiniLab={START_YEAR,END_YEAR,MINI_BASE,START,SCENARIOS,at,miniDots,clamp,populationMethod:P.method,selfCheck:P.selfCheck};
})();
