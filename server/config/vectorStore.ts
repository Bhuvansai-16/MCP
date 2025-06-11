import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Pinecone
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

// Initialize OpenAI for embeddings
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const PINECONE_INDEX_NAME = 'mcp-playground';

export class VectorStore {
  private index: any;

  constructor() {
    this.index = pinecone.index(PINECONE_INDEX_NAME);
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
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
    try {
      await this.index.deleteOne(id);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}

export const vectorStore = new VectorStore();