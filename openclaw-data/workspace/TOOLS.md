# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Claude Code 連携

`exec` ツールで Claude Code をバックグラウンド実行する。完了後、Stop hook が `[Claude Code 完了通知]` をこのチャットに自動送信する。

### 実行方法

```bash
claude -p "タスクの指示" --output-format json > /dev/null 2>&1 &
```

**必ず `> /dev/null 2>&1 &` をつけること。** 出力を捨ててバックグラウンド実行する。exec はすぐに返り、結果は何も含まない。

### 結果の受け取り方

exec の戻り値は使わない。結果は `[Claude Code 完了通知]` としてこのチャットに届く。このメッセージだけが正式な結果である。

### ループ実行の手順（厳守）

1. `exec` で `claude -p "指示" > /dev/null 2>&1 &` を実行する
2. **ツールの呼び出しを止めて、応答を終了する**（「実行中です、完了通知を待ちます」等）
3. `[Claude Code 完了通知]` がチャットに届くのを待つ
4. 完了通知の内容を確認し、ユーザーに報告する
5. 次のステップがあれば、再度 `exec` で `claude -p` を実行する
6. 全ステップ完了まで繰り返す

**重要: ステップ2で必ず応答を終了すること。exec実行後に続けてexecを呼んではならない。**

### ルール

- ユーザーが明示的に繰り返しを指示した場合のみループ実行する
- ユーザーが指定した回数を絶対に超えない
- エラーが返ってきた場合はループを中止し、ユーザーに報告する
