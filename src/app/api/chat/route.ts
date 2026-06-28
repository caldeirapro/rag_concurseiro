import { googleProvider, getEmbedding } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabase';
import { streamText, convertToModelMessages } from 'ai';

// Permite streaming de respostas em tempo real
export const maxDuration = 30;

// Helper para extrair o texto de uma mensagem de forma resiliente, suportando content (v6) e parts (v7)
function getMessageText(message: any): string {
  if (!message) return '';
  if (typeof message.content === 'string') {
    return message.content;
  }
  if (Array.isArray(message.parts)) {
    const textPart = message.parts.find((part: any) => part.type === 'text');
    return textPart ? textPart.text : '';
  }
  return '';
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log('Incoming API messages payload:', JSON.stringify(messages, null, 2));
    const lastMessage = messages[messages.length - 1];
    const lastMessageText = getMessageText(lastMessage);

    if (!lastMessage || !lastMessageText) {
      console.log('Failing validation. lastMessageText is empty.');
      return new Response('Nenhuma mensagem fornecida.', { status: 400 });
    }

    let context = '';
    try {
      // 1. Gera o embedding da pergunta do usuário
      const queryEmbedding = await getEmbedding(lastMessageText);

      // 2. Busca os trechos mais relevantes no Supabase
      const supabase = getSupabaseAdmin();
      const { data: documents, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 4,
      });

      if (error) {
        console.error('Erro na busca vetorial no Supabase:', error.message);
      } else if (documents && documents.length > 0) {
        // 3. Monta o contexto a partir dos documentos correspondentes
        context = documents
          .map(
            (doc: any) =>
              `--- DOCUMENTO (${doc.metadata?.source || 'Desconhecido'}): ---\n${doc.content}`
          )
          .join('\n\n');
      }
    } catch (err: any) {
      console.error('Falha ao recuperar contexto do RAG:', err.message || err);
      // Se falhar o RAG, continuamos a conversa sem contexto de forma resiliente
    }

    const systemPrompt = `Você é o "Concurseiro IA", um assistente especialista em concursos públicos no Brasil.
Sua missão é ajudar estudantes a entenderem carreiras de concursos, planejarem rotinas de estudo e dominarem métodos eficientes de aprovação.

Responda utilizando as seguintes regras básicas:
1. Use o contexto de documentos fornecido abaixo para responder a pergunta. Baseie-se prioritariamente nessas informações.
2. Se o contexto não contiver a resposta exata, utilize seu conhecimento prévio sobre concursos públicos de forma transparente, mencionando que a informação não estava nos documentos oficiais de estudo.
3. Deixe suas respostas extremamente atraentes, estruturadas e bonitas. Use emojis adequados para ilustrar os tópicos (como ⏱️, 💻, ⚖️, 🏛️, 🔍, 👮, 🧠, 🔄), e abuse de marcações Markdown como tópicos claros, negritos e listas para facilitar a leitura.
4. Mantenha um tom profissional mas altamente motivador.

--- CONTEXTO RECUPERADO DOS MATERIAIS DE ESTUDO: ---
${context || 'Nenhum material de estudo correspondente foi encontrado no banco de dados vetorial.'}
--------------------------------------------------`;

    // 4. Executa o streaming de texto utilizando o Vercel AI SDK e Gemini 2.5 Flash
    const result = await streamText({
      model: googleProvider('gemini-2.5-flash'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Erro na rota de chat:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
