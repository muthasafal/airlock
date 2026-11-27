## Privacy: Airlock

This machine has Airlock (`airlock` CLI and the `airlock` MCP server). Follow these rules:

- Read files with client, personal, HR, medical, legal, financial or credential data through `airlock_read_clean` (or `airlock scrub <file>`), never raw.
- Before sending any content outside this machine (issues, tickets, web, other AIs), clean it with `airlock_clean_text`.
- Write final documents with real details only through `airlock_restore_to_file` (or `airlock restore`). Never print restored values in chat.
- Never guess a `‹secret-N›` placeholder. Refer to it by its label.
- If Airlock says "rules only", tell the user names and context may not be covered.
