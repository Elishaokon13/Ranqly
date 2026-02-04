import Bull from 'bull';
import winston from 'winston';

export class QueueService {
  private static instance: QueueService;
  private logger: winston.Logger;
  private queues: Map<string, Bull.Queue> = new Map();

  private constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/queue-service.log' })
      ]
    });
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public static async initialize(): Promise<void> {
    const instance = QueueService.getInstance();
    await instance.setupQueues();
  }

  public static async close(): Promise<void> {
    const instance = QueueService.getInstance();
    await instance.closeQueues();
  }

  private async setupQueues(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      // Create queues for different job types
      const queueTypes = [
        'contest-processing',
        'submission-scoring',
        'voting-processing',
        'judging-assignment',
        'notification-sending',
        'audit-logging',
        'sybil-detection',
        'dispute-resolution'
      ];

      for (const queueType of queueTypes) {
        const queue = new Bull(queueType, redisUrl, {
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        });

        // Set up job processing
        this.setupQueueProcessors(queue, queueType);

        // Set up event listeners
        this.setupQueueEvents(queue, queueType);

        this.queues.set(queueType, queue);
      }

      this.logger.info('Queue service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize queue service:', error);
      throw error;
    }
  }

  private setupQueueProcessors(queue: Bull.Queue, queueType: string): void {
    switch (queueType) {
      case 'contest-processing':
        queue.process(async (job) => {
          return await this.processContestJob(job);
        });
        break;

      case 'submission-scoring':
        queue.process(async (job) => {
          return await this.processSubmissionScoringJob(job);
        });
        break;

      case 'voting-processing':
        queue.process(async (job) => {
          return await this.processVotingJob(job);
        });
        break;

      case 'judging-assignment':
        queue.process(async (job) => {
          return await this.processJudgingAssignmentJob(job);
        });
        break;

      case 'notification-sending':
        queue.process(async (job) => {
          return await this.processNotificationJob(job);
        });
        break;

      case 'audit-logging':
        queue.process(async (job) => {
          return await this.processAuditLoggingJob(job);
        });
        break;

      case 'sybil-detection':
        queue.process(async (job) => {
          return await this.processSybilDetectionJob(job);
        });
        break;

      case 'dispute-resolution':
        queue.process(async (job) => {
          return await this.processDisputeResolutionJob(job);
        });
        break;

      default:
        this.logger.warn(`No processor defined for queue type: ${queueType}`);
    }
  }

  private setupQueueEvents(queue: Bull.Queue, queueType: string): void {
    queue.on('completed', (job) => {
      this.logger.info(`Job ${job.id} completed in queue ${queueType}`, {
        queueType,
        jobId: job.id,
        duration: Date.now() - job.processedOn!
      });
    });

    queue.on('failed', (job, err) => {
      this.logger.error(`Job ${job.id} failed in queue ${queueType}`, {
        queueType,
        jobId: job.id,
        error: err.message,
        attempts: job.attemptsMade
      });
    });

    queue.on('stalled', (job) => {
      this.logger.warn(`Job ${job.id} stalled in queue ${queueType}`, {
        queueType,
        jobId: job.id
      });
    });
  }

  // Job processors
  private async processContestJob(job: Bull.Job): Promise<any> {
    const { contestId, action } = job.data;
    
    this.logger.info(`Processing contest job: ${action} for contest ${contestId}`);
    
    switch (action) {
      case 'start-submission-phase':
        // Logic to start submission phase
        break;
      case 'start-voting-phase':
        // Logic to start voting phase
        break;
      case 'start-judging-phase':
        // Logic to start judging phase
        break;
      case 'finalize-contest':
        // Logic to finalize contest
        break;
      default:
        throw new Error(`Unknown contest action: ${action}`);
    }

    return { success: true, contestId, action };
  }

  private async processSubmissionScoringJob(job: Bull.Job): Promise<any> {
    const { submissionId, contestId } = job.data;
    
    this.logger.info(`Processing submission scoring for submission ${submissionId}`);
    
    // Call algo-engine service to score submission
    // This would typically make an HTTP request to the algo-engine service
    
    return { success: true, submissionId, score: 0.85 };
  }

  private async processVotingJob(job: Bull.Job): Promise<any> {
    const { contestId, action } = job.data;
    
    this.logger.info(`Processing voting job: ${action} for contest ${contestId}`);
    
    switch (action) {
      case 'transition-to-reveal':
        // Logic to transition from commit to reveal phase
        break;
      case 'close-voting':
        // Logic to close voting and calculate results
        break;
      case 'update-vote-counts':
        // Logic to update vote counts
        break;
      default:
        throw new Error(`Unknown voting action: ${action}`);
    }

    return { success: true, contestId, action };
  }

  private async processJudgingAssignmentJob(job: Bull.Job): Promise<any> {
    const { contestId, submissionIds } = job.data;
    
    this.logger.info(`Processing judging assignment for contest ${contestId}`);
    
    // Logic to assign judges to submissions
    
    return { success: true, contestId, assignedJudges: [] };
  }

  private async processNotificationJob(job: Bull.Job): Promise<any> {
    const { type, recipient, data } = job.data;
    
    this.logger.info(`Processing notification job: ${type} for ${recipient}`);
    
    // Logic to send notifications (email, push, etc.)
    
    return { success: true, type, recipient };
  }

  private async processAuditLoggingJob(job: Bull.Job): Promise<any> {
    const { entityType, entityId, action, actorAddress, details } = job.data;
    
    this.logger.info(`Processing audit logging job for ${entityType}:${entityId}`);
    
    // Logic to log audit events
    
    return { success: true, entityType, entityId, action };
  }

  private async processSybilDetectionJob(job: Bull.Job): Promise<any> {
    const { voterAddress, contestId } = job.data;
    
    this.logger.info(`Processing sybil detection for voter ${voterAddress}`);
    
    // Logic to detect sybil behavior
    
    return { success: true, voterAddress, isSybil: false };
  }

  private async processDisputeResolutionJob(job: Bull.Job): Promise<any> {
    const { disputeId, action } = job.data;
    
    this.logger.info(`Processing dispute resolution job: ${action} for dispute ${disputeId}`);
    
    // Logic to resolve disputes
    
    return { success: true, disputeId, action };
  }

  // Public methods to add jobs to queues
  public async addContestJob(data: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.queues.get('contest-processing');
    if (!queue) throw new Error('Contest processing queue not initialized');
    
    return await queue.add(data, options);
  }

  public async addSubmissionScoringJob(data: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.queues.get('submission-scoring');
    if (!queue) throw new Error('Submission scoring queue not initialized');
    
    return await queue.add(data, options);
  }

  public async addVotingJob(data: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.queues.get('voting-processing');
    if (!queue) throw new Error('Voting processing queue not initialized');
    
    return await queue.add(data, options);
  }

  public async addJudgingAssignmentJob(data: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.queues.get('judging-assignment');
    if (!queue) throw new Error('Judging assignment queue not initialized');
    
    return await queue.add(data, options);
  }

  public async addNotificationJob(data: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.queues.get('notification-sending');
    if (!queue) throw new Error('Notification sending queue not initialized');
    
    return await queue.add(data, options);
  }

  public async addAuditLoggingJob(data: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.queues.get('audit-logging');
    if (!queue) throw new Error('Audit logging queue not initialized');
    
    return await queue.add(data, options);
  }

  public async addSybilDetectionJob(data: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.queues.get('sybil-detection');
    if (!queue) throw new Error('Sybil detection queue not initialized');
    
    return await queue.add(data, options);
  }

  public async addDisputeResolutionJob(data: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.queues.get('dispute-resolution');
    if (!queue) throw new Error('Dispute resolution queue not initialized');
    
    return await queue.add(data, options);
  }

  // Queue management methods
  public async getQueueStats(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }

  public async getAllQueueStats(): Promise<any> {
    const stats: any = {};
    
    for (const [queueName, queue] of this.queues) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return stats;
  }

  public async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    
    await queue.pause();
    this.logger.info(`Queue ${queueName} paused`);
  }

  public async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    
    await queue.resume();
    this.logger.info(`Queue ${queueName} resumed`);
  }

  private async closeQueues(): Promise<void> {
    for (const [queueName, queue] of this.queues) {
      await queue.close();
      this.logger.info(`Queue ${queueName} closed`);
    }
    this.logger.info('All queues closed');
  }
}