import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VoteCard } from '@/components/vote-card'
import { VoteModal } from '@/components/vote-modal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/empty-state'
import { VoteHistory } from '@/components/vote-history'
import { VotingStats } from '@/components/voting-stats'
import { 
  Clock, 
  Users, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Eye, 
  Vote as VoteIcon,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { votingService } from '@/services/voting-service'
import { contestService } from '@/services/contest-service'
import { cn, formatRelativeTime, formatNumber, formatDate } from '@/lib/utils'

export default function VotingPage() {
  const { contestId } = useParams<{ contestId: string }>()
  const navigate = useNavigate()
  const { address, isConnected, authenticate } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [voteModalOpen, setVoteModalOpen] = useState(false)

  // Fetch contest details
  const { data: contest, isLoading: contestLoading, error: contestError } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestService.getContest(contestId!),
    enabled: !!contestId,
  })

  // Fetch voting session
  const { data: votingSession, isLoading: sessionLoading } = useQuery({
    queryKey: ['voting-session', contestId],
    queryFn: () => votingService.getVotingSession(contestId!),
    enabled: !!contestId,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch submissions
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['contest-submissions', contestId],
    queryFn: () => contestService.getContestSubmissions(contestId!),
    enabled: !!contestId,
  })

  // Fetch voting results
  const { data: votingResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['voting-results', contestId],
    queryFn: () => votingService.getVotingResults(contestId!),
    enabled: !!contestId && votingSession?.phase === 'reveal',
    refetchInterval: 10000, // Refetch every 10 seconds during reveal phase
  })

  // Fetch user's voting power
  const { data: votingPower } = useQuery({
    queryKey: ['voting-power', address],
    queryFn: () => votingService.getVotingPower(address!),
    enabled: !!address && isConnected,
  })

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: votingService.castVote,
    onSuccess: (data) => {
      toast({
        title: 'Vote Cast Successfully',
        description: data.message,
      })
      setVoteModalOpen(false)
      setSelectedSubmission(null)
      queryClient.invalidateQueries({ queryKey: ['voting-session', contestId] })
      queryClient.invalidateQueries({ queryKey: ['voting-results', contestId] })
    },
    onError: (error) => {
      toast({
        title: 'Vote Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Handle vote submission
  const handleVote = async (submissionId: string, voteValue: number, justification: string) => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to vote.',
        variant: 'destructive',
      })
      return
    }

    if (!votingPower || votingPower.remainingVotes <= 0) {
      toast({
        title: 'No Voting Power',
        description: 'You have no remaining votes for this contest.',
        variant: 'destructive',
      })
      return
    }

    try {
      await authenticate()
      
      voteMutation.mutate({
        contestId: contestId!,
        submissionId,
        voteValue,
        justification,
        voterAddress: address,
      })
    } catch (error) {
      toast({
        title: 'Authentication Failed',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Get phase information
  const getPhaseInfo = () => {
    if (!votingSession) return null

    const now = Date.now()
    const phases = [
      {
        name: 'Commit',
        start: votingSession.createdAt,
        end: votingSession.commitEndTime,
        current: votingSession.phase === 'commit',
        completed: now > votingSession.commitEndTime,
      },
      {
        name: 'Reveal',
        start: votingSession.commitEndTime,
        end: votingSession.revealEndTime,
        current: votingSession.phase === 'reveal',
        completed: now > votingSession.revealEndTime,
      },
    ]

    return phases
  }

  const phaseInfo = getPhaseInfo()

  if (contestLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (contestError || !contest || !votingSession) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Contest Not Found</h3>
          <p className="text-muted-foreground mt-2">
            The contest or voting session you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/contests')} className="mt-4">
            Back to Contests
          </Button>
        </div>
      </div>
    )
  }

  const canVote = isConnected && 
    votingSession.phase === 'commit' && 
    votingPower && 
    votingPower.remainingVotes > 0

  const canReveal = isConnected && 
    votingSession.phase === 'reveal' && 
    votingPower && 
    votingPower.committedVotes > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{contest.title}</h1>
            <p className="text-muted-foreground mt-2">{contest.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={votingSession.phase === 'commit' ? 'default' : 'secondary'}>
              {votingSession.phase === 'commit' ? 'Commit Phase' : 'Reveal Phase'}
            </Badge>
          </div>
        </div>

        {/* Voting Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <VoteIcon className="h-5 w-5" />
              <span>Voting Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Total Commits</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(votingSession.totalCommits)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>Total Reveals</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(votingSession.totalReveals)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Time Remaining</span>
                </div>
                <p className="text-2xl font-bold">
                  {votingSession.phase === 'commit' 
                    ? formatRelativeTime(new Date(votingSession.commitEndTime))
                    : formatRelativeTime(new Date(votingSession.revealEndTime))
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase Progress */}
        {phaseInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Voting Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {phaseInfo.map((phase, index) => (
                  <div key={phase.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {phase.completed ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : phase.current ? (
                          <Activity className="h-5 w-5 text-primary animate-pulse" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className={cn(
                          "font-medium",
                          phase.current && "text-primary",
                          phase.completed && "text-success"
                        )}>
                          {phase.name} Phase
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(new Date(phase.start))} - {formatDate(new Date(phase.end))}
                      </div>
                    </div>
                    <Progress 
                      value={phase.completed ? 100 : phase.current ? 50 : 0} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voting Power Info */}
        {isConnected && votingPower && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Your Voting Power: {votingPower.votingPower}</span>
                <span>Remaining Votes: {votingPower.remainingVotes}</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Alert */}
        {!isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to participate in voting.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="results" disabled={votingSession.phase !== 'reveal'}>
            Results
          </TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="history">My Votes</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          {submissionsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : submissions && submissions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {submissions.map((submission) => (
                <VoteCard
                  key={submission.id}
                  submission={submission}
                  canVote={canVote}
                  canReveal={canReveal}
                  votingPhase={votingSession.phase}
                  onVote={() => {
                    setSelectedSubmission(submission.id)
                    setVoteModalOpen(true)
                  }}
                  onReveal={() => {
                    // Handle reveal logic
                    toast({
                      title: 'Reveal Vote',
                      description: 'Vote reveal functionality will be implemented.',
                    })
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={VoteIcon}
              title="No Submissions"
              description="No submissions have been made to this contest yet."
            />
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {resultsLoading ? (
            <LoadingSpinner size="lg" />
          ) : votingResults && votingResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Voting Results</h3>
                <Badge variant="outline">
                  {votingResults.length} submissions
                </Badge>
              </div>
              
              <div className="space-y-2">
                {votingResults.map((result, index) => (
                  <Card key={result.submissionId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">Submission #{result.submissionId}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatNumber(result.upvotes)} upvotes, {formatNumber(result.downvotes)} downvotes
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatNumber(result.netScore)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Net Score
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No Results Yet"
              description="Voting results will be available after the reveal phase."
            />
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <VotingStats contestId={contestId!} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <VoteHistory contestId={contestId!} />
        </TabsContent>
      </Tabs>

      {/* Vote Modal */}
      {selectedSubmission && (
        <VoteModal
          open={voteModalOpen}
          onOpenChange={setVoteModalOpen}
          submissionId={selectedSubmission}
          votingPhase={votingSession.phase}
          onVote={handleVote}
          votingPower={votingPower}
          isLoading={voteMutation.isPending}
        />
      )}
    </div>
  )
}
