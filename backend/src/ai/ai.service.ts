import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  /**
   * General text completion using the Groq API
   */
  async getCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.openai.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('AI Proxy request to Groq failed:', error);
      throw new Error('AI Service is currently offline or unavailable. Using fallbacks.');
    }
  }

  /**
   * JSON completion, forces Groq to return JSON output
   */
  async getJsonCompletion<T>(prompt: string, systemPrompt?: string): Promise<T> {
    try {
      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.openai.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content || '{}';
      return JSON.parse(text) as T;
    } catch (error) {
      console.error('AI Proxy JSON request to Groq failed:', error);
      throw new Error('AI Service is currently offline or unavailable. Using fallbacks.');
    }
  }
}
