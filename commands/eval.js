"use strict";

module.exports = {
    guildOnly: false,
    group: "botOwner",
    async execute(ctx) {
        let code = ctx.args.join(" "), util = require("util");
        let evaled;
        try {
            evaled = await eval(code);
        } catch(e) {
            evaled = e.stack;
        }
        let out = typeof evaled === "string" ? evaled : util.inspect(evaled, {
            depth: 0
        });
        return `\`\`\`js\n${out.replace(/`/g, "`" + String.fromCharCode(0x200B))}\`\`\``;
    }
};
