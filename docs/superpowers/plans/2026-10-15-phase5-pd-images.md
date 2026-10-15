# フェーズ5 パブリックドメイン画像 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 早見表の十二星座・天体・十二支に、Wikimedia Commons のパブリックドメイン画像を表示する。画像はリポジトリに含めず、タロットと同じくスクリプトでダウンロードする。画像がなければ今の記号・文字の絵を出す。

**Architecture:** 使う画像の一覧を `src/data/guide/photos.json` に置き、ダウンロードのスクリプトと早見表のデータの両方がこれを読む。早見表の項目に `photo`(パス・代替テキスト・出典・切り抜きの位置)を付け、画像の部品は読み込みに失敗したら元の画像(記号・文字)に戻す。

設計書 §7.2。

## 使う画像(Commons の API でライセンスを確認済み。CC BY / BY-SA は使わない)

| 対象 | シリーズ | ライセンス |
|---|---|---|
| 十二星座(12) | Sidney Hall『Urania's Mirror』(1825) | Public domain |
| 太陽〜土星(7) | Sebald Beham「The Seven Planets」(1539ごろ、National Gallery of Art) | CC0 |
| 天王星・海王星・冥王星(3) | NASA(Voyager 2、New Horizons) | Public domain |
| 十二支(12。四柱推命の早見表) | 歌川国芳「道化十二支」(1855、大英博物館) | Public domain |

ドラゴンヘッド・キロン・リリスは画像なし(記号のまま)。

ファイル名:

- 十二星座: `Sidney Hall - Urania's Mirror - Aries and Musca Borealis.jpg`、`... - Taurus.jpg`、`... - Gemini.jpg`、`... - Cancer.jpg`、`... - Leo Major and Leo Minor.jpg`、`... - Virgo.jpg`、`... - Libra.jpg`、`... - Scorpio.jpg`、`... - Sagittarius and Corona Australis, Microscopium, and Telescopium.png`、`... - Capricornus.jpg`、`... - Aquarius, Piscis Australis & Ballon Aerostatique.jpg`、`... - Pisces.jpg`(`...` は `Sidney Hall - Urania's Mirror`)
- 天体: `Sebald Beham, Sol, NGA 4282.jpg`、`Sebald Beham, Luna, NGA 4285.jpg`、`Sebald Beham, Mercury, NGA 4284.jpg`、`Sebald Beham, Venus, NGA 4283.jpg`、`Sebald Beham, Mars, NGA 4281.jpg`、`Sebald Beham, Jupiter, NGA 4280.jpg`、`Sebald Beham, Saturn, NGA 4279.jpg`、`Uranus2.jpg`、`Neptune Full.jpg`、`Nh-pluto-in-true-color 2x JPEG-edit-frame.jpg`
- 十二支: `Ne Kinoe-ne matsuri (BM 1934,1013,0.42).jpg`、`Ushi ushi ni hikarete Zenkoji mairi (BM 1934,1013,0.49).jpg`、`Tora (BM 1934,1013,0.44).jpg`、`U Kashima-odori (BM 1934,1013,0.50).jpg`、`Tatsu shogatsu tatsu no mizu (BM 1934,1013,0.46).jpg`、`Mi megura hebi ni ojitsu (BM 1934,1013,0.52).jpg`、`Uma hyaku de katta koma (BM 1934,1013,0.51).jpg`、`Hitsuji (BM 1934,1013,0.47).jpg`、`Saru Sanno Matsuri (BM 1934,1013,0.48).jpg`、`Tori Tori-mi machi (BM 1934,1013,0.53).jpg`、`Inu yuki uchi asobi (BM 1934,1013,0.43).jpg`、`I imo-hatake arashi (BM 1934,1013,0.45).jpg`

## タスク

1. **`src/data/guide/photos.json`**: `[{ system, id, file, path, alt, credit, focus }]`。`path` は `/guide-images/<system>/<id>.jpg`(射手座の PNG もダウンロード時に JPG の縮小版を取る: `Special:FilePath/<file>?width=800` は PNG の元画像だと PNG を返すので、拡張子は Content-Type から決め、`path` もそれに合わせる。または Commons の `thumb` URL で `.jpg` を指定する)。`credit` は「Sidney Hall『Urania's Mirror』(1825)」「Sebald Beham『The Seven Planets』(1539ごろ)」「NASA/JPL(Voyager 2、1986)」「歌川国芳『道化十二支』(1855)」の形。`focus` は CSS の `object-position`(既定 `center`。人物が上にある絵は `center 20%` など、画面で確かめて決める)。
2. **`scripts/download-guide-images.mjs`**: JSON を読み、`https://commons.wikimedia.org/wiki/Special:FilePath/<file>?width=800` を `public/guide-images/...` に保存。既にあれば飛ばす。User-Agent はアプリ名と目的を書く(Wikimedia の方針)。`.gitignore` に `/public/guide-images/`。
3. **データ**: `GuideEntry` に `photo?: { path; alt; credit; focus }`。`src/data/guide/index.ts` で `photos.json` を項目に付ける。`photos.json` の id がすべて実在することをテストする(34件)。
4. **表示**: 画像の部品を足し、`photo` があればそれを `object-cover`・`object-position: focus` で正方形の枠に出し、`onError` で元の画像(`GuideImageView` の記号・文字)に戻す(クライアント部品。イベントの中の setState は可)。タイル・詳細シート・詳細ページのすべてで使う。詳細ページの画像の下に「画像: {credit}・パブリックドメイン(Wikimedia Commons)」(CC0 も「パブリックドメイン」でよい)。
5. **Service Worker**: `/guide-images/` もキャッシュ優先にし、`CACHE_NAME` を v3 に上げる。
6. **README**: アプリの説明を今の内容(タロット+7占術の運勢・早見表)に書き直し、画像の準備に `node scripts/download-guide-images.mjs` を足す。キロンの表の生成(`node scripts/fetch-chiron.mjs`、通常は不要)も書く。
7. **確かめる**: スクリプトを実行して34枚をダウンロードし、`npm run dev` でタイル・詳細のスクリーンショットを撮って切り抜きを確かめ、`focus` を調整する(特に魚座・天体・十二支)。テスト・lint・ビルド・E2E。E2E は画像がない環境でも通ること(画像の有無に依存しない)。

## 追加(プレビューを見て決めたこと)

8. **十二支のタイル**: `photos.json` の十二支12件に `tileOverlay: true`。タイルだけ絵を暗くし(`filter: brightness(.42) saturate(.85)`)、上に元の漢字(五行の色・タイルの大きさ・薄い影)を重ねる。シート・詳細は絵だけ。絵を読み込めなければ普通の文字のタイルに戻す。
9. **太陽の紋章の線画**: Wikimedia Commons の「DaySign *.svg」(Ekwoman 作、PD-self。API でライセンスが Public domain であることを確認)。seal-1〜20 = Imix, Ik, Akbal, Kan, Chiccan, Cimi, Manik, Lamat, Muluc, Oc, Chuen, Eb, Ben, Ix, Men, Cib, Caban, Etznab, Cauac, Ahau。
   - 版: 現在の版が Kilom691 の描き直しの10件(Ahau, Ben, Chiccan, Chuen, Etznab, Ik, Ix, Kan, Lamat, Muluc)は Ekwoman の元の版(2008年11月)、ほかの10件は現在の版(2022年12月、Vanisaac が不正な SVG 要素を取り除いただけ)。版の URL・作者・日時・SHA-1 を `src/data/guide/maya-glyphs.json` に記録する。
   - ダウンロードのスクリプトで SHA-1 を確かめ、`scripts/clean-day-sign-svg.mjs`(依存なしの文字列処理)で線画に整えて `public/guide-images/maya/seal-N.svg` に保存する: XML 宣言・DOCTYPE・Illustrator の編集用データ・全面の白い背景・defs/clipPath を消し、白い塗りは none、黄色(Imix の #FDFB00 の2本)は消し、黒にそろえる。viewBox 81×81 を残し width/height も書く。整えた20枚を元の絵と並べて見比べ、すべて同じ線画になることを確かめた(Morley 1915 の図への差し替えは不要だった)。
   - 表示: `mask-image` + `background-color`(紋章の色 `image.color`)で枠の約78%に描く(タイル・シート・詳細)。mask は読み込めないと何も描かないので、同じ画像を隠した `<img>` でも読み、`onError`(とハイドレーション前の失敗に備えて ref で `complete`・`naturalWidth`)で文字の画像に戻す。詳細ページの出典は「画像: 古代マヤの日の文字(Wikimedia Commons の DaySign シリーズ)・パブリックドメイン」。

