import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Clock, 
  Calendar,
  ExternalLink,
  Award,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface Contest {
  id: string;
  title: string;
  description: string;
  reward_amount: string;
  reward_token: string;
  status: string;
  submission_count: number;
  created_at: string;
  submission_deadline: string;
  voting_deadline: string;
  judging_deadline: string;
  organizer_address: string;
  rules: string[];
}

interface Submission {
  id: string;
  title: string;
  description: string;
  submitter_address: string;
  content_url: string;
  content_type: string;
  algorithmic_score: number;
  community_score: number;
  judge_score: number;
  final_score: number;
  status: string;
  created_at: string;
}

const ContestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchContestDetails();
    }
  }, [id]);

  const fetchContestDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch contest details
      const contestResponse = await fetch(`/api/v1/contests/${id}`);
      const contestData = await contestResponse.json();
      
      if (contestData.success) {
        setContest(contestData.data);
        
        // Fetch submissions
        const submissionsResponse = await fetch(`/api/v1/contests/${id}/submissions`);
        const submissionsData = await submissionsResponse.json();
        
        if (submissionsData.success) {
          setSubmissions(submissionsData.data);
        }
      } else {
        setError('Contest not found');
      }
    } catch (err) {
      setError('Failed to fetch contest details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'announced':
        return 'bg-blue-100 text-blue-800';
      case 'submissions_open':
        return 'bg-green-100 text-green-800';
      case 'voting_open':
        return 'bg-purple-100 text-purple-800';
      case 'judging':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    
    if (diffTime < 0) {
      return 'Ended';
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '1 day left';
    } else if (diffDays < 7) {
      return `${diffDays} days left`;
    } else {
      const diffWeeks = Math.ceil(diffDays / 7);
      return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} left`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Contest Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The contest you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/contests">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Contests
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/contests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contests
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Contest Header */}
            <div className="bg-card border rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {contest.title}
                  </h1>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={getStatusColor(contest.status)}>
                      {contest.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{contest.submission_count} submissions</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {parseFloat(contest.reward_amount).toFixed(2)} {contest.reward_token}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Reward</div>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                {contest.description}
              </p>

              {/* Contest Rules */}
              {contest.rules && contest.rules.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Contest Rules</h3>
                  <ul className="space-y-2">
                    {contest.rules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {contest.status === 'submissions_open' && (
                  <Button asChild>
                    <Link to={`/contests/${contest.id}/submit`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Submit Entry
                    </Link>
                  </Button>
                )}
                {contest.status === 'voting_open' && (
                  <Button asChild>
                    <Link to={`/contests/${contest.id}/vote`}>
                      <Award className="mr-2 h-4 w-4" />
                      Vote Now
                    </Link>
                  </Button>
                )}
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Discuss
                </Button>
              </div>
            </div>

            {/* Submissions */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Submissions ({submissions.length})
              </h2>
              
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">
                    No submissions yet. Be the first to submit!
                  </div>
                  {contest.status === 'submissions_open' && (
                    <Button asChild>
                      <Link to={`/contests/${contest.id}/submit`}>
                        Submit Entry
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {submission.title}
                        </h3>
                        <Badge variant="outline">
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {submission.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>By: {submission.submitter_address.substring(0, 6)}...{submission.submitter_address.substring(-4)}</span>
                          <span>{formatDate(submission.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Submissions</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(contest.submission_deadline)}
                    </div>
                    <div className="text-xs text-green-600">
                      {getTimeRemaining(contest.submission_deadline)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Voting</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(contest.voting_deadline)}
                    </div>
                    <div className="text-xs text-purple-600">
                      {getTimeRemaining(contest.voting_deadline)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Judging</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(contest.judging_deadline)}
                    </div>
                    <div className="text-xs text-orange-600">
                      {getTimeRemaining(contest.judging_deadline)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organizer */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Organizer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Contest Organizer</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {contest.organizer_address.substring(0, 6)}...{contest.organizer_address.substring(-4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestDetailsPage;
