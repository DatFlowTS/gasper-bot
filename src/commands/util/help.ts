import { Command, PrefixSupplier } from 'discord-akairo';
import { Message, MessageEmbed } from 'discord.js';
import { stripIndents } from 'common-tags';
import { owners } from '../../config';
import { chmod } from 'fs';

export default class HelpCommand extends Command {
    public constructor() {
        super('help', {
            aliases: ['help', 'commands', 'cmdlist'],
            description: {
                content: 'Displays a list of available command, or detailed information for a specific command.',
                usage: '[command]'
            },
            category: 'Util',
            clientPermissions: ['EMBED_LINKS'],
            ratelimit: 2,
            args: [
                {
                    id: 'command',
                    type: 'commandAlias'
                }
            ]
        });
    }

    public async exec(message: Message, { command }: { command: Command }): Promise<Message | Message[]> {
        const guildOwner = await this.client.users.fetch(message.guild!.ownerID);
        const authorMember = await message.guild!.members.fetch(message.author!.id);
        if (message.deletable && !message.deleted) message.delete();

        // ------------------------------------
        // ---------- ADMINS ------------------
        let defaultAdmins: string[] = [guildOwner.id];
        for (var owner in owners) {
            defaultAdmins.push(owner);
        }
        //@ts-ignore
        let administrators: string[] = await this.client.guildsettings.get(message.guild!, 'config.administrators', defaultAdmins);
        defaultAdmins.forEach(dA => {
            if (!administrators.includes(dA)) {
                administrators = administrators.concat(dA);
            }
        })
        var isAdmin: boolean = authorMember.roles.cache.filter((r): boolean => administrators.includes(r.id)).size !== 0;
        // ------------------------------------
        // ---------- MODS --------------------
        let adminRoles: string[] = message.guild.roles.cache.filter((r) => r.permissions.has('ADMINISTRATOR')).map((roles): string => `${roles.id}`);
        let defaultMods: string[] = adminRoles.concat(guildOwner.id);
        for (var owner in owners) {
            defaultMods.push(owner);
        }
        //@ts-ignore
        let moderators: string[] = await this.client.guildsettings.get(message.guild!, 'config.moderators', defaultMods);
        owners.forEach(o => {
            if (!moderators.includes(o)) {
                moderators.push(o);
            }
        })
        var isMod: boolean = authorMember.roles.cache.filter((r): boolean => moderators.includes(r.id)).size !== 0;
        // ------------------------------------
        // ---------- DEVS --------------------
        var isDev: boolean = owners.includes(message.author.id);
        // ------------------------------------
        // ---------- GUILDOWNER --------------
        var isOwner: boolean = guildOwner.id === message.author.id;



        const prefix = await (this.handler.prefix as PrefixSupplier)(message);
        var rnd = Math.floor(Math.random() * prefix.length);
        if (rnd === prefix.length) rnd = rnd - 1;
        if (!command) {
            const embed = new MessageEmbed()
                //@ts-ignore
                .setColor(message.member.displayColor)
                .setTitle('Commands')
                .setDescription(stripIndents`A list of available commands.
                For additional info on a command, type \`${prefix[rnd]}help <command>\`


            `);

            for (const category of this.handler.categories.values()) {
                var categoryName: string = category.id.replace(/(\b\w)/gi, (lc): string => lc.toUpperCase());

                var ownerCats: string[] = ['Server Owner', 'Administrator', 'Moderation', 'Info', 'Util', 'Public'];
                var adminCats: string[] = ['Administrator', 'Moderation', 'Info', 'Util', 'Public'];
                var modCats: string[] = ['Moderation', 'Info', 'Util', 'Public'];
                var pubCats: string[] = ['Info', 'Util'];

                if (isDev && categoryName !== 'Default') {
                    embed.addField(`⇒ ${categoryName}`, `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`);
                } else if (isOwner && !isDev && ownerCats.includes(categoryName)) {
                    embed.addField(`⇒ ${categoryName}`, `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`);
                } else if (isAdmin && !isOwner && !isDev && adminCats.includes(categoryName)) {
                    embed.addField(`⇒ ${categoryName}`, `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`);
                } else if (isMod && !isAdmin && !isOwner && !isDev && modCats.includes(categoryName)) {
                    embed.addField(`⇒ ${categoryName}`, `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`);
                } else if (!isDev && !isOwner && !isAdmin && !isMod && pubCats.includes(categoryName)) {
                    embed.addField(`⇒ ${categoryName}`, `${category.filter((cmd): boolean => cmd.aliases.length > 0).map((cmd): string => `\`${cmd.aliases[0]}\``).join(' | ')}`);
                }
            }

            return message.util!.send(embed);
        }

        const embed = new MessageEmbed()
            .setColor([155, 200, 200])
            .setTitle(`\`${command.aliases[0]} ${command.description.usage ? command.description.usage : ''}\``)
            .addField('⇒ Description', `${command.description.content ? command.description.content : ''} ${command.description.ownerOnly ? '\n**[Bot-Owner Only]**' : ''}`);

        if (command.aliases.length > 1) embed.addField('⇒ Aliases', `\`${command.aliases.join('` `')}\``, true);
        if (command.description.examples && command.description.examples.length) embed.addField('⇒ Examples', `\`${command.aliases[0]} ${command.description.examples.join(`\`\n\`${command.aliases[0]} `)}\``, true);

        return message.util!.send(embed);
    }
}