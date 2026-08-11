/* ============================================================
 *  T3クローズ 管理
 *
 *  現場アプリ（../index.html）と同じ config.js / storage.js / sync.js を
 *  そのまま使います。違うのは次の2点だけです。
 *
 *    ・管理用PINで開く（現場用PINとは別に覚えます）
 *    ・チェック項目・担当者・定休日を「書き換える」側になる
 *
 *  項目の追加・削除は、過去の記録を壊さないよう次のように扱います。
 *    追加 … その項目に addedAt（今日）を付ける   → 過去の日には出ません
 *    削除 … その項目に retiredAt（明日）を付ける → 過去の日には残ります
 * ============================================================ */

/* 管理アプリは「送信箱」も「PIN」も現場アプリと別の場所を使います。
 *
 * 同じ端末で両方を開くと保存領域を共有するため、分けておかないと
 * 管理アプリの変更（管理用PINが要る）を現場アプリが横取りして送ってしまい、
 * 「権限がありません」で弾かれて同期が止まります。 */
Sync._pinKey = APP.storageKey + ':adminPin';
Sync._outboxKey = APP.storageKey + ':adminOutbox';
Sync._sinceKey = APP.storageKey + ':adminSince';

const DOW = ['日', '月', '火', '水', '木', '金', '土'];

const state = {
  view: 'stores',            // 'stores'（店舗選択）か 'store'（店舗ごとの設定）
  storeId: STORES[0].id,
};

const el = {};
[
  'appLogo', 'homeBtn', 'storeTabs', 'syncChip',
  'viewStores', 'viewStore', 'storeGrid', 'backToStores',
  'itemsStoreName', 'itemsCount', 'checklistEditor', 'addSection',
  'staffInput', 'saveStaff', 'staffCount', 'staffSaved',
  'closedStoreName', 'dowToggles', 'exFrom', 'exTo', 'exKind', 'exAdd', 'exHint', 'exList',
  'exportBtn', 'importFile',
  'pauseModal', 'pauseItem', 'pauseFrom', 'pauseTo', 'pauseAdd', 'pauseHint', 'pauseList',
  'confirmDialog', 'confirmItem', 'confirmMessage', 'confirmOk',
  'pinModal', 'pinInput', 'pinReveal', 'pinError', 'pinOk',
].forEach((id) => { el[id] = document.getElementById(id); });

/* ============================================================
 *  小さな道具
 * ============================================================ */
const p2 = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${p2(m)}-${p2(d)}`;

function todayStr() {
  const t = new Date();
  return ymd(t.getFullYear(), t.getMonth() + 1, t.getDate());
}
function tomorrowStr() {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return ymd(t.getFullYear(), t.getMonth() + 1, t.getDate());
}
/** 重複しない項目ID。過去の記録と紐づくので、一度作ったら変えません */
function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 46656).toString(36)}`;
}

/** 誤操作を防ぐための確認。OKなら true が返ります */
function askConfirm(itemText, message) {
  return new Promise((resolve) => {
    el.confirmItem.textContent = itemText;
    el.confirmMessage.textContent = message;
    el.confirmDialog.classList.remove('is-hidden');

    const close = (answer) => {
      el.confirmDialog.classList.add('is-hidden');
      el.confirmOk.removeEventListener('click', onOk);
      cancels.forEach((c) => c.removeEventListener('click', onCancel));
      resolve(answer);
    };
    const onOk = () => close(true);
    const onCancel = () => close(false);
    const cancels = [...el.confirmDialog.querySelectorAll('[data-confirm-cancel]')];

    el.confirmOk.addEventListener('click', onOk);
    cancels.forEach((c) => c.addEventListener('click', onCancel));
  });
}

/* ============================================================
 *  チェック項目の編集
 * ============================================================ */

/** いま編集中の店舗の区分一覧（保存されていなければ config.js の初期値を複製） */
function currentSections() {
  return JSON.parse(JSON.stringify(Checklists.sections(state.storeId)));
}

/** 書き換えた内容を保存して、全端末へ送る */
function saveSections(sections) {
  // 追加した当日に削除された項目は、どの日にも出ないので残さない
  const cleaned = sections.map((sec) => ({
    ...sec,
    items: sec.items.filter((it) => !(it.addedAt && it.retiredAt && it.addedAt >= it.retiredAt)),
  }));
  Checklists.save(state.storeId, cleaned);
  renderChecklistEditor();
}

/** 表示するもの＝まだやめていない区分・項目 */
const alive = (x) => !x.retiredAt;

function renderChecklistEditor() {
  const sections = currentSections();
  el.itemsStoreName.textContent = getStore(state.storeId).name;

  const liveSections = sections.filter(alive);
  const total = liveSections.reduce((n, sec) => n + sec.items.filter(alive).length, 0);
  el.itemsCount.textContent = `${liveSections.length}区分 / ${total}項目`;

  el.checklistEditor.innerHTML = '';

  if (!liveSections.length) {
    const p = document.createElement('p');
    p.className = 'admin-empty';
    p.textContent = '区分がありません。下の「＋ 区分を追加」から作ってください。';
    el.checklistEditor.appendChild(p);
    return;
  }

  liveSections.forEach((sec) => {
    el.checklistEditor.appendChild(buildSectionCard(sec, sections, liveSections));
  });
}

function buildSectionCard(sec, sections, liveSections) {
  const card = document.createElement('div');
  card.className = 'sec-card';
  card.dataset.secId = sec.id;

  /* --- 区分の見出し --- */
  const head = document.createElement('div');
  head.className = 'sec-card__head';

  const name = document.createElement('input');
  name.type = 'text';
  name.className = 'sec-card__name';
  name.value = sec.title;
  name.setAttribute('aria-label', '区分の名前');
  name.addEventListener('change', () => {
    const text = name.value.trim();
    if (!text || text === sec.title) { name.value = sec.title; return; }
    const next = currentSections();
    next.find((s) => s.id === sec.id).title = text;
    saveSections(next);
  });
  head.appendChild(name);

  // 区分ごと曜日で出し分けている場合は、それが分かるようにしておく
  if (sec.onlyDows) {
    const tag = document.createElement('span');
    tag.className = 'item-row__tag';
    tag.textContent = sec.onlyDows.map((d) => DOW[d]).join('') + 'のみ';
    head.appendChild(tag);
  }

  const secPos = liveSections.indexOf(sec);
  head.appendChild(moveButton('↑', secPos > 0, () => moveSection(sec.id, -1)));
  head.appendChild(moveButton('↓', secPos < liveSections.length - 1, () => moveSection(sec.id, 1)));

  const delSec = document.createElement('button');
  delSec.type = 'button';
  delSec.className = 'icon-btn icon-btn--danger';
  delSec.textContent = '×';
  delSec.title = '区分ごと削除';
  delSec.addEventListener('click', () => removeSection(sec));
  head.appendChild(delSec);

  card.appendChild(head);

  /* --- 項目 --- */
  const liveItems = sec.items.filter(alive);
  if (!liveItems.length) {
    const p = document.createElement('p');
    p.className = 'admin-empty';
    p.textContent = '項目がありません';
    card.appendChild(p);
  }
  liveItems.forEach((item, i) => {
    card.appendChild(buildItemRow(sec, item, i, liveItems.length));
  });

  /* --- 項目を追加 --- */
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'sec-card__add';
  add.textContent = '＋ 項目を追加';
  add.addEventListener('click', () => addItem(sec.id));
  card.appendChild(add);

  return card;
}

function buildItemRow(sec, item, index, count) {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.dataset.itemId = item.id;
  row.addEventListener('pointerdown', (e) => startLongPress(e, row));

  const name = document.createElement('input');
  name.type = 'text';
  name.className = 'item-row__name';
  name.value = item.label;
  name.setAttribute('aria-label', '項目の名前');
  name.addEventListener('change', () => {
    const text = name.value.trim();
    if (!text || text === item.label) { name.value = item.label; return; }
    const next = currentSections();
    const target = next.find((s) => s.id === sec.id).items.find((it) => it.id === item.id);
    target.label = text;
    saveSections(next);
  });
  row.appendChild(name);

  /* 特殊な条件が付いている項目は、それと分かるようにしておく */
  specialTags(item).forEach((text) => {
    const span = document.createElement('span');
    span.className = 'item-row__tag' + (text.startsWith('休止') ? ' item-row__tag--pause' : '');
    span.textContent = text;
    row.appendChild(span);
  });

  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'icon-btn' + (item.pauses && item.pauses.length ? ' icon-btn--on' : '');
  pause.textContent = '休';
  pause.title = '休止期間の設定';
  pause.addEventListener('click', () => openPause(sec.id, item.id));
  row.appendChild(pause);

  row.appendChild(moveButton('↑', index > 0, () => moveItem(sec.id, item.id, -1)));
  row.appendChild(moveButton('↓', index < count - 1, () => moveItem(sec.id, item.id, 1)));

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'icon-btn icon-btn--danger';
  del.textContent = '×';
  del.title = '削除';
  del.addEventListener('click', () => removeItem(sec, item));
  row.appendChild(del);

  return row;
}

/** 「28日だけ」「金土のみ」「休止中」など、その項目に付いている条件をすべて返す */
function specialTags(item) {
  const tags = [];
  if (item.onlyDays) tags.push(item.onlyDays.join('・') + '日だけ');
  if (item.onlyDows) tags.push(item.onlyDows.map((d) => DOW[d]).join('') + 'のみ');
  if (item.hideOnDows) tags.push(item.hideOnDows.map((d) => DOW[d]).join('') + 'は非表示');
  if (item.type === 'number') tags.push('数値' + (item.unit ? `（${item.unit}）` : ''));
  if (item.pauses && item.pauses.length) {
    tags.push(isPaused(item, todayStr()) ? '休止中' : `休止${item.pauses.length}件`);
  }
  return tags;
}

function moveButton(label, enabled, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'icon-btn';
  b.textContent = label;
  b.disabled = !enabled;
  if (enabled) b.addEventListener('click', onClick);
  return b;
}

/* -------- 追加・削除・並べ替え -------- */

function addItem(secId) {
  const next = currentSections();
  const sec = next.find((s) => s.id === secId);
  sec.items.push({
    id: newId('it'),
    label: '新しい項目',
    type: 'check',
    addedAt: todayStr(), // 今日から出す（過去の日にはさかのぼらせない）
  });
  saveSections(next);

  // 追加した項目にすぐ名前を入れられるようにしておく
  const boxes = el.checklistEditor.querySelectorAll('.item-row__name');
  const last = [...boxes].reverse().find((b) => b.value === '新しい項目');
  if (last) { last.focus(); last.select(); }
}

async function removeItem(sec, item) {
  const ok = await askConfirm(
    item.label,
    'この項目を明日から出さないようにします。過去の記録はそのまま残ります。'
  );
  if (!ok) return;
  const next = currentSections();
  const target = next.find((s) => s.id === sec.id).items.find((it) => it.id === item.id);
  target.retiredAt = tomorrowStr();
  saveSections(next);
}

function addSection() {
  const next = currentSections();
  next.push({ id: newId('sec'), title: '新しい区分', items: [] });
  saveSections(next);

  const boxes = el.checklistEditor.querySelectorAll('.sec-card__name');
  const last = [...boxes].reverse().find((b) => b.value === '新しい区分');
  if (last) { last.focus(); last.select(); }
}

async function removeSection(sec) {
  const n = sec.items.filter(alive).length;
  const ok = await askConfirm(
    sec.title,
    `この区分と、中の${n}項目をまとめて明日から出さないようにします。過去の記録はそのまま残ります。`
  );
  if (!ok) return;
  const next = currentSections();
  const target = next.find((s) => s.id === sec.id);
  const at = tomorrowStr();
  target.retiredAt = at;
  target.items.forEach((it) => { if (!it.retiredAt) it.retiredAt = at; });
  saveSections(next);
}

/* ============================================================
 *  長押しして並べ替え
 *
 *  ・0.35秒押し続けると持ち上がります（すぐ動かした場合は画面のスクロール）
 *  ・指を動かすと、その位置に行が移動します
 *  ・離した時点の並びで保存します
 *  ・同じ区分の中だけで動かせます（別の区分へは移せません）
 *  矢印ボタンでの移動も今までどおり使えます。
 * ============================================================ */
const drag = { row: null, card: null, timer: null, y: 0, active: false, raf: 0 };

function startLongPress(e, row) {
  // ボタンを押したときは並べ替えを始めない
  if (e.target.closest('.icon-btn')) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;

  cancelLongPress();
  drag.row = row;
  drag.card = row.closest('.sec-card');
  drag.y = e.clientY;
  drag.timer = setTimeout(() => beginDrag(e), 350);

  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  document.addEventListener('touchmove', blockScroll, { passive: false });
}

function beginDrag(e) {
  drag.active = true;
  drag.timer = null;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  drag.row.classList.add('is-drag');
  document.body.classList.add('is-dragging');
  if (navigator.vibrate) navigator.vibrate(15); // 持ち上がったことを指に伝える
}

/** 並べ替え中は画面が動かないようにする */
function blockScroll(e) {
  if (drag.active) e.preventDefault();
}

function onPointerMove(e) {
  if (!drag.active) {
    // 持ち上がる前に動かしたときは、スクロールとみなして中止
    if (Math.abs(e.clientY - drag.y) > 8) cancelLongPress();
    return;
  }
  e.preventDefault();
  moveRowTo(e.clientY);
  autoScroll(e.clientY);
}

/** 指の位置に合わせて、行を差し込む場所を決める */
function moveRowTo(y) {
  const others = [...drag.card.querySelectorAll('.item-row')].filter((r) => r !== drag.row);
  const after = others.find((r) => {
    const box = r.getBoundingClientRect();
    return y < box.top + box.height / 2;
  });
  if (after) {
    if (after.previousElementSibling !== drag.row) drag.card.insertBefore(drag.row, after);
  } else {
    const addBtn = drag.card.querySelector('.sec-card__add');
    if (addBtn && addBtn.previousElementSibling !== drag.row) drag.card.insertBefore(drag.row, addBtn);
  }
}

/** 画面の端まで持っていったら、ゆっくりスクロールする */
function autoScroll(y) {
  cancelAnimationFrame(drag.raf);
  const margin = 70;
  const step = y < margin ? -9 : y > window.innerHeight - margin ? 9 : 0;
  if (!step) return;
  const tick = () => {
    if (!drag.active) return;
    window.scrollBy(0, step);
    drag.raf = requestAnimationFrame(tick);
  };
  drag.raf = requestAnimationFrame(tick);
}

function endDrag() {
  const wasActive = drag.active;
  const card = drag.card;
  const row = drag.row;
  cancelLongPress();
  if (!wasActive || !card) return;

  row.classList.remove('is-drag');
  document.body.classList.remove('is-dragging');

  // 画面の並びをそのまま保存する
  const order = [...card.querySelectorAll('.item-row')].map((r) => r.dataset.itemId);
  applyItemOrder(card.dataset.secId, order);
}

function cancelLongPress() {
  clearTimeout(drag.timer);
  cancelAnimationFrame(drag.raf);
  if (drag.row) drag.row.classList.remove('is-drag');
  document.body.classList.remove('is-dragging');
  drag.timer = null;
  drag.active = false;
  drag.row = null;
  drag.card = null;
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', endDrag);
  document.removeEventListener('pointercancel', endDrag);
  document.removeEventListener('touchmove', blockScroll);
}

/** 画面の並び（表示中の項目のID順）を保存する。やめた項目は後ろにまとめます */
function applyItemOrder(secId, orderedIds) {
  const next = currentSections();
  const sec = next.find((s) => s.id === secId);
  if (!sec) return;

  const byId = {};
  sec.items.forEach((it) => { byId[it.id] = it; });
  const live = orderedIds.map((id) => byId[id]).filter(Boolean);
  const rest = sec.items.filter((it) => !orderedIds.includes(it.id));

  const before = sec.items.map((it) => it.id).join(',');
  sec.items = live.concat(rest);
  if (sec.items.map((it) => it.id).join(',') === before) return; // 並びが変わっていなければ保存しない

  saveSections(next);
}

/** 表示されている並びの中で、上下を入れ替える */
function swapWithin(list, isLive, id, dir) {
  const liveIdx = list.map((x, i) => (isLive(x) ? i : -1)).filter((i) => i >= 0);
  const at = liveIdx.findIndex((i) => list[i].id === id);
  const to = at + dir;
  if (at < 0 || to < 0 || to >= liveIdx.length) return false;
  const a = liveIdx[at];
  const b = liveIdx[to];
  [list[a], list[b]] = [list[b], list[a]];
  return true;
}

function moveSection(secId, dir) {
  const next = currentSections();
  if (swapWithin(next, alive, secId, dir)) saveSections(next);
}

function moveItem(secId, itemId, dir) {
  const next = currentSections();
  const items = next.find((s) => s.id === secId).items;
  if (swapWithin(items, alive, itemId, dir)) saveSections(next);
}

/* ============================================================
 *  休止期間（長期休みなどで一時的に外す）
 * ============================================================ */
const pauseTarget = { secId: null, itemId: null };

function pauseItemOf() {
  return currentSections()
    .find((s) => s.id === pauseTarget.secId)
    .items.find((i) => i.id === pauseTarget.itemId);
}

function openPause(secId, itemId) {
  pauseTarget.secId = secId;
  pauseTarget.itemId = itemId;
  el.pauseItem.textContent = pauseItemOf().label;
  el.pauseFrom.value = '';
  el.pauseTo.value = '';
  el.pauseHint.textContent = '';
  renderPauseList();
  el.pauseModal.classList.remove('is-hidden');
}

function renderPauseList() {
  const item = pauseItemOf();
  const list = (item.pauses || []).slice().sort((a, b) => (a.from < b.from ? -1 : 1));
  el.pauseList.innerHTML = '';

  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'ex-list__empty';
    li.textContent = '登録なし';
    el.pauseList.appendChild(li);
    return;
  }

  const today = todayStr();
  list.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'ex-list__item';
    const now = today >= p.from && today <= p.to;
    const done = today > p.to;
    li.innerHTML =
      `<span class="ex-list__date">${p.from.replace(/-/g, '/')} 〜 ${p.to.replace(/-/g, '/')}</span>` +
      `<span class="ex-list__kind ${now ? 'ex-list__kind--closed' : ''}">` +
      `${now ? '休止中' : done ? '終了' : 'この先'}</span>`;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'ex-list__del';
    del.textContent = '削除';
    del.addEventListener('click', () => {
      updatePauses((cur) => cur.filter((x) => !(x.from === p.from && x.to === p.to)));
    });
    li.appendChild(del);
    el.pauseList.appendChild(li);
  });
}

/** 休止期間を書き換えて保存する */
function updatePauses(fn) {
  const next = currentSections();
  const item = next.find((s) => s.id === pauseTarget.secId).items.find((i) => i.id === pauseTarget.itemId);
  const list = fn((item.pauses || []).slice());
  if (list.length) item.pauses = list;
  else delete item.pauses;
  saveSections(next);
  renderPauseList();
}

function addPause() {
  const from = el.pauseFrom.value;
  const to = el.pauseTo.value || from;
  el.pauseHint.textContent = '';

  if (!from) { el.pauseHint.textContent = '開始日を選んでください。'; return; }
  if (to < from) { el.pauseHint.textContent = '終了日は開始日より後にしてください。'; return; }

  updatePauses((cur) => {
    if (cur.some((p) => p.from === from && p.to === to)) return cur;
    return cur.concat([{ from, to }]);
  });

  const days = Math.round((new Date(to + 'T00:00:00') - new Date(from + 'T00:00:00')) / 86400000) + 1;
  el.pauseHint.textContent = `${days}日分を休止にしました。`;
  el.pauseFrom.value = '';
  el.pauseTo.value = '';
}

/* ============================================================
 *  担当者
 * ============================================================ */
function renderStaff() {
  const names = Staff.list();
  el.staffInput.value = names.join('\n');
  el.staffCount.textContent = `${names.length}人`;
}

function saveStaff() {
  const names = Staff.saveFromText(el.staffInput.value);
  renderStaff();
  el.staffSaved.classList.remove('is-hidden');
  setTimeout(() => el.staffSaved.classList.add('is-hidden'), 2500);
  return names;
}

/* ============================================================
 *  定休日
 * ============================================================ */
function renderClosed() {
  const storeId = state.storeId;
  el.closedStoreName.textContent = getStore(storeId).name;

  const dows = Closed.dows(storeId);
  el.dowToggles.innerHTML = '';
  DOW.forEach((name, dow) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dow-toggle' + (dows.includes(dow) ? ' is-on' : '')
      + (dow === 0 ? ' is-sun' : dow === 6 ? ' is-sat' : '');
    b.textContent = name;
    b.setAttribute('aria-pressed', dows.includes(dow) ? 'true' : 'false');
    b.addEventListener('click', () => {
      const now = Closed.dows(storeId);
      Closed.setDows(storeId, now.includes(dow) ? now.filter((n) => n !== dow) : [...now, dow]);
      renderClosed();
    });
    el.dowToggles.appendChild(b);
  });

  const ex = Closed.exceptions(storeId);
  const dates = Object.keys(ex).sort();
  el.exList.innerHTML = '';
  if (!dates.length) {
    const li = document.createElement('li');
    li.className = 'ex-list__empty';
    li.textContent = '登録なし';
    el.exList.appendChild(li);
  }
  dates.forEach((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const li = document.createElement('li');
    li.className = 'ex-list__item';
    li.innerHTML =
      `<span class="ex-list__date">${y}/${m}/${d}（${DOW[new Date(y, m - 1, d).getDay()]}）</span>` +
      `<span class="ex-list__kind ex-list__kind--${ex[dateStr]}">${ex[dateStr] === 'closed' ? '休業' : '営業'}</span>`;
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'ex-list__del';
    del.textContent = '削除';
    del.addEventListener('click', () => {
      Closed.setException(storeId, dateStr, null);
      renderClosed();
    });
    li.appendChild(del);
    el.exList.appendChild(li);
  });
}

function addClosedException() {
  const from = el.exFrom.value;
  const to = el.exTo.value || from;
  el.exHint.textContent = '';

  if (!from) { el.exHint.textContent = '開始日を選んでください。'; return; }
  if (to < from) { el.exHint.textContent = '終了日は開始日より後にしてください。'; return; }

  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const days = Math.round((end - start) / 86400000) + 1;
  if (days > 60) { el.exHint.textContent = '一度に登録できるのは60日までです。'; return; }

  for (let i = 0; i < days; i++) {
    const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    Closed.setException(state.storeId, ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()), el.exKind.value);
  }
  el.exHint.textContent = `${days}日分を「${el.exKind.value === 'closed' ? '休業' : '営業'}」で登録しました。`;
  el.exFrom.value = '';
  el.exTo.value = '';
  renderClosed();
}

/* ============================================================
 *  店舗選択（最初の画面）
 * ============================================================ */
/** その店舗の「◯区分 / ◯項目」を数える */
function countOf(storeId) {
  const secs = Checklists.sections(storeId).filter(alive);
  return {
    sections: secs.length,
    items: secs.reduce((n, s) => n + s.items.filter(alive).length, 0),
  };
}

function renderStorePicker() {
  el.storeGrid.innerHTML = '';
  STORES.forEach((store) => {
    const n = countOf(store.id);
    const dows = Closed.dows(store.id);

    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'store-card store-card--admin';
    b.style.setProperty('--card-color', store.color);

    const chip = document.createElement('span');
    chip.className = 'logo-chip logo-chip--card';
    if (store.logo) {
      const img = document.createElement('img');
      img.src = '../' + store.logo;
      img.alt = '';
      chip.appendChild(img);
    } else {
      chip.classList.add('is-fallback');
      chip.style.setProperty('--chip-color', store.color);
    }

    const name = document.createElement('span');
    name.className = 'store-card__name';
    name.textContent = store.name;

    const status = document.createElement('span');
    status.className = 'store-card__status';
    status.textContent = `${n.sections}区分 / ${n.items}項目`;

    const sub = document.createElement('span');
    sub.className = 'store-card__sub';
    sub.textContent = dows.length ? `毎週${dows.map((d) => DOW[d]).join('・')}曜定休` : '定休日なし';

    b.append(chip, name, status, sub);
    b.addEventListener('click', () => openStore(store.id));
    li.appendChild(b);
    el.storeGrid.appendChild(li);
  });
}

function openStore(storeId) {
  state.storeId = storeId;
  state.view = 'store';
  writeHash();
  renderAll();
  window.scrollTo(0, 0);
}

function goHome() {
  state.view = 'stores';
  writeHash();
  renderAll();
  window.scrollTo(0, 0);
}

/* -------- URLと画面を合わせる（端末の「戻る」で一覧へ戻れます） -------- */
function writeHash() {
  const want = state.view === 'stores' ? '#/stores' : `#/${state.storeId}`;
  if (location.hash !== want) location.hash = want;
}

function readHash() {
  const id = location.hash.replace(/^#\/?/, '').trim();
  if (!id || id === 'stores') { state.view = 'stores'; return; }
  if (STORES.some((s) => s.id === id)) { state.view = 'store'; state.storeId = id; return; }
  state.view = 'stores';
}

/* ============================================================
 *  店舗タブ
 * ============================================================ */
function renderStoreTabs() {
  el.storeTabs.innerHTML = '';
  STORES.forEach((store) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'store-tab' + (store.id === state.storeId ? ' is-active' : '');
    b.style.setProperty('--tab-color', store.color);

    const chip = document.createElement('span');
    chip.className = 'logo-chip logo-chip--tab';
    if (store.logo) {
      const img = document.createElement('img');
      img.src = '../' + store.logo;
      img.alt = '';
      chip.appendChild(img);
    } else {
      chip.classList.add('is-fallback');
      chip.style.setProperty('--chip-color', store.color);
    }
    const label = document.createElement('span');
    label.textContent = store.short;
    b.appendChild(chip);
    b.appendChild(label);

    b.addEventListener('click', () => openStore(store.id));
    el.storeTabs.appendChild(b);
  });
}

function renderAll() {
  const isStores = state.view === 'stores';

  el.viewStores.classList.toggle('is-hidden', !isStores);
  el.viewStore.classList.toggle('is-hidden', isStores);
  el.storeTabs.classList.toggle('is-hidden', isStores);

  if (isStores) {
    document.documentElement.style.setProperty('--store', '#2b7fd4');
    document.title = 'T3クローズ 管理';
    renderStorePicker();
    renderStaff();
    renderSyncStatus();
    return;
  }

  const store = getStore(state.storeId);
  document.documentElement.style.setProperty('--store', store.color);
  document.title = `${store.name}｜T3クローズ 管理`;
  renderStoreTabs();
  renderChecklistEditor();
  renderClosed();
  renderSyncStatus();
}

/* ============================================================
 *  共有の状態（ヘッダーのチップ）
 * ============================================================ */
function renderSyncStatus() {
  const s = Sync.status();
  if (s.kind === 'off') { el.syncChip.classList.add('is-hidden'); return; }
  el.syncChip.classList.remove('is-hidden');
  el.syncChip.className = `sync-chip sync-chip--${s.kind}`;
  el.syncChip.textContent = s.text === '同期済み' ? '保存済み' : s.text;
}

/* ============================================================
 *  管理用PIN
 * ============================================================ */
function openPinModal() {
  el.pinModal.classList.remove('is-hidden');
  el.pinError.textContent = '';
  el.pinInput.value = '';
  setTimeout(() => el.pinInput.focus(), 50);
}

async function submitPin() {
  const pin = el.pinInput.value.trim();
  if (!pin) { el.pinError.textContent = 'PINを入力してください。'; return; }

  el.pinError.textContent = '確認しています…';
  Sync.setPin(pin);
  await Sync.flush();

  if (!Sync.pin()) {
    el.pinError.textContent = Sync.lastError || 'PINが違います。もう一度入力してください。';
    return;
  }
  // 現場用PINで入られると設定を変えられないので、ここで弾いておく
  const check = await Sync.probeAdmin();
  if (!check.admin) {
    Sync.clearPin();
    el.pinError.textContent = check.error || 'これは現場用のPINです。管理用PINを入力してください。';
    return;
  }

  el.pinModal.classList.add('is-hidden');
  Sync.start();
  renderAll();
}

/* ============================================================
 *  バックアップ
 * ============================================================ */
function exportJson() {
  const blob = new Blob([Store.exportJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `T3クローズ_バックアップ_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    const ok = await askConfirm(file.name, 'いまの内容に上書きします。よろしいですか？');
    if (!ok) return;
    try {
      Store.importJson(String(reader.result));
      renderAll();
    } catch (e) {
      alert('読み込めませんでした。書き出したファイルを選んでください。');
    }
  };
  reader.readAsText(file);
}

/* ============================================================
 *  起動
 * ============================================================ */
function bindEvents() {
  el.homeBtn.addEventListener('click', goHome);
  el.backToStores.addEventListener('click', goHome);
  window.addEventListener('hashchange', () => { readHash(); renderAll(); });

  el.addSection.addEventListener('click', addSection);
  el.pauseAdd.addEventListener('click', addPause);
  el.pauseModal.querySelectorAll('[data-pause-close]').forEach((n) =>
    n.addEventListener('click', () => el.pauseModal.classList.add('is-hidden')));
  el.saveStaff.addEventListener('click', saveStaff);
  el.exAdd.addEventListener('click', addClosedException);
  el.exportBtn.addEventListener('click', exportJson);
  el.importFile.addEventListener('change', (e) => {
    if (e.target.files[0]) importJson(e.target.files[0]);
    e.target.value = '';
  });

  el.syncChip.addEventListener('click', () => Sync.flush());
  el.pinOk.addEventListener('click', submitPin);
  el.pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPin(); });
  el.pinReveal.addEventListener('click', () => {
    const shown = el.pinInput.type === 'text';
    el.pinInput.type = shown ? 'password' : 'text';
    el.pinReveal.textContent = shown ? '表示' : '隠す';
  });
}

function init() {
  if (APP.logo) el.appLogo.src = '../' + APP.logo;
  readHash();
  writeHash();
  bindEvents();
  renderAll();
  Updater.start();

  if (!Sync.enabled()) {
    // 共有先が未設定のときは、この端末の中だけで編集できます
    return;
  }
  Sync.onChange = renderSyncStatus;
  if (!Sync.pin()) openPinModal();
  else Sync.start();
}

init();
