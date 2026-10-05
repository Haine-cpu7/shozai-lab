(function(){
'use strict';
const START_YEAR=2025, END_YEAR=2070, MINI_BASE=1000;
const START={year:2025,total:123.21,child:13.47,work:73.53,elder:36.21};
const SCENARIOS={
 medium:{label:'出生中位',tfr:'長期TFR 1.36',anchors:[
  {year:2025,total:123.21,child:13.47,work:73.53,elder:36.21},
  {year:2045,total:108.80,child:11.03,work:58.32,elder:39.45},
  {year:2065,total:91.59,child:8.36,work:48.09,elder:35.13},
  {year:2070,total:87.00,child:7.97,work:45.35,elder:33.67}
 ]},
 high:{label:'出生高位',tfr:'長期TFR 1.64',anchors:[
  {year:2025,total:123.21,child:13.47,work:73.53,elder:36.21},
  {year:2045,total:112.03,child:13.21,work:59.37,elder:39.45},
  {year:2065,total:98.85,child:11.28,work:52.44,elder:35.13},
  {year:2070,total:95.49,child:11.15,work:50.67,elder:33.67}
 ]},
 low:{label:'出生低位',tfr:'長期TFR 1.13',anchors:[
  {year:2025,total:123.21,child:13.47,work:73.53,elder:36.21},
  {year:2045,total:106.00,child:9.19,work:57.36,elder:39.45},
  {year:2065,total:85.70,child:6.20,work:44.37,elder:35.13},
  {year:2070,total:80.24,child:5.69,work:40.87,elder:33.67}
 ]}
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function interp(a,b,t){return a+(b-a)*t}
function at(year,key='medium'){
 const s=SCENARIOS[key]||SCENARIOS.medium,y=clamp(year,START_YEAR,END_YEAR),A=s.anchors;
 let lo=A[0],hi=A[A.length-1];
 for(let i=0;i<A.length-1;i++){if(y>=A[i].year&&y<=A[i+1].year){lo=A[i];hi=A[i+1];break}}
 const t=hi.year===lo.year?0:(y-lo.year)/(hi.year-lo.year),out={year:y};
 for(const k of ['total','child','work','elder'])out[k]=interp(lo[k],hi[k],t);
 out.childShare=out.child/out.total;out.workShare=out.work/out.total;out.elderShare=out.elder/out.total;
 out.workPerElder=out.work/(out.elder||1);out.dependency=(out.child+out.elder)/(out.work||1);
 out.miniTotal=out.total/START.total*MINI_BASE;out.miniChild=out.child/START.total*MINI_BASE;out.miniWork=out.work/START.total*MINI_BASE;out.miniElder=out.elder/START.total*MINI_BASE;
 out.lossFromStart=1-out.total/START.total;out.workLossFromStart=1-out.work/START.work;out.childLossFromStart=1-out.child/START.child;out.elderChangeFromStart=out.elder/START.elder-1;
 return out;
}
function miniDots(d){
 const c=Math.max(0,Math.round(d.miniChild)),w=Math.max(0,Math.round(d.miniWork)),e=Math.max(0,Math.round(d.miniElder));
 return {child:c,work:w,elder:e,total:c+w+e};
}
window.JapanMiniLab={START_YEAR,END_YEAR,MINI_BASE,START,SCENARIOS,at,miniDots,clamp};
})();
