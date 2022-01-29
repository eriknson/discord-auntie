import { config } from 'dotenv'
import { MessageEmbed, MessageReaction, User } from 'discord.js'
import { getStats } from './api'
import { getClient } from './discord-client'
import { CronJob } from 'cron'

config()

if (typeof process.env.TOKEN !== 'string') {
  throw new Error('Missing process.env.TOKEN')
}
if (typeof process.env.CRON_CHANNEL_ID !== 'string') {
  throw new Error('Missing process.env.CRON_CHANNEL_ID')
}

const getEmbed = async (collecting: boolean = true) => {
  const price = await getStats()

  const embed = new MessageEmbed()
    .setColor(`${collecting ? '#00b84d' : '#c5c5c5'}`)
    .setTitle(`Gm! Are you feeling bullish?`)
    .setDescription(
      `React with your prediction — 🐮 or 🐻 — and we'll circle back in 24h to see if your prediction matches the market.`
    )
    .addFields({
      name: `${price.bullish ? '📈' : '📉'} ** Ethereum market price**`,
      value: `${price.value} ${getHighlighted(price.oneDayDiff)} `,
    })

  return embed
}
const getHighlighted = (value = '') => (value ? ' `' + value + '`' : '')

const start = async () => {
  const client = await getClient()
  const cronChannel = await client.channels.cache.get(
    process.env.CRON_CHANNEL_ID
  )

  try {
    console.log('Debug msg triggered!')
    if (cronChannel) {
      const embed = await getEmbed(true)
      // create prediction entity with user token current market price and embedId
      ;(cronChannel as any).send({ embeds: [embed] })
    }
  } catch (e) {
    console.error(e)
  }

  client.on('messageCreate', async (msg) => {
    // Coffee reaction to gm's
    if (msg.content.toLowerCase().includes('gm') && !msg.author.bot) {
      msg.react('☕')
    }

    // Bot's own gm message
    if (msg.channelId === process.env.CRON_CHANNEL_ID && msg.author.bot) {
      msg.react('🐮')
      msg.react('🐻')

      const filter = (reaction: MessageReaction, user: User) =>
        !user.bot && ['🐮', '🐻'].includes(reaction.emoji.name)

      let options = { time: 7200 /* 0000 */ }
      const collector = msg.createReactionCollector({
        filter,
        ...options,
      })

      collector.on('collect', (_reaction, _user) => {
        console.log(_reaction.emoji.name, _user.username)

        // Enforce only one reaction per user
        _reaction.message.reactions.cache.map((x) => {
          if (
            x.emoji.name != _reaction.emoji.name &&
            x.users.cache.has(_user.id)
          ) {
            x.users.remove(_user.id)
          }
        })
      })

      collector.on('end', async (collected) => {
        await getEmbed(false).then((embed) => msg.edit({ embeds: [embed] }))
        const reactions = collected.map((_reaction) => ({
          reaction: _reaction.emoji.name,
          users: _reaction.users.cache
            .filter((user) => !user.bot)
            .map((user) => user.username),
        }))

        console.log(reactions)
      })
    }
  })

  // cronjob to send gm
  const channel = await client.channels.cache.get(process.env.CRON_CHANNEL_ID)
  const job = new CronJob(
    '1 * * * * *',
    async () => {
      try {
        console.log('Cron job triggered!')
        if (channel) {
          const embed = await getEmbed(true)
          // create prediction entity with user token current market price and embedId
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
}

start()
