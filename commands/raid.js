"use strict";

module.exports = {
    guildOnly: true,
    group: "guildMod",
    usage: "<\"message\"|\"user\"> <term>",
    description: "Bans raiders who meet certain criteria",
    execute(ctx) {
        if (ctx.args[1] === undefined) {
            return `${ctx.user.mention} [raid] could not find enough arguments\nUsage:\n\`@${this.user.username} raid user username\`\n\`@${this.user.username} raid message messagecontent\``;
        }
        let message = "[raid] userid list: ```";
        let reason = `raid\n`, sql, term = ctx.args.slice(1).join(" ");
        let time = new Date(new Date().getTime() - ((this.config.get(ctx.guild.id).raid.lookback | 5) * 60 * 1000)).getTime();

        if (["user", "name", "username"].includes(ctx.args[0].toLowerCase())) {
            sql = `SELECT userid, username FROM g${ctx.guild.id} WHERE username LIKE '${term}%' AND timestamp > ${time} GROUP BY userid`;
        } else if (["message", "content", "text"].includes(ctx.args[0].toLowerCase())) {
            reason = reason + `with message \`${term}\`\n`;
            sql = `SELECT userid, username FROM g${ctx.guild.id} WHERE message LIKE '${term}%' GROUP BY userid`;
        } else {
            return `${ctx.user.mention} [raid]invalid\n either use a username or a message:\n\`@${this.user.username} raid user username\n@${this.user.username} raid message messagecontent\``;
        }

        reason += ` banned by ${ctx.user.username}#${ctx.user.discriminator} using ${this.user.username} on `;
        reason += `${new Date().toISOString().replace(/T/, " ").replace(/\..+/, "")} UTC timezone`;
        
        return new Promise((resolve, reject) => {
            this.db.all(sql, (err, rows) => {
                if (err) {
                    reject(err);
                }
                if (rows.length) {
                    for (let row of rows) {
                        message += `\n${row.userid}`;
                    }
                    if (this.config.get(ctx.guild.id).raid.id_list) {
                        resolve(`${message}\`\`\`\nIf you think these are all raidbots, please report them to discord on <https://http//dis.gd/contact> => trust and safety => type: raiding or directly to a discord trust and safety member`);
                    } else {
                        resolve(`[raid] attempting to ban ${rows.length} users for raiding`);
                    }
                    for (let row of rows) {
                        if (this.zombie) {
                            console.log(`ban from ${ctx.guild.id}: ${row.userid} with reason:\n${reason}`);
                        } else {
                            ctx.guild.banMember(row.userid, 7, reason).catch(this.logger.send);
                        }
                    }
                } else {
                    resolve("[raid] nothing found");
                }
            });
        });
    }
};
