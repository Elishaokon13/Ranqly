import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProposalCard } from '@/components/proposal-card'
import { CreateProposalModal } from '@/components/create-proposal-modal'
import { VotingPowerCard } from '@/components/voting-power-card'
import { TreasuryCard } from '@/components/treasury-card'
import { GovernanceStats } from '@/components/governance-stats'
import { ProposalFilters } from '@/components/proposal-filters'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/empty-state'
import { 
  Vote, 
  Plus, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertCircle,
  BarChart3,
  Settings
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { governanceService } from '@/services/governance-service'
import { cn, formatNumber, formatDate, formatRelativeTime } from '@/lib/utils'

export default function GovernancePage() {
  const { address, isConnected, authenticate } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    sort: 'newest',
  })

  // Fetch governance data
  const { data: governanceData, isLoading: governanceLoading } = useQuery({
    queryKey: ['governance-data'],
    queryFn: governanceService.getGovernanceData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch proposals
  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals', filters],
    queryFn: () => governanceService.getProposals(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Fetch user's governance info
  const { data: userGovernance } = useQuery({
    queryKey: ['user-governance', address],
    queryFn: () => governanceService.getUserGovernanceInfo(address!),
    enabled: !!address && isConnected,
  })

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: governanceService.createProposal,
    onSuccess: (data) => {
      toast({
        title: 'Proposal Created',
        description: 'Your proposal has been created successfully.',
      })
      setCreateModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['governance-data'] })
    },
    onError: (error) => {
      toast({
        title: 'Proposal Creation Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Vote on proposal mutation
  const voteMutation = useMutation({
    mutationFn: governanceService.voteOnProposal,
    onSuccess: (data) => {
      toast({
        title: 'Vote Cast',
        description: 'Your vote has been cast successfully.',
      })
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['user-governance', address] })
    },
    onError: (error) => {
      toast({
        title: 'Vote Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleCreateProposal = async (proposalData: any) => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a proposal.',
        variant: 'destructive',
      })
      return
    }

    try {
      await authenticate()
      createProposalMutation.mutate({
        ...proposalData,
        proposerAddress: address,
      })
    } catch (error) {
      toast({
        title: 'Authentication Failed',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleVote = async (proposalId: string, voteType: 'for' | 'against') => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to vote.',
        variant: 'destructive',
      })
      return
    }

    try {
      await authenticate()
      voteMutation.mutate({
        proposalId,
        voterAddress: address,
        voteType,
        votingPower: userGovernance?.votingPower || 1,
      })
    } catch (error) {
      toast({
        title: 'Authentication Failed',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'passed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'executed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (governanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Governance</h1>
          <p className="text-muted-foreground">
            Participate in decentralized governance of the Ranqly platform
          </p>
        </div>
        
        {isConnected && userGovernance && userGovernance.canPropose && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Proposal
          </Button>
        )}
      </div>

      {/* Governance Overview */}
      {governanceData && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(governanceData.totalProposals)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(governanceData.activeProposals)} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(governanceData.totalVoters)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(governanceData.participationRate * 100)}% participation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(governanceData.treasuryBalance)} ETH</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(governanceData.totalSpent)} ETH spent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quorum Threshold</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(governanceData.quorumThreshold * 100)}%</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(governanceData.currentQuorum * 100)}% current
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Governance Info */}
      {isConnected && userGovernance && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <VotingPowerCard userGovernance={userGovernance} />
          <TreasuryCard treasuryData={governanceData?.treasury} />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="proposals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-4">
          {/* Proposal Filters */}
          <ProposalFilters filters={filters} onFiltersChange={setFilters} />

          {/* Proposals List */}
          {proposalsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
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
          ) : proposals && proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  userVote={proposal.userVote}
                  canVote={userGovernance?.canVote || false}
                  onVote={(voteType) => handleVote(proposal.id, voteType)}
                  isVoting={voteMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Vote}
              title="No Proposals Found"
              description="No proposals match your current filters."
              action={
                isConnected && userGovernance?.canPropose ? (
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Proposal
                  </Button>
                ) : undefined
              }
            />
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <GovernanceStats />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Governance Settings</span>
              </CardTitle>
              <CardDescription>
                Configure governance parameters and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quorum Threshold</label>
                    <div className="flex items-center space-x-2">
                      <Progress value={governanceData?.quorumThreshold * 100 || 0} className="flex-1" />
                      <span className="text-sm text-muted-foreground">
                        {formatNumber((governanceData?.quorumThreshold || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Voting Period</label>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {governanceData?.votingPeriod || 7} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Proposal Threshold</label>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatNumber(governanceData?.proposalThreshold || 0)} ETH required
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Proposal Modal */}
      {createModalOpen && (
        <CreateProposalModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSubmit={handleCreateProposal}
          isLoading={createProposalMutation.isPending}
          userGovernance={userGovernance}
        />
      )}
    </div>
  )
}
