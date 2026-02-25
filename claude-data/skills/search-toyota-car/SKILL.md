---
name: search-toyota-car
description: トヨタの車種情報をWeb検索する時に利用します。
version: 1.0.0
---

## 作業手順

1. `https://toyota.jp/site-search/?page_size=10&page_number=1&search_word=` にアクセス。
2. 車種名で検索を実行。
3. 検索結果の一覧から、一番上の検索結果の詳細に遷移する。
4. 詳細画面情報を必要に応じてさらに深いリンクに潜りながら情報を収集し、要約して報告する。

## 報告ルール

- 全ての情報収集が完了したら、**最後のメッセージ1つに全ての収集結果をまとめて出力すること。**
- 途中経過と最終報告を分けず、最終メッセージに詳細な要約を含めること。
- 最終メッセージの後にツール呼び出しや短い締めの文を追加しないこと。

# Playwright MCP使用ルール

## 絶対的な禁止事項

1. **いかなる形式のコード実行も禁止**
   - Python、JavaScript、Bash等でのブラウザ操作
   - MCPツールを調査するためのコード実行
   - subprocessやコマンド実行によるアプローチ

2. **利用可能なのはMCPツールの直接呼び出しのみ**
   - playwright:browser_navigate
   - playwright:browser_screenshot
   - 他のPlaywright MCPツール
   
3. **エラー時は即座に報告**
   - 回避策を探さない
   - 代替手段を実行しない
   - エラーメッセージをそのまま伝える
