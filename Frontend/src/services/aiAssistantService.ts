import { mineGuardContext } from './mineGuardContext';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class AIAssistantService {
  private conversationHistory: Message[] = [];
  
  private getSystemPrompt(): string {
    const contextStr = mineGuardContext.getContextSnapshot();
    return `You are MineGuard AI Assistant.

You are an AI assistant for an underground mine subsidence monitoring and early-warning system.

Your role is to explain the current MineGuard application state using ONLY the MineGuard context supplied to you.

You can explain:
- nodes
- node measurements
- node health
- deformation
- IDW interpolation
- risk scores
- risk levels
- risk zones
- alerts
- environmental telemetry
- simulation state
- mine/panel status

Never invent information.

Clearly distinguish between:
1. Node observations/current readings
2. IDW spatially interpolated deformation
3. ML model predictions
4. Risk-zone classifications
5. Alerts

If the application is using mock/simulation data, explicitly say that the values are simulated prototype data.

Do not claim that a mine is actually unsafe based only on simulated data.

When explaining risk, use the actual available measurements and model outputs.

If a requested value is not present in the supplied context, say that it is unavailable.

Answer in a concise, professional style suitable for a mine monitoring dashboard.

Format your responses using Markdown. If returning specific node data, you can format it nicely.

CURRENT MINEGUARD CONTEXT:
${contextStr}
`;
  }

  public async askMineGuardAssistant(question: string): Promise<string> {
    const systemPrompt = this.getSystemPrompt();
    
    // Build messages payload
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory,
      { role: 'user', content: question }
    ];

    const apiUrl = import.meta.env.VITE_AI_API_URL || 'http://localhost:11434';
    const modelName = import.meta.env.VITE_AI_MODEL || 'qwen3:4b-instruct'; // Can be customized in .env

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const answer = data.message?.content || "I couldn't process that response.";

      // Save to history
      this.conversationHistory.push({ role: 'user', content: question });
      this.conversationHistory.push({ role: 'assistant', content: answer });

      return answer;
    } catch (error) {
      console.error('Error querying local LLM:', error);
      return this.fallbackResponse(question);
    }
  }

  public clearHistory() {
    this.conversationHistory = [];
  }

  public async checkConnection(): Promise<boolean> {
    const apiUrl = import.meta.env.VITE_AI_API_URL || 'http://localhost:11434';
    try {
      // Just check if Ollama is running
      const response = await fetch(apiUrl);
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  private fallbackResponse(question: string): string {
    const q = question.toLowerCase();
    const state = mineGuardContext.getRawState();
    
    let answer = "**[Local MineGuard summary]**\n\n";

    if (q.includes('status') || q.includes('summary')) {
      const online = state.nodes.filter(n => n.status !== 'offline').length;
      const critical = state.nodes.filter(n => n.status === 'critical').length;
      answer += `The mine is currently ${state.isSimulating ? 'SIMULATING data' : 'monitoring'}. There are ${online}/${state.nodes.length} nodes online. ${critical} nodes are in critical status.`;
    } else if (q.includes('displacement')) {
      const validNodes = state.nodes.filter(n => n.displacement !== undefined);
      if (validNodes.length === 0) return answer + "No node data available.";
      const maxDisp = [...validNodes].sort((a, b) => b.displacement! - a.displacement!)[0];
      answer += `Node **${maxDisp.id}** has the highest displacement at **${maxDisp.displacement}mm**.`;
    } else if (q.includes('risk') || q.includes('dangerous')) {
      if (state.nodes.length === 0) return answer + "No node data available.";
      const maxRisk = [...state.nodes].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0];
      answer += `Node **${maxRisk.id}** has the highest risk score (**${maxRisk.riskScore}%**, ${maxRisk.status}).`;
    } else if (q.includes('alerts')) {
      const highRisk = state.nodes.filter(n => n.status === 'high' || n.status === 'critical');
      if (highRisk.length === 0) {
        answer += "There are no critical alerts right now.";
      } else {
        answer += `There are ${highRisk.length} active alerts. Most severe is from **${highRisk[0].id}** (${highRisk[0].status}).`;
      }
    } else {
      answer += "I'm currently running in fallback mode (Local LLM unreachable). I can only answer basic queries about status, displacement, risk, and alerts.";
    }

    // Save to history so user sees it in the chat
    this.conversationHistory.push({ role: 'user', content: question });
    this.conversationHistory.push({ role: 'assistant', content: answer });

    return answer;
  }
}

export const aiAssistantService = new AIAssistantService();
