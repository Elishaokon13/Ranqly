/**
 * Crawler Service for Content Crawler
 * Handles web scraping and content extraction
 */

import winston from 'winston';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';

export class CrawlerService {
  private logger: winston.Logger;
  private databaseService: DatabaseService | null = null;
  private redisService: RedisService | null = null;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  async initialize(
    databaseService: DatabaseService,
    redisService: RedisService
  ): Promise<void> {
    try {
      this.databaseService = databaseService;
      this.redisService = redisService;
      
      this.logger.info('Crawler service initialized successfully');
      
    } catch (error) {
      this.logger.error(`Failed to initialize crawler service: ${error}`);
      throw error;
    }
  }

  async crawlUrl(url: string): Promise<any> {
    try {
      this.logger.info(`Crawling URL: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      const content = {
        url,
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        content: $('body').text().trim(),
        links: $('a[href]').map((_, el) => $(el).attr('href')).get(),
        images: $('img[src]').map((_, el) => $(el).attr('src')).get(),
        timestamp: new Date().toISOString()
      };
      
      this.logger.info(`Successfully crawled URL: ${url}`);
      return content;
      
    } catch (error) {
      this.logger.error(`Error crawling URL ${url}: ${error}`);
      throw error;
    }
  }

  healthCheck(): { status: string } {
    return {
      status: 'healthy'
    };
  }
}
