import Buffer from "buffer/";

export const encoder = new TextEncoder();
export const decoder = new TextDecoder("utf-8");

export function decodeBuffer(data: any): string {
  // https://github.com/feross/buffer
  const buffer = Buffer.Buffer.from(data);

  return decoder.decode(buffer);
}
