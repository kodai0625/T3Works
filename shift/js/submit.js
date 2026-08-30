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
 *    番号でできるのは、自分の希望を出すことと、出した内容を見ることだけです。
 *
 *  出す期間について
 *    **どの半月を出すかは、こちらでは決めません。**
 *    お店が「シフト募集をはじめる」を押した半月だけが、サーバーから返ってきます。
 *    募集していない先の月は出ませんし、確定したあとは出せなくなります。
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

/** サーバーが決めた、いま出す半月。null なら募集していません */
let period = null;
/** 'open'（募集中）／'built'（確定ずみ）／'' */
let phase = '';
/** いま入れている希望。{ 'YYYY-MM-DD': [{ s, t }] } */
let picked = {};
/** 日ごとの連絡。{ 'YYYY-MM-DD': '文' } */
let notes = {};
/** 出しずみかどうか */
let sentAt = null;
/** 店舗の定休日（サーバーから取ります） */
let closed = { dows: [], ex: {} };
/** 確定したシフト。確定するまでは null（途中は見せません） */
let built = null;

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
}

/** 番号から分かったこと（名前・店舗・期間・定休日・出しずみの内容）を受け取る */
function applyOpen(res) {
  me.name = res.name || '';
  me.store = res.store || '';
  period = res.period || null;
  phase = res.phase || '';

  // 定休日はマネージで変えられます。変えていない店舗は null で返ってくるので、
  // そのときは config.js に書いてある初期値（バグるなら火曜）を使います。
  // ★毎回サーバーに聞きに行くので、マネージで直せばここもすぐ変わります
  const store = getStore(me.store);
  closed = {
    dows: Array.isArray(res.closedDows) ? res.closedDows : ((store && store.closedDays) || []),
    ex: res.closedEx && typeof res.closedEx === 'object' ? res.closedEx : {},
  };

  built = res.built && typeof res.built === 'object' ? res.built : null;

  const wish = res.wish || null;
  picked = wish && wish.days && typeof wish.days === 'object' ? wish.days : {};
  notes = wish && wish.notes && typeof wish.notes === 'object' ? wish.notes : {};
  sentAt = wish ? (wish.sentAt || null) : null;

  el('headTitle').textContent = `シフト提出｜${store ? store.name : ''}`;
  el('meName').textContent = me.name;
  show('form');
  renderPeriod();
}

/** 番号を入れ直す（端末を人に渡すときなど） */
function signOut() {
  localStorage.removeItem(`${SAVE}:code`);
  me.code = '';
  me.name = '';
  el('gatePin').value = '';
  show('gate');
}

/* -------- 2. 希望を入れる -------- */
function renderPeriod() {
  const canSend = !!period && phase === 'open';
  const hasBuilt = !!(built && Object.keys(built).length);
  el('entry').classList.toggle('is-hidden', !canSend);
  el('closedBox').classList.toggle('is-hidden', canSend || hasBuilt);
  el('builtBox').classList.toggle('is-hidden', !hasBuilt);
  // 確定したシフトが出ているときは、出した控えは畳みます（同じ話が二度出るため）
  el('doneBox').classList.toggle('is-hidden', !sentAt || hasBuilt);

  if (!period) {
    el('periodMain').textContent = '—';
    el('periodSub').textContent = '';
    el('periodState').textContent = '';
    el('closedNote').textContent = '次のシフトの募集がはじまると、ここに出ます。しばらくお待ちください。';
    return;
  }

  el('periodMain').textContent = shiftRangeLabel(period.y, period.m, period.half);
  el('periodSub').textContent = `${period.y}年${period.m}月 ${period.half === 1 ? '前半' : '後半'}`;

  // ★定休日になった日の希望は落とします。マネージで定休日を足したあとに
  //   出し直されると、休みの日に入る希望が残ってしまうためです
  Object.keys(picked).forEach((s) => { if (isClosedOn(s)) delete picked[s]; });

  const days = shiftDays(period.y, period.m, period.half).filter((s) => !isClosedOn(s));
  const on = days.filter((s) => (picked[s] || []).length).length;

  if (!canSend) {
    el('periodState').textContent = hasBuilt ? 'シフトが決まりました'
      : sentAt ? '受け付けは終わりました' : '';
    el('closedNote').textContent = sentAt
      ? 'この期間の受け付けは終わりました。出した内容は下のとおりです。'
      : '次のシフトの募集がはじまると、ここに出ます。しばらくお待ちください。';
    renderDone();
    renderBuilt();
    return;
  }

  el('periodState').className = 'period__state' + (sentAt ? ' is-sent' : '');
  el('periodState').textContent = sentAt
    ? `出しずみ（${on}日）。直したら、もう一度出してください`
    : `${days.length}日のうち ${on}日 えらんでいます`;

  el('slotHint').innerHTML = shiftWishSlots()
    .map((s) => `<b>${s.name}</b>＝${s.hint}`).join('<br>')
    + '<br>入れる日の枠を押してください。押していない日は「入れない日」です。';

  renderDays();
  renderDone();
  renderBuilt();
}

/* -------- 決まったシフトを見る --------
 *
 *  お店が「シフトを確定する」を押すまでは出ません。
 *  組んでいる途中のものを見せると、変わるたびに混乱するためです。
 */
function renderBuilt() {
  if (!built || !period) return;
  el('builtTitle').textContent =
    `${shiftRangeLabel(period.y, period.m, period.half)} のシフト`;
  el('builtList').innerHTML = '';

  shiftDays(period.y, period.m, period.half).forEach((dateStr) => {
    const [, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(dateStr.replace(/-/g, '/')).getDay();
    const day = built[dateStr];

    const row = document.createElement('div');
    row.className = 'built-day'
      + (dow === 0 ? ' is-sun' : dow === 6 ? ' is-sat' : '');

    const date = document.createElement('span');
    date.className = 'built-day__date';
    date.textContent = `${m}/${d}（${DOW[dow]}）`;
    row.appendChild(date);

    const body = document.createElement('div');
    body.className = 'built-day__body';

    if (isClosedOn(dateStr)) {
      const p2 = document.createElement('p');
      p2.className = 'built-none';
      p2.textContent = '定休日';
      body.appendChild(p2);
    } else {
      let any = false;
      SHIFT_SLOTS.forEach((slot) => {
        const list = (day && day[slot.id]) || [];
        if (!list.length) return;
        any = true;
        const line = document.createElement('p');
        line.className = 'built-line';
        const tag = document.createElement('span');
        tag.className = `built-line__slot built-line__slot--${slot.id}`;
        tag.textContent = slot.name;
        line.appendChild(tag);

        list.forEach((e) => {
          const one = document.createElement('span');
          // 自分の名前は太く。自分の出番をひと目で見つけられるように
          one.className = 'built-name'
            + (e.n === me.name ? ' is-me' : '')
            + (e.f ? ' is-full' : '');
          one.textContent = shiftNameText(slot.id, e);
          line.appendChild(one);
        });
        body.appendChild(line);
      });
      if (!any) {
        const p2 = document.createElement('p');
        p2.className = 'built-none';
        p2.textContent = '—';
        body.appendChild(p2);
      }
      if (day && day.memo) {
        const memo = document.createElement('p');
        memo.className = 'built-memo';
        memo.textContent = day.memo;
        body.appendChild(memo);
      }
    }

    row.appendChild(body);
    el('builtList').appendChild(row);
  });
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

  // えらんだ枠だけ、開始時刻を出します。
  // F と立ち上げは、こちらで決めるので出しません（askTime: false）
  mine.forEach((entry) => {
    const slot = getShiftSlot(entry.s);
    if (!slot || !slot.times.length || slot.askTime === false) return;
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

  // その日の連絡。枠の下に置いて、日ごとに書けるようにしています
  const note = document.createElement('input');
  note.type = 'text';
  note.className = 'day__note';
  note.maxLength = 120;
  note.placeholder = '連絡（あれば）　例：少し遅れます';
  note.value = notes[dateStr] || '';
  note.addEventListener('input', () => {
    const v = note.value.trim();
    if (v) notes[dateStr] = v;
    else delete notes[dateStr];
  });
  card.appendChild(note);

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

/* -------- 出した内容の控え -------- */
function renderDone() {
  if (!sentAt || !period) return;
  el('doneTitle').textContent = `${shiftRangeLabel(period.y, period.m, period.half)} を出しました`;
  el('doneList').innerHTML = '';

  const days = shiftDays(period.y, period.m, period.half)
    .filter((s) => (picked[s] || []).length || notes[s]);

  if (!days.length) {
    const li = document.createElement('li');
    li.className = 'done-none';
    li.textContent = 'この期間は「入れる日なし」で出しました。';
    el('doneList').appendChild(li);
    return;
  }

  days.forEach((s) => {
    const [, m, d] = s.split('-').map(Number);
    const dow = new Date(s.replace(/-/g, '/')).getDay();
    const li = document.createElement('li');
    li.className = 'done-row';

    const date = document.createElement('span');
    date.className = 'done-row__date';
    date.textContent = `${m}/${d}（${DOW[dow]}）`;
    li.appendChild(date);

    const body = document.createElement('span');
    body.className = 'done-row__body';
    const marks = (picked[s] || []).map((e) => {
      const slot = getShiftSlot(e.s);
      if (!slot) return '';
      // ★F は時刻を出しません。何時からになるかはお店が決めるので、
      //   ここに時刻を出すと「その時間で決まった」と読めてしまいます
      if (slot.askTime === false && e.s === SHIFT_FULL_ID) return slot.name;
      const t = String(e.t || '');
      return slot.name + (t && slot.times.length ? ` ${shiftTimeText(t)}〜` : '');
    }).filter(Boolean);
    body.textContent = marks.join('・') || '（入れません）';
    li.appendChild(body);

    if (notes[s]) {
      const note = document.createElement('span');
      note.className = 'done-row__note';
      note.textContent = notes[s];
      li.appendChild(note);
    }
    el('doneList').appendChild(li);
  });
}

/* -------- 出す -------- */
async function send() {
  setErr('sendErr', '');
  el('send').disabled = true;

  const res = await call({ mode: 'put', days: picked, notes });
  el('send').disabled = false;

  if (!res.ok) return setErr('sendErr', res.error || '出せませんでした');
  sentAt = res.sentAt || new Date().toISOString();
  renderPeriod();
  // 出した内容の一覧まで画面を送って、届いたことが目で分かるようにします
  el('doneBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ============================================================
 *  はじめの1回
 * ============================================================ */
async function boot() {
  el('gateGo').addEventListener('click', submitPin);
  el('gatePin').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !imeEnter(e)) submitPin(); });
  // 日本語キーボードのままだと「８１５」のように全角で入ってしまうので、半角に直します
  bindHalfWidthInput(el('gatePin'), 'code');
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
}

boot();
