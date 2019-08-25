const util = {
  log(client, msg) {
    let stmt = client.db.prepare(`INSERT INTO g${msg.guild.id} VALUES (?, ?, ?, ?)`);
    stmt.run(msg.author.id, msg.author.username, msg.content, new Date());
  },
  createTable(client, guilds, guildid) {
    guilds.push(guildid);
    // table names start with a g for guilds, because they can't start with a number
    client.db.run(`CREATE TABLE IF NOT EXISTS g${guildid} (
      userid nchar not null,
      username nchar not null,
      message nchar not null,
      timestamp datetime not null);`);
  },
  cleanDB(client, guilds) {
    guilds.map(guildid => {
      let stmt = client.db.prepare(`DELETE FROM g${guildid} WHERE timestamp < ${new Date(new Date().getTime() - (60 * 60 * 1000)).getTime()}`);
      stmt.run();
    });
  },
  saveConfig(client) {
    const fs = require('fs');
    fs.writeFile(process.env.CONFIG_FILE, JSON.stringify(client.config, null, 2), 'utf8', function () {});
  },
  createConfig(client, guildID, msg) {
    const defaultConfig = require('./default_config.json');
    const {config} = client;
    const deepmerge = require('deepmerge');
    if(!config[guildID]) {
      msg.channel.send('Creating default config.');
      config[guildID] = deepmerge(defaultConfig, {});
    } else {
      config[guildID] = deepmerge(defaultConfig, config[guildID]);
    };
    this.saveConfig(client);
  },
  sendErrors(client, msg, e) {
    // who doesn't like his dm spammed with errors? (mostly missing permission)\
    if(client.readyAt) { //had to use readyAt because it was mapping before the bot was ready
      client.config.owners.map(owner => {
        if (owner === client.user.id) return; // don't dm yourself
        client.fetchUser(owner)
        .then(dm => { // this also sends in zombie mode
          dm.send(`An error has occoured:
          message: ${msg.content}\n${e.message}`);
          dm.send(`
          \`\`\`
          ${e.stack}
          \`\`\``);// let's hope stacktraces aren't 1988+ characters
        });
      });
    };
  },
  logCommands(client, msg, message) {
    message = message ? message : `[${msg.guild.id}] <@${msg.author.id}> (${msg.author.id}) used command\n${msg.content.slice(22)}`;
    // log for bot owner
    if (process.env.LOGCHANNEL) {
      client.channels.get(process.env.LOGCHANNEL).send(message);
    };
    // log for server owners/admins
    client.config[msg.guild.id].general.sendlogs.forEach(channel => {
      if(client.channels.get(channel)) {
        client.channels.get(channel).send(message);
      } else {
        client.fetchUser(channel)
        .then(dm => {
          dm.send(message);
        });
      };
    });
  }
}

module.exports = util;
