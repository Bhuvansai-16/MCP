import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Check if required environment variables are available
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENV = process.env.PINECONE_ENV;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize Pinecone only if credentials are available
export const pinecone = PINECONE_API_KEY && PINECONE_ENV ? new Pinecone({
  apiKey: PINECONE_API_KEY,
  environment: PINECONE_ENV,
}) : null;

// Initialize OpenAI for embeddings only if API key is available
export const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null;

export const PINECONE_INDEX_NAME = 'mcp-playground';

export class VectorStore {
  private index: any;
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = !!(pinecone && openai);
    if (this.isAvailable && pinecone) {
      this.index = pinecone.index(PINECONE_INDEX_NAME);
    }
  }

  private checkAvailability(): void {
    if (!this.isAvailable) {
      throw new Error('Vector store is not available. Please configure PINECONE_API_KEY, PINECONE_ENV, and OPENAI_API_KEY environment variables.');
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    this.checkAvailability();
    try {
      const response = await openai!.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async storeDocument(id: string, text: string, metadata: any = {}): Promise<void> {
    this.checkAvailability();
    try {
      const embedding = await this.createEmbedding(text);
      await this.index.upsert([
        {
          id,
          values: embedding,
          metadata: { text, ...metadata },
        },
      ]);
    } catch (error) {
      console.error('Error storing document:', error);
      throw error;
    }
  }

  async queryDocuments(queryText: string, topK: number = 5): Promise<any[]> {
    this.checkAvailability();
    try {
      const queryEmbedding = await this.createEmbedding(queryText);
      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });
      
      return queryResponse.matches || [];
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    this.checkAvailability();
    try {
      await this.index.deleteOne(id);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.isAvailable;
  }
}

export const vectorStore = new VectorStore();