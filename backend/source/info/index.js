const version = require('./version.json');
exports.handler = async ()=>{
    return version
}