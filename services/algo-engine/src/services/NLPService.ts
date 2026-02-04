/**
 * NLP Service for Algorithm Engine - Natural Language Processing capabilities
 * Converted from Python to Node.js with equivalent functionality
 */

import winston from 'winston';
import natural from 'natural';
import compromise from 'compromise';
import sentiment from 'sentiment';

// Types
interface ContentAnalysisResult {
  depth: number;
  reach: number;
  relevance: number;
  consistency: number;
  confidence: number;
  details: {
    technicalTerms: string[];
    analysisMarkers: number;
    evidenceMarkers: number;
    citationPatterns: number;
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    readabilityScore: number;
    sentimentScore: number;
    topicKeywords: string[];
    plagiarismScore: number;
    formattingScore: number;
  };
}

interface ContestContext {
  contestId?: string;
  theme: string;
  keywords: string[];
  contentType: string;
  submissionDate?: Date;
}

interface SocialMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  retweets?: number;
  platform: string;
}

export class NLPService {
  private logger: winston.Logger;
  private modelsLoaded: boolean = false;
  private modelCache: Map<string, any> = new Map();
  private embeddingsCache: Map<string, number[]> = new Map();
  
  // NLP models and tools
  private sentimentAnalyzer: any;
  private tokenizer: natural.WordTokenizer;
  private stemmer: natural.PorterStemmer;
  
  // Technical terms and patterns
  private readonly technicalTerms = [
    'algorithm', 'protocol', 'smart contract', 'blockchain', 'defi', 'nft',
    'cryptocurrency', 'consensus', 'mining', 'staking', 'governance', 'dao',
    'web3', 'metaverse', 'dapp', 'tokenomics', 'liquidity', 'yield farming',
    'amm', 'dex', 'cex', 'wallet', 'private key', 'public key', 'hash',
    'merkle tree', 'proof of work', 'proof of stake', 'layer 2', 'rollup'
  ];
  
  private readonly analysisMarkers = [
    'however', 'therefore', 'furthermore', 'moreover', 'consequently',
    'additionally', 'alternatively', 'meanwhile', 'subsequently', 'hence',
    'thus', 'accordingly', 'nevertheless', 'nonetheless', 'moreover'
  ];
  
  private readonly evidenceMarkers = [
    'research shows', 'studies indicate', 'data suggests', 'analysis reveals',
    'according to', 'findings show', 'evidence suggests', 'statistics show',
    'survey reveals', 'report indicates', 'study demonstrates', 'results show'
  ];
  
  private readonly citationPatterns = [
    /\[[\d\w\s]+\]/g,  // [1], [Smith 2023], etc.
    /\([^)]*20\d{2}[^)]*\)/g,  // (Smith, 2023), (2023), etc.
    /https?:\/\/\S+/g,  // URLs
    /www\.\S+/g,  // www links
    /doi:\S+/g  // DOI references
  ];

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.sentimentAnalyzer = new sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing NLP service...');
      
      // Load NLP models
      await this.loadModels();
      
      this.modelsLoaded = true;
      this.logger.info('NLP service initialized successfully');
      
    } catch (error) {
      this.logger.error(`Failed to initialize NLP service: ${error}`);
      throw error;
    }
  }

  private async loadModels(): Promise<void> {
    try {
      this.logger.info('Loading NLP models...');
      
      // Simulate model loading time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.logger.info('NLP models loaded successfully');
      
    } catch (error) {
      this.logger.error(`Error loading NLP models: ${error}`);
      throw error;
    }
  }

  async analyzeContentDepth(
    content: string, 
    contentType: string = 'text'
  ): Promise<{ score: number; confidence: number; details: any }> {
    try {
      const text = content.toLowerCase();
      const words = this.tokenizer.tokenize(text) || [];
      const wordCount = words.length;
      
      // Base depth from word count (logarithmic scaling)
      const baseDepth = Math.min(100, 20 + 15 * Math.log10(Math.max(1, wordCount)));
      
      // Technical depth indicators
      let technicalBonus = 0;
      const foundTechnicalTerms: string[] = [];
      
      for (const term of this.technicalTerms) {
        if (text.includes(term.toLowerCase())) {
          technicalBonus += 2;
          foundTechnicalTerms.push(term);
        }
      }
      
      // Analysis depth indicators
      let analysisBonus = 0;
      for (const marker of this.analysisMarkers) {
        const matches = (text.match(new RegExp(marker, 'g')) || []).length;
        analysisBonus += matches * 3;
      }
      
      // Evidence and citation depth
      let evidenceBonus = 0;
      for (const pattern of this.citationPatterns) {
        const matches = (text.match(pattern) || []).length;
        evidenceBonus += matches * 2;
      }
      
      // Structural depth (headings, lists, etc.)
      let structureBonus = 0;
      if (text.includes('##') || text.includes('###')) {
        structureBonus += 5; // Markdown headings
      }
      if (text.includes('- ') || text.includes('* ')) {
        structureBonus += 3; // Lists
      }
      if (text.includes('<h') || text.includes('</h>')) {
        structureBonus += 5; // HTML headings
      }
      
      // Content type adjustments
      const typeBonus = this.getContentTypeBonus(contentType);
      
      // Calculate final depth score
      const depthScore = baseDepth + technicalBonus + analysisBonus + evidenceBonus + structureBonus + typeBonus;
      const finalScore = Math.min(100, Math.max(0, depthScore));
      
      // Calculate confidence based on analysis completeness
      const confidence = Math.min(1, (foundTechnicalTerms.length + analysisBonus / 3 + evidenceBonus / 2) / 20);
      
      return {
        score: finalScore,
        confidence,
        details: {
          baseDepth,
          technicalBonus,
          analysisBonus,
          evidenceBonus,
          structureBonus,
          typeBonus,
          foundTechnicalTerms,
          wordCount
        }
      };
      
    } catch (error) {
      this.logger.error(`Error analyzing content depth: ${error}`);
      return { score: 0, confidence: 0, details: {} };
    }
  }

  async analyzeContentReach(
    content: string, 
    contentType: string = 'text'
  ): Promise<{ score: number; confidence: number; details: any }> {
    try {
      // Extract social metrics from content metadata (simulated)
      const socialMetrics = this.extractSocialMetrics(content);
      
      // Calculate engagement score
      const totalEngagement = (
        socialMetrics.likes * 1 +
        socialMetrics.shares * 2 +
        socialMetrics.comments * 3 +
        (socialMetrics.retweets || 0) * 2
      );
      
      // Base reach from views (logarithmic scaling)
      const baseReach = Math.min(50, 10 + 10 * Math.log10(Math.max(1, socialMetrics.views)));
      
      // Engagement bonus
      const engagementBonus = Math.min(30, totalEngagement / 10);
      
      // Platform-specific adjustments
      const platformBonus = this.getPlatformBonus(socialMetrics.platform);
      
      // Time decay factor (recent content gets slight bonus)
      const timeBonus = this.getTimeBonus();
      
      const reachScore = baseReach + engagementBonus + platformBonus + timeBonus;
      const finalScore = Math.min(100, Math.max(0, reachScore));
      
      // Calculate confidence based on available metrics
      const confidence = Math.min(1, (socialMetrics.views + totalEngagement) / 1000);
      
      return {
        score: finalScore,
        confidence,
        details: {
          baseReach,
          engagementBonus,
          platformBonus,
          timeBonus,
          socialMetrics,
          totalEngagement
        }
      };
      
    } catch (error) {
      this.logger.error(`Error analyzing content reach: ${error}`);
      return { score: 25, confidence: 0, details: {} };
    }
  }

  async analyzeContentRelevance(
    content: string, 
    contestContext: ContestContext,
    contentType: string = 'text'
  ): Promise<{ score: number; confidence: number; details: any }> {
    try {
      // Extract contest theme and keywords
      const themeText = contestContext.theme.toLowerCase();
      const keywords = contestContext.keywords.map(kw => kw.toLowerCase());
      
      // Combine theme and keywords for similarity analysis
      const contestContextText = themeText + ' ' + keywords.join(' ');
      
      // Calculate semantic similarity using TF-IDF
      const similarity = this.calculateSemanticSimilarity(content, contestContextText);
      
      // Base relevance from semantic similarity
      const baseRelevance = similarity * 60;
      
      // Keyword matching bonus
      let keywordBonus = 0;
      const foundKeywords: string[] = [];
      const textLower = content.toLowerCase();
      
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          keywordBonus += 5;
          foundKeywords.push(keyword);
        }
      }
      
      // Theme word frequency bonus
      const themeWords = themeText.split(' ').filter(word => word.length > 3);
      let themeBonus = 0;
      
      for (const word of themeWords) {
        const count = (textLower.match(new RegExp(word, 'g')) || []).length;
        themeBonus += count * 2;
      }
      
      // Content type relevance adjustments
      const typeRelevance = this.getContentTypeRelevance(contentType);
      
      const relevanceScore = baseRelevance + keywordBonus + themeBonus + typeRelevance;
      const finalScore = Math.min(100, Math.max(0, relevanceScore));
      
      // Calculate confidence based on keyword matches and similarity
      const confidence = Math.min(1, (foundKeywords.length + similarity) / 10);
      
      return {
        score: finalScore,
        confidence,
        details: {
          baseRelevance,
          keywordBonus,
          themeBonus,
          typeRelevance,
          foundKeywords,
          similarity,
          contestContext: contestContext.theme
        }
      };
      
    } catch (error) {
      this.logger.error(`Error analyzing content relevance: ${error}`);
      return { score: 50, confidence: 0, details: {} };
    }
  }

  async analyzeContentConsistency(
    content: string, 
    contentType: string = 'text'
  ): Promise<{ score: number; confidence: number; details: any }> {
    try {
      // Start with base quality score
      let baseQuality = 70.0;
      
      // Content length appropriateness
      const words = this.tokenizer.tokenize(content) || [];
      const wordCount = words.length;
      
      if (wordCount < 100) {
        baseQuality -= 20; // Too short
      } else if (wordCount > 10000) {
        baseQuality -= 10; // Potentially too long
      }
      
      // Readability check
      const avgSentenceLength = this.calculateAverageSentenceLength(content);
      if (avgSentenceLength > 25) {
        baseQuality -= 10; // Poor readability
      } else if (avgSentenceLength < 8) {
        baseQuality -= 5; // Too choppy
      }
      
      // Plagiarism detection (simulated)
      const plagiarismPenalty = await this.detectPlagiarism(content);
      baseQuality -= plagiarismPenalty;
      
      // Formatting quality
      const formattingScore = this.assessFormattingQuality(content);
      
      // Language quality indicators
      const languageQuality = this.assessLanguageQuality(content);
      
      // Sentiment analysis
      const sentimentResult = this.sentimentAnalyzer.analyze(content);
      const sentimentBonus = Math.max(-10, Math.min(10, sentimentResult.score / 10));
      
      const consistencyScore = baseQuality + formattingScore + languageQuality + sentimentBonus;
      const finalScore = Math.min(100, Math.max(0, consistencyScore));
      
      // Calculate confidence based on analysis completeness
      const confidence = Math.min(1, (formattingScore + Math.abs(languageQuality) + 70) / 100);
      
      return {
        score: finalScore,
        confidence,
        details: {
          baseQuality,
          wordCount,
          avgSentenceLength,
          plagiarismPenalty,
          formattingScore,
          languageQuality,
          sentimentBonus,
          sentimentResult
        }
      };
      
    } catch (error) {
      this.logger.error(`Error analyzing content consistency: ${error}`);
      return { score: 60, confidence: 0, details: {} };
    }
  }

  private extractSocialMetrics(content: string): SocialMetrics {
    // Simulate social metrics extraction from content
    // In production, this would extract from metadata or API calls
    
    // Look for social media indicators in content
    const hasTwitterMention = content.includes('twitter.com') || content.includes('@');
    const hasYouTubeLink = content.includes('youtube.com') || content.includes('youtu.be');
    const hasMediumLink = content.includes('medium.com') || content.includes('substack.com');
    
    let platform = 'unknown';
    if (hasTwitterMention) platform = 'twitter';
    else if (hasYouTubeLink) platform = 'youtube';
    else if (hasMediumLink) platform = 'medium';
    
    // Simulate metrics based on content quality and type
    const wordCount = (this.tokenizer.tokenize(content) || []).length;
    const baseViews = Math.min(10000, Math.max(100, wordCount * 10));
    
    return {
      views: baseViews,
      likes: Math.floor(baseViews * 0.03),
      shares: Math.floor(baseViews * 0.01),
      comments: Math.floor(baseViews * 0.005),
      retweets: platform === 'twitter' ? Math.floor(baseViews * 0.02) : 0,
      platform
    };
  }

  private calculateSemanticSimilarity(text1: string, text2: string): number {
    try {
      // Use TF-IDF for semantic similarity calculation
      const documents = [text1, text2];
      const tfidf = natural.TfIdf;
      const tfidfInstance = new tfidf();
      
      documents.forEach(doc => tfidfInstance.addDocument(doc));
      
      // Calculate cosine similarity
      const doc1Terms = this.tokenizer.tokenize(text1) || [];
      const doc2Terms = this.tokenizer.tokenize(text2) || [];
      
      const allTerms = [...new Set([...doc1Terms, ...doc2Terms])];
      const vector1 = allTerms.map(term => tfidfInstance.tfidf(term, 0));
      const vector2 = allTerms.map(term => tfidfInstance.tfidf(term, 1));
      
      // Calculate cosine similarity
      const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
      const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
      
      if (magnitude1 === 0 || magnitude2 === 0) return 0;
      
      return dotProduct / (magnitude1 * magnitude2);
      
    } catch (error) {
      this.logger.error(`Error calculating semantic similarity: ${error}`);
      return 0.5; // Default moderate similarity
    }
  }

  private async detectPlagiarism(content: string): Promise<number> {
    // Simulate plagiarism detection
    // In production, this would use more sophisticated methods
    try {
      const words = this.tokenizer.tokenize(content.toLowerCase()) || [];
      const shingles = new Set<string>();
      
      // Create 3-word shingles
      for (let i = 0; i < words.length - 2; i++) {
        const shingle = words.slice(i, i + 3).join(' ');
        shingles.add(shingle);
      }
      
      // Simulate plagiarism penalty based on content uniqueness
      const uniqueRatio = shingles.size / Math.max(1, words.length);
      
      if (uniqueRatio < 0.3) return 30; // Heavy penalty
      if (uniqueRatio < 0.5) return 15; // Moderate penalty
      if (uniqueRatio < 0.7) return 5;  // Light penalty
      
      return 0; // No penalty
      
    } catch (error) {
      this.logger.error(`Error in plagiarism detection: ${error}`);
      return 0;
    }
  }

  private assessFormattingQuality(content: string): number {
    let score = 0;
    
    // Check for proper paragraph breaks
    if (content.includes('\n\n') || content.includes('\r\n\r\n')) {
      score += 5;
    }
    
    // Check for headings (markdown or HTML)
    if (content.includes('#') || content.includes('<h')) {
      score += 5;
    }
    
    // Check for lists
    if (content.includes('- ') || content.includes('* ') || content.includes('<li>')) {
      score += 3;
    }
    
    // Check for links (indicates research)
    if (content.includes('http') || content.includes('www.')) {
      score += 2;
    }
    
    // Check for code blocks (indicates technical content)
    if (content.includes('```') || content.includes('<code>')) {
      score += 3;
    }
    
    return score;
  }

  private assessLanguageQuality(content: string): number {
    let score = 0;
    
    // Check for spelling/grammar issues (simple heuristic)
    const commonErrors = ['teh', 'adn', 'recieve', 'seperate', 'definately', 'alot'];
    const errorCount = commonErrors.reduce((count, error) => {
      return count + (content.toLowerCase().match(new RegExp(error, 'g')) || []).length;
    }, 0);
    score -= errorCount * 2;
    
    // Check for professional language
    const professionalTerms = [
      'analysis', 'research', 'development', 'implementation', 'evaluation',
      'methodology', 'framework', 'architecture', 'optimization', 'integration'
    ];
    const professionalCount = professionalTerms.reduce((count, term) => {
      return count + (content.toLowerCase().match(new RegExp(term, 'g')) || []).length;
    }, 0);
    score += Math.min(10, professionalCount * 2);
    
    // Check for proper capitalization
    const sentences = content.split(/[.!?]+/);
    const properlyCapitalized = sentences.filter(sentence => {
      const trimmed = sentence.trim();
      return trimmed.length > 0 && trimmed[0] === trimmed[0].toUpperCase();
    }).length;
    
    const capitalizationScore = (properlyCapitalized / Math.max(1, sentences.length)) * 5;
    score += capitalizationScore;
    
    return score;
  }

  private calculateAverageSentenceLength(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenizer.tokenize(content) || [];
    
    return sentences.length > 0 ? words.length / sentences.length : 0;
  }

  private getContentTypeBonus(contentType: string): number {
    const bonuses: { [key: string]: number } = {
      'blog': 5,
      'article': 5,
      'whitepaper': 10,
      'video': 3,
      'tweet': -10,
      'image': -5,
      'code': 8,
      'documentation': 6
    };
    
    return bonuses[contentType.toLowerCase()] || 0;
  }

  private getContentTypeRelevance(contentType: string): number {
    const relevances: { [key: string]: number } = {
      'blog': 5,
      'article': 5,
      'whitepaper': 10,
      'video': 3,
      'tweet': 2,
      'image': 1,
      'code': 8,
      'documentation': 6
    };
    
    return relevances[contentType.toLowerCase()] || 0;
  }

  private getPlatformBonus(platform: string): number {
    const bonuses: { [key: string]: number } = {
      'twitter': 5,
      'youtube': 8,
      'medium': 3,
      'substack': 3,
      'linkedin': 4,
      'reddit': 2
    };
    
    return bonuses[platform.toLowerCase()] || 0;
  }

  private getTimeBonus(): number {
    // Simulate time bonus for recent content
    // In production, this would use actual submission date
    return Math.max(0, 5 - Math.random() * 10); // Random bonus between -5 and 5
  }

  healthCheck(): { status: string; modelsLoaded: boolean; models: string[] } {
    return {
      status: this.modelsLoaded ? 'healthy' : 'loading',
      modelsLoaded: this.modelsLoaded,
      models: Array.from(this.modelCache.keys())
    };
  }
}