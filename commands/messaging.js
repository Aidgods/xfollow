const { SlashCommandBuilder } = require('@discordjs/builders');
const { Authflow } = require('prismarine-auth');
const axios = require('axios');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const { ProxyAgent } = require('proxy-agent');
const usernames = ['test1', 'test2','test3', 'test4', 'test5', 'test6', 'test7', 'test8','test9','test10', 'test11', 'test12', 'test13', 'test14', 'test15', 'test16'];
let proxies = fs.readFileSync('proxies.txt').toString().split('\n');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('Adds a friend to Xbox accounts')
        .addStringOption(option => 
            option.setName('gamertag')
                .setDescription('The gamertag of the friend to be messaged')
                .setRequired(true))
                .addStringOption(option => 
                option.setName('message')
                .setDescription('The gamertag of the friend to be messaged')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('messages')
                .setDescription('Number of messages to send PER ACCOUNT')
                .setRequired(true)
                .addChoices(
                    { name: '5 Messages', value: 5 },
                    { name: '10 Messages', value: 10 },
                    { name: '15 Messages', value: 15 }
                )),
                async execute(interaction) {
                    if (!interaction.client || !interaction.client.cooldowns) {
                        console.error('Client or client cooldowns are undefined');
                        return;
                    }
                    
                    const { cooldowns } = interaction.client;
                
                    if (!cooldowns.has(this.data.name)) {
                        cooldowns.set(this.data.name, new Map());
                    }
                
                    const now = Date.now();
                    const timestamps = cooldowns.get(this.data.name);
                    const cooldownAmount = this.cooldown * 1000;
                
                    if (timestamps.has(interaction.user.id)) {
                        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                
                        if (now < expirationTime) {
                            const timeLeft = (expirationTime - now) / 1000;
                            return interaction.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${this.data.name}\` command.`);
                        }
                    }
                
                    timestamps.set(interaction.user.id, now);
                    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        let authFlowInstances = [];
        
        for (let i = 0; i < usernames.length; i++) {
            let userIdentifier = usernames[i];
            let cacheDir = `./accounts/${userIdentifier}`; // Specify a unique cache directory for each user
            let flow = new Authflow(userIdentifier, cacheDir);
            authFlowInstances.push(flow);
        }

        const gamertag = interaction.options.getString('gamertag');
        const message = interaction.options.getString('message');
        const numMessages = interaction.options.getInteger('messages');
        const userId = interaction.user.id; // Define userId
    
        // Default reply
        
        // Read the redeemdb.json file
        let rawdata = fs.readFileSync('redeemdb.json');
        let redeemDB = rawdata ? JSON.parse(rawdata) : { keys: [] };
        
        // Check if the user has redeemed a key
        const hasRedeemedKey = redeemDB.keys.some(keyData => keyData.userId === userId);
        
        if (hasRedeemedKey) {
            console.log(`User ${userId} has redeemed a key.`);
        } else {
            console.log(`User ${userId} has not redeemed a key.`);
            await interaction.reply("You need to redeem a key first.");
            return;
        }
        function waitFor(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        async function retry(promise, onRetry, maxRetries) {

            async function retryWithBackoff(retries) {
               try {
                if (retries > 0) {
                    console.log('waiting for 5 seconds...');
                    await waitFor(5000);
                  }
                 return await promise();
               } catch (e) {
                 if (e.response && e.response.status === 429 && retries < maxRetries) {
                   onRetry();
                   return retryWithBackoff(retries + 1);
                 } else {
                   console.warn("Max retries reached or received non-429 error. Bubbling the error up");
                   throw e;
                 }
               }
            }
           
            return retryWithBackoff(0);
           }
           Promise.all(authFlowInstances.map(flow => 
            flow.getXboxToken('http://xboxlive.com')
                .catch(error => {
                    console.error(error);
                    // Handle the error appropriately here
                    // For example, you might want to remove the problematic account from the array
                    // Or you might want to notify the user about the issue
                })
        ))
        .then(async (tokens) => {
            // Defer the reply
            await interaction.deferReply();
        
            // Perform the asynchronous operations
            let messageCount = 0;
            function getRandomProxy() {
                let index = Math.floor(Math.random() * proxies.length);
                return proxies[index];
            }
            for (let i = 0; i < tokens.length; i++) {
                const proxyAgent = new ProxyAgent(getRandomProxy());
                const xbl = tokens[i];
                const profileUrl = `https://profile.xboxlive.com/users/gt(${gamertag})/profile/settings?settings=Gamertag`;
                const { data, status } = await axios.get(profileUrl, {
                    headers: {
                        'Authorization': `XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`,
                        'x-xbl-contract-version': '2'
                    },
                    httpsAgent: proxyAgent
                });
                let payload = {
                    parts: [
                    {
                      text: message,
                      contentType: 'text',
                      version: 0,
                    },
                    ],
                   };
                const xuid = data.profileUsers[0].id;
                for (let i = 0; i < numMessages; i++) {
                    
                    const postRequest = () => axios.post(`https://xblmessaging.xboxlive.com/network/xbox/users/me/conversations/users/xuid(${xuid})`, payload, {
                        headers: {
                            'authorization': `XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`,
                        },
                        httpsAgent: proxyAgent
                    });
                    await retry(postRequest, () => interaction.editReply({ content: `Rate limit exceeded. Waiting for 5 seconds... Number of messages sent: ${messageCount}`, ephemeral: false }), 3);
                    // Increment messageCount
                    messageCount++;
            
                    // Update the message with the current messageCount
                    setTimeout(async () => {
                        await interaction.editReply({ content: `Number of messages sent: ${messageCount}`, ephemeral: false });
                    }, 5000);
                    // Wait for 5 seconds before sending the next message
        
                }
            }
            // Create the embed after the loop
            const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('tomfoolery')
            .setDescription(`Number of Usernames: ${usernames.length}\nGamertag: ${gamertag}`)
            .setTimestamp();
        
            // Edit the deferred reply
            await interaction.editReply({ embeds: [embed] });
        })
        .catch((error) => {
            console.error(error);
        
            if (error.response && error.response.status === 404) {
                console.error("invalid gamertag");
                interaction.editReply({ content: `Invalid gamertag. Please check and try again.`, ephemeral: false });
            } else {
                interaction.editReply({ content: `An error occurred while processing the command`, ephemeral: false });
            }
            return null;
        });

            
    },
};
