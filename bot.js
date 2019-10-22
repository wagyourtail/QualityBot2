const Discord = require("./CommandHandler2.js");
const fs = require("fs");
const Client = new Discord.Client(require("./Database.js"), "!!", "100748674849579008");



if (!fs.existsSync("./plugins")) {
    fs.mkdirSync("./plugins");
}
const folders = fs.readdirSync("./plugins");
for (const plugin of folders) {
    require(`./plugins/${plugin}/${plugin}.js`).load(Client);
    if (fs.existsSync(`./plugins/${plugin}/web/views`) && !fs.existsSync(`./views/plugins/${plugin}`)) {
        fs.symlinkSync(fs.realpathSync(`./plugins/${plugin}/web/views`), `./views/plugins/${plugin}`);
    }
}

Client.database.getClientToken("560741159903821824").then((secret) => { //obviously this'll change based on your implementation of storing secrets.
    Client.login(secret);
});
