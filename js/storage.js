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
