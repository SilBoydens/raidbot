"use strict";

let fdate = ms => new Date(ms).toISOString().replace(/(?:T|Z|\.\d+)/g, " ").trim()

module.exports = {
    guildOnly: false,
    group: "user",
    params: "[userID]",
    description: "Shows some information about a discord user",
    async execute(ctx) {
        let id;
        if (ctx.args[0]) {
            if (!/^\d{15,}$/.test(ctx.args[0])) {
                return "Please specify a user ID.";
            }
            id = ctx.args[0];
        } else {
            id = ctx.user.id;
        }
        let user = this.users.get(id) || await this.getRESTUser(id), member = ctx.guild && ctx.guild.members.get(user.id);

        let embed = {
            thumbnail: {
                url: user.avatarURL
            },
            title: `${user.username}#${user.discriminator}`,
            fields: [
                {
                    name: "Created At",
                    value: fdate(user.createdAt)
                }
            ],
            footer: {
                text: `User ID: ${user.id}`
            }
        };

        if (member) {
            if (member.nick !== null) {
                embed.title += ` (a.k.a ${member.nick})`;
            }
            embed.fields.push({
                name: "Joined At",
                value: fdate(member.joinedAt)
            });
        }

        return {embed};
    }
};
