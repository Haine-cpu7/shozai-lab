# AUDIT v1.71 — No.018 navigation fix
- Removed reliance on implicit window globals created from element IDs.
- All controls now use explicit `getElementById` references and `addEventListener`.
- Year advancement calls the engine directly and re-renders.
- Added scroll-to-current-state after advancing.
- Core history engine logic unchanged.
