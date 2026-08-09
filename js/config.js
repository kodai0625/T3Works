/* ============================================================
 *  設定ファイル
 *  ここだけ編集すれば「店舗」「確認項目」を変更できます。
 *  他のファイルは触らなくてOKです。
 * ============================================================ */

const APP = {
  title: 'T3クローズ',
  company: 'T3Dining株式会社',
  logo: 'img/t3dining.png', // ヘッダーに出る会社ロゴ

  // ★月間表（縦=確認項目／横=1〜31日のマトリクス）を使うかどうか
  //   false … 「日別／月間表」の切替ボタンごと消えて、日別だけになります
  //   true  … 月間表が復活します（機能は消していないので、ここを true にするだけ）
  showMonthView: false,

  // ★全店舗で共有するための接続先（Apps Script のウェブアプリURL）
  //   空のあいだは今までどおり「この端末の中だけ」で動きます。
  //   SETUP.md の手順で取得したURLをここに貼ると共有版になります。
  syncUrl: 'https://script.google.com/macros/s/AKfycbzzLm89vm45kaMHcAMPb9DsrYxFeZwW-Q6UDo2NITHEPBUK3hSslVWiLONEPGxpPCVW/exec',

  storageKey: 't3d-check-v1', // ← 変更するとデータが分かれるので通常は触らない
};

/* ------------------------------------------------------------
 *  1) 店舗一覧
 *     id は英数字で固定（あとから変えるとデータが紐付かなくなります）
 * ---------------------------------------------------------- */
/*  logo … img フォルダの画像。ファイルが無い場合は color の丸印を表示します。
 *        差し替えるときは同じファイル名で img フォルダに上書きするだけでOK。   */
const STORES = [
  // color … 選択中タブや進捗バーに使う店舗カラー。
  //          白文字を載せるので、明るすぎる色は読みにくくなります
  // closedDays … 毎週の定休日の初期値（0=日 1=月 2=火 3=水 4=木 5=金 6=土）。
  //          その曜日は確認チェック不要になり、確認漏れにも数えません。
  //          省略すれば定休日なし。複数なら [2, 3] のように並べます。
  //          ★アプリの「⚙ 設定 → 定休日」で変更でき、そちらが優先されます
  { id: 'kojare',   name: 'こじゃれ',       short: 'こじゃれ', color: '#c0392b', logo: 'img/kojare.png' },
  { id: 'sumimaro', name: '炭まろ',         short: '炭まろ',   color: '#a9453c', logo: 'img/sumimaro.png' },
  { id: 'chacoru',  name: 'ちゃこる',       short: 'ちゃこる', color: '#c14a1e', logo: 'img/chacoru.png', closedDays: [0] },
  { id: 'baguru',   name: 'バグる',         short: 'バグる',   color: '#bf5480', logo: 'img/baguru.png', closedDays: [2] },
  { id: 'popo',     name: 'popo',           short: 'popo',     color: '#5a3728', logo: 'img/popo.png' },
  { id: 'oiden',    name: 'おいでんテラス', short: 'おいでん', color: '#b3690c', logo: 'img/oiden.png', closedDays: [2] },
];

/* ------------------------------------------------------------
 *  2) 担当者リストの初期値
 *     日付の下のプルダウンに並ぶ名前です。
 *     アプリの「⚙ 設定」からいつでも追加・削除できます
 *     （設定で変更した内容が優先され、こちらは初期値としてのみ使われます）。
 * ---------------------------------------------------------- */
const STAFF = [
  '河上',
  '熊谷',
  '木村',
  '酒井',
  '由本',
  '島崎',
  '船場',
  '阿部',
  '宮崎',
  '粂',
  '山本',
  '牧',
];

/* ------------------------------------------------------------
 *  3) 確認項目（★あとから追加・変更する場所★）
 *
 *  section = 見出しのかたまり
 *    id    : 英数字で固定
 *    title : 画面に出る見出し
 *    items : 項目の配列
 *
 *  item
 *    id    : 英数字で固定（★変えると過去データが消えて見えるので注意★）
 *    label : 画面に出る項目名
 *    hint  : 補足説明（省略可）
 *    type  : 'check'  → チェックだけ（既定）
 *            'number' → チェック＋数値入力（売上・客数など）
 *            'text'   → チェック＋文字入力（引継ぎ事項など）
 *    unit  : 'number' のときの単位（省略可）
 *    onlyDays : その日だけ出す項目（省略可）
 *               例）onlyDays: [28] → 28日だけ表示。他の日は出ず、確認漏れにも数えない
 *    hideOnDows : その曜日は出さない項目（省略可）
 *               0=日 1=月 2=火 3=水 4=木 5=金 6=土
 *               例）hideOnDows: [5, 6] → 金・土だけ出ない。出ない日は確認漏れにも数えない
 *
 *  ↓ いまは「よくある項目」を仮で入れています。実際の項目に差し替えてください。
 * ---------------------------------------------------------- */
const CHECKLIST = [
  {
    id: 'open',
    title: '開店前',
    items: [
      { id: 'op01', label: '冷蔵庫・冷凍庫の温度確認', type: 'number', unit: '℃' },
      { id: 'op02', label: 'レジ釣銭・開始金の確認',   type: 'check' },
      { id: 'op03', label: '予約表の確認（人数・時間・要望）', type: 'check' },
      { id: 'op04', label: '仕込み・在庫の確認',       type: 'check' },
      { id: 'op05', label: '店内・トイレ清掃の確認',   type: 'check' },
      { id: 'op06', label: '身だしなみ・制服の確認',   type: 'check' },
    ],
  },
  {
    id: 'during',
    title: '営業中',
    items: [
      { id: 'dr01', label: '予約席のセッティング完了', type: 'check' },
      { id: 'dr02', label: '品切れメニューの共有',     type: 'text', hint: '品切れがあれば内容を記入' },
      { id: 'dr03', label: 'ピークアウト後の店内清掃', type: 'check' },
    ],
  },
  {
    id: 'report',
    title: '日報入力（売上・仕入・人件費）',
    items: [
      { id: 'rp01', label: '現金売上の入力',   type: 'number', unit: '円' },
      { id: 'rp02', label: 'クレジット売上の入力', type: 'number', unit: '円' },
      { id: 'rp03', label: '電子マネー売上の入力', type: 'number', unit: '円' },
      { id: 'rp04', label: '当日客数の入力',   type: 'number', unit: '人' },
      { id: 'rp05', label: '仕入伝票の入力',   type: 'check' },
      { id: 'rp06', label: '人件費（勤怠）の締め', type: 'check' },
      { id: 'rp07', label: '来店経路の入力',   type: 'check' },
      { id: 'rp08', label: 'レジ締めと現金の実査が一致', type: 'check' },
    ],
  },
  {
    id: 'close',
    title: '閉店後',
    items: [
      { id: 'cl01', label: '火元・ガス元栓の確認', type: 'check' },
      { id: 'cl02', label: '冷蔵庫・冷凍庫の閉め忘れ確認', type: 'check' },
      { id: 'cl03', label: '売上金の保管・入金',   type: 'check' },
      { id: 'cl04', label: '施錠・戸締りの確認',   type: 'check' },
    ],
  },
];

/* ------------------------------------------------------------
 *  4) 店舗ごとに項目を変えたい場合だけ設定
 *     例）popo だけ別の項目にする
 *     const CHECKLIST_OVERRIDES = { popo: [ { id:'open', title:'開店前', items:[...] } ] };
 * ---------------------------------------------------------- */
const CHECKLIST_OVERRIDES = {

  /* ===== バグる ===== */
  baguru: [
    {
      id: 'hall',
      title: 'ホール',
      items: [
        { id: 'bg-h01', label: 'ゴミ落ちていないか' },
        { id: 'bg-h02', label: '椅子が上がっているか' },
        { id: 'bg-h03', label: 'A卓の荷物かご' },
        { id: 'bg-h04', label: 'バッシやり忘れ' },
        // 金・土は翌日のランチが無いため表示しない（火は定休日で自動的に対象外）
        { id: 'bg-h05', label: 'ランチメニュー', hideOnDows: [5, 6] },
        { id: 'bg-h06', label: '肉の日POP入れ忘れ（２８日のみ）', onlyDays: [28] },
        { id: 'bg-h07', label: '肉の日POP抜き忘れ（２９日のみ）', onlyDays: [29] },
        { id: 'bg-h08', label: '卓上備品補充' },
        { id: 'bg-h09', label: '洗濯物' },
        { id: 'bg-h10', label: 'シルバー拭きなど洗濯機入れ忘れないか' },
        { id: 'bg-h11', label: '岩塩・BP・ガーリックチップ補充' },
        { id: 'bg-h12', label: 'スープ移し' },
        { id: 'bg-h13', label: '使用済みコップ残っていないか' },
        { id: 'bg-h14', label: 'ロールカーテン' },
        { id: 'bg-h15', label: 'ケミガード補充' },
        { id: 'bg-h16', label: 'スープレードル定位置にあるか' },
        { id: 'bg-h17', label: '明日の予約確認' },
      ],
    },
    {
      id: 'kitchen',
      title: 'キッチン',
      items: [
        { id: 'bg-k01', label: '仕込み表' },
        { id: 'bg-k02', label: '唐揚げ在庫チェック（F卓も）' },
        { id: 'bg-k03', label: 'タコライス在庫チェック' },
        { id: 'bg-k04', label: '米移し' },
        { id: 'bg-k05', label: '米ラップチェック' },
        { id: 'bg-k06', label: 'ハンバーグのラップ・蓋' },
        { id: 'bg-k07', label: 'グリドル・コンロ清掃' },
        { id: 'bg-k08', label: 'スチコン締め' },
        { id: 'bg-k24', label: 'フライヤーの火チェック' },
        { id: 'bg-k09', label: '炭移し' },
        { id: 'bg-k10', label: 'IH電源' },
        { id: 'bg-k11', label: 'ペレット電源' },
        { id: 'bg-k12', label: '炊飯器保温' },
        { id: 'bg-k13', label: 'ビールサーバー締め' },
        { id: 'bg-k14', label: '油補充' },
        { id: 'bg-k15', label: '洗剤補充' },
        { id: 'bg-k16', label: 'ごみ捨て' },
        { id: 'bg-k17', label: 'シンクのゴミかごチェック' },
        { id: 'bg-k18', label: 'シンク清掃チェック' },
        { id: 'bg-k19', label: '洗浄機横清掃チェック' },
        { id: 'bg-k20', label: '洗えた物戻し忘れ' },
        { id: 'bg-k21', label: '冷蔵庫・冷凍庫扉チェック' },
        { id: 'bg-k22', label: 'F卓ショーケース扉チェック' },
        { id: 'bg-k23', label: 'F卓ショーケース水受けチェック' },
      ],
    },
    {
      id: 'toilet',
      title: 'トイレ',
      items: [
        { id: 'bg-t01', label: 'トイレ掃除チェック' },
        { id: 'bg-t02', label: 'トイレ備品補充チェック' },
        { id: 'bg-t03', label: 'トイレマット干し' },
        { id: 'bg-t04', label: 'エアコンチェック' },
        { id: 'bg-t05', label: '水回りチェック' },
      ],
    },
    {
      id: 'whole',
      title: '全体',
      items: [
        // 表示順は下の並びのとおり。id は項目名と対をなす固定値なので、
        // 並べ替えるときは id と label をセットのまま動かすこと（過去データが外れます）
        { id: 'bg-z01', label: '発注（FAX流し忘れないか）' },
        { id: 'bg-z07', label: '売上金チェック' },
        { id: 'bg-z08', label: '入金帳・封筒チェック' },
        { id: 'bg-z09', label: '両替金チェック' },
        { id: 'bg-z10', label: '日報入力' },
        { id: 'bg-z11', label: 'ジャーナルLINE' },
        // ↓ 締めの4つ。ガス元栓を一番下にする
        { id: 'bg-z03', label: 'エアコン電源' },
        { id: 'bg-z04', label: '電気' },
        { id: 'bg-z02', label: '入口・車庫扉施錠' },
        { id: 'bg-z12', label: 'キッチン出入り口施錠' },
        { id: 'bg-z05', label: '洗濯機水栓' },
        { id: 'bg-z06', label: 'ガス元栓' },
      ],
    },
  ],

};

/* ------------------------------------------------------------
 *  5) 未提出の通知時刻（★共有版で使います。現時点では未接続★）
 *
 *  「その営業日の分を、いつ判定して通知するか」を店舗ごと・曜日ごとに指定します。
 *
 *    default … 全曜日の既定値
 *    0〜6    … 曜日ごとの上書き（0=日 1=月 2=火 3=水 4=木 5=金 6=土）
 *    null    … その曜日は通知しない
 *
 *  時刻は営業日基準。24時を超える書き方ができます。
 *    '26:00' → 翌日の 2:00 に、前日の営業分を判定
 *    '29:00' → 翌日の 5:00 に、前日の営業分を判定
 *
 *  定休日は自動で対象外になるため、ここに書く必要はありません。
 * ---------------------------------------------------------- */
const NOTIFY_TIMES = {
  kojare:   { default: '26:00' },
  sumimaro: { default: '26:00' },
  chacoru:  { default: '26:00' },
  baguru:   { default: '23:30' },
  popo:     { default: '26:00', 5: '29:00', 6: '29:00' }, // 金・土は27時閉店のため翌5時
  oiden:    { default: '25:00' },
};

/** 通知の判定を何分おきに走らせるか（設定時刻から最大この分数だけ遅れます） */
const NOTIFY_INTERVAL_MINUTES = 15;

/** その店舗・その曜日の通知時刻を取得（通知しない場合は null） */
function notifyTimeFor(storeId, dow) {
  const conf = NOTIFY_TIMES[storeId];
  if (!conf) return null;
  const v = conf[dow] !== undefined ? conf[dow] : conf.default;
  return v || null;
}

/** このファイルに書いてある初期値。管理アプリで一度も編集していない店舗で使われます */
function defaultChecklist(storeId) {
  return CHECKLIST_OVERRIDES[storeId] || CHECKLIST;
}

/** 店舗の確認項目を取得（管理アプリで変更された内容が優先されます） */
function getChecklist(storeId) {
  return typeof Checklists !== 'undefined' ? Checklists.sections(storeId) : defaultChecklist(storeId);
}

/* 定休日の判定は storage.js の Closed（管理アプリの内容を反映）が持っています */

/** その項目がその日の対象かどうか */
function appliesTo(item, store, y, m, d) {
  const p2 = (n) => String(n).padStart(2, '0');
  const dateStr = `${y}-${p2(m)}-${p2(d)}`;
  // 追加した日より前にはさかのぼらせない／やめた日以降は出さない
  if (item.addedAt && dateStr < item.addedAt) return false;
  if (item.retiredAt && dateStr >= item.retiredAt) return false;
  if (item.onlyDays && !item.onlyDays.includes(d)) return false;
  if (item.hideOnDows && item.hideOnDows.includes(new Date(y, m - 1, d).getDay())) return false;
  return true;
}

/** 店舗を取得 */
function getStore(storeId) {
  return STORES.find((s) => s.id === storeId) || STORES[0];
}
