'use strict';

module.exports = {
    guildOnly: false,
    group: 'botOwner',
    execute(client, msg, args) {
        let code = args.join(' '), util = require('util'), codeBlock = /^```(js|javascript)(.*)```$/si;
        if(codeBlock.test(code)) code = code.match(codeBlock)[2].trim();
        try {
            let evaled = eval(code);
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