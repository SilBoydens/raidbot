"use strict";

const utils = require("../utils");

module.exports = {
    guildOnly: true,
    level: "guild_mod",
    params: "<seconds|\"off\">",
    description: "Enables or disables slowmode in a channel",
    execute(ctx) {
        let [seconds] = ctx.args;
        if (seconds === undefined) {
            return `${ctx.user.mention} Could not find enough arguments.\n**Usage**: \`${ctx.command.usage}\``;
        }
        seconds = utils.parseDuration(seconds.toLowerCase() === "off" ? 0 : seconds);
        if (seconds === null) {
            return "Invalid duration specified, examples of acceptables durations are: `3`, `4h`, `3h30m` etc.";
        } else {
            seconds = seconds.total;
        }
        if (seconds < 0 || seconds > 21600 || !Number.isInteger(seconds)) {
            return `${ctx.user.mention} Invalid timeout specified, timeout must be a number between \`0\` and \`21600\`.`;
        } else if (seconds === ctx.channel.rateLimitPerUser) {
            return seconds ? `${ctx.channel.mention} already has slowmode enabled with the specified timeout.` : `${ctx.channel.mention} does not have slowmode enabled.`;
        }
        return ctx.channel.edit({
            rateLimitPerUser: seconds
        }).then(channel => {
            return seconds ? `${channel.mention} is now on slowmode, there will be a timeout of \`${channel.rateLimitPerUser.toLocaleString()}\` second${channel.rateLimitPerUser > 1 ? "s" : ""} between sent messages.` : `${channel.mention} is no longer on slowmode.`;
        });
    }
};
