import { config } from 'dotenv'
import { MessageEmbed, MessageReaction, User } from 'discord.js'
import { getStats } from './api'
import { getClient } from './discord-client'
import { CronJob } from 'cron'

config()

if (typeof process.env.TOKEN !== 'string') {
  throw new Error('Missing process.env.TOKEN')
}

const getEmbed = async () => {
  const price = await getStats()

  const embed = new MessageEmbed()
    .setColor('#FFFFFF')
    .setTitle('Gm Matos! Are you feeling bullish today?')
    .setDescription(
      `React with your prediction — 🐮 or 🐻 — and we'll see in 24h if you were right.`
    )
    .addFields({
      name: `${price.bullish ? '📈' : '📉'} **Ethereum market price**`,
      value: `${price.value} ${getHighlighted(price.oneDayDiff)} `,
    })

  return embed
}
const getHighlighted = (value = '') => (value ? ' `' + value + '`' : '')

const start = async () => {
  const client = await getClient()

  client.on('messageCreate', async (msg) => {
    if (
      msg.content.toLowerCase().includes('gm') &&
      msg.author.id != process.env.BOT_ID
    ) {
      msg.react('☕')
    }
    if (
      msg.channelId === process.env.CRON_CHANNEL_ID &&
      msg.author.id == process.env.BOT_ID
    ) {
      // Initialize bullish / bearish reactions
      msg.react('🐻')
      msg.react('🐮')

      // WIP: Reaction collector
      const filter = (reaction: MessageReaction, user: User) =>
        user.id != process.env.BOT_ID

      const collector = msg.createReactionCollector({
        filter,
        time: 1000 * 5,
      })

      collector.on('collect', (reaction) => {
        console.log(reaction.emoji.name)
      })
    }
  })

  if (typeof process.env.CRON_CHANNEL_ID === 'string') {
    const channel = await client.channels.cache.get(process.env.CRON_CHANNEL_ID)
    const job = new CronJob(
      '1 * * * * *',
      async () => {
        try {
          console.log('Cron job triggered!')
          if (channel) {
            const embed = await getEmbed()
            ;(channel as any).send({ embeds: [embed] })
          }
        } catch (e) {
          console.error(e)
        }
      },
      null,
      true,
      'Europe/Berlin'
    )

    job.start()
  } else {
    console.error('Missing typeof process.env.CRON_CHANNEL_ID')
  }
}

start()
