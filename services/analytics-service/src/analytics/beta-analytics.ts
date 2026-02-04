import { DatabaseService } from '../services/database-service';
import { Logger } from '../utils/logger';

export class BetaAnalytics {
  private dbService: DatabaseService;
  private logger: Logger;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.logger = new Logger();
  }

  /**
   * Get comprehensive beta testing analytics
   */
  async getBetaAnalytics(period: string = '7d') {
    try {
      const [
        userMetrics,
        engagementMetrics,
        featureMetrics,
        feedbackMetrics,
        performanceMetrics,
        satisfactionMetrics
      ] = await Promise.all([
        this.getUserMetrics(period),
        this.getEngagementMetrics(period),
        this.getFeatureMetrics(period),
        this.getFeedbackMetrics(period),
        this.getPerformanceMetrics(period),
        this.getSatisfactionMetrics(period)
      ]);

      return {
        period,
        timestamp: new Date().toISOString(),
        user: userMetrics,
        engagement: engagementMetrics,
        features: featureMetrics,
        feedback: feedbackMetrics,
        performance: performanceMetrics,
        satisfaction: satisfactionMetrics
      };

    } catch (error) {
      this.logger.error('Error getting beta analytics:', error);
      throw error;
    }
  }

  /**
   * Get user-related metrics
   */
  private async getUserMetrics(period: string) {
    const startDate = this.getStartDate(period);
    
    const [
      totalUsers,
      activeUsers,
      newUsers,
      userRetention,
      userTiers,
      userStatus
    ] = await Promise.all([
      this.dbService.getTotalBetaUsers(),
      this.dbService.getActiveBetaUsers(startDate),
      this.dbService.getNewBetaUsers(startDate),
      this.dbService.getBetaUserRetention(startDate),
      this.dbService.getBetaUserTierDistribution(),
      this.dbService.getBetaUserStatusDistribution()
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      new: newUsers,
      retention: userRetention,
      tierDistribution: userTiers,
      statusDistribution: userStatus,
      growthRate: this.calculateGrowthRate(newUsers, totalUsers)
    };
  }

  /**
   * Get engagement metrics
   */
  private async getEngagementMetrics(period: string) {
    const startDate = this.getStartDate(period);
    
    const [
      sessions,
      averageSessionDuration,
      pageViews,
      bounceRate,
      userActions,
      featureUsage
    ] = await Promise.all([
      this.dbService.getBetaUserSessions(startDate),
      this.dbService.getAverageSessionDuration(startDate),
      this.dbService.getBetaUserPageViews(startDate),
      this.dbService.getBetaUserBounceRate(startDate),
      this.dbService.getBetaUserActions(startDate),
      this.dbService.getBetaFeatureUsage(startDate)
    ]);

    return {
      sessions: sessions.total,
      averageSessionDuration: averageSessionDuration,
      pageViews: pageViews.total,
      bounceRate: bounceRate,
      userActions: userActions.total,
      featureUsage: featureUsage,
      engagementScore: this.calculateEngagementScore(sessions, averageSessionDuration, userActions)
    };
  }

  /**
   * Get feature-specific metrics
   */
  private async getFeatureMetrics(period: string) {
    const startDate = this.getStartDate(period);
    
    const [
      contestMetrics,
      votingMetrics,
      submissionMetrics,
      feedbackMetrics
    ] = await Promise.all([
      this.getContestMetrics(startDate),
      this.getVotingMetrics(startDate),
      this.getSubmissionMetrics(startDate),
      this.getFeedbackMetrics(startDate)
    ]);

    return {
      contests: contestMetrics,
      voting: votingMetrics,
      submissions: submissionMetrics,
      feedback: feedbackMetrics
    };
  }

  /**
   * Get contest-related metrics
   */
  private async getContestMetrics(startDate: Date) {
    const [
      contestsCreated,
      contestsCompleted,
      contestsActive,
      averageContestDuration,
      contestTypes
    ] = await Promise.all([
      this.dbService.getContestsCreated(startDate),
      this.dbService.getContestsCompleted(startDate),
      this.dbService.getActiveContests(),
      this.dbService.getAverageContestDuration(startDate),
      this.dbService.getContestTypeDistribution(startDate)
    ]);

    return {
      created: contestsCreated.total,
      completed: contestsCompleted.total,
      active: contestsActive.total,
      averageDuration: averageContestDuration,
      typeDistribution: contestTypes,
      completionRate: this.calculateCompletionRate(contestsCreated, contestsCompleted)
    };
  }

  /**
   * Get voting-related metrics
   */
  private async getVotingMetrics(startDate: Date) {
    const [
      totalVotes,
      votesPerContest,
      votingParticipation,
      voteDistribution,
      votingErrors
    ] = await Promise.all([
      this.dbService.getTotalVotes(startDate),
      this.dbService.getAverageVotesPerContest(startDate),
      this.dbService.getVotingParticipation(startDate),
      this.dbService.getVoteDistribution(startDate),
      this.dbService.getVotingErrors(startDate)
    ]);

    return {
      total: totalVotes.total,
      averagePerContest: votesPerContest,
      participation: votingParticipation,
      distribution: voteDistribution,
      errors: votingErrors.total,
      errorRate: this.calculateErrorRate(totalVotes, votingErrors)
    };
  }

  /**
   * Get submission-related metrics
   */
  private async getSubmissionMetrics(startDate: Date) {
    const [
      totalSubmissions,
      submissionsPerContest,
      submissionTypes,
      submissionQuality,
      submissionErrors
    ] = await Promise.all([
      this.dbService.getTotalSubmissions(startDate),
      this.dbService.getAverageSubmissionsPerContest(startDate),
      this.dbService.getSubmissionTypeDistribution(startDate),
      this.dbService.getSubmissionQualityMetrics(startDate),
      this.dbService.getSubmissionErrors(startDate)
    ]);

    return {
      total: totalSubmissions.total,
      averagePerContest: submissionsPerContest,
      typeDistribution: submissionTypes,
      quality: submissionQuality,
      errors: submissionErrors.total,
      errorRate: this.calculateErrorRate(totalSubmissions, submissionErrors)
    };
  }

  /**
   * Get feedback-related metrics
   */
  private async getFeedbackMetrics(startDate: Date) {
    const [
      totalFeedback,
      feedbackTypes,
      feedbackPriority,
      feedbackResolution,
      feedbackSatisfaction
    ] = await Promise.all([
      this.dbService.getTotalFeedback(startDate),
      this.dbService.getFeedbackTypeDistribution(startDate),
      this.dbService.getFeedbackPriorityDistribution(startDate),
      this.dbService.getFeedbackResolutionMetrics(startDate),
      this.dbService.getFeedbackSatisfactionMetrics(startDate)
    ]);

    return {
      total: totalFeedback.total,
      typeDistribution: feedbackTypes,
      priorityDistribution: feedbackPriority,
      resolution: feedbackResolution,
      satisfaction: feedbackSatisfaction
    };
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(period: string) {
    const startDate = this.getStartDate(period);
    
    const [
      responseTimes,
      errorRates,
      throughput,
      resourceUsage
    ] = await Promise.all([
      this.dbService.getAverageResponseTimes(startDate),
      this.dbService.getErrorRates(startDate),
      this.dbService.getThroughputMetrics(startDate),
      this.dbService.getResourceUsageMetrics(startDate)
    ]);

    return {
      responseTimes: responseTimes,
      errorRates: errorRates,
      throughput: throughput,
      resourceUsage: resourceUsage,
      performanceScore: this.calculatePerformanceScore(responseTimes, errorRates, throughput)
    };
  }

  /**
   * Get satisfaction metrics
   */
  private async getSatisfactionMetrics(period: string) {
    const startDate = this.getStartDate(period);
    
    const [
      overallSatisfaction,
      featureSatisfaction,
      satisfactionTrends,
      npsScore
    ] = await Promise.all([
      this.dbService.getOverallSatisfaction(startDate),
      this.dbService.getFeatureSatisfaction(startDate),
      this.dbService.getSatisfactionTrends(startDate),
      this.dbService.getNPSScore(startDate)
    ]);

    return {
      overall: overallSatisfaction,
      features: featureSatisfaction,
      trends: satisfactionTrends,
      nps: npsScore
    };
  }

  /**
   * Get beta testing success metrics
   */
  async getBetaSuccessMetrics() {
    try {
      const [
        userEngagement,
        featureAdoption,
        feedbackQuality,
        performanceStability,
        satisfactionScore
      ] = await Promise.all([
        this.getUserEngagementScore(),
        this.getFeatureAdoptionScore(),
        this.getFeedbackQualityScore(),
        this.getPerformanceStabilityScore(),
        this.getSatisfactionScore()
      ]);

      const overallScore = this.calculateOverallBetaScore({
        userEngagement,
        featureAdoption,
        feedbackQuality,
        performanceStability,
        satisfactionScore
      });

      return {
        overallScore,
        userEngagement,
        featureAdoption,
        feedbackQuality,
        performanceStability,
        satisfactionScore,
        recommendations: this.generateRecommendations({
          userEngagement,
          featureAdoption,
          feedbackQuality,
          performanceStability,
          satisfactionScore
        })
      };

    } catch (error) {
      this.logger.error('Error getting beta success metrics:', error);
      throw error;
    }
  }

  /**
   * Get beta testing recommendations
   */
  async getBetaRecommendations() {
    try {
      const analytics = await this.getBetaAnalytics('30d');
      const successMetrics = await this.getBetaSuccessMetrics();

      const recommendations = [];

      // User engagement recommendations
      if (successMetrics.userEngagement < 70) {
        recommendations.push({
          category: 'User Engagement',
          priority: 'high',
          issue: 'Low user engagement detected',
          recommendation: 'Implement gamification features, improve onboarding flow, and add more interactive elements',
          metrics: {
            current: successMetrics.userEngagement,
            target: 80
          }
        });
      }

      // Feature adoption recommendations
      if (successMetrics.featureAdoption < 60) {
        recommendations.push({
          category: 'Feature Adoption',
          priority: 'medium',
          issue: 'Low feature adoption rate',
          recommendation: 'Improve feature discoverability, add tutorials, and implement progressive disclosure',
          metrics: {
            current: successMetrics.featureAdoption,
            target: 75
          }
        });
      }

      // Performance recommendations
      if (successMetrics.performanceStability < 90) {
        recommendations.push({
          category: 'Performance',
          priority: 'high',
          issue: 'Performance stability issues detected',
          recommendation: 'Optimize database queries, implement caching, and improve error handling',
          metrics: {
            current: successMetrics.performanceStability,
            target: 95
          }
        });
      }

      // Satisfaction recommendations
      if (successMetrics.satisfactionScore < 4.0) {
        recommendations.push({
          category: 'User Satisfaction',
          priority: 'high',
          issue: 'User satisfaction below target',
          recommendation: 'Address critical feedback, improve UX, and implement requested features',
          metrics: {
            current: successMetrics.satisfactionScore,
            target: 4.5
          }
        });
      }

      return {
        recommendations,
        summary: {
          total: recommendations.length,
          high: recommendations.filter(r => r.priority === 'high').length,
          medium: recommendations.filter(r => r.priority === 'medium').length,
          low: recommendations.filter(r => r.priority === 'low').length
        }
      };

    } catch (error) {
      this.logger.error('Error getting beta recommendations:', error);
      throw error;
    }
  }

  // Helper methods
  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private calculateGrowthRate(newUsers: number, totalUsers: number): number {
    return totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0;
  }

  private calculateEngagementScore(sessions: any, avgDuration: number, actions: any): number {
    const sessionScore = Math.min(sessions.total / 100, 1) * 30;
    const durationScore = Math.min(avgDuration / 30, 1) * 30;
    const actionScore = Math.min(actions.total / 1000, 1) * 40;
    return Math.round(sessionScore + durationScore + actionScore);
  }

  private calculateCompletionRate(created: any, completed: any): number {
    return created.total > 0 ? (completed.total / created.total) * 100 : 0;
  }

  private calculateErrorRate(total: any, errors: any): number {
    return total.total > 0 ? (errors.total / total.total) * 100 : 0;
  }

  private calculatePerformanceScore(responseTimes: any, errorRates: any, throughput: any): number {
    const responseScore = Math.max(0, 100 - (responseTimes.average / 1000) * 10);
    const errorScore = Math.max(0, 100 - errorRates.total * 10);
    const throughputScore = Math.min(throughput.average / 100, 1) * 100;
    return Math.round((responseScore + errorScore + throughputScore) / 3);
  }

  private async getUserEngagementScore(): Promise<number> {
    // Implementation would calculate user engagement score
    return 75; // Placeholder
  }

  private async getFeatureAdoptionScore(): Promise<number> {
    // Implementation would calculate feature adoption score
    return 65; // Placeholder
  }

  private async getFeedbackQualityScore(): Promise<number> {
    // Implementation would calculate feedback quality score
    return 80; // Placeholder
  }

  private async getPerformanceStabilityScore(): Promise<number> {
    // Implementation would calculate performance stability score
    return 85; // Placeholder
  }

  private async getSatisfactionScore(): Promise<number> {
    // Implementation would calculate satisfaction score
    return 4.2; // Placeholder
  }

  private calculateOverallBetaScore(metrics: any): number {
    const weights = {
      userEngagement: 0.25,
      featureAdoption: 0.20,
      feedbackQuality: 0.20,
      performanceStability: 0.20,
      satisfactionScore: 0.15
    };

    return Math.round(
      metrics.userEngagement * weights.userEngagement +
      metrics.featureAdoption * weights.featureAdoption +
      metrics.feedbackQuality * weights.feedbackQuality +
      metrics.performanceStability * weights.performanceStability +
      (metrics.satisfactionScore / 5) * 100 * weights.satisfactionScore
    );
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations = [];

    if (metrics.userEngagement < 70) {
      recommendations.push('Improve user onboarding and engagement features');
    }

    if (metrics.featureAdoption < 60) {
      recommendations.push('Enhance feature discoverability and usability');
    }

    if (metrics.performanceStability < 90) {
      recommendations.push('Optimize performance and stability');
    }

    if (metrics.satisfactionScore < 4.0) {
      recommendations.push('Address user feedback and improve satisfaction');
    }

    return recommendations;
  }
}
