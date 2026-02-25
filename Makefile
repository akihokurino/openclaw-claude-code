run-openclaw:
	docker compose up

run-claude-code:
	docker compose run --rm claude-code

watch-claude-code-log:
	node scripts/tail-claude-code-log.js
