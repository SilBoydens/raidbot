"use strict";

class Command {
    name;
    guildOnly   = false;
    group       = "user";
    usage       = "";
    description = "";
    constructor(props) {
        this.name = props.name;
        if (props.guildOnly !== undefined) {
            this.guildOnly = props.guildOnly;
        }
        if (props.group !== undefined) {
            this.group = props.group;
        }
        if (typeof props.usage === "string") {
            this.usage = props.usage;
        }
        if (typeof props.description === "string") {
            this.description = props.description;
        }
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
