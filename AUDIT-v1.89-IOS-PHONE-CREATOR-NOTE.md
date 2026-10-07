# AUDIT v1.89 — iOS phone detection / creator note

## Changes
- Added `<meta name="format-detection" content="telephone=no">` to 40 public HTML pages.
- Rewrote theme-number labels on `index.html` to explicit `No.` notation so `01–02 / 15 / 20` is not interpreted as a telephone number.
- Replaced the creator note with `教科書ですら疑う余地はアルマジロ`.

## Non-changes
- No simulation equations, probabilities, BOT traits, Seed behavior, or experiment logic changed.
- No URL paths or experiment numbering changed.

## Verification
- Public HTML pages include the telephone auto-detection opt-out meta tag.
- Old creator-note wording is absent from current public site files.
- Local href/src targets and duplicate IDs were checked.
- ZIP integrity was checked.
