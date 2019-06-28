module.exports = {
    name: 'raid',
    dm: false,
    execute(client, msg, args) {
      if(args[1]) {
        let message = "[raid] userid list: ```";
        let reason = `raid\n`;
        let sql;
        const guildid = msg.guild.id;
        const term = args.slice(1).join(' ');
        var time = new Date(new Date().getTime() - ((client.config[msg.guild.id].raid.lookback | 5) * 60 * 1000)).getTime();
        if (['user', 'name', 'username'].includes(args[0].toLowerCase())) {
          sql = `SELECT userid, username FROM g${guildid} WHERE username LIKE '${term}%' AND timestamp > ${time} GROUP BY userid`;
        } else if (['message', 'content', 'text'].includes(args[0].toLowerCase())) {
          reason = reason + `with message \`${term}\`\n`;
          sql = `SELECT userid, username FROM g${guildid} WHERE message LIKE '${term}%' GROUP BY userid`;
        } else {
          msg.reply(`[raid]invalid\n either use a username or a message:\n\`@${client.user.tag} raid user username\n@${client.user.tag} raid message messagecontent\``);
          return;
        }
        reason = reason + `banned by ${msg.author.tag} using ${client.user.tag} on `;
        reason = reason + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' UTC timezone';
        client.db.all(sql, (err, rows) => {
          if (rows.length) {
            rows.map(row => message = message + "\n" + row.userid );
            client.util.logCommands(msg, message + "```");
            if (client.config[guildid].raid.id_list) {
              msg.reply(message + "```\nIf you think these are all raidbots, please report them to discord on <https://http//dis.gd/contact> => trust and safety => type: raiding or directly to a discord trust and safety member");
            } else {
              msg.reply(`[raid] attempting to ban ${rows.length} users for raiding`);
            }
            rows.map(row => {
              try {
                if (client.zombie) {
                  console.log(`ban from ${msg.guild.id}: ${row.userid} with reason:\n${reason}`);
                } else {
                  msg.guild.member(row.userid).ban({reason: reason, days: 7});
                }
              } catch (error) {
                console.error(error);
                // ban failed
              }
            });
          } else {
            msg.reply("[raid] nothing found");
          }
        });
      } else {
        msg.reply(`[raid] could not find enough arguments\nUsage:\n\`@${client.user.tag} raid user username\`\n\`@${client.user.tag} raid message messagecontent\``);
      }
    }
}
