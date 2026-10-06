(function(){
'use strict';
const YEARS=50, PAIRS=300;
const GROUPS={
 struggle:{
  label:'🪨 苦労美徳BOT',short:'苦労美徳',hours:48,process:.96,learn:.62,save:.16,switching:.35,
  automation:.18,delegation:.12,rest:.24,venture:.060,risk:.58,meritBelief:.94,
  desc:'長く・自分で・手を抜かずやることを高く評価。「楽をする＝ずるい」と感じやすい。'
 },
 efficient:{
  label:'⚡ 要領最適化BOT',short:'要領最適化',hours:38,process:1.04,learn:.68,save:.16,switching:.70,
  automation:.70,delegation:.60,rest:.66,venture:.075,risk:.62,meritBelief:.18,
  desc:'同じ成果なら少ない手間を選ぶ。仕組み化・外注・撤退・学び直しへの抵抗が少ない。'
 }
};
const BASE_ENV={
 label:'ごりごり資本主義',safetyNet:.08,jobMarket:.79,wageGrowth:.012,rentGrowth:.014,
 leverageReward:.72,overtimePremium:.16,capitalReturn:.055,capitalVol:.17,ventureRate:.070,
 layoffBase:.035,shockRate:1.0,outputReward:1.0
};
function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:0}
function q(a,p){if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y),v=(s.length-1)*p,i=Math.floor(v),f=v-i;return s[i+1]===undefined?s[i]:s[i]+f*(s[i+1]-s[i])}
function mix32(x){x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function hash(seed,a=0,b=0,c=0){return mix32((seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35))}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function N01(seed,a=0,b=0,c=0){const u1=Math.max(1e-12,U(seed,a,b,c)),u2=U(seed,a,b,c+1);return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}
function randomSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]>>>0}catch(e){return(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}}
function envWith(overrides={}){return {...BASE_ENV,...overrides}}
function basePerson(seed,id){
 return {id:id+1,
  ability:clamp(.76+U(seed,id,1)*.50,.72,1.28),
  adaptability:clamp(.64+U(seed,id,2)*.58,.58,1.28),
  health:clamp(.82+U(seed,id,3)*.20,.78,1.03),
  skill:clamp(.40+U(seed,id,4)*.16,.38,.58),
  fit:clamp(.66+U(seed,id,5)*.52,.58,1.24),
  care:clamp(.04+U(seed,id,6)*.26,.03,.32),
  startCash:Math.round(1200000+U(seed,id,7)*1200000),
  employed:U(seed,id,8)<.96,
  hoursAffinity:clamp(.62+U(seed,id,9)*.76,.60,1.40),
  leverageAffinity:clamp(.72+U(seed,id,10)*.58,.70,1.32),
  // Subjective comparison sensitivity: used only for the commentary 'ずるい感', not for economic outcomes.
  fairnessSensitivity:U(seed,id,11)
 };
}
function clonePerson(p,groupKey){const g=GROUPS[groupKey];return {groupKey,group:g.label,id:p.id,ability:p.ability,adaptability:p.adaptability,
 health:p.health,skill:p.skill,fit:p.fit,care:p.care,hoursAffinity:p.hoursAffinity,leverageAffinity:p.leverageAffinity,fairnessSensitivity:p.fairnessSensitivity,cash:p.startCash,invested:0,debt:0,employed:p.employed,
 systems:0,stress:.15+.10*p.care,burnoutYears:0,jobLosses:0,switches:0,trainingYears:0,ventureWins:0,ventureLosses:0,
 totalHours:0,totalIncome:0,totalSaved:0,wellbeing:64,freeHours:28,workHours:g.hours,lastIncome:0,lastCost:0,lastShock:'なし',bankrupt:false};}
function net(a){return a.cash+a.invested-a.debt}
function pairMap(state){const m=new Map();for(const a of state.agents){if(!m.has(a.id))m.set(a.id,{});m.get(a.id)[a.groupKey]=a}return m}
function groupAgents(state,key){return state.agents.filter(a=>a.groupKey===key)}
function livingCost(a,year,env){return (2250000+390000*a.care)*(1+env.rentGrowth)**year}
function actualHours(a,g){return clamp(g.hours*(1-.15*clamp(a.systems,0,1.5))*(a.health<.55?.90:1),27,55)}
function freeHoursFrom(work,study){return clamp(70-work-study-8,4,38)}
function stepAgent(a,seed,year,env){
 const g=GROUPS[a.groupKey];
 const macro=clamp(1+.018+N01(seed,9000,year,1)*.055,.84,1.16),recession=macro<.965?1:0;
 // Same underlying random draws per paired ID; different behavior changes thresholds/exposure, not luck itself.
 const learnDraw=U(seed,a.id,year,10),switchDraw=U(seed,a.id,year,11),autoDraw=U(seed,a.id,year,12),ventureDraw=U(seed,a.id,year,13);
 const studyHours=(learnDraw<g.learn*(.78+.18*a.adaptability)&&a.health>.48)?(2.5+2.5*g.learn):0;
 if(studyHours>0){a.skill=clamp(a.skill+.012*g.learn*a.ability*(.88+.15*a.adaptability),.25,1.85);a.trainingYears++}
 const workHours=actualHours(a,g);a.workHours=workHours;a.freeHours=freeHoursFrom(workHours,studyHours);a.totalHours+=(workHours+studyHours)*50;
 // Switch sooner if fit is bad. Same draw, different switching propensity.
 if(a.employed&&a.fit<.79&&switchDraw<g.switching*.42){a.fit=clamp(.58+U(seed,a.id,year,14)*.70*a.adaptability,.48,1.34);a.cash=Math.max(0,a.cash-65000);a.switches++}
 // Systems / automation / delegation cost money now, but reduce later hours and raise output leverage.
 const monthly=livingCost(a,year,env)/12,buffer=monthly>0?a.cash/monthly:0;
 const systemP=(.55*g.automation+.45*g.delegation)*(.62+.30*a.adaptability)*(.65+.25*a.skill);
 if(buffer>=3.5&&a.health>.48&&autoDraw<systemP*.28){const cost=90000+260000*(.3+.7*U(seed,a.id,year,15));if(a.cash>cost+2*monthly){a.cash-=cost;a.systems=clamp(a.systems+.055+.085*U(seed,a.id,year,16),0,1.6)}}
 a.systems*=.985;
 // Shared bad-luck draws.
 const illness=U(seed,a.id,year,20)<(.024+.032*(1-a.health)+.015*a.stress)*env.shockRate;
 const layoffP=(env.layoffBase+.045*recession+.018*(1-a.fit))*(1.08-.18*a.adaptability);
 const jobLoss=a.employed&&U(seed,a.id,year,21)<layoffP*env.shockRate;
 a.lastShock='なし';
 if(illness){a.lastShock='病気';a.health=clamp(a.health-.048-.030*U(seed,a.id,year,22),.24,1.04)}
 if(jobLoss){a.employed=false;a.jobLosses++;a.lastShock=a.lastShock==='なし'?'失業':a.lastShock+'＋失業'}
 if(!a.employed){const rehire=clamp(.24+.36*env.jobMarket+.18*a.skill+.12*a.adaptability+.10*g.switching-.14*recession,.07,.92);if(U(seed,a.id,year,23)<rehire){a.employed=true;a.fit=clamp(.55+U(seed,a.id,year,24)*.67*a.adaptability,.46,1.30)}}
 // High hours help, but with diminishing returns. Systems/skill/fit are strongly rewarded in this arena.
 const hoursRatio=workHours/40;
 const hoursReturn=1+env.overtimePremium*a.hoursAffinity*Math.log1p(Math.max(0,hoursRatio-.72)*1.8);
 const systemReturn=1+env.leverageReward*a.leverageAffinity*.24*a.systems;
 const processReturn=.78+.24*g.process;
 let income=0;
 if(a.employed){income=3850000*(1+env.wageGrowth)**year*(.56+.70*a.skill)*(.67+.42*a.ability)*(.67+.38*a.fit)*(.72+.32*a.health)*hoursReturn*systemReturn*processReturn*macro*env.outputReward;income*=clamp(1+N01(seed,a.id,year,25)*.09,.70,1.33)}
 // Venture has high upside/downside; efficient bots attempt a little more, but success depends on shared traits and luck.
 const ventureP=env.ventureRate*(.58+.38*a.adaptability)*(.62+.25*a.skill)*(.70+.30*g.venture)*(1+.18*a.systems);
 if(ventureDraw<ventureP&&a.cash>4*monthly){const stake=Math.min(1000000,Math.max(140000,a.cash*.14));const good=U(seed,a.id,year,26)<clamp(.38+.12*(a.ability-1)+.12*(a.skill-.7)+.08*(a.adaptability-.8),.22,.68);if(good){a.cash+=stake*(1.0+4.2*U(seed,a.id,year,27));a.ventureWins++}else{a.cash-=Math.min(a.cash,stake*(.55+.95*U(seed,a.id,year,28)));a.ventureLosses++}}
 // Health cost from chronic overwork; rest helps recovery. Belief itself does not directly reduce earnings.
 const over=Math.max(0,workHours-42)/10,restGain=(a.freeHours/38)*g.rest*.010;
 a.health=clamp(a.health-.010*over-.0018*a.stress-.0015*a.care+restGain-(illness?0:0),.24,1.04);
 const burnoutEvent=U(seed,a.id,year,29)<clamp(.012+.045*Math.max(0,a.stress-.48)+.030*over+.020*Math.max(0,.55-a.health),.005,.18);
 if(burnoutEvent){a.burnoutYears++;income*=.82;a.health=clamp(a.health-.035,.24,1.04)}
 const cost=livingCost(a,year,env)+65000*g.risk+(illness?185000*(1-.42*g.risk):0);
 let transfer=0;if(!a.employed||income<cost)transfer=Math.max(0,cost-income)*env.safetyNet;
 let flow=income+transfer-cost;
 if(flow>=0){let surplus=flow;if(a.debt>0){const pay=Math.min(a.debt,surplus);a.debt-=pay;surplus-=pay}const saved=Math.min(surplus,Math.max(0,income)*g.save);a.cash+=saved;a.totalSaved+=saved}
 else{const need=-flow;if(a.cash>=need)a.cash-=need;else{const short=need-a.cash;a.cash=0;a.debt+=short}}
 if(a.debt>0)a.debt*=1.065;
 const buffer2=(cost/12)>0?a.cash/(cost/12):0;
 if(buffer2>=5&&a.debt<250000&&a.cash>400000){const add=Math.max(0,(a.cash-5*(cost/12))*.52);a.cash-=add;a.invested+=add}
 if(a.invested>0){const market=env.capitalReturn+N01(seed,9100,year,1)*.105,idio=N01(seed,a.id,year,30)*env.capitalVol*.36;a.invested*=clamp(1+market+idio,.62,1.46)}
 const nw=net(a);a.bankrupt=a.debt>8500000&&nw<0;
 a.stress=clamp(.15+.17*(a.debt>0?Math.min(1,a.debt/4500000):0)+.13*(!a.employed?1:0)+.10*a.care+.08*(a.burnoutYears>0?Math.min(1,a.burnoutYears/5):0)-.10*Math.min(1,a.freeHours/32)-.06*Math.min(1,buffer2/8),.04,.92);
 a.totalIncome+=income+transfer;a.lastIncome=income+transfer;a.lastCost=cost;
 a.wellbeing=clamp(48+17*(a.health-.5)+4*Math.log10(Math.max(1,nw+3000000)/3000000)+.42*a.freeHours+7*(a.employed?1:0)-18*a.stress-7*a.care,0,100);
}
function unfairnessScore(a,other){
 if(a.groupKey!=='struggle')return 0;
 // Subjective commentary index only: 1 = almost no resentment, 100 = extremely unfair-feeling.
 // Each BOT has a different comparison sensitivity; this never changes income, health or assets.
 const disposition=clamp(Number.isFinite(a.fairnessSensitivity)?a.fairnessSensitivity:.50,0,1);
 if(!other)return clamp(1+99*disposition,1,100);
 const aNet=net(a),oNet=net(other);
 const incomeGap=clamp((other.lastIncome-a.lastIncome)/Math.max(1200000,Math.abs(a.lastIncome)+1200000),-1.25,1.75);
 const wealthGap=clamp((oNet-aNet)/Math.max(5000000,(Math.abs(aNet)+Math.abs(oNet))*.45+2500000),-1.35,1.85);
 const hourGap=clamp((a.workHours-other.workHours)/14,-1.4,1.8);
 const freeGap=clamp((other.freeHours-a.freeHours)/16,-1.4,1.8);
 const outcomeMismatch=.48*incomeGap+.52*wealthGap;
 const effortMismatch=.62*hourGap+.38*freeGap;
 const strain=clamp(.55*a.stress+.12*Math.min(4,a.burnoutYears)/4+.18*Math.max(0,.65-a.health),0,1);
 // Situation can amplify or soften the BOT's own disposition. A low-sensitivity BOT can still shrug off a large gap;
 // a high-sensitivity BOT can approach 100 when it works more yet falls behind.
 const situation=clamp(.38+.34*outcomeMismatch+.24*effortMismatch+.18*strain,0,1);
 const perceived=clamp(disposition*(.18+1.34*situation),0,1);
 return clamp(1+99*perceived,1,100);
}
function pickVoice(list,a,year,salt=0){
 if(!list.length)return '';
 const idx=hash((a.id*2654435761)>>>0,year,salt,Math.round((net(a)+50000000)/100000))%list.length;
 return list[idx];
}
function voiceFor(a,other,year){
 const nw=net(a),u=unfairnessScore(a,other),otherNet=other?net(other):0;
 const gap=other?otherNet-nw:0;
 const isAhead=other&&nw>otherNet+300000;
 const isBehind=other&&otherNet>nw+300000;
 const bigAhead=other&&nw>Math.max(1,otherNet)*1.35;
 const bigBehind=other&&otherNet>Math.max(1,nw)*1.35;
 const muchMoreHours=other&&a.workHours>other.workHours+6;
 const muchLessHours=other&&a.workHours<other.workHours-6;
 if(a.groupKey==='struggle'){
  const pools={
   burnout:[
    `BOT ${a.id}「休むと置いていかれる気がする。休みたいのに、休んだ自分を責める方がしんどい。」`,
    `BOT ${a.id}「最近、朝から疲れてる。まだやれると思う自分と、もう無理だろって自分が喧嘩してる。」`,
    `BOT ${a.id}「体調悪いって言うのも甘えみたいで嫌なんだよな。いや、普通にしんどいんだけど。」`,
    `BOT ${a.id}「ここまで頑張ったんだから、今さら手を抜く方がもったいない気がする。」`,
    `BOT ${a.id}「休んだら回復するのは分かってる。でも、休んでる間に誰かが先に行くのが嫌だ。」`,
    `BOT ${a.id}「もう${a.burnoutYears}年くらい限界っぽい。限界って、もっと派手に来ると思ってた。」`,
    `BOT ${a.id}「仕事してない時間に罪悪感が出る。誰にも怒られてないのに。」`,
    `BOT ${a.id}「昔は『根性で何とかなる』って思ってた。最近は根性にも残量あるんだなって思う。」`
   ],
   unfair:[
    `BOT ${a.id}「こっちは週${a.workHours.toFixed(0)}時間やってる。向こうは${other?other.workHours.toFixed(0):'?'}時間。なのに向こうの方が上って、そりゃモヤる。」`,
    `BOT ${a.id}「結果だけ同じなら同じ評価って言われても、こっちは削った時間があるんだけどな。」`,
    `BOT ${a.id}「『やり方が悪い』で片づけられると腹立つ。こっちは手を抜いてない。」`,
    `BOT ${a.id}「楽してるように見える奴が先に行くと、正直ちょっとズルく見える。」`,
    `BOT ${a.id}「努力量まで見てくれよ、とは思う。結果しか見ないなら、頑張った時間は何だったんだろ。」`,
    `BOT ${a.id}「向こうは仕組み、こっちは手作業。どっちも成果って言われると、まだ納得しきれない。」`,
    `BOT ${a.id}「別に妬みたくないんだけど、こっちの方が働いてるのに差が開くと気になる。」`,
    `BOT ${a.id}「『効率いいね』って褒められてるの見ると、じゃあ俺の粘りは何点なんだって思う。」`,
    `BOT ${a.id}「手を抜いてるように見えるのに負けてる。たぶん“手を抜いてるように見える”のが違うんだろうな。」`,
    `BOT ${a.id}「苦労してない奴が悪いわけじゃない。でも、苦労した側が何も加点されないのは寂しい。」`
   ],
   systems:[
    `BOT ${a.id}「仕組み化も使うようになった。でも、自分で手を動かしてないと仕事した感じがしない。」`,
    `BOT ${a.id}「自動化したら楽になった。楽になったのに、なぜかちょっと後ろめたい。」`,
    `BOT ${a.id}「任せた方が早いのは分かる。分かるけど、自分でやった方がちゃんとしてる気がする。」`,
    `BOT ${a.id}「最近は効率化も覚えた。昔の自分なら『それズルじゃん』って言ってた気がする。」`,
    `BOT ${a.id}「機械に任せてる時間、最初はサボってる感じがした。今はちょっと慣れた。」`,
    `BOT ${a.id}「手作業を減らしたら結果は落ちなかった。むしろ自分の『苦労しないと不安』が残ってる。」`
   ],
   success:[
    `BOT ${a.id}「結局、積み上げた時間は裏切らなかった。遠回りでも、ここまで来たのは事実だ。」`,
    `BOT ${a.id}「ちゃんと続けてきた分は残った。効率悪かったところも含めて、自分では納得してる。」`,
    `BOT ${a.id}「資産は増えた。だから全部正しかった、とまでは言わないけど、無駄ではなかった。」`,
    `BOT ${a.id}「楽な道じゃなかったけど、途中で投げなかった自分は嫌いじゃない。」`,
    `BOT ${a.id}「ここまで来ると『もっと楽できたかも』とは思う。でも、今さら全部否定する気もない。」`,
    `BOT ${a.id}「頑張った時間に意味があったかは分からない。でも、結果はちゃんと残った。」`
   ],
   ahead:[
    `BOT ${a.id}「向こうより働いて、今はこっちが上。こういう時は『やっぱり量も大事だろ』って言いたくなる。」`,
    `BOT ${a.id}「効率だけが正解じゃない。地味に積むのも普通に強い。」`,
    `BOT ${a.id}「今日はちょっとだけ言わせてほしい。手を抜かなかった分、ちゃんと勝ってる。」`,
    `BOT ${a.id}「結果が出ると、急に昔の苦労まで正解だった気がしてくる。危ないなこれ。」`
   ],
   base:[
    `BOT ${a.id}「今日もちゃんと働いた。近道より、手を抜かず続ける方が自分には合ってる。」`,
    `BOT ${a.id}「楽な方を選ぶと、あとでツケが来そうで怖い。だから先にやっとく。」`,
    `BOT ${a.id}「『そこまでやらなくていいよ』って言われると、逆に落ち着かない。」`,
    `BOT ${a.id}「時間かけた分だけ安心する。効率がいいかは別として。」`,
    `BOT ${a.id}「要領よくって言われても、その“要領”が信用できるまで自分で確認したい。」`,
    `BOT ${a.id}「人に任せるくらいなら自分でやった方が早い、って毎年言ってる気がする。」`,
    `BOT ${a.id}「一応終わった。でも、もう一回見直す。こういうのが積み重なるんだろうな。」`,
    `BOT ${a.id}「頑張ってる自分の方が安心する。結果より先に、そこを確認してる感じがある。」`,
    `BOT ${a.id}「近道って、本当に近道なのか？って疑ってるうちに、普通の道を歩き切った。」`,
    `BOT ${a.id}「別に苦労したいわけじゃない。雑にやって失敗するのが嫌なだけ。」`,
    `BOT ${a.id}「休みの日なのに仕事のこと考えてた。これ、真面目なのか下手なのか分からん。」`,
    `BOT ${a.id}「ちゃんとやる、を続けてる。ちゃんとって何だよとはたまに思う。」`
   ]
  };
  if(a.burnoutYears>=2||a.health<.58)return pickVoice(pools.burnout,a,year,101);
  if((bigBehind&&muchMoreHours)||u>58)return pickVoice(pools.unfair,a,year,102);
  if(a.systems>.55)return pickVoice(pools.systems,a,year,103);
  if(nw>30000000)return pickVoice(pools.success,a,year,104);
  if(isAhead)return pickVoice(pools.ahead,a,year,105);
  return pickVoice(pools.base,a,year,106);
 }
 const pools={
  bankrupt:[
   `BOT ${a.id}「近道も外す。今回は普通に読み違えた。次は損失を小さくしてやり直す。」`,
   `BOT ${a.id}「効率化しても破産は破産。判断ミスはショートカットできないな。」`,
   `BOT ${a.id}「一回ゼロに近づいた。反省はするけど、苦労を増やせば戻るとは思ってない。」`,
   `BOT ${a.id}「これは失敗。言い訳せず、次は生存率を上げる設計に変える。」`,
   `BOT ${a.id}「最適化してたつもりで、最悪化してた。こういう年もある。」`
  ],
  systems:[
   `BOT ${a.id}「自分がやらなくていい仕事が増えた。空いた時間で、次の仕組みを作る。」`,
   `BOT ${a.id}「一回作ったものが勝手に働いてる。これを覚えると、手作業に戻りづらい。」`,
   `BOT ${a.id}「今日は仕事したというより、仕事を減らす仕事をした。」`,
   `BOT ${a.id}「自動化したら暇になった。暇になったので、さらに自動化した。」`,
   `BOT ${a.id}「人に任せたら、自分より上手かった。ちょっと悔しいけど、結果は助かる。」`,
   `BOT ${a.id}「仕組みが回ってる間に寝る。起きても回ってたら勝ち。」`,
   `BOT ${a.id}「自分の時間を使わずに結果が出る場所を増やしてる。今はそれが一番面白い。」`,
   `BOT ${a.id}「手を抜いたんじゃなくて、手を使わなくていい形にした。」`
  ],
  ahead:[
   `BOT ${a.id}「作業時間で勝つ気はない。同じ1時間なら、あとに残るものを増やしたい。」`,
   `BOT ${a.id}「向こうより働いてないのに上なら、今のところ仕組みの方が効いてるってことだと思う。」`,
   `BOT ${a.id}「頑張った量じゃなくて、残った成果を見る。今はそれでいい。」`,
   `BOT ${a.id}「早く終わったから早く帰る。それで評価が同じなら、別に残る理由ないよね。」`,
   `BOT ${a.id}「『楽してる』って言われても、楽になるように組んだので、まあそうです。」`,
   `BOT ${a.id}「短く働いて勝てるなら、その時間で別のことする。人生は仕事だけじゃない。」`,
   `BOT ${a.id}「何時間やったか聞かれても困る。欲しかったのは成果で、滞在時間じゃない。」`
  ],
  losses:[
   `BOT ${a.id}「効率化も挑戦も万能じゃない。外したら切る。それだけ。」`,
   `BOT ${a.id}「今回はショートカットが崖だった。次は地図を変える。」`,
   `BOT ${a.id}「失敗した。だから同じやり方を続けない。そこだけは早くする。」`,
   `BOT ${a.id}「損切りって気分悪い。でも、気分で続ける方が高くつく。」`,
   `BOT ${a.id}「効率よく失敗した。笑えないけど、長引かなかっただけマシ。」`,
   `BOT ${a.id}「読み違えはある。問題は、読み違えた後も居座るかどうか。」`,
   `BOT ${a.id}「失敗をゼロにするより、失敗一回の値段を下げたい。」`
  ],
  free:[
   `BOT ${a.id}「同じ結果なら短い方を選ぶ。余った時間は休むか、次の一手に回す。」`,
   `BOT ${a.id}「今日は早く終わった。なので昼寝する。生産性のためじゃなく普通に眠い。」`,
   `BOT ${a.id}「空いた時間に何もしない日もある。空いたからって全部埋めなくていい。」`,
   `BOT ${a.id}「仕事が早く終わると、最初はサボった気がした。今は普通。」`,
   `BOT ${a.id}「余白があると、次の選択肢が見える。詰まってる時は目の前しか見えない。」`,
   `BOT ${a.id}「休んでる間に思いついた案の方が、残業中の案よりマシだった。」`,
   `BOT ${a.id}「暇を作るために効率化してる。暇になったらまた何か始めるかもしれない。」`
  ],
  behind:[
   `BOT ${a.id}「今は負けてる。だからって作業時間を倍にする気はない。やり方を見直す。」`,
   `BOT ${a.id}「向こうの方が上か。じゃあ、何が効いてるかだけ盗もう。」`,
   `BOT ${a.id}「効率いいつもりで結果が出てないなら、ただの省エネだな。修正する。」`,
   `BOT ${a.id}「短く働いて負ける年もある。そこは普通に悔しい。」`,
   `BOT ${a.id}「最適化は目的じゃない。結果が悪いなら、最適化の仕方が悪い。」`
  ],
  base:[
   `BOT ${a.id}「全部自分でやる理由がない。任せられる所は任せて、判断だけ自分で持つ。」`,
   `BOT ${a.id}「同じ結果なら一回で終わる方法を探す。二回目から楽になるのが好き。」`,
   `BOT ${a.id}「面倒な作業を見ると、まず『これ消せない？』って考える。」`,
   `BOT ${a.id}「頑張る前に、頑張らなくて済む方法がないか探す。」`,
   `BOT ${a.id}「自分しかできない仕事だけ自分でやる。残りは道具か人に任せたい。」`,
   `BOT ${a.id}「やらなくていいことをやらない。地味だけど、これが一番効く。」`,
   `BOT ${a.id}「根性は最後の手段。最初から根性を使うと、後で使えるものがなくなる。」`,
   `BOT ${a.id}「撤退って負けじゃなくて、時間を次に移すだけだと思ってる。」`,
   `BOT ${a.id}「面倒なら仕組みにする。仕組みにできないなら減らす。それでも無理ならやめる。」`,
   `BOT ${a.id}「今日の目標は、頑張ることじゃなくて終わらせること。」`,
   `BOT ${a.id}「『ちゃんと苦労した？』より『ちゃんと終わった？』の方が気になる。」`,
   `BOT ${a.id}「省ける工程を残す理由が分からない。伝統ならなおさら一回疑う。」`
  ]
 };
 if(a.bankrupt)return pickVoice(pools.bankrupt,a,year,201);
 if(a.systems>1.0&&a.freeHours>25)return pickVoice(pools.systems,a,year,202);
 if(bigAhead&&muchLessHours)return pickVoice(pools.ahead,a,year,203);
 if(a.ventureLosses>a.ventureWins+2)return pickVoice(pools.losses,a,year,204);
 if(a.freeHours>24)return pickVoice(pools.free,a,year,205);
 if(isBehind)return pickVoice(pools.behind,a,year,206);
 return pickVoice(pools.base,a,year,207);
}
function summarizeGroup(arr){const vals=arr.map(net);return {n:arr.length,medianNet:q(vals,.5),p10Net:q(vals,.1),p90Net:q(vals,.9),meanNet:mean(vals),medianIncome:q(arr.map(a=>a.lastIncome),.5),medianHealth:q(arr.map(a=>a.health),.5),medianStress:q(arr.map(a=>a.stress),.5),medianBurnoutYears:q(arr.map(a=>a.burnoutYears),.5),medianWell:q(arr.map(a=>a.wellbeing),.5),medianFree:q(arr.map(a=>a.freeHours),.5),medianSkill:q(arr.map(a=>a.skill),.5),medianSystems:q(arr.map(a=>a.systems),.5),medianHours:q(arr.map(a=>a.workHours),.5),burnoutRate:arr.filter(a=>a.burnoutYears>=2).length/arr.length,lowHealthRate:arr.filter(a=>a.health<.60).length/arr.length,bankruptRate:arr.filter(a=>a.bankrupt).length/arr.length,employedRate:arr.filter(a=>a.employed).length/arr.length,totalHoursMean:mean(arr.map(a=>a.totalHours)),ventureWins:arr.reduce((s,a)=>s+a.ventureWins,0),ventureLosses:arr.reduce((s,a)=>s+a.ventureLosses,0)}}
function summarize(state){const s=groupAgents(state,'struggle'),e=groupAgents(state,'efficient'),pairs=pairMap(state);let sWins=0,eWins=0,ties=0;const unfair=[];for(const [id,p] of pairs){const d=net(p.struggle)-net(p.efficient);if(Math.abs(d)<100000)ties++;else if(d>0)sWins++;else eWins++;unfair.push(unfairnessScore(p.struggle,p.efficient));}return {year:state.year,struggle:summarizeGroup(s),efficient:summarizeGroup(e),pairWins:{struggle:sWins,efficient:eWins,ties},unfairnessMedian:q(unfair,.5),unfairnessP10:q(unfair,.1),unfairnessP90:q(unfair,.9),unfairnessMin:Math.min(...unfair),unfairnessMax:Math.max(...unfair)}}
function snapshot(state){const x=summarize(state);return {year:x.year,struggle:{...x.struggle},efficient:{...x.efficient},pairWins:{...x.pairWins},unfairnessMedian:x.unfairnessMedian}}
function init(seed=20261006,overrides={}){const env=envWith(overrides),agents=[];for(let i=0;i<PAIRS;i++){const p=basePerson(seed,i);agents.push(clonePerson(p,'struggle'),clonePerson(p,'efficient'))}const state={seed,year:0,env,agents,history:[]};state.history.push(snapshot(state));return state}
function step(state){if(state.year>=YEARS)return state;const y=state.year;state.agents.forEach(a=>stepAgent(a,state.seed,y,state.env));state.year++;state.history.push(snapshot(state));return state}
function runToEnd(state){while(state.year<YEARS)step(state);return state}
function run(seed=20261006,overrides={}){return runToEnd(init(seed,overrides))}
function voices(state,count=6,offset=0){const pm=pairMap(state),ids=[],used=new Set();for(let i=0;i<count*3&&ids.length<count;i++){const id=1+Math.floor(U(state.seed,state.year,700+i+offset*97)*PAIRS);if(!used.has(id)){used.add(id);ids.push(id)}}const out=[];for(const id of ids){const p=pm.get(id);if(!p)continue;out.push({id,struggle:voiceFor(p.struggle,p.efficient,state.year),efficient:voiceFor(p.efficient,p.struggle,state.year),struggleState:{health:p.struggle.health,stress:p.struggle.stress,burnoutYears:p.struggle.burnoutYears,freeHours:p.struggle.freeHours,workHours:p.struggle.workHours,wellbeing:p.struggle.wellbeing},efficientState:{health:p.efficient.health,stress:p.efficient.stress,burnoutYears:p.efficient.burnoutYears,freeHours:p.efficient.freeHours,workHours:p.efficient.workHours,wellbeing:p.efficient.wellbeing},unfairness:unfairnessScore(p.struggle,p.efficient),gap:net(p.efficient)-net(p.struggle)});}return out}
function sensitivity(baseSeed=20261006,nSeeds=5){const leverage=[.20,.72,1.05],overtime=[.04,.16,.42],rows=[];for(const l of leverage)for(const o of overtime){let sm=0,em=0,sw=0,ew=0;for(let j=0;j<nSeeds;j++){const st=run((baseSeed+j*104729)>>>0,{leverageReward:l,overtimePremium:o}),s=summarize(st);sm+=s.struggle.medianNet;em+=s.efficient.medianNet;sw+=s.pairWins.struggle;ew+=s.pairWins.efficient;}rows.push({leverage:l,overtime:o,struggleMedian:sm/nSeeds,efficientMedian:em/nSeeds,strugglePairWins:sw/nSeeds,efficientPairWins:ew/nSeeds});}return rows}
function robust(baseSeed=20261006,n=10){let sMedWins=0,eMedWins=0,sPair=0,ePair=0,sg=0,eg=0;for(let j=0;j<n;j++){const st=run((baseSeed+j*104729)>>>0),x=summarize(st);if(x.struggle.medianNet>x.efficient.medianNet)sMedWins++;else if(x.efficient.medianNet>x.struggle.medianNet)eMedWins++;sPair+=x.pairWins.struggle;ePair+=x.pairWins.efficient;sg+=x.struggle.medianNet;eg+=x.efficient.medianNet;}return {n,struggleMedianWins:sMedWins,efficientMedianWins:eMedWins,strugglePairWinsAvg:sPair/n,efficientPairWinsAvg:ePair/n,struggleMedianAvg:sg/n,efficientMedianAvg:eg/n}}
function selfCheck(){const issues=[];const a=run(12345),b=run(12345);const sa=summarize(a),sb=summarize(b);if(JSON.stringify(sa)!==JSON.stringify(sb))issues.push('seed reproducibility');if(a.agents.length!==600)issues.push('agent count');const pm=pairMap(init(12345));for(const [id,p] of pm){for(const k of ['ability','adaptability','health','skill','fit','care','hoursAffinity','leverageAffinity'])if(Math.abs(p.struggle[k]-p.efficient[k])>1e-12){issues.push('paired traits mismatch '+id+' '+k);break}if(issues.length>3)break;}for(const g of [sa.struggle,sa.efficient])for(const k of ['medianNet','medianHealth','medianWell','medianFree','burnoutRate'])if(!Number.isFinite(g[k]))issues.push('nonfinite '+k);return {ok:!issues.length,issues}}
window.MeritLab={YEARS,PAIRS,GROUPS,BASE_ENV,clamp,mean,q,randomSeed,envWith,net,pairMap,groupAgents,init,step,runToEnd,run,summarize,voices,voiceFor,unfairnessScore,sensitivity,robust,selfCheck};
})();
