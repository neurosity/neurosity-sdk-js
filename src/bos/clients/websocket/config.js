const devConfig = {
  socketUrl: "http://neurosity.app",
  deviceId: null,
  autoConnect: false
};

const prodConfig = {
  socketUrl: "http://neurosity.app",
  deviceId: null,
  autoConnect: false
};

export const defaultConfig =
  process.env.NODE_ENV === "production" ? prodConfig : devConfig;
