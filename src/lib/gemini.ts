import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Provedor do Gemini para o Vercel AI SDK
export const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

/**
 * Gera um vetor de embedding para um texto usando o modelo oficial do Google text-embedding-004.
 * Usamos a API REST diretamente para garantir máxima simplicidade e velocidade.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada nas variáveis de ambiente.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'models/gemini-embedding-2',
        content: {
          parts: [{ text }],
        },
        outputDimensionality: 768,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao gerar embedding: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.embedding?.values) {
    throw new Error('Resposta de embedding inválida da API do Gemini.');
  }

  return data.embedding.values;
}
