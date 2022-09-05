import { pipe } from "rxjs";
import { map, scan, filter } from "rxjs/operators";

type StitchChunkOptions = {
  delimiter: string;
};

export function stitchChunks({ delimiter }: StitchChunkOptions) {
  return pipe(
    scan(
      (
        [remainder]: [string, string],
        currentBuffer: string
      ): [string, string] => {
        const nextBuffer = remainder + currentBuffer;

        if (!nextBuffer.includes(delimiter)) {
          return [nextBuffer, ""];
        }

        if (nextBuffer.endsWith(delimiter)) {
          return ["", nextBuffer];
        }

        const remainderStart = nextBuffer.lastIndexOf(delimiter);
        const remainderIndex = remainderStart + delimiter.length;
        const nextPacket = nextBuffer.slice(0, remainderIndex);
        const nextRemainder = nextBuffer.slice(remainderIndex);

        return [nextRemainder, nextPacket];
      },
      ["", ""]
    ),
    map(([, nextPacket]: string[]): string =>
      nextPacket.slice(0, -delimiter.length)
    ),
    filter((nextPacket: string): boolean => !!nextPacket.length)
  );
}
