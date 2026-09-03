/* ============================================================
 *  データ保存レイヤー
 *
 *  いまは端末内（localStorage）に保存します。
 *  将来「社内全員で共有」する場合は、この LocalAdapter と同じ
 *  メソッドを持つアダプタ（例: GasAdapter / FirebaseAdapter）を
 *  追加して Store.adapter を差し替えるだけで済むようにしています。
 *
 *  データの形
 *    レコードキー : storeId + '/' + 'YYYY-MM-DD'
 *    レコード     : {
 *      staff: 'その日の担当者',
 *      items: { 項目id: { done: true/false, value: '', at: ISO日時 } },
 *      note:  '申し送り・気付き',
 *      submittedAt: ISO日時 または null,   // 提出したら入る
 *      submittedBy: '提出した担当者',
 *      updatedAt: ISO日時,
 *      updatedBy: '名前'
 *    }
 * ============================================================ */

const LocalAdapter = {
  _all() {
    try {
      return JSON.parse(localStorage.getItem(APP.storageKey) || '{}');
    } catch (e) {
      console.warn('保存データの読み込みに失敗しました', e);
      return {};
    }
  },
  _save(all) {
    localStorage.setItem(APP.storageKey, JSON.stringify(all));
  },
  get(key) {
    return this._all()[key] || null;
  },
  set(key, record) {
    const all = this._all();
    all[key] = record;
    this._save(all);
  },
  /** storeId + 年月('YYYY-MM') に含まれる全レコードを取得 */
  getMonth(storeId, ym) {
    const all = this._all();
    const prefix = `${storeId}/${ym}-`;
    const out = {};
    Object.keys(all).forEach((k) => {
      if (k.startsWith(prefix)) out[k.slice(prefix.length)] = all[k]; // 'DD' 部分
    });
    return out;
  },
  dump() {
    return this._all();
  },
  load(obj) {
    this._save(obj);
  },
};

const Store = {
  adapter: LocalAdapter,

  key(storeId, dateStr) {
    return `${storeId}/${dateStr}`;
  },

  /** 1日分のレコードを取得（無ければ空レコード） */
  getDay(storeId, dateStr) {
    const rec = this.adapter.get(this.key(storeId, dateStr));
    if (!rec) {
      return { staff: '', items: {}, note: '', submittedAt: null, submittedBy: '', updatedAt: null, updatedBy: '' };
    }
    if (rec.staff === undefined) rec.staff = '';
    if (rec.submittedAt === undefined) rec.submittedAt = null;
    return rec;
  },

  /** 提出する */
  submit(storeId, dateStr) {
    const rec = this.getDay(storeId, dateStr);
    const now = new Date().toISOString();
    rec.submittedAt = now;
    rec.submittedBy = rec.staff || '';
    rec.updatedAt = now;
    rec.updatedBy = rec.submittedBy;
    this.adapter.set(this.key(storeId, dateStr), rec);
    return rec;
  },

  /** 提出を取り消す */
  unsubmit(storeId, dateStr) {
    const rec = this.getDay(storeId, dateStr);
    if (!rec.submittedAt) return rec;
    rec.submittedAt = null;
    rec.submittedBy = '';
    rec.updatedAt = new Date().toISOString();
    rec.updatedBy = rec.staff || '';
    this.adapter.set(this.key(storeId, dateStr), rec);
    return rec;
  },

  /** その日の担当者を設定 */
  setStaff(storeId, dateStr, name) {
    const rec = this.getDay(storeId, dateStr);
    rec.staff = name;
    rec.updatedAt = new Date().toISOString();
    rec.updatedBy = name;
    this.adapter.set(this.key(storeId, dateStr), rec);
  },

  /** 1項目を更新（担当者はその日の担当者を使うので項目ごとには持たない） */
  setItem(storeId, dateStr, itemId, patch) {
    const rec = this.getDay(storeId, dateStr);
    const cur = rec.items[itemId] || { done: false, value: '', at: null };
    const next = { ...cur, ...patch };
    if (patch.done !== undefined) {
      next.at = patch.done ? new Date().toISOString() : null;
    }
    rec.items[itemId] = next;
    rec.updatedAt = new Date().toISOString();
    rec.updatedBy = rec.staff || '';
    this.adapter.set(this.key(storeId, dateStr), rec);
    return next;
  },

  /** 申し送りメモを更新 */
  setNote(storeId, dateStr, note) {
    const rec = this.getDay(storeId, dateStr);
    rec.note = note;
    rec.updatedAt = new Date().toISOString();
    rec.updatedBy = rec.staff || '';
    this.adapter.set(this.key(storeId, dateStr), rec);
  },

  /** 月内の日別レコード { 'DD': record } */
  getMonth(storeId, ym) {
    return this.adapter.getMonth(storeId, ym);
  },

  /** その店舗で最初に記録がある日付（'YYYY-MM-DD'）。無ければ null
   *  週間掃除の記録（storeId/W2026-08-02）は日付ではないので除きます */
  firstDate(storeId) {
    const prefix = `${storeId}/`;
    const dates = Object.keys(this.adapter.dump())
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length))
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    return dates[0] || null;
  },

  /* -------- バックアップ -------- */
  exportJson() {
    return JSON.stringify(
      { app: APP.storageKey, exportedAt: new Date().toISOString(), data: this.adapter.dump() },
      null,
      2
    );
  },
  importJson(text) {
    const parsed = JSON.parse(text);
    const data = parsed.data || parsed;
    if (typeof data !== 'object' || Array.isArray(data)) throw new Error('形式が違います');
    // 既存データにマージ（同じ日付は取り込み側を優先）
    const merged = { ...this.adapter.dump(), ...data };
    this.adapter.load(merged);
  },
};

/* ============================================================
 *  定休日の設定
 *
 *  2段構え：
 *    1) 曜日の定休日   … 店舗ごとに「毎週◯曜が休み」（設定画面で変更可）
 *    2) 個別の日の例外 … 「この日だけ営業する」「この日は休業する」
 *                        年末年始のような臨時休業もこちら
 *  例外は曜日の設定より優先されます。
 * ============================================================ */
const Closed = {
  _dowsKey: APP.storageKey + ':closedDows',
  _exKey: APP.storageKey + ':closedExceptions',

  _read(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '{}');
      return v && typeof v === 'object' ? v : {};
    } catch (e) {
      return {};
    }
  },
  _write(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
  },

  /* -------- 1) 曜日の定休日 -------- */
  /** 設定画面で変えていればそれを、なければ config.js の初期値を使う */
  dows(storeId) {
    const saved = this._read(this._dowsKey)[storeId];
    if (Array.isArray(saved)) return saved;
    return (getStore(storeId).closedDays || []).slice();
  },
  setDows(storeId, dows) {
    const all = this._read(this._dowsKey);
    all[storeId] = [...dows].sort();
    this._write(this._dowsKey, all);
  },

  /* -------- 2) 個別の日の例外 -------- */
  /** { 'YYYY-MM-DD': 'open' | 'closed' } */
  exceptions(storeId) {
    return this._read(this._exKey)[storeId] || {};
  },
  exceptionOn(storeId, dateStr) {
    return this.exceptions(storeId)[dateStr] || null;
  },
  /** kind に null を渡すと例外を取り消して曜日の設定に戻す */
  setException(storeId, dateStr, kind) {
    const all = this._read(this._exKey);
    const mine = { ...(all[storeId] || {}) };
    if (kind === 'open' || kind === 'closed') mine[dateStr] = kind;
    else delete mine[dateStr];
    all[storeId] = mine;
    this._write(this._exKey, all);
  },

  /* -------- 判定 -------- */
  isClosed(storeId, y, m, d) {
    const p2 = (n) => String(n).padStart(2, '0');
    const ex = this.exceptionOn(storeId, `${y}-${p2(m)}-${p2(d)}`);
    if (ex === 'open') return false;
    if (ex === 'closed') return true;
    return this.dows(storeId).includes(new Date(y, m - 1, d).getDay());
  },
};

/* -------- チェック項目（管理アプリで変更し、全端末へ配られます） --------
 *
 *  項目には「いつから」「いつまで」を持たせています。
 *    addedAt   … この日から出す（過去の日にはさかのぼって出しません）
 *    retiredAt … この日から出さない（それより前の日には残ります）
 *  こうすることで、項目を足しても過去が確認漏れ扱いにならず、
 *  項目を消しても過去の記録は当時のまま残ります。
 */
const Checklists = {
  _key: APP.storageKey + ':checklists',

  _read() {
    try {
      const v = JSON.parse(localStorage.getItem(this._key) || 'null');
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch (e) {
      return {};
    }
  },

  /** 保存されている全店舗分。管理アプリの一括保存で使います */
  all() {
    return this._read();
  },

  /** その店舗の区分と項目。未設定なら config.js の初期値を使う */
  sections(storeId) {
    const saved = this._read()[storeId];
    if (Array.isArray(saved) && saved.length) return saved;
    return defaultChecklist(storeId);
  },

  /** まだ一度も編集されていない（config.js の初期値のまま）かどうか */
  isDefault(storeId) {
    const saved = this._read()[storeId];
    return !(Array.isArray(saved) && saved.length);
  },

  save(storeId, sections) {
    const all = this._read();
    all[storeId] = sections;
    localStorage.setItem(this._key, JSON.stringify(all));
    return all;
  },
};

/* -------- 週間掃除の項目（こちらも管理アプリで変更し、全端末へ配られます） --------
 *
 *  毎日のチェック項目（Checklists）と同じ考え方ですが、
 *  区分はなく、ただの項目の並びです。
 *  「項目を1つも置かない」設定もできるよう、空の配列も設定済みとして扱います。
 */
const Weeklies = {
  _key: APP.storageKey + ':weeklies',

  _read() {
    try {
      const v = JSON.parse(localStorage.getItem(this._key) || 'null');
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch (e) {
      return {};
    }
  },

  /** 保存されている全店舗分。管理アプリの一括保存で使います */
  all() {
    return this._read();
  },

  /** その店舗の項目。未設定なら config.js の初期値を使う */
  items(storeId) {
    const saved = this._read()[storeId];
    if (Array.isArray(saved)) return saved;
    return defaultWeekly(storeId);
  },

  /** まだ一度も編集されていない（config.js の初期値のまま）かどうか */
  isDefault(storeId) {
    return !Array.isArray(this._read()[storeId]);
  },

  save(storeId, items) {
    const all = this._read();
    all[storeId] = items;
    localStorage.setItem(this._key, JSON.stringify(all));
    return all;
  },
};

/* -------- 教育の項目（マネージで変更し、全端末へ配られます） --------
 *
 *  クローズのチェック項目（Checklists）とまったく同じ形です。
 *  未設定の店舗は config.js の初期値を使います。
 * ---------------------------------------------------------- */
const Trainings = {
  _key: APP.storageKey + ':trainings',

  _read() {
    try {
      const v = JSON.parse(localStorage.getItem(this._key) || 'null');
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch (e) {
      return {};
    }
  },

  /** 保存されている全店舗分。管理アプリの一括保存で使います */
  all() {
    return this._read();
  },

  /** その店舗の区分と項目。未設定なら config.js の初期値を使う */
  sections(storeId) {
    const saved = this._read()[storeId];
    if (Array.isArray(saved)) return saved;
    return defaultTraining(storeId);
  },

  /** まだ一度も編集されていない（config.js の初期値のまま）かどうか */
  isDefault(storeId) {
    return !Array.isArray(this._read()[storeId]);
  },

  save(storeId, sections) {
    const all = this._read();
    all[storeId] = sections;
    localStorage.setItem(this._key, JSON.stringify(all));
    return all;
  },
};

/* -------- 教育を受ける人（店舗ごと） --------
 *
 *  ★管理用PINは要りません。名前を足すのは各店舗なので、
 *    現場のアプリ（ワークス）からも入れられるようにしてあります。
 *  ★1人1人に id を振ります。名前を直しても、それまでの進み具合が
 *    そのまま続くようにするためです。
 * ---------------------------------------------------------- */
const Trainees = {
  _key: APP.storageKey + ':trainees',

  /** { 店舗id: [{ id, n: 名前, at: 入れた日 }] } をまるごと返します */
  all() {
    try {
      const saved = JSON.parse(localStorage.getItem(this._key) || 'null');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        const out = {};
        Object.keys(saved).forEach((store) => {
          out[store] = (saved[store] || [])
            .map((v) => ({ id: String(v.id || ''), n: String(v.n || ''), at: v.at || '' }))
            .filter((v) => v.id && v.n);
        });
        return out;
      }
    } catch (e) {
      /* 壊れていたら空に戻す */
    }
    return {};
  },

  /** その店舗の人（登録した順） */
  list(storeId) {
    return (this.all()[storeId] || []).slice();
  },

  save(storeId, people) {
    const all = this.all();
    all[storeId] = people;
    localStorage.setItem(this._key, JSON.stringify(all));
    return all;
  },

  /** 1人足す。同じ名前がすでにあれば足しません */
  add(storeId, name) {
    const clean = String(name || '').trim();
    if (!clean) return null;
    const people = this.list(storeId);
    if (people.some((p) => p.n === clean)) return null;
    const person = { id: newTraineeId(), n: clean, at: new Date().toISOString() };
    people.push(person);
    this.save(storeId, people);
    return person;
  },

  /** 名前を直す（進み具合はそのまま続きます） */
  rename(storeId, id, name) {
    const clean = String(name || '').trim();
    if (!clean) return;
    const people = this.list(storeId);
    const one = people.find((p) => p.id === id);
    if (!one) return;
    one.n = clean;
    this.save(storeId, people);
  },

  /** 一覧から外す（記録そのものは消えません） */
  remove(storeId, id) {
    this.save(storeId, this.list(storeId).filter((p) => p.id !== id));
  },
};

/** 人の id。名前を直しても進み具合が続くように、名前とは別に持ちます */
function newTraineeId() {
  return 'tp-' + Math.random().toString(36).slice(2, 9);
}

/* -------- 担当者リスト（プルダウンの選択肢） -------- */
const Staff = {
  _key: APP.storageKey + ':staffList',

  /** 設定で保存されたリスト。未設定・空・壊れている場合は config.js の STAFF を使う */
  list() {
    try {
      const saved = JSON.parse(localStorage.getItem(this._key) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) {
      /* 壊れていたら初期値に戻す */
    }
    return STAFF.slice();
  },

  /** 改行区切りの文字列から保存（空行と重複は除く） */
  saveFromText(text) {
    const names = [];
    text.split('\n').forEach((line) => {
      const name = line.trim();
      if (name && !names.includes(name)) names.push(name);
    });
    localStorage.setItem(this._key, JSON.stringify(names));
    return names;
  },
};

/* -------- キャッチをする人のリスト --------
 *
 *  現金支払い管理表で「キャッチ」を選んだときの、
 *  「誰に渡したか」のプルダウンです。全店舗で共通で、マネージで編集します。
 *  名前を消しても、過去に入れた記録はその名前のまま残ります。
 */
const CatchStaff = {
  _key: APP.storageKey + ':catchStaff',

  /** { 店舗id: [名前] } をまるごと返します */
  all() {
    try {
      const saved = JSON.parse(localStorage.getItem(this._key) || 'null');
      // 前は全店舗ひとまとめの配列でした。そのときの分は、そのまま全店舗の人として扱います
      if (Array.isArray(saved)) {
        const map = {};
        if (saved.length) pickableStores().forEach((s) => { map[s.id] = saved.slice(); });
        return map;
      }
      if (saved && typeof saved === 'object') return saved;
    } catch (e) {
      /* 壊れていたら初期値に戻す */
    }
    return { ...CATCH_STAFF };
  },

  /** その店舗の人。店舗を指定しなければ、全店舗をつないだ一覧（重複なし） */
  list(storeId) {
    const map = this.all();
    if (storeId) return (map[storeId] || []).slice();
    const out = [];
    pickableStores().forEach((s) => (map[s.id] || []).forEach((n) => {
      if (!out.includes(n)) out.push(n);
    }));
    return out;
  },

  /** 何人登録されているか（重複は1人と数えます） */
  count() { return this.list().length; },

  save(map) {
    const clean = {};
    Object.keys(map || {}).forEach((id) => {
      const names = [];
      (map[id] || []).forEach((n) => {
        const name = String(n).trim();
        if (name && !names.includes(name)) names.push(name);
      });
      if (names.length) clean[id] = names;
    });
    localStorage.setItem(this._key, JSON.stringify(clean));
    return clean;
  },

  /** 1店舗分を、改行区切りの文字列から保存 */
  saveFromText(storeId, text) {
    const map = this.all();
    map[storeId] = String(text || '').split('\n');
    return this.save(map);
  },
};

/* -------- シフトに入るアルバイトの名簿 --------
 *
 *  クローズの担当者（Staff＝社員）とも、キャッチをする人（CatchStaff）とも
 *  別物です。同じ人が入っていてもかまいません。
 *  マネージの「シフト」で、店舗ごとに登録します。
 *
 *  ここに登録した人だけが、提出ページの名前選びに出ます。
 *  名前を消しても、組みおわったシフトはその名前のまま残ります
 *  （記録の中に名前を書き写しているため）。
 */
const ShiftStaff = {
  _key: APP.storageKey + ':shiftStaff',

  /**
   * { 店舗id: [{ n: 名前, c: 番号, s: 送りずみか, p: 持ち場 }] } をまるごと返します
   *
   * 名前だけの配列で入っていた時期のものは、番号なしとして読みます
   * （保存し直すと番号が振られます）。
   * p（持ち場）は 'k'（キッチン）か 'h'（ホール）。決めていなければ空です。
   */
  all() {
    try {
      const saved = JSON.parse(localStorage.getItem(this._key) || 'null');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        const out = {};
        Object.keys(saved).forEach((id) => {
          out[id] = (saved[id] || []).map((v) => (
            typeof v === 'string'
              ? { n: v, c: '', s: false, p: '' }
              : {
                n: String(v.n || ''), c: String(v.c || ''), s: !!v.s,
                p: SHIFT_LANES.some((l) => l.id === v.p) ? v.p : '',
              }
          )).filter((v) => v.n);
        });
        return out;
      }
    } catch (e) {
      /* 壊れていたら空に戻す */
    }
    return {};
  },

  /**
   * その人のふだんの持ち場（'k' か 'h'。決めていなければ空）
   *
   * 希望を取り込むときに、この持ち場へ入れます。
   */
  laneOf(storeId, name) {
    const who = this.people(storeId).find((p) => p.n === name);
    return who ? (who.p || '') : '';
  },

  /** その店舗の人（名前と番号）。店舗を指定しなければ、シフトを組む店舗全部 */
  people(storeId) {
    const map = this.all();
    if (storeId) return (map[storeId] || []).slice();
    const out = [];
    SHIFT_STORES.forEach((id) => (map[id] || []).forEach((p) => out.push({ ...p, store: id })));
    return out;
  },

  /** 名前だけの一覧（並び順は登録した順） */
  list(storeId) {
    return this.people(storeId).map((p) => p.n);
  },

  /** 何人登録されているか */
  count(storeId) { return this.people(storeId).length; },

  /** いま使われている番号全部（重ならない番号を作るために見ます） */
  codes() {
    return this.people().map((p) => p.c).filter(Boolean);
  },

  /**
   * 保存する
   *
   * ★番号が入っていない人には、ここで新しい番号を振ります。
   *   名前を書くだけで使えるようにするためです。
   *   すでに番号がある人の番号は、そのまま変えません
   *   （変えてしまうと、その人が入れなくなります）。
   */
  save(map) {
    const clean = {};
    const used = new Set();
    // まず、いま決まっている番号を集める（重複を避けるため）
    Object.keys(map || {}).forEach((id) => (map[id] || []).forEach((p) => {
      const c = String((p && p.c) || '').trim();
      if (c) used.add(c);
    }));

    Object.keys(map || {}).forEach((id) => {
      const list = [];
      (map[id] || []).forEach((p) => {
        const name = String((p && p.n) || '').trim();
        if (!name || list.some((x) => x.n === name)) return;
        let code = String((p && p.c) || '').trim();
        if (!code) {
          code = makeShiftCode(used);
          used.add(code);
        }
        const lane = SHIFT_LANES.some((l) => l.id === (p && p.p)) ? p.p : '';
        list.push({ n: name, c: code, s: !!(p && p.s), p: lane });
      });
      if (list.length) clean[id] = list;
    });
    localStorage.setItem(this._key, JSON.stringify(clean));
    return clean;
  },

  /**
   * 1店舗分を、改行区切りの名前から保存
   *
   * すでにいる人の番号は引き継ぎ、新しく書かれた人には番号を振ります。
   * 消された人は、番号ごといなくなります。
   */
  saveFromText(storeId, text) {
    const map = this.all();
    const before = map[storeId] || [];
    map[storeId] = String(text || '').split('\n').map((line) => {
      const name = line.trim();
      const old = before.find((p) => p.n === name);
      return {
        n: name,
        c: old ? old.c : '',
        s: old ? old.s : false,
        p: old ? (old.p || '') : '',
      };
    }).filter((p) => p.n);
    return this.save(map);
  },

  /** その人の番号を作り直す（前の番号では入れなくなります） */
  reissue(storeId, name) {
    const map = this.all();
    const list = map[storeId] || [];
    const who = list.find((p) => p.n === name);
    if (!who) return this.all();
    who.c = makeShiftCode(this.codes());
    // 番号が変わったら、送りずみの印は外します（送り直しが要るため）
    who.s = false;
    return this.save(map);
  },

  /** その人のふだんの持ち場を決める（'k' / 'h' / 空で「決めていない」） */
  setLane(storeId, name, lane) {
    const map = this.all();
    const who = (map[storeId] || []).find((p) => p.n === name);
    if (!who) return this.all();
    who.p = SHIFT_LANES.some((l) => l.id === lane) ? lane : '';
    return this.save(map);
  },

  /** 番号をその人に送りずみか、の印を付け外しする */
  setSent(storeId, name, on) {
    const map = this.all();
    const who = (map[storeId] || []).find((p) => p.n === name);
    if (!who) return this.all();
    who.s = !!on;
    return this.save(map);
  },
};

/* -------- 配達する人のリスト（交通費アプリのプルダウン） --------
 *
 *  クローズの担当者（Staff）とは別物です。
 *  あちらは社員、こちらはバグるのアルバイトなので、混ざらないように
 *  分けてあります。マネージの「交通費」で編集します。
 *
 *  名前を消しても、過去に入れた記録はその名前のまま残ります
 *  （記録の中に名前を書き写しているため）。
 */
const Drivers = {
  _key: APP.storageKey + ':drivers',

  /** 設定で保存されたリスト。未設定・空・壊れている場合は config.js の DRIVERS を使う */
  list() {
    try {
      const saved = JSON.parse(localStorage.getItem(this._key) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) {
      /* 壊れていたら初期値に戻す */
    }
    return DRIVERS.slice();
  },

  /** 改行区切りの文字列から保存（空行と重複は除く） */
  saveFromText(text) {
    const names = [];
    text.split('\n').forEach((line) => {
      const name = line.trim();
      if (name && !names.includes(name)) names.push(name);
    });
    localStorage.setItem(this._key, JSON.stringify(names));
    return names;
  },
};

/**
 * 店舗ごとの日報フォルダ（マネージで登録）
 *
 *  { 店舗id: 'フォルダのURL' } の形で持ちます。
 *  取り込みのときは、このフォルダの中（と、1つ下の年フォルダの中）から
 *  「年月」で始まるファイルを探します。
 */
const NippouFolders = {
  _key: APP.storageKey + ':nippouFolders',

  all() {
    try {
      const saved = JSON.parse(localStorage.getItem(this._key) || 'null');
      if (saved && typeof saved === 'object') return saved;
    } catch (e) {
      /* 壊れていたら初期値に戻す */
    }
    return { ...NIPPOU_FOLDERS };
  },

  get(storeId) { return this.all()[storeId] || ''; },

  /** フォルダのURLからIDだけ取り出す（URLでもIDでも入れられるように） */
  idOf(storeId) {
    const v = String(this.get(storeId) || '').trim();
    const m = /\/folders\/([a-zA-Z0-9_-]+)/.exec(v);
    return m ? m[1] : v;
  },

  save(map) {
    const clean = {};
    Object.keys(map || {}).forEach((k) => {
      const v = String(map[k] || '').trim();
      if (v) clean[k] = v;
    });
    localStorage.setItem(this._key, JSON.stringify(clean));
    return clean;
  },
};
