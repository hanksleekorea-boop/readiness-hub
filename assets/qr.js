/* 최소 QR 부호기 — 바이트 모드, 버전 1~20, EC 레벨 L/M/Q/H. 외부 의존 없음. */
(function (root) {
  'use strict';
  var EXP = new Array(512), LOG = new Array(256);
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; } for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255]; })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }
  function rsPoly(n) { var p = [1]; for (var i = 0; i < n; i++) { var q = p.concat([0]); for (var j = 0; j < p.length; j++) q[j + 1] ^= gmul(p[j], EXP[i]); p = q; } return p; }
  function rsEnc(data, n) {
    var gen = rsPoly(n), res = new Array(n).fill(0);
    for (var i = 0; i < data.length; i++) {
      var f = data[i] ^ res[0]; res.shift(); res.push(0);
      if (f !== 0) for (var j = 0; j < n; j++) res[j] ^= gmul(gen[j + 1], f);
    }
    return res;
  }
  // [총코드워드, EC코드워드/블록, 그룹1블록수, 그룹1데이터코드워드, 그룹2블록수, 그룹2데이터코드워드]
  var RS = {
    L: [[26,7,1,19,0,0],[44,10,1,34,0,0],[70,15,1,55,0,0],[100,20,1,80,0,0],[134,26,1,108,0,0],[172,18,2,68,0,0],[196,20,2,78,0,0],[242,24,2,97,0,0],[292,30,2,116,0,0],[346,18,2,68,2,69],[404,20,4,81,0,0],[466,24,2,92,2,93],[532,26,4,107,0,0],[581,30,3,115,1,116],[655,22,5,87,1,88],[733,24,5,98,1,99],[815,28,1,107,5,108],[901,30,5,120,1,121],[991,28,3,113,4,114],[1085,28,3,107,5,108]],
    M: [[26,10,1,16,0,0],[44,16,1,28,0,0],[70,26,1,44,0,0],[100,18,2,32,0,0],[134,24,2,43,0,0],[172,16,4,27,0,0],[196,18,4,31,0,0],[242,22,2,38,2,39],[292,22,3,36,2,37],[346,26,4,43,1,44],[404,30,1,50,4,51],[466,22,6,36,2,37],[532,22,8,37,1,38],[581,24,4,40,5,41],[655,24,5,41,5,42],[733,28,7,45,3,46],[815,28,10,46,1,47],[901,26,9,43,4,44],[991,26,3,44,11,45],[1085,26,3,41,13,42]],
    Q: [[26,13,1,13,0,0],[44,22,1,22,0,0],[70,18,2,17,0,0],[100,26,2,24,0,0],[134,18,2,15,2,16],[172,24,4,19,0,0],[196,18,2,14,4,15],[242,22,4,18,2,19],[292,20,4,16,4,17],[346,24,6,19,2,20],[404,28,4,22,4,23],[466,26,4,20,6,21],[532,24,8,20,4,21],[581,20,11,16,5,17],[655,30,5,24,7,25],[733,24,15,19,2,20],[815,28,1,22,15,23],[901,28,17,22,1,23],[991,26,17,21,4,22],[1085,30,15,24,5,25]],
    H: [[26,17,1,9,0,0],[44,28,1,16,0,0],[70,22,2,13,0,0],[100,16,4,9,0,0],[134,22,2,11,2,12],[172,28,4,15,0,0],[196,26,4,13,1,14],[242,26,4,14,2,15],[292,24,4,12,4,13],[346,28,6,15,2,16],[404,24,3,12,8,13],[466,28,7,14,4,15],[532,22,12,11,4,12],[581,24,11,12,5,13],[655,24,11,12,7,13],[733,30,3,15,13,16],[815,28,2,14,17,15],[901,28,2,14,19,15],[991,26,9,13,16,14],[1085,28,15,15,10,16]]
  };
  var ALIGN = [[],[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90]];
  var ECBITS = { L: 1, M: 0, Q: 3, H: 2 };

  function utf8(str) {
    var out = [], i, c;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xc0 | (c >> 6), 0x80 | (c & 63)); }
      else if (c >= 0xd800 && c < 0xdc00) {
        var c2 = str.charCodeAt(++i); var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      } else { out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    }
    return out;
  }

  function encode(text, ecl) {
    ecl = ecl || 'M';
    var bytes = utf8(text), ver = 0, spec = null;
    for (var v = 1; v <= 20; v++) {
      var s = RS[ecl][v - 1];
      var cap = s[2] * s[3] + s[4] * s[5];
      var cci = v < 10 ? 8 : 16;
      var need = Math.ceil((4 + cci + 8 * bytes.length) / 8);
      if (need <= cap) { ver = v; spec = s; break; }
    }
    if (!ver) throw new Error('QR: 데이터가 너무 깁니다');
    var cciBits = ver < 10 ? 8 : 16;
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); }
    put(4, 4); put(bytes.length, cciBits);
    for (var i = 0; i < bytes.length; i++) put(bytes[i], 8);
    var totalData = spec[2] * spec[3] + spec[4] * spec[5];
    var capBits = totalData * 8;
    for (var t = 0; t < 4 && bits.length < capBits; t++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    var pad = [0xec, 0x11], pi = 0;
    while (bits.length < capBits) { put(pad[pi++ % 2], 8); }
    var dcw = [];
    for (var b = 0; b < bits.length; b += 8) { var n = 0; for (var k = 0; k < 8; k++) n = (n << 1) | bits[b + k]; dcw.push(n); }

    // 블록 분할
    var blocks = [], ecblocks = [], p = 0, g;
    for (g = 0; g < spec[2]; g++) { blocks.push(dcw.slice(p, p + spec[3])); p += spec[3]; }
    for (g = 0; g < spec[4]; g++) { blocks.push(dcw.slice(p, p + spec[5])); p += spec[5]; }
    for (g = 0; g < blocks.length; g++) ecblocks.push(rsEnc(blocks[g], spec[1]));
    var maxD = Math.max(spec[3], spec[5] || 0), out = [];
    for (var c = 0; c < maxD; c++) for (g = 0; g < blocks.length; g++) if (c < blocks[g].length) out.push(blocks[g][c]);
    for (var e = 0; e < spec[1]; e++) for (g = 0; g < ecblocks.length; g++) out.push(ecblocks[g][e]);

    // 매트릭스
    var size = ver * 4 + 17;
    var m = [], rsv = [];
    for (var r = 0; r < size; r++) { m.push(new Array(size).fill(0)); rsv.push(new Array(size).fill(0)); }
    function setF(r0, c0, val) { if (r0 >= 0 && r0 < size && c0 >= 0 && c0 < size) { m[r0][c0] = val; rsv[r0][c0] = 1; } }
    function finder(r0, c0) {
      for (var dr = -1; dr <= 7; dr++) for (var dc = -1; dc <= 7; dc++) {
        var rr = r0 + dr, cc = c0 + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        var inner = (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6);
        var on = inner && ((dr === 0 || dr === 6 || dc === 0 || dc === 6) || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        setF(rr, cc, on ? 1 : 0);
      }
    }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
    for (var i2 = 8; i2 < size - 8; i2++) { setF(6, i2, i2 % 2 === 0 ? 1 : 0); setF(i2, 6, i2 % 2 === 0 ? 1 : 0); }
    var ap = ALIGN[ver];
    for (var a1 = 0; a1 < ap.length; a1++) for (var a2 = 0; a2 < ap.length; a2++) {
      var ar = ap[a1], ac = ap[a2];
      if ((ar <= 8 && ac <= 8) || (ar <= 8 && ac >= size - 9) || (ar >= size - 9 && ac <= 8)) continue;
      for (var dr2 = -2; dr2 <= 2; dr2++) for (var dc2 = -2; dc2 <= 2; dc2++)
        setF(ar + dr2, ac + dc2, (Math.abs(dr2) === 2 || Math.abs(dc2) === 2 || (dr2 === 0 && dc2 === 0)) ? 1 : 0);
    }
    setF(size - 8, 8, 1);
    for (var f1 = 0; f1 < 9; f1++) { if (f1 !== 6) { rsv[8][f1] = 1; rsv[f1][8] = 1; } }
    for (var f2 = 0; f2 < 8; f2++) { rsv[8][size - 1 - f2] = 1; rsv[size - 1 - f2][8] = 1; }
    if (ver >= 7) {
      var vrem = ver; for (var vi = 0; vi < 12; vi++) { vrem = (vrem << 1) ^ ((vrem >>> 11) * 0x1f25); }
      var vbits = ((ver << 12) | vrem) >>> 0;
      for (var vk = 0; vk < 18; vk++) {
        var bit = (vbits >>> vk) & 1, rr2 = Math.floor(vk / 3), cc2 = size - 11 + (vk % 3);
        setF(rr2, cc2, bit); setF(cc2, rr2, bit);
      }
    }
    // 데이터 배치
    var dir = -1, row = size - 1, idx = 0, bitIdx = 0;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (var s2 = 0; s2 < 2; s2++) {
          var cc3 = col - s2;
          if (!rsv[row][cc3]) {
            var v2 = 0;
            if (idx < out.length) { v2 = (out[idx] >> (7 - bitIdx)) & 1; bitIdx++; if (bitIdx === 8) { bitIdx = 0; idx++; } }
            m[row][cc3] = v2;
          }
        }
        row += dir;
        if (row < 0 || row >= size) { row -= dir; dir = -dir; break; }
      }
    }
    // 마스크 + 페널티
    var MASK = [
      function (r, c) { return (r + c) % 2 === 0; }, function (r) { return r % 2 === 0; },
      function (r, c) { return c % 3 === 0; }, function (r, c) { return (r + c) % 3 === 0; },
      function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; },
      function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
      function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
      function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }
    ];
    function fmtBits(mask) {
      var d = (ECBITS[ecl] << 3) | mask, rem = d;
      for (var q = 0; q < 10; q++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      return (((d << 10) | rem) ^ 0x5412) >>> 0;
    }
    function applyFmt(mm, mask) {
      var f = fmtBits(mask);
      for (var k2 = 0; k2 < 15; k2++) {
        var bit = (f >>> k2) & 1;
        /* 1번째 사본: (열 8, 행 k) 세로줄 → m[행][열] 이므로 행·열 순서 주의 */
        if (k2 < 6) mm[k2][8] = bit; else if (k2 === 6) mm[7][8] = bit;
        else if (k2 === 7) mm[8][8] = bit; else if (k2 === 8) mm[8][7] = bit;
        else mm[8][14 - k2] = bit;
        /* 2번째 사본 */
        if (k2 < 8) mm[8][size - 1 - k2] = bit; else mm[size - 15 + k2][8] = bit;
      }
      mm[size - 8][8] = 1;
    }
    function penalty(mm) {
      var pen = 0, r3, c4, run, i3, dark = 0;
      for (r3 = 0; r3 < size; r3++) { run = 1; for (c4 = 1; c4 < size; c4++) { if (mm[r3][c4] === mm[r3][c4 - 1]) { run++; } else { if (run >= 5) pen += 3 + (run - 5); run = 1; } } if (run >= 5) pen += 3 + (run - 5); }
      for (c4 = 0; c4 < size; c4++) { run = 1; for (r3 = 1; r3 < size; r3++) { if (mm[r3][c4] === mm[r3 - 1][c4]) { run++; } else { if (run >= 5) pen += 3 + (run - 5); run = 1; } } if (run >= 5) pen += 3 + (run - 5); }
      for (r3 = 0; r3 < size - 1; r3++) for (c4 = 0; c4 < size - 1; c4++) { var s3 = mm[r3][c4] + mm[r3][c4 + 1] + mm[r3 + 1][c4] + mm[r3 + 1][c4 + 1]; if (s3 === 0 || s3 === 4) pen += 3; }
      var pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
      function match(arr, st) { for (i3 = 0; i3 < 11; i3++) if (arr[st + i3] !== pat[i3]) return false; return true; }
      function matchR(arr, st) { for (i3 = 0; i3 < 11; i3++) if (arr[st + i3] !== pat[10 - i3]) return false; return true; }
      for (r3 = 0; r3 < size; r3++) { var rowArr = mm[r3]; for (c4 = 0; c4 + 11 <= size; c4++) { if (match(rowArr, c4) || matchR(rowArr, c4)) pen += 40; } }
      for (c4 = 0; c4 < size; c4++) { var colArr = []; for (r3 = 0; r3 < size; r3++) colArr.push(mm[r3][c4]); for (r3 = 0; r3 + 11 <= size; r3++) { if (match(colArr, r3) || matchR(colArr, r3)) pen += 40; } }
      for (r3 = 0; r3 < size; r3++) for (c4 = 0; c4 < size; c4++) if (mm[r3][c4]) dark++;
      var pct = dark * 100 / (size * size);
      pen += Math.floor(Math.abs(pct - 50) / 5) * 10;
      return pen;
    }
    var best = null, bestPen = Infinity;
    for (var mk = 0; mk < 8; mk++) {
      var mm2 = m.map(function (r4) { return r4.slice(); });
      for (var r5 = 0; r5 < size; r5++) for (var c5 = 0; c5 < size; c5++) if (!rsv[r5][c5] && MASK[mk](r5, c5)) mm2[r5][c5] ^= 1;
      applyFmt(mm2, mk);
      var pn = penalty(mm2);
      if (pn < bestPen) { bestPen = pn; best = mm2; }
    }
    return { size: size, version: ver, modules: best };
  }

  function svg(text, opt) {
    opt = opt || {};
    var q = encode(text, opt.ecl || 'M'), qz = opt.quiet == null ? 4 : opt.quiet;
    var n = q.size + qz * 2, px = opt.scale || 4;
    var d = '';
    for (var r = 0; r < q.size; r++) {
      var c = 0;
      while (c < q.size) {
        if (q.modules[r][c]) { var st = c; while (c < q.size && q.modules[r][c]) c++; d += 'M' + (st + qz) + ' ' + (r + qz) + 'h' + (c - st) + 'v1h-' + (c - st) + 'z'; }
        else c++;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" width="' + (n * px) + '" height="' + (n * px) + '" shape-rendering="crispEdges" role="img" aria-label="QR 코드: ' + String(text).replace(/[<>&"]/g, '') + '">'
      + '<rect width="' + n + '" height="' + n + '" fill="' + (opt.bg || '#ffffff') + '"/>'
      + '<path d="' + d + '" fill="' + (opt.fg || '#000000') + '"/></svg>';
  }
  root.QRLite = { encode: encode, svg: svg };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
if (typeof module !== 'undefined') module.exports = (typeof globalThis !== 'undefined' ? globalThis : this).QRLite;
