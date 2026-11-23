import { test, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyStripeSignature } from "./stripe-webhook";
test("whsec full key", async () => {
  const s="whsec_abc123", b='{"id":"evt"}', t=Math.floor(Date.now()/1000);
  const v=createHmac("sha256",s).update(`${t}.${b}`).digest("hex");
  expect(await verifyStripeSignature(b,`t=${t},v1=${v}`,s)).toBe(true);
});
