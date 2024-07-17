const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
let db = require('../keys.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Redeems a key')
        .addStringOption(option => 
            option.setName('key')
                .setDescription('The key to redeem')
                .setRequired(true)),
    async execute(interaction) {
        let rawdata = fs.readFileSync('db.json');
        db = JSON.parse(rawdata);
        
        const key = interaction.options.getString('key');
        if (db[key]) {
            const { userId, duration } = db[key];
            const username = interaction.user.username;
            const userid = interaction.user.id;
            const expiryDate = new Date();
            if (duration !== '1year') {
                let redeemDB;
                try {
                    rawdata = fs.readFileSync('redeemdb.json');
                    redeemDB = JSON.parse(rawdata);
                } catch (err) {
                    redeemDB = {};
                }
                
                if (!redeemDB.keys) {
                    redeemDB.keys = [];
                }
                redeemDB.keys.push({
                    userId: userid,
                    key: key,
                    duration: duration,
                    redeemedBy: {
                        username: username,
                        expiryDate: expiryDate
                    }
                });
                await interaction.reply(`Access granted for user ${username}`);
                
                delete db[key];
                
                try {
                    fs.writeFileSync('redeemdb.json', JSON.stringify(redeemDB, null, 2));
                } catch (err) {
                    console.error('An error occurred while saving the redeem DB:', err);
                }
                
                try {
                    fs.writeFileSync('db.json', JSON.stringify(db));
                } catch (err) {
                    console.error('An error occurred while saving the DB:', err);
                }
            } else {
                await interaction.reply('This key has expired');
            }
        } else {
            await interaction.reply('Invalid key');
        }
    },
};
