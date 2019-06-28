module.exports = {
    name: 'eval',
    dm: true,
    execute(client, msg, args) {
        if(!client.config.owners.includes(msg.author.id)) return;
        const code = args.join(' ');
        try {
            let evaled = eval(code.replace(/```(?:j(?:ava)?s(?:cript)?)?/g, ''));
            if(typeof evaled !== 'string') evaled = require('util').inspect(evaled);
            msg.channel.send(evaled, {code: 'js'});
        } catch(e) {
            msg.channel.send(e, {code: 'js'});
        }
    }
}
