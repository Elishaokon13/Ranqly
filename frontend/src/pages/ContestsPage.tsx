import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, Search, Trophy, Users, Clock } from 'lucide-react';
import ContestCard from '../components/ContestCard';
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
}

interface ContestFilters {
  status: string;
  search: string;
  sort: string;
}

const ContestsPage: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ContestFilters>({
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest'
  });

  useEffect(() => {
    fetchContests();
  }, [filters]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('sort', filters.sort);
      params.append('limit', '20');

      const response = await fetch(`/api/v1/contests?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setContests(data.data);
      } else {
        setError('Failed to fetch contests');
      }
    } catch (err) {
      setError('Failed to fetch contests');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ContestFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'announced', label: 'Announced' },
    { value: 'submissions_open', label: 'Submissions Open' },
    { value: 'voting_open', label: 'Voting Open' },
    { value: 'judging', label: 'Judging' },
    { value: 'completed', label: 'Completed' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'reward_high', label: 'Highest Reward' },
    { value: 'reward_low', label: 'Lowest Reward' },
    { value: 'deadline', label: 'Deadline Soon' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Contests</h1>
            <p className="text-muted-foreground">
              Discover and participate in community contests
            </p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link to="/contests/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Contest
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search contests..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-foreground placeholder-muted-foreground"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="md:w-48">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              Failed to load contests. Please try again later.
            </div>
            <Button onClick={fetchContests}>Retry</Button>
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-muted-foreground mb-4">
              No contests found matching your criteria.
            </div>
            <Button asChild>
              <Link to="/contests/create">Create a Contest</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-muted-foreground">
                Showing {contests.length} contest{contests.length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                {filters.status && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    {statusOptions.find(opt => opt.value === filters.status)?.label}
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    "{filters.search}"
                  </Badge>
                )}
              </div>
            </div>

            {/* Contest Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contests.map((contest) => (
                <ContestCard key={contest.id} contest={contest} />
              ))}
            </div>

            {/* Load More */}
            {contests.length >= 20 && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={fetchContests}>
                  Load More Contests
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;
