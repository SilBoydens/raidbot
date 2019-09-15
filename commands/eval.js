'use strict';

module.exports = {
    guildOnly: false,
    group: 'botOwner',
    async execute(client, msg, args) {
        let code = args.join(' '), util = require('util'), block = /^```(?:js|javascript)(.*)```$/si;
        try {
            let evaled = await eval(block.test(code) ? code.match(block)[1].trim() : code);
            if(typeof evaled !== 'string') {
                evaled = util.inspect(evaled).replace(/`/g, '`' + String.fromCharCode(8203));
            }
            msg.channel.send(`\`\`\`js\n${evaled}\`\`\``);
        } catch(error) {
            error = ('' + error).replace(/`/g, '`' + String.fromCharCode(8203));
            msg.channel.send(`\`\`\`js\n${error}\`\`\``);
        }
    }
};
