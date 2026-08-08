import { test } from "node:test";
import assert from "node:assert/strict";
import { splitEvenlyBps } from "./splits.js";

test("splitEvenlyBps always sums to exactly 10000", () => {
  for (let n = 1; n <= 12; n++) {
    const bps = splitEvenlyBps(n);
    assert.equal(bps.length, n);
    assert.equal(
      bps.reduce((a, b) => a + b, 0),
      10_000,
    );
  }
});

test("splitEvenlyBps gives every recipient the same share when it divides evenly", () => {
  assert.deepEqual(splitEvenlyBps(4), [2500, 2500, 2500, 2500]);
});

test("splitEvenlyBps spreads the remainder one bp at a time, not all on one recipient", () => {
  // 10000 / 3 = 3333.33... — remainder of 1 goes to a single recipient, not stranded.
  const bps = splitEvenlyBps(3);
  assert.deepEqual(
    bps.slice().sort((a, b) => b - a),
    [3334, 3333, 3333],
  );
});

test("splitEvenlyBps of 1 is the solo-payee case", () => {
  assert.deepEqual(splitEvenlyBps(1), [10_000]);
});

test("splitEvenlyBps rejects non-positive or non-integer input", () => {
  assert.throws(() => splitEvenlyBps(0));
  assert.throws(() => splitEvenlyBps(-1));
  assert.throws(() => splitEvenlyBps(1.5));
});
