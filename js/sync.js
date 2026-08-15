/* ============================================================
 *  共有同期（Google スプレッドシート＋Apps Script）
 *
 *  考え方
 *    ・チェックはこれまでどおり「まず端末内に即保存」。画面はすぐ反応します
 *    ・変更内容は送信箱にためて、裏でまとめてサーバーへ送ります
 *    ・電波が悪い／オフラインでも作業は続けられ、つながったら自動で送信されます
 *
 *  APP.syncUrl が空のあいだは、この機能は丸ごと無効（今までどおり端末内だけ）です。
 * ============================================================ */

const Sync = {
  _outboxKey: APP.storageKey + ':outbox',
  _sinceKey: APP.storageKey + ':syncSince',
  _pinKey: APP.storageKey + ':pin',

  timer: null,
  running: false,
  lastError: '',
  lastSyncAt: null,
  // アプリを開いた最初の1回は、設定（項目・担当者・定休日）を丸ごと取り直す。
  // 受け取り位置がずれていても、必ず最新の内容から始められるようにするため。
  _settingsPulled: false,
  onChange: null, // 状態が変わったら呼ばれる（画面更新用）

  /* -------- 有効かどうか -------- */
  enabled() {
    return !!(APP.syncUrl && APP.syncUrl.trim());
  },
  pin() {
    return localStorage.getItem(this._pinKey) || '';
  },
  setPin(pin) {
    localStorage.setItem(this._pinKey, String(pin).trim());
  },
  clearPin() {
    localStorage.removeItem(this._pinKey);
  },

  /* -------- 送信箱 -------- */
  outbox() {
    try {
      const v = JSON.parse(localStorage.getItem(this._outboxKey) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  },
  _saveOutbox(list) {
    localStorage.setItem(this._outboxKey, JSON.stringify(list));
  },

  /** 変更を送信箱に入れる（送信は少し待ってからまとめて） */
  enqueue(op) {
    if (!this.enabled()) return;
    const list = this.outbox();
    op.at = new Date().toISOString();
    list.push(op);
    this._saveOutbox(list);
    this._notify();
    this.scheduleFlush(1500);
  },

  scheduleFlush(delay) {
    if (!this.enabled()) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), delay);
  },

  /* -------- 送受信 -------- */
  async flush() {
    if (!this.enabled() || this.running) return;
    if (!this.pin()) return; // PIN未入力のあいだは送らない

    this.running = true;
    this._notify();

    const sending = this.outbox();
    const ops = this._withSummaries(sending);

    try {
      const res = await fetch(APP.syncUrl, {
        method: 'POST',
        // text/plain にしないと CORS の事前確認が入り、Apps Script が応答できません
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          pin: this.pin(),
          action: 'sync',
          since: localStorage.getItem(this._sinceKey) || '',
          settingsAll: !this._settingsPulled,
          ops,
        }),
      });
      const json = await res.json();

      if (!json.ok) {
        this.lastError = json.error || '同期に失敗しました';
        // ロック中はPINを消さない（正しいPINを持っている人まで締め出さないため）
        if (json.code === 'bad_pin' || json.code === 'no_pin') this.clearPin();
        // 管理用PINが要る操作が現場アプリの送信箱に紛れ込んだ場合、
        // 何度送っても通らず、以降の同期が止まってしまう。捨てて先へ進む。
        if (json.code === 'need_admin') this._dropAdminOps();
        return;
      }

      // 送れた分だけ送信箱から取り除く（送信中に増えた分は残す）
      const rest = this.outbox().slice(sending.length);
      this._saveOutbox(rest);

      this._applyPulled(json.records || [], json.settings);
      localStorage.setItem(this._sinceKey, json.now || '');
      this._settingsPulled = true;
      this.lastSyncAt = new Date();
      this.lastError = '';
      if (typeof render === 'function') render();
    } catch (e) {
      this.lastError = 'オフライン、または通信できません';
    } finally {
      this.running = false;
      this._notify();
      if (this.outbox().length) this.scheduleFlush(15000); // 残っていれば後で再送
    }
  },

  /** 管理用PINが要る操作を送信箱から取り除く（現場アプリが詰まらないように） */
  _dropAdminOps() {
    const admin = ['checklists', 'weeklies', 'staffList', 'closedDows'];
    const rest = this.outbox().filter((op) => !(op.t === 'setting' && admin.includes(op.n)));
    this._saveOutbox(rest);
  },

  /** いま覚えているPINが管理用かどうかを確かめる（管理アプリで使います） */
  async probeAdmin() {
    try {
      const res = await fetch(APP.syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ pin: this.pin(), action: 'ping' }),
      });
      const json = await res.json();
      if (!json.ok) return { admin: false, error: json.error || '' };
      return { admin: !!json.admin, error: '' };
    } catch (e) {
      return { admin: false, error: '通信できませんでした。電波の良いところでもう一度お試しください。' };
    }
  },

  /**
   * 同期とは別の頼みごとを1回だけ送ります（いまは日報の取り込みだけ）。
   * 送信箱は通さないので、失敗しても後から勝手に送り直したりはしません。
   */
  async ask(action, extra = {}) {
    if (!this.enabled()) return { ok: false, error: '共有の設定がされていません' };
    if (!this.pin()) return { ok: false, error: 'PINが入っていません' };
    try {
      const res = await fetch(APP.syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ pin: this.pin(), action, ...extra }),
      });
      return await res.json();
    } catch (e) {
      return { ok: false, error: 'オフライン、または通信できません' };
    }
  },

  /** 送る操作に、提出記録シート用のまとめを添える */
  _withSummaries(ops) {
    const keys = [...new Set(ops.filter((o) => o.k).map((o) => o.k))];
    const extra = keys.map((k) => ({ t: 'summary', k, v: summaryFor(k) })).filter((o) => o.v);
    return ops.concat(extra);
  },

  /** サーバーから届いた内容を端末に取り込む */
  _applyPulled(records, settings) {
    if (records.length) {
      const all = LocalAdapter.dump();
      records.forEach((row) => {
        all[row.k] = row.r;
      });
      LocalAdapter.load(all);

      // まだ送っていない自分の変更は、取り込んだ内容の上に貼り直す
      this.outbox().forEach((op) => {
        if (!op.k) return;
        const rec = Store.getDay(...op.k.split('/'));
        if (op.t === 'item') rec.items[op.i] = op.v;
        else if (op.t === 'staff') rec.staff = op.v;
        else if (op.t === 'note') rec.note = op.v;
        else if (op.t === 'submit') { rec.submittedAt = op.v.submittedAt; rec.submittedBy = op.v.submittedBy; }
        else if (op.t === 'unsubmit') { rec.submittedAt = null; rec.submittedBy = ''; }
        LocalAdapter.set(op.k, rec);
      });
    }
    if (settings) {
      if (settings.checklists) localStorage.setItem(Checklists._key, JSON.stringify(settings.checklists));
      if (settings.weeklies) localStorage.setItem(Weeklies._key, JSON.stringify(settings.weeklies));
      if (settings.staffList) localStorage.setItem(Staff._key, JSON.stringify(settings.staffList));
      if (settings.drivers) localStorage.setItem(Drivers._key, JSON.stringify(settings.drivers));
      if (settings.catchStaff) localStorage.setItem(CatchStaff._key, JSON.stringify(settings.catchStaff));
      if (settings.nippouFolders) localStorage.setItem(NippouFolders._key, JSON.stringify(settings.nippouFolders));
      if (settings.closedDows) localStorage.setItem(Closed._dowsKey, JSON.stringify(settings.closedDows));
      if (settings.closedExceptions) localStorage.setItem(Closed._exKey, JSON.stringify(settings.closedExceptions));
    }
  },

  /**
   * ヘッダーのしるしに入れる絵（文字は出しません）
   *
   *   ok      … ✓  送り終わっている
   *   busy    … ぐるぐる  いま送っている（css でゆっくり回ります）
   *   pending … ↑  まだ送っていない分がある
   *   error   … !  送れていない／PIN未入力
   *
   * 色だけで見分けさせると、色の見え方が違う人には伝わりません。
   * かならず「形」も変えてあります。
   */
  iconSvg(kind) {
    const path = {
      ok: '<path d="M5 10.6l3.4 3.4L15.2 6.6"/>',
      busy: '<path d="M16.2 10a6.2 6.2 0 1 1-1.8-4.4"/><path d="M16.4 3.9v3.5h-3.5"/>',
      pending: '<path d="M10 15.6V5.2"/><path d="M5.8 9.4L10 5.2l4.2 4.2"/>',
      error: '<path d="M10 5.2v6.1"/><circle cx="10" cy="14.7" r="1.15" fill="currentColor" stroke="none"/>',
    }[kind] || '';
    return '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" '
      + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  },

  /**
   * 設定画面に出す「しるしの見かた」
   *
   * ヘッダーの丸いしるしが何を表しているか、実物と同じ絵で並べます。
   * 色だけでなく形も違うので、色の見え方が違う人にも伝わります。
   */
  legendHtml() {
    const rows = [
      ['ok', '同期できています', '入力した内容が、みんなの端末に届いています'],
      ['busy', '送っています', '少し待つと ✓ に変わります'],
      ['pending', 'まだ送れていない分があります', 'つながり次第、自動で送られます。入力した内容が消えることはありません'],
      ['error', '送れていません', '電波を確かめてください。それでも赤いままなら「PINを入れ直す」を試してください'],
    ];
    return rows.map(([kind, name, desc]) =>
      '<li class="sync-legend__row">'
      + `<span class="sync-chip sync-chip--${kind}">${this.iconSvg(kind)}</span>`
      + '<span class="sync-legend__text">'
      + `<span class="sync-legend__name">${name}</span>`
      + `<span class="sync-legend__desc">${desc}</span>`
      + '</span></li>'
    ).join('');
  },

  /** 画面に出す状態 */
  status() {
    if (!this.enabled()) return { kind: 'off', text: '' };
    if (!this.pin()) return { kind: 'error', text: 'PIN未入力' };
    if (this.running) return { kind: 'busy', text: '同期中…' };
    const n = this.outbox().length;
    if (this.lastError) return { kind: 'error', text: n ? `未送信 ${n}件` : '同期エラー' };
    if (n) return { kind: 'pending', text: `未送信 ${n}件` };
    return { kind: 'ok', text: '同期済み' };
  },

  _notify() {
    if (typeof this.onChange === 'function') this.onChange();
  },

  /* -------- 起動 -------- */
  start() {
    if (!this.enabled() || this._started) return;
    this._started = true;
    window.addEventListener('online', () => this.scheduleFlush(500));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.scheduleFlush(500);
    });
    setInterval(() => this.flush(), 60000); // 1分おきに他店舗の更新を取りに行く
    this.scheduleFlush(300);
  },
};

/** 提出記録シートに書くためのまとめ（キーは 'storeId/YYYY-MM-DD'） */
function summaryFor(key) {
  const [storeId, dateStr] = key.split('/');
  const store = getStore(storeId);
  if (!store || !dateStr) return null;
  // 週間掃除（storeId/W2026-08-02）と随時掃除（storeId/ANYTIME）は
  // 日別の提出記録シートには出しません（記録そのものは同じように同期されます）
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  const [y, m, d] = dateStr.split('-').map(Number);
  const rec = Store.getDay(storeId, dateStr);
  const base = { date: dateStr, storeName: store.name };

  if (Closed.isClosed(storeId, y, m, d)) return { ...base, closed: true };

  const items = getChecklist(storeId)
    .flatMap((sec) => sec.items.filter((it) => appliesTo(it, store, y, m, d, sec)));
  const missing = items.filter((it) => !rec.items?.[it.id]?.done).map((it) => it.label);

  return { ...base, closed: false, total: items.length, done: items.length - missing.length, missing };
}

/* ============================================================
 *  Store / 設定の変更を横取りして送信箱に積む
 *  （app.js 側は今までどおり呼ぶだけでよくなります）
 * ============================================================ */
(function hookStore() {
  const key = (s, d) => `${s}/${d}`;

  const _setItem = Store.setItem.bind(Store);
  Store.setItem = function (storeId, dateStr, itemId, patch) {
    const next = _setItem(storeId, dateStr, itemId, patch);
    Sync.enqueue({ t: 'item', k: key(storeId, dateStr), i: itemId, v: next });
    return next;
  };

  const _setStaff = Store.setStaff.bind(Store);
  Store.setStaff = function (storeId, dateStr, name) {
    _setStaff(storeId, dateStr, name);
    Sync.enqueue({ t: 'staff', k: key(storeId, dateStr), v: name, by: name });
  };

  const _setNote = Store.setNote.bind(Store);
  Store.setNote = function (storeId, dateStr, note) {
    _setNote(storeId, dateStr, note);
    Sync.enqueue({ t: 'note', k: key(storeId, dateStr), v: note });
  };

  const _submit = Store.submit.bind(Store);
  Store.submit = function (storeId, dateStr) {
    const rec = _submit(storeId, dateStr);
    Sync.enqueue({
      t: 'submit', k: key(storeId, dateStr),
      v: { submittedAt: rec.submittedAt, submittedBy: rec.submittedBy }, by: rec.submittedBy,
    });
    return rec;
  };

  const _unsubmit = Store.unsubmit.bind(Store);
  Store.unsubmit = function (storeId, dateStr) {
    const rec = _unsubmit(storeId, dateStr);
    Sync.enqueue({ t: 'unsubmit', k: key(storeId, dateStr) });
    return rec;
  };

  const _saveChecklist = Checklists.save.bind(Checklists);
  Checklists.save = function (storeId, sections) {
    const all = _saveChecklist(storeId, sections);
    Sync.enqueue({ t: 'setting', n: 'checklists', v: all });
    return all;
  };

  const _saveWeekly = Weeklies.save.bind(Weeklies);
  Weeklies.save = function (storeId, items) {
    const all = _saveWeekly(storeId, items);
    Sync.enqueue({ t: 'setting', n: 'weeklies', v: all });
    return all;
  };

  const _saveStaff = Staff.saveFromText.bind(Staff);
  Staff.saveFromText = function (text) {
    const names = _saveStaff(text);
    Sync.enqueue({ t: 'setting', n: 'staffList', v: names });
    return names;
  };

  const _saveDrivers = Drivers.saveFromText.bind(Drivers);
  Drivers.saveFromText = function (text) {
    const names = _saveDrivers(text);
    Sync.enqueue({ t: 'setting', n: 'drivers', v: names });
    return names;
  };

  const _saveCatch = CatchStaff.save.bind(CatchStaff);
  CatchStaff.save = function (map) {
    const clean = _saveCatch(map);
    Sync.enqueue({ t: 'setting', n: 'catchStaff', v: clean });
    return clean;
  };

  const _saveNippou = NippouFolders.save.bind(NippouFolders);
  NippouFolders.save = function (map) {
    const clean = _saveNippou(map);
    Sync.enqueue({ t: 'setting', n: 'nippouFolders', v: clean });
    return clean;
  };

  const _setDows = Closed.setDows.bind(Closed);
  Closed.setDows = function (storeId, dows) {
    _setDows(storeId, dows);
    Sync.enqueue({ t: 'setting', n: 'closedDows', v: Closed._read(Closed._dowsKey) });
  };

  const _setException = Closed.setException.bind(Closed);
  Closed.setException = function (storeId, dateStr, kind) {
    _setException(storeId, dateStr, kind);
    Sync.enqueue({ t: 'setting', n: 'closedExceptions', v: Closed._read(Closed._exKey) });
  };
})();
