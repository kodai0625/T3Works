/* ============================================================
 *  画面の組み立てと操作
 *  URL の形： #/店舗id/YYYY-MM-DD/表示(day|month)
 *  例：      #/kojare/2026-08-08/day
 *  → 店舗ごとにURLが分かれるので、店舗別のリンク共有もできます。
 * ============================================================ */

const DOW = ['日', '月', '火', '水', '木', '金', '土'];
const pad2 = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

const today = new Date();
const TODAY = { y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() };
const TODAY_STR = ymd(TODAY.y, TODAY.m, TODAY.d);

/* ---------- 画面の状態 ---------- */
const state = {
  storeId: '', // 空 = まだ店舗を選んでいない（店舗選択画面を出す）
  y: TODAY.y,
  m: TODAY.m,
  d: TODAY.d,
  view: 'stores',
};

/* ---------- 要素 ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  appTitle: $('appTitle'), appCompany: $('appCompany'), appLogo: $('appLogo'),
  storeTabs: $('storeTabs'), storeName: $('storeNameLabel'), storeLogo: $('storeLogo'),
  storeClosedBadge: $('storeClosedBadge'),
  yearLabel: $('yearLabel'), monthTabs: $('monthTabs'), dayTabs: $('dayTabs'),
  viewDay: $('viewDay'), viewMonth: $('viewMonth'),
  viewTasks: $('viewTasks'), taskGrid: $('taskGrid'),
  tasksTitle: $('tasksTitle'), tasksDate: $('tasksDate'),
  taskBarName: $('taskBarName'),
  viewStores: $('viewStores'), storeGrid: $('storeGrid'), storesDate: $('storesDate'),
  viewReport: $('viewReport'), storeHead: $('storeHead'),
  submitCard: $('submitCard'), submitStatus: $('submitStatus'),
  submitBtn: $('submitBtn'), unsubmitBtn: $('unsubmitBtn'),
  reportDate: $('reportDate'), reportSummary: $('reportSummary'), reportList: $('reportList'),
  syncChip: $('syncChip'), syncInfo: $('syncInfo'), syncField: $('syncField'),
  pinModal: $('pinModal'), pinInput: $('pinInput'), pinError: $('pinError'),
  dayNum: $('dayNum'), dayDow: $('dayDow'),
  progressBar: $('dayProgressBar'), progressText: $('dayProgressText'),
  checklist: $('checklistArea'), note: $('dayNote'), updated: $('dayUpdated'),
  closedNotice: $('closedNotice'), noteCard: $('noteCard'), staffRow: $('staffRow'),
  overrideTag: $('overrideTag'), closedToggle: $('closedToggle'), overrideReset: $('overrideReset'),
  staffSelect: $('dayStaff'),
  monthSummary: $('monthSummary'), monthTable: $('monthTable'),
  viewWeek: $('viewWeek'), weekTable: $('weekTable'), weekTableWrap: $('weekTableWrap'),
  weekEmpty: $('weekEmpty'), weekNote: $('weekNote'), weekNoteCard: $('weekNoteCard'),
  weekNavMain: $('weekNavMain'), weekNavSub: $('weekNavSub'),
  periodCard: $('periodCard'), periodTitle: $('periodTitle'), periodRate: $('periodRate'),
  periodBar: $('periodBar'), periodCount: $('periodCount'), periodWhen: $('periodWhen'),
  weekSubmitCard: $('weekSubmitCard'), weekSubmitRange: $('weekSubmitRange'),
  weekSubmitRate: $('weekSubmitRate'), weekSubmitHint: $('weekSubmitHint'),
  periodSubmit: $('periodSubmit'), periodStaff: $('periodStaff'),
  periodSubmitBtn: $('periodSubmitBtn'), periodDone: $('periodDone'),
  periodDoneMeta: $('periodDoneMeta'),
  viewWeekAll: $('viewWeekAll'), weekAllRange: $('weekAllRange'),
  weekAllSummary: $('weekAllSummary'), weekAllList: $('weekAllList'),
  doerModal: $('doerModal'), doerItem: $('doerItem'), doerWeek: $('doerWeek'),
  doerGrid: $('doerGrid'), doerClear: $('doerClear'),
  settingsBtn: $('settingsBtn'), modal: $('modal'),
  confirmDialog: $('confirmDialog'), confirmItem: $('confirmItem'),
  confirmMessage: $('confirmMessage'), confirmOk: $('confirmOk'),
};

/* ============================================================
 *  URL（ハッシュ）の読み書き
 * ============================================================ */
/* URLの形
 *   #/                          店舗をえらぶ
 *   #/{店舗}                    業務をえらぶ
 *   #/{店舗}/{業務}             その業務の画面（日付は今日）
 *   #/{店舗}/{業務}/{YYYY-MM-DD} 日付つき
 *   #/report/{YYYY-MM-DD}       全店舗の提出記録（店舗に属さない）
 *   #/weekall/{YYYY-MM-DD}      全店舗の週間掃除 達成状況
 */
const ALL_STORE_VIEWS = ['report', 'weekall'];

function readHash() {
  const parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter((s) => s !== '');
  const [first, second, third] = parts;

  const setDate = (str) => {
    const md = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '');
    if (!md) return;
    const y = +md[1], m = +md[2], d = +md[3];
    if (m < 1 || m > 12) return;
    state.y = y;
    state.m = m;
    state.d = Math.min(Math.max(d, 1), daysInMonth(y, m));
  };

  /* 全店舗の画面（店舗に属さない） */
  if (ALL_STORE_VIEWS.includes(first)) {
    state.storeId = '';
    state.view = first;
    setDate(second);
    return;
  }

  state.storeId = STORES.some((s) => s.id === first) ? first : '';
  if (!state.storeId) {
    state.view = 'stores';
    return;
  }

  setDate(third);
  const task = getTask(second);
  if (!task || (typeof task.when === 'function' && !task.when())) {
    // 業務が指定されていない／使えない業務なら、業務をえらぶ画面
    state.view = 'tasks';
    return;
  }
  state.view = task.id;
}


function writeHash(replace = false) {
  let hash = '#/';
  if (ALL_STORE_VIEWS.includes(state.view)) {
    hash = `#/${state.view}/${ymd(state.y, state.m, state.d)}`;
  } else if (state.storeId && state.view === 'tasks') {
    hash = `#/${state.storeId}`;
  } else if (state.storeId) {
    hash = `#/${state.storeId}/${state.view}/${ymd(state.y, state.m, state.d)}`;
  }
  if (location.hash === hash) return;
  if (replace) history.replaceState(null, '', hash);
  else location.hash = hash;
}

/* ============================================================
 *  集計ヘルパー
 * ============================================================ */
function allItems(storeId) {
  return getChecklist(storeId).flatMap((sec) => sec.items);
}

/** その日が定休日か（表示中の年月の d 日）。設定画面の内容と個別の例外を反映 */
function closedOn(storeId, d) {
  return Closed.isClosed(storeId, state.y, state.m, d);
}

/** その日に確認すべき項目だけ。定休日は 0 件（ignoreClosed=true なら定休日でも中身を返す） */
function itemsForDay(storeId, d, ignoreClosed = false) {
  const store = getStore(storeId);
  if (!ignoreClosed && closedOn(storeId, d)) return [];
  // 区分に付いた曜日の指定も効かせるため、区分ごとに絞り込む
  return getChecklist(storeId).flatMap((sec) =>
    sec.items.filter((it) => appliesTo(it, store, state.y, state.m, d, sec)));
}

/** セクション内で、その日に確認すべき項目だけ */
function sectionItemsForDay(sec, storeId, d, ignoreClosed = false) {
  const store = getStore(storeId);
  if (!ignoreClosed && closedOn(storeId, d)) return [];
  return sec.items.filter((it) => appliesTo(it, store, state.y, state.m, d, sec));
}

/** その日に何か入力されているか（定休日でもデータがあれば隠さない） */
function hasAnyData(rec) {
  return !!rec && (Object.keys(rec.items || {}).length > 0 || !!rec.note || !!rec.staff);
}

/** いま表示している日の対象項目（定休日でも入力済みなら中身を出す） */
function selectedDayItems() {
  const rec = Store.getDay(state.storeId, ymd(state.y, state.m, state.d));
  const ignoreClosed = closedOn(state.storeId, state.d) && hasAnyData(rec);
  return itemsForDay(state.storeId, state.d, ignoreClosed);
}

/** レコードの完了数 */
function countDone(record, items) {
  if (!record) return 0;
  return items.reduce((n, it) => n + (record.items?.[it.id]?.done ? 1 : 0), 0);
}

/* ============================================================
 *  描画：店舗タブ
 * ============================================================ */
function renderStoreTabs() {
  el.storeTabs.innerHTML = '';
  STORES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'store-tab' + (s.id === state.storeId ? ' is-active' : '');
    b.style.setProperty('--tab-color', s.color);

    const chip = document.createElement('span');
    chip.className = 'logo-chip logo-chip--tab';
    fillLogo(chip, s);

    const name = document.createElement('span');
    name.textContent = s.name;

    b.appendChild(chip);
    b.appendChild(name);
    b.addEventListener('click', () => {
      state.storeId = s.id;
      writeHash();
      render();
    });
    el.storeTabs.appendChild(b);
  });
}

/* ------------------------------------------------------------
 *  ロゴ表示
 *  画像が用意できていない店舗は、店舗カラーの丸印にそのまま戻します
 * ---------------------------------------------------------- */
/* 画像の置き場所。
   mine/ のように1つ下の階層に置いた版では、公開用を作る.py が
   body に data-assets="../" を付けるので、そのぶんだけ前に足します */
const ASSET_BASE = document.body.dataset.assets || '';

/* 画面に出すアプリ名。
   管理者用（mine/）は「T3 Works Mine」、スタッフ用は「T3 Works」 */
const APP_NAME = APP.title + (document.body.dataset.mode === 'mine' ? ' Mine' : '');

function fillLogo(chip, store) {
  chip.innerHTML = '';
  chip.style.setProperty('--chip-color', store.color);

  if (!store.logo) {
    chip.classList.add('is-fallback');
    return;
  }
  const img = document.createElement('img');
  img.alt = store.name;
  img.addEventListener('error', () => {
    // img フォルダに画像が無い／読めない場合
    chip.classList.add('is-fallback');
    img.remove();
  });
  img.src = ASSET_BASE + store.logo;
  chip.appendChild(img);
}

/* ============================================================
 *  描画：月タブ・年
 * ============================================================ */
function renderMonthTabs() {
  el.yearLabel.textContent = `${state.y}年`;
  el.monthTabs.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'month-tab' + (m === state.m ? ' is-active' : '');
    b.textContent = `${m}月`;
    b.addEventListener('click', () => {
      state.m = m;
      state.d = Math.min(state.d, daysInMonth(state.y, m));
      writeHash();
      render();
    });
    el.monthTabs.appendChild(b);
  }
}

/* ============================================================
 *  描画：日タブ（画面下・スプレッドシートのシートタブ相当）
 * ============================================================ */
function renderDayTabs(scrollToActive = true) {
  const month = Store.getMonth(state.storeId, `${state.y}-${pad2(state.m)}`);
  const last = daysInMonth(state.y, state.m);

  el.dayTabs.innerHTML = '';
  let activeBtn = null;

  for (let d = 1; d <= last; d++) {
    const dow = new Date(state.y, state.m - 1, d).getDay();
    const rec = month[pad2(d)];
    const items = itemsForDay(state.storeId, d);
    const done = countDone(rec, items);

    const closed = closedOn(state.storeId, d);

    const b = document.createElement('button');
    b.type = 'button';
    let cls = 'day-tab';
    if (dow === 0) cls += ' is-sun';
    if (dow === 6) cls += ' is-sat';
    if (closed) cls += ' day-tab--closed';
    else if (done > 0) cls += done >= items.length ? ' day-tab--full' : ' day-tab--partial';
    if (d === state.d) { cls += ' is-active'; }
    if (ymd(state.y, state.m, d) === TODAY_STR) cls += ' is-today';
    b.className = cls;
    b.innerHTML = `<span class="day-tab__state"></span>${d}<span class="day-tab__dow">${closed ? '休' : DOW[dow]}</span>`;
    b.title = closed
      ? `${state.m}月${d}日（${DOW[dow]}）　定休日`
      : `${state.m}月${d}日（${DOW[dow]}）　${done}/${items.length}`;
    b.addEventListener('click', () => {
      state.d = d;
      state.view = 'day';
      writeHash();
      render();
    });
    if (d === state.d) activeBtn = b;
    el.dayTabs.appendChild(b);
  }

  // チェック操作のたびに日タブが勝手に動くのを防ぐため、日付が変わったときだけ寄せる
  if (activeBtn && scrollToActive) activeBtn.scrollIntoView({ block: 'nearest', inline: 'center' });
}

/* ============================================================
 *  描画：クローズ（閉店時の確認作業）
 * ============================================================ */
function renderDayView() {
  const storeId = state.storeId;
  const dateStr = ymd(state.y, state.m, state.d);
  const rec = Store.getDay(storeId, dateStr);
  const dow = new Date(state.y, state.m - 1, state.d).getDay();

  el.dayNum.textContent = state.d;
  el.dayDow.textContent = `（${DOW[dow]}）`;
  el.dayDow.className = 'day-head__dow' + (dow === 0 ? ' is-sun' : dow === 6 ? ' is-sat' : '');

  /* --- 定休日 --- */
  // 定休日は確認不要。ただし過去に入力があった日は隠さずそのまま出す
  const closed = closedOn(storeId, state.d);
  const showList = !closed || hasAnyData(rec);
  el.viewDay.classList.toggle('is-closed', closed);
  el.closedNotice.classList.toggle('is-hidden', !closed);
  const closedLabel = Closed.exceptionOn(storeId, dateStr) === 'closed'
    ? '臨時休業'
    : `定休日（毎週${DOW[dow]}曜）`;
  el.closedNotice.textContent = showList && closed
    ? `${closedLabel}です。確認は不要ですが、この日は入力があるので表示しています。`
    : `${closedLabel}です。確認作業はありません。`;
  el.checklist.classList.toggle('is-hidden', !showList);
  el.noteCard.classList.toggle('is-hidden', !showList);
  el.staffRow.classList.toggle('is-hidden', !showList); // 確認不要な日は担当者も選ばせない
  renderDayFlags(closed, dateStr);

  /* --- その日の担当者 --- */
  renderStaffSelect(rec.staff || '');

  /* --- 項目一覧 --- */
  el.checklist.innerHTML = '';
  getChecklist(storeId).forEach((sec) => {
    const secItems = sectionItemsForDay(sec, storeId, state.d, closed && showList);
    if (!secItems.length) return; // その日は対象項目なし
    const doneInSec = countDone(rec, secItems);

    const card = document.createElement('section');
    card.className = 'section' + (isFolded(sec.id) ? ' is-folded' : '');

    // 見出しをタップで折りたたみ（項目が多い店舗でも見やすくするため）
    const head = document.createElement('div');
    head.className = 'section__head';
    head.tabIndex = 0;
    head.setAttribute('role', 'button');
    head.innerHTML =
      `<span class="section__chevron" aria-hidden="true"></span>` +
      `<h2 class="section__title">${sec.title}</h2>` +
      `<span class="section__count${doneInSec === secItems.length ? ' is-done' : ''}" data-section-id="${sec.id}">${doneInSec} / ${secItems.length}</span>`;
    const toggle = () => setFolded(sec.id, card.classList.toggle('is-folded'));
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
    card.appendChild(head);

    secItems.forEach((it) => {
      card.appendChild(buildItemRow(storeId, dateStr, it, rec.items[it.id]));
    });
    el.checklist.appendChild(card);
  });

  /* --- 進捗 --- */
  const items = selectedDayItems();
  const done = countDone(rec, items);
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  el.progressBar.style.width = pct + '%';
  el.progressBar.classList.toggle('is-done', done === items.length && items.length > 0);
  el.progressText.textContent = closed && !items.length ? '定休日' : `${done} / ${items.length}`;

  /* --- 申し送り --- */
  el.note.value = rec.note || '';

  /* --- 提出（クローズと、2週間に1回の週間掃除） --- */
  renderSubmit(closed, showList, dateStr, rec, items, done);
  renderWeekSubmit(dateStr);

  /* --- 更新情報 --- */
  el.updated.textContent = rec.updatedAt
    ? `最終更新：${new Date(rec.updatedAt).toLocaleString('ja-JP')}${rec.updatedBy ? '（' + rec.updatedBy + '）' : ''}`
    : '';
}

/* ------------------------------------------------------------
 *  提出（全項目チェックで押せる）
 * ---------------------------------------------------------- */
function renderSubmit(closed, showList, dateStr, rec, items, done) {
  // 定休日で項目を出していない日は提出そのものが不要
  el.submitCard.classList.toggle('is-hidden', !showList);
  if (!showList) return;

  const submitted = !!rec.submittedAt;
  const remain = items.length - done;
  const hasStaff = !!(rec.staff || '').trim();
  // 全項目チェック済み、かつ担当者を選んでいることが提出の条件です
  const canSubmit = items.length > 0 && remain === 0 && hasStaff;

  el.submitCard.classList.toggle('is-submitted', submitted);
  el.submitBtn.classList.toggle('is-hidden', submitted);
  el.unsubmitBtn.classList.toggle('is-hidden', !submitted);
  el.submitBtn.disabled = !canSubmit;

  if (submitted) {
    const t = new Date(rec.submittedAt);
    el.submitStatus.innerHTML =
      `<span class="submit-card__mark">提出済み</span>` +
      `<span class="submit-card__meta">${t.getMonth() + 1}/${t.getDate()} ` +
      `${pad2(t.getHours())}:${pad2(t.getMinutes())}` +
      `${rec.submittedBy ? '　' + rec.submittedBy : ''}</span>`;
  } else if (canSubmit) {
    el.submitStatus.innerHTML = '<span class="submit-card__ready">全項目チェック済みです</span>';
  } else if (remain > 0) {
    el.submitStatus.innerHTML =
      `<span class="submit-card__remain">未チェックが残り ${remain} 項目あります</span>` +
      `<span class="submit-card__meta">すべてチェックして担当者を選ぶと提出できます</span>`;
  } else {
    el.submitStatus.innerHTML =
      '<span class="submit-card__remain">担当者が選ばれていません</span>' +
      '<span class="submit-card__meta">上の「担当者」から選ぶと提出できます</span>';
  }
}

function submitDay() {
  const dateStr = ymd(state.y, state.m, state.d);
  const rec = Store.getDay(state.storeId, dateStr);
  const items = selectedDayItems();
  const remain = items.length - countDone(rec, items);
  // 念のため（ボタンは無効化済み）。担当者が未選択のときも提出しません
  if (remain > 0 || !(rec.staff || '').trim()) return;

  askConfirm({
    item: `${state.m}月${state.d}日の確認作業`,
    message: `${items.length}項目すべてのチェックが終わりました。担当者は ${rec.staff} さんです。提出しますか？`,
    okLabel: '提出する',
  }).then((ok) => {
    if (!ok) return;
    Store.submit(state.storeId, dateStr);
    render();
  });
}

function unsubmitDay() {
  const dateStr = ymd(state.y, state.m, state.d);
  askConfirm({
    item: `${state.m}月${state.d}日の提出`,
    message: '提出を取り消します。全店舗提出記録では「未提出」に戻ります。',
    okLabel: '取り消す',
    danger: true,
  }).then((ok) => {
    if (!ok) return;
    Store.unsubmit(state.storeId, dateStr);
    render();
  });
}

/* ------------------------------------------------------------
 *  店舗選択（アプリを開いて最初の画面）
 * ---------------------------------------------------------- */
function renderStorePicker() {
  const dateStr = ymd(state.y, state.m, state.d);
  const dow = new Date(state.y, state.m - 1, state.d).getDay();
  el.storesDate.textContent = `${state.m}月${state.d}日（${DOW[dow]}）の確認作業`;

  el.storeGrid.innerHTML = '';
  STORES.forEach((s) => {
    const closed = Closed.isClosed(s.id, state.y, state.m, state.d);
    const rec = Store.getDay(s.id, dateStr);

    let kind = 'todo', text = '未提出';
    if (closed) { kind = 'closed'; text = '定休日'; }
    else if (rec.submittedAt) { kind = 'done'; text = '提出済み'; }

    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'store-card store-card--' + kind;
    b.style.setProperty('--card-color', s.color);

    const chip = document.createElement('span');
    chip.className = 'logo-chip logo-chip--card';
    fillLogo(chip, s);

    const name = document.createElement('span');
    name.className = 'store-card__name';
    name.textContent = s.name;

    const status = document.createElement('span');
    status.className = 'store-card__status';
    status.textContent = text;

    b.appendChild(chip);
    b.appendChild(name);
    b.appendChild(status);
    b.addEventListener('click', () => {
      state.storeId = s.id;
      // 店舗をえらんだら、その店舗の業務一覧へ。
      // 人によって入る店舗が変わるので、前回の続きには飛ばしません
      state.view = 'tasks';
      writeHash();
      render();
      window.scrollTo(0, 0);
    });
    li.appendChild(b);
    el.storeGrid.appendChild(li);
  });
}

/** 店舗選択画面に戻る */
function goHome() {
  state.storeId = '';
  state.view = 'stores';
  writeHash();
  render();
  window.scrollTo(0, 0);
}

/** 業務をえらぶ画面へ */
function goTasks() {
  state.view = 'tasks';
  writeHash();
  render();
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------
 *  業務選択（店舗をえらんだあとの画面）
 *
 *  ただの入口ではなく、その店舗の「いまの状況」を並べています。
 *  ここを見れば、どの業務が残っているかが分かります。
 * ---------------------------------------------------------- */

/** 業務ごとの、その店舗のいまの状況 { text, kind } */
function taskStatus(taskId, storeId) {
  const dateStr = ymd(TODAY.y, TODAY.m, TODAY.d);

  if (taskId === 'day') {
    if (Closed.isClosed(storeId, TODAY.y, TODAY.m, TODAY.d)) return { text: '本日は定休日', kind: 'closed' };
    const rec = Store.getDay(storeId, dateStr);
    if (rec.submittedAt) return { text: '本日 提出済み', kind: 'done' };
    const items = getChecklist(storeId).flatMap((sec) =>
      sec.items.filter((it) => appliesTo(it, getStore(storeId), TODAY.y, TODAY.m, TODAY.d, sec)));
    const done = countDone(rec, items);
    return { text: `本日 ${done} / ${items.length}`, kind: 'todo' };
  }

  if (taskId === 'week') {
    const period = periodOfDate(TODAY.y, TODAY.m, TODAY.d);
    const st = periodStatus(storeId, period);
    if (!st.total) return { text: '項目なし', kind: 'none' };
    if (st.submittedAt) return { text: `提出済み ${st.rate}%`, kind: 'done' };
    const last = periodEndOf(period);
    const [, lm, ld] = last.split('-').map(Number);
    return { text: `${st.rate}%　提出 ${lm}/${ld}`, kind: 'todo' };
  }

  if (taskId === 'month') {
    return { text: `${TODAY.m}月の一覧`, kind: 'none' };
  }
  return { text: '', kind: 'none' };
}

function renderTaskPicker() {
  const store = getStore(state.storeId);
  const dow = new Date(TODAY.y, TODAY.m - 1, TODAY.d).getDay();

  el.tasksTitle.textContent = store.name;
  el.tasksDate.textContent = `${TODAY.m}月${TODAY.d}日（${DOW[dow]}）　業務をえらんでください`;

  el.taskGrid.innerHTML = '';
  taskList().forEach((task) => {
    const st = taskStatus(task.id, store.id);

    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'task-card task-card--' + st.kind;
    b.style.setProperty('--card-color', store.color);

    // 店舗カードのロゴにあたる場所。業務は絵文字で見分けます
    const icon = document.createElement('span');
    icon.className = 'task-card__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = task.icon || '';

    const main = document.createElement('span');
    main.className = 'task-card__main';
    const name = document.createElement('span');
    name.className = 'task-card__name';
    name.textContent = task.name;
    const sub = document.createElement('span');
    sub.className = 'task-card__sub';
    sub.textContent = task.sub || '';
    main.append(name, sub);

    const status = document.createElement('span');
    status.className = 'task-card__status';
    status.textContent = st.text;

    b.append(icon, main, status);
    b.addEventListener('click', () => {
      state.view = task.id;
      // 業務を開くときは今日に合わせる（別の店舗に入る日もあるため）
      state.y = TODAY.y; state.m = TODAY.m; state.d = TODAY.d;
      writeHash();
      render();
      window.scrollTo(0, 0);
    });
    li.appendChild(b);
    el.taskGrid.appendChild(li);
  });
}

/* ------------------------------------------------------------
 *  全店舗提出記録
 * ---------------------------------------------------------- */
function renderReport() {
  const dateStr = ymd(state.y, state.m, state.d);
  const dow = new Date(state.y, state.m - 1, state.d).getDay();
  el.reportDate.textContent = `${state.y}年${state.m}月${state.d}日（${DOW[dow]}）`;

  let submitted = 0, closedCount = 0;
  el.reportList.innerHTML = '';

  STORES.forEach((s) => {
    const closed = Closed.isClosed(s.id, state.y, state.m, state.d);
    const rec = Store.getDay(s.id, dateStr);
    const items = closed ? [] : itemsForDay(s.id, state.d);
    const done = countDone(rec, items);

    let kind, text, sub = '';
    if (closed) {
      kind = 'closed'; text = '定休日';
      closedCount++;
    } else if (rec.submittedAt) {
      const t = new Date(rec.submittedAt);
      kind = 'done'; text = '提出済み';
      sub = `${pad2(t.getHours())}:${pad2(t.getMinutes())}${rec.submittedBy ? '　' + rec.submittedBy : ''}`;
      submitted++;
    } else {
      kind = 'todo'; text = '未提出';
      sub = `${done} / ${items.length} 項目`;
    }

    const li = document.createElement('li');
    li.className = 'report-item report-item--' + kind;

    const chip = document.createElement('span');
    chip.className = 'logo-chip logo-chip--tab';
    fillLogo(chip, s);

    const name = document.createElement('span');
    name.className = 'report-item__name';
    name.textContent = s.name;

    const status = document.createElement('span');
    status.className = 'report-item__status';
    status.innerHTML = `<span class="report-item__badge">${text}</span>` +
      (sub ? `<span class="report-item__sub">${sub}</span>` : '');

    li.appendChild(chip);
    li.appendChild(name);
    li.appendChild(status);
    li.addEventListener('click', () => {
      state.storeId = s.id;
      state.view = 'day';
      writeHash();
      render();
    });
    el.reportList.appendChild(li);
  });

  const target = STORES.length - closedCount;
  el.reportSummary.textContent =
    `提出済み ${submitted} / ${target} 店舗` +
    (closedCount ? `（定休日 ${closedCount} 店舗を除く）` : '');
  el.reportSummary.classList.toggle('is-all-done', target > 0 && submitted === target);
}

/** 表示中の日付を前後にずらす（月・年をまたいでもOK） */
function shiftDay(diff) {
  const dt = new Date(state.y, state.m - 1, state.d + diff);
  state.y = dt.getFullYear();
  state.m = dt.getMonth() + 1;
  state.d = dt.getDate();
  writeHash();
  render();
}

/* ------------------------------------------------------------
 *  この日だけ営業／休業にする切り替え
 * ---------------------------------------------------------- */
function renderDayFlags(closed, dateStr) {
  const ex = Closed.exceptionOn(state.storeId, dateStr);

  el.overrideTag.classList.toggle('is-hidden', !ex);
  if (ex) {
    el.overrideTag.textContent = ex === 'closed' ? '臨時休業' : '臨時営業';
    el.overrideTag.className = 'override-tag override-tag--' + ex;
  }
  el.overrideReset.classList.toggle('is-hidden', !ex);
  el.closedToggle.textContent = closed ? 'この日は営業する' : 'この日を休業にする';
}

/** この日の営業／休業を切り替える */
function toggleDayClosed() {
  const dateStr = ymd(state.y, state.m, state.d);
  const closed = closedOn(state.storeId, state.d);
  const next = closed ? 'open' : 'closed';

  askConfirm({
    item: `${state.m}月${state.d}日`,
    message: next === 'closed'
      ? 'この日を休業にします。確認作業は不要になり、確認漏れにも数えません。'
      : 'この日を営業日にします。通常どおり確認作業が表示されます。',
    okLabel: next === 'closed' ? '休業にする' : '営業にする',
  }).then((ok) => {
    if (!ok) return;
    // 曜日の設定と同じ結果になるなら例外は持たない（設定が散らからないように）
    const byDow = Closed.dows(state.storeId).includes(new Date(state.y, state.m - 1, state.d).getDay());
    Closed.setException(state.storeId, dateStr, (next === 'closed') === byDow ? null : next);
    render();
  });
}

/* ------------------------------------------------------------
 *  担当者プルダウン
 * ---------------------------------------------------------- */
function renderStaffSelect(current) {
  const names = Staff.list();
  // 過去に選ばれた名前がリストから消えていても表示は残す
  if (current && !names.includes(current)) names.unshift(current);

  el.staffSelect.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '未選択';
  el.staffSelect.appendChild(blank);

  names.forEach((name) => {
    const o = document.createElement('option');
    o.value = name;
    o.textContent = name;
    el.staffSelect.appendChild(o);
  });

  const edit = document.createElement('option');
  edit.value = '__edit__';
  edit.textContent = names.length ? '＋ 担当者リストを編集…' : '＋ 担当者を登録…';
  el.staffSelect.appendChild(edit);

  el.staffSelect.value = current;
  el.staffSelect.classList.toggle('is-empty', !current);
}

/** 1項目の行を組み立て */
function buildItemRow(storeId, dateStr, item, data) {
  data = data || { done: false, value: '', at: null };

  const row = document.createElement('div');
  row.className = 'item' + (data.done ? ' is-done' : '');

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'item__check';
  cb.checked = !!data.done;
  cb.id = `chk-${item.id}`;

  const body = document.createElement('div');
  body.className = 'item__body';

  const label = document.createElement('label');
  label.className = 'item__label';
  label.htmlFor = cb.id;
  label.textContent = item.label;
  body.appendChild(label);

  if (item.hint) {
    const hint = document.createElement('p');
    hint.className = 'item__hint';
    hint.textContent = item.hint;
    body.appendChild(hint);
  }

  /* 数値・テキスト入力 */
  if (item.type === 'number' || item.type === 'text') {
    const wrap = document.createElement('div');
    wrap.className = 'item__value';
    const input = document.createElement('input');
    input.className = 'item__input' + (item.type === 'text' ? ' item__input--text' : '');
    input.value = data.value || '';
    if (item.type === 'number') {
      input.type = 'text';
      input.inputMode = 'decimal';
      input.placeholder = '数値を入力';
    } else {
      input.type = 'text';
      input.placeholder = '内容を入力';
    }
    input.addEventListener('change', () => {
      Store.setItem(storeId, dateStr, item.id, { value: input.value });
      renderDayTabs(false);
    });
    wrap.appendChild(input);
    if (item.unit) {
      const u = document.createElement('span');
      u.className = 'item__unit';
      u.textContent = item.unit;
      wrap.appendChild(u);
    }
    body.appendChild(wrap);
  }

  /* チェックした時刻（担当者はその日の担当者なので項目ごとには出さない） */
  const time = document.createElement('span');
  time.className = 'item__time';
  time.textContent = timeText(data);

  /* 誤チェック防止：チェックの前に確認する
     click で preventDefault し、「はい」のときだけ実際に切り替える */
  cb.addEventListener('click', (e) => {
    // click の時点で checked は既に反転済み。preventDefault で元に戻るので、
    // 「これから入れたい状態」は cb.checked そのもの
    const turningOn = cb.checked;
    e.preventDefault();
    // 提出済みの日でチェックを外すと、提出も取り消しになる
    const wasSubmitted = !turningOn && !!Store.getDay(storeId, dateStr).submittedAt;
    askConfirm({
      item: item.label,
      message: turningOn
        ? 'この項目を「完了」にします。確認は済んでいますか？'
        : wasSubmitted
          ? 'この項目のチェックを外します。この日は提出済みのため、提出も取り消されます。'
          : 'この項目のチェックを外します。よろしいですか？',
      okLabel: turningOn ? '完了にする' : 'チェックを外す',
      danger: !turningOn,
    }).then((ok) => {
      if (!ok) return;
      cb.checked = turningOn;
      const next = Store.setItem(storeId, dateStr, item.id, { done: turningOn });
      if (wasSubmitted) Store.unsubmit(storeId, dateStr);
      row.classList.toggle('is-done', turningOn);
      time.textContent = timeText(next);
      refreshProgress();
      renderDayTabs(false);
    });
  });

  row.appendChild(cb);
  row.appendChild(body);
  row.appendChild(time);
  return row;
}

function timeText(data) {
  if (!data.done || !data.at) return '';
  const t = new Date(data.at);
  return `${pad2(t.getHours())}:${pad2(t.getMinutes())}`;
}

/** チェック後に進捗バーとセクション件数だけ更新 */
function refreshProgress() {
  const rec = Store.getDay(state.storeId, ymd(state.y, state.m, state.d));
  const items = selectedDayItems();
  const done = countDone(rec, items);
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  el.progressBar.style.width = pct + '%';
  el.progressBar.classList.toggle('is-done', done === items.length && items.length > 0);
  el.progressText.textContent = items.length ? `${done} / ${items.length}` : '定休日';

  const ignoreClosed = closedOn(state.storeId, state.d);
  getChecklist(state.storeId).forEach((sec) => {
    const badge = el.checklist.querySelector(`.section__count[data-section-id="${sec.id}"]`);
    if (!badge) return;
    const secItems = sectionItemsForDay(sec, state.storeId, state.d, ignoreClosed);
    const n = countDone(rec, secItems);
    badge.textContent = `${n} / ${secItems.length}`;
    badge.classList.toggle('is-done', n === secItems.length);
  });

  el.updated.textContent = rec.updatedAt
    ? `最終更新：${new Date(rec.updatedAt).toLocaleString('ja-JP')}${rec.updatedBy ? '（' + rec.updatedBy + '）' : ''}`
    : '';

  refreshSubmitCard();
}

/** チェックのたびに提出ボタンの状態も作り直す */
function refreshSubmitCard() {
  const dateStr = ymd(state.y, state.m, state.d);
  const rec = Store.getDay(state.storeId, dateStr);
  const closed = closedOn(state.storeId, state.d);
  const items = selectedDayItems();
  renderSubmit(closed, !closed || hasAnyData(rec), dateStr, rec, items, countDone(rec, items));
  renderWeekSubmit(dateStr);
}

/* ============================================================
 *  描画：週間掃除ビュー
 *
 *  縦が項目、横が週（日曜はじまり）。1週ずつ／2週まとめて を選べます。
 *  記録は「週」ごとに1つで、クローズの記録とは別に持っています
 *  （キーは storeId/W2026-08-02 の形。config.js の weekRecKey）。
 *
 *  提出と達成率の単位は「2週間（期）」です。期の1週目の記録に
 *  提出の印と備考を持たせています。
 * ============================================================ */

/** いま見ている週（日曜の日付） */
function currentWeek() {
  return weekStartOf(state.y, state.m, state.d);
}

/** いま見ている期（2週間）の1週目 */
function currentPeriod() {
  return periodStartOf(currentWeek());
}

/** 表示する週を移す。日付は、その週の日曜に合わせます */
function goToWeek(weekStart) {
  const [y, m, d] = weekStart.split('-').map(Number);
  state.y = y; state.m = m; state.d = d;
}

/** ISO日時を「8/12」の形にする */
function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function renderWeekView() {
  const storeId = state.storeId;
  const period = currentPeriod();
  const weeks = periodWeeks(period);
  const nowWeek = weekStartOf(TODAY.y, TODAY.m, TODAY.d);

  /* ---- 見出しと送り戻し ---- */
  el.weekNavMain.textContent = periodRangeLabel(period);
  el.weekNavSub.textContent = period === periodStartOf(nowWeek) ? 'この2週間' : '2週間分';

  /* ---- 表 ---- */
  const items = getWeekly(storeId).filter((it) => weeks.some((w) => weeklyAppliesTo(it, w)));
  const empty = items.length === 0;
  el.weekEmpty.classList.toggle('is-hidden', !empty);
  el.weekNoteCard.classList.toggle('is-hidden', empty);
  el.periodCard.classList.toggle('is-hidden', empty);
  el.weekTableWrap.classList.toggle('is-hidden', empty);

  const t = el.weekTable;
  t.innerHTML = '';

  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  htr.innerHTML = '<th class="col-item">掃除する場所</th>';
  weeks.forEach((w, i) => {
    const th = document.createElement('th');
    // 横1列に収める（「8/9〜8/15」を1行で）
    th.innerHTML =
      `<span class="week-th__nth">${i + 1}週目</span>` +
      `<span class="week-th__range">${weekShortLabel(w)}〜${weekShortLabel(weekEndOf(w))}</span>`;
    if (w === nowWeek) th.classList.add('is-now');
    th.title = weekRangeLabel(w);
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  t.appendChild(thead);

  const tbody = document.createElement('tbody');
  // ホール・キッチン・トイレ…の見出しで区切って並べます
  const groups = groupWeekly(items);
  groups.forEach((g) => {
    // 見出しが1つしか無いときは、わざわざ帯を出しません
    if (groups.length > 1) {
      const htr2 = document.createElement('tr');
      htr2.className = 'week-group';
      const gtd = document.createElement('td');
      gtd.colSpan = 3;
      // 色の棒＋名前。上に余白を空けて、項目の行と見分けやすくします
      const glabel = document.createElement('span');
      glabel.className = 'week-group__label';
      glabel.textContent = g.name;
      gtd.appendChild(glabel);
      htr2.appendChild(gtd);
      tbody.appendChild(htr2);
    }

    g.items.forEach((it, i) => {
      const tr = document.createElement('tr');
      // 1行おきに色を付けて、目が横にすべらないようにします（見出しごとに数え直し）
      if (i % 2 === 1) tr.classList.add('is-alt');

      const nameTd = document.createElement('td');
      nameTd.className = 'col-item';
      nameTd.textContent = it.label;
      // 毎週やるものにだけ印を付けます（2週に1回のものは、マスが1つに
      // つながっているので印は付けません）
      if (!isBiweekly(it)) {
        const tag = document.createElement('span');
        tag.className = 'week-every';
        tag.textContent = '毎週';
        nameTd.appendChild(tag);
      }
      tr.appendChild(nameTd);

      // 2週に1回の項目は、記録を期の1週目にまとめて持ち、マスも1つにつなげます
      if (isBiweekly(it)) {
        const td = weekCell(storeId, it, period, nowWeek);
        td.classList.add('week-cell--span');
        td.colSpan = 2;
        tr.appendChild(td);
      } else {
        weeks.forEach((w) => tr.appendChild(weekCell(storeId, it, w, nowWeek)));
      }
      tbody.appendChild(tr);
    });
  });
  t.appendChild(tbody);

  renderPeriodCard(storeId, period);

  /* ---- 備考（期ごと） ---- */
  el.weekNote.value = Store.getDay(storeId, weekRecKey(period)).note || '';
}

/** 表のマス1つ。押すと「やった人」を選ぶ画面が出ます */
function weekCell(storeId, item, week, nowWeek) {
  const td = document.createElement('td');
  td.className = 'week-cell';
  if (week === nowWeek) td.classList.add('is-now');
  if (week > nowWeek) td.classList.add('is-future');

  if (!weeklyAppliesTo(item, week)) {
    td.classList.add('is-future');
    td.innerHTML = '<span class="cell-mark cell-mark--none">–</span>';
    return td;
  }

  const cur = Store.getDay(storeId, weekRecKey(week)).items?.[item.id];
  const done = !!cur?.done;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'week-btn' + (done ? ' is-done' : '');

  // 済んだマスは「✓ 担当者 日付」を横1列に並べます
  const mark = document.createElement('span');
  mark.className = 'week-btn__mark';
  mark.textContent = done ? '✓' : '・';
  btn.appendChild(mark);

  if (done) {
    if (cur.by) {
      const by = document.createElement('span');
      by.className = 'week-btn__name';
      by.textContent = cur.by;
      btn.appendChild(by);
    }
    const at = shortDate(cur.at);
    if (at) {
      const when = document.createElement('span');
      when.className = 'week-btn__date';
      when.textContent = at;
      btn.appendChild(when);
    }
  }

  btn.title = `${item.label}　${weekRangeLabel(week)}`;
  btn.addEventListener('click', () => openDoerModal(item, week));
  td.appendChild(btn);
  return td;
}

/* ------------------------------------------------------------
 *  達成率の円グラフ（ドーナツ）
 *
 *  中央に％の数字を大きく置き、輪の長さで進み具合を見せます。
 *  数字が主役で、輪はその補助です。
 * ---------------------------------------------------------- */
function donut(rate, { size = 96, stroke = 10, color = 'var(--store)', label = '' } = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const pct = Math.min(Math.max(rate, 0), 100);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'donut');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${label}達成率 ${rate}%`);

  const title = document.createElementNS(NS, 'title');
  title.textContent = `${label}達成率 ${rate}%`;
  svg.appendChild(title);

  // 下地の輪（100%ぶんの目盛り）
  const track = document.createElementNS(NS, 'circle');
  track.setAttribute('class', 'donut__track');
  track.setAttribute('cx', size / 2);
  track.setAttribute('cy', size / 2);
  track.setAttribute('r', r);
  track.setAttribute('stroke-width', stroke);
  svg.appendChild(track);

  // 進んだぶんの輪。12時から時計回りに伸びます
  if (pct > 0) {
    const arc = document.createElementNS(NS, 'circle');
    arc.setAttribute('class', 'donut__arc');
    arc.setAttribute('cx', size / 2);
    arc.setAttribute('cy', size / 2);
    arc.setAttribute('r', r);
    arc.setAttribute('stroke-width', stroke);
    arc.setAttribute('stroke-dasharray', `${(circ * pct) / 100} ${circ}`);
    arc.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
    arc.style.stroke = pct === 100 ? 'var(--ok)' : color;
    svg.appendChild(arc);
  }

  const text = document.createElementNS(NS, 'text');
  text.setAttribute('class', 'donut__value');
  text.setAttribute('x', size / 2);
  text.setAttribute('y', size / 2);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');
  text.style.fill = pct === 100 ? 'var(--ok)' : color;
  text.textContent = `${rate}%`;
  svg.appendChild(text);

  return svg;
}

/* ------------------------------------------------------------
 *  この2週間の達成状況と提出
 * ---------------------------------------------------------- */
function renderPeriodCard(storeId, period) {
  const st = periodStatus(storeId, period);
  const submitted = !!st.submittedAt;

  el.periodTitle.textContent = `この2週間 ${periodRangeLabel(period)}`;
  el.periodRate.textContent = `${st.rate}%`;
  el.periodRate.classList.toggle('is-full', st.rate === 100);
  el.periodBar.style.width = `${st.rate}%`;
  el.periodBar.classList.toggle('is-done', st.rate === 100);

  const remain = st.total - st.done;
  el.periodCount.textContent = `${st.done} / ${st.total} マス` +
    (st.total === 0 ? '' : remain === 0 ? '　すべて済んでいます' : `　残り ${remain} マス`);

  el.periodCard.classList.toggle('is-submitted', submitted);

  // 提出はクローズのページで行うので、ここではいつ提出できるかだけ案内します
  const last = periodEndOf(period);
  if (submitted) {
    const d = new Date(st.submittedAt);
    el.periodWhen.textContent =
      `提出済み　${d.getMonth() + 1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` +
      `${st.submittedBy ? '　' + st.submittedBy : ''}`;
    el.periodWhen.classList.add('is-done');
  } else {
    const [, lm, ld] = last.split('-').map(Number);
    el.periodWhen.textContent = TODAY_STR > last
      ? `未提出です（提出日は ${lm}/${ld} でした）。クローズの ${lm}/${ld} から提出できます`
      : `提出は最終日の ${lm}/${ld}（土）に、クローズの提出ボタンの下に出ます`;
    el.periodWhen.classList.remove('is-done');
  }
}

/* ------------------------------------------------------------
 *  週間掃除の提出（クローズのページの、提出ボタンの下）
 *
 *  2週間に1回でよいので、その2週間の最終日（2週目の土曜）を
 *  開いているときだけ出します。出し忘れたときのために、
 *  最終日を過ぎても未提出のあいだは出したままにしています。
 * ---------------------------------------------------------- */
function renderWeekSubmit(dateStr) {
  const storeId = state.storeId;
  const period = periodStartOf(weekStartOf(state.y, state.m, state.d));
  const last = periodEndOf(period);
  const st = periodStatus(storeId, period);
  const submitted = !!st.submittedAt;

  // 出す日：その2週間の最終日。ただし提出済みならその日だけ、
  // 未提出なら最終日を過ぎたあとも出しておく
  const isLast = dateStr === last;
  const overdue = !submitted && dateStr > last && dateStr <= addDaysStr(last, 13);
  const show = st.total > 0 && (isLast || overdue);

  el.weekSubmitCard.classList.toggle('is-hidden', !show);
  if (!show) return;

  const [, lm, ld] = last.split('-').map(Number);
  el.weekSubmitRange.textContent = periodRangeLabel(period) + (overdue ? `　※${lm}/${ld}が提出日でした` : '');
  el.weekSubmitRate.textContent = `達成率 ${st.rate}%（${st.done} / ${st.total} マス）`;
  el.weekSubmitRate.classList.toggle('is-full', st.rate === 100);

  el.weekSubmitCard.classList.toggle('is-submitted', submitted);
  el.periodSubmit.classList.toggle('is-hidden', submitted);
  el.periodDone.classList.toggle('is-hidden', !submitted);

  if (submitted) {
    const d = new Date(st.submittedAt);
    el.periodDoneMeta.textContent =
      `${d.getMonth() + 1}/${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` +
      `${st.submittedBy ? '　' + st.submittedBy : ''}　達成率 ${st.rate}%`;
  } else {
    fillStaffOptions(el.periodStaff, st.staff);
    refreshPeriodSubmitBtn();
  }
}

/** 提出する人を選ぶまで、週間掃除の提出ボタンは押せません */
function refreshPeriodSubmitBtn() {
  const picked = !!el.periodStaff.value;
  el.periodSubmitBtn.disabled = !picked;
  el.periodStaff.classList.toggle('is-empty', !picked);
  el.weekSubmitHint.textContent = picked ? '' : '提出する人を選ぶと提出できます';
}

/** 担当者のプルダウンを作る（空欄つき） */
function fillStaffOptions(select, current) {
  const names = Staff.list();
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '選択…';
  select.appendChild(blank);
  names.forEach((n) => {
    const o = document.createElement('option');
    o.value = n;
    o.textContent = n;
    select.appendChild(o);
  });
  select.value = names.includes(current) ? current : '';
}

function submitPeriod() {
  const storeId = state.storeId;
  const period = currentPeriod();
  const st = periodStatus(storeId, period);
  if (st.total === 0) return;

  const name = el.periodStaff.value;
  if (!name) return; // 念のため（ボタンは無効化済み）

  const remain = st.total - st.done;
  askConfirm({
    item: `週間掃除　${periodRangeLabel(period)}`,
    message: (remain === 0
      ? `${st.total}マスすべてが済んでいます（達成率 100%）。`
      : `達成率 ${st.rate}%（${st.done} / ${st.total} マス）で提出します。`
        + `未実施が ${remain} マスありますが、このまま提出しますか？`)
      + `\n提出する人は ${name} さんです。`,
    okLabel: '提出する',
  }).then((ok) => {
    if (!ok) return;
    Store.setStaff(storeId, weekRecKey(period), name);
    Store.submit(storeId, weekRecKey(period));
    render();
  });
}

function unsubmitPeriod() {
  const storeId = state.storeId;
  const period = currentPeriod();
  askConfirm({
    item: `週間掃除　${periodRangeLabel(period)}`,
    message: '提出を取り消します。6店舗の達成状況では「未提出」に戻ります。',
    okLabel: '取り消す',
    danger: true,
  }).then((ok) => {
    if (!ok) return;
    Store.unsubmit(storeId, weekRecKey(period));
    render();
  });
}

/* ============================================================
 *  描画：6店舗の達成状況（週間掃除）
 * ============================================================ */
function renderWeekAll() {
  const period = currentPeriod();
  el.weekAllRange.textContent = periodRangeLabel(period);

  const rows = STORES.map((store) => ({ store, st: periodStatus(store.id, period) }));
  const active = rows.filter((r) => r.st.total > 0);
  const submitted = active.filter((r) => r.st.submittedAt).length;
  const avg = active.length
    ? Math.round(active.reduce((n, r) => n + r.st.rate, 0) / active.length)
    : 0;

  el.weekAllSummary.textContent = active.length
    ? `平均の達成率 ${avg}%　提出済み ${submitted} / ${active.length} 店舗`
    : 'この2週間に対象の項目がある店舗はありません。';
  el.weekAllSummary.classList.toggle('is-all-done', active.length > 0 && submitted === active.length);

  el.weekAllList.innerHTML = '';
  rows.forEach(({ store, st }) => {
    const li = document.createElement('li');
    li.className = 'rate-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rate-card';
    btn.style.setProperty('--card-color', store.color);

    // 店舗選択の画面と同じ並び（ロゴ → 店名 → 中身）にそろえます
    const chip = document.createElement('span');
    chip.className = 'logo-chip logo-chip--rate';
    fillLogo(chip, store);
    btn.appendChild(chip);

    const name = document.createElement('span');
    name.className = 'rate-card__name';
    name.textContent = store.name;
    btn.appendChild(name);

    // 6店舗を並べて比べる画面なので、輪の色はそろえます。
    // 店舗の見分けはロゴ・店名・カードの上の色が持たせます
    btn.appendChild(donut(st.total ? st.rate : 0, {
      size: 104, stroke: 10, color: 'var(--accent)', label: `${store.name}の`,
    }));

    const count = document.createElement('span');
    count.className = 'rate-card__count';
    count.textContent = st.total ? `${st.done} / ${st.total} マス` : '項目なし';
    btn.appendChild(count);

    const badge = document.createElement('span');
    badge.className = 'rate-card__badge ' +
      (!st.total ? 'rate-card__badge--none'
        : st.submittedAt ? 'rate-card__badge--done' : 'rate-card__badge--todo');
    badge.textContent = !st.total ? '—' : st.submittedAt ? '提出済み' : '未提出';
    if (st.submittedAt && st.submittedBy) badge.title = `提出者 ${st.submittedBy}`;
    btn.appendChild(badge);

    btn.addEventListener('click', () => {
      state.storeId = store.id;
      state.view = 'week';
      goToWeek(period);
      writeHash();
      render();
      window.scrollTo(0, 0);
    });
    li.appendChild(btn);
    el.weekAllList.appendChild(li);
  });
}

/* ---------- やった人を選ぶ ---------- */
let doerTarget = null; // { item, week }

function openDoerModal(item, week) {
  doerTarget = { item, week };
  el.doerItem.textContent = item.label;
  el.doerWeek.textContent = isBiweekly(item)
    ? `${periodRangeLabel(periodStartOf(week))} のうち1回`
    : weekRangeLabel(week);

  const cur = Store.getDay(state.storeId, weekRecKey(week)).items?.[item.id];
  const done = !!cur?.done;
  el.doerClear.classList.toggle('is-hidden', !done);

  const names = Staff.list();
  el.doerGrid.innerHTML = '';
  if (!names.length) {
    el.doerGrid.innerHTML = '<p class="modal__note">担当者が登録されていません。管理アプリから登録してください。</p>';
  }
  names.forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'doer-btn' + (done && cur.by === name ? ' is-current' : '');
    b.textContent = name;
    b.addEventListener('click', () => pickDoer(name));
    el.doerGrid.appendChild(b);
  });

  el.doerModal.classList.remove('is-hidden');
}

function closeDoerModal() {
  doerTarget = null;
  el.doerModal.classList.add('is-hidden');
}

function pickDoer(name) {
  if (!doerTarget) return;
  const { item, week } = doerTarget;
  Store.setItem(state.storeId, weekRecKey(week), item.id, { done: true, by: name });
  closeDoerModal();
  renderWeekView();
  renderSyncStatus();
}

function clearDoer() {
  if (!doerTarget) return;
  const { item, week } = doerTarget;
  Store.setItem(state.storeId, weekRecKey(week), item.id, { done: false, by: '' });
  closeDoerModal();
  renderWeekView();
  renderSyncStatus();
}

/* ============================================================
 *  描画：月間表ビュー（確認漏れの一覧チェック用）
 * ============================================================ */
function renderMonthView() {
  const storeId = state.storeId;
  const ym = `${state.y}-${pad2(state.m)}`;
  const month = Store.getMonth(storeId, ym);
  const last = daysInMonth(state.y, state.m);
  const sections = getChecklist(storeId);
  const startDate = Store.firstDate(storeId); // 運用開始前は「対象外」扱い（×にしない）

  /** 前日まで＝確認漏れの判定対象。本日はまだ営業中なので漏れに数えない */
  const isPast = (dateStr) =>
    dateStr < TODAY_STR && !!startDate && dateStr >= startDate;
  const isToday = (dateStr) => dateStr === TODAY_STR;

  /* ---- 表 ---- */
  const t = el.monthTable;
  t.innerHTML = '';

  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  htr.innerHTML = '<th class="col-item">確認項目</th>';
  for (let d = 1; d <= last; d++) {
    const dow = new Date(state.y, state.m - 1, d).getDay();
    const th = document.createElement('th');
    th.textContent = d;
    if (dow === 0) th.className = 'is-sun';
    if (dow === 6) th.className = 'is-sat';
    if (closedOn(storeId, d)) th.classList.add('is-closed');
    if (ymd(state.y, state.m, d) === TODAY_STR) th.classList.add('is-today');
    htr.appendChild(th);
  }
  thead.appendChild(htr);
  t.appendChild(thead);

  const tbody = document.createElement('tbody');
  let missCount = 0;

  sections.forEach((sec) => {
    const secTr = document.createElement('tr');
    secTr.className = 'row-section';
    secTr.innerHTML = `<td class="col-item">${sec.title}</td><td colspan="${last}"></td>`;
    tbody.appendChild(secTr);

    sec.items.forEach((it) => {
      const tr = document.createElement('tr');
      const th = document.createElement('td');
      th.className = 'col-item';
      th.textContent = it.label;
      tr.appendChild(th);

      for (let d = 1; d <= last; d++) {
        const dateStr = ymd(state.y, state.m, d);
        const rec = month[pad2(d)];
        const done = !!rec?.items?.[it.id]?.done;
        const td = document.createElement('td');
        td.className = 'day-cell';
        if (closedOn(storeId, d)) {
          td.innerHTML = '<i class="cell-mark cell-mark--closed">休</i>';
          td.classList.add('is-closed');
        } else if (!appliesTo(it, getStore(storeId), state.y, state.m, d)) {
          // その日は対象外の項目（例：肉の日POP、翌日が休みのランチメニュー）
          td.innerHTML = '<i class="cell-mark cell-mark--off"></i>';
          td.classList.add('is-off');
        } else if (done) {
          td.innerHTML = '<i class="cell-mark cell-mark--ok">✓</i>';
        } else if (isPast(dateStr)) {
          td.innerHTML = '<i class="cell-mark cell-mark--ng">×</i>';
          missCount++;
        } else if (isToday(dateStr)) {
          td.innerHTML = '<i class="cell-mark cell-mark--wait">未</i>';
        } else {
          td.innerHTML = '<i class="cell-mark cell-mark--none">–</i>';
        }
        td.addEventListener('click', () => {
          state.d = d;
          state.view = 'day';
          writeHash();
          render();
        });
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
  });

  /* 合計行 */
  const totalTr = document.createElement('tr');
  totalTr.className = 'row-total';
  const ttd = document.createElement('td');
  ttd.className = 'col-item';
  ttd.textContent = '完了数 / 全項目';
  totalTr.appendChild(ttd);

  let pastDays = 0, fullDays = 0, closedDays = 0, todayDone = null, todayTotal = 0, totalChecks = 0;
  for (let d = 1; d <= last; d++) {
    const dateStr = ymd(state.y, state.m, d);
    const rec = month[pad2(d)];
    const closed = closedOn(storeId, d);
    const dayItems = itemsForDay(storeId, d); // 定休日は0件、日によっても対象項目数が変わる
    const done = countDone(rec, dayItems);
    const td = document.createElement('td');

    if (closed) {
      // 定休日は対象日数にも確認漏れにも数えない
      if (isPast(dateStr) || isToday(dateStr)) closedDays++;
      if (isToday(dateStr)) todayDone = 'closed';
      td.innerHTML = '<i class="cell-mark cell-mark--closed">休</i>';
      td.classList.add('is-closed');
      td.title = `${state.m}/${d}　定休日`;
    } else {
      if (isPast(dateStr)) { pastDays++; totalChecks += dayItems.length; }
      if (isToday(dateStr)) { todayDone = done; todayTotal = dayItems.length; }
      if (dayItems.length > 0 && done === dayItems.length && (isPast(dateStr) || isToday(dateStr))) fullDays++;
      td.textContent = done;
      td.title = `${state.m}/${d}　${done} / ${dayItems.length}`;
      if (isPast(dateStr) && done < dayItems.length) td.classList.add('cell-mark--ng');
    }
    totalTr.appendChild(td);
  }
  tbody.appendChild(totalTr);
  t.appendChild(tbody);

  /* ---- サマリー ---- */
  const rate = totalChecks ? Math.round(((totalChecks - missCount) / totalChecks) * 100) : 0;
  const unit = (s) => `<span style="font-size:13px"> ${s}</span>`;
  const stat = (label, value, ng) =>
    `<div class="stat"><div class="stat__label">${label}</div><div class="stat__value${ng ? ' is-ng' : ''}">${value}</div></div>`;

  el.monthSummary.innerHTML =
    stat('対象日数（前日まで）', pastDays + unit('日')) +
    (closedDays ? stat('定休日', closedDays + unit('日')) : '') +
    stat('全項目クリアの日', fullDays + unit('日')) +
    stat('確認漏れ（前日まで）', missCount + unit('件'), missCount > 0) +
    stat('実施率', rate + unit('%')) +
    (todayDone === null
      ? ''
      : stat('本日の進捗',
          todayDone === 'closed'
            ? '<span style="font-size:17px">定休日</span>'
            : `${todayDone}<span style="font-size:13px"> / ${todayTotal}</span>`));
}

/* ============================================================
 *  全体描画
 * ============================================================ */
function render() {
  el.appTitle.textContent = APP_NAME;
  el.appCompany.textContent = APP.company;

  // 会社ロゴ（読めなければ枠ごと隠す）
  const logoSrc = APP.logo ? ASSET_BASE + APP.logo : '';
  if (logoSrc && el.appLogo.getAttribute('src') !== logoSrc) {
    el.appLogo.addEventListener('error', () => el.appLogo.parentElement.classList.add('is-hidden'), { once: true });
    el.appLogo.src = logoSrc;
  }

  const isStores = state.view === 'stores';
  const isTasks = state.view === 'tasks';
  const isReport = state.view === 'report';
  const isDay = state.view === 'day';
  const isWeek = state.view === 'week';
  const isWeekAll = state.view === 'weekall';

  /* ---- 業務選択画面：店舗の見出しだけ出して、業務の中身は出さない ---- */
  if (isTasks) {
    const store = getStore(state.storeId);
    document.documentElement.style.setProperty('--store', store.color);
    document.title = `${store.name}｜${APP_NAME}`;
    el.storeTabs.classList.remove('is-hidden');
    el.storeHead.classList.add('is-hidden');
    el.dayTabs.classList.add('is-hidden');
    document.body.classList.add('no-daytabs');
    el.viewStores.classList.add('is-hidden');
    el.viewDay.classList.add('is-hidden');
    el.viewWeek.classList.add('is-hidden');
    el.viewWeekAll.classList.add('is-hidden');
    el.viewMonth.classList.add('is-hidden');
    el.viewReport.classList.add('is-hidden');
    el.viewTasks.classList.remove('is-hidden');
    renderStoreTabs();
    renderTaskPicker();
    renderSyncStatus();
    return;
  }
  el.viewTasks.classList.add('is-hidden');

  /* ---- 店舗選択画面：店舗に属する部品はすべて隠す ---- */
  if (isStores) {
    document.documentElement.style.setProperty('--store', APP.accent || '#2b7fd4');
    document.title = APP_NAME;
    el.storeTabs.classList.add('is-hidden');
    el.storeHead.classList.add('is-hidden');
    el.dayTabs.classList.add('is-hidden');
    document.body.classList.add('no-daytabs'); // お知らせバーの位置を下げるため
    el.viewDay.classList.add('is-hidden');
    el.viewWeek.classList.add('is-hidden');
    el.viewWeekAll.classList.add('is-hidden');
    el.viewMonth.classList.add('is-hidden');
    el.viewReport.classList.add('is-hidden');
    el.viewStores.classList.remove('is-hidden');
    renderStorePicker();
    renderSyncStatus();
    return;
  }

  el.viewStores.classList.add('is-hidden');
  el.storeTabs.classList.toggle('is-hidden', isWeekAll);
  // 週間掃除は週ごとに送って見る画面なので、日タブは出しません
  const noDays = isReport || isWeek || isWeekAll;
  el.dayTabs.classList.toggle('is-hidden', noDays);
  document.body.classList.toggle('no-daytabs', noDays);

  const store = getStore(state.storeId);
  document.documentElement.style.setProperty('--store', store.color);
  document.title = `${store.name}｜${APP_NAME}`;
  el.storeName.textContent = store.name;
  fillLogo(el.storeLogo, store);

  // 定休日をいつでも見えるように、店舗名の横に出しておく
  const closedDows = Closed.dows(store.id);
  el.storeClosedBadge.classList.toggle('is-hidden', closedDows.length === 0);
  if (closedDows.length) {
    el.storeClosedBadge.textContent = '毎週' + closedDows.map((n) => DOW[n]).join('・') + '曜定休';
  }

  renderStoreTabs();
  renderMonthTabs();
  renderDayTabs();

  // 全店舗の画面は店舗に属さないので、店舗見出しごと隠す
  el.storeHead.classList.toggle('is-hidden', isReport || isWeekAll);
  // 週間掃除は2週間ずつ送るので、年・月タブは使いません
  el.storeHead.classList.toggle('is-weekview', isWeek);
  // いま開いている業務の名前（タップで業務の一覧に戻ります）
  const task = getTask(state.view);
  if (task) el.taskBarName.textContent = task.name;

  el.viewDay.classList.toggle('is-hidden', !isDay);
  el.viewWeek.classList.toggle('is-hidden', !isWeek);
  el.viewWeekAll.classList.toggle('is-hidden', !isWeekAll);
  el.viewMonth.classList.toggle('is-hidden', state.view !== 'month');
  el.viewReport.classList.toggle('is-hidden', !isReport);

  if (isReport) renderReport();
  else if (isDay) renderDayView();
  else if (isWeek) renderWeekView();
  else if (isWeekAll) renderWeekAll();
  else renderMonthView();

  renderSyncStatus();
}

/* ============================================================
 *  セクションの折りたたみ状態（店舗ごとに記憶）
 * ============================================================ */
const FOLD_KEY = APP.storageKey + ':folded';

function foldedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FOLD_KEY) || '[]'));
  } catch (e) {
    return new Set();
  }
}
function isFolded(sectionId) {
  return foldedSet().has(`${state.storeId}:${sectionId}`);
}
function setFolded(sectionId, folded) {
  const set = foldedSet();
  const key = `${state.storeId}:${sectionId}`;
  if (folded) set.add(key);
  else set.delete(key);
  localStorage.setItem(FOLD_KEY, JSON.stringify([...set]));
}

/* ============================================================
 *  誤チェック防止の確認ダイアログ
 *  askConfirm(...).then(ok => ...) で使う
 * ============================================================ */
let confirmResolve = null;

function askConfirm({ item, message, okLabel, danger }) {
  el.confirmItem.textContent = item || '';
  el.confirmMessage.textContent = message || '';
  el.confirmOk.textContent = okLabel || 'はい';
  el.confirmOk.classList.toggle('btn--danger', !!danger);
  el.confirmDialog.classList.remove('is-hidden');
  setTimeout(() => el.confirmOk.focus(), 50);

  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

function closeConfirm(answer) {
  if (el.confirmDialog.classList.contains('is-hidden')) return;
  el.confirmDialog.classList.add('is-hidden');
  const resolve = confirmResolve;
  confirmResolve = null;
  if (resolve) resolve(answer);
}

/* ============================================================
 *  共有同期の状態表示・PIN
 * ============================================================ */
function renderSyncStatus() {
  const st = Sync.status();
  el.syncChip.classList.toggle('is-hidden', st.kind === 'off');
  if (st.kind !== 'off') {
    // 文字は出さず、形と色だけで見せます（狭いヘッダーでも場所を取らないため）。
    // 「未送信 3件」などの詳しい説明は、設定の画面と長押しの吹き出しに出ます。
    el.syncChip.className = 'sync-chip sync-chip--' + st.kind;
    el.syncChip.innerHTML = Sync.iconSvg(st.kind);
    el.syncChip.title = st.text + '（タップで今すぐ同期）';
    el.syncChip.setAttribute('aria-label', '同期の状態：' + st.text);
  }

  // 設定画面の説明も、共有版かどうかで出し分ける
  el.syncField.classList.toggle('is-hidden', !Sync.enabled());
  if (Sync.enabled()) {
    const n = Sync.outbox().length;
    // 最終同期の時刻も出しておく。届かないときの切り分けに使えます
    const t = Sync.lastSyncAt;
    const at = t ? `（最終同期 ${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}）` : '';
    el.syncInfo.textContent = Sync.lastError
      ? `${Sync.lastError}（未送信 ${n}件。つながり次第、自動で送られます）`
      : n
        ? `未送信 ${n}件。まもなく送信されます。${at}`
        : `全店舗と同期できています。${at}`;
  }
}

function openPinModal(message) {
  el.pinInput.value = '';
  el.pinError.textContent = message || '';
  el.pinModal.classList.remove('is-hidden');
  setTimeout(() => el.pinInput.focus(), 50);
}

async function submitPin() {
  const pin = el.pinInput.value.trim();
  if (!pin) { el.pinError.textContent = 'PINを入力してください。'; return; }
  el.pinError.textContent = '確認中…';
  Sync.setPin(pin);
  await Sync.flush();
  if (Sync.pin()) {
    el.pinModal.classList.add('is-hidden');
    Sync.start();
    render();
  } else {
    el.pinError.textContent = Sync.lastError || 'PINが違います。もう一度入力してください。';
  }
}

/* ============================================================
 *  設定モーダル
 * ============================================================ */
function openModal() {
  renderSyncStatus();
  el.modal.classList.remove('is-hidden');
  // スマホでいきなりキーボードが出ないよう、自動フォーカスはしない
}

function closeModal() {
  el.modal.classList.add('is-hidden');
}

/* ============================================================
 *  イベント登録
 * ============================================================ */
function bindEvents() {
  /* 業務の一覧へ戻る */
  $('taskBar').addEventListener('click', goTasks);
  $('tasksBackBtn').addEventListener('click', goHome);

  /* 年送り */
  $('prevYear').addEventListener('click', () => {
    state.y--;
    state.d = Math.min(state.d, daysInMonth(state.y, state.m));
    writeHash(); render();
  });
  $('nextYear').addEventListener('click', () => {
    state.y++;
    state.d = Math.min(state.d, daysInMonth(state.y, state.m));
    writeHash(); render();
  });
  $('todayBtn').addEventListener('click', () => {
    state.y = TODAY.y; state.m = TODAY.m; state.d = TODAY.d; state.view = 'day';
    writeHash(); render();
  });

  /* その日の担当者 */
  el.staffSelect.addEventListener('change', () => {
    const dateStr = ymd(state.y, state.m, state.d);
    if (el.staffSelect.value === '__edit__') {
      // 元の選択に戻してから設定を開く
      renderStaffSelect(Store.getDay(state.storeId, dateStr).staff || '');
      openModal();
      return;
    }
    Store.setStaff(state.storeId, dateStr, el.staffSelect.value);
    el.staffSelect.classList.toggle('is-empty', !el.staffSelect.value);
    refreshProgress();
  });

  /* 申し送りメモ（入力が止まったら保存） */
  let noteTimer = null;
  const saveNote = () => {
    Store.setNote(state.storeId, ymd(state.y, state.m, state.d), el.note.value);
    refreshProgress();
  };
  el.note.addEventListener('input', () => {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(saveNote, 600);
  });
  el.note.addEventListener('blur', () => { clearTimeout(noteTimer); saveNote(); });

  /* 週間掃除の備考（2週間ごと。入力が止まったら保存） */
  let weekNoteTimer = null;
  const saveWeekNote = () => {
    Store.setNote(state.storeId, weekRecKey(currentPeriod()), el.weekNote.value);
    renderSyncStatus();
  };
  el.weekNote.addEventListener('input', () => {
    clearTimeout(weekNoteTimer);
    weekNoteTimer = setTimeout(saveWeekNote, 600);
  });
  el.weekNote.addEventListener('blur', () => { clearTimeout(weekNoteTimer); saveWeekNote(); });

  /* 週間掃除：やった人を選ぶ */
  el.doerModal.querySelectorAll('[data-doer-close]').forEach((n) =>
    n.addEventListener('click', closeDoerModal)
  );
  el.doerClear.addEventListener('click', clearDoer);

  /* 週間掃除：2週間ずつ送る */
  const shiftWeek = (dir) => {
    goToWeek(addDaysStr(currentPeriod(), dir * 14));
    writeHash();
    render();
  };
  $('weekPrev').addEventListener('click', () => shiftWeek(-1));
  $('weekNext').addEventListener('click', () => shiftWeek(1));
  $('weekToday').addEventListener('click', () => {
    state.y = TODAY.y; state.m = TODAY.m; state.d = TODAY.d;
    writeHash(); render();
  });

  /* 週間掃除：2週間分の提出（提出する人を選ぶまで押せません） */
  el.periodStaff.addEventListener('change', refreshPeriodSubmitBtn);
  el.periodSubmitBtn.addEventListener('click', submitPeriod);
  $('periodUnsubmitBtn').addEventListener('click', unsubmitPeriod);

  /* 6店舗の達成状況 */
  $('weekAllBtn').addEventListener('click', () => openAllStores('weekall'));
  $('weekAllBack').addEventListener('click', goHome);
  $('weekAllPrev').addEventListener('click', () => { goToWeek(addDaysStr(currentPeriod(), -14)); writeHash(); render(); });
  $('weekAllNext').addEventListener('click', () => { goToWeek(addDaysStr(currentPeriod(), 14)); writeHash(); render(); });
  $('weekAllToday').addEventListener('click', () => {
    state.y = TODAY.y; state.m = TODAY.m; state.d = TODAY.d;
    writeHash(); render();
  });
  $('storesWeekAllBtn').addEventListener('click', () => openAllStores('weekall'));

  /* 確認ダイアログ */
  el.confirmOk.addEventListener('click', () => closeConfirm(true));
  el.confirmDialog.querySelectorAll('[data-confirm-cancel]').forEach((n) =>
    n.addEventListener('click', () => closeConfirm(false))
  );

  /* 提出 */
  el.submitBtn.addEventListener('click', submitDay);
  el.unsubmitBtn.addEventListener('click', unsubmitDay);

  /* 全店舗提出記録（店舗に属さない画面なので、戻り先は店舗選択） */
  const openAllStores = (view) => {
    state.storeId = '';
    state.view = view;
    writeHash(); render(); window.scrollTo(0, 0);
  };
  $('reportBtn').addEventListener('click', () => openAllStores('report'));
  $('reportBack').addEventListener('click', goHome);
  $('homeBtn').addEventListener('click', goHome);
  $('storesReportBtn').addEventListener('click', () => openAllStores('report'));
  $('reportPrev').addEventListener('click', () => shiftDay(-1));
  $('reportNext').addEventListener('click', () => shiftDay(1));
  $('reportToday').addEventListener('click', () => {
    state.y = TODAY.y; state.m = TODAY.m; state.d = TODAY.d;
    writeHash(); render();
  });

  /* この日だけ営業／休業 */
  el.closedToggle.addEventListener('click', toggleDayClosed);
  el.overrideReset.addEventListener('click', () => {
    Closed.setException(state.storeId, ymd(state.y, state.m, state.d), null);
    render();
  });

  /* 共有同期 */
  el.syncChip.addEventListener('click', () => Sync.flush());
  $('syncNow').addEventListener('click', () => Sync.flush());
  $('pinChange').addEventListener('click', () => { closeModal(); openPinModal(); });
  $('pinOk').addEventListener('click', submitPin);
  el.pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPin(); });
  // 貼り付けた内容が正しいか目で確かめられるようにする
  $('pinReveal').addEventListener('click', () => {
    const show = el.pinInput.type === 'password';
    el.pinInput.type = show ? 'text' : 'password';
    $('pinReveal').textContent = show ? '隠す' : '表示';
  });

  /* 設定（この端末の設定のみ。項目・担当者・定休日は管理アプリで） */
  el.settingsBtn.addEventListener('click', () => openModal());
  el.modal.querySelectorAll('[data-close]').forEach((n) => n.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!el.confirmDialog.classList.contains('is-hidden')) closeConfirm(false);
    else if (!el.doerModal.classList.contains('is-hidden')) closeDoerModal();
    else closeModal();
  });

  /* 戻る／進むボタン、直接URL入力 */
  window.addEventListener('hashchange', () => {
    readHash();
    writeHash(true); // 月間表オフのときなど、読み替えた結果をURLにも反映する
    render();
  });
}

/* ============================================================
 *  起動
 * ============================================================ */
function init() {
  readHash();
  writeHash(true);
  bindEvents();
  render();

  // 新しい版が公開されたら画面下で知らせる（PINの有無に関係なく動かす）
  Updater.start();

  // 共有版のとき：PIN未入力なら先に聞く。入力済みならすぐ同期を始める
  if (Sync.enabled()) {
    Sync.onChange = renderSyncStatus;
    if (!Sync.pin()) openPinModal();
    else Sync.start();
    return;
  }

  // 担当者が1人も登録されていなければ、最初に設定を開く
  if (Staff.list().length === 0) openModal();
}

init();
