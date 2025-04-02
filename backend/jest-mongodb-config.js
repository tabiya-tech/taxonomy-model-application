module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: "7.0.14", // Version of mongoDB to use
    },
    instance: {},
    autoStart: false,
  },
  mongoURLEnvName: "MONGODB_URI",
};
