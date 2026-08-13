/* ============================================================
 *  配達記録（バグるの交通費）
 *
 *  作り
 *    ・お店ではなく「人」と「月」でまとめます。1件＝1配達です
 *    ・入れるのは片道の距離だけ。往復分（2倍）にして足していきます
 *    ・支払う金額は、1件ごとではなく「その月の合計距離」から出します
 *      （5kmごとに100円・100円未満は切り上げ）
 *
 *  記録の入れ先は  _drive/2026-08  なので、同期の仕組み
 *  （スプレッドシート）はそのまま使えます。設定の追加もいりません。
 *
 *  名前の追加・削除は T3 Works Manage（バグる → 交通費）で行います。
 * ============================================================ */

const pad2 = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

/* 「今日」は業務上の今日。朝6時（APP.dayStartHour）より前は前の日あつかいです。
   夜中に帰ってきて入れても、その日の営業分として入ります */
const today = businessDate();
const TODAY = { y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() };

const state = { y: TODAY.y, m: TODAY.m };

const $ = (id) => document.getElementById(id);
const el = {
  driveLogo: $('driveLogo'),
  driveMonth: $('driveMonth'), driveSummary: $('driveSummary'),
  driveTotalYen: $('driveTotalYen'),
  driveTotalWrap: $('driveTotalWrap'), driveTotals: $('driveTotals'),
  driveFoot: $('driveFoot'), driveList: $('driveList'), driveListHead: $('driveListHead'),
  drivePayoutBtn: $('drivePayoutBtn'), drivePayoutSub: $('drivePayoutSub'),
  driveModal: $('driveModal'), driveError: $('driveError'),
  drvDate: $('drvDate'), drvNames: $('drvNames'),
  drvLegs: $('drvLegs'), drvAddLeg: $('drvAddLeg'), drvHint: $('drvHint'),
  driveFormTitle: $('driveFormTitle'), driveSave: $('driveSave'),
  modal: $('modal'), syncChip: $('syncChip'), syncInfo: $('syncInfo'),
  pinModal: $('pinModal'), pinInput: $('pinInput'), pinError: $('pinError'),
  appVersionText: $('appVersionText'),
  confirmDialog: $('confirmDialog'), confirmItem: $('confirmItem'),
  confirmMessage: $('confirmMessage'), confirmOk: $('confirmOk'),
};

/* 画像の置き場所（drive/ は1つ下の階層なので ../ が付きます） */
const ASSET_BASE = document.body.dataset.assets || '';

/* ヘッダーに出す絵。ホーム画面のアイコンと同じものにして、
   「いま開いているのはこのアプリ」がひと目で分かるようにします */
const DRIVE_ICON = 'img/drive-icon-180.png';

/* ============================================================
 *  記録の読み書き
 * ============================================================ */
/** いま見ている月の記録 */
function driveRec() {
  return Store.getDay(DRIVE_STORE, driveMonthKey(state.y, state.m));
}

/** 1件分の明細だけ取り出す（消したもの＝距離0 は除く） */
function driveEntries(rec) {
  const items = rec.items || {};
  return Object.keys(items)
    .filter((id) => items[id] && Number(items[id].km) > 0)
    .map((id) => ({ id, ...items[id] }))
    .sort((a, b) => (a.d || '').localeCompare(b.d || '') || (a.at || '').localeCompare(b.at || ''));
}

/**
 * 人ごとにまとめる
 *
 * 登録されている人は、記録が無くても行を出します（Numbersの表と同じ）。
 * 名前を消したあとに過去の記録が残っている場合も、下に足して出します。
 */
function driveByPerson(rec) {
  const map = new Map();
  const add = (name) => {
    if (!map.has(name)) map.set(name, { name, list: [], km: 0, yen: 0 });
    return map.get(name);
  };
  Drivers.list().forEach(add);
  driveEntries(rec).forEach((e) => {
    const row = add(e.by || '（名前なし）');
    row.list.push(e);
    row.km = driveKm(row.km, e.km);
  });
  map.forEach((row) => { row.yen = driveYen(row.km); });
  return [...map.values()];
}

/**
 * その人の記録を「日ごと」にまとめる
 *
 * 1日に何回も配達に行くので、一覧は1日1行にして、
 * その日の合計距離を出します。中身（1回ずつの距離）は
 * 「編集」を押したときにまとめて開きます。
 */
function driveByDay(list) {
  const map = new Map();
  list.forEach((e) => {
    if (!map.has(e.d)) map.set(e.d, { d: e.d, by: e.by, list: [] });
    map.get(e.d).list.push(e);
  });
  return [...map.values()].map((g) => ({ ...g, km: driveKm(...g.list.map((e) => e.km)) }));
}

function kmText(km) {
  return (Math.round((Number(km) || 0) * 10) / 10).toFixed(1) + 'km';
}

function yenText(n) {
  return '¥' + (Number(n) || 0).toLocaleString('ja-JP');
}

/* ============================================================
 *  画面
 * ============================================================ */
function render() {
  const rec = driveRec();
  const people = driveByPerson(rec);
  const ran = people.filter((p) => p.list.length);
  const totalKm = driveKm(...people.map((p) => p.km));
  // 金額は人ごとに出したものを足します
  // （全員分の距離をまとめてから計算すると、切り上げが1回だけになり合いません）
  const totalYen = people.reduce((t, p) => t + p.yen, 0);

  const count = ran.reduce((n, p) => n + p.list.length, 0);
  el.driveMonth.textContent = `${state.y}年${state.m}月`;
  el.driveTotalYen.textContent = yenText(totalYen);
  el.driveSummary.textContent = ran.length
    ? `${kmText(totalKm)}　${ran.length}人が配達　${count}回`
    : 'この月の記録はまだありません';

  /* ---- 上の表：名前・合計距離・合計金額 ---- */
  // いちばん走っている人を基準に、名前の下の帯の長さを決めます
  const maxKm = Math.max(...people.map((p) => p.km), 0);
  el.driveTotals.innerHTML = '';
  people.forEach((p) => {
    const tr = document.createElement('tr');
    if (!p.list.length) tr.className = 'is-zero';   // 走っていない人は色を落とす

    const name = document.createElement('td');
    name.className = 'exp-total__name';
    name.textContent = p.name;
    if (p.km > 0 && maxKm > 0) {
      const bar = document.createElement('span');
      bar.className = 'drive-table__bar';
      // 8%〜72% の幅。いちばん短い人でも見えるように下限を付けています
      bar.style.width = `${8 + (p.km / maxKm) * 64}%`;
      name.appendChild(bar);
    }

    // 走っていない人も 0.0km / ¥0 で出します（Numbers の表と同じ見え方）
    const km = document.createElement('td');
    km.className = 'exp-total__yen';
    km.textContent = kmText(p.km);

    const yen = document.createElement('td');
    yen.className = 'exp-total__yen';
    yen.textContent = yenText(p.yen);

    tr.append(name, km, yen);
    el.driveTotals.appendChild(tr);
  });

  el.driveFoot.innerHTML = '';
  if (ran.length) {
    const tr = document.createElement('tr');
    tr.className = 'drive-foot';
    const name = document.createElement('td');
    name.className = 'exp-total__name';
    name.textContent = '合計';
    const km = document.createElement('td');
    km.className = 'exp-total__yen';
    km.textContent = kmText(totalKm);
    const yen = document.createElement('td');
    yen.className = 'exp-total__yen';
    yen.textContent = yenText(totalYen);
    tr.append(name, km, yen);
    el.driveFoot.appendChild(tr);
  }

  /* 支払いリストのボタン。記録がある月にだけ出します。
     月末・月初は「出す時期です」と添えて目立たせます */
  el.drivePayoutBtn.classList.toggle('is-hidden', !ran.length);
  const nowPayout = Payout.isPayoutTime(state.y, state.m);
  el.drivePayoutBtn.classList.toggle('is-now', nowPayout);
  el.drivePayoutSub.textContent = nowPayout
    ? 'そろそろ支払いの時期です。名前と金額をまとめた1枚（JPEG）'
    : '名前と金額をまとめた1枚（JPEG）';

  /* ---- 下：人ごとの明細（走った人だけ） ---- */
  el.driveListHead.classList.toggle('is-hidden', !ran.length);
  el.driveList.innerHTML = '';
  ran.forEach((p) => {
    const card = document.createElement('section');
    card.className = 'exp-card exp-card--drive';

    const head = document.createElement('div');
    head.className = 'exp-card__head';
    head.innerHTML =
      '<span class="exp-card__name"></span>' +
      `<span class="drive-card__count">${p.list.length}回</span>` +
      `<span class="exp-card__total">${kmText(p.km)}　${yenText(p.yen)}</span>`;
    head.querySelector('.exp-card__name').textContent = p.name;
    card.appendChild(head);

    const list = document.createElement('ul');
    list.className = 'exp-rows';
    // 1日に何回行っても1行。出すのはその日の合計距離です
    driveByDay(p.list).forEach((g) => {
      const li = document.createElement('li');
      li.className = 'exp-row';
      const [, m, d] = (g.d || '').split('-');
      li.innerHTML =
        `<span class="exp-row__date">${m ? `${+m}/${+d}` : '—'}</span>` +
        // 2回以上行った日だけ、回数を出します
        (g.list.length > 1 ? `<span class="drive-row__times">${g.list.length}回</span>` : '') +
        `<span class="exp-row__yen drive-row__km">${kmText(g.km)}</span>`;

      // 入れ間違いは後から直せます（消してから入れ直す必要はありません）
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'row-edit';
      edit.textContent = '編集';
      edit.title = g.list.length > 1 ? 'この日の記録をまとめて直す' : 'この記録を直す';
      edit.addEventListener('click', () => openForm(g));
      li.appendChild(edit);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'exp-row__del';
      del.textContent = '×';
      del.title = g.list.length > 1 ? 'この日の記録をまとめて消す' : 'この記録を消す';
      del.addEventListener('click', () => removeDay(g));
      li.appendChild(del);

      list.appendChild(li);
    });
    card.appendChild(list);
    el.driveList.appendChild(card);
  });

  renderSyncStatus();
}

/**
 * 月末・月初に配る「誰にいくら払うか」の1枚を作る
 *
 * 走った人だけを載せます（0円の人は支払いが無いため）。
 * 距離も入れておくと、金額の根拠がその場で分かります。
 */
function makeDrivePayout() {
  const people = driveByPerson(driveRec()).filter((p) => p.list.length);
  if (!people.length) return;

  const totalKm = driveKm(...people.map((p) => p.km));
  const totalYen = people.reduce((t, p) => t + p.yen, 0);

  const canvas = Payout.make({
    title: `${state.y}年${state.m}月分　交通費`,
    subtitle: 'バグる｜配達に行った分（T3Dining株式会社）',
    head: ['名前', '走った距離', '支払う金額'],
    align: ['left', 'right', 'right'],
    rows: people.map((p) => [p.name, kmText(p.km), yenText(p.yen)]),
    total: ['合計', kmText(totalKm), yenText(totalYen)],
    note: `※ 距離は往復分。${DRIVE_RATE.km}kmごとに${DRIVE_RATE.yen}円、100円未満は切り上げ`,
    accent: '#bf5480',
  });
  Payout.show(canvas, `${state.y}-${pad2(state.m)}_交通費_バグる.jpg`);
}

/** その日の記録をまとめて消す（1回だけの日は、その1件を消します） */
async function removeDay(g) {
  const [, m, d] = (g.d || '').split('-');
  const times = g.list.length > 1 ? `${g.list.length}回 ` : '';
  const ok = await askConfirm({
    item: `${g.by || ''}　${+m}/${+d}　${times}往復 ${kmText(g.km)}`,
    message: g.list.length > 1
      ? 'この日の記録をまとめて消します。よろしいですか？'
      : 'この記録を消します。よろしいですか？',
    okLabel: '消す',
    danger: true,
  });
  if (!ok) return;
  // 距離を0にすると一覧から外れます（消したことも同期で全端末に伝わります）
  const key = driveMonthKey(state.y, state.m);
  g.list.forEach((e) => {
    Store.setItem(DRIVE_STORE, key, e.id, { km: 0, one: 0, done: false });
  });
  render();
}

/* ============================================================
 *  入力画面
 *
 *  新しく入れるとき
 *    1日に何回も配達に行くので、距離の欄は増やせるようにしています。
 *    「＋ もう1回分入れる」で欄が1つ増え、入れた分はそのまま残ります。
 *    記録するときは、1つの欄＝1件として別々に残します。
 *
 *  すでに入れたものを直すとき（一覧の「編集」）
 *    その日の記録をまとめて開きます。3回行った日なら欄が3つ並び、
 *    1回ずつ直せます。欄を増やして4回目を足すこともできます。
 *    保存すると同じ番号に上書きするので、二重にはなりません。
 * ============================================================ */
let drvName = '';
let drvEditing = null;   // 直しているとき、その日のかたまり（新しく入れるときは null）

/** 日のかたまりを渡すと「直す」画面、渡さなければ「新しく入れる」画面 */
function openForm(group) {
  drvEditing = group || null;
  el.driveError.textContent = '';
  el.drvDate.value = drvEditing ? drvEditing.d : ymd(TODAY.y, TODAY.m, TODAY.d);
  drvName = drvEditing ? (drvEditing.by || '') : '';

  el.drvNames.innerHTML = '';
  // 名前リストから消された人の記録を直すときも、その名前を残しておきます
  const names = Drivers.list();
  if (drvName && !names.includes(drvName)) names.push(drvName);
  names.forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'doer-btn';
    b.dataset.name = name;
    b.textContent = name;
    b.addEventListener('click', () => { drvName = name; renderForm(); });
    el.drvNames.appendChild(b);
  });

  /* 距離の欄。直すときは、その日に入れた回数だけ並べます */
  el.drvLegs.innerHTML = '';
  if (drvEditing) {
    drvEditing.list.forEach((e) => {
      addLeg(false, e.id).value = e.one || driveKm(e.km / 2);
    });
  } else {
    addLeg();
  }

  el.driveFormTitle.textContent = drvEditing ? '記録を直す' : '片道の距離を入れる';
  el.driveSave.textContent = drvEditing ? '直す' : '記録する';

  renderForm();
  el.driveModal.classList.remove('is-hidden');
}

/**
 * 距離の欄を1つ増やす
 *
 * id を渡すと「すでに入れてある記録の欄」になります。
 * その欄を直せば同じ記録が書き換わり、×で消せばその記録だけ消えます。
 */
function addLeg(focus, id) {
  const row = document.createElement('div');
  row.className = 'drive-leg';
  if (id) row.dataset.id = id;

  const num = document.createElement('span');
  num.className = 'drive-leg__no';

  // type="number" にすると全角数字（１２．６）を弾いて空にしてしまうので、
  // text にしておいて bindNumericInput で半角に直します
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'field__input drive-leg__input';
  input.inputMode = 'decimal';
  input.autocomplete = 'off';
  input.placeholder = '6.2';
  bindNumericInput(input);
  input.addEventListener('input', renderForm);

  // その場で「往復 12.4km」と出して、入れたのが片道だと分かるようにします
  const round = document.createElement('span');
  round.className = 'drive-leg__round';

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'drive-leg__del';
  del.textContent = '×';
  del.title = 'この欄を消す';
  del.addEventListener('click', () => {
    // 最後の1つは消さずに空にします（欄がなくなると入れられなくなるため）
    if (el.drvLegs.children.length > 1) row.remove();
    else input.value = '';
    renderForm();
  });

  row.append(num, input, round, del);
  el.drvLegs.appendChild(row);
  if (focus) input.focus();
  return input;
}

/** いま欄に入っているもの（0より大きいものだけ）。id は元の記録の番号 */
function legValues() {
  return [...el.drvLegs.children]
    .map((row) => ({
      id: row.dataset.id || '',
      // 全角で入っていても読めるよう、半角に直してから数字にします
      one: Number(toHalfWidthNumber(row.querySelector('.drive-leg__input').value)),
    }))
    .filter((r) => r.one > 0);
}

/** えらんだ名前と、入れた距離の往復分を出します */
function renderForm() {
  [...el.drvNames.children].forEach((b) => b.classList.toggle('is-current', b.dataset.name === drvName));

  // 何回目かの番号を振り直し、その行の往復距離も出し直す
  [...el.drvLegs.children].forEach((row, i) => {
    row.querySelector('.drive-leg__no').textContent = `${i + 1}回目`;
    const one = Number(toHalfWidthNumber(row.querySelector('.drive-leg__input').value));
    row.querySelector('.drive-leg__round').textContent =
      one > 0 ? `往復 ${kmText(driveRound(one))}` : '';
  });
  // 欄が1つだけのときは消すボタンを出さない
  el.drvLegs.classList.toggle('is-single', el.drvLegs.children.length === 1);

  const list = legValues();
  const total = driveKm(...list.map((r) => driveRound(r.one)));
  if (!list.length) el.drvHint.textContent = '1回目の片道の距離を入れてください';
  else if (drvEditing) el.drvHint.textContent = `この日は ${list.length}回 ／ 往復 合計 ${kmText(total)} に直します`;
  else el.drvHint.textContent = `${list.length}回分 ／ 往復 合計 ${kmText(total)} として記録します`;
  el.drvHint.classList.toggle('is-on', list.length > 0);
}

function saveEntry() {
  const d = el.drvDate.value;
  const list = legValues();

  if (!d) { el.driveError.textContent = '走った日を入れてください。'; return; }
  if (!drvName) { el.driveError.textContent = '名前をえらんでください。'; return; }
  if (!list.length) { el.driveError.textContent = '片道の距離を入れてください。'; return; }
  if (list.some((r) => r.one > 200)) {
    el.driveError.textContent = '片道200kmを超えています。入れ間違いではありませんか？';
    return;
  }

  // 入れ先は「走った日の月」。前の月分を入れても、正しい月に入ります
  const [yy, mm] = d.split('-').map(Number);
  const key = driveMonthKey(yy, mm);
  const newId = (i) => 'd' + Date.now().toString(36) + i + Math.random().toString(36).slice(2, 6);

  if (drvEditing) {
    const from = driveMonthKey(state.y, state.m);
    const moved = from !== key;               // 日付を別の月へ動かしたか
    const keep = new Set(list.map((r) => r.id).filter(Boolean));

    // 欄から消したもの（と、別の月へ移すもの）を、元の月から取り除きます
    drvEditing.list.forEach((e) => {
      if (moved || !keep.has(e.id)) {
        Store.setItem(DRIVE_STORE, from, e.id, { km: 0, one: 0, done: false });
      }
    });
  }

  // 元からある欄は同じ番号に上書き、足した欄は新しい番号で入れます
  list.forEach((r, i) => {
    Store.setItem(DRIVE_STORE, key, r.id || newId(i), {
      done: true,
      d,
      by: drvName,
      one: driveKm(r.one),
      km: driveRound(r.one),
    });
  });

  state.y = yy;
  state.m = mm;
  el.driveModal.classList.add('is-hidden');
  render();
}

/* ============================================================
 *  月送り
 * ============================================================ */
function shiftMonth(diff) {
  const m = state.m + diff;
  if (m < 1) { state.y--; state.m = 12; }
  else if (m > 12) { state.y++; state.m = 1; }
  else state.m = m;
  render();
}

/* ============================================================
 *  確認ダイアログ
 * ============================================================ */
let confirmResolve = null;

function askConfirm({ item, message, okLabel, danger }) {
  el.confirmItem.textContent = item || '';
  el.confirmMessage.textContent = message || '';
  el.confirmOk.textContent = okLabel || 'はい';
  el.confirmOk.classList.toggle('btn--danger', !!danger);
  el.confirmDialog.classList.remove('is-hidden');
  setTimeout(() => el.confirmOk.focus(), 50);

  return new Promise((resolve) => { confirmResolve = resolve; });
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
    el.syncChip.className = 'sync-chip sync-chip--' + st.kind;
    el.syncChip.innerHTML = Sync.iconSvg(st.kind);
    el.syncChip.title = st.text + '（タップで今すぐ同期）';
    el.syncChip.setAttribute('aria-label', '同期の状態：' + st.text);
  }

  if (Sync.enabled()) {
    const n = Sync.outbox().length;
    const t = Sync.lastSyncAt;
    const at = t ? `（最終同期 ${t.getHours()}:${pad2(t.getMinutes())}）` : '';
    el.syncInfo.textContent = Sync.lastError
      ? `${Sync.lastError}（未送信 ${n}件。つながり次第、自動で送られます）`
      : n
        ? `未送信 ${n}件。まもなく送信されます。${at}`
        : `みんなの端末と同期できています。${at}`;
  } else {
    el.syncInfo.textContent = 'この端末の中だけで動いています。';
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
 *  イベント登録
 * ============================================================ */
function bindEvents() {
  $('drivePrev').addEventListener('click', () => shiftMonth(-1));
  $('driveNext').addEventListener('click', () => shiftMonth(1));
  $('driveThisMonth').addEventListener('click', () => {
    state.y = TODAY.y; state.m = TODAY.m; render();
  });

  $('driveAddBtn').addEventListener('click', () => openForm());
  el.drivePayoutBtn.addEventListener('click', makeDrivePayout);
  el.driveSave.addEventListener('click', saveEntry);
  el.drvAddLeg.addEventListener('click', () => { addLeg(true); renderForm(); });
  document.querySelectorAll('[data-close-drive]').forEach((n) => {
    n.addEventListener('click', () => el.driveModal.classList.add('is-hidden'));
  });

  /* 確認ダイアログ */
  el.confirmOk.addEventListener('click', () => closeConfirm(true));
  document.querySelectorAll('[data-confirm-cancel]').forEach((n) => {
    n.addEventListener('click', () => closeConfirm(false));
  });

  /* 設定 */
  $('settingsBtn').addEventListener('click', () => {
    renderSyncStatus();
    const v = Updater.current();
    el.appVersionText.innerHTML = v
      ? `いま入っているのは <b>${v}</b> です。`
      : '（手元で開いているため、版の番号はありません）';
    el.modal.classList.remove('is-hidden');
  });
  document.querySelectorAll('[data-close]').forEach((n) => {
    n.addEventListener('click', () => el.modal.classList.add('is-hidden'));
  });
  $('syncNow').addEventListener('click', () => Sync.flush());
  $('pinChange').addEventListener('click', () => {
    el.modal.classList.add('is-hidden');
    openPinModal();
  });
  $('forceUpdate').addEventListener('click', () => Updater.force());

  /* PIN */
  $('pinOk').addEventListener('click', submitPin);
  $('pinReveal').addEventListener('click', () => {
    const show = el.pinInput.type === 'password';
    el.pinInput.type = show ? 'text' : 'password';
    $('pinReveal').textContent = show ? '隠す' : '表示';
  });
  el.pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPin(); });
  bindHalfWidthInput(el.pinInput, 'code');

  el.syncChip.addEventListener('click', () => Sync.flush());

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeConfirm(false);
    el.driveModal.classList.add('is-hidden');
    el.modal.classList.add('is-hidden');
  });
}

/* ============================================================
 *  起動
 * ============================================================ */
(function init() {
  /* ヘッダーの絵はホーム画面のアイコンと同じもの */
  const shop = getStore(DRIVE_SHOP);
  const img = document.createElement('img');
  img.alt = '配達記録';
  img.addEventListener('error', () => {
    el.driveLogo.classList.add('is-fallback');
    img.remove();
  });
  img.src = ASSET_BASE + DRIVE_ICON;
  el.driveLogo.appendChild(img);
  if (shop) el.driveLogo.style.setProperty('--chip-color', shop.color);

  bindEvents();
  render();

  Updater.start();
  Sync.onChange = renderSyncStatus;
  if (Sync.enabled()) {
    if (!Sync.pin()) openPinModal();
    else Sync.start();
  }
})();
