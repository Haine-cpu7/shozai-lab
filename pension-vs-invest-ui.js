(()=>{'use strict';
const L=window.PensionLab,$=q=>document.querySelector(q);if(!L)return;
const $all=q=>Array.from(document.querySelectorAll(q));
const money=n=>'¥'+Math.round(n).toLocaleString('ja-JP');
const pct=(a,n)=>n?((a/n)*100).toFixed(1)+'%':'—';
const fields=['age','workYears','monthlyGross','monthlyHouseholdInvest','initialInvest','saveRate','otherDeduction','marketMu','marketSigma','retireBudget','endAge','seed'];
const nfr={age:1,workYears:1,monthlyGross:1,monthlyHouseholdInvest:1,initialInvest:1,saveRate:100,otherDeduction:100,marketMu:100,marketSigma:100,retireBudget:1,endAge:1,seed:1};
function settings(){let c={};for(const k of fields){const el=$('#'+k);if(el)c[k]=Number(el.value)/nfr[k]}return L.normalized(c)}
function bar(n,d){return `<div class="bar" role="img" aria-label="資金不足なし率 ${pct(n,d)}。${n}/${d}世界線"><i style="width:${100*n/d}%"></i></div>`}
function render(){const r=L.batch(settings()),c=r.config,p=r.details;
const check=L.selfCheck();$('#testState').textContent=check.ok?'内部チェック OK':'内部チェック要確認';$('#testState').className=check.ok?'testgood':'testbad';
$('#pensionValue').textContent=money(p.monthlyExtra);$('#premiumValue').textContent=money(p.premiumMonthly);
$('#netSalary').textContent=money(p.netSalaryMonthly);$('#workHours').textContent=p.workHours.toLocaleString('ja-JP')+' 時間';
$('#workingBudget').textContent=`働くルートでは、月収${money(c.monthlyGross)}・本人厚生年金保険料約${money(p.premiumMonthly)}/月・その他控除率${Math.round(c.otherDeduction*100)}%を仮定し、計算上の手取りは約${money(p.netSalaryMonthly)}/月。就労時間は週20時間×年52週の仮定です。厚生年金だけルートでは、給与を老後用資産には一切加算しません（現役中の使途・便益は未評価）。保険料・年金は簡略化した模型です。`;
$('#fundingNote').innerHTML=`<b>4ルートは元手が異なります。</b> 「投資だけ」は初期資産${money(c.initialInvest)}＋毎月${money(c.monthlyHouseholdInvest)}を運用。「厚生年金だけ」は<b>初期投資資産0円・積立0円・給与からの貯蓄0円</b>として、65歳から共通基礎年金＋厚生年金の上乗せだけで暮らします。「働いて年金＋投資」は初期資産と家計積立に加え、手取り給与の${Math.round(c.saveRate*100)}%を運用。「同額投資（仮想）」は投資だけにさらに月${money(p.premiumMonthly)}を${c.workYears}年間、別の財布から調達します。<b>単純な優劣比較・労働の必要性の証明には使えません。</b>`;
$('#rateMeaning').innerHTML=`<b>％は生存確率ではありません。</b> ${c.worlds}通りの市場経路で、65歳から${c.endAge}歳まで月${money(c.retireBudget)}の生活費を年金収入＋ルート別資産で賄えた割合です。すべての世界線が${c.endAge}歳まで生存すると仮定します。`;
const specific={invest:'就労による年金上乗せなし。資産を積み立てる',pension:'投資も貯金も計算に入れず、年金収入だけを使う',both:'働いて増えた手取りから追加投資もする',shadow:'保険料相当額を別途調達する仮想実験'};
$('#rates').innerHTML=L.TYPES.map(t=>{const a=r.results[t.id];return `<article class="route"><div class="head"><strong>${t.icon} ${t.name}</strong><span class="rate num">${pct(a.solvent,a.n)}</span></div><div class="small">${specific[t.id]}</div><div class="small"><b>資金不足なし率</b>（${a.solvent}/${a.n}世界線）</div>${bar(a.solvent,a.n)}<div class="small" style="margin-top:10px">65歳時資産中央値：<b>${money(a.assetsAt65)}</b><br>不足総額中央値：<b>${money(a.shortageMedian)}</b><br>下位10%の65歳資産：<b>${money(a.assetsAt65Low)}</b></div></article>`}).join('');
$('#resultTable').innerHTML=`<table class="table"><thead><tr><th>ルート</th><th>65歳の資産中央値</th><th>${c.endAge}歳まで資金不足なし（世界線数）</th><th>不足総額中央値</th><th>初めて不足した年齢（不足組中央値）</th><th>65歳後の厚生年金上乗せ／月</th></tr></thead><tbody>${L.TYPES.map(t=>{const a=r.results[t.id],extra=(t.id==='pension'||t.id==='both')?p.monthlyExtra:0;return `<tr><td>${t.name}</td><td>${money(a.assetsAt65)}</td><td>${a.solvent}/${a.n}</td><td>${money(a.shortageMedian)}</td><td>${a.shortAgeMedian!==null?Math.round(a.shortAgeMedian)+'歳':'不足なし'}</td><td>${money(extra)}</td></tr>`}).join('')}</tbody></table>`;
const i=r.results.invest,pen=r.results.pension,b=r.results.both,s=r.results.shadow,matched=r.matched;
const pensionOnlyIncome=c.basePension+p.monthlyExtra;const pensionGap=Math.max(0,c.retireBudget-pensionOnlyIncome);
const matching=r.compare.matchedPensionEffect;
const findings=[
['そもそも、働いて年金を増やす必要はある？',`<b>厚生年金を増やすために働く義務はありません。</b> 今回の「投資だけ」は${i.solvent}/${i.n}世界線で${c.endAge}歳まで生活費を賄えました。これは「絶対に働かなくていい」という証明ではなく、初期資産・家計積立・生活費・市場仮定しだいで老後の備え方は変わるという結果です。`],
['厚生年金だけならどうなる？',`「厚生年金だけ」は65歳時資産を<b>${money(pen.assetsAt65)}</b>として、基礎年金${money(c.basePension)}/月＋追加厚生年金${money(p.monthlyExtra)}/月＝<b>${money(pensionOnlyIncome)}/月</b>を受け取ります。${pensionGap>0?`初年度の生活費との差は<b>${money(pensionGap)}/月の不足</b>です。`:'初年度の年金額は設定した月額生活費を満たします。'}資金不足なしは<b>${pen.solvent}/${pen.n}</b>。初期資産を除外した純粋モデルなので、投資ルートとの比較は元手が不揃いです。なお投資ゼロのため、市場を300回変えてもこのルートの結果は同じです。`],
['同じ元手に年金上乗せだけ加えたら？',`公正な条件差テストとして、投資だけと<b>同じ初期資産・積立・同じ市場</b>のまま厚生年金の上乗せのみ追加したところ、不足なしは<b>${i.solvent}/${i.n} → ${matched.solvent}/${matched.n}</b>。不足総額が減った世界線 ${matching.aBetter}、同じ ${matching.tie}、増えた ${matching.bBetter}。<b>これは「厚生年金だけ」ルートではなく、年金上乗せの効果を切り分けた対照実験です。</b>`],
['時間と手取りをどう評価する？',`設定では${c.workYears}年間の就労時間は約<b>${p.workHours.toLocaleString('ja-JP')}時間</b>、手取り給与の単純合計は約<b>${money(p.workingNetCash)}</b>。「働いて年金＋投資」は手取りの${Math.round(c.saveRate*100)}%を追加投資するため、資金不足なしが${b.solvent}/${b.n}世界線に変わります。しかし、それは労働で元手を増やした影響も含むため、投資成績だけの比較ではありません。`]
];
$('#whatWeLearn').innerHTML=findings.map(([head,txt])=>`<div class="answer"><strong>${head}</strong><p>${txt}</p></div>`).join('');
$('#comparison').innerHTML=`<b>結論の読み方：</b> 「年金だけ」は投資資産0円という別条件です。公平な効果比較は「同じ投資＋厚生年金上乗せ」の対照実験を見てください。投資だけを含めどのルートも将来の不足を完全に排除する保証はなく、働く必要性はこの模型だけで一意に決まりません。`;
if($('#sensitivity')){const rows=[];for(const mu of [.01,.05,.08])for(const endAge of [85,95,100]){const z=L.batch({...c,marketMu:mu,endAge});rows.push({mu,endAge,res:z.results,matched:z.matched})}$('#sensitivity').innerHTML=`<table class="table"><thead><tr><th>名目期待年率（仮定）</th><th>生活費を計算する年齢</th><th>投資だけ</th><th>厚生年金だけ</th><th>働いて両方</th><th>同額投資（仮想）</th><th>対照実験：投資＋年金上乗せ</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${Math.round(x.mu*100)}%</td><td>${x.endAge}歳</td>${L.TYPES.map(t=>`<td>${pct(x.res[t.id].solvent,x.res[t.id].n)}</td>`).join('')}<td>${pct(x.matched.solvent,x.matched.n)}</td></tr>`).join('')}</tbody></table>`}
$('#runState').textContent=`計算完了 · 固定Seed ${c.seed} · ${c.worlds}世界線`;
}
$('#run').addEventListener('click',()=>{try{render()}catch(e){$('#runState').textContent='計算エラー：'+e.message;console.error(e)}});
$all('.field input,.field select').forEach(el=>el.addEventListener('change',()=>{$('#runState').textContent='設定変更あり ·「再検証」を押すと更新します'}));render();
})();
