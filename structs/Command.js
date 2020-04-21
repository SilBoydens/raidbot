"use strict";

class Command {
    name;
    guildOnly   = false;
    group       = "user";
    params      = "";
    description = "";
    constructor(props) {
        this.name = props.name;
        if (props.guildOnly !== undefined) {
            this.guildOnly = props.guildOnly;
        }
        if (props.group !== undefined) {
            this.group = props.group;
        }
        if (typeof props.params === "string") {
            this.params = props.params;
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
    get usage() {
        return `${this.name} ${this.params}`;
    }
    toString() {
        return `[${this.constructor.name} ${this.name}]`;
    }
};

module.exports = Command;
