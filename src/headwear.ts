import { Observable } from "rxjs";
import BosClient from "./bos/index";
import IOptions from "./options.i";

const defaultOptions = {
  cloud: false,
  autoConnect: true
};

export class Headwear extends BosClient {
  
  constructor(options?: IOptions) {
    super({
      ...defaultOptions,
      ...options
    });
  }

  public async getInfo() {
    return await {
      channels: 8,
      manufacturer: "Neurosity, Inc"
    };
  }

  private of(type, ...payload) {
    this.emit(`${type}_start`, ...payload);

    return new Observable(observer => {
      this.on(type, (...data) => {
        observer.next(...data);
      });
      return () => {
        this.emit(`${type}_stop`);
      };
    });
  }

  public brainwaves(...args) {
    return this.of("brainwaves", ...args);
  }

  public awareness(...args) {
    return this.of("awareness", ...args);
  }

  public emotion(...args) {
    return this.of("emotion", ...args);
  }

  public kinesis(...args) {
    return this.of("kinesis", ...args);
  }

  public facialExpression(...args) {
    return this.of("facialExpression", ...args);
  }

  public status(...args) {
    return this.of("status", ...args);
  }

  public channelAnalysis(...args) {
    return this.of("channelAnalysis", ...args);
  }

  public acceleration(...args) {
    return this.of("acceleration", ...args);
  }
}

export default Headwear;
