const fs = require('fs');
const db = require('../../Database.js');
const request = require('request');

Number.prototype.hexpad = function(n) {
    const o = [];
    for (let a = 0; a < n - this.toString(16).length; a++) o.push('0');
    return o.join('') + this.toString(16);
}

module.exports.get = function(guildID) {
    return new Promise(async (resolve, reject) => {
        // the prefix value doesn't matter because we check to make sure it's defined in the webserver main file.
        const BotIDs = await db.getClients();
        let guildData;
        let i = 0;
        do {
            const token = await db.getClientToken(BotIDs[i]);
            guildData = await new Promise((r,j) => {request({url:`https://discordapp.com/api/guilds/${guildID}`, headers: {Authorization:`Bot ${token}`}}, (err, res, bod) => {r(JSON.parse(bod))})});
            i++;
        } while (guildData.message && i < BotIDs.length);
        const roles = []
        for (const role of guildData.roles) {
            roles.push({name: role.name, color: role.color.hexpad(6), id: role.id, position:role.position});
        }
        resolve({roles: roles, nopost:true})
    });
}

module.exports.put = function(guildID, data) {} //no data duh
