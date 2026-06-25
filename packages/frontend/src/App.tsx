import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Activity, 
  Wallet, 
  Terminal, 
  History, 
  Calendar, 
  CheckCircle, 
  Database, 
  Cpu, 
  Play, 
  Coins, 
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Deployed system contract addresses (from Ritual genesis configuration)
const SCHEDULER_ADDRESS = "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B";
const WALLET_ADDRESS = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
const TEE_REGISTRY_ADDRESS = "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";
const LLM_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000802";

interface MoodRecord {
  mood: string;
  prediction: string;
  timestamp: string;
  blockNumber: number;
  executionIndex: number;
  rawJson: string;
}

const INITIAL_HISTORY: MoodRecord[] = [
  {
    mood: "Serene",
    prediction: "The stars align in a configuration of low entropy. A peaceful epoch is ahead on-chain; take time to optimize code structures and accumulate gas credits.",
    timestamp: "2026-06-25 01:45",
    blockNumber: 12450,
    executionIndex: 3,
    rawJson: '{"mood": "Serene", "prediction": "The stars align in a configuration of low entropy. A peaceful epoch is ahead on-chain..."}'
  },
  {
    mood: "Cryptic",
    prediction: "A subtle perturbation in block difficulty suggests non-deterministic outcomes. Proceed with extreme caution in liquidity pools, as hidden variables resolve.",
    timestamp: "2026-06-25 00:30",
    blockNumber: 12350,
    executionIndex: 2,
    rawJson: '{"mood": "Cryptic", "prediction": "A subtle perturbation in block difficulty suggests non-deterministic outcomes..."}'
  },
  {
    mood: "Joyful",
    prediction: "Ritual execution queues are cleared. Expect rapid block confirmation times and high throughput. A marvelous day to dispatch high-value state updates.",
    timestamp: "2026-06-24 23:15",
    blockNumber: 12250,
    executionIndex: 1,
    rawJson: '{"mood": "Joyful", "prediction": "Ritual execution queues are cleared. Expect rapid block confirmation times..."}'
  }
];

export default function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [oracleAddress, setOracleAddress] = useState("0x4A6b...72e8");
  const [executorAddress, setExecutorAddress] = useState("0x9cE8...58Fd");
  const [walletBalance, setWalletBalance] = useState("10.50");
  const [contractWalletBalance, setContractWalletBalance] = useState("2.50");
  const [schedulerActive, setSchedulerActive] = useState(true);
  
  // History State
  const [moodHistory, setMoodHistory] = useState<MoodRecord[]>(INITIAL_HISTORY);
  const [currentMood, setCurrentMood] = useState<MoodRecord>(INITIAL_HISTORY[0]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Simulation/Execution state machine
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(["Oracle initialized in standby mode."]);

  // Current block tracker simulation
  const [currentBlock, setCurrentBlock] = useState(12512);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBlock(prev => prev + 1);
    }, 4500); // simulation block time
    return () => clearInterval(interval);
  }, []);

  const connectWallet = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setUserAddress("");
      setIsDemoMode(true);
    } else {
      setWalletConnected(true);
      setUserAddress("0x71C7...65a9");
      setIsDemoMode(false);
      addConsoleLog("Wallet connected: 0x71C7...65a9. Connected to Ritual Testnet.");
    }
  };

  const addConsoleLog = (log: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'joyful': return 'var(--mood-joyful)';
      case 'serene': return 'var(--mood-serene)';
      case 'melancholy': return 'var(--mood-melancholy)';
      case 'cryptic': return 'var(--mood-cryptic)';
      default: return 'var(--accent)';
    }
  };

  const triggerUpdate = () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setExecutionStep(1);
    setConsoleLogs([]);
    
    // Simulate steps in TEE-EOVMT lifecycle
    setTimeout(() => {
      setExecutionStep(2);
      addConsoleLog("Scheduler trigger captured. Preparing executeMoodUpdate(index: " + (moodHistory.length + 1) + ")");
    }, 1500);

    setTimeout(() => {
      setExecutionStep(3);
      addConsoleLog("Formulating LLM payload... Model: zai-org/GLM-4.7-FP8");
      addConsoleLog("Submitting static call to precompile 0x0802...");
    }, 3200);

    setTimeout(() => {
      setExecutionStep(4);
      addConsoleLog("Inference request delegated to TEE enclave executor " + executorAddress);
      addConsoleLog("TDX sandbox running inference, temperature = 0.7");
    }, 5000);

    setTimeout(() => {
      setExecutionStep(5);
      addConsoleLog("Inference completed. TEE attestation validated by TEEServiceRegistry.");
      addConsoleLog("Re-playing tx with result. Settling on-chain receipt.");
    }, 7200);

    setTimeout(() => {
      const moods = ["Joyful", "Serene", "Melancholy", "Cryptic"];
      const predictions = [
        "A highly energetic frequency dominates the blockchain. Execution queues are wide open. Deploy contracts now for peak efficiency.",
        "Slight congestion in the execution pipelines. Maintain high gas thresholds. Perfect time to focus on code optimization rather than transaction volume.",
        "On-chain signals show signs of entropy decay. Refrain from scheduling complex multi-agent flows until state equilibrium returns.",
        "Mysterious patterns detected in block difficulty. Hidden variables are settling. A good day to perform security audits and key rotations."
      ];
      const randomIndex = Math.floor(Math.random() * moods.length);
      const newMood = moods[randomIndex];
      const newPrediction = predictions[randomIndex];
      const newIndex = moodHistory.length + 1;
      
      const newRecord: MoodRecord = {
        mood: newMood,
        prediction: newPrediction,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        blockNumber: currentBlock,
        executionIndex: newIndex,
        rawJson: JSON.stringify({ mood: newMood, prediction: newPrediction })
      };

      setMoodHistory(prev => [newRecord, ...prev]);
      setCurrentMood(newRecord);
      setIsExecuting(false);
      setExecutionStep(0);
      addConsoleLog("Mood Updated! currentMood = " + newMood);
      
      // Deduct fee simulation
      if (parseFloat(contractWalletBalance) > 0.05) {
        setContractWalletBalance(prev => (parseFloat(prev) - 0.05).toFixed(2));
      }
    }, 9000);
  };

  const depositToWallet = () => {
    if (parseFloat(walletBalance) < 5) return;
    setWalletBalance(prev => (parseFloat(prev) - 5).toFixed(2));
    setContractWalletBalance(prev => (parseFloat(prev) + 5).toFixed(2));
    addConsoleLog("Deposited 5.00 RITUAL to RitualWallet for MoodOracle contract address.");
  };

  return (
    <div className="app-container">
      {/* Tessellated background blur effects */}
      <div className="bg-glow bg-glow-orange"></div>
      <div className="bg-glow bg-glow-green"></div>

      {/* Header / Navbar */}
      <header className="navbar">
        <div className="navbar-logo">
          <div className="logo-orb"></div>
          <span className="logo-text">Mood Oracle</span>
        </div>
        <div className="navbar-controls">
          <div className={`status-badge ${isDemoMode ? 'status-demo' : 'status-live'}`}>
            <span className="status-dot"></span>
            {isDemoMode ? 'Simulation Mode' : 'Ritual Testnet'}
          </div>
          <button className="connect-btn" onClick={connectWallet}>
            <Wallet size={16} />
            {walletConnected ? `${userAddress}` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="dashboard-grid">
        
        {/* Left Column - Core Oracle View */}
        <section className="column-left">
          
          {/* Mood Ball Card */}
          <div className="glass-card main-orb-card">
            <div className="card-header">
              <Sparkles size={18} className="icon-orange" />
              <h3>Current Oracle State</h3>
            </div>
            
            <div className="orb-display">
              {/* Dynamic Glow Orb */}
              <div 
                className="glowing-orb" 
                style={{ 
                  '--orb-color': getMoodColor(currentMood.mood),
                  animationPlayState: isExecuting ? 'running' : 'paused'
                } as React.CSSProperties}
              >
                <div className="orb-inner"></div>
              </div>
              <div className="orb-reflection"></div>
            </div>

            <div className="oracle-meta">
              <h2 className="mood-title" style={{ color: getMoodColor(currentMood.mood) }}>
                {currentMood.mood.toUpperCase()}
              </h2>
              <div className="meta-stats">
                <span className="stat-item">
                  <Play size={12} /> Index: #{currentMood.executionIndex}
                </span>
                <span className="stat-item">
                  <Calendar size={12} /> Block: #{currentMood.blockNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Prediction Card */}
          <div className="glass-card prediction-card">
            <div className="card-header">
              <Terminal size={18} className="icon-green" />
              <h3>Daily Prediction</h3>
            </div>
            <div className="prediction-scroll">
              <p className="prediction-text">
                {isExecuting ? (
                  <span className="typing-loader">Inference in progress, decoding precompile result...</span>
                ) : (
                  currentMood.prediction
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Right Column - Infrastructure Controls & Logs */}
        <section className="column-right">
          
          {/* Ritual System Contract Details */}
          <div className="glass-card config-card">
            <div className="card-header">
              <Database size={18} />
              <h3>On-Chain Infrastructure</h3>
            </div>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">MoodOracle.sol</span>
                <div className="config-value-wrap">
                  <span className="config-value">{oracleAddress}</span>
                  <a href={`https://explorer.ritualfoundation.org/address/${oracleAddress}`} target="_blank" rel="noreferrer">
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <div className="config-item">
                <span className="config-label">Active TEE Executor</span>
                <div className="config-value-wrap">
                  <span className="config-value">{executorAddress}</span>
                </div>
              </div>
              <div className="config-item">
                <span className="config-label">Scheduler Contract</span>
                <div className="config-value-wrap">
                  <span className="config-value">{SCHEDULER_ADDRESS}</span>
                </div>
              </div>
              <div className="config-item">
                <span className="config-label">LLM Precompile (0x0802)</span>
                <div className="config-value-wrap">
                  <span className="config-value">{LLM_PRECOMPILE_ADDRESS}</span>
                </div>
              </div>
            </div>

            {/* Wallet & Deposit Simulator */}
            <div className="wallet-section">
              <div className="wallet-row">
                <div className="wallet-box">
                  <span className="wallet-label">Contract Wallet Balance</span>
                  <span className="wallet-value">{contractWalletBalance} RITUAL</span>
                </div>
                <div className="wallet-box">
                  <span className="wallet-label">User Balance</span>
                  <span className="wallet-value">{walletBalance} RITUAL</span>
                </div>
              </div>
              <button 
                className="action-btn secondary-btn"
                onClick={depositToWallet}
                disabled={parseFloat(walletBalance) < 5 || isExecuting}
              >
                <Coins size={14} />
                Fund Oracle (Deposit 5 RITUAL)
              </button>
            </div>
          </div>

          {/* Scheduler Timeline Card */}
          <div className="glass-card scheduler-card">
            <div className="card-header">
              <Activity size={18} className="icon-orange" />
              <h3>Scheduler Automation</h3>
              <span className={`scheduler-badge ${schedulerActive ? 'active' : 'paused'}`}>
                {schedulerActive ? 'Active Job' : 'Standby'}
              </span>
            </div>
            
            <div className="scheduler-timeline">
              <div className="timeline-node active">
                <CheckCircle size={14} />
                <div className="node-text">
                  <span className="node-title">Job Registered</span>
                  <span className="node-subtitle">Job ID: #40283</span>
                </div>
              </div>
              <div className="timeline-connector"></div>
              <div className={`timeline-node ${schedulerActive ? 'active' : ''}`}>
                <RefreshCw size={14} className={schedulerActive ? "rotate-anim" : ""} />
                <div className="node-text">
                  <span className="node-title">Next execution</span>
                  <span className="node-subtitle">Block #{currentMood.blockNumber + 100} (in {currentMood.blockNumber + 100 - currentBlock} blocks)</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="action-row">
              <button 
                className="action-btn primary-btn" 
                onClick={triggerUpdate} 
                disabled={isExecuting || parseFloat(contractWalletBalance) < 0.05}
              >
                <Play size={14} />
                {isExecuting ? 'Calling TEE...' : 'Trigger Scheduled Call'}
              </button>
            </div>
          </div>

          {/* Execution Pipeline Console logs */}
          <div className="glass-card console-card">
            <div className="card-header">
              <Terminal size={18} />
              <h3>TEE Execution Logs</h3>
            </div>
            
            {/* Visual execution status blocks */}
            {isExecuting && (
              <div className="execution-status-bar">
                <div className={`status-block ${executionStep >= 1 ? 'active' : ''}`}>Callback</div>
                <ArrowRight size={10} />
                <div className={`status-block ${executionStep >= 3 ? 'active' : ''}`}>LLM Encode</div>
                <ArrowRight size={10} />
                <div className={`status-block ${executionStep >= 4 ? 'active' : ''}`}>TEE Enclave</div>
                <ArrowRight size={10} />
                <div className={`status-block ${executionStep >= 5 ? 'active' : ''}`}>On-chain</div>
              </div>
            )}

            <div className="console-display">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="console-line">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Mood History Logs */}
          <div className="glass-card history-card">
            <div className="card-header">
              <History size={18} />
              <h3>Inference History</h3>
            </div>
            <div className="history-list">
              {moodHistory.map((item, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-summary">
                    <span 
                      className="history-mood-tag" 
                      style={{ 
                        backgroundColor: getMoodColor(item.mood) + '22',
                        color: getMoodColor(item.mood),
                        borderColor: getMoodColor(item.mood) + '44'
                      }}
                    >
                      {item.mood}
                    </span>
                    <span className="history-index">Index #{item.executionIndex}</span>
                    <span className="history-block">Block #{item.blockNumber}</span>
                    <button 
                      className="history-expand-btn"
                      onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                    >
                      {expandedIndex === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {expandedIndex === idx && (
                    <div className="history-details">
                      <p className="history-prediction-sub">{item.prediction}</p>
                      <pre className="history-raw-code">
                        <code>{item.rawJson}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
