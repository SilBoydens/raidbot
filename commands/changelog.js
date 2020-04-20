"use strict";

module.exports = {
    guildOnly: false,
    group: "botOwner",
    execute(ctx) {
        if (this.config.get("changelog").includes(msg.author.id)) {
            this.config.changelog.splice(this.config.get("changelog").indexOf(msg.author.id), 1);
            this.config.save();
            return `${ctx.user.mention} You won't receive changelogs anymore. 😦`;
        } else {
            this.config.changelog.push(msg.author.id);
            this.config.save();
            return `${ctx.user.mention} You will now start receiving changelogs. 🎉`;
        }
    }
};
