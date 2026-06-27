import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from kb.vector_store import get_engine
from sqlalchemy import text

engine = get_engine()
REAL_KB = 'kb_abc57a29_99f8_4891_9749_df9126f0b22d'

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT e.document as doc
        FROM langchain_pg_embedding e
        JOIN langchain_pg_collection c ON c.uuid = e.collection_id
        WHERE c.name = :coll
        ORDER BY e.id
    """), {"coll": REAL_KB}).fetchall()
    
    print(f"Total chunks: {len(result)}\n")
    for i, row in enumerate(result):
        content = str(row[0])
        print(f"--- CHUNK {i+1} ---")
        print(content[:400])
        print()
