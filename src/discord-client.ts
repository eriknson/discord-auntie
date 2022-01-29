import { Client, Intents } from 'discord.js'
import { config } from 'dotenv'

config()

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
})

client.login(process.env.TOKEN)

export const getClient = (): Promise<Client> => {
  return new Promise((resolve) => {
    client.once('ready', async () => {
      resolve(client)
      console.log('Auntie is online!')
    })
  })
}
