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
        if (["0", "off"].includes(seconds.toLowerCase())) {
            seconds = 0;
        } else {
            seconds = utils.parseDuration(seconds);
            if (seconds === null) {
                return "Invalid duration specified, Examples of acceptables durations are: `3`, `4h`, `3h30m` etc.";
            } else {
                seconds = seconds.total;
            }
        }
        if (seconds > 216E2) {
            return "Slowmode timeout cannot go beyond 6 hours.";
        } else if (seconds === ctx.channel.rateLimitPerUser) {
            return seconds > 0 ? `${ctx.channel.mention} already has slowmode enabled with the specified timeout.` : `${ctx.channel.mention} does not have slowmode enabled.`;
        }
        return ctx.channel.edit({
            rateLimitPerUser: seconds
        }).then(channel => {
            return seconds ? `${channel.mention} is now on slowmode, there will be a timeout of \`${channel.rateLimitPerUser.toLocaleString()}\` second${channel.rateLimitPerUser > 1 ? "s" : ""} between sent messages.` : `${channel.mention} is no longer on slowmode.`;
        });
    }
};
