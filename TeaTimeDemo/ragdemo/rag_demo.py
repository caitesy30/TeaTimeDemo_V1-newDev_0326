# rag_demo.py
# 👑 世界最頂RAG範例，全本地端不用API Key，完整中文註解

from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.llms import Ollama  # 用本地 Ollama
from langchain.chains import RetrievalQA

# 1. 讀取你的知識文件
loader = TextLoader("your_knowledge.txt", encoding="utf-8")
documents = loader.load()

# 2. 文件切割（預設一段1000字）
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
docs = text_splitter.split_documents(documents)

# 3. 建立本地向量資料庫（不用API Key！）
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = Chroma.from_documents(docs, embeddings)

# 4. 本地 Ollama 模型
llm = Ollama(model="qwen2.5:14b")  # 這裡直接呼叫本地的 ollama（你可改成本地的任何模型）

# 5. 建立 Retrieval QA Chain
qa = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever()
)

# 6. 試著問一個問題
query = "你的知識裡提到哪些關鍵重點？"
result = qa.invoke(query)  # 新版推薦用 invoke
print(f"【AI回答】{result}")
