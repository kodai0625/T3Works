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
        { id: 'it-mso432ijcg7', label: 'C卓の荷物かご', addedAt: '2026-08-11', type: 'check' },
        { id: 'bg-h04', label: 'バッシやり忘れ' },
        { id: 'bg-h05', label: 'ランチメニュー', hideOnDows: [5, 6], pauses: [{"from": "2026-08-10", "to": "2026-08-14"}] },
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
        { id: 'it-msljqvepslk', label: '通信テスト', addedAt: '2026-08-09', retiredAt: '2026-08-10', type: 'check' },
      ],
    },
    {
      id: 'kitchen',
      title: 'キッチン',
      items: [
        { id: 'bg-k01', label: '仕込み表' },
        { id: 'bg-k02', label: '唐揚げ在庫チェック（F卓も）' },
        { id: 'bg-k03', label: 'タコライス在庫チェック' },
        { id: 'it-mslkg6qy82j', label: 'ミックスチーズ補充', addedAt: '2026-08-09', type: 'check' },
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
        { id: 'it-mso44ss87yq', label: 'ケミクール補充', addedAt: '2026-08-11', type: 'check' },
        { id: 'bg-k16', label: 'ごみ捨て' },
        { id: 'bg-k18', label: 'シンク清掃チェック' },
        { id: 'bg-k17', label: 'シンクのゴミかごチェック' },
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
      id: 'sec-mso2tufee2',
      title: '2階',
      items: [
        { id: 'it-mso2u7nqkma', label: '2階電気', addedAt: '2026-08-11', type: 'check' },
        { id: 'it-mso2uk8wfck', label: 'エアコン', addedAt: '2026-08-11', type: 'check' },
        { id: 'it-mso2uoo0lg8', label: '階段の電気', addedAt: '2026-08-11', type: 'check' },
      ],
    },
    {
      id: 'whole',
      title: '全体',
      items: [
        { id: 'bg-z01', label: '発注（FAX流し忘れないか）' },
        { id: 'bg-z07', label: '売上金チェック' },
        { id: 'bg-z08', label: '入金帳・封筒チェック' },
        { id: 'bg-z09', label: '両替金チェック' },
        { id: 'bg-z10', label: '日報入力' },
        { id: 'bg-z11', label: 'ジャーナルLINE' },
        { id: 'bg-z03', label: 'エアコン電源' },
        { id: 'bg-z04', label: '電気' },
        { id: 'bg-z02', label: '入口・車庫扉施錠' },
        { id: 'bg-z12', label: 'キッチン出入り口施錠' },
        { id: 'bg-z05', label: '洗濯機水栓' },
        { id: 'bg-z06', label: 'ガス元栓' },
      ],
    },
  ],

  /* ===== こじゃれ ===== */
  kojare: [
    {
      id: 'kj-kitchen',
      title: 'キッチン',
      items: [
        { id: 'kj-k03', label: 'まな板漂白' },
        { id: 'kj-k07', label: '冷蔵庫・冷凍庫扉チェック' },
        { id: 'kj-k13', label: '炊飯器の米移し' },
        { id: 'kj-k14', label: '炊飯器の保温切られているか' },
        { id: 'it-msojdvsxqsl', label: '米のラップがしっかりされているか', addedAt: '2026-08-11', type: 'check' },
        { id: 'kj-k15', label: '台上食材の確認' },
        { id: 'kj-k18', label: 'ディスペンサー補充、しまってあるか', addedAt: '2026-08-12' },
        { id: 'kj-k19', label: '乾物補充', addedAt: '2026-08-12' },
        { id: 'kj-k20', label: '揚場補充', addedAt: '2026-08-12' },
        { id: 'kj-k21', label: '油補充', addedAt: '2026-08-12' },
        { id: 'kj-k22', label: 'レンジ拭き', addedAt: '2026-08-12' },
        { id: 'kj-k09', label: 'ドリンクサーバー電源' },
        { id: 'kj-k10', label: 'お湯ポット' },
        { id: 'kj-k11', label: 'ビールサーバー締め' },
        { id: 'kj-k16', label: 'おしぼり出す' },
        { id: 'kj-k05', label: '裏口の戸締り' },
        { id: 'kj-k04', label: '賄い後シンク、ゴミ受けカゴ' },
        { id: 'kj-k12', label: 'ゴミ袋を縛ってあるか' },
        { id: 'kj-k06', label: '水道が閉まっているか' },
        { id: 'kj-k08', label: 'ガスの元栓' },
        { id: 'kj-k02', label: 'エアコン確認' },
        { id: 'kj-k01', label: '電気' },
      ],
    },
    {
      id: 'kj-hall',
      title: '1階ホール',
      items: [
        { id: 'kj-h10', label: '掃除機ゴミ捨て', addedAt: '2026-08-12' },
        { id: 'kj-h05', label: 'セットの確認' },
        { id: 'kj-h03', label: '各部屋エアコン確認' },
        { id: 'kj-h08', label: '灰皿', addedAt: '2026-08-12' },
        { id: 'kj-h04', label: '喫煙所' },
        { id: 'kj-h06', label: 'トイレ' },
        { id: 'kj-h07', label: '賄い後テーブル' },
        { id: 'kj-h09', label: '全体エアコン確認', addedAt: '2026-08-12' },
        { id: 'kj-h01', label: '外看板' },
        { id: 'kj-h02', label: '電気' },
      ],
    },
    {
      id: 'kj-2f',
      title: '2階',
      items: [
        { id: 'kj-f03', label: 'ユーセン確認', onlyDows: [5, 6] },
        { id: 'kj-f07', label: '製氷機電源ON', onlyDows: [4] },
        { id: 'kj-f08', label: '製氷機電源OFF', onlyDows: [6] },
        { id: 'kj-f04', label: '洗浄機', onlyDows: [5, 6] },
        { id: 'kj-f05', label: 'ビールサーバー締め', onlyDows: [5, 6] },
        { id: 'kj-f06', label: 'ドリンクサーバー締め', onlyDows: [5, 6] },
        { id: 'kj-f02', label: 'エアコン確認', onlyDows: [5, 6] },
        { id: 'kj-f01', label: '電気', onlyDows: [5, 6] },
      ],
    },
    {
      id: 'kj-irregular',
      title: 'イレギュラー',
      items: [
        { id: 'kj-i01', label: '仕込み移し後2階ストッカー出しっ放し' },
      ],
    },
    {
      id: 'kj-all',
      title: '全体',
      items: [
        { id: 'kj-z01', label: '発注（FAX流し忘れないか）' },
        { id: 'kj-z02', label: '売上金チェック' },
        { id: 'kj-z03', label: '入金帳・封筒チェック' },
        { id: 'kj-z04', label: '両替金チェック' },
        { id: 'kj-z05', label: '日報入力' },
        { id: 'kj-z06', label: 'ジャーナルLINE' },
        { id: 'kj-z07', label: 'ファックス転送' },
        { id: 'kj-z08', label: '各タブレット、決済端末' },
        { id: 'kj-z09', label: '玄関鍵' },
      ],
    },
  ],

  /* ===== 炭まろ ===== */
  sumimaro: [
    {
      id: 'sm-kitchen',
      title: 'キッチン',
      items: [
        { id: 'sm-k17', label: 'まな板漂白' },
        { id: 'sm-k01', label: '冷蔵庫・冷凍庫扉チェック' },
        { id: 'sm-k06', label: '炊飯器の米移し' },
        { id: 'sm-k28', label: '炊飯器の保温切られているか' },
        { id: 'sm-k07', label: '米のラップがしっかりされているか' },
        { id: 'sm-k02', label: '台上食材の確認' },
        { id: 'sm-k10', label: 'ディスペンサー補充、しまってあるか' },
        { id: 'sm-k11', label: '乾物補充' },
        { id: 'sm-k12', label: '揚場補充' },
        { id: 'sm-k16', label: '油補充' },
        { id: 'sm-k19', label: 'レンジ拭き' },
        { id: 'sm-k20', label: 'コンロ掃除' },
        { id: 'sm-k22', label: 'by準備されてるか', onlyDows: [4] },
        { id: 'sm-k21', label: '氷寄せ', onlyDows: [4] },
        { id: 'sm-k09', label: 'セットの確認' },
        { id: 'sm-k08', label: 'ドリ場ショーケース水受け' },
        { id: 'sm-k15', label: 'アルコール類少ないの新品に買える' },
        { id: 'sm-k18', label: 'おしぼりいっぱいなら外に出してあるか' },
        { id: 'sm-k23', label: 'ゴミ箱洗ってあるか', onlyDows: [5, 6] },
        { id: 'sm-k24', label: 'プリンター電源' },
        { id: 'sm-k25', label: 'ビールサーバー締め' },
        { id: 'sm-k26', label: 'フライヤー締めてあるか', onlyDows: [5, 6] },
        { id: 'sm-k27', label: 'フライヤー電源' },
        { id: 'sm-k13', label: '賄い後シンク、ゴミ受けカゴ' },
        { id: 'sm-k14', label: 'シンクゴミ' },
        { id: 'sm-k03', label: '炭壺閉まってるか' },
        { id: 'sm-k05', label: 'ゴミ袋を縛ってあるか' },
        { id: 'sm-k04', label: '水道が閉まっているか' },
      ],
    },
    {
      id: 'sm-1f-hall',
      title: '1階ホール',
      items: [
        { id: 'sm-h01', label: '掃除機ゴミ捨て' },
        { id: 'sm-h07', label: 'セットの確認' },
        { id: 'sm-h04', label: '個室の３つの暖房電源', onlyMonths: [11, 12, 1, 2, 3] },
        { id: 'sm-h02', label: '外灰皿' },
        { id: 'sm-h03', label: 'ユーセン確認' },
        { id: 'sm-h06', label: '業務用エアコン×3確認' },
        { id: 'sm-h05', label: 'ガスの元栓' },
        { id: 'sm-h08', label: '電気' },
      ],
    },
    {
      id: 'sm-2f',
      title: '2階',
      items: [
        { id: 'sm-f02', label: '冷蔵庫・冷凍庫扉チェック' },
        { id: 'sm-f06', label: 'ドリンク少ないの新品に変える' },
        { id: 'sm-f08', label: '家庭用エアコン×1確認' },
        { id: 'sm-f04', label: '掃除機ゴミ捨て' },
        { id: 'sm-f05', label: 'セットの確認' },
        { id: 'sm-f03', label: 'ストッカー扉' },
        { id: 'sm-f01', label: '窓戸締り' },
        { id: 'sm-f07', label: '業務用エアコン×1確認' },
        { id: 'sm-f09', label: 'トイレ電気' },
        { id: 'sm-f10', label: '電気' },
      ],
    },
    {
      id: 'sm-all',
      title: '全体',
      items: [
        { id: 'sm-z01', label: '発注（FAX流し忘れないか）' },
        { id: 'sm-z02', label: '売上金チェック' },
        { id: 'sm-z03', label: '入金帳・封筒チェック' },
        { id: 'sm-z04', label: '両替金チェック' },
        { id: 'sm-z05', label: '日報入力' },
        { id: 'sm-z06', label: 'ジャーナルLINE' },
        { id: 'sm-z07', label: 'ファックス転送' },
        { id: 'sm-z08', label: '各タブレット、決済端末' },
        { id: 'sm-z09', label: '玄関鍵' },
      ],
    },
  ],

  /* ===== ちゃこる ===== */
  chacoru: [
    {
      id: 'ch-kitchen',
      title: 'キッチン',
      items: [
        { id: 'ch-a27', label: 'まな板漂白' },
        { id: 'ch-a01', label: '冷蔵庫・冷凍庫扉チェック' },
        { id: 'ch-a12', label: '炊飯器の米移し' },
        { id: 'ch-a33', label: '炊飯器の保温切られているか', addedAt: '2026-08-12' },
        { id: 'it-msojcofnv3k', label: '米のラップがしっかりされているか', addedAt: '2026-08-11', type: 'check' },
        { id: 'ch-a05', label: '台上食材の確認' },
        { id: 'ch-a18', label: 'ディスペンサー補充、しまってあるか' },
        { id: 'ch-a19', label: '乾物補充' },
        { id: 'ch-a21', label: '揚場補充' },
        { id: 'ch-a26', label: '油補充' },
        { id: 'ch-d06', label: '余り米、冷凍or他店舗に渡す', onlyDows: [6] },
        { id: 'ch-a29', label: 'レンジ拭き' },
        { id: 'ch-a30', label: 'コンロ掃除' },
        { id: 'ch-d02', label: 'by準備されてるか', onlyDows: [4, 5] },
        { id: 'ch-d01', label: '氷寄せ', onlyDows: [4, 5] },
        { id: 'ch-d04', label: 'by解凍の再冷凍', onlyDows: [6] },
        { id: 'ch-a13', label: 'ドリ場ショーケース水受け' },
        { id: 'ch-a24', label: 'アルコール類少ないの新品に買える' },
        { id: 'ch-d05', label: 'ゴミ箱洗ってあるか', onlyDows: [6] },
        { id: 'ch-a10', label: 'プリンター電源' },
        { id: 'ch-a14', label: 'ビールサーバー締め' },
        { id: 'ch-d03', label: 'フライヤー締めてあるか', onlyDows: [5, 6] },
        { id: 'ch-a16', label: 'フライヤー元栓' },
        { id: 'ch-a02', label: '裏口の戸締り' },
        { id: 'ch-a32', label: '賄い後シンク、ゴミ受けカゴ' },
        { id: 'ch-a23', label: 'シンクゴミ' },
        { id: 'ch-a07', label: '炭壺閉まってるか' },
        { id: 'ch-a09', label: 'ゴミ袋を縛ってあるか' },
        { id: 'ch-a08', label: '水道が閉まっているか' },
        { id: 'ch-a06', label: 'ガスの元栓' },
        { id: 'ch-d07', label: '2階の開きかけの生樽おろす', onlyDows: [6], retiredAt: '2026-08-13' },
      ],
    },
    {
      id: 'ch-1f-hall',
      title: '1階ホール',
      items: [
        { id: 'ch-a11', label: '掃除機ゴミ捨て' },
        { id: 'ch-a15', label: 'セットの確認' },
        { id: 'ch-a04', label: 'エアコン確認F1' },
        { id: 'ch-a20', label: '外灰皿' },
        { id: 'ch-a25', label: 'ユーセン確認' },
        { id: 'ch-a17', label: '納品されたおしぼり中に入れてあるか' },
        { id: 'ch-a28', label: 'おしぼりいっぱいなら外に出してあるか' },
        { id: 'ch-a22', label: '賄い後テーブル' },
        { id: 'ch-a31', label: '外看板' },
        { id: 'ch-a03', label: '業務用エアコン×2確認' },
      ],
    },
    {
      id: 'ch-2f',
      title: '2階',
      items: [
        { id: 'ch-b04', label: '冷蔵庫・冷凍庫扉チェック' },
        { id: 'ch-b08', label: 'ドリンク少ないの新品に変える' },
        { id: 'ch-d07', label: '2階の開きかけの生樽おろす', onlyDows: [6], addedAt: '2026-08-12' },
        { id: 'ch-b07', label: 'セットの確認' },
        { id: 'ch-b03', label: '窓戸締り' },
        { id: 'ch-b01', label: '業務用エアコン×1確認' },
        { id: 'ch-b02', label: '家庭用エアコン×4確認' },
        { id: 'ch-b05', label: 'トイレ電気' },
        { id: 'ch-b06', label: '外照明' },
      ],
    },
    {
      id: 'ch-3f',
      title: '3階',
      items: [
        { id: 'ch-c03', label: 'ストッカー扉' },
        { id: 'ch-c04', label: '掃除機ゴミ捨て' },
        { id: 'ch-c02', label: '窓戸締り' },
        { id: 'ch-c05', label: '更衣室　扇風機、エアコン確認' },
        { id: 'ch-c01', label: '電気' },
      ],
    },
    {
      id: 'ch-all',
      title: '全体',
      items: [
        { id: 'ch-z01', label: '発注（FAX流し忘れないか）' },
        { id: 'ch-z02', label: '売上金チェック' },
        { id: 'ch-z03', label: '入金帳・封筒チェック' },
        { id: 'ch-z04', label: '両替金チェック' },
        { id: 'ch-z05', label: '日報入力' },
        { id: 'ch-z06', label: 'ジャーナルLINE' },
        { id: 'ch-z07', label: 'ファックス転送' },
        { id: 'ch-z08', label: '各タブレット、決済端末' },
        { id: 'ch-z09', label: '玄関鍵' },
      ],
    },
  ],

  /* ===== popo ===== */
  popo: [
    {
      id: 'pp-kitchen',
      title: 'キッチン',
      items: [
        { id: 'it-msoj9sz58bc', label: 'まな板漂白', addedAt: '2026-08-11', type: 'check' },
        { id: 'pp-k01', label: '水が出しっぱになってないか' },
        { id: 'pp-k24', label: '洗浄機確認' },
        { id: 'pp-k14', label: 'モナン系とグラノラ補充確認' },
        { id: 'pp-k02', label: 'IH電源' },
        { id: 'pp-k03', label: '炊飯器洗えてるか' },
        { id: 'pp-k04', label: '炊飯器保温切れてるか' },
        { id: 'pp-k05', label: 'コンロのガス確認' },
        { id: 'pp-k06', label: 'ボイラー電源' },
        { id: 'pp-k07', label: 'プリンター電源' },
        { id: 'pp-k25', label: 'ビールサーバー確認' },
        { id: 'pp-k23', label: 'コーヒーマシン電源' },
        { id: 'pp-k08', label: 'スチコン' },
        { id: 'pp-k12', label: 'ホットプレートコンセント抜く' },
        { id: 'pp-k13', label: '野菜、乾物、デザートトッピング系補充確認' },
        { id: 'pp-k19', label: 'レンジ拭けてるか' },
        { id: 'pp-k21', label: 'パスタ場、パティ等しっかりラップされてるか' },
        { id: 'pp-k09', label: 'パンケーキグリドル電源' },
        { id: 'pp-k10', label: 'ソフトマシン確認' },
        { id: 'pp-k16', label: 'パティとランチ確認' },
        { id: 'pp-k30', label: 'ランチとパティ回収するか確認' },
        { id: 'pp-k11', label: 'クロッフルマシンとかき氷器コンセント抜く' },
        { id: 'pp-k22', label: 'フライヤー電源' },
        { id: 'pp-k15', label: '冷蔵冷凍庫、ストッカー扉確認' },
        { id: 'pp-k18', label: 'ドリ場ショーケース下の水捨て' },
        { id: 'pp-k17', label: 'エアコン確認' },
        { id: 'pp-k20', label: '計りが拭けてるか' },
        { id: 'pp-k26', label: '残飯残ってないか' },
        { id: 'pp-k27', label: 'ゴミ袋縛ってあるか' },
        { id: 'pp-k28', label: 'コースがあれば盛り込み等確認' },
        { id: 'pp-k29', label: '仕込み表確認' },
        { id: 'pp-k31', label: '電気' },
      ],
    },
    {
      id: 'pp-hall',
      title: 'ホール',
      items: [
        { id: 'pp-h01', label: 'リザーブ表確認' },
        { id: 'pp-h02', label: 'セット確認' },
        { id: 'pp-h03', label: '更衣室扉施錠' },
        { id: 'pp-h04', label: '更衣室のショーケース確認' },
        { id: 'pp-h05', label: 'デシャップ下、更衣室ショーケース下の水捨て' },
        { id: 'pp-h06', label: 'トイレ確認' },
        { id: 'pp-h07', label: '灰皿確認' },
        { id: 'pp-h08', label: 'レジiPad系電源' },
        { id: 'pp-h09', label: 'ウーバーPad画面暗くする' },
        { id: 'pp-h10', label: '食べログとインスタ確認' },
      ],
    },
    {
      id: 'pp-all',
      title: '全体',
      items: [
        { id: 'pp-z01', label: '発注（FAX流し忘れないか）' },
        { id: 'pp-z02', label: '売上金チェック' },
        { id: 'pp-z03', label: '入金帳・封筒チェック' },
        { id: 'pp-z04', label: '両替金チェック' },
        { id: 'pp-z05', label: '日報入力' },
        { id: 'pp-z06', label: 'ジャーナルLINE' },
        { id: 'pp-z07', label: '入り口、レジ小窓、大扉施錠' },
        { id: 'pp-z08', label: '翌日の事前オーダー確認' },
        { id: 'pp-z09', label: '電気' },
        { id: 'pp-z10', label: 'ガス元栓' },
        { id: 'it-mso3xwzhe1x', label: '入口施錠', addedAt: '2026-08-11', type: 'check' },
      ],
    },
  ],

  /* ===== おいでんテラス ===== */
  oiden: [
    {
      id: 'od-all',
      title: '全体',
      items: [
        { id: 'od-z01', label: '電気6箇所全て切ったか' },
        { id: 'od-z02', label: 'ドリバ窓、扉閉まってるか' },
        { id: 'od-z03', label: 'キッチン窓、扉閉まってるか' },
        { id: 'od-z04', label: 'ガスの元栓2箇所閉めたか' },
        { id: 'od-z05', label: '冷蔵庫冷凍庫11箇所異常ないか' },
        { id: 'od-z06', label: 'エアコン2箇所切ったか' },
        { id: 'od-z07', label: 'フライヤー切ったか' },
      ],
    },
  ],

};

/* ------------------------------------------------------------
 *  4) 週間掃除の項目
 *
 *  毎日のチェックとは別に、「週に1回まわす掃除」を1か月の表で管理します。
 *  縦が項目、横が週（日曜はじまり）です。
 *
 *  item
 *    id    : 英数字で固定（★変えると過去の記録が消えて見えるので注意★）
 *    label : 画面に出る項目名
 *    every : 'week'   … 毎週やる（省略時はこちら）
 *            'biweek' … 2週間に1回でよい
 *    addedAt / retiredAt … 管理アプリで追加・削除した日（過去の記録を守るため）
 *
 *  ここに書いてあるのは初期値です。管理アプリで店舗ごとに
 *  追加・削除・並べ替え・頻度の変更ができ、そちらが優先されます。
 * ---------------------------------------------------------- */
const WEEKLY_DEFAULT = [
  { id: 'wk-seat',    label: '2名席ガタつき確認' },
  { id: 'wk-station', label: 'ステーション備品補充' },
  { id: 'wk-floor',   label: '床の黒ずみ・机の溝掃除' },
  { id: 'wk-toilet',  label: 'トイレの洗面所水垢取り' },
  { id: 'wk-fridge',  label: '冷蔵庫フィルター' },
  { id: 'wk-steam',   label: 'スチコンフィルター' },
  { id: 'wk-case',    label: 'ショーケースサッシ掃除' },
  { id: 'wk-gutter',  label: '溝掃除' },
  { id: 'wk-grease',  label: 'グリスト' },
  { id: 'wk-stocker', label: 'ストッカー霜取り' },
  { id: 'wk-shelf',   label: '食器棚拭き掃除' },
];

/* ------------------------------------------------------------
 *  2週間の区切り（期）の起点
 *
 *  ここに書いた日曜から、2週間ずつ区切っていきます。
 *  全店舗で同じ区切りになるので、6店舗まとめて比べられます。
 *  ずらしたくなったら、この日付を別の日曜に書き換えるだけです
 *  （過去の記録は週ごとに持っているので、消えたりしません）。
 * ---------------------------------------------------------- */
const PERIOD_ANCHOR = '2026-08-02';

/* 店舗ごとに初期値を変えたいときはここに書きます。
   （書かなければ全店舗 WEEKLY_DEFAULT から始まります）
   例）const WEEKLY_OVERRIDES = { popo: [ { id:'wk-a', label:'…' } ] }; */
const WEEKLY_OVERRIDES = {};

/* ------------------------------------------------------------
 *  5) 業務の一覧（★ページを増やす場所★）
 *
 *  アプリは「店舗をえらぶ → 業務をえらぶ → その画面」の3段です。
 *  新しい業務のページを足すときは、ここに1つ足してください。
 *
 *    id    : 画面の名前。URL（#/店舗/ここ/…）にも使います
 *    name  : 業務選択画面と見出しに出る名前
 *    sub   : その下に出る短い説明
 *    when  : 省略可。false を返すと一覧に出しません
 *
 *  「その店舗のいまの状況」を業務選択画面に出すため、
 *  status(storeId) は app.js の taskStatus() が担当します。
 * ---------------------------------------------------------- */
const TASKS = [
  { id: 'day',   name: '日別',     sub: '毎日の確認' },
  { id: 'week',  name: '週間掃除', sub: '2週間ごと' },
  { id: 'month', name: '月間表',   sub: '1か月の一覧', when: () => APP.showMonthView !== false },
];

/** いま使える業務だけ */
function taskList() {
  return TASKS.filter((t) => typeof t.when !== 'function' || t.when());
}

/** id から業務を引く */
function getTask(id) {
  return TASKS.find((t) => t.id === id) || null;
}

/* ------------------------------------------------------------
 *  6) 未提出の通知時刻（★共有版で使います。現時点では未接続★）
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

/* ------------------------------------------------------------
 *  週間掃除
 *
 *  週は「日曜はじまり・土曜おわり」です。
 *  1つの週は 'YYYY-MM-DD'（その週の日曜の日付）で表します。
 *  月をまたぐ週は、両方の月の表に同じものとして出ます
 *  （記録は1つなので、どちらでチェックしても同じです）。
 * ---------------------------------------------------------- */

/** Date を 'YYYY-MM-DD' にする */
function dateToStr(dt) {
  const p2 = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())}`;
}

/** その日が属する週の日曜（'YYYY-MM-DD'） */
function weekStartOf(y, m, d) {
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - dt.getDay());
  return dateToStr(dt);
}

/** 週の日曜から、その週の土曜（'YYYY-MM-DD'） */
function weekEndOf(startStr) {
  const [y, m, d] = startStr.split('-').map(Number);
  return dateToStr(new Date(y, m - 1, d + 6));
}

/** 表の見出し用。'8/2' のような短い表記 */
function weekShortLabel(startStr) {
  const [, m, d] = startStr.split('-').map(Number);
  return `${m}/${d}`;
}

/** 「8/2（日）〜8/8（土）」のような表記 */
function weekRangeLabel(startStr) {
  const e = weekEndOf(startStr);
  const [, sm, sd] = startStr.split('-').map(Number);
  const [, em, ed] = e.split('-').map(Number);
  return `${sm}/${sd}（日）〜${em}/${ed}（土）`;
}

/** このファイルに書いてある初期値。管理アプリで一度も編集していない店舗で使われます */
function defaultWeekly(storeId) {
  return WEEKLY_OVERRIDES[storeId] || WEEKLY_DEFAULT;
}

/** 店舗の週間掃除の項目を取得（管理アプリで変更された内容が優先されます） */
function getWeekly(storeId) {
  return typeof Weeklies !== 'undefined' ? Weeklies.items(storeId) : defaultWeekly(storeId);
}

/**
 * その項目が、その週の対象かどうか
 *
 * 追加した日を含む週から出て、削除した日を含む週まで残ります
 * （日別のチェックと同じで、過去の記録は当時のまま残します）。
 */
function weeklyAppliesTo(item, startStr) {
  const endStr = weekEndOf(startStr);
  if (item.addedAt && endStr < item.addedAt) return false;
  if (item.retiredAt && startStr >= item.retiredAt) return false;
  return true;
}

/** 週間掃除の記録キー。日別の記録（storeId/YYYY-MM-DD）とぶつからないよう W を付けます */
function weekRecKey(startStr) {
  return `W${startStr}`;
}

/* ------------------------------------------------------------
 *  2週間の区切り（期）
 *
 *  PERIOD_ANCHOR の日曜から2週間ずつ。提出と達成率はこの単位です。
 *  期は「その期の1週目の日曜」で表します。
 * ---------------------------------------------------------- */

/** 2つの日付（'YYYY-MM-DD'）が何日離れているか */
function daysBetween(aStr, bStr) {
  const [ay, am, ad] = aStr.split('-').map(Number);
  const [by, bm, bd] = bStr.split('-').map(Number);
  return Math.round((new Date(by, bm - 1, bd) - new Date(ay, am - 1, ad)) / 86400000);
}

/** その週が属する期の1週目（'YYYY-MM-DD'） */
function periodStartOf(weekStartStr) {
  const weeks = daysBetween(PERIOD_ANCHOR, weekStartStr) / 7;
  // 起点より前（マイナス）でも正しく区切れるよう floor を使います
  const back = ((Math.floor(weeks) % 2) + 2) % 2;
  return addDaysStr(weekStartStr, -back * 7);
}

/** その日が属する期の1週目 */
function periodOfDate(y, m, d) {
  return periodStartOf(weekStartOf(y, m, d));
}

/** 期に含まれる2つの週（日曜の日付） */
function periodWeeks(periodStart) {
  return [periodStart, addDaysStr(periodStart, 7)];
}

/** 期の最終日（2週目の土曜） */
function periodEndOf(periodStart) {
  return addDaysStr(periodStart, 13);
}

/** 'YYYY-MM-DD' に日数を足す */
function addDaysStr(str, n) {
  const [y, m, d] = str.split('-').map(Number);
  return dateToStr(new Date(y, m - 1, d + n));
}

/** 「8/9（日）〜8/22（土）」のような表記 */
function periodRangeLabel(periodStart) {
  const e = periodEndOf(periodStart);
  const [, sm, sd] = periodStart.split('-').map(Number);
  const [, em, ed] = e.split('-').map(Number);
  return `${sm}/${sd}（日）〜${em}/${ed}（土）`;
}

/** その項目は「2週間に1回」か */
function isBiweekly(item) {
  return item.every === 'biweek';
}

/**
 * その期にやるべきことを1つずつ並べる（達成率の分母になります）
 *
 *   毎週の項目     … 1週目と2週目で1つずつ（2つ）
 *   2週に1回の項目 … 期に1つだけ。記録は1週目のところに入れます
 */
function periodSlots(storeId, periodStart) {
  const weeks = periodWeeks(periodStart);
  const out = [];
  getWeekly(storeId).forEach((item) => {
    if (isBiweekly(item)) {
      if (weeks.some((w) => weeklyAppliesTo(item, w))) {
        out.push({ item, week: periodStart, span: 2 });
      }
      return;
    }
    weeks.forEach((w) => {
      if (weeklyAppliesTo(item, w)) out.push({ item, week: w, span: 1 });
    });
  });
  return out;
}

/** その1マスが済んでいるか */
function slotDone(storeId, slot) {
  const rec = Store.getDay(storeId, weekRecKey(slot.week));
  return !!(rec.items && rec.items[slot.item.id] && rec.items[slot.item.id].done);
}

/** 期の達成状況 { total, done, rate, submittedAt, submittedBy } */
function periodStatus(storeId, periodStart) {
  const slots = periodSlots(storeId, periodStart);
  const done = slots.filter((s) => slotDone(storeId, s)).length;
  const rec = Store.getDay(storeId, weekRecKey(periodStart));
  return {
    total: slots.length,
    done,
    rate: slots.length ? Math.round((done / slots.length) * 100) : 0,
    submittedAt: rec.submittedAt || null,
    submittedBy: rec.submittedBy || '',
    staff: rec.staff || '',
  };
}


/* 定休日の判定は storage.js の Closed（管理アプリの内容を反映）が持っています */

/**
 * 休止期間の判定
 *
 *   pauses: [{ from: '2026-12-29', to: '2027-01-03' }, ...]
 *
 * 年末年始などで一時的に外したいときに使います。
 * 「やめる（retiredAt）」と違い、期間が過ぎれば自動で戻ります。
 */
function isPaused(target, dateStr) {
  const list = target && target.pauses;
  if (!Array.isArray(list) || !list.length) return false;
  return list.some((p) => p && p.from && p.to && dateStr >= p.from && dateStr <= p.to);
}

/**
 * その項目がその日の対象かどうか
 *
 *   onlyDays   … その日付だけ出す（肉の日POPの [28] など）
 *   onlyDows   … その曜日だけ出す（0=日 … 6=土）
 *   hideOnDows … その曜日は出さない
 *   addedAt / retiredAt … 管理アプリで追加・削除した日（過去の記録を守るため）
 *
 * section を渡すと、区分に付いた曜日の指定も一緒に効きます
 * （「二階（金土のみ）」のように、区分ごと曜日で出し分けるため）。
 */
function appliesTo(item, store, y, m, d, section) {
  const p2 = (n) => String(n).padStart(2, '0');
  const dateStr = `${y}-${p2(m)}-${p2(d)}`;
  const dow = new Date(y, m - 1, d).getDay();

  if (section) {
    if (section.onlyDows && !section.onlyDows.includes(dow)) return false;
    if (section.addedAt && dateStr < section.addedAt) return false;
    if (section.retiredAt && dateStr >= section.retiredAt) return false;
    if (isPaused(section, dateStr)) return false;
  }
  // 長期休みなど、期間を決めて一時的に外している項目
  if (isPaused(item, dateStr)) return false;
  // 追加した日より前にはさかのぼらせない／やめた日以降は出さない
  if (item.addedAt && dateStr < item.addedAt) return false;
  if (item.retiredAt && dateStr >= item.retiredAt) return false;
  if (item.onlyDays && !item.onlyDays.includes(d)) return false;
  if (item.onlyDows && !item.onlyDows.includes(dow)) return false;
  // その月だけ出す（暖房など季節もののため）。例）onlyMonths: [11,12,1,2,3]
  if (item.onlyMonths && !item.onlyMonths.includes(m)) return false;
  if (item.hideOnDows && item.hideOnDows.includes(dow)) return false;
  return true;
}

/** 店舗を取得 */
function getStore(storeId) {
  return STORES.find((s) => s.id === storeId) || STORES[0];
}
