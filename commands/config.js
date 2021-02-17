"use strict";

module.exports = {
    guildOnly: true,
    level: "guild_manager",
    params: "<\"list\"|\"add\"|\"remove\"|\"set\"> <module> <setting> [value]",
    description: "Allows you to configure the settings for current server",
    execute(ctx) {
        const [action, mod, option, val] = ctx.args.slice(0, 4);
        const usage = `\n\n**Usage**\n\n@${this.user.username} list/add/remove/set module/command option value`;
        if (!["list", "add", "remove", "set"].includes(action)) {
            return `${ctx.user.mention} Invalid action name '${action}', the following are valid:\n - list\n - add\n - remove\n - set` + usage;
        }
        let config = this.config.get(ctx.guild.id);
        if (!config[mod]) {
            return `${ctx.user.mention} Invalid module name ${mod}\n`
                + `the following modules exist:\n`
                + ` - ${Object.keys(config).join("\n - ")}${usage}`;
        }
        if (!config[mod][option]) {
            return `Invalid option ${option} for module ${mod}\n`
                + `the following options exist for module ${mod}:\n`
                + ` - ${Object.keys(config[mod]).join("\n - ")}${usage}`;
        }
        let response, value = "";
        switch (action) {
            case "list": {
                response = `The value(s) for ${option} in module ${mod} is/are:\n - `;
                value = config[mod][option];
                if (Array.isArray(value)) {
                    value = value.join("\n - ");
                }
                return `${ctx.user.mention} ${response}${value}`;
            }
            case "add": {
                value = config[mod][option];
                if (!Array.isArray(value)) {
                    return `${ctx.user.mention} Not a list, please use 'set'`;
                }
                config[mod][option].push(val.match(/\d/g).join(""));
                response = `The the new value(s) for ${option} in module ${mod} is/are:\n - `;
                value = config[mod][option].join("\n - ");
                this.config.save();
                return `${ctx.user.mention} ${response}${value}`;
            }
            case "remove": {
                value = config[mod][option];
                let id = val.match(/\d/g).join("");
                if (!Array.isArray(value)) {
                    return `${ctx.user.mention} Not a list, please use 'set'`;
                }
                if (value.indexOf(id) !== -1) {
                    config[mod][option].splice(value.indexOf(id), 1);
                    response = `The the new value(s) for ${option} in module ${mod} is/are:\n - `;
                } else {
                    response = `I did not find that :cry:\nthe the value(s) for ${option} in module ${mod} is/are:\n - `;
                }
                value = config[mod][option].join("\n - ");
                this.config.save();
                return `${ctx.user.mention} ${response}${value}`;
            }
            case "set": {
                value = config[mod][option];
                if (Array.isArray(value)) {
                    return `${ctx.user.mention} This is a list, please use 'add' and 'remove'`;
                }
                config[mod][option] = val;
                response = `The the new value for ${option} in module ${mod} is: `;
                value = config[mod][option];
                this.config.save();
                return `${ctx.user.mention} ${response}${value}`;
            }
            default: {
                return `${ctx.user.mention} I wasn't able to understand ${action}, try using:\n- list (works for everything)\n- add (for lists)\n- remove (for lists)\n- set (not for lists)`;
            }
        }
    }
};