import os
import sys
# Insert path to allow imports from root of ai_service
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(env_path)

from langchain_core.documents import Document
from kb.ingestion.pdf_ingestor import get_chroma_db
from kb.manager import delete_collection

def ingest_real_estate_data():
    kb_id = "main-kb"
    print(f"Clearing collection {kb_id} first...")
    # try:
    #     delete_collection(kb_id)
    #     print("Collection cleared.")
    # except Exception as e:
    #     print(f"Error clearing collection (might not exist): {e}")

    print(f"Ingesting real estate project data into Chroma collection: {kb_id}...")
    
    documents = [
        # Levvel 7 Details
        Document(
            page_content="""
Project Name: Levvel 7
Developer: Reneev Developer Group (Reneev Developers / Forever Infra)
Location: Beside Nirma Lake, Jagatpur, Ahmedabad, Gujarat, India.
Project Type: Exclusive premium low-rise residential and mixed-use development.
Configuration & Scale: 7 low-rise floors featuring a total of 28 limited-edition luxury homes and 13 retail shops (41 total units).
Apartment Configurations: Premium 3 BHK apartments.
Sizes:
 - Type A: 303 square yards (sq. yd.)
 - Type B: 339 square yards (sq. yd.)
Key Features & Amenities: Private lifts, basement parking, extended premium balconies designed to function as an additional lounge area, landscaped garden, gated community security, and modern clubhouse facilities.
Pricing: Pricing starts from ₹1.36 Crore onwards, ranging typically between ₹1.32 Crore and ₹1.52 Crore depending on floor rise and unit type.
Possession Date: Under construction, with expected completion and possession by November 2027.
RERA Registration Number: PR/GJ/AHMEDABAD/AHMEDABAD CITY/Ahmedabad Municipal Corporation/MAA14890/A1M/281125/151127.
Official Website: levvel7.reneevdevelopers.com
            """.strip(),
            metadata={"source": "official_brochure_levvel_7"}
        ),
        
        # Forever Young Details
        Document(
            page_content="""
Project Name: Forever Young
Developer: Reneev Developer Group (Reneev Developers / Forever Infra)
Location: Near Lions Karnavati Hospital, Ognaj Circle, S.P. Ring Road, Ahmedabad, Gujarat, India.
Project Type: Premium gated community of luxury bungalows.
Configuration: Exclusive 4 BHK luxury bungalows / villas.
Key Features & Amenities: Private elevator/lift in each villa, dedicated basement parking, gated community security, landscaped green zones, clubhouse, and top-tier interior and exterior finishes.
Pricing: Starts from ₹2.50 Crore onwards depending on configuration and villa specifications.
Possession Date: Under construction, with expected possession by December 2027.
RERA Registration Number: PR/GJ/AHMEDABAD/DASKROI/Ahmedabad Municipal Corporation/RAA13216/300324/151227.
Official Website: reneevdevelopers.com
            """.strip(),
            metadata={"source": "official_brochure_forever_young"}
        ),
        
        # Codename Cornerstone Details
        Document(
            page_content="""
Project Name: Codename Cornerstone (Cornerstone)
Developer: Reneev Developer Group (Reneev Developers)
Location: Jagatpur, Ahmedabad, Gujarat, India.
Project Type: Premium residential apartments and penthouses.
Configuration: Premium 3 BHK apartments and 3 BHK & 4 BHK luxury penthouses.
Key Features & Amenities: Modern architecture, high-speed elevators, children's play area, fully-equipped fitness center, multipurpose hall, and 24/7 security.
Pricing: Starts from ₹1.20 Crore onwards.
Possession Date: Expected possession in late 2027.
RERA Status: Applied and registered.
Official Website: reneevdevelopers.com
            """.strip(),
            metadata={"source": "official_brochure_codename_cornerstone"}
        ),
        
        # Developer Group General Context
        Document(
            page_content="""
Developer Group: Reneev Developer Group & Dobariya Developer Group
Reneev Developer Group is a highly trusted and reputed real estate developer based in Ahmedabad, known for projects that prioritize modern design, sustainable living, top-quality construction, and prime locations (such as Jagatpur, Ognaj, Vaishnodevi, and Prahladnagar).
Dobariya Developer Group is a joint developing partner group that has collaborated on numerous key residential and commercial schemes across Ahmedabad, delivering projects with high customer satisfaction and transparency.
Office Address: Prahladnagar, Ahmedabad, Gujarat, India.
            """.strip(),
            metadata={"source": "developer_profile"}
        )
    ]
    
    try:
        vectorstore = get_chroma_db(kb_id)
        vectorstore.add_documents(documents)
        print(f"[SUCCESS] Successfully ingested {len(documents)} project detail documents into Chroma DB!")
    except Exception as e:
        print(f"[ERROR] Failed to ingest documents: {e}")

if __name__ == "__main__":
    ingest_real_estate_data()
