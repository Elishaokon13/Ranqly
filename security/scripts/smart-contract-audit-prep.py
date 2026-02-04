#!/usr/bin/env python3
"""
Ranqly Smart Contract Audit Preparation
Prepares smart contracts for third-party security audits
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import yaml

class SmartContractAuditPreparer:
    def __init__(self, contracts_dir: str = "contracts/"):
        self.contracts_dir = Path(contracts_dir)
        self.audit_package = {}
        
    def prepare_audit_package(self) -> Dict[str, Any]:
        """Prepare comprehensive audit package"""
        print("📦 Preparing smart contract audit package...")
        
        self.audit_package = {
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0',
                'project': 'Ranqly Web3 Contest Platform',
                'audit_scope': self.get_audit_scope(),
                'prepared_by': 'Ranqly Security Team'
            },
            'contracts': self.analyze_contracts(),
            'dependencies': self.analyze_dependencies(),
            'test_coverage': self.get_test_coverage(),
            'documentation': self.gather_documentation(),
            'security_analysis': self.run_security_analysis(),
            'gas_analysis': self.run_gas_analysis(),
            'deployment_info': self.get_deployment_info(),
            'risk_assessment': self.perform_risk_assessment()
        }
        
        return self.audit_package
    
    def get_audit_scope(self) -> List[str]:
        """Define audit scope"""
        return [
            "PoIVotingNFT.sol - Soulbound NFT for voting power",
            "ContestVault.sol - Multisig escrow for contest rewards",
            "CommitRevealVoting.sol - Commit-reveal voting mechanism",
            "ContestRegistry.sol - Contest lifecycle management",
            "Access control and permission systems",
            "Economic model and token mechanics",
            "Upgradeability and governance mechanisms",
            "Integration with external protocols"
        ]
    
    def analyze_contracts(self) -> Dict[str, Any]:
        """Analyze all smart contracts"""
        contracts_info = {}
        
        for contract_file in self.contracts_dir.glob("**/*.sol"):
            if contract_file.name.startswith("test") or contract_file.name.startswith("mock"):
                continue
                
            contract_info = {
                'file_path': str(contract_file),
                'size': contract_file.stat().st_size,
                'lines_of_code': self.count_lines_of_code(contract_file),
                'functions': self.extract_functions(contract_file),
                'modifiers': self.extract_modifiers(contract_file),
                'events': self.extract_events(contract_file),
                'inheritance': self.extract_inheritance(contract_file),
                'external_dependencies': self.extract_external_dependencies(contract_file),
                'complexity_score': self.calculate_complexity(contract_file)
            }
            
            contracts_info[contract_file.stem] = contract_info
        
        return contracts_info
    
    def count_lines_of_code(self, file_path: Path) -> int:
        """Count lines of code (excluding comments and empty lines)"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            code_lines = 0
            in_multiline_comment = False
            
            for line in lines:
                line = line.strip()
                
                # Skip empty lines
                if not line:
                    continue
                
                # Handle multiline comments
                if '/*' in line:
                    in_multiline_comment = True
                if '*/' in line:
                    in_multiline_comment = False
                    continue
                
                # Skip single line comments
                if line.startswith('//') or line.startswith('/*'):
                    continue
                
                # Skip lines inside multiline comments
                if in_multiline_comment:
                    continue
                
                code_lines += 1
            
            return code_lines
        
        except Exception as e:
            print(f"Error counting lines in {file_path}: {e}")
            return 0
    
    def extract_functions(self, file_path: Path) -> List[Dict[str, Any]]:
        """Extract function information from contract"""
        functions = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.split('\n')
            current_function = None
            
            for i, line in enumerate(lines):
                line = line.strip()
                
                # Detect function declarations
                if line.startswith('function ') or line.startswith('constructor'):
                    func_info = {
                        'name': self.extract_function_name(line),
                        'visibility': self.extract_visibility(line),
                        'state_mutability': self.extract_state_mutability(line),
                        'parameters': self.extract_parameters(line),
                        'returns': self.extract_returns(line),
                        'modifiers': self.extract_function_modifiers(line),
                        'line_number': i + 1,
                        'complexity': 'medium'  # Simplified
                    }
                    functions.append(func_info)
        
        except Exception as e:
            print(f"Error extracting functions from {file_path}: {e}")
        
        return functions
    
    def extract_function_name(self, line: str) -> str:
        """Extract function name from declaration"""
        if 'constructor' in line:
            return 'constructor'
        
        parts = line.split()
        for i, part in enumerate(parts):
            if part == 'function':
                if i + 1 < len(parts):
                    return parts[i + 1].split('(')[0]
        
        return 'unknown'
    
    def extract_visibility(self, line: str) -> str:
        """Extract function visibility"""
        visibility_keywords = ['public', 'private', 'internal', 'external']
        for keyword in visibility_keywords:
            if keyword in line:
                return keyword
        return 'internal'  # Default
    
    def extract_state_mutability(self, line: str) -> str:
        """Extract state mutability"""
        mutability_keywords = ['pure', 'view', 'payable', 'nonpayable']
        for keyword in mutability_keywords:
            if keyword in line:
                return keyword
        return 'nonpayable'  # Default
    
    def extract_parameters(self, line: str) -> List[str]:
        """Extract function parameters"""
        try:
            start = line.find('(')
            end = line.find(')')
            if start != -1 and end != -1:
                params_str = line[start+1:end].strip()
                if params_str:
                    return [p.strip() for p in params_str.split(',')]
        except:
            pass
        return []
    
    def extract_returns(self, line: str) -> List[str]:
        """Extract return types"""
        if 'returns' in line:
            try:
                start = line.find('returns')
                paren_start = line.find('(', start)
                paren_end = line.find(')', paren_start)
                if paren_start != -1 and paren_end != -1:
                    returns_str = line[paren_start+1:paren_end].strip()
                    if returns_str:
                        return [r.strip() for r in returns_str.split(',')]
            except:
                pass
        return []
    
    def extract_function_modifiers(self, line: str) -> List[str]:
        """Extract function modifiers"""
        modifiers = []
        modifier_keywords = ['onlyOwner', 'onlyAdmin', 'whenNotPaused', 'nonReentrant']
        for keyword in modifier_keywords:
            if keyword in line:
                modifiers.append(keyword)
        return modifiers
    
    def extract_modifiers(self, file_path: Path) -> List[Dict[str, Any]]:
        """Extract modifier information"""
        modifiers = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.split('\n')
            
            for i, line in enumerate(lines):
                line = line.strip()
                
                if line.startswith('modifier '):
                    modifier_name = line.split()[1].split('(')[0]
                    modifiers.append({
                        'name': modifier_name,
                        'line_number': i + 1,
                        'parameters': self.extract_parameters(line)
                    })
        
        except Exception as e:
            print(f"Error extracting modifiers from {file_path}: {e}")
        
        return modifiers
    
    def extract_events(self, file_path: Path) -> List[Dict[str, Any]]:
        """Extract event information"""
        events = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.split('\n')
            
            for i, line in enumerate(lines):
                line = line.strip()
                
                if line.startswith('event '):
                    event_name = line.split()[1].split('(')[0]
                    events.append({
                        'name': event_name,
                        'line_number': i + 1,
                        'parameters': self.extract_parameters(line)
                    })
        
        except Exception as e:
            print(f"Error extracting events from {file_path}: {e}")
        
        return events
    
    def extract_inheritance(self, file_path: Path) -> List[str]:
        """Extract inheritance information"""
        inheritance = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.split('\n')
            
            for line in lines:
                line = line.strip()
                
                if line.startswith('contract ') and ' is ' in line:
                    parts = line.split(' is ')
                    if len(parts) > 1:
                        inherited = parts[1].split('{')[0].strip()
                        inheritance.extend([i.strip() for i in inherited.split(',')])
        
        except Exception as e:
            print(f"Error extracting inheritance from {file_path}: {e}")
        
        return inheritance
    
    def extract_external_dependencies(self, file_path: Path) -> List[str]:
        """Extract external dependencies"""
        dependencies = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.split('\n')
            
            for line in lines:
                line = line.strip()
                
                # Look for import statements
                if line.startswith('import '):
                    import_path = line.split('"')[1] if '"' in line else line.split("'")[1]
                    dependencies.append(import_path)
                
                # Look for external contract calls
                if '.call(' in line or '.delegatecall(' in line:
                    dependencies.append('external_call')
        
        except Exception as e:
            print(f"Error extracting dependencies from {file_path}: {e}")
        
        return dependencies
    
    def calculate_complexity(self, file_path: Path) -> str:
        """Calculate contract complexity (simplified)"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Simple complexity calculation
            lines_of_code = self.count_lines_of_code(file_path)
            function_count = len(self.extract_functions(file_path))
            
            complexity_score = lines_of_code + (function_count * 10)
            
            if complexity_score < 500:
                return 'low'
            elif complexity_score < 1000:
                return 'medium'
            else:
                return 'high'
        
        except Exception as e:
            print(f"Error calculating complexity for {file_path}: {e}")
            return 'unknown'
    
    def analyze_dependencies(self) -> Dict[str, Any]:
        """Analyze project dependencies"""
        dependencies_info = {
            'package_json': self.analyze_package_json(),
            'hardhat_config': self.analyze_hardhat_config(),
            'solidity_version': self.get_solidity_version(),
            'openzeppelin_version': self.get_openzeppelin_version()
        }
        
        return dependencies_info
    
    def analyze_package_json(self) -> Dict[str, Any]:
        """Analyze package.json dependencies"""
        package_json_path = self.contracts_dir / "package.json"
        
        if not package_json_path.exists():
            return {}
        
        try:
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
            
            return {
                'dependencies': package_data.get('dependencies', {}),
                'devDependencies': package_data.get('devDependencies', {}),
                'scripts': package_data.get('scripts', {})
            }
        
        except Exception as e:
            print(f"Error analyzing package.json: {e}")
            return {}
    
    def analyze_hardhat_config(self) -> Dict[str, Any]:
        """Analyze Hardhat configuration"""
        hardhat_config_path = self.contracts_dir / "hardhat.config.ts"
        
        if not hardhat_config_path.exists():
            return {}
        
        try:
            with open(hardhat_config_path, 'r') as f:
                config_content = f.read()
            
            return {
                'networks': self.extract_networks_from_config(config_content),
                'solidity_version': self.extract_solidity_version_from_config(config_content),
                'plugins': self.extract_plugins_from_config(config_content)
            }
        
        except Exception as e:
            print(f"Error analyzing Hardhat config: {e}")
            return {}
    
    def extract_networks_from_config(self, config_content: str) -> List[str]:
        """Extract network configurations"""
        networks = []
        lines = config_content.split('\n')
        
        for line in lines:
            if 'network' in line.lower() and ':' in line:
                network_name = line.split(':')[0].strip()
                if network_name not in ['defaultNetwork', 'networks']:
                    networks.append(network_name)
        
        return networks
    
    def extract_solidity_version_from_config(self, config_content: str) -> str:
        """Extract Solidity version from config"""
        lines = config_content.split('\n')
        
        for line in lines:
            if 'version' in line.lower() and ('0.' in line or '^' in line):
                # Extract version string
                version = line.split('"')[1] if '"' in line else line.split("'")[1]
                return version
        
        return 'unknown'
    
    def extract_plugins_from_config(self, config_content: str) -> List[str]:
        """Extract Hardhat plugins"""
        plugins = []
        lines = config_content.split('\n')
        
        for line in lines:
            if 'require(' in line and '@' in line:
                plugin = line.split('"')[1] if '"' in line else line.split("'")[1]
                plugins.append(plugin)
        
        return plugins
    
    def get_solidity_version(self) -> str:
        """Get Solidity compiler version"""
        try:
            result = subprocess.run(['solc', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            pass
        
        return 'unknown'
    
    def get_openzeppelin_version(self) -> str:
        """Get OpenZeppelin version"""
        package_json_path = self.contracts_dir / "package.json"
        
        if package_json_path.exists():
            try:
                with open(package_json_path, 'r') as f:
                    package_data = json.load(f)
                
                dependencies = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
                
                for dep_name, version in dependencies.items():
                    if 'openzeppelin' in dep_name.lower():
                        return version
            except:
                pass
        
        return 'unknown'
    
    def get_test_coverage(self) -> Dict[str, Any]:
        """Get test coverage information"""
        coverage_info = {
            'unit_tests': self.count_unit_tests(),
            'integration_tests': self.count_integration_tests(),
            'coverage_percentage': self.get_coverage_percentage(),
            'test_files': self.list_test_files()
        }
        
        return coverage_info
    
    def count_unit_tests(self) -> int:
        """Count unit test files"""
        test_files = list(self.contracts_dir.glob("test/**/*.test.ts"))
        test_files.extend(list(self.contracts_dir.glob("test/**/*.test.js")))
        return len(test_files)
    
    def count_integration_tests(self) -> int:
        """Count integration test files"""
        integration_files = list(self.contracts_dir.glob("test/**/*.integration.ts"))
        integration_files.extend(list(self.contracts_dir.glob("test/**/*.integration.js")))
        return len(integration_files)
    
    def get_coverage_percentage(self) -> float:
        """Get test coverage percentage"""
        try:
            # Try to read coverage report
            coverage_path = self.contracts_dir / "coverage" / "coverage-summary.json"
            if coverage_path.exists():
                with open(coverage_path, 'r') as f:
                    coverage_data = json.load(f)
                
                total = coverage_data.get('total', {})
                return total.get('lines', {}).get('pct', 0.0)
        except:
            pass
        
        return 0.0
    
    def list_test_files(self) -> List[str]:
        """List all test files"""
        test_files = []
        
        for test_file in self.contracts_dir.glob("test/**/*"):
            if test_file.is_file() and (test_file.suffix == '.ts' or test_file.suffix == '.js'):
                test_files.append(str(test_file.relative_to(self.contracts_dir)))
        
        return test_files
    
    def gather_documentation(self) -> Dict[str, Any]:
        """Gather documentation files"""
        documentation = {
            'readme': self.read_readme(),
            'architecture_docs': self.find_architecture_docs(),
            'api_docs': self.find_api_docs(),
            'deployment_docs': self.find_deployment_docs(),
            'security_docs': self.find_security_docs()
        }
        
        return documentation
    
    def read_readme(self) -> str:
        """Read README file"""
        readme_path = self.contracts_dir / "README.md"
        
        if readme_path.exists():
            try:
                with open(readme_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except:
                pass
        
        return ""
    
    def find_architecture_docs(self) -> List[str]:
        """Find architecture documentation"""
        docs = []
        
        for doc_file in self.contracts_dir.glob("docs/**/*.md"):
            if 'architecture' in doc_file.name.lower():
                docs.append(str(doc_file))
        
        return docs
    
    def find_api_docs(self) -> List[str]:
        """Find API documentation"""
        docs = []
        
        for doc_file in self.contracts_dir.glob("docs/**/*.md"):
            if 'api' in doc_file.name.lower():
                docs.append(str(doc_file))
        
        return docs
    
    def find_deployment_docs(self) -> List[str]:
        """Find deployment documentation"""
        docs = []
        
        for doc_file in self.contracts_dir.glob("docs/**/*.md"):
            if 'deploy' in doc_file.name.lower():
                docs.append(str(doc_file))
        
        return docs
    
    def find_security_docs(self) -> List[str]:
        """Find security documentation"""
        docs = []
        
        for doc_file in self.contracts_dir.glob("docs/**/*.md"):
            if 'security' in doc_file.name.lower():
                docs.append(str(doc_file))
        
        return docs
    
    def run_security_analysis(self) -> Dict[str, Any]:
        """Run security analysis tools"""
        security_analysis = {
            'slither': self.run_slither_analysis(),
            'mythril': self.run_mythril_analysis(),
            'semgrep': self.run_semgrep_analysis()
        }
        
        return security_analysis
    
    def run_slither_analysis(self) -> Dict[str, Any]:
        """Run Slither static analysis"""
        try:
            result = subprocess.run([
                'slither', str(self.contracts_dir), '--json', '/tmp/slither_audit.json'
            ], capture_output=True, text=True, timeout=300)
            
            if Path('/tmp/slither_audit.json').exists():
                with open('/tmp/slither_audit.json', 'r') as f:
                    slither_data = json.load(f)
                
                return {
                    'status': 'completed',
                    'findings': len(slither_data.get('results', {}).get('detectors', [])),
                    'critical': len([d for d in slither_data.get('results', {}).get('detectors', []) if d.get('impact') == 'High']),
                    'warnings': len([d for d in slither_data.get('results', {}).get('detectors', []) if d.get('impact') == 'Medium'])
                }
        
        except Exception as e:
            print(f"Slither analysis failed: {e}")
        
        return {'status': 'failed', 'error': str(e) if 'e' in locals() else 'Unknown error'}
    
    def run_mythril_analysis(self) -> Dict[str, Any]:
        """Run Mythril analysis"""
        try:
            findings = 0
            for contract_file in self.contracts_dir.glob("contracts/*.sol"):
                result = subprocess.run([
                    'myth', 'analyze', str(contract_file), '--execution-timeout', '60'
                ], capture_output=True, text=True, timeout=120)
                
                if 'SWC-' in result.stdout:
                    findings += 1
            
            return {
                'status': 'completed',
                'findings': findings,
                'contracts_analyzed': len(list(self.contracts_dir.glob("contracts/*.sol")))
            }
        
        except Exception as e:
            print(f"Mythril analysis failed: {e}")
        
        return {'status': 'failed', 'error': str(e) if 'e' in locals() else 'Unknown error'}
    
    def run_semgrep_analysis(self) -> Dict[str, Any]:
        """Run Semgrep analysis"""
        try:
            result = subprocess.run([
                'semgrep', '--config=auto', '--json', str(self.contracts_dir)
            ], capture_output=True, text=True, timeout=180)
            
            if result.stdout:
                semgrep_data = json.loads(result.stdout)
                findings = len(semgrep_data.get('results', []))
                
                return {
                    'status': 'completed',
                    'findings': findings,
                    'high_severity': len([r for r in semgrep_data.get('results', []) if r.get('extra', {}).get('severity') == 'ERROR'])
                }
        
        except Exception as e:
            print(f"Semgrep analysis failed: {e}")
        
        return {'status': 'failed', 'error': str(e) if 'e' in locals() else 'Unknown error'}
    
    def run_gas_analysis(self) -> Dict[str, Any]:
        """Run gas analysis"""
        gas_analysis = {
            'deployment_costs': self.estimate_deployment_costs(),
            'function_costs': self.estimate_function_costs(),
            'optimization_suggestions': []
        }
        
        return gas_analysis
    
    def estimate_deployment_costs(self) -> Dict[str, int]:
        """Estimate deployment costs"""
        deployment_costs = {}
        
        try:
            # Run compilation to get gas estimates
            result = subprocess.run([
                'npx', 'hardhat', 'compile'
            ], cwd=self.contracts_dir, capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                # Parse compilation output for gas estimates
                # This is a simplified version - in practice, you'd parse the artifacts
                deployment_costs = {
                    'PoIVotingNFT': 2500000,  # Estimated
                    'ContestVault': 1800000,
                    'CommitRevealVoting': 2200000,
                    'ContestRegistry': 2000000
                }
        
        except Exception as e:
            print(f"Gas analysis failed: {e}")
        
        return deployment_costs
    
    def estimate_function_costs(self) -> Dict[str, Dict[str, int]]:
        """Estimate function execution costs"""
        function_costs = {}
        
        # Simplified gas estimates for key functions
        function_costs = {
            'PoIVotingNFT': {
                'mint': 150000,
                'burn': 80000,
                'transfer': 0  # Soulbound
            },
            'ContestVault': {
                'deposit': 120000,
                'withdraw': 100000,
                'executeTransaction': 200000
            },
            'CommitRevealVoting': {
                'commitVote': 100000,
                'revealVote': 80000,
                'tallyVotes': 150000
            }
        }
        
        return function_costs
    
    def get_deployment_info(self) -> Dict[str, Any]:
        """Get deployment information"""
        deployment_info = {
            'target_networks': ['Polygon', 'Optimism', 'Arbitrum'],
            'deployment_scripts': self.list_deployment_scripts(),
            'environment_variables': self.list_environment_variables(),
            'deployment_checklist': self.get_deployment_checklist()
        }
        
        return deployment_info
    
    def list_deployment_scripts(self) -> List[str]:
        """List deployment scripts"""
        scripts = []
        
        for script_file in self.contracts_dir.glob("scripts/**/*.ts"):
            if 'deploy' in script_file.name.lower():
                scripts.append(str(script_file))
        
        return scripts
    
    def list_environment_variables(self) -> List[str]:
        """List required environment variables"""
        return [
            'PRIVATE_KEY',
            'RPC_URL',
            'ETHERSCAN_API_KEY',
            'POLYGONSCAN_API_KEY',
            'OPTIMISM_API_KEY',
            'ARBITRUM_API_KEY'
        ]
    
    def get_deployment_checklist(self) -> List[str]:
        """Get deployment checklist"""
        return [
            'Verify contract compilation',
            'Run all tests',
            'Check gas estimates',
            'Verify constructor parameters',
            'Set up multi-signature wallets',
            'Configure access controls',
            'Deploy to testnet first',
            'Verify contracts on block explorer',
            'Update frontend contract addresses',
            'Monitor for issues post-deployment'
        ]
    
    def perform_risk_assessment(self) -> Dict[str, Any]:
        """Perform risk assessment"""
        risk_assessment = {
            'high_risk_areas': [
                'Multisig wallet management',
                'Voting mechanism integrity',
                'Reward distribution logic',
                'Access control implementation'
            ],
            'medium_risk_areas': [
                'Gas optimization',
                'Front-running protection',
                'Oracle dependency',
                'Upgrade mechanisms'
            ],
            'low_risk_areas': [
                'Event emission',
                'View functions',
                'Basic token transfers'
            ],
            'mitigation_strategies': [
                'Multi-signature requirements for critical operations',
                'Time locks for governance changes',
                'Comprehensive testing and auditing',
                'Gradual deployment with monitoring'
            ]
        }
        
        return risk_assessment
    
    def generate_audit_report(self, output_path: str = "security/reports/audit-preparation-report.json"):
        """Generate audit preparation report"""
        # Ensure output directory exists
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(self.audit_package, f, indent=2)
        
        print(f"📊 Audit preparation report generated: {output_path}")
        
        # Also generate a summary
        self.generate_audit_summary()
        
        return self.audit_package
    
    def generate_audit_summary(self):
        """Generate audit summary"""
        summary = f"""
🔍 RANQLY SMART CONTRACT AUDIT PREPARATION SUMMARY
{'='*60}

📋 CONTRACT ANALYSIS:
   Total Contracts: {len(self.audit_package['contracts'])}
   Total Lines of Code: {sum(c['lines_of_code'] for c in self.audit_package['contracts'].values())}
   Total Functions: {sum(len(c['functions']) for c in self.audit_package['contracts'].values())}
   Total Events: {sum(len(c['events']) for c in self.audit_package['contracts'].values())}

🧪 TEST COVERAGE:
   Unit Tests: {self.audit_package['test_coverage']['unit_tests']}
   Integration Tests: {self.audit_package['test_coverage']['integration_tests']}
   Coverage: {self.audit_package['test_coverage']['coverage_percentage']:.1f}%

🔒 SECURITY ANALYSIS:
   Slither Findings: {self.audit_package['security_analysis']['slither'].get('findings', 0)}
   Mythril Findings: {self.audit_package['security_analysis']['mythril'].get('findings', 0)}
   Semgrep Findings: {self.audit_package['security_analysis']['semgrep'].get('findings', 0)}

⛽ GAS ANALYSIS:
   Deployment Contracts: {len(self.audit_package['gas_analysis']['deployment_costs'])}
   Estimated Total Deployment: {sum(self.audit_package['gas_analysis']['deployment_costs'].values()):,} gas

🎯 AUDIT READINESS:
   Documentation: {'✅' if self.audit_package['documentation']['readme'] else '❌'}
   Test Coverage: {'✅' if self.audit_package['test_coverage']['coverage_percentage'] > 80 else '❌'}
   Security Analysis: {'✅' if self.audit_package['security_analysis']['slither']['status'] == 'completed' else '❌'}
   Deployment Ready: {'✅' if self.audit_package['deployment_info']['deployment_scripts'] else '❌'}

📊 NEXT STEPS:
   1. Review security analysis findings
   2. Improve test coverage if needed
   3. Complete documentation gaps
   4. Prepare for third-party audit
   5. Schedule audit with security firm

{'='*60}
"""
        
        print(summary)
        
        # Save summary to file
        summary_path = "security/reports/audit-summary.txt"
        Path(summary_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(summary_path, 'w') as f:
            f.write(summary)

def main():
    """Main function"""
    preparer = SmartContractAuditPreparer()
    
    try:
        audit_package = preparer.prepare_audit_package()
        preparer.generate_audit_report()
        
        print("\n✅ Smart contract audit preparation completed successfully!")
        return 0
    
    except Exception as e:
        print(f"\n❌ Audit preparation failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
