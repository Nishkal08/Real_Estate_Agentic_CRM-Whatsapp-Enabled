import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from kb.vector_store import get_engine
from sqlalchemy import text

engine = get_engine()

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT c.name, e.document as snippet
        FROM langchain_pg_embedding e
        JOIN langchain_pg_collection c ON c.uuid = e.collection_id
        WHERE c.name = 'kb_abc57a29_99f8_4891_9749_df9126f0b22d'
        LIMIT 5
    """))
    docs = result.fetchall()
    print("Sample docs from business KB:")
    for d in docs:
        print("Collection:", d[0])
        print("Snippet:", str(d[1])[:200])
        print("---")
