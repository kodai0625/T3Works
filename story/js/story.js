'use strict';
/*
 * ストーリーズ作成（マインから開くページ）
 *
 * 商品リスト・写真・デザイン・店舗情報は、Macの道具
 * （../ストーリーズ画像/つくる.py）とまったく同じものを読んでいます。
 * 置き場は story/ の中の1か所だけです。
 *
 *   products.csv … 商品リスト（店舗の列で分かれている）
 *   photos/<店舗id>/ … 商品写真
 *   templates/   … デザイン（HTML）と共通.css
 *   設定.json    … 共通の決まりと、店舗ごとの色・ロゴ・営業時間・使うデザイン
 *
 * 画像にする手順は、テンプレートに文字と写真を入れて
 * そのままの見た目をSVGに包み、canvasで1080×1920にする、というものです。
 */

const el = (id) => document.getElementById(id);

// 公開したときに付く版の印。古い読み込みが残らないようにする
const 版 = document.querySelector('meta[name="app-version"]')?.content || '';
const 印つき = (url) => (版 ? url + (url.includes('?') ? '&' : '?') + 'v=' + 版 : url);

let 設定 = null;          // { 共通, 店舗[] }
let 全商品 = [];
let 営業時間表 = {};
let 共通CSS元 = '';

let いまの店舗 = null;    // 設定.店舗 のひとつ
let いま = null;          // 共通と店舗をまとめたもの
let 店の商品 = [];
let いまの商品 = null;
let いまの型 = null;
let 店のイベント = null;   // その店舗のイベント（肉の日など）
let いまの写真番号 = 0;    // 1商品に写真が何枚かあるときの、いま見ている枚目

const 画像の控え = new Map();
const 雛形の控え = new Map();

// ------------------------------------------------------------ 小さな道具

function エスケープ(値) {
  return String(値 ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function 差し込む(雛形, 表) {
  let 文 = 雛形;
  for (const [鍵, 値] of Object.entries(表)) 文 = 文.split(鍵).join(値);
  return 文;
}

async function 取ってくる(url) {
  const res = await fetch(印つき(url), { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url} が読めませんでした（${res.status}）`);
  return res;
}

function しくじり(err) {
  console.error(err);
  const box = el('errorBox');
  box.textContent = 'うまくいきませんでした。\n' + (err && err.message ? err.message : err);
  box.classList.remove('is-hidden');
}

// ------------------------------------------------------------ 商品リスト（CSV）

function CSVを読む(text) {
  text = text.replace(/^﻿/, '');
  const 行たち = [];
  let 欄 = '';
  let 一行 = [];
  let 引用中 = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (引用中) {
      if (c === '"') {
        if (text[i + 1] === '"') { 欄 += '"'; i++; } else { 引用中 = false; }
      } else { 欄 += c; }
    } else if (c === '"') {
      引用中 = true;
    } else if (c === ',') {
      一行.push(欄); 欄 = '';
    } else if (c === '\n') {
      一行.push(欄); 行たち.push(一行); 一行 = []; 欄 = '';
    } else if (c !== '\r') {
      欄 += c;
    }
  }
  if (欄 !== '' || 一行.length) { 一行.push(欄); 行たち.push(一行); }

  const 見出し = (行たち.shift() || []).map((s) => s.trim());
  return 行たち
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => Object.fromEntries(見出し.map((h, i) => [h, (r[i] || '').trim()])));
}

// ------------------------------------------------------------ 営業時間（CSV）

/**
 * 営業時間.csv を店舗ごとにまとめる
 *
 * 店舗・区分・時間 の3列。同じ区分を2行書けば2行で出る（平日の昼と夜のように）。
 * 区分が「定休日」の行は定休日。Numbersでいつでも直せるようにCSVに置いている。
 */
function 営業時間をまとめる(行たち) {
  const 表 = {};
  for (const 行 of 行たち) {
    const 店 = String(行['店舗'] || '').trim();
    const 区分 = String(行['区分'] || '').trim();
    const 時間 = String(行['時間'] || '').trim();
    if (!店 || !区分 || !時間) continue;
    const まとまり = (表[店.toLowerCase()] ||= { 営業時間: [], 定休日: '' });
    if (区分 === '定休日') { まとまり.定休日 = 時間; continue; }
    const 並び = まとまり.営業時間;
    if (並び.length && 並び[並び.length - 1].名前 === 区分) 並び[並び.length - 1].時間.push(時間);
    else 並び.push({ 名前: 区分, 時間: [時間] });
  }
  return 表;
}

// ------------------------------------------------------------ 設定（共通＋店舗）

function まとめる(店舗) {
  const 共通 = 設定['共通'] || {};
  const 鍵 = [店舗['id'], 店舗['名前']]
    .map((v) => String(v || '').toLowerCase())
    .find((v) => v && 営業時間表[v]) || '';
  const ブランド = Object.assign(
    { 下地: '#efe9e1', 文字: '#241f1a', うすい文字: '#7b6f62' },
    店舗['ブランド'] || {}
  );
  return Object.assign({}, 共通, {
    店舗id: 店舗['id'] || '',
    店舗名: 店舗['名前'] || '',
    店舗説明: 店舗['説明'] || '',
    ロゴ: 店舗['ロゴ'] || '',
    テンプレート: (店舗['テンプレート'] || []).slice(),
    営業時間: (営業時間表[鍵] || {}).営業時間 || [],
    定休日: (営業時間表[鍵] || {}).定休日 || '',
    イベント: (店舗['イベント'] || []).slice(),
    ブランド,
    '1日の枚数': 店舗['1日の枚数'] ?? 共通['1日の枚数'],
    税表示: 店舗['税表示'] ?? 共通['税表示'],
    価格の書き方: 店舗['価格の書き方'] ?? 共通['価格の書き方'],
  });
}

function その店舗の商品(店舗) {
  const 印 = new Set([String(店舗['id'] || '').toLowerCase(), String(店舗['名前'] || '').toLowerCase()]);
  印.delete('');
  return 全商品.filter((行) =>
    印.has(String(行['店舗'] || '').trim().toLowerCase()) &&
    (行['商品名'] || '').trim() &&
    (行['写真'] || '').trim()
  );
}

// ------------------------------------------------------------ 文字と写真を入れる

function 名前サイズ(商品名) {
  const 長さ = [...String(商品名 || '')].length;
  if (長さ <= 7) return '大';
  if (長さ <= 13) return '中';
  return '小';
}

function 価格の文字(価格) {
  const 数字 = String(価格 ?? '').replace(/[,¥円\s]/g, '');
  if (!/^\d+$/.test(数字)) return String(価格 || '');
  return (いま['価格の書き方'] || '¥{価格}').replace('{価格}', Number(数字).toLocaleString('ja-JP'));
}

function 価格ブロック(価格, 価格表) {
  let 元 = String(価格 ?? '').trim();
  if (!元 && 価格表) {
    // 価格が空でも価格表があるときは、いちばん安い値段に「〜」を付ける
    const 数たち = 価格を読む(価格表)
      .map((一つ) => String(一つ.値).replace(/[,¥円\s]/g, ''))
      .filter((v) => /^\d+$/.test(v))
      .map(Number);
    if (!数たち.length) return '';
    const 本文 = (いま['価格の書き方'] || '¥{価格}')
      .replace('{価格}', Math.min(...数たち).toLocaleString('ja-JP')) + '〜';
    const 頭 = (本文.match(/^\D*/) || [''])[0];
    let 中身 = `<span class="円">${エスケープ(頭)}</span>` + エスケープ(本文.slice(頭.length));
    const 税 = String(いま['税表示'] || '').trim();
    if (税) 中身 += `<span class="税">${エスケープ(税)}</span>`;
    return `<div class="価格">${中身}</div>`;
  }
  if (!元) return '';
  const 本文 = 価格の文字(元);
  const 頭 = (本文.match(/^\D*/) || [''])[0];
  const 残り = 本文.slice(頭.length);
  let 中身 = (頭 ? `<span class="円">${エスケープ(頭)}</span>` : '') + エスケープ(残り);
  const 税 = String(いま['税表示'] || '').trim();
  if (税) 中身 += `<span class="税">${エスケープ(税)}</span>`;
  return `<div class="価格">${中身}</div>`;
}

/** 「1枚=1450／2枚=1850」を、名前と値の組に分ける */
function 価格を読む(価格表) {
  return String(価格表 || '')
    .split(/[／\n]/)
    .map((部分) => 部分.trim())
    .filter(Boolean)
    .map((部分) => {
      const 位置 = 部分.indexOf('=');
      const 名前 = 位置 < 0 ? 部分 : 部分.slice(0, 位置).trim();
      const 値 = 位置 < 0 ? 部分 : 部分.slice(位置 + 1).trim();
      return { 名前, 値: 値 || 名前 };
    });
}

function 値の書き方(値) {
  const 数字 = String(値).replace(/[,¥円\s]/g, '');
  if (!/^\d+$/.test(数字)) return String(値);
  return (いま['価格の書き方'] || '¥{価格}').replace('{価格}', Number(数字).toLocaleString('ja-JP'));
}

/** サイズ違いの値段の一覧（10_バグる のように場所のあるデザイン用） */
function 価格表ブロック(価格表) {
  const 組 = 価格を読む(価格表);
  if (!組.length) return '';
  const 中身 = 組
    .map((一つ) => `<div class="品"><span class="名">${エスケープ(一つ.名前)}</span>` +
                   `<span class="額">${エスケープ(値の書き方(一つ.値))}</span></div>`)
    .join('');
  const 税 = String(いま['税表示'] || '').trim();
  const しっぽ = 税 ? `<div class="税書き">${エスケープ(税)}</div>` : '';
  return `<div class="価格表">${中身}${しっぽ}</div>`;
}

function 説明ブロック(説明) {
  const 元 = String(説明 ?? '').trim();
  if (!元) return '';
  const 行たち = 元.split(/[／\n]/).map((s) => s.trim()).filter(Boolean);
  return `<div class="説明">${行たち.map((行) => `<p>${エスケープ(行)}</p>`).join('')}</div>`;
}

function 営業時間ブロック() {
  const 並び = いま['営業時間'] || [];
  if (!並び.length) return '';
  let 中身 = '';
  for (const 一つ of 並び) {
    // 「時間」は1つでも、いくつ並べてもよい（平日の昼と夜のように）
    const 刻たち = Array.isArray(一つ['時間']) ? 一つ['時間'] : [一つ['時間']];
    const 刻 = 刻たち
      .filter((t) => String(t || '').trim())
      .map((t) => `<span class="刻">${エスケープ(t)}</span>`)
      .join('');
    中身 += `<div class="時間"><span class="区分">${エスケープ(一つ['名前'] || '')}</span>${刻}</div>`;
  }
  const 定休日 = String(いま['定休日'] || '').trim();
  if (定休日) 中身 += `<div class="定休日">定休日：${エスケープ(定休日)}</div>`;
  // GW・お盆・年末年始のような「変わることがある」話は画像に出さない
  return `<div class="営業時間"><div class="見出し">【営業時間】</div>${中身}</div>`;
}

/** うるう年かどうか */
function うるう年(年) {
  return 年 % 4 === 0 && (年 % 100 !== 0 || 年 % 400 === 0);
}

/**
 * その日に当たるイベント（肉の日など）を返す
 *
 * 「毎月の日」が29のように、うるう年でない2月には来ない日のときは、
 * 「うるう年でない2月」に書いた日に読みかえる。
 */
function その日のイベント(店舗, 日 = new Date()) {
  const 当たり = [];
  for (const イベント of 店舗['イベント'] || []) {
    const 毎月の日 = イベント['毎月の日'];
    const 代わり = イベント['うるう年でない2月'];
    if (日.getMonth() === 1 && 代わり && !うるう年(日.getFullYear())) {
      if (日.getDate() === Number(代わり)) 当たり.push(イベント);
    } else if (毎月の日 && 日.getDate() === Number(毎月の日)) {
      当たり.push(イベント);
    }
  }
  return 当たり;
}

/** 肉の日のようなイベントの札。付けないときは空 */
function イベント札(商品) {
  const イベント = 使うイベント();
  const 名前 = イベント ? (イベント['名前'] || '') : String((商品 || {})['札'] || '').trim();
  if (!名前) return '';
  const 色 = イベント ? (イベント['札の色'] || '#c0392b') : '#2f7d4f';
  return `<div class="イベント札" style="background:${エスケープ(色)}">${エスケープ(名前)}</div>`;
}

/** いま札を付けるイベント（入り／切りのチェックで決まる） */
function 使うイベント() {
  return 店のイベント && el('eventToggle').checked ? 店のイベント : null;
}

function 共通CSS(文字数) {
  const 色 = いま['色'] || {};
  const ブランド = いま['ブランド'] || {};
  return 差し込む(共通CSS元, {
    '{{文字数}}': String(Math.max(文字数, 1)),
    '{{幅}}': String(いま['画像の幅']),
    '{{高さ}}': String(いま['画像の高さ']),
    '{{安全上}}': String(いま['セーフゾーン上']),
    '{{安全下}}': String(いま['セーフゾーン下']),
    '{{色背景}}': 色['背景'],
    '{{色文字}}': 色['文字'],
    '{{色差し色}}': 色['差し色'],
    '{{色うすい文字}}': 色['うすい文字'],
    '{{ブランド下地}}': ブランド['下地'],
    '{{ブランド文字}}': ブランド['文字'],
    '{{ブランドうすい文字}}': ブランド['うすい文字'],
  });
}

async function 雛形を読む(型) {
  if (!雛形の控え.has(型)) {
    雛形の控え.set(型, (await 取ってくる(`templates/${encodeURIComponent(型)}.html`)).text());
  }
  return 雛形の控え.get(型);
}

/** 画像を1920pxまでに縮めて data: にする（SVGに埋め込むため） */
function 画像を読む(場所) {
  if (画像の控え.has(場所)) return 画像の控え.get(場所);

  const 約束 = (async () => {
    const blob = await (await 取ってくる(場所)).blob();
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();

      const 最大 = 1920;
      const 倍 = Math.min(1, 最大 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * 倍));
      const h = Math.max(1, Math.round(img.naturalHeight * 倍));

      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      // ロゴは透けている部分があるのでPNGのまま、写真はJPEGで軽くする
      return /\.png$/i.test(場所) ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.92);
    } finally {
      URL.revokeObjectURL(url);
    }
  })();

  画像の控え.set(場所, 約束);
  return 約束;
}

/** 商品の写真は「／」でいくつでも並べられる */
function 写真たち(商品) {
  return String(商品['写真'] || '')
    .split(/[／,]/)
    .map((名前) => 名前.trim())
    .filter(Boolean)
    .map((名前) => `photos/${encodeURIComponent(いま.店舗id)}/${encodeURIComponent(名前)}`);
}

function 写真の場所(商品, 番号 = 0) {
  const 一覧 = 写真たち(商品);
  return 一覧.length ? 一覧[((番号 % 一覧.length) + 一覧.length) % 一覧.length] : '';
}

/**
 * 商品をえらぶ画面にならべる、小さい写真
 *
 * ★ 元の写真は1枚1MB近くある。20品ぶんを一覧で読むとiPhoneが表示しきれず、
 *   写真が出ないまま灰色になる。一覧は photos/<店舗>/小/ の軽い写真を使う。
 */
function 小さい写真(商品, 番号 = 0) {
  const 場所 = 写真の場所(商品, 番号);
  if (!場所) return '';
  const 切れ目 = 場所.lastIndexOf('/');
  return 場所.slice(0, 切れ目) + '/%E5%B0%8F' + 場所.slice(切れ目);
}

async function 一枚のHTML(商品, 型, 写真番号 = 0) {
  const 雛形 = await 雛形を読む(型);
  const 写真URL = await 画像を読む(写真の場所(商品, 写真番号));
  const ロゴURL = いま.ロゴ ? await 画像を読む(いま.ロゴ).catch(() => '') : '';
  const 名前 = 商品['商品名'] || '';
  // 価格表を出すデザインでは、価格が空でも「¥1,350〜」を出さない（二重になるため）
  const 表を出す = 雛形.includes('{{価格表ブロック}}');

  const 出来 = 差し込む(雛形, {
    '{{共通CSS}}': 共通CSS([...名前].length),
    '{{写真URL}}': 写真URL,
    '{{ロゴURL}}': ロゴURL,
    '{{商品名}}': エスケープ(名前),
    '{{キャッチコピー}}': エスケープ(商品['キャッチコピー'] || ''),
    '{{名前サイズ}}': 名前サイズ(名前),
    '{{価格ブロック}}': 価格ブロック(商品['価格'], 表を出す ? '' : 商品['価格表']),
    '{{価格表ブロック}}': 価格表ブロック(商品['価格表']),
    '{{説明ブロック}}': 説明ブロック(商品['説明']),
    '{{営業時間ブロック}}': 営業時間ブロック(),
    '{{店舗名}}': エスケープ(いま.店舗名),
    '{{店舗説明}}': エスケープ(いま.店舗説明),
    '{{イベント札}}': イベント札(商品),
    '{{イベント見出し}}': エスケープ((使うイベント() || {})['名前'] || ''),
    '{{イベント説明}}': 説明ブロック((使うイベント() || {})['説明'] || ''),
    '{{ガイド}}': '',
  });

  const 残り = 出来.match(/\{\{[^}]+\}\}/g);
  if (残り) throw new Error(`デザイン「${型}」に埋められない場所があります: ${[...new Set(残り)].join(', ')}`);
  return 出来;
}

// ------------------------------------------------------------ 画像にする

/** できあがりのHTMLを、そのままの見た目でJPEGにする */
async function 画像にする(html) {
  const 幅 = いま['画像の幅'];
  const 高さ = いま['画像の高さ'];

  // HTMLを読み直して、SVGに入れられる形（XHTML）に組みなおす
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const css = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  const 中身 = [...doc.body.children]
    .map((子) => new XMLSerializer().serializeToString(子))
    .join('');

  // ★ CSSは <![CDATA[ ]]> で包む。そのまま入れるとXMLの決まりで「>」が
  //   「&gt;」に化け、「.本文 > *」のような書き方が黙って効かなくなる
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${幅}" height="${高さ}">` +
    `<foreignObject x="0" y="0" width="${幅}" height="${高さ}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${幅}px;height:${高さ}px">` +
    `<style><![CDATA[\n${css}\n]]></style>${中身}</div>` +
    `</foreignObject></svg>`;

  const img = await SVGを絵にする(svg);

  const c = document.createElement('canvas');
  c.width = 幅;
  c.height = 高さ;
  const ctx = c.getContext('2d');
  ctx.fillStyle = (いま['ブランド'] && いま['ブランド']['下地']) || '#000';
  ctx.fillRect(0, 0, 幅, 高さ);
  ctx.drawImage(img, 0, 0, 幅, 高さ);

  // 端末によっては、この作り方で真っ白（真っ黒）にしかならないことがある。
  // 黙って空の画像を渡さないよう、色がぜんぶ同じなら止める
  if (のっぺらぼう(ctx, 幅, 高さ)) {
    throw new Error('この端末では画像に変換できませんでした。Macの道具（つくる.py）で作ってください。');
  }
  return c.toDataURL('image/jpeg', 0.95);
}

/**
 * SVGを1枚の絵として読み込む
 *
 * ★ img.decode() は使わない。SVGだと返ってこないことがあり
 *   （ヘッドレスのChromeで実際に止まった）、ボタンが押しっぱなしになる。
 *   onload / onerror なら確実に返ってくる。念のため時間切れも付けておく。
 */
function SVGを絵にする(svg) {
  return new Promise((できた, だめ) => {
    const img = new Image();
    const 時間切れ = setTimeout(() => だめ(new Error('画像の組み立てに時間がかかりすぎました')), 20000);
    img.onload = () => { clearTimeout(時間切れ); できた(img); };
    img.onerror = () => { clearTimeout(時間切れ); だめ(new Error('この端末では画像に変換できませんでした')); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

/** 描けているかの検算。散らばった点の色がぜんぶ同じなら、失敗とみなす */
function のっぺらぼう(ctx, 幅, 高さ) {
  const 点 = [];
  for (let y = 1; y <= 8; y++) {
    for (let x = 1; x <= 4; x++) {
      const d = ctx.getImageData(Math.round(幅 * x / 5), Math.round(高さ * y / 9), 1, 1).data;
      点.push(`${d[0]},${d[1]},${d[2]}`);
    }
  }
  return new Set(点).size <= 1;
}

// ------------------------------------------------------------ 画面

function 画面を出す(名前) {
  for (const id of ['viewStores', 'viewList', 'viewMake', 'viewDone']) {
    el(id).classList.toggle('is-hidden', id !== 名前);
  }
  el('errorBox').classList.add('is-hidden');
  window.scrollTo(0, 0);
}

function 店舗を並べる() {
  const 箱 = el('storeList');
  箱.innerHTML = '';
  for (const 店 of 設定['店舗']) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'story-store';
    btn.style.setProperty('--下地', (店['ブランド'] || {})['下地'] || '#eee');

    const 数 = その店舗の商品(店).length;
    const 今日のイベント = その日のイベント(店)
      .map((イ) => `<span class="story-store__event">きょうは${エスケープ(イ['名前'] || '')}</span>`)
      .join('');
    btn.innerHTML =
      `<img class="story-store__logo" src="${印つき(店['ロゴ'] || '')}" alt="">` +
      `<span class="story-store__text">` +
      `<span class="story-store__name">${エスケープ(店['名前'] || '')}${今日のイベント}</span>` +
      `<span class="story-store__sub">${エスケープ(店['説明'] || '')}｜${数}品</span>` +
      `</span><span class="story-store__arrow">›</span>`;
    btn.addEventListener('click', () => 店舗をえらぶ(店));
    箱.appendChild(btn);
  }
}

function 店舗をえらぶ(店舗) {
  いまの店舗 = 店舗;
  いま = まとめる(店舗);
  店の商品 = その店舗の商品(店舗);
  el('storeName').textContent = 店舗['名前'] || '';

  // イベント（肉の日など）。きょうが当日なら、はじめから入りにしておく
  店のイベント = (店舗['イベント'] || [])[0] || null;
  const 入れ物 = el('eventWrap');
  入れ物.classList.toggle('is-hidden', !店のイベント);
  if (店のイベント) {
    el('eventLabel').textContent = `${店のイベント['名前']}の札をつける`;
    el('eventToggle').checked = その日のイベント(店舗).length > 0;
  }
  商品を並べる();
  画面を出す('viewList');
}

function 商品を並べる() {
  const ul = el('productList');
  ul.innerHTML = '';

  for (const 商品 of 店の商品) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'story-product';

    const img = document.createElement('img');
    img.className = 'story-product__photo';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = 印つき(小さい写真(商品, 0));
    // 小さい写真がまだ無いときは、元の写真で出す
    img.addEventListener('error', function () {
      if (this.dataset.やりなおし) { this.classList.add('is-dame'); return; }
      this.dataset.やりなおし = '1';
      this.src = 印つき(写真の場所(商品, 0));
    }, { once: false });

    const body = document.createElement('div');
    body.className = 'story-product__body';

    const 名 = document.createElement('span');
    名.className = 'story-product__name';
    名.textContent = 商品['商品名'] || '（名前なし）';
    body.appendChild(名);

    const 値段 = String(商品['価格'] || '').trim()
      ? 価格の文字(商品['価格'])
      : 価格を読む(商品['価格表']).map((一つ) => `${一つ.名前} ${値の書き方(一つ.値)}`).join('／');
    if (値段) {
      const 値 = document.createElement('span');
      値.className = 'story-product__price';
      値.textContent = 値段;
      body.appendChild(値);
    }
    const 枚数 = 写真たち(商品).length;
    if (枚数 > 1) {
      const 印 = document.createElement('span');
      印.className = 'story-product__count';
      印.textContent = `写真${枚数}枚`;
      body.appendChild(印);
    }
    if (String(商品['停止'] || '').trim()) {
      const 印 = document.createElement('span');
      印.className = 'story-product__stop';
      印.textContent = 'お休み中';
      body.appendChild(印);
    }

    btn.appendChild(img);
    btn.appendChild(body);
    btn.addEventListener('click', () => 商品をえらぶ(商品));
    li.appendChild(btn);
    ul.appendChild(li);
  }

  el('listNote').textContent = `${店の商品.length}品`;
}

function 商品をえらぶ(商品) {
  いまの商品 = Object.assign({}, 商品);
  いまの写真番号 = 0;
  el('editName').value = いまの商品['商品名'] || '';
  el('editCopy').value = いまの商品['キャッチコピー'] || '';
  el('editPrice').value = いまの商品['価格'] || '';
  el('editText').value = (いまの商品['説明'] || '').split('／').join('\n');

  const 指定 = String(商品['テンプレート'] || '').trim();
  const 一覧 = いま.テンプレート;
  いまの型 = 一覧.find((名) => 名 === 指定 || (指定 && 名.includes(指定))) || 一覧[0];

  デザインを並べる();
  写真えらびを出す();
  画面を出す('viewMake');
  見本を出す();
}

/** 写真が2枚以上ある商品のときだけ、切り替えを出す */
function 写真えらびを出す() {
  const 枚数 = 写真たち(いまの商品).length;
  const 箱 = el('photoPick');
  箱.classList.toggle('is-hidden', 枚数 <= 1);
  if (枚数 > 1) el('photoNow').textContent = `${(いまの写真番号 % 枚数) + 1} / ${枚数}`;
}

function 写真をずらす(向き) {
  const 枚数 = 写真たち(いまの商品).length || 1;
  いまの写真番号 = (いまの写真番号 + 向き + 枚数) % 枚数;
  写真えらびを出す();
  見本を出す();
}

function デザインを並べる() {
  const 箱 = el('designTabs');
  箱.innerHTML = '';
  for (const 名 of いま.テンプレート) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'story-design' + (名 === いまの型 ? ' is-active' : '');
    b.textContent = 名.replace(/^\d+_/, '');
    b.addEventListener('click', () => {
      いまの型 = 名;
      デザインを並べる();
      見本を出す();
    });
    箱.appendChild(b);
  }
}

function いまの中身() {
  return Object.assign({}, いまの商品, {
    商品名: el('editName').value.trim() || いまの商品['商品名'],
    キャッチコピー: el('editCopy').value.trim(),
    価格: el('editPrice').value.trim(),
    説明: el('editText').value.trim().split('\n').filter(Boolean).join('／'),
  });
}

async function 見本を出す() {
  try {
    const html = await 一枚のHTML(いまの中身(), いまの型, いまの写真番号);
    el('preview').srcdoc = html;
    幅を合わせる();
  } catch (err) {
    しくじり(err);
  }
}

function 幅を合わせる() {
  const 台 = el('stage');
  const 枠 = el('preview');
  const 倍 = 台.clientWidth / いま['画像の幅'];
  枠.style.transform = `scale(${倍})`;
  台.style.height = Math.round(いま['画像の高さ'] * 倍) + 'px';
}

async function 作る() {
  const ボタン = el('makeBtn');
  ボタン.disabled = true;
  ボタン.textContent = '作っています…';
  try {
    const 中身 = いまの中身();
    const html = await 一枚のHTML(中身, いまの型, いまの写真番号);
    const jpeg = await 画像にする(html);

    el('resultImg').src = jpeg;
    const 今日 = new Date();
    const 日付 = [
      今日.getFullYear(),
      String(今日.getMonth() + 1).padStart(2, '0'),
      String(今日.getDate()).padStart(2, '0'),
    ].join('-');
    const link = el('downloadLink');
    link.href = jpeg;
    const 印 = 使うイベント() ? `_${使うイベント()['名前']}` : '';
    link.download =
      `${日付}_${いま.店舗id}${印}_${(中身['商品名'] || '無題').replace(/[\\/:*?"<>|\s]+/g, '_')}.jpg`;

    画面を出す('viewDone');
  } catch (err) {
    しくじり(err);
  } finally {
    ボタン.disabled = false;
    ボタン.textContent = '画像にする';
  }
}

// ------------------------------------------------------------ 起動

async function 起動() {
  try {
    設定 = await (await 取ってくる('設定.json')).json();
    共通CSS元 = await (await 取ってくる('templates/共通.css')).text();
    if (!(設定['店舗'] || []).length) throw new Error('設定.json に「店舗」がありません');

    全商品 = CSVを読む(await (await 取ってくる('products.csv')).text());
    営業時間表 = 営業時間をまとめる(CSVを読む(await (await 取ってくる('営業時間.csv')).text()));
    店舗を並べる();

    if (new URLSearchParams(location.search).get('from') === 'mine') {
      el('toMineBtn').classList.remove('is-hidden');
    }
  } catch (err) {
    しくじり(err);
  }
}

el('backToStores').addEventListener('click', () => 画面を出す('viewStores'));
el('backToList').addEventListener('click', () => 画面を出す('viewList'));
el('backToMake').addEventListener('click', () => 画面を出す('viewMake'));
el('makeBtn').addEventListener('click', 作る);
el('eventToggle').addEventListener('change', () => {
  const イベント = 使うイベント();
  if (イベント && イベント['デザイン'] && いま.テンプレート.includes(イベント['デザイン'])) {
    いまの型 = イベント['デザイン'];
    デザインを並べる();
  }
  見本を出す();
});
el('photoPrev').addEventListener('click', () => 写真をずらす(-1));
el('photoNext').addEventListener('click', () => 写真をずらす(1));
for (const id of ['editName', 'editCopy', 'editPrice', 'editText']) {
  el(id).addEventListener('change', 見本を出す);
}
window.addEventListener('resize', () => { if (いま) 幅を合わせる(); });

// 起動の終わりを外から待てるようにしておく（確認用）
window.起動ずみ = 起動();
