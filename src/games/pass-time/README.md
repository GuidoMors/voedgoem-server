# pass-time server guide

Server game rules, state and validation notes. Consult the implementation and tests for current behavior; coordinate UI changes with the sibling frontend.

Pass Time's starter and custom clock catalog is stored in the `passTimeClocks` D1 table. The first request to `/api/pass-time/clocks` seeds any missing starter clocks; admins can edit, add, and remove catalog clocks in the Pass Time lobby.
