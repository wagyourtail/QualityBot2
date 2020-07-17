const Discord = require("../../CommandHandler2.js");
const { Aki } = require('aki-api');

const ids = {};

const waitForReact = (channel,author,msg) => {
	return new Promise((res)=>{
		const filter = (r,u) => u.id == author.id;
		const sel = {"✔":0,"✖":1,"ℹ":2,"🇵":3,"🇳":4}

		msg.awaitReactions(filter, {max:1}).then(collected => {
			Array.from(collected.values())[0].remove(author.id);
			if (Object.keys(sel).includes(collected.keyArray()[0])) {
				res(sel[collected.keyArray()[0]]);
			}
			else {
				waitForReact(gd,channel,author).then(res);
			}
		})
	})
}


class akinator extends Discord.Command {
	constructor() {
        super("akinator", [], "akinator", "start a game of akinator", true);
    }
    message(content, author, channel, guild, message, handler) {
		const a = async () => {
			const gd = new Aki('en');
			await gd.start();
			const msg = await channel.send(new Discord.RichEmbed().setTitle("Akinator").setDescription(`Question #${ni.nextStep+1}`).addField(gd.question,`Progress: ${parseInt(ni.progress)}%`).addField("Options","✔:Yes	✖:No	ℹ:Don't Know	🇵:Probably	🇳:Probably Not", true))
			msg.react("✔").then(()=>{msg.react("✖").then(()=>{msg.react("ℹ").then(()=>{msg.react("🇵").then(()=>{msg.react("🇳")})})})});
				do {
					await gd.step(await waitForReact(channel, author, msg));
					msg.edit(new Discord.RichEmbed().setTitle("Akinator").setDescription(`Question #${gd.currentStep}`).addField(ni.nextQuestion,`Progress: ${parseInt(gd.progress)}%`).addField("Options","✔:Yes	✖:No	ℹ:Don't Know	🇵:Probably	🇳:Probably Not", true))
				} while (parseFloat(gd.progress) < 85);
			await gd.win();
			msg.edit(new Discord.RichEmbed().setTitle("Akinator").setDescription("").addField(`${gd.answers[0].name}`, `${gd.answers[0].description}`, true).addField(`Questions: ${gd.currentStep}`, `certainty: ${parseInt(parseFloat(gd.answers[0].proba) * 100)}%`).setImage(gd.answers[0].absolute_picture_path))
				msg.clearReactions();
		}
		a();
	}
}

class AkinatorPL extends Discord.Plugin {
    constructor() {
        super("Akinator", "Akinator does akinator.");
        this.addCommand(new akinator());
    }
}

module.exports.load = function (client) {
	client.addPlugin(new AkinatorPL());
}
