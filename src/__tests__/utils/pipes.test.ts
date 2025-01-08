import { of } from "rxjs";
import { addInfo, bufferToEpoch, epoch } from "../../utils/pipes";
import { Sample } from "../../types/sample";
import { Epoch } from "../../types/epoch";

describe("Pipe Utilities", () => {
  describe("addInfo", () => {
    it("should add static info to sample", (done) => {
      const sample: Sample = {
        data: [1, 2, 3],
        timestamp: 1000
      };

      const info = {
        channelNames: ["C3", "C4", "Cz"],
        samplingRate: 256
      };

      of(sample)
        .pipe(addInfo(info))
        .subscribe((result) => {
          expect(result.info).toEqual(info);
          done();
        });
    });

    it("should add dynamic info to sample", (done) => {
      const sample: Sample = {
        data: [1, 2, 3],
        timestamp: 1000
      };

      const dynamicInfo = (sample: Sample) => ({
        channelCount: sample.data.length,
        timestamp: sample.timestamp
      });

      of(sample)
        .pipe(addInfo(dynamicInfo))
        .subscribe((result) => {
          expect(result.info).toEqual({
            channelCount: 3,
            timestamp: 1000
          });
          done();
        });
    });
  });

  describe("bufferToEpoch", () => {
    it("should convert sample array to epoch", (done) => {
      const samples: Sample[] = [
        { data: [1, 4], timestamp: 1000 },
        { data: [2, 5], timestamp: 1001 },
        { data: [3, 6], timestamp: 1002 }
      ];

      of(samples)
        .pipe(bufferToEpoch({ samplingRate: 256 }))
        .subscribe((result: Epoch) => {
          expect(result.data).toEqual([
            [1, 2, 3], // Channel 1
            [4, 5, 6] // Channel 2
          ]);
          expect(result.info.startTime).toBe(1000);
          expect(result.info.samplingRate).toBe(256);
          done();
        });
    });

    it("should handle empty sample array", (done) => {
      const samples: Sample[] = [];

      of(samples)
        .pipe(bufferToEpoch({ samplingRate: 256 }))
        .subscribe((result: Epoch) => {
          expect(result.data).toEqual([]);
          expect(result.info.startTime).toBe(0);
          expect(result.info.samplingRate).toBe(256);
          expect(result.info.channelNames).toEqual([]);
          done();
        });
    });

    it("should prefer samplingRate from sample info if available", (done) => {
      const samples: Sample[] = [
        {
          data: [1, 4],
          timestamp: 1000,
          info: { samplingRate: 512 }
        }
      ];

      of(samples)
        .pipe(bufferToEpoch({ samplingRate: 256 }))
        .subscribe((result: Epoch) => {
          expect(result.info.samplingRate).toBe(512);
          done();
        });
    });

    it("should handle non-numeric samplingRate in sample info", (done) => {
      const samples: Sample[] = [
        {
          data: [1, 4],
          timestamp: 1000,
          info: { samplingRate: "invalid" }
        }
      ];

      of(samples)
        .pipe(bufferToEpoch({ samplingRate: 256 }))
        .subscribe((result: Epoch) => {
          expect(result.info.samplingRate).toBe(256);
          done();
        });
    });
  });

  describe("epoch", () => {
    it("should create epochs from sample stream", (done) => {
      const samples: Sample[] = [
        { data: [1, 4], timestamp: 1000 },
        { data: [2, 5], timestamp: 1001 },
        { data: [3, 6], timestamp: 1002 }
      ];

      let epochCount = 0;
      of(...samples)
        .pipe(
          epoch({
            duration: 3,
            interval: 1,
            samplingRate: 256
          })
        )
        .subscribe({
          next: (result: Epoch) => {
            epochCount++;
            expect(result.data.length).toBe(2); // 2 channels
            expect(result.data[0].length).toBe(3); // 3 samples per channel
            expect(result.info.samplingRate).toBe(256);
          },
          complete: () => {
            expect(epochCount).toBeGreaterThan(0);
            done();
          }
        });
    });
  });
});
