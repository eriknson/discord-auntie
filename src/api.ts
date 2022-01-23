import axios from 'axios'
import Decimal from 'decimal.js'
import { request, gql } from 'graphql-request'

const api = {
  request: async (url: string): Promise<any> => {
    const { data } = await axios.get(url)
    return data
  },

  graphqlRequest: async (
    url: string,
    query: string,
    variables: Record<string, string | number>
  ): Promise<any> => {
    const data = await request(url, query, variables)
    return data
  },
}

type PriceSnapshot = {
  value: string
  oneDayDiff?: string
  bullish: boolean
}

const getPrefix = (value: number) => (value > 0 ? '+' : '')

export const getStats = async (): Promise<PriceSnapshot> => {
  const [coinData] = await Promise.all([
    api.request('https://api.coingecko.com/api/v3/coins/ethereum'),
  ])

  const price = {
    value: '$' + coinData.market_data.current_price.usd,
    oneDayDiff:
      getPrefix(coinData.market_data.price_change_percentage_24h) +
      new Decimal(
        coinData.market_data.price_change_percentage_24h
      ).toDecimalPlaces(2) +
      '%',
    bullish: coinData.market_data.price_change_percentage_24h > 0,
  }

  return price
}
