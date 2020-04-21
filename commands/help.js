"use strict";

module.exports = {
    guildOnly: true,
    description: "Lists all of the available commands",
    execute(ctx) {
        let commands = [];
        for (let [, command] of this.commands) {
            if (command.name === "help") continue;
            if (new ctx.constructor(ctx.msg, command, [], this).checkpoint) {
                commands.push(command);
            }
        }
        if (!commands.length) {
            return `${ctx.user.mention} No commands to show!`;
        }
        return commands.map(c => {
            return `**\`${c.usage ? c.name + " " + c.usage : c.name}\`**\n${c.description ? c.description : "*No description provided*"}`;
        }).join("\n—\n");
    }
};
