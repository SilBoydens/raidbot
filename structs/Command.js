"use strict";

class Command {
    constructor(props) {
        this.name      = props.name;
        this.guildOnly = props.guildOnly;
        this.group     = props.group;

        if (typeof props.execute === "function") {
            Object.defineProperty(this, "execute", {
                value: props.execute
            });
        }
    }
    toString() {
        return `[${this.constructor.name} ${this.name}]`;
    }
};

module.exports = Command;
