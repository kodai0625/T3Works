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

/* 「今日」は業務上の今日です。朝6時（APP.dayStartHour）より前は前の日あつかい。
   締めが0時をまたいでも、開くページは前の日のままになります */
const today = businessDate();
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
  syncLegend: $('syncLegend'),
  pinModal: $('pinModal'), pinInput: $('pinInput'), pinError: $('pinError'),
  dayNum: $('dayNum'), dayDow: $('dayDow'), dayRollover: $('dayRollover'),
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
  anytimeBlock: $('anytimeBlock'), anytimeList: $('anytimeList'),
  viewExpense: $('viewExpense'), expenseMonth: $('expenseMonth'),
  expenseSummary: $('expenseSummary'), expenseList: $('expenseList'),
  expenseModal: $('expenseModal'), expDate: $('expDate'), expBy: $('expBy'),
  expLabel: $('expLabel'), expYen: $('expYen'), expChips: $('expChips'),
  expenseTotals: $('expenseTotals'), expenseTotalWrap: $('expenseTotalWrap'),
  expenseFoot: $('expenseFoot'), expenseTotalYen: $('expenseTotalYen'),
  expenseUnpaidYen: $('expenseUnpaidYen'), expenseUnpaidBox: $('expenseUnpaidBox'),
  expensePeople: $('expensePeople'),
  viewCatch: $('viewCatch'), catchMonth: $('catchMonth'),
  catchSummary: $('catchSummary'), catchTotals: $('catchTotals'), catchList: $('catchList'),
  catchFoot: $('catchFoot'), catchPeopleTotal: $('catchPeopleTotal'),
  catchYenTotal: $('catchYenTotal'),
  viewSettle: $('viewSettle'), settleYear: $('settleYear'), settleSummary: $('settleSummary'),
  settleLockBtn: $('settleLockBtn'),
  settleRows: $('settleRows'), settleFoot: $('settleFoot'),
  settleModal: $('settleModal'), settleFormTitle: $('settleFormTitle'),
  settleFormYen: $('settleFormYen'), settleDate: $('settleDate'),
  settleAccounts: $('settleAccounts'), settleAccount: $('settleAccount'),
  settleError: $('settleError'), settleSave: $('settleSave'), settleClear: $('settleClear'),
  viewMeeting: $('viewMeeting'), meetingMonth: $('meetingMonth'),
  meetingSalesYen: $('meetingSalesYen'), meetingVsLast: $('meetingVsLast'),
  meetingVsLastLabel: $('meetingVsLastLabel'),
  meetingGuests: $('meetingGuests'), meetingSummary: $('meetingSummary'),
  meetingNote: $('meetingNote'),
  meetingBar: $('meetingBar'), meetingModeSeg: $('meetingMode'),
  meetingTableWrap: $('meetingTableWrap'), meetingScrollHint: $('meetingScrollHint'),
  meetingHead: $('meetingHead'),
  meetingBody: $('meetingBody'), meetingFoot: $('meetingFoot'),
  meetingCumWrap: $('meetingCumWrap'), meetingCumBody: $('meetingCumBody'),
  meetingCumFoot: $('meetingCumFoot'), meetingCumRange: $('meetingCumRange'),
  meetingCumYearHead: $('meetingCumYearHead'),
  meetingGoals: $('meetingGoals'), meetingGoalPace: $('meetingGoalPace'),
  meetingGoalNote: $('meetingGoalNote'),
  meetingNotes: $('meetingNotes'), meetingNoteCount: $('meetingNoteCount'),
  expStoreField: $('expStoreField'), expStores: $('expStores'),
  expPeopleField: $('expPeopleField'), expPeople: $('expPeople'),
  expFreeField: $('expFreeField'),
  expReceiptSeg: $('expReceipt'), expenseError: $('expenseError'),
  expenseFormTitle: $('expenseFormTitle'), expenseSave: $('expenseSave'),
  viewWeekAll: $('viewWeekAll'), weekAllRange: $('weekAllRange'),
  weekAllSummary: $('weekAllSummary'), weekAllList: $('weekAllList'),
  doerModal: $('doerModal'), doerItem: $('doerItem'), doerWeek: $('doerWeek'),
  doerGrid: $('doerGrid'), doerClear: $('doerClear'),
  settingsBtn: $('settingsBtn'), modal: $('modal'),
  appVersionText: $('appVersionText'), forceUpdate: $('forceUpdate'),
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
const ALL_STORE_VIEWS = ['report', 'weekall', 'expense', 'catch', 'settle', 'meeting'];

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
  if (!task || (typeof task.when === 'function' && !task.when(state.storeId))) {
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
   body に data-assets="../" を付けるので、その分だけ前に足します */
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

  /* --- 0時を過ぎたときの案内 ---
     カレンダーの日付と、業務上の今日がズレているあいだだけ出します */
  const real = new Date();
  const realStr = ymd(real.getFullYear(), real.getMonth() + 1, real.getDate());
  const rollover = dateStr === TODAY_STR && realStr !== TODAY_STR;
  el.dayRollover.classList.toggle('is-hidden', !rollover);
  if (rollover) {
    el.dayRollover.textContent =
      `日付は変わりましたが、朝${APP.dayStartHour}時までは ${state.m}/${state.d} の分として開いています。`;
  }

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

  if (taskId === 'anytime') {
    const items = getAnytime(storeId);
    if (!items.length) return { text: '項目なし', kind: 'none' };
    // 期限が無い掃除なので、達成率ではなく「まだ一度も記録が無い数」を出します
    const rec = Store.getDay(storeId, ANYTIME_KEY);
    const never = items.filter((it) => !rec.items?.[it.id]?.at).length;
    return never
      ? { text: `${items.length}件　未記録 ${never}`, kind: 'todo' }
      : { text: `${items.length}件`, kind: 'none' };
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
  taskList(store.id).forEach((task) => {
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
 *  立替金
 *
 *  お店ではなく「人」と「月」でまとめます。
 *  1件＝1つの項目として  _expense/2026-08  の中に入るので、
 *  同期の仕組み（スプレッドシート）はそのまま使えます。
 * ---------------------------------------------------------- */
/** いま見ている月の記録 */
function expenseRec() {
  return Store.getDay(EXPENSE_STORE, expenseMonthKey(state.y, state.m));
}

/** 1件分の明細だけ取り出す（精算済みの印は除く） */
function expenseEntries(rec) {
  const items = rec.items || {};
  return Object.keys(items)
    .filter((id) => !id.startsWith('paid:') && items[id] && items[id].yen)
    .map((id) => ({ id, ...items[id] }))
    .sort((a, b) => (a.d || '').localeCompare(b.d || '') || (a.at || '').localeCompare(b.at || ''));
}

/**
 * 人ごとにまとめる
 *
 * 並びは、クローズの担当者プルダウンと同じ順番です。
 * 月が変わっても同じ場所に同じ人がいる方が、探しやすいためです
 * （順番を変えたいときは、マネージの「担当者」で並べ替えます）。
 *
 * 立て替えが1件も無い人も、¥0 として行を出します。
 * 「この人はまだ入れていないのか、それとも本当に0円なのか」が
 * ひと目で分かるようにするためです（配達記録の表と同じ考え方）。
 *
 * 担当者リストに無い名前（辞めた方など）は、記録があるときだけ
 * いちばん下に出ます。
 */
function expenseByPerson(rec) {
  const order = Staff.list();
  const map = new Map();
  order.forEach((name) => map.set(name, []));   // 0円の人も行を出すため、先に並べておく

  expenseEntries(rec).forEach((e) => {
    const name = e.by || '（名前なし）';
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(e);
  });
  const rank = (name) => {
    const i = order.indexOf(name);
    return i < 0 ? order.length : i;   // リストに無い人は下へ
  };

  return [...map.entries()]
    .map(([name, list]) => ({
      name,
      list,
      total: list.reduce((t, e) => t + (Number(e.yen) || 0), 0),
      paid: (rec.items || {})[expensePaidKey(name)] || null,
    }))
    // リストに無い人どうしは、金額の大きい順に並べます
    .sort((a, b) => rank(a.name) - rank(b.name) || b.total - a.total);
}

function yenText(n) {
  return '¥' + (Number(n) || 0).toLocaleString('ja-JP');
}

/**
 * 金額を「¥ だけ小さく、数字は大きく」出す
 *
 * 帳簿らしい見え方にするためのものです。¥ を消してしまうと
 * 何の数字か分からなくなるので、消さずに控えめにしています。
 */
function yenMarkup(n) {
  return `<span class="yen-mark">¥</span>${(Number(n) || 0).toLocaleString('ja-JP')}`;
}

function renderExpense() {
  const rec = expenseRec();
  const people = expenseByPerson(rec);
  // 立て替えがあった人だけ。人数や未精算の数は、この人たちで数えます
  // （0円の人は「渡すものが無い」ので、精算のしようがありません）
  const paying = people.filter((p) => p.total > 0);
  const total = paying.reduce((t, p) => t + p.total, 0);
  const unpaid = paying.filter((p) => !(p.paid && p.paid.done));

  const unpaidYen = unpaid.reduce((t, p) => t + p.total, 0);

  el.expenseMonth.textContent = `${state.y}年${state.m}月`;

  /* ---- 表紙の数字 ---- */
  el.expenseTotalYen.innerHTML = yenMarkup(total);
  el.expenseUnpaidYen.innerHTML = yenMarkup(unpaidYen);
  el.expensePeople.innerHTML =
    `${paying.length}<span class="ledger-figure__unit">人</span>`;
  // 渡していない分が残っている月だけ、この数字に色を付けます
  el.expenseUnpaidBox.classList.toggle('is-on', unpaidYen > 0);
  // 数字を出しているので、下の一文は「記録がない」ときの案内だけにします
  el.expenseSummary.textContent = paying.length ? '' : 'この月の記録はまだありません。';
  el.expenseSummary.classList.toggle('is-hidden', paying.length > 0);

  /* ---- 上の表：人ごとの合計と精算（スプレッドシートの「N月合計」） ---- */
  el.expenseTotalWrap.classList.toggle('is-hidden', people.length === 0);
  el.expenseTotals.innerHTML = '';
  people.forEach((p) => {
    const done = !!(p.paid && p.paid.done);
    const zero = p.total === 0;
    const tr = document.createElement('tr');
    if (done) tr.className = 'is-paid';
    else if (zero) tr.className = 'is-zero';   // 立て替えが無い人は色を落とす

    const name = document.createElement('td');
    name.className = 'exp-total__name';
    name.textContent = p.name;

    const yenTd = document.createElement('td');
    yenTd.className = 'exp-total__yen';
    if (zero) yenTd.textContent = '—';
    else yenTd.innerHTML = yenMarkup(p.total);

    const act = document.createElement('td');
    // 0円の人には精算ボタンを出しません（押しても渡すものがないため）
    if (!zero) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'exp-paid-btn' + (done ? ' is-done' : '');
      btn.textContent = done ? '済 ' + (shortDate(p.paid.at) || '') : '精算';
      btn.title = done ? '押すと精算をとり消します' : '現金を渡したら押します';
      btn.addEventListener('click', () => togglePaid(p));
      act.appendChild(btn);
    }

    tr.append(name, yenTd, act);
    el.expenseTotals.appendChild(tr);
  });

  /* ---- いちばん下の合計行（帳簿の〆） ---- */
  el.expenseFoot.innerHTML = '';
  if (paying.length) {
    const tr = document.createElement('tr');
    tr.className = 'ledger-foot';
    tr.innerHTML =
      `<td class="exp-total__name">合計　<span class="ledger-foot__note">${paying.length}人</span></td>` +
      `<td class="exp-total__yen">${yenMarkup(total)}</td><td></td>`;
    el.expenseFoot.appendChild(tr);
  }

  /* ---- 下：人ごとの明細（立て替えがあった人だけ） ---- */
  el.expenseList.innerHTML = '';
  paying.forEach((p) => {
    const done = !!(p.paid && p.paid.done);
    const card = document.createElement('section');
    card.className = 'exp-card' + (done ? ' is-paid' : '');

    const head = document.createElement('div');
    head.className = 'exp-card__head';
    // 名前・件数・その人の合計。上の表を見に戻らなくても分かるようにします
    head.innerHTML =
      '<span class="exp-card__name"></span>' +
      `<span class="exp-card__count">${p.list.length}件</span>` +
      `<span class="exp-card__total">${yenMarkup(p.total)}</span>`;
    head.querySelector('.exp-card__name').textContent = p.name;
    if (done) {
      const tag = document.createElement('span');
      tag.className = 'exp-card__paid';
      tag.textContent = '精算済み ' + (shortDate(p.paid.at) || '');
      head.appendChild(tag);
    }
    card.appendChild(head);

    const list = document.createElement('ul');
    list.className = 'exp-rows';
    p.list.forEach((e) => {
      const li = document.createElement('li');
      li.className = 'exp-row';
      const [, m, d] = (e.d || '').split('-');
      li.innerHTML =
        `<span class="exp-row__date">${m ? `${+m}/${+d}` : '—'}</span>` +
        `<span class="exp-row__label"></span>` +
        `<span class="exp-row__receipt${e.receipt ? '' : ' is-none'}">${e.receipt ? '◯' : '×'}</span>` +
        `<span class="exp-row__yen">${yenMarkup(e.yen)}</span>`;
      li.querySelector('.exp-row__label').textContent = e.label || '（項目なし）';
      // 精算が済むまでは、間違えて入れたものを直したり消したりできます
      if (!done) {
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'row-edit';
        edit.textContent = '編集';
        edit.title = 'この1件を直す';
        edit.addEventListener('click', () => openExpenseForm(e));
        li.appendChild(edit);

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'exp-row__del';
        del.textContent = '×';
        del.title = 'この1件を消す';
        del.addEventListener('click', () => removeExpense(e));
        li.appendChild(del);
      }
      list.appendChild(li);
    });
    card.appendChild(list);
    el.expenseList.appendChild(card);
  });
}

async function togglePaid(p) {
  const key = expenseMonthKey(state.y, state.m);
  const done = !!(p.paid && p.paid.done);
  if (done) {
    const ok = await askConfirm({
      item: p.name,
      message: '精算済みをとり消します。よろしいですか？',
    });
    if (!ok) return;
    Store.setItem(EXPENSE_STORE, key, expensePaidKey(p.name), { done: false, by: '' });
  } else {
    const ok = await askConfirm({
      item: `${p.name}　${yenText(p.total)}`,
      message: `${state.m}月分を現金で渡したことにします。よろしいですか？`,
      okLabel: '渡した',
    });
    if (!ok) return;
    Store.setItem(EXPENSE_STORE, key, expensePaidKey(p.name), { done: true, by: p.name });
  }
  renderExpense();
  renderSyncStatus();
}

async function removeExpense(e) {
  const ok = await askConfirm({
    item: `${e.label}　${yenText(e.yen)}`,
    message: 'この1件を消します。よろしいですか？',
    okLabel: '消す',
    danger: true,
  });
  if (!ok) return;
  // 金額を0にすると一覧から外れます（消したことも同期で全端末に伝わります）
  Store.setItem(EXPENSE_STORE, expenseMonthKey(state.y, state.m), e.id, { yen: 0, done: false });
  renderExpense();
  renderSyncStatus();
}

/* ---- 入力画面 ----
 *
 *  何も渡さなければ「新しく入れる」画面、
 *  一覧の「編集」から1件を渡すと「直す」画面になります。
 *  直したときは同じ番号に上書きするので、二重にはなりません。
 */
let expReceipt = true;
let expKind = '';     // 支払い項目の種類（parking / buy / catch / change / other）
let expStore = '';    // 買い出し・キャッチのときの店舗
let expEditing = null; // 直しているとき、その1件

function openExpenseForm(entry) {
  expEditing = entry || null;
  el.expDate.value = expEditing ? expEditing.d : ymd(TODAY.y, TODAY.m, TODAY.d);
  el.expLabel.value = '';
  el.expYen.value = expEditing ? expEditing.yen : '';
  el.expPeople.value = expEditing && expEditing.people ? expEditing.people : '';
  el.expenseError.textContent = '';
  expReceipt = expEditing ? !!expEditing.receipt : true;
  expKind = expEditing ? (expEditing.kind || '') : '';
  expStore = expEditing ? (expEditing.store || '') : '';
  // 「その他」は内容を自由に書いているので、その文字も戻します
  if (expEditing && getExpenseKind(expKind) && getExpenseKind(expKind).free) {
    el.expLabel.value = expEditing.label || '';
  }
  renderReceiptSeg();

  el.expenseFormTitle.textContent = expEditing ? '記録を直す' : '立て替えを記録する';
  el.expenseSave.textContent = expEditing ? '直す' : '記録する';

  const names = Staff.list();
  // 担当者リストから消された人の記録を直すときも、その名前を残しておきます
  if (expEditing && expEditing.by && !names.includes(expEditing.by)) names.push(expEditing.by);
  el.expBy.innerHTML = '<option value="">選んでください</option>';
  names.forEach((n) => {
    const o = document.createElement('option');
    o.value = n;
    o.textContent = n;
    el.expBy.appendChild(o);
  });
  if (expEditing) el.expBy.value = expEditing.by || '';

  /* 支払い項目のボタン */
  el.expChips.innerHTML = '';
  EXPENSE_KINDS.forEach((kind) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'exp-chip';
    b.dataset.kind = kind.id;
    b.textContent = kind.name;
    b.addEventListener('click', () => { expKind = kind.id; renderExpenseForm(); });
    el.expChips.appendChild(b);
  });

  /* 店舗のボタン（買い出し・キャッチのときだけ出ます） */
  el.expStores.innerHTML = '';
  STORES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'exp-chip';
    b.dataset.store = s.id;
    // えらんだときは、その店舗の色にします（一覧の店舗カードと同じ色）
    b.style.setProperty('--pick-color', s.color);
    // 略さない名前を出します（「おいでん」ではなく「おいでんテラス」）
    b.textContent = s.name;
    b.addEventListener('click', () => { expStore = s.id; renderExpenseForm(); });
    el.expStores.appendChild(b);
  });

  renderExpenseForm();
  el.expenseModal.classList.remove('is-hidden');
}

/** えらんだ項目に合わせて、下の入力欄を出し入れします */
function renderExpenseForm() {
  const kind = getExpenseKind(expKind);
  [...el.expChips.children].forEach((b) => b.classList.toggle('is-on', b.dataset.kind === expKind));
  [...el.expStores.children].forEach((b) => b.classList.toggle('is-on', b.dataset.store === expStore));

  el.expStoreField.classList.toggle('is-hidden', !(kind && kind.store));
  el.expPeopleField.classList.toggle('is-hidden', !(kind && kind.people));
  el.expFreeField.classList.toggle('is-hidden', !(kind && kind.free));
}

function renderReceiptSeg() {
  [...el.expReceiptSeg.querySelectorAll('.seg__btn')].forEach((b) => {
    b.classList.toggle('is-on', (b.dataset.receipt === '1') === expReceipt);
  });
}

function saveExpense() {
  const d = el.expDate.value;
  const by = el.expBy.value;
  const kind = getExpenseKind(expKind);
  // 全角で入っていても読めるよう、ここでも半角に直してから数字にします
  const people = Math.round(Number(toHalfWidthNumber(el.expPeople.value)));
  const y = Math.round(Number(toHalfWidthNumber(el.expYen.value)));
  const label = expenseLabelOf(expKind, expStore, people, el.expLabel.value);

  if (!d) { el.expenseError.textContent = '支払った日を入れてください。'; return; }
  if (!by) { el.expenseError.textContent = '立て替えた人を選んでください。'; return; }
  if (!kind) { el.expenseError.textContent = '支払い項目をえらんでください。'; return; }
  if (kind.store && !expStore) { el.expenseError.textContent = 'どの店舗かをえらんでください。'; return; }
  if (kind.people && (!people || people <= 0)) { el.expenseError.textContent = '人数を入れてください。'; return; }
  if (!label) { el.expenseError.textContent = '内容を入れてください。'; return; }
  if (!y || y <= 0) { el.expenseError.textContent = '金額を入れてください。'; return; }

  // 入れ先は「支払った日の月」。月をまたいで入れても、正しい月に入ります
  const [yy, mm] = d.split('-').map(Number);
  const key = expenseMonthKey(yy, mm);
  const id = expEditing ? expEditing.id
    : 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // 直すときに日付を別の月へ動かした場合は、元の月から取り除いてから移します
  if (expEditing) {
    const from = expenseMonthKey(state.y, state.m);
    if (from !== key) Store.setItem(EXPENSE_STORE, from, id, { yen: 0, done: false });
  }

  Store.setItem(EXPENSE_STORE, key, id, {
    done: true, d, by, label, yen: y, receipt: expReceipt,
    // あとから店舗ごとに集計できるよう、えらんだ内容もそのまま残します
    kind: expKind, store: expStore || '', people: kind.people ? people : 0,
  });

  // 入れた月を表示する（先月分を入れたときも、その場で確かめられます）
  state.y = yy;
  state.m = mm;
  el.expenseModal.classList.add('is-hidden');
  writeHash();
  renderExpense();
  renderSyncStatus();
}

/* ------------------------------------------------------------
 *  キャッチ集計
 *
 *  現金支払管理表に入れた「キャッチ」だけを取り出して、
 *  その月に 店舗ごとで 何人つれてきて いくら払ったか を出します。
 * ---------------------------------------------------------- */
function catchByStore() {
  const entries = expenseEntries(expenseRec()).filter((e) => e.kind === 'catch');

  const map = new Map();
  const add = (id) => {
    if (!map.has(id)) map.set(id, { id, list: [], people: 0, yen: 0 });
    return map.get(id);
  };
  CATCH_STORES.forEach(add);                 // 0人の月でも行を出すため、先に並べておく
  entries.forEach((e) => {
    const row = add(e.store || '');
    row.list.push(e);
    row.people += Number(e.people) || 0;
    row.yen += Number(e.yen) || 0;
  });

  return [...map.values()].filter((r) => r.id || r.list.length);
}

function renderCatch() {
  const rows = catchByStore();
  const people = rows.reduce((t, r) => t + r.people, 0);
  const total = rows.reduce((t, r) => t + r.yen, 0);

  el.catchMonth.textContent = `${state.y}年${state.m}月`;
  el.catchPeopleTotal.innerHTML = `${people}<span class="ledger-figure__unit">名</span>`;
  el.catchYenTotal.innerHTML = yenMarkup(total);
  el.catchSummary.textContent = people ? '' : 'この月のキャッチの記録はまだありません。';
  el.catchSummary.classList.toggle('is-hidden', people > 0);

  el.catchTotals.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    if (!r.people) tr.className = 'is-zero';   // 0人の店舗は色を落とす

    const name = document.createElement('td');
    name.className = 'exp-total__name';
    name.textContent = r.id ? getStore(r.id).name : '（店舗なし）';
    // 店舗の色を細い帯で添えます（一覧画面の店舗カードと同じ色）
    if (r.id && r.people) tr.style.setProperty('--row-color', getStore(r.id).color);

    const p = document.createElement('td');
    p.className = 'exp-total__yen';
    p.innerHTML = r.people ? `${r.people}<span class="ledger-unit">名</span>` : '—';

    const y = document.createElement('td');
    y.className = 'exp-total__yen';
    y.innerHTML = r.yen ? yenMarkup(r.yen) : '—';

    tr.append(name, p, y);
    el.catchTotals.appendChild(tr);
  });

  /* ---- いちばん下の合計行 ---- */
  el.catchFoot.innerHTML = '';
  if (people) {
    const tr = document.createElement('tr');
    tr.className = 'ledger-foot';
    tr.innerHTML =
      '<td class="exp-total__name">合計</td>' +
      `<td class="exp-total__yen">${people}<span class="ledger-unit">名</span></td>` +
      `<td class="exp-total__yen">${yenMarkup(total)}</td>`;
    el.catchFoot.appendChild(tr);
  }

  /* ---- 店舗ごとの明細 ---- */
  el.catchList.innerHTML = '';
  rows.filter((r) => r.list.length).forEach((r) => {
    const card = document.createElement('section');
    card.className = 'exp-card';
    // 左の帯と店舗名の色。一覧画面の店舗カードと同じ色を使います
    if (r.id) card.style.setProperty('--card-color', getStore(r.id).color);

    const head = document.createElement('div');
    head.className = 'exp-card__head';
    head.innerHTML =
      '<span class="exp-card__name"></span>' +
      `<span class="exp-card__count">${r.people}名</span>` +
      `<span class="exp-card__total">${yenMarkup(r.yen)}</span>`;
    head.querySelector('.exp-card__name').textContent = r.id ? getStore(r.id).name : '（店舗なし）';
    card.appendChild(head);

    const list = document.createElement('ul');
    list.className = 'exp-rows';
    r.list.forEach((e) => {
      const li = document.createElement('li');
      li.className = 'exp-row';
      const [, m, d] = (e.d || '').split('-');
      li.innerHTML =
        `<span class="exp-row__date">${m ? `${+m}/${+d}` : '—'}</span>` +
        '<span class="exp-row__label"></span>' +
        `<span class="exp-row__yen">${yenMarkup(e.yen)}</span>`;
      li.querySelector('.exp-row__label').textContent = `${e.people || 0}名　${e.by || ''}`;
      list.appendChild(li);
    });
    card.appendChild(list);
    el.catchList.appendChild(card);
  });
}

/* ============================================================
 *  精算履歴（経理担当だけ・T3 Works Mine にしか出しません）
 *
 *  その月分をまとめて会社の口座から払った記録です。
 *  金額はここでは持たず、現金支払管理表から毎回計算します。
 *  スプレッドシートで  ='1月'!C17  と参照していたのと同じで、
 *  あとから明細を直せば、この表の金額も勝手に付いてきます。
 * ============================================================ */

/** その月の立替の合計（現金支払管理表の合計と同じ数字） */
function expenseTotalOf(y, m) {
  const rec = Store.getDay(EXPENSE_STORE, expenseMonthKey(y, m));
  return expenseEntries(rec).reduce((t, e) => t + (Number(e.yen) || 0), 0);
}

/** その月の精算（まだなら null） */
function settleOf(y, m) {
  const rec = Store.getDay(EXPENSE_STORE, expenseMonthKey(y, m));
  const s = (rec.items || {})[SETTLE_KEY];
  return s && s.d ? s : null;
}

/**
 * 精算日と出金口座を入れられる状態か
 *
 * 経理担当も現場の T3 Works を使うので、この画面は誰でも開けます。
 * そのかわり、ひらいた直後は必ず「見るだけ」にしておき、
 * 🔒 をわざと押したときだけ入力できるようにします。
 * 画面を出入りすると false に戻ります（触りっぱなしを防ぐため）。
 */
let settleUnlocked = false;

/** 1年12か月分の行 */
function settleRows(y) {
  const rows = [];
  for (let m = 1; m <= 12; m++) {
    rows.push({ y, m, yen: expenseTotalOf(y, m), settle: settleOf(y, m) });
  }
  return rows;
}

function renderSettle() {
  const rows = settleRows(state.y);
  const total = rows.reduce((t, r) => t + r.yen, 0);
  const first = rows.slice(0, 6).reduce((t, r) => t + r.yen, 0);   // 上半期
  const last = rows.slice(6).reduce((t, r) => t + r.yen, 0);       // 下半期
  // 金額があるのに精算日が入っていない月＝まだ払っていない月
  const yet = rows.filter((r) => r.yen && !r.settle);

  el.settleYear.textContent = `${state.y}年`;
  el.settleSummary.textContent = total
    ? `年間 ${yenText(total)}　精算待ち ${yet.length}か月（${yenText(yet.reduce((t, r) => t + r.yen, 0))}）`
    : 'この年の記録はまだありません。';

  el.settleRows.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    // 記録が無い月は色を落とし、精算待ちの月は目立たせます
    if (!r.yen) tr.className = 'is-zero';
    else if (!r.settle) tr.className = 'is-yet';
    if (r.y === TODAY.y && r.m === TODAY.m) tr.classList.add('is-now');

    const month = document.createElement('td');
    month.className = 'exp-total__name';
    month.textContent = `${r.m}月`;

    const yen = document.createElement('td');
    yen.className = 'exp-total__yen';
    yen.innerHTML = r.yen ? yenMarkup(r.yen) : '—';

    const date = document.createElement('td');
    date.className = 'settle-cell';
    if (r.yen && !r.settle) date.classList.add('is-yet');
    const day = document.createElement('span');
    day.textContent = r.settle ? shortDate2(r.settle.d) : (r.yen ? '未精算' : '—');
    date.appendChild(day);
    // スマホでは出金口座の列を出さないので、その分をここに小さく添えます
    // （どちらを出すかは CSS が幅で決めます）
    if (r.settle && r.settle.label) {
      const sub = document.createElement('span');
      sub.className = 'settle-cell__acc';
      sub.textContent = r.settle.label;
      date.appendChild(sub);
    }

    const acc = document.createElement('td');
    acc.className = 'settle-cell';
    acc.textContent = (r.settle && r.settle.label) || '—';

    /* ---- 押すところ ----
       かぎを開けたときだけ、押せる形のボタンを出します。
       行のどこを押せばいいのか迷わないよう、
       「未精算」の文字ではなく、はっきりしたボタンにしています */
    const act = document.createElement('td');
    act.className = 'settle-act';
    if (r.yen && settleUnlocked) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'settle-btn' + (r.settle ? '' : ' is-todo');
      // 画面が狭いときは短い方だけ出します（どちらを出すかは CSS が決めます）
      btn.innerHTML = r.settle
        ? '直す'
        : '<span class="settle-btn__long">精算を入れる</span>'
          + '<span class="settle-btn__short">入れる</span>';
      btn.title = r.settle
        ? '精算日と出金口座を直します'
        : 'この月分を払ったら、精算日と出金口座を入れます';
      btn.addEventListener('click', () => openSettleForm(r));
      act.appendChild(btn);
    }

    tr.append(month, yen, date, acc, act);
    el.settleRows.appendChild(tr);
  });

  /* ---- 下の合計（スプレッドシートの F7・F13・C14 にあたる行） ---- */
  el.settleFoot.innerHTML = '';
  const foot = (label, yen, cls) => {
    const tr = document.createElement('tr');
    tr.className = 'settle-foot' + (cls ? ' ' + cls : '');
    tr.innerHTML =
      '<td class="exp-total__name"></td>' +
      `<td class="exp-total__yen">${yenMarkup(yen)}</td><td></td><td></td><td></td>`;
    tr.querySelector('.exp-total__name').textContent = label;
    el.settleFoot.appendChild(tr);
  };
  foot('1〜6月', first);
  foot('7〜12月', last);
  foot('年間合計', total, 'settle-foot--total ledger-foot');

  renderSettleLock();
}

/** 🔒 のボタンの見た目 */
function renderSettleLock() {
  const b = el.settleLockBtn;
  b.classList.toggle('is-on', settleUnlocked);
  b.setAttribute('aria-pressed', settleUnlocked ? 'true' : 'false');
  b.querySelector('.settle-lock__icon').textContent = settleUnlocked ? '✏️' : '🔒';
  b.querySelector('.settle-lock__name').textContent = settleUnlocked
    ? '入力できます'
    : '見るだけになっています';
  // スマホではボタンの文字が「入れる」に縮むので、文言は「右の緑のボタン」にしています
  b.querySelector('.settle-lock__sub').textContent = settleUnlocked
    ? '月の行の右にある緑のボタンを押してください（もう一度ここを押すと見るだけに戻ります）'
    : '経理担当の方は、ここを押すと精算を入れるボタンが出ます';
}

/** 2026-08-04 → 8/4 */
function shortDate2(str) {
  const [, m, d] = (str || '').split('-');
  return m ? `${+m}/${+d}` : '';
}

/* -------- 精算日と出金口座を入れる -------- */
let settleEditing = null;   // いま直している { y, m, yen, settle }

function openSettleForm(row) {
  settleEditing = row;
  el.settleFormTitle.textContent = `${row.y}年${row.m}月分の精算`;
  el.settleFormYen.textContent = yenText(row.yen);
  el.settleDate.value = (row.settle && row.settle.d) || ymd(TODAY.y, TODAY.m, TODAY.d);
  el.settleAccount.value = (row.settle && row.settle.label) || '';
  el.settleError.textContent = '';
  el.settleClear.classList.toggle('is-hidden', !row.settle);

  /* よく使う口座のボタン。過去に入れた口座もそのまま候補にします */
  const used = [];
  settleRows(row.y).forEach((r) => {
    const name = r.settle && r.settle.label;
    if (name && !used.includes(name)) used.push(name);
  });
  const names = [...new Set(SETTLE_ACCOUNTS.concat(used))];

  el.settleAccounts.innerHTML = '';
  names.forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'exp-chip';
    b.textContent = name;
    b.addEventListener('click', () => {
      el.settleAccount.value = name;
      markSettleChips();
    });
    el.settleAccounts.appendChild(b);
  });
  markSettleChips();
  el.settleModal.classList.remove('is-hidden');
}

/** いま入っている口座と同じボタンに色を付ける */
function markSettleChips() {
  const now = el.settleAccount.value.trim();
  [...el.settleAccounts.children].forEach((b) => {
    b.classList.toggle('is-on', b.textContent === now);
  });
}

function saveSettle() {
  if (!settleEditing) return;
  const d = el.settleDate.value;
  const account = el.settleAccount.value.trim();
  if (!d) { el.settleError.textContent = '精算日を入れてください。'; return; }
  if (!account) { el.settleError.textContent = '出金口座を入れてください。'; return; }

  const { y, m } = settleEditing;
  Store.setItem(EXPENSE_STORE, expenseMonthKey(y, m), SETTLE_KEY, {
    done: true, d, label: account,
  });
  el.settleModal.classList.add('is-hidden');
  renderSettle();
  renderSyncStatus();
}

async function clearSettle() {
  if (!settleEditing) return;
  const { y, m } = settleEditing;
  const ok = await askConfirm({
    item: `${y}年${m}月分`,
    message: '精算日と出金口座を消して、「未精算」に戻します。立て替えの記録は消えません。',
    okLabel: '消す',
    danger: true,
  });
  if (!ok) return;

  // 空にすることで消えたことにします（消えたことも他の端末に伝わります）
  Store.setItem(EXPENSE_STORE, expenseMonthKey(y, m), SETTLE_KEY, {
    done: false, d: '', label: '',
  });
  el.settleModal.classList.add('is-hidden');
  renderSettle();
  renderSyncStatus();
}

/* ============================================================
 *  会議資料
 *    もとは Google スプレッドシート「2026_売上比率_会議」。
 *
 *    ・数字   … js/meeting-data.js に入れてあるのは「もとの数字」だけです。
 *               率・差・累計はここで計算します（もとのシートは月によって
 *               計算式がちがっていたので、そちらの率は使いません）。
 *    ・キャッチ … シートの数字ではなく、このアプリのキャッチ集計
 *               （現金支払管理表に入れた分）から拾います。
 *    ・議事録 … _meeting/YYYY-MM に1つずつ入れます。表に直接書けます。
 * ============================================================ */

/** 入っている月のうち、いちばん新しい月。1つも無ければ null */
function latestMeetingMonth() {
  if (typeof MEETING_DATA === 'undefined') return null;
  const keys = Object.keys(MEETING_DATA).sort();
  if (!keys.length) return null;
  const [y, m] = keys[keys.length - 1].split('-');
  return { y: +y, m: +m };
}

/** その月のデータ。無ければ null */
function meetingOf(y, m) {
  return (typeof MEETING_DATA === 'undefined')
    ? null
    : (MEETING_DATA[`${y}-${String(m).padStart(2, '0')}`] || null);
}

/** 数字の配列（meeting-data.js の並び）を名前つきに開く */
function meetingRow(arr) {
  const o = {};
  MEETING_FIELDS.forEach((k, i) => { o[k] = (arr && arr[i] !== undefined) ? arr[i] : null; });
  return o;
}

/** 何店舗分かを1つに足す（合計の行を、店舗と同じ形で作るため） */
function meetingSum(rows) {
  const o = {};
  MEETING_FIELDS.forEach((k) => { o[k] = 0; });
  rows.forEach((r) => MEETING_FIELDS.forEach((k) => { o[k] += Number(r[k]) || 0; }));
  return o;
}

/**
 * その月のキャッチ（店舗id → { yen, people }）
 * 現金支払管理表で「キャッチ」をえらんで入れた分を、店舗ごとに足します
 * （キャッチ集計のページと同じ数字になります）
 */
function meetingCatchOf(y, m) {
  const rec = Store.getDay(EXPENSE_STORE, expenseMonthKey(y, m));
  const out = {};
  expenseEntries(rec)
    .filter((e) => e.kind === 'catch')
    .forEach((e) => {
      const id = e.store || '';
      if (!out[id]) out[id] = { yen: 0, people: 0 };
      out[id].yen += Number(e.yen) || 0;
      out[id].people += Number(e.people) || 0;
    });
  return out;
}

/**
 * 1月から m 月までのうち、数字が入っている月の数と、いちばん新しい月
 *
 * 7月・8月のように まだ入力されていない月を開いたときに、
 * 累計の見出しや円グラフの目安が先に進んでしまわないようにするためです。
 */
function meetingFilledUpTo(y, m) {
  let count = 0, last = 0;
  for (let i = 1; i <= m; i += 1) {
    if (meetingOf(y, i)) { count += 1; last = i; }
  }
  return { count, last };
}

/** 1月から m 月までの税抜売上（店舗ごと）。{ 店舗id: { ex, lastEx } } */
function meetingCumByStore(y, m) {
  const out = {};
  STORES.forEach((s) => { out[s.id] = { ex: 0, lastEx: 0 }; });
  for (let i = 1; i <= m; i += 1) {
    const rec = meetingOf(y, i);
    if (!rec) continue;
    Object.entries(rec.rows).forEach(([id, v]) => {
      if (!out[id]) out[id] = { ex: 0, lastEx: 0 };
      out[id].ex += meetingRow(v.now).ex || 0;
      out[id].lastEx += meetingRow(v.last).ex || 0;
    });
  }
  return out;
}

/** 昨年比のバッジ（表紙の数字だけで使います） */
function vsLastMarkup(now, last, opts = {}) {
  if (!now || !last) return '';
  const pct = (now / last - 1) * 100;
  const cls = pct >= 0 ? 'is-up' : 'is-down';
  const sign = pct >= 0 ? '+' : '−';
  const size = opts.small ? ' meeting-vs--small' : '';
  return `<span class="meeting-vs ${cls}${size}">${sign}${Math.abs(pct).toFixed(1)}%</span>`;
}

/* ------------------------------------------------------------
 *  表の列
 *
 *  1つの項目につき「今年・昨年・差」の3列。もとのシートと同じ並びです。
 *    main    … その升目の主の数字   mainKind: yen=金額 / num=人数 / pct=率
 *    sub     … 主の数字に添える数字（原価なら金額の下に率）
 *    goodWhen… 増えたほうが良いか（差の色分けに使います）
 *  1つの表に全部入れると横に長くなりすぎるので、3つに分けています。
 * ---------------------------------------------------------- */
const MEETING_MODES = {
  sales: [
    { label: '税込売上', mainKind: 'yen', main: (v) => v.inc, goodWhen: 'up' },
    { label: '税抜売上', mainKind: 'yen', main: (v) => v.ex, goodWhen: 'up' },
    { label: '来店人数', mainKind: 'num', unit: '人', main: (v) => v.guests, goodWhen: 'up' },
    { label: '客単価', mainKind: 'yen', goodWhen: 'up',
      main: (v) => (v.guests ? Math.round(v.ex / v.guests) : null) },
  ],
  cost: [
    { label: '原価', mainKind: 'yen', subKind: 'pct', goodWhen: 'down',
      main: (v) => v.cost, sub: (v) => (v.ex ? v.cost / v.ex : null) },
    { label: '人件費', mainKind: 'yen', subKind: 'pct', goodWhen: 'down',
      main: (v) => v.labor, sub: (v) => (v.ex ? v.labor / v.ex : null) },
    { label: 'F/L', mainKind: 'pct', goodWhen: 'down',
      main: (v) => (v.ex ? (v.cost + v.labor) / v.ex : null) },
    { label: 'キャッチ', mainKind: 'yen', subKind: 'num', subUnit: '人',
      main: (v) => v.katch, sub: (v) => v.katchPeople },
  ],
  util: [
    { label: 'ガス', mainKind: 'yen', main: (v) => v.gas, goodWhen: 'down' },
    { label: '水道', mainKind: 'yen', main: (v) => v.water, goodWhen: 'down' },
    { label: '電気', mainKind: 'yen', main: (v) => v.power, goodWhen: 'down' },
    { label: '光熱費 合計', mainKind: 'yen', subKind: 'pct', goodWhen: 'down',
      main: (v) => (v.gas + v.water + v.power) || null,
      sub: (v) => (v.ex ? (v.gas + v.water + v.power) / v.ex : null) },
  ],
};

/** いまどの表を出しているか */
let meetingMode = 'sales';

/** 数字を書き出す（差のときは符号を付けます） */
function meetingNum(n, kind, unit, diff) {
  if (n === null || n === undefined || !isFinite(n) || (!diff && !n)) return '—';
  if (diff && Math.round(kind === 'pct' ? n * 1000 : n) === 0) return '±0';
  const sign = diff ? (n > 0 ? '+' : '−') : '';
  const v = diff ? Math.abs(n) : n;
  if (kind === 'pct') return `${sign}${(v * 100).toFixed(1)}${diff ? 'pt' : '%'}`;
  if (kind === 'num') return `${sign}${Math.round(v).toLocaleString('ja-JP')}<span class="ledger-unit">${unit || ''}</span>`;
  return sign + yenMarkup(Math.round(v));
}

/** 1つの升目（主の数字と、あれば下に添える数字） */
function meetingCell(col, v, opts = {}) {
  const diff = !!opts.diff;
  const main = col.main ? col.main(v) : null;
  const sub = col.sub ? col.sub(v) : null;
  let cls = 'mt-cell';
  if (opts.last) cls += ' is-last';
  if (diff) {
    cls += ' is-vs';
    if (col.goodWhen && main) {
      const good = col.goodWhen === 'up' ? main > 0 : main < 0;
      cls += good ? ' is-good' : ' is-bad';
    }
  }
  const subHtml = col.sub
    ? `<span class="mt-sub">${meetingNum(sub, col.subKind, col.subUnit, diff)}</span>`
    : '';
  return `<td class="${cls}"><span class="mt-main">${meetingNum(main, col.mainKind, col.unit, diff)}</span>${subHtml}</td>`;
}

/** 今年 − 昨年 を計算するために、差だけを持った「見せかけの行」を作ります */
function meetingDiffRow(col, now, last) {
  const a = col.main ? col.main(now) : null;
  const b = col.main ? col.main(last) : null;
  const sa = col.sub ? col.sub(now) : null;
  const sb = col.sub ? col.sub(last) : null;
  // 今年も昨年も入っていない項目は、差も「—」にします（±0 とは出しません）
  const d = (x, y) => ((x === null || y === null) || (!x && !y) ? null : x - y);
  return { main: d(a, b), sub: d(sa, sb) };
}

/** 1項目分の3つの升目（今年・昨年・差） */
function meetingCells(col, now, last) {
  const d = meetingDiffRow(col, now, last);
  const diffCol = { ...col, main: () => d.main, sub: col.sub ? () => d.sub : null };
  return meetingCell(col, now)
    + meetingCell(col, last, { last: true })
    + meetingCell(diffCol, null, { diff: true });
}

/* ------------------------------------------------------------
 *  議事録
 * ---------------------------------------------------------- */

/** 取り込んだ議題に付ける項目名（写す前と後で同じものになるようにします） */
function meetingNoteId(i) {
  return `n${String(i + 1).padStart(3, '0')}`;
}

/** その月の議題。まだ一度も直していない月は、取り込んだメモをそのまま見せます */
function meetingNotes(y, m) {
  const rec = Store.getDay(MEETING_STORE, meetingMonthKey(y, m));
  const items = rec.items || {};
  const seeded = items[MEETING_SEED_KEY] && items[MEETING_SEED_KEY].done;

  if (!seeded) {
    // まだ写していない月。id は seedMeetingNotes が付けるものと同じにしておきます
    // （そうしておかないと、取り込んだ議題を直したときに新しい議題として増えます）
    const src = meetingOf(y, m);
    return ((src && src.notes) || []).map((g, i) => ({
      id: meetingNoteId(i), seq: i, text: g.join('\n'),
    }));
  }
  return Object.keys(items)
    .filter((id) => id !== MEETING_SEED_KEY && items[id] && items[id].done && (items[id].text || '').trim())
    .map((id) => ({ id, seq: Number(items[id].seq) || 0, text: items[id].text }))
    .sort((a, b) => a.seq - b.seq || a.id.localeCompare(b.id));
}

/**
 * はじめて直すときに、取り込んだメモを記録として書き写します
 *
 * こうしておくと、取り込んだ議題も足した議題も同じ扱いになり、
 * どれでも直せる・消せるようになります（写すのは1回だけです）。
 */
function seedMeetingNotes(y, m) {
  const key = meetingMonthKey(y, m);
  const rec = Store.getDay(MEETING_STORE, key);
  if (rec.items && rec.items[MEETING_SEED_KEY] && rec.items[MEETING_SEED_KEY].done) return;
  const src = meetingOf(y, m);
  ((src && src.notes) || []).forEach((g, i) => {
    Store.setItem(MEETING_STORE, key, meetingNoteId(i), { done: true, text: g.join('\n'), seq: i });
  });
  Store.setItem(MEETING_STORE, key, MEETING_SEED_KEY, { done: true });
}

/**
 * 枠に書いた内容を保存します
 *
 *   書いている途中でも少し手が止まったら保存し、
 *   ほかを押したとき（blur）にももう一度保存します。
 *   「ほかを押したとき」だけにすると、書いたまま月を送ったり
 *   アプリを閉じたりしたときに消えてしまうためです。
 *
 *   保存しても画面は作り直しません。作り直すと、書いている途中の
 *   枠から入力の位置（カーソル）が外れてしまうためです。
 *   空いている枠に書いたときだけ、その枠を議題に格上げして、
 *   下に新しい空の枠を1つ足します。
 */
function saveMeetingNote(box, opts = {}) {
  const text = box.value.replace(/\r/g, '').trim();
  const was = box.dataset.was || '';
  const id = box.dataset.id;

  if (!text && !id) return;                       // 空いている枠のまま。何もしません
  if (text === was) return;                       // 何も変わっていない

  seedMeetingNotes(state.y, state.m);
  const key = meetingMonthKey(state.y, state.m);

  if (!text) {
    // からっぽにしたら、その議題は消えます。
    // ただし消すのは、書き終えて枠から出たときだけです
    // （書き直そうと全部消しただけで消えてしまわないように）
    if (!opts.done) return;
    Store.setItem(MEETING_STORE, key, id, { done: false, text: '' });
    renderMeetingNotes();
    renderSyncStatus();
    return;
  }

  if (id) {
    Store.setItem(MEETING_STORE, key, id, { done: true, text, seq: Number(box.dataset.seq) || 0 });
    box.dataset.was = text;
  } else {
    // いちばん下の空いている枠。書くと議題が1つ増えます
    const notes = meetingNotes(state.y, state.m);
    const seq = notes.length ? notes[notes.length - 1].seq + 1 : 0;
    const newId = 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    Store.setItem(MEETING_STORE, key, newId, { done: true, text, seq });
    promoteMeetingNoteBox(box, newId, seq, notes.length + 1);
  }
  renderSyncStatus();
}

/** 空いている枠を議題に変えて、その下に新しい空の枠を足します */
function promoteMeetingNoteBox(box, id, seq, no) {
  box.dataset.id = id;
  box.dataset.seq = seq;
  box.dataset.was = box.value.replace(/\r/g, '').trim();
  box.placeholder = '';
  const item = box.parentElement;
  item.classList.remove('meeting-note--new');
  item.querySelector('.meeting-note__no').textContent = no;
  el.meetingNotes.appendChild(meetingNoteRow(null, 0));
  el.meetingNoteCount.textContent = `（${no}件）`;
}

/* ------------------------------------------------------------
 *  画面を作る
 * ---------------------------------------------------------- */
function renderMeeting() {
  const rec = meetingOf(state.y, state.m);
  el.meetingMonth.textContent = `${state.y}年${state.m}月`;

  /* ---- その月の店舗ごとの数字を並べる ---- */
  const katch = meetingCatchOf(state.y, state.m);
  const katchLast = meetingCatchOf(state.y - 1, state.m);
  const list = [];
  if (rec) {
    STORES.forEach((s) => {
      const v = rec.rows[s.id];
      if (!v) return;
      const now = meetingRow(v.now);
      const last = meetingRow(v.last);
      // キャッチだけは、シートの数字ではなくキャッチ集計の数字を使います
      now.katch = (katch[s.id] || {}).yen || 0;
      now.katchPeople = (katch[s.id] || {}).people || 0;
      last.katch = (katchLast[s.id] || {}).yen || 0;
      last.katchPeople = (katchLast[s.id] || {}).people || 0;
      list.push({ store: s, now, last });
    });
  }
  const has = list.length > 0;

  /* 昨年比は「昨年もあった店舗どうし」で出します。
     おいでんテラスのように途中からできた店舗を今年の側にだけ足すと、
     売上がその分だけ伸びたように見えてしまうためです */
  const withLast = list.filter((r) => r.last.ex);
  const ex = list.reduce((t, r) => t + (r.now.ex || 0), 0);
  const exSame = withLast.reduce((t, r) => t + (r.now.ex || 0), 0);
  const lastEx = withLast.reduce((t, r) => t + (r.last.ex || 0), 0);
  const guests = list.reduce((t, r) => t + (r.now.guests || 0), 0);
  const sameCount = withLast.length;
  const partial = sameCount > 0 && sameCount < list.length;

  el.meetingSalesYen.innerHTML = yenMarkup(ex);
  el.meetingVsLast.innerHTML = lastEx ? vsLastMarkup(exSame, lastEx) : '—';
  el.meetingVsLastLabel.textContent = partial ? `昨年比（${sameCount}店舗）` : '昨年比';
  el.meetingGuests.innerHTML = `${guests.toLocaleString('ja-JP')}<span class="ledger-figure__unit">人</span>`;

  el.meetingSummary.textContent = has ? '' : 'この月の数字は、まだ入っていません。';
  el.meetingSummary.classList.toggle('is-hidden', has);
  el.meetingNote.classList.toggle('is-hidden', !has);
  el.meetingTableWrap.classList.toggle('is-hidden', !has);
  el.meetingBar.classList.toggle('is-hidden', !has);

  if (has) {
    renderMeetingTable(list);
  } else {
    // 数字の無い月に切り替えたとき、前の月の表が残らないように空にします
    el.meetingHead.innerHTML = '';
    el.meetingBody.innerHTML = '';
    el.meetingFoot.innerHTML = '';
    el.meetingScrollHint.classList.add('is-hidden');
  }
  renderMeetingCum();
  renderMeetingGoals();
  renderMeetingNotes();
}

/** 今年と昨年をとなり合わせに並べた表 */
function renderMeetingTable(list) {
  const cols = MEETING_MODES[meetingMode] || MEETING_MODES.sales;

  /* ---- 見出しは2段。上が項目、下が「2026年 / 昨年 / 差」 ---- */
  const top = document.createElement('tr');
  top.className = 'meeting-head-top';
  top.innerHTML = '<th rowspan="2" class="meeting-th-name">店舗</th>'
    + cols.map((c) => `<th colspan="3" class="meeting-th-group">${c.label}</th>`).join('');

  const sub = document.createElement('tr');
  sub.className = 'meeting-head-sub';
  sub.innerHTML = cols.map(() =>
    `<th>${state.y}年</th><th class="is-last">昨年</th><th class="is-vs">差</th>`).join('');

  el.meetingHead.innerHTML = '';
  el.meetingHead.append(top, sub);

  /* ---- 店舗の行 ---- */
  el.meetingBody.innerHTML = '';
  list.forEach(({ store, now, last }) => {
    const tr = document.createElement('tr');
    tr.style.setProperty('--row-color', store.color);
    const name = document.createElement('th');
    name.scope = 'row';
    name.className = 'meeting-td-name';
    name.textContent = store.name;
    tr.appendChild(name);
    cols.forEach((c) => tr.insertAdjacentHTML('beforeend', meetingCells(c, now, last)));
    el.meetingBody.appendChild(tr);
  });

  /* ---- いちばん下の合計行 ----
     率は店舗ごとの率を平均するのではなく、金額を足してから割ります。

     ★おいでんテラスのように昨年の数字が無い店舗があるときは、
       合計の「差」が「今年6店舗 − 昨年5店舗」になってしまい、
       伸びたように見えます。そこで、そういう月は合計を2行に分け、
       比べられる5店舗だけの行を下に足します */
  const withLast = list.filter((r) => r.last.ex);
  const partial = withLast.length > 0 && withLast.length < list.length;

  const footRow = (label, rows, noDiff) => {
    const now = meetingSum(rows.map((r) => r.now));
    const last = meetingSum(rows.map((r) => r.last));
    const tr = document.createElement('tr');
    tr.className = 'meeting-foot';
    tr.innerHTML = '<th scope="row" class="meeting-td-name"></th>'
      + cols.map((c) => (noDiff
        ? meetingCell(c, now) + meetingCell(c, last, { last: true })
          + '<td class="mt-cell is-vs">—</td>'
        : meetingCells(c, now, last))).join('');
    tr.querySelector('.meeting-td-name').textContent = label;
    return tr;
  };

  el.meetingFoot.innerHTML = '';
  el.meetingFoot.appendChild(footRow(`合計（${list.length}店舗）`, list, partial));
  if (partial) {
    const tr = footRow(`うち昨年もあった${withLast.length}店舗`, withLast);
    tr.classList.add('meeting-foot--same');
    el.meetingFoot.appendChild(tr);
  }

  // 表が画面に入りきらないときだけ、横にすべらせる案内を出します
  updateMeetingScrollHint();
}

/** 表がはみ出しているかを測って、案内を出し入れします */
function updateMeetingScrollHint() {
  const wrap = el.meetingTableWrap;
  if (wrap.classList.contains('is-hidden') || !wrap.clientWidth) {
    el.meetingScrollHint.classList.add('is-hidden');
    return;
  }
  el.meetingScrollHint.classList.toggle('is-hidden', wrap.scrollWidth <= wrap.clientWidth + 1);
}

/** 1月からの累計（別枠）。店舗ごとと、6店舗・5店舗の合計 */
function renderMeetingCum() {
  const cum = meetingCumByStore(state.y, state.m);
  const filled = meetingFilledUpTo(state.y, state.m);
  el.meetingCumRange.textContent = filled.last ? `（1月〜${filled.last}月）` : '';
  el.meetingCumYearHead.textContent = `${state.y}年`;

  const shown = STORES.filter((s) => cum[s.id] && cum[s.id].ex);
  el.meetingCumBody.innerHTML = '';
  shown.forEach((s) => {
    const c = cum[s.id];
    const tr = document.createElement('tr');
    tr.style.setProperty('--row-color', s.color);
    tr.innerHTML = '<th scope="row" class="meeting-td-name"></th>'
      + `<td class="mt-cell">${meetingNum(c.ex, 'yen')}</td>`
      + `<td class="mt-cell is-last">${meetingNum(c.lastEx, 'yen')}</td>`
      + `<td class="mt-cell is-vs${c.lastEx ? (c.ex >= c.lastEx ? ' is-good' : ' is-bad') : ''}">`
      + `${c.lastEx ? meetingNum(c.ex - c.lastEx, 'yen', '', true) : '—'}</td>`;
    tr.querySelector('.meeting-td-name').textContent = s.name;
    el.meetingCumBody.appendChild(tr);
  });

  /* 6店舗の合計と、昨年もあった5店舗だけの合計。
     6店舗のほうは昨年の数字が無いので、そこは「—」にします */
  const five = SALES_TARGET_FIVE_STORES;
  const all6 = shown.reduce((t, s) => t + cum[s.id].ex, 0);
  const now5 = shown.filter((s) => five.includes(s.id)).reduce((t, s) => t + cum[s.id].ex, 0);
  const last5 = shown.filter((s) => five.includes(s.id)).reduce((t, s) => t + cum[s.id].lastEx, 0);

  const row = (label, now, last) =>
    '<tr class="meeting-foot"><th scope="row" class="meeting-td-name">' + label + '</th>'
    + `<td class="mt-cell">${meetingNum(now, 'yen')}</td>`
    + `<td class="mt-cell is-last">${last ? meetingNum(last, 'yen') : '—'}</td>`
    + `<td class="mt-cell is-vs${last ? (now >= last ? ' is-good' : ' is-bad') : ''}">`
    + `${last ? meetingNum(now - last, 'yen', '', true) : '—'}</td></tr>`;

  el.meetingCumFoot.innerHTML =
    (shown.length > five.length ? row(`年間${shown.length}店舗累計`, all6, 0) : '')
    + row(`年間${five.length}店舗累計`, now5, last5);

  el.meetingCumWrap.classList.toggle('is-hidden', !shown.length);
}

/** 年間目標に対する進み具合（円グラフ） */
function renderMeetingGoals() {
  const cum = meetingCumByStore(state.y, state.m);
  // 目安は「入力されている月の数 ÷ 12」。まだ入っていない月まで数えると、
  // どの店舗も遅れているように見えてしまいます
  const filled = meetingFilledUpTo(state.y, state.m);
  const pace = filled.count / 12;
  el.meetingGoalPace.textContent = filled.count
    ? `（${filled.last}月まで＝目安 ${Math.round(pace * 100)}%）` : '';

  const five = SALES_TARGET_FIVE_STORES;
  const items = STORES
    .filter((s) => SALES_TARGETS[s.id] && cum[s.id] && cum[s.id].ex)
    .map((s) => ({ name: s.name, color: s.color, now: cum[s.id].ex, goal: SALES_TARGETS[s.id] }));

  const now5 = five.reduce((t, id) => t + ((cum[id] || {}).ex || 0), 0);
  if (now5) {
    items.unshift({
      name: `${five.length}店舗 合計`, color: 'var(--money)',
      now: now5, goal: SALES_TARGET_FIVE, big: true,
    });
  }

  el.meetingGoals.innerHTML = '';
  el.meetingGoals.classList.toggle('is-hidden', !items.length);
  el.meetingGoalNote.classList.toggle('is-hidden', !items.length);
  items.forEach((it) => el.meetingGoals.appendChild(goalCard(it, pace)));
}

/** 円グラフ1つ分 */
function goalCard({ name, color, now, goal, big }, pace) {
  const ratio = goal ? now / goal : 0;
  const R = 42;
  const C = 2 * Math.PI * R;
  const shown = Math.min(ratio, 1);                // 輪は100%で止め、数字は本当の値を出します
  const card = document.createElement('section');
  card.className = 'goal-card' + (big ? ' goal-card--big' : '');
  card.style.setProperty('--goal-color', color);
  // 目安の線を置く角度（12時から時計回り）
  const a = (pace * 2 * Math.PI) - Math.PI / 2;

  card.innerHTML = `
    <svg class="goal-ring" viewBox="0 0 100 100" role="img" aria-label="${name} ${Math.round(ratio * 100)}%">
      <circle class="goal-ring__bg" cx="50" cy="50" r="${R}"></circle>
      <circle class="goal-ring__fill" cx="50" cy="50" r="${R}"
              stroke-dasharray="${(C * shown).toFixed(1)} ${C.toFixed(1)}"
              transform="rotate(-90 50 50)"></circle>
      <line class="goal-ring__pace"
            x1="${(50 + (R - 8) * Math.cos(a)).toFixed(1)}" y1="${(50 + (R - 8) * Math.sin(a)).toFixed(1)}"
            x2="${(50 + (R + 8) * Math.cos(a)).toFixed(1)}" y2="${(50 + (R + 8) * Math.sin(a)).toFixed(1)}"></line>
      <text class="goal-ring__pct" x="50" y="54">${(ratio * 100).toFixed(1)}%</text>
    </svg>
    <p class="goal-card__name"></p>
    <p class="goal-card__yen">${yenMarkup(now)}</p>
    <p class="goal-card__goal">目標 ${yenMarkup(goal)}</p>
    <p class="goal-card__left">${now >= goal
      ? '目標をこえました'
      : `のこり ${yenMarkup(goal - now)}`}</p>
  `;
  card.querySelector('.goal-card__name').textContent = name;
  return card;
}

/** 議題1つ分の枠を作ります（note が null なら、いちばん下の空いている枠） */
function meetingNoteRow(note, i) {
  const item = document.createElement('div');
  item.className = 'meeting-note' + (note ? '' : ' meeting-note--new');

  const no = document.createElement('span');
  no.className = 'meeting-note__no';
  no.textContent = note ? i + 1 : '＋';

  const box = document.createElement('textarea');
  box.className = 'meeting-note__text';
  box.rows = 1;
  box.value = note ? note.text : '';
  box.dataset.id = note ? note.id : '';
  box.dataset.seq = note ? note.seq : '';
  box.dataset.was = note ? note.text : '';
  box.placeholder = note ? '' : 'ここに書くと、議題が1つ増えます';

  let timer = null;
  box.addEventListener('input', () => {
    growNoteBox(box);
    clearTimeout(timer);
    timer = setTimeout(() => saveMeetingNote(box), 700);   // 手が止まったら保存
  });
  box.addEventListener('blur', () => {
    clearTimeout(timer);
    saveMeetingNote(box, { done: true });
  });

  item.append(no, box);
  return item;
}

/** 議事録。枠にそのまま書けます */
function renderMeetingNotes() {
  const notes = meetingNotes(state.y, state.m);
  el.meetingNoteCount.textContent = notes.length ? `（${notes.length}件）` : '';
  el.meetingNotes.innerHTML = '';
  notes.forEach((note, i) => el.meetingNotes.appendChild(meetingNoteRow(note, i)));
  el.meetingNotes.appendChild(meetingNoteRow(null, 0));   // いちばん下の、空いている枠
  [...el.meetingNotes.querySelectorAll('.meeting-note__text')].forEach(growNoteBox);
}

/** 書きかけのまま画面を離れるときに、取りこぼさないよう保存します */
function flushMeetingNotes() {
  if (state.view !== 'meeting') return;
  [...el.meetingNotes.querySelectorAll('.meeting-note__text')]
    .forEach((box) => saveMeetingNote(box));
}

/** 書いた行数に合わせて枠の高さを伸ばします */
function growNoteBox(box) {
  box.style.height = 'auto';
  box.style.height = `${box.scrollHeight}px`;
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

/** 表示中の月を前後にずらす（立替金の画面で使います） */
function shiftMonth(diff) {
  const dt = new Date(state.y, state.m - 1 + diff, 1);
  state.y = dt.getFullYear();
  state.m = dt.getMonth() + 1;
  state.d = Math.min(state.d, daysInMonth(state.y, state.m));
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
      // 全角の数字（１２３）で入れても半角に直します
      bindNumericInput(input);
    } else {
      input.type = 'text';
      input.placeholder = '内容を入力';
    }
    input.addEventListener('change', () => {
      // 数値の項目は、貼り付けなどで全角のまま残った場合もここで直します
      if (item.type === 'number') input.value = toHalfWidthNumber(input.value);
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

  /* ---- 随時掃除（上の表とは別物。達成率には入れません） ---- */
  renderAnytimeBlock();
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

  // 下地の輪（100%分の目盛り）
  const track = document.createElementNS(NS, 'circle');
  track.setAttribute('class', 'donut__track');
  track.setAttribute('cx', size / 2);
  track.setAttribute('cy', size / 2);
  track.setAttribute('r', r);
  track.setAttribute('stroke-width', stroke);
  svg.appendChild(track);

  // 進んだ分の輪。12時から時計回りに伸びます
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
  doerTarget = { kind: 'week', item, week };
  el.doerItem.textContent = item.label;
  el.doerWeek.textContent = isBiweekly(item)
    ? `${periodRangeLabel(periodStartOf(week))} のうち1回`
    : weekRangeLabel(week);

  const cur = Store.getDay(state.storeId, weekRecKey(week)).items?.[item.id];
  const done = !!cur?.done;
  el.doerClear.classList.toggle('is-hidden', !done);

  fillDoerNames(done, cur);
  el.doerModal.classList.remove('is-hidden');
}

/**
 * 随時掃除の「やった人」を選ぶ画面
 * 週の指定がないので、押した日がそのまま「最後にやった日」になります
 */
function openAnytimeDoer(item) {
  doerTarget = { kind: 'anytime', item, week: null };
  el.doerItem.textContent = item.label;

  const cur = Store.getDay(state.storeId, ANYTIME_KEY).items?.[item.id];
  const done = !!cur?.at;
  el.doerWeek.textContent = done
    ? `最後にやったのは ${shortDate(cur.at)}（${cur.by || '担当者なし'}）`
    : 'まだ記録がありません';
  el.doerClear.classList.toggle('is-hidden', !done);

  fillDoerNames(done, cur);
  el.doerModal.classList.remove('is-hidden');
}

/** 担当者のボタンを並べる（週間掃除・随時掃除で共通） */
function fillDoerNames(done, cur) {
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
}

function closeDoerModal() {
  doerTarget = null;
  el.doerModal.classList.add('is-hidden');
}

/** 記録の入れ先。随時掃除は日付ではなく1つのまとまりに入れます */
function doerKey(target) {
  return target.kind === 'anytime' ? ANYTIME_KEY : weekRecKey(target.week);
}

function doerRedraw() {
  // 随時掃除も週間掃除ページの中にあるので、まとめて描き直します
  renderWeekView();
  renderSyncStatus();
}

function pickDoer(name) {
  if (!doerTarget) return;
  const target = doerTarget;
  Store.setItem(state.storeId, doerKey(target), target.item.id, { done: true, by: name });
  closeDoerModal();
  doerRedraw();
}

function clearDoer() {
  if (!doerTarget) return;
  const target = doerTarget;
  Store.setItem(state.storeId, doerKey(target), target.item.id, { done: false, by: '' });
  closeDoerModal();
  doerRedraw();
}

/* ============================================================
 *  描画：随時掃除ビュー（決まった間隔がない掃除）
 *
 *  期限が無いので、できた・できないの判定はしません。
 *  「最後にやった日」と「そこから何日たったか」だけを見せます。
 * ============================================================ */
/** 日付（ISO）から今日までの日数。今日なら 0 */
function daysAgo(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(TODAY.y, TODAY.m - 1, TODAY.d);
  return Math.round((b - a) / 86400000);
}

/** 「今日」「昨日」「12日前」のような言い方にする */
function agoLabel(n) {
  if (n === null) return '';
  if (n <= 0) return '今日';
  if (n === 1) return '昨日';
  return `${n}日前`;
}

function renderAnytimeBlock() {
  const storeId = state.storeId;
  const items = getAnytime(storeId);
  // 項目が無い店舗では、この かたまり ごと出しません
  el.anytimeBlock.classList.toggle('is-hidden', items.length === 0);
  if (!items.length) return;

  const rec = Store.getDay(storeId, ANYTIME_KEY);
  const groups = groupWeekly(items); // 見出しは週間掃除と同じ分け方

  el.anytimeList.innerHTML = '';
  groups.forEach((g) => {
    if (groups.length > 1) {
      const head = document.createElement('li');
      head.className = 'anytime-group';
      head.innerHTML = `<span class="week-group__label">${g.name}</span>`;
      el.anytimeList.appendChild(head);
    }

    g.items.forEach((item) => {
      const cur = rec.items?.[item.id];
      const n = daysAgo(cur?.at);

      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'anytime-row' + (n === null ? ' is-never' : '');

      const main = document.createElement('span');
      main.className = 'anytime-row__main';
      const name = document.createElement('span');
      name.className = 'anytime-row__name';
      name.textContent = item.label;
      main.appendChild(name);
      if (item.note) {
        const note = document.createElement('span');
        note.className = 'anytime-row__note';
        note.textContent = item.note;
        main.appendChild(note);
      }

      const last = document.createElement('span');
      last.className = 'anytime-row__last';
      if (n === null) {
        last.innerHTML = '<span class="anytime-row__ago">まだ記録なし</span>';
      } else {
        last.innerHTML =
          `<span class="anytime-row__ago">${agoLabel(n)}</span>` +
          `<span class="anytime-row__date">${shortDate(cur.at)}${cur.by ? '　' + cur.by : ''}</span>`;
      }

      b.append(main, last);
      b.addEventListener('click', () => openAnytimeDoer(item));
      li.appendChild(b);
      el.anytimeList.appendChild(li);
    });
  });
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
  const isExpense = state.view === 'expense';
  const isCatch = state.view === 'catch';
  const isSettle = state.view === 'settle';
  const isMeeting = state.view === 'meeting';

  /* お金の画面にいるあいだは body に印を付けます。
     入力画面や確認ダイアログは画面をまたいで使い回しているので、
     この印を見てボタンの色を青から緑に切り替えます */
  document.body.classList.toggle('is-money', isExpense || isCatch || isSettle || isMeeting);
  /* 会議資料は横に長い表を出すので、そのあいだだけページの幅をひろげます */
  document.body.classList.toggle('is-wide', isMeeting);

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
    el.viewExpense.classList.add('is-hidden');
    el.viewCatch.classList.add('is-hidden');
    el.viewSettle.classList.add('is-hidden');
    el.viewMeeting.classList.add('is-hidden');
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
    el.viewExpense.classList.add('is-hidden');
    el.viewCatch.classList.add('is-hidden');
    el.viewSettle.classList.add('is-hidden');
    el.viewMeeting.classList.add('is-hidden');
    el.viewStores.classList.remove('is-hidden');
    renderStorePicker();
    renderSyncStatus();
    return;
  }

  el.viewStores.classList.add('is-hidden');
  el.storeTabs.classList.toggle('is-hidden', isWeekAll || isExpense || isCatch || isSettle || isMeeting);
  // 週間掃除は週ごとに送って見る画面なので、日タブは出しません
  const noDays = isReport || isWeek || isWeekAll || isExpense || isCatch || isSettle || isMeeting;
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
  el.storeHead.classList.toggle('is-hidden', isReport || isWeekAll || isExpense || isCatch || isSettle || isMeeting);
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
  el.viewExpense.classList.toggle('is-hidden', !isExpense);
  el.viewCatch.classList.toggle('is-hidden', !isCatch);
  el.viewSettle.classList.toggle('is-hidden', !isSettle);
  el.viewMeeting.classList.toggle('is-hidden', !isMeeting);

  // 精算履歴から離れたら、必ず「見るだけ」に戻します
  // （ブラウザの戻るで帰ってきたときも、開けっぱなしにしないため）
  if (!isSettle) settleUnlocked = false;

  if (isMeeting) renderMeeting();
  else if (isSettle) renderSettle();
  else if (isCatch) renderCatch();
  else if (isExpense) renderExpense();
  else if (isReport) renderReport();
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
  // 全角で入れても通るように、半角に直してから確かめます
  const pin = toHalfWidth(el.pinInput.value).trim();
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
  // ヘッダーのしるしが何を表しているかの一覧（実物と同じ絵を並べます）
  el.syncLegend.innerHTML = Sync.legendHtml();
  // 版の番号。困ったときに「この番号を教えて」と聞くためのものです
  const v = Updater.current();
  el.appVersionText.innerHTML = v
    ? `いま入っているのは <b>${v}</b> です。`
    : '（手元で開いているため、版の番号はありません）';
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
  // 業務のページから、店舗選択まで一気に戻る
  $('taskBarHome').addEventListener('click', goHome);
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

  /* 立替金 */
  $('storesExpenseBtn').addEventListener('click', () => openAllStores('expense'));
  $('expenseBack').addEventListener('click', goHome);
  $('expenseAddBtn').addEventListener('click', () => openExpenseForm());
  el.expenseSave.addEventListener('click', saveExpense);
  // 全角の数字で入れても半角に直します（日本語キーボードのままでも入力できる）
  bindNumericInput(el.expYen);
  bindNumericInput(el.expPeople);
  el.expenseModal.querySelectorAll('[data-close-expense]').forEach((n) =>
    n.addEventListener('click', () => el.expenseModal.classList.add('is-hidden'))
  );
  el.expReceiptSeg.addEventListener('click', (e) => {
    const b = e.target.closest('.seg__btn');
    if (!b) return;
    expReceipt = b.dataset.receipt === '1';
    renderReceiptSeg();
  });
  /* キャッチ集計 */
  $('storesCatchBtn').addEventListener('click', () => openAllStores('catch'));
  $('catchBack').addEventListener('click', goHome);
  $('catchPrev').addEventListener('click', () => shiftMonth(-1));
  $('catchNext').addEventListener('click', () => shiftMonth(1));
  $('catchThisMonth').addEventListener('click', () => {
    state.y = TODAY.y; state.m = TODAY.m;
    writeHash(); render();
  });

  $('expensePrev').addEventListener('click', () => shiftMonth(-1));
  $('expenseNext').addEventListener('click', () => shiftMonth(1));
  $('expenseThisMonth').addEventListener('click', () => {
    state.y = TODAY.y; state.m = TODAY.m;
    writeHash(); render();
  });

  /* 会議資料。ひらいたときは、入っている月のうち いちばん新しい月を出します */
  $('storesMeetingBtn').addEventListener('click', () => {
    const last = latestMeetingMonth();
    if (last) { state.y = last.y; state.m = last.m; }
    openAllStores('meeting');
  });
  $('meetingBack').addEventListener('click', () => { flushMeetingNotes(); goHome(); });
  $('meetingPrev').addEventListener('click', () => { flushMeetingNotes(); shiftMonth(-1); });
  $('meetingNext').addEventListener('click', () => { flushMeetingNotes(); shiftMonth(1); });
  $('meetingThisMonth').addEventListener('click', () => {
    flushMeetingNotes();
    state.y = TODAY.y; state.m = TODAY.m;
    writeHash(); render();
  });
  // アプリを閉じたり、ほかのアプリに移ったときも取りこぼしません
  window.addEventListener('pagehide', flushMeetingNotes);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushMeetingNotes();
  });
  /* iPadを回したときなど、幅が変わったら案内を出し直します。
     どちらか片方だけだと取りこぼす端末があったので、両方かけています
     （同じことを2回やっても害はありません） */
  const watchWidth = () => { if (state.view === 'meeting') updateMeetingScrollHint(); };
  window.addEventListener('resize', watchWidth);
  window.addEventListener('orientationchange', () => setTimeout(watchWidth, 200));
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(watchWidth).observe(el.meetingTableWrap);
  }
  /* 率と金額の切り替え */
  el.meetingModeSeg.addEventListener('click', (e) => {
    const b = e.target.closest('.seg__btn');
    if (!b) return;
    meetingMode = b.dataset.mode;
    [...el.meetingModeSeg.children].forEach((n) => n.classList.toggle('is-on', n === b));
    renderMeeting();
  });

  /* 精算履歴。ひらくたびに「見るだけ」に戻します */
  $('expenseSettleBtn').addEventListener('click', () => {
    settleUnlocked = false;
    openAllStores('settle');
  });
  $('settleBack').addEventListener('click', () => {
    settleUnlocked = false;
    openAllStores('expense');
  });
  el.settleLockBtn.addEventListener('click', () => {
    settleUnlocked = !settleUnlocked;
    renderSettle();
  });
  $('settlePrev').addEventListener('click', () => { state.y -= 1; writeHash(); render(); });
  $('settleNext').addEventListener('click', () => { state.y += 1; writeHash(); render(); });
  $('settleThisYear').addEventListener('click', () => {
    state.y = TODAY.y;
    writeHash(); render();
  });
  el.settleSave.addEventListener('click', saveSettle);
  el.settleClear.addEventListener('click', clearSettle);
  el.settleAccount.addEventListener('input', markSettleChips);
  el.settleModal.querySelectorAll('[data-close-settle]').forEach((n) =>
    n.addEventListener('click', () => el.settleModal.classList.add('is-hidden'))
  );
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
  bindHalfWidthInput(el.pinInput, 'code');
  // 貼り付けた内容が正しいか目で確かめられるようにする
  $('pinReveal').addEventListener('click', () => {
    const show = el.pinInput.type === 'password';
    el.pinInput.type = show ? 'text' : 'password';
    $('pinReveal').textContent = show ? '隠す' : '表示';
  });

  /* 設定（この端末の設定のみ。項目・担当者・定休日は管理アプリで） */
  el.settingsBtn.addEventListener('click', () => openModal());

  // 「今すぐ最新にする」…控えを捨てて読み直します
  el.forceUpdate.addEventListener('click', () => {
    el.forceUpdate.disabled = true;
    el.forceUpdate.textContent = '読み直しています…';
    Updater.force();
  });
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
