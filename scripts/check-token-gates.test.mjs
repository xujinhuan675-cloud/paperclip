import assert from "node:assert/strict";
import test from "node:test";

import { parseAllowlist } from "./check-token-gates.mjs";

test("parseAllowlist accepts LF and CRLF entries", () => {
  const css = [
    "/*",
    " * allow ui/src/pages/One.tsx — first reason",
    " * allow ui/src/components/Two.tsx - second reason",
    " */",
  ].join("\r\n");

  assert.deepEqual(parseAllowlist(css), [
    { path: "ui/src/pages/One.tsx", reason: "first reason" },
    { path: "ui/src/components/Two.tsx", reason: "second reason" },
  ]);
});
