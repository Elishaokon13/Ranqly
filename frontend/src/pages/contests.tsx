import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { ContestCard } from '@/components/contest-card'
import { CreateContestButton } from '@/components/create-contest-button'
import { Search, Filter, Plus, Trophy, Users, Clock, TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { contestService } from '@/services/contest-service'
import { cn, formatDate, formatRelativeTime, formatNumber } from '@/lib/utils'

export default function ContestsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const { isConnected } = useAuth()

  // Fetch contests
  const { data: contests, isLoading, error } = useQuery({
    queryKey: ['contests', { search: searchTerm, status: statusFilter, category: categoryFilter, sort: sortBy }],
    queryFn: () => contestService.getContests({
      search: searchTerm,
      status: statusFilter,
      category: categoryFilter,
      sort: sortBy,
      limit: 20,
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch contest statistics
  const { data: stats } = useQuery({
    queryKey: ['contest-stats'],
    queryFn: contestService.getContestStats,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  const contestStatuses = [
    { value: 'all', label: 'All Contests' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'active', label: 'Active' },
    { value: 'voting', label: 'Voting' },
    { value: 'judging', label: 'Judging' },
    { value: 'completed', label: 'Completed' },
  ]

  const contestCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'blog', label: 'Blog Posts' },
    { value: 'video', label: 'Videos' },
    { value: 'design', label: 'Designs' },
    { value: 'code', label: 'Code Projects' },
    { value: 'research', label: 'Research' },
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'prize', label: 'Highest Prize' },
    { value: 'deadline', label: 'Deadline Soon' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'voting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'judging':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Failed to load contests</h3>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contests</h1>
          <p className="text-muted-foreground">
            Discover and participate in Web3 content contests
          </p>
        </div>
        
        {isConnected && (
          <CreateContestButton>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Contest
            </Button>
          </CreateContestButton>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contests</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
              <p className="text-xs text-muted-foreground">
                +{formatNumber(stats.totalThisMonth)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.active)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(stats.voting)} in voting phase
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.participants)}</div>
              <p className="text-xs text-muted-foreground">
                +{formatNumber(stats.newParticipants)} new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prize Pool</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalPrize)} ETH</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(stats.averagePrize)} ETH average
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {contestStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {contestCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contests List */}
      <Tabs defaultValue="grid" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          {contests && (
            <p className="text-sm text-muted-foreground">
              {contests.length} contest{contests.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        <TabsContent value="grid" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : contests && contests.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {contests.map((contest) => (
                <ContestCard key={contest.id} contest={contest} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Trophy}
              title="No contests found"
              description="Try adjusting your search criteria or create a new contest."
              action={isConnected ? (
                <CreateContestButton>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Contest
                  </Button>
                </CreateContestButton>
              ) : undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : contests && contests.length > 0 ? (
            <div className="space-y-4">
              {contests.map((contest) => (
                <Card key={contest.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{contest.title}</h3>
                          <Badge className={cn(getStatusColor(contest.status))}>
                            {contest.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {contest.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Trophy className="mr-1 h-3 w-3" />
                            {formatNumber(contest.prize)} ETH
                          </span>
                          <span className="flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            {formatNumber(contest.participants)} participants
                          </span>
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatRelativeTime(contest.deadline)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link to={`/contests/${contest.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Trophy}
              title="No contests found"
              description="Try adjusting your search criteria or create a new contest."
              action={isConnected ? (
                <CreateContestButton>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Contest
                  </Button>
                </CreateContestButton>
              ) : undefined}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
