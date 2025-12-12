import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// --- Types & Configuration ---

type PersonaType = "KAM" | "SUPPORT" | "DEVOPS" | "ANALYST";

interface PersonaConfig {
  id: PersonaType;
  name: string;
  role: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
  metrics: { label: string; value: string; trend?: string; trendUp?: boolean }[];
  suggestedPrompts: string[];
}

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: Date;
  actionType?: string; // Optional: used if we want to render specific UI based on action
}

interface ChatResponse {
  result: "success" | "error";
  response: string;
  sessionId: string;
  actionType: string;
  data?: any;
  error?: string;
  merchantId?: string;
}

interface Merchant {
    id: string;
    name: string;
}

const MERCHANTS: Merchant[] = [
    { id: "M1001", name: "Mega Retailer (M1001)" },
    { id: "MERCHANT_DEMO_123", name: "Demo Merchant Corp" },
    { id: "M_AMAZON_US", name: "Amazon US" },
    { id: "M_UBER_EATS", name: "Uber Eats" },
    { id: "M_NETFLIX", name: "Netflix" },
    { id: "M_SPOTIFY", name: "Spotify" }
];

// --- MCP API / Tool Service ---

const API_BASE = "http://localhost:8080";

// Helper to simulate API if localhost is down (for demo purposes)
// Now supports dynamic mock generation based on request body
const fetchWithMockFallback = async (endpoint: string, options: any): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } catch (e) {
    console.warn(`MCP API unreachable (${endpoint}). Using mock data.`);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    // --- Dynamic Mock Logic for Demo ---
    const body = JSON.parse(options.body);
    const msg = body.message.toLowerCase();
    const mockSessionId = body.sessionId || `sess_${Math.random().toString(36).substr(2, 9)}`;

    // === KAM Controller Mocks ===
    if (endpoint.includes("/kam/chat")) {
        const merchantId = body.merchantId || "MERCHANT123";

        if (msg.includes("decline") || msg.includes("down")) {
            return {
                result: "success",
                sessionId: mockSessionId,
                merchantId,
                actionType: "sr_decline_analysis",
                response: `### Success Rate Decline Analysis 📉

**Comparison**:
*   **Current SR**: 90.0%
*   **Previous SR**: 95.0%
*   **Decline**: 5.0%

**Root Cause**:
Analysis of the failure trends shows a spike in \`GATEWAY_TIMEOUT\` errors from **Razorpay** starting at 14:00 yesterday. 

**Code Context**:
The routing logic for Merchant \`${merchantId}\` does not have an automatic failover configured for timeout exceptions under 45s.

**Recommendations**:
1.  **Switch Primary Gateway**: Move traffic to Stripe temporarily.
2.  **Update Config**: Lower the timeout threshold to 30s to trigger faster failovers.`
            };
        }
        
        if (msg.includes("margin") || msg.includes("profit") || msg.includes("revenue")) {
            return {
                result: "success",
                sessionId: mockSessionId,
                merchantId,
                actionType: "margin_analysis",
                response: `### Margin Analysis (Last 30 Days) 💰

**Metrics**:
*   **Total Revenue**: $100,000.00
*   **Total Fees**: $5,000.00
*   **Net Margin**: $95,000.00 (95.0%)
*   **Avg Margin/Txn**: $9.50

**Insights**:
Your margin is healthy at **95%**, which is 2% above the cohort average. Gateway fees for **Stripe** are slightly higher ($0.40/txn) compared to Razorpay ($0.35/txn), but Stripe's higher success rate justifies the cost.`
            };
        }

        if (msg.includes("config") || msg.includes("recommend") || msg.includes("optimize")) {
            return {
                result: "success",
                sessionId: mockSessionId,
                merchantId,
                actionType: "config_recommendation",
                response: `### Configuration Recommendations 🛠️

Based on your transaction history and failure patterns:

1.  **Routing Priority**:
    *   *Current*: Razorpay (100%)
    *   *Recommended*: Split 80/20 (Razorpay/Stripe) to keep Stripe warm for failovers.
    
2.  **Retry Logic**:
    *   Enable \`smart_retry\` for \`INSUFFICIENT_FUNDS\` errors. Analysis shows 15% of these succeed when retried after 1 hour.

3.  **Timeouts**:
    *   Reduce connection timeout from 60s to 30s.`
            };
        }

        // Default KAM Response (Success Rate)
        return {
            result: "success",
            sessionId: mockSessionId,
            merchantId,
            actionType: "success_rate_analysis",
            response: `### Success Rate Snapshot 📊

**Period**: Last 30 Days
**Merchant**: ${merchantId}

*   **Total Txns**: 10,000
*   **Successful**: 9,500
*   **Success Rate**: **95.0%**

**Trend**: Stable (+0.2% vs last period).
**Top Failure Reason**: \`INSUFFICIENT_FUNDS\` (3.2%)`
        };
    }

    // === DevOps Controller Mocks ===
    if (endpoint.includes("/devops/chat")) {
        const merchantId = body.merchantId || "M1001";
        const multiplier = body.saleSeasonMultiplier || 4;

        if (msg.includes("tps") || msg.includes("traffic") || msg.includes("load")) {
             return {
                result: "success",
                sessionId: mockSessionId,
                merchantId,
                actionType: "tps_analysis",
                response: `### TPS Analysis for Sale Season 🚀

**Merchant**: ${merchantId}
**Multiplier**: ${multiplier}x

*   **Current Total TPS**: 5,000
*   **Projected Peak TPS**: **${5000 * multiplier}**

**Service Breakdown**:
1.  **api-gateway**: Current Cap: 2000 | **Projected Need**: ${2000 * multiplier} (Critical ⚠️)
2.  **payment-gateway**: Current Cap: 500 | Projected Need: ${500 * multiplier}
3.  **ledger-service**: Current Cap: 8000 | Projected Need: ${8000 * multiplier} (Stable ✅)`
            };
        }

        if (msg.includes("scale") || msg.includes("scaling") || msg.includes("capacity")) {
             return {
                result: "success",
                sessionId: mockSessionId,
                merchantId,
                actionType: "scaling_recommendation",
                response: `### Scaling Recommendations 📈

To handle **${multiplier}x** traffic (${5000 * multiplier} TPS) for **${merchantId}**:

**Summary**:
*   **Services Needing Scaling**: 3
*   **Total Additional Instances**: 45

**Detailed Plan**:
| Service | Host Type | Current Instances | Recommended | Scaling Factor |
| :--- | :--- | :--- | :--- | :--- |
| **api-gateway** | EKS | 10 | **30** | 3.0x |
| **auth-service** | EKS | 5 | **15** | 3.0x |
| **payment-gateway** | EC2 | 8 | **25** | 3.1x |

**Recommendation**: Provision these resources 24 hours before the sale event.`
            };
        }

        if (msg.includes("cost") || msg.includes("price") || msg.includes("budget")) {
             return {
                result: "success",
                sessionId: mockSessionId,
                merchantId,
                actionType: "cost_analysis",
                response: `### Cost Estimation (Monthly) 💵

**Scenario**: ${multiplier}x Scaling for Sale Season

*   **Current Cost**: $12,500.50
*   **Projected Cost**: $31,250.75
*   **Additional Cost**: **+$18,750.25** (+150%)

**Breakdown**:
*   **Compute (EC2/EKS)**: +$12,000
*   **Database (RDS)**: +$4,500
*   **Caching (ElastiCache)**: +$2,250

*Note: Estimates based on on-demand pricing in us-east-1.*`
            };
        }

        if (msg.includes("path") || msg.includes("flow") || msg.includes("architecture")) {
            return {
               result: "success",
               sessionId: mockSessionId,
               merchantId,
               actionType: "transaction_path_analysis",
               response: `### Transaction Path Analysis 🛣️

**Merchant**: ${merchantId}

**Critical Path (Card Flow)**:
\`api-gateway\` → \`auth-service\` → \`risk-engine\` → \`payment-gateway\` → \`card-processor\` → \`ledger-service\`

**Dependencies**:
*   **risk-engine** adds 150ms latency (P99).
*   **ledger-service** is async (does not block response).
*   **card-processor** is external (Mastercard/Visa).`
           };
       }

       // Default DevOps Response
       return {
           result: "success",
           sessionId: mockSessionId,
           merchantId,
           actionType: "aws_architect_recommendation",
           response: `### AWS Architect Recommendations ☁️

For Merchant **${merchantId}**:

1.  **Auto-Scaling**: Configure Target Tracking Scaling Policies on CPU utilization (target 50%) for \`api-gateway\`.
2.  **Database**: Enable Read Replicas for \`payment-db\` to offload read traffic during the sale.
3.  **Caching**: Increase ElastiCache node type to \`cache.r6g.large\` to handle session surges.
4.  **Resilience**: Ensure Multi-AZ is enabled for all critical services.`
       };
    }

    // === Generic MCP Chat Mocks ===
    let response: ChatResponse = {
        result: "success",
        sessionId: mockSessionId,
        response: "I didn't understand that request.",
        actionType: "general"
    };

    if (msg.includes("rca") || msg.includes("txn")) {
        response = {
            result: "success",
            sessionId: mockSessionId,
            actionType: "rca",
            response: `### Root Cause Analysis: TXN_MOCK_123

**Status**: ❌ FAILED  
**Gateway**: Razorpay  
**Reason**: GATEWAY_TIMEOUT

**Analysis**:
1. **Gateway Logs**: Razorpay API responded with 504 Gateway Timeout after 30s.
2. **Merchant Config**: Merchant M12345 has a timeout threshold of 30s.
3. **Infrastructure**: No internal network latency detected.

**Recommendation**:
* Retry transaction (Safe to retry).
* Temporarily route M12345 traffic to PayU.`
        };
    } else if (msg.includes("log")) {
        response = {
            result: "success",
            sessionId: mockSessionId,
            actionType: "log_search",
            response: `**Found 3 related logs:**

- \`2024-01-01 12:05:01 [ERROR] payment-service\`: Connection reset by peer: Razorpay API
- \`2024-01-01 12:05:05 [WARN] routing-service\`: High latency detected on primary gateway
- \`2024-01-01 12:05:15 [ERROR] payment-service\`: Transaction limit exceeded for Merchant M99`
        };
    } else if (msg.includes("code") || msg.includes("function")) {
        response = {
            result: "success",
            sessionId: mockSessionId,
            actionType: "code_search",
            response: `Found relevant code in **PaymentRouter.java**:

\`\`\`java
public class PaymentRouter {
    public Gateway selectGateway(Merchant m) {
        if (m.isHighValue() && stripe.isHealthy()) {
            return Gateway.STRIPE;
        }
        return Gateway.RAZORPAY;
    }
}
\`\`\`

This logic confirms that high value merchants prefer Stripe.`
        };
    } else if (msg.includes("transaction") || msg.includes("trend")) {
        response = {
            result: "success",
            sessionId: mockSessionId,
            actionType: "analyze",
            response: `Based on the analysis of recent data:

1. **Transaction Trends**: Overall volume has stabilized at 125k daily.
2. **Gateway Performance**:
   * **Razorpay**: 95% Success Rate (Down 0.5%)
   * **Stripe**: 98% Success Rate (Stable)
3. **Recommendation**: Route high-value transactions to Stripe during peak hours.`
        };
    } else {
        response.response = `I'm connected to the Nexus MCP. I can help you with:
- **RCA** for failed transactions
- **Log searches** across services
- **Codebase queries**
- **Business analysis**`;
    }

    return response;
  }
};

const McpService = {
  chat: async (message: string, sessionId: string | null) => {
    return fetchWithMockFallback("/mcp/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId })
    });
  },
  kamChat: async (message: string, sessionId: string | null, merchantId: string) => {
    return fetchWithMockFallback("/kam/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId, merchantId })
    });
  },
  devopsChat: async (message: string, sessionId: string | null, merchantId: string, saleSeasonMultiplier: number) => {
    return fetchWithMockFallback("/devops/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId, merchantId, saleSeasonMultiplier })
    });
  }
};

// --- Persona Configurations ---

const PERSONAS: Record<PersonaType, PersonaConfig> = {
  KAM: {
    id: "KAM",
    name: "Key Account Manager",
    role: "Strategic Growth",
    icon: "fa-briefcase",
    color: "bg-indigo-600",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-900",
    borderColor: "border-indigo-200",
    description: "Analyze margins, success rates, and growth opportunities.",
    metrics: [
      { label: "Total Revenue", value: "$4.2M", trend: "+12%", trendUp: true },
      { label: "Avg Margin", value: "2.4%", trend: "+0.1%", trendUp: true },
      { label: "Success Rate", value: "98.2%", trend: "-0.5%", trendUp: false },
    ],
    suggestedPrompts: [
      "Why is my success rate going down?",
      "Show me margins for last 30 days.",
      "Recommend config changes to improve SR.",
    ],
  },
  SUPPORT: {
    id: "SUPPORT",
    name: "Support Engineer",
    role: "Incident Response",
    icon: "fa-headset",
    color: "bg-rose-600",
    bgColor: "bg-rose-50",
    textColor: "text-rose-900",
    borderColor: "border-rose-200",
    description: "RCA, transaction analysis, and incident debugging.",
    metrics: [
      { label: "Active Incidents", value: "2", trend: "High Priority", trendUp: false },
      { label: "Avg Response", value: "45ms", trend: "-5ms", trendUp: true },
      { label: "Error Rate", value: "0.04%", trend: "Stable", trendUp: true },
    ],
    suggestedPrompts: [
      "Run RCA for transaction TXN_MOCK_001.",
      "Search logs for 'Gateway Timeout' errors.",
      "Why are we seeing timeouts on Razorpay?",
    ],
  },
  DEVOPS: {
    id: "DEVOPS",
    name: "DevOps Engineer",
    role: "Infrastructure & Scale",
    icon: "fa-server",
    color: "bg-emerald-600",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-900",
    borderColor: "border-emerald-200",
    description: "Scaling estimations, cost analysis, and system health.",
    metrics: [
      { label: "Cluster Health", value: "99.99%", trend: "Healthy", trendUp: true },
      { label: "Est. Cost/Hr", value: "$42.50", trend: "+$2.10", trendUp: false },
      { label: "Auto-Scale", value: "Enabled", trend: "Max 50 Pods", trendUp: true },
    ],
    suggestedPrompts: [
      "What scaling do I need for sale season?",
      "What will be the cost for scaling infrastructure?",
      "Give me AWS architect recommendations.",
    ],
  },
  ANALYST: {
    id: "ANALYST",
    name: "Business Analyst",
    role: "Data Insights",
    icon: "fa-chart-line",
    color: "bg-violet-600",
    bgColor: "bg-violet-50",
    textColor: "text-violet-900",
    borderColor: "border-violet-200",
    description: "Trends, summaries, and data-driven recommendations.",
    metrics: [
      { label: "Daily Tx Vol", value: "125k", trend: "+5k", trendUp: true },
      { label: "User Retention", value: "85%", trend: "+2%", trendUp: true },
      { label: "Avg Ticket", value: "$120", trend: "Flat", trendUp: true },
    ],
    suggestedPrompts: [
      "Summarize transaction trends for Q3.",
      "Compare merchant performance: Region A vs Region B.",
      "Show all transactions > $1000 today.",
    ],
  },
};

// --- Components ---

const SidebarItem = ({
  persona,
  isActive,
  onClick,
}: {
  persona: PersonaConfig;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 mb-2 ${
      isActive
        ? `${persona.bgColor} ${persona.textColor} font-semibold shadow-sm ring-1 ring-inset ${persona.borderColor}`
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        isActive ? "bg-white/50" : "bg-gray-200"
      }`}
    >
      <i className={`fa-solid ${persona.icon}`}></i>
    </div>
    <div className="text-left hidden md:block">
      <div className="text-sm">{persona.name}</div>
      <div className="text-xs opacity-75 font-normal">{persona.role}</div>
    </div>
  </button>
);

const MetricCard = ({
  label,
  value,
  trend,
  trendUp,
}: {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}) => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
    <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
      {label}
    </div>
    <div className="flex items-end justify-between">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {trend && (
        <div
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            trendUp === true
              ? "bg-green-100 text-green-700"
              : trendUp === false
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {trend}
        </div>
      )}
    </div>
  </div>
);

const ChatMessage = ({ message, personaColor }: { message: Message, personaColor: string }) => {
  const isUser = message.role === "user";
  return (
    <div className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
          isUser
            ? "bg-gray-900 text-white rounded-br-none"
            : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        <div className={`whitespace-pre-wrap leading-relaxed text-sm markdown-body ${isUser ? "text-white" : "text-gray-800"}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
        </div>
        <div className="flex justify-between items-center mt-2">
            {message.actionType && !isUser && (
                 <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                     {message.actionType}
                 </span>
            )}
            <div
            className={`text-[10px] ml-auto ${
                isUser ? "text-gray-400" : "text-gray-400"
            }`}
            >
            {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

const App = () => {
  const [activePersonaId, setActivePersonaId] = useState<PersonaType>("KAM");
  const [selectedMerchantId, setSelectedMerchantId] = useState(MERCHANTS[0].id);
  const [saleSeasonMultiplier, setSaleSeasonMultiplier] = useState<number>(4);

  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Record<PersonaType, Message[]>>({
    KAM: [],
    SUPPORT: [],
    DEVOPS: [],
    ANALYST: [],
  });
  // Maintain separate sessions for each persona
  const [sessions, setSessions] = useState<Record<PersonaType, string | null>>({
    KAM: null,
    SUPPORT: null,
    DEVOPS: null,
    ANALYST: null,
  });

  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activePersona = PERSONAS[activePersonaId];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, activePersonaId]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      text: text,
      timestamp: new Date(),
    };

    // Optimistic update
    setChatHistory((prev) => ({
      ...prev,
      [activePersonaId]: [...prev[activePersonaId], userMsg],
    }));
    setInput("");
    setLoading(true);

    try {
        // Get session ID for current persona
        const currentSessionId = sessions[activePersonaId];
        let data: ChatResponse;

        if (activePersonaId === "KAM") {
            // Pass selected merchant ID to the API
            data = await McpService.kamChat(text, currentSessionId, selectedMerchantId);
        } else if (activePersonaId === "DEVOPS") {
             // Pass merchant ID and Multiplier to DevOps API
             data = await McpService.devopsChat(text, currentSessionId, selectedMerchantId, saleSeasonMultiplier);
        } else {
            // Unified call to generic MCP Chat Endpoint for other personas
            data = await McpService.chat(text, currentSessionId);
        }
        
        if (data.result === 'error') {
            throw new Error(data.error || "Unknown error from server");
        }

        // Update Session ID if new one provided
        if (data.sessionId && data.sessionId !== currentSessionId) {
            setSessions(prev => ({
                ...prev,
                [activePersonaId]: data.sessionId
            }));
        }

        const modelMsg: Message = {
            role: "model",
            text: data.response,
            timestamp: new Date(),
            actionType: data.actionType
        };

        setChatHistory((prev) => ({
            ...prev,
            [activePersonaId]: [...prev[activePersonaId], modelMsg],
        }));

    } catch (error) {
      console.error("MCP Chat Error:", error);
      const errorMsg: Message = {
        role: "model",
        text: `Error: ${error.message || "Failed to connect to MCP Chat System."}`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => ({
        ...prev,
        [activePersonaId]: [...prev[activePersonaId], errorMsg],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Sidebar */}
      <div className="w-20 md:w-64 bg-gray-50 border-r border-gray-200 flex flex-col p-4 flex-shrink-0">
        <div className="mb-8 flex items-center justify-center md:justify-start gap-3 px-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg shadow-lg flex items-center justify-center text-white font-bold">
                <i className="fa-solid fa-layer-group"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block tracking-tight">Nexus<span className="text-indigo-600">AI</span></h1>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="text-xs font-semibold text-gray-400 mb-4 px-2 hidden md:block uppercase tracking-wider">
            Personas
          </div>
          {Object.values(PERSONAS).map((persona) => (
            <SidebarItem
              key={persona.id}
              persona={persona}
              isActive={activePersonaId === persona.id}
              onClick={() => setActivePersonaId(persona.id as PersonaType)}
            />
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200">
           <div className="hidden md:flex items-center gap-3 px-2 py-2 text-gray-500 text-xs">
                <i className="fa-solid fa-network-wired"></i>
                <div className="flex flex-col ml-1">
                    <span>MCP Chat System</span>
                    <span className="text-[10px] text-gray-400">
                        {sessions[activePersonaId] ? 'Session Active' : 'Ready'}
                    </span>
                </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header with Dashboard Metrics */}
        <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md p-6 z-10">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{activePersona.name} Dashboard</h2>
                    <p className="text-gray-500 text-sm mt-1">{activePersona.description}</p>
                </div>
                
                {/* Right Controls: Persona Icon & Inputs */}
                <div className="flex items-center gap-3">
                    
                    {/* Scaling Multiplier (DevOps Only) */}
                    {activePersonaId === 'DEVOPS' && (
                        <div className="flex flex-col items-end mr-2">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Scale Multiplier</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="20"
                                    value={saleSeasonMultiplier}
                                    onChange={(e) => setSaleSeasonMultiplier(parseInt(e.target.value) || 1)}
                                    className="w-16 bg-white border border-gray-200 text-gray-700 py-1.5 px-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-center font-semibold"
                                />
                                <span className="absolute right-2 top-1.5 text-gray-400 text-xs font-bold">x</span>
                            </div>
                        </div>
                    )}

                    {/* Merchant Selector (KAM & DevOps) */}
                    {(activePersonaId === 'KAM' || activePersonaId === 'DEVOPS') && (
                         <div className="flex flex-col items-end">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Target Merchant</label>
                            <div className="relative">
                                <select
                                    value={selectedMerchantId}
                                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                                    className={`appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 shadow-sm cursor-pointer max-w-[160px] truncate ${activePersonaId === 'KAM' ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
                                >
                                    {MERCHANTS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <i className="fa-solid fa-chevron-down text-xs"></i>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activePersona.bgColor} ${activePersona.textColor} ml-1`}>
                        <i className={`fa-solid ${activePersona.icon}`}></i>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activePersona.metrics.map((metric, idx) => (
                    <MetricCard key={idx} {...metric} />
                ))}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
          {chatHistory[activePersonaId].length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <i className={`fa-solid ${activePersona.icon} text-6xl mb-4 ${activePersona.textColor} opacity-20`}></i>
                <p>Ready to assist with {activePersona.role} tasks.</p>
            </div>
          ) : (
            chatHistory[activePersonaId].map((msg, idx) => (
              <ChatMessage key={idx} message={msg} personaColor={activePersona.color} />
            ))
          )}
          
          {/* Loading Indicator */}
          {loading && (
             <div className="flex w-full mb-6 justify-start">
                 <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Orchestrating response...</span>
                 </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100">
           {/* Suggestions */}
           {chatHistory[activePersonaId].length === 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {activePersona.suggestedPrompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(prompt)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-full whitespace-nowrap transition-colors"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
           )}

          <div className="relative flex items-end gap-2 border border-gray-200 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all p-2">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask the ${activePersona.name}...`}
                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-sm text-gray-800 placeholder-gray-400"
                rows={1}
            />
            <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    input.trim() && !loading
                        ? `${activePersona.color} text-white hover:opacity-90 shadow-md`
                        : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
            >
                <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-400">Powered by Unified MCP Chat</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);