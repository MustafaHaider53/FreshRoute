"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
let AiService = class AiService {
    configService;
    openai;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('GROQ_API_KEY');
        this.openai = new openai_1.default({
            apiKey: apiKey || 'dummy-key',
            baseURL: 'https://api.groq.com/openai/v1',
        });
    }
    async getCompletion(prompt, systemPrompt) {
        try {
            const messages = [];
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
        }
        catch (error) {
            console.error('AI Proxy request to Groq failed:', error);
            throw new Error('AI Service is currently offline or unavailable. Using fallbacks.');
        }
    }
    async getJsonCompletion(prompt, systemPrompt) {
        try {
            const messages = [];
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
            return JSON.parse(text);
        }
        catch (error) {
            console.error('AI Proxy JSON request to Groq failed:', error);
            throw new Error('AI Service is currently offline or unavailable. Using fallbacks.');
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map