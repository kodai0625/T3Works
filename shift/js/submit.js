/* ============================================================
 *  シフト提出ページ
 *
 *  アルバイトが半月分の希望を出すためだけの画面です。
 *  URLをLINEで配って開いてもらいます（アプリの導入もログインも要りません）。
 *
 *  番号について
 *    入口は「1人に1つの番号」です。現場用PINでも管理用PINでもありません。
 *    番号で誰なのかが決まるので、**ほかの人の名前では出せません**。
 *    名前の一覧も出しません（誰が働いているかを見せないため）。
 *    番号でできるのは
 *      ・自分の希望を出す
 *      ・自分がさっき出した内容を見直す
 *    の2つだけです。ほかの人の希望も、クローズや立替金の記録も読めません
 *    （Apps Script 側で action:'shift' 以外を受け付けていません）。
 *
 *  枠と時刻の決まりは、アプリ本体と同じ config.js から読んでいます。
 *  ★時刻を足したいときは js/config.js の SHIFT_SLOTS を直せば、
 *    この画面にも組む画面にも同時に反映されます。
 * ============================================================ */

const DOW = ['日', '月', '火', '水', '木', '金', '土'];
const SAVE = 't3d-shift-submit';

const el = (id) => document.getElementById(id);

/**
 * この端末の持ち主
 *
 * 覚えておくのは番号だけです。名前と店舗は、番号からサーバーが決めます。
 * （こちらで名前を持っていても、送るときには使いません。
 *   なりすましの余地をなくすため、サーバーは番号だけを見ます）
 */
const me = {
  code: localStorage.getItem(`${SAVE}:code`) || '',
  name: '',
  store: '',
};

/** 画面に出している半月 */
let period = null;      // { y, m, half }
/** いま入れている希望。{ 'YYYY-MM-DD': [{ s, t }] } */
let picked = {};
/** 出しずみかどうか */
let sentAt = null;
/** 店舗の定休日（サーバーから取ります） */
let closed = { dows: [], ex: {} };

/* ============================================================
 *  サーバーとのやりとり
 * ============================================================ */
async function call(body) {
  if (!APP.syncUrl) return { ok: false, error: '接続先が設定されていません' };
  try {
    const res = await fetch(APP.syncUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ code: me.code, action: 'shift', ...body }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: '電波が届いていないようです。もう一度お試しください' };
  }
}

/* ============================================================
 *  半月の決め方
 *
 *  出してもらうのは「まだ始まっていない半月」です。
 *  8月21日に開いたら 9/1〜9/15 が最初に出ます。
 *  すでに始まっている半月は、出しても間に合わないので出しません。
 * ============================================================ */
function firstOpenPeriod() {
  const now = businessDate();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return shiftStep(y, m, shiftHalfOf(now.getDate()), 1);
}

/** その半月が、まだ出せるものかどうか */
function isOpenPeriod(p) {
  const a = p.y * 24 + (p.m - 1) * 2 + (p.half - 1);
  const f = firstOpenPeriod();
  const b = f.y * 24 + (f.m - 1) * 2 + (f.half - 1);
  return a >= b && a <= b + 1;    // 次の半月と、その次まで
}

function isClosedOn(dateStr) {
  const ex = closed.ex[dateStr];
  if (ex === 'closed') return true;
  if (ex === 'open') return false;
  const dow = new Date(dateStr.replace(/-/g, '/')).getDay();
  return closed.dows.includes(dow);
}

/* ============================================================
 *  画面
 * ============================================================ */
function show(which) {
  ['gate', 'form'].forEach((id) => el(id).classList.toggle('is-hidden', id !== which));
}

function setErr(id, msg) {
  el(id).textContent = msg || '';
  el(id).classList.toggle('is-hidden', !msg);
}

/* -------- 1. 自分の番号 -------- */
async function submitPin() {
  const code = el('gatePin').value.trim();
  if (!code) return setErr('gateErr', '番号を入れてください');

  el('gateGo').disabled = true;
  setErr('gateErr', '');
  me.code = code;
  const res = await call({ mode: 'open' });
  el('gateGo').disabled = false;

  if (!res.ok) {
    me.code = '';
    return setErr('gateErr', res.error || 'この番号は使えません');
  }
  localStorage.setItem(`${SAVE}:code`, code);
  applyOpen(res);
  startForm();
}

/** 番号から分かったこと（名前・店舗・定休日）を受け取る */
function applyOpen(res) {
  me.name = res.name || '';
  me.store = res.store || '';
  // 定休日はマネージで変えられます。変えていない店舗は null で返ってくるので、
  // そのときは config.js に書いてある初期値（バグるなら火曜）を使います。
  // ★毎回サーバーに聞きに行くので、マネージで直せばここもすぐ変わります
  const store = getStore(me.store);
  closed = {
    dows: Array.isArray(res.closedDows) ? res.closedDows : ((store && store.closedDays) || []),
    ex: res.closedEx && typeof res.closedEx === 'object' ? res.closedEx : {},
  };
  el('headTitle').textContent = `シフト提出｜${store ? store.name : ''}`;
}

/** 番号を入れ直す（端末を人に渡すときなど） */
function signOut() {
  localStorage.removeItem(`${SAVE}:code`);
  me.code = '';
  me.name = '';
  el('gatePin').value = '';
  el('headMe').classList.add('is-hidden');
  show('gate');
}

/* -------- 2. 希望を入れる -------- */
function startForm() {
  el('headMe').textContent = me.name;
  el('headMe').classList.remove('is-hidden');
  period = firstOpenPeriod();
  show('form');
  loadPeriod();
}

async function loadPeriod() {
  picked = {};
  sentAt = null;
  el('note').value = '';
  setErr('sendErr', '');
  el('sendOk').classList.add('is-hidden');
  renderPeriod();

  const res = await call({ mode: 'get', key: periodKey() });
  if (!res.ok) return setErr('sendErr', res.error || '読み込めませんでした');
  if (res.wish) {
    picked = res.wish.days && typeof res.wish.days === 'object' ? res.wish.days : {};
    sentAt = res.wish.sentAt || null;
    el('note').value = res.wish.note || '';
  }
  renderPeriod();
}

function periodKey() {
  return shiftKey(me.store, period.y, period.m, period.half);
}

function renderPeriod() {
  el('periodMain').textContent = shiftRangeLabel(period.y, period.m, period.half);
  el('periodSub').textContent = `${period.y}年${period.m}月 ${period.half === 1 ? '前半' : '後半'}`;

  const next = shiftStep(period.y, period.m, period.half, 1);
  el('periodPrev').disabled = !isOpenPeriod(shiftStep(period.y, period.m, period.half, -1));
  el('periodNext').disabled = !isOpenPeriod(next);

  // ★定休日になった日の希望は落とします。マネージで定休日を足したあとに
  //   出し直されると、休みの日に入る希望が残ってしまうためです
  Object.keys(picked).forEach((s) => { if (isClosedOn(s)) delete picked[s]; });

  const days = shiftDays(period.y, period.m, period.half).filter((s) => !isClosedOn(s));
  const on = days.filter((s) => (picked[s] || []).length).length;
  el('periodState').className = 'period__state' + (sentAt ? ' is-sent' : '');
  el('periodState').textContent = sentAt
    ? `出しずみ（${on}日）。直したら、もう一度出してください`
    : `${days.length}日のうち ${on}日 えらんでいます`;

  el('slotHint').innerHTML = shiftWishSlots()
    .map((s) => `<b>${s.name}</b>＝${s.hint}`).join('<br>')
    + '<br>入れる日の枠を押してください。押していない日は「入れない日」です。';

  renderDays();
}

function renderDays() {
  el('days').innerHTML = '';
  shiftDays(period.y, period.m, period.half).forEach((dateStr) => {
    el('days').appendChild(dayCard(dateStr));
  });
}

function dayCard(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(dateStr.replace(/-/g, '/')).getDay();
  const shut = isClosedOn(dateStr);
  const mine = picked[dateStr] || [];

  const card = document.createElement('div');
  card.className = 'day'
    + (shut ? ' is-closed' : '')
    + (mine.length ? ' is-on' : '')
    + (dow === 0 ? ' is-sun' : dow === 6 ? ' is-sat' : '');

  const head = document.createElement('div');
  head.className = 'day__head';
  const date = document.createElement('span');
  date.className = 'day__date';
  date.textContent = `${m}/${d}（${DOW[dow]}）`;
  head.appendChild(date);

  if (shut) {
    const badge = document.createElement('span');
    badge.className = 'day__closed';
    badge.textContent = '定休日';
    head.appendChild(badge);
    card.appendChild(head);
    return card;
  }

  card.appendChild(head);

  // 枠は4つ（立ち上げ・F・ランチ・ディナー）あるので、日付の下に1行使って並べます。
  // 日付と同じ行に押し込むと、iPhoneではボタンが小さくなりすぎて押しまちがえます
  const slots = document.createElement('div');
  slots.className = 'day__slots';
  shiftWishSlots().forEach((slot) => {
    const on = mine.some((e) => e.s === slot.id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `slot slot--${slot.id}` + (on ? ' is-on' : '');
    b.textContent = slot.name;
    b.title = slot.hint;
    b.addEventListener('click', () => toggleSlot(dateStr, slot.id));
    slots.appendChild(b);
  });
  card.appendChild(slots);

  // えらんだ枠だけ、開始時刻を出します
  mine.forEach((entry) => {
    const slot = getShiftSlot(entry.s);
    if (!slot || !slot.times.length) return;
    const row = document.createElement('div');
    row.className = 'times';
    const label = document.createElement('span');
    label.className = `times__label times__label--${slot.id}`;
    label.textContent = `${slot.name} は何時から？`;
    row.appendChild(label);

    const btns = document.createElement('div');
    btns.className = 'times__btns';
    slot.times.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'time' + (String(entry.t) === t ? ' is-on' : '');
      b.textContent = shiftTimeText(t);
      b.addEventListener('click', () => setTime(dateStr, slot.id, t));
      btns.appendChild(b);
    });
    row.appendChild(btns);
    card.appendChild(row);
  });

  return card;
}

function toggleSlot(dateStr, slotId) {
  let list = (picked[dateStr] || []).slice();
  const i = list.findIndex((e) => e.s === slotId);
  if (i >= 0) {
    list.splice(i, 1);
  } else {
    // F はランチとディナーの両方に入るという意味なので、一緒にはえらべません
    const clash = shiftClashes(slotId);
    list = list.filter((e) => !clash.includes(e.s));
    list.push({ s: slotId, t: shiftDefaultTime(slotId) });
  }

  if (list.length) picked[dateStr] = list;
  else delete picked[dateStr];
  renderPeriod();
}

function setTime(dateStr, slotId, t) {
  const list = (picked[dateStr] || []).slice();
  const i = list.findIndex((e) => e.s === slotId);
  if (i < 0) return;
  list[i] = { s: slotId, t };
  picked[dateStr] = list;
  renderPeriod();
}

/* -------- 送る -------- */
async function send() {
  setErr('sendErr', '');
  el('sendOk').classList.add('is-hidden');
  el('send').disabled = true;

  const res = await call({
    mode: 'put',
    key: periodKey(),
    days: picked,
    note: el('note').value.trim(),
  });
  el('send').disabled = false;

  if (!res.ok) return setErr('sendErr', res.error || '出せませんでした');
  sentAt = res.sentAt || new Date().toISOString();
  el('sendOk').textContent = '出しました。ありがとうございます。';
  el('sendOk').classList.remove('is-hidden');
  renderPeriod();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
 *  はじめの1回
 * ============================================================ */
async function boot() {
  el('gateGo').addEventListener('click', submitPin);
  el('gatePin').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPin(); });
  // 日本語キーボードのままだと「Ｔ３」のように全角で入ってしまうので、半角に直します
  bindHalfWidthInput(el('gatePin'), 'code');
  el('periodPrev').addEventListener('click', () => { period = shiftStep(period.y, period.m, period.half, -1); loadPeriod(); });
  el('periodNext').addEventListener('click', () => { period = shiftStep(period.y, period.m, period.half, 1); loadPeriod(); });
  el('send').addEventListener('click', send);
  el('signOut').addEventListener('click', signOut);

  if (!me.code) return show('gate');

  // 番号を覚えているときは、そのまま自分のことを聞きに行きます
  const res = await call({ mode: 'open' });
  if (!res.ok) {
    me.code = '';
    localStorage.removeItem(`${SAVE}:code`);
    show('gate');
    return setErr('gateErr', res.error || 'もう一度、番号を入れてください');
  }
  applyOpen(res);
  startForm();
}

boot();
