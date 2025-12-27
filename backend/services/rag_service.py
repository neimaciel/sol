from core.config import get_settings

settings = get_settings()

from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import os
from core.config import get_settings

settings = get_settings()

class RAGService:
    def __init__(self):
        self.index_path = "faiss_index"
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.GEMINI_API_KEY)
        self.vector_store = self._load_or_create_index()

    def _load_or_create_index(self):
        if os.path.exists(self.index_path):
            return FAISS.load_local(self.index_path, self.embeddings, allow_dangerous_deserialization=True)
        return None

    async def add_document(self, text: str, metadata: dict = None):
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = [Document(page_content=x, metadata=metadata or {}) for x in text_splitter.split_text(text)]
        
        if self.vector_store:
            self.vector_store.add_documents(docs)
        else:
            self.vector_store = FAISS.from_documents(docs, self.embeddings)
            
        self.vector_store.save_local(self.index_path)

    async def search_context(self, query: str, limit: int = 3) -> str:
        if not self.vector_store:
            return "Nenhuma informação encontrada na base de conhecimento."
            
        docs = self.vector_store.similarity_search(query, k=limit)
        return "\n\n".join([d.page_content for d in docs])

rag_service = RAGService()
