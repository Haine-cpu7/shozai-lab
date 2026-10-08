/* No.22 v2.02: interactive results for the time / labor / investment frontier. */
(()=>{'use strict';const F=window.RetirementFreedom,L=window.PensionLab;if(!F||!L)return;
const $=q=>document.querySelector(q),Y=n=>n.toLocaleString('ja-JP'),yen=n=>'¥'+Math.round(n).toLocaleString('ja-JP');
function getC(){const r={},scale={age:1,workYears:1,monthlyGross:1,monthlyHouseholdInvest:1,initialInvest:1,saveRate:100,otherDeduction:100,marketMu:100,marketSigma:100,retireBudget:1,endAge:1,seed:1};Object.entries(scale).forEach(([k,f])=>{const el=$('#'+k);if(el)r[k]=+el.value/f});return L.normalized(r)}
function range(x){if(!x?.reachable)return '<span class="weak">この条件では到達せず</span>';return x.years===0?'<b>0年（追加労働不要）</b>':`<b>${x.years}年</b>（週20時間・約${Y(x.hours)}時間）`}
function moneyRange(x,kind){if(!x?.reachable)return `<span class="weak">探索上限内では未達</span>`;if(x.extra===0)return '<b>追加資金0円</b>';return `<b>${yen(x.extra)}${kind==='monthly'?'/月':''}</b>`}
function percent(rate){return (rate*100).toFixed(1)+'%'}
const scenarios=[
  {label:'現行設定',mod:c=>({...c})},
  {label:'初期資産＋500万円',mod:c=>({...c,initialInvest:c.initialInvest+5000000})},
  {label:'初期資産＋2,000万円',mod:c=>({...c,initialInvest:c.initialInvest+20000000})},
  {label:'生活費 月10万円',mod:c=>({...c,retireBudget:100000})},
  {label:'生活費 月18万円',mod:c=>({...c,retireBudget:180000})},
  {label:'市場平均 年1%',mod:c=>({...c,marketMu:.01})},
  {label:'105歳まで',mod:c=>({...c,endAge:105})},
  {label:'給与の追加投資0%',mod:c=>({...c,saveRate:0})}
];
function render(){const c=getC(),target=Number($('#freedomGoal').value)/100,hrPrice=Number($('#hourPrice').value);
 const status=$('#freedomState');status.textContent='同じ世界線で比較計算中…';status.className='small';
 // Yield to allow status painting before multiple targeted searches.
 setTimeout(()=>{try{
  const f=F.analyze(c,target),o=f.observed,hasBase=f.base.rate>=target;
  $('#freedomHeadline').innerHTML=hasBase?`この条件では、目標の${Math.round(target*100)}%を<b>追加労働0年</b>で満たしました。`:
   `投資だけの到達率は<b>${percent(f.base.rate)}</b>。目標<b>${Math.round(target*100)}%</b>には届きません。`;
  $('#freedomMetrics').innerHTML=`
   <div class="soft"><div class="eyebrow">働かず現状の資産・積立で</div><div class="value">${percent(f.base.rate)}</div><div class="small">${f.base.solvent}/${f.base.n}世界線・目標${Math.round(target*100)}%</div></div>
   <div class="soft"><div class="eyebrow">年金上乗せだけで目標まで</div><div>${range(f.pensionYears)}</div><div class="small">共通資産は維持・給与の投資ゼロ</div></div>
   <div class="soft"><div class="eyebrow">働いて給与も投資するなら</div><div>${range(f.bothYears)}</div><div class="small">手取り給与の${Math.round(c.saveRate*100)}%を積立</div></div>
   <div class="soft"><div class="eyebrow">働かず投資で備えるには</div><div>今の追加元本：${moneyRange(f.initialGap,'initial')}</div><div>家計の追加積立：${moneyRange(f.monthlyGap,'monthly')}</div><div class="small">「今の元本」か「毎月積立」の別々の条件。いずれも資金源は別に必要</div></div>`;
  const weekly=f.hoursPerWeek,totalVal=o.hours*hrPrice,reduction=o.penVsBase.medianReduction;
  const partA=`現在の${c.workYears}年就労の仮定では、<b>${Y(o.hours)}時間</b>を仕事に使います（週${weekly}時間×52週）。自由時間に${yen(hrPrice)}/時間の価値を置くと、合計<b>${yen(totalVal)}</b>。これは実際の支出ではなく、時間をどう重く考えるかという<b>主観的な比較尺度</b>です。通勤・疲労・家事負担は含みません。`;
  const partB=`同じ投資元本・家計積立のまま、給与は投資せず厚生年金だけ増やすと、老後の不足なしは <b>${percent(f.base.rate)} → ${percent(o.pension.rate)}</b>。世界線を1対1対応させた不足総額の<b>差の中央値は${yen(reduction)}</b>（基準−就労）。さらに働いた手取り総額${yen(o.netPay)}は現役の暮らしに回す前提ですが、使途や幸福度は測定していません。`;
  const partC=`同じ就労で手取り給与の${Math.round(c.saveRate*100)}%を追加投資すると不足なしは<b>${percent(o.both.rate)}</b>。年金上乗せの効果と、働いて新しい投資資金を得た効果は別です。働かずに必要な${f.initialGap.reachable?'追加資金'+yen(f.initialGap.extra):'追加資金（上限超過）'}をすでに確保しているなら、この条件で目標達成のために追加労働が必須とは言えません。`;
  const partD=`<b>ここで判定できる「必要」は、老後の生活費を${c.endAge}歳までまかなえる世界線を${Math.round(target*100)}%以上にする、という一つの定義</b>に限られます。日本の実際の就業義務、年金制度の適用可否、現役期の生活維持、投資資金の調達方法、仕事の生きがいまで判定していません。`;
  $('#freedomLearn').innerHTML=[['自由時間を何と交換する？',partA],['「年金のためだけに働く」効果',partB],['働かないために必要な元手',partC],['結論を言い過ぎないために',partD]].map(([h,body])=>`<div class="answer"><strong>${h}</strong><p>${body}</p></div>`).join('');
  const cases=scenarios.map(s=>{const z=F.analyze(s.mod(c),target,true);return {name:s.label,...z}});
  $('#freedomCases').innerHTML=`<table class="table"><thead><tr><th>変えた条件</th><th>働かず不足なし</th><th>年金だけ上乗せの最短就労</th><th>給与も投資する最短就労</th><th>働かず必要な追加元本</th></tr></thead><tbody>${cases.map(z=>`<tr><td>${z.name}</td><td>${percent(z.base.rate)}</td><td>${z.pensionYears.reachable?z.pensionYears.years+'年':'未達'}</td><td>${z.bothYears.reachable?z.bothYears.years+'年':'未達'}</td><td>${z.initialGap.reachable?yen(z.initialGap.extra):'探索上限超え'}</td></tr>`).join('')}</tbody></table>`;
  $('#freedomTest').textContent=F.selfCheck().ok?'境界探索チェック OK':'境界探索チェック要確認';$('#freedomTest').className='small '+(F.selfCheck().ok?'testgood':'testbad');
  status.textContent=`計算完了 · 固定Seed ${c.seed}・${c.worlds}世界線 · 目標${Math.round(target*100)}%`; $('#freedomResult').classList.remove('hidden');
 }catch(e){console.error(e);status.textContent='検証エラー：'+e.message}},25);
}
$('#freedomRun').addEventListener('click',render);
// Existing shared inputs are controlled by the top 'retest' button; avoid showing stale conclusions.
Array.from(document.querySelectorAll('#fields input,#fields select')).forEach(el=>el.addEventListener('change',()=>{$('#freedomState').textContent='上の設定が変更されました。自由時間の検証も再実行してください。'}));
$('#freedomGoal').addEventListener('change',()=>{$('#freedomState').textContent='目標変更あり・再検証してください'});
$('#hourPrice').addEventListener('change',()=>{$('#freedomState').textContent='時間の評価額変更あり・再検証してください'});
render();
})();
