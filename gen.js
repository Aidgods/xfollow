const { SlashCommandBuilder } = require('@discordjs/builders');
const { generateKey, saveDb } = require('../keys.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gen')
        .setDescription('Generates a key')
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('The duration for the key')
                .setRequired(true)
                .addChoices(
                    { name: '1 Month', value: '1month' },
                    { name: '3 Months', value: '3months' },
                    { name: '6 Months', value: '6months' },
                    { name: '1 Year', value: '1year' }
                )),
    async execute(interaction) {
        const duration = interaction.options.getString('duration');

        let keys = [];
        for (let i = 0; i < 5; i++) {
            const key = generateKey(interaction.user.id, duration);
            keys.push(key);
        }
        saveDb(); // Save the updated db object to db.json
        if (interaction.user.id == "1041092390615793694", "1068216185566531645") {
            await interaction.reply({ content: `Your keys have been generated: ${keys.join(', ')}`, ephemeral: true });
        } else {
            await interaction.reply('nuh uh', { ephemeral: true });
        }
    },
};
