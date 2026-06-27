import sys, urllib.request, json, time
sys.stdout.reconfigure(encoding='utf-8')

# Wait for server to start
time.sleep(3)

def ask(msg, kb_id, thread="test-kb-real-001"):
    payload = json.dumps({
        'thread_id': thread,
        'business_id': 'test-biz',
        'lead_id': 'test-lead',
        'lead_name': 'Nishkal',
        'message': msg,
        'kb_id': kb_id,
        'campaign_config': {}
    }).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/agent/message', data=payload)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            data = json.loads(r.read())
            return data.get('reply', ''), data.get('stage', ''), data.get('qualification_score', 0)
    except Exception as e:
        return f"ERROR: {e}", "", 0

print("=" * 60)
print("TEST 1: Using real KB ID (should return project info)")
reply, stage, score = ask(
    "Tell me about Life In Blue project price and config",
    "abc57a29-99f8-4891-9749-df9126f0b22d"
)
print(f"Stage: {stage} | Score: {score}")
print("Reply:", reply[:600])
print()

print("=" * 60)
print("TEST 2: Using main-kb (should fail - empty collection)")
reply2, stage2, score2 = ask(
    "Tell me about Life In Blue project price and config",
    "main-kb",
    "test-main-kb-001"
)
print(f"Stage: {stage2} | Score: {score2}")
print("Reply:", reply2[:300])
print()

print("=" * 60)
print("TEST 3: List documents for real KB")
req3 = urllib.request.Request('http://127.0.0.1:8000/kb/abc57a29-99f8-4891-9749-df9126f0b22d/documents')
try:
    with urllib.request.urlopen(req3, timeout=10) as r:
        data3 = json.loads(r.read())
        docs = data3.get('data', [])
        print(f"Found {len(docs)} document sources:")
        for d in docs:
            print(f"  - {d['name']} ({d['chunks']} chunks)")
except Exception as e:
    print(f"ERROR: {e}")
