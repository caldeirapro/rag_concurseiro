-- Habilita a extensão pgvector para trabalhar com busca vetorial
create extension if not exists vector;

-- Cria a tabela para armazenar os documentos e seus embeddings vetoriais
create table if not exists exam_documents (
  id bigserial primary key,
  content text not null,              -- Texto do trecho do documento (chunk)
  metadata jsonb,                     -- Metadados (concurso, matéria, link, etc.)
  embedding vector(768)               -- Embeddings do Gemini (text-embedding-004 usa 768 dimensões)
);

-- Cria um índice HNSW (Hierarchical Navigable Small World) para buscas vetoriais rápidas
create index if not exists exam_documents_embedding_hnsw_idx 
on exam_documents 
using hnsw (embedding vector_cosine_ops);

-- Função de banco de dados para buscar documentos por similaridade de cosseno
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    exam_documents.id,
    exam_documents.content,
    exam_documents.metadata,
    1 - (exam_documents.embedding <=> query_embedding) as similarity
  from exam_documents
  where 1 - (exam_documents.embedding <=> query_embedding) > match_threshold
  order by exam_documents.embedding <=> query_embedding asc
  limit match_count;
$$;
