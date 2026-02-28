var PptxLib = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require3() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/@jvmr/pptx-to-html/dist/chunk-KAPAPPOM.js
  function libWarn(msg) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn(`[pptx-to-html] ${msg}`);
    }
  }
  var __require2, XmlHelper;
  var init_chunk_KAPAPPOM = __esm({
    "node_modules/@jvmr/pptx-to-html/dist/chunk-KAPAPPOM.js"() {
      __require2 = /* @__PURE__ */ ((x) => typeof __require !== "undefined" ? __require : typeof Proxy !== "undefined" ? new Proxy(x, {
        get: (a, b) => (typeof __require !== "undefined" ? __require : a)[b]
      }) : x)(function(x) {
        if (typeof __require !== "undefined") return __require.apply(this, arguments);
        throw Error('Dynamic require of "' + x + '" is not supported');
      });
      XmlHelper = class _XmlHelper {
        static domParserFactory = null;
        /**
         * Parses a string containing XML into a DOM Document
         * @param xmlString XML string to parse
         * @returns DOM Document
         */
        static parseXml(xmlString) {
          if (_XmlHelper.domParserFactory) {
            return _XmlHelper.domParserFactory().parseFromString(xmlString, "application/xml");
          }
          const anyGlobal = globalThis;
          const DP = anyGlobal?.DOMParser;
          if (typeof DP === "function") {
            return new DP().parseFromString(xmlString, "application/xml");
          }
          try {
            const xmldom = __require2("@xmldom/xmldom");
            const Parser = xmldom.DOMParser || xmldom?.DOMParser;
            if (Parser) {
              return new Parser().parseFromString(xmlString, "application/xml");
            }
          } catch {
          }
          libWarn("No DOMParser available. Use XmlHelper.setDomParser() or install '@xmldom/xmldom'.");
          throw new Error("DOMParser not available in this environment");
        }
        /**
         * Gets a direct child element by local tag name
         */
        static getDirectChildrenByTagName(parent, tag) {
          return Array.from(parent.children).filter(
            (child) => child.localName === tag
          );
        }
        /**
         * Gets attribute value as number, defaulting to 0
         */
        static getAttrAsNumber(el, name) {
          const raw = el.getAttribute(name);
          if (raw == null || raw === "") return 0;
          const n = Number(raw);
          return Number.isFinite(n) ? n : 0;
        }
        static getColorFromElement(el, themeColors) {
          if (!el) return void 0;
          const srgb = el.getElementsByTagNameNS("*", "srgbClr")[0];
          if (srgb) {
            const val = srgb.getAttribute("val");
            return val ? `#${val}` : void 0;
          }
          const scheme = el.getElementsByTagNameNS("*", "schemeClr")[0];
          if (scheme) {
            const val = scheme.getAttribute("val");
            if (val && themeColors) {
              const aliasMap = {
                bg1: "lt1",
                bg2: "lt2",
                tx1: "dk1",
                tx2: "dk2"
              };
              const resolvedKey = aliasMap[val] || val;
              return themeColors[resolvedKey];
            }
            return void 0;
          }
          const sys = el.getElementsByTagNameNS("*", "sysClr")[0];
          if (sys) {
            const lastClr = sys.getAttribute("lastClr");
            return lastClr ? `#${lastClr}` : void 0;
          }
          return void 0;
        }
        static extractThemeColors(themeDoc) {
          if (!themeDoc) return {};
          const NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
          const themeColors = {};
          const clrScheme = themeDoc.getElementsByTagNameNS(NS, "clrScheme")[0];
          if (!clrScheme) return {};
          for (const node of Array.from(clrScheme.children)) {
            const name = node.localName;
            const srgbClr = node.getElementsByTagNameNS(NS, "srgbClr")[0];
            const sysClr = node.getElementsByTagNameNS(NS, "sysClr")[0];
            const hex = srgbClr?.getAttribute("val") ?? sysClr?.getAttribute("lastClr");
            if (hex) {
              themeColors[name] = `#${hex}`;
            }
          }
          return themeColors;
        }
        /**
         * Extracts table styles (fills and text colors per region) from theme XML.
         * Returns a map keyed by styleId (GUID or name), with region color maps.
         */
        static extractThemeTableStyles(themeDoc) {
          const styles = {};
          if (!themeDoc) return styles;
          const themeColors = _XmlHelper.extractThemeColors(themeDoc);
          const tblStyleLst = themeDoc.getElementsByTagNameNS("*", "tblStyleLst")[0] || null;
          if (!tblStyleLst) return styles;
          const tblStyles = Array.from(tblStyleLst.getElementsByTagNameNS("*", "tblStyle"));
          for (const ts of tblStyles) {
            const id = ts.getAttribute("styleId") || ts.getAttribute("name") || "";
            if (!id) continue;
            const fills = {};
            const fontColors = {};
            const prNodes = Array.from(ts.getElementsByTagNameNS("*", "tblStylePr"));
            for (const pr of prNodes) {
              const type = pr.getAttribute("type") || pr.getAttribute("val") || "";
              if (!type) continue;
              const tcStyle = pr.getElementsByTagNameNS("*", "tcStyle")[0] || null;
              const tcPr = tcStyle?.getElementsByTagNameNS("*", "tcPr")[0] || null;
              const solidCandidates = [
                tcPr?.getElementsByTagNameNS("*", "solidFill")[0] || null,
                tcStyle?.getElementsByTagNameNS("*", "solidFill")[0] || null,
                pr.getElementsByTagNameNS("*", "solidFill")[0] || null
              ];
              let fillColor;
              for (const cand of solidCandidates) {
                if (cand && !fillColor) fillColor = _XmlHelper.getColorFromElement(cand, themeColors);
              }
              if (!fillColor) {
                const fillRef = tcStyle?.getElementsByTagNameNS("*", "fillRef")[0] || pr.getElementsByTagNameNS("*", "fillRef")[0] || null;
                fillColor = _XmlHelper.getColorFromElement(fillRef, themeColors);
              }
              if (fillColor) fills[type] = fillColor;
              const txStyle = pr.getElementsByTagNameNS("*", "tcTxStyle")[0] || null;
              const txFillSolid = txStyle?.getElementsByTagNameNS("*", "solidFill")[0] || null;
              let textColor = _XmlHelper.getColorFromElement(txFillSolid, themeColors);
              if (!textColor) {
                const fontRef = txStyle?.getElementsByTagNameNS("*", "fontRef")[0] || null;
                textColor = _XmlHelper.getColorFromElement(fontRef, themeColors);
              }
              if (!textColor) {
                const anyScheme = txStyle?.getElementsByTagNameNS("*", "schemeClr")[0] || null;
                textColor = _XmlHelper.getColorFromElement(anyScheme, themeColors);
              }
              if (textColor) fontColors[type] = textColor;
            }
            styles[id] = { fills, fontColors };
          }
          return styles;
        }
        /** Allow host to provide a DOM parser (e.g., new (require('@xmldom/xmldom').DOMParser)()) */
        static setDomParser(factory) {
          _XmlHelper.domParserFactory = factory;
        }
        /** Relationship lookup: by Type suffix (avoids querySelector CSS) */
        static findRelationshipByTypeSuffix(doc, suffix) {
          const rels = doc.getElementsByTagName("Relationship");
          for (const el of Array.from(rels)) {
            const t = el.getAttribute("Type") || "";
            if (t.endsWith(suffix)) return el;
          }
          return null;
        }
        /** Relationship lookup: by Id */
        static findRelationshipById(doc, id) {
          const rels = doc.getElementsByTagName("Relationship");
          for (const el of Array.from(rels)) {
            if (el.getAttribute("Id") === id) return el;
          }
          return null;
        }
      };
    }
  });

  // node_modules/jszip/dist/jszip.min.js
  var require_jszip_min = __commonJS({
    "node_modules/jszip/dist/jszip.min.js"(exports, module) {
      !(function(e) {
        if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
        else if ("function" == typeof define && define.amd) define([], e);
        else {
          ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).JSZip = e();
        }
      })(function() {
        return (function s(a, o, h) {
          function u(r, e2) {
            if (!o[r]) {
              if (!a[r]) {
                var t = "function" == typeof __require && __require;
                if (!e2 && t) return t(r, true);
                if (l) return l(r, true);
                var n = new Error("Cannot find module '" + r + "'");
                throw n.code = "MODULE_NOT_FOUND", n;
              }
              var i = o[r] = { exports: {} };
              a[r][0].call(i.exports, function(e3) {
                var t2 = a[r][1][e3];
                return u(t2 || e3);
              }, i, i.exports, s, a, o, h);
            }
            return o[r].exports;
          }
          for (var l = "function" == typeof __require && __require, e = 0; e < h.length; e++) u(h[e]);
          return u;
        })({ 1: [function(e, t, r) {
          "use strict";
          var d = e("./utils"), c = e("./support"), p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          r.encode = function(e2) {
            for (var t2, r2, n, i, s, a, o, h = [], u = 0, l = e2.length, f = l, c2 = "string" !== d.getTypeOf(e2); u < e2.length; ) f = l - u, n = c2 ? (t2 = e2[u++], r2 = u < l ? e2[u++] : 0, u < l ? e2[u++] : 0) : (t2 = e2.charCodeAt(u++), r2 = u < l ? e2.charCodeAt(u++) : 0, u < l ? e2.charCodeAt(u++) : 0), i = t2 >> 2, s = (3 & t2) << 4 | r2 >> 4, a = 1 < f ? (15 & r2) << 2 | n >> 6 : 64, o = 2 < f ? 63 & n : 64, h.push(p.charAt(i) + p.charAt(s) + p.charAt(a) + p.charAt(o));
            return h.join("");
          }, r.decode = function(e2) {
            var t2, r2, n, i, s, a, o = 0, h = 0, u = "data:";
            if (e2.substr(0, u.length) === u) throw new Error("Invalid base64 input, it looks like a data url.");
            var l, f = 3 * (e2 = e2.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
            if (e2.charAt(e2.length - 1) === p.charAt(64) && f--, e2.charAt(e2.length - 2) === p.charAt(64) && f--, f % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
            for (l = c.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); o < e2.length; ) t2 = p.indexOf(e2.charAt(o++)) << 2 | (i = p.indexOf(e2.charAt(o++))) >> 4, r2 = (15 & i) << 4 | (s = p.indexOf(e2.charAt(o++))) >> 2, n = (3 & s) << 6 | (a = p.indexOf(e2.charAt(o++))), l[h++] = t2, 64 !== s && (l[h++] = r2), 64 !== a && (l[h++] = n);
            return l;
          };
        }, { "./support": 30, "./utils": 32 }], 2: [function(e, t, r) {
          "use strict";
          var n = e("./external"), i = e("./stream/DataWorker"), s = e("./stream/Crc32Probe"), a = e("./stream/DataLengthProbe");
          function o(e2, t2, r2, n2, i2) {
            this.compressedSize = e2, this.uncompressedSize = t2, this.crc32 = r2, this.compression = n2, this.compressedContent = i2;
          }
          o.prototype = { getContentWorker: function() {
            var e2 = new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")), t2 = this;
            return e2.on("end", function() {
              if (this.streamInfo.data_length !== t2.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
            }), e2;
          }, getCompressedWorker: function() {
            return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
          } }, o.createWorkerFrom = function(e2, t2, r2) {
            return e2.pipe(new s()).pipe(new a("uncompressedSize")).pipe(t2.compressWorker(r2)).pipe(new a("compressedSize")).withStreamInfo("compression", t2);
          }, t.exports = o;
        }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e, t, r) {
          "use strict";
          var n = e("./stream/GenericWorker");
          r.STORE = { magic: "\0\0", compressWorker: function() {
            return new n("STORE compression");
          }, uncompressWorker: function() {
            return new n("STORE decompression");
          } }, r.DEFLATE = e("./flate");
        }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e, t, r) {
          "use strict";
          var n = e("./utils");
          var o = (function() {
            for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
              e2 = r2;
              for (var n2 = 0; n2 < 8; n2++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
              t2[r2] = e2;
            }
            return t2;
          })();
          t.exports = function(e2, t2) {
            return void 0 !== e2 && e2.length ? "string" !== n.getTypeOf(e2) ? (function(e3, t3, r2, n2) {
              var i = o, s = n2 + r2;
              e3 ^= -1;
              for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3[a])];
              return -1 ^ e3;
            })(0 | t2, e2, e2.length, 0) : (function(e3, t3, r2, n2) {
              var i = o, s = n2 + r2;
              e3 ^= -1;
              for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3.charCodeAt(a))];
              return -1 ^ e3;
            })(0 | t2, e2, e2.length, 0) : 0;
          };
        }, { "./utils": 32 }], 5: [function(e, t, r) {
          "use strict";
          r.base64 = false, r.binary = false, r.dir = false, r.createFolders = true, r.date = null, r.compression = null, r.compressionOptions = null, r.comment = null, r.unixPermissions = null, r.dosPermissions = null;
        }, {}], 6: [function(e, t, r) {
          "use strict";
          var n = null;
          n = "undefined" != typeof Promise ? Promise : e("lie"), t.exports = { Promise: n };
        }, { lie: 37 }], 7: [function(e, t, r) {
          "use strict";
          var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array, i = e("pako"), s = e("./utils"), a = e("./stream/GenericWorker"), o = n ? "uint8array" : "array";
          function h(e2, t2) {
            a.call(this, "FlateWorker/" + e2), this._pako = null, this._pakoAction = e2, this._pakoOptions = t2, this.meta = {};
          }
          r.magic = "\b\0", s.inherits(h, a), h.prototype.processChunk = function(e2) {
            this.meta = e2.meta, null === this._pako && this._createPako(), this._pako.push(s.transformTo(o, e2.data), false);
          }, h.prototype.flush = function() {
            a.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], true);
          }, h.prototype.cleanUp = function() {
            a.prototype.cleanUp.call(this), this._pako = null;
          }, h.prototype._createPako = function() {
            this._pako = new i[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
            var t2 = this;
            this._pako.onData = function(e2) {
              t2.push({ data: e2, meta: t2.meta });
            };
          }, r.compressWorker = function(e2) {
            return new h("Deflate", e2);
          }, r.uncompressWorker = function() {
            return new h("Inflate", {});
          };
        }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e, t, r) {
          "use strict";
          function A(e2, t2) {
            var r2, n2 = "";
            for (r2 = 0; r2 < t2; r2++) n2 += String.fromCharCode(255 & e2), e2 >>>= 8;
            return n2;
          }
          function n(e2, t2, r2, n2, i2, s2) {
            var a, o, h = e2.file, u = e2.compression, l = s2 !== O.utf8encode, f = I.transformTo("string", s2(h.name)), c = I.transformTo("string", O.utf8encode(h.name)), d = h.comment, p = I.transformTo("string", s2(d)), m = I.transformTo("string", O.utf8encode(d)), _ = c.length !== h.name.length, g = m.length !== d.length, b = "", v = "", y = "", w = h.dir, k = h.date, x = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
            t2 && !r2 || (x.crc32 = e2.crc32, x.compressedSize = e2.compressedSize, x.uncompressedSize = e2.uncompressedSize);
            var S = 0;
            t2 && (S |= 8), l || !_ && !g || (S |= 2048);
            var z = 0, C = 0;
            w && (z |= 16), "UNIX" === i2 ? (C = 798, z |= (function(e3, t3) {
              var r3 = e3;
              return e3 || (r3 = t3 ? 16893 : 33204), (65535 & r3) << 16;
            })(h.unixPermissions, w)) : (C = 20, z |= (function(e3) {
              return 63 & (e3 || 0);
            })(h.dosPermissions)), a = k.getUTCHours(), a <<= 6, a |= k.getUTCMinutes(), a <<= 5, a |= k.getUTCSeconds() / 2, o = k.getUTCFullYear() - 1980, o <<= 4, o |= k.getUTCMonth() + 1, o <<= 5, o |= k.getUTCDate(), _ && (v = A(1, 1) + A(B(f), 4) + c, b += "up" + A(v.length, 2) + v), g && (y = A(1, 1) + A(B(p), 4) + m, b += "uc" + A(y.length, 2) + y);
            var E = "";
            return E += "\n\0", E += A(S, 2), E += u.magic, E += A(a, 2), E += A(o, 2), E += A(x.crc32, 4), E += A(x.compressedSize, 4), E += A(x.uncompressedSize, 4), E += A(f.length, 2), E += A(b.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f + b, dirRecord: R.CENTRAL_FILE_HEADER + A(C, 2) + E + A(p.length, 2) + "\0\0\0\0" + A(z, 4) + A(n2, 4) + f + b + p };
          }
          var I = e("../utils"), i = e("../stream/GenericWorker"), O = e("../utf8"), B = e("../crc32"), R = e("../signature");
          function s(e2, t2, r2, n2) {
            i.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t2, this.zipPlatform = r2, this.encodeFileName = n2, this.streamFiles = e2, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
          }
          I.inherits(s, i), s.prototype.push = function(e2) {
            var t2 = e2.meta.percent || 0, r2 = this.entriesCount, n2 = this._sources.length;
            this.accumulate ? this.contentBuffer.push(e2) : (this.bytesWritten += e2.data.length, i.prototype.push.call(this, { data: e2.data, meta: { currentFile: this.currentFile, percent: r2 ? (t2 + 100 * (r2 - n2 - 1)) / r2 : 100 } }));
          }, s.prototype.openedSource = function(e2) {
            this.currentSourceOffset = this.bytesWritten, this.currentFile = e2.file.name;
            var t2 = this.streamFiles && !e2.file.dir;
            if (t2) {
              var r2 = n(e2, t2, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
              this.push({ data: r2.fileRecord, meta: { percent: 0 } });
            } else this.accumulate = true;
          }, s.prototype.closedSource = function(e2) {
            this.accumulate = false;
            var t2 = this.streamFiles && !e2.file.dir, r2 = n(e2, t2, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            if (this.dirRecords.push(r2.dirRecord), t2) this.push({ data: (function(e3) {
              return R.DATA_DESCRIPTOR + A(e3.crc32, 4) + A(e3.compressedSize, 4) + A(e3.uncompressedSize, 4);
            })(e2), meta: { percent: 100 } });
            else for (this.push({ data: r2.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
            this.currentFile = null;
          }, s.prototype.flush = function() {
            for (var e2 = this.bytesWritten, t2 = 0; t2 < this.dirRecords.length; t2++) this.push({ data: this.dirRecords[t2], meta: { percent: 100 } });
            var r2 = this.bytesWritten - e2, n2 = (function(e3, t3, r3, n3, i2) {
              var s2 = I.transformTo("string", i2(n3));
              return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(e3, 2) + A(e3, 2) + A(t3, 4) + A(r3, 4) + A(s2.length, 2) + s2;
            })(this.dirRecords.length, r2, e2, this.zipComment, this.encodeFileName);
            this.push({ data: n2, meta: { percent: 100 } });
          }, s.prototype.prepareNextSource = function() {
            this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
          }, s.prototype.registerPrevious = function(e2) {
            this._sources.push(e2);
            var t2 = this;
            return e2.on("data", function(e3) {
              t2.processChunk(e3);
            }), e2.on("end", function() {
              t2.closedSource(t2.previous.streamInfo), t2._sources.length ? t2.prepareNextSource() : t2.end();
            }), e2.on("error", function(e3) {
              t2.error(e3);
            }), this;
          }, s.prototype.resume = function() {
            return !!i.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
          }, s.prototype.error = function(e2) {
            var t2 = this._sources;
            if (!i.prototype.error.call(this, e2)) return false;
            for (var r2 = 0; r2 < t2.length; r2++) try {
              t2[r2].error(e2);
            } catch (e3) {
            }
            return true;
          }, s.prototype.lock = function() {
            i.prototype.lock.call(this);
            for (var e2 = this._sources, t2 = 0; t2 < e2.length; t2++) e2[t2].lock();
          }, t.exports = s;
        }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e, t, r) {
          "use strict";
          var u = e("../compressions"), n = e("./ZipFileWorker");
          r.generateWorker = function(e2, a, t2) {
            var o = new n(a.streamFiles, t2, a.platform, a.encodeFileName), h = 0;
            try {
              e2.forEach(function(e3, t3) {
                h++;
                var r2 = (function(e4, t4) {
                  var r3 = e4 || t4, n3 = u[r3];
                  if (!n3) throw new Error(r3 + " is not a valid compression method !");
                  return n3;
                })(t3.options.compression, a.compression), n2 = t3.options.compressionOptions || a.compressionOptions || {}, i = t3.dir, s = t3.date;
                t3._compressWorker(r2, n2).withStreamInfo("file", { name: e3, dir: i, date: s, comment: t3.comment || "", unixPermissions: t3.unixPermissions, dosPermissions: t3.dosPermissions }).pipe(o);
              }), o.entriesCount = h;
            } catch (e3) {
              o.error(e3);
            }
            return o;
          };
        }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e, t, r) {
          "use strict";
          function n() {
            if (!(this instanceof n)) return new n();
            if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
            this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
              var e2 = new n();
              for (var t2 in this) "function" != typeof this[t2] && (e2[t2] = this[t2]);
              return e2;
            };
          }
          (n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.1", n.loadAsync = function(e2, t2) {
            return new n().loadAsync(e2, t2);
          }, n.external = e("./external"), t.exports = n;
        }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e, t, r) {
          "use strict";
          var u = e("./utils"), i = e("./external"), n = e("./utf8"), s = e("./zipEntries"), a = e("./stream/Crc32Probe"), l = e("./nodejsUtils");
          function f(n2) {
            return new i.Promise(function(e2, t2) {
              var r2 = n2.decompressed.getContentWorker().pipe(new a());
              r2.on("error", function(e3) {
                t2(e3);
              }).on("end", function() {
                r2.streamInfo.crc32 !== n2.decompressed.crc32 ? t2(new Error("Corrupted zip : CRC32 mismatch")) : e2();
              }).resume();
            });
          }
          t.exports = function(e2, o) {
            var h = this;
            return o = u.extend(o || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: n.utf8decode }), l.isNode && l.isStream(e2) ? i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", e2, true, o.optimizedBinaryString, o.base64).then(function(e3) {
              var t2 = new s(o);
              return t2.load(e3), t2;
            }).then(function(e3) {
              var t2 = [i.Promise.resolve(e3)], r2 = e3.files;
              if (o.checkCRC32) for (var n2 = 0; n2 < r2.length; n2++) t2.push(f(r2[n2]));
              return i.Promise.all(t2);
            }).then(function(e3) {
              for (var t2 = e3.shift(), r2 = t2.files, n2 = 0; n2 < r2.length; n2++) {
                var i2 = r2[n2], s2 = i2.fileNameStr, a2 = u.resolve(i2.fileNameStr);
                h.file(a2, i2.decompressed, { binary: true, optimizedBinaryString: true, date: i2.date, dir: i2.dir, comment: i2.fileCommentStr.length ? i2.fileCommentStr : null, unixPermissions: i2.unixPermissions, dosPermissions: i2.dosPermissions, createFolders: o.createFolders }), i2.dir || (h.file(a2).unsafeOriginalName = s2);
              }
              return t2.zipComment.length && (h.comment = t2.zipComment), h;
            });
          };
        }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e, t, r) {
          "use strict";
          var n = e("../utils"), i = e("../stream/GenericWorker");
          function s(e2, t2) {
            i.call(this, "Nodejs stream input adapter for " + e2), this._upstreamEnded = false, this._bindStream(t2);
          }
          n.inherits(s, i), s.prototype._bindStream = function(e2) {
            var t2 = this;
            (this._stream = e2).pause(), e2.on("data", function(e3) {
              t2.push({ data: e3, meta: { percent: 0 } });
            }).on("error", function(e3) {
              t2.isPaused ? this.generatedError = e3 : t2.error(e3);
            }).on("end", function() {
              t2.isPaused ? t2._upstreamEnded = true : t2.end();
            });
          }, s.prototype.pause = function() {
            return !!i.prototype.pause.call(this) && (this._stream.pause(), true);
          }, s.prototype.resume = function() {
            return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
          }, t.exports = s;
        }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e, t, r) {
          "use strict";
          var i = e("readable-stream").Readable;
          function n(e2, t2, r2) {
            i.call(this, t2), this._helper = e2;
            var n2 = this;
            e2.on("data", function(e3, t3) {
              n2.push(e3) || n2._helper.pause(), r2 && r2(t3);
            }).on("error", function(e3) {
              n2.emit("error", e3);
            }).on("end", function() {
              n2.push(null);
            });
          }
          e("../utils").inherits(n, i), n.prototype._read = function() {
            this._helper.resume();
          }, t.exports = n;
        }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e, t, r) {
          "use strict";
          t.exports = { isNode: "undefined" != typeof Buffer, newBufferFrom: function(e2, t2) {
            if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(e2, t2);
            if ("number" == typeof e2) throw new Error('The "data" argument must not be a number');
            return new Buffer(e2, t2);
          }, allocBuffer: function(e2) {
            if (Buffer.alloc) return Buffer.alloc(e2);
            var t2 = new Buffer(e2);
            return t2.fill(0), t2;
          }, isBuffer: function(e2) {
            return Buffer.isBuffer(e2);
          }, isStream: function(e2) {
            return e2 && "function" == typeof e2.on && "function" == typeof e2.pause && "function" == typeof e2.resume;
          } };
        }, {}], 15: [function(e, t, r) {
          "use strict";
          function s(e2, t2, r2) {
            var n2, i2 = u.getTypeOf(t2), s2 = u.extend(r2 || {}, f);
            s2.date = s2.date || /* @__PURE__ */ new Date(), null !== s2.compression && (s2.compression = s2.compression.toUpperCase()), "string" == typeof s2.unixPermissions && (s2.unixPermissions = parseInt(s2.unixPermissions, 8)), s2.unixPermissions && 16384 & s2.unixPermissions && (s2.dir = true), s2.dosPermissions && 16 & s2.dosPermissions && (s2.dir = true), s2.dir && (e2 = g(e2)), s2.createFolders && (n2 = _(e2)) && b.call(this, n2, true);
            var a2 = "string" === i2 && false === s2.binary && false === s2.base64;
            r2 && void 0 !== r2.binary || (s2.binary = !a2), (t2 instanceof c && 0 === t2.uncompressedSize || s2.dir || !t2 || 0 === t2.length) && (s2.base64 = false, s2.binary = true, t2 = "", s2.compression = "STORE", i2 = "string");
            var o2 = null;
            o2 = t2 instanceof c || t2 instanceof l ? t2 : p.isNode && p.isStream(t2) ? new m(e2, t2) : u.prepareContent(e2, t2, s2.binary, s2.optimizedBinaryString, s2.base64);
            var h2 = new d(e2, o2, s2);
            this.files[e2] = h2;
          }
          var i = e("./utf8"), u = e("./utils"), l = e("./stream/GenericWorker"), a = e("./stream/StreamHelper"), f = e("./defaults"), c = e("./compressedObject"), d = e("./zipObject"), o = e("./generate"), p = e("./nodejsUtils"), m = e("./nodejs/NodejsStreamInputAdapter"), _ = function(e2) {
            "/" === e2.slice(-1) && (e2 = e2.substring(0, e2.length - 1));
            var t2 = e2.lastIndexOf("/");
            return 0 < t2 ? e2.substring(0, t2) : "";
          }, g = function(e2) {
            return "/" !== e2.slice(-1) && (e2 += "/"), e2;
          }, b = function(e2, t2) {
            return t2 = void 0 !== t2 ? t2 : f.createFolders, e2 = g(e2), this.files[e2] || s.call(this, e2, null, { dir: true, createFolders: t2 }), this.files[e2];
          };
          function h(e2) {
            return "[object RegExp]" === Object.prototype.toString.call(e2);
          }
          var n = { load: function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
          }, forEach: function(e2) {
            var t2, r2, n2;
            for (t2 in this.files) n2 = this.files[t2], (r2 = t2.slice(this.root.length, t2.length)) && t2.slice(0, this.root.length) === this.root && e2(r2, n2);
          }, filter: function(r2) {
            var n2 = [];
            return this.forEach(function(e2, t2) {
              r2(e2, t2) && n2.push(t2);
            }), n2;
          }, file: function(e2, t2, r2) {
            if (1 !== arguments.length) return e2 = this.root + e2, s.call(this, e2, t2, r2), this;
            if (h(e2)) {
              var n2 = e2;
              return this.filter(function(e3, t3) {
                return !t3.dir && n2.test(e3);
              });
            }
            var i2 = this.files[this.root + e2];
            return i2 && !i2.dir ? i2 : null;
          }, folder: function(r2) {
            if (!r2) return this;
            if (h(r2)) return this.filter(function(e3, t3) {
              return t3.dir && r2.test(e3);
            });
            var e2 = this.root + r2, t2 = b.call(this, e2), n2 = this.clone();
            return n2.root = t2.name, n2;
          }, remove: function(r2) {
            r2 = this.root + r2;
            var e2 = this.files[r2];
            if (e2 || ("/" !== r2.slice(-1) && (r2 += "/"), e2 = this.files[r2]), e2 && !e2.dir) delete this.files[r2];
            else for (var t2 = this.filter(function(e3, t3) {
              return t3.name.slice(0, r2.length) === r2;
            }), n2 = 0; n2 < t2.length; n2++) delete this.files[t2[n2].name];
            return this;
          }, generate: function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
          }, generateInternalStream: function(e2) {
            var t2, r2 = {};
            try {
              if ((r2 = u.extend(e2 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i.utf8encode })).type = r2.type.toLowerCase(), r2.compression = r2.compression.toUpperCase(), "binarystring" === r2.type && (r2.type = "string"), !r2.type) throw new Error("No output type specified.");
              u.checkSupport(r2.type), "darwin" !== r2.platform && "freebsd" !== r2.platform && "linux" !== r2.platform && "sunos" !== r2.platform || (r2.platform = "UNIX"), "win32" === r2.platform && (r2.platform = "DOS");
              var n2 = r2.comment || this.comment || "";
              t2 = o.generateWorker(this, r2, n2);
            } catch (e3) {
              (t2 = new l("error")).error(e3);
            }
            return new a(t2, r2.type || "string", r2.mimeType);
          }, generateAsync: function(e2, t2) {
            return this.generateInternalStream(e2).accumulate(t2);
          }, generateNodeStream: function(e2, t2) {
            return (e2 = e2 || {}).type || (e2.type = "nodebuffer"), this.generateInternalStream(e2).toNodejsStream(t2);
          } };
          t.exports = n;
        }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e, t, r) {
          "use strict";
          t.exports = e("stream");
        }, { stream: void 0 }], 17: [function(e, t, r) {
          "use strict";
          var n = e("./DataReader");
          function i(e2) {
            n.call(this, e2);
            for (var t2 = 0; t2 < this.data.length; t2++) e2[t2] = 255 & e2[t2];
          }
          e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
            return this.data[this.zero + e2];
          }, i.prototype.lastIndexOfSignature = function(e2) {
            for (var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.length - 4; 0 <= s; --s) if (this.data[s] === t2 && this.data[s + 1] === r2 && this.data[s + 2] === n2 && this.data[s + 3] === i2) return s - this.zero;
            return -1;
          }, i.prototype.readAndCheckSignature = function(e2) {
            var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.readData(4);
            return t2 === s[0] && r2 === s[1] && n2 === s[2] && i2 === s[3];
          }, i.prototype.readData = function(e2) {
            if (this.checkOffset(e2), 0 === e2) return [];
            var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
            return this.index += e2, t2;
          }, t.exports = i;
        }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e, t, r) {
          "use strict";
          var n = e("../utils");
          function i(e2) {
            this.data = e2, this.length = e2.length, this.index = 0, this.zero = 0;
          }
          i.prototype = { checkOffset: function(e2) {
            this.checkIndex(this.index + e2);
          }, checkIndex: function(e2) {
            if (this.length < this.zero + e2 || e2 < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e2 + "). Corrupted zip ?");
          }, setIndex: function(e2) {
            this.checkIndex(e2), this.index = e2;
          }, skip: function(e2) {
            this.setIndex(this.index + e2);
          }, byteAt: function() {
          }, readInt: function(e2) {
            var t2, r2 = 0;
            for (this.checkOffset(e2), t2 = this.index + e2 - 1; t2 >= this.index; t2--) r2 = (r2 << 8) + this.byteAt(t2);
            return this.index += e2, r2;
          }, readString: function(e2) {
            return n.transformTo("string", this.readData(e2));
          }, readData: function() {
          }, lastIndexOfSignature: function() {
          }, readAndCheckSignature: function() {
          }, readDate: function() {
            var e2 = this.readInt(4);
            return new Date(Date.UTC(1980 + (e2 >> 25 & 127), (e2 >> 21 & 15) - 1, e2 >> 16 & 31, e2 >> 11 & 31, e2 >> 5 & 63, (31 & e2) << 1));
          } }, t.exports = i;
        }, { "../utils": 32 }], 19: [function(e, t, r) {
          "use strict";
          var n = e("./Uint8ArrayReader");
          function i(e2) {
            n.call(this, e2);
          }
          e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
            this.checkOffset(e2);
            var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
            return this.index += e2, t2;
          }, t.exports = i;
        }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e, t, r) {
          "use strict";
          var n = e("./DataReader");
          function i(e2) {
            n.call(this, e2);
          }
          e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
            return this.data.charCodeAt(this.zero + e2);
          }, i.prototype.lastIndexOfSignature = function(e2) {
            return this.data.lastIndexOf(e2) - this.zero;
          }, i.prototype.readAndCheckSignature = function(e2) {
            return e2 === this.readData(4);
          }, i.prototype.readData = function(e2) {
            this.checkOffset(e2);
            var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
            return this.index += e2, t2;
          }, t.exports = i;
        }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e, t, r) {
          "use strict";
          var n = e("./ArrayReader");
          function i(e2) {
            n.call(this, e2);
          }
          e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
            if (this.checkOffset(e2), 0 === e2) return new Uint8Array(0);
            var t2 = this.data.subarray(this.zero + this.index, this.zero + this.index + e2);
            return this.index += e2, t2;
          }, t.exports = i;
        }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e, t, r) {
          "use strict";
          var n = e("../utils"), i = e("../support"), s = e("./ArrayReader"), a = e("./StringReader"), o = e("./NodeBufferReader"), h = e("./Uint8ArrayReader");
          t.exports = function(e2) {
            var t2 = n.getTypeOf(e2);
            return n.checkSupport(t2), "string" !== t2 || i.uint8array ? "nodebuffer" === t2 ? new o(e2) : i.uint8array ? new h(n.transformTo("uint8array", e2)) : new s(n.transformTo("array", e2)) : new a(e2);
          };
        }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e, t, r) {
          "use strict";
          r.LOCAL_FILE_HEADER = "PK", r.CENTRAL_FILE_HEADER = "PK", r.CENTRAL_DIRECTORY_END = "PK", r.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r.ZIP64_CENTRAL_DIRECTORY_END = "PK", r.DATA_DESCRIPTOR = "PK\x07\b";
        }, {}], 24: [function(e, t, r) {
          "use strict";
          var n = e("./GenericWorker"), i = e("../utils");
          function s(e2) {
            n.call(this, "ConvertWorker to " + e2), this.destType = e2;
          }
          i.inherits(s, n), s.prototype.processChunk = function(e2) {
            this.push({ data: i.transformTo(this.destType, e2.data), meta: e2.meta });
          }, t.exports = s;
        }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e, t, r) {
          "use strict";
          var n = e("./GenericWorker"), i = e("../crc32");
          function s() {
            n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
          }
          e("../utils").inherits(s, n), s.prototype.processChunk = function(e2) {
            this.streamInfo.crc32 = i(e2.data, this.streamInfo.crc32 || 0), this.push(e2);
          }, t.exports = s;
        }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e, t, r) {
          "use strict";
          var n = e("../utils"), i = e("./GenericWorker");
          function s(e2) {
            i.call(this, "DataLengthProbe for " + e2), this.propName = e2, this.withStreamInfo(e2, 0);
          }
          n.inherits(s, i), s.prototype.processChunk = function(e2) {
            if (e2) {
              var t2 = this.streamInfo[this.propName] || 0;
              this.streamInfo[this.propName] = t2 + e2.data.length;
            }
            i.prototype.processChunk.call(this, e2);
          }, t.exports = s;
        }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e, t, r) {
          "use strict";
          var n = e("../utils"), i = e("./GenericWorker");
          function s(e2) {
            i.call(this, "DataWorker");
            var t2 = this;
            this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, e2.then(function(e3) {
              t2.dataIsReady = true, t2.data = e3, t2.max = e3 && e3.length || 0, t2.type = n.getTypeOf(e3), t2.isPaused || t2._tickAndRepeat();
            }, function(e3) {
              t2.error(e3);
            });
          }
          n.inherits(s, i), s.prototype.cleanUp = function() {
            i.prototype.cleanUp.call(this), this.data = null;
          }, s.prototype.resume = function() {
            return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, n.delay(this._tickAndRepeat, [], this)), true);
          }, s.prototype._tickAndRepeat = function() {
            this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
          }, s.prototype._tick = function() {
            if (this.isPaused || this.isFinished) return false;
            var e2 = null, t2 = Math.min(this.max, this.index + 16384);
            if (this.index >= this.max) return this.end();
            switch (this.type) {
              case "string":
                e2 = this.data.substring(this.index, t2);
                break;
              case "uint8array":
                e2 = this.data.subarray(this.index, t2);
                break;
              case "array":
              case "nodebuffer":
                e2 = this.data.slice(this.index, t2);
            }
            return this.index = t2, this.push({ data: e2, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
          }, t.exports = s;
        }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e, t, r) {
          "use strict";
          function n(e2) {
            this.name = e2 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
          }
          n.prototype = { push: function(e2) {
            this.emit("data", e2);
          }, end: function() {
            if (this.isFinished) return false;
            this.flush();
            try {
              this.emit("end"), this.cleanUp(), this.isFinished = true;
            } catch (e2) {
              this.emit("error", e2);
            }
            return true;
          }, error: function(e2) {
            return !this.isFinished && (this.isPaused ? this.generatedError = e2 : (this.isFinished = true, this.emit("error", e2), this.previous && this.previous.error(e2), this.cleanUp()), true);
          }, on: function(e2, t2) {
            return this._listeners[e2].push(t2), this;
          }, cleanUp: function() {
            this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
          }, emit: function(e2, t2) {
            if (this._listeners[e2]) for (var r2 = 0; r2 < this._listeners[e2].length; r2++) this._listeners[e2][r2].call(this, t2);
          }, pipe: function(e2) {
            return e2.registerPrevious(this);
          }, registerPrevious: function(e2) {
            if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
            this.streamInfo = e2.streamInfo, this.mergeStreamInfo(), this.previous = e2;
            var t2 = this;
            return e2.on("data", function(e3) {
              t2.processChunk(e3);
            }), e2.on("end", function() {
              t2.end();
            }), e2.on("error", function(e3) {
              t2.error(e3);
            }), this;
          }, pause: function() {
            return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
          }, resume: function() {
            if (!this.isPaused || this.isFinished) return false;
            var e2 = this.isPaused = false;
            return this.generatedError && (this.error(this.generatedError), e2 = true), this.previous && this.previous.resume(), !e2;
          }, flush: function() {
          }, processChunk: function(e2) {
            this.push(e2);
          }, withStreamInfo: function(e2, t2) {
            return this.extraStreamInfo[e2] = t2, this.mergeStreamInfo(), this;
          }, mergeStreamInfo: function() {
            for (var e2 in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, e2) && (this.streamInfo[e2] = this.extraStreamInfo[e2]);
          }, lock: function() {
            if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
            this.isLocked = true, this.previous && this.previous.lock();
          }, toString: function() {
            var e2 = "Worker " + this.name;
            return this.previous ? this.previous + " -> " + e2 : e2;
          } }, t.exports = n;
        }, {}], 29: [function(e, t, r) {
          "use strict";
          var h = e("../utils"), i = e("./ConvertWorker"), s = e("./GenericWorker"), u = e("../base64"), n = e("../support"), a = e("../external"), o = null;
          if (n.nodestream) try {
            o = e("../nodejs/NodejsStreamOutputAdapter");
          } catch (e2) {
          }
          function l(e2, o2) {
            return new a.Promise(function(t2, r2) {
              var n2 = [], i2 = e2._internalType, s2 = e2._outputType, a2 = e2._mimeType;
              e2.on("data", function(e3, t3) {
                n2.push(e3), o2 && o2(t3);
              }).on("error", function(e3) {
                n2 = [], r2(e3);
              }).on("end", function() {
                try {
                  var e3 = (function(e4, t3, r3) {
                    switch (e4) {
                      case "blob":
                        return h.newBlob(h.transformTo("arraybuffer", t3), r3);
                      case "base64":
                        return u.encode(t3);
                      default:
                        return h.transformTo(e4, t3);
                    }
                  })(s2, (function(e4, t3) {
                    var r3, n3 = 0, i3 = null, s3 = 0;
                    for (r3 = 0; r3 < t3.length; r3++) s3 += t3[r3].length;
                    switch (e4) {
                      case "string":
                        return t3.join("");
                      case "array":
                        return Array.prototype.concat.apply([], t3);
                      case "uint8array":
                        for (i3 = new Uint8Array(s3), r3 = 0; r3 < t3.length; r3++) i3.set(t3[r3], n3), n3 += t3[r3].length;
                        return i3;
                      case "nodebuffer":
                        return Buffer.concat(t3);
                      default:
                        throw new Error("concat : unsupported type '" + e4 + "'");
                    }
                  })(i2, n2), a2);
                  t2(e3);
                } catch (e4) {
                  r2(e4);
                }
                n2 = [];
              }).resume();
            });
          }
          function f(e2, t2, r2) {
            var n2 = t2;
            switch (t2) {
              case "blob":
              case "arraybuffer":
                n2 = "uint8array";
                break;
              case "base64":
                n2 = "string";
            }
            try {
              this._internalType = n2, this._outputType = t2, this._mimeType = r2, h.checkSupport(n2), this._worker = e2.pipe(new i(n2)), e2.lock();
            } catch (e3) {
              this._worker = new s("error"), this._worker.error(e3);
            }
          }
          f.prototype = { accumulate: function(e2) {
            return l(this, e2);
          }, on: function(e2, t2) {
            var r2 = this;
            return "data" === e2 ? this._worker.on(e2, function(e3) {
              t2.call(r2, e3.data, e3.meta);
            }) : this._worker.on(e2, function() {
              h.delay(t2, arguments, r2);
            }), this;
          }, resume: function() {
            return h.delay(this._worker.resume, [], this._worker), this;
          }, pause: function() {
            return this._worker.pause(), this;
          }, toNodejsStream: function(e2) {
            if (h.checkSupport("nodestream"), "nodebuffer" !== this._outputType) throw new Error(this._outputType + " is not supported by this method");
            return new o(this, { objectMode: "nodebuffer" !== this._outputType }, e2);
          } }, t.exports = f;
        }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e, t, r) {
          "use strict";
          if (r.base64 = true, r.array = true, r.string = true, r.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, r.nodebuffer = "undefined" != typeof Buffer, r.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) r.blob = false;
          else {
            var n = new ArrayBuffer(0);
            try {
              r.blob = 0 === new Blob([n], { type: "application/zip" }).size;
            } catch (e2) {
              try {
                var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
                i.append(n), r.blob = 0 === i.getBlob("application/zip").size;
              } catch (e3) {
                r.blob = false;
              }
            }
          }
          try {
            r.nodestream = !!e("readable-stream").Readable;
          } catch (e2) {
            r.nodestream = false;
          }
        }, { "readable-stream": 16 }], 31: [function(e, t, s) {
          "use strict";
          for (var o = e("./utils"), h = e("./support"), r = e("./nodejsUtils"), n = e("./stream/GenericWorker"), u = new Array(256), i = 0; i < 256; i++) u[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
          u[254] = u[254] = 1;
          function a() {
            n.call(this, "utf-8 decode"), this.leftOver = null;
          }
          function l() {
            n.call(this, "utf-8 encode");
          }
          s.utf8encode = function(e2) {
            return h.nodebuffer ? r.newBufferFrom(e2, "utf-8") : (function(e3) {
              var t2, r2, n2, i2, s2, a2 = e3.length, o2 = 0;
              for (i2 = 0; i2 < a2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o2 += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
              for (t2 = h.uint8array ? new Uint8Array(o2) : new Array(o2), i2 = s2 = 0; s2 < o2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
              return t2;
            })(e2);
          }, s.utf8decode = function(e2) {
            return h.nodebuffer ? o.transformTo("nodebuffer", e2).toString("utf-8") : (function(e3) {
              var t2, r2, n2, i2, s2 = e3.length, a2 = new Array(2 * s2);
              for (t2 = r2 = 0; t2 < s2; ) if ((n2 = e3[t2++]) < 128) a2[r2++] = n2;
              else if (4 < (i2 = u[n2])) a2[r2++] = 65533, t2 += i2 - 1;
              else {
                for (n2 &= 2 === i2 ? 31 : 3 === i2 ? 15 : 7; 1 < i2 && t2 < s2; ) n2 = n2 << 6 | 63 & e3[t2++], i2--;
                1 < i2 ? a2[r2++] = 65533 : n2 < 65536 ? a2[r2++] = n2 : (n2 -= 65536, a2[r2++] = 55296 | n2 >> 10 & 1023, a2[r2++] = 56320 | 1023 & n2);
              }
              return a2.length !== r2 && (a2.subarray ? a2 = a2.subarray(0, r2) : a2.length = r2), o.applyFromCharCode(a2);
            })(e2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2));
          }, o.inherits(a, n), a.prototype.processChunk = function(e2) {
            var t2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2.data);
            if (this.leftOver && this.leftOver.length) {
              if (h.uint8array) {
                var r2 = t2;
                (t2 = new Uint8Array(r2.length + this.leftOver.length)).set(this.leftOver, 0), t2.set(r2, this.leftOver.length);
              } else t2 = this.leftOver.concat(t2);
              this.leftOver = null;
            }
            var n2 = (function(e3, t3) {
              var r3;
              for ((t3 = t3 || e3.length) > e3.length && (t3 = e3.length), r3 = t3 - 1; 0 <= r3 && 128 == (192 & e3[r3]); ) r3--;
              return r3 < 0 ? t3 : 0 === r3 ? t3 : r3 + u[e3[r3]] > t3 ? r3 : t3;
            })(t2), i2 = t2;
            n2 !== t2.length && (h.uint8array ? (i2 = t2.subarray(0, n2), this.leftOver = t2.subarray(n2, t2.length)) : (i2 = t2.slice(0, n2), this.leftOver = t2.slice(n2, t2.length))), this.push({ data: s.utf8decode(i2), meta: e2.meta });
          }, a.prototype.flush = function() {
            this.leftOver && this.leftOver.length && (this.push({ data: s.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
          }, s.Utf8DecodeWorker = a, o.inherits(l, n), l.prototype.processChunk = function(e2) {
            this.push({ data: s.utf8encode(e2.data), meta: e2.meta });
          }, s.Utf8EncodeWorker = l;
        }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e, t, a) {
          "use strict";
          var o = e("./support"), h = e("./base64"), r = e("./nodejsUtils"), u = e("./external");
          function n(e2) {
            return e2;
          }
          function l(e2, t2) {
            for (var r2 = 0; r2 < e2.length; ++r2) t2[r2] = 255 & e2.charCodeAt(r2);
            return t2;
          }
          e("setimmediate"), a.newBlob = function(t2, r2) {
            a.checkSupport("blob");
            try {
              return new Blob([t2], { type: r2 });
            } catch (e2) {
              try {
                var n2 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
                return n2.append(t2), n2.getBlob(r2);
              } catch (e3) {
                throw new Error("Bug : can't construct the Blob.");
              }
            }
          };
          var i = { stringifyByChunk: function(e2, t2, r2) {
            var n2 = [], i2 = 0, s2 = e2.length;
            if (s2 <= r2) return String.fromCharCode.apply(null, e2);
            for (; i2 < s2; ) "array" === t2 || "nodebuffer" === t2 ? n2.push(String.fromCharCode.apply(null, e2.slice(i2, Math.min(i2 + r2, s2)))) : n2.push(String.fromCharCode.apply(null, e2.subarray(i2, Math.min(i2 + r2, s2)))), i2 += r2;
            return n2.join("");
          }, stringifyByChar: function(e2) {
            for (var t2 = "", r2 = 0; r2 < e2.length; r2++) t2 += String.fromCharCode(e2[r2]);
            return t2;
          }, applyCanBeUsed: { uint8array: (function() {
            try {
              return o.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length;
            } catch (e2) {
              return false;
            }
          })(), nodebuffer: (function() {
            try {
              return o.nodebuffer && 1 === String.fromCharCode.apply(null, r.allocBuffer(1)).length;
            } catch (e2) {
              return false;
            }
          })() } };
          function s(e2) {
            var t2 = 65536, r2 = a.getTypeOf(e2), n2 = true;
            if ("uint8array" === r2 ? n2 = i.applyCanBeUsed.uint8array : "nodebuffer" === r2 && (n2 = i.applyCanBeUsed.nodebuffer), n2) for (; 1 < t2; ) try {
              return i.stringifyByChunk(e2, r2, t2);
            } catch (e3) {
              t2 = Math.floor(t2 / 2);
            }
            return i.stringifyByChar(e2);
          }
          function f(e2, t2) {
            for (var r2 = 0; r2 < e2.length; r2++) t2[r2] = e2[r2];
            return t2;
          }
          a.applyFromCharCode = s;
          var c = {};
          c.string = { string: n, array: function(e2) {
            return l(e2, new Array(e2.length));
          }, arraybuffer: function(e2) {
            return c.string.uint8array(e2).buffer;
          }, uint8array: function(e2) {
            return l(e2, new Uint8Array(e2.length));
          }, nodebuffer: function(e2) {
            return l(e2, r.allocBuffer(e2.length));
          } }, c.array = { string: s, array: n, arraybuffer: function(e2) {
            return new Uint8Array(e2).buffer;
          }, uint8array: function(e2) {
            return new Uint8Array(e2);
          }, nodebuffer: function(e2) {
            return r.newBufferFrom(e2);
          } }, c.arraybuffer = { string: function(e2) {
            return s(new Uint8Array(e2));
          }, array: function(e2) {
            return f(new Uint8Array(e2), new Array(e2.byteLength));
          }, arraybuffer: n, uint8array: function(e2) {
            return new Uint8Array(e2);
          }, nodebuffer: function(e2) {
            return r.newBufferFrom(new Uint8Array(e2));
          } }, c.uint8array = { string: s, array: function(e2) {
            return f(e2, new Array(e2.length));
          }, arraybuffer: function(e2) {
            return e2.buffer;
          }, uint8array: n, nodebuffer: function(e2) {
            return r.newBufferFrom(e2);
          } }, c.nodebuffer = { string: s, array: function(e2) {
            return f(e2, new Array(e2.length));
          }, arraybuffer: function(e2) {
            return c.nodebuffer.uint8array(e2).buffer;
          }, uint8array: function(e2) {
            return f(e2, new Uint8Array(e2.length));
          }, nodebuffer: n }, a.transformTo = function(e2, t2) {
            if (t2 = t2 || "", !e2) return t2;
            a.checkSupport(e2);
            var r2 = a.getTypeOf(t2);
            return c[r2][e2](t2);
          }, a.resolve = function(e2) {
            for (var t2 = e2.split("/"), r2 = [], n2 = 0; n2 < t2.length; n2++) {
              var i2 = t2[n2];
              "." === i2 || "" === i2 && 0 !== n2 && n2 !== t2.length - 1 || (".." === i2 ? r2.pop() : r2.push(i2));
            }
            return r2.join("/");
          }, a.getTypeOf = function(e2) {
            return "string" == typeof e2 ? "string" : "[object Array]" === Object.prototype.toString.call(e2) ? "array" : o.nodebuffer && r.isBuffer(e2) ? "nodebuffer" : o.uint8array && e2 instanceof Uint8Array ? "uint8array" : o.arraybuffer && e2 instanceof ArrayBuffer ? "arraybuffer" : void 0;
          }, a.checkSupport = function(e2) {
            if (!o[e2.toLowerCase()]) throw new Error(e2 + " is not supported by this platform");
          }, a.MAX_VALUE_16BITS = 65535, a.MAX_VALUE_32BITS = -1, a.pretty = function(e2) {
            var t2, r2, n2 = "";
            for (r2 = 0; r2 < (e2 || "").length; r2++) n2 += "\\x" + ((t2 = e2.charCodeAt(r2)) < 16 ? "0" : "") + t2.toString(16).toUpperCase();
            return n2;
          }, a.delay = function(e2, t2, r2) {
            setImmediate(function() {
              e2.apply(r2 || null, t2 || []);
            });
          }, a.inherits = function(e2, t2) {
            function r2() {
            }
            r2.prototype = t2.prototype, e2.prototype = new r2();
          }, a.extend = function() {
            var e2, t2, r2 = {};
            for (e2 = 0; e2 < arguments.length; e2++) for (t2 in arguments[e2]) Object.prototype.hasOwnProperty.call(arguments[e2], t2) && void 0 === r2[t2] && (r2[t2] = arguments[e2][t2]);
            return r2;
          }, a.prepareContent = function(r2, e2, n2, i2, s2) {
            return u.Promise.resolve(e2).then(function(n3) {
              return o.blob && (n3 instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(n3))) && "undefined" != typeof FileReader ? new u.Promise(function(t2, r3) {
                var e3 = new FileReader();
                e3.onload = function(e4) {
                  t2(e4.target.result);
                }, e3.onerror = function(e4) {
                  r3(e4.target.error);
                }, e3.readAsArrayBuffer(n3);
              }) : n3;
            }).then(function(e3) {
              var t2 = a.getTypeOf(e3);
              return t2 ? ("arraybuffer" === t2 ? e3 = a.transformTo("uint8array", e3) : "string" === t2 && (s2 ? e3 = h.decode(e3) : n2 && true !== i2 && (e3 = (function(e4) {
                return l(e4, o.uint8array ? new Uint8Array(e4.length) : new Array(e4.length));
              })(e3))), e3) : u.Promise.reject(new Error("Can't read the data of '" + r2 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
            });
          };
        }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e, t, r) {
          "use strict";
          var n = e("./reader/readerFor"), i = e("./utils"), s = e("./signature"), a = e("./zipEntry"), o = e("./support");
          function h(e2) {
            this.files = [], this.loadOptions = e2;
          }
          h.prototype = { checkSignature: function(e2) {
            if (!this.reader.readAndCheckSignature(e2)) {
              this.reader.index -= 4;
              var t2 = this.reader.readString(4);
              throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(t2) + ", expected " + i.pretty(e2) + ")");
            }
          }, isSignature: function(e2, t2) {
            var r2 = this.reader.index;
            this.reader.setIndex(e2);
            var n2 = this.reader.readString(4) === t2;
            return this.reader.setIndex(r2), n2;
          }, readBlockEndOfCentral: function() {
            this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
            var e2 = this.reader.readData(this.zipCommentLength), t2 = o.uint8array ? "uint8array" : "array", r2 = i.transformTo(t2, e2);
            this.zipComment = this.loadOptions.decodeFileName(r2);
          }, readBlockZip64EndOfCentral: function() {
            this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
            for (var e2, t2, r2, n2 = this.zip64EndOfCentralSize - 44; 0 < n2; ) e2 = this.reader.readInt(2), t2 = this.reader.readInt(4), r2 = this.reader.readData(t2), this.zip64ExtensibleData[e2] = { id: e2, length: t2, value: r2 };
          }, readBlockZip64EndOfCentralLocator: function() {
            if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
          }, readLocalFiles: function() {
            var e2, t2;
            for (e2 = 0; e2 < this.files.length; e2++) t2 = this.files[e2], this.reader.setIndex(t2.localHeaderOffset), this.checkSignature(s.LOCAL_FILE_HEADER), t2.readLocalPart(this.reader), t2.handleUTF8(), t2.processAttributes();
          }, readCentralDir: function() {
            var e2;
            for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER); ) (e2 = new a({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e2);
            if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
          }, readEndOfCentral: function() {
            var e2 = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
            if (e2 < 0) throw !this.isSignature(0, s.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
            this.reader.setIndex(e2);
            var t2 = e2;
            if (this.checkSignature(s.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
              if (this.zip64 = true, (e2 = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
              if (this.reader.setIndex(e2), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
              this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
            }
            var r2 = this.centralDirOffset + this.centralDirSize;
            this.zip64 && (r2 += 20, r2 += 12 + this.zip64EndOfCentralSize);
            var n2 = t2 - r2;
            if (0 < n2) this.isSignature(t2, s.CENTRAL_FILE_HEADER) || (this.reader.zero = n2);
            else if (n2 < 0) throw new Error("Corrupted zip: missing " + Math.abs(n2) + " bytes.");
          }, prepareReader: function(e2) {
            this.reader = n(e2);
          }, load: function(e2) {
            this.prepareReader(e2), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
          } }, t.exports = h;
        }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(e, t, r) {
          "use strict";
          var n = e("./reader/readerFor"), s = e("./utils"), i = e("./compressedObject"), a = e("./crc32"), o = e("./utf8"), h = e("./compressions"), u = e("./support");
          function l(e2, t2) {
            this.options = e2, this.loadOptions = t2;
          }
          l.prototype = { isEncrypted: function() {
            return 1 == (1 & this.bitFlag);
          }, useUTF8: function() {
            return 2048 == (2048 & this.bitFlag);
          }, readLocalPart: function(e2) {
            var t2, r2;
            if (e2.skip(22), this.fileNameLength = e2.readInt(2), r2 = e2.readInt(2), this.fileName = e2.readData(this.fileNameLength), e2.skip(r2), -1 === this.compressedSize || -1 === this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
            if (null === (t2 = (function(e3) {
              for (var t3 in h) if (Object.prototype.hasOwnProperty.call(h, t3) && h[t3].magic === e3) return h[t3];
              return null;
            })(this.compressionMethod))) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
            this.decompressed = new i(this.compressedSize, this.uncompressedSize, this.crc32, t2, e2.readData(this.compressedSize));
          }, readCentralPart: function(e2) {
            this.versionMadeBy = e2.readInt(2), e2.skip(2), this.bitFlag = e2.readInt(2), this.compressionMethod = e2.readString(2), this.date = e2.readDate(), this.crc32 = e2.readInt(4), this.compressedSize = e2.readInt(4), this.uncompressedSize = e2.readInt(4);
            var t2 = e2.readInt(2);
            if (this.extraFieldsLength = e2.readInt(2), this.fileCommentLength = e2.readInt(2), this.diskNumberStart = e2.readInt(2), this.internalFileAttributes = e2.readInt(2), this.externalFileAttributes = e2.readInt(4), this.localHeaderOffset = e2.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
            e2.skip(t2), this.readExtraFields(e2), this.parseZIP64ExtraField(e2), this.fileComment = e2.readData(this.fileCommentLength);
          }, processAttributes: function() {
            this.unixPermissions = null, this.dosPermissions = null;
            var e2 = this.versionMadeBy >> 8;
            this.dir = !!(16 & this.externalFileAttributes), 0 == e2 && (this.dosPermissions = 63 & this.externalFileAttributes), 3 == e2 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = true);
          }, parseZIP64ExtraField: function() {
            if (this.extraFields[1]) {
              var e2 = n(this.extraFields[1].value);
              this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = e2.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = e2.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = e2.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = e2.readInt(4));
            }
          }, readExtraFields: function(e2) {
            var t2, r2, n2, i2 = e2.index + this.extraFieldsLength;
            for (this.extraFields || (this.extraFields = {}); e2.index + 4 < i2; ) t2 = e2.readInt(2), r2 = e2.readInt(2), n2 = e2.readData(r2), this.extraFields[t2] = { id: t2, length: r2, value: n2 };
            e2.setIndex(i2);
          }, handleUTF8: function() {
            var e2 = u.uint8array ? "uint8array" : "array";
            if (this.useUTF8()) this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
            else {
              var t2 = this.findExtraFieldUnicodePath();
              if (null !== t2) this.fileNameStr = t2;
              else {
                var r2 = s.transformTo(e2, this.fileName);
                this.fileNameStr = this.loadOptions.decodeFileName(r2);
              }
              var n2 = this.findExtraFieldUnicodeComment();
              if (null !== n2) this.fileCommentStr = n2;
              else {
                var i2 = s.transformTo(e2, this.fileComment);
                this.fileCommentStr = this.loadOptions.decodeFileName(i2);
              }
            }
          }, findExtraFieldUnicodePath: function() {
            var e2 = this.extraFields[28789];
            if (e2) {
              var t2 = n(e2.value);
              return 1 !== t2.readInt(1) ? null : a(this.fileName) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
            }
            return null;
          }, findExtraFieldUnicodeComment: function() {
            var e2 = this.extraFields[25461];
            if (e2) {
              var t2 = n(e2.value);
              return 1 !== t2.readInt(1) ? null : a(this.fileComment) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
            }
            return null;
          } }, t.exports = l;
        }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e, t, r) {
          "use strict";
          function n(e2, t2, r2) {
            this.name = e2, this.dir = r2.dir, this.date = r2.date, this.comment = r2.comment, this.unixPermissions = r2.unixPermissions, this.dosPermissions = r2.dosPermissions, this._data = t2, this._dataBinary = r2.binary, this.options = { compression: r2.compression, compressionOptions: r2.compressionOptions };
          }
          var s = e("./stream/StreamHelper"), i = e("./stream/DataWorker"), a = e("./utf8"), o = e("./compressedObject"), h = e("./stream/GenericWorker");
          n.prototype = { internalStream: function(e2) {
            var t2 = null, r2 = "string";
            try {
              if (!e2) throw new Error("No output type specified.");
              var n2 = "string" === (r2 = e2.toLowerCase()) || "text" === r2;
              "binarystring" !== r2 && "text" !== r2 || (r2 = "string"), t2 = this._decompressWorker();
              var i2 = !this._dataBinary;
              i2 && !n2 && (t2 = t2.pipe(new a.Utf8EncodeWorker())), !i2 && n2 && (t2 = t2.pipe(new a.Utf8DecodeWorker()));
            } catch (e3) {
              (t2 = new h("error")).error(e3);
            }
            return new s(t2, r2, "");
          }, async: function(e2, t2) {
            return this.internalStream(e2).accumulate(t2);
          }, nodeStream: function(e2, t2) {
            return this.internalStream(e2 || "nodebuffer").toNodejsStream(t2);
          }, _compressWorker: function(e2, t2) {
            if (this._data instanceof o && this._data.compression.magic === e2.magic) return this._data.getCompressedWorker();
            var r2 = this._decompressWorker();
            return this._dataBinary || (r2 = r2.pipe(new a.Utf8EncodeWorker())), o.createWorkerFrom(r2, e2, t2);
          }, _decompressWorker: function() {
            return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof h ? this._data : new i(this._data);
          } };
          for (var u = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l = function() {
            throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
          }, f = 0; f < u.length; f++) n.prototype[u[f]] = l;
          t.exports = n;
        }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e, l, t) {
          (function(t2) {
            "use strict";
            var r, n, e2 = t2.MutationObserver || t2.WebKitMutationObserver;
            if (e2) {
              var i = 0, s = new e2(u), a = t2.document.createTextNode("");
              s.observe(a, { characterData: true }), r = function() {
                a.data = i = ++i % 2;
              };
            } else if (t2.setImmediate || void 0 === t2.MessageChannel) r = "document" in t2 && "onreadystatechange" in t2.document.createElement("script") ? function() {
              var e3 = t2.document.createElement("script");
              e3.onreadystatechange = function() {
                u(), e3.onreadystatechange = null, e3.parentNode.removeChild(e3), e3 = null;
              }, t2.document.documentElement.appendChild(e3);
            } : function() {
              setTimeout(u, 0);
            };
            else {
              var o = new t2.MessageChannel();
              o.port1.onmessage = u, r = function() {
                o.port2.postMessage(0);
              };
            }
            var h = [];
            function u() {
              var e3, t3;
              n = true;
              for (var r2 = h.length; r2; ) {
                for (t3 = h, h = [], e3 = -1; ++e3 < r2; ) t3[e3]();
                r2 = h.length;
              }
              n = false;
            }
            l.exports = function(e3) {
              1 !== h.push(e3) || n || r();
            };
          }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
        }, {}], 37: [function(e, t, r) {
          "use strict";
          var i = e("immediate");
          function u() {
          }
          var l = {}, s = ["REJECTED"], a = ["FULFILLED"], n = ["PENDING"];
          function o(e2) {
            if ("function" != typeof e2) throw new TypeError("resolver must be a function");
            this.state = n, this.queue = [], this.outcome = void 0, e2 !== u && d(this, e2);
          }
          function h(e2, t2, r2) {
            this.promise = e2, "function" == typeof t2 && (this.onFulfilled = t2, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r2 && (this.onRejected = r2, this.callRejected = this.otherCallRejected);
          }
          function f(t2, r2, n2) {
            i(function() {
              var e2;
              try {
                e2 = r2(n2);
              } catch (e3) {
                return l.reject(t2, e3);
              }
              e2 === t2 ? l.reject(t2, new TypeError("Cannot resolve promise with itself")) : l.resolve(t2, e2);
            });
          }
          function c(e2) {
            var t2 = e2 && e2.then;
            if (e2 && ("object" == typeof e2 || "function" == typeof e2) && "function" == typeof t2) return function() {
              t2.apply(e2, arguments);
            };
          }
          function d(t2, e2) {
            var r2 = false;
            function n2(e3) {
              r2 || (r2 = true, l.reject(t2, e3));
            }
            function i2(e3) {
              r2 || (r2 = true, l.resolve(t2, e3));
            }
            var s2 = p(function() {
              e2(i2, n2);
            });
            "error" === s2.status && n2(s2.value);
          }
          function p(e2, t2) {
            var r2 = {};
            try {
              r2.value = e2(t2), r2.status = "success";
            } catch (e3) {
              r2.status = "error", r2.value = e3;
            }
            return r2;
          }
          (t.exports = o).prototype.finally = function(t2) {
            if ("function" != typeof t2) return this;
            var r2 = this.constructor;
            return this.then(function(e2) {
              return r2.resolve(t2()).then(function() {
                return e2;
              });
            }, function(e2) {
              return r2.resolve(t2()).then(function() {
                throw e2;
              });
            });
          }, o.prototype.catch = function(e2) {
            return this.then(null, e2);
          }, o.prototype.then = function(e2, t2) {
            if ("function" != typeof e2 && this.state === a || "function" != typeof t2 && this.state === s) return this;
            var r2 = new this.constructor(u);
            this.state !== n ? f(r2, this.state === a ? e2 : t2, this.outcome) : this.queue.push(new h(r2, e2, t2));
            return r2;
          }, h.prototype.callFulfilled = function(e2) {
            l.resolve(this.promise, e2);
          }, h.prototype.otherCallFulfilled = function(e2) {
            f(this.promise, this.onFulfilled, e2);
          }, h.prototype.callRejected = function(e2) {
            l.reject(this.promise, e2);
          }, h.prototype.otherCallRejected = function(e2) {
            f(this.promise, this.onRejected, e2);
          }, l.resolve = function(e2, t2) {
            var r2 = p(c, t2);
            if ("error" === r2.status) return l.reject(e2, r2.value);
            var n2 = r2.value;
            if (n2) d(e2, n2);
            else {
              e2.state = a, e2.outcome = t2;
              for (var i2 = -1, s2 = e2.queue.length; ++i2 < s2; ) e2.queue[i2].callFulfilled(t2);
            }
            return e2;
          }, l.reject = function(e2, t2) {
            e2.state = s, e2.outcome = t2;
            for (var r2 = -1, n2 = e2.queue.length; ++r2 < n2; ) e2.queue[r2].callRejected(t2);
            return e2;
          }, o.resolve = function(e2) {
            if (e2 instanceof this) return e2;
            return l.resolve(new this(u), e2);
          }, o.reject = function(e2) {
            var t2 = new this(u);
            return l.reject(t2, e2);
          }, o.all = function(e2) {
            var r2 = this;
            if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
            var n2 = e2.length, i2 = false;
            if (!n2) return this.resolve([]);
            var s2 = new Array(n2), a2 = 0, t2 = -1, o2 = new this(u);
            for (; ++t2 < n2; ) h2(e2[t2], t2);
            return o2;
            function h2(e3, t3) {
              r2.resolve(e3).then(function(e4) {
                s2[t3] = e4, ++a2 !== n2 || i2 || (i2 = true, l.resolve(o2, s2));
              }, function(e4) {
                i2 || (i2 = true, l.reject(o2, e4));
              });
            }
          }, o.race = function(e2) {
            var t2 = this;
            if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
            var r2 = e2.length, n2 = false;
            if (!r2) return this.resolve([]);
            var i2 = -1, s2 = new this(u);
            for (; ++i2 < r2; ) a2 = e2[i2], t2.resolve(a2).then(function(e3) {
              n2 || (n2 = true, l.resolve(s2, e3));
            }, function(e3) {
              n2 || (n2 = true, l.reject(s2, e3));
            });
            var a2;
            return s2;
          };
        }, { immediate: 36 }], 38: [function(e, t, r) {
          "use strict";
          var n = {};
          (0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), t.exports = n;
        }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e, t, r) {
          "use strict";
          var a = e("./zlib/deflate"), o = e("./utils/common"), h = e("./utils/strings"), i = e("./zlib/messages"), s = e("./zlib/zstream"), u = Object.prototype.toString, l = 0, f = -1, c = 0, d = 8;
          function p(e2) {
            if (!(this instanceof p)) return new p(e2);
            this.options = o.assign({ level: f, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: c, to: "" }, e2 || {});
            var t2 = this.options;
            t2.raw && 0 < t2.windowBits ? t2.windowBits = -t2.windowBits : t2.gzip && 0 < t2.windowBits && t2.windowBits < 16 && (t2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s(), this.strm.avail_out = 0;
            var r2 = a.deflateInit2(this.strm, t2.level, t2.method, t2.windowBits, t2.memLevel, t2.strategy);
            if (r2 !== l) throw new Error(i[r2]);
            if (t2.header && a.deflateSetHeader(this.strm, t2.header), t2.dictionary) {
              var n2;
              if (n2 = "string" == typeof t2.dictionary ? h.string2buf(t2.dictionary) : "[object ArrayBuffer]" === u.call(t2.dictionary) ? new Uint8Array(t2.dictionary) : t2.dictionary, (r2 = a.deflateSetDictionary(this.strm, n2)) !== l) throw new Error(i[r2]);
              this._dict_set = true;
            }
          }
          function n(e2, t2) {
            var r2 = new p(t2);
            if (r2.push(e2, true), r2.err) throw r2.msg || i[r2.err];
            return r2.result;
          }
          p.prototype.push = function(e2, t2) {
            var r2, n2, i2 = this.strm, s2 = this.options.chunkSize;
            if (this.ended) return false;
            n2 = t2 === ~~t2 ? t2 : true === t2 ? 4 : 0, "string" == typeof e2 ? i2.input = h.string2buf(e2) : "[object ArrayBuffer]" === u.call(e2) ? i2.input = new Uint8Array(e2) : i2.input = e2, i2.next_in = 0, i2.avail_in = i2.input.length;
            do {
              if (0 === i2.avail_out && (i2.output = new o.Buf8(s2), i2.next_out = 0, i2.avail_out = s2), 1 !== (r2 = a.deflate(i2, n2)) && r2 !== l) return this.onEnd(r2), !(this.ended = true);
              0 !== i2.avail_out && (0 !== i2.avail_in || 4 !== n2 && 2 !== n2) || ("string" === this.options.to ? this.onData(h.buf2binstring(o.shrinkBuf(i2.output, i2.next_out))) : this.onData(o.shrinkBuf(i2.output, i2.next_out)));
            } while ((0 < i2.avail_in || 0 === i2.avail_out) && 1 !== r2);
            return 4 === n2 ? (r2 = a.deflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === l) : 2 !== n2 || (this.onEnd(l), !(i2.avail_out = 0));
          }, p.prototype.onData = function(e2) {
            this.chunks.push(e2);
          }, p.prototype.onEnd = function(e2) {
            e2 === l && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
          }, r.Deflate = p, r.deflate = n, r.deflateRaw = function(e2, t2) {
            return (t2 = t2 || {}).raw = true, n(e2, t2);
          }, r.gzip = function(e2, t2) {
            return (t2 = t2 || {}).gzip = true, n(e2, t2);
          };
        }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e, t, r) {
          "use strict";
          var c = e("./zlib/inflate"), d = e("./utils/common"), p = e("./utils/strings"), m = e("./zlib/constants"), n = e("./zlib/messages"), i = e("./zlib/zstream"), s = e("./zlib/gzheader"), _ = Object.prototype.toString;
          function a(e2) {
            if (!(this instanceof a)) return new a(e2);
            this.options = d.assign({ chunkSize: 16384, windowBits: 0, to: "" }, e2 || {});
            var t2 = this.options;
            t2.raw && 0 <= t2.windowBits && t2.windowBits < 16 && (t2.windowBits = -t2.windowBits, 0 === t2.windowBits && (t2.windowBits = -15)), !(0 <= t2.windowBits && t2.windowBits < 16) || e2 && e2.windowBits || (t2.windowBits += 32), 15 < t2.windowBits && t2.windowBits < 48 && 0 == (15 & t2.windowBits) && (t2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new i(), this.strm.avail_out = 0;
            var r2 = c.inflateInit2(this.strm, t2.windowBits);
            if (r2 !== m.Z_OK) throw new Error(n[r2]);
            this.header = new s(), c.inflateGetHeader(this.strm, this.header);
          }
          function o(e2, t2) {
            var r2 = new a(t2);
            if (r2.push(e2, true), r2.err) throw r2.msg || n[r2.err];
            return r2.result;
          }
          a.prototype.push = function(e2, t2) {
            var r2, n2, i2, s2, a2, o2, h = this.strm, u = this.options.chunkSize, l = this.options.dictionary, f = false;
            if (this.ended) return false;
            n2 = t2 === ~~t2 ? t2 : true === t2 ? m.Z_FINISH : m.Z_NO_FLUSH, "string" == typeof e2 ? h.input = p.binstring2buf(e2) : "[object ArrayBuffer]" === _.call(e2) ? h.input = new Uint8Array(e2) : h.input = e2, h.next_in = 0, h.avail_in = h.input.length;
            do {
              if (0 === h.avail_out && (h.output = new d.Buf8(u), h.next_out = 0, h.avail_out = u), (r2 = c.inflate(h, m.Z_NO_FLUSH)) === m.Z_NEED_DICT && l && (o2 = "string" == typeof l ? p.string2buf(l) : "[object ArrayBuffer]" === _.call(l) ? new Uint8Array(l) : l, r2 = c.inflateSetDictionary(this.strm, o2)), r2 === m.Z_BUF_ERROR && true === f && (r2 = m.Z_OK, f = false), r2 !== m.Z_STREAM_END && r2 !== m.Z_OK) return this.onEnd(r2), !(this.ended = true);
              h.next_out && (0 !== h.avail_out && r2 !== m.Z_STREAM_END && (0 !== h.avail_in || n2 !== m.Z_FINISH && n2 !== m.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i2 = p.utf8border(h.output, h.next_out), s2 = h.next_out - i2, a2 = p.buf2string(h.output, i2), h.next_out = s2, h.avail_out = u - s2, s2 && d.arraySet(h.output, h.output, i2, s2, 0), this.onData(a2)) : this.onData(d.shrinkBuf(h.output, h.next_out)))), 0 === h.avail_in && 0 === h.avail_out && (f = true);
            } while ((0 < h.avail_in || 0 === h.avail_out) && r2 !== m.Z_STREAM_END);
            return r2 === m.Z_STREAM_END && (n2 = m.Z_FINISH), n2 === m.Z_FINISH ? (r2 = c.inflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === m.Z_OK) : n2 !== m.Z_SYNC_FLUSH || (this.onEnd(m.Z_OK), !(h.avail_out = 0));
          }, a.prototype.onData = function(e2) {
            this.chunks.push(e2);
          }, a.prototype.onEnd = function(e2) {
            e2 === m.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = d.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
          }, r.Inflate = a, r.inflate = o, r.inflateRaw = function(e2, t2) {
            return (t2 = t2 || {}).raw = true, o(e2, t2);
          }, r.ungzip = o;
        }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e, t, r) {
          "use strict";
          var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
          r.assign = function(e2) {
            for (var t2 = Array.prototype.slice.call(arguments, 1); t2.length; ) {
              var r2 = t2.shift();
              if (r2) {
                if ("object" != typeof r2) throw new TypeError(r2 + "must be non-object");
                for (var n2 in r2) r2.hasOwnProperty(n2) && (e2[n2] = r2[n2]);
              }
            }
            return e2;
          }, r.shrinkBuf = function(e2, t2) {
            return e2.length === t2 ? e2 : e2.subarray ? e2.subarray(0, t2) : (e2.length = t2, e2);
          };
          var i = { arraySet: function(e2, t2, r2, n2, i2) {
            if (t2.subarray && e2.subarray) e2.set(t2.subarray(r2, r2 + n2), i2);
            else for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
          }, flattenChunks: function(e2) {
            var t2, r2, n2, i2, s2, a;
            for (t2 = n2 = 0, r2 = e2.length; t2 < r2; t2++) n2 += e2[t2].length;
            for (a = new Uint8Array(n2), t2 = i2 = 0, r2 = e2.length; t2 < r2; t2++) s2 = e2[t2], a.set(s2, i2), i2 += s2.length;
            return a;
          } }, s = { arraySet: function(e2, t2, r2, n2, i2) {
            for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
          }, flattenChunks: function(e2) {
            return [].concat.apply([], e2);
          } };
          r.setTyped = function(e2) {
            e2 ? (r.Buf8 = Uint8Array, r.Buf16 = Uint16Array, r.Buf32 = Int32Array, r.assign(r, i)) : (r.Buf8 = Array, r.Buf16 = Array, r.Buf32 = Array, r.assign(r, s));
          }, r.setTyped(n);
        }, {}], 42: [function(e, t, r) {
          "use strict";
          var h = e("./common"), i = true, s = true;
          try {
            String.fromCharCode.apply(null, [0]);
          } catch (e2) {
            i = false;
          }
          try {
            String.fromCharCode.apply(null, new Uint8Array(1));
          } catch (e2) {
            s = false;
          }
          for (var u = new h.Buf8(256), n = 0; n < 256; n++) u[n] = 252 <= n ? 6 : 248 <= n ? 5 : 240 <= n ? 4 : 224 <= n ? 3 : 192 <= n ? 2 : 1;
          function l(e2, t2) {
            if (t2 < 65537 && (e2.subarray && s || !e2.subarray && i)) return String.fromCharCode.apply(null, h.shrinkBuf(e2, t2));
            for (var r2 = "", n2 = 0; n2 < t2; n2++) r2 += String.fromCharCode(e2[n2]);
            return r2;
          }
          u[254] = u[254] = 1, r.string2buf = function(e2) {
            var t2, r2, n2, i2, s2, a = e2.length, o = 0;
            for (i2 = 0; i2 < a; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
            for (t2 = new h.Buf8(o), i2 = s2 = 0; s2 < o; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
            return t2;
          }, r.buf2binstring = function(e2) {
            return l(e2, e2.length);
          }, r.binstring2buf = function(e2) {
            for (var t2 = new h.Buf8(e2.length), r2 = 0, n2 = t2.length; r2 < n2; r2++) t2[r2] = e2.charCodeAt(r2);
            return t2;
          }, r.buf2string = function(e2, t2) {
            var r2, n2, i2, s2, a = t2 || e2.length, o = new Array(2 * a);
            for (r2 = n2 = 0; r2 < a; ) if ((i2 = e2[r2++]) < 128) o[n2++] = i2;
            else if (4 < (s2 = u[i2])) o[n2++] = 65533, r2 += s2 - 1;
            else {
              for (i2 &= 2 === s2 ? 31 : 3 === s2 ? 15 : 7; 1 < s2 && r2 < a; ) i2 = i2 << 6 | 63 & e2[r2++], s2--;
              1 < s2 ? o[n2++] = 65533 : i2 < 65536 ? o[n2++] = i2 : (i2 -= 65536, o[n2++] = 55296 | i2 >> 10 & 1023, o[n2++] = 56320 | 1023 & i2);
            }
            return l(o, n2);
          }, r.utf8border = function(e2, t2) {
            var r2;
            for ((t2 = t2 || e2.length) > e2.length && (t2 = e2.length), r2 = t2 - 1; 0 <= r2 && 128 == (192 & e2[r2]); ) r2--;
            return r2 < 0 ? t2 : 0 === r2 ? t2 : r2 + u[e2[r2]] > t2 ? r2 : t2;
          };
        }, { "./common": 41 }], 43: [function(e, t, r) {
          "use strict";
          t.exports = function(e2, t2, r2, n) {
            for (var i = 65535 & e2 | 0, s = e2 >>> 16 & 65535 | 0, a = 0; 0 !== r2; ) {
              for (r2 -= a = 2e3 < r2 ? 2e3 : r2; s = s + (i = i + t2[n++] | 0) | 0, --a; ) ;
              i %= 65521, s %= 65521;
            }
            return i | s << 16 | 0;
          };
        }, {}], 44: [function(e, t, r) {
          "use strict";
          t.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
        }, {}], 45: [function(e, t, r) {
          "use strict";
          var o = (function() {
            for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
              e2 = r2;
              for (var n = 0; n < 8; n++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
              t2[r2] = e2;
            }
            return t2;
          })();
          t.exports = function(e2, t2, r2, n) {
            var i = o, s = n + r2;
            e2 ^= -1;
            for (var a = n; a < s; a++) e2 = e2 >>> 8 ^ i[255 & (e2 ^ t2[a])];
            return -1 ^ e2;
          };
        }, {}], 46: [function(e, t, r) {
          "use strict";
          var h, c = e("../utils/common"), u = e("./trees"), d = e("./adler32"), p = e("./crc32"), n = e("./messages"), l = 0, f = 4, m = 0, _ = -2, g = -1, b = 4, i = 2, v = 8, y = 9, s = 286, a = 30, o = 19, w = 2 * s + 1, k = 15, x = 3, S = 258, z = S + x + 1, C = 42, E = 113, A = 1, I = 2, O = 3, B = 4;
          function R(e2, t2) {
            return e2.msg = n[t2], t2;
          }
          function T(e2) {
            return (e2 << 1) - (4 < e2 ? 9 : 0);
          }
          function D(e2) {
            for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
          }
          function F(e2) {
            var t2 = e2.state, r2 = t2.pending;
            r2 > e2.avail_out && (r2 = e2.avail_out), 0 !== r2 && (c.arraySet(e2.output, t2.pending_buf, t2.pending_out, r2, e2.next_out), e2.next_out += r2, t2.pending_out += r2, e2.total_out += r2, e2.avail_out -= r2, t2.pending -= r2, 0 === t2.pending && (t2.pending_out = 0));
          }
          function N(e2, t2) {
            u._tr_flush_block(e2, 0 <= e2.block_start ? e2.block_start : -1, e2.strstart - e2.block_start, t2), e2.block_start = e2.strstart, F(e2.strm);
          }
          function U(e2, t2) {
            e2.pending_buf[e2.pending++] = t2;
          }
          function P(e2, t2) {
            e2.pending_buf[e2.pending++] = t2 >>> 8 & 255, e2.pending_buf[e2.pending++] = 255 & t2;
          }
          function L(e2, t2) {
            var r2, n2, i2 = e2.max_chain_length, s2 = e2.strstart, a2 = e2.prev_length, o2 = e2.nice_match, h2 = e2.strstart > e2.w_size - z ? e2.strstart - (e2.w_size - z) : 0, u2 = e2.window, l2 = e2.w_mask, f2 = e2.prev, c2 = e2.strstart + S, d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
            e2.prev_length >= e2.good_match && (i2 >>= 2), o2 > e2.lookahead && (o2 = e2.lookahead);
            do {
              if (u2[(r2 = t2) + a2] === p2 && u2[r2 + a2 - 1] === d2 && u2[r2] === u2[s2] && u2[++r2] === u2[s2 + 1]) {
                s2 += 2, r2++;
                do {
                } while (u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && s2 < c2);
                if (n2 = S - (c2 - s2), s2 = c2 - S, a2 < n2) {
                  if (e2.match_start = t2, o2 <= (a2 = n2)) break;
                  d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
                }
              }
            } while ((t2 = f2[t2 & l2]) > h2 && 0 != --i2);
            return a2 <= e2.lookahead ? a2 : e2.lookahead;
          }
          function j(e2) {
            var t2, r2, n2, i2, s2, a2, o2, h2, u2, l2, f2 = e2.w_size;
            do {
              if (i2 = e2.window_size - e2.lookahead - e2.strstart, e2.strstart >= f2 + (f2 - z)) {
                for (c.arraySet(e2.window, e2.window, f2, f2, 0), e2.match_start -= f2, e2.strstart -= f2, e2.block_start -= f2, t2 = r2 = e2.hash_size; n2 = e2.head[--t2], e2.head[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
                for (t2 = r2 = f2; n2 = e2.prev[--t2], e2.prev[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
                i2 += f2;
              }
              if (0 === e2.strm.avail_in) break;
              if (a2 = e2.strm, o2 = e2.window, h2 = e2.strstart + e2.lookahead, u2 = i2, l2 = void 0, l2 = a2.avail_in, u2 < l2 && (l2 = u2), r2 = 0 === l2 ? 0 : (a2.avail_in -= l2, c.arraySet(o2, a2.input, a2.next_in, l2, h2), 1 === a2.state.wrap ? a2.adler = d(a2.adler, o2, l2, h2) : 2 === a2.state.wrap && (a2.adler = p(a2.adler, o2, l2, h2)), a2.next_in += l2, a2.total_in += l2, l2), e2.lookahead += r2, e2.lookahead + e2.insert >= x) for (s2 = e2.strstart - e2.insert, e2.ins_h = e2.window[s2], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + 1]) & e2.hash_mask; e2.insert && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + x - 1]) & e2.hash_mask, e2.prev[s2 & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = s2, s2++, e2.insert--, !(e2.lookahead + e2.insert < x)); ) ;
            } while (e2.lookahead < z && 0 !== e2.strm.avail_in);
          }
          function Z(e2, t2) {
            for (var r2, n2; ; ) {
              if (e2.lookahead < z) {
                if (j(e2), e2.lookahead < z && t2 === l) return A;
                if (0 === e2.lookahead) break;
              }
              if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 !== r2 && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2)), e2.match_length >= x) if (n2 = u._tr_tally(e2, e2.strstart - e2.match_start, e2.match_length - x), e2.lookahead -= e2.match_length, e2.match_length <= e2.max_lazy_match && e2.lookahead >= x) {
                for (e2.match_length--; e2.strstart++, e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart, 0 != --e2.match_length; ) ;
                e2.strstart++;
              } else e2.strstart += e2.match_length, e2.match_length = 0, e2.ins_h = e2.window[e2.strstart], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + 1]) & e2.hash_mask;
              else n2 = u._tr_tally(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++;
              if (n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
            }
            return e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
          }
          function W(e2, t2) {
            for (var r2, n2, i2; ; ) {
              if (e2.lookahead < z) {
                if (j(e2), e2.lookahead < z && t2 === l) return A;
                if (0 === e2.lookahead) break;
              }
              if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), e2.prev_length = e2.match_length, e2.prev_match = e2.match_start, e2.match_length = x - 1, 0 !== r2 && e2.prev_length < e2.max_lazy_match && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2), e2.match_length <= 5 && (1 === e2.strategy || e2.match_length === x && 4096 < e2.strstart - e2.match_start) && (e2.match_length = x - 1)), e2.prev_length >= x && e2.match_length <= e2.prev_length) {
                for (i2 = e2.strstart + e2.lookahead - x, n2 = u._tr_tally(e2, e2.strstart - 1 - e2.prev_match, e2.prev_length - x), e2.lookahead -= e2.prev_length - 1, e2.prev_length -= 2; ++e2.strstart <= i2 && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 != --e2.prev_length; ) ;
                if (e2.match_available = 0, e2.match_length = x - 1, e2.strstart++, n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
              } else if (e2.match_available) {
                if ((n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1])) && N(e2, false), e2.strstart++, e2.lookahead--, 0 === e2.strm.avail_out) return A;
              } else e2.match_available = 1, e2.strstart++, e2.lookahead--;
            }
            return e2.match_available && (n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1]), e2.match_available = 0), e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
          }
          function M(e2, t2, r2, n2, i2) {
            this.good_length = e2, this.max_lazy = t2, this.nice_length = r2, this.max_chain = n2, this.func = i2;
          }
          function H() {
            this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new c.Buf16(2 * w), this.dyn_dtree = new c.Buf16(2 * (2 * a + 1)), this.bl_tree = new c.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new c.Buf16(k + 1), this.heap = new c.Buf16(2 * s + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new c.Buf16(2 * s + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
          }
          function G(e2) {
            var t2;
            return e2 && e2.state ? (e2.total_in = e2.total_out = 0, e2.data_type = i, (t2 = e2.state).pending = 0, t2.pending_out = 0, t2.wrap < 0 && (t2.wrap = -t2.wrap), t2.status = t2.wrap ? C : E, e2.adler = 2 === t2.wrap ? 0 : 1, t2.last_flush = l, u._tr_init(t2), m) : R(e2, _);
          }
          function K(e2) {
            var t2 = G(e2);
            return t2 === m && (function(e3) {
              e3.window_size = 2 * e3.w_size, D(e3.head), e3.max_lazy_match = h[e3.level].max_lazy, e3.good_match = h[e3.level].good_length, e3.nice_match = h[e3.level].nice_length, e3.max_chain_length = h[e3.level].max_chain, e3.strstart = 0, e3.block_start = 0, e3.lookahead = 0, e3.insert = 0, e3.match_length = e3.prev_length = x - 1, e3.match_available = 0, e3.ins_h = 0;
            })(e2.state), t2;
          }
          function Y(e2, t2, r2, n2, i2, s2) {
            if (!e2) return _;
            var a2 = 1;
            if (t2 === g && (t2 = 6), n2 < 0 ? (a2 = 0, n2 = -n2) : 15 < n2 && (a2 = 2, n2 -= 16), i2 < 1 || y < i2 || r2 !== v || n2 < 8 || 15 < n2 || t2 < 0 || 9 < t2 || s2 < 0 || b < s2) return R(e2, _);
            8 === n2 && (n2 = 9);
            var o2 = new H();
            return (e2.state = o2).strm = e2, o2.wrap = a2, o2.gzhead = null, o2.w_bits = n2, o2.w_size = 1 << o2.w_bits, o2.w_mask = o2.w_size - 1, o2.hash_bits = i2 + 7, o2.hash_size = 1 << o2.hash_bits, o2.hash_mask = o2.hash_size - 1, o2.hash_shift = ~~((o2.hash_bits + x - 1) / x), o2.window = new c.Buf8(2 * o2.w_size), o2.head = new c.Buf16(o2.hash_size), o2.prev = new c.Buf16(o2.w_size), o2.lit_bufsize = 1 << i2 + 6, o2.pending_buf_size = 4 * o2.lit_bufsize, o2.pending_buf = new c.Buf8(o2.pending_buf_size), o2.d_buf = 1 * o2.lit_bufsize, o2.l_buf = 3 * o2.lit_bufsize, o2.level = t2, o2.strategy = s2, o2.method = r2, K(e2);
          }
          h = [new M(0, 0, 0, 0, function(e2, t2) {
            var r2 = 65535;
            for (r2 > e2.pending_buf_size - 5 && (r2 = e2.pending_buf_size - 5); ; ) {
              if (e2.lookahead <= 1) {
                if (j(e2), 0 === e2.lookahead && t2 === l) return A;
                if (0 === e2.lookahead) break;
              }
              e2.strstart += e2.lookahead, e2.lookahead = 0;
              var n2 = e2.block_start + r2;
              if ((0 === e2.strstart || e2.strstart >= n2) && (e2.lookahead = e2.strstart - n2, e2.strstart = n2, N(e2, false), 0 === e2.strm.avail_out)) return A;
              if (e2.strstart - e2.block_start >= e2.w_size - z && (N(e2, false), 0 === e2.strm.avail_out)) return A;
            }
            return e2.insert = 0, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : (e2.strstart > e2.block_start && (N(e2, false), e2.strm.avail_out), A);
          }), new M(4, 4, 8, 4, Z), new M(4, 5, 16, 8, Z), new M(4, 6, 32, 32, Z), new M(4, 4, 16, 16, W), new M(8, 16, 32, 32, W), new M(8, 16, 128, 128, W), new M(8, 32, 128, 256, W), new M(32, 128, 258, 1024, W), new M(32, 258, 258, 4096, W)], r.deflateInit = function(e2, t2) {
            return Y(e2, t2, v, 15, 8, 0);
          }, r.deflateInit2 = Y, r.deflateReset = K, r.deflateResetKeep = G, r.deflateSetHeader = function(e2, t2) {
            return e2 && e2.state ? 2 !== e2.state.wrap ? _ : (e2.state.gzhead = t2, m) : _;
          }, r.deflate = function(e2, t2) {
            var r2, n2, i2, s2;
            if (!e2 || !e2.state || 5 < t2 || t2 < 0) return e2 ? R(e2, _) : _;
            if (n2 = e2.state, !e2.output || !e2.input && 0 !== e2.avail_in || 666 === n2.status && t2 !== f) return R(e2, 0 === e2.avail_out ? -5 : _);
            if (n2.strm = e2, r2 = n2.last_flush, n2.last_flush = t2, n2.status === C) if (2 === n2.wrap) e2.adler = 0, U(n2, 31), U(n2, 139), U(n2, 8), n2.gzhead ? (U(n2, (n2.gzhead.text ? 1 : 0) + (n2.gzhead.hcrc ? 2 : 0) + (n2.gzhead.extra ? 4 : 0) + (n2.gzhead.name ? 8 : 0) + (n2.gzhead.comment ? 16 : 0)), U(n2, 255 & n2.gzhead.time), U(n2, n2.gzhead.time >> 8 & 255), U(n2, n2.gzhead.time >> 16 & 255), U(n2, n2.gzhead.time >> 24 & 255), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 255 & n2.gzhead.os), n2.gzhead.extra && n2.gzhead.extra.length && (U(n2, 255 & n2.gzhead.extra.length), U(n2, n2.gzhead.extra.length >> 8 & 255)), n2.gzhead.hcrc && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending, 0)), n2.gzindex = 0, n2.status = 69) : (U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 3), n2.status = E);
            else {
              var a2 = v + (n2.w_bits - 8 << 4) << 8;
              a2 |= (2 <= n2.strategy || n2.level < 2 ? 0 : n2.level < 6 ? 1 : 6 === n2.level ? 2 : 3) << 6, 0 !== n2.strstart && (a2 |= 32), a2 += 31 - a2 % 31, n2.status = E, P(n2, a2), 0 !== n2.strstart && (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), e2.adler = 1;
            }
            if (69 === n2.status) if (n2.gzhead.extra) {
              for (i2 = n2.pending; n2.gzindex < (65535 & n2.gzhead.extra.length) && (n2.pending !== n2.pending_buf_size || (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending !== n2.pending_buf_size)); ) U(n2, 255 & n2.gzhead.extra[n2.gzindex]), n2.gzindex++;
              n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), n2.gzindex === n2.gzhead.extra.length && (n2.gzindex = 0, n2.status = 73);
            } else n2.status = 73;
            if (73 === n2.status) if (n2.gzhead.name) {
              i2 = n2.pending;
              do {
                if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                  s2 = 1;
                  break;
                }
                s2 = n2.gzindex < n2.gzhead.name.length ? 255 & n2.gzhead.name.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
              } while (0 !== s2);
              n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.gzindex = 0, n2.status = 91);
            } else n2.status = 91;
            if (91 === n2.status) if (n2.gzhead.comment) {
              i2 = n2.pending;
              do {
                if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                  s2 = 1;
                  break;
                }
                s2 = n2.gzindex < n2.gzhead.comment.length ? 255 & n2.gzhead.comment.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
              } while (0 !== s2);
              n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.status = 103);
            } else n2.status = 103;
            if (103 === n2.status && (n2.gzhead.hcrc ? (n2.pending + 2 > n2.pending_buf_size && F(e2), n2.pending + 2 <= n2.pending_buf_size && (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), e2.adler = 0, n2.status = E)) : n2.status = E), 0 !== n2.pending) {
              if (F(e2), 0 === e2.avail_out) return n2.last_flush = -1, m;
            } else if (0 === e2.avail_in && T(t2) <= T(r2) && t2 !== f) return R(e2, -5);
            if (666 === n2.status && 0 !== e2.avail_in) return R(e2, -5);
            if (0 !== e2.avail_in || 0 !== n2.lookahead || t2 !== l && 666 !== n2.status) {
              var o2 = 2 === n2.strategy ? (function(e3, t3) {
                for (var r3; ; ) {
                  if (0 === e3.lookahead && (j(e3), 0 === e3.lookahead)) {
                    if (t3 === l) return A;
                    break;
                  }
                  if (e3.match_length = 0, r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++, r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
                }
                return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
              })(n2, t2) : 3 === n2.strategy ? (function(e3, t3) {
                for (var r3, n3, i3, s3, a3 = e3.window; ; ) {
                  if (e3.lookahead <= S) {
                    if (j(e3), e3.lookahead <= S && t3 === l) return A;
                    if (0 === e3.lookahead) break;
                  }
                  if (e3.match_length = 0, e3.lookahead >= x && 0 < e3.strstart && (n3 = a3[i3 = e3.strstart - 1]) === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3]) {
                    s3 = e3.strstart + S;
                    do {
                    } while (n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && i3 < s3);
                    e3.match_length = S - (s3 - i3), e3.match_length > e3.lookahead && (e3.match_length = e3.lookahead);
                  }
                  if (e3.match_length >= x ? (r3 = u._tr_tally(e3, 1, e3.match_length - x), e3.lookahead -= e3.match_length, e3.strstart += e3.match_length, e3.match_length = 0) : (r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++), r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
                }
                return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
              })(n2, t2) : h[n2.level].func(n2, t2);
              if (o2 !== O && o2 !== B || (n2.status = 666), o2 === A || o2 === O) return 0 === e2.avail_out && (n2.last_flush = -1), m;
              if (o2 === I && (1 === t2 ? u._tr_align(n2) : 5 !== t2 && (u._tr_stored_block(n2, 0, 0, false), 3 === t2 && (D(n2.head), 0 === n2.lookahead && (n2.strstart = 0, n2.block_start = 0, n2.insert = 0))), F(e2), 0 === e2.avail_out)) return n2.last_flush = -1, m;
            }
            return t2 !== f ? m : n2.wrap <= 0 ? 1 : (2 === n2.wrap ? (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), U(n2, e2.adler >> 16 & 255), U(n2, e2.adler >> 24 & 255), U(n2, 255 & e2.total_in), U(n2, e2.total_in >> 8 & 255), U(n2, e2.total_in >> 16 & 255), U(n2, e2.total_in >> 24 & 255)) : (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), F(e2), 0 < n2.wrap && (n2.wrap = -n2.wrap), 0 !== n2.pending ? m : 1);
          }, r.deflateEnd = function(e2) {
            var t2;
            return e2 && e2.state ? (t2 = e2.state.status) !== C && 69 !== t2 && 73 !== t2 && 91 !== t2 && 103 !== t2 && t2 !== E && 666 !== t2 ? R(e2, _) : (e2.state = null, t2 === E ? R(e2, -3) : m) : _;
          }, r.deflateSetDictionary = function(e2, t2) {
            var r2, n2, i2, s2, a2, o2, h2, u2, l2 = t2.length;
            if (!e2 || !e2.state) return _;
            if (2 === (s2 = (r2 = e2.state).wrap) || 1 === s2 && r2.status !== C || r2.lookahead) return _;
            for (1 === s2 && (e2.adler = d(e2.adler, t2, l2, 0)), r2.wrap = 0, l2 >= r2.w_size && (0 === s2 && (D(r2.head), r2.strstart = 0, r2.block_start = 0, r2.insert = 0), u2 = new c.Buf8(r2.w_size), c.arraySet(u2, t2, l2 - r2.w_size, r2.w_size, 0), t2 = u2, l2 = r2.w_size), a2 = e2.avail_in, o2 = e2.next_in, h2 = e2.input, e2.avail_in = l2, e2.next_in = 0, e2.input = t2, j(r2); r2.lookahead >= x; ) {
              for (n2 = r2.strstart, i2 = r2.lookahead - (x - 1); r2.ins_h = (r2.ins_h << r2.hash_shift ^ r2.window[n2 + x - 1]) & r2.hash_mask, r2.prev[n2 & r2.w_mask] = r2.head[r2.ins_h], r2.head[r2.ins_h] = n2, n2++, --i2; ) ;
              r2.strstart = n2, r2.lookahead = x - 1, j(r2);
            }
            return r2.strstart += r2.lookahead, r2.block_start = r2.strstart, r2.insert = r2.lookahead, r2.lookahead = 0, r2.match_length = r2.prev_length = x - 1, r2.match_available = 0, e2.next_in = o2, e2.input = h2, e2.avail_in = a2, r2.wrap = s2, m;
          }, r.deflateInfo = "pako deflate (from Nodeca project)";
        }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e, t, r) {
          "use strict";
          t.exports = function() {
            this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
          };
        }, {}], 48: [function(e, t, r) {
          "use strict";
          t.exports = function(e2, t2) {
            var r2, n, i, s, a, o, h, u, l, f, c, d, p, m, _, g, b, v, y, w, k, x, S, z, C;
            r2 = e2.state, n = e2.next_in, z = e2.input, i = n + (e2.avail_in - 5), s = e2.next_out, C = e2.output, a = s - (t2 - e2.avail_out), o = s + (e2.avail_out - 257), h = r2.dmax, u = r2.wsize, l = r2.whave, f = r2.wnext, c = r2.window, d = r2.hold, p = r2.bits, m = r2.lencode, _ = r2.distcode, g = (1 << r2.lenbits) - 1, b = (1 << r2.distbits) - 1;
            e: do {
              p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = m[d & g];
              t: for (; ; ) {
                if (d >>>= y = v >>> 24, p -= y, 0 === (y = v >>> 16 & 255)) C[s++] = 65535 & v;
                else {
                  if (!(16 & y)) {
                    if (0 == (64 & y)) {
                      v = m[(65535 & v) + (d & (1 << y) - 1)];
                      continue t;
                    }
                    if (32 & y) {
                      r2.mode = 12;
                      break e;
                    }
                    e2.msg = "invalid literal/length code", r2.mode = 30;
                    break e;
                  }
                  w = 65535 & v, (y &= 15) && (p < y && (d += z[n++] << p, p += 8), w += d & (1 << y) - 1, d >>>= y, p -= y), p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = _[d & b];
                  r: for (; ; ) {
                    if (d >>>= y = v >>> 24, p -= y, !(16 & (y = v >>> 16 & 255))) {
                      if (0 == (64 & y)) {
                        v = _[(65535 & v) + (d & (1 << y) - 1)];
                        continue r;
                      }
                      e2.msg = "invalid distance code", r2.mode = 30;
                      break e;
                    }
                    if (k = 65535 & v, p < (y &= 15) && (d += z[n++] << p, (p += 8) < y && (d += z[n++] << p, p += 8)), h < (k += d & (1 << y) - 1)) {
                      e2.msg = "invalid distance too far back", r2.mode = 30;
                      break e;
                    }
                    if (d >>>= y, p -= y, (y = s - a) < k) {
                      if (l < (y = k - y) && r2.sane) {
                        e2.msg = "invalid distance too far back", r2.mode = 30;
                        break e;
                      }
                      if (S = c, (x = 0) === f) {
                        if (x += u - y, y < w) {
                          for (w -= y; C[s++] = c[x++], --y; ) ;
                          x = s - k, S = C;
                        }
                      } else if (f < y) {
                        if (x += u + f - y, (y -= f) < w) {
                          for (w -= y; C[s++] = c[x++], --y; ) ;
                          if (x = 0, f < w) {
                            for (w -= y = f; C[s++] = c[x++], --y; ) ;
                            x = s - k, S = C;
                          }
                        }
                      } else if (x += f - y, y < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        x = s - k, S = C;
                      }
                      for (; 2 < w; ) C[s++] = S[x++], C[s++] = S[x++], C[s++] = S[x++], w -= 3;
                      w && (C[s++] = S[x++], 1 < w && (C[s++] = S[x++]));
                    } else {
                      for (x = s - k; C[s++] = C[x++], C[s++] = C[x++], C[s++] = C[x++], 2 < (w -= 3); ) ;
                      w && (C[s++] = C[x++], 1 < w && (C[s++] = C[x++]));
                    }
                    break;
                  }
                }
                break;
              }
            } while (n < i && s < o);
            n -= w = p >> 3, d &= (1 << (p -= w << 3)) - 1, e2.next_in = n, e2.next_out = s, e2.avail_in = n < i ? i - n + 5 : 5 - (n - i), e2.avail_out = s < o ? o - s + 257 : 257 - (s - o), r2.hold = d, r2.bits = p;
          };
        }, {}], 49: [function(e, t, r) {
          "use strict";
          var I = e("../utils/common"), O = e("./adler32"), B = e("./crc32"), R = e("./inffast"), T = e("./inftrees"), D = 1, F = 2, N = 0, U = -2, P = 1, n = 852, i = 592;
          function L(e2) {
            return (e2 >>> 24 & 255) + (e2 >>> 8 & 65280) + ((65280 & e2) << 8) + ((255 & e2) << 24);
          }
          function s() {
            this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I.Buf16(320), this.work = new I.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
          }
          function a(e2) {
            var t2;
            return e2 && e2.state ? (t2 = e2.state, e2.total_in = e2.total_out = t2.total = 0, e2.msg = "", t2.wrap && (e2.adler = 1 & t2.wrap), t2.mode = P, t2.last = 0, t2.havedict = 0, t2.dmax = 32768, t2.head = null, t2.hold = 0, t2.bits = 0, t2.lencode = t2.lendyn = new I.Buf32(n), t2.distcode = t2.distdyn = new I.Buf32(i), t2.sane = 1, t2.back = -1, N) : U;
          }
          function o(e2) {
            var t2;
            return e2 && e2.state ? ((t2 = e2.state).wsize = 0, t2.whave = 0, t2.wnext = 0, a(e2)) : U;
          }
          function h(e2, t2) {
            var r2, n2;
            return e2 && e2.state ? (n2 = e2.state, t2 < 0 ? (r2 = 0, t2 = -t2) : (r2 = 1 + (t2 >> 4), t2 < 48 && (t2 &= 15)), t2 && (t2 < 8 || 15 < t2) ? U : (null !== n2.window && n2.wbits !== t2 && (n2.window = null), n2.wrap = r2, n2.wbits = t2, o(e2))) : U;
          }
          function u(e2, t2) {
            var r2, n2;
            return e2 ? (n2 = new s(), (e2.state = n2).window = null, (r2 = h(e2, t2)) !== N && (e2.state = null), r2) : U;
          }
          var l, f, c = true;
          function j(e2) {
            if (c) {
              var t2;
              for (l = new I.Buf32(512), f = new I.Buf32(32), t2 = 0; t2 < 144; ) e2.lens[t2++] = 8;
              for (; t2 < 256; ) e2.lens[t2++] = 9;
              for (; t2 < 280; ) e2.lens[t2++] = 7;
              for (; t2 < 288; ) e2.lens[t2++] = 8;
              for (T(D, e2.lens, 0, 288, l, 0, e2.work, { bits: 9 }), t2 = 0; t2 < 32; ) e2.lens[t2++] = 5;
              T(F, e2.lens, 0, 32, f, 0, e2.work, { bits: 5 }), c = false;
            }
            e2.lencode = l, e2.lenbits = 9, e2.distcode = f, e2.distbits = 5;
          }
          function Z(e2, t2, r2, n2) {
            var i2, s2 = e2.state;
            return null === s2.window && (s2.wsize = 1 << s2.wbits, s2.wnext = 0, s2.whave = 0, s2.window = new I.Buf8(s2.wsize)), n2 >= s2.wsize ? (I.arraySet(s2.window, t2, r2 - s2.wsize, s2.wsize, 0), s2.wnext = 0, s2.whave = s2.wsize) : (n2 < (i2 = s2.wsize - s2.wnext) && (i2 = n2), I.arraySet(s2.window, t2, r2 - n2, i2, s2.wnext), (n2 -= i2) ? (I.arraySet(s2.window, t2, r2 - n2, n2, 0), s2.wnext = n2, s2.whave = s2.wsize) : (s2.wnext += i2, s2.wnext === s2.wsize && (s2.wnext = 0), s2.whave < s2.wsize && (s2.whave += i2))), 0;
          }
          r.inflateReset = o, r.inflateReset2 = h, r.inflateResetKeep = a, r.inflateInit = function(e2) {
            return u(e2, 15);
          }, r.inflateInit2 = u, r.inflate = function(e2, t2) {
            var r2, n2, i2, s2, a2, o2, h2, u2, l2, f2, c2, d, p, m, _, g, b, v, y, w, k, x, S, z, C = 0, E = new I.Buf8(4), A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
            if (!e2 || !e2.state || !e2.output || !e2.input && 0 !== e2.avail_in) return U;
            12 === (r2 = e2.state).mode && (r2.mode = 13), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, f2 = o2, c2 = h2, x = N;
            e: for (; ; ) switch (r2.mode) {
              case P:
                if (0 === r2.wrap) {
                  r2.mode = 13;
                  break;
                }
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (2 & r2.wrap && 35615 === u2) {
                  E[r2.check = 0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0), l2 = u2 = 0, r2.mode = 2;
                  break;
                }
                if (r2.flags = 0, r2.head && (r2.head.done = false), !(1 & r2.wrap) || (((255 & u2) << 8) + (u2 >> 8)) % 31) {
                  e2.msg = "incorrect header check", r2.mode = 30;
                  break;
                }
                if (8 != (15 & u2)) {
                  e2.msg = "unknown compression method", r2.mode = 30;
                  break;
                }
                if (l2 -= 4, k = 8 + (15 & (u2 >>>= 4)), 0 === r2.wbits) r2.wbits = k;
                else if (k > r2.wbits) {
                  e2.msg = "invalid window size", r2.mode = 30;
                  break;
                }
                r2.dmax = 1 << k, e2.adler = r2.check = 1, r2.mode = 512 & u2 ? 10 : 12, l2 = u2 = 0;
                break;
              case 2:
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (r2.flags = u2, 8 != (255 & r2.flags)) {
                  e2.msg = "unknown compression method", r2.mode = 30;
                  break;
                }
                if (57344 & r2.flags) {
                  e2.msg = "unknown header flags set", r2.mode = 30;
                  break;
                }
                r2.head && (r2.head.text = u2 >> 8 & 1), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 3;
              case 3:
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.head && (r2.head.time = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, E[2] = u2 >>> 16 & 255, E[3] = u2 >>> 24 & 255, r2.check = B(r2.check, E, 4, 0)), l2 = u2 = 0, r2.mode = 4;
              case 4:
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.head && (r2.head.xflags = 255 & u2, r2.head.os = u2 >> 8), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 5;
              case 5:
                if (1024 & r2.flags) {
                  for (; l2 < 16; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.length = u2, r2.head && (r2.head.extra_len = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0;
                } else r2.head && (r2.head.extra = null);
                r2.mode = 6;
              case 6:
                if (1024 & r2.flags && (o2 < (d = r2.length) && (d = o2), d && (r2.head && (k = r2.head.extra_len - r2.length, r2.head.extra || (r2.head.extra = new Array(r2.head.extra_len)), I.arraySet(r2.head.extra, n2, s2, d, k)), 512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, r2.length -= d), r2.length)) break e;
                r2.length = 0, r2.mode = 7;
              case 7:
                if (2048 & r2.flags) {
                  if (0 === o2) break e;
                  for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.name += String.fromCharCode(k)), k && d < o2; ) ;
                  if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
                } else r2.head && (r2.head.name = null);
                r2.length = 0, r2.mode = 8;
              case 8:
                if (4096 & r2.flags) {
                  if (0 === o2) break e;
                  for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.comment += String.fromCharCode(k)), k && d < o2; ) ;
                  if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
                } else r2.head && (r2.head.comment = null);
                r2.mode = 9;
              case 9:
                if (512 & r2.flags) {
                  for (; l2 < 16; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (u2 !== (65535 & r2.check)) {
                    e2.msg = "header crc mismatch", r2.mode = 30;
                    break;
                  }
                  l2 = u2 = 0;
                }
                r2.head && (r2.head.hcrc = r2.flags >> 9 & 1, r2.head.done = true), e2.adler = r2.check = 0, r2.mode = 12;
                break;
              case 10:
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                e2.adler = r2.check = L(u2), l2 = u2 = 0, r2.mode = 11;
              case 11:
                if (0 === r2.havedict) return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, 2;
                e2.adler = r2.check = 1, r2.mode = 12;
              case 12:
                if (5 === t2 || 6 === t2) break e;
              case 13:
                if (r2.last) {
                  u2 >>>= 7 & l2, l2 -= 7 & l2, r2.mode = 27;
                  break;
                }
                for (; l2 < 3; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                switch (r2.last = 1 & u2, l2 -= 1, 3 & (u2 >>>= 1)) {
                  case 0:
                    r2.mode = 14;
                    break;
                  case 1:
                    if (j(r2), r2.mode = 20, 6 !== t2) break;
                    u2 >>>= 2, l2 -= 2;
                    break e;
                  case 2:
                    r2.mode = 17;
                    break;
                  case 3:
                    e2.msg = "invalid block type", r2.mode = 30;
                }
                u2 >>>= 2, l2 -= 2;
                break;
              case 14:
                for (u2 >>>= 7 & l2, l2 -= 7 & l2; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if ((65535 & u2) != (u2 >>> 16 ^ 65535)) {
                  e2.msg = "invalid stored block lengths", r2.mode = 30;
                  break;
                }
                if (r2.length = 65535 & u2, l2 = u2 = 0, r2.mode = 15, 6 === t2) break e;
              case 15:
                r2.mode = 16;
              case 16:
                if (d = r2.length) {
                  if (o2 < d && (d = o2), h2 < d && (d = h2), 0 === d) break e;
                  I.arraySet(i2, n2, s2, d, a2), o2 -= d, s2 += d, h2 -= d, a2 += d, r2.length -= d;
                  break;
                }
                r2.mode = 12;
                break;
              case 17:
                for (; l2 < 14; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (r2.nlen = 257 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ndist = 1 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ncode = 4 + (15 & u2), u2 >>>= 4, l2 -= 4, 286 < r2.nlen || 30 < r2.ndist) {
                  e2.msg = "too many length or distance symbols", r2.mode = 30;
                  break;
                }
                r2.have = 0, r2.mode = 18;
              case 18:
                for (; r2.have < r2.ncode; ) {
                  for (; l2 < 3; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.lens[A[r2.have++]] = 7 & u2, u2 >>>= 3, l2 -= 3;
                }
                for (; r2.have < 19; ) r2.lens[A[r2.have++]] = 0;
                if (r2.lencode = r2.lendyn, r2.lenbits = 7, S = { bits: r2.lenbits }, x = T(0, r2.lens, 0, 19, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                  e2.msg = "invalid code lengths set", r2.mode = 30;
                  break;
                }
                r2.have = 0, r2.mode = 19;
              case 19:
                for (; r2.have < r2.nlen + r2.ndist; ) {
                  for (; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (b < 16) u2 >>>= _, l2 -= _, r2.lens[r2.have++] = b;
                  else {
                    if (16 === b) {
                      for (z = _ + 2; l2 < z; ) {
                        if (0 === o2) break e;
                        o2--, u2 += n2[s2++] << l2, l2 += 8;
                      }
                      if (u2 >>>= _, l2 -= _, 0 === r2.have) {
                        e2.msg = "invalid bit length repeat", r2.mode = 30;
                        break;
                      }
                      k = r2.lens[r2.have - 1], d = 3 + (3 & u2), u2 >>>= 2, l2 -= 2;
                    } else if (17 === b) {
                      for (z = _ + 3; l2 < z; ) {
                        if (0 === o2) break e;
                        o2--, u2 += n2[s2++] << l2, l2 += 8;
                      }
                      l2 -= _, k = 0, d = 3 + (7 & (u2 >>>= _)), u2 >>>= 3, l2 -= 3;
                    } else {
                      for (z = _ + 7; l2 < z; ) {
                        if (0 === o2) break e;
                        o2--, u2 += n2[s2++] << l2, l2 += 8;
                      }
                      l2 -= _, k = 0, d = 11 + (127 & (u2 >>>= _)), u2 >>>= 7, l2 -= 7;
                    }
                    if (r2.have + d > r2.nlen + r2.ndist) {
                      e2.msg = "invalid bit length repeat", r2.mode = 30;
                      break;
                    }
                    for (; d--; ) r2.lens[r2.have++] = k;
                  }
                }
                if (30 === r2.mode) break;
                if (0 === r2.lens[256]) {
                  e2.msg = "invalid code -- missing end-of-block", r2.mode = 30;
                  break;
                }
                if (r2.lenbits = 9, S = { bits: r2.lenbits }, x = T(D, r2.lens, 0, r2.nlen, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                  e2.msg = "invalid literal/lengths set", r2.mode = 30;
                  break;
                }
                if (r2.distbits = 6, r2.distcode = r2.distdyn, S = { bits: r2.distbits }, x = T(F, r2.lens, r2.nlen, r2.ndist, r2.distcode, 0, r2.work, S), r2.distbits = S.bits, x) {
                  e2.msg = "invalid distances set", r2.mode = 30;
                  break;
                }
                if (r2.mode = 20, 6 === t2) break e;
              case 20:
                r2.mode = 21;
              case 21:
                if (6 <= o2 && 258 <= h2) {
                  e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, R(e2, c2), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, 12 === r2.mode && (r2.back = -1);
                  break;
                }
                for (r2.back = 0; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (g && 0 == (240 & g)) {
                  for (v = _, y = g, w = b; g = (C = r2.lencode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  u2 >>>= v, l2 -= v, r2.back += v;
                }
                if (u2 >>>= _, l2 -= _, r2.back += _, r2.length = b, 0 === g) {
                  r2.mode = 26;
                  break;
                }
                if (32 & g) {
                  r2.back = -1, r2.mode = 12;
                  break;
                }
                if (64 & g) {
                  e2.msg = "invalid literal/length code", r2.mode = 30;
                  break;
                }
                r2.extra = 15 & g, r2.mode = 22;
              case 22:
                if (r2.extra) {
                  for (z = r2.extra; l2 < z; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.length += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
                }
                r2.was = r2.length, r2.mode = 23;
              case 23:
                for (; g = (C = r2.distcode[u2 & (1 << r2.distbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_ = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (0 == (240 & g)) {
                  for (v = _, y = g, w = b; g = (C = r2.distcode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_ = C >>> 24) <= l2); ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  u2 >>>= v, l2 -= v, r2.back += v;
                }
                if (u2 >>>= _, l2 -= _, r2.back += _, 64 & g) {
                  e2.msg = "invalid distance code", r2.mode = 30;
                  break;
                }
                r2.offset = b, r2.extra = 15 & g, r2.mode = 24;
              case 24:
                if (r2.extra) {
                  for (z = r2.extra; l2 < z; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  r2.offset += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
                }
                if (r2.offset > r2.dmax) {
                  e2.msg = "invalid distance too far back", r2.mode = 30;
                  break;
                }
                r2.mode = 25;
              case 25:
                if (0 === h2) break e;
                if (d = c2 - h2, r2.offset > d) {
                  if ((d = r2.offset - d) > r2.whave && r2.sane) {
                    e2.msg = "invalid distance too far back", r2.mode = 30;
                    break;
                  }
                  p = d > r2.wnext ? (d -= r2.wnext, r2.wsize - d) : r2.wnext - d, d > r2.length && (d = r2.length), m = r2.window;
                } else m = i2, p = a2 - r2.offset, d = r2.length;
                for (h2 < d && (d = h2), h2 -= d, r2.length -= d; i2[a2++] = m[p++], --d; ) ;
                0 === r2.length && (r2.mode = 21);
                break;
              case 26:
                if (0 === h2) break e;
                i2[a2++] = r2.length, h2--, r2.mode = 21;
                break;
              case 27:
                if (r2.wrap) {
                  for (; l2 < 32; ) {
                    if (0 === o2) break e;
                    o2--, u2 |= n2[s2++] << l2, l2 += 8;
                  }
                  if (c2 -= h2, e2.total_out += c2, r2.total += c2, c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, a2 - c2) : O(r2.check, i2, c2, a2 - c2)), c2 = h2, (r2.flags ? u2 : L(u2)) !== r2.check) {
                    e2.msg = "incorrect data check", r2.mode = 30;
                    break;
                  }
                  l2 = u2 = 0;
                }
                r2.mode = 28;
              case 28:
                if (r2.wrap && r2.flags) {
                  for (; l2 < 32; ) {
                    if (0 === o2) break e;
                    o2--, u2 += n2[s2++] << l2, l2 += 8;
                  }
                  if (u2 !== (4294967295 & r2.total)) {
                    e2.msg = "incorrect length check", r2.mode = 30;
                    break;
                  }
                  l2 = u2 = 0;
                }
                r2.mode = 29;
              case 29:
                x = 1;
                break e;
              case 30:
                x = -3;
                break e;
              case 31:
                return -4;
              case 32:
              default:
                return U;
            }
            return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, (r2.wsize || c2 !== e2.avail_out && r2.mode < 30 && (r2.mode < 27 || 4 !== t2)) && Z(e2, e2.output, e2.next_out, c2 - e2.avail_out) ? (r2.mode = 31, -4) : (f2 -= e2.avail_in, c2 -= e2.avail_out, e2.total_in += f2, e2.total_out += c2, r2.total += c2, r2.wrap && c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, e2.next_out - c2) : O(r2.check, i2, c2, e2.next_out - c2)), e2.data_type = r2.bits + (r2.last ? 64 : 0) + (12 === r2.mode ? 128 : 0) + (20 === r2.mode || 15 === r2.mode ? 256 : 0), (0 == f2 && 0 === c2 || 4 === t2) && x === N && (x = -5), x);
          }, r.inflateEnd = function(e2) {
            if (!e2 || !e2.state) return U;
            var t2 = e2.state;
            return t2.window && (t2.window = null), e2.state = null, N;
          }, r.inflateGetHeader = function(e2, t2) {
            var r2;
            return e2 && e2.state ? 0 == (2 & (r2 = e2.state).wrap) ? U : ((r2.head = t2).done = false, N) : U;
          }, r.inflateSetDictionary = function(e2, t2) {
            var r2, n2 = t2.length;
            return e2 && e2.state ? 0 !== (r2 = e2.state).wrap && 11 !== r2.mode ? U : 11 === r2.mode && O(1, t2, n2, 0) !== r2.check ? -3 : Z(e2, t2, n2, n2) ? (r2.mode = 31, -4) : (r2.havedict = 1, N) : U;
          }, r.inflateInfo = "pako inflate (from Nodeca project)";
        }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e, t, r) {
          "use strict";
          var D = e("../utils/common"), F = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
          t.exports = function(e2, t2, r2, n, i, s, a, o) {
            var h, u, l, f, c, d, p, m, _, g = o.bits, b = 0, v = 0, y = 0, w = 0, k = 0, x = 0, S = 0, z = 0, C = 0, E = 0, A = null, I = 0, O = new D.Buf16(16), B = new D.Buf16(16), R = null, T = 0;
            for (b = 0; b <= 15; b++) O[b] = 0;
            for (v = 0; v < n; v++) O[t2[r2 + v]]++;
            for (k = g, w = 15; 1 <= w && 0 === O[w]; w--) ;
            if (w < k && (k = w), 0 === w) return i[s++] = 20971520, i[s++] = 20971520, o.bits = 1, 0;
            for (y = 1; y < w && 0 === O[y]; y++) ;
            for (k < y && (k = y), b = z = 1; b <= 15; b++) if (z <<= 1, (z -= O[b]) < 0) return -1;
            if (0 < z && (0 === e2 || 1 !== w)) return -1;
            for (B[1] = 0, b = 1; b < 15; b++) B[b + 1] = B[b] + O[b];
            for (v = 0; v < n; v++) 0 !== t2[r2 + v] && (a[B[t2[r2 + v]]++] = v);
            if (d = 0 === e2 ? (A = R = a, 19) : 1 === e2 ? (A = F, I -= 257, R = N, T -= 257, 256) : (A = U, R = P, -1), b = y, c = s, S = v = E = 0, l = -1, f = (C = 1 << (x = k)) - 1, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
            for (; ; ) {
              for (p = b - S, _ = a[v] < d ? (m = 0, a[v]) : a[v] > d ? (m = R[T + a[v]], A[I + a[v]]) : (m = 96, 0), h = 1 << b - S, y = u = 1 << x; i[c + (E >> S) + (u -= h)] = p << 24 | m << 16 | _ | 0, 0 !== u; ) ;
              for (h = 1 << b - 1; E & h; ) h >>= 1;
              if (0 !== h ? (E &= h - 1, E += h) : E = 0, v++, 0 == --O[b]) {
                if (b === w) break;
                b = t2[r2 + a[v]];
              }
              if (k < b && (E & f) !== l) {
                for (0 === S && (S = k), c += y, z = 1 << (x = b - S); x + S < w && !((z -= O[x + S]) <= 0); ) x++, z <<= 1;
                if (C += 1 << x, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
                i[l = E & f] = k << 24 | x << 16 | c - s | 0;
              }
            }
            return 0 !== E && (i[c + E] = b - S << 24 | 64 << 16 | 0), o.bits = k, 0;
          };
        }, { "../utils/common": 41 }], 51: [function(e, t, r) {
          "use strict";
          t.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
        }, {}], 52: [function(e, t, r) {
          "use strict";
          var i = e("../utils/common"), o = 0, h = 1;
          function n(e2) {
            for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
          }
          var s = 0, a = 29, u = 256, l = u + 1 + a, f = 30, c = 19, _ = 2 * l + 1, g = 15, d = 16, p = 7, m = 256, b = 16, v = 17, y = 18, w = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z = new Array(2 * (l + 2));
          n(z);
          var C = new Array(2 * f);
          n(C);
          var E = new Array(512);
          n(E);
          var A = new Array(256);
          n(A);
          var I = new Array(a);
          n(I);
          var O, B, R, T = new Array(f);
          function D(e2, t2, r2, n2, i2) {
            this.static_tree = e2, this.extra_bits = t2, this.extra_base = r2, this.elems = n2, this.max_length = i2, this.has_stree = e2 && e2.length;
          }
          function F(e2, t2) {
            this.dyn_tree = e2, this.max_code = 0, this.stat_desc = t2;
          }
          function N(e2) {
            return e2 < 256 ? E[e2] : E[256 + (e2 >>> 7)];
          }
          function U(e2, t2) {
            e2.pending_buf[e2.pending++] = 255 & t2, e2.pending_buf[e2.pending++] = t2 >>> 8 & 255;
          }
          function P(e2, t2, r2) {
            e2.bi_valid > d - r2 ? (e2.bi_buf |= t2 << e2.bi_valid & 65535, U(e2, e2.bi_buf), e2.bi_buf = t2 >> d - e2.bi_valid, e2.bi_valid += r2 - d) : (e2.bi_buf |= t2 << e2.bi_valid & 65535, e2.bi_valid += r2);
          }
          function L(e2, t2, r2) {
            P(e2, r2[2 * t2], r2[2 * t2 + 1]);
          }
          function j(e2, t2) {
            for (var r2 = 0; r2 |= 1 & e2, e2 >>>= 1, r2 <<= 1, 0 < --t2; ) ;
            return r2 >>> 1;
          }
          function Z(e2, t2, r2) {
            var n2, i2, s2 = new Array(g + 1), a2 = 0;
            for (n2 = 1; n2 <= g; n2++) s2[n2] = a2 = a2 + r2[n2 - 1] << 1;
            for (i2 = 0; i2 <= t2; i2++) {
              var o2 = e2[2 * i2 + 1];
              0 !== o2 && (e2[2 * i2] = j(s2[o2]++, o2));
            }
          }
          function W(e2) {
            var t2;
            for (t2 = 0; t2 < l; t2++) e2.dyn_ltree[2 * t2] = 0;
            for (t2 = 0; t2 < f; t2++) e2.dyn_dtree[2 * t2] = 0;
            for (t2 = 0; t2 < c; t2++) e2.bl_tree[2 * t2] = 0;
            e2.dyn_ltree[2 * m] = 1, e2.opt_len = e2.static_len = 0, e2.last_lit = e2.matches = 0;
          }
          function M(e2) {
            8 < e2.bi_valid ? U(e2, e2.bi_buf) : 0 < e2.bi_valid && (e2.pending_buf[e2.pending++] = e2.bi_buf), e2.bi_buf = 0, e2.bi_valid = 0;
          }
          function H(e2, t2, r2, n2) {
            var i2 = 2 * t2, s2 = 2 * r2;
            return e2[i2] < e2[s2] || e2[i2] === e2[s2] && n2[t2] <= n2[r2];
          }
          function G(e2, t2, r2) {
            for (var n2 = e2.heap[r2], i2 = r2 << 1; i2 <= e2.heap_len && (i2 < e2.heap_len && H(t2, e2.heap[i2 + 1], e2.heap[i2], e2.depth) && i2++, !H(t2, n2, e2.heap[i2], e2.depth)); ) e2.heap[r2] = e2.heap[i2], r2 = i2, i2 <<= 1;
            e2.heap[r2] = n2;
          }
          function K(e2, t2, r2) {
            var n2, i2, s2, a2, o2 = 0;
            if (0 !== e2.last_lit) for (; n2 = e2.pending_buf[e2.d_buf + 2 * o2] << 8 | e2.pending_buf[e2.d_buf + 2 * o2 + 1], i2 = e2.pending_buf[e2.l_buf + o2], o2++, 0 === n2 ? L(e2, i2, t2) : (L(e2, (s2 = A[i2]) + u + 1, t2), 0 !== (a2 = w[s2]) && P(e2, i2 -= I[s2], a2), L(e2, s2 = N(--n2), r2), 0 !== (a2 = k[s2]) && P(e2, n2 -= T[s2], a2)), o2 < e2.last_lit; ) ;
            L(e2, m, t2);
          }
          function Y(e2, t2) {
            var r2, n2, i2, s2 = t2.dyn_tree, a2 = t2.stat_desc.static_tree, o2 = t2.stat_desc.has_stree, h2 = t2.stat_desc.elems, u2 = -1;
            for (e2.heap_len = 0, e2.heap_max = _, r2 = 0; r2 < h2; r2++) 0 !== s2[2 * r2] ? (e2.heap[++e2.heap_len] = u2 = r2, e2.depth[r2] = 0) : s2[2 * r2 + 1] = 0;
            for (; e2.heap_len < 2; ) s2[2 * (i2 = e2.heap[++e2.heap_len] = u2 < 2 ? ++u2 : 0)] = 1, e2.depth[i2] = 0, e2.opt_len--, o2 && (e2.static_len -= a2[2 * i2 + 1]);
            for (t2.max_code = u2, r2 = e2.heap_len >> 1; 1 <= r2; r2--) G(e2, s2, r2);
            for (i2 = h2; r2 = e2.heap[1], e2.heap[1] = e2.heap[e2.heap_len--], G(e2, s2, 1), n2 = e2.heap[1], e2.heap[--e2.heap_max] = r2, e2.heap[--e2.heap_max] = n2, s2[2 * i2] = s2[2 * r2] + s2[2 * n2], e2.depth[i2] = (e2.depth[r2] >= e2.depth[n2] ? e2.depth[r2] : e2.depth[n2]) + 1, s2[2 * r2 + 1] = s2[2 * n2 + 1] = i2, e2.heap[1] = i2++, G(e2, s2, 1), 2 <= e2.heap_len; ) ;
            e2.heap[--e2.heap_max] = e2.heap[1], (function(e3, t3) {
              var r3, n3, i3, s3, a3, o3, h3 = t3.dyn_tree, u3 = t3.max_code, l2 = t3.stat_desc.static_tree, f2 = t3.stat_desc.has_stree, c2 = t3.stat_desc.extra_bits, d2 = t3.stat_desc.extra_base, p2 = t3.stat_desc.max_length, m2 = 0;
              for (s3 = 0; s3 <= g; s3++) e3.bl_count[s3] = 0;
              for (h3[2 * e3.heap[e3.heap_max] + 1] = 0, r3 = e3.heap_max + 1; r3 < _; r3++) p2 < (s3 = h3[2 * h3[2 * (n3 = e3.heap[r3]) + 1] + 1] + 1) && (s3 = p2, m2++), h3[2 * n3 + 1] = s3, u3 < n3 || (e3.bl_count[s3]++, a3 = 0, d2 <= n3 && (a3 = c2[n3 - d2]), o3 = h3[2 * n3], e3.opt_len += o3 * (s3 + a3), f2 && (e3.static_len += o3 * (l2[2 * n3 + 1] + a3)));
              if (0 !== m2) {
                do {
                  for (s3 = p2 - 1; 0 === e3.bl_count[s3]; ) s3--;
                  e3.bl_count[s3]--, e3.bl_count[s3 + 1] += 2, e3.bl_count[p2]--, m2 -= 2;
                } while (0 < m2);
                for (s3 = p2; 0 !== s3; s3--) for (n3 = e3.bl_count[s3]; 0 !== n3; ) u3 < (i3 = e3.heap[--r3]) || (h3[2 * i3 + 1] !== s3 && (e3.opt_len += (s3 - h3[2 * i3 + 1]) * h3[2 * i3], h3[2 * i3 + 1] = s3), n3--);
              }
            })(e2, t2), Z(s2, u2, e2.bl_count);
          }
          function X(e2, t2, r2) {
            var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
            for (0 === a2 && (h2 = 138, u2 = 3), t2[2 * (r2 + 1) + 1] = 65535, n2 = 0; n2 <= r2; n2++) i2 = a2, a2 = t2[2 * (n2 + 1) + 1], ++o2 < h2 && i2 === a2 || (o2 < u2 ? e2.bl_tree[2 * i2] += o2 : 0 !== i2 ? (i2 !== s2 && e2.bl_tree[2 * i2]++, e2.bl_tree[2 * b]++) : o2 <= 10 ? e2.bl_tree[2 * v]++ : e2.bl_tree[2 * y]++, s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4));
          }
          function V(e2, t2, r2) {
            var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
            for (0 === a2 && (h2 = 138, u2 = 3), n2 = 0; n2 <= r2; n2++) if (i2 = a2, a2 = t2[2 * (n2 + 1) + 1], !(++o2 < h2 && i2 === a2)) {
              if (o2 < u2) for (; L(e2, i2, e2.bl_tree), 0 != --o2; ) ;
              else 0 !== i2 ? (i2 !== s2 && (L(e2, i2, e2.bl_tree), o2--), L(e2, b, e2.bl_tree), P(e2, o2 - 3, 2)) : o2 <= 10 ? (L(e2, v, e2.bl_tree), P(e2, o2 - 3, 3)) : (L(e2, y, e2.bl_tree), P(e2, o2 - 11, 7));
              s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4);
            }
          }
          n(T);
          var q = false;
          function J(e2, t2, r2, n2) {
            P(e2, (s << 1) + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
              M(e3), n3 && (U(e3, r3), U(e3, ~r3)), i.arraySet(e3.pending_buf, e3.window, t3, r3, e3.pending), e3.pending += r3;
            })(e2, t2, r2, true);
          }
          r._tr_init = function(e2) {
            q || ((function() {
              var e3, t2, r2, n2, i2, s2 = new Array(g + 1);
              for (n2 = r2 = 0; n2 < a - 1; n2++) for (I[n2] = r2, e3 = 0; e3 < 1 << w[n2]; e3++) A[r2++] = n2;
              for (A[r2 - 1] = n2, n2 = i2 = 0; n2 < 16; n2++) for (T[n2] = i2, e3 = 0; e3 < 1 << k[n2]; e3++) E[i2++] = n2;
              for (i2 >>= 7; n2 < f; n2++) for (T[n2] = i2 << 7, e3 = 0; e3 < 1 << k[n2] - 7; e3++) E[256 + i2++] = n2;
              for (t2 = 0; t2 <= g; t2++) s2[t2] = 0;
              for (e3 = 0; e3 <= 143; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
              for (; e3 <= 255; ) z[2 * e3 + 1] = 9, e3++, s2[9]++;
              for (; e3 <= 279; ) z[2 * e3 + 1] = 7, e3++, s2[7]++;
              for (; e3 <= 287; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
              for (Z(z, l + 1, s2), e3 = 0; e3 < f; e3++) C[2 * e3 + 1] = 5, C[2 * e3] = j(e3, 5);
              O = new D(z, w, u + 1, l, g), B = new D(C, k, 0, f, g), R = new D(new Array(0), x, 0, c, p);
            })(), q = true), e2.l_desc = new F(e2.dyn_ltree, O), e2.d_desc = new F(e2.dyn_dtree, B), e2.bl_desc = new F(e2.bl_tree, R), e2.bi_buf = 0, e2.bi_valid = 0, W(e2);
          }, r._tr_stored_block = J, r._tr_flush_block = function(e2, t2, r2, n2) {
            var i2, s2, a2 = 0;
            0 < e2.level ? (2 === e2.strm.data_type && (e2.strm.data_type = (function(e3) {
              var t3, r3 = 4093624447;
              for (t3 = 0; t3 <= 31; t3++, r3 >>>= 1) if (1 & r3 && 0 !== e3.dyn_ltree[2 * t3]) return o;
              if (0 !== e3.dyn_ltree[18] || 0 !== e3.dyn_ltree[20] || 0 !== e3.dyn_ltree[26]) return h;
              for (t3 = 32; t3 < u; t3++) if (0 !== e3.dyn_ltree[2 * t3]) return h;
              return o;
            })(e2)), Y(e2, e2.l_desc), Y(e2, e2.d_desc), a2 = (function(e3) {
              var t3;
              for (X(e3, e3.dyn_ltree, e3.l_desc.max_code), X(e3, e3.dyn_dtree, e3.d_desc.max_code), Y(e3, e3.bl_desc), t3 = c - 1; 3 <= t3 && 0 === e3.bl_tree[2 * S[t3] + 1]; t3--) ;
              return e3.opt_len += 3 * (t3 + 1) + 5 + 5 + 4, t3;
            })(e2), i2 = e2.opt_len + 3 + 7 >>> 3, (s2 = e2.static_len + 3 + 7 >>> 3) <= i2 && (i2 = s2)) : i2 = s2 = r2 + 5, r2 + 4 <= i2 && -1 !== t2 ? J(e2, t2, r2, n2) : 4 === e2.strategy || s2 === i2 ? (P(e2, 2 + (n2 ? 1 : 0), 3), K(e2, z, C)) : (P(e2, 4 + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
              var i3;
              for (P(e3, t3 - 257, 5), P(e3, r3 - 1, 5), P(e3, n3 - 4, 4), i3 = 0; i3 < n3; i3++) P(e3, e3.bl_tree[2 * S[i3] + 1], 3);
              V(e3, e3.dyn_ltree, t3 - 1), V(e3, e3.dyn_dtree, r3 - 1);
            })(e2, e2.l_desc.max_code + 1, e2.d_desc.max_code + 1, a2 + 1), K(e2, e2.dyn_ltree, e2.dyn_dtree)), W(e2), n2 && M(e2);
          }, r._tr_tally = function(e2, t2, r2) {
            return e2.pending_buf[e2.d_buf + 2 * e2.last_lit] = t2 >>> 8 & 255, e2.pending_buf[e2.d_buf + 2 * e2.last_lit + 1] = 255 & t2, e2.pending_buf[e2.l_buf + e2.last_lit] = 255 & r2, e2.last_lit++, 0 === t2 ? e2.dyn_ltree[2 * r2]++ : (e2.matches++, t2--, e2.dyn_ltree[2 * (A[r2] + u + 1)]++, e2.dyn_dtree[2 * N(t2)]++), e2.last_lit === e2.lit_bufsize - 1;
          }, r._tr_align = function(e2) {
            P(e2, 2, 3), L(e2, m, z), (function(e3) {
              16 === e3.bi_valid ? (U(e3, e3.bi_buf), e3.bi_buf = 0, e3.bi_valid = 0) : 8 <= e3.bi_valid && (e3.pending_buf[e3.pending++] = 255 & e3.bi_buf, e3.bi_buf >>= 8, e3.bi_valid -= 8);
            })(e2);
          };
        }, { "../utils/common": 41 }], 53: [function(e, t, r) {
          "use strict";
          t.exports = function() {
            this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
          };
        }, {}], 54: [function(e, t, r) {
          (function(e2) {
            !(function(r2, n) {
              "use strict";
              if (!r2.setImmediate) {
                var i, s, t2, a, o = 1, h = {}, u = false, l = r2.document, e3 = Object.getPrototypeOf && Object.getPrototypeOf(r2);
                e3 = e3 && e3.setTimeout ? e3 : r2, i = "[object process]" === {}.toString.call(r2.process) ? function(e4) {
                  process.nextTick(function() {
                    c(e4);
                  });
                } : (function() {
                  if (r2.postMessage && !r2.importScripts) {
                    var e4 = true, t3 = r2.onmessage;
                    return r2.onmessage = function() {
                      e4 = false;
                    }, r2.postMessage("", "*"), r2.onmessage = t3, e4;
                  }
                })() ? (a = "setImmediate$" + Math.random() + "$", r2.addEventListener ? r2.addEventListener("message", d, false) : r2.attachEvent("onmessage", d), function(e4) {
                  r2.postMessage(a + e4, "*");
                }) : r2.MessageChannel ? ((t2 = new MessageChannel()).port1.onmessage = function(e4) {
                  c(e4.data);
                }, function(e4) {
                  t2.port2.postMessage(e4);
                }) : l && "onreadystatechange" in l.createElement("script") ? (s = l.documentElement, function(e4) {
                  var t3 = l.createElement("script");
                  t3.onreadystatechange = function() {
                    c(e4), t3.onreadystatechange = null, s.removeChild(t3), t3 = null;
                  }, s.appendChild(t3);
                }) : function(e4) {
                  setTimeout(c, 0, e4);
                }, e3.setImmediate = function(e4) {
                  "function" != typeof e4 && (e4 = new Function("" + e4));
                  for (var t3 = new Array(arguments.length - 1), r3 = 0; r3 < t3.length; r3++) t3[r3] = arguments[r3 + 1];
                  var n2 = { callback: e4, args: t3 };
                  return h[o] = n2, i(o), o++;
                }, e3.clearImmediate = f;
              }
              function f(e4) {
                delete h[e4];
              }
              function c(e4) {
                if (u) setTimeout(c, 0, e4);
                else {
                  var t3 = h[e4];
                  if (t3) {
                    u = true;
                    try {
                      !(function(e5) {
                        var t4 = e5.callback, r3 = e5.args;
                        switch (r3.length) {
                          case 0:
                            t4();
                            break;
                          case 1:
                            t4(r3[0]);
                            break;
                          case 2:
                            t4(r3[0], r3[1]);
                            break;
                          case 3:
                            t4(r3[0], r3[1], r3[2]);
                            break;
                          default:
                            t4.apply(n, r3);
                        }
                      })(t3);
                    } finally {
                      f(e4), u = false;
                    }
                  }
                }
              }
              function d(e4) {
                e4.source === r2 && "string" == typeof e4.data && 0 === e4.data.indexOf(a) && c(+e4.data.slice(a.length));
              }
            })("undefined" == typeof self ? void 0 === e2 ? this : e2 : self);
          }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
        }, {}] }, {}, [10])(10);
      });
    }
  });

  // node_modules/@jvmr/pptx-to-html/dist/XmlHelper-AJVQT6ZQ.js
  var XmlHelper_AJVQT6ZQ_exports = {};
  __export(XmlHelper_AJVQT6ZQ_exports, {
    XmlHelper: () => XmlHelper
  });
  var init_XmlHelper_AJVQT6ZQ = __esm({
    "node_modules/@jvmr/pptx-to-html/dist/XmlHelper-AJVQT6ZQ.js"() {
      init_chunk_KAPAPPOM();
    }
  });

  // node_modules/@jvmr/pptx-to-html/dist/index.js
  function getParagraphText(p) {
    let out = "";
    for (const child of Array.from(p.childNodes)) {
      if (!(child instanceof Element)) {
        continue;
      }
      const ln = child.localName;
      if (ln === "r") {
        const t = child.getElementsByTagNameNS("*", "t")[0]?.textContent ?? "";
        out += t;
      } else if (ln === "br") {
        out += "\n";
      } else if (ln === "fld") {
        const runs = child.getElementsByTagNameNS("*", "r");
        for (const r of Array.from(runs)) {
          const t = r.getElementsByTagNameNS("*", "t")[0]?.textContent ?? "";
          out += t;
        }
      } else if (ln === "tab") {
        out += "	";
      }
    }
    return out;
  }
  function mapAutoNumToCss(typ) {
    const t = typ.toLowerCase();
    if (t.includes("alphauc")) return "upper-alpha";
    if (t.includes("alphalc")) return "lower-alpha";
    if (t.includes("romanu")) return "upper-roman";
    if (t.includes("romanl")) return "lower-roman";
    return "decimal";
  }
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function renderTextElement(el) {
    const nf = (n, fb = 0) => Number.isFinite(n) ? n : fb;
    const x = nf(el.position?.x, 0) / 9525;
    const y = nf(el.position?.y, 0) / 9525;
    const w = nf(el.size?.width, 0) / 9525;
    const h = nf(el.size?.height, 0) / 9525;
    const pad = el.padding || { left: 0, top: 0, right: 0, bottom: 0 };
    const textAlign = el.align?.horizontal || "left";
    const justify = el.align?.vertical === "middle" ? "center" : el.align?.vertical === "bottom" ? "flex-end" : "flex-start";
    const inner = el.html ? el.html : escape(el.content);
    return `<div style="
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${w}px;
    height: ${h}px;
    display: flex;
    flex-direction: column;
    justify-content: ${justify};
    text-align: ${textAlign};
    padding: ${pad.top}px ${pad.right}px ${pad.bottom}px ${pad.left}px;
    font-family: ${el.font?.name || "Arial"};
    font-size: ${nf(Number(el.font?.size), 12)}pt;
    color: ${el.font?.color || "#000"};
    overflow: hidden;
    white-space: pre-wrap;
  ">${inner}</div>`;
  }
  function escape(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function renderImageElement(el) {
    const nf = (n, fb = 0) => Number.isFinite(n) ? n : fb;
    return `<img src="${el.src}" style="
    position: absolute;
    left: ${nf(el.position?.x, 0) / 9525}px;
    top: ${nf(el.position?.y, 0) / 9525}px;
    width: ${nf(el.size?.width, 0) / 9525}px;
    height: ${nf(el.size?.height, 0) / 9525}px;
    object-fit: cover;
  " />`;
  }
  function getSvgPathForShape(type) {
    switch (type) {
      // ▸ Basic Arrows
      case "rightArrow":
      case "arrow":
        return "POLYGON 0,25 70,25 70,0 100,50 70,100 70,75 0,75";
      case "leftArrow":
        return "POLYGON 100,25 30,25 30,0 0,50 30,100 30,75 100,75";
      case "leftRightArrow":
        return "POLYGON 0,50 30,0 30,25 70,25 70,0 100,50 70,100 70,75 30,75 30,100";
      case "triangle":
        return "POLYGON 50,0 100,100 0,100";
      case "star5":
        return "POLYGON 50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35";
      case "cloud":
        return "PATH M20,60 C10,60 10,40 25,40 C30,20 50,20 55,35 C70,30 80,40 80,50 C90,50 90,70 75,70 H25 Z";
      // ▸ Straight connector (line)
      case "straightConnector1":
        return "LINE_ARROW 0,50 100,50";
      // ▸ Bent connectors
      case "bentConnector2":
        return "POLYLINE 0,50 50,50 50,100";
      case "bentConnector3":
        return "POLYLINE_ARROW 0,50 40,50 40,70 100,70";
      case "bentConnector4":
        return "POLYLINE 0,30 30,30 30,70 70,70 70,100";
      case "bentConnector5":
        return "POLYLINE 0,20 30,20 30,50 60,50 60,80 100,80";
      // ▸ Curved connectors
      case "curvedConnector2":
        return "PATH M0,50 Q50,0 100,50";
      case "curvedConnector3":
        return "PATH M0,50 Q25,0 50,50 Q75,100 100,50";
      case "curvedConnector4":
        return "PATH M0,40 Q20,0 40,40 Q60,80 80,40 Q90,20 100,40";
      case "curvedConnector5":
        return "PATH M0,50 Q20,20 40,50 Q60,80 80,50 Q90,40 100,50";
      // ▸ Notched, bent, and curved arrows
      case "bentArrow":
        return "POLYGON 0,0 70,0 70,30 100,30 50,100 50,30 0,30";
      case "notchedRightArrow":
        return "POLYGON 0,20 60,20 60,0 100,50 60,100 60,80 0,80";
      case "curvedRightArrow":
        return "PATH M0,50 Q50,0 100,50 Q50,100 0,50 Z";
      // Default fallback (rectangular shape)
      default:
        return "POLYGON 0,0 100,0 100,100 0,100";
    }
  }
  function renderShapeElement(el, options = {}) {
    const nf = (n, fb = 0) => Number.isFinite(n) ? n : fb;
    const x = nf(el.position?.x, 0) / 9525;
    const y = nf(el.position?.y, 0) / 9525;
    const width = nf(el.size?.width, 0) / 9525;
    const height = nf(el.size?.height, 0) / 9525;
    const rotation = el.rotationDeg && !isNaN(el.rotationDeg) ? el.rotationDeg : 0;
    const rotationStyle = rotation ? `transform: rotate(${rotation}deg); transform-origin: center;` : "";
    const style = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${width}px;
    height: ${height}px;
    ${rotationStyle}
  `;
    if (el.shapeType === "rect") {
      return `<div style="${style}
      background-color: ${el.fillColor};
      border: 1px solid ${el.borderColor ?? "transparent"};
      box-sizing: border-box;"></div>`;
    }
    if (el.shapeType === "ellipse") {
      return `<div style="${style}
      background-color: ${el.fillColor};
      border: 1px solid ${el.borderColor ?? "transparent"};
      border-radius: 50%;
      box-sizing: border-box;"></div>`;
    }
    if (el.shapeType === "roundRect") {
      return `<div style="${style}
      background-color: ${el.fillColor};
      border: 1px solid ${el.borderColor ?? "transparent"};
      border-radius: 16px;
      box-sizing: border-box;"></div>`;
    }
    const raw = getSvgPathForShape(el.shapeType);
    return shapeSvg(
      x,
      y,
      width,
      height,
      el.fillColor,
      el.borderColor,
      raw,
      el.strokeWidth && Number.isFinite(el.strokeWidth) ? el.strokeWidth : void 0,
      rotation,
      el.headEnd,
      el.tailEnd,
      options.scaleStrokes === true
    );
  }
  function shapeSvg(x, y, width, height, fill, stroke, raw, strokeWidthPx, rotationDeg, headEnd, tailEnd, scaleStrokes) {
    const strokeColorOpt = resolveStrokeColor(stroke, fill);
    const [typeRaw, ...rest] = raw.trim().split(/\s+/);
    const type = typeRaw.toUpperCase().replace("_ARROW", "");
    const isArrow = typeRaw.endsWith("_ARROW");
    const data = rest.join(" ");
    const svgHeight = height;
    const svgWidth = width;
    const sw = strokeWidthPx && strokeWidthPx > 0 ? strokeWidthPx : 2;
    const rotationStyle = rotationDeg ? `transform: rotate(${rotationDeg}deg); transform-origin: center;` : "";
    const commonStyle = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${svgWidth}px;
    height: ${svgHeight}px;
    ${rotationStyle}
  `;
    switch (type) {
      case "PATH": {
        const defs = buildMarkerDefs(headEnd, tailEnd, strokeColorOpt || "#000");
        const markerStartAttr = defs.startId ? `marker-start="url(#${defs.startId})"` : "";
        const markerEndAttr = defs.endId ? `marker-end="url(#${defs.endId})"` : "";
        return `<svg viewBox="0 0 100 100" style="${commonStyle}" overflow="visible">
        ${defs.defs}
        <path d="${data}" fill="none" stroke="${strokeColorOpt || "#000"}" stroke-width="${sw}" ${scaleStrokes ? "" : 'vector-effect="non-scaling-stroke"'} ${markerStartAttr} ${markerEndAttr} />
      </svg>`;
      }
      case "POLYLINE":
      case "LINE": {
        const coords = data.split(/[\s,]+/).map((v) => parseFloat(v)).filter((v) => !isNaN(v));
        if (coords.length < 4 || coords.length % 2 !== 0) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn(`[pptx-to-html] Invalid POLYLINE/LINE shape data: "${data}"`);
          }
          return "";
        }
        const pointPairs = [];
        for (let i = 0; i < coords.length; i += 2) {
          pointPairs.push(`${coords[i]},${coords[i + 1]}`);
        }
        const effectiveWidth = width > 0 ? width : Math.max(sw * 2, 2);
        const effectiveHeight = height > 0 ? height : Math.max(sw * 2, 2);
        const defs = buildMarkerDefs(headEnd, tailEnd ?? (isArrow ? { type: "triangle", w: "med", len: "med" } : void 0), strokeColorOpt || "#000");
        const markerStartAttr = defs.startId ? `marker-start="url(#${defs.startId})"` : "";
        const markerEndAttr = defs.endId ? `marker-end="url(#${defs.endId})"` : "";
        const scaledPairs = [];
        for (let i = 0; i < coords.length; i += 2) {
          const px = coords[i] / 100 * effectiveWidth;
          const py = coords[i + 1] / 100 * effectiveHeight;
          scaledPairs.push(`${px},${py}`);
        }
        const scaledPoints = scaledPairs.join(" ");
        return `
        <svg viewBox="0 0 ${effectiveWidth} ${effectiveHeight}"
            style="
              position: absolute;
              left: ${x}px;
              top: ${y}px;
              width: ${effectiveWidth}px;
              height: ${effectiveHeight}px;
              ${rotationStyle}
            "
            overflow="visible">
          ${defs.defs}
          <polyline points="${scaledPoints}"
                    fill="none"
                    stroke="${strokeColorOpt || "#000"}"
                    stroke-width="${sw}"
                    ${scaleStrokes ? "" : 'vector-effect="non-scaling-stroke"'}
                    ${markerStartAttr} ${markerEndAttr} />
        </svg>`;
      }
      case "POLYGON":
      default:
        return `<svg viewBox="0 0 100 100" style="${commonStyle}">
        <polygon points="${data}" fill="${fill}" stroke="${strokeColorOpt ?? "none"}" stroke-width="${sw}" ${scaleStrokes ? "" : 'vector-effect="non-scaling-stroke"'} />
      </svg>`;
    }
  }
  function buildMarkerDefs(headEnd, tailEnd, color) {
    const parts = [];
    let startId;
    let endId;
    if (headEnd && headEnd.type && headEnd.type !== "none") {
      startId = `mstart-${Math.random().toString(36).slice(2, 8)}`;
      parts.push(markerDef(startId, headEnd, color));
    }
    if (tailEnd && tailEnd.type && tailEnd.type !== "none") {
      endId = `mend-${Math.random().toString(36).slice(2, 8)}`;
      parts.push(markerDef(endId, tailEnd, color));
    }
    return { defs: parts.length ? `<defs>${parts.join("\n")}</defs>` : "", startId, endId };
  }
  function markerDef(id, spec, color) {
    const sizeFactor = mapLen(spec.len);
    const base = 4 * sizeFactor;
    const refX = base;
    const refY = base / 2;
    switch ((spec.type || "triangle").toLowerCase()) {
      case "diamond":
        return `<marker id="${id}" markerUnits="strokeWidth" markerWidth="${base}" markerHeight="${base}"
                      refX="${refX}" refY="${refY}" orient="auto-start-reverse">
                <polygon points="${base / 2},0 ${base},${base / 2} ${base / 2},${base} 0,${base / 2}" fill="${color}" />
              </marker>`;
      case "oval":
        return `<marker id="${id}" markerUnits="strokeWidth" markerWidth="${base}" markerHeight="${base}"
                      refX="${refX}" refY="${refY}" orient="auto-start-reverse">
                <circle cx="${base / 2}" cy="${base / 2}" r="${base / 2}" fill="${color}" />
              </marker>`;
      case "stealth":
        return `<marker id="${id}" markerUnits="strokeWidth" markerWidth="${base}" markerHeight="${base}"
                      refX="${refX}" refY="${refY}" orient="auto-start-reverse">
                <polygon points="${base},${base / 2} 0,0 0,${base}" fill="${color}" />
              </marker>`;
      case "arrow":
      case "triangle":
      default:
        return `<marker id="${id}" markerUnits="strokeWidth" markerWidth="${base}" markerHeight="${base}"
                      refX="${refX}" refY="${refY}" orient="auto-start-reverse">
                <polygon points="0,0 ${base},${base / 2} 0,${base}" fill="${color}" />
              </marker>`;
    }
  }
  function mapLen(len) {
    switch ((len || "med").toLowerCase()) {
      case "sm":
      case "small":
        return 1.5;
      case "lg":
      case "large":
        return 2.5;
      case "med":
      case "medium":
      default:
        return 2;
    }
  }
  function resolveStrokeColor(stroke, fill) {
    if (stroke && stroke !== "transparent") return stroke;
    if (fill && fill !== "transparent") return fill;
    return void 0;
  }
  function renderTableElement(el) {
    const nf = (n, fb = 0) => Number.isFinite(n) ? n : fb;
    const x = nf(el.position?.x, 0) / 9525;
    const y = nf(el.position?.y, 0) / 9525;
    const width = nf(el.size?.width, 0) / 9525;
    const height = nf(el.size?.height, 0) / 9525;
    const colWidthsPx = el.columns.map((w) => nf(w, 0) / 9525);
    const colTotal = colWidthsPx.reduce((a, b) => a + b, 0) || 1;
    const cols = colWidthsPx.map((w) => `<col style="width:${w / colTotal * 100}%">`).join("");
    const tableBg = el.tableFillColor || el.style?.fills?.wholeTbl;
    let rowIndex = 0;
    const rowsHtml = el.rows.map((row) => {
      let colIndex = 0;
      const tds = row.cells.map((cell) => {
        const pad = cell.padding || { left: 6, top: 2, right: 6, bottom: 2 };
        const ta = cell.align?.horizontal || "left";
        const va = cell.align?.vertical || "top";
        const borderCss = computeCellBordersCSS(el, cell, rowIndex, colIndex);
        const { bg, fontColor, emphasize } = computeCellStyleFromTableStyle(el, rowIndex, colIndex);
        const isHeaderCol = emphasize;
        const style = `
            padding:${pad.top}px ${pad.right}px ${pad.bottom}px ${pad.left}px;
            text-align:${ta};
            vertical-align:${va === "middle" ? "middle" : va};
            ${cell.fillColor ? `background-color:${cell.fillColor};` : ""}
            ${!cell.fillColor && bg ? `background-color:${bg};` : ""}
            ${cell.font?.color ? `color:${cell.font.color};` : fontColor ? `color:${fontColor};` : ""}
            ${cell.font?.name ? `font-family:${cell.font.name};` : ""}
            ${cell.font?.size ? `font-size:${cell.font.size}pt;` : ""}
            ${borderCss}
            ${isHeaderCol ? "font-weight:600;" : ""}
            overflow:hidden; word-break: break-word; white-space: pre-wrap;`;
        const span = `${cell.colSpan ? ` colspan="${cell.colSpan}"` : ""}${cell.rowSpan ? ` rowspan="${cell.rowSpan}"` : ""}`;
        const content = escape2(cell.text).replace(/\n/g, "<br>");
        const html = `<td${span} style="${style}">${content}</td>`;
        colIndex += cell.colSpan || 1;
        return html;
      }).join("");
      const rowStyle = el.tableStyle?.firstRow && rowIndex === 0 ? ' style="font-weight:600;"' : "";
      const trHtml = `<tr${rowStyle}>${tds}</tr>`;
      rowIndex += 1;
      return trHtml;
    }).join("");
    return `<div style="position:absolute; left:${x}px; top:${y}px; width:${width}px; height:${height}px;">
    <table style="border-collapse:collapse; width:100%; height:100%; table-layout:fixed;${tableBg ? ` background-color:${tableBg};` : ""}">
      <colgroup>${cols}</colgroup>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>`;
  }
  function computeCellBordersCSS(el, cell, rowIndex, colIndex) {
    const css = [];
    const sides = ["top", "right", "bottom", "left"];
    const apply = (side, b) => {
      if (!b) return;
      const w = b.width ?? 1;
      const c = b.color ?? "#000";
      const st = b.style === "dashed" || b.style === "dotted" ? b.style : "solid";
      css.push(`border-${side}: ${Math.max(1, Math.round(w))}px ${st} ${c};`);
    };
    for (const s of sides) {
      const b = cell.borders?.[s];
      if (b) apply(s, b);
    }
    const tb = el.tableBorders || {};
    const lastRow = rowIndex === el.rows.length - 1;
    const lastCol = colIndex === el.columns.length - 1;
    if (!cell.borders?.top && rowIndex === 0) apply("top", tb.top);
    if (!cell.borders?.bottom && lastRow) apply("bottom", tb.bottom);
    if (!cell.borders?.left && colIndex === 0) apply("left", tb.left);
    if (!cell.borders?.right && lastCol) apply("right", tb.right);
    if (!cell.borders?.top && rowIndex > 0) apply("top", tb.insideH);
    if (!cell.borders?.left && colIndex > 0) apply("left", tb.insideV);
    return css.join(" ");
  }
  function escape2(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function computeCellStyleFromTableStyle(el, rowIndex, colIndex) {
    const lastRow = rowIndex === el.rows.length - 1;
    const lastCol = colIndex === el.columns.length - 1;
    const s = el.style || {};
    const fills = s.fills || {};
    const fontColors = s.fontColors || {};
    let emphasize = false;
    if (el.tableStyle?.firstRow && rowIndex === 0) {
      emphasize = true;
      return { bg: fills.firstRow || fills.wholeTbl || "#f0f0f0", fontColor: fontColors.firstRow || fontColors.wholeTbl, emphasize };
    }
    if (el.tableStyle?.lastRow && lastRow) {
      return { bg: fills.lastRow || fills.wholeTbl || "#f0f0f0", fontColor: fontColors.lastRow || fontColors.wholeTbl, emphasize };
    }
    if (el.tableStyle?.firstCol && colIndex === 0) {
      emphasize = true;
      return { bg: fills.firstCol || fills.wholeTbl || "#f0f0f0", fontColor: fontColors.firstCol || fontColors.wholeTbl, emphasize };
    }
    if (el.tableStyle?.lastCol && lastCol) {
      return { bg: fills.lastCol || fills.wholeTbl || "#f0f0f0", fontColor: fontColors.lastCol || fontColors.wholeTbl, emphasize };
    }
    if (el.tableStyle?.bandRow) {
      const baseIndex = el.tableStyle?.firstRow ? rowIndex - 1 : rowIndex;
      const band = baseIndex % 2 === 0 ? "band1H" : "band2H";
      return { bg: fills[band] || fills.wholeTbl || (rowIndex % 2 === 1 ? "#fafafa" : void 0), fontColor: fontColors[band] || fontColors.wholeTbl, emphasize };
    }
    if (el.tableStyle?.bandCol) {
      const band = colIndex % 2 === 0 ? "band1V" : "band2V";
      return { bg: fills[band] || fills.wholeTbl || (colIndex % 2 === 1 ? "#fafafa" : void 0), fontColor: fontColors[band] || fontColors.wholeTbl, emphasize };
    }
    return { bg: fills.wholeTbl, fontColor: fontColors.wholeTbl, emphasize };
  }
  function renderChartElement(el) {
    const nf = (n, fb = 0) => Number.isFinite(n) ? n : fb;
    const x = nf(el.position?.x, 0) / 9525;
    const y = nf(el.position?.y, 0) / 9525;
    const width = Math.max(1, nf(el.size?.width, 0) / 9525);
    const height = Math.max(1, nf(el.size?.height, 0) / 9525);
    const padding = 24;
    const palette = el.palette && el.palette.length > 0 ? el.palette : ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949"];
    let svg = "";
    if (el.chartType === "column" || el.chartType === "bar") {
      svg = renderBarLike(el, width, height, padding, palette);
    } else if (el.chartType === "line") {
      svg = renderLine(el, width, height, padding, palette);
    } else if (el.chartType === "area") {
      svg = renderArea(el, width, height, padding, palette);
    } else if (el.chartType === "pie") {
      svg = renderPie(el, width, height, palette);
    } else if (el.chartType === "scatter") {
      svg = renderScatter(el, width, height, padding, palette);
    }
    const title = el.title ? `<div style="position:absolute;left:${x}px;top:${y - 20}px;width:${width}px;text-align:center;font-weight:600;">${escape3(el.title)}</div>` : "";
    return `${title}<div style="position:absolute; left:${x}px; top:${y}px; width:${width}px; height:${height}px;">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${svg}
      </svg>
    </div>`;
  }
  function renderBarLike(el, width, height, pad, palette) {
    const catCount = el.categories.length || 1;
    const chartW = width - pad * 2;
    const chartH = height - pad * 2;
    const isHorizontal = el.chartType === "bar";
    const stacked = el.stackedMode && el.stackedMode !== "none";
    const percent = el.stackedMode === "percent";
    let maxVal = 1;
    if (stacked) {
      const sums = new Array(catCount).fill(0).map((_, i) => el.series.reduce((acc, s) => acc + ((s.values || [])[i] || 0), 0));
      maxVal = percent ? 1 : Math.max(1, ...sums);
    } else {
      let mv = 1;
      for (const s of el.series) {
        const vals = s.values || [];
        for (const v of vals) mv = Math.max(mv, v);
      }
      maxVal = mv;
    }
    const parts = [];
    if (isHorizontal) {
      parts.push(`<line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
      parts.push(`<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
      const ticks = computeTicks(0, maxVal, 4);
      ticks.forEach((t) => {
        const tx = pad + t / maxVal * chartW;
        const ty = height - pad;
        parts.push(`<line x1="${tx}" y1="${ty}" x2="${tx}" y2="${ty + 4}" stroke="#999" stroke-width="1" />`);
        parts.push(`<text x="${tx}" y="${ty + 16}" text-anchor="middle" font-size="10" fill="#666">${formatNumber(t, percent ? "0%" : el.valueFormat)}</text>`);
      });
    } else {
      parts.push(`<line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
      parts.push(`<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
      const ticks = computeTicks(0, maxVal, 4);
      ticks.forEach((t) => {
        const ty = height - pad - t / maxVal * chartH;
        parts.push(`<line x1="${pad - 4}" y1="${ty}" x2="${pad}" y2="${ty}" stroke="#999" stroke-width="1" />`);
        parts.push(`<text x="${pad - 6}" y="${ty + 3}" text-anchor="end" font-size="10" fill="#666">${formatNumber(t, percent ? "0%" : el.valueFormat)}</text>`);
        parts.push(`<line x1="${pad}" y1="${ty}" x2="${width - pad}" y2="${ty}" stroke="#eee" stroke-width="1" />`);
      });
    }
    if (isHorizontal) {
      const catBand = chartH / catCount;
      const barH = Math.max(2, catBand * 0.8 / (stacked ? 1 : el.series.length));
      el.series.forEach((s, si) => {
        const color = s.color || palette[si % palette.length];
        (s.values || []).forEach((v, ci) => {
          const baseY = pad + ci * catBand + (catBand - (stacked ? barH : el.series.length * barH)) / 2;
          if (stacked) {
            const prev = el.series.slice(0, si).reduce((acc, ss) => acc + ((ss.values || [])[ci] || 0), 0);
            const sum = el.series.reduce((acc, ss) => acc + ((ss.values || [])[ci] || 0), 0) || 1;
            const start = (percent ? prev / sum : prev) / maxVal * chartW;
            const w = (percent ? (v || 0) / sum : v) / maxVal * chartW;
            const x = pad + start;
            const y = baseY;
            parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${barH}" fill="${color}" />`);
            if (el.showDataLabels) {
              const fmt = s.valueFormat || el.valueFormat;
              parts.push(`<text x="${x + w - 2}" y="${y + barH / 2 + 3}" text-anchor="end" font-size="10" fill="#000">${formatNumber(percent ? v / sum : v, percent ? "0%" : fmt)}</text>`);
            }
          } else {
            const w = v / maxVal * chartW;
            const y = baseY + si * barH;
            parts.push(`<rect x="${pad}" y="${y}" width="${w}" height="${barH}" fill="${color}" />`);
            if (el.showDataLabels) {
              const fmt = s.valueFormat || el.valueFormat;
              parts.push(`<text x="${pad + w + 2}" y="${y + barH / 2 + 3}" font-size="10" fill="#000">${formatNumber(v, fmt)}</text>`);
            }
          }
        });
      });
      const labelSize = Math.max(10, Math.min(12, chartH / (catCount * 2)));
      el.categories.forEach((c, i) => {
        const cy = pad + i * catBand + catBand / 2 + 4;
        parts.push(`<text x="${pad - 8}" y="${cy}" text-anchor="end" font-size="${labelSize}" fill="#333">${escape3(String(c))}</text>`);
      });
    } else {
      const catBand = chartW / catCount;
      const barW = Math.max(2, catBand * 0.8 / (stacked ? 1 : el.series.length));
      el.series.forEach((s, si) => {
        const color = s.color || palette[si % palette.length];
        (s.values || []).forEach((v, ci) => {
          const baseX = pad + ci * catBand + (catBand - (stacked ? barW : el.series.length * barW)) / 2;
          if (stacked) {
            const prev = el.series.slice(0, si).reduce((acc, ss) => acc + ((ss.values || [])[ci] || 0), 0);
            const sum = el.series.reduce((acc, ss) => acc + ((ss.values || [])[ci] || 0), 0) || 1;
            const start = (percent ? prev / sum : prev) / maxVal * chartH;
            const h = (percent ? (v || 0) / sum : v) / maxVal * chartH;
            const x = baseX;
            const y = height - pad - start - h;
            parts.push(`<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${color}" />`);
            if (el.showDataLabels) {
              const fmt = s.valueFormat || el.valueFormat;
              parts.push(`<text x="${x + barW / 2}" y="${y - 2}" text-anchor="middle" font-size="10" fill="#000">${formatNumber(percent ? v / sum : v, percent ? "0%" : fmt)}</text>`);
            }
          } else {
            const h = v / maxVal * chartH;
            const x = baseX + si * barW;
            const y = height - pad - h;
            parts.push(`<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${color}" />`);
            if (el.showDataLabels) {
              const fmt = s.valueFormat || el.valueFormat;
              parts.push(`<text x="${x + barW / 2}" y="${y - 2}" text-anchor="middle" font-size="10" fill="#000">${formatNumber(v, fmt)}</text>`);
            }
          }
        });
      });
      const labelSize = Math.max(10, Math.min(12, chartW / (catCount * 4)));
      el.categories.forEach((c, i) => {
        const cx = pad + i * catBand + catBand / 2;
        const cy = height - pad + 14;
        parts.push(`<text x="${cx}" y="${cy}" text-anchor="middle" font-size="${labelSize}" fill="#333">${escape3(String(c))}</text>`);
      });
    }
    if (el.showLegend) {
      parts.push(renderLegend(el, width, pad, palette));
    }
    return parts.join("\n");
  }
  function renderLine(el, width, height, pad, palette) {
    const catCount = el.categories.length || 1;
    const chartW = width - pad * 2;
    const chartH = height - pad * 2;
    let maxVal = 1;
    for (const s of el.series) {
      const vals = s.values || [];
      for (const v of vals) maxVal = Math.max(maxVal, v);
    }
    const xStep = chartW / Math.max(1, catCount - 1);
    const parts = [];
    parts.push(`<line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
    parts.push(`<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
    const ticks = computeTicks(0, maxVal, 4);
    ticks.forEach((t) => {
      const ty = height - pad - t / maxVal * chartH;
      parts.push(`<line x1="${pad - 4}" y1="${ty}" x2="${pad}" y2="${ty}" stroke="#999" stroke-width="1" />`);
      parts.push(`<text x="${pad - 6}" y="${ty + 3}" text-anchor="end" font-size="10" fill="#666">${formatNumber(t, el.valueFormat)}</text>`);
      parts.push(`<line x1="${pad}" y1="${ty}" x2="${width - pad}" y2="${ty}" stroke="#eee" stroke-width="1" />`);
    });
    const stacked = el.stackedMode && el.stackedMode !== "none";
    const percent = el.stackedMode === "percent";
    const totals = percent ? new Array(catCount).fill(0).map((_, i) => el.series.reduce((acc, sr) => acc + ((sr.values || [])[i] || 0), 0)) : void 0;
    el.series.forEach((s, si) => {
      const color = s.color || palette[si % palette.length];
      let d = "";
      (s.values || []).forEach((v, i) => {
        const x = pad + i * xStep;
        let val = v;
        if (stacked) {
          const prev = el.series.slice(0, si).reduce((acc, ss) => acc + ((ss.values || [])[i] || 0), 0);
          val = prev + v;
          if (percent && totals) val = totals[i] ? val / totals[i] : 0;
        }
        const y = height - pad - val / (percent ? 1 : maxVal) * chartH;
        d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      });
      parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2" />`);
      if (el.showDataLabels) {
        (s.values || []).forEach((v, i) => {
          const x = pad + i * xStep;
          const basePrev = stacked ? el.series.slice(0, si).reduce((acc, ss) => acc + ((ss.values || [])[i] || 0), 0) : 0;
          const dispVal = percent && totals ? v / (totals[i] || 1) : v;
          const y = height - pad - (stacked ? basePrev + v : v) / (percent ? 1 : maxVal) * chartH;
          parts.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="${color}" />`);
          const fmt = s.valueFormat || el.valueFormat;
          parts.push(`<text x="${x}" y="${y - 6}" text-anchor="middle" font-size="10" fill="#000">${formatNumber(dispVal, percent ? "0%" : fmt)}</text>`);
        });
      }
    });
    return parts.join("\n");
  }
  function renderArea(el, width, height, pad, palette) {
    const catCount = el.categories.length || 1;
    const chartW = width - pad * 2;
    const chartH = height - pad * 2;
    let maxVal = 1;
    for (const s of el.series) {
      const vals = s.values || [];
      for (const v of vals) maxVal = Math.max(maxVal, v);
    }
    const xStep = chartW / Math.max(1, catCount - 1);
    const parts = [];
    parts.push(`<line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
    parts.push(`<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
    const stacked = el.stackedMode && el.stackedMode !== "none";
    const percent = el.stackedMode === "percent";
    const totals = percent ? new Array(catCount).fill(0).map((_, i) => el.series.reduce((acc, sr) => acc + ((sr.values || [])[i] || 0), 0)) : void 0;
    const baseline = new Array(catCount).fill(0);
    el.series.forEach((s, si) => {
      const color = s.color || palette[si % palette.length];
      const topY = [];
      const botY = [];
      (s.values || []).forEach((v, i) => {
        const prev = stacked ? baseline[i] : 0;
        const val = stacked ? prev + (percent && totals ? totals[i] ? v / totals[i] : 0 : v) : v;
        const top = height - pad - val / (percent ? 1 : maxVal) * chartH;
        const bottom = height - pad - prev / (percent ? 1 : maxVal) * chartH;
        topY.push(top);
        botY.push(bottom);
        if (stacked) baseline[i] = percent && totals ? val : prev + v;
      });
      let d = "";
      for (let i = 0; i < topY.length; i++) {
        const x = pad + i * xStep;
        d += i === 0 ? `M ${x} ${topY[i]}` : ` L ${x} ${topY[i]}`;
      }
      for (let i = botY.length - 1; i >= 0; i--) {
        const x = pad + i * xStep;
        d += ` L ${x} ${botY[i]}`;
      }
      d += " Z";
      parts.push(`<path d="${d}" fill="${color}" fill-opacity="0.6" stroke="none" />`);
    });
    return parts.join("\n");
  }
  function renderPie(el, width, height, palette) {
    const s0 = el.series[0];
    const values = s0 && s0.values ? s0.values : [];
    const total = values.reduce((a, b) => a + Math.max(0, b), 0) || 1;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.35;
    let start = 0;
    const parts = [];
    values.forEach((v, i) => {
      const frac = Math.max(0, v) / total;
      const end = start + frac * 2 * Math.PI;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const large = end - start > Math.PI ? 1 : 0;
      const color = s0 && s0.color || palette[i % palette.length];
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      parts.push(`<path d="${d}" fill="${color}" />`);
      if (el.showDataLabels && frac > 0) {
        const mid = (start + end) / 2;
        const lx = cx + (r + 12) * Math.cos(mid);
        const ly = cy + (r + 12) * Math.sin(mid);
        parts.push(`<text x="${lx}" y="${ly}" text-anchor="middle" font-size="10" fill="#000">${(frac * 100).toFixed(0)}%</text>`);
      }
      start = end;
    });
    return parts.join("\n");
  }
  function renderScatter(el, width, height, pad, palette) {
    const chartW = width - pad * 2;
    const chartH = height - pad * 2;
    const allPoints = [];
    for (const s of el.series) {
      const pts = s.points || [];
      for (const p of pts) allPoints.push(p);
    }
    const minX = Math.min(...allPoints.map((p) => p.x), 0);
    const maxX = Math.max(...allPoints.map((p) => p.x), 1);
    const minY = Math.min(...allPoints.map((p) => p.y), 0);
    const maxY = Math.max(...allPoints.map((p) => p.y), 1);
    const parts = [];
    parts.push(`<line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
    parts.push(`<line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#999" stroke-width="1" />`);
    const xticks = computeTicks(minX, maxX, 4);
    xticks.forEach((t) => {
      const tx = pad + (t - minX) / Math.max(1e-9, maxX - minX) * chartW;
      const ty = height - pad;
      parts.push(`<line x1="${tx}" y1="${ty}" x2="${tx}" y2="${ty + 4}" stroke="#999" stroke-width="1" />`);
      parts.push(`<text x="${tx}" y="${ty + 16}" text-anchor="middle" font-size="10" fill="#666">${formatNumber(t, el.valueFormat)}</text>`);
    });
    const yticks = computeTicks(minY, maxY, 4);
    yticks.forEach((t) => {
      const ty = height - pad - (t - minY) / Math.max(1e-9, maxY - minY) * chartH;
      parts.push(`<line x1="${pad - 4}" y1="${ty}" x2="${pad}" y2="${ty}" stroke="#999" stroke-width="1" />`);
      parts.push(`<text x="${pad - 6}" y="${ty + 3}" text-anchor="end" font-size="10" fill="#666">${formatNumber(t, el.valueFormat)}</text>`);
      parts.push(`<line x1="${pad}" y1="${ty}" x2="${width - pad}" y2="${ty}" stroke="#eee" stroke-width="1" />`);
    });
    el.series.forEach((s, si) => {
      const color = s.color || palette[si % palette.length];
      (s.points || []).forEach((p) => {
        const x = pad + (p.x - minX) / Math.max(1e-9, maxX - minX) * chartW;
        const y = height - pad - (p.y - minY) / Math.max(1e-9, maxY - minY) * chartH;
        parts.push(`<circle cx="${x}" cy="${y}" r="3" fill="${color}" />`);
        if (el.showDataLabels) {
          const fmt = s.valueFormat || el.valueFormat;
          parts.push(`<text x="${x + 5}" y="${y - 5}" font-size="10" fill="#000">${formatNumber(p.y, fmt)}</text>`);
        }
      });
    });
    return parts.join("\n");
  }
  function escape3(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function computeTicks(min, max, count) {
    const span = max - min;
    if (span <= 0) return [min, max];
    const step = niceNum(span / count, true);
    const ticks = [];
    let v = Math.ceil(min / step) * step;
    while (v <= max + 1e-9) {
      ticks.push(Number(v.toFixed(10)));
      v += step;
    }
    return ticks;
  }
  function niceNum(range, round) {
    const exponent = Math.floor(Math.log10(range));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction;
    if (round) {
      if (fraction < 1.5) niceFraction = 1;
      else if (fraction < 3) niceFraction = 2;
      else if (fraction < 7) niceFraction = 5;
      else niceFraction = 10;
    } else {
      if (fraction <= 1) niceFraction = 1;
      else if (fraction <= 2) niceFraction = 2;
      else if (fraction <= 5) niceFraction = 5;
      else niceFraction = 10;
    }
    return niceFraction * Math.pow(10, exponent);
  }
  function formatNumber(v, formatCode) {
    if (!formatCode) {
      if (Math.abs(v) >= 1e3) return `${Math.round(v)}`;
      if (Math.abs(v) >= 10) return v.toFixed(0);
      if (Math.abs(v) >= 1) return v.toFixed(1);
      return v.toFixed(2);
    }
    let isPercent = /%/.test(formatCode);
    let decimals = 0;
    const decMatch = formatCode.match(/\.([0#]+)/);
    if (decMatch) decimals = decMatch[1].length;
    const currencyMatch = formatCode.match(/([$€£¥])/);
    const currency = currencyMatch ? currencyMatch[1] : "";
    const useThousands = /#,##0/.test(formatCode);
    let n = v;
    if (isPercent) n = n * 100;
    let str = n.toFixed(decimals);
    if (useThousands) {
      const [int, frac] = str.split(".");
      const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      str = frac !== void 0 ? `${withSep}.${frac}` : withSep;
    }
    if (currency) str = currency + str;
    if (isPercent) str = str + "%";
    return str;
  }
  function renderLegend(el, width, pad, palette) {
    let x = pad;
    const y = pad - 12;
    const parts = [];
    el.series.forEach((s, i) => {
      const color = s.color || palette[i % palette.length];
      const label = s.name || `Series ${i + 1}`;
      parts.push(`<rect x="${x}" y="${y}" width="10" height="10" fill="${color}" />`);
      parts.push(`<text x="${x + 14}" y="${y + 9}" font-size="10" fill="#333">${escape3(label)}</text>`);
      x += 14 + label.length * 6 + 10;
    });
    return parts.join("\n");
  }
  async function pptxToHtml(buffer, config) {
    if (config?.domParserFactory) {
      const { XmlHelper: XmlHelper2 } = await Promise.resolve().then(() => (init_XmlHelper_AJVQT6ZQ(), XmlHelper_AJVQT6ZQ_exports));
      XmlHelper2.setDomParser(config.domParserFactory);
    }
    const reader = new PptxReader();
    const slides = await reader.load(buffer);
    const base = await reader.getBaseSizePx();
    const opts = { ...config || {}, baseWidth: base.width, baseHeight: base.height };
    return slides.map((slideElements) => HtmlRenderer.render(slideElements, opts));
  }
  var import_jszip, TextExtractor, ImageExtractor, ShapeExtractor, TableExtractor, ChartExtractor, SlideExtractor, PptxReader, HtmlRenderer;
  var init_dist = __esm({
    "node_modules/@jvmr/pptx-to-html/dist/index.js"() {
      init_chunk_KAPAPPOM();
      import_jszip = __toESM(require_jszip_min(), 1);
      TextExtractor = class {
        /**
         * Extracts all text elements from the slide's <spTree> node.
         * @param spTree The <spTree> element of the slide.
         * @param themeColors Theme color mapping (e.g. tx1, bg2).
         * @returns List of TextElement extracted.
         */
        static extract(spTree, themeColors, opts = {}) {
          if (!spTree) return [];
          const elements = [];
          const shapes = spTree.getElementsByTagNameNS("*", "sp");
          for (const shape of Array.from(shapes)) {
            const nvPr = shape.getElementsByTagNameNS("*", "nvPr")[0] ?? null;
            const ph = nvPr?.getElementsByTagNameNS("*", "ph")[0] ?? null;
            const isPlaceholder = !!ph;
            if (opts.context && opts.context !== "slide" && isPlaceholder) {
              continue;
            }
            const txBody = shape.getElementsByTagNameNS("*", "txBody")[0];
            if (!txBody) continue;
            const paragraphs = txBody.getElementsByTagNameNS("*", "p");
            const bodyPr = txBody.getElementsByTagNameNS("*", "bodyPr")[0] ?? null;
            const anchor = bodyPr?.getAttribute("anchor") || void 0;
            const verticalAlign = anchor === "ctr" ? "middle" : anchor === "b" ? "bottom" : "top";
            const lIns = bodyPr?.getAttribute("lIns");
            const tIns = bodyPr?.getAttribute("tIns");
            const rIns = bodyPr?.getAttribute("rIns");
            const bIns = bodyPr?.getAttribute("bIns");
            const padding = {
              left: lIns ? Number(lIns) / 9525 : 0,
              top: tIns ? Number(tIns) / 9525 : 0,
              right: rIns ? Number(rIns) / 9525 : 0,
              bottom: bIns ? Number(bIns) / 9525 : 0
            };
            const textRuns = [];
            let fontName = "Arial";
            let fontSize = 18;
            let color = void 0;
            let horizontalAlign = void 0;
            const paraItems = [];
            const lvlDefaults = {};
            const lstStyle = txBody.querySelector("*|lstStyle");
            if (lstStyle) {
              for (const node of Array.from(lstStyle.children)) {
                const m = node.localName.match(/^lvl(\d+)pPr$/);
                if (!m) continue;
                const idx = parseInt(m[1], 10) - 1;
                let kind = "p";
                let listStyle = void 0;
                if (node.querySelector("*|buNone")) {
                  kind = "p";
                } else if (node.querySelector("*|buAutoNum")) {
                  kind = "ol";
                  const auto = node.querySelector("*|buAutoNum");
                  const typ = auto?.getAttribute("type") || "arabicPeriod";
                  listStyle = mapAutoNumToCss(typ);
                } else if (node.querySelector("*|buChar")) {
                  kind = "ul";
                  listStyle = "disc";
                }
                lvlDefaults[idx] = { kind, listStyle };
              }
            }
            for (const p of Array.from(paragraphs)) {
              const pPr = p.getElementsByTagNameNS("*", "pPr")[0] ?? null;
              const algn = pPr?.getAttribute("algn") || void 0;
              if (algn && !horizontalAlign) {
                horizontalAlign = algn === "ctr" ? "center" : algn === "r" ? "right" : algn.startsWith("just") ? "justify" : "left";
              }
              const runs = p.getElementsByTagNameNS("*", "r");
              let paraText = getParagraphText(p);
              if (paraText) paraText.split(/\n+/).forEach((t) => {
                if (t) textRuns.push(t);
              });
              for (const r of Array.from(runs)) {
                const rPr = r.getElementsByTagNameNS("*", "rPr")[0];
                if (rPr) {
                  const latin = rPr.getElementsByTagNameNS("*", "latin")[0];
                  fontName = latin?.getAttribute("typeface") ?? fontName;
                  const sz = rPr.getAttribute("sz");
                  if (sz) {
                    const n = parseInt(sz, 10);
                    if (Number.isFinite(n)) fontSize = n / 100;
                  }
                  const solidFill = rPr.querySelector("*|solidFill");
                  const candidate = XmlHelper.getColorFromElement(solidFill || null, themeColors);
                  if (candidate) color = candidate;
                }
              }
              if (!color && pPr) {
                const endParaRPr = pPr.getElementsByTagNameNS("*", "endParaRPr")[0] ?? null;
                const endFill = endParaRPr?.querySelector("*|solidFill") || null;
                const c1 = XmlHelper.getColorFromElement(endFill, themeColors);
                if (c1) color = c1;
                if (!color) {
                  const defRPrP = pPr.getElementsByTagNameNS("*", "defRPr")[0] ?? null;
                  const defFillP = defRPrP?.querySelector("*|solidFill") || null;
                  const c2 = XmlHelper.getColorFromElement(defFillP, themeColors);
                  if (c2) color = c2;
                }
              }
              const lvlAttr = pPr?.getAttribute("lvl");
              const lvl = lvlAttr ? parseInt(lvlAttr, 10) : 0;
              let kind = "p";
              let listStyle = void 0;
              if (pPr) {
                if (pPr.querySelector("*|buNone")) {
                  kind = "p";
                } else if (pPr.querySelector("*|buAutoNum")) {
                  kind = "ol";
                  const auto = pPr.querySelector("*|buAutoNum");
                  const typ = auto?.getAttribute("type") || "arabicPeriod";
                  listStyle = mapAutoNumToCss(typ);
                } else if (pPr.querySelector("*|buChar")) {
                  kind = "ul";
                  listStyle = "disc";
                } else if (lvlDefaults[lvl]) {
                  kind = lvlDefaults[lvl].kind;
                  listStyle = lvlDefaults[lvl].listStyle;
                } else if (lvl > 0) {
                  kind = "ul";
                  listStyle = "disc";
                }
              } else if (lvlDefaults[lvl]) {
                kind = lvlDefaults[lvl].kind;
                listStyle = lvlDefaults[lvl].listStyle;
              } else if (lvl > 0) {
                kind = "ul";
                listStyle = "disc";
              }
              paraItems.push({ kind, text: paraText, lvl: isNaN(lvl) ? 0 : lvl, listStyle });
            }
            if (!color) {
              const lstDefRPr = txBody.querySelector("*|lstStyle *|defRPr");
              const lstFill = lstDefRPr?.querySelector("*|solidFill");
              const c0 = XmlHelper.getColorFromElement(lstFill || null, themeColors);
              if (c0) color = c0;
              const defRPr = txBody.querySelector("*|defRPr");
              const defFill = defRPr?.querySelector("*|solidFill");
              const fallback1 = XmlHelper.getColorFromElement(defFill || null, themeColors);
              if (fallback1) color = fallback1;
              if (!color) {
                const spPr = shape.querySelector("p\\:spPr, spPr");
                const shapeFill = spPr?.querySelector("*|solidFill");
                const fallback2 = XmlHelper.getColorFromElement(shapeFill || null, themeColors);
                if (fallback2) color = fallback2;
              }
            }
            const content = textRuns.join(" ").trim();
            if (opts.context && opts.context !== "slide") {
              const c = content.toLowerCase();
              const isDefault = c.includes("click to add") || c.includes("click to edit") || c.includes("haga clic para agregar") || c.includes("haga clic para editar") || c.includes("hacer clic para agregar") || c.includes("hacer clic para editar");
              if (isDefault) continue;
            }
            if (content === "") continue;
            const xfrm = shape.getElementsByTagNameNS("*", "xfrm")[0];
            let off = xfrm?.getElementsByTagNameNS("*", "off")[0] ?? null;
            let ext = xfrm?.getElementsByTagNameNS("*", "ext")[0] ?? null;
            let x, y, cx, cy;
            if (off && ext) {
              x = XmlHelper.getAttrAsNumber(off, "x");
              y = XmlHelper.getAttrAsNumber(off, "y");
              cx = XmlHelper.getAttrAsNumber(ext, "cx");
              cy = XmlHelper.getAttrAsNumber(ext, "cy");
            } else if (opts.placeholderGeom) {
              const phIdx = ph?.getAttribute("idx") || void 0;
              const g = phIdx ? opts.placeholderGeom[phIdx] : void 0;
              x = g?.x ?? 0;
              y = g?.y ?? 0;
              cx = g?.cx ?? 1e6;
              cy = g?.cy ?? 5e5;
            } else {
              x = 0;
              y = 0;
              cx = 1e6;
              cy = 5e5;
            }
            let richHtml = void 0;
            if (paraItems.some((it) => it.kind !== "p")) {
              const parts = [];
              let open = null;
              for (const it of paraItems) {
                if (it.kind === "p") {
                  if (open) {
                    parts.push(open.kind === "ul" ? "</ul>" : "</ol>");
                    open = null;
                  }
                  if (it.text.trim()) {
                    parts.push(`<div style="margin-left:${it.lvl * 24}px">${escapeHtml(it.text).replace(/\n/g, "<br>")}</div>`);
                  }
                  continue;
                }
                if (!open || open.kind !== it.kind) {
                  if (open) parts.push(open.kind === "ul" ? "</ul>" : "</ol>");
                  const commonListCss = `list-style-position: inside; padding-left: 0; margin: 0;`;
                  const style = it.kind === "ol" ? ` style="${commonListCss} list-style-type: ${it.listStyle || "decimal"};"` : ` style="${commonListCss}"`;
                  parts.push(it.kind === "ul" ? `<ul${style}>` : `<ol${style}>`);
                  open = { kind: it.kind, listStyle: it.listStyle };
                }
                parts.push(`<li style="margin-left:${it.lvl * 24}px">${escapeHtml(it.text).replace(/\n/g, "<br>")}</li>`);
              }
              if (open) parts.push(open.kind === "ul" ? "</ul>" : "</ol>");
              richHtml = parts.join("");
            }
            const element = {
              type: "text",
              content,
              position: { x, y },
              size: { width: cx, height: cy },
              font: {
                name: fontName,
                size: fontSize,
                color: color ?? "#000000"
                // fallback absoluto si quieres
              },
              align: {
                horizontal: horizontalAlign ?? "left",
                vertical: verticalAlign
              },
              padding,
              html: richHtml
            };
            elements.push(element);
          }
          return elements;
        }
      };
      ImageExtractor = class {
        /**
         * Extracts image elements from the <spTree> element using rels from slide relationships.
         * @param spTree The <spTree> element of the slide.
         * @param rels XML Document for slide relationships (ppt/slides/_rels/slideX.xml.rels).
         * @param zip The JSZip archive of the entire .pptx file.
         * @returns List of ImageElement extracted.
         */
        static async extract(spTree, rels, zip, basePath = "ppt/slides") {
          if (!spTree) return [];
          const elements = [];
          const pics = spTree.getElementsByTagNameNS("*", "pic");
          for (const pic of Array.from(pics)) {
            const blip = pic.getElementsByTagNameNS("*", "blip")[0];
            const embedId = blip?.getAttribute("r:embed") ?? "";
            if (!embedId) continue;
            const relEl = rels && rels.getElementsByTagName ? (function() {
              const els = rels.getElementsByTagName("Relationship");
              for (const e of Array.from(els)) {
                if (e.getAttribute("Id") === embedId) return e;
              }
              return null;
            })() : null;
            const relTarget = relEl?.getAttribute("Target");
            if (!relTarget) continue;
            const normalizedPath = this.normalizePath(relTarget, basePath);
            const imageFile = zip.file(normalizedPath);
            if (!imageFile) continue;
            const binary = await imageFile.async("base64");
            const extImg = normalizedPath.split(".").pop()?.toLowerCase() || "png";
            const dataUri = `data:image/${extImg};base64,${binary}`;
            const xfrm = pic.getElementsByTagNameNS("*", "xfrm")[0];
            const off = xfrm?.getElementsByTagNameNS("*", "off")[0];
            const ext = xfrm?.getElementsByTagNameNS("*", "ext")[0];
            const x = off ? XmlHelper.getAttrAsNumber(off, "x") : 0;
            const y = off ? XmlHelper.getAttrAsNumber(off, "y") : 0;
            const cx = ext ? XmlHelper.getAttrAsNumber(ext, "cx") : 1e6;
            const cy = ext ? XmlHelper.getAttrAsNumber(ext, "cy") : 5e5;
            const element = {
              type: "image",
              relId: embedId,
              src: dataUri,
              position: { x, y },
              size: { width: cx, height: cy }
            };
            elements.push(element);
          }
          return elements;
        }
        /**
         * Normalizes a relative path from a slide rels file.
         * @param target Path from the relationship XML (e.g. "../media/image1.png")
         * @param basePath Base folder (e.g. "ppt/slides")
         * @returns Normalized path inside the zip (e.g. "ppt/media/image1.png")
         */
        static normalizePath(target, basePath) {
          const parts = (basePath + "/" + target).split("/");
          const resolved = [];
          for (const part of parts) {
            if (part === "..") resolved.pop();
            else if (part !== ".") resolved.push(part);
          }
          return resolved.join("/");
        }
      };
      ShapeExtractor = class {
        /**
         * Extracts shape and connector elements from the <spTree> element of the slide.
         * @param spTree The <spTree> element.
         * @param themeColors Theme color mapping.
         * @returns List of ShapeElement extracted.
         */
        static extract(spTree, themeColors) {
          if (!spTree) return [];
          const elements = [];
          const allShapes = [
            ...Array.from(spTree.getElementsByTagNameNS("*", "sp")),
            ...Array.from(spTree.getElementsByTagNameNS("*", "cxnSp"))
          ];
          for (const shape of allShapes) {
            const xfrm = shape.getElementsByTagNameNS("*", "xfrm")[0];
            const off = xfrm?.getElementsByTagNameNS("*", "off")[0];
            const ext = xfrm?.getElementsByTagNameNS("*", "ext")[0];
            const x = off ? XmlHelper.getAttrAsNumber(off, "x") : 0;
            const y = off ? XmlHelper.getAttrAsNumber(off, "y") : 0;
            const cx = ext ? XmlHelper.getAttrAsNumber(ext, "cx") : 1e6;
            const cy = ext ? XmlHelper.getAttrAsNumber(ext, "cy") : 5e5;
            const rotAttr = xfrm?.getAttribute("rot");
            const rotationDeg = rotAttr ? Number(rotAttr) / 6e4 : void 0;
            const prstGeom = shape.getElementsByTagNameNS("*", "prstGeom")[0];
            const shapeType = prstGeom?.getAttribute("prst") ?? "rect";
            const spPr = shape.getElementsByTagNameNS("*", "spPr")[0];
            let fillColor = "transparent";
            let borderColor = "transparent";
            let strokeWidth = void 0;
            let headEnd = void 0;
            let tailEnd = void 0;
            if (spPr) {
              const solidFill = spPr.getElementsByTagNameNS("*", "solidFill")[0] ?? null;
              fillColor = XmlHelper.getColorFromElement(solidFill, themeColors) ?? "transparent";
              const ln = spPr.getElementsByTagNameNS("*", "ln")[0];
              const borderFill = ln?.getElementsByTagNameNS("*", "solidFill")[0] ?? null;
              borderColor = XmlHelper.getColorFromElement(borderFill, themeColors) ?? "transparent";
              const wAttr = ln?.getAttribute("w");
              if (wAttr) {
                const w = Number(wAttr);
                if (!isNaN(w)) {
                  strokeWidth = w / 9525;
                }
              }
              const headEndEl = ln?.getElementsByTagNameNS("*", "headEnd")[0] ?? null;
              const tailEndEl = ln?.getElementsByTagNameNS("*", "tailEnd")[0] ?? null;
              headEnd = headEndEl ? {
                type: headEndEl.getAttribute("type") || void 0,
                w: headEndEl.getAttribute("w") || void 0,
                len: headEndEl.getAttribute("len") || void 0
              } : void 0;
              tailEnd = tailEndEl ? {
                type: tailEndEl.getAttribute("type") || void 0,
                w: tailEndEl.getAttribute("w") || void 0,
                len: tailEndEl.getAttribute("len") || void 0
              } : void 0;
            }
            if (fillColor === "transparent") {
              const style = shape.getElementsByTagNameNS("*", "style")[0];
              const fillRef = style?.getElementsByTagNameNS("*", "fillRef")[0];
              const schemeClr = fillRef?.getElementsByTagNameNS("*", "schemeClr")[0];
              const val = schemeClr?.getAttribute("val");
              if (val && themeColors[val]) {
                fillColor = themeColors[val];
              }
            }
            const element = {
              type: "shape",
              shapeType,
              position: { x, y },
              size: { width: cx, height: cy },
              fillColor,
              borderColor,
              strokeWidth,
              rotationDeg,
              headEnd,
              tailEnd
            };
            elements.push(element);
          }
          return elements;
        }
      };
      TableExtractor = class {
        static extract(spTree, themeColors, themeTableStyles) {
          if (!spTree) return [];
          const tables = [];
          const gFrames = spTree.getElementsByTagNameNS("*", "graphicFrame");
          for (const gf of Array.from(gFrames)) {
            const tbl = this.findTbl(gf);
            if (!tbl) continue;
            const xfrm = gf.getElementsByTagNameNS("*", "xfrm")[0] ?? null;
            const off = xfrm?.getElementsByTagNameNS("*", "off")[0] ?? null;
            const ext = xfrm?.getElementsByTagNameNS("*", "ext")[0] ?? null;
            const x = off ? XmlHelper.getAttrAsNumber(off, "x") : 0;
            const y = off ? XmlHelper.getAttrAsNumber(off, "y") : 0;
            const cx = ext ? XmlHelper.getAttrAsNumber(ext, "cx") : 1e6;
            const cy = ext ? XmlHelper.getAttrAsNumber(ext, "cy") : 5e5;
            const columns = [];
            const grid = tbl.getElementsByTagNameNS("*", "tblGrid")[0] ?? null;
            if (grid) {
              for (const col of Array.from(grid.getElementsByTagNameNS("*", "gridCol"))) {
                const w = Number(col.getAttribute("w") || 0);
                columns.push(w);
              }
            }
            const tblPr = tbl.getElementsByTagNameNS("*", "tblPr")[0] ?? null;
            const tableStyle = this.extractTableStyleFlags(tblPr);
            const tableBorders = this.extractTableBorders(tblPr, themeColors);
            const tableStyleId = this.extractTableStyleId(tblPr);
            const tableFillColor = this.extractTableFill(tblPr, themeColors);
            const resolvedStyle = tableStyleId && themeTableStyles ? themeTableStyles[tableStyleId] : void 0;
            const fallbackStyle = this.buildFallbackTableStyle(themeColors, tableStyle);
            const mergedStyle = fallbackStyle || resolvedStyle ? {
              fills: { ...fallbackStyle?.fills || {}, ...resolvedStyle?.fills || {} },
              fontColors: { ...fallbackStyle?.fontColors || {}, ...resolvedStyle?.fontColors || {} }
            } : void 0;
            const rows = [];
            for (const tr of Array.from(tbl.getElementsByTagNameNS("*", "tr"))) {
              const cells = [];
              for (const tc of Array.from(tr.getElementsByTagNameNS("*", "tc"))) {
                const txBody = tc.getElementsByTagNameNS("*", "txBody")[0] ?? null;
                const { text, font, align, padding } = this.extractCellText(txBody, themeColors, tc);
                const tcPr = tc.getElementsByTagNameNS("*", "tcPr")[0] ?? null;
                const fillColor = this.extractFillColor(tcPr, themeColors);
                const borders = this.extractCellBorders(tcPr, themeColors);
                const cell = { text, font, align, padding, fillColor, borders };
                const gridSpan = tcPr?.getElementsByTagNameNS("*", "gridSpan")[0] ?? null;
                const rowSpan = tcPr?.getElementsByTagNameNS("*", "rowSpan")[0] ?? null;
                if (gridSpan) cell.colSpan = Number(gridSpan.getAttribute("val") || 1);
                if (rowSpan) cell.rowSpan = Number(rowSpan.getAttribute("val") || 1);
                cells.push(cell);
              }
              rows.push({ cells });
            }
            tables.push({
              type: "table",
              position: { x, y },
              size: { width: cx, height: cy },
              columns,
              rows,
              tableStyle,
              tableBorders,
              tableStyleId,
              tableFillColor,
              style: mergedStyle ? { fills: mergedStyle.fills, fontColors: mergedStyle.fontColors } : void 0
            });
          }
          return tables;
        }
        static buildFallbackTableStyle(themeColors, tableStyleFlags) {
          const accent = themeColors["accent1"] || themeColors["accent2"] || themeColors["dk1"];
          if (!accent) return void 0;
          const white = themeColors["lt1"] || "#FFFFFF";
          const fills = {};
          const fontColors = {};
          if (tableStyleFlags?.firstRow) {
            fills["firstRow"] = accent;
            fontColors["firstRow"] = white;
          }
          if (tableStyleFlags?.firstCol) {
            fills["firstCol"] = this.lightenHex(accent, 0.85);
            fontColors["firstCol"] = void 0;
          }
          const bandShade = this.lightenHex(accent, 0.92);
          if (tableStyleFlags?.bandRow) {
            fills["band2H"] = bandShade;
          }
          if (tableStyleFlags?.bandCol) {
            fills["band2V"] = bandShade;
          }
          return { fills, fontColors };
        }
        static lightenHex(hex, ratio) {
          const m = (hex || "").replace("#", "");
          if (m.length !== 6 || /[^0-9a-fA-F]/.test(m)) return hex || "#FFFFFF";
          const r = parseInt(m.substring(0, 2), 16);
          const g = parseInt(m.substring(2, 4), 16);
          const b = parseInt(m.substring(4, 6), 16);
          const lr = Math.round(r + (255 - r) * ratio);
          const lg = Math.round(g + (255 - g) * ratio);
          const lb = Math.round(b + (255 - b) * ratio);
          const to2 = (n) => n.toString(16).padStart(2, "0");
          return `#${to2(lr)}${to2(lg)}${to2(lb)}`;
        }
        static findTbl(gf) {
          const graphicData = gf.getElementsByTagNameNS("*", "graphicData")[0] ?? null;
          if (!graphicData) return null;
          const tbl = graphicData.getElementsByTagNameNS("*", "tbl")[0] ?? null;
          return tbl;
        }
        static extractCellText(txBody, themeColors, tc) {
          if (!txBody) return { text: "", font: {}, align: {}, padding: { left: 0, top: 0, right: 0, bottom: 0 } };
          const bodyPr = txBody.getElementsByTagNameNS("*", "bodyPr")[0] ?? null;
          let vertical = "top";
          const tcPr = tc?.getElementsByTagNameNS("*", "tcPr")[0] ?? null;
          const tcAnchor = tcPr?.getAttribute("anchor") || tcPr?.getAttribute("vAlign") || void 0;
          const bpAnchor = bodyPr?.getAttribute("anchor") || void 0;
          const vSrc = tcAnchor || bpAnchor;
          if (vSrc === "ctr") vertical = "middle";
          else if (vSrc === "b") vertical = "bottom";
          else vertical = "top";
          const lIns = bodyPr?.getAttribute("lIns");
          const tIns = bodyPr?.getAttribute("tIns");
          const rIns = bodyPr?.getAttribute("rIns");
          const bIns = bodyPr?.getAttribute("bIns");
          const padding = {
            left: lIns ? Number(lIns) / 9525 : 6,
            top: tIns ? Number(tIns) / 9525 : 2,
            right: rIns ? Number(rIns) / 9525 : 6,
            bottom: bIns ? Number(bIns) / 9525 : 2
          };
          let horiz = "left";
          let fontName = "Arial";
          let fontSize = 14;
          let color;
          let parts = [];
          const paragraphs = txBody.getElementsByTagNameNS("*", "p");
          for (const p of Array.from(paragraphs)) {
            const pPr = p.getElementsByTagNameNS("*", "pPr")[0] ?? null;
            const algn = pPr?.getAttribute("algn") || void 0;
            if (algn) {
              horiz = algn === "ctr" ? "center" : algn === "r" ? "right" : algn.startsWith("just") ? "justify" : "left";
            }
            for (const child of Array.from(p.childNodes)) {
              if (child.nodeType === 1) {
                const ln = child.localName;
                if (ln === "r") {
                  const rPr = child.getElementsByTagNameNS("*", "rPr")[0] ?? null;
                  if (rPr) {
                    const latin = rPr.getElementsByTagNameNS("*", "latin")[0] ?? null;
                    fontName = latin?.getAttribute("typeface") ?? fontName;
                    const sz = rPr.getAttribute("sz");
                    if (sz) fontSize = parseInt(sz, 10) / 100;
                    const solidFill = rPr.querySelector("*|solidFill");
                    const c = XmlHelper.getColorFromElement(solidFill || null, themeColors);
                    if (c) color = c;
                  }
                  const t = child.getElementsByTagNameNS("*", "t")[0]?.textContent ?? "";
                  parts.push(t);
                } else if (ln === "br") {
                  parts.push("\n");
                } else if (ln === "fld") {
                  const runs = child.getElementsByTagNameNS("*", "r");
                  for (const r of Array.from(runs)) {
                    const t = r.getElementsByTagNameNS("*", "t")[0]?.textContent ?? "";
                    parts.push(t);
                  }
                }
              }
            }
          }
          return {
            text: parts.join("").trim(),
            font: { name: fontName, size: fontSize, color },
            align: { horizontal: horiz, vertical },
            padding
          };
        }
        static extractFillColor(tcPr, themeColors) {
          if (!tcPr) return void 0;
          if (tcPr.getElementsByTagNameNS("*", "noFill")[0]) return void 0;
          const direct = Array.from(tcPr.children).find((c) => c.localName === "solidFill");
          if (direct) return XmlHelper.getColorFromElement(direct, themeColors);
          const all = Array.from(tcPr.getElementsByTagNameNS("*", "solidFill"));
          for (const cand of all) {
            let p = cand.parentElement;
            let insideLine = false;
            while (p && p !== tcPr) {
              const ln = p.localName;
              if (ln === "ln" || ln === "lnL" || ln === "lnR" || ln === "lnT" || ln === "lnB" || ln === "tcBorders") {
                insideLine = true;
                break;
              }
              p = p.parentElement;
            }
            if (!insideLine) {
              const col = XmlHelper.getColorFromElement(cand, themeColors);
              if (col) return col;
            }
          }
          return void 0;
        }
        static extractCellBorders(tcPr, themeColors) {
          const borders = {};
          if (!tcPr) return borders;
          const map = {
            lnL: "left",
            lnR: "right",
            lnT: "top",
            lnB: "bottom"
          };
          for (const key of Object.keys(map)) {
            const ln = tcPr.getElementsByTagNameNS("*", key)[0] ?? null;
            if (!ln) continue;
            const wAttr = ln.getAttribute("w");
            const w = wAttr ? Number(wAttr) / 9525 : void 0;
            const solidFill = ln.getElementsByTagNameNS("*", "solidFill")[0] ?? null;
            const color = XmlHelper.getColorFromElement(solidFill, themeColors);
            const prstDash = ln.getElementsByTagNameNS("*", "prstDash")[0] ?? null;
            const dashVal = prstDash?.getAttribute("val") || "";
            const style = this.mapPrstDashToCss(dashVal);
            borders[map[key]] = { color, width: w, style };
          }
          return borders;
        }
        static extractTableStyleFlags(tblPr) {
          if (!tblPr) return {};
          const flags = {};
          for (const k of ["firstRow", "firstCol", "lastRow", "lastCol", "bandRow", "bandCol"]) {
            if (tblPr.getAttribute(k) === "1" || tblPr.getAttribute(k) === "true") flags[k] = true;
          }
          return flags;
        }
        static extractTableStyleId(tblPr) {
          if (!tblPr) return void 0;
          const idEl = tblPr.getElementsByTagNameNS("*", "tblStyleId")[0] || tblPr.getElementsByTagNameNS("*", "tblStyle")[0] || null;
          const idAttr = idEl?.getAttribute("val") || void 0;
          const text = idEl?.textContent?.trim() || void 0;
          const direct = tblPr.getAttribute("tblStyle") || void 0;
          return idAttr || text || direct || void 0;
        }
        static extractTableBorders(tblPr, themeColors) {
          if (!tblPr) return void 0;
          const borders = {};
          const tblBorders = tblPr.getElementsByTagNameNS("*", "tblBorders")[0] ?? null;
          if (!tblBorders) return void 0;
          const map = {
            top: "top",
            right: "right",
            bottom: "bottom",
            left: "left",
            insideH: "insideH",
            insideV: "insideV"
          };
          for (const tag of Object.keys(map)) {
            const node = tblBorders.getElementsByTagNameNS("*", tag)[0] ?? null;
            if (!node) continue;
            const ln = node.getElementsByTagNameNS("*", "ln")[0] ?? node;
            const wAttr = ln.getAttribute("w");
            const w = wAttr ? Number(wAttr) / 9525 : void 0;
            const solidFill = ln.getElementsByTagNameNS("*", "solidFill")[0] ?? null;
            const color = XmlHelper.getColorFromElement(solidFill, themeColors);
            const prstDash = ln.getElementsByTagNameNS("*", "prstDash")[0] ?? null;
            const dashVal = prstDash?.getAttribute("val") || "";
            const style = this.mapPrstDashToCss(dashVal);
            borders[map[tag]] = { color, width: w, style };
          }
          return borders;
        }
        static extractTableFill(tblPr, themeColors) {
          if (!tblPr) return void 0;
          const directSolid = Array.from(tblPr.children).find((c) => c.localName === "solidFill");
          if (directSolid) return XmlHelper.getColorFromElement(directSolid, themeColors);
          const allSolid = Array.from(tblPr.getElementsByTagNameNS("*", "solidFill"));
          for (const cand of allSolid) {
            let p = cand.parentElement;
            let insideBorders = false;
            while (p && p !== tblPr) {
              if (p.localName === "tblBorders") {
                insideBorders = true;
                break;
              }
              p = p.parentElement;
            }
            if (!insideBorders) {
              const col = XmlHelper.getColorFromElement(cand, themeColors);
              if (col) return col;
            }
          }
          return void 0;
        }
        static mapPrstDashToCss(val) {
          const v = (val || "").toLowerCase();
          if (!v) return void 0;
          if (v === "solid") return "solid";
          if (v.includes("dot")) return "dotted";
          if (v.includes("dash")) return "dashed";
          return void 0;
        }
      };
      ChartExtractor = class {
        static async extract(spTree, relsXml, zip, themeColors) {
          if (!spTree) return [];
          const charts = [];
          const gFrames = spTree.getElementsByTagNameNS("*", "graphicFrame");
          for (const gf of Array.from(gFrames)) {
            const graphicData = gf.getElementsByTagNameNS("*", "graphicData")[0] ?? null;
            if (!graphicData) continue;
            const chartEl = graphicData.getElementsByTagNameNS("*", "chart")[0] ?? null;
            if (!chartEl) continue;
            const rId = chartEl.getAttribute("r:id") || chartEl.getAttribute("r:embed") || void 0;
            if (!rId) continue;
            const rel = XmlHelper.findRelationshipById(relsXml, rId);
            const target = rel?.getAttribute("Target") || void 0;
            if (!target) continue;
            const fullPath = this.resolvePath(target, "ppt/slides");
            const file = zip.file(fullPath);
            if (!file) continue;
            const xmlStr = await file.async("string");
            const doc = XmlHelper.parseXml(xmlStr);
            const parsed = this.parseChart(doc, themeColors);
            if (!parsed) continue;
            const xfrm = gf.getElementsByTagNameNS("*", "xfrm")[0] ?? null;
            const off = xfrm?.getElementsByTagNameNS("*", "off")[0] ?? null;
            const ext = xfrm?.getElementsByTagNameNS("*", "ext")[0] ?? null;
            const x = off ? XmlHelper.getAttrAsNumber(off, "x") : 0;
            const y = off ? XmlHelper.getAttrAsNumber(off, "y") : 0;
            const cx = ext ? XmlHelper.getAttrAsNumber(ext, "cx") : 1e6;
            const cy = ext ? XmlHelper.getAttrAsNumber(ext, "cy") : 6e5;
            charts.push({
              type: "chart",
              chartType: parsed.type,
              position: { x, y },
              size: { width: cx, height: cy },
              categories: parsed.categories,
              series: parsed.series,
              palette: parsed.palette,
              title: parsed.title,
              showLegend: parsed.showLegend,
              showDataLabels: parsed.showDataLabels,
              stackedMode: parsed.stackedMode,
              valueFormat: parsed.valueFormat
            });
          }
          return charts;
        }
        static resolvePath(target, baseDir) {
          const parts = (baseDir + "/" + target).split("/");
          const resolved = [];
          for (const part of parts) {
            if (part === "..") resolved.pop();
            else if (part !== ".") resolved.push(part);
          }
          return resolved.join("/");
        }
        static parseChart(doc, themeColors) {
          const plotArea = doc.getElementsByTagNameNS("*", "plotArea")[0] || null;
          if (!plotArea) return null;
          const titleText = this.extractTitle(doc);
          const showLegend = !!doc.getElementsByTagNameNS("*", "legend")[0];
          const showDataLabels = !!plotArea.getElementsByTagNameNS("*", "dLbls")[0];
          const bar = plotArea.getElementsByTagNameNS("*", "barChart")[0] || null;
          const line = plotArea.getElementsByTagNameNS("*", "lineChart")[0] || null;
          const area = plotArea.getElementsByTagNameNS("*", "areaChart")[0] || null;
          const pie = plotArea.getElementsByTagNameNS("*", "pieChart")[0] || null;
          const scatter = plotArea.getElementsByTagNameNS("*", "scatterChart")[0] || null;
          const chartNumFmt = plotArea.getElementsByTagNameNS("*", "dLbls")[0]?.getElementsByTagNameNS("*", "numFmt")[0]?.getAttribute("formatCode") || void 0;
          const palette = [
            themeColors["accent1"],
            themeColors["accent2"],
            themeColors["accent3"],
            themeColors["accent4"],
            themeColors["accent5"],
            themeColors["accent6"]
          ].filter(Boolean);
          if (bar) {
            const cat = this.extractCategories(bar) || [];
            const ser = this.extractSeries(bar, themeColors) || [];
            const barDir = bar.getElementsByTagNameNS("*", "barDir")[0]?.getAttribute("val") || "col";
            const type = barDir === "bar" ? "bar" : "column";
            const grouping = bar.getElementsByTagNameNS("*", "grouping")[0]?.getAttribute("val") || "clustered";
            const stackedMode = grouping === "stacked" ? "stacked" : grouping === "percentStacked" ? "percent" : "none";
            return { type, categories: cat, series: ser, palette, title: titleText, showLegend, showDataLabels, stackedMode, valueFormat: chartNumFmt };
          }
          if (line) {
            const cat = this.extractCategories(line) || [];
            const ser = this.extractSeries(line, themeColors) || [];
            const grouping = line.getElementsByTagNameNS("*", "grouping")[0]?.getAttribute("val") || "standard";
            const stackedMode = grouping === "stacked" ? "stacked" : grouping === "percentStacked" ? "percent" : "none";
            return { type: "line", categories: cat, series: ser, palette, title: titleText, showLegend, showDataLabels, stackedMode, valueFormat: chartNumFmt };
          }
          if (area) {
            const cat = this.extractCategories(area) || [];
            const ser = this.extractSeries(area, themeColors) || [];
            const grouping = area.getElementsByTagNameNS("*", "grouping")[0]?.getAttribute("val") || "standard";
            const stackedMode = grouping === "stacked" ? "stacked" : grouping === "percentStacked" ? "percent" : "none";
            return { type: "area", categories: cat, series: ser, palette, title: titleText, showLegend, showDataLabels, stackedMode, valueFormat: chartNumFmt };
          }
          if (pie) {
            const cat = this.extractCategories(pie) || [];
            const ser = this.extractSeries(pie, themeColors) || [];
            return { type: "pie", categories: cat, series: ser, palette, title: titleText, showLegend, showDataLabels, stackedMode: "none", valueFormat: chartNumFmt };
          }
          if (scatter) {
            const ser = this.extractScatterSeries(scatter, themeColors) || [];
            return { type: "scatter", categories: [], series: ser, palette, title: titleText, showLegend, showDataLabels, stackedMode: "none", valueFormat: chartNumFmt };
          }
          return null;
        }
        static extractTitle(doc) {
          const title = doc.getElementsByTagNameNS("*", "title")[0] || null;
          if (!title) return void 0;
          const tx = title.getElementsByTagNameNS("*", "tx")[0] || null;
          const rich = tx?.getElementsByTagNameNS("*", "rich")[0] || null;
          if (rich) {
            const t = rich.getElementsByTagNameNS("*", "t")[0]?.textContent || void 0;
            return t || void 0;
          }
          const v = tx?.getElementsByTagNameNS("*", "v")[0]?.textContent || void 0;
          return v || void 0;
        }
        static extractCategories(parent) {
          const cat = parent.getElementsByTagNameNS("*", "cat")[0] || null;
          if (!cat) return null;
          const strCache = cat.getElementsByTagNameNS("*", "strCache")[0] || null;
          if (strCache) {
            const pts = Array.from(strCache.getElementsByTagNameNS("*", "pt"));
            return pts.map((p) => p.getElementsByTagNameNS("*", "v")[0]?.textContent || "");
          }
          const numCache = cat.getElementsByTagNameNS("*", "numCache")[0] || null;
          if (numCache) {
            const pts = Array.from(numCache.getElementsByTagNameNS("*", "pt"));
            return pts.map((p) => Number(p.getElementsByTagNameNS("*", "v")[0]?.textContent || 0));
          }
          return null;
        }
        static extractSeries(parent, themeColors) {
          const series = [];
          const sers = Array.from(parent.getElementsByTagNameNS("*", "ser"));
          let idx = 0;
          for (const s of sers) {
            const name = s.getElementsByTagNameNS("*", "tx")[0]?.getElementsByTagNameNS("*", "v")[0]?.textContent || void 0;
            const numCache = s.getElementsByTagNameNS("*", "numCache")[0] || null;
            let values = [];
            if (numCache) {
              const pts = Array.from(numCache.getElementsByTagNameNS("*", "pt"));
              values = pts.map((p) => Number(p.getElementsByTagNameNS("*", "v")[0]?.textContent || 0));
            }
            const valueFormat = s.getElementsByTagNameNS("*", "dLbls")[0]?.getElementsByTagNameNS("*", "numFmt")[0]?.getAttribute("formatCode") || void 0;
            const spPr = s.getElementsByTagNameNS("*", "spPr")[0] || null;
            const solidFill = spPr?.getElementsByTagNameNS("*", "solidFill")[0] || null;
            const color = XmlHelper.getColorFromElement(solidFill, themeColors);
            series.push({ name, values, color, valueFormat });
            idx += 1;
          }
          return series;
        }
        static extractScatterSeries(parent, themeColors) {
          const out = [];
          const sers = Array.from(parent.getElementsByTagNameNS("*", "ser"));
          for (const s of sers) {
            const name = s.getElementsByTagNameNS("*", "tx")[0]?.getElementsByTagNameNS("*", "v")[0]?.textContent || void 0;
            const xCache = s.getElementsByTagNameNS("*", "xVal")[0]?.getElementsByTagNameNS("*", "numCache")[0] || null;
            const yCache = s.getElementsByTagNameNS("*", "yVal")[0]?.getElementsByTagNameNS("*", "numCache")[0] || null;
            const xPts = xCache ? Array.from(xCache.getElementsByTagNameNS("*", "pt")) : [];
            const yPts = yCache ? Array.from(yCache.getElementsByTagNameNS("*", "pt")) : [];
            const len = Math.min(xPts.length, yPts.length);
            const points = [];
            for (let i = 0; i < len; i++) {
              const xv = Number(xPts[i].getElementsByTagNameNS("*", "v")[0]?.textContent || 0);
              const yv = Number(yPts[i].getElementsByTagNameNS("*", "v")[0]?.textContent || 0);
              points.push({ x: xv, y: yv });
            }
            const spPr = s.getElementsByTagNameNS("*", "spPr")[0] || null;
            const solidFill = spPr?.getElementsByTagNameNS("*", "solidFill")[0] || null;
            const color = XmlHelper.getColorFromElement(solidFill, themeColors);
            const valueFormat = s.getElementsByTagNameNS("*", "dLbls")[0]?.getElementsByTagNameNS("*", "numFmt")[0]?.getAttribute("formatCode") || void 0;
            out.push({ name, points, color, valueFormat });
          }
          return out;
        }
      };
      SlideExtractor = class {
        constructor(zip) {
          this.zip = zip;
        }
        /**
         * Extracts all slides in order and parses their visual elements.
         * @returns An array of SlideElement lists (one per slide).
         */
        async extractSlides() {
          const themeXmlStr = await this.zip.file("ppt/theme/theme1.xml")?.async("string");
          const themeXml = themeXmlStr ? XmlHelper.parseXml(themeXmlStr) : null;
          const themeColors = XmlHelper.extractThemeColors(themeXml);
          const themeTableStyles = XmlHelper.extractThemeTableStyles(themeXml);
          const slidePaths = Object.keys(this.zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
            const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
            return numA - numB;
          });
          const slides = [];
          for (const slidePath of slidePaths) {
            const slideXmlStr = await this.zip.file(slidePath).async("string");
            const slideXml = XmlHelper.parseXml(slideXmlStr);
            const spTree = slideXml.querySelector("p\\:spTree") || slideXml.getElementsByTagNameNS("*", "spTree")[0];
            if (!spTree) {
              console.warn(`Warning: no <spTree> found in ${slidePath}`);
              slides.push([]);
              continue;
            }
            const relsPath = slidePath.replace("slides/", "slides/_rels/") + ".rels";
            const relsXml = this.zip.file(relsPath) ? XmlHelper.parseXml(await this.zip.file(relsPath).async("string")) : XmlHelper.parseXml(`<Relationships/>`);
            const layoutRel = XmlHelper.findRelationshipByTypeSuffix(relsXml, "/slideLayout");
            const layoutTarget = layoutRel?.getAttribute("Target") || void 0;
            let layoutSpTree = null;
            let layoutRelsXml = null;
            if (layoutTarget) {
              const layoutPath = this.resolvePath(layoutTarget, "ppt/slides");
              const layoutXmlStr = await this.zip.file(layoutPath)?.async("string");
              if (layoutXmlStr) {
                const layoutXml = XmlHelper.parseXml(layoutXmlStr);
                layoutSpTree = layoutXml.querySelector("p\\:spTree") || layoutXml.getElementsByTagNameNS("*", "spTree")[0] || null;
                const layoutRelsPath = layoutPath.replace("slideLayouts/", "slideLayouts/_rels/") + ".rels";
                layoutRelsXml = this.zip.file(layoutRelsPath) ? XmlHelper.parseXml(await this.zip.file(layoutRelsPath).async("string")) : XmlHelper.parseXml(`<Relationships/>`);
              }
            }
            let masterSpTree = null;
            let masterRelsXml = null;
            if (layoutRelsXml) {
              const masterRel = XmlHelper.findRelationshipByTypeSuffix(layoutRelsXml, "/slideMaster");
              const masterTarget = masterRel?.getAttribute("Target") || void 0;
              if (masterTarget) {
                const masterPath = this.resolvePath(masterTarget, "ppt/slideLayouts");
                const masterXmlStr = await this.zip.file(masterPath)?.async("string");
                if (masterXmlStr) {
                  const masterXml = XmlHelper.parseXml(masterXmlStr);
                  masterSpTree = masterXml.querySelector("p\\:spTree") || masterXml.getElementsByTagNameNS("*", "spTree")[0] || null;
                  const masterRelsPath = masterPath.replace("slideMasters/", "slideMasters/_rels/") + ".rels";
                  masterRelsXml = this.zip.file(masterRelsPath) ? XmlHelper.parseXml(await this.zip.file(masterRelsPath).async("string")) : XmlHelper.parseXml(`<Relationships/>`);
                }
              }
            }
            const slideBg = await this.extractBackground(slideXml, relsXml, "ppt/slides", this.zip, themeColors);
            const layoutBg = layoutRelsXml ? await this.extractBackground(layoutSpTree?.ownerDocument || null, layoutRelsXml, "ppt/slideLayouts", this.zip, themeColors) : null;
            const masterBg = masterRelsXml ? await this.extractBackground(masterSpTree?.ownerDocument || null, masterRelsXml, "ppt/slideMasters", this.zip, themeColors) : null;
            const bgElement = slideBg || layoutBg || masterBg;
            const masterText = masterSpTree ? TextExtractor.extract(masterSpTree, themeColors, { context: "master" }) : [];
            const masterImages = masterSpTree && masterRelsXml ? await ImageExtractor.extract(masterSpTree, masterRelsXml, this.zip, "ppt/slideMasters") : [];
            const masterShapes = masterSpTree ? ShapeExtractor.extract(masterSpTree, themeColors) : [];
            const layoutText = layoutSpTree ? TextExtractor.extract(layoutSpTree, themeColors, { context: "layout" }) : [];
            const layoutImages = layoutSpTree && layoutRelsXml ? await ImageExtractor.extract(layoutSpTree, layoutRelsXml, this.zip, "ppt/slideLayouts") : [];
            const layoutShapes = layoutSpTree ? ShapeExtractor.extract(layoutSpTree, themeColors) : [];
            const masterGeom = this.extractPlaceholderGeom(masterSpTree);
            const layoutGeom = this.extractPlaceholderGeom(layoutSpTree);
            const mergedGeom = { ...masterGeom, ...layoutGeom };
            const slideText = TextExtractor.extract(spTree, themeColors, { context: "slide", placeholderGeom: mergedGeom });
            const slideImages = await ImageExtractor.extract(spTree, relsXml, this.zip, "ppt/slides");
            const slideTables = TableExtractor.extract(spTree, themeColors, themeTableStyles);
            const slideCharts = await ChartExtractor.extract(spTree, relsXml, this.zip, themeColors);
            const slideShapes = ShapeExtractor.extract(spTree, themeColors);
            slides.push([
              ...bgElement ? [bgElement] : [],
              ...masterShapes,
              ...masterImages,
              ...masterText,
              ...layoutShapes,
              ...layoutImages,
              ...layoutText,
              ...slideShapes,
              ...slideTables,
              ...slideCharts,
              ...slideImages,
              ...slideText
            ]);
          }
          return slides;
        }
        /** Normalize a relative path against a base directory inside ppt folder */
        resolvePath(target, baseDir) {
          const parts = (baseDir + "/" + target).split("/");
          const resolved = [];
          for (const part of parts) {
            if (part === "..") {
              if (resolved.length) resolved.pop();
            } else if (part !== "." && part !== "") {
              resolved.push(part);
            }
          }
          return resolved.join("/");
        }
        extractPlaceholderGeom(spTree) {
          const map = {};
          if (!spTree) return map;
          const shapes = spTree.getElementsByTagNameNS("*", "sp");
          for (const shape of Array.from(shapes)) {
            const nvPr = shape.getElementsByTagNameNS("*", "nvPr")[0] ?? null;
            const ph = nvPr?.getElementsByTagNameNS("*", "ph")[0] ?? null;
            const idx = ph?.getAttribute("idx") || void 0;
            if (!idx) continue;
            const xfrm = shape.getElementsByTagNameNS("*", "xfrm")[0] ?? null;
            const off = xfrm?.getElementsByTagNameNS("*", "off")[0] ?? null;
            const ext = xfrm?.getElementsByTagNameNS("*", "ext")[0] ?? null;
            if (!off || !ext) continue;
            map[idx] = {
              x: XmlHelper.getAttrAsNumber(off, "x"),
              y: XmlHelper.getAttrAsNumber(off, "y"),
              cx: XmlHelper.getAttrAsNumber(ext, "cx"),
              cy: XmlHelper.getAttrAsNumber(ext, "cy")
            };
          }
          return map;
        }
        async extractBackground(doc, rels, baseDir, zip, themeColors) {
          if (!doc) return null;
          const bg = doc.getElementsByTagNameNS("*", "bg")[0];
          if (!bg) return null;
          const bgPr = bg.getElementsByTagNameNS("*", "bgPr")[0] || null;
          const solidFill = bgPr?.getElementsByTagNameNS("*", "solidFill")[0] || null;
          const color = XmlHelper.getColorFromElement(solidFill, themeColors);
          if (color) {
            return { type: "background", fillColor: color };
          }
          const bgRef = bg.getElementsByTagNameNS("*", "bgRef")[0] || null;
          const schemeClr = bgRef?.getElementsByTagNameNS("*", "schemeClr")[0] || null;
          const schemeVal = schemeClr?.getAttribute("val") || void 0;
          if (schemeVal && themeColors[schemeVal]) {
            return { type: "background", fillColor: themeColors[schemeVal] };
          }
          const blipFill = bgPr?.getElementsByTagNameNS("*", "blipFill")[0] || null;
          const blip = blipFill?.getElementsByTagNameNS("*", "blip")[0] || null;
          const embedId = blip?.getAttribute("r:embed") || void 0;
          if (embedId && rels) {
            const rel = XmlHelper.findRelationshipById(rels, embedId);
            const target = rel?.getAttribute("Target") || void 0;
            if (target) {
              const fullPath = this.resolvePath(target, baseDir);
              const file = zip.file(fullPath);
              if (file) {
                const binary = await file.async("base64");
                const ext = fullPath.split(".").pop()?.toLowerCase() || "png";
                const dataUri = `data:image/${ext};base64,${binary}`;
                return { type: "background", imageSrc: dataUri };
              }
            }
          }
          return null;
        }
      };
      PptxReader = class {
        zip;
        baseWidthPx;
        baseHeightPx;
        /**
         * Loads and parses a .pptx binary buffer.
         * @param buffer The binary content of a .pptx file.
         * @returns A list of slides, each represented as an array of SlideElement.
         */
        async load(buffer) {
          this.zip = await import_jszip.default.loadAsync(buffer);
          await this.computeSlideBaseSize();
          const extractor = new SlideExtractor(this.zip);
          return extractor.extractSlides();
        }
        /**
         * Returns slide base size in pixels derived from ppt/presentation.xml sldSz (if available).
         * Defaults to 960x540 when not found.
         */
        async getBaseSizePx() {
          if (this.baseWidthPx && this.baseHeightPx) {
            return { width: this.baseWidthPx, height: this.baseHeightPx };
          }
          await this.computeSlideBaseSize();
          return {
            width: Number.isFinite(this.baseWidthPx) && this.baseWidthPx > 0 ? this.baseWidthPx : 960,
            height: Number.isFinite(this.baseHeightPx) && this.baseHeightPx > 0 ? this.baseHeightPx : 540
          };
        }
        async computeSlideBaseSize() {
          try {
            if (!this.zip) return;
            const presFile = this.zip.file("ppt/presentation.xml");
            if (!presFile) return;
            const xmlStr = await presFile.async("string");
            const doc = XmlHelper.parseXml(xmlStr);
            const sldSz = doc.getElementsByTagNameNS("*", "sldSz")[0];
            const cx = sldSz ? Number(sldSz.getAttribute("cx") || 0) : 0;
            const cy = sldSz ? Number(sldSz.getAttribute("cy") || 0) : 0;
            if (Number.isFinite(cx) && Number.isFinite(cy) && cx > 0 && cy > 0) {
              this.baseWidthPx = cx / 9525;
              this.baseHeightPx = cy / 9525;
            }
          } catch {
          }
        }
      };
      HtmlRenderer = class {
        /**
         * Renders a slide to an HTML <div> with all elements positioned accordingly.
         * @param elements List of SlideElement (text, image, shape)
         * @param options Optional width and height (in px) for the slide container.
         *  - If scaleToFit=true, width/height define the outer container size and contents are scaled from the base 960x540.
         * @returns HTML string representing the slide
         */
        static render(elements, options = {}) {
          const baseW = options.baseWidth ?? 960;
          const baseH = options.baseHeight ?? 540;
          const targetW = options.width ?? baseW;
          const targetH = options.height ?? baseH;
          const scaleToFit = options.scaleToFit === true;
          const letterbox = scaleToFit ? options.letterbox !== false : options.letterbox === true;
          const htmlParts = elements.map((el) => {
            switch (el.type) {
              case "background": {
                const hasImg = Boolean(el.imageSrc);
                const styleBg = hasImg ? `background-image: url('${el.imageSrc}'); background-size: cover; background-position: center; background-repeat: no-repeat;` : `background-color: ${el.fillColor || "transparent"};`;
                return `<div style="position:absolute; left:0; top:0; width:${baseW}px; height:${baseH}px; ${styleBg}"></div>`;
              }
              case "text":
                return renderTextElement(el);
              case "image":
                return renderImageElement(el);
              case "shape":
                return renderShapeElement(el, { scaleStrokes: scaleToFit });
              case "table":
                return renderTableElement(el);
              case "chart":
                return renderChartElement(el);
              default:
                if (typeof console !== "undefined" && console.warn) {
                  console.warn(`[pptx-to-html] Unsupported element type: ${el?.type}`);
                }
                return "";
            }
          });
          if (scaleToFit) {
            if (letterbox) {
              const s = Math.min(targetW / baseW, targetH / baseH);
              const offsetX = (targetW - baseW * s) / 2;
              const offsetY = (targetH - baseH * s) / 2;
              return `<div class="slide-container" style="position: relative; width: ${targetW}px; height: ${targetH}px; overflow: hidden; background-color: #000;">
            <div class="slide" style="position: absolute; left: ${offsetX}px; top: ${offsetY}px; width: ${baseW}px; height: ${baseH}px; transform: scale(${s}); transform-origin: top left; background-color: #fff;">
              ${htmlParts.join("\n")}
            </div>
          </div>`;
            } else {
              const sx = targetW / baseW;
              const sy = targetH / baseH;
              return `<div class="slide-container" style="position: relative; width: ${targetW}px; height: ${targetH}px; overflow: hidden;">
            <div class="slide" style="position: absolute; left: 0; top: 0; width: ${baseW}px; height: ${baseH}px; transform: scale(${sx}, ${sy}); transform-origin: top left; background-color: #fff;">
              ${htmlParts.join("\n")}
            </div>
          </div>`;
            }
          }
          return `<div class="slide" style="position: relative; width: ${targetW}px; height: ${targetH}px; overflow: hidden; background-color: #fff;">
        ${htmlParts.join("\n")}
      </div>`;
        }
      };
    }
  });

  // entry.js
  var require_entry = __commonJS({
    "entry.js"() {
      init_dist();
      window.pptxToHtml = pptxToHtml;
    }
  });
  return require_entry();
})();
/*! Bundled license information:

jszip/dist/jszip.min.js:
  (*!
  
  JSZip v3.10.1 - A JavaScript class for generating and reading zip files
  <http://stuartk.com/jszip>
  
  (c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
  Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.
  
  JSZip uses the library pako released under the MIT license :
  https://github.com/nodeca/pako/blob/main/LICENSE
  *)
*/
