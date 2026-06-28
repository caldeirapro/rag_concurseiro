import * as fs from 'fs';
import * as path from 'path';
import { getEmbedding } from '../lib/gemini';
import { getSupabaseAdmin } from '../lib/supabase';

// Carrega variáveis do arquivo .env.local manualmente caso o Node antigo não suporte --env-file
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnvLocal();

const DATA_DIR = path.join(process.cwd(), 'data');

// Função simples para dividir texto em chunks com sobreposição
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  
  return chunks;
}

async function runIngestion() {
  console.log('Iniciando pipeline de ingestão de dados...');
  
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`Diretório '${DATA_DIR}' não encontrado. Criando...`);
    fs.mkdirSync(DATA_DIR);
    console.log(`Por favor, adicione arquivos de texto (.txt ou .md) na pasta 'data/' e execute o script novamente.`);
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter(file => 
    file.endsWith('.txt') || file.endsWith('.md')
  );

  if (files.length === 0) {
    console.log('Nenhum arquivo .txt ou .md encontrado na pasta data/. Adicione alguns documentos primeiro.');
    return;
  }

  const supabase = getSupabaseAdmin();
  console.log(`Encontrado(s) ${files.length} arquivo(s) para processar.`);

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`\nProcessando: ${file}...`);

    console.log(`  -> Limpando trechos antigos de ${file} do banco de dados...`);
    const { error: deleteError } = await supabase
      .from('exam_documents')
      .delete()
      .eq('metadata->>source', file);

    if (deleteError) {
      console.warn(`  ⚠️ Aviso ao remover trechos antigos:`, deleteError.message);
    } else {
      console.log(`  ✓ Trechos antigos limpos com sucesso.`);
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(content, 1200, 200);
    console.log(`Dividido em ${chunks.length} partes.`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`  -> Gerando embedding para parte ${i + 1}/${chunks.length}...`);
      
      try {
        const embedding = await getEmbedding(chunk);
        
        console.log(`  -> Enviando para o Supabase...`);
        const { error } = await supabase.from('exam_documents').insert({
          content: chunk,
          metadata: {
            source: file,
            chunkIndex: i,
            processedAt: new Date().toISOString()
          },
          embedding: embedding
        });

        if (error) {
          console.error(`Erro ao inserir no Supabase para a parte ${i + 1}:`, error.message);
        } else {
          console.log(`  ✓ Parte ${i + 1} salva com sucesso.`);
        }
      } catch (err: any) {
        console.error(`Erro no processamento da parte ${i + 1}:`, err.message || err);
      }
      
      // Pequena pausa para evitar limites de requisição na API gratuita
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log('\nPipeline de ingestão concluído!');
}

runIngestion().catch((err) => {
  console.error('Erro catastrófico no pipeline:', err);
});
