"use strict";

class Context {
    constructor(interaction, command) {
        this.command     = command;
        this.interaction = interaction;
        this.user        = interaction.user ?? interaction.member.user;
        this.channel     = interaction.channel;
        this.client      = interaction.channel.client;
        this.guild       = interaction.channel.guild ?? null;
        this.member      = null;
        this.selfMember  = null;
        if (this.guild !== null) {
            this.member = interaction.member ?? null;
            this.selfMember = this.guild.members.get(this.client.user.id) ?? null;
        }
    }
}

module.exports = Context;