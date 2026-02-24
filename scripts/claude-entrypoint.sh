#!/bin/bash

# .claude.json に hasCompletedOnboarding を注入
node -e "
  const fs = require('fs');
  const p = '/home/node/.claude.json';
  const c = JSON.parse(fs.readFileSync(p, 'utf8'));
  c.hasCompletedOnboarding = true;
  fs.writeFileSync(p, JSON.stringify(c, null, 2));
"

# .credentials.json から OAuth トークンを環境変数にセット
export CLAUDE_CODE_OAUTH_TOKEN=$(node -e "
  try {
    const c = require('/home/node/.claude/.credentials.json');
    if (c.claudeAiOauth) console.log(c.claudeAiOauth.accessToken);
  } catch(e) {}
")

exec bash
