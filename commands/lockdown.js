"use strict";

const img = [
    "https://zippy.gfycat.com/CarelessSplendidKiskadee.webm",
    "https://i.gifer.com/7DUg.mp4"
];

module.exports = {
    guildOnly: true,
    group: "guildMod",
    usage: "[\"off\"]",
    description: "Locks the server down",
    async execute(ctx) {
        let everyone = ctx.guild.roles.get(ctx.guild.id);
        if (!ctx.args[0]) {
            if (everyone.permissions.json.sendMessages) {
                await everyone.edit({
                    permissions: everyone.permissions.allow & ~0x800
                });
                return `${ctx.user.mention} Server locked down.\n${img[Math.floor(Math.random()*img.length)]}`;
            } else {
                return `${ctx.user.mention} Server already in lockdown state.`;
            }
        } else if (ctx.args[0] !== undefined && ctx.args[0].toLowerCase() === "off") {
            if (!everyone.permissions.json.sendMessages) {
                await everyone.edit({
                    permissions: everyone.permissions.allow | 0x800
                });
                return `${ctx.user.mention} Unlocked the server.`;
            } else {
                return `${ctx.user.mention} Server is not locked.`;
            }
        } else {
            return `${ctx.user.mention} [lockdown] could not understand "${ctx.args[0]}"\nUsage:\n\`@${this.user.username} lockdown\` locks the server down\n\`@${this.user.username} lockdown off\` unlocks the server`;
        }
    }
};
