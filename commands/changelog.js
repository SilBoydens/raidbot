'use strict';

module.exports = {
    guildOnly: false,
    group: 'botOwner',
    execute(client, msg) {
      if(!client.config.owners.includes(msg.author.id)) return;
      client.fetchUser(msg.author.id)
      .then(dm => {
        if(client.config.changelog.includes(msg.author.id)) {
          dm.send('You won\'t receive changelogs anymore. 😦');
          client.config.changelog.splice(client.config.changelog.indexOf(msg.author.id), 1);
        } else {
          dm.send('You will now start receiving changelogs. 🎉');
          client.config.changelog.push(msg.author.id);
        }
        client.util.saveConfig(client);
      });
    }
};