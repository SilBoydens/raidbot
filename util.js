module.exports = (client, config, fs, guilds, deepmerge) => {

  const util = {
    log: msg => {
    if (!guilds.includes(msg.guild.id)) client.util.createTable(msg.guild.id);
    let stmt = client.db.prepare(`INSERT INTO g${msg.guild.id} VALUES (?, ?, ?, ?)`);
    stmt.run(msg.author.id, msg.author.username, msg.content, new Date());
  },
    isAllowed: (msg, command) => {
      if(client.config.owners.includes(msg.author.id)) return true;
      // for the public bot, this is just 1 person (and the bot itself) ;-)
      if(msg.member.hasPermission('ADMINISTRATOR')) return true;
      if(msg.content.startsWith(`<@${client.user.id}> config`)) {
        return false; // only for admins and those already got a return true
      }
      let allowed = false;
      if(config[msg.guild.id][command]) {
        msg.member.roles.map((v, e1) => config[msg.guild.id][command].allowed_roles.map((e2) => {
          if (e1 === e2) {
            allowed = true;
            return true;
          };
        }));
      };
      return allowed;
    },
    createTable: guildid => {
      guilds.push(guildid);
      // table names start with a g for guilds, because they can't start with a number
      client.db.run(`CREATE TABLE IF NOT EXISTS g${guildid} (
        userid nchar not null,
        username nchar not null,
        message nchar not null,
        timestamp datetime not null);`);
    },
    cleanDB: () => {
      guilds.map(guildid => {
        let stmt = client.db.prepare(`DELETE FROM g${guildid} WHERE timestamp < ${new Date(new Date().getTime() - (60 * 60 * 1000)).getTime()}`);
        stmt.run();
      });
    },
    saveConfig: () => {
      fs.writeFile(process.env.CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8', function () {});
    },
    createConfig: (guildID, msg) => {
      const defaultconfig = require('./default_config.json');
      if(!config[guildID]) {
        msg.channel.send('Creating default config.');
        config[guildID] = deepmerge(defaultconfig, {});
      } else {
        config[guildID] = deepmerge(defaultconfig, config[guildID]);
      };
      client.util.saveConfig();
    },
    sendErrors: (msg, e) => {
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
    logCommands: (msg, message) => {
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
  client.util = util;

}
