const ApiError = require('../utils/apiError');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Call the AI agent service for a conversation reply
 * Gracefully returns a fallback if AI service is unreachable
 */
async function callAgent({ threadId, businessId, leadId, leadName, message, kbId, campaignConfig }) {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/agent/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id:       threadId,
        business_id:     businessId,
        lead_id:         leadId,
        lead_name:       leadName || "Unknown",
        message,
        kb_id:           kbId,
        campaign_config: campaignConfig,
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!res.ok) {
      console.error(`[AgentService] AI service returned ${res.status}`);
      throw new Error('AI service error');
    }

    return await res.json();
    // Expected: { reply, stage, qualification_score, needs_human, intent_signals }
  } catch (err) {
    console.warn('[AgentService] AI service unreachable, returning fallback:', err.message);
    return {
      reply:               'Thank you for your message. Our team will get back to you shortly.',
      stage:               'fallback',
      qualification_score: 0,
      needs_human:         true,
      intent_signals:      [],
    };
  }
}

/**
 * Call AI service to generate content
 */
async function generateContent({ type, brief, tone, platforms }) {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/content/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, brief, tone, platforms }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) throw new Error('AI service error');
    return await res.json();
  } catch (err) {
    console.warn('[AgentService] Content generation unavailable:', err.message);
    return {
      whatsapp:  'AI content generation is currently unavailable. Please try again later.',
      instagram: 'AI content generation is currently unavailable. Please try again later.',
      linkedin:  'AI content generation is currently unavailable. Please try again later.',
      sms:       'AI content generation is currently unavailable. Please try again later.',
      email:     'AI content generation is currently unavailable. Please try again later.',
    };
  }
}

module.exports = { callAgent, generateContent };
