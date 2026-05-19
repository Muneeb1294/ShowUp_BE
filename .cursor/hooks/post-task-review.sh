#!/bin/bash
# Runs on agent stop (loop_limit: 1 in hooks.json).
# Consumes hook JSON from stdin; returns a one-time follow-up review checklist.

cat >/dev/null # discard stdin — stop hook only needs static follow-up

cat <<'EOF'
{
  "followup_message": "Before finishing, review all files changed in this session:\n\n**Code quality**\n- Remove unused imports\n- Simplify logic if possible\n- Follow .cursor/rules/ (project-core, backend, frontend)\n\n**Security**\n- No console.log left behind\n- No hardcoded secrets\n- API responses: { success: true, ... } or { success: false, message }\n\n**API**\n- New/changed routes use catchAsyncError and ErrorHandler\n- Suggest a curl or sample request for new endpoints\n\nFix any issues found, then give a brief summary of what was verified."
}
EOF

exit 0
