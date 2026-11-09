# VMF update

- The existing internal format key `champions` is retained for backward compatibility; its Discord-facing label is now **UEFA Format**.
- UEFA Format accepts 16 teams and generates four matchdays using the first four rounds of a round-robin circle schedule. Every team faces four different opponents.
- The 8 direct places and 4 repechage places are returned as UEFA format metadata. Repechage/bracket fixtures are not auto-created by this release: the current project has no phase-advancement workflow or tie-resolution configuration, so claiming this is automated would be misleading.
- Competition deletion now removes associated match events and reports before fixtures, even if matches were confirmed.
- `DELETE /api/admin/fixtures/remove?id=FIXTURE_ID` removes one fixture and its dependent match events/reports.
- Fixtures page now has All Leagues and per-competition filters, and VMF logo is used in the header and favicon.

## Bot addition
Add the `fixture_remove` command to the existing `commands_map` and add the callback shown in `vmf_web_fixture_remove_snippet.py` to the current `VMFWeb` class. Keep all existing commands in your current `vmf_web.py`.
