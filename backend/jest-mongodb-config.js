module.exports = {
    mongodbMemoryServerOptions: {
        binary: {
            version: '6.0.4', // Use MongoDB version 5.0 to match the lastest supported version from DocumentDB
        },
        instance: {},
        autoStart: false,
    },
    mongoURLEnvName: 'MONGODB_URI',
};