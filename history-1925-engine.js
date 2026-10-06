(function(){
'use strict';

const START_YEAR = 1925;
const END_YEAR = 1955;

const SOURCES = {
  suffrage: {label:'国立国会図書館「男子普通選挙法の成立と治安維持法」',url:'https://www.ndl.go.jp/modern/cha3/description13.html'},
  chronology: {label:'国立国会図書館「史料にみる日本の近代 年表」',url:'https://www.ndl.go.jp/modern/utility/chronology.html'},
  manchuria: {label:'アジア歴史資料センター「満洲事変」',url:'https://www.jacar.archives.go.jp/das/meta/CA0206020000'},
  mobilization: {label:'国立公文書館「国家総動員法が制定される」',url:'https://www.archives.go.jp/ayumi/kobetsu/s13_1938_03.html'},
  evacuation: {label:'国立公文書館「学童疎開促進要綱が決定される」',url:'https://www.archives.go.jp/ayumi/kobetsu/s19_1944_01.html'},
  surrender: {label:'国立国会図書館「終戦の詔書」',url:'https://www.ndl.go.jp/constitution/shiryo/01/017shoshi.html'},
  constitution: {label:'国立国会図書館「日本国憲法の誕生 年表」',url:'https://www.ndl.go.jp/constitution/etc/history.html'},
  education: {label:'国立公文書館「戦後の教育改革 教育基本法」',url:'https://www.archives.go.jp/learning/archive_collection_5/collection_1/'},
  recovery: {label:'内閣府「戦後を越えて」',url:'https://www5.cao.go.jp/j-j/wp/wp-je00/wp-je00-0020j.html'},
  peace: {label:'外務省外交史料館「サンフランシスコ講和への道」',url:'https://www.mofa.go.jp/mofaj/annai/honsho/shiryo/san_francisco.html'}
};

const EVENTS = {
  1925:{
    title:'普通選挙法と治安維持法',kind:'政治・社会',
    fact:'1925年、衆議院議員選挙法が改正され、納税額による選挙権の制限が撤廃されました。ただし選挙権は男性に限られました。同じ年に治安維持法も成立しました。',
    source:'suffrage',
    context:{
      boy:'あなたは10歳。大人たちが「選挙が変わるらしい」と話しています。けれど、あなたが投票できる年齢になる頃、社会がどうなっているかはまだ分かりません。',
      girl:'あなたは10歳。大人たちが「普通選挙」と話しています。でも、この制度で投票できるのは男性だけ。あなた自身にはまだ選挙権がありません。'
    },
    choices:[
      {id:'listen',label:'📰 大人の話をよく聞く',desc:'新聞や家族の話から社会の変化を追う。',effects:{knowledge:5,hope:1}},
      {id:'play',label:'🪁 まずは毎日の暮らしを大事にする',desc:'家の手伝いや遊びを優先する。',effects:{health:2,family:2}}
    ],
    quiz:{q:'1925年の「普通選挙」で、納税要件はどうなった？',options:['撤廃された','もっと厳しくなった','女性だけに残った'],answer:0,explain:'納税要件は撤廃されました。ただし、この時点の選挙権は男性に限られています。'}
  },
  1928:{
    title:'初の男子普通選挙',kind:'政治',
    fact:'1928年2月、第16回衆議院議員総選挙が、男子普通選挙の制度のもとで初めて行われました。',
    source:'chronology',
    context:{
      boy:'町では選挙の話が目立ちます。あなたは13歳。まだ投票はできませんが、「大人が政治に参加する」とは何かを目にします。',
      girl:'町では選挙の話が目立ちます。あなたは13歳。女性にはまだ国政選挙の投票権がありません。'
    },
    choices:[
      {id:'poster',label:'🗳️ 選挙ポスターや新聞を見る',desc:'社会の仕組みに興味を持つ。',effects:{knowledge:5}},
      {id:'school',label:'📚 学校の勉強を優先する',desc:'読み書きや計算を伸ばす。',effects:{education:4,skill:2}}
    ],
    quiz:{q:'初の男子普通選挙は何年？',options:['1925年','1928年','1945年'],answer:1,explain:'法律改正は1925年、改正後初の総選挙は1928年でした。'}
  },
  1930:{
    title:'不況の影が濃くなる',kind:'経済',
    fact:'1930年前後、日本でも不況が深まり、農村では農産物価格の下落などによる厳しい状況が問題になりました。',
    source:'chronology',passive:{money:-5,hope:-3},
    locationEffects:{rural:{money:-5,family:-2},city:{money:-2,jobChance:-2},factory:{money:-3,jobChance:-3}},
    choices:[
      {id:'learn',label:'📖 できる範囲で学びを続ける',desc:'家計が厳しくても、学習時間を守ろうとする。',effects:{education:5,money:-2,hope:1}},
      {id:'work',label:'🧺 家計を手伝う',desc:'働き手として家族を支える。',effects:{money:4,education:-2,family:4}}
    ],
    quiz:{q:'この時期、農村の苦境と関係が深いものは？',options:['農産物価格の下落','インターネット不況','石油危機'],answer:0,explain:'1930年前後は農産物価格の下落などが農村経済を圧迫しました。'}
  },
  1931:{
    title:'満洲事変',kind:'戦争・外交',
    fact:'1931年9月18日の柳条湖事件をきっかけに、満洲事変が始まりました。日本社会はその後、戦時色を強めていきます。',
    source:'manchuria',passive:{freedom:-2,hope:-1},
    choices:[
      {id:'follow',label:'📻 報道を追う',desc:'何が起きているか知ろうとする。',effects:{knowledge:4,stress:1}},
      {id:'daily',label:'🏠 家族の暮らしを優先する',desc:'日常を守ることに集中する。',effects:{family:3,stress:-1}}
    ],
    quiz:{q:'満洲事変のきっかけとなった事件は？',options:['柳条湖事件','二・二六事件','五・一五事件'],answer:0,explain:'1931年9月18日の柳条湖事件がきっかけとなりました。'}
  },
  1932:{
    title:'五・一五事件',kind:'政治',
    fact:'1932年、五・一五事件が起き、首相の犬養毅が殺害されました。政党政治の時代は大きく揺らぎます。',
    source:'chronology',passive:{freedom:-2,hope:-2,stress:2},
    choices:[
      {id:'talk',label:'🗣️ 家族と「政治が不安定になる」と話す',desc:'出来事を自分の生活と結びつけて考える。',effects:{knowledge:3}},
      {id:'avoid',label:'🧹 目の前の生活に集中する',desc:'不安から距離を取る。',effects:{stress:-2,family:2}}
    ],
    quiz:{q:'五・一五事件は何年？',options:['1928年','1932年','1938年'],answer:1,explain:'五・一五事件は1932年です。'}
  },
  1936:{
    title:'二・二六事件',kind:'政治',
    fact:'1936年、陸軍の青年将校らによる二・二六事件が起きました。',
    source:'chronology',passive:{freedom:-2,stress:2},
    choices:[
      {id:'record',label:'✍️ 日記に出来事を書く',desc:'自分の見た時代を記録する。',effects:{knowledge:4,hope:1}},
      {id:'care',label:'👪 家族や近所のことを優先する',desc:'不安定な時代に身近な関係を守る。',effects:{family:4}}
    ],
    quiz:{q:'二・二六事件が起きたのは？',options:['1931年','1936年','1941年'],answer:1,explain:'1936年2月26日に始まった事件です。'}
  },
  1937:{
    title:'日中戦争が拡大',kind:'戦争・社会',
    fact:'1937年の盧溝橋事件を契機に、日中間の戦争は全面化していきました。',
    source:'chronology',passive:{freedom:-3,stress:3,money:-2},
    choices:[
      {id:'skill',label:'🔧 手に職をつける',desc:'先が読めないので、使える技能を増やす。',effects:{skill:5,education:2}},
      {id:'family',label:'🏠 家計を優先する',desc:'家族の生活を守る。',effects:{money:3,family:3}}
    ],
    quiz:{q:'1937年、日中戦争の全面化の契機となったのは？',options:['盧溝橋事件','柳条湖事件','東京大空襲'],answer:0,explain:'1937年の盧溝橋事件を契機に戦闘が拡大しました。'}
  },
  1938:{
    title:'国家総動員法',kind:'制度・戦時統制',
    fact:'1938年、国家総動員法が公布・施行され、戦時に人的・物的資源を政府が広く統制できる制度が整えられました。',
    source:'mobilization',passive:{freedom:-6,money:-2,stress:2},
    choices:[
      {id:'adapt',label:'⚙️ 変わる仕事や暮らしに適応する',desc:'制度の変化に合わせて技能を使う。',effects:{skill:3,money:2}},
      {id:'protect',label:'🥫 家庭の備えを優先する',desc:'物資不足に備え、家計の守りを固める。',effects:{family:3,food:3,money:-1}}
    ],
    quiz:{q:'国家総動員法が広く統制対象にしたのは？',options:['人的・物的資源','学校の運動会だけ','海外旅行だけ'],answer:0,explain:'戦時に人的・物的資源を広く統制運用するための法律でした。'}
  },
  1940:{
    title:'暮らしの統制が強まる',kind:'生活',
    fact:'戦争の長期化に伴い、物資の統制や配給が広がり、日常生活でも「自由に買えるもの」が減っていきました。',
    source:'mobilization',passive:{food:-5,freedom:-5,money:-2,stress:3},
    choices:[
      {id:'share',label:'🤝 家族や近所で融通し合う',desc:'持っているものを助け合う。',effects:{family:5,food:2}},
      {id:'save',label:'📦 とにかく節約する',desc:'消費を抑えて備える。',effects:{money:3,hope:-1}}
    ],
    quiz:{q:'戦時統制が強まると、日常生活では何が起きやすい？',options:['物資の配給や購入制限','海外旅行が無料になる','食べ物が無限になる'],answer:0,explain:'物資の統制や配給によって、自由に買える範囲が狭まりました。'}
  },
  1941:{
    title:'太平洋戦争が始まる',kind:'戦争',
    fact:'1941年12月、日本と米英などとの戦争が始まりました。戦争は国民生活にさらに大きな影響を与えます。',
    source:'chronology',passive:{safety:-8,food:-4,freedom:-5,stress:5},
    choices:[
      {id:'family',label:'👪 家族の連絡手段や助け合いを確認する',desc:'もしもの時に備える。',effects:{family:5,safety:2}},
      {id:'work',label:'🛠️ 仕事・技能を優先する',desc:'変化の中でも働ける力を確保する。',effects:{skill:4,money:2,stress:1}}
    ],
    quiz:{q:'太平洋戦争が始まった年は？',options:['1937年','1941年','1945年'],answer:1,explain:'1941年12月、日本と米英などとの戦争が始まりました。'}
  },
  1944:{
    title:'学童疎開の促進',kind:'戦争・子ども',
    fact:'1944年、学童疎開促進要綱が決定され、都市部の国民学校児童について疎開が進められました。あなた自身は29歳ですが、身近な子どもたちの生活が大きく変わります。',
    source:'evacuation',passive:{safety:-7,food:-6,stress:6},
    locationEffects:{city:{safety:-6},factory:{safety:-5},rural:{food:-2}},
    choices:[
      {id:'help',label:'🧒 子どもや近所の家族を手伝う',desc:'疎開や生活準備を助ける。',effects:{family:5,hope:2,money:-2}},
      {id:'secure',label:'🧯 自分の家の安全を優先する',desc:'防災や避難の準備をする。',effects:{safety:5,money:-2}}
    ],
    quiz:{q:'1944年に促進された子ども向けの政策は？',options:['学童疎開','大学無償化','海外留学'],answer:0,explain:'都市部などの児童を空襲から遠ざけるため、学童疎開が進められました。'}
  },
  1945:{
    title:'終戦',kind:'戦争・転換点',
    fact:'1945年8月15日、ポツダム宣言受諾を伝える放送が行われ、戦争の終結が国民に広く知らされました。戦後は食糧・住居・仕事など厳しい生活課題が続きます。',
    source:'surrender',passive:{safety:5,freedom:5,food:-6,money:-8,stress:4,hope:3},
    choices:[
      {id:'rebuild',label:'🧱 生活を立て直すことを最優先',desc:'住まい・仕事・食料を確保する。',effects:{money:5,family:4,health:1}},
      {id:'learn',label:'📚 新しい制度や社会を学ぶ',desc:'大きく変わる社会を理解しようとする。',effects:{knowledge:6,education:3,hope:2}}
    ],
    quiz:{q:'終戦を国民に広く知らせた放送はいつ？',options:['1941年12月8日','1945年8月15日','1947年5月3日'],answer:1,explain:'1945年8月15日のラジオ放送で、戦争終結が広く国民に知らされました。'}
  },
  1946:{
    title:'新しい憲法づくり',kind:'政治・制度',
    fact:'1946年11月3日、日本国憲法が公布されました。',
    source:'constitution',passive:{freedom:6,hope:4},
    choices:[
      {id:'read',label:'📜 新しい憲法について読む',desc:'権利や国の仕組みの変化を学ぶ。',effects:{knowledge:6,hope:2}},
      {id:'work',label:'🧰 まずは暮らしの再建を優先',desc:'制度より目の前の生活を立て直す。',effects:{money:4,family:2}}
    ],
    quiz:{q:'日本国憲法が公布されたのは？',options:['1945年8月15日','1946年11月3日','1950年6月25日'],answer:1,explain:'日本国憲法は1946年11月3日に公布されました。'}
  },
  1947:{
    title:'日本国憲法の施行と教育改革',kind:'制度・教育',
    fact:'1947年5月3日に日本国憲法が施行されました。戦後の教育制度も大きく組み替えられていきます。',
    source:'constitution',passive:{freedom:5,education:3,hope:3},
    choices:[
      {id:'study',label:'📚 学び直し・新しい知識へ',desc:'戦後の変化を機会として学ぶ。',effects:{education:5,skill:3}},
      {id:'business',label:'🏪 仕事や商売の再建へ',desc:'家計を安定させる。',effects:{money:5,skill:2}}
    ],
    quiz:{q:'日本国憲法が施行されたのは？',options:['1946年11月3日','1947年5月3日','1955年1月1日'],answer:1,explain:'公布は1946年11月3日、施行は1947年5月3日です。'}
  },
  1949:{
    title:'経済安定化の痛み',kind:'経済',
    fact:'1949年前後、戦後インフレを抑え経済を安定させるため、緊縮的な政策が進められました。企業や雇用には厳しい面もありました。',
    source:'recovery',passive:{money:-3,jobChance:-2,hope:-1},
    choices:[
      {id:'skill',label:'🧑‍🏭 仕事の技能を上げる',desc:'景気が厳しくても働けるようにする。',effects:{skill:5,money:-1}},
      {id:'save',label:'💴 現金を守る',desc:'家計の余力を優先する。',effects:{money:4,education:-1}}
    ],
    quiz:{q:'1949年前後の安定化政策の狙いの一つは？',options:['戦後インフレの抑制','戦争の開始','普通選挙の開始'],answer:0,explain:'戦後インフレの抑制と経済安定化が重要な課題でした。'}
  },
  1950:{
    title:'朝鮮戦争と特需',kind:'国際・経済',
    fact:'1950年に朝鮮戦争が始まると、米軍・国連軍関係の需要、いわゆる「特需」が日本経済の回復を強く後押ししました。',
    source:'recovery',passive:{jobChance:6,money:4,hope:3},
    choices:[
      {id:'work',label:'🏭 増える仕事の機会をつかむ',desc:'景気回復の波に乗って働く。',effects:{money:6,skill:3,stress:2}},
      {id:'steady',label:'🏠 急がず生活基盤を整える',desc:'好況でも無理をしすぎない。',effects:{health:3,family:3,money:2}}
    ],
    quiz:{q:'1950年以降、日本経済の回復を後押ししたものは？',options:['朝鮮特需','金本位制の開始','学童疎開'],answer:0,explain:'朝鮮戦争に伴う特需や輸出の増加が日本経済を押し上げました。'}
  },
  1952:{
    title:'占領の終結',kind:'政治・国際',
    fact:'1952年、サンフランシスコ平和条約の発効により、日本は主権を回復し、占領期が終わりました。',
    source:'peace',passive:{freedom:3,hope:3},
    choices:[
      {id:'future',label:'🌱 これからの生活設計を考える',desc:'住まい・仕事・家族の将来を見直す。',effects:{hope:4,money:2}},
      {id:'study',label:'📰 世界の動きを学ぶ',desc:'国際社会に戻る日本を理解する。',effects:{knowledge:5}}
    ],
    quiz:{q:'日本の占領期が終わったのは？',options:['1945年','1947年','1952年'],answer:2,explain:'サンフランシスコ平和条約が1952年に発効し、占領期が終わりました。'}
  },
  1955:{
    title:'高度成長の入口へ',kind:'経済・生活',
    fact:'1955年頃から日本は高度経済成長期へ入っていきます。戦後の復興から、生活や産業が大きく拡大する時代へ移ります。',
    source:'recovery',passive:{jobChance:5,money:4,hope:5},
    choices:[
      {id:'investSelf',label:'🎓 学び・技能へ投資する',desc:'伸びる社会で自分の能力も伸ばす。',effects:{education:4,skill:5,money:-2}},
      {id:'family',label:'🏡 暮らしの安定を優先する',desc:'住まい・家族・生活を整える。',effects:{family:4,health:3,money:2}}
    ],
    quiz:{q:'1955年頃から日本経済はどんな時代へ？',options:['高度経済成長期','鎖国期','江戸時代'],answer:0,explain:'1955年頃から高度経済成長期へ入っていきます。'}
  }
};

const DEFAULTS = {knowledge:25,education:45,skill:25,health:78,family:65,money:55,food:80,safety:82,freedom:62,hope:68,stress:15,jobChance:55};
function clamp(x,a=0,b=100){return Math.max(a,Math.min(b,x))}
function hash(seed,a=0,b=0,c=0){let x=(seed>>>0)^Math.imul(a+1,0x9e3779b1)^Math.imul(b+7,0x85ebca6b)^Math.imul(c+13,0xc2b2ae35);x|=0;x=(x+0x9e3779b9)|0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return (x^(x>>>15))>>>0}
function U(seed,a=0,b=0,c=0){return (hash(seed,a,b,c)+.5)/4294967296}
function profileAdjust(p,st){
  if(p.location==='rural'){st.money-=5;st.food+=5;st.education-=4;st.family+=4;st.safety+=2}
  if(p.location==='city'){st.education+=4;st.money+=2;st.safety-=1;st.knowledge+=2}
  if(p.location==='factory'){st.skill+=4;st.money+=1;st.health-=2;st.jobChance+=3}
  if(p.household==='tight'){st.money-=12;st.education-=4;st.family+=1}
  if(p.household==='stable'){st.money+=6;st.education+=3}
  if(p.household==='comfortable'){st.money+=14;st.education+=7;st.knowledge+=2}
  if(p.gender==='girl'){st.freedom-=8}
}
function newState(seed=19251001,profile={gender:'girl',location:'city',household:'stable'}){
  const stats={...DEFAULTS};profileAdjust(profile,stats);Object.keys(stats).forEach(k=>stats[k]=clamp(stats[k]));
  const state={seed,profile:{...profile},year:START_YEAR,age:10,stats,history:[],pendingEvent:null,chosen:false,quizScore:0,quizTotal:0,finished:false};
  arrive(state);return state;
}
function apply(st,effects={}){for(const [k,v] of Object.entries(effects))if(k in st.stats)st.stats[k]=clamp(st.stats[k]+v)}
function yearlyDrift(st){
  const y=st.year,r=U(st.seed,y,st.age,1);
  if(r<.18)st.stats.health=clamp(st.stats.health-2);else if(r>.82)st.stats.health=clamp(st.stats.health+1);
  st.stats.stress=clamp(st.stats.stress+(st.stats.food<45?2:0)+(st.stats.safety<45?2:0)-(st.stats.family>70?1:0));
  if(st.stats.jobChance>60&&st.age>=15)st.stats.money=clamp(st.stats.money+1);
  st.stats.hope=clamp(st.stats.hope+(st.stats.safety>70?1:0)-(st.stats.stress>60?2:0));
}
function arrive(st){
  st.pendingEvent=EVENTS[st.year]||null;st.chosen=!st.pendingEvent;
  if(st.pendingEvent){apply(st,st.pendingEvent.passive||{});const le=(st.pendingEvent.locationEffects||{})[st.profile.location];if(le)apply(st,le)}
  st.history.push({year:st.year,age:st.age,title:st.pendingEvent?st.pendingEvent.title:'日常の1年',choice:null});
}
function choose(st,choiceId){
  if(!st.pendingEvent||st.chosen)return false;const c=st.pendingEvent.choices.find(x=>x.id===choiceId);if(!c)return false;
  apply(st,c.effects);st.chosen=true;st.history[st.history.length-1].choice=c.label;return true;
}
function answerQuiz(st,index){if(!st.pendingEvent||!st.pendingEvent.quiz)return null;st.quizTotal++;const ok=Number(index)===st.pendingEvent.quiz.answer;if(ok)st.quizScore++;return{ok,explain:st.pendingEvent.quiz.explain}}
function nextYear(st){
  if(st.finished)return st;if(st.pendingEvent&&!st.chosen)return st;if(st.year>=END_YEAR){st.finished=true;return st}
  yearlyDrift(st);st.year++;st.age++;arrive(st);return st;
}
function skipToNextEvent(st){if(st.pendingEvent&&!st.chosen)return st;do{nextYear(st)}while(!st.finished&&!st.pendingEvent&&st.year<END_YEAR);return st}
function contextText(st){
  const ev=st.pendingEvent;if(!ev)return'この年は大きな史実カードはありません。日常の積み重ねも歴史の一部です。';
  if(ev.context)return ev.context[st.profile.gender]||ev.context.boy||'';
  const loc={city:'都市',rural:'農村',factory:'工業都市'}[st.profile.location];return`${st.age}歳。${loc}で暮らすあなたの生活にも、社会の変化が少しずつ入り込んできます。`;
}
function ending(st){
  const s=st.stats;let headline='激動の30年を生き抜いた';
  if(s.health>=70&&s.hope>=65&&s.skill>=55)headline='傷も残った。でも、次の時代へ進む力が残った';
  if(s.money<30||s.health<45)headline='時代の大波は、個人の努力だけでは避けきれなかった';
  const strengths=[];if(s.knowledge>=60)strengths.push('時代を読む力');if(s.education>=60)strengths.push('学び');if(s.skill>=60)strengths.push('技能');if(s.family>=70)strengths.push('人とのつながり');if(s.health>=70)strengths.push('健康');if(s.money>=65)strengths.push('生活の余力');
  return{headline,strengths:strengths.length?strengths:['生き延びた経験'],message:'同じ歴史でも、住む場所・家計・性別・選んだ行動で「個人の人生」は変わります。一方で、戦争・制度・不況のような大きな出来事は、個人の選択だけでは動かせません。'};
}
function selfCheck(){
  const issues=[],s=newState(123,{gender:'girl',location:'city',household:'stable'});let guard=0;
  while(s.year<END_YEAR&&guard++<100){if(s.pendingEvent&&!s.chosen)choose(s,s.pendingEvent.choices[0].id);nextYear(s)}
  if(s.year!==END_YEAR)issues.push('end year');for(const[k,v]of Object.entries(s.stats))if(!Number.isFinite(v)||v<0||v>100)issues.push('bad stat '+k);
  const a=newState(123,{gender:'girl',location:'city',household:'stable'}),b=newState(123,{gender:'girl',location:'city',household:'stable'});if(JSON.stringify(a.stats)!==JSON.stringify(b.stats))issues.push('seed reproducibility');
  return{ok:!issues.length,issues};
}
window.History1925Lab={START_YEAR,END_YEAR,SOURCES,EVENTS,newState,choose,answerQuiz,nextYear,skipToNextEvent,contextText,ending,selfCheck,clamp};
})();