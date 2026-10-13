/* はてな日和の居候 v1.0 — サーバー通信なし・世話不要 */
(function () {
  'use strict';
  var STORAGE_KEY = 'hatena_biyori_ikimono_v1';
  var MILESTONES = [
    {day: 1, text: 'いつの間にか、だれかが住みついた。'},
    {day: 2, text: '小さな敷物を持ち込んだ。'},
    {day: 4, text: '観葉植物が増えている。'},
    {day: 7, text: 'コップがひとつ増えた。'},
    {day: 11, text: '勝手に棚を置いた。'},
    {day: 14, text: '知らない友だちが来るようになった。'},
    {day: 30, text: 'とうとう二階を作ってしまった。'}
  ];
  var LINES = [
    '「ここ、すみごこちがいい。」',
    '「きょうは なにもしないひ。」',
    '「そとで はっぱを ひろった。」',
    '「いつのまにか ものが ふえた。」',
    '「おちゃは まだ あたたかい。」',
    '「あしたも ここに いるとおもう。」',
    '「まどの そとを みていた。」',
    '「きょうは いいてんき。」',
    '「ここ、ぼくのいえ？」',
    '「おくに ひみつは ないよ。」',
    '「おしごとは していない。」',
    '「しずかな ばしょが すき。」'
  ];

  function localDay(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function dayNumber(day) {
    var chunks = day.split('-').map(Number);
    return Math.floor(Date.UTC(chunks[0], chunks[1] - 1, chunks[2]) / 86400000);
  }
  function elapsed(first, today) {
    return Math.max(1, dayNumber(today) - dayNumber(first) + 1);
  }
  function goodDay(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + 'T00:00:00').getTime());
  }
  function readState() {
    try {
      var str = localStorage.getItem(STORAGE_KEY);
      if (str) {
        var obj = JSON.parse(str);
        if (obj && obj.v === 1 && goodDay(obj.firstDay)) return obj;
      }
    } catch (_) { /* storage を使用できない環境は画面表示だけ */ }
    return null;
  }
  function writeState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); return true; }
    catch (_) { return false; }
  }
  function addText(id, str) {
    var el = document.getElementById(id);
    if (el) el.textContent = str;
  }
  function ready() {
    var roots = document.querySelectorAll('[data-ik-root]');
    if (!roots.length) return;
    var now = new Date();
    var today = localDay(now);
    var state = readState() || {v: 1, firstDay: today, lastDay: null};
    // 端末の時計が過去に戻った場合、経過日数は巻き戻さない。
    var days = elapsed(state.firstDay, today);
    var saved = writeState({v: 1, firstDay: state.firstDay, lastDay: today});
    var seed = dayNumber(today) * 17 + dayNumber(state.firstDay) * 3;
    var hour = now.getHours();
    var sleeping = hour < 7 || hour >= 22;
    var napping = hour >= 13 && hour <= 14 && seed % 3 === 0;
    var mood = sleeping || napping ? 'sleeping' : (seed % 4 === 0 ? 'happy' : 'awake');
    var line = sleeping ? '「もう ねるじかん。」' : LINES[((seed % LINES.length) + LINES.length) % LINES.length];
    var guest = days >= 14 && seed % 4 !== 1;
    var dayMessage = 'ここに来て ' + days + '日目';
    roots.forEach(function (root) {
      var stage = root.querySelector('.ik-stage');
      if (stage) {
        stage.dataset.days = days >= 30 ? 'long' : 'short';
        var pet = stage.querySelector('.ik-pet');
        if (pet) {
          pet.className = 'ik-pet is-' + mood;
          pet.dataset.ikSpot = ['left', 'middle', 'right'][(seed + Math.floor(hour / 4)) % 3];
        }
        var items = stage.querySelectorAll('[data-ik-from]');
        items.forEach(function (el) {
          var from = Number(el.getAttribute('data-ik-from'));
          el.hidden = from > days || (el.hasAttribute('data-ik-guest') && !guest) || (el.hasAttribute('data-ik-sleep') && mood !== 'sleeping');
        });
      }
      var status = root.querySelector('[data-ik-status]');
      if (status) status.textContent = dayMessage;
      var note = root.querySelector('[data-ik-line]');
      if (note) note.textContent = line;
    });
    var history = document.getElementById('ik-history');
    if (history) {
      history.replaceChildren();
      MILESTONES.filter(function (e) { return e.day <= days; }).slice().reverse().forEach(function (e) {
        var li = document.createElement('li');
        li.textContent = e.day + '日目　' + e.text;
        history.appendChild(li);
      });
    }
    addText('ik-storage-note', saved
      ? 'この記録は、今使っているブラウザの中だけに残ります。別の端末には引き継がれません。'
      : 'このブラウザでは記録を保存できません。次に開いたときは、また1日目になることがあります。');
    // visit やイベントは当日に繰り返し開いても水増ししない。
    // 日数は初回の暦日からの経過日数なので、毎日見に来る必要はない。
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
