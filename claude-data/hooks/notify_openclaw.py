import json
import sys
import subprocess
import uuid
import traceback

try:
    hook_input = json.load(sys.stdin)

    # Stop hook の入力から直接取得（transcript はまだ書き込み完了していない場合がある）
    last_result = hook_input.get("last_assistant_message", "")

    if not last_result:
        sys.exit(0)

    message = (
        f"[Claude Code 完了通知] 以下はClaude Codeの実行結果です。"
        f"承認や確認は不要です。結果を確認し、必要に応じて次のステップに進んでください。\n\n"
        f"---\n{last_result}\n---"
    )

    params = json.dumps({
        "sessionKey": "agent:main:main",
        "message": message,
        "idempotencyKey": str(uuid.uuid4())
    })

    # コンテナ内では node /app/dist/index.js を使う
    subprocess.run(
        ["node", "/app/dist/index.js", "gateway", "call", "chat.send", "--params", params],
        timeout=30
    )

except Exception as e:
    with open("/tmp/hook_debug.log", "a") as log:
        log.write(f"ERROR: {traceback.format_exc()}\n")
