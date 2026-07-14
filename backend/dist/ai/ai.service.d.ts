import { ConfigService } from '@nestjs/config';
export declare class AiService {
    private configService;
    private openai;
    constructor(configService: ConfigService);
    getCompletion(prompt: string, systemPrompt?: string): Promise<string>;
    getJsonCompletion<T>(prompt: string, systemPrompt?: string): Promise<T>;
}
