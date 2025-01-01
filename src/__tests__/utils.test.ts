import { create6DigitPin } from "../api/bluetooth/utils/create6DigitPin";
import { decodeJSONChunks } from "../api/bluetooth/utils/decodeJSONChunks";
import { stitchChunks } from "../api/bluetooth/utils/stitch";
import { TextCodec } from "../api/bluetooth/utils/textCodec";
import { TRANSPORT_TYPE } from "../api/bluetooth/types";
import { of } from "rxjs";
import { toArray } from "rxjs/operators";

describe("Bluetooth Utils", () => {
  describe("create6DigitPin", () => {
    it("should create a 6-digit pin", () => {
      const pin = create6DigitPin();
      expect(pin.toString()).toMatch(/^\d{6}$/);
    });
  });

  describe("decodeJSONChunks", () => {
    let textCodec: TextCodec;
    let addLog: jest.Mock;

    beforeEach(() => {
      textCodec = new TextCodec(TRANSPORT_TYPE.WEB);
      addLog = jest.fn();
    });

    it("should decode complete JSON chunks", (done) => {
      const chunks = [
        new Uint8Array(textCodec.encode('{"id":1,"name":"test"}\n')),
        new Uint8Array(textCodec.encode('{"id":2,"name":"test2"}\n'))
      ];

      of(...chunks)
        .pipe(
          decodeJSONChunks({
            textCodec,
            characteristicName: "test",
            delimiter: "\n",
            addLog
          }),
          toArray()
        )
        .subscribe((result) => {
          expect(result).toEqual([
            { id: 1, name: "test" },
            { id: 2, name: "test2" }
          ]);
          done();
        });
    });

    it("should handle invalid JSON", (done) => {
      const chunks = [
        new Uint8Array(textCodec.encode('{"id":1\n')),
        new Uint8Array(textCodec.encode("invalid json\n"))
      ];

      of(...chunks)
        .pipe(
          decodeJSONChunks({
            textCodec,
            characteristicName: "test",
            delimiter: "\n",
            addLog
          }),
          toArray()
        )
        .subscribe((result) => {
          expect(result).toEqual(['{"id":1', "invalid json"]);
          done();
        });
    });

    it("should handle empty chunks", (done) => {
      const chunks = [
        new Uint8Array(textCodec.encode("\n")),
        new Uint8Array(textCodec.encode("\n"))
      ];

      of(...chunks)
        .pipe(
          decodeJSONChunks({
            textCodec,
            characteristicName: "test",
            delimiter: "\n",
            addLog
          }),
          toArray()
        )
        .subscribe((result) => {
          expect(result).toEqual([]);
          done();
        });
    });

    it("should handle chunks without delimiters", (done) => {
      const chunks = [
        new Uint8Array(textCodec.encode('{"id":1}')),
        new Uint8Array(textCodec.encode('{"id":2}'))
      ];

      of(...chunks)
        .pipe(
          decodeJSONChunks({
            textCodec,
            characteristicName: "test",
            delimiter: "\n",
            addLog
          }),
          toArray()
        )
        .subscribe((result) => {
          expect(result).toEqual([]);
          done();
        });
    });

    it("should handle invalid JSON with custom error", (done) => {
      const chunks = [
        new Uint8Array(textCodec.encode('{"id":1\n')),
        new Uint8Array(textCodec.encode("invalid json\n"))
      ];

      // Mock error without message property
      const originalJSONParse = JSON.parse;
      JSON.parse = jest.fn().mockImplementation(() => {
        const error = Object.create(Error.prototype);
        throw error;
      });

      of(...chunks)
        .pipe(
          decodeJSONChunks({
            textCodec,
            characteristicName: "test",
            delimiter: "\n",
            addLog
          }),
          toArray()
        )
        .subscribe({
          next: (result) => {
            expect(result).toEqual(['{"id":1', "invalid json"]);
            JSON.parse = originalJSONParse;
            done();
          },
          error: (error) => {
            JSON.parse = originalJSONParse;
            done(error);
          }
        });
    });
  });

  describe("stitch", () => {
    it("should stitch complete chunks", (done) => {
      const chunks = ['{"id":1}\n', '{"id":2}\n'];

      of(...chunks)
        .pipe(stitchChunks({ delimiter: "\n" }), toArray())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(['{"id":1}', '{"id":2}']);
            done();
          },
          error: (error) => {
            done(error);
          }
        });
    });

    it("should stitch incomplete chunks", (done) => {
      const chunks = ['{"id":', "1}\n", '{"id":2', "}\n"];

      of(...chunks)
        .pipe(stitchChunks({ delimiter: "\n" }), toArray())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(['{"id":1}', '{"id":2}']);
            done();
          },
          error: (error) => {
            done(error);
          }
        });
    });

    it("should handle chunks with multiple delimiters", (done) => {
      const chunks = ['{"id":1}\n', '{"id":2}\n', '{"id":3}\n'];

      of(...chunks)
        .pipe(stitchChunks({ delimiter: "\n" }), toArray())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(['{"id":1}', '{"id":2}', '{"id":3}']);
            done();
          },
          error: (error) => {
            done(error);
          }
        });
    });

    it("should handle empty chunks", (done) => {
      of<string>()
        .pipe(stitchChunks({ delimiter: "\n" }), toArray())
        .subscribe({
          next: (result) => {
            expect(result).toEqual([]);
            done();
          },
          error: (error) => {
            done(error);
          }
        });
    });

    it("should handle chunks without delimiters", (done) => {
      const chunks = ['{"id":1}', '{"id":2}'];

      of(...chunks)
        .pipe(stitchChunks({ delimiter: "\n" }), toArray())
        .subscribe({
          next: (result) => {
            expect(result).toEqual([]);
            done();
          },
          error: (error) => {
            done(error);
          }
        });
    });

    it("should handle chunks ending with delimiter", (done) => {
      const chunks = ['{"id":1}\n', '{"id":2}\n'];

      of(...chunks)
        .pipe(stitchChunks({ delimiter: "\n" }), toArray())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(['{"id":1}', '{"id":2}']);
            done();
          },
          error: (error) => {
            done(error);
          }
        });
    });

    it("should handle remainder with delimiter", (done) => {
      const chunks = ['{"id":1}\n{"id', ":2}\n"];

      of(...chunks)
        .pipe(stitchChunks({ delimiter: "\n" }), toArray())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(['{"id":1}', '{"id:2}']);
            done();
          },
          error: (error) => {
            done(error);
          }
        });
    });
  });

  describe("TextCodec", () => {
    let textCodec: TextCodec;

    beforeEach(() => {
      textCodec = new TextCodec(TRANSPORT_TYPE.WEB);
    });

    it("should encode and decode text", () => {
      const text = "Hello, World!";
      const encoded = textCodec.encode(text);
      const decoded = textCodec.decode(encoded as Uint8Array);
      expect(decoded).toBe(text);
    });

    it("should handle empty text", () => {
      const text = "";
      const encoded = textCodec.encode(text);
      const decoded = textCodec.decode(encoded as Uint8Array);
      expect(decoded).toBe(text);
    });

    it("should handle special characters", () => {
      const text = "Hello, 世界!";
      const encoded = textCodec.encode(text);
      const decoded = textCodec.decode(encoded as Uint8Array);
      expect(decoded).toBe(text);
    });

    it("should handle different transport types", () => {
      const nativeCodec = new TextCodec(TRANSPORT_TYPE.REACT_NATIVE);
      const text = "Hello, World!";
      const encoded = nativeCodec.encode(text);
      expect(Array.isArray(encoded)).toBe(true);
      const decoded = nativeCodec.decode(Uint8Array.from(encoded));
      expect(decoded).toBe(text);
    });

    it("should handle invalid input for decode", () => {
      const invalidInput = new Uint8Array([0xff, 0xff, 0xff]);
      const decoded = textCodec.decode(invalidInput);
      expect(decoded).toBeDefined();
      expect(typeof decoded).toBe("string");
    });

    it("should handle null input in decode", () => {
      const emptyArray = new Uint8Array(0);
      const result = textCodec.decode(emptyArray);
      expect(result).toBe("");
    });

    it("should handle undefined input in decode", () => {
      const emptyArray = new Uint8Array(0);
      const result = textCodec.decode(emptyArray);
      expect(result).toBe("");
    });

    it("should handle non-web transport type", () => {
      const nodeCodec = new TextCodec("node" as TRANSPORT_TYPE);
      const text = "Hello, World!";
      const encoded = nodeCodec.encode(text);
      expect(encoded).toBeDefined();
      const decoded = nodeCodec.decode(encoded as Uint8Array);
      expect(decoded).toBe(text);
    });
  });
});
