module.exports = {
	guildOnly: true,
	group: 'serverManager',
	execute(client, msg, args) {
		const [action, module, option, val] = args.slice(0, 4);
		const usage = `\n\n**Usage**\n\n@${client.user.tag} list/add/remove/set module/command option value`;
		if (!['list', 'add', 'remove', 'set'].includes(action)) {
			msg.reply(`Invalid action name '${action}', the following are valid:\n - list\n - add\n - remove\n - set` + usage);
			return;
		}
		const util = require('../util.js');
		if (!client.config[msg.guild.id][module]) {
			msg.reply(`Invalid module name ${module}\n` +
				`the following modules exist:\n` +
				` - ${Object.keys(client.config[msg.guild.id]).join('\n - ')}` + usage);
			return;
		}
		if (!client.config[msg.guild.id][module][option]) {
			console.log(client.config[msg.guild.id][option]);
			msg.reply(`Invalid option ${option} for module ${module}\n` +
				`the following options exist for module ${module}:\n` +
				` - ${Object.keys(client.config[msg.guild.id][module]).join('\n - ')}` + usage);
			return;
		}
		let response, value = '';
		switch (action) {
			case 'list':
				response = `The value(s) for ${option} in module ${module} is/are:\n - `;
				value = client.config[msg.guild.id][module][option];
				if (Array.isArray(value)) value = value.join('\n - ');
				msg.reply(response + value);
				break;
			case 'add':
				value = client.config[msg.guild.id][module][option];
				if (!Array.isArray(value)) {
					msg.reply('Not a list, please use \'set\'');
					return;
				}
				client.config[msg.guild.id][module][option].push(val.match(/\d/g).join(''));
				response = `The the new value(s) for ${option} in module ${module} is/are:\n - `;
				value = client.config[msg.guild.id][module][option].join('\n - ');
				msg.reply(response + value);
				break;
			case 'remove':
				value = client.config[msg.guild.id][module][option];
				id = val.match(/\d/g).join('');
				if (!Array.isArray(value)) {
					msg.reply('Not a list, please use \'set\'');
					return;
				}
				if (value.indexOf(id) !== -1) {
					client.config[msg.guild.id][module][option].splice(value.indexOf(id), 1);
					response = `The the new value(s) for ${option} in module ${module} is/are:\n - `;
				} else {
					response = `I did not find that :cry:\nthe the value(s) for ${option} in module ${module} is/are:\n - `;
				}
				value = client.config[msg.guild.id][module][option].join('\n - ');
				msg.reply(response + value);
				break;
			case 'set':
				value = client.config[msg.guild.id][module][option];
				if (Array.isArray(value)) {
					msg.reply('This is a list, please use \'add\' and \'remove\'');
					return;
				}
				client.config[msg.guild.id][module][option] = val;
				response = `The the new value for ${option} in module ${module} is: `;
				value = client.config[msg.guild.id][module][option];
				msg.reply(response + value);
				break;
			default:
				msg.reply(`I wasn't able to understand ${action}, try using:\n- list (works for everything)\n- add (for lists)\n- remove (for lists)\n- set (not for lists)`);
				return;
		};
		util.saveConfig(client);
	}
}
