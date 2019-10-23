const fs = require('fs');
const db = require('../../Database.js');
const plugins = fs.readdirSync("./plugins").filter(e => e != "null");


module.exports.get = function(guildID) {
    return new Promise((resolve, reject) => {
        // the prefix value doesn't matter because we check to make sure it's defined in the webserver main file.
        db.getGuild(guildID, "!!").then((data) => {
            resolve({plugins:plugins, enabled:data.enabled});
        });
    });
}

module.exports.put = function(guildID, data) {
    db.setGuildEnabled(guildID, Object.keys(data).filter(k => plugins.includes(k)));
}
