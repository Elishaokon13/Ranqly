import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Trophy, Calendar, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

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
}

interface ContestCardProps {
  contest: Contest;
  showActions?: boolean;
}

const ContestCard: React.FC<ContestCardProps> = ({ contest, showActions = true }) => {
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

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'announced':
        return 'Announced';
      case 'submissions_open':
        return 'Submissions Open';
      case 'voting_open':
        return 'Voting Open';
      case 'judging':
        return 'Judging';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  const getCurrentPhase = () => {
    const now = new Date();
    const submissionDeadline = new Date(contest.submission_deadline);
    const votingDeadline = new Date(contest.voting_deadline);
    const judgingDeadline = new Date(contest.judging_deadline);

    if (now < submissionDeadline) {
      return {
        phase: 'Submissions',
        deadline: contest.submission_deadline,
        color: 'text-green-600'
      };
    } else if (now < votingDeadline) {
      return {
        phase: 'Voting',
        deadline: contest.voting_deadline,
        color: 'text-purple-600'
      };
    } else if (now < judgingDeadline) {
      return {
        phase: 'Judging',
        deadline: contest.judging_deadline,
        color: 'text-orange-600'
      };
    } else {
      return {
        phase: 'Completed',
        deadline: contest.judging_deadline,
        color: 'text-gray-600'
      };
    }
  };

  const currentPhase = getCurrentPhase();

  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
            {contest.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getStatusColor(contest.status)}>
              {getStatusText(contest.status)}
            </Badge>
            <span className={`text-sm font-medium ${currentPhase.color}`}>
              {currentPhase.phase}
            </span>
          </div>
        </div>
        <Trophy className="h-6 w-6 text-yellow-500 flex-shrink-0" />
      </div>

      {/* Description */}
      <p className="text-muted-foreground mb-4 line-clamp-3">
        {contest.description}
      </p>

      {/* Reward */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-full p-2">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">
              {parseFloat(contest.reward_amount).toFixed(2)} {contest.reward_token}
            </div>
            <div className="text-xs text-muted-foreground">Total Reward</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {contest.submission_count} submission{contest.submission_count !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDate(contest.created_at)}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Timeline</span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Submissions:</span>
            <span>{getTimeRemaining(contest.submission_deadline)}</span>
          </div>
          <div className="flex justify-between">
            <span>Voting:</span>
            <span>{getTimeRemaining(contest.voting_deadline)}</span>
          </div>
          <div className="flex justify-between">
            <span>Judging:</span>
            <span>{getTimeRemaining(contest.judging_deadline)}</span>
          </div>
        </div>
      </div>

      {/* Organizer */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1">Organizer</div>
        <div className="text-sm font-mono text-foreground">
          {contest.organizer_address.substring(0, 6)}...{contest.organizer_address.substring(contest.organizer_address.length - 4)}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to={`/contests/${contest.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </Button>
          {contest.status === 'submissions_open' && (
            <Button asChild variant="outline">
              <Link to={`/contests/${contest.id}/submit`}>
                Submit
              </Link>
            </Button>
          )}
          {contest.status === 'voting_open' && (
            <Button asChild variant="outline">
              <Link to={`/contests/${contest.id}/vote`}>
                Vote
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ContestCard;