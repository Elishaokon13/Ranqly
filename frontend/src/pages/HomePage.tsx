import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trophy, Users, Clock, Award, TrendingUp } from 'lucide-react';
import ContestCard from '../components/ContestCard';
import { Button } from '../components/ui/button';

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
  organizer_address: string;
}

interface PlatformStats {
  total_contests: number;
  active_contests: number;
  total_users: number;
  total_rewards: string;
}

const HomePage: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContests();
    fetchStats();
  }, []);

  const fetchContests = async () => {
    try {
      const response = await fetch('/api/v1/contests?limit=6');
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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/analytics/overview');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      // Stats are optional, don't set error
    }
  };

  if (loading) {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Welcome to Ranqly
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              The Web3-native platform for fair, transparent, and auditable content contests.
              Join contests, showcase your skills, and earn rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/contests">
                  <Trophy className="mr-2 h-5 w-5" />
                  Browse Contests
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/contests/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Contest
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      {stats && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stats.total_contests}
                </div>
                <div className="text-sm text-muted-foreground">Total Contests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stats.active_contests}
                </div>
                <div className="text-sm text-muted-foreground">Active Contests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stats.total_users}
                </div>
                <div className="text-sm text-muted-foreground">Community Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {parseFloat(stats.total_rewards).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">ETH Rewarded</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Contests */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Featured Contests</h2>
            <Button asChild variant="outline">
              <Link to="/contests">View All</Link>
            </Button>
          </div>
          
          {error ? (
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
                No contests available at the moment.
              </div>
              <Button asChild>
                <Link to="/contests/create">Create the First Contest</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contests.map((contest) => (
                <ContestCard key={contest.id} contest={contest} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              How Ranqly Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Create or Join</h3>
                <p className="text-muted-foreground">
                  Create your own contest with custom rules and rewards, or join existing contests.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Participate</h3>
            <p className="text-muted-foreground">
                  Submit your content, vote on submissions, or judge entries anonymously.
            </p>
          </div>
          
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Win Rewards</h3>
            <p className="text-muted-foreground">
                  Earn rewards based on algorithmic scoring, community votes, and expert judging.
            </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Why Choose Ranqly?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Fair Scoring</h3>
                  <p className="text-muted-foreground">
                    Hybrid scoring system combines algorithmic analysis, community voting, and expert judging.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 rounded-lg p-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Commit-Reveal Voting</h3>
                  <p className="text-muted-foreground">
                    Secure voting mechanism prevents manipulation and ensures transparent results.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 rounded-lg p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Sybil Protection</h3>
                  <p className="text-muted-foreground">
                    Advanced detection prevents fake accounts and ensures genuine community participation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 rounded-lg p-3">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Web3 Native</h3>
                  <p className="text-muted-foreground">
                    Built on blockchain with PoI NFTs for voting rights and transparent reward distribution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join the community and start participating in contests today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/contests">
                  <Trophy className="mr-2 h-5 w-5" />
                  Browse Contests
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contests/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Contest
                </Link>
              </Button>
            </div>
        </div>
      </div>
      </section>
    </div>
  );
};

export default HomePage;