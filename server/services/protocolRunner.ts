import OpenAI from 'openai';
import { vectorStore } from '../config/vectorStore.js';
import { mcpClient } from './mcpClient.js';
import { redis } from '../config/database.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ProtocolInput {
  prompt: string;
  document: string;
  documentUrl?: string;
  config?: Record<string, any>;
}

export interface ProtocolResult {
  protocol: string;
  response: string;
  metrics: {
    tokens: number;
    latency: number;
    quality: number;
  };
  metadata?: Record<string, any>;
}

export class ProtocolRunner {
  async runProtocol(protocol: string, input: ProtocolInput): Promise<ProtocolResult> {
    const startTime = Date.now();
    
    try {
      let result: any;
      
      switch (protocol) {
        case 'raw':
          result = await this.runRawProtocol(input);
          break;
        case 'chain':
          result = await this.runChainProtocol(input);
          break;
        case 'tree':
          result = await this.runTreeProtocol(input);
          break;
        case 'rag':
          result = await this.runRagProtocol(input);
          break;
        default:
          throw new Error(`Unknown protocol: ${protocol}`);
      }

      const latency = Date.now() - startTime;
      const quality = await this.calculateQualityScore(result.response, input.prompt);

      return {
        protocol,
        response: result.response,
        metrics: {
          tokens: result.tokens || this.estimateTokens(result.response),
          latency,
          quality,
        },
        metadata: result.metadata,
      };
    } catch (error) {
      console.error(`Protocol ${protocol} failed:`, error);
      throw error;
    }
  }

  private async runRawProtocol(input: ProtocolInput): Promise<any> {
    const cacheKey = `raw:${this.hashInput(input)}`;
    const cached = await this.getCachedResult(cacheKey);
    if (cached) return cached;

    // Use MCP filesystem server to handle document if it's a URL
    let documentContent = input.document;
    if (input.documentUrl) {
      try {
        const fetchResult = await mcpClient.callTool('fetch', 'fetch', {
          url: input.documentUrl,
        });
        documentContent = fetchResult.content[0]?.text || input.document;
      } catch (error) {
        console.warn('Failed to fetch document via MCP, using provided content');
      }
    }

    const fullContext = `${documentContent}\n\nPrompt: ${input.prompt}`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes documents and provides comprehensive responses.',
        },
        {
          role: 'user',
          content: fullContext,
        },
      ],
      max_tokens: input.config?.max_tokens || 1000,
      temperature: input.config?.temperature || 0.7,
    });

    const result = {
      response: response.choices[0]?.message?.content || 'No response generated',
      tokens: response.usage?.total_tokens || 0,
      metadata: {
        model: 'gpt-4',
        context_length: fullContext.length,
      },
    };

    await this.cacheResult(cacheKey, result);
    return result;
  }

  private async runChainProtocol(input: ProtocolInput): Promise<any> {
    const cacheKey = `chain:${this.hashInput(input)}`;
    const cached = await this.getCachedResult(cacheKey);
    if (cached) return cached;

    const chunkSize = input.config?.chunk_size || 1500;
    const overlap = input.config?.overlap || 200;
    
    const chunks = this.splitIntoChunks(input.document, chunkSize, overlap);
    let aggregatedResponse = '';
    let totalTokens = 0;
    const chunkResponses = [];

    // Use MCP sequential thinking server for chain processing
    try {
      await mcpClient.connectServer('sequential_thinking');
    } catch (error) {
      console.warn('Sequential thinking MCP server not available, using fallback');
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunkContext = `Chunk ${i + 1}/${chunks.length}: ${chunks[i]}\n\nPrompt: ${input.prompt}`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are processing a document chunk. Provide insights that will be aggregated with other chunks.',
          },
          {
            role: 'user',
            content: chunkContext,
          },
        ],
        max_tokens: input.config?.max_tokens || 500,
        temperature: input.config?.temperature || 0.7,
      });

      const chunkResponse = response.choices[0]?.message?.content || '';
      chunkResponses.push(chunkResponse);
      totalTokens += response.usage?.total_tokens || 0;
    }

    // Final aggregation
    const aggregationContext = `Aggregate the following chunk analyses:\n\n${chunkResponses.map((r, i) => `Chunk ${i + 1}: ${r}`).join('\n\n')}\n\nOriginal prompt: ${input.prompt}`;
    
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are aggregating multiple chunk analyses into a coherent final response.',
        },
        {
          role: 'user',
          content: aggregationContext,
        },
      ],
      max_tokens: input.config?.max_tokens || 800,
      temperature: input.config?.temperature || 0.7,
    });

    const result = {
      response: finalResponse.choices[0]?.message?.content || 'No response generated',
      tokens: totalTokens + (finalResponse.usage?.total_tokens || 0),
      metadata: {
        chunks_processed: chunks.length,
        chunk_size: chunkSize,
        overlap,
      },
    };

    await this.cacheResult(cacheKey, result);
    return result;
  }

  private async runTreeProtocol(input: ProtocolInput): Promise<any> {
    const cacheKey = `tree:${this.hashInput(input)}`;
    const cached = await this.getCachedResult(cacheKey);
    if (cached) return cached;

    const branchFactor = input.config?.branch_factor || 3;
    const maxDepth = input.config?.max_depth || 2;
    
    const branches = this.splitIntoBranches(input.document, branchFactor);
    const branchPromises = branches.map(async (branch, index) => {
      const branchContext = `Branch ${index + 1}: ${branch}\n\nPrompt: ${input.prompt}`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are analyzing branch ${index + 1} of ${branchFactor} parallel branches. Provide unique insights from this perspective.`,
          },
          {
            role: 'user',
            content: branchContext,
          },
        ],
        max_tokens: input.config?.max_tokens || 500,
        temperature: input.config?.temperature || 0.8,
      });

      return {
        response: response.choices[0]?.message?.content || '',
        tokens: response.usage?.total_tokens || 0,
      };
    });

    const branchResults = await Promise.all(branchPromises);
    const totalTokens = branchResults.reduce((sum, r) => sum + r.tokens, 0);

    // Aggregate branches using the specified method
    const aggregationMethod = input.config?.aggregation_method || 'synthesis';
    const aggregationContext = `Using ${aggregationMethod} method, aggregate these parallel analyses:\n\n${branchResults.map((r, i) => `Branch ${i + 1}: ${r.response}`).join('\n\n')}\n\nOriginal prompt: ${input.prompt}`;
    
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are aggregating ${branchFactor} parallel branch analyses using ${aggregationMethod} method.`,
        },
        {
          role: 'user',
          content: aggregationContext,
        },
      ],
      max_tokens: input.config?.max_tokens || 800,
      temperature: input.config?.temperature || 0.7,
    });

    const result = {
      response: finalResponse.choices[0]?.message?.content || 'No response generated',
      tokens: totalTokens + (finalResponse.usage?.total_tokens || 0),
      metadata: {
        branches: branchFactor,
        aggregation_method: aggregationMethod,
        max_depth: maxDepth,
      },
    };

    await this.cacheResult(cacheKey, result);
    return result;
  }

  private async runRagProtocol(input: ProtocolInput): Promise<any> {
    const cacheKey = `rag:${this.hashInput(input)}`;
    const cached = await this.getCachedResult(cacheKey);
    if (cached) return cached;

    const topK = input.config?.top_k || 5;
    const similarityThreshold = input.config?.similarity_threshold || 0.7;
    
    // Store document in vector store for retrieval
    const documentId = `doc_${Date.now()}`;
    await vectorStore.storeDocument(documentId, input.document, {
      timestamp: new Date().toISOString(),
    });

    // Retrieve relevant chunks
    const retrievedDocs = await vectorStore.queryDocuments(input.prompt, topK);
    const relevantChunks = retrievedDocs
      .filter(doc => doc.score >= similarityThreshold)
      .map(doc => doc.metadata?.text || '')
      .slice(0, topK);

    const relevantContext = relevantChunks.join('\n\n');
    
    // Generate response with retrieved context
    const ragContext = `Retrieved relevant context:\n${relevantContext}\n\nPrompt: ${input.prompt}`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are using retrieval-augmented generation. Focus on the most relevant retrieved context to answer the prompt.',
        },
        {
          role: 'user',
          content: ragContext,
        },
      ],
      max_tokens: input.config?.max_tokens || 800,
      temperature: input.config?.temperature || 0.7,
    });

    // Clean up - remove document from vector store
    await vectorStore.deleteDocument(documentId);

    const result = {
      response: response.choices[0]?.message?.content || 'No response generated',
      tokens: response.usage?.total_tokens || 0,
      metadata: {
        retrieved_chunks: relevantChunks.length,
        top_k: topK,
        similarity_threshold: similarityThreshold,
        embedding_model: 'text-embedding-3-small',
      },
    };

    await this.cacheResult(cacheKey, result);
    return result;
  }

  private async calculateQualityScore(response: string, prompt: string): Promise<number> {
    try {
      const qualityPrompt = `Rate the quality of this response to the given prompt on a scale of 1-10:

Prompt: ${prompt}

Response: ${response}

Consider factors like relevance, completeness, accuracy, and clarity. Respond with only a number between 1 and 10.`;

      const qualityResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a quality assessor. Rate responses on a scale of 1-10.',
          },
          {
            role: 'user',
            content: qualityPrompt,
          },
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      const scoreText = qualityResponse.choices[0]?.message?.content?.trim() || '5';
      const score = parseFloat(scoreText);
      return isNaN(score) ? 5 : Math.max(1, Math.min(10, score));
    } catch (error) {
      console.error('Error calculating quality score:', error);
      return 5; // Default score
    }
  }

  private splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlap;
      
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  private splitIntoBranches(text: string, branchFactor: number): string[] {
    const chunkSize = Math.ceil(text.length / branchFactor);
    const branches = [];
    
    for (let i = 0; i < branchFactor; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, text.length);
      if (start < text.length) {
        branches.push(text.slice(start, end));
      }
    }
    
    return branches;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private hashInput(input: ProtocolInput): string {
    const content = `${input.prompt}:${input.document}:${JSON.stringify(input.config || {})}`;
    return Buffer.from(content).toString('base64').slice(0, 32);
  }

  private async getCachedResult(key: string): Promise<any | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private async cacheResult(key: string, result: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setEx(key, ttl, JSON.stringify(result));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
}

export const protocolRunner = new ProtocolRunner();