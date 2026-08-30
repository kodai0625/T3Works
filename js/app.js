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
  reportMonth: $('reportMonth'), reportMonthSummary: $('reportMonthSummary'),
  calHead: $('calHead'), calGrid: $('calGrid'),
  missModal: $('missModal'), missFormTitle: $('missFormTitle'),
  missDate: $('missDate'), missStores: $('missStores'), missBy: $('missBy'),
  missWho: $('missWho'), missWhoFree: $('missWhoFree'),
  missText: $('missText'), missError: $('missError'), missSave: $('missSave'),
  missDeleteRow: $('missDeleteRow'),
  submitCard: $('submitCard'), submitStatus: $('submitStatus'),
  submitBtn: $('submitBtn'), unsubmitBtn: $('unsubmitBtn'), syncWarn: $('syncWarn'),
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
  expWhoNote: $('expWhoNote'),
  expenseTotals: $('expenseTotals'), expenseTotalWrap: $('expenseTotalWrap'),
  expenseFoot: $('expenseFoot'), expenseTotalYen: $('expenseTotalYen'),
  expenseUnpaidYen: $('expenseUnpaidYen'), expenseUnpaidBox: $('expenseUnpaidBox'),
  expensePeople: $('expensePeople'),
  viewCatch: $('viewCatch'), catchMonth: $('catchMonth'),
  catchSummary: $('catchSummary'), catchTotals: $('catchTotals'), catchList: $('catchList'),
  catchFoot: $('catchFoot'), catchPeopleTotal: $('catchPeopleTotal'),
  catchYenTotal: $('catchYenTotal'),
  rankCount: $('rankCount'), rankFilter: $('rankFilter'),
  rankRows: $('rankRows'), rankFoot: $('rankFoot'), rankNote: $('rankNote'),
  rankPie: $('rankPie'), rankPieBox: $('rankPieBox'),
  catchDetailModal: $('catchDetailModal'), catchDetailHead: $('catchDetailHead'),
  catchDetailList: $('catchDetailList'), catchDetailFoot: $('catchDetailFoot'),
  catchDetailNote: $('catchDetailNote'),
  viewSettle: $('viewSettle'), settleYear: $('settleYear'), settleSummary: $('settleSummary'),
  settleLockBtn: $('settleLockBtn'),
  settleRows: $('settleRows'), settleFoot: $('settleFoot'),
  settleModal: $('settleModal'), settleFormTitle: $('settleFormTitle'),
  settleFormYen: $('settleFormYen'), settleDate: $('settleDate'),
  settleAccounts: $('settleAccounts'), settleAccount: $('settleAccount'),
  settleError: $('settleError'), settleSave: $('settleSave'), settleClear: $('settleClear'),
  viewMeeting: $('viewMeeting'), meetingMonth: $('meetingMonth'),
  meetingSummary: $('meetingSummary'), meetingMonths: $('meetingMonths'),
  meetingLast: $('meetingLast'), meetingLastTitle: $('meetingLastTitle'),
  meetingNotesOf: $('meetingNotesOf'),
  meetingLastList: $('meetingLastList'),
  meetingBar: $('meetingBar'), meetingModeSeg: $('meetingMode'),
  nippouBox: $('nippouBox'), nippouPull: $('nippouPull'),
  nippouNote: $('nippouNote'), nippouResult: $('nippouResult'),
  utilEdit: $('utilEdit'), utilModal: $('utilModal'), utilYear: $('utilYear'),
  utilRows: $('utilRows'), utilSave: $('utilSave'),
  meetingTableWrap: $('meetingTableWrap'), meetingScrollHint: $('meetingScrollHint'),
  meetingCatchWarn: $('meetingCatchWarn'),
  meetingHead: $('meetingHead'), meetingBody: $('meetingBody'),
  meetingCumWrap: $('meetingCumWrap'), meetingCumBody: $('meetingCumBody'),
  meetingCumFoot: $('meetingCumFoot'), meetingCumTitle: $('meetingCumTitle'),
  meetingCumYearHead: $('meetingCumYearHead'),
  meetingGoals: $('meetingGoals'), meetingGoalPace: $('meetingGoalPace'),
  meetingGoalNote: $('meetingGoalNote'),
  meetingNotes: $('meetingNotes'), meetingNoteCount: $('meetingNoteCount'),
  expStoreField: $('expStoreField'), expStores: $('expStores'),
  expWhoField: $('expWhoField'), expWho: $('expWho'), expWhoFree: $('expWhoFree'),
  expPeopleField: $('expPeopleField'), expPeople: $('expPeople'),
  expFreeField: $('expFreeField'),
  expReceiptSeg: $('expReceipt'), expenseError: $('expenseError'),
  expenseFormTitle: $('expenseFormTitle'), expenseSave: $('expenseSave'),
  viewWeekAll: $('viewWeekAll'), weekAllRange: $('weekAllRange'),
  weekAllYear: $('weekAllYear'), weekAllGrid: $('weekAllGrid'),
  weekAllYearSummary: $('weekAllYearSummary'),
  weekAllSummary: $('weekAllSummary'), weekAllList: $('weekAllList'),
  viewShift: $('viewShift'), shiftPrev: $('shiftPrev'), shiftNext: $('shiftNext'),
  shiftToday: $('shiftToday'), shiftNavMain: $('shiftNavMain'), shiftNavSub: $('shiftNavSub'),
  shiftWishCount: $('shiftWishCount'), shiftWishNote: $('shiftWishNote'),
  shiftWishBtn: $('shiftWishBtn'), shiftTakeBtn: $('shiftTakeBtn'),
  shiftPhase: $('shiftPhase'), shiftOpenBtn: $('shiftOpenBtn'),
  shiftBuildBtn: $('shiftBuildBtn2'),
  shiftDays: $('shiftDays'), shiftSheetBtn: $('shiftSheetBtn'),
  shiftPickModal: $('shiftPickModal'), shiftPickTitle: $('shiftPickTitle'),
  shiftPickWhen: $('shiftPickWhen'), shiftPickTimeField: $('shiftPickTimeField'),
  shiftPickTimes: $('shiftPickTimes'), shiftPickTimeLabel: $('shiftPickTimeLabel'),
  shiftPickLanes: $('shiftPickLanes'),
  shiftPickFreeField: $('shiftPickFreeField'), shiftPickFree: $('shiftPickFree'),
  shiftPickFreeGo: $('shiftPickFreeGo'),
  shiftPickFullField: $('shiftPickFullField'),
  shiftPickEarlyField: $('shiftPickEarlyField'),
  shiftPickEarlyOn: $('shiftPickEarlyOn'), shiftPickEarlyOff: $('shiftPickEarlyOff'),
  shiftPickFullOn: $('shiftPickFullOn'), shiftPickFullOff: $('shiftPickFullOff'),
  shiftPickNameField: $('shiftPickNameField'),
  shiftPickNames: $('shiftPickNames'), shiftPickRemove: $('shiftPickRemove'),
  shiftWishModal: $('shiftWishModal'), shiftWishWhen: $('shiftWishWhen'),
  shiftWishList: $('shiftWishList'),
  shiftSheetModal: $('shiftSheetModal'), shiftSheetTitle: $('shiftSheetTitle'),
  shiftSheet: $('shiftSheet'), shiftPrintBtn: $('shiftPrintBtn'),
  shiftPdfBtn: $('shiftPdfBtn'), shiftJpegBtn: $('shiftJpegBtn'),
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

/**
 * いま出さない画面。URLを直に叩かれても入れないようにします
 * （ブックマークや履歴から古いURLで来ることがあるため）
 */
function viewIsOff(view) {
  return view === 'settle' && !SETTLE_PAGE_ON;
}

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
    // 出さないことにした画面は、現金支払い管理表へ回します
    state.view = viewIsOff(first) ? 'expense' : first;
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
  // シフトは半月ずつの画面。URLに日付が書いてあればそこを、
  // 書いていなければ「募集中の半月」を開きます
  if (task.id === 'shift') {
    if (third) {
      shiftHalf = shiftHalfOf(state.d);
    } else {
      const p = shiftFirstPeriod(state.storeId);
      state.y = p.y;
      state.m = p.m;
      state.d = p.half === 1 ? 1 : 16;
      shiftHalf = p.half;
    }
  }
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

  renderSyncWarn();

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
      // ★シフトだけは「今日」ではなく「募集中の半月」を開きます。
      //   募集は先の半月にかけるものなので、今日の半月を開いてしまうと、
      //   出してもらった希望がどこにも見えません（実際そうなりました）
      if (task.id === 'shift') {
        const p = shiftFirstPeriod(state.storeId);
        state.y = p.y;
        state.m = p.m;
        state.d = p.half === 1 ? 1 : 16;
        shiftHalf = p.half;
      }
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

/* ------------------------------------------------------------
 *  キャッチの明細を1行にまとめる
 *
 *  キャッチは「1人に渡すごとに1件」入れるので、同じ日の同じ店舗で
 *  何人にも渡すと、明細が同じような行でうまってしまいます。
 *  そこで一覧では
 *
 *      日付 × 立て替えた人 × 店舗
 *
 *  を1行にまとめ、合計の人数と金額だけを出します。
 *  渡した相手は一覧には出さず、「明細」を押して開く画面で見ます
 *  （店舗が違えば、同じ日・同じ人でも別の行になります）。
 *
 *  キャッチ以外は、まとめる意味がないので1件が1行のままです。
 *  並びは、そのかたまりの いちばん最初の1件があった場所です。
 * ---------------------------------------------------------- */

/** まとめるときの目じるし（日付・立て替えた人・店舗） */
function catchGroupKey(e) {
  return [e.d || '', e.by || '', e.store || ''].join('');
}

function catchGroups(list) {
  const map = new Map();
  const out = [];
  list.forEach((e) => {
    if (e.kind !== 'catch') {
      // キャッチ以外は、そのまま1件で1つのかたまりにします
      out.push({
        d: e.d || '', by: e.by || '', store: e.store || '',
        list: [e], people: 0, yen: Number(e.yen) || 0, isCatch: false,
      });
      return;
    }
    const key = catchGroupKey(e);
    let g = map.get(key);
    if (!g) {
      g = {
        d: e.d || '', by: e.by || '', store: e.store || '',
        list: [], people: 0, yen: 0, isCatch: true,
      };
      map.set(key, g);
      out.push(g);
    }
    g.list.push(e);
    g.people += Number(e.people) || 0;
    g.yen += Number(e.yen) || 0;
  });
  return out;
}

/**
 * まとめた行の領収書のしるし
 *   ぜんぶ有り → ◯ ／ ぜんぶ無し → × ／ まざっている → △
 */
function groupReceipt(g) {
  const yes = g.list.filter((e) => e.receipt).length;
  if (yes === g.list.length) return { mark: '◯', none: false, title: '領収書あり' };
  if (yes === 0) return { mark: '×', none: true, title: '領収書なし' };
  return { mark: '△', none: true, title: `領収書あり ${yes}件／なし ${g.list.length - yes}件` };
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
    // キャッチは「日付×店舗」でまとめます（立て替えた人はこのカードの人）
    const groups = catchGroups(p.list);
    const card = document.createElement('section');
    card.className = 'exp-card' + (done ? ' is-paid' : '');

    const head = document.createElement('div');
    head.className = 'exp-card__head';
    // 名前・件数・その人の合計。上の表を見に戻らなくても分かるようにします
    // 件数は「下に出ている行の数」です（キャッチはまとめた後の数になります）
    head.innerHTML =
      '<span class="exp-card__name"></span>' +
      `<span class="exp-card__count">${groups.length}件</span>` +
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
    groups.forEach((g) => {
      const e = g.list[0];
      const li = document.createElement('li');
      li.className = 'exp-row';
      const [, m, d] = (g.d || '').split('-');
      const receipt = groupReceipt(g);
      // キャッチは合計の人数で名前を作り直します（例：こじゃれキャッチ 63名）
      const label = g.isCatch
        ? expenseLabelOf('catch', g.store, g.people)
        : (e.label || '（項目なし）');
      li.innerHTML =
        `<span class="exp-row__date">${m ? `${+m}/${+d}` : '—'}</span>` +
        '<span class="exp-row__label"></span>' +
        `<span class="exp-row__receipt${receipt.none ? ' is-none' : ''}"` +
        ` title="${receipt.title}">${receipt.mark}</span>` +
        `<span class="exp-row__yen">${yenMarkup(g.yen)}</span>`;
      li.querySelector('.exp-row__label').textContent = label;
      /* ここには何件分かを添えていません。
         「こじゃれキャッチ 69名」だけで幅がいっぱいで、
         足すと iPhone の幅で名前ごと折り返してしまうためです。
         件数は「明細」を押すと、いちばん下の合計に出ます */

      if (g.isCatch) {
        // キャッチは渡した相手を一覧に出さないので、明細の画面で見て直します
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'row-edit';
        open.textContent = '明細';
        open.title = '渡した相手を見る・直す';
        open.addEventListener('click', () => openCatchDetail(g));
        li.appendChild(open);
      } else if (!done) {
        // 精算が済むまでは、間違えて入れたものを直したり消したりできます
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
  renderLedger();
  renderSyncStatus();
}

/**
 * お金の一覧を出しなおす
 *
 * 現金支払い管理表とキャッチ集計は同じ記録を見ているので、
 * どちらから直しても、いま開いている方を出しなおします。
 */
function renderLedger() {
  if (state.view === 'catch') renderCatch();
  else renderExpense();
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

/**
 * 「渡した相手」のえらび方。店舗ごとにまとめて出します。
 * いま選んでいる店舗の人がいちばん上、そのあとに他店舗の人が続きます
 * （他店舗の子に渡すこともあるので、消さずに残しています）。
 */
function fillWhoOptions(who) {
  const map = CatchStaff.all();
  el.expWho.innerHTML = '<option value="">選んでください</option>';
  const order = pickableStores().map((x) => x.id)
    .sort((a, b) => (b === expStore ? 1 : 0) - (a === expStore ? 1 : 0));
  const known = [];
  order.forEach((id) => {
    const names = map[id] || [];
    if (!names.length) return;
    const g = document.createElement('optgroup');
    g.label = getStore(id).name;
    names.forEach((n) => {
      const o = document.createElement('option');
      o.value = n; o.textContent = n;
      g.appendChild(o);
      known.push(n);
    });
    el.expWho.appendChild(g);
  });
  const other = document.createElement('option');
  other.value = CATCH_OTHER;
  other.textContent = 'その他（名前を書く）';
  el.expWho.appendChild(other);
  el.expWho.value = (who && known.includes(who)) ? who : (who ? CATCH_OTHER : '');
}

function openExpenseForm(entry) {
  expEditing = entry || null;
  el.expDate.value = expEditing ? expEditing.d : ymd(TODAY.y, TODAY.m, TODAY.d);
  el.expLabel.value = '';
  el.expYen.value = expEditing ? expEditing.yen : '';
  el.expPeople.value = expEditing && expEditing.people ? expEditing.people : '';

  /* 渡した相手（キャッチのとき）。リストに無い人は「その他」で名前を書きます */
  const who = expEditing ? (expEditing.who || '') : '';
  fillWhoOptions(who);
  el.expWhoFree.value = el.expWho.value === CATCH_OTHER ? who : '';
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

  /* 店舗のボタン（買い出し・キャッチのときだけ出ます）
     まいと（CATCH_ONLY_STORES）は買い出しには出しません。
     お店ではないので、そこへ買い出しに行くことがないためです */
  el.expStores.innerHTML = '';
  pickableStores().forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'exp-chip';
    b.dataset.store = s.id;
    if (CATCH_ONLY_STORES.some((x) => x.id === s.id)) b.dataset.catchOnly = '1';
    // えらんだときは、その店舗の色にします（一覧の店舗カードと同じ色）
    b.style.setProperty('--pick-color', s.color);
    // 略さない名前を出します（「おいでん」ではなく「おいでんテラス」）
    b.textContent = s.name;
    b.addEventListener('click', () => {
      expStore = s.id;
      fillWhoOptions(el.expWho.value === CATCH_OTHER ? el.expWhoFree.value : el.expWho.value);
      renderExpenseForm();
    });
    el.expStores.appendChild(b);
  });

  renderExpenseForm();
  el.expenseModal.classList.remove('is-hidden');
}

/** えらんだ項目に合わせて、下の入力欄を出し入れします */
function renderExpenseForm() {
  const kind = getExpenseKind(expKind);
  const isCatch = !!(kind && kind.who);
  [...el.expChips.children].forEach((b) => b.classList.toggle('is-on', b.dataset.kind === expKind));

  // まいとはキャッチのときだけ出します。買い出しに切り替えたら、
  // えらんだままにならないよう外します（見えないものが選ばれている状態を作らない）
  [...el.expStores.children].forEach((b) => {
    const only = b.dataset.catchOnly === '1';
    b.classList.toggle('is-hidden', only && !isCatch);
    if (only && !isCatch && expStore === b.dataset.store) expStore = '';
    b.classList.toggle('is-on', b.dataset.store === expStore);
  });

  /* 渡した相手は9月分から。8月までは人数と金額だけで記録できます */
  const whoOn = isCatch && catchWhoNeeded(el.expDate.value);
  el.expStoreField.classList.toggle('is-hidden', !(kind && kind.store));
  el.expPeopleField.classList.toggle('is-hidden', !(kind && kind.people));
  el.expWhoField.classList.toggle('is-hidden', !whoOn);
  el.expWhoNote.classList.toggle('is-hidden', !(isCatch && !whoOn));
  if (isCatch && !whoOn) el.expWhoNote.innerHTML = catchWhoNoteText();
  el.expFreeField.classList.toggle('is-hidden', !(kind && kind.free));
  el.expWhoFree.classList.toggle('is-hidden', el.expWho.value !== CATCH_OTHER);
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
  const who = el.expWho.value === CATCH_OTHER ? el.expWhoFree.value.trim() : el.expWho.value;

  if (!d) { el.expenseError.textContent = '支払った日を入れてください。'; return; }
  if (!by) { el.expenseError.textContent = '立て替えた人を選んでください。'; return; }
  if (!kind) { el.expenseError.textContent = '支払い項目をえらんでください。'; return; }
  if (kind.store && !expStore) { el.expenseError.textContent = 'どの店舗かをえらんでください。'; return; }
  if (kind.people && (!people || people <= 0)) { el.expenseError.textContent = '人数を入れてください。'; return; }
  // 渡した相手は9月分から。8月までは人数と金額だけで記録できます
  if (kind.who && catchWhoNeeded(d) && !who) {
    el.expenseError.textContent = '渡した相手をえらんでください。';
    return;
  }
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
    who: kind.who ? who : '',
  });

  // 入れた月を表示する（先月分を入れたときも、その場で確かめられます）
  state.y = yy;
  state.m = mm;
  el.expenseModal.classList.add('is-hidden');
  writeHash();
  renderLedger();
  renderSyncStatus();
}

/* ------------------------------------------------------------
 *  キャッチ集計
 *
 *  現金支払い管理表に入れた「キャッチ」だけを取り出して、
 *  その月に 店舗ごとで 何人つれてきて いくら払ったか を出します。
 * ---------------------------------------------------------- */
function catchByStore() {
  const entries = expenseEntries(expenseRec()).filter((e) => e.kind === 'catch');

  const map = new Map();
  const add = (id) => {
    if (!map.has(id)) map.set(id, { id, list: [], people: 0, yen: 0 });
    return map.get(id);
  };
  catchStoreIds().forEach(add);              // 0人の月でも行を出すため、先に並べておく
  entries.forEach((e) => {
    const row = add(e.store || '');
    row.list.push(e);
    row.people += Number(e.people) || 0;
    row.yen += Number(e.yen) || 0;
  });

  return [...map.values()].filter((r) => r.id || r.list.length);
}

/* ------------------------------------------------------------
 *  キャッチのランキング
 *
 *  「誰に いくら渡したか」で数えます。相手は現金支払い管理表の
 *  キャッチの記録に入っている who です。
 * ---------------------------------------------------------- */

/** ランキングを「この月」で見るか「すべて」で見るか */
let rankRange = 'near';
/** 店舗でしぼる（空なら全店舗＝会社ぜんぶ） */
let rankFilter = '';

/** キャッチの記録を集めます（すべてのときは、入っている月を全部読みます） */
function catchEntriesFor(range) {
  if (range !== 'all') {
    return expenseEntries(expenseRec()).filter((e) => e.kind === 'catch');
  }
  const dump = Store.adapter.dump();
  const out = [];
  Object.keys(dump).forEach((key) => {
    if (!key.startsWith(EXPENSE_STORE + '/')) return;
    const items = (dump[key] || {}).items || {};
    Object.keys(items).forEach((id) => {
      const v = items[id];
      if (v && v.yen && v.kind === 'catch') out.push({ id, ...v });
    });
  });
  return out;
}

/** 人ごとに足して、金額の多い順に並べます */
function catchRanking(range, storeId) {
  const map = new Map();
  catchEntriesFor(range)
    .filter((e) => !storeId || e.store === storeId)
    .forEach((e) => {
      const name = (e.who || '').trim() || '（相手なし）';
      if (!map.has(name)) map.set(name, { name, people: 0, yen: 0, count: 0 });
      const r = map.get(name);
      r.people += Number(e.people) || 0;
      r.yen += Number(e.yen) || 0;
      r.count += 1;
    });
  return [...map.values()].sort((a, b) => b.yen - a.yen || b.people - a.people
    || a.name.localeCompare(b.name, 'ja'));
}

/* 円グラフと帯の色。上位8人まで色を分けて、それより下は灰色にまとめます。
   明るい画面でも暗い画面でも読める明るさにそろえてあります */
const RANK_COLORS = ['#2f9e6e', '#3d7fd6', '#e0892c', '#9a63cf', '#d1566d',
  '#2fa3b5', '#8c9a35', '#b4713f'];
const RANK_REST_COLOR = '#98a2ac';
const RANK_TOP = 8;

function rankColor(i) { return i < RANK_TOP ? RANK_COLORS[i] : RANK_REST_COLOR; }

/** 円グラフに出す名前。長すぎると絵からはみ出すので、みじかくします */
function rankShortName(name) {
  return name.length > 6 ? `${name.slice(0, 5)}…` : name;
}

/** 金額の割合を、まんなかに合計を出した円グラフ（ドーナツ）にします */
function renderRankPie(list, total) {
  el.rankPie.classList.toggle('is-hidden', !total);
  if (!total) { el.rankPieBox.innerHTML = ''; return; }

  // 上位8人はそのまま。9人目からは「ほか」にひとまとめ
  const parts = list.slice(0, RANK_TOP).map((r, i) => ({
    name: r.name, yen: r.yen, color: RANK_COLORS[i],
  }));
  const restYen = list.slice(RANK_TOP).reduce((t, r) => t + r.yen, 0);
  if (restYen) {
    parts.push({ name: `ほか${list.length - RANK_TOP}人`, yen: restYen, color: RANK_REST_COLOR });
  }

  /* 輪のかたち。まわりに名前を出すので、横長の絵にしています */
  const VW = 220, VH = 158;                 // 絵ぜんたいの大きさ
  const CX = 110, CY = 79;                  // 輪のまんなか
  const R = 46, BAND = 17;                  // 半径と、輪の太さ
  const OUT = R + BAND / 2;                 // 輪の外がわ
  const C = 2 * Math.PI * R;
  const gap = parts.length > 1 ? C * 0.008 : 0;   // 色と色のあいだの細いすき間

  let acc = 0;
  const marks = [];
  const arcs = parts.map((p) => {
    const f = p.yen / total;
    // その色のまん中の向き（12時から時計まわり）
    marks.push({ ...p, f, mid: (acc + f / 2) * 2 * Math.PI - Math.PI / 2 });
    const len = f * C;
    const draw = Math.max(len - gap, 0.6);
    const off = -acc * C;
    acc += f;
    return `<circle class="rank-pie__arc" cx="${CX}" cy="${CY}" r="${R}" stroke="${p.color}"
        stroke-width="${BAND}"
        stroke-dasharray="${draw.toFixed(2)} ${(C - draw).toFixed(2)}"
        stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${CX} ${CY})"></circle>`;
  }).join('');

  /* ---- まわりに出す名前。細すぎる色は出しません（重なって読めなくなるため） ---- */
  const labels = marks.filter((m) => m.f >= 0.015);
  const right = [], left = [];
  labels.forEach((m) => {
    m.dir = Math.cos(m.mid) >= 0 ? 1 : -1;
    m.y0 = CY + (OUT + 7) * Math.sin(m.mid);
    (m.dir > 0 ? right : left).push(m);
  });
  // 上から順にならべ、近すぎるものは下へずらして重なりを防ぎます
  const STEP = 12, TOP = 11, BOTTOM = VH - 9;
  [right, left].forEach((side) => {
    side.sort((a, b) => a.y0 - b.y0);
    let y = TOP;
    side.forEach((m) => { m.y = Math.max(m.y0, y); y = m.y + STEP; });
    const over = side.length ? side[side.length - 1].y - BOTTOM : 0;
    if (over > 0) side.forEach((m) => { m.y = Math.max(m.y - over, TOP); });
  });

  const leads = labels.map((m) => {
    const x0 = CX + OUT * Math.cos(m.mid), y0 = CY + OUT * Math.sin(m.mid);
    const x1 = CX + (OUT + 6) * Math.cos(m.mid), y1 = CY + (OUT + 6) * Math.sin(m.mid);
    const lx = CX + m.dir * 64;
    return `<polyline class="rank-pie__lead" stroke="${m.color}"
        points="${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} `
      + `${(lx - m.dir * 4).toFixed(1)},${m.y.toFixed(1)}"></polyline>`;
  }).join('');

  const texts = labels.map((m) => {
    const nm = rankShortName(m.name);
    // 長い名前は少し小さくして、絵からはみ出さないようにします
    const fs = nm.length >= 6 ? 5.2 : nm.length >= 5 ? 6 : 7;
    const lx = CX + m.dir * 64;
    return `<text class="rank-pie__label" x="${lx}" y="${(m.y + 2.4).toFixed(1)}"
        text-anchor="${m.dir > 0 ? 'start' : 'end'}" style="font-size:${fs}px">`
      + '<tspan class="rank-pie__labelName"></tspan>'
      + `<tspan class="rank-pie__labelPct" dx="2.5" style="font-size:${(fs * 0.82).toFixed(1)}px">`
      + `${Math.round(m.f * 100)}%</tspan></text>`;
  }).join('');

  const people = list.reduce((t, r) => t + r.people, 0);
  // まんなかの金額は、けたが増えたら小さくして輪からはみ出さないようにします
  const fs = total >= 10000000 ? 9 : total >= 1000000 ? 10.5 : 12;
  el.rankPieBox.innerHTML = `
    <svg class="rank-pie__svg" viewBox="0 0 ${VW} ${VH}" role="img"
         aria-label="渡した相手ごとの金額の割合">
      <circle class="rank-pie__hole" cx="${CX}" cy="${CY}" r="${R}"
              stroke-width="${BAND}"></circle>
      ${arcs}
      ${leads}
      ${texts}
      <text class="rank-pie__yen" x="${CX}" y="${CY - 1}" style="font-size:${fs}px">¥${total.toLocaleString('ja-JP')}</text>
      <text class="rank-pie__people" x="${CX}" y="${CY + 10}">${people.toLocaleString('ja-JP')}名</text>
    </svg>`;

  // 名前はそのまま入れると危ないので、DOMで入れます
  [...el.rankPieBox.querySelectorAll('.rank-pie__labelName')].forEach((t, i) => {
    t.textContent = rankShortName(labels[i].name);
  });
  // マウスを乗せると、正しい名前と割合が出ます
  [...el.rankPieBox.querySelectorAll('.rank-pie__arc')].forEach((c, i) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    t.textContent = `${parts[i].name}　${((parts[i].yen / total) * 100).toFixed(1)}%`;
    c.appendChild(t);
  });
}

function renderCatchRank() {
  const all = catchRanking(rankRange, '');
  const list = catchRanking(rankRange, rankFilter);

  el.rankCount.textContent = list.length ? `（${list.length}人）` : '';

  /* ---- 店舗でしぼるボタン ---- */
  el.rankFilter.innerHTML = '';
  const chip = (id, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'exp-chip' + (rankFilter === id ? ' is-on' : '');
    b.dataset.store = id;
    if (id) b.style.setProperty('--pick-color', getStore(id).color);
    b.textContent = label;
    b.addEventListener('click', () => { rankFilter = id; renderCatchRank(); });
    el.rankFilter.appendChild(b);
  };
  chip('', '全店舗');
  catchStoreIds().forEach((id) => chip(id, getStore(id).name));

  /* ---- 順位 ---- */
  el.rankRows.innerHTML = '';
  if (!list.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td class="exp-total__name" colspan="5">キャッチの記録がありません。</td>';
    el.rankRows.appendChild(tr);
    el.rankFoot.innerHTML = '';
    renderRankPie([], 0);
    return;
  }

  const total = list.reduce((t, r) => t + r.yen, 0);

  // 金額が同じなら同じ順位にします
  let rank = 0, prev = null;
  list.forEach((r, i) => {
    if (prev === null || r.yen !== prev) rank = i + 1;
    prev = r.yen;

    const tr = document.createElement('tr');
    if (rank <= 3) tr.classList.add('is-top', 'is-top' + rank);

    const no = document.createElement('td');
    no.className = 'rank-no';
    no.textContent = rank;

    const name = document.createElement('td');
    name.className = 'exp-total__name rank-name';
    const dot = document.createElement('span');
    dot.className = 'rank-dot';
    dot.style.background = rankColor(i);
    name.append(dot, document.createTextNode(r.name));

    const people = document.createElement('td');
    people.className = 'exp-total__yen';
    people.innerHTML = r.people ? `${r.people.toLocaleString('ja-JP')}<span class="ledger-unit">名</span>` : '—';

    const yen = document.createElement('td');
    yen.className = 'exp-total__yen';
    yen.innerHTML = yenMarkup(r.yen);

    /* 帯の長さ＝全体に占める割合。表の右にあく場所を、この帯でうめます */
    const pct = total ? (r.yen / total) * 100 : 0;
    const share = document.createElement('td');
    share.className = 'rank-share';
    share.innerHTML = '<span class="rank-share__in">'
      + `<span class="rank-bar"><i style="width:${pct.toFixed(1)}%;`
      + `background:${rankColor(i)}"></i></span>`
      + `<b class="rank-pct">${pct.toFixed(1)}<span class="ledger-unit">%</span></b></span>`;

    tr.append(no, name, people, yen, share);
    el.rankRows.appendChild(tr);
  });

  /* ---- 合計 ---- */
  const people = list.reduce((t, r) => t + r.people, 0);
  el.rankFoot.innerHTML =
    '<tr class="ledger-foot"><td class="exp-total__name" colspan="2">合計</td>'
    + `<td class="exp-total__yen">${people.toLocaleString('ja-JP')}<span class="ledger-unit">名</span></td>`
    + `<td class="exp-total__yen">${yenMarkup(total)}</td>`
    + '<td class="rank-share"><span class="rank-share__in"><b class="rank-pct">100'
    + '<span class="ledger-unit">%</span></b></span></td></tr>';

  renderRankPie(list, total);

  // 全店舗の人数と合わないときは、しぼっていることが分かるようにします
  el.rankNote.classList.toggle('is-hidden', !all.length);
}

function renderCatch() {
  renderCatchRank();
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
    // 同じ日に同じ人が立て替えた分は1行にまとめます（店舗はこのカードの店舗）
    const groups = catchGroups(r.list);
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
    groups.forEach((g) => {
      const li = document.createElement('li');
      li.className = 'exp-row';
      const [, m, d] = (g.d || '').split('-');
      li.innerHTML =
        `<span class="exp-row__date">${m ? `${+m}/${+d}` : '—'}</span>` +
        '<span class="exp-row__label"></span>' +
        `<span class="exp-row__yen">${yenMarkup(g.yen)}</span>`;
      // 人数 → 立て替えた人 の順に出します（渡した相手は「明細」の中）
      const labelEl = li.querySelector('.exp-row__label');
      labelEl.textContent = `${g.people}名${g.by ? '　立替 ' + g.by : ''}`;

      // こちらは名前が短いので、何件分かを添えても折り返しません
      if (g.list.length > 1) {
        const n = document.createElement('span');
        n.className = 'exp-row__n';
        n.textContent = `${g.list.length}件`;
        labelEl.appendChild(n);
      }

      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'row-edit';
      open.textContent = '明細';
      open.title = '渡した相手を見る・直す';
      open.addEventListener('click', () => openCatchDetail(g));
      li.appendChild(open);

      list.appendChild(li);
    });
    card.appendChild(list);
    el.catchList.appendChild(card);
  });
}

/* ------------------------------------------------------------
 *  キャッチの明細（まとめた1行の中身）
 *
 *  一覧では「日付 × 立て替えた人 × 店舗」で1行にまとめているので、
 *  誰にいくら渡したかは、この画面で見て、1件ずつ直します。
 * ---------------------------------------------------------- */

/** いま開いているかたまり。{ d, by, store } */
let catchDetail = null;

function openCatchDetail(g) {
  catchDetail = { d: g.d, by: g.by, store: g.store };
  renderCatchDetail();
  el.catchDetailModal.classList.remove('is-hidden');
}

function closeCatchDetail() {
  catchDetail = null;
  el.catchDetailModal.classList.add('is-hidden');
}

/** 「8/6（水）」のかたち */
function catchDetailDate(str) {
  const [y, m, d] = (str || '').split('-').map(Number);
  if (!y || !m || !d) return '日付なし';
  return `${m}/${d}（${DOW[new Date(y, m - 1, d).getDay()]}）`;
}

/**
 * 中身を出す
 *
 * 開いたまま直したり消したりできるので、そのつど数えなおします。
 * ぜんぶ消して空になったら、この画面は閉じます。
 */
function renderCatchDetail() {
  if (!catchDetail) return;
  const { d, by, store } = catchDetail;
  const rec = expenseRec();
  const list = expenseEntries(rec).filter((e) => e.kind === 'catch'
    && (e.d || '') === d && (e.by || '') === by && (e.store || '') === store);
  if (!list.length) { closeCatchDetail(); return; }

  const people = list.reduce((t, e) => t + (Number(e.people) || 0), 0);
  const yen = list.reduce((t, e) => t + (Number(e.yen) || 0), 0);
  // 精算が済んだ月の分は、金額が変わってしまうと困るので直せなくします
  const paid = (rec.items || {})[expensePaidKey(by)];
  const locked = !!(paid && paid.done);

  /* 見出し：いつ・どの店舗・誰が立て替えたか */
  el.catchDetailHead.textContent =
    `${catchDetailDate(d)}　${store ? getStore(store).name : '（店舗なし）'}　立替 ${by || '（名前なし）'}`;
  // 店舗の色を細い帯で添えます（キャッチ集計のカードと同じ色）
  el.catchDetailHead.style.setProperty('--card-color', store ? getStore(store).color : 'var(--money)');

  /* 1件ずつ：渡した相手・人数・金額 */
  el.catchDetailList.innerHTML = '';
  list.forEach((e) => {
    const li = document.createElement('li');
    li.className = 'catch-detail__row';
    li.innerHTML =
      '<span class="catch-detail__who"></span>' +
      `<span class="catch-detail__people">${Number(e.people) || 0}<span class="ledger-unit">名</span></span>` +
      `<span class="catch-detail__yen">${yenMarkup(e.yen)}</span>`;
    li.querySelector('.catch-detail__who').textContent = (e.who || '').trim() || '（相手なし）';

    if (!locked) {
      const act = document.createElement('span');
      act.className = 'catch-detail__act';

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'row-edit';
      edit.textContent = '直す';
      edit.title = 'この1件を直す';
      edit.addEventListener('click', () => {
        closeCatchDetail();
        openExpenseForm(e);
      });
      act.appendChild(edit);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'exp-row__del';
      del.textContent = '×';
      del.title = 'この1件を消す';
      del.addEventListener('click', async () => {
        await removeExpense(e);
        renderCatchDetail();   // 消したあとの中身を出しなおす
      });
      act.appendChild(del);

      li.appendChild(act);
    }
    el.catchDetailList.appendChild(li);
  });

  /* いちばん下の合計。ボタンの場所は空のまま置いて、金額の位置をそろえます */
  el.catchDetailFoot.innerHTML =
    `<span class="catch-detail__who">合計　<span class="ledger-foot__note">${list.length}件</span></span>` +
    `<span class="catch-detail__people">${people}<span class="ledger-unit">名</span></span>` +
    `<span class="catch-detail__yen">${yenMarkup(yen)}</span>` +
    (locked ? '' : '<span class="catch-detail__act"></span>');

  el.catchDetailNote.textContent = locked
    ? '精算が済んでいるので、直したり消したりはできません。'
    : '';
  el.catchDetailNote.classList.toggle('is-hidden', !locked);
}

/* ============================================================
 *  精算履歴（経理担当だけ・T3 Works Mine にしか出しません）
 *
 *  その月分をまとめて会社の口座から払った記録です。
 *  金額はここでは持たず、現金支払い管理表から毎回計算します。
 *  スプレッドシートで  ='1月'!C17  と参照していたのと同じで、
 *  あとから明細を直せば、この表の金額も勝手に付いてきます。
 * ============================================================ */

/** その月の立替の合計（現金支払い管理表の合計と同じ数字） */
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
 *               （現金支払い管理表に入れた分）から拾います。
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
/**
 * その月の数字。
 *   下じき … meeting-data.js（2026年1〜6月を取り込んだもの）
 *   上ぬり … _meeting/YYYY-MM に保存された数字
 *            num:店舗id  … 日報から取り込んだ5項目
 *            util:店舗id … 手で入れた光熱費
 * 何度も呼ばれるので、取り込みや手入力があるまでは覚えたものを返します。
 */
let meetingSeq = 0;
const meetingMemo = { key: '', seq: -1, val: null };

function meetingOf(y, m) {
  const key = meetingMonthKey(y, m);
  if (meetingMemo.key === key && meetingMemo.seq === meetingSeq) return meetingMemo.val;
  const base = (typeof MEETING_DATA === 'undefined') ? null : (MEETING_DATA[key] || null);
  const val = meetingWithSaved(base, key);
  meetingMemo.key = key;
  meetingMemo.seq = meetingSeq;
  meetingMemo.val = val;
  return val;
}

function meetingWithSaved(base, key) {
  const items = Store.getDay(MEETING_STORE, key).items || {};
  const ids = Object.keys(items).filter((k) => k.indexOf('num:') === 0 || k.indexOf('util:') === 0);
  if (!ids.length) return base;

  const out = { rows: {}, notes: (base && base.notes) || [] };
  if (base) {
    Object.entries(base.rows).forEach(([id, v]) => {
      out.rows[id] = { now: (v.now || []).slice(), last: (v.last || []).slice() };
    });
  }
  ids.forEach((k) => {
    const sid = k.split(':')[1];
    const saved = items[k] && items[k].value;
    if (!saved || !sid) return;
    if (!out.rows[sid]) out.rows[sid] = { now: [], last: [] };
    ['now', 'last'].forEach((side) => {
      const src = saved[side];
      if (!src) return;
      if (!out.rows[sid][side]) out.rows[sid][side] = [];
      Object.keys(src).forEach((f) => {
        const i = MEETING_FIELDS.indexOf(f);
        if (i >= 0 && typeof src[f] === 'number') out.rows[sid][side][i] = src[f];
      });
    });
  });
  return out;
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
 * 現金支払い管理表で「キャッチ」をえらんで入れた分を、店舗ごとに足します
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

/* ------------------------------------------------------------
 *  表の列
 *
 *  1つの項目につき「今年・昨年・差」の3列。もとのシートと同じ並びです。
 *    main    … その升目の主の数字   mainKind: yen=金額 / num=人数 / pct=率
 *    sub     … 主の数字に添える数字（原価なら金額の下に率）
 *    goodWhen… 増えたほうが良いか（差の色分けに使います）
 *  1つの表に全部入れると横に長くなりすぎるので、3つに分けています。
 * ---------------------------------------------------------- */
/**
 * 原価率。★日報の「まとめ」タブが出している原材料費率と同じ出し方です
 *   原価（＝仕入の税込累計）÷ 税込売上
 * 原価はもともと税込の数字なので、割る相手も税込にそろえます。
 * もとのスプレッドシートは昨年だけ税抜売上で割っていて土俵が違いました。
 * ko-dai の指示で、今年も昨年も税込にそろえてあります（2026年8月15日）。
 * 人件費率と光熱費率は税のない数字なので、今年・昨年とも税抜売上で割ります。
 * F/L はこの2つの率の足し算です（6月のシートと同じ）。
 */
function meetingCostRate(v) {
  return v.inc ? v.cost / v.inc : null;
}

const MEETING_MODES = {
  sales: [
    { label: '税込売上', mainKind: 'yen', main: (v) => v.inc, goodWhen: 'up' },
    { label: '税抜売上', mainKind: 'yen', main: (v) => v.ex, goodWhen: 'up' },
    { label: '来店人数', mainKind: 'num', unit: '人', main: (v) => v.guests, goodWhen: 'up' },
    { label: '客単価', mainKind: 'yen', goodWhen: 'up',
      main: (v) => (v.guests ? Math.round(v.ex / v.guests) : null) },
  ],
  cost: [
    // big … 金額と率のどちらも大きく出します（会議でいちばん見る2つ）
    { label: '原価', mainKind: 'yen', subKind: 'pct', goodWhen: 'down', big: true,
      main: (v) => v.cost, sub: (v) => meetingCostRate(v) },
    { label: '人件費', mainKind: 'yen', subKind: 'pct', goodWhen: 'down', big: true,
      main: (v) => v.labor, sub: (v) => (v.ex ? v.labor / v.ex : null) },
    { label: 'F/L', mainKind: 'pct', goodWhen: 'down',
      main: (v) => {
        const c = meetingCostRate(v);
        const l = v.ex ? v.labor / v.ex : null;
        return (c === null || l === null) ? null : c + l;
      } },
    // キャッチだけは、差の下段を「増減率」ではなく「人数の差」にします。
    // 人数も会議で見る数字なので、金額と同じ大きさで出します（big）
    { label: 'キャッチ', mainKind: 'yen', subKind: 'num', subUnit: '人', diffSub: 'sub', big: true,
      main: (v) => v.katch, sub: (v) => v.katchPeople },
  ],
  // 光熱費も、もとのシートと同じように金額と率の両方を出します。
  // ★その下に使用量を1行ずつ足しています。金額だけだと、値上がりで増えたのか
  //   使いすぎで増えたのかが分かりません。使用量が並んでいれば見分けられます
  util: MEETING_UTIL_ROWS.reduce((rows, u) => rows.concat([
    { label: u.name, mainKind: 'yen', subKind: 'pct', goodWhen: 'down', big: true,
      main: (v) => v[u.key], sub: (v) => (v.ex ? v[u.key] / v.ex : null) },
    { label: `${u.name} 使用量`, mainKind: 'num', unit: u.unit, goodWhen: 'down',
      main: (v) => v[u.use] },
  ]), []).concat([
    { label: '光熱費 合計', mainKind: 'yen', subKind: 'pct', goodWhen: 'down', big: true,
      main: (v) => (v.gas + v.water + v.power) || null,
      sub: (v) => (v.ex ? (v.gas + v.water + v.power) / v.ex : null) },
  ]),
};

/** いまどの表を出しているか */
let meetingMode = 'sales';

/**
 * 数字を書き出す（差のときは符号を付けます）
 *   yen   … 金額      num … 人数
 *   pct   … 率（％）。差のときは「率がどれだけ動いたか」を％で出します
 *   ratio … 前の年から何％増えたか減ったか
 */
function meetingNum(n, kind, unit, diff) {
  if (n === null || n === undefined || !isFinite(n) || (!diff && !n)) return '—';
  const isPct = kind === 'pct' || kind === 'ratio';
  if (diff && Math.round(isPct ? n * 1000 : n) === 0) return '±0';
  const sign = diff ? (n > 0 ? '+' : '−') : '';
  const v = diff ? Math.abs(n) : n;
  if (isPct) return `${sign}${(v * 100).toFixed(1)}%`;
  if (kind === 'num') return `${sign}${Math.round(v).toLocaleString('ja-JP')}<span class="ledger-unit">${unit || ''}</span>`;
  return sign + yenMarkup(Math.round(v));
}

/** 1つの升目（主の数字と、あれば下に添える数字） */
function meetingCell(col, v, opts = {}) {
  const diff = !!opts.diff;
  const main = col.main ? col.main(v) : null;
  const sub = col.sub ? col.sub(v) : null;
  let cls = 'mt-cell';
  cls += opts.last ? ' is-last' : (opts.diff ? '' : ' is-now');
  if (diff) {
    cls += ' is-vs';
    if (col.goodWhen && main) {
      const good = col.goodWhen === 'up' ? main > 0 : main < 0;
      cls += good ? ' is-good' : ' is-bad';
    }
  }
  if (col.big) cls += ' mt-cell--two';
  const subHtml = col.sub
    ? `<span class="mt-sub">${meetingNum(sub, col.subKind, col.subUnit, diff)}</span>`
    : '';
  return `<td class="${cls}"><span class="mt-main">${meetingNum(main, col.mainKind, col.unit, diff)}</span>${subHtml}</td>`;
}

/**
 * 差の升目に出すもの
 *   上段 … 今年 − 昨年（金額・人数・率）
 *   下段 … 前の年から何％増えたか減ったか
 *          （キャッチだけは、人数の差を出します）
 * 率だけの項目（F/L）は、率の差そのものが％なので下段はありません。
 */
function meetingDiffCol(col, now, last) {
  const a = col.main ? col.main(now) : null;
  const b = col.main ? col.main(last) : null;
  // 今年も昨年も入っていない項目は、差も「—」にします（±0 とは出しません）
  const d = (x, y) => ((x === null || y === null) || (!x && !y) ? null : x - y);
  const out = { ...col, main: () => d(a, b), sub: null, subKind: 'ratio', subUnit: '' };

  if (col.diffSub === 'sub' && col.sub) {
    const s = d(col.sub(now), col.sub(last));
    out.sub = () => s;
    out.subKind = col.subKind;
    out.subUnit = col.subUnit;
  } else if (col.mainKind !== 'pct') {
    const r = (a && b) ? (a / b - 1) : null;
    out.sub = () => r;
  }
  return out;
}

/** 1項目分の3つの升目（今年・昨年・差） */
function meetingCells(col, now, last) {
  return meetingCell(col, now)
    + meetingCell(col, last, { last: true })
    + meetingCell(meetingDiffCol(col, now, last), null, { diff: true });
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
  // 「2026年6月」の右に「7月の会議」。どちらの月の話かを取り違えないためです
  const heldText = meetingHeldText(state.y, state.m, state.y);
  el.meetingNotesOf.textContent = `（${heldText}の会議）`;
  el.meetingMonth.innerHTML = `${state.y}年${state.m}月`
    + `<span class="meeting-held">${heldText}の会議</span>`;

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

  /* キャッチは店舗ごとに数えるので、店舗が入っていない記録は
     どの店舗にも出ません。埋もれないよう、ここで知らせます */
  const loose = katch[''] || null;
  el.meetingCatchWarn.classList.toggle('is-hidden', !(has && loose && loose.yen));
  if (loose && loose.yen) {
    el.meetingCatchWarn.textContent =
      `店舗が入っていないキャッチが ${loose.people.toLocaleString('ja-JP')}名`
      + `／¥${loose.yen.toLocaleString('ja-JP')} あります。`
      + '現金支払い管理表でその記録に店舗を入れると、この表に出ます。';
  }

  el.meetingSummary.textContent = has ? '' : 'この月の数字は、まだ入っていません。';
  el.meetingSummary.classList.toggle('is-hidden', has);
  el.meetingTableWrap.classList.toggle('is-hidden', !has);
  el.meetingBar.classList.toggle('is-hidden', !has);

  if (has) {
    renderMeetingTable(list);
  } else {
    // 数字の無い月に切り替えたとき、前の月の表が残らないように空にします
    el.meetingHead.innerHTML = '';
    el.meetingBody.innerHTML = '';
    el.meetingScrollHint.classList.add('is-hidden');
  }
  renderMeetingMonths();
  renderNippou();
  el.utilEdit.classList.toggle('is-hidden', meetingMode !== 'util');
  renderMeetingLast();
  renderMeetingCum();
  renderMeetingGoals();
  renderMeetingNotes();
}

/** 1〜12月のタブ。数字が入っている月は濃く出します */
function renderMeetingMonths() {
  el.meetingMonths.innerHTML = '';
  for (let m = 1; m <= 12; m += 1) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'meeting-month';
    b.classList.toggle('is-on', m === state.m);
    b.classList.toggle('is-filled', !!meetingOf(state.y, m));
    // 「6月」の下に「7月会議」。数字の月と会議の月を取り違えないためです
    const h = meetingHeldMonth(state.y, m);
    b.innerHTML = `<span class="meeting-month__m">${m}月</span>`
      + `<span class="meeting-month__meet">${h.y === state.y ? '' : '翌'}${h.m}月会議</span>`;
    b.addEventListener('click', () => {
      flushMeetingNotes();
      state.m = m;
      writeHash();
      render();
    });
    el.meetingMonths.appendChild(b);
  }
}

/**
 * その月の数字を見る会議は、翌月に開きます（6月の数字 → 7月の会議）。
 * もとのスプレッドシートの「6月（7月会議用）」と同じ数え方です。
 */
function meetingHeldMonth(y, m) {
  return m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
}

/**
 * 会議の月の書き方。年をまたぐとき（12月の数字＝翌年1月の会議）だけ
 * 年も書きます。12月と1月を取り違えないためです。
 */
function meetingHeldText(y, m, base) {
  const h = meetingHeldMonth(y, m);
  return h.y === base ? `${h.m}月` : `${h.y}年${h.m}月`;
}

/** 先月の会議で決まったこと。見出しの行だけを並べます */
function renderMeetingLast() {
  const d = new Date(state.y, state.m - 2, 1);
  const y = d.getFullYear(), m = d.getMonth() + 1;
  const notes = meetingNotes(y, m);

  el.meetingLast.classList.toggle('is-hidden', !notes.length);
  if (!notes.length) return;

  // 5月の数字は6月の会議で話しているので、会議の月で書きます
  el.meetingLastTitle.textContent = `${meetingHeldText(y, m, state.y)}会議の議題`;
  el.meetingLastGoTo = { y, m };
  el.meetingLastList.innerHTML = '';
  notes.forEach((note, i) => {
    const li = document.createElement('li');
    li.className = 'meeting-last__item';
    li.innerHTML = '<span class="meeting-last__no"></span><span class="meeting-last__text"></span>';
    li.querySelector('.meeting-last__no').textContent = i + 1;
    li.querySelector('.meeting-last__text').textContent = (note.text || '').split('\n')[0];
    el.meetingLastList.appendChild(li);
  });
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
    `<th class="is-now">${state.y}年</th><th class="is-last">昨年</th><th class="is-vs">差</th>`).join('');

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
  el.meetingCumTitle.textContent = `${state.y}年累計売上（税抜）`;
  el.meetingCumYearHead.textContent = `${state.y}年`;

  const shown = STORES.filter((s) => cum[s.id] && cum[s.id].ex);
  el.meetingCumBody.innerHTML = '';
  shown.forEach((s) => {
    const c = cum[s.id];
    const tr = document.createElement('tr');
    tr.style.setProperty('--row-color', s.color);
    tr.innerHTML = '<th scope="row" class="meeting-td-name"></th>'
      + `<td class="mt-cell is-now">${meetingNum(c.ex, 'yen')}</td>`
      + `<td class="mt-cell is-last">${meetingNum(c.lastEx, 'yen')}</td>`
      + `<td class="mt-cell is-vs${c.lastEx ? (c.ex >= c.lastEx ? ' is-good' : ' is-bad') : ''}">`
      + `<span class="mt-main">${c.lastEx ? meetingNum(c.ex - c.lastEx, 'yen', '', true) : '—'}</span>`
      + `<span class="mt-sub">${c.lastEx ? meetingNum(c.ex / c.lastEx - 1, 'ratio', '', true) : ''}</span></td>`;
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
    + `<td class="mt-cell is-now">${meetingNum(now, 'yen')}</td>`
    + `<td class="mt-cell is-last">${last ? meetingNum(last, 'yen') : '—'}</td>`
    + `<td class="mt-cell is-vs${last ? (now >= last ? ' is-good' : ' is-bad') : ''}">`
    + `<span class="mt-main">${last ? meetingNum(now - last, 'yen', '', true) : '—'}</span>`
    + `<span class="mt-sub">${last ? meetingNum(now / last - 1, 'ratio', '', true) : ''}</span></td></tr>`;

  el.meetingCumFoot.innerHTML =
    (shown.length > five.length ? row(`年間${shown.length}店舗累計`, all6, 0) : '')
    + row(`年間${five.length}店舗累計`, now5, last5);

  el.meetingCumWrap.classList.toggle('is-hidden', !shown.length);
}

/* ------------------------------------------------------------
 *  日報からの取り込み
 *
 *  ブラウザからスプレッドシートは読めないので、GAS（バックエンド）に
 *  「このフォルダの、この年月のファイルの、このセルを読んで」と頼みます。
 *  返ってきた数字は _meeting/YYYY-MM に入れるので、ふだんの同期で
 *  みんなの端末にも届きます。光熱費とキャッチは日報にないので触りません。
 * ---------------------------------------------------------- */
let nippouBusy = false;
/** 取り込みの結果を、どの月のものとして出しているか */
let nippouShownKey = '';

function renderNippou() {
  const folders = NippouFolders.all();
  const n = STORES.filter((s) => folders[s.id]).length;
  el.nippouNote.textContent = n
    ? `${state.y}年${state.m}月と、${state.y - 1}年${state.m}月の日報を読みます（${n}店舗）`
    : 'マネージの「日報フォルダ」に登録すると使えます';
  el.nippouPull.disabled = !n || nippouBusy || !Sync.enabled();

  // 別の月に移ったら、前の月の結果は消します（どの月の話か分からなくなるため）
  if (nippouShownKey && nippouShownKey !== meetingMonthKey(state.y, state.m)) {
    el.nippouResult.classList.add('is-hidden');
    nippouShownKey = '';
  }
}

async function pullNippou() {
  if (nippouBusy) return;
  const folders = NippouFolders.all();
  const targets = STORES.filter((s) => folders[s.id]);
  if (!targets.length) return;

  /* ★頼んだときの年月を先に覚えます。
     読むのに数秒かかるので、その間に月を切り替えられると、
     覚えておかないと「いま開いている月」に入れてしまいます */
  const y = state.y;
  const m = state.m;
  const key = meetingMonthKey(y, m);

  nippouBusy = true;
  el.nippouPull.disabled = true;
  el.nippouPull.textContent = '読んでいます…';
  el.nippouResult.classList.add('is-hidden');

  const res = await Sync.ask('nippou', {
    y,
    m,
    stores: targets.map((s) => ({
      id: s.id, folder: NippouFolders.idOf(s.id), cells: nippouCells(s.id),
    })),
  });

  nippouBusy = false;
  el.nippouPull.textContent = '日報から取り込む';

  const lines = [{ head: true, text: `${y}年${m}月として取り込みました` }];
  if (!res.ok) {
    lines.push({ ok: false, text: res.error || '取り込めませんでした' });
  } else {
    targets.forEach((s) => {
      const got = (res.stores || {})[s.id] || {};
      const val = {};
      const parts = [];
      [['now', y], ['last', y - 1]].forEach(([side, year]) => {
        const g = got[side];
        if (!g || g.error) { parts.push(`${year}年 ${(g && g.error) || '読めません'}`); return; }
        const o = {};
        NIPPOU_FIELDS.forEach((f) => { if (typeof g[f] === 'number') o[f] = g[f]; });
        // 売上が0の日報は、まだ書きこまれていないものとして入れません
        if (!o.inc && !o.ex) { parts.push(`${g.name || year} まだ数字が入っていません`); return; }
        val[side] = o;
        // どのファイルを読んだかを出します（月がずれていないか、ここで分かります）
        parts.push(`${g.name || `${year}年`} ✓`);
      });
      if (val.now || val.last) Store.setItem(MEETING_STORE, key, `num:${s.id}`, { value: val });
      lines.push({ ok: !!val.now, name: s.name, text: parts.join('　') });
    });
    meetingSeq += 1;
  }

  // 表を先に描き直してから結果を出します
  // （月を切り替えていた場合、結果が消えてしまわないように）
  renderMeeting();

  nippouShownKey = key;
  el.nippouResult.innerHTML = '';
  lines.forEach((l) => {
    const li = document.createElement('li');
    li.className = 'nippou__row' + (l.head ? ' is-head' : '') + (l.ok === false ? ' is-ng' : '');
    if (l.name) {
      const b = document.createElement('b');
      b.textContent = l.name;
      li.appendChild(b);
    }
    li.appendChild(document.createTextNode(l.text));
    el.nippouResult.appendChild(li);
  });
  el.nippouResult.classList.remove('is-hidden');
}

/* ------------------------------------------------------------
 *  光熱費の手入力
 *
 *  日報にはガス・水道・電気が入っていないので、ここだけ手で入れます。
 *  取り込みとは別の項目（util:店舗id）に入れるので、日報から取り込んでも
 *  消えません。逆に、ここで保存しても取り込んだ数字は消しません。
 * ---------------------------------------------------------- */
let utilSide = 'now';

/** その月・その年の光熱費（画面に出ているもの）を取り出します */
function utilValues(side) {
  const rec = meetingOf(state.y, state.m);
  const out = {};
  STORES.forEach((s) => {
    const row = rec && rec.rows[s.id];
    const v = meetingRow(row && row[side]);
    out[s.id] = {};
    MEETING_UTIL_FIELDS.forEach((f) => { out[s.id][f] = Number(v[f]) || 0; });
  });
  return out;
}

function openUtilForm() {
  utilSide = 'now';
  [...el.utilYear.children].forEach((b) => b.classList.toggle('is-on', b.dataset.side === 'now'));
  fillUtilForm();
  el.utilModal.classList.remove('is-hidden');
}

function fillUtilForm() {
  const vals = utilValues(utilSide);
  el.utilRows.innerHTML = '';
  STORES.forEach((s) => {
    const tr = document.createElement('tr');
    const name = document.createElement('td');
    name.className = 'util-name';
    name.textContent = s.name;
    tr.appendChild(name);

    // ガス・水道・電気それぞれに「金額」と「使用量」の2つを並べます
    MEETING_UTIL_ROWS.forEach((u) => {
      [{ f: u.key, hint: '円' }, { f: u.use, hint: u.unit }].forEach((box) => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.inputMode = 'numeric';
        input.className = 'util-input' + (box.f === u.use ? ' util-input--use' : '');
        input.dataset.store = s.id;
        input.dataset.field = box.f;
        input.value = vals[s.id][box.f] || '';
        input.placeholder = box.hint;
        td.appendChild(input);
        tr.appendChild(td);
      });
    });
    el.utilRows.appendChild(tr);
  });
}

function saveUtilForm() {
  const key = meetingMonthKey(state.y, state.m);
  // 画面に出ていないほうの年も、いまの数字をそのまま書き写します
  // （片方だけ保存して、もう片方が消えてしまわないように）
  const other = utilSide === 'now' ? 'last' : 'now';
  const otherVals = utilValues(other);
  const typed = {};
  [...el.utilRows.querySelectorAll('.util-input')].forEach((i) => {
    const sid = i.dataset.store;
    if (!typed[sid]) typed[sid] = {};
    typed[sid][i.dataset.field] = Math.max(Math.round(Number(i.value) || 0), 0);
  });

  STORES.forEach((s) => {
    const val = {};
    val[utilSide] = typed[s.id] || {};
    val[other] = otherVals[s.id] || {};
    Store.setItem(MEETING_STORE, key, `util:${s.id}`, { value: val });
  });

  meetingSeq += 1;
  el.utilModal.classList.add('is-hidden');
  renderMeeting();
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
  // 目安の印を置く角度（12時から時計回り）
  const a = (pace * 2 * Math.PI) - Math.PI / 2;

  /* 目安との差。「いまの時期なら ここまで」に対して
     さきに進んでいるか、おくれているかを言葉で出します */
  const gap = (ratio - pace) * 100;
  const late = gap < 0;
  const gapText = Math.abs(gap) < 0.05
    ? '±0%'
    : `${late ? '−' : '+'}${Math.abs(gap).toFixed(1)}%`;

  card.innerHTML = `
    <svg class="goal-ring" viewBox="0 0 100 100" role="img" aria-label="${name} ${Math.round(ratio * 100)}%">
      <circle class="goal-ring__bg" cx="50" cy="50" r="${R}"></circle>
      <circle class="goal-ring__fill" cx="50" cy="50" r="${R}"
              stroke-dasharray="${(C * shown).toFixed(1)} ${C.toFixed(1)}"
              transform="rotate(-90 50 50)"></circle>
      <line class="goal-ring__pace"
            x1="${(50 + (R - 9) * Math.cos(a)).toFixed(1)}" y1="${(50 + (R - 9) * Math.sin(a)).toFixed(1)}"
            x2="${(50 + (R + 9) * Math.cos(a)).toFixed(1)}" y2="${(50 + (R + 9) * Math.sin(a)).toFixed(1)}"></line>
      <text class="goal-ring__pct" x="50" y="54">${(ratio * 100).toFixed(1)}%</text>
    </svg>
    <p class="goal-card__name"></p>
    <p class="goal-card__yen">${yenMarkup(now)}</p>
    <dl class="goal-card__rows">
      <div class="goal-row"><dt>目標</dt><dd>${yenMarkup(goal)}</dd></div>
      <div class="goal-row goal-row--left"><dt>残り</dt><dd>${now >= goal
        ? '<span class="goal-done">目標をこえました</span>'
        : yenMarkup(goal - now)}</dd></div>
    </dl>
    <p class="goal-card__pace">
      <span class="goal-gap ${late ? 'is-late' : 'is-ahead'}">${gapText}</span>
      <span class="goal-card__paceLabel">目安 ${Math.round(pace * 100)}%</span>
    </p>
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
 *
 *    上 … その月のカレンダー。1日分の升目に6店舗の印が並びます
 *    中 … えらんだ日の中身（今までどおりの一覧）
 *    下 … その月のミスの記録
 * ---------------------------------------------------------- */

function renderReport() {
  renderReportCalendar();
  renderReportDay();
  renderMissList('close');
}

/**
 * その月のカレンダー
 *
 * 6店舗 × 31日分の記録を1日ずつ読むと、そのたびに保存データを
 * まるごと読み直すことになって重くなります。店舗ごとに1回だけ
 * Store.getMonth で読み、そこから引きます。
 */
function renderReportCalendar() {
  const { y, m } = state;
  const ym = `${y}-${pad2(m)}`;
  const byStore = {};
  STORES.forEach((s) => { byStore[s.id] = Store.getMonth(s.id, ym) || {}; });
  const misses = missCountByDay(y, m);

  el.reportMonth.textContent = `${y}年${m}月`;

  /* ---- 曜日の見出し ---- */
  el.calHead.innerHTML = '';
  DOW.forEach((w, i) => {
    const c = document.createElement('span');
    c.className = 'cal__dow' + (i === 0 ? ' is-sun' : (i === 6 ? ' is-sat' : ''));
    c.textContent = w;
    el.calHead.appendChild(c);
  });

  /* ---- 日の升目 ---- */
  el.calGrid.innerHTML = '';
  const first = new Date(y, m - 1, 1).getDay();     // その月の1日の曜日
  const last = daysInMonth(y, m);
  for (let i = 0; i < first; i += 1) {
    const blank = document.createElement('span');
    blank.className = 'cal__cell is-empty';
    el.calGrid.appendChild(blank);
  }

  let doneAll = 0, targetAll = 0;
  for (let d = 1; d <= last; d += 1) {
    const dateStr = ymd(y, m, d);
    const dow = new Date(y, m - 1, d).getDay();
    const future = dateStr > ymd(TODAY.y, TODAY.m, TODAY.d);

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cal__cell'
      + (d === state.d ? ' is-picked' : '')
      + (dateStr === ymd(TODAY.y, TODAY.m, TODAY.d) ? ' is-today' : '')
      + (future ? ' is-future' : '')
      + (dow === 0 ? ' is-sun' : (dow === 6 ? ' is-sat' : ''));

    const num = document.createElement('span');
    num.className = 'cal__num';
    num.textContent = d;
    cell.appendChild(num);

    /* 店舗の印。
         提出した店舗 … その店舗のアイコン
         定休日       … アイコンをうすく
         未提出       … アイコンは出さず、最後に「未◯」と数で出します */
    const marks = document.createElement('span');
    marks.className = 'cal__marks';
    let done = 0, target = 0, yet = 0;
    STORES.forEach((s) => {
      const closed = Closed.isClosed(s.id, y, m, d);
      const submitted = !closed && !!(byStore[s.id][pad2(d)] || {}).submittedAt;
      if (!closed) {
        target += 1;
        if (submitted) done += 1; else yet += 1;
      }
      if (!closed && !submitted) return;          // 未提出はアイコンを出しません

      const chip = document.createElement('span');
      chip.className = 'logo-chip cal-logo' + (closed ? ' is-closed' : '');
      chip.title = `${s.name}${closed ? '（定休日）' : '（提出済み）'}`;
      fillLogo(chip, s);
      marks.appendChild(chip);
    });
    // まだ出ていない店舗の数。過ぎた日だけ赤くして、目に留まるようにします
    if (yet) {
      const left = document.createElement('span');
      left.className = 'cal-yet' + (future ? '' : ' is-late');
      left.textContent = `未${yet}`;
      left.title = `未提出 ${yet}店舗`;
      marks.appendChild(left);
    }
    cell.appendChild(marks);

    // その日のミスの数
    if (misses[dateStr]) {
      const badge = document.createElement('span');
      badge.className = 'cal-miss';
      badge.textContent = misses[dateStr] > 1 ? misses[dateStr] : '!';
      badge.title = `ミスの記録 ${misses[dateStr]}件`;
      cell.appendChild(badge);
    }
    if (!future && target && done === target) cell.classList.add('is-all');
    if (!future) { doneAll += done; targetAll += target; }

    cell.addEventListener('click', () => {
      state.d = d;
      writeHash();
      render();
    });
    el.calGrid.appendChild(cell);
  }

  el.reportMonthSummary.textContent = targetAll
    ? `今日までの提出 ${doneAll} / ${targetAll}（定休日を除く）`
    : '';
  el.reportMonthSummary.classList.toggle('is-all-done', targetAll > 0 && doneAll === targetAll);
}

/** えらんだ日の中身（店舗ごとの提出状況） */
function renderReportDay() {
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

    // 店舗の行を押すと、その店舗のクローズの画面へ
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'report-item__go';
    go.append(chip, name, status);
    go.addEventListener('click', () => {
      state.storeId = s.id;
      state.view = 'day';
      writeHash();
      render();
    });

    // 「じつはできていなかった」をその場で残せるようにします
    const miss = document.createElement('button');
    miss.type = 'button';
    miss.className = 'report-item__miss';
    miss.textContent = 'ミス';
    miss.title = `${s.name}のミスを記録する`;
    miss.addEventListener('click', () => openMissForm('close', null, { d: dateStr, store: s.id }));

    li.append(go, miss);
    el.reportList.appendChild(li);
  });

  const target = STORES.length - closedCount;
  el.reportSummary.textContent =
    `提出済み ${submitted} / ${target} 店舗` +
    (closedCount ? `（定休日 ${closedCount} 店舗を除く）` : '');
  el.reportSummary.classList.toggle('is-all-done', target > 0 && submitted === target);
}

/* ------------------------------------------------------------
 *  ミスの記録（クローズと週間掃除の両方で使います）
 *
 *  記録は kind で分けています。
 *    close … クローズの提出記録のページ
 *    week  … 週間掃除の達成状況のページ
 *  古い記録には kind がないので、その場合は close として扱います。
 * ---------------------------------------------------------- */

/** 画面ごとの部品。同じ作りを2か所で使い回します */
const MISS_UI = {
  close: {
    count: 'missCount', filter: 'missFilter', tally: 'missTally', list: 'missList',
    empty: 'この月のミスの記録はありません。',
  },
  week: {
    count: 'wmissCount', filter: 'wmissFilter', tally: 'wmissTally', list: 'wmissList',
    empty: 'この期のミスの記録はありません。',
  },
};

/** 画面ごとの「この月／この期」と「すべて」、店舗のしぼり */
const missView = {
  close: { range: 'near', filter: '' },
  week: { range: 'near', filter: '' },
};

/**
 * 入っているミスを全部（新しい順）
 *
 * 保存データを1回だけ読み、_miss/ で始まる入れ物をすべて集めます。
 */
function missAll(kind) {
  const dump = Store.adapter.dump();
  const out = [];
  Object.keys(dump).forEach((key) => {
    if (!key.startsWith(MISS_STORE + '/')) return;
    const ym = key.slice(MISS_STORE.length + 1);
    const items = (dump[key] || {}).items || {};
    Object.keys(items).forEach((id) => {
      const v = items[id];
      if (!v || !v.done || !(v.text || '').trim()) return;
      if ((v.kind || 'close') !== kind) return;
      out.push({ id, ym, ...v });
    });
  });
  return out.sort((a, b) => (b.d || '').localeCompare(a.d || '') || (b.at || '').localeCompare(a.at || ''));
}

/** いま見ている範囲（クローズ＝その月／週間掃除＝その期）に入っているか */
function missInRange(kind, e) {
  if (kind === 'week') {
    const [y, m, d] = (e.d || '').split('-').map(Number);
    if (!y) return false;
    return periodOfDate(y, m, d) === currentPeriod();
  }
  return (e.d || '').startsWith(missMonthKey(state.y, state.m));
}

/** その月のミスを「日付 → 件数」に（提出記録のカレンダーの印） */
function missCountByDay(y, m) {
  const out = {};
  missAll('close')
    .filter((e) => (e.d || '').startsWith(missMonthKey(y, m)))
    .forEach((e) => { out[e.d] = (out[e.d] || 0) + 1; });
  return out;
}

/** ミスを「期のはじまり → 件数」に（週間掃除の一覧の印） */
function missCountByPeriod() {
  const out = {};
  missAll('week').forEach((e) => {
    const [y, m, d] = (e.d || '').split('-').map(Number);
    if (!y) return;
    const p = periodOfDate(y, m, d);
    out[p] = (out[p] || 0) + 1;
  });
  return out;
}

/** ミスの一覧（この月・この期／すべて、店舗でしぼれます） */
function renderMissList(kind) {
  const ui = MISS_UI[kind];
  const view = missView[kind];
  const everything = missAll(kind);
  const all = view.range === 'all' ? everything : everything.filter((e) => missInRange(kind, e));
  const list = view.filter ? all.filter((e) => e.store === view.filter) : all;

  const $count = $(ui.count), $filter = $(ui.filter), $tally = $(ui.tally), $list = $(ui.list);
  $count.textContent = list.length ? `（${list.length}件）` : '';

  /* ---- 店舗でしぼるボタン。件数も出します ---- */
  const countOf = (id) => all.filter((e) => e.store === id).length;
  $filter.innerHTML = '';
  const chip = (id, label, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'exp-chip' + (view.filter === id ? ' is-on' : '');
    b.dataset.store = id;
    if (id) b.style.setProperty('--pick-color', getStore(id).color);
    b.textContent = n ? `${label} ${n}` : label;
    b.addEventListener('click', () => { view.filter = id; renderMissList(kind); });
    $filter.appendChild(b);
  };
  chip('', `全店舗 ${all.length}`, 0);
  STORES.forEach((s) => chip(s.id, s.name, countOf(s.id)));

  /* ---- 店舗ごとの件数（多い順）---- */
  const tally = STORES.map((s) => ({ s, n: countOf(s.id) })).filter((r) => r.n)
    .sort((a, b) => b.n - a.n);
  $tally.textContent = tally.length > 1
    ? '多い順　' + tally.map((r) => `${r.s.name} ${r.n}件`).join('　／　') : '';
  $tally.classList.toggle('is-hidden', tally.length < 2);

  /* ---- 一覧 ---- */
  $list.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'miss-empty';
    li.textContent = view.range === 'all' ? 'ミスの記録はまだありません。' : ui.empty;
    $list.appendChild(li);
    return;
  }

  list.forEach((e) => {
    const store = getStore(e.store);
    const li = document.createElement('li');
    li.className = 'miss-item';
    if (store) li.style.setProperty('--row-color', store.color);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'miss-item__btn';
    const [yy, mm, dd] = (e.d || '').split('-');
    // すべてを見ているときは、何年かも分かるようにします
    const date = mm ? ((view.range === 'all' ? `${yy}/` : '') + `${+mm}/${+dd}`) : '—';
    btn.innerHTML =
      `<span class="miss-item__date">${date}</span>` +
      '<span class="miss-item__store"></span>' +
      '<span class="miss-item__who"></span>' +
      '<span class="miss-item__text"></span>' +
      `<span class="miss-item__by">${e.by ? '記録 ' + e.by : ''}</span>`;
    btn.querySelector('.miss-item__store').textContent = store ? store.name : '（店舗なし）';
    btn.querySelector('.miss-item__who').textContent = e.who || '—';
    btn.querySelector('.miss-item__text').textContent = e.text || '';
    btn.addEventListener('click', () => openMissForm(kind, e));

    li.appendChild(btn);
    $list.appendChild(li);
  });
}

/* -------- ミスを記録する画面（1つを使い回します） -------- */
let missEditing = null;
let missStore = '';
let missKind = 'close';

function openMissForm(kind, entry, preset = {}) {
  missKind = kind;
  missEditing = entry || null;
  missStore = entry ? (entry.store || '') : (preset.store || '');
  el.missDate.value = entry ? entry.d : (preset.d || ymd(state.y, state.m, state.d));
  el.missText.value = entry ? (entry.text || '') : '';
  el.missError.textContent = '';
  el.missFormTitle.textContent = (entry ? 'ミスの記録を直す' : 'ミスを記録する')
    + (kind === 'week' ? '（週間掃除）' : '');
  el.missSave.textContent = entry ? '直す' : '記録する';
  el.missDeleteRow.classList.toggle('is-hidden', !entry);

  /* 記録した人 */
  const names = Staff.list();
  if (entry && entry.by && !names.includes(entry.by)) names.push(entry.by);
  el.missBy.innerHTML = '<option value="">選んでください</option>';
  names.forEach((n) => {
    const o = document.createElement('option');
    o.value = n; o.textContent = n;
    el.missBy.appendChild(o);
  });
  el.missBy.value = entry ? (entry.by || '') : '';

  /* ミスした人。リストに無い人（アルバイトなど）は「その他」で名前を書きます */
  const who = entry ? (entry.who || '') : '';
  const list = Staff.list();
  el.missWho.innerHTML = '<option value="">選んでください</option>';
  list.forEach((n) => {
    const o = document.createElement('option');
    o.value = n; o.textContent = n;
    el.missWho.appendChild(o);
  });
  const other = document.createElement('option');
  other.value = MISS_OTHER;
  other.textContent = 'その他（名前を書く）';
  el.missWho.appendChild(other);

  const known = who && list.includes(who);
  el.missWho.value = known ? who : (who ? MISS_OTHER : '');
  el.missWhoFree.value = known ? '' : who;
  renderMissWhoField();

  /* 店舗のボタン */
  el.missStores.innerHTML = '';
  STORES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'exp-chip';
    b.dataset.store = s.id;
    b.style.setProperty('--pick-color', s.color);
    b.textContent = s.name;
    b.addEventListener('click', () => { missStore = s.id; renderMissChips(); });
    el.missStores.appendChild(b);
  });
  renderMissChips();

  el.missModal.classList.remove('is-hidden');
}

function renderMissChips() {
  [...el.missStores.children].forEach((b) => b.classList.toggle('is-on', b.dataset.store === missStore));
}

/** 「その他」をえらんだときだけ、名前を書く欄を出します */
function renderMissWhoField() {
  el.missWhoFree.classList.toggle('is-hidden', el.missWho.value !== MISS_OTHER);
}

function saveMiss() {
  const d = el.missDate.value;
  const by = el.missBy.value;
  const who = el.missWho.value === MISS_OTHER
    ? el.missWhoFree.value.trim()
    : el.missWho.value;
  const text = el.missText.value.replace(/\r/g, '').trim();

  if (!d) { el.missError.textContent = '日付を入れてください。'; return; }
  if (!missStore) { el.missError.textContent = 'どの店舗かをえらんでください。'; return; }
  if (el.missWho.value === MISS_OTHER && !who) {
    el.missError.textContent = 'ミスした人の名前を書いてください。'; return;
  }
  if (!text) { el.missError.textContent = '内容を入れてください。'; return; }

  // 入れ先は「その日の月」。月をまたいで入れても、正しい月に入ります
  const [yy, mm, dd] = d.split('-').map(Number);
  const key = missMonthKey(yy, mm);
  const id = missEditing ? missEditing.id
    : 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // 直すときに日付を別の月へ動かした場合は、元の月から取り除いてから移します
  // （どの月に入っている記録かは、一覧を作るときに ym として持たせてあります）
  if (missEditing) {
    const from = missEditing.ym || key;
    if (from !== key) Store.setItem(MISS_STORE, from, id, { done: false, text: '' });
  }

  Store.setItem(MISS_STORE, key, id, {
    done: true, d, store: missStore, text, who, by, kind: missKind,
  });

  // その記録が見える場所へ移します
  state.y = yy; state.m = mm;
  state.d = Math.min(dd, daysInMonth(yy, mm));
  el.missModal.classList.add('is-hidden');
  writeHash();
  render();
  renderSyncStatus();
}

async function removeMiss() {
  if (!missEditing) return;
  const store = getStore(missEditing.store);
  const ok = await askConfirm({
    item: `${(missEditing.d || '').replace(/^\d{4}-/, '')}　${store ? store.name : ''}`,
    message: 'このミスの記録を消します。よろしいですか？',
    okLabel: '消す',
    danger: true,
  });
  if (!ok) return;

  // 中身を空にすると一覧から外れます（消したことも同期で全端末に伝わります）
  Store.setItem(MISS_STORE, missEditing.ym || missMonthKey(state.y, state.m), missEditing.id,
    { done: false, text: '' });
  el.missModal.classList.add('is-hidden');
  render();
  renderSyncStatus();
}

/** 「この月／この期」と「すべて」の切り替えを取り付けます */
function bindMissRange(kind, id) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('.seg__btn');
    if (!b) return;
    missView[kind].range = b.dataset.range;
    [...$(id).children].forEach((n) => n.classList.toggle('is-on', n === b));
    renderMissList(kind);
  });
}

/** 表示中の日付を前後にずらす（月・年をまたいでもOK） */
/** 週間掃除の一覧を1年ずらします（その年の1つ目の期に移ります） */
function shiftWeekAllYear(diff) {
  const year = state.y + diff;
  let p = periodOfDate(year, 1, 1);
  if (p.slice(0, 4) < String(year)) p = addDaysStr(p, 14);
  goToWeek(p);
  writeHash();
  render();
}

/** 提出記録のカレンダーを1か月ずらします（日は その月に収まる日に寄せます） */
function shiftReportMonth(diff) {
  const dt = new Date(state.y, state.m - 1 + diff, 1);
  state.y = dt.getFullYear();
  state.m = dt.getMonth() + 1;
  state.d = Math.min(state.d, daysInMonth(state.y, state.m));
  writeHash();
  render();
}

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
    if (w === nowWeek) {
      th.classList.add('is-now');
      // 左右どちらが今週かが ひと目で分かるように札を出します
      th.insertAdjacentHTML('beforeend', '<span class="week-th__now">今週</span>');
    }
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

/**
 * 同期が止まっていたら、その場で知らせる
 *
 * ★クローズは、同じ日を何人かで見ます。同期が止まっている端末は
 *   「誰かが提出したのに、こちらは未提出のまま」になります。
 *   ヘッダーの小さなしるしだけでは気づけないので、ここにも出します。
 */
function renderSyncWarn() {
  if (!el.syncWarn) return;
  if (!Sync.enabled() || !Sync.pin()) {
    el.syncWarn.classList.add('is-hidden');
    return;
  }

  // ★まず「まだ送れていない分」を見ます。
  //   チェックや提出はいったんこの端末に入り、あとからまとめて送られます。
  //   ここが残ったままアプリを閉じると、みんなの画面には出ません。
  //   実際に、64項目ぜんぶチェックしてあるのに提出だけ届いていない日がありました
  const waiting = Sync.outbox().length;
  const stale = Sync.lastSyncAt && (Date.now() - Sync.lastSyncAt.getTime() > 5 * 60 * 1000);
  const never = !Sync.lastSyncAt;

  if (waiting) {
    el.syncWarn.classList.remove('is-hidden');
    el.syncWarn.className = 'sync-warn is-waiting';
    el.syncWarn.textContent = `まだ送れていない入力が ${waiting}件 あります。`
      + '電波の届くところでアプリを開いたままにしてください。'
      + '送れるまで、ほかの人の画面には出ません。';
    return;
  }

  const bad = !!Sync.lastError || stale || never;
  el.syncWarn.className = 'sync-warn' + (bad ? '' : ' is-hidden');
  if (!bad) return;
  el.syncWarn.textContent = (Sync.lastError || 'しばらく同期できていません')
    + '　ほかの人が提出しても、この画面には出ていないかもしれません。'
    + 'ヘッダーのしるしを押すと、いま同期します。';
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
  renderWeekAllYear();
  renderWeekAllPeriod();
  renderMissList('week');
}

/**
 * その年の「期」を全部ならべる
 *
 * 週間掃除は2週間で1つの区切りなので、日のカレンダーではなく期をならべます。
 * 中の見かたは提出記録のカレンダーと同じで、
 *   出した店舗 … その店舗のアイコン
 *   項目が無い … アイコンをうすく
 *   まだの店舗 … アイコンは出さず「未◯」と数で
 * です。
 */
function renderWeekAllYear() {
  const year = state.y;
  el.weekAllYear.textContent = `${year}年`;
  const misses = missCountByPeriod();
  const now = currentPeriod();
  const today = ymd(TODAY.y, TODAY.m, TODAY.d);

  /* その年に始まる期を集めます */
  let p = periodOfDate(year, 1, 1);
  if (p.slice(0, 4) < String(year)) p = addDaysStr(p, 14);
  const list = [];
  while (p.slice(0, 4) === String(year)) { list.push(p); p = addDaysStr(p, 14); }

  el.weekAllGrid.innerHTML = '';
  let doneAll = 0, targetAll = 0;
  list.forEach((start) => {
    const future = start > today;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'period-cell'
      + (start === now ? ' is-picked' : '')
      + (future ? ' is-future' : '');

    const label = document.createElement('span');
    label.className = 'period-cell__label';
    label.textContent = periodRangeLabel(start).replace(/（.）/g, '');
    cell.appendChild(label);

    const marks = document.createElement('span');
    marks.className = 'cal__marks';
    let done = 0, target = 0, yet = 0;
    STORES.forEach((s) => {
      const st = periodStatus(s.id, start);
      const none = st.total === 0;                 // この期は対象の項目が無い
      if (!none) {
        target += 1;
        if (st.submittedAt) done += 1; else yet += 1;
      }
      if (!none && !st.submittedAt) return;

      const chip = document.createElement('span');
      chip.className = 'logo-chip cal-logo' + (none ? ' is-closed' : '');
      chip.title = `${s.name}${none ? '（項目なし）' : '（提出済み）'}`;
      fillLogo(chip, s);
      marks.appendChild(chip);
    });
    if (yet) {
      const left = document.createElement('span');
      left.className = 'cal-yet' + (future ? '' : ' is-late');
      left.textContent = `未${yet}`;
      left.title = `未提出 ${yet}店舗`;
      marks.appendChild(left);
    }
    cell.appendChild(marks);

    if (misses[start]) {
      const badge = document.createElement('span');
      badge.className = 'cal-miss';
      badge.textContent = misses[start] > 1 ? misses[start] : '!';
      badge.title = `ミスの記録 ${misses[start]}件`;
      cell.appendChild(badge);
    }
    if (!future && target && done === target) cell.classList.add('is-all');
    if (!future) { doneAll += done; targetAll += target; }

    cell.addEventListener('click', () => {
      goToWeek(start);
      writeHash();
      render();
    });
    el.weekAllGrid.appendChild(cell);
  });

  el.weekAllYearSummary.textContent = targetAll ? `今までの提出 ${doneAll} / ${targetAll}` : '';
  el.weekAllYearSummary.classList.toggle('is-all-done', targetAll > 0 && doneAll === targetAll);
}

/** えらんだ期の中身（店舗ごとの達成率） */
function renderWeekAllPeriod() {
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
/* ============================================================
 *  シフト（管理者だけの画面）
 *
 *  アルバイトは別に配る提出ページ（…/shift/）から希望を出します。
 *  ここはその希望を集めて、こちらで組む場所です。
 *
 *  組み方
 *    1.「希望を取り込む」で、出してもらった人を枠に並べます
 *    2. 多い日は名前をタップして外す／時刻を直す
 *    3.「表で見る」で印刷、「文字でコピー」でLINEに貼る
 *
 *  ★取り込みは何度押しても、外した人を戻しません。
 *    一度取り込んだ組み合わせを taken に控えているためです。
 * ============================================================ */

/** いま開いている半月（1 = 1〜15日／2 = 16日〜末日）。年と月は state を使います */
let shiftHalf = 1;

/** 名前をタップしたときに、どこを直そうとしているか */
let shiftPickAt = null;   // { dateStr, slotId, index }（index が null なら「足す」）

function shiftRecKey() {
  return shiftKey(state.storeId, state.y, state.m, shiftHalf);
}

function shiftRec() {
  return Store.getDay(SHIFT_STORE, shiftRecKey());
}

/** その日の組んだ結果（無ければ空） */
/**
 * その日の組んだ結果
 *
 * ★出すときに必ず入り時間の早い順にそろえます。
 *   入れた順のまま出すと、あとから足した早い人が下に来て、
 *   表を上から読めなくなるためです。
 */
function shiftDayOf(rec, dateStr) {
  const v = (rec.items || {})[shiftDayKey(dateStr)] || {};
  // 時刻の入っていない人は、その枠のふだんの時刻として読みます
  // （時刻なしで入れていたころの分が残っていても、表が空白になりません）
  const arr = (id, x) => shiftSort((Array.isArray(x) ? x : []).map((e) => (
    e && (e.t === '' || e.t === undefined || e.t === null)
      ? { ...e, t: shiftDefaultTime(id) }
      : e
  )));
  return {
    open: arr('open', v.open),
    lunch: arr('lunch', v.lunch),
    dinner: arr('dinner', v.dinner),
    memo: v.memo || '',
    // その日のパティの枠（'lunch' か 'dinner'。無ければ空）
    patty: SHIFT_PATTY_SLOTS.includes(v.patty) ? v.patty : '',
  };
}

/**
 * その日のメモ
 *
 * 書いたものがあればそれ。無ければ、はじめから入れておく文
 * （29日と2月9日の「肉の日」）を出します。
 */
function shiftMemoOf(rec, dateStr) {
  return shiftDayOf(rec, dateStr).memo || shiftDefaultMemo(dateStr);
}

function saveShiftDay(dateStr, day) {
  Store.setItem(SHIFT_STORE, shiftRecKey(), shiftDayKey(dateStr), {
    open: day.open, lunch: day.lunch, dinner: day.dinner,
    memo: day.memo, patty: day.patty || '',
  });
}

/** その日のパティの枠を決める（同じ枠をもう一度押すと外れます） */
function toggleShiftPatty(dateStr, slotId) {
  const now = shiftDayOf(shiftRec(), dateStr);
  now.patty = now.patty === slotId ? '' : slotId;
  saveShiftDay(dateStr, now);
  render();
}

/** 出してもらった希望をぜんぶ。名簿の順に並べます */
function shiftWishes(rec) {
  const order = ShiftStaff.list(state.storeId);
  const out = [];
  Object.keys(rec.items || {}).forEach((k) => {
    if (k.indexOf('w:') !== 0) return;
    const v = rec.items[k] || {};
    out.push({
      name: k.slice(2),
      days: v.days && typeof v.days === 'object' ? v.days : {},
      // 連絡は日ごとに書いてもらいます。note は日ごとにする前の書き方で、
      // そのころに出してもらった分がまだ残っているので読めるようにしています
      notes: v.notes && typeof v.notes === 'object' ? v.notes : {},
      note: v.note || '',
      sentAt: v.sentAt || null,
    });
  });
  return out.sort((a, b) => {
    const ia = order.indexOf(a.name), ib = order.indexOf(b.name);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
}

/**
 * その日、組んだ表の「その枠」に入る希望
 *
 * ★F（通し）はランチの枠に入ります。ディナーには出しません
 *   （今のスプレッドシートで、ランチのセルだけ塗りつぶしているのと同じ）。
 *
 * ★wishes は shiftWishes() の結果です。画面を描くときは15日×3枠＝45回
 *   呼ばれるので、そのつど作り直さずに1回作ったものを渡します
 *   （名簿の読み込みが毎回入ると、古い端末で目に見えて重くなります）。
 */
function shiftWishInto(wishes, dateStr, slotId) {
  const out = [];
  wishes.forEach((w) => {
    (w.days[dateStr] || []).forEach((e) => {
      if (!e || shiftSlotFor(e.s) !== slotId) return;
      out.push({ name: w.name, t: e.t || '', s: e.s, full: e.s === SHIFT_FULL_ID });
    });
  });
  return out;
}

/** 一度取り込んだ組み合わせ（'日付|枠|名前'） */
function shiftTakenSet(rec) {
  const v = (rec.items || {})[SHIFT_TAKEN_KEY];
  return new Set(v && Array.isArray(v.list) ? v.list : []);
}

/** 枠の中の並び順。早い時刻から、同じ時刻なら名簿の順 */
function shiftSort(list) {
  const order = ShiftStaff.list(state.storeId);
  return list.slice().sort((a, b) => {
    // 時刻が入っていない人（F など）は、その枠のいちばん下に置きます
    const ta = a.t === '' || a.t === undefined ? 99 : Number(a.t);
    const tb = b.t === '' || b.t === undefined ? 99 : Number(b.t);
    if (ta !== tb) return ta - tb;
    const ia = order.indexOf(a.n), ib = order.indexOf(b.n);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
}

/**
 * その日、その人が実際にどこに入っているか
 *
 * 提出の一覧を、組んだシフトと突き合わせるために使います。
 * 入れたり外したりすれば、こちらの見ためもすぐ変わります。
 */
function shiftPlacedOn(rec, dateStr, name) {
  const day = shiftDayOf(rec, dateStr);
  const out = [];
  SHIFT_SLOTS.forEach((slot) => {
    day[slot.id].forEach((e) => {
      if (e.n === name) out.push({ slot: slot.id, t: e.t, f: !!e.f });
    });
  });
  return out;
}

/** その日が定休日か（半月の画面は月をまたがないので、日付から直に見ます） */
function shiftClosedOn(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Closed.isClosed(state.storeId, y, m, d);
}

/* -------- 半月を動かす -------- */

function shiftGo(y, m, half) {
  state.y = y;
  state.m = m;
  shiftHalf = half;
  state.d = Math.min(half === 1 ? 1 : 16, daysInMonth(y, m));
  writeHash(true);
  render();
}

function shiftGoStep(step) {
  const n = shiftStep(state.y, state.m, shiftHalf, step);
  shiftGo(n.y, n.m, n.half);
}

function shiftGoToday() {
  const t = businessDate();
  shiftGo(t.getFullYear(), t.getMonth() + 1, shiftHalfOf(t.getDate()));
}

/**
 * 画面を開いたときに出す半月
 *
 * ★「今日が入っている半月」ではありません。
 *   出してもらうのは先の半月なので、今日の半月を開くと
 *   「取り込んでも何も入らない」ことになります（実際そうなりました）。
 *   募集中のものがあればそれを、無ければ次に募集する半月を出します。
 */
function shiftFirstPeriod(storeId) {
  const t = businessDate();
  const now = { y: t.getFullYear(), m: t.getMonth() + 1, half: shiftHalfOf(t.getDate()) };
  // 今の半月から先へ4つ見て、募集中のものがあればそこを出す
  for (let i = 0; i <= 4; i += 1) {
    const p = shiftStep(now.y, now.m, now.half, i);
    const rec = Store.getDay(SHIFT_STORE, shiftKey(storeId, p.y, p.m, p.half));
    if (shiftPhaseOf(rec) === SHIFT_OPEN) return p;
  }
  // 募集中が無ければ、まだ確定していなくて「もう誰かが出している」半月
  for (let i = 0; i <= 4; i += 1) {
    const p = shiftStep(now.y, now.m, now.half, i);
    const rec = Store.getDay(SHIFT_STORE, shiftKey(storeId, p.y, p.m, p.half));
    if (shiftPhaseOf(rec) === SHIFT_BUILT) continue;
    if (shiftWishes(rec).length) return p;
  }
  // どれも無ければ「次の半月」。★今の半月は出しません。
  //   募集をかけるのは先の半月なので、いま動いている半月を開いても
  //   「取り込んでも何も入らない」ことになるためです
  return shiftStep(now.y, now.m, now.half, 1);
}

/* -------- 取り込み -------- */

/**
 * 出してもらった希望を、まだ入れていない分だけ枠に並べます
 *
 * ★すでに外した人は戻しません。一度取り込んだ組み合わせを
 *   taken に控えていて、そこに載っているものは飛ばすためです。
 */
function shiftTake() {
  const rec = shiftRec();
  const wishes = shiftWishes(rec);
  const taken = shiftTakenSet(rec);
  let added = 0;

  shiftDays(state.y, state.m, shiftHalf).forEach((dateStr) => {
    if (shiftClosedOn(dateStr)) return;
    const day = shiftDayOf(rec, dateStr);
    let touched = false;

    SHIFT_SLOTS.forEach((slot) => {
      shiftWishInto(wishes, dateStr, slot.id).forEach((w) => {
        // 印は「出してもらったときの枠」で付けます。ランチとFは別ものとして数えます
        const mark = `${dateStr}|${w.s}|${w.name}`;
        if (taken.has(mark)) return;
        taken.add(mark);
        if (day[slot.id].some((e) => e.n === w.name)) return;
        // 取り込んだ人は、ひとまず左の持ち場（キッチン）に入れます。
        // どちらに入るかは人と日で変わるので、機械では決められません
        const entry = { n: w.name, t: w.t || shiftDefaultTime(w.s), p: SHIFT_LANES[0].id };
        if (w.full) entry.f = true;
        day[slot.id].push(entry);
        added += 1;
        touched = true;
      });
    });

    if (touched) {
      SHIFT_SLOTS.forEach((slot) => { day[slot.id] = shiftSort(day[slot.id]); });
      saveShiftDay(dateStr, day);
    }
  });

  Store.setItem(SHIFT_STORE, shiftRecKey(), SHIFT_TAKEN_KEY, { list: [...taken] });
  return added;
}

async function onShiftTake() {
  const rec = shiftRec();
  const wishes = shiftWishes(rec);
  if (!wishes.length) {
    el.shiftWishNote.textContent = 'まだ誰も希望を出していません';
    return;
  }
  const added = shiftTake();
  render();
  el.shiftWishNote.textContent = added
    ? `${added}人分を入れました`
    : '新しく入れるものはありませんでした';
}

/* -------- 募集をはじめる・確定する -------- */

/**
 * 募集をはじめる
 *
 * ★同じ店舗で募集中の半月は1つだけにします。
 *   2つ開いていると、アルバイトの提出ページにどちらを出すか決められません。
 */
async function openShiftRecruit() {
  const label = shiftRangeLabel(state.y, state.m, shiftHalf);
  const other = shiftOtherOpen();
  const ok = await askConfirm({
    item: `${label} の募集をはじめます`,
    message: other
      ? `いま募集中の ${other.label} は締め切られます。\nみんなの提出ページには ${label} が出ます。`
      : 'みんなの提出ページに、この期間が出るようになります。',
    okLabel: 'はじめる',
  });
  if (!ok) return;

  if (other) shiftSetPhase(other.y, other.m, other.half, SHIFT_BUILT);
  shiftSetPhase(state.y, state.m, shiftHalf, SHIFT_OPEN);
  render();
}

/** 確定する（提出を締め切る） */
async function buildShiftDone() {
  const label = shiftRangeLabel(state.y, state.m, shiftHalf);
  const rec = shiftRec();
  const n = shiftDays(state.y, state.m, shiftHalf)
    .filter((s) => !shiftClosedOn(s))
    .reduce((sum, s) => {
      const day = shiftDayOf(rec, s);
      return sum + SHIFT_SLOTS.reduce((k, slot) => k + day[slot.id].length, 0);
    }, 0);

  const ok = await askConfirm({
    item: `${label} のシフトを確定します`,
    message: `${n}人分が入っています。\n`
      + '確定すると、みんなが自分のスマホでシフト表を見られるようになります。\n'
      + '希望の受け付けは終わります（組んだ内容はあとから直せます）。',
    okLabel: '確定する',
    danger: true,
  });
  if (!ok) return;
  shiftSetPhase(state.y, state.m, shiftHalf, SHIFT_BUILT);
  render();
}

function shiftSetPhase(y, m, half, v) {
  Store.setItem(SHIFT_STORE, shiftKey(state.storeId, y, m, half), SHIFT_PHASE_KEY, {
    v, at: new Date().toISOString(),
  });
}

/** いま募集中の、ほかの半月（前後4つぶんを見ます） */
function shiftOtherOpen() {
  const here = shiftKey(state.storeId, state.y, state.m, shiftHalf);
  for (let i = -4; i <= 4; i += 1) {
    const p = shiftStep(state.y, state.m, shiftHalf, i);
    const key = shiftKey(state.storeId, p.y, p.m, p.half);
    if (key === here) continue;
    if (shiftPhaseOf(Store.getDay(SHIFT_STORE, key)) === SHIFT_OPEN) {
      return { ...p, label: shiftRangeLabel(p.y, p.m, p.half) };
    }
  }
  return null;
}

/* -------- 描画 -------- */

function renderShift() {
  el.shiftNavMain.textContent = `${shiftRangeLabel(state.y, state.m, shiftHalf)}`;
  el.shiftNavSub.textContent = `${state.y}年${state.m}月 ${shiftHalf === 1 ? '前半' : '後半'}`;

  const rec = shiftRec();
  const names = ShiftStaff.list(state.storeId);
  const wishes = shiftWishes(rec);
  const sent = wishes.filter((w) => w.sentAt).length;
  const phase = shiftPhaseOf(rec);

  /* -------- 募集の状態 -------- */
  el.shiftPhase.textContent = shiftPhaseText(phase);
  el.shiftPhase.className = 'shift-phase shift-phase--' + (phase || 'yet');
  el.shiftOpenBtn.classList.toggle('is-hidden', phase === SHIFT_OPEN);
  el.shiftOpenBtn.textContent = phase === SHIFT_BUILT ? '募集をやり直す' : 'シフト募集をはじめる';
  // 確定は、募集をはじめてからでないと押せません
  el.shiftBuildBtn.disabled = phase !== SHIFT_OPEN;
  el.shiftBuildBtn.textContent = phase === SHIFT_BUILT
    ? 'このシフトは確定ずみです'
    : 'シフトを確定する';

  el.shiftWishCount.textContent = names.length ? `提出 ${sent} / ${names.length}人` : '名簿が未登録';
  if (!names.length) {
    el.shiftWishNote.textContent = 'マネージの「シフトに入る人」で登録してください';
  } else if (!phase) {
    el.shiftWishNote.textContent = '募集をはじめると、みんなの提出ページに出ます';
  } else if (!sent) {
    el.shiftWishNote.textContent = 'まだ誰も出していません';
  } else {
    const yet = names.filter((n) => !wishes.some((w) => w.name === n && w.sentAt));
    el.shiftWishNote.textContent = yet.length ? `まだの人：${yet.join('・')}` : '全員そろいました';
  }

  el.shiftDays.innerHTML = '';
  const days = shiftDays(state.y, state.m, shiftHalf);
  for (let i = 0; i < days.length; i += SHIFT_COLS) {
    el.shiftDays.appendChild(shiftGridBlock(rec, wishes, days.slice(i, i + SHIFT_COLS)));
  }
}

/**
 * 日を横に並べた表（今のスプレッドシートと同じ作り）
 *
 *  ・横に SHIFT_COLS 日ぶん
 *  ・1日は持ち場（キッチン／ホール）で2列に分かれます
 *  ・縦は 立ち上げ／ランチ／ディナー、いちばん下が連絡
 *
 *  縦に1日ずつ並べていたころより、前後の日と見くらべやすくなります。
 *  幅が足りないときは、この表だけが横にスクロールします。
 */
function shiftGridBlock(rec, wishes, days) {
  const wrap = document.createElement('div');
  wrap.className = 'shift-grid-wrap';
  const table = document.createElement('table');
  table.className = 'shift-grid';

  /* 1行目：日付（1日で持ち場の数だけ列を使います） */
  const head = document.createElement('tr');
  head.appendChild(document.createElement('th'));
  days.forEach((s) => {
    const [, m, d] = s.split('-').map(Number);
    const dow = new Date(s.replace(/-/g, '/')).getDay();
    const [yy] = s.split('-').map(Number);
    const th = document.createElement('th');
    th.colSpan = SHIFT_LANES.length;
    // 祝日は日曜と同じ色にします（休みの日と分かるように）
    const holi = isHoliday(yy, m, d);
    th.className = 'shift-grid__date'
      + (dow === 0 || holi ? ' is-sun' : dow === 6 ? ' is-sat' : '');
    th.textContent = shiftDayLabel(s, DOW);
    head.appendChild(th);
  });
  table.appendChild(head);

  /* 2行目：持ち場 */
  const lanes = document.createElement('tr');
  lanes.appendChild(document.createElement('th'));
  days.forEach(() => SHIFT_LANES.forEach((l) => {
    const th = document.createElement('th');
    th.className = 'shift-grid__lane';
    th.textContent = l.name;
    lanes.appendChild(th);
  }));
  table.appendChild(lanes);

  /* 枠ごとの行 */
  SHIFT_SLOTS.forEach((slot, si) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.className = `shift-grid__slot shift-grid__slot--${slot.id}`;
    th.textContent = slot.name;
    tr.appendChild(th);

    days.forEach((dateStr) => {
      if (shiftClosedOn(dateStr)) {
        // 定休日は、枠の行をまとめて1つのマスにします
        if (si === 0) {
          const td = document.createElement('td');
          td.className = 'is-closed';
          td.colSpan = SHIFT_LANES.length;
          td.rowSpan = SHIFT_SLOTS.length;
          td.textContent = '定休日';
          tr.appendChild(td);
        }
        return;
      }
      const day = shiftDayOf(rec, dateStr);
      SHIFT_LANES.forEach((lane, li) => {
        const td = shiftCell(rec, wishes, day, dateStr, slot, lane, li === 0);
        // パティの枠は、その日のその枠ぜんぶを桃色のふちで囲みます
        if (day.patty === slot.id) {
          td.classList.add('is-patty');
          if (li === 0) td.classList.add('is-patty-first');
          if (li === SHIFT_LANES.length - 1) td.classList.add('is-patty-last');
        }
        tr.appendChild(td);
      });
    });
    table.appendChild(tr);
  });

  /* いちばん下：連絡（こちらのメモと、アルバイトからの連絡） */
  const memo = document.createElement('tr');
  const memoTh = document.createElement('th');
  memoTh.className = 'shift-grid__slot shift-grid__slot--memo';
  memoTh.textContent = 'メモ';
  memo.appendChild(memoTh);
  days.forEach((dateStr) => {
    const td = document.createElement('td');
    td.colSpan = SHIFT_LANES.length;
    td.className = 'shift-grid__memo';
    if (shiftClosedOn(dateStr)) {
      td.classList.add('is-closed');
      memo.appendChild(td);
      return;
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'shift-memo';
    // ★29日と2月9日は「肉の日」がはじめから入ります（shiftDefaultMemo）
    input.value = shiftMemoOf(rec, dateStr);
    input.addEventListener('change', () => {
      const now = shiftDayOf(shiftRec(), dateStr);
      now.memo = input.value.trim();
      saveShiftDay(dateStr, now);
    });
    td.appendChild(input);

    // アルバイトからのその日の連絡。組むときに見えないと意味がないので、ここに出します
    const said = wishes
      .filter((w) => w.notes[dateStr])
      .map((w) => `${w.name}「${w.notes[dateStr]}」`);
    if (said.length) {
      const box = document.createElement('p');
      box.className = 'shift-said';
      box.textContent = said.join('　');
      td.appendChild(box);
    }
    memo.appendChild(td);
  });
  table.appendChild(memo);

  wrap.appendChild(table);
  return wrap;
}

/** 表の1マス（その日・その枠・その持ち場） */
function shiftCell(rec, wishes, day, dateStr, slot, lane, first) {
  const td = document.createElement('td');
  td.className = 'shift-cell';

  day[slot.id].forEach((e, i) => {
    if (shiftLaneOf(e) !== lane.id) return;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'shift-chip' + (e.f ? ' is-full' : '') + (e.early ? ' is-early' : '');
    chip.textContent = shiftNameText(slot.id, e);
    if (e.f) chip.title = 'F（ランチからディナーまで通し）' + (e.early ? '・早上がり' : '');
    chip.addEventListener('click', () => openShiftPick(dateStr, slot.id, lane.id, i));
    td.appendChild(chip);
  });

  // まだ入れていない希望の数。押す前に「あと何人いる」が分かるように、
  // 左の持ち場にだけ出します（両方に出すと二重に数えたように見えます）。
  // ★数えるのは「その日のどこにも入っていない人」です。立ち上げから
  //   ランチへ回した人まで数えると、いつまでも減らないためです
  const inDay = (n) => SHIFT_SLOTS.some((sl) => day[sl.id].some((e) => e.n === n));
  const rest = first
    ? shiftWishInto(wishes, dateStr, slot.id).filter((w) => !inDay(w.name)).length
    : 0;

  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'shift-add' + (rest ? ' has-wish' : '');
  add.textContent = rest ? `＋${rest}` : '＋';
  add.title = rest ? `希望を出していて、まだ入っていない人が${rest}人います` : '人を足す';
  add.addEventListener('click', () => openShiftPick(dateStr, slot.id, lane.id, null));
  td.appendChild(add);

  // パティ。ランチかディナーの、左の持ち場にだけ出します
  // （日とその枠に付くもので、人に付くものではないため）
  if (first && SHIFT_PATTY_SLOTS.includes(slot.id)) {
    const patty = document.createElement('button');
    patty.type = 'button';
    patty.className = 'shift-patty' + (day.patty === slot.id ? ' is-on' : '');
    patty.textContent = 'パティ';
    patty.title = day.patty === slot.id
      ? 'この枠のパティを外す'
      : `この日のパティを${slot.name}にする`;
    patty.addEventListener('click', () => toggleShiftPatty(dateStr, slot.id));
    td.appendChild(patty);
  }

  return td;
}

/* -------- 人をえらぶ・直す -------- */

function openShiftPick(dateStr, slotId, laneId, index) {
  shiftPickAt = { dateStr, slotId, laneId, index, time: '', full: undefined };
  const slot = getShiftSlot(slotId);
  const lane = SHIFT_LANES.find((l) => l.id === laneId) || SHIFT_LANES[0];
  const [, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(dateStr.replace(/-/g, '/')).getDay();

  el.shiftPickTitle.textContent = index === null ? '入る人をえらぶ' : '直す';
  el.shiftPickWhen.textContent = `${m}/${d}（${DOW[dow]}） ${slot.name} ・ ${lane.name}`;
  renderShiftPick();
  el.shiftPickModal.classList.remove('is-hidden');
}

function closeShiftPick() {
  el.shiftPickModal.classList.add('is-hidden');
  shiftPickAt = null;
}

function renderShiftPick() {
  if (!shiftPickAt) return;
  const { dateStr, slotId, index } = shiftPickAt;
  const slot = getShiftSlot(slotId);
  const rec = shiftRec();
  const day = shiftDayOf(rec, dateStr);
  const entry = index === null ? null : day[slotId][index];

  /* 開始時刻 */
  el.shiftPickTimes.innerHTML = '';
  el.shiftPickTimeField.classList.toggle('is-hidden', !slot.times.length);
  el.shiftPickTimeLabel.textContent = entry
    ? '開始時刻（押すと変わります）'
    : '開始時刻（えらばなければ、その人の希望どおりに入ります）';
  if (slot.times.length) {
    slot.times.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      // ★「足す」ときは、押されるまでどれも光らせません。
      //   既定の時刻を光らせておくと、希望を出した人（18:30など）を選んだときに
      //   「17:00が選ばれているのに18:30で入る」ことになり、食い違って見えます
      const on = entry ? String(entry.t || '') === t : shiftPickAt.time === t;
      b.className = 'seg__btn' + (on ? ' is-on' : '');
      b.textContent = shiftTimeText(t);
      b.addEventListener('click', () => {
        if (entry) {
          const now = shiftDayOf(shiftRec(), dateStr);
          now[slotId][index] = { ...now[slotId][index], t };
          now[slotId] = shiftSort(now[slotId]);
          saveShiftDay(dateStr, now);
          closeShiftPick();
          render();
        } else {
          shiftPickAt.time = t;
          renderShiftPick();
        }
      });
      el.shiftPickTimes.appendChild(b);
    });
  }

  /* 持ち場（キッチン／ホール） */
  el.shiftPickLanes.innerHTML = '';
  const nowLane = entry ? shiftLaneOf(entry) : shiftPickAt.laneId;
  SHIFT_LANES.forEach((lane) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'seg__btn' + (lane.id === nowLane ? ' is-on' : '');
    b.textContent = lane.name;
    b.addEventListener('click', () => setShiftLane(lane.id));
    el.shiftPickLanes.appendChild(b);
  });

  /* 時刻をじかに書く */
  el.shiftPickFreeField.classList.toggle('is-hidden', !slot.times.length);
  el.shiftPickFree.value = entry && entry.t !== '' && entry.t !== undefined
    ? shiftTimeText(entry.t) : '';

  /* 通し（F）。ランチの枠のときだけ出します */
  const canFull = slotId === 'lunch';
  el.shiftPickFullField.classList.toggle('is-hidden', !canFull);
  if (canFull) {
    const on = entry ? !!entry.f : !!shiftPickAt.full;
    el.shiftPickFullOff.classList.toggle('is-on', !on);
    el.shiftPickFullOn.classList.toggle('is-on', on);
  }

  /* 早上がり。F で入れている人だけに出します */
  const isFull = !!(entry && entry.f);
  el.shiftPickEarlyField.classList.toggle('is-hidden', !isFull);
  if (isFull) {
    el.shiftPickEarlyOff.classList.toggle('is-on', !entry.early);
    el.shiftPickEarlyOn.classList.toggle('is-on', !!entry.early);
  }

  /* 名前 */
  el.shiftPickNames.innerHTML = '';
  el.shiftPickNameField.classList.toggle('is-hidden', index !== null);
  el.shiftPickRemove.classList.toggle('is-hidden', index === null);

  if (index === null) {
    // その日のどこかに入っている人は、もう出しません（二重に入れないため）
    const already = [];
    SHIFT_SLOTS.forEach((sl) => day[sl.id].forEach((e) => already.push(e.n)));
    const wish = shiftWishInto(shiftWishes(rec), dateStr, slotId)
      .filter((w) => !already.includes(w.name));
    const others = ShiftStaff.list(state.storeId)
      .filter((n) => !already.includes(n) && !wish.some((w) => w.name === n));

    const addGroup = (title, list, isWish) => {
      if (!list.length) return;
      const h = document.createElement('p');
      h.className = 'shift-pick__group';
      h.textContent = title;
      el.shiftPickNames.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'doer-grid';
      list.forEach((item) => {
        const name = isWish ? item.name : item;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'doer-btn' + (isWish ? ' is-wish' : '') + (isWish && item.full ? ' is-full' : '');
        const when = isWish && item.t ? `（${shiftTimeText(item.t)}）` : '';
        b.textContent = (isWish && item.full ? 'F ' : '') + name + when;
        b.addEventListener('click', () => {
          const now = shiftDayOf(shiftRec(), dateStr);
          const t = shiftPickAt.time || (isWish && item.t) || shiftDefaultTime(slotId);
          // 通しかどうかは、押した切り替え → その人の希望、の順で決めます
          const full = shiftPickAt.full !== undefined ? shiftPickAt.full : !!(isWish && item.full);
          const add = { n: name, t, p: shiftPickAt.laneId };
          if (slotId === 'lunch' && full) add.f = true;
          now[slotId].push(add);
          now[slotId] = shiftSort(now[slotId]);
          saveShiftDay(dateStr, now);
          closeShiftPick();
          render();
        });
        grid.appendChild(b);

        // 立ち上げに希望を出した人には、時間をずらして入れる道も出します。
        // 立ち上げが多い日に、押すだけでランチへ回せるようにするためです
        if (slotId === 'open' && isWish) {
          const to = shiftSpillTo();
          const spill = document.createElement('button');
          spill.type = 'button';
          spill.className = 'shift-spill';
          spill.textContent = `${name}を ${to.label}`;
          spill.addEventListener('click', () => {
            const now = shiftDayOf(shiftRec(), dateStr);
            if (now[to.slot].some((e) => e.n === name)) { closeShiftPick(); return; }
            now[to.slot].push({ n: name, t: to.time, p: shiftPickAt.laneId });
            now[to.slot] = shiftSort(now[to.slot]);
            saveShiftDay(dateStr, now);
            closeShiftPick();
            render();
          });
          grid.appendChild(spill);
        }
      });
      el.shiftPickNames.appendChild(grid);
    };

    addGroup('希望を出している人', wish, true);
    addGroup('そのほかの人', others, false);

    if (!wish.length && !others.length) {
      el.shiftPickNames.innerHTML = '<p class="modal__note">入れられる人がいません。'
        + 'マネージの「シフトに入る人」で登録してください。</p>';
    }
  }
}

/** 持ち場を変える */
function setShiftLane(laneId) {
  if (!shiftPickAt) return;
  const { dateStr, slotId, index } = shiftPickAt;
  if (index === null) {
    shiftPickAt.laneId = laneId;
    renderShiftPick();
    return;
  }
  const now = shiftDayOf(shiftRec(), dateStr);
  now[slotId][index] = { ...now[slotId][index], p: laneId };
  saveShiftDay(dateStr, now);
  closeShiftPick();
  render();
}

/**
 * 時刻をじかに書く
 *
 * ボタンに無い時刻（11:15 など）を入れるためのものです。
 * ★パソコンでもiPadでもiPhoneでも同じように使えます。
 */
function applyShiftFreeTime() {
  if (!shiftPickAt) return;
  const t = shiftTimeFrom(el.shiftPickFree.value);
  if (t === null) {
    el.shiftPickFree.classList.add('is-ng');
    return;
  }
  el.shiftPickFree.classList.remove('is-ng');
  const { dateStr, slotId, index } = shiftPickAt;
  if (index === null) {
    shiftPickAt.time = t;
    renderShiftPick();
    return;
  }

  const now = shiftDayOf(shiftRec(), dateStr);
  const entry = { ...now[slotId][index], t };

  // ★入れた時刻に合う枠へ、自動で移します。
  //   立ち上げの欄に「18:00」と書いてあるより、ディナーの欄に
  //   入っていたほうが、表を見たときに読みまちがえません。
  //   立ち上げへは戻しません（立ち上げに入れたいときは、立ち上げの ＋ から）。
  let to = shiftSlotByTime(t);
  if (to === 'open') to = slotId;
  // ★F（通し）の人を17時以降にずらしたら、それはもう通しではありません。
  //   通しの印（灰色の塗り）を外して、ディナーの枠へ移します
  if (entry.f && to === 'dinner') { delete entry.f; delete entry.early; }
  else if (entry.f) to = slotId;
  if (to && to !== slotId) {
    now[slotId].splice(index, 1);
    now[to].push(entry);
    now[to] = shiftSort(now[to]);
  } else {
    now[slotId][index] = entry;
    now[slotId] = shiftSort(now[slotId]);
  }

  saveShiftDay(dateStr, now);
  closeShiftPick();
  render();
}

/** 「早上がり」を切り替える（Fで入れているが、早めに帰す人） */
function setShiftEarly(on) {
  if (!shiftPickAt || shiftPickAt.index === null) return;
  const { dateStr, slotId, index } = shiftPickAt;
  const now = shiftDayOf(shiftRec(), dateStr);
  const e = { ...now[slotId][index] };
  if (on) e.early = true;
  else delete e.early;
  now[slotId][index] = e;
  saveShiftDay(dateStr, now);
  closeShiftPick();
  render();
}

/** 「通し（F）」を切り替える */
function setShiftFull(on) {
  if (!shiftPickAt) return;
  const { dateStr, slotId, index } = shiftPickAt;
  if (index === null) {
    // 「足す」ときは、まだ入れていないので覚えておくだけ
    shiftPickAt.full = on;
    renderShiftPick();
    return;
  }
  const now = shiftDayOf(shiftRec(), dateStr);
  const e = { ...now[slotId][index] };
  if (on) {
    e.f = true;
  } else {
    // 通しでなくなれば「早上がり」も意味を失うので、一緒に外します
    delete e.f;
    delete e.early;
  }
  now[slotId][index] = e;
  saveShiftDay(dateStr, now);
  closeShiftPick();
  render();
}

function removeShiftPick() {
  if (!shiftPickAt || shiftPickAt.index === null) return;
  const { dateStr, slotId, index } = shiftPickAt;
  const now = shiftDayOf(shiftRec(), dateStr);
  now[slotId].splice(index, 1);
  saveShiftDay(dateStr, now);
  closeShiftPick();
  render();
}

/* -------- 提出の一覧 -------- */

/**
 * 出してもらった希望を、名前×日付の表で見る
 *
 *  スマレジの提出一覧と同じ形です。誰がどの日に出しているかを
 *  ひと目で見くらべられるようにしています（縦に並べると、
 *  「この日は誰が出しているか」を数えるのに何度も往復することになります）。
 */
function openShiftWishes() {
  const rec = shiftRec();
  const names = ShiftStaff.list(state.storeId);
  const wishes = shiftWishes(rec);
  const days = shiftDays(state.y, state.m, shiftHalf);
  const open = days.filter((d) => !shiftClosedOn(d));

  const sent = wishes.filter((w) => w.sentAt).length;
  el.shiftWishWhen.textContent =
    `${shiftRangeLabel(state.y, state.m, shiftHalf)}　提出 ${sent} / ${names.length}人`;

  el.shiftWishList.innerHTML = '';
  if (!names.length) {
    el.shiftWishList.innerHTML = '<p class="modal__note">'
      + 'マネージの「シフトに入る人」で名前を登録してください。</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'wish-table';

  /* 見出し（日付） */
  const head = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'wish-table__name';
  corner.textContent = '名前';
  head.appendChild(corner);
  days.forEach((d) => {
    const [, m, dd] = d.split('-').map(Number);
    const [yy] = d.split('-').map(Number);
    const dow = new Date(d.replace(/-/g, '/')).getDay();
    const holi = isHoliday(yy, m, dd);
    const th = document.createElement('th');
    th.className = 'wish-table__day'
      + (dow === 0 || holi ? ' is-sun' : dow === 6 ? ' is-sat' : '')
      + (shiftClosedOn(d) ? ' is-closed' : '');
    th.innerHTML = `${dd}<br><span class="wish-table__dow">${DOW[dow]}${holi ? '祝' : ''}</span>`;
    head.appendChild(th);
  });
  table.appendChild(head);

  /* 1人ずつ。★組んだシフトと突き合わせて出します */
  names.forEach((name) => {
    const w = wishes.find((x) => x.name === name);
    const tr = document.createElement('tr');
    if (!w || !w.sentAt) tr.className = 'is-yet';

    // その人が「出した日」と「実際に入った日」を数えます
    let wished = 0;
    let placed = 0;
    open.forEach((d) => {
      if (((w && w.days[d]) || []).length) wished += 1;
      if (shiftPlacedOn(rec, d, name).length) placed += 1;
    });

    const th = document.createElement('th');
    th.className = 'wish-table__name';
    th.innerHTML = `${name}<br><span class="wish-table__count">`
      + (w && w.sentAt ? `出${wished} → 入${placed}` : 'まだ') + '</span>';
    tr.appendChild(th);

    days.forEach((d) => {
      const td = document.createElement('td');
      if (shiftClosedOn(d)) { td.className = 'is-closed'; tr.appendChild(td); return; }

      const mine = shiftPlacedOn(rec, d, name);
      const list = (w && w.days[d]) || [];

      // 実際に入っている分。こちらが本物なので、濃い色で出します
      mine.forEach((e) => {
        const slot = getShiftSlot(e.slot);
        const chip = document.createElement('span');
        // F（通し）は、ランチの枠にいても F の色で出します
        const kind = e.f ? SHIFT_FULL_ID : e.slot;
        // 希望を出していない日に入れた人は、印を付けます
        chip.className = `wish-chip wish-chip--${kind}` + (list.length ? '' : ' is-extra');
        chip.textContent = e.t ? shiftTimeText(e.t) : slot.name;
        chip.title = `${e.f ? 'F（通し）' : slot.name}${e.t ? ' ' + shiftTimeText(e.t) : ''}`
          + (list.length ? '（入れました）' : '（希望なしで入れました）');
        td.appendChild(chip);
      });

      // 出したのに入っていない日。薄く出して、拾い残しが見えるようにします
      if (!mine.length) {
        list.forEach((e) => {
          const slot = getShiftSlot(e.s);
          if (!slot) return;
          const chip = document.createElement('span');
          chip.className = `wish-chip wish-chip--${e.s} is-yet`;
          chip.textContent = e.t ? shiftTimeText(e.t) : slot.name;
          chip.title = `${slot.name}${e.t ? ' ' + shiftTimeText(e.t) : ''}（まだ入れていません）`;
          td.appendChild(chip);
        });
      }

      if (w && w.notes[d]) {
        const note = document.createElement('span');
        note.className = 'wish-note';
        note.textContent = '連';
        note.title = w.notes[d];
        td.appendChild(note);
      }
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  const wrap = document.createElement('div');
  wrap.className = 'wish-wrap';
  wrap.appendChild(table);
  el.shiftWishList.appendChild(wrap);

  /* 見かた */
  const legend = document.createElement('p');
  legend.className = 'wish-legend';
  legend.innerHTML = shiftWishSlots()
    .map((sl) => `<span class="wish-chip wish-chip--${sl.id}">${sl.name}</span>`).join('')
    + '<span class="wish-legend__gap"></span>'
    + '<span class="wish-chip wish-chip--lunch">濃い</span>シフトに入れた'
    + '<span class="wish-chip wish-chip--lunch is-yet">薄い</span>出したが入れていない'
    + '<span class="wish-chip wish-chip--lunch is-extra">印</span>希望なしで入れた'
    + '<span class="wish-note">連</span>連絡あり（押すと中身が出ます）';
  el.shiftWishList.appendChild(legend);

  el.shiftWishModal.classList.remove('is-hidden');
}

/* -------- 表にする（印刷・PDF・JPEG） --------
 *
 *  画面と印刷で作りがずれないよう、いったん「表の中身」だけを作って、
 *  それを HTML と 画像（canvas）の両方から使います。
 *  1つのかたまりは8日ぶん。今のスプレッドシートと同じ区切りです。
 */

/** 印刷やPDFに出す、表の中身 */
function shiftSheetModel() {
  const rec = shiftRec();
  const store = getStore(state.storeId);
  const days = shiftDays(state.y, state.m, shiftHalf);
  const blocks = [];

  for (let from = 0; from < days.length; from += SHIFT_PRINT_COLS) {
    const part = days.slice(from, from + SHIFT_PRINT_COLS);
    const head = part.map((s) => {
      const [, m, d] = s.split('-').map(Number);
      const dow = new Date(s.replace(/-/g, '/')).getDay();
      const [yy] = s.split('-').map(Number);
      const holi = isHoliday(yy, m, d);
      return {
        key: s, label: `${m}/${d}`,
        // 祝はかっこの外に出します（9/21（月）祝）
        dow: `（${DOW[dow]}）` + (holi ? '祝' : ''),
        sun: dow === 0 || holi, sat: dow === 6,
        closed: shiftClosedOn(s),
      };
    });

    const rows = SHIFT_SLOTS.map((slot) => ({
      label: slot.name,
      cells: part.flatMap((s) => {
        const day = shiftDayOf(rec, s);
        return SHIFT_LANES.map((lane) => ({
          closed: shiftClosedOn(s),
          patty: day.patty === slot.id,
          names: shiftClosedOn(s) ? [] : day[slot.id]
            .filter((e) => shiftLaneOf(e) === lane.id)
            .map((e) => ({ text: shiftNameText(slot.id, e), full: !!e.f, early: !!e.early })),
        }));
      }),
    }));

    const memo = part.map((s) => (shiftClosedOn(s) ? '' : shiftMemoOf(rec, s)));
    blocks.push({ head, rows, memo });
  }

  return {
    title: `${shiftRangeLabel(state.y, state.m, shiftHalf)} ${store.name} シフト表`,
    blocks,
  };
}

/* -------- 画面に出す表 -------- */
function renderShiftSheet() {
  const model = shiftSheetModel();
  el.shiftSheetTitle.textContent = model.title;
  el.shiftSheet.innerHTML = '';
  model.blocks.forEach((b) => el.shiftSheet.appendChild(shiftSheetTable(b)));
}

function shiftSheetTable(block) {
  const table = document.createElement('table');
  table.className = 'shift-sheet';

  const head = document.createElement('tr');
  head.appendChild(document.createElement('th'));
  block.head.forEach((d) => {
    const th = document.createElement('th');
    th.colSpan = SHIFT_LANES.length;
    th.className = d.sun ? 'is-sun' : d.sat ? 'is-sat' : '';
    th.innerHTML = `${d.label}<br><span class="shift-sheet__dow">${d.dow}</span>`;
    head.appendChild(th);
  });
  table.appendChild(head);

  const lanes = document.createElement('tr');
  lanes.appendChild(document.createElement('th'));
  block.head.forEach(() => SHIFT_LANES.forEach((l) => {
    const th = document.createElement('th');
    th.className = 'shift-sheet__lane';
    th.textContent = l.name;
    lanes.appendChild(th);
  }));
  table.appendChild(lanes);

  block.rows.forEach((row, ri) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.className = 'shift-sheet__label';
    th.textContent = row.label;
    tr.appendChild(th);

    let i = 0;
    block.head.forEach((d) => {
      if (d.closed) {
        i += SHIFT_LANES.length;
        if (ri === 0) {
          const td = document.createElement('td');
          td.className = 'is-closed';
          td.colSpan = SHIFT_LANES.length;
          td.rowSpan = block.rows.length;
          td.textContent = '定休日';
          tr.appendChild(td);
        }
        return;
      }
      SHIFT_LANES.forEach(() => {
        const cell = row.cells[i];
        i += 1;
        const td = document.createElement('td');
        // パティの枠は、その枠ぜんぶを桃色のふちで囲みます
        if (cell.patty) td.classList.add('is-patty');
        // ★F（通し）は名前を灰色で塗ります。今のスプレッドシートで
        //   ランチのセルを塗りつぶしているのと同じ意味です。
        //   早上がりの人は、そのうえに橙のふちを付けます
        cell.names.forEach((n) => {
          const one = document.createElement('span');
          one.className = 'shift-sheet__name'
            + (n.full ? ' is-full' : '') + (n.early ? ' is-early' : '');
          one.textContent = n.text;
          td.appendChild(one);
        });
        tr.appendChild(td);
      });
    });
    table.appendChild(tr);
  });

  const memo = document.createElement('tr');
  const memoTh = document.createElement('th');
  memoTh.className = 'shift-sheet__label';
  memoTh.textContent = 'メモ';
  memo.appendChild(memoTh);
  block.head.forEach((d, i) => {
    const td = document.createElement('td');
    td.colSpan = SHIFT_LANES.length;
    td.className = 'shift-sheet__memo' + (d.closed ? ' is-closed' : '');
    td.textContent = block.memo[i] || '';
    memo.appendChild(td);
  });
  table.appendChild(memo);

  return table;
}

function openShiftSheet() {
  renderShiftSheet();
  // 印刷したときに、この表だけが紙に出るようにするための目印（css の @media print）
  document.body.classList.add('print-shift');
  el.shiftSheetModal.classList.remove('is-hidden');
}

function closeShiftSheet() {
  el.shiftSheetModal.classList.add('is-hidden');
  document.body.classList.remove('print-shift');
}

/* -------- 画像にする --------
 *
 *  同じ中身を、A4の横向きに合わせた大きさで描きます。
 *  画面のHTMLを写し取るのではなく、数字から描き直しています。
 *  そのほうが、端末や字の設定で崩れません。
 */
const SHEET_PX = { w: 1754, h: 1240 };   // A4横 150dpi

function drawShiftSheet(canvas) {
  const model = shiftSheetModel();
  const cx = canvas.getContext('2d');
  const W = SHEET_PX.w;
  const H = SHEET_PX.h;
  canvas.width = W;
  canvas.height = H;

  cx.fillStyle = '#ffffff';
  cx.fillRect(0, 0, W, H);
  cx.textBaseline = 'middle';
  const font = (size, bold) => `${bold ? '700 ' : ''}${size}px -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif`;

  // ★紙のふちぎりぎりまで使います。印刷に出ない程度の余白だけ残します
  const pad = 14;
  // 列の幅は「いちばん多い日数」で決めます。後ろのかたまりが7日でも、
  // 前と同じ幅にそろえたほうが、続きの表として読めるからです
  const cols = SHIFT_PRINT_COLS * SHIFT_LANES.length;
  const labelW = 96;
  const gridW = W - pad * 2 - labelW;
  const colW = gridW / cols;

  const center = (text, x, w, yy, size, bold, color) => {
    cx.fillStyle = color || '#111418';
    cx.font = font(size, bold);
    cx.textAlign = 'center';
    cx.fillText(text, x + w / 2, yy, w - 6);
    cx.textAlign = 'left';
  };
  const line = (x1, y1, x2, y2, strong) => {
    cx.strokeStyle = strong ? '#8a9099' : '#c8ccd2';
    cx.lineWidth = strong ? 1.6 : 1;
    cx.beginPath();
    cx.moveTo(x1, y1);
    cx.lineTo(x2, y2);
    cx.stroke();
  };

  // 見出し
  center(model.title, 0, W, pad + 15, 28, true, '#111418');

  let y = pad + 38;
  const gapBlocks = 20;
  const dateH = 40;
  const laneH = 26;
  const memoH = 34;
  // 残りの高さを、枠の行に等しく配ります
  const blocks = model.blocks.length || 1;
  const fixed = (dateH + laneH + memoH) * blocks + gapBlocks * (blocks - 1);
  const slotH = Math.max(44, (H - y - pad - fixed) / (blocks * SHIFT_SLOTS.length));

  model.blocks.forEach((block, bi) => {
    const top = y;
    const x0 = pad + labelW;

    // 日付
    block.head.forEach((d, i) => {
      const x = x0 + colW * SHIFT_LANES.length * i;
      const w = colW * SHIFT_LANES.length;
      cx.fillStyle = '#f2f4f6';
      cx.fillRect(x, y, w, dateH);
      const color = d.sun ? '#c0392b' : d.sat ? '#33509a' : '#111418';
      center(`${d.label}${d.dow}`, x, w, y + dateH / 2, 21, true, color);
    });
    cx.fillStyle = '#f2f4f6';
    cx.fillRect(pad, y, labelW, dateH + laneH);
    y += dateH;

    // 持ち場
    block.head.forEach((d, i) => {
      SHIFT_LANES.forEach((lane, li) => {
        const x = x0 + colW * (SHIFT_LANES.length * i + li);
        cx.fillStyle = '#f8f9fa';
        cx.fillRect(x, y, colW, laneH);
        center(lane.name, x, colW, y + laneH / 2, 14, false, '#5b6169');
      });
    });
    y += laneH;

    // 枠ごとの行
    block.rows.forEach((row) => {
      cx.fillStyle = '#fafbfc';
      cx.fillRect(pad, y, labelW, slotH);
      center(row.label, pad, labelW, y + slotH / 2, 16, true, '#3d434b');

      let i = 0;
      block.head.forEach((d, di) => {
        if (d.closed) {
          i += SHIFT_LANES.length;
          return;
        }
        SHIFT_LANES.forEach((lane, li) => {
          const cell = row.cells[i];
          i += 1;
          const x = x0 + colW * (SHIFT_LANES.length * di + li);
          const lh = 25;
          // パティの枠は、その枠ぜんぶを桃色のふちで囲みます
          if (cell.patty) {
            cx.strokeStyle = '#bf5480';
            cx.lineWidth = 2.5;
            cx.strokeRect(x + 1.5, y + 1.5, colW - 3, slotH - 3);
          }
          cell.names.forEach((n, ni) => {
            const ty = y + 16 + ni * lh;
            if (ty > y + slotH - 4) return;      // 入りきらない分は出しません
            if (n.full) {
              cx.fillStyle = '#dcdfe3';
              cx.fillRect(x + 3, ty - 11, colW - 6, lh - 3);
            }
            // 早上がりは橙のふち。塗りの上から描くので、通しでも分かります
            if (n.early) {
              cx.strokeStyle = '#d98324';
              cx.lineWidth = 2;
              cx.strokeRect(x + 3, ty - 11, colW - 6, lh - 3);
            }
            center(n.text, x, colW, ty, 17, false, '#111418');
          });
        });
      });
      y += slotH;
    });

    // 定休日は、枠の行をまとめて塗ります
    block.head.forEach((d, i) => {
      if (!d.closed) return;
      const x = x0 + colW * SHIFT_LANES.length * i;
      const w = colW * SHIFT_LANES.length;
      const cy = top + dateH + laneH;
      const ch = slotH * block.rows.length;
      cx.fillStyle = '#eceef1';
      cx.fillRect(x, cy, w, ch);
      center('定休日', x, w, cy + ch / 2, 17, false, '#6b7280');
    });

    // 連絡
    cx.fillStyle = '#fafbfc';
    cx.fillRect(pad, y, labelW, memoH);
    center('メモ', pad, labelW, y + memoH / 2, 14, true, '#3d434b');
    block.head.forEach((d, i) => {
      const x = x0 + colW * SHIFT_LANES.length * i;
      const w = colW * SHIFT_LANES.length;
      if (d.closed) {
        cx.fillStyle = '#eceef1';
        cx.fillRect(x, y, w, memoH);
        return;
      }
      center(block.memo[i] || '', x, w, y + memoH / 2, 14, false, '#3d434b');
    });
    y += memoH;

    // けい線。★その かたまり に入っている日数ぶんだけ引きます
    //   （後半が7日のとき、8日目の空っぽの列を出さないため）
    const used = block.head.length * SHIFT_LANES.length;
    const right = x0 + colW * used;
    const bottom = y;
    for (let c = 0; c <= used; c += 1) {
      const x = x0 + colW * c;
      line(x, top, x, bottom, c % SHIFT_LANES.length === 0);
    }
    line(pad, top, pad, bottom, true);
    let ry = top;
    [dateH, laneH].forEach((h) => { line(pad, ry, right, ry, true); ry += h; });
    line(pad, ry, right, ry, true);
    block.rows.forEach(() => { ry += slotH; line(pad, ry, right, ry, false); });
    ry += memoH;
    line(pad, ry, right, ry, true);

    y += gapBlocks;
  });

  return canvas;
}

/** 画像（JPEG）で保存する */
function saveShiftImage() {
  return saveShiftFile('jpg');
}

/** PDFで保存する */
function saveShiftPdf() {
  return saveShiftFile('pdf');
}

/**
 * シフト表をファイルにして渡す
 *
 *  パソコン … 保存先をえらぶ画面が出ます。Finder のどこにでも置けます
 *             （前に保存した場所を覚えているので、2回目からは1回押すだけです）
 *  iPhone   … 共有の画面が出ます。そのままLINEに送るか、ファイルに保存できます
 *  それ以外 … ふだんのダウンロードになります
 *
 *  ★保存先をえらぶ画面は、押したその場で開きます。
 *    先に絵を作ってから開くと、ブラウザが「押した流れ」と見なさなくなり、
 *    画面が出ないことがあるためです。
 */
async function saveShiftFile(kind) {
  const isPdf = kind === 'pdf';
  const name = shiftFileName(isPdf ? 'pdf' : 'jpg');
  const type = isPdf ? 'application/pdf' : 'image/jpeg';

  const make = async () => {
    const canvas = document.createElement('canvas');
    drawShiftSheet(canvas);
    const jpeg = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
    if (!jpeg) return null;
    if (!isPdf) return jpeg;
    return makePdf(new Uint8Array(await jpeg.arrayBuffer()), canvas.width, canvas.height);
  };

  if (window.showSaveFilePicker) {
    let handle;
    try {
      handle = await window.showSaveFilePicker({
        suggestedName: name,
        // id を付けておくと、前に保存した場所から開いてくれます
        id: 't3works-shift',
        startIn: 'documents',
        types: [{
          description: isPdf ? 'PDF' : 'JPEG画像',
          accept: isPdf ? { 'application/pdf': ['.pdf'] } : { 'image/jpeg': ['.jpg', '.jpeg'] },
        }],
      });
    } catch (e) {
      return;   // 「キャンセル」を押しただけなので、何も言いません
    }
    const blob = await make();
    if (!blob) return;
    const w = await handle.createWritable();
    await w.write(blob);
    await w.close();
    el.shiftWishNote.textContent = `${name} を保存しました`;
    return;
  }

  const blob = await make();
  if (!blob) return;
  await handOut(new File([blob], name, { type }), name);
}

function shiftFileName(ext) {
  const store = getStore(state.storeId);
  const [a, b] = shiftRangeLabel(state.y, state.m, shiftHalf).split('〜');
  return `${store.name}シフト_${state.y}_${a.replace('/', '-')}-${b.replace('/', '-')}.${ext}`;
}

/**
 * できたファイルを渡す（保存先をえらぶ画面が使えない端末むけ）
 *
 * iPhone では「共有」から、そのままLINEに送れます。
 * 共有が使えない端末では、ふだんのダウンロードにします。
 */
async function handOut(file, name) {
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  } catch (e) {
    // 共有をやめただけのこともあるので、ここでは何も言いません
    if (e && e.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * JPEG 1枚だけを入れた、1ページのPDFを作る
 *
 *  外の道具を使わずに書いています。PDFは「番号を振ったかたまり」を並べ、
 *  最後にそれぞれが何バイト目から始まるかの表（xref）を付ける形なので、
 *  作りながら位置を数えていけば、これだけで作れます。
 *  用紙はA4の横（842×595ポイント）です。
 */
function makePdf(jpeg, w, h) {
  const enc = new TextEncoder();
  const parts = [];
  const offsets = [];
  let len = 0;
  const put = (bytes) => { parts.push(bytes); len += bytes.length; };
  const putText = (t) => put(enc.encode(t));
  const mark = () => { offsets.push(len); };

  const PW = 842, PH = 595;   // A4横（ポイント）
  // 紙いっぱいに、縦横の比を保って入れます
  const scale = Math.min(PW / w, PH / h);
  const dw = w * scale;
  const dh = h * scale;
  const dx = (PW - dw) / 2;
  const dy = (PH - dh) / 2;

  putText('%PDF-1.4\n');

  mark();
  putText('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  mark();
  putText('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  mark();
  putText(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}]`
    + ` /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);

  mark();
  putText(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h}`
    + ` /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`
    + ` /Length ${jpeg.length} >>\nstream\n`);
  put(jpeg);
  putText('\nendstream\nendobj\n');

  const content = `q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${dx.toFixed(2)} ${dy.toFixed(2)} cm /Im0 Do Q\n`;
  mark();
  putText(`5 0 obj\n<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`);

  const xref = len;
  let table = 'xref\n0 6\n0000000000 65535 f \n';
  offsets.forEach((o) => { table += String(o).padStart(10, '0') + ' 00000 n \n'; });
  putText(table);
  putText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  return new Blob(parts, { type: 'application/pdf' });
}

/** さっき取りに行った「店舗/日付」。同じ日で何度も取りに行かないための目印 */
let lastDayPulled = '';

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
  const isShift = state.view === 'shift';

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
    el.viewShift.classList.add('is-hidden');
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
    el.viewShift.classList.add('is-hidden');
    el.viewStores.classList.remove('is-hidden');
    renderStorePicker();
    renderSyncStatus();
    return;
  }

  el.viewStores.classList.add('is-hidden');
  el.storeTabs.classList.toggle('is-hidden', isWeekAll || isExpense || isCatch || isSettle || isMeeting);
  // 週間掃除は週ごとに送って見る画面なので、日タブは出しません
  const noDays = isReport || isWeek || isWeekAll || isExpense || isCatch || isSettle || isMeeting || isShift;
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
  el.storeHead.classList.toggle('is-weekview', isWeek || isShift);
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
  el.viewShift.classList.toggle('is-hidden', !isShift);

  // 精算履歴から離れたら、必ず「見るだけ」に戻します
  // （ブラウザの戻るで帰ってきたときも、開けっぱなしにしないため）
  if (!isSettle) settleUnlocked = false;

  // ★クローズの日を開いたら、その場で最新を取りに行きます。
  //   「アプリを開いたのに、さっき誰かが提出した分が出ない」を防ぎます
  if (isDay) {
    const here = `${state.storeId}/${ymd(state.y, state.m, state.d)}`;
    if (here !== lastDayPulled) {
      lastDayPulled = here;
      Sync.scheduleFlush(200);
    }
  }

  // ★今日のクローズを開いているあいだだけ、10秒おきに取りに行きます。
  //   同じ日を何人かで見るのはこの画面だけなので、ここだけ早くします
  //   （ずっと10秒おきにすると、Apps Script の1日の上限に当たります）
  const wasHot = Sync.hot;
  Sync.hot = isDay && ymd(state.y, state.m, state.d) === ymd(TODAY.y, TODAY.m, TODAY.d);
  if (Sync.hot !== wasHot && typeof Sync._loop === 'function') Sync._loop();

  if (isShift) renderShift();
  else if (isMeeting) renderMeeting();
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
  /* 年の送り。その年の1つ目の期に移ります */
  $('weekAllYearPrev').addEventListener('click', () => shiftWeekAllYear(-1));
  $('weekAllYearNext').addEventListener('click', () => shiftWeekAllYear(1));
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
  /* -------- シフト -------- */
  el.shiftPrev.addEventListener('click', () => shiftGoStep(-1));
  el.shiftNext.addEventListener('click', () => shiftGoStep(1));
  el.shiftToday.addEventListener('click', shiftGoToday);
  el.shiftWishBtn.addEventListener('click', openShiftWishes);
  el.shiftTakeBtn.addEventListener('click', onShiftTake);
  el.shiftOpenBtn.addEventListener('click', openShiftRecruit);
  el.shiftBuildBtn.addEventListener('click', buildShiftDone);
  el.shiftSheetBtn.addEventListener('click', openShiftSheet);
  el.shiftPdfBtn.addEventListener('click', saveShiftPdf);
  el.shiftJpegBtn.addEventListener('click', saveShiftImage);
  el.shiftPickRemove.addEventListener('click', removeShiftPick);
  el.shiftPickFreeGo.addEventListener('click', applyShiftFreeTime);
  el.shiftPickFree.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !imeEnter(e)) applyShiftFreeTime(); });
  bindHalfWidthInput(el.shiftPickFree, 'code');
  el.shiftPickEarlyOn.addEventListener('click', () => setShiftEarly(true));
  el.shiftPickEarlyOff.addEventListener('click', () => setShiftEarly(false));
  el.shiftPickFullOn.addEventListener('click', () => setShiftFull(true));
  el.shiftPickFullOff.addEventListener('click', () => setShiftFull(false));
  el.shiftPrintBtn.addEventListener('click', () => window.print());
  document.querySelectorAll('[data-shift-pick-close]')
    .forEach((b) => b.addEventListener('click', closeShiftPick));
  document.querySelectorAll('[data-shift-wish-close]')
    .forEach((b) => b.addEventListener('click', () => el.shiftWishModal.classList.add('is-hidden')));
  document.querySelectorAll('[data-shift-sheet-close]')
    .forEach((b) => b.addEventListener('click', closeShiftSheet));

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
  /* ランキングの範囲を切り替える */
  $('rankRange').addEventListener('click', (e) => {
    const b = e.target.closest('.seg__btn');
    if (!b) return;
    rankRange = b.dataset.range;
    [...$('rankRange').children].forEach((n) => n.classList.toggle('is-on', n === b));
    renderCatchRank();
  });
  /* 渡した相手で「その他」をえらんだら、名前を書く欄を出す */
  el.expWho.addEventListener('change', renderExpenseForm);
  /* 日付を動かすと「渡した相手」の要る・要らないが変わります（9月分から） */
  el.expDate.addEventListener('change', renderExpenseForm);
  el.expDate.addEventListener('input', renderExpenseForm);
  /* まとめた行を開いた「キャッチの明細」 */
  el.catchDetailModal.querySelectorAll('[data-close-catch-detail]').forEach((n) =>
    n.addEventListener('click', closeCatchDetail)
  );
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
  $('meetingLastGo').addEventListener('click', () => {
    const to = el.meetingLastGoTo;
    if (!to) return;
    flushMeetingNotes();
    state.y = to.y; state.m = to.m;
    writeHash(); render();
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

  /* 日報からの取り込み */
  el.nippouPull.addEventListener('click', pullNippou);

  /* 光熱費の手入力 */
  el.utilEdit.addEventListener('click', openUtilForm);
  el.utilSave.addEventListener('click', saveUtilForm);
  el.utilYear.addEventListener('click', (e) => {
    const b = e.target.closest('.seg__btn');
    if (!b) return;
    utilSide = b.dataset.side;
    [...el.utilYear.children].forEach((n) => n.classList.toggle('is-on', n === b));
    fillUtilForm();
  });
  el.utilModal.querySelectorAll('[data-close-util]').forEach((n) => {
    n.addEventListener('click', () => el.utilModal.classList.add('is-hidden'));
  });

  /* 精算履歴。ひらくたびに「見るだけ」に戻します
     （SETTLE_PAGE_ON が false のあいだは、入口ごと出しません） */
  $('expenseSettleBtn').classList.toggle('is-hidden', !SETTLE_PAGE_ON);
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
  /* カレンダーの月送り。日は、その月に入る範囲へ寄せます */
  $('reportMonthPrev').addEventListener('click', () => shiftReportMonth(-1));
  $('reportMonthNext').addEventListener('click', () => shiftReportMonth(1));
  /* ミスの記録（クローズと週間掃除で、同じ入力画面を使います） */
  bindMissRange('close', 'missRange');
  bindMissRange('week', 'wmissRange');
  el.missWho.addEventListener('change', renderMissWhoField);
  $('missAdd').addEventListener('click', () => openMissForm('close'));
  $('wmissAdd').addEventListener('click', () => openMissForm('week'));
  el.missSave.addEventListener('click', saveMiss);
  $('missDelete').addEventListener('click', removeMiss);
  el.missModal.querySelectorAll('[data-close-miss]').forEach((n) =>
    n.addEventListener('click', () => el.missModal.classList.add('is-hidden'))
  );
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
  el.pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !imeEnter(e)) submitPin(); });
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
    else if (!el.catchDetailModal.classList.contains('is-hidden')) closeCatchDetail();
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
    Sync.onChange = () => { renderSyncStatus(); renderSyncWarn(); };
    if (!Sync.pin()) openPinModal();
    else Sync.start();
    return;
  }

  // 担当者が1人も登録されていなければ、最初に設定を開く
  if (Staff.list().length === 0) openModal();
}

init();
