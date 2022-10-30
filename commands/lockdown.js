"use strict";

const Eris = require("eris");
const lockdownImages = [
    "https://zippy.gfycat.com/CarelessSplendidKiskadee.gif",
    "https://i.gifer.com/7DUg.gif"
];

module.exports = {
    async execute(ctx) {
        let everyone = ctx.guild.roles.get(ctx.guild.id);
        if (ctx.interaction.data.options[0].name === "on") {
            if (!everyone.permissions.has("sendMessages")) return "Server already in lockdown state.";
            await everyone.edit({
                permissions: everyone.permissions.allow & ~Eris.Constants.Permissions.sendMessages
            });
            return `Server locked down.\n${lockdownImages[Math.floor(Math.random() * lockdownImages.length)]}`;
        } else {
            if (everyone.permissions.has("sendMessages")) return "Server is not locked.";
            await everyone.edit({
                permissions: everyone.permissions.allow | Eris.Constants.Permissions.sendMessages
            });
            return "Unlocked the server.";
        }
    },
    description: "Locks the server down",
    options: [
        {
            type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "on",
            description: "Locks the server down"
        },
        {
            type: Eris.Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            name: "off",
            description: "Unlocks the server"
        }
    ],
    default_member_permissions: Eris.Constants.Permissions.manageGuild,
    dm_permission: false
};