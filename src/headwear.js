import { Observable } from "rxjs";
import BosClient from "./bos";

const defaultOptions = {
  cloud: false,
  autoConnect: true
};

export default class Headwear extends BosClient {
  
  cosntructor (options = {}) {
    this.options = {
      ...defaultOptions,
      ...options
    };
    super(this.options);
  }

  async getInfo () {
    return await {
      channels: 8,
      manufacturer: "Neurosity, Inc"
    };
  }

  of (type, ...payload) {
    this.emit(`${type}_START`, ...payload);

    return new Observable(observer => {
      this.on(type, (...data) => {
        observer.next(...data);
      });
      return () => {
        this.emit(`${type}_STOP`);
      };
    });
  }

  brainwaves (...args) {
    return this.of("BRAINWAVES", ...args);
  }

  awareness (...args) {
    return this.of("AWARENESS", ...args);
  }

  emotion (...args) {
    return this.of("EMOTION", ...args);
  }

  kinesis (...args) {
    return this.of("KINESIS", ...args);
  }

  facialExpression (...args) {
    return this.of("FACIAL_EXPRESSION", ...args);
  }

  status (...args) {
    return this.of("STATUS", ...args);
  }

  channelAnalysis (...args) {
    return this.of("CHANNEL_ANALYSIS", ...args);
  }

  acceleration (...args) {
    return this.of("ACCELERATION", ...args);
  }
}
