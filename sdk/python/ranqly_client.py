"""
Ranqly Python SDK
Provides easy integration with the Ranqly platform
"""

import requests
import json
import hashlib
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from web3 import Web3


@dataclass
class RanqlyConfig:
    """Configuration for Ranqly client"""
    api_key: Optional[str] = None
    base_url: str = "http://localhost:8000"
    network: str = "hardhat"
    provider_url: Optional[str] = None
    private_key: Optional[str] = None
    contracts: Optional[Dict[str, str]] = None


class RanqlyError(Exception):
    """Custom exception for Ranqly API errors"""
    
    def __init__(self, message: str, status_code: int = 0, data: Any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.data = data


class RanqlyClient:
    """Main Ranqly client class"""
    
    def __init__(self, config: RanqlyConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {config.api_key}' if config.api_key else None
        })
        
        # Initialize Web3 if provider is provided
        self.web3 = None
        self.account = None
        if config.provider_url:
            self.web3 = Web3(Web3.HTTPProvider(config.provider_url))
            if config.private_key:
                self.account = self.web3.eth.account.from_key(config.private_key)
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request to Ranqly API"""
        url = f"{self.config.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=data)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    raise RanqlyError(
                        error_data.get('error', {}).get('message', str(e)),
                        e.response.status_code,
                        error_data
                    )
                except (ValueError, KeyError):
                    raise RanqlyError(str(e), e.response.status_code)
            else:
                raise RanqlyError(f"Network error: {str(e)}")
    
    # Contest Management
    
    def create_contest(self, contest_data: Dict) -> Dict:
        """Create a new contest"""
        return self._make_request('POST', '/api/v1/contests', contest_data)
    
    def get_contest(self, contest_id: str) -> Dict:
        """Get contest details"""
        return self._make_request('GET', f'/api/v1/contests/{contest_id}')
    
    def list_contests(self, **params) -> Dict:
        """List contests with optional filters"""
        return self._make_request('GET', '/api/v1/contests', params)
    
    # Content Submission
    
    def submit_content(self, contest_id: str, submission_data: Dict) -> Dict:
        """Submit content to a contest"""
        return self._make_request('POST', f'/api/v1/contests/{contest_id}/submissions', submission_data)
    
    def get_submission(self, submission_id: str) -> Dict:
        """Get submission details"""
        return self._make_request('GET', f'/api/v1/submissions/{submission_id}')
    
    def list_contest_submissions(self, contest_id: str) -> Dict:
        """List submissions for a contest"""
        return self._make_request('GET', f'/api/v1/contests/{contest_id}/submissions')
    
    # Content Analysis
    
    def analyze_content(self, analysis_data: Dict) -> Dict:
        """Analyze content quality"""
        return self._make_request('POST', '/api/v1/analyze', analysis_data)
    
    def get_four_axis_score(self, content_data: Dict) -> Dict:
        """Get four-axis algorithmic score"""
        return self._make_request('POST', '/api/v1/four-axis-score', content_data)
    
    # PoI NFT Management
    
    def check_poi_status(self, address: str) -> Dict:
        """Check PoI NFT status for an address"""
        return self._make_request('GET', f'/api/v1/poi/status/{address}')
    
    def mint_poi(self, mint_data: Dict) -> Dict:
        """Mint PoI NFT"""
        return self._make_request('POST', '/api/v1/poi/mint', mint_data)
    
    # Voting System
    
    def create_voting_session(self, session_data: Dict) -> Dict:
        """Create a voting session"""
        return self._make_request('POST', '/api/v1/voting/session/create', session_data)
    
    def commit_vote(self, commit_data: Dict) -> Dict:
        """Commit votes"""
        return self._make_request('POST', '/api/v1/voting/commit-enhanced', commit_data)
    
    def reveal_vote(self, reveal_data: Dict) -> Dict:
        """Reveal votes"""
        return self._make_request('POST', '/api/v1/voting/reveal-enhanced', reveal_data)
    
    def get_voting_results(self, contest_id: str) -> Dict:
        """Get voting results"""
        return self._make_request('GET', f'/api/v1/voting/{contest_id}/results-enhanced')
    
    def get_voting_statistics(self, contest_id: str) -> Dict:
        """Get voting statistics"""
        return self._make_request('GET', f'/api/v1/voting/{contest_id}/statistics')
    
    # Anonymous Judging
    
    def create_judging_session(self, session_data: Dict) -> Dict:
        """Create a judging session"""
        return self._make_request('POST', '/api/v1/judge/session/create', session_data)
    
    def get_judging_entries(self, session_id: str, judge_id: str) -> Dict:
        """Get randomized entries for a judge"""
        return self._make_request('GET', f'/api/v1/judge/session/{session_id}/entries/{judge_id}')
    
    def submit_judge_ballot(self, ballot_data: Dict) -> Dict:
        """Submit judge ballot"""
        return self._make_request('POST', '/api/v1/judge/ballot/submit', ballot_data)
    
    def get_judging_results(self, session_id: str) -> Dict:
        """Get judging results"""
        return self._make_request('GET', f'/api/v1/judge/session/{session_id}/results')
    
    def get_judge_rationales(self, session_id: str) -> Dict:
        """Get anonymized judge rationales"""
        return self._make_request('GET', f'/api/v1/judge/session/{session_id}/rationales')
    
    # Dispute System
    
    def file_dispute(self, dispute_data: Dict) -> Dict:
        """File a dispute"""
        return self._make_request('POST', '/api/v1/dispute/file', dispute_data)
    
    def submit_nomination(self, nomination_data: Dict) -> Dict:
        """Submit a nomination"""
        return self._make_request('POST', '/api/v1/nomination/submit', nomination_data)
    
    def get_contest_disputes(self, contest_id: str) -> Dict:
        """Get disputes for a contest"""
        return self._make_request('GET', f'/api/v1/dispute/contest/{contest_id}')
    
    def get_contest_nominations(self, contest_id: str) -> Dict:
        """Get nominations for a contest"""
        return self._make_request('GET', f'/api/v1/nomination/contest/{contest_id}')
    
    def get_dispute_details(self, dispute_id: str) -> Dict:
        """Get dispute details"""
        return self._make_request('GET', f'/api/v1/dispute/{dispute_id}')
    
    # Content Caching
    
    def submit_content_for_caching(self, cache_data: Dict) -> Dict:
        """Submit content for caching"""
        return self._make_request('POST', '/api/v1/content/submit', cache_data)
    
    def get_cached_content(self, content_hash: str) -> Dict:
        """Get cached content"""
        return self._make_request('GET', f'/api/v1/content/{content_hash}')
    
    def verify_content(self, content_hash: str, content_data: str) -> Dict:
        """Verify content integrity"""
        return self._make_request('POST', '/api/v1/content/verify', {
            'contentHash': content_hash,
            'contentData': content_data
        })
    
    # Smart Contract Interactions
    
    def mint_poi_nft(self, user_address: str, signature: str, nonce: int) -> Dict:
        """Mint PoI NFT via smart contract"""
        if not self.web3 or not self.account:
            raise RanqlyError("Web3 provider and account required for smart contract interactions")
        
        # This would require the contract ABI and address
        # Implementation depends on specific contract setup
        raise NotImplementedError("Smart contract interactions not implemented yet")
    
    def check_poi_nft_balance(self, address: str) -> Dict:
        """Check PoI NFT balance via smart contract"""
        if not self.web3:
            raise RanqlyError("Web3 provider required for smart contract interactions")
        
        # This would require the contract ABI and address
        # Implementation depends on specific contract setup
        raise NotImplementedError("Smart contract interactions not implemented yet")
    
    # Utility Functions
    
    def generate_vote_commitment(self, vote_data: Dict) -> str:
        """Generate vote commitment hash"""
        data_to_hash = json.dumps({
            'votes': vote_data['votes'],
            'nonce': vote_data['nonce'],
            'timestamp': vote_data['timestamp']
        }, sort_keys=True)
        
        return hashlib.sha256(data_to_hash.encode()).hexdigest()
    
    def generate_signature(self, message: str) -> str:
        """Generate signature for a message"""
        if not self.account:
            raise RanqlyError("Account required for signature generation")
        
        message_hash = self.web3.keccak(text=message)
        signed_message = self.account.sign_message_hash(message_hash)
        return signed_message.signature.hex()
    
    def wait_for_transaction(self, tx_hash: str, timeout: int = 300) -> Dict:
        """Wait for transaction confirmation"""
        if not self.web3:
            raise RanqlyError("Web3 provider required for transaction waiting")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                receipt = self.web3.eth.get_transaction_receipt(tx_hash)
                if receipt:
                    return receipt
            except:
                pass
            time.sleep(1)
        
        raise RanqlyError(f"Transaction {tx_hash} not confirmed within {timeout} seconds")
    
    # Health and Status
    
    def health_check(self) -> Dict:
        """Check API health"""
        return self._make_request('GET', '/health')
    
    def get_service_status(self) -> Dict:
        """Get status of all services"""
        services = [
            'api-gateway',
            'algo-engine', 
            'voting-engine',
            'judge-service',
            'dispute-service',
            'content-crawler'
        ]
        
        status = {}
        for service in services:
            try:
                # This would check each service's health endpoint
                # Implementation depends on service architecture
                status[service] = {'status': 'unknown'}
            except:
                status[service] = {'status': 'unavailable'}
        
        return status


# Factory function
def create_ranqly_client(
    api_key: Optional[str] = None,
    base_url: str = "http://localhost:8000",
    network: str = "hardhat",
    provider_url: Optional[str] = None,
    private_key: Optional[str] = None,
    contracts: Optional[Dict[str, str]] = None
) -> RanqlyClient:
    """Create a new Ranqly client instance"""
    config = RanqlyConfig(
        api_key=api_key,
        base_url=base_url,
        network=network,
        provider_url=provider_url,
        private_key=private_key,
        contracts=contracts
    )
    return RanqlyClient(config)


# Convenience functions for common operations

def quick_create_contest(
    client: RanqlyClient,
    title: str,
    description: str,
    reward_amount: str,
    **kwargs
) -> Dict:
    """Quickly create a contest with minimal parameters"""
    contest_data = {
        'title': title,
        'description': description,
        'rewardAmount': reward_amount,
        'rewardToken': kwargs.get('reward_token', 'ETH'),
        'submissionDeadline': kwargs.get('submission_deadline'),
        'votingDeadline': kwargs.get('voting_deadline'),
        'judgingDeadline': kwargs.get('judging_deadline'),
        'scoringWeights': kwargs.get('scoring_weights', {
            'algorithm': 0.4,
            'community': 0.3,
            'judges': 0.3
        })
    }
    return client.create_contest(contest_data)


def quick_submit_content(
    client: RanqlyClient,
    contest_id: str,
    title: str,
    content_url: str,
    submitter_address: str
) -> Dict:
    """Quickly submit content with minimal parameters"""
    submission_data = {
        'title': title,
        'contentReferences': [{
            'url': content_url,
            'type': 'url'
        }],
        'submitterAddress': submitter_address,
        'metadata': {
            'contentType': 'blog'
        }
    }
    return client.submit_content(contest_id, submission_data)


# Export main classes and functions
__all__ = [
    'RanqlyClient',
    'RanqlyConfig', 
    'RanqlyError',
    'create_ranqly_client',
    'quick_create_contest',
    'quick_submit_content'
]
