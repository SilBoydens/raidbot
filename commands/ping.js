'use strict';

module.exports = {
    guildOnly: false,
    group: 'user',
    execute(client, msg) {
        const timestamp = Date.now();
        msg.reply('Pong!').then(m => m.edit(`${m.content} \`${Date.now() - timestamp} ms\``));
    }
};
