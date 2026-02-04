"""
Complete Ranqly Contest Example
Demonstrates the full contest lifecycle using the Python SDK
"""

import asyncio
import time
from datetime import datetime, timedelta
from ranqly_client import create_ranqly_client, quick_create_contest, quick_submit_content


async def run_complete_contest_example():
    """Run a complete contest example"""
    
    # Initialize client
    client = create_ranqly_client(
        api_key="your-api-key-here",
        base_url="http://localhost:8000",
        network="hardhat"
    )
    
    print("🚀 Starting Ranqly Contest Example")
    print("=" * 50)
    
    # Step 1: Create Contest
    print("\n📝 Step 1: Creating Contest")
    contest_data = {
        "title": "Best DeFi Tutorial Contest",
        "description": "Create the most comprehensive DeFi tutorial covering yield farming, liquidity provision, and risk management.",
        "rewardAmount": "2.5",
        "rewardToken": "ETH",
        "submissionDeadline": (datetime.now() + timedelta(days=7)).isoformat(),
        "votingDeadline": (datetime.now() + timedelta(days=14)).isoformat(),
        "judgingDeadline": (datetime.now() + timedelta(days=21)).isoformat(),
        "scoringWeights": {
            "algorithm": 0.4,
            "community": 0.3,
            "judges": 0.3
        },
        "rules": {
            "maxSubmissions": 3,
            "contentTypes": ["blog", "video", "tutorial"],
            "minWordCount": 1000,
            "topics": ["defi", "yield-farming", "liquidity", "risk-management"]
        }
    }
    
    try:
        contest_response = client.create_contest(contest_data)
        contest_id = contest_response["data"]["contestId"]
        print(f"✅ Contest created successfully: {contest_id}")
        print(f"   Title: {contest_response['data']['title']}")
        print(f"   Reward: {contest_response['data']['rewardAmount']} ETH")
        print(f"   Submission Deadline: {contest_response['data']['submissionDeadline']}")
    except Exception as e:
        print(f"❌ Failed to create contest: {e}")
        return
    
    # Step 2: Submit Content
    print("\n📄 Step 2: Submitting Content")
    submissions = [
        {
            "title": "Complete Guide to DeFi Yield Farming",
            "url": "https://example.com/defi-yield-farming-guide",
            "submitter": "0x1234567890123456789012345678901234567890"
        },
        {
            "title": "Liquidity Provision 101: A Beginner's Guide",
            "url": "https://example.com/liquidity-provision-guide", 
            "submitter": "0x2345678901234567890123456789012345678901"
        },
        {
            "title": "Risk Management in DeFi: Strategies and Tools",
            "url": "https://example.com/defi-risk-management",
            "submitter": "0x3456789012345678901234567890123456789012"
        }
    ]
    
    submission_ids = []
    for i, submission in enumerate(submissions):
        try:
            submission_data = {
                "title": submission["title"],
                "contentReferences": [{
                    "url": submission["url"],
                    "type": "url",
                    "title": submission["title"],
                    "description": f"Comprehensive tutorial on {submission['title'].lower()}"
                }],
                "submitterAddress": submission["submitter"],
                "metadata": {
                    "contentType": "blog",
                    "tags": ["defi", "tutorial", "educational"],
                    "estimatedReadTime": "15 minutes"
                }
            }
            
            submission_response = client.submit_content(contest_id, submission_data)
            submission_id = submission_response["data"]["submissionId"]
            submission_ids.append(submission_id)
            print(f"✅ Submission {i+1} created: {submission_id}")
            print(f"   Title: {submission['title']}")
            print(f"   URL: {submission['url']}")
            
        except Exception as e:
            print(f"❌ Failed to submit content {i+1}: {e}")
    
    # Step 3: Content Analysis
    print("\n🔍 Step 3: Analyzing Content")
    for i, submission_id in enumerate(submission_ids):
        try:
            # Get submission details first
            submission = client.get_submission(submission_id)
            
            # Analyze content
            analysis_data = {
                "content": f"Sample content for {submissions[i]['title']}",
                "contentType": "blog",
                "contestId": contest_id,
                "submissionId": submission_id
            }
            
            analysis_response = client.get_four_axis_score(analysis_data)
            scores = analysis_response["analysis_result"]
            
            print(f"✅ Analysis completed for submission {i+1}")
            print(f"   Overall Score: {scores['overall_score']:.2f}")
            print(f"   Algorithm Score: {scores['algo_score']:.1f}")
            print(f"   - Depth: {scores['depth_score']:.1f}")
            print(f"   - Reach: {scores['reach_score']:.1f}")
            print(f"   - Relevance: {scores['relevance_score']:.1f}")
            print(f"   - Consistency: {scores['consistency_score']:.1f}")
            
        except Exception as e:
            print(f"❌ Failed to analyze submission {i+1}: {e}")
    
    # Step 4: Create Voting Session
    print("\n🗳️ Step 4: Creating Voting Session")
    try:
        voting_config = {
            "contestId": contest_id,
            "config": {
                "poiNFTContract": "0x742d35Cc6634C0532925a3b8D5a0F6b2e1E8C1e",
                "entryIds": submission_ids,
                "maxUpvotes": 5,
                "maxDownvotes": 2,
                "commitPhaseStart": (datetime.now() + timedelta(days=7)).isoformat(),
                "commitPhaseEnd": (datetime.now() + timedelta(days=9)).isoformat(),
                "revealPhaseStart": (datetime.now() + timedelta(days=9, hours=1)).isoformat(),
                "revealPhaseEnd": (datetime.now() + timedelta(days=11)).isoformat()
            }
        }
        
        voting_session = client.create_voting_session(voting_config)
        print(f"✅ Voting session created")
        print(f"   Max Upvotes: {voting_session['session']['maxUpvotes']}")
        print(f"   Max Downvotes: {voting_session['session']['maxDownvotes']}")
        print(f"   Commit Phase: {voting_session['session']['commitPhaseStart']} to {voting_session['session']['commitPhaseEnd']}")
        
    except Exception as e:
        print(f"❌ Failed to create voting session: {e}")
    
    # Step 5: Simulate Voting
    print("\n👥 Step 5: Simulating Community Voting")
    voters = [
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222", 
        "0x3333333333333333333333333333333333333333"
    ]
    
    for i, voter in enumerate(voters):
        try:
            # Simulate vote commitment
            vote_data = {
                "contestId": contest_id,
                "voterAddress": voter,
                "voteData": {
                    "votes": [
                        {
                            "entryId": submission_ids[0],
                            "voteType": 1,  # Upvote
                            "reason": "U1",  # Unique insight
                            "justification": "This tutorial provides unique insights into DeFi protocols"
                        },
                        {
                            "entryId": submission_ids[1], 
                            "voteType": 1,  # Upvote
                            "reason": "U2",  # High quality
                            "justification": "High quality content with clear explanations"
                        }
                    ],
                    "nonce": f"nonce_{i}_{int(time.time())}",
                    "timestamp": datetime.now().isoformat()
                }
            }
            
            # Generate commitment
            commitment = client.generate_vote_commitment(vote_data["voteData"])
            vote_data["voteData"]["commitment"] = commitment
            
            commit_response = client.commit_vote(vote_data)
            print(f"✅ Vote committed for voter {i+1}: {commit_response['commitment'][:16]}...")
            
        except Exception as e:
            print(f"❌ Failed to commit vote for voter {i+1}: {e}")
    
    # Step 6: Create Judging Session
    print("\n⚖️ Step 6: Creating Judging Session")
    try:
        judging_session_data = {
            "contestId": contest_id,
            "entryIds": submission_ids,
            "judgeIds": ["judge_1", "judge_2", "judge_3"]
        }
        
        judging_session = client.create_judging_session(judging_session_data)
        session_id = judging_session["session"]["sessionId"]
        print(f"✅ Judging session created: {session_id}")
        print(f"   Contest: {judging_session['session']['contestId']}")
        print(f"   Judges: {len(judging_session['session']['judges'])}")
        print(f"   Entries: {len(judging_session['session']['entryIds'])}")
        
    except Exception as e:
        print(f"❌ Failed to create judging session: {e}")
    
    # Step 7: Simulate Judge Ballots
    print("\n📊 Step 7: Simulating Judge Ballots")
    judge_rankings = [
        {
            "judgeId": "judge_1",
            "rankings": {
                submission_ids[0]: 1,
                submission_ids[1]: 2, 
                submission_ids[2]: 3
            },
            "rationales": {
                submission_ids[0]: "Excellent technical depth and practical examples",
                submission_ids[1]: "Good content but lacks advanced concepts",
                submission_ids[2]: "Solid entry with good risk management focus"
            }
        },
        {
            "judgeId": "judge_2", 
            "rankings": {
                submission_ids[1]: 1,
                submission_ids[0]: 2,
                submission_ids[2]: 3
            },
            "rationales": {
                submission_ids[1]: "Best beginner-friendly explanation",
                submission_ids[0]: "Comprehensive but slightly overwhelming",
                submission_ids[2]: "Good risk management content"
            }
        },
        {
            "judgeId": "judge_3",
            "rankings": {
                submission_ids[2]: 1,
                submission_ids[0]: 2,
                submission_ids[1]: 3
            },
            "rationales": {
                submission_ids[2]: "Excellent focus on risk management, often overlooked",
                submission_ids[0]: "Good comprehensive guide",
                submission_ids[1]: "Basic but well-structured"
            }
        }
    ]
    
    for judge_data in judge_rankings:
        try:
            ballot_data = {
                "sessionId": session_id,
                "judgeId": judge_data["judgeId"],
                "rankings": judge_data["rankings"],
                "rationales": judge_data["rationales"]
            }
            
            ballot_response = client.submit_judge_ballot(ballot_data)
            print(f"✅ Ballot submitted for {judge_data['judgeId']}")
            
        except Exception as e:
            print(f"❌ Failed to submit ballot for {judge_data['judgeId']}: {e}")
    
    # Step 8: File Disputes and Nominations
    print("\n🔍 Step 8: Filing Disputes and Nominations")
    
    # File a dispute
    try:
        dispute_data = {
            "contestId": contest_id,
            "entryId": submission_ids[1],
            "reasonCode": "A4",  # Spam or low-effort
            "explanation": "This submission appears to be low-effort content with minimal original analysis",
            "evidence": ["Comparison with other similar tutorials"],
            "filerAddress": "0x4444444444444444444444444444444444444444",
            "isAnonymous": False
        }
        
        dispute_response = client.file_dispute(dispute_data)
        print(f"✅ Dispute filed: {dispute_response['disputeId']}")
        
    except Exception as e:
        print(f"❌ Failed to file dispute: {e}")
    
    # Submit a nomination
    try:
        nomination_data = {
            "contestId": contest_id,
            "entryId": submission_ids[2],
            "nominatorAddress": "0x5555555555555555555555555555555555555555",
            "reason": "High quality technical content",
            "justification": "This entry provides excellent risk management insights that deserve more recognition",
            "isAnonymous": False
        }
        
        nomination_response = client.submit_nomination(nomination_data)
        print(f"✅ Nomination submitted: {nomination_response['nominationId']}")
        
    except Exception as e:
        print(f"❌ Failed to submit nomination: {e}")
    
    # Step 9: Get Final Results
    print("\n🏆 Step 9: Getting Final Results")
    
    try:
        # Get voting results
        voting_results = client.get_voting_results(contest_id)
        print(f"✅ Voting results retrieved")
        print(f"   Total voters: {voting_results['totalVoters']}")
        print(f"   Results:")
        for result in voting_results['results'][:3]:  # Top 3
            print(f"     {result['entryId']}: {result['netVotes']} net votes, {result['communityScore']} community score")
        
        # Get judging results
        judging_results = client.get_judging_results(session_id)
        print(f"✅ Judging results retrieved")
        print(f"   Method: {judging_results['method']}")
        print(f"   Results:")
        for result in judging_results['results'][:3]:  # Top 3
            print(f"     Rank {result['rank']}: {result['entryId']} - {result['judgeScore']} judge score")
        
        # Get disputes
        disputes = client.get_contest_disputes(contest_id)
        print(f"✅ Disputes retrieved: {disputes['totalDisputes']} total")
        
        # Get nominations
        nominations = client.get_contest_nominations(contest_id)
        print(f"✅ Nominations retrieved: {nominations['totalNominations']} total")
        
    except Exception as e:
        print(f"❌ Failed to get final results: {e}")
    
    # Step 10: Summary
    print("\n📋 Step 10: Contest Summary")
    print("=" * 50)
    print(f"Contest ID: {contest_id}")
    print(f"Title: {contest_data['title']}")
    print(f"Reward: {contest_data['rewardAmount']} ETH")
    print(f"Submissions: {len(submission_ids)}")
    print(f"Voters: {len(voters)}")
    print(f"Judges: 3")
    print(f"Disputes: 1")
    print(f"Nominations: 1")
    print("\n🎉 Contest example completed successfully!")
    print("\nThis example demonstrates:")
    print("  ✅ Contest creation and configuration")
    print("  ✅ Content submission and analysis")
    print("  ✅ Four-axis algorithmic scoring")
    print("  ✅ Voting session creation and management")
    print("  ✅ Anonymous judging system")
    print("  ✅ Dispute and nomination systems")
    print("  ✅ Result aggregation and reporting")


if __name__ == "__main__":
    asyncio.run(run_complete_contest_example())
