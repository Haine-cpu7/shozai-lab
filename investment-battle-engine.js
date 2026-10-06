(function(){
'use strict';
const YEARS=30, START_WEALTH=10000000, N_AMATEURS=100, STOCKS=18;
const MARKET_LABELS={index:'🌍 投信（世界株）',stock:'📈 個別株',fx:'💱 FX',crypto:'₿ 仮想通貨',realEstate:'🏠 不動産',cash:'💴 現金'};
const STYLE_LABELS={
 index:'🌍 投信ほったらかし',stock:'📈 個別株好き',fx:'💱 FX短期派',crypto:'₿ 仮想通貨FOMO',realEstate:'🏠 不動産集中',cash:'💴 現金派',mixed:'🎲 なんとなく分散'
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:0}
function q(a,p){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),v=(s.length-1)*p,i=Math.floor(v),f=v-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function styleFor(i){if(i<20)return'index';if(i<35)return'stock';if(i<50)return'fx';if(i<65)return'crypto';if(i<77)return'realEstate';if(i<87)return'cash';return'mixed'}
function makeBot(seed,i){const style=styleFor(i);return{id:i+1,kind:'amateur',style,label:STYLE_LABELS[style],wealth:START_WEALTH,peak:START_WEALTH,maxDD:0,bankrupt:false,turnover:0,fees:0,lastWeights:null,lastFx:0,lastStock:Math.floor(U(seed,i,90)*STOCKS),voice:''}}
function makeExpert(){return{id:0,kind:'expert',style:'expert',label:'🧠 投資つよつよBOT',wealth:START_WEALTH,peak:START_WEALTH,maxDD:0,bankrupt:false,turnover:0,fees:0,lastWeights:null,lastFx:0,lastStock:0,voice:''}}
function initMarket(seed){const qualities=Array.from({length:STOCKS},(_,j)=>clamp(N(seed,777,j,1),-1.7,1.7));return{year:0,regime:'normal',lastIndex:.06,lastCrypto:.10,lastRE:.04,lastFx:0,lastStocks:Array(STOCKS).fill(0),cheapness:0,cryptoHeat:0,rateState:0,fxTrend:0,qualities,history:[]}}
function nextRegime(seed,year,prev){const u=U(seed,900,year,1);if(prev==='recession'){if(u<.58)return'normal';if(u<.75)return'inflation';return'recession'}if(prev==='boom'){if(u<.55)return'normal';if(u<.72)return'boom';if(u<.88)return'inflation';return'recession'}if(prev==='inflation'){if(u<.50)return'normal';if(u<.78)return'inflation';return u<.90?'recession':'boom'}return u<.58?'normal':u<.72?'boom':u<.86?'inflation':'recession'}
function marketYear(seed,m,year,efficiency=.72){
 const regime=nextRegime(seed,year,m.regime),z=N(seed,901,year,1),z2=N(seed,902,year,1),z3=N(seed,903,year,1);
 const adj={normal:0,boom:.075,recession:-.16,inflation:-.045}[regime];
 const predictable=(1-efficiency);
 const index=clamp(.055+adj+predictable*(.045*m.cheapness+.018*Math.sign(m.lastIndex)*Math.min(1,Math.abs(m.lastIndex)/.15))+.145*z,-.48,.58);
 const cash=clamp(.012+(regime==='inflation'?.025:regime==='recession'?.004:.010)+.004*z2,-.005,.065);
 const realEstate=clamp(.042+(regime==='boom'?.045:regime==='recession'?-.075:regime==='inflation'?-.035:0)+predictable*(.025*(-m.rateState)+.018*m.cheapness)+.085*(.55*z+.45*z3),-.34,.36);
 const crypto=clamp(.085+(regime==='boom'?.16:regime==='recession'?-.22:regime==='inflation'?-.08:0)+predictable*(.12*Math.sign(m.lastCrypto)*Math.min(1,Math.abs(m.lastCrypto)/.35)-.09*m.cryptoHeat)+.48*(.55*z+.45*N(seed,904,year,1)),-.78,1.75);
 m.fxTrend=clamp(.35*m.fxTrend+.65*N(seed,905,year,1),-1.5,1.5);const fxMove=clamp(.015*m.fxTrend+.105*N(seed,906,year,1),-.24,.24);
 const stocks=m.qualities.map((qual,j)=>clamp(index+predictable*.018*qual+.23*N(seed,910+j,year,1),-.68,1.05));
 const publicSignals={cheapness:clamp(m.cheapness+.22*N(seed,930,year,1),-1.5,1.5),risk:regime==='recession'?1:regime==='inflation'?.65:regime==='boom'?-.45:0,fx:clamp(m.fxTrend+.55*N(seed,931,year,1),-2,2),stockQuality:m.qualities.map((q,j)=>clamp(q+.75*N(seed,940+j,year,1),-2.5,2.5)),cryptoHeat:clamp(m.cryptoHeat+.35*N(seed,960,year,1),-1.5,1.5),rate:clamp(m.rateState+.30*N(seed,961,year,1),-1.5,1.5)};
 m.cheapness=clamp(.78*m.cheapness-.55*(index-.055)+.18*N(seed,970,year,1),-1.4,1.4);m.cryptoHeat=clamp(.70*m.cryptoHeat+.90*(crypto-.08)+.20*N(seed,971,year,1),-1.6,1.6);m.rateState=clamp(.68*m.rateState+(regime==='inflation'?.45:regime==='recession'?-.30:0)+.18*N(seed,972,year,1),-1.4,1.4);
 const out={year:year+1,regime,index,cash,realEstate,crypto,fxMove,stocks,publicSignals,prevIndex:m.lastIndex,prevCrypto:m.lastCrypto,prevRE:m.lastRE,prevFx:m.lastFx,prevStocks:m.lastStocks.slice()};m.regime=regime;m.lastIndex=index;m.lastCrypto=crypto;m.lastRE=realEstate;m.lastFx=fxMove;m.lastStocks=stocks.slice();m.history.push(out);m.year=year+1;return out;
}
function normalize(w){const keys=['index','stock','crypto','realEstate','cash'];let s=keys.reduce((a,k)=>a+Math.max(0,w[k]||0),0);if(s<=0){w.cash=1;s=1}keys.forEach(k=>w[k]=Math.max(0,w[k]||0)/s);return w}
function expertDecision(mkt,year,skill=.92){const s=mkt.publicSignals;const noise=(1-skill),n1=Math.sin((year+1)*1.73),n2=Math.cos((year+1)*2.11);const cheap=clamp(skill*s.cheapness+noise*1.15*n1,-2,2),risk=clamp(skill*s.risk+noise*1.1*n2,-1.5,1.5);let w={index:.46,stock:.18,crypto:.07,realEstate:.17,cash:.12};
 w.index+=.10*cheap-.10*Math.max(0,risk);w.stock+=.05*cheap-.07*Math.max(0,risk);w.realEstate+=-.04*s.rate-.04*Math.max(0,risk);w.crypto+=.04*Math.sign(mkt.prevCrypto)*Math.min(1,Math.abs(mkt.prevCrypto)/.5)-.055*Math.max(0,skill*s.cryptoHeat+noise*n1)-.06*Math.max(0,risk);w.cash+=.22*Math.max(0,risk)+.08*Math.max(0,-cheap);
 w.crypto=clamp(w.crypto,.02,.16);w.stock=clamp(w.stock,.08,.28);w.realEstate=clamp(w.realEstate,.08,.25);w.index=clamp(w.index,.28,.65);w.cash=clamp(w.cash,.05,.38);normalize(w);
 const scores=s.stockQuality.map((x,j)=>({j,x:skill*x+noise*1.4*Math.sin((year+1)*(j+2)*.71)})).sort((a,b)=>b.x-a.x).slice(0,5);const stockRet=mean(scores.map(o=>mkt.stocks[o.j]));const fxSignal=clamp(skill*s.fx+noise*1.2*n2,-2,2);const fx=Math.abs(fxSignal)>.75?Math.sign(fxSignal)*clamp(.12+.10*Math.abs(fxSignal),.12,.28):0;return{weights:w,stockRet,fx,tag:Math.max(0,risk)>.6?'守りを厚く':cheap>.55?'割安資産を増やす':'分散維持'} }
function amateurDecision(bot,mkt,seed,year){const r=U(seed,bot.id,year,200),last=mkt;let w={index:0,stock:0,crypto:0,realEstate:0,cash:0},fx=0,stockRet=0,tag='';
 if(bot.style==='index'){w={index:.90,stock:0,crypto:0,realEstate:0,cash:.10};stockRet=0;tag='積立して放置'}
 else if(bot.style==='stock'){const ranked=mkt.prevStocks.map((v,j)=>({j,v})).sort((a,b)=>b.v-a.v);const chase=(r<.72?ranked[Math.floor(U(seed,bot.id,year,202)*Math.min(5,ranked.length))].j:Math.floor(U(seed,bot.id,year,203)*STOCKS));bot.lastStock=chase;w={index:.15,stock:.72,crypto:.03,realEstate:0,cash:.10};stockRet=mkt.stocks[chase];tag='最近気になる銘柄へ'}
 else if(bot.style==='fx'){w={index:.22,stock:0,crypto:0,realEstate:0,cash:.78};const lev=1.8+2.8*U(seed,bot.id,year,201);fx=Math.sign(last.prevFx||.01)*lev;tag='前の動きに乗る'}
 else if(bot.style==='crypto'){const hot=last.prevCrypto>.18||last.publicSignals.cryptoHeat>.45;const c=hot?.68:.28;w={index:.22,stock:0,crypto:c,realEstate:0,cash:1-.22-c};tag=hot?'上がってるので厚く':'様子見しつつ保有'}
 else if(bot.style==='realEstate'){w={index:.08,stock:0,crypto:0,realEstate:1.28,cash:-.36};tag='不動産は裏切らない'}
 else if(bot.style==='cash'){w={index:.12,stock:0,crypto:0,realEstate:0,cash:.88};tag='減らさないのが一番'}
 else {const a=.15+.45*U(seed,bot.id,year,210),b=.05+.30*U(seed,bot.id,year,211),c=.02+.24*U(seed,bot.id,year,212),d=.05+.30*U(seed,bot.id,year,213);w={index:a,stock:b,crypto:c,realEstate:d,cash:.12};normalize(w);const j=Math.floor(U(seed,bot.id,year,214)*STOCKS);stockRet=mkt.stocks[j];if(U(seed,bot.id,year,215)<.25)fx=Math.sign(last.fxMove||.01)*(0.5+1.5*U(seed,bot.id,year,216));tag='なんとなく分散'}
 return{weights:w,stockRet,fx,tag};}
function portfolioStep(bot,decision,mkt,isExpert=false){if(bot.bankrupt)return;const w=decision.weights;const borrow=Math.max(0,-(w.cash||0));const cashW=Math.max(0,w.cash||0);let ret=(w.index||0)*mkt.index+(w.stock||0)*(decision.stockRet||0)+(w.crypto||0)*mkt.crypto+(w.realEstate||0)*mkt.realEstate+cashW*mkt.cash+decision.fx*mkt.fxMove-borrow*(.035+mkt.cash);
 const prev=bot.lastWeights||{index:0,stock:0,crypto:0,realEstate:0,cash:1};const turn=['index','stock','crypto','realEstate','cash'].reduce((s,k)=>s+Math.abs((w[k]||0)-(prev[k]||0)),0)/2+Math.abs(decision.fx-bot.lastFx)*.12;
 const marketCost=(Math.abs((w.stock||0)-(prev.stock||0))*.004+Math.abs((w.crypto||0)-(prev.crypto||0))*.0045+Math.abs((w.realEstate||0)-(prev.realEstate||0))*.035+Math.abs(decision.fx-bot.lastFx)*.0035+Math.abs((w.index||0)-(prev.index||0))*.001);
 const behaviorCost=isExpert?marketCost:marketCost*(1.10+(bot.style==='fx'?.55:bot.style==='stock'?.25:bot.style==='crypto'?.20:0));
 ret-=behaviorCost+Math.abs(decision.fx)*(isExpert?.0015:.0055);bot.turnover+=turn;bot.fees+=bot.wealth*behaviorCost;bot.wealth*=Math.max(0,1+ret);bot.lastWeights={...w};bot.lastFx=decision.fx;if(bot.wealth<150000){bot.wealth=0;bot.bankrupt=true}bot.peak=Math.max(bot.peak,bot.wealth);const dd=bot.peak>0?1-bot.wealth/bot.peak:1;bot.maxDD=Math.max(bot.maxDD,dd);bot.lastDecision=decision;bot.lastReturn=ret;}
function init(seed=20261006,opts={}){const state={seed,year:0,efficiency:opts.efficiency??.72,expertSkill:opts.expertSkill??.92,market:initMarket(seed),expert:makeExpert(),amateurs:Array.from({length:N_AMATEURS},(_,i)=>makeBot(seed,i)),history:[],lastMarket:null};state.history.push(summarize(state));return state}
function step(state){if(state.year>=YEARS)return state;const m=marketYear(state.seed,state.market,state.year,state.efficiency);const ed=expertDecision(m,state.year,state.expertSkill);portfolioStep(state.expert,ed,m,true);for(const b of state.amateurs){const d=amateurDecision(b,m,state.seed,state.year);portfolioStep(b,d,m,false)}state.year++;state.lastMarket=m;state.history.push(summarize(state));return state}
function runToEnd(state){while(state.year<YEARS)step(state);return state}
function rankAll(state){const all=[state.expert,...state.amateurs].slice().sort((a,b)=>b.wealth-a.wealth);return all.map((b,i)=>({...b,rank:i+1}))}
function styleStats(state){const styles=Object.keys(STYLE_LABELS);return styles.map(k=>{const a=state.amateurs.filter(x=>x.style===k);return{key:k,label:STYLE_LABELS[k],n:a.length,median:q(a.map(x=>x.wealth),.5),p90:q(a.map(x=>x.wealth),.9),bankrupt:a.filter(x=>x.bankrupt).length/a.length,medianDD:q(a.map(x=>x.maxDD),.5)}})}
function summarize(state){const ranks=rankAll(state),expertRank=ranks.find(x=>x.kind==='expert')?.rank||101,wealths=state.amateurs.map(x=>x.wealth),topAm=ranks.find(x=>x.kind==='amateur');const indexBots=state.amateurs.filter(x=>x.style==='index');return{year:state.year,expertWealth:state.expert.wealth,expertRank,expertDD:state.expert.maxDD,amateurMedian:q(wealths,.5),amateurP90:q(wealths,.9),topAmateur:topAm?topAm.wealth:0,topAmateurLabel:topAm?topAm.label:'-',bankruptRate:state.amateurs.filter(x=>x.bankrupt).length/N_AMATEURS,indexMedian:q(indexBots.map(x=>x.wealth),.5),indexDD:q(indexBots.map(x=>x.maxDD),.5),styleStats:styleStats(state)}}
function pickLine(arr,seed,id,year,salt=0,variant=0){if(!arr.length)return'';const u=U(seed,(id||0)+variant*17,year+variant*31,700+salt);return arr[Math.floor(u*arr.length)%arr.length]}
function voices(state,n=6,variant=0){
 const ranks=rankAll(state),am=ranks.filter(x=>x.kind==='amateur'),year=state.year,seed=state.seed;
 const picks=[];const add=b=>{if(b&&!picks.some(x=>x.id===b.id))picks.push(b)};
 // 毎回「上位・中央・下位」は残しつつ、残りは年と切替回数でタイプを回す。
 add(am[0]);add(am[Math.floor(am.length/2)]);add(am[am.length-1]);
 const styles=['index','stock','fx','crypto','realEstate','cash','mixed'];
 const offset=(year+variant*3)%styles.length;
 for(let k=0;k<styles.length&&picks.length<n;k++){
  const style=styles[(offset+k)%styles.length];
  const pool=am.filter(x=>x.style===style&&!picks.some(p=>p.id===x.id));
  if(pool.length)add(pool[Math.floor(U(seed,variant+31,k+year,730)*pool.length)]);
 }
 while(picks.length<n){const b=am[Math.floor(U(seed,variant+91,picks.length+year,731)*am.length)];add(b);if(picks.length>=am.length)break}
 const expert=state.expert,er=ranks.find(x=>x.kind==='expert')||{rank:101},m=state.lastMarket;
 let exPool=[];
 if(year===0)exPool=[
  '1000万円。まず勝つより、退場しない配分から始める。',
  '予想は外れる前提。外れても次の手が残るようにする。',
  '市場を当てるゲームというより、ミスしても生き残るゲームだと思っている。',
  '全力で当てにいかない。30年あるので、まず壊れないこと。'
 ];
 else if(expert.bankrupt)exPool=['これは失敗。分析力があっても、資金管理を壊せば終わる。','退場した。上手さを名乗るなら、まず生存を守るべきだった。'];
 else{
  if((expert.lastReturn||0)<-.12)exPool.push('今年は普通に外した。損失を小さくして、次の判断材料を残す。','痛い下げ。ただし「取り返す」は判断基準にしない。','下落したから正解が変わるわけじゃない。配分が想定内かを確認する。');
  if((expert.lastReturn||0)>.15)exPool.push('今年は伸びた。でも、当たった直後ほど自分を過信しない。','利益は出た。ここで急に賭け金を増やさない。','上手くいった年ほど、実力と相場の追い風を分けて考える。');
  if(expert.maxDD>.30)exPool.push('最大下落はかなり深い。資産額より、この下落を耐えられる設計かを見る。','ドローダウンが大きい。リターンだけ見れば判断を誤る。');
  if(er.rank<=10)exPool.push(`今は${er.rank}位。でも101人の一発勝負の順位はあまり信用していない。`,'上位にはいる。ただ、集中投資の大当たり一発で順位は簡単に入れ替わる。');
  if(er.rank>50)exPool.push(`今は${er.rank}位。順位が悪いからといって、ルールを捨てて大勝負はしない。`,'半分より下。こういう時に戦略を壊すと、検証できなくなる。');
  if(m?.regime==='recession')exPool.push('景気後退。現金は「何もしない資産」じゃなく、次の一手を買う余力。','不況で全部売る気はない。リスクを落として、安い所だけ拾う。');
  if(m?.regime==='boom')exPool.push('好況。全員が天才に見える時ほど、リスク上限を忘れない。','上がっているから正しい、とは限らない。過熱と実力を分ける。');
  if(m?.regime==='inflation')exPool.push('インフレ局面。株だけでなく、金利と不動産の効き方も見る。','物価が動くと、現金の安全と実質価値は同じ話じゃなくなる。');
  if(expert.lastDecision?.tag==='守りを厚く')exPool.push('今は守りを厚く。現金比率を上げるのも立派なポジション。','攻めない年を作れるのも戦略のうち。');
  if(expert.lastDecision?.tag==='割安資産を増やす')exPool.push('割安シグナルが強いので少し増やす。ただし全力ではいかない。','安そうに見える。でも「安い」と「さらに下がらない」は別。');
  if(expert.lastDecision?.tag==='分散維持')exPool.push('特別な優位が見えない。こういう年は分散を崩さない。','何もしない判断もある。売買回数を増やすことが仕事ではない。');
 }
 if(!exPool.length)exPool=['未来は見えない。だから予想より、壊れない配分を優先する。'];
 const ex=pickLine(exPool,seed,0,year,10,variant);
 const amateurText=b=>{
  if(year===0){const starts={index:['よく分からないので世界株を買って置いておく。','銘柄選びは無理。市場ごと持つ。'],stock:['指数じゃ夢がない。伸びそうな株を当てたい。','ちゃんと会社を選べば指数より勝てる気がする。'],fx:['値動きがあるなら毎年チャンスはあるでしょ。','短期なら景気より流れを見ればいいと思う。'],crypto:['値幅が大きい方が増えるのも早いはず。','次の大相場を逃したくない。'],realEstate:['土地と建物は消えない。借金を使えるのも強い。','現物がある方が安心する。'],cash:['減らさないことがまず勝ち。','投資で減るくらいなら現金でいい。'],mixed:['一応いろいろ持っておけば大丈夫でしょ。','分散がいいらしいので、なんとなく全部買う。']};return pickLine(starts[b.style]||['とりあえず始める。'],seed,b.id,year,20,variant)}
  if(b.bankrupt)return pickLine([
   '終わった。取り返そうとして、次の一手までなくした。','ゼロになった。勝つことより退場しないことの方が先だった。','一回の大勝負で全部戻すつもりだった。全部なくなった。','含み損の時に止まれなかった。今なら「次で取り返す」が一番危なかったと分かる。','相場が悪かった、と言いたい。でも賭け金を決めたのは自分だった。','当たる時もあった。それで自分が上手いと思った。','資金が尽きたら、正しい予想をしてももう参加できない。','破産率って他人の数字だと思ってた。自分がその1人になった。'
  ],seed,b.id,year,30,variant);
  const r=b.lastReturn||0,ratio=b.wealth/START_WEALTH,rank=b.rank||101,dd=b.maxDD;
  const common=[];
  if(rank<=10)common.push(`今${rank}位。これ、実力なのか運なのかは考えたくない。`,`上位${rank}位。やっぱ自分、投資向いてるのでは？`);
  if(rank>=90)common.push(`現在${rank}位。みんな何を買ってるんだ…。`,'下の方にいる。戦略を変えたくなってきた。');
  if(r>.18)common.push('今年めっちゃ増えた。急に自信が出てきた。','勝つと、もっと入れておけばよかったって思う。');
  if(r<-.18)common.push('画面を見たくない。','こんなに下がる想定はしてなかった。','売ったら負けな気がする。でも持つ理由も怪しくなってきた。');
  if(dd>.45)common.push('高値から見るとかなり減った。元に戻るまで売りたくない。','「最高値まで戻れば」が基準になってきてる。');
  if(ratio>3)common.push('元本の3倍を超えた。ここまで来ると、最初から分かってた気がしてくる。');
  if(ratio<.55)common.push('1000万円あった頃が遠い。残った資金で逆転できるかな。');
  const byStyle={
   index:[
    '何もしてない。市場が勝手に動いてる。','ニュースは見たけど、結局そのまま。','誰かが爆益してても、こっちは淡々と持つ。','暴落したけど、銘柄を選んでないので何を売ればいいのかもない。','退屈。でも退屈なまま残ってる。','投資してる感は薄い。資産だけ勝手に上下してる。','売買しないせいで話すことがない。それが戦略らしい。','今年も世界株。来年も多分世界株。','上位じゃなくてもいい。30年後に残ってればいい。','みんな忙しそう。私は何もしてない。'
   ],
   stock:[
    'この会社だけは指数より伸びる気がする。','去年強かった銘柄、まだ行けると思う。','決算を見た。分かった気になった。','指数に負けると、銘柄選びを否定された感じがする。','当たった銘柄だけは選んだ理由を鮮明に覚えてる。','外した銘柄は「タイミングが悪かった」で処理したい。','次はちゃんと本物を選ぶ。','この株、売った直後に上がりそうで切れない。','分散すると儲けも薄まる気がして、つい集中する。','企業を見るのは楽しい。成績は別問題。'
   ],
   fx:[
    '流れに乗れた。次もいけそう。','逆に行った。次で取り返したい。','損切りした瞬間に戻るの、本当にやめてほしい。','小さく勝って大きく負ける形になってる気がする。','今日は読めてる。レバレッジもう少し上げてもいいかも。','値動きがないと何もできない気がする。','ポジションを持ってない時間がもったいなく感じる。','一回当たると、次も同じ流れに見える。','負けた直後ほどチャートが簡単に見える。','現金で待つのが一番難しい。'
   ],
   crypto:[
    '上がってる。もっと入れておけばよかった。','え、こんなに下がるの？戻るまで持つ。','SNSが静かになった。こういう時が底なのでは？','みんな騒ぎ始めた。まだ間に合うはず。','半値になったけど、前はもっと上だった。','倍になった。ここで売ったら次の10倍を逃す気がする。','下がると長期投資家になる。','上がると短期で利確したくなる。','値幅が大きすぎて、他の市場が眠く見える。','利益が出ると、リスクを取ったこと自体を忘れる。'
   ],
   realEstate:[
    '家賃が入ると安心する。価格は見ないことにする。','現物ならゼロにはならないと思ってる。','金利が上がると、急に借金の存在感が出る。','売りたい時にすぐ売れないのはちょっと怖い。','借入が効いてる時は天才になった気分。','空室とか修繕とか、このモデルでは軽いけど現実なら面倒そう。','株より値段を毎日見ないぶん精神は楽。','不動産価格が落ちても家はそこにある。安心なのか錯覚なのか。','レバレッジって、上がる時は味方なんだよな。','現物資産という言葉が好き。'
   ],
   cash:[
    '増えなくても減らなければいい。','みんな資産が増えてて少し焦る。','暴落の年だけは現金でよかったと思う。','上昇相場が続くと、何もしないのが一番つらい。','いつか暴落したら買おうと思ってる。いつ買えばいいんだ。','数字は減ってない。物価のことは考えないことにする。','安心はある。機会損失は見えにくい。','投資しないのも一つのポジション、ということにしてる。','周りが儲かってる時だけ、自分が損してる気分になる。','現金は退場しない。増えもしない。'
   ],
   mixed:[
    '分散してるつもり。配分はだいたい。','何が上がっても少しは持ってる。何が下がっても少しは食らう。','去年儲かったものをちょっと増やした。','ポートフォリオって言うと賢そうだけど、決め方は雰囲気。','全部持てば安心だと思ったけど、全部下がる年もあるのか。','どれか当たればいい、くらいの気持ち。','比率を決めた理由を聞かれると困る。','気づいたら一番上がった資産の比率が大きくなってる。','分散してるから大丈夫、の「大丈夫」が何かは分からない。','投資先より、自分が何をしてるか分からなくなる時がある。'
   ]
  };
  const pool=[...(byStyle[b.style]||[]),...common];
  return pickLine(pool.length?pool:['今年も様子を見る。'],seed,b.id,year,40+styles.indexOf(b.style),variant)
 };
 return{expert:ex,amateurs:picks.slice(0,n).map(b=>({id:b.id,label:b.label,rank:b.rank,wealth:b.wealth,text:amateurText(b)}))}
}
function seedStudy(baseSeed=20261006,count=60,opts={}){const rows=[];for(let i=0;i<count;i++){const st=runToEnd(init((baseSeed+i*104729)>>>0,opts)),s=summarize(st),idx=s.styleStats.find(x=>x.key==='index');rows.push({seed:st.seed,expertRank:s.expertRank,expertWealth:s.expertWealth,amateurMedian:s.amateurMedian,topAmateur:s.topAmateur,indexMedian:s.indexMedian,expertDD:s.expertDD,indexDD:s.indexDD,indexBankrupt:idx?idx.bankrupt:0,bankruptRate:s.bankruptRate})}return{rows,top1:rows.filter(r=>r.expertRank===1).length/count,top10:rows.filter(r=>r.expertRank<=10).length/count,beatsMedian:rows.filter(r=>r.expertWealth>r.amateurMedian).length/count,beatsIndex:rows.filter(r=>r.expertWealth>r.indexMedian).length/count,indexBeatsMedian:rows.filter(r=>r.indexMedian>=r.amateurMedian).length/count,medianRank:q(rows.map(r=>r.expertRank),.5),medianExpert:q(rows.map(r=>r.expertWealth),.5),medianIndex:q(rows.map(r=>r.indexMedian),.5),medianDD:q(rows.map(r=>r.expertDD),.5),medianIndexDD:q(rows.map(r=>r.indexDD),.5),medianIndexBankrupt:q(rows.map(r=>r.indexBankrupt),.5)}}
function sensitivity(baseSeed=20261006){const skills=[.55,.72,.92],effs=[.45,.72,.90],rows=[];for(const skill of skills)for(const efficiency of effs){const s=seedStudy(baseSeed,24,{expertSkill:skill,efficiency});rows.push({skill,efficiency,top10:s.top10,medianRank:s.medianRank,beatsIndex:s.beatsIndex})}return rows}
function selfCheck(){const issues=[];const a=runToEnd(init(12345)),b=runToEnd(init(12345));if(JSON.stringify(a.history)!==JSON.stringify(b.history))issues.push('seed reproducibility');if(a.amateurs.length!==100)issues.push('amateur count');const s=summarize(a);for(const k of ['expertWealth','expertRank','amateurMedian','expertDD','bankruptRate'])if(!Number.isFinite(s[k]))issues.push('nonfinite '+k);if(a.expert.wealth<0||a.amateurs.some(x=>x.wealth<0))issues.push('negative wealth');return{ok:!issues.length,issues}}
window.InvestmentBattleLab={YEARS,START_WEALTH,N_AMATEURS,MARKET_LABELS,STYLE_LABELS,clamp,mean,q,randomSeed,init,step,runToEnd,summarize,rankAll,styleStats,voices,seedStudy,sensitivity,selfCheck};
})();
