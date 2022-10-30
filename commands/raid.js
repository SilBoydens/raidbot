"use strict";

const Eris = require("eris");

module.exports = {
    execute(ctx) {
        let reason = `raid (banned by ${ctx.user.username}#${ctx.user.discriminator} on ${new Date().toISOString().replace("T", " ").split(".")[0]} (UTC))`;
        let term = ctx.interaction.data.options[0].options[0].value;
        let sql  = ctx.interaction.data.options[0].name === "user"
        ? `SELECT userid, username FROM g${ctx.guild.id} WHERE username LIKE '${term}%' AND timestamp > ${Date.now() - (this.config.get(ctx.guild.id).raid_lookback * 60 * 1000)} GROUP BY userid`
        : `SELECT userid, username FROM g${ctx.guild.id} WHERE message LIKE '${term}%' GROUP BY userid`;
        
        return new Promise((resolve, reject) => {
            this.sql.all(sql, (err, rows) => {
                if (err) reject(err);
                if (rows.length > 0) {
                    let users = [...new Set(rows.map(({userid}) => userid))];
                    if (this.config.get(ctx.guild.id).raid_idlist) {
                        resolve(`Attempting to ban ${users.length} users for raiding.\n\`\`\`${users.join("\n")}\`\`\``);
                    } else {
                        resolve(`Attempting to ban ${users.length} users for raiding.`);
                    }
                    users.forEach((id) => ctx.guild.banMember(id, 1, reason));
                } else {
                    resolve("Nothing found.");
                }
            });
        });
    },
    description: "Bans raiders who meet certain criteria",
    options: [
        {
            type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "message",
            description: "Bans raiders based on their messages",
            options: [
                {
                    type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
                    name: "term",
                    description: "A search term to match against raid messages",
                    required: true
                }
            ]
        },
        {
            type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "user",
            description: "Bans raiders based on their usernames",
            options: [
                {
                    type: Eris.Constants.ApplicationCommandOptionTypes.STRING,
                    name: "term",
                    description: "A search term to match against usernames of the raid accounts",
                    required: true
                }
            ]
        }
    ],
    default_member_permissions: Eris.Constants.Permissions.manageGuild,
    dm_permission: false
};