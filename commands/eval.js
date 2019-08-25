module.exports = {
    guildOnly: false,
    group: 'botOwner',
    execute(client, msg, args) {
        const code = args.join(' '), util = require('util');
        try {
            let evaled = eval(code.replace(/```(?:j(?:ava)?s(?:cript)?)?/g, ''));
            if(typeof evaled !== 'string') evaled = util.inspect(evaled);
            msg.channel.send(evaled, {code: 'js'});
        } catch(e) {
            msg.channel.send(e, {code: 'js'});
        }
    }
}
