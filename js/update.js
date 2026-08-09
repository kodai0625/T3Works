/* ============================================================
 *  新しい版のお知らせ
 *
 *  考え方
 *    公開したファイルには、中身から計算した「版の印」が付きます。
 *    アプリは version.json を時々見に行き、いま開いている印と
 *    違っていたら、画面下に「新しい版があります」と出します。
 *
 *    ボタンを押すと読み込み直します。このとき URL に印を付けるので、
 *    端末に残っている古いページではなく、必ず新しいものが読まれます。
 *
 *  version.json と <meta name="app-version"> は 公開用を作る.py が付けます。
 *  手元でそのまま開いたときは印が無いので、この機能は動きません。
 * ============================================================ */

const Updater = {
  interval: 5 * 60 * 1000,   // 5分おきに確かめる
  _checking: false,
  _started: false,
  _found: '',                // 見つかった新しい印

  /** いま開いている版の印 */
  current() {
    const meta = document.querySelector('meta[name="app-version"]');
    return meta ? meta.content.trim() : '';
  },

  async check() {
    if (this._checking || this._found || !this.current()) return;
    this._checking = true;
    try {
      // cache: 'no-store' で、端末に残っている控えを使わず必ず取りに行く
      const res = await fetch('version.json', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.v && json.v !== this.current()) this.show(json.v);
    } catch (e) {
      /* 通信できないときは何もしない。次の機会に確かめます */
    } finally {
      this._checking = false;
    }
  },

  show(version) {
    this._found = version;
    const bar = document.getElementById('updateBar');
    if (!bar) return;
    bar.classList.remove('is-hidden');
    document.body.classList.add('has-update');
  },

  /** 読み込み直す。URLに印を付けて、古いページが使われないようにする */
  apply() {
    const url = location.pathname + '?v=' + encodeURIComponent(this._found) + location.hash;
    location.replace(url);
  },

  start() {
    if (this._started || !this.current()) return;
    this._started = true;

    const bar = document.getElementById('updateBar');
    if (bar) bar.querySelector('.update-bar__btn').addEventListener('click', () => this.apply());

    // アプリに戻ってきたときは、その場で確かめる
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.check();
    });
    setInterval(() => this.check(), this.interval);
    setTimeout(() => this.check(), 4000);
  },
};
