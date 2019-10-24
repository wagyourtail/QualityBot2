const db = require('./Database.js');
const request = require('request');

Number.prototype.hexpad = function(n) {
    const o = [];
    for (let a = 0; a < n - this.toString(16).length; a++) o.push('0');
    return o.join('') + this.toString(16);
}

module.exports.getGuildRoles = function(guildID) {
    return new Promise(async (resolve, reject) => {
        // the prefix value doesn't matter because we check to make sure it's defined in the webserver main file.
        const BotIDs = await db.getClients();
        let guildData;
        let i = 0;
        do {
            const token = await db.getClientToken(BotIDs[i]);
            guildRoles = await new Promise((r,j) => {request({url:`https://discordapp.com/api/guilds/${guildID}/roles`, headers: {Authorization:`Bot ${token}`}}, (err, res, bod) => {r(JSON.parse(bod))})});
            i++;
        } while (guildRoles && guildRoles.constructor !== Array && i < BotIDs.length);
        const roles = {}
        for (const role of guildRoles) {
            roles[role.name == "@everyone" ? role.name : role.id] = {name: role.name, color: role.color.hexpad(6), position:role.position};
        }
        resolve(roles);
    });
}
