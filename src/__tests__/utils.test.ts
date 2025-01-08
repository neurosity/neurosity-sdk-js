import { create6DigitPin } from "../api/bluetooth/utils/create6DigitPin";
import { decodeJSONChunks } from "../api/bluetooth/utils/decodeJSONChunks";
import { stitchChunks } from "../api/bluetooth/utils/stitch";
import { TextCodec } from "../api/bluetooth/utils/textCodec";
import { TRANSPORT_TYPE } from "../api/bluetooth/types";
import { of } from "rxjs";
import { toArray } from "rxjs/operators";

describe("Utils", () => {
  describe("create6DigitPin", () => {
    it("should create a 6-digit pin", () => {
      const pin = create6DigitPin();
      expect(pin).toMatch(/^\d{6}$/);
    });

    it("should create different pins on subsequent calls", () => {
      const pin1 = create6DigitPin();
      const pin2 = create6DigitPin();
      expect(pin1).not.toBe(pin2);
    });
  });

  describe("decodeJSONChunks", () => {
    let textCodec: TextCodec;

    beforeEach(() => {
      textCodec = new TextCodec(TRANSPORT_TYPE.WEB);
    });

    it("should decode valid JSON chunks", (done) => {
      const options = {
        textCodec,
        characteristicName: "test",
        delimiter: "\n",
        addLog: jest.fn()
      };

      const chunks = [
        new Uint8Array(textCodec.encode('{"name":"test","value":123}\n'))
      ];

      of(...chunks)
        .pipe(decodeJSONChunks(options), toArray())
        .subscribe((result) => {
          expect(result).toEqual([{ name: "test", value: 123 }]);
          done();
        });
    });

    it("should handle empty chunks", (done) => {
      const options = {
        textCodec,
        characteristicName: "test",
        delimiter: "\n",
        addLog: jest.fn()
      };

      of<Uint8Array>()
        .pipe(decodeJSONChunks(options), toArray())
        .subscribe((result) => {
          expect(result).toEqual([]);
          done();
        });
    });

    it("should handle invalid JSON", (done) => {
      const options = {
        textCodec,
        characteristicName: "test",
        delimiter: "\n",
        addLog: jest.fn()
      };

      const chunks = [
        new Uint8Array(textCodec.encode('{"name":"test","value":invalid}\n'))
      ];

      of(...chunks)
        .pipe(decodeJSONChunks(options), toArray())
        .subscribe((result) => {
          expect(result).toEqual(['{"name":"test","value":invalid}']);
          done();
        });
    });
  });

  describe("stitchChunks", () => {
    it("should stitch chunks together", (done) => {
      const options = { delimiter: "\n" };
      const chunks = ["Hello\n", " World\n"];

      of(...chunks)
        .pipe(stitchChunks(options), toArray())
        .subscribe((result) => {
          expect(result).toEqual(["Hello", " World"]);
          done();
        });
    });

    it("should handle empty chunks", (done) => {
      const options = { delimiter: "\n" };

      of<string>()
        .pipe(stitchChunks(options), toArray())
        .subscribe((result) => {
          expect(result).toEqual([]);
          done();
        });
    });

    it("should handle single chunk", (done) => {
      const options = { delimiter: "\n" };
      const chunks = ["Test\n"];

      of(...chunks)
        .pipe(stitchChunks(options), toArray())
        .subscribe((result) => {
          expect(result).toEqual(["Test"]);
          done();
        });
    });
  });
});
