# 手順

1. docker pull ghcr.io/phioranex/openclaw-docker:latest && docker compose build --no-cache
2. docker compose run --rm openclaw-cli onboard
3. docker compose run --rm --entrypoint claude openclaw-cli
4. docker compose up



