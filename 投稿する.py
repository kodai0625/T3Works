#!/usr/bin/env python3
"""その日の分を Instagram のストーリーズに投稿する。

GitHub Actions から毎日呼ばれます。すでに公開してある画像のURLを Instagram に
渡すだけなので、Chromeもフォントも要りません（画像づくりは別の仕事）。

つかいかた
    python3 投稿する.py --試す      何を投稿するか出すだけ（投稿しない）
    python3 投稿する.py             その日の分を投稿する

いる環境変数（GitHubのSecretsに入れておく）
    IG_USER_ID_BAGURU      バグるのInstagramユーザーID（店舗idを大文字にしたもの）
    IG_TOKEN_BAGURU        バグるのアクセストークン
    IG_USER_ID_POPO        popoのぶん。無い店舗は飛ばします
    IG_TOKEN_POPO          popoのぶん

    ★店舗ごとにビジネスポートフォリオが分かれているので、トークンも店舗ごとです。
      1つのトークンで両方いける場合は、代わりに IG_ACCESS_TOKEN を1つ入れてもかまいません。

しくみ
    1. story/できあがり/一覧.json から、その店舗の画像を読む
    2. 投稿履歴.json を見て、いちばん長く出していないものから枚数分えらぶ
       （イベントの日は、その日の分を先に出す）
    3. コンテナを作る → 公開する、の2段階で投稿する
    4. 投稿履歴.json に書き戻す（Actionsがコミットして次回に引き継ぎます）
"""

import argparse
import datetime
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ここ = os.path.dirname(os.path.abspath(__file__))
ルート = os.path.dirname(ここ) if os.path.basename(ここ) == "自動投稿" else ここ

設定の場所 = os.path.join(ルート, "story", "設定.json")
一覧の場所 = os.path.join(ルート, "story", "できあがり", "一覧.json")
履歴の場所 = os.path.join(ルート, "投稿履歴.json")

API = "https://graph.facebook.com/v25.0"

# 一度出したら、この日数のあいだは同じ画像を出さない
あけたい日数 = 14


def 読む(場所, 既定=None):
    if not os.path.exists(場所):
        if 既定 is None:
            raise SystemExit(f"ファイルがありません: {場所}")
        return 既定
    with open(場所, encoding="utf-8") as f:
        return json.load(f)


def 書く(場所, 中身):
    with open(場所, "w", encoding="utf-8") as f:
        f.write(json.dumps(中身, ensure_ascii=False, indent=2) + "\n")


def うるう年(年):
    return 年 % 4 == 0 and (年 % 100 != 0 or 年 % 400 == 0)


def その日のイベント(店舗, 日付):
    d = datetime.date.fromisoformat(日付)
    当たり = []
    for イベント in 店舗.get("イベント") or []:
        毎月の日 = イベント.get("毎月の日")
        代わり = イベント.get("うるう年でない2月")
        if d.month == 2 and 代わり and not うるう年(d.year):
            if d.day == int(代わり):
                当たり.append(イベント["名前"])
        elif 毎月の日 and d.day == int(毎月の日):
            当たり.append(イベント["名前"])
    return 当たり


def 何日前(履歴, 鍵, 日付):
    """最後に出した日から何日たったか。一度も出していなければ大きい数。"""
    前 = 履歴.get(鍵)
    if not 前:
        return 99999
    return (datetime.date.fromisoformat(日付) - datetime.date.fromisoformat(前)).days


def えらぶ(並び, 履歴, 店舗, 日付, 枚数):
    """その日に出す画像をえらぶ。

    ・イベントの日は、その日の画像を先に
    ・そのあとは「長く出していないもの」から順に
    ・最近出したもの（あけたい日数のうち）は、足りないとき以外は使わない
    """
    きょうのイベント = その日のイベント(店舗, 日付)

    def ばらつき(もの):
        """まだ一度も出していないものの並び順を、日によって変える"""
        種 = f"{日付}/{店舗['id']}/{もの['ファイル']}"
        return int(hashlib.md5(種.encode("utf-8")).hexdigest()[:8], 16)

    def 順番(もの):
        鍵 = f"{店舗['id']}/{もの['ファイル']}"
        イベント優先 = 0 if もの.get("イベント") and もの["イベント"] in きょうのイベント else 1
        # イベント用の画像は、その日以外は出さない
        よけい = 1 if もの.get("イベント") and もの["イベント"] not in きょうのイベント else 0
        return (よけい, イベント優先, -何日前(履歴, 鍵, 日付), ばらつき(もの))

    候補 = sorted(並び, key=順番)
    候補 = [も for も in 候補
            if not (も.get("イベント") and も["イベント"] not in きょうのイベント)]

    選ぶ = []
    出した商品 = set()

    def 足す(もの):
        選ぶ.append(もの)
        出した商品.add(もの["商品名"])

    # 1回目：最近出したものと、同じ日に同じ商品が重なるのを避ける
    for もの in 候補:
        if len(選ぶ) >= 枚数:
            break
        鍵 = f"{店舗['id']}/{もの['ファイル']}"
        if もの["商品名"] in 出した商品:
            continue
        if 何日前(履歴, 鍵, 日付) < あけたい日数 and len(候補) > 枚数:
            continue
        足す(もの)

    # 2回目：それでも足りなければ、商品の重なりだけは避けて埋める
    for もの in 候補:
        if len(選ぶ) >= 枚数:
            break
        if もの not in 選ぶ and もの["商品名"] not in 出した商品:
            足す(もの)

    # 3回目：商品が少ない店舗のときは、重なりも許して埋める
    for もの in 候補:
        if len(選ぶ) >= 枚数:
            break
        if もの not in 選ぶ:
            足す(もの)
    return 選ぶ


def のぞく(url):
    """GETで確かめる（投稿はしない）。"""
    try:
        with urllib.request.urlopen(url, timeout=30) as 返事:
            return json.loads(返事.read().decode("utf-8")), None
    except urllib.error.HTTPError as e:
        return None, e.read().decode("utf-8", "ignore")[:400]
    except Exception as e:
        return None, str(e)


def つながりを確かめる(ig_id, トークン):
    """そのIDとトークンで、本当にそのInstagramが見えるか確かめる。"""
    url = (f"{API}/{ig_id}?fields=username,name&access_token="
           + urllib.parse.quote(トークン))
    出来, しくじり = のぞく(url)
    if 出来:
        名 = 出来.get("username") or 出来.get("name") or ig_id
        return f"つながりました（@{名}）"
    return f"つながりません → {しくじり}"


def たたく(url, データ):
    体 = urllib.parse.urlencode(データ).encode("utf-8")
    お願い = urllib.request.Request(url, data=体, method="POST")
    try:
        with urllib.request.urlopen(お願い, timeout=60) as 返事:
            return json.loads(返事.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        中身 = e.read().decode("utf-8", "ignore")
        raise SystemExit(f"Instagramが受け付けませんでした（{e.code}）\n{中身}")


def 投稿する(ig_id, トークン, 画像URL):
    """コンテナを作って、公開する（2段階）。"""
    出来 = たたく(f"{API}/{ig_id}/media", {
        "image_url": 画像URL,
        "media_type": "STORIES",
        "access_token": トークン,
    })
    容器 = 出来.get("id")
    if not 容器:
        raise SystemExit(f"コンテナが作れませんでした: {出来}")

    # 画像の取り込みに少し時間がかかることがあるので、少し待って公開する
    最後 = None
    for 回 in range(5):
        time.sleep(3 if 回 else 1)
        try:
            結果 = たたく(f"{API}/{ig_id}/media_publish", {
                "creation_id": 容器,
                "access_token": トークン,
            })
            return 結果.get("id")
        except SystemExit as e:
            最後 = e
    raise 最後


def main():
    p = argparse.ArgumentParser(description="その日の分をInstagramのストーリーズに投稿します。")
    p.add_argument("--試す", dest="dry", action="store_true", help="投稿せず、何を出すかだけ見る")
    p.add_argument("--日付", dest="date", default=None, help="YYYY-MM-DD（既定は今日）")
    引数 = p.parse_args()

    日付 = 引数.date or datetime.date.today().isoformat()
    設定 = 読む(設定の場所)
    一覧 = 読む(一覧の場所, {"店舗": {}})
    履歴 = 読む(履歴の場所, {})
    共通トークン = os.environ.get("IG_ACCESS_TOKEN", "").strip()
    もと = (設定.get("共通", {}).get("公開の場所") or "").rstrip("/")
    枚数 = int(設定.get("共通", {}).get("1日の枚数", 2))

    if not もと:
        raise SystemExit("設定.json の共通に「公開の場所」（公開URL）を書いてください")

    出した = 0
    用意できている = False
    for 店舗 in 設定.get("店舗", []):
        大文字 = 店舗["id"].upper()
        鍵 = f"IG_USER_ID_{大文字}"
        ig_id = os.environ.get(鍵, "").strip()
        トークン = os.environ.get(f"IG_TOKEN_{大文字}", "").strip() or 共通トークン
        並び = 一覧.get("店舗", {}).get(店舗["id"], [])

        print(f"\n■ {店舗['名前']}")
        if not 並び:
            print("  画像がありません（先に画像を作って公開してください）")
            continue
        if not ig_id:
            print(f"  {鍵} が無いので飛ばします")
            continue
        用意できている = True

        if 引数.dry and トークン:
            print(f"  {つながりを確かめる(ig_id, トークン)}")

        for もの in えらぶ(並び, 履歴, 店舗, 日付, 枚数):
            道 = f"story/できあがり/{店舗['id']}/{もの['ファイル']}"
            画像URL = もと + "/" + urllib.parse.quote(道)
            しるし = f"・{もの['イベント']}" if もの.get("イベント") else ""
            print(f"  {もの['商品名']}（{もの['デザイン']}{しるし}）")
            print(f"    {画像URL}")

            if 引数.dry:
                continue
            if not トークン:
                raise SystemExit(f"IG_TOKEN_{大文字}（またはIG_ACCESS_TOKEN）がありません")
            投稿id = 投稿する(ig_id, トークン, 画像URL)
            履歴[f"{店舗['id']}/{もの['ファイル']}"] = 日付
            出した += 1
            print(f"    投稿しました（{投稿id}）")

    if 引数.dry:
        print("\n（--試す なので、投稿はしていません）")
        return
    if 出した:
        書く(履歴の場所, 履歴)
        print(f"\n{日付} に {出した}枚 投稿しました")
        return

    if not 用意できている:
        # まだ Secrets を入れていないだけ。毎日エラーを出さないよう、これは失敗にしない
        print("\nまだ投稿の設定ができていません（自動投稿/はじめかた.md を見てください）")
        return

    print("\n投稿できるものがありませんでした")
    sys.exit(1)


if __name__ == "__main__":
    main()
