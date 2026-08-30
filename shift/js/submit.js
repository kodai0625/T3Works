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
/** 提出の期限（'YYYY-MM-DD'。決まっていなければ空） */
let due = '';
/** いま入れている希望。{ 'YYYY-MM-DD': [{ s, t }] } */
let picked = {};
/** 日ごとの連絡。{ 'YYYY-MM-DD': '文' } */
let notes = {};
/** 提出済みかどうか */
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

/** きょうから期限まで、あと何日か（すぎていたら負の数） */
function daysLeft(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = businessDate();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((new Date(y, m - 1, d) - today) / 86400000);
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
  ['boot', 'gate', 'form'].forEach((id) => el(id).classList.toggle('is-hidden', id !== which));
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

/** 番号から分かったこと（名前・店舗・期間・定休日・提出済みの内容）を受け取る */
function applyOpen(res) {
  me.name = res.name || '';
  me.store = res.store || '';
  period = res.period || null;
  phase = res.phase || '';
  due = res.due || '';

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

  // 提出の期限。募集しているあいだだけ出します
  const showDue = canSend && due;
  el('periodDue').classList.toggle('is-hidden', !showDue);
  if (showDue) {
    const left = daysLeft(due);
    el('periodDue').textContent = `提出は ${shiftDueLabel(due, DOW)}`
      + (left === 0 ? '（きょうまでです）' : left > 0 ? `（あと${left}日）` : '（期限をすぎています）');
    el('periodDue').className = 'period__due' + (left <= 1 ? ' is-near' : '');
  }

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
    ? `提出済み（${on}日）。直したら、もう一度出してください`
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

/* -------- 決まったシフトを、絵にして持ち帰る --------
 *
 *  組む画面の表は横長で、スマホでは字が小さくなりすぎます。
 *  ここでは日付を縦に並べた形で描きます（画面に出ているのと同じ形）。
 */
const BUILT_IMG = { w: 1080, pad: 30, slotW: 150, lh: 46, gap: 14, scale: 2 };

function builtFont(size, bold) {
  return `${bold ? '700 ' : ''}${size}px -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif`;
}

/** 描く前に、行の組み方だけ先に決めます（高さを知るため） */
function builtLayout(measure) {
  const bodyW = BUILT_IMG.w - BUILT_IMG.pad * 2 - BUILT_IMG.slotW - 14;
  const blocks = [];
  shiftDays(period.y, period.m, period.half).forEach((dateStr) => {
    const [, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(dateStr.replace(/-/g, '/')).getDay();
    const day = built[dateStr];
    const block = { date: `${m}/${d}（${DOW[dow]}）`, dow, rows: [] };

    if (isClosedOn(dateStr)) {
      block.rows.push({ slot: '', kind: '', names: [{ t: '定休日', me: false }] });
    } else {
      SHIFT_SLOTS.forEach((slot) => {
        const list = (day && day[slot.id]) || [];
        if (!list.length) return;
        measure.font = builtFont(30, false);
        const people = list.map((e) => ({
          t: shiftNameText(slot.id, e) + (e.f ? ' F' : ''),
          me: e.n === me.name,
        }));
        // 幅からはみ出す前に、次の行へ折り返します
        const lines = [];
        let cur = [];
        let w = 0;
        people.forEach((one) => {
          const ww = measure.measureText(`${one.t}　`).width;
          if (cur.length && w + ww > bodyW) { lines.push(cur); cur = []; w = 0; }
          cur.push(one);
          w += ww;
        });
        if (cur.length) lines.push(cur);
        lines.forEach((ln, i) => block.rows.push({
          slot: i === 0 ? slot.name : '', kind: slot.id, names: ln,
        }));
      });
      if (!block.rows.length) block.rows.push({ slot: '', kind: '', names: [{ t: '—', me: false }] });
      if (day && day.memo) block.rows.push({ slot: 'メモ', kind: 'memo', names: [{ t: day.memo, me: false }] });
    }
    blocks.push(block);
  });
  return blocks;
}

function drawBuiltImage() {
  const P = BUILT_IMG;
  const probe = document.createElement('canvas').getContext('2d');
  const blocks = builtLayout(probe);

  const headH = 118;
  let H = P.pad + headH;
  blocks.forEach((b) => { H += 44 + b.rows.length * P.lh + P.gap; });
  H += P.pad;

  const canvas = document.createElement('canvas');
  canvas.width = P.w * P.scale;
  canvas.height = Math.round(H) * P.scale;
  const cx = canvas.getContext('2d');
  cx.setTransform(P.scale, 0, 0, P.scale, 0, 0);
  cx.fillStyle = '#ffffff';
  cx.fillRect(0, 0, P.w, H);
  cx.textBaseline = 'middle';

  cx.fillStyle = '#111418';
  cx.font = builtFont(40, true);
  cx.fillText(`${shiftRangeLabel(period.y, period.m, period.half)} のシフト`, P.pad, P.pad + 28);
  cx.fillStyle = '#5b6169';
  cx.font = builtFont(26, false);
  cx.fillText(`${me.name}さん`, P.pad, P.pad + 76);

  let y = P.pad + headH;
  blocks.forEach((b) => {
    cx.fillStyle = b.dow === 0 ? '#c0392b' : b.dow === 6 ? '#33509a' : '#111418';
    cx.font = builtFont(30, true);
    cx.fillText(b.date, P.pad, y + 20);
    y += 44;

    b.rows.forEach((row) => {
      if (row.slot) {
        cx.fillStyle = '#5b6169';
        cx.font = builtFont(25, true);
        cx.fillText(row.slot, P.pad + 8, y + P.lh / 2);
      }
      let x = P.pad + P.slotW;
      row.names.forEach((one) => {
        cx.fillStyle = '#111418';
        cx.font = builtFont(30, one.me);
        cx.fillText(one.t, x, y + P.lh / 2);
        x += cx.measureText(`${one.t}　`).width;
      });
      y += P.lh;
    });

    cx.strokeStyle = '#e2e5e9';
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(P.pad, y + P.gap / 2);
    cx.lineTo(P.w - P.pad, y + P.gap / 2);
    cx.stroke();
    y += P.gap;
  });

  return canvas;
}

/** 絵にして、共有か保存に渡します */
async function saveBuiltImage() {
  if (!built || !period) return;
  const btn = el('builtSave');
  const before = btn.textContent;
  btn.disabled = true;
  btn.textContent = '作っています…';
  try {
    const canvas = drawBuiltImage();
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.95));
    if (!blob) throw new Error('絵が作れませんでした');
    const name = `シフト_${shiftRangeLabel(period.y, period.m, period.half).replace(/[/〜]/g, '-')}.jpg`;
    const file = new File([blob], name, { type: 'image/jpeg' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (e) {
    el('builtSaveNote').textContent = '保存できませんでした。もう一度おためしください。';
  } finally {
    btn.disabled = false;
    btn.textContent = before;
  }
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
  // 光らせるのは1つだけ。立ち上げのときは、対で入るランチ／Fは光らせません
  //   （「立ち上げのあとは？」のほうで見せます）
  const main = mine.some((e) => e.s === 'open') ? 'open' : ((mine[0] || {}).s || '');

  const slots = document.createElement('div');
  slots.className = 'day__slots';
  shiftWishSlots().forEach((slot) => {
    const on = slot.id === main;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `slot slot--${slot.id}` + (on ? ' is-on' : '');
    b.textContent = slot.name;
    b.title = slot.hint;
    b.addEventListener('click', () => toggleSlot(dateStr, slot.id));
    slots.appendChild(b);
  });
  card.appendChild(slots);

  // ★立ち上げを押した人には、そのあとを聞きます。
  //   立ち上げだけ出して帰る人はいないので、ランチだけか通しかを
  //   ここで決めてもらいます（あとから組むときの聞き直しが減ります）
  if (main === 'open') {
    const row = document.createElement('div');
    row.className = 'after';
    const label = document.createElement('span');
    label.className = 'after__label';
    label.textContent = '立ち上げのあとは？';
    row.appendChild(label);

    const btns = document.createElement('div');
    btns.className = 'after__btns';
    [
      { id: 'lunch', name: 'ランチだけ' },
      { id: SHIFT_FULL_ID, name: 'F（通し）' },
    ].forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'after__btn' + (mine.some((e) => e.s === a.id) ? ' is-on' : '');
      b.textContent = a.name;
      b.addEventListener('click', () => setAfterOpen(dateStr, a.id));
      btns.appendChild(b);
    });
    row.appendChild(btns);
    card.appendChild(row);
  }

  // えらんだ枠だけ、開始時刻を出します。
  // F と立ち上げは、こちらで決めるので出しません（askTime: false）
  mine.forEach((entry) => {
    const slot = getShiftSlot(entry.s);
    if (!slot || !slot.times.length || slot.askTime === false) return;
    // ★立ち上げから続けて入る人は、ランチの時刻を聞きません。
    //   10時に来ているので、そのまま続くだけだからです
    if (main === 'open') return;
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

/**
 * その日の枠をえらぶ
 *
 * ★1日にえらべるのは1つだけです。押すと前のえらびは消えます。
 *   立ち上げ・F・ランチ・ディナーは、どれも「その日の入り方」なので、
 *   重ねてえらぶ意味がありません。
 * ★立ち上げだけは、そのあとのランチ／Fと対で持ちます
 *   （立ち上げただけで帰る人はいないため）。
 */
function toggleSlot(dateStr, slotId) {
  const now = picked[dateStr] || [];
  const main = now.some((e) => e.s === 'open') ? 'open' : ((now[0] || {}).s || '');

  if (main === slotId) {          // 同じものをもう一度 → その日は入れない
    delete picked[dateStr];
    renderPeriod();
    return;
  }

  const list = [{ s: slotId, t: shiftDefaultTime(slotId) }];
  // 立ち上げは、いちばん多い「そのままランチ」を先に入れておきます。
  // 通しの人は、下の「F（通し）」を押せば入れかわります
  if (slotId === 'open') list.push({ s: 'lunch', t: shiftDefaultTime('lunch') });

  picked[dateStr] = list;
  renderPeriod();
}

/** 立ち上げのあと、ランチだけか通しかを決める */
function setAfterOpen(dateStr, pickId) {
  picked[dateStr] = [
    { s: 'open', t: shiftDefaultTime('open') },
    { s: pickId, t: shiftDefaultTime(pickId) },
  ];
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
  if (due && phase === 'open') {
    el('doneTitle').textContent += `（${shiftDueLabel(due, DOW)}直せます）`;
  }
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
  el('builtSave').addEventListener('click', saveBuiltImage);
  el('bootRetry').addEventListener('click', () => {
    el('bootText').textContent = '読み込んでいます…';
    el('bootSpin').classList.remove('is-hidden');
    el('bootRetry').classList.add('is-hidden');
    boot();
  });

  // 番号を覚えていない人には、待たせずにすぐ聞きます
  if (!me.code) return show('gate');

  // 覚えているときは、返事が返るまで「読み込んでいます」のままにします。
  // ★ここで番号の画面を出してしまうと、毎回それが一瞬見えて
  //   「また入れるのか」と思わせてしまいます
  show('boot');
  const res = await call({ mode: 'open' });
  if (res.ok) { applyOpen(res); return; }

  // ★番号そのものが違うと言われたときだけ、覚えているものを忘れます。
  //   電波が届かなかっただけで忘れてしまうと、外で開くたびに
  //   番号を入れ直すことになります（それが起きていました）
  if (res.bad) {
    me.code = '';
    localStorage.removeItem(`${SAVE}:code`);
    show('gate');
    setErr('gateErr', res.error || 'もう一度、番号を入れてください');
    return;
  }

  // つながらなかっただけ。番号はそのままにして、やり直せるようにします
  showRetry(res.error || 'つながりませんでした');
}

/** つながらなかったときの画面（番号は覚えたままです） */
function showRetry(message) {
  show('boot');
  el('bootText').textContent = message;
  el('bootSpin').classList.add('is-hidden');
  el('bootRetry').classList.remove('is-hidden');
}

boot();
