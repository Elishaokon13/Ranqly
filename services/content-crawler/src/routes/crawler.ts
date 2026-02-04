/**
 * Crawler routes for Content Crawler
 */

import { Router, Request, Response } from 'express';
import { CrawlerService } from '../services/CrawlerService';

export function crawlerRoutes(crawlerService: CrawlerService): Router {
  const router = Router();

  // Crawl a URL
  router.post('/crawl', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        res.status(400).json({
          success: false,
          error: 'URL is required',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const content = await crawlerService.crawlUrl(url);
      
      res.json({
        success: true,
        data: content,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to crawl URL',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}
