/* ============================================================
 *  T3 Works Manage
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
  'viewStores', 'storeGrid',
  'viewMenu', 'menuTitle', 'menuGrid', 'menuBackBtn',
  'pageBar', 'pageBarName', 'pageBarRow', 'pageBarHome',
  'viewItems', 'viewWeekly', 'viewClosed', 'viewDrive',
  'itemsStoreName', 'itemsCount', 'checklistEditor', 'addSection', 'importDefaults',
  'undoImport', 'importNote',
  'weeklyStoreName', 'weeklyCount', 'weeklyEditor',
  'staffInput', 'saveStaff', 'staffCount', 'staffSaved',
  'driversInput', 'saveDrivers', 'driversCount', 'driversSaved',
  'catchStaffInput', 'saveCatchStaff', 'catchStaffCount', 'catchStaffSaved',
  'nippouFields', 'saveNippou', 'nippouCount', 'nippouSaved',
  'driveImport', 'driveImportLast', 'driveImportNote',
  'expImport', 'expImportLast', 'expImportNote',
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

/* 現場アプリと同じ「業務上の今日」を使います（朝6時で切り替わる）。
   深夜に項目を足しても、その日のページにちゃんと出ます */
function todayStr() {
  const t = businessDate();
  return ymd(t.getFullYear(), t.getMonth() + 1, t.getDate());
}
function tomorrowStr() {
  const t = businessDate();
  t.setDate(t.getDate() + 1);
  return ymd(t.getFullYear(), t.getMonth() + 1, t.getDate());
}
/** 重複しない項目ID。過去の記録と紐づくので、一度作ったら変えません */
function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 46656).toString(36)}`;
}

/** ¥1,234 の形にする（現場アプリの yenText と同じ） */
function yenText(n) {
  return '¥' + (Number(n) || 0).toLocaleString('ja-JP');
}

/**
 * 誤操作を防ぐための確認。OKなら true が返ります
 *
 *   askConfirm({ item: '駐車場代', message: '…', okLabel: '取り込む' })
 *
 * ★現場アプリ（js/app.js）の askConfirm と同じ書き方にそろえてあります。
 * ---------------------------------------------------------- */
function askConfirm({ item, message, okLabel }) {
  return new Promise((resolve) => {
    el.confirmItem.textContent = item;
    el.confirmMessage.textContent = message;
    el.confirmOk.textContent = okLabel || 'はい';
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

  row.appendChild(buildNameCell(sec, item));

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

/* ---- 項目名 ----
 *
 *  iPhone では入力欄を長押しすると文字選択が始まってしまい、
 *  長押しでの並べ替えができません。そこで普段はただの文字として置き、
 *  タップしたときだけ入力欄に差し替えます。
 */
function buildNameCell(sec, item) {
  const cell = document.createElement('div');
  cell.className = 'item-row__name';
  cell.textContent = item.label;
  cell.dataset.secId = sec.id;
  cell.dataset.itemId = item.id;
  cell.setAttribute('role', 'button');
  cell.setAttribute('tabindex', '0');
  cell.setAttribute('aria-label', `${item.label}（タップで名前を変更）`);

  cell.addEventListener('click', () => {
    if (justDragged) return; // 並べ替えた直後は編集に入らない
    startNameEdit(cell);
  });
  cell.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startNameEdit(cell); }
  });
  return cell;
}

/** 名前のところをタップしたとき、その場を入力欄に差し替える */
function startNameEdit(cell) {
  const before = cell.textContent;
  const { secId, itemId } = cell.dataset;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'item-row__name item-row__name--edit';
  input.value = before;
  input.setAttribute('aria-label', '項目の名前');
  cell.replaceWith(input);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  let closed = false;
  const finish = (keep) => {
    if (closed) return;
    closed = true;
    const text = input.value.trim();
    if (keep && text && text !== before) {
      if (secId === WEEKLY_SEC) {
        const next = currentWeekly();
        next.find((it) => it.id === itemId).label = text;
        saveWeekly(next); // 画面はまるごと描き直されます
        return;
      }
      const next = currentSections();
      next.find((s) => s.id === secId).items.find((it) => it.id === itemId).label = text;
      saveSections(next); // 画面はまるごと描き直されます
      return;
    }
    input.replaceWith(cell);
  };

  input.addEventListener('blur', () => finish(true));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = before; input.blur(); }
  });
}

/** 「28日だけ」「金土のみ」「休止中」など、その項目に付いている条件をすべて返す */
function specialTags(item) {
  const tags = [];
  if (item.onlyDays) tags.push(item.onlyDays.join('・') + '日だけ');
  if (item.onlyDows) tags.push(item.onlyDows.map((d) => DOW[d]).join('') + 'のみ');
  if (item.onlyMonths) tags.push(item.onlyMonths.join('・') + '月のみ');
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
  const cells = [...el.checklistEditor.querySelectorAll('.item-row__name')];
  const last = cells.reverse().find((c) => c.textContent === '新しい項目');
  if (last) startNameEdit(last);
}

async function removeItem(sec, item) {
  const ok = await askConfirm({
    item: item.label,
    message: 'この項目を明日から出さないようにします。過去の記録はそのまま残ります。',
  });
  if (!ok) return;
  const next = currentSections();
  const target = next.find((s) => s.id === sec.id).items.find((it) => it.id === item.id);
  target.retiredAt = tomorrowStr();
  saveSections(next);
}

/* ============================================================
 *  週間掃除の編集
 *
 *  毎日のチェック項目と違って区分がなく、ただの項目の並びです。
 *  並べ替え・名前の変更・削除の仕組みは上と同じものを使いたいので、
 *  見た目だけ「区分がひとつだけある」形にして、その区分IDを
 *  WEEKLY_SEC という決まった文字にしています。
 * ============================================================ */
const WEEKLY_SEC = '__weekly__';

/** いま編集中の店舗の週間掃除の項目（保存されていなければ config.js の初期値を複製） */
function currentWeekly() {
  return JSON.parse(JSON.stringify(Weeklies.items(state.storeId)));
}

/** 書き換えた内容を保存して、全端末へ送る */
function saveWeekly(items) {
  // 追加したその週に削除された項目は、どの週にも出ないので残さない
  const cleaned = items.filter((it) => !(it.addedAt && it.retiredAt && it.addedAt >= it.retiredAt));
  Weeklies.save(state.storeId, cleaned);
  renderWeeklyEditor();
}

function renderWeeklyEditor() {
  const items = currentWeekly();
  const live = items.filter(alive);
  const bi = live.filter(isBiweekly).length;

  el.weeklyStoreName.textContent = getStore(state.storeId).name;
  el.weeklyCount.textContent =
    `${live.length}項目` + (bi ? `（うち2週に1回 ${bi}）` : '');

  el.weeklyEditor.innerHTML = '';

  /* 掃除する場所ごとに1枚のカード。
     まだ項目が無い場所（トイレなど）も、足せるように空のまま出します */
  const found = groupWeekly(live);
  const names = WEEKLY_GROUPS.slice();
  found.forEach((g) => { if (!names.includes(g.name)) names.push(g.name); });

  names.forEach((name) => {
    const list = (found.find((g) => g.name === name) || { items: [] }).items;

    const card = document.createElement('div');
    card.className = 'sec-card';
    card.dataset.secId = WEEKLY_SEC;

    const head = document.createElement('div');
    head.className = 'sec-card__head';
    const title = document.createElement('span');
    title.className = 'sec-card__name sec-card__name--fixed';
    title.textContent = name;
    head.appendChild(title);
    const count = document.createElement('span');
    count.className = 'admin-count';
    count.textContent = `${list.length}項目`;
    head.appendChild(count);
    card.appendChild(head);

    if (!list.length) {
      const p = document.createElement('p');
      p.className = 'admin-empty';
      p.textContent = 'まだ項目がありません。';
      card.appendChild(p);
    }

    list.forEach((item, i) => {
      card.appendChild(buildWeeklyRow(item, i, list.length));
    });

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'sec-card__add';
    add.textContent = '＋ 項目を追加';
    add.addEventListener('click', () => addWeeklyItem(name));
    card.appendChild(add);

    el.weeklyEditor.appendChild(card);
  });
}

function buildWeeklyRow(item, index, count) {
  const row = document.createElement('div');
  row.className = 'item-row item-row--weekly';
  row.dataset.itemId = item.id;
  row.addEventListener('pointerdown', (e) => startLongPress(e, row));

  row.appendChild(buildNameCell({ id: WEEKLY_SEC }, item));

  /* 掃除する場所の入れ替え。押すたびに次の場所へ移ります */
  const group = document.createElement('button');
  group.type = 'button';
  group.className = 'every-btn every-btn--group';
  group.textContent = weeklyGroupOf(item);
  group.title = '掃除する場所を変えます（押すたびに次の場所へ移ります）';
  group.addEventListener('click', () => cycleWeeklyGroup(item.id));
  row.appendChild(group);

  /* 毎週／2週に1回 の切り替え。押すたびに入れ替わります */
  const every = document.createElement('button');
  every.type = 'button';
  every.className = 'every-btn' + (isBiweekly(item) ? ' every-btn--bi' : '');
  every.textContent = isBiweekly(item) ? '2週' : '毎週';
  every.title = isBiweekly(item)
    ? '2週間に1回でよい項目です（押すと毎週に戻ります）'
    : '毎週やる項目です（押すと2週に1回になります）';
  every.addEventListener('click', () => toggleWeeklyEvery(item.id));
  row.appendChild(every);

  row.appendChild(moveButton('↑', index > 0, () => moveItem(WEEKLY_SEC, item.id, -1)));
  row.appendChild(moveButton('↓', index < count - 1, () => moveItem(WEEKLY_SEC, item.id, 1)));

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'icon-btn icon-btn--danger';
  del.textContent = '×';
  del.title = '削除';
  del.addEventListener('click', () => removeWeeklyItem(item));
  row.appendChild(del);

  return row;
}

function addWeeklyItem(group) {
  const next = currentWeekly();
  next.push({
    id: newId('wk'),
    label: '新しい項目',
    group: group || WEEKLY_GROUPS[0], // 押したカードの場所に入れる
    addedAt: todayStr(),              // 今週から出す（過ぎた週にはさかのぼらせない）
  });
  saveWeekly(next);

  // 追加した項目にすぐ名前を入れられるようにしておく
  const cells = [...el.weeklyEditor.querySelectorAll('.item-row__name')];
  const last = cells.reverse().find((c) => c.textContent === '新しい項目');
  if (last) startNameEdit(last);
}

/** 掃除する場所を次のものへ移す（ホール→キッチン→トイレ→ホール…） */
function cycleWeeklyGroup(itemId) {
  const next = currentWeekly();
  const item = next.find((it) => it.id === itemId);
  if (!item) return;
  const at = WEEKLY_GROUPS.indexOf(weeklyGroupOf(item));
  // 一覧に無い場所（その他など）だったときは、先頭の場所へ入れます
  item.group = WEEKLY_GROUPS[(at + 1) % WEEKLY_GROUPS.length] || WEEKLY_GROUPS[0];
  saveWeekly(next);
}

/** 毎週 ⇄ 2週に1回 を入れ替える */
function toggleWeeklyEvery(itemId) {
  const next = currentWeekly();
  const item = next.find((it) => it.id === itemId);
  if (!item) return;
  if (isBiweekly(item)) delete item.every;
  else item.every = 'biweek';
  saveWeekly(next);
}

async function removeWeeklyItem(item) {
  const ok = await askConfirm({
    item: item.label,
    message: 'この項目を来週から出さないようにします。今週までの記録はそのまま残ります。',
  });
  if (!ok) return;
  const next = currentWeekly();
  next.find((it) => it.id === item.id).retiredAt = tomorrowStr();
  saveWeekly(next);
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
  const ok = await askConfirm({
    item: sec.title,
    message: `この区分と、中の${n}項目をまとめて明日から出さないようにします。過去の記録はそのまま残ります。`,
  });
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
let justDragged = false; // 並べ替え直後の click で編集に入らないようにする

function startLongPress(e, row) {
  // ボタンを押したとき、名前を編集中のときは並べ替えを始めない
  if (e.target.closest('.icon-btn, .every-btn')) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
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
  justDragged = true;
  setTimeout(() => { justDragged = false; }, 400);

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
  if (secId === WEEKLY_SEC) {
    const next = currentWeekly();
    const sorted = sortByOrder(next, orderedIds);
    if (sorted) saveWeekly(sorted);
    return;
  }

  const next = currentSections();
  const sec = next.find((s) => s.id === secId);
  if (!sec) return;

  const sorted = sortByOrder(sec.items, orderedIds);
  if (!sorted) return; // 並びが変わっていなければ保存しない
  sec.items = sorted;
  saveSections(next);
}

/** 画面の並びどおりに並べ替えた配列。変化がなければ null */
function sortByOrder(items, orderedIds) {
  const byId = {};
  items.forEach((it) => { byId[it.id] = it; });
  const live = orderedIds.map((id) => byId[id]).filter(Boolean);
  const rest = items.filter((it) => !orderedIds.includes(it.id));

  const next = live.concat(rest);
  if (next.map((it) => it.id).join(',') === items.map((it) => it.id).join(',')) return null;
  return next;
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
  if (secId === WEEKLY_SEC) {
    const next = currentWeekly();
    // 同じ場所（ホールならホール）の中だけで入れ替えます
    const item = next.find((it) => it.id === itemId);
    if (!item) return;
    const g = weeklyGroupOf(item);
    const sameGroup = (it) => alive(it) && weeklyGroupOf(it) === g;
    if (swapWithin(next, sameGroup, itemId, dir)) saveWeekly(next);
    return;
  }
  const next = currentSections();
  const items = next.find((s) => s.id === secId).items;
  if (swapWithin(items, alive, itemId, dir)) saveSections(next);
}

/* ============================================================
 *  用意された内容（config.js）を取り込む
 *
 *  一度この画面で編集すると、以降は保存された内容が使われます。
 *  そのため、あとから config.js 側で表記や並びを整えても届きません。
 *  この取り込みは、項目IDを目印にして次のように合わせます。
 *
 *    ・両方にある項目 … 名前・並び順・曜日の設定を config.js に合わせる
 *                      （休止期間・削除・追加日は、いまの設定を残す）
 *    ・config.js だけにある項目 … 今日から出る項目として足す
 *    ・この画面で追加した項目 … 消さずに区分の最後へ残す
 * ============================================================ */
/** 取り込んだら何が変わるかを、先に数えておく */
function importDiff(before, after) {
  const oldById = {};
  before.forEach((s) => s.items.forEach((i) => { oldById[i.id] = { label: i.label, sec: s.title }; }));

  let renamed = 0;
  let added = 0;
  let moved = false;

  after.forEach((s) => s.items.forEach((i) => {
    const o = oldById[i.id];
    if (!o) { added += 1; return; }
    if (o.label !== i.label) renamed += 1;
  }));

  const seq = (list) => list.map((s) => s.title + ':' + s.items.map((i) => i.id).join(',')).join('|');
  moved = seq(before) !== seq(after);

  return { renamed, added, moved, none: !renamed && !added && !moved };
}

async function importDefaults() {
  const store = getStore(state.storeId);
  const before = currentSections();
  const after = buildImported();
  const diff = importDiff(before, after);

  if (diff.none) {
    el.importNote.textContent = `${store.name} は用意された内容と同じです。変わるところはありません。`;
    return;
  }

  const lines = [];
  if (diff.renamed) lines.push(`名前が変わる項目：${diff.renamed}件`);
  if (diff.added) lines.push(`新しく増える項目：${diff.added}件（今日から表示）`);
  if (diff.moved) lines.push('並び順が変わります');
  lines.push('この画面で追加した項目は消えず、区分の最後に残ります。');
  lines.push('取り込んだあとでも「取り込みを取り消す」で元に戻せます。');

  const ok = await askConfirm({ item: store.name, message: lines.join('\n') });
  if (!ok) return;

  // 元に戻せるよう、直前の状態を控えておく
  localStorage.setItem(UNDO_KEY, JSON.stringify({ storeId: state.storeId, sections: before }));
  saveSections(after);
  el.importNote.textContent =
    `取り込みました（名前${diff.renamed}件 / 追加${diff.added}件）。元に戻す場合は右のボタンを押してください。`;
  renderUndo();
}

/** 取り込みを取り消して、直前の状態に戻す */
async function undoImport() {
  const saved = readUndo();
  if (!saved) return;
  const ok = await askConfirm({
    item: getStore(saved.storeId).name,
    message: '取り込む前の状態に戻します。よろしいですか？',
  });
  if (!ok) return;
  Checklists.save(saved.storeId, saved.sections);
  localStorage.removeItem(UNDO_KEY);
  el.importNote.textContent = '取り込む前の状態に戻しました。';
  renderChecklistEditor();
  renderUndo();
}

const UNDO_KEY = APP.storageKey + ':importUndo';

function readUndo() {
  try {
    const v = JSON.parse(localStorage.getItem(UNDO_KEY) || 'null');
    return v && v.storeId === state.storeId ? v : null;
  } catch (e) {
    return null;
  }
}

function renderUndo() {
  el.undoImport.classList.toggle('is-hidden', !readUndo());
}

/** 取り込んだ結果を作る（保存はしません） */
function buildImported() {
  const today = todayStr();
  const rest = {};
  currentSections().forEach((s) => { rest[s.id] = s; });

  const merged = defaultChecklist(state.storeId).map((ds) => {
    const cs = rest[ds.id];
    delete rest[ds.id];

    const leftover = {};
    (cs ? cs.items : []).forEach((it) => { leftover[it.id] = it; });

    const items = ds.items.map((di) => {
      const ci = leftover[di.id];
      delete leftover[di.id];
      if (!ci) return { ...di, addedAt: today }; // 新しく増えた項目は今日から
      const next = { ...di };                    // 名前・曜日は用意された内容
      if (ci.addedAt) next.addedAt = ci.addedAt; // いつからか・いつまでかは今の設定を残す
      if (ci.retiredAt) next.retiredAt = ci.retiredAt;
      if (ci.pauses) next.pauses = ci.pauses;
      return next;
    });
    Object.keys(leftover).forEach((id) => items.push(leftover[id]));

    const sec = { ...ds, items };
    if (cs && cs.retiredAt) sec.retiredAt = cs.retiredAt;
    return sec;
  });

  Object.keys(rest).forEach((id) => merged.push(rest[id]));
  return merged;
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
 *  交通費（配達記録アプリ）
 * ============================================================ */
function renderDrivers() {
  const names = Drivers.list();
  el.driversInput.value = names.join('\n');
  el.driversCount.textContent = `${names.length}人`;
  el.driveImportNote.textContent = '';
}

function renderCatchStaff() {
  const names = CatchStaff.list();
  el.catchStaffInput.value = names.join('\n');
  el.catchStaffCount.textContent = names.length ? `${names.length}人` : 'まだ登録なし';
}

/** 店舗ごとの日報フォルダ。会議資料の「日報から取り込む」で使います */
function renderNippouFolders() {
  const saved = NippouFolders.all();
  const n = STORES.filter((s) => saved[s.id]).length;
  el.nippouCount.textContent = n ? `${n}／${STORES.length}店舗` : 'まだ登録なし';

  el.nippouFields.innerHTML = '';
  STORES.forEach((s) => {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    const label = document.createElement('span');
    label.className = 'field__label';
    label.textContent = s.name;
    const input = document.createElement('input');
    input.type = 'url';
    input.className = 'field__input';
    input.dataset.store = s.id;
    input.placeholder = 'https://drive.google.com/drive/folders/…';
    input.value = saved[s.id] || '';
    wrap.append(label, input);
    el.nippouFields.appendChild(wrap);
  });
}

function saveNippouFolders() {
  const map = {};
  [...el.nippouFields.querySelectorAll('input[data-store]')].forEach((i) => {
    map[i.dataset.store] = i.value;
  });
  NippouFolders.save(map);
  renderNippouFolders();
  el.nippouSaved.classList.remove('is-hidden');
  setTimeout(() => el.nippouSaved.classList.add('is-hidden'), 2500);
}

function saveCatchStaff() {
  CatchStaff.saveFromText(el.catchStaffInput.value);
  renderCatchStaff();
  el.catchStaffSaved.classList.remove('is-hidden');
  setTimeout(() => el.catchStaffSaved.classList.add('is-hidden'), 2500);
}

function saveDrivers() {
  Drivers.saveFromText(el.driversInput.value);
  renderDrivers();
  el.driversSaved.classList.remove('is-hidden');
  setTimeout(() => el.driversSaved.classList.add('is-hidden'), 2500);
}

/**
 * Numbers に入っていた2026年分を取り込む
 *
 * 項目の番号を「imp-2026-01-0」のように決め打ちにしてあるので、
 * 何度押しても同じところに上書きされ、二重には増えません。
 */
async function importDriveRecords(only) {
  const all = Object.keys(DRIVE_IMPORT);
  const months = only ? [all[all.length - 1]] : all;
  const total = months.reduce((n, m) => n + DRIVE_IMPORT[m].length, 0);

  const ok = await askConfirm({
    item: months.length === 1
      ? `${months[0]}　${total}件`
      : `${months[0]} 〜 ${months[months.length - 1]}　${total}件`,
    message: 'Numbers に入っていた配達の記録を、配達記録アプリに入れます。よろしいですか？',
    okLabel: '取り込む',
  });
  if (!ok) return;

  months.forEach((month) => {
    DRIVE_IMPORT[month].forEach((row, i) => {
      const [d, by, one, km] = row;
      Store.setItem(DRIVE_STORE, month, `imp-${month}-${i}`, {
        done: true, d, by, one, km,
      });
    });
  });

  const km = months.reduce(
    (t, m) => driveKm(t, ...DRIVE_IMPORT[m].map((r) => r[3])), 0
  );
  el.driveImportNote.textContent =
    `${total}件（${months.length}か月分・合計 ${km.toFixed(1)}km）を取り込みました。`
    + '配達記録アプリで確かめてください。';
  renderSyncStatus();
}

/**
 * スプレッドシート「00＿2026__支払い金額管理表」の2026年分を取り込む
 *
 * 配達記録の取り込みと同じ考え方です。項目の番号を
 * 「exp-2026-01-0」のように決め打ちにしてあるので、
 * 何度押しても同じところに上書きされ、二重には増えません。
 */
async function importExpenseRecords(only) {
  const all = Object.keys(EXPENSE_IMPORT);
  const months = only ? [all[all.length - 1]] : all;
  const rows = months.reduce((list, m) => list.concat(EXPENSE_IMPORT[m]), []);
  const yen = rows.reduce((t, r) => t + r[6], 0);

  const ok = await askConfirm({
    item: months.length === 1
      ? `${months[0]}　${rows.length}件　${yenText(yen)}`
      : `${months[0]} 〜 ${months[months.length - 1]}　${rows.length}件　${yenText(yen)}`,
    message: 'スプレッドシートに入っていた立替金の記録を、現金支払管理表に入れます。よろしいですか？',
    okLabel: '取り込む',
  });
  if (!ok) return;

  months.forEach((month) => {
    EXPENSE_IMPORT[month].forEach((row, i) => {
      const [d, by, kind, store, people, label, y, receipt] = row;
      Store.setItem(EXPENSE_STORE, month, `exp-${month}-${i}`, {
        done: true, d, by, kind, store, people, label,
        yen: y, receipt: !!receipt,
      });
    });
  });

  // ★担当者リストには足しません。辞めた人の名前が
  //   新しい記録のプルダウンに戻ってきてしまうためです。
  //   過去の記録は e.by の名前で出るので、リストに無くても正しく並びます
  const gone = [...new Set(rows.map((r) => r[1]))].filter((n) => !Staff.list().includes(n));

  el.expImportNote.textContent =
    `${rows.length}件（${months.length}か月分・合計 ${yenText(yen)}）を取り込みました。`
    + (gone.length ? `${gone.join('・')} は担当者リストに無い名前ですが、過去の記録はそのまま出ます。` : '')
    + 'アプリの現金支払管理表で確かめてください。';
  renderSyncStatus();
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
/** その店舗の「◯区分 / ◯項目」と、週間掃除の項目数を数える */
function countOf(storeId) {
  const secs = Checklists.sections(storeId).filter(alive);
  return {
    sections: secs.length,
    items: secs.reduce((n, s) => n + s.items.filter(alive).length, 0),
    weekly: Weeklies.items(storeId).filter(alive).length,
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
    sub.textContent =
      (dows.length ? `毎週${dows.map((d) => DOW[d]).join('・')}曜定休` : '定休日なし') +
      `　週間掃除 ${n.weekly}項目`;

    b.append(chip, name, status, sub);
    b.addEventListener('click', () => openStore(store.id));
    li.appendChild(b);
    el.storeGrid.appendChild(li);
  });
}

function openStore(storeId) {
  state.storeId = storeId;
  // 店舗タブから切り替えたときは、同じ設定を開いたままにする
  if (!getPage(state.view)) state.view = 'menu';
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

/* -------- URLと画面を合わせる（端末の「戻る」で一覧へ戻れます） --------
 *
 *   #/stores            店舗をえらぶ
 *   #/{店舗}            設定をえらぶ
 *   #/{店舗}/{設定}     その設定の画面
 *
 * 現場アプリと同じ3段の作りです。設定を増やすときは ADMIN_PAGES に足します。
 */
/* 現場側のページ名（config.js の TASKS）と同じ呼び方にそろえます */
const ADMIN_PAGES = [
  { id: 'items',  name: 'クローズ', sub: '閉店時の確認項目',   icon: '🌙' },
  { id: 'weekly', name: '週間掃除', sub: '2週間ごとの掃除項目', icon: '🧹' },
  { id: 'closed', name: '定休日',   sub: '曜日と臨時の休業',   icon: '🗓' },
  // 交通費（配達記録アプリ）は、デリバリーをやっているバグるだけに出します
  {
    id: 'drive', name: '交通費', sub: '配達記録アプリの名前', icon: '🛵',
    when: (storeId) => storeId === DRIVE_SHOP,
  },
];

/** その店舗で使えるページだけ */
function pageList(storeId) {
  return ADMIN_PAGES.filter((p) => typeof p.when !== 'function' || p.when(storeId));
}

function getPage(id, storeId) {
  const page = ADMIN_PAGES.find((p) => p.id === id) || null;
  if (!page) return null;
  // 使えない店舗のURLを直接開かれた場合は、無いものとして扱います
  if (storeId && typeof page.when === 'function' && !page.when(storeId)) return null;
  return page;
}

function writeHash() {
  let want = '#/stores';
  if (state.view === 'menu') want = `#/${state.storeId}`;
  else if (state.view !== 'stores') want = `#/${state.storeId}/${state.view}`;
  if (location.hash !== want) location.hash = want;
}

function readHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter((s) => s !== '');
  const [id, page] = parts;
  if (!id || id === 'stores' || !STORES.some((s) => s.id === id)) {
    state.view = 'stores';
    return;
  }
  state.storeId = id;
  state.view = getPage(page, id) ? page : 'menu';
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

/** その設定のいまの状態（メニューに出す短い文字） */
function pageStatus(pageId, storeId) {
  if (pageId === 'items') {
    const secs = Checklists.sections(storeId).filter(alive);
    const n = secs.reduce((t, s) => t + s.items.filter(alive).length, 0);
    return `${secs.length}区分 / ${n}項目`;
  }
  if (pageId === 'weekly') {
    const items = Weeklies.items(storeId).filter(alive);
    const bi = items.filter(isBiweekly).length;
    return `${items.length}項目` + (bi ? `（2週 ${bi}）` : '');
  }
  if (pageId === 'closed') {
    const dows = Closed.dows(storeId);
    const ex = Object.keys(Closed.exceptions(storeId)).length;
    return (dows.length ? `毎週${dows.map((d) => DOW[d]).join('・')}曜` : '定休日なし')
      + (ex ? ` / 臨時${ex}日` : '');
  }
  if (pageId === 'drive') return `${Drivers.list().length}人`;
  return '';
}

function renderMenu() {
  const store = getStore(state.storeId);
  el.menuTitle.textContent = store.name;
  el.menuGrid.innerHTML = '';

  pageList(store.id).forEach((page) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'task-card';
    b.style.setProperty('--card-color', store.color);

    // 現場アプリの業務えらびと同じ見た目にそろえます
    const icon = document.createElement('span');
    icon.className = 'task-card__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = page.icon || '';

    const main = document.createElement('span');
    main.className = 'task-card__main';
    const name = document.createElement('span');
    name.className = 'task-card__name';
    name.textContent = page.name;
    const sub = document.createElement('span');
    sub.className = 'task-card__sub';
    sub.textContent = page.sub;
    main.append(name, sub);

    const status = document.createElement('span');
    status.className = 'task-card__status';
    status.textContent = pageStatus(page.id, store.id);

    b.append(icon, main, status);
    b.addEventListener('click', () => openPage(page.id));
    li.appendChild(b);
    el.menuGrid.appendChild(li);
  });
}

function openPage(pageId) {
  state.view = pageId;
  writeHash();
  renderAll();
  window.scrollTo(0, 0);
}

function goMenu() {
  state.view = 'menu';
  writeHash();
  renderAll();
  window.scrollTo(0, 0);
}

function renderAll() {
  const isStores = state.view === 'stores';
  const isMenu = state.view === 'menu';
  const page = getPage(state.view, state.storeId);

  el.viewStores.classList.toggle('is-hidden', !isStores);
  el.viewMenu.classList.toggle('is-hidden', !isMenu);
  el.storeTabs.classList.toggle('is-hidden', isStores);
  el.pageBarRow.classList.toggle('is-hidden', !page);
  el.viewItems.classList.toggle('is-hidden', state.view !== 'items');
  el.viewWeekly.classList.toggle('is-hidden', state.view !== 'weekly');
  el.viewClosed.classList.toggle('is-hidden', state.view !== 'closed');
  el.viewDrive.classList.toggle('is-hidden', state.view !== 'drive');

  if (isStores) {
    document.documentElement.style.setProperty('--store', '#2b7fd4');
    document.title = 'T3 Works Manage';
    renderStorePicker();
    renderStaff();
    renderCatchStaff();
    renderNippouFolders();
    renderSyncStatus();
    return;
  }

  const store = getStore(state.storeId);
  document.documentElement.style.setProperty('--store', store.color);
  document.title = `${store.name}｜T3 Works Manage`;
  renderStoreTabs();
  renderSyncStatus();

  if (isMenu) { renderMenu(); return; }

  el.pageBarName.textContent = page.name;
  if (state.view === 'items') {
    renderChecklistEditor();
    el.importNote.textContent = '';
    renderUndo();
  } else if (state.view === 'weekly') {
    renderWeeklyEditor();
  } else if (state.view === 'closed') {
    renderClosed();
  } else if (state.view === 'drive') {
    renderDrivers();
  }
}

/* ============================================================
 *  共有の状態（ヘッダーのチップ）
 * ============================================================ */
function renderSyncStatus() {
  const s = Sync.status();
  if (s.kind === 'off') { el.syncChip.classList.add('is-hidden'); return; }
  el.syncChip.classList.remove('is-hidden');
  // 文字は出さず、形と色だけで見せます（現場アプリと同じしるしです）
  const text = s.text === '同期済み' ? '保存済み' : s.text;
  el.syncChip.className = `sync-chip sync-chip--${s.kind}`;
  el.syncChip.innerHTML = Sync.iconSvg(s.kind);
  el.syncChip.title = `${text}（タップで今すぐ保存）`;
  el.syncChip.setAttribute('aria-label', `保存の状態：${text}`);
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
  // 全角で入れても通るように、半角に直してから確かめます
  const pin = toHalfWidth(el.pinInput.value).trim();
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
  a.download = `T3Works_バックアップ_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    const ok = await askConfirm({
      item: file.name,
      message: 'いまの内容に上書きします。よろしいですか？',
    });
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
  el.menuBackBtn.addEventListener('click', goHome);
  el.pageBar.addEventListener('click', goMenu);
  // 設定のページから、店舗選択まで一気に戻る
  el.pageBarHome.addEventListener('click', goHome);
  window.addEventListener('hashchange', () => { readHash(); renderAll(); });

  el.addSection.addEventListener('click', addSection);
  el.importDefaults.addEventListener('click', importDefaults);
  el.undoImport.addEventListener('click', undoImport);
  el.pauseAdd.addEventListener('click', addPause);
  el.pauseModal.querySelectorAll('[data-pause-close]').forEach((n) =>
    n.addEventListener('click', () => el.pauseModal.classList.add('is-hidden')));
  el.saveStaff.addEventListener('click', saveStaff);
  el.saveDrivers.addEventListener('click', saveDrivers);
  el.saveCatchStaff.addEventListener('click', saveCatchStaff);
  el.saveNippou.addEventListener('click', saveNippouFolders);
  el.driveImportLast.addEventListener('click', () => importDriveRecords(true));
  el.driveImport.addEventListener('click', () => importDriveRecords(false));
  el.expImportLast.addEventListener('click', () => importExpenseRecords(true));
  el.expImport.addEventListener('click', () => importExpenseRecords(false));
  el.exAdd.addEventListener('click', addClosedException);
  el.exportBtn.addEventListener('click', exportJson);
  el.importFile.addEventListener('change', (e) => {
    if (e.target.files[0]) importJson(e.target.files[0]);
    e.target.value = '';
  });

  el.syncChip.addEventListener('click', () => Sync.flush());
  el.pinOk.addEventListener('click', submitPin);
  el.pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPin(); });
  bindHalfWidthInput(el.pinInput, 'code');
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
