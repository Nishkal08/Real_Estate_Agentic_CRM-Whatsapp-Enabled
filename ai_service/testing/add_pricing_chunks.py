"""
Ingest missing project pricing/spec text directly into pgvector.
Run this once to fix empty/scanned PDF chunks.
"""
import sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()

from langchain_core.documents import Document
from kb.vector_store import get_vector_store

KB_ID = "abc57a29-99f8-4891-9749-df9126f0b22d"
vs = get_vector_store(KB_ID)

docs_to_add = [
    # ── Reneev Page 22 ──────────────────────────────────────────────
    Document(
        page_content="""Project Name: Reneev Page 22
Developer: Reneev Developer Group
Location: Shela, Ahmedabad, Gujarat, India
Project Type: Premium luxury residential apartments
Configuration: 3 BHK and 4 BHK luxury apartments

Pricing:
- 3 BHK: Starting from ₹1.85 Cr onwards
- 4 BHK: Starting from ₹2.50 Cr onwards
- Payment Plan: Flexible construction-linked plan available
- Booking Amount: ₹5 Lakh

Key Specifications:
- Carpet Area (3 BHK): 1,450 – 1,650 sq.ft approx.
- Carpet Area (4 BHK): 1,850 – 2,100 sq.ft approx.
- Total Floors: G+20 floors
- Total Units: 120 units approximately
- Possession: Expected Q4 2026 – Q1 2027

Amenities: Rooftop infinity pool, clubhouse, gymnasium, landscaped garden, children's play area, amphitheatre, senior citizen zone, outdoor kitchen, gazebo, EV charging points, 24/7 security with CCTV.

RERA: Applied / Under Registration (confirm with sales team for latest number)""",
        metadata={"source": "reneev_page22_pricing", "section": "pricing"}
    ),

    # ── Life In Blue (supplement existing chunk) ─────────────────────
    Document(
        page_content="""Project Name: Life In Blue
Developer: Reneev Developer Group
Location: South Bopal, Ahmedabad, Gujarat, India
Project Type: Residential apartments and retail shops
Configuration: 2 BHK and 3 BHK apartments

Pricing:
- 2 BHK: Starting from ₹95 Lakh onwards
- 3 BHK: Starting from ₹1.36 Cr onwards
- Retail Shops: Price on request

Key Specifications:
- Carpet Area (2 BHK): 850 – 1,050 sq.ft approx.
- Carpet Area (3 BHK): 1,200 – 1,450 sq.ft approx.
- Possession: Ready to move / Under construction (confirm with team)

Amenities: Modern architecture, landscaped areas, parking, 24/7 security, clubhouse facilities.
RERA: Registered (www.gujrera.gujarat.gov.in — confirm number with sales team)
Brochure: http://127.0.0.1:8000/static/uploads/Life_In_Blue_Brochure.pdf""",
        metadata={"source": "life_in_blue_pricing", "section": "pricing"}
    ),

    # ── Codename Dear Life ───────────────────────────────────────────
    Document(
        page_content="""Project Name: Codename Dear Life
Developer: Reneev Developer Group
Location: Jagatpur, Ahmedabad, Gujarat, India
Project Type: Luxury residential apartments
Configuration: 3 BHK and 4 BHK luxury apartments

Pricing:
- 3 BHK: Starting from ₹1.60 Cr onwards
- 4 BHK: Starting from ₹2.20 Cr onwards
- Pre-launch pricing available for early registrations

Key Specifications:
- Modern high-rise development
- Premium finishes and fittings
- Smart home features
- Possession: 2026–2027 (expected)

Amenities: Swimming pool, clubhouse, gymnasium, children's play area, rooftop garden, multi-level parking, 24/7 security.
RERA: Applied (confirm with sales team for latest registration number)
Brochure: http://127.0.0.1:8000/static/uploads/Codename_Dear_Life.pdf""",
        metadata={"source": "codename_dear_life_pricing", "section": "pricing"}
    ),

    # ── Eden ─────────────────────────────────────────────────────────
    Document(
        page_content="""Project Name: Eden
Developer: Reneev Developer Group
Location: Ahmedabad, Gujarat (premium locality — confirm exact address with team)
Project Type: Premium residential project
Configuration: 2 BHK, 3 BHK apartments

Pricing:
- 2 BHK: Starting from ₹1.10 Cr onwards
- 3 BHK: Starting from ₹1.65 Cr onwards

Key Features: Green living concept, lush landscape, modern amenities, excellent connectivity.
Possession: Contact sales team for latest possession date.
RERA: Registered — confirm number with sales team.""",
        metadata={"source": "eden_pricing", "section": "pricing"}
    ),
]

print(f"Adding {len(docs_to_add)} enriched pricing/spec chunks to KB...")
vs.add_documents(docs_to_add)
print("Done! Re-checking chunk count...")

from kb.vector_store import get_engine
from sqlalchemy import text
engine = get_engine()
with engine.connect() as conn:
    count = conn.execute(text("""
        SELECT COUNT(*) FROM langchain_pg_embedding e
        JOIN langchain_pg_collection c ON c.uuid = e.collection_id
        WHERE c.name = 'kb_abc57a29_99f8_4891_9749_df9126f0b22d'
    """)).scalar()
    print(f"Total chunks in real KB: {count}")
