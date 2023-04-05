const version = require('./version.json');
exports.handler = async ()=>{
    return JSON.stringify(version)
}