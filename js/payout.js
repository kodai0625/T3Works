/* ============================================================
 *  支払いリストの画像づくり
 *
 *  月末・月初に「誰にいくら払うか」を1枚の画像（JPEG）にします。
 *  現金支払管理表と配達記録の両方から呼びます。
 *
 *  なぜ画像なのか
 *    ・LINEやメールにそのまま貼れる
 *    ・受け取った人が中身を書き換えられない
 *    ・アプリを入れていない人にも渡せる
 *
 *  外部の部品は使わず、canvas に直接描いています。
 *  （通信できない場所でも、いつもと同じ見た目で作れるようにするため）
 * ============================================================ */

const Payout = {
  /* 見た目の決めごと。数字はすべて「拡大前」の大きさです */
  WIDTH: 760,
  PAD: 34,
  ROW_H: 46,
  SCALE: 2,        // 画面の粗さに関係なく、いつも同じきれいさで出す
  FONT: '-apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif',

  font(size, weight) {
    return `${weight || 400} ${size}px ${this.FONT}`;
  },

  /**
   * 画像を作る
   *
   *   title    … 大見出し（例：2026年8月分　交通費）
   *   subtitle … 小見出し（例：バグる｜配達の交通費）
   *   head     … 表の見出し（例：['名前', '合計距離', '合計金額']）
   *   align    … 列の寄せ方（'left' / 'right'）
   *   rows     … 中身（文字の配列の配列）
   *   total    … いちばん下の合計行
   *   note     … 表の下に小さく出す注意書き（省略可）
   *   accent   … 差し色
   */
  make(spec) {
    const cols = spec.head.length;
    const bodyH = spec.rows.length * this.ROW_H;
    // 下に描く文字の位置と同じ式で高さを出します（余白が空きすぎないように）
    const lastY = this.PAD + 26 + 30 + 34 + 38 + bodyH + this.ROW_H + 22
      + (spec.note ? 22 : 0);
    const height = lastY + 26;

    const canvas = document.createElement('canvas');
    canvas.width = this.WIDTH * this.SCALE;
    canvas.height = Math.round(height) * this.SCALE;
    const c = canvas.getContext('2d');
    c.scale(this.SCALE, this.SCALE);
    c.textBaseline = 'middle';

    const accent = spec.accent || '#2b7fd4';
    const L = this.PAD;
    const R = this.WIDTH - this.PAD;

    /* 下地。JPEG は透明を持てないので、必ず白で塗ります */
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, this.WIDTH, height);

    /* 上の帯（差し色） */
    c.fillStyle = accent;
    c.fillRect(0, 0, this.WIDTH, 8);

    let y = this.PAD + 26;
    c.fillStyle = '#1c1f26';
    c.font = this.font(27, 800);
    c.textAlign = 'left';
    c.fillText(spec.title, L, y);

    y += 30;
    c.fillStyle = '#6b7280';
    c.font = this.font(14, 600);
    c.fillText(spec.subtitle, L, y);

    /* ---- 表 ---- */
    y += 34;
    const colX = this.columnX(c, spec, L, R);

    // 見出しの行
    c.fillStyle = this.tint(accent, .10);
    c.fillRect(L, y, R - L, 38);
    c.font = this.font(13.5, 700);
    c.fillStyle = '#55606e';
    spec.head.forEach((label, i) => {
      c.textAlign = spec.align[i] === 'right' ? 'right' : 'left';
      c.fillText(label, colX[i], y + 19);
    });
    y += 38;

    // 中身
    spec.rows.forEach((row, n) => {
      if (n % 2 === 1) {
        c.fillStyle = '#f7f8fa';
        c.fillRect(L, y, R - L, this.ROW_H);
      }
      c.fillStyle = '#e2e5ea';
      c.fillRect(L, y + this.ROW_H - 1, R - L, 1);

      row.forEach((text, i) => {
        c.textAlign = spec.align[i] === 'right' ? 'right' : 'left';
        c.font = this.font(i === 0 ? 18 : 19, i === 0 ? 600 : 700);
        c.fillStyle = i === 0 ? '#1c1f26' : '#1c1f26';
        c.fillText(String(text), colX[i], y + this.ROW_H / 2);
      });
      y += this.ROW_H;
    });

    // 合計の行
    c.fillStyle = this.tint(accent, .14);
    c.fillRect(L, y, R - L, this.ROW_H);
    c.fillStyle = accent;
    c.fillRect(L, y, R - L, 2);
    spec.total.forEach((text, i) => {
      c.textAlign = spec.align[i] === 'right' ? 'right' : 'left';
      c.font = this.font(i === 0 ? 18 : 21, 800);
      c.fillStyle = '#1c1f26';
      c.fillText(String(text), colX[i], y + this.ROW_H / 2);
    });
    y += this.ROW_H + 22;

    /* ---- 下の注意書き ---- */
    c.textAlign = 'left';
    if (spec.note) {
      c.font = this.font(12.5, 400);
      c.fillStyle = '#6b7280';
      c.fillText(spec.note, L, y);
      y += 22;
    }
    c.font = this.font(11.5, 400);
    c.fillStyle = '#9aa1ac';
    c.fillText(`${this.stamp()}　T3 Works で作成`, L, y);

    void cols;
    return canvas;
  },

  /** 列の位置。1列目は左端、あとは右端から等間隔で並べます */
  columnX(c, spec, L, R) {
    const n = spec.head.length;
    if (n <= 1) return [L];
    // 右側の数字の列は、いちばん長い文字にあわせて幅を決めます
    const widths = [];
    for (let i = 1; i < n; i++) {
      c.font = this.font(21, 800);
      const cells = [spec.head[i], spec.total[i], ...spec.rows.map((r) => r[i])];
      widths.push(Math.max(...cells.map((t) => c.measureText(String(t)).width)) + 34);
    }
    const xs = [L + 14];
    let right = R - 14;
    for (let i = n - 1; i >= 1; i--) {
      xs[i] = right;
      right -= widths[i - 1];
    }
    return xs;
  },

  /** 白に色を混ぜた薄い色を作る（背景の塗り分け用） */
  tint(hex, ratio) {
    const v = hex.replace('#', '');
    const n = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
    const mix = n.map((x) => Math.round(255 + (x - 255) * ratio));
    return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
  },

  stamp() {
    const d = new Date();
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  },

  /** できた画像をダウンロードする */
  download(canvas, filename) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        // すぐ消すと保存が間に合わない端末があるので、少し待ってから片づけます
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        resolve();
      }, 'image/jpeg', 0.92);
    });
  },

  /**
   * できた画像を画面に出す
   *
   * ダウンロードするだけだと、iPhone では「どこへ入ったのか分からない」
   * ことがあるので、まず画面に出します。
   * ボタンで保存、長押しで「写真に追加」のどちらでも取り出せます。
   */
  show(canvas, filename) {
    const modal = document.createElement('div');
    modal.className = 'modal payout-modal';
    modal.innerHTML =
      '<div class="modal__backdrop" data-payout-close></div>' +
      '<div class="modal__panel" role="dialog" aria-modal="true">' +
      '  <h2 class="modal__title">支払いリスト</h2>' +
      '  <div class="payout-preview"></div>' +
      '  <p class="payout-hint">iPhone・iPad では、画像を<b>長押し</b>して' +
      '「”写真”に追加」でも保存できます。そのまま LINE に貼れます。</p>' +
      '  <div class="modal__actions">' +
      '    <button type="button" class="btn btn--primary" data-payout-save>画像を保存する</button>' +
      '    <button type="button" class="btn" data-payout-close>閉じる</button>' +
      '  </div>' +
      '</div>';

    const img = document.createElement('img');
    img.className = 'payout-preview__img';
    img.alt = '支払いリスト';
    img.src = canvas.toDataURL('image/jpeg', 0.92);
    modal.querySelector('.payout-preview').appendChild(img);

    const close = () => modal.remove();
    modal.querySelectorAll('[data-payout-close]').forEach((n) => n.addEventListener('click', close));
    modal.querySelector('[data-payout-save]').addEventListener('click', () => {
      this.download(canvas, filename);
    });
    document.body.appendChild(modal);
  },

  /**
   * その月が「支払いリストを出す時期」かどうか
   * 月末3日前から翌月5日までを「時期」とみなします
   */
  isPayoutTime(y, m) {
    const t = businessDate();
    const last = new Date(y, m, 0).getDate();
    const sameMonth = t.getFullYear() === y && t.getMonth() + 1 === m;
    if (sameMonth) return t.getDate() >= last - 2;
    // 翌月の頭
    const next = new Date(y, m, 1);
    return t.getFullYear() === next.getFullYear()
      && t.getMonth() === next.getMonth()
      && t.getDate() <= 5;
  },
};
