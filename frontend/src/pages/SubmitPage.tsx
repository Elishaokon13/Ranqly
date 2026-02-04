import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const SubmitPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/contests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contests
          </Link>
        </Button>
        
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Submit Entry</h1>
          <div className="bg-card border rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Submission Form Coming Soon
            </h2>
            <p className="text-muted-foreground mb-6">
              This feature is currently under development. You'll be able to submit entries soon!
            </p>
            <Button asChild>
              <Link to="/contests">Browse Contests</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitPage;
