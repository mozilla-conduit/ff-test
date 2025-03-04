// Copyright 2024 Mathias Bynens. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
author: Mathias Bynens
description: >
  Unicode property escapes for `Script_Extensions=Grantha`
info: |
  Generated by https://github.com/mathiasbynens/unicode-property-escapes-tests
  Unicode v16.0.0
esid: sec-static-semantics-unicodematchproperty-p
features: [regexp-unicode-property-escapes]
includes: [regExpUtils.js]
---*/

const matchSymbols = buildString({
  loneCodePoints: [
    0x001CD0,
    0x0020F0,
    0x011350,
    0x011357,
    0x011FD3
  ],
  ranges: [
    [0x000951, 0x000952],
    [0x000964, 0x000965],
    [0x000BE6, 0x000BF3],
    [0x001CD2, 0x001CD3],
    [0x001CF2, 0x001CF4],
    [0x001CF8, 0x001CF9],
    [0x011300, 0x011303],
    [0x011305, 0x01130C],
    [0x01130F, 0x011310],
    [0x011313, 0x011328],
    [0x01132A, 0x011330],
    [0x011332, 0x011333],
    [0x011335, 0x011339],
    [0x01133B, 0x011344],
    [0x011347, 0x011348],
    [0x01134B, 0x01134D],
    [0x01135D, 0x011363],
    [0x011366, 0x01136C],
    [0x011370, 0x011374],
    [0x011FD0, 0x011FD1]
  ]
});
testPropertyEscapes(
  /^\p{Script_Extensions=Grantha}+$/u,
  matchSymbols,
  "\\p{Script_Extensions=Grantha}"
);
testPropertyEscapes(
  /^\p{Script_Extensions=Gran}+$/u,
  matchSymbols,
  "\\p{Script_Extensions=Gran}"
);
testPropertyEscapes(
  /^\p{scx=Grantha}+$/u,
  matchSymbols,
  "\\p{scx=Grantha}"
);
testPropertyEscapes(
  /^\p{scx=Gran}+$/u,
  matchSymbols,
  "\\p{scx=Gran}"
);

const nonMatchSymbols = buildString({
  loneCodePoints: [
    0x001CD1,
    0x011304,
    0x011329,
    0x011331,
    0x011334,
    0x01133A,
    0x011FD2
  ],
  ranges: [
    [0x00DC00, 0x00DFFF],
    [0x000000, 0x000950],
    [0x000953, 0x000963],
    [0x000966, 0x000BE5],
    [0x000BF4, 0x001CCF],
    [0x001CD4, 0x001CF1],
    [0x001CF5, 0x001CF7],
    [0x001CFA, 0x0020EF],
    [0x0020F1, 0x00DBFF],
    [0x00E000, 0x0112FF],
    [0x01130D, 0x01130E],
    [0x011311, 0x011312],
    [0x011345, 0x011346],
    [0x011349, 0x01134A],
    [0x01134E, 0x01134F],
    [0x011351, 0x011356],
    [0x011358, 0x01135C],
    [0x011364, 0x011365],
    [0x01136D, 0x01136F],
    [0x011375, 0x011FCF],
    [0x011FD4, 0x10FFFF]
  ]
});
testPropertyEscapes(
  /^\P{Script_Extensions=Grantha}+$/u,
  nonMatchSymbols,
  "\\P{Script_Extensions=Grantha}"
);
testPropertyEscapes(
  /^\P{Script_Extensions=Gran}+$/u,
  nonMatchSymbols,
  "\\P{Script_Extensions=Gran}"
);
testPropertyEscapes(
  /^\P{scx=Grantha}+$/u,
  nonMatchSymbols,
  "\\P{scx=Grantha}"
);
testPropertyEscapes(
  /^\P{scx=Gran}+$/u,
  nonMatchSymbols,
  "\\P{scx=Gran}"
);

reportCompare(0, 0);
