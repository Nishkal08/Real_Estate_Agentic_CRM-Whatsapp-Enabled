import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()

from agents.graph import build_agent_graph

print('Building graph...')
g = build_agent_graph()
print('[OK] Graph built')

print('Running test message...')
state = {
    'messages': [{'role': 'lead', 'content': 'Tell me about Life In Blue project'}],
    'agent_name': 'Pranjal',
    'agent_tone': 'friendly',
    'language': 'en',
    'kb_id': 'main-kb',
    'lead_name': 'Test User',
    'stage': 'opener',
    'qualification_score': 0,
    'sentiment': 'neutral',
    'intent_signals': [],
    'conversation_summary': ''
}
config = {'configurable': {'thread_id': 'test-001'}}
try:
    result = g.invoke(state, config=config)
    reply = result.get('last_agent_message', '')
    print(f'[OK] Agent replied ({len(reply)} chars):')
    print(reply[:500])
except Exception as e:
    import traceback
    print(f'[ERROR] Agent failed: {e}')
    traceback.print_exc()
