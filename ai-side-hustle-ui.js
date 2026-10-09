/* v2.08 No.23 visual UI: runs entirely locally; no backend, no analytics. */
(function(){'use strict';
const E=window.AISideLab,byId=id=>document.getElementById(id),money=v=>Math.round(v).toLocaleString('ja-JP')+'円',integer=v=>Math.round(v).toLocaleString('ja-JP');
let latest=null;
function read(){
 const get=id=>byId(id)?byId(id).value:undefined;
 const vals={}; for(const key of ['monthlyHours','worlds','seed','kind','competition','demand','aiSpeed','aiQuality','aiCost','marketing','hourValue'])if(get(key)!==undefined)vals[key]=get(key);
 return E.config(vals);
}
function pill(str,kind){return '<span class="pill '+(kind||'')+'">'+str+'</span>'}
function updateLabels(c){
 const run=byId('run');if(run)run.textContent='🔬 同じ条件で'+c.worlds+'世界線を実行';
 for(const [id,txt] of [['competition',Math.round(c.competition*100)+' / 100'],['demand',c.demand.toFixed(1)+'倍'],['aiSpeed',c.aiSpeed.toFixed(1)+'倍'],['aiQuality',Math.round(c.aiQuality*100)+'%'],['marketing',c.marketing+'時間']])if(byId(id+'Text'))byId(id+'Text').textContent=txt;
}
function tableSummary(sim){
 const nonRest=sim.summaries.filter(v=>v.id!=='rest');
 const max=Math.max(...nonRest.map(v=>Math.abs(v.cash)),1000);
 const sorted=sim.summaries;
 let html='<div class="scroller"><table class="data-table"><thead><tr><th>BOT</th><th>24か月・現金利益中央値</th><th>現金黒字の世界線</th><th>時間価値も引いた利益</th><th>制作量中央値</th><th>対人時間中央値</th></tr></thead><tbody>';
 for(const r of sorted){const isAi=r.ai,why=r.id==='rest'?'副業なし':r.id==='human'?'同じジャンルのAIなし対照群':'AIあり';
  html+='<tr><td><b>'+r.label+'</b><span class="sub">'+why+'</span></td><td class="nowrap"><b class="'+(r.cash<0?'loss':'gain')+'">'+money(r.cash)+'</b><span class="sub">10〜90%点: '+money(r.p10)+' ～ '+money(r.p90)+'</span></td><td>'+Math.round(r.blackRate*100)+'%<span class="sub">'+sim.config.worlds+'世界線内の割合</span></td><td class="nowrap">'+money(r.economic)+'</td><td>'+integer(r.units)+(r.id==='rest'?'':' '+E.BASE[r.kind].unit)+'</td><td>'+r.contact.toFixed(1)+'h</td></tr>';
 }return html+'</tbody></table></div>';
}
function chart(sim){
 const rows=sim.summaries.filter(x=>x.id!=='rest');const max=Math.max(...rows.map(x=>Math.abs(x.cash)),1000);
 let html='<div class="bar-chart" role="img" aria-label="BOT別の24か月後の現金利益中央値を横棒で比較">';
 for(const x of rows){const neg=x.cash<0;const width=Math.max(2,Math.round(Math.abs(x.cash)/max*100));html+='<div class="bar-line"><div class="bar-name">'+x.label+'</div><div class="bar-track"><div class="bar '+(neg?'negative':'positive')+'" style="width:'+width+'%"></div></div><div class="bar-value '+(neg?'loss':'gain')+'">'+money(x.cash)+'</div></div>'}
 return html+'</div><p class="sub">※ 収益順位は仮置きした単価・流入・購入率に強く左右されます。AIの優劣を現実について断定する図ではありません。</p>';
}
function medianCurve(sim,ids){
 const n=sim.config.months,data=[];for(const id of ids){const arr=sim.worlds[id];data.push({id,name:sim.summaries.find(s=>s.id===id).label,values:Array.from({length:n},(_,m)=>E.median(arr.map(x=>x.monthly.slice(0,m+1).reduce((a,b)=>a+b,0))))})}
 const all=data.flatMap(d=>d.values),hi=Math.max(...all,1000),lo=Math.min(...all,-1000),range=hi-lo||1;
 let out='<div class="scroller"><svg class="trend" viewBox="0 0 740 250" role="img" aria-label="月別の現金累積利益中央値グラフ">';
 const plot={x:78,y:20,w:625,h:175};const x=m=>plot.x+m/(n-1)*plot.w,y=v=>plot.y+(hi-v)/range*plot.h;
 for(let i=0;i<=4;i++){const v=lo+(range*i/4),yy=y(v);out+='<line x1="'+plot.x+'" y1="'+yy+'" x2="'+(plot.x+plot.w)+'" y2="'+yy+'" stroke="#dce2ea"/><text x="'+(plot.x-6)+'" y="'+(yy+4)+'" fill="#64748b" font-size="11" text-anchor="end">'+(Math.round(v/1000))+'千</text>'}
 const colors={'ai_article':'#2563eb','ai_image':'#c06ab2','ai_dev':'#0d9488','ai_course':'#d97706','human':'#4f46e5','rest':'#6b7280'};
 for(const d of data){out+='<polyline fill="none" stroke="'+colors[d.id]+'" stroke-width="3" points="'+d.values.map((v,m)=>x(m)+','+y(v)).join(' ')+'"/>'}
 out+='<text x="'+plot.x+'" y="225" font-size="12" fill="#64748b">1か月目</text><text x="'+(plot.x+plot.w)+'" y="225" font-size="12" fill="#64748b" text-anchor="end">'+n+'か月目</text></svg></div><div class="legend">';
 for(const d of data)out+='<span><i style="background:'+colors[d.id]+'"></i>'+d.name+'</span>';return out+'</div>';
}
function statusFromMetric(row,c){
 const p=row.metric.positive;
 if(row.key==='H1')return p>=.95?['設計どおり','design']:['設定を要確認','unclear'];
 if(row.key==='H2')return p>=.70&&row.metric.median>0?['モデル内で支持','support']:p<=.30&&row.metric.median<0?['モデル内で支持されず','reject']:['判定困難','unclear'];
 if(row.key==='H3')return c.competition===0?['競争ゼロ・比較不可','unclear']:p>=.75?['設計どおり','design']:['乱数に埋もれる','unclear'];
 if(row.key==='H4')return p>=.75?['設計どおり','design']:['乱数に埋もれる','unclear'];
 if(row.key==='H5')return p>0?['赤字世界線あり','support']:['赤字世界線なし','reject'];
 if(row.key==='H6')return p>.5?['半数超で黒字','support']:['半数以下','reject'];
 return ['判定困難','unclear'];
}
function metrics(c,one){return '<div class="metric-strip"><div><span class="sub">比較対象</span><b>'+E.BASE[c.kind].label+'</b></div><div><span class="sub">世界線数</span><b>'+c.worlds+'</b></div><div><span class="sub">期間</span><b>'+c.months+'か月</b></div><div><span class="sub">毎月の作業時間</span><b>'+c.monthlyHours+'時間</b></div></div>'}
function showGame(sim){
 const c=sim.config;
 byId('results').innerHTML='<div class="section-head"><div><div class="eyebrow">RESULTS / MODEL OUTPUT</div><h2>24か月後、誰が黒字になった？</h2></div>'+pill('仮定を置いた世界線 '+c.worlds+'本','neutral')+'</div>'+metrics(c)+
 '<div class="callout"><b>ひとこと：</b> 比較する副業の「単価・アクセス・成約率」は架空の初期値です。<b>いちばん稼ぐBOTが、実際に稼ぎやすい副業だという意味ではありません。</b> AIの追加効果は下の「同種の人力BOTとの比較」で見てください。</div>'+chart(sim)+tableSummary(sim)+
 '<div class="section-head"><div><div class="eyebrow">CUMULATIVE PROFIT</div><h2>資金の増え方・減り方</h2></div></div>'+medianCurve(sim,['ai_'+c.kind,'human','rest'])+
 '<p class="sub">表示値は各月時点で計算した中央値です。同一人物の経路をつないだものではありません。手取り所得や税金は含んでいません。</p>'+
 '<div class="section-head"><div><div class="eyebrow">PAIRED COMPARISON</div><h2>同じ副業・同じ作業時間でAIだけ変える</h2></div></div>'+pairedText(sim)+
 '<p class="notice">現金利益＝売上－仮定したプラットフォーム手数料－AIツール利用料。時間価値控除後＝現金利益－実際に使った時間×設定時給。税金・設備償却・社会保険・外注費は含みません。</p>';
}
function pairedText(sim){const c=sim.config,d=E.paired(sim.worlds['ai_'+c.kind],sim.worlds.human,'cash'),vol=E.paired(sim.worlds['ai_'+c.kind],sim.worlds.human,'units'),social=E.paired(sim.worlds['ai_'+c.kind],sim.worlds.human,'contact');return '<div class="metrics3"><div class="metric"><div class="sub">AIで増えた制作数（中央値差）</div><b>'+vol.median.toFixed(0)+' '+E.BASE[c.kind].unit+'</b></div><div class="metric"><div class="sub">AIの現金利益 − 人力の現金利益</div><b class="'+(d.median>=0?'gain':'loss')+'">'+money(d.median)+'</b></div><div class="metric"><div class="sub">AIのほうが現金利益で上回った割合</div><b>'+Math.round(d.positive*100)+'%</b><div class="sub">同一Seedの'+c.worlds+'世界線</div></div></div><p class="sub">対人対応時間の中央値差：'+social.median.toFixed(1)+'時間。集客・単価・AIの品質差を固定したモデル内の比較です。</p>'}
function humanReadableResult(a){
 const c=a.config, rows=a.sim.summaries;
 const ai=rows.find(x=>x.id==='ai_'+c.kind), human=rows.find(x=>x.id==='human');
 const units=E.paired(a.sim.worlds['ai_'+c.kind],a.sim.worlds.human,'units').median;
 const amount=v=>Math.abs(v)>=10000?'約'+(Math.abs(v)/10000).toFixed(1)+'万円':money(Math.abs(v));
 const cashText=v=>Math.abs(v)<0.5?'ほぼ収支ゼロ':amount(v)+'の'+(v<0?'赤字':'黒字');
 const first=units>0?'AIを使えば、同じ時間でより多くの作品を作れます。しかし、<b>たくさん作れることと、稼げることは別問題</b>でした。':
  units<0?'今回の設定では、AIの制作量が人力を下回りました。<b>制作量と利益は別々に確認する必要があります。</b>':
  '今回の設定では、AIと人力の制作量は同程度でした。<b>制作量と利益は別々に確認する必要があります。</b>';
 const cost=c.aiCost>0?'AIツール代を回収するには、制作量だけでなく、実際に作品が見られ、売れることが重要です。':
  '利益を出すには、制作量だけでなく、実際に作品が見られ、売れることが重要です。';
 const conclusion=c.aiSpeed>1?'AIは作業を速くする道具であって、利益を保証する道具ではありません。':
  'AIを導入するだけで、利益が保証されるわけではありません。';
 return '<section class="finding" style="margin-top:18px" aria-labelledby="no23-readable-result"><div class="eyebrow">RESULTS / わかりやすいまとめ</div><h3 id="no23-readable-result">🔬 今回の実験からわかったこと</h3>'+ 
  '<p>'+first+'</p><p>今回の条件では、<b>'+ai.label+'は'+c.months+'か月で'+cashText(ai.cash)+'</b>、<b>'+human.label+'は'+cashText(human.cash)+'</b>でした。</p>'+ 
  '<p>'+cost+'</p><p><b>結論：'+conclusion+'</b></p>'+ 
  '<p class="sub">※架空の条件によるシミュレーション結果です。設定を変更して再実行すると、このまとめも更新されます。金額は'+c.worlds+'世界線の中央値です。</p></section>';
}
function researchData(a){const c=a.config;
 let h=metrics(c);h+='<div class="section-head"><div><div class="eyebrow">PRE-REGISTERED / 仮説</div><h2>H1〜H6 の検証</h2></div></div>';
 for(const f of a.findings){const s=statusFromMetric(f,c);let detail='';if(['H1','H2','H3','H4'].includes(f.key))detail='中央値差：<strong>'+ (f.key==='H1'?f.metric.median.toFixed(0)+' '+E.BASE[c.kind].unit:money(f.metric.median))+'</strong>／正方向の世界線 <strong>'+Math.round(f.metric.positive*100)+'%</strong>';
 else detail='中央値：<strong>'+money(f.metric.median)+'</strong>／該当する世界線 <strong>'+Math.round(f.metric.positive*100)+'%</strong>';
 h+='<article class="finding"><div class="finding-top"><span class="key">'+f.key+'</span><b>'+f.title+'</b>'+pill(s[0],s[1])+'</div><p>'+f.statement+'</p><div class="sub">'+f.type+'｜'+detail+'</div></article>'}
 return h+humanReadableResult(a)+'<p class="notice"><b>研究上の注記：</b> H1/H3/H4には比較方向を直接組み込んだ<strong>設計挙動</strong>が含まれます。「設計どおり」は新しい科学的発見ではありません。H2/H5は複数の仮定と乱数を組み合わせたモデル内の比較です。100世界線は実在の100人ではありません。</p>';
}
function draw(shouldScroll){const c=read();updateLabels(c);const pane=byId('results');if(pane)pane.innerHTML='<p>計算しています…</p>';
 if(document.body.dataset.mode==='research'){latest=E.audit(c);pane.innerHTML=researchData(latest)}else{latest=E.simulate(c);showGame(latest)}
 if(shouldScroll===true)byId('resultAnchor')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function defaults(){for(const [k,v] of Object.entries(E.DEFAULT)){const el=byId(k);if(el)el.value=String(v)}draw(true)}
window.addEventListener('DOMContentLoaded',()=>{
 const btn=byId('run');if(btn)btn.addEventListener('click',()=>draw(true));
 byId('reset')?.addEventListener('click',defaults);
 for(const el of document.querySelectorAll('input,select'))el.addEventListener('change',()=>updateLabels(read()));
 draw(false);
});
})();
