import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Activity, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

interface BetaAnalytics {
  user: {
    total: number;
    active: number;
    new: number;
    retention: number;
    growthRate: number;
  };
  engagement: {
    sessions: number;
    averageSessionDuration: number;
    engagementScore: number;
  };
  features: {
    contests: {
      created: number;
      completed: number;
      completionRate: number;
    };
    voting: {
      total: number;
      participation: number;
    };
    submissions: {
      total: number;
      averagePerContest: number;
    };
  };
  feedback: {
    total: number;
    satisfaction: number;
  };
  performance: {
    responseTimes: number;
    errorRates: number;
    performanceScore: number;
  };
}

interface BetaRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
  metrics: {
    current: number;
    target: number;
  };
}

export default function BetaDashboard() {
  const [analytics, setAnalytics] = useState<BetaAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<BetaRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    fetchBetaAnalytics();
  }, [selectedPeriod]);

  const fetchBetaAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/analytics/beta?period=${selectedPeriod}`);
      const data = await response.json();
      setAnalytics(data.analytics);

      const recResponse = await fetch('/api/v1/analytics/beta/recommendations');
      const recData = await recResponse.json();
      setRecommendations(recData.recommendations || []);
    } catch (error) {
      console.error('Error fetching beta analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Beta Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor beta testing progress and user feedback
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {selectedPeriod}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beta Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.user.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.user.growthRate.toFixed(1)}% growth rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.user.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics?.user.active || 0) / (analytics?.user.total || 1) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(analytics?.engagement.engagementScore || 0)}`}>
              {analytics?.engagement.engagementScore || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg session: {Math.round(analytics?.engagement.averageSessionDuration || 0)}min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(analytics?.performance.performanceScore || 0)}`}>
              {analytics?.performance.performanceScore || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.performance.errorRates.toFixed(2)}% error rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Engagement Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Daily active users and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sessions</span>
                    <span className="text-sm text-muted-foreground">
                      {analytics?.engagement.sessions || 0}
                    </span>
                  </div>
                  <Progress value={analytics?.engagement.engagementScore || 0} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Duration</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(analytics?.engagement.averageSessionDuration || 0)} min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Contest creation and participation metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Contests Created</span>
                    <Badge variant="secondary">
                      {analytics?.features.contests.created || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <Badge variant={analytics?.features.contests.completionRate > 70 ? "default" : "destructive"}>
                      {analytics?.features.contests.completionRate.toFixed(1) || 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Votes</span>
                    <Badge variant="secondary">
                      {analytics?.features.voting.total || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Submissions</span>
                    <Badge variant="secondary">
                      {analytics?.features.submissions.total || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Beta user acquisition and retention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Users</span>
                    <span className="text-sm text-green-600 font-medium">
                      +{analytics?.user.new || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Retention Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {analytics?.user.retention.toFixed(1) || 0}%
                    </span>
                  </div>
                  <Progress value={analytics?.user.retention || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>User engagement and activity levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="text-sm font-medium">
                      {analytics?.user.active || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement</span>
                    <span className={`text-sm font-medium ${getScoreColor(analytics?.engagement.engagementScore || 0)}`}>
                      {analytics?.engagement.engagementScore || 0}/100
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Feedback</CardTitle>
                <CardDescription>Beta user satisfaction and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Feedback</span>
                    <span className="text-sm font-medium">
                      {analytics?.feedback.total || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Satisfaction</span>
                    <span className={`text-sm font-medium ${getScoreColor((analytics?.feedback.satisfaction || 0) * 20)}`}>
                      {analytics?.feedback.satisfaction.toFixed(1) || 0}/5.0
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contest Metrics</CardTitle>
                <CardDescription>Contest creation and completion statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Created</span>
                    <Badge variant="secondary">
                      {analytics?.features.contests.created || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed</span>
                    <Badge variant="default">
                      {analytics?.features.contests.completed || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <Badge variant={analytics?.features.contests.completionRate > 70 ? "default" : "destructive"}>
                      {analytics?.features.contests.completionRate.toFixed(1) || 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voting Metrics</CardTitle>
                <CardDescription>Voting participation and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Votes</span>
                    <Badge variant="secondary">
                      {analytics?.features.voting.total || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Participation</span>
                    <Badge variant="default">
                      {analytics?.features.voting.participation.toFixed(1) || 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg per Contest</span>
                    <Badge variant="outline">
                      {analytics?.features.voting.averagePerContest.toFixed(1) || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Overview</CardTitle>
              <CardDescription>User feedback and satisfaction metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {analytics?.feedback.total || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Feedback</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor((analytics?.feedback.satisfaction || 0) * 20)}`}>
                    {analytics?.feedback.satisfaction.toFixed(1) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Satisfaction Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((analytics?.feedback.satisfaction || 0) * 20)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Actionable insights to improve beta testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <h4 className="font-medium">{rec.category}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.issue}</p>
                        <p className="text-sm">{rec.recommendation}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Current</div>
                        <div className="font-medium">{rec.metrics.current}</div>
                        <div className="text-sm text-muted-foreground">Target</div>
                        <div className="font-medium">{rec.metrics.target}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
