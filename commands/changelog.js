"use strict";

module.exports = {
    guildOnly: false,
    group: "user",
    description: "Allows you to subscribe to changelogs",
    execute(ctx) {
        if (this.config.get("changelog").includes(ctx.user.id)) {
            this.config.get("changelog").splice(this.config.get("changelog").indexOf(ctx.user.id), 1);
            this.config.save();
            return `${ctx.user.username}, You won't receive changelogs anymore. 😦`;
        } else {
            this.config.get("changelog").push(ctx.user.id);
            this.config.save();
            return `${ctx.user.username}, You will now start receiving changelogs. 🎉`;
        }
    }
};
