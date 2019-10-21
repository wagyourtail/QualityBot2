'use strict';
const redis = require('redis');
const db = redis.createClient({db: 1});

module.exports.getGuild = function(guildID, prefix) {
    return new Promise((resolve, reject) => {
        db.sismember("Guilds", guildID, (error, reply) => {
            if (reply == 0) {
                db.set(`Guilds:${guildID}`, `{ "prefix": "${prefix}", "enabled": ["default"] }`);
                db.sadd("Guilds", guildID);
                resolve({prefix:prefix, enabled:["default"]});
            } else {
                db.get(`Guilds:${guildID}`, (error, reply) => {
                    const data = JSON.parse(reply);
                    resolve(data);
                });
            }
        });
    });
}

module.exports.getGuildPluginAliasesAndPerms = function(guildID, plugin, defaultPluginAliases, defaultPluginPerms) {
    return new Promise((resolve, reject) => {
        db.sismember(`Guilds:${guildID}:Plugins`, plugin, (error, reply) => {
            if (reply == 0) {
                db.hmset(`Guilds:${guildID}:Plugins:${plugin}`, "Alias", JSON.stringify(defaultPluginAliases), "Perms", JSON.stringify(defaultPluginPerms));
                db.sadd(`Guilds:${guildID}:Plugins`, plugin);
                resolve({aliases:defaultPluginAliases, perms:defaultPluginPerms});
            } else {
                db.hmget(`Guilds:${guildID}:Plugins:${plugin}`, "Alias", "Perms", (err, res) => {
                    try {
                        resolve({aliases:JSON.parse(res[0]), perms:JSON.parse(res[1])});
                    } catch(e) {
                        console.log(err);
                    }
                });
            }
        });
    });
}

module.exports.setGuildPluginAliases = function(guildID, plugin, aliasesObject) {
    db.hset(`Guilds:${guildID}:Plugins:${plugin}`, "Alias", JSON.stringify(aliasesObject));
}

module.exports.setGuildPluginPerms = function(guildID, plugin, permsObject) {
    db.hset(`Guilds:${guildID}:Plugins:${plugin}`, "Perms", JSON.stringify(permsObject));
}

module.exports.getClientToken = function(clientID) {
    return new Promise((resolve, reject) => {
        db.sismember("Secrets", clientID, (err, reply) => {
            if (reply == 0)
                throw "Bot Not Found";
            else {
                db.hget(`Secrets:${clientID}`, "Token", (err, reply) => {
                    resolve(reply);
                });
            }
        });
    });
}

module.exports.getClientSecret = function(clientID) {
    return new Promise((resolve, reject) => {
        db.sismember("Secrets", clientID, (err, reply) => {
            if (reply == 0)
                throw "Bot Not Found";
            else {
                db.hget(`Secrets:${clientID}`, "Secret", (err, reply) => {
                    resolve(reply);
                });
            }
        });
    });
}
