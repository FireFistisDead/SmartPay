const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const { AppError } = require('../middleware/errorHandler');

/**
 * Price Oracle Service - Fetches and caches cryptocurrency prices
 */
class PriceOracleService {
  constructor() {
    this.cachePrefix = 'price_oracle:';
    this.defaultCacheDuration = 300; // 5 minutes
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR'];
    this.supportedTokens = ['ETH', 'MATIC', 'USDC', 'USDT', 'DAI'];
    
    // API endpoints for different providers
    this.priceAPIs = {
      coingecko: 'https://api.coingecko.com/api/v3/simple/price',
      coinbase: 'https://api.coinbase.com/v2/exchange-rates',
      binance: 'https://api.binance.com/api/v3/ticker/price'
    };
  }

  /**
   * Get current price for a token in specified currency
   */
  async getTokenPrice(tokenSymbol, currency = 'USD') {
    try {
      const cacheKey = `${this.cachePrefix}${tokenSymbol}_${currency}`;
      
      // Try to get from cache first
      const cachedPrice = await this._getFromCache(cacheKey);
      if (cachedPrice) {
        logger.debug(`Price retrieved from cache: ${tokenSymbol}/${currency} = ${cachedPrice.price}`);
        return cachedPrice;
      }
      
      // Fetch from API
      const priceData = await this._fetchPriceFromAPI(tokenSymbol, currency);
      
      // Cache the result
      await this._setCache(cacheKey, priceData, this.defaultCacheDuration);
      
      logger.info(`Price fetched from API: ${tokenSymbol}/${currency} = ${priceData.price}`);
      return priceData;
      
    } catch (error) {
      logger.error('Error getting token price:', error);
      throw new AppError(`Failed to get price for ${tokenSymbol}/${currency}`, 500, 'PRICE_FETCH_ERROR');
    }
  }

  /**
   * Get multiple token prices at once
   */
  async getMultipleTokenPrices(tokens, currency = 'USD') {
    try {
      const promises = tokens.map(token => 
        this.getTokenPrice(token, currency).catch(error => ({
          token,
          error: error.message
        }))
      );
      
      const results = await Promise.all(promises);
      
      const prices = {};
      const errors = {};
      
      results.forEach((result, index) => {
        const token = tokens[index];
        if (result.error) {
          errors[token] = result.error;
        } else {
          prices[token] = result;
        }
      });
      
      return { prices, errors };
      
    } catch (error) {
      logger.error('Error getting multiple token prices:', error);
      throw new AppError('Failed to get multiple token prices', 500, 'MULTI_PRICE_FETCH_ERROR');
    }
  }

  /**
   * Convert amount from one token to another using USD as base
   */
  async convertTokenToToken(fromToken, toToken, amount) {
    try {
      const [fromPrice, toPrice] = await Promise.all([
        this.getTokenPrice(fromToken, 'USD'),
        this.getTokenPrice(toToken, 'USD')
      ]);
      
      const usdValue = amount * fromPrice.price;
      const convertedAmount = usdValue / toPrice.price;
      
      return {
        fromToken,
        toToken,
        amount,
        convertedAmount,
        rate: fromPrice.price / toPrice.price,
        usdValue,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Error converting token to token:', error);
      throw new AppError(`Failed to convert ${fromToken} to ${toToken}`, 500, 'TOKEN_CONVERSION_ERROR');
    }
  }

  /**
   * Convert token amount to fiat currency
   */
  async convertTokenToFiat(tokenSymbol, amount, currency = 'USD') {
    try {
      const priceData = await this.getTokenPrice(tokenSymbol, currency);
      const fiatValue = amount * priceData.price;
      
      return {
        tokenSymbol,
        tokenAmount: amount,
        currency,
        fiatValue,
        rate: priceData.price,
        timestamp: priceData.timestamp
      };
      
    } catch (error) {
      logger.error('Error converting token to fiat:', error);
      throw new AppError(`Failed to convert ${tokenSymbol} to ${currency}`, 500, 'FIAT_CONVERSION_ERROR');
    }
  }

  /**
   * Convert fiat amount to token amount
   */
  async convertFiatToToken(currency, amount, tokenSymbol) {
    try {
      const priceData = await this.getTokenPrice(tokenSymbol, currency);
      const tokenAmount = amount / priceData.price;
      
      return {
        currency,
        fiatAmount: amount,
        tokenSymbol,
        tokenAmount,
        rate: priceData.price,
        timestamp: priceData.timestamp
      };
      
    } catch (error) {
      logger.error('Error converting fiat to token:', error);
      throw new AppError(`Failed to convert ${currency} to ${tokenSymbol}`, 500, 'TOKEN_CONVERSION_ERROR');
    }
  }

  /**
   * Get historical prices for a token
   */
  async getHistoricalPrices(tokenSymbol, currency = 'USD', days = 7) {
    try {
      const cacheKey = `${this.cachePrefix}historical_${tokenSymbol}_${currency}_${days}d`;
      
      // Try cache first
      const cachedData = await this._getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch from CoinGecko API
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${this._getTokenId(tokenSymbol)}/market_chart`, {
        params: {
          vs_currency: currency.toLowerCase(),
          days: days,
          interval: days > 30 ? 'daily' : 'hourly'
        },
        timeout: 10000
      });
      
      const historicalData = {
        tokenSymbol,
        currency,
        days,
        prices: response.data.prices.map(([timestamp, price]) => ({
          timestamp: new Date(timestamp).toISOString(),
          price
        })),
        lastUpdated: new Date().toISOString()
      };
      
      // Cache for 1 hour
      await this._setCache(cacheKey, historicalData, 3600);
      
      return historicalData;
      
    } catch (error) {
      logger.error('Error getting historical prices:', error);
      throw new AppError(`Failed to get historical prices for ${tokenSymbol}`, 500, 'HISTORICAL_PRICE_ERROR');
    }
  }

  /**
   * Get market data for a token
   */
  async getMarketData(tokenSymbol) {
    try {
      const cacheKey = `${this.cachePrefix}market_${tokenSymbol}`;
      
      // Try cache first
      const cachedData = await this._getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      const tokenId = this._getTokenId(tokenSymbol);
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        },
        timeout: 10000
      });
      
      const marketData = {
        tokenSymbol,
        name: response.data.name,
        marketCap: response.data.market_data?.market_cap?.usd,
        volume24h: response.data.market_data?.total_volume?.usd,
        priceChange24h: response.data.market_data?.price_change_percentage_24h,
        priceChange7d: response.data.market_data?.price_change_percentage_7d,
        priceChange30d: response.data.market_data?.price_change_percentage_30d,
        allTimeHigh: response.data.market_data?.ath?.usd,
        allTimeLow: response.data.market_data?.atl?.usd,
        circulatingSupply: response.data.market_data?.circulating_supply,
        totalSupply: response.data.market_data?.total_supply,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache for 10 minutes
      await this._setCache(cacheKey, marketData, 600);
      
      return marketData;
      
    } catch (error) {
      logger.error('Error getting market data:', error);
      throw new AppError(`Failed to get market data for ${tokenSymbol}`, 500, 'MARKET_DATA_ERROR');
    }
  }

  /**
   * Fetch price from API (CoinGecko as primary)
   */
  async _fetchPriceFromAPI(tokenSymbol, currency) {
    try {
      const tokenId = this._getTokenId(tokenSymbol);
      const response = await axios.get(this.priceAPIs.coingecko, {
        params: {
          ids: tokenId,
          vs_currencies: currency.toLowerCase(),
          include_last_updated_at: true
        },
        timeout: 10000
      });
      
      const priceData = response.data[tokenId];
      if (!priceData) {
        throw new Error(`No price data found for ${tokenSymbol}`);
      }
      
      return {
        tokenSymbol: tokenSymbol.toUpperCase(),
        currency: currency.toUpperCase(),
        price: priceData[currency.toLowerCase()],
        lastUpdated: priceData.last_updated_at,
        timestamp: new Date().toISOString(),
        source: 'coingecko'
      };
      
    } catch (error) {
      logger.error('CoinGecko API failed, trying fallback:', error.message);
      
      // Fallback to hardcoded prices for development
      return this._getFallbackPrice(tokenSymbol, currency);
    }
  }

  /**
   * Get fallback prices for development/testing
   */
  _getFallbackPrice(tokenSymbol, currency) {
    const fallbackPrices = {
      ETH: { USD: 2000, EUR: 1800, GBP: 1600 },
      MATIC: { USD: 0.8, EUR: 0.72, GBP: 0.64 },
      USDC: { USD: 1.0, EUR: 0.9, GBP: 0.8 },
      USDT: { USD: 1.0, EUR: 0.9, GBP: 0.8 },
      DAI: { USD: 1.0, EUR: 0.9, GBP: 0.8 }
    };
    
    const price = fallbackPrices[tokenSymbol.toUpperCase()]?.[currency.toUpperCase()];
    if (!price) {
      throw new AppError(`No fallback price available for ${tokenSymbol}/${currency}`, 404, 'PRICE_NOT_FOUND');
    }
    
    return {
      tokenSymbol: tokenSymbol.toUpperCase(),
      currency: currency.toUpperCase(),
      price,
      lastUpdated: Math.floor(Date.now() / 1000),
      timestamp: new Date().toISOString(),
      source: 'fallback'
    };
  }

  /**
   * Map token symbols to CoinGecko IDs
   */
  _getTokenId(tokenSymbol) {
    const tokenMap = {
      ETH: 'ethereum',
      MATIC: 'matic-network',
      USDC: 'usd-coin',
      USDT: 'tether',
      DAI: 'dai',
      BTC: 'bitcoin',
      BNB: 'binancecoin'
    };
    
    return tokenMap[tokenSymbol.toUpperCase()] || tokenSymbol.toLowerCase();
  }

  /**
   * Get data from Redis cache
   */
  async _getFromCache(key) {
    try {
      const cachedData = await redisClient.get(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      logger.warn('Cache read error:', error.message);
      return null;
    }
  }

  /**
   * Set data in Redis cache
   */
  async _setCache(key, data, ttl = 300) {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.warn('Cache write error:', error.message);
    }
  }

  /**
   * Clear price cache
   */
  async clearCache(pattern = '*') {
    try {
      const keys = await redisClient.keys(`${this.cachePrefix}${pattern}`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`Cleared ${keys.length} price cache entries`);
      }
    } catch (error) {
      logger.error('Error clearing price cache:', error);
    }
  }
}

module.exports = PriceOracleService;
