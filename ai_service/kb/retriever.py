from typing import Tuple, List
import re
from kb.ingestion.pdf_ingestor import get_chroma_db
from langchain_mistralai import ChatMistralAI
from config.settings import settings

def generate_query_variants(query: str) -> List[str]:
    """Generate 3 semantic variations of the query for better semantic coverage."""
    try:
        llm = ChatMistralAI(
            model="mistral-small-latest",
            api_key=settings.mistral_api_key,
            temperature=0.2,
            max_tokens=150
        )
        prompt = (
            "You are a helpful assistant that generates search query variations for real estate projects.\n"
            "Given the user query below, generate exactly 3 variations of this query that capture different semantic "
            "meanings, synonyms, or facets of the user's intent (such as pricing, location, configuration, images, brochures).\n"
            "Respond ONLY with the 3 variations, one per line, without any numbering, bullet points, intro, or explanation.\n\n"
            f"User Query: {query}"
        )
        response = llm.invoke(prompt)
        variants = [line.strip() for line in response.content.split("\n") if line.strip()]
        
        # Filter out numbers/bullets if the model output them anyway
        clean_variants = []
        for v in variants[:3]:
            # Strip leading numbers like "1. ", "2) ", "- "
            v_clean = re.sub(r'^[\d\-\*\•\)\.\s]+', '', v).strip()
            if v_clean:
                clean_variants.append(v_clean)
        return clean_variants
    except Exception as e:
        print(f"Error generating query variants: {e}")
        return []

def retrieve_context(query: str, kb_id: str) -> Tuple[str, List[str]]:
    """Native LangChain MMR retrieval with query expansion."""
    try:
        kb_id_clean = kb_id or "main-kb"
        if kb_id_clean == "null" or kb_id_clean == "None":
            kb_id_clean = "main-kb"
        vectorstore = get_chroma_db(kb_id_clean)
        
        # Generate variations for query expansion
        variants = generate_query_variants(query)
        queries = [query] + variants
        print(f"Expanding query: '{query}' -> {queries}")
        
        retriever = vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 4, "fetch_k": 15, "lambda_mult": 0.5}
        )
        
        all_docs = []
        for q in queries:
            docs = retriever.invoke(q)
            all_docs.extend(docs)
            
        # Deduplicate docs by page_content
        seen_contents = set()
        unique_docs = []
        for doc in all_docs:
            content_hash = doc.page_content.strip()
            if content_hash not in seen_contents:
                seen_contents.add(content_hash)
                unique_docs.append(doc)
                
        # Project filtering to prevent cross-contamination
        projects = [
            ("eden", ["eden"]),
            ("dear life", ["dear life", "dear_life", "jagatpur"]),
            ("page 22", ["page 22", "page_22", "page22"]),
            ("levvel 7", ["levvel 7", "levvel_7", "levvel7"]),
            ("forever young", ["forever young", "forever_young", "ognaj"]),
            ("cornerstone", ["cornerstone", "codename cornerstone", "codename_cornerstone"]),
            ("life in blue", ["life in blue", "life_in_blue"])
        ]
        
        query_lower = query.lower()
        active_projects = []
        for proj_id, keywords in projects:
            if any(kw in query_lower for kw in keywords):
                active_projects.append(proj_id)
                
        filtered_docs = []
        for doc in unique_docs:
            content_lower = doc.page_content.lower()
            source_lower = doc.metadata.get("source", "").lower() if doc.metadata else ""
            
            is_mismatched = False
            for proj_id, keywords in projects:
                if proj_id not in active_projects:
                    if any(kw in content_lower or kw in source_lower for kw in keywords):
                        is_mismatched = True
                        break
                        
            if active_projects and is_mismatched:
                has_active_kw = False
                for proj_id in active_projects:
                    proj_kws = next(kws for pid, kws in projects if pid == proj_id)
                    if any(kw in content_lower or kw in source_lower for kw in proj_kws):
                        has_active_kw = True
                        break
                if not has_active_kw:
                    continue
                    
            filtered_docs.append(doc)
            
        # Limit to top 6 unique documents
        unique_docs = filtered_docs[:6]
        
        context_str = "\n\n".join([doc.page_content for doc in unique_docs])
        sources = list(set([doc.metadata.get("source", "Unknown") for doc in unique_docs]))
        return context_str, sources
    except Exception as e:
        print(f"Retrieval error: {e}")
        return "", []
