import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateProductDto, UpdateProductDto, AcceptPriceDto } from './inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * Helper to calculate spoilage risk dynamically
   */
  private calculateSpoilage(harvestDate: Date, shelfLifeDays: number) {
    const now = new Date();
    const harvest = new Date(harvestDate);
    const diffTime = now.getTime() - harvest.getTime();
    // Convert to days, minimum of 0
    const daysSinceHarvest = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    let spoilageRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (daysSinceHarvest >= shelfLifeDays) {
      spoilageRisk = 'HIGH';
    } else if (daysSinceHarvest >= shelfLifeDays * 0.5) {
      spoilageRisk = 'MEDIUM';
    }

    return { daysSinceHarvest, spoilageRisk };
  }

  async create(farmerId: string, dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        farmerId,
        name: dto.name,
        variety: dto.variety,
        unit: dto.unit,
        price: dto.price,
        quantity: dto.quantity,
        harvestDate: new Date(dto.harvestDate),
        shelfLifeDays: dto.shelfLifeDays,
      },
    });

    const spoilage = this.calculateSpoilage(product.harvestDate, product.shelfLifeDays);
    return {
      ...product,
      ...spoilage,
    };
  }

  async getFarmerInventory(farmerId: string) {
    const products = await this.prisma.product.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(product => {
      const spoilage = this.calculateSpoilage(product.harvestDate, product.shelfLifeDays);
      return {
        ...product,
        ...spoilage,
      };
    });
  }

  async getAllProducts() {
    const products = await this.prisma.product.findMany({
      include: {
        farmer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(product => {
      const spoilage = this.calculateSpoilage(product.harvestDate, product.shelfLifeDays);
      return {
        ...product,
        ...spoilage,
      };
    });
  }

  async update(productId: string, farmerId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.farmerId !== farmerId) {
      throw new ForbiddenException('You can only update your own products');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        price: dto.price,
        quantity: dto.quantity,
      },
    });

    const spoilage = this.calculateSpoilage(updated.harvestDate, updated.shelfLifeDays);
    return {
      ...updated,
      ...spoilage,
    };
  }

  async remove(productId: string, farmerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.farmerId !== farmerId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    // Delete any dependent pricing suggestions first
    await this.prisma.pricingSuggestion.deleteMany({
      where: { productId },
    });

    await this.prisma.product.delete({
      where: { id: productId },
    });

    return { success: true };
  }

  /**
   * AI Dynamic Pricing Assistant
   */
  async getPricingSuggestion(productId: string, farmerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.farmerId !== farmerId) {
      throw new ForbiddenException('You can only check pricing for your own products');
    }

    const spoilage = this.calculateSpoilage(product.harvestDate, product.shelfLifeDays);

    // Prompt for the AI
    const systemPrompt = `You are a Dynamic Pricing Assistant for the FreshRoute farm-to-table supply chain platform.
Your task is to analyze agricultural listing details and suggest a fair, market-responsive price.
Consider the following criteria:
- High spoilage risk items (near shelf life expiry) should be discounted to clear stock quickly (e.g., 10-30% discount).
- High surplus stock (relative to typical orders) should have mild discounts.
- Freshly harvested, premium variety items can sustain higher margins.
You MUST output your recommendation strictly as a JSON object with this exact shape:
{
  "suggestedPrice": number,
  "rationale": string
}
Do not write any markdown code blocks or explanations outside this JSON.`;

    const prompt = `Produce Details:
Name: ${product.name}
Variety: ${product.variety}
Unit: ${product.unit}
Current Price: $${product.price} per ${product.unit}
Current Stock: ${product.quantity} ${product.unit}s
Days since harvest: ${spoilage.daysSinceHarvest} days
Total Shelf Life: ${product.shelfLifeDays} days
Spoilage Risk Level: ${spoilage.spoilageRisk}

Please generate the optimal price suggestion.`;

    try {
      // Call Groq API JSON Proxy
      const suggestion = await this.aiService.getJsonCompletion<{ suggestedPrice: number; rationale: string }>(
        prompt,
        systemPrompt,
      );

      // Save suggestion in DB
      const dbSuggestion = await this.prisma.pricingSuggestion.create({
        data: {
          productId,
          suggestedPrice: suggestion.suggestedPrice,
          originalPrice: product.price,
          rationale: suggestion.rationale,
          accepted: false,
        },
      });

      return {
        pricingSuggestionId: dbSuggestion.id,
        suggestedPrice: dbSuggestion.suggestedPrice,
        rationale: dbSuggestion.rationale,
        isFallback: false,
      };
    } catch (error) {
      console.warn('AI pricing failed. Gracefully degrading to historical fallback.', error);
      
      // FALLBACK DEGRADATION:
      // Fall back to historical range. Let's suggest current price and explain AI is offline.
      const rationale = `The AI pricing engine is temporarily offline. Showing your historical base price. Your historical range for ${product.name} is $${(product.price * 0.9).toFixed(2)} - $${(product.price * 1.1).toFixed(2)}.`;
      
      const dbSuggestion = await this.prisma.pricingSuggestion.create({
        data: {
          productId,
          suggestedPrice: product.price,
          originalPrice: product.price,
          rationale: rationale,
          accepted: false,
        },
      });

      return {
        pricingSuggestionId: dbSuggestion.id,
        suggestedPrice: product.price,
        rationale,
        isFallback: true,
      };
    }
  }

  async acceptPricingSuggestion(farmerId: string, dto: AcceptPriceDto) {
    const suggestion = await this.prisma.pricingSuggestion.findUnique({
      where: { id: dto.pricingSuggestionId },
      include: { product: true },
    });

    if (!suggestion) {
      throw new NotFoundException('Pricing suggestion not found');
    }

    if (suggestion.product.farmerId !== farmerId) {
      throw new ForbiddenException('You can only accept pricing suggestions for your own products');
    }

    // Update suggestion status
    await this.prisma.pricingSuggestion.update({
      where: { id: dto.pricingSuggestionId },
      data: { accepted: true },
    });

    // Update product price
    const updatedProduct = await this.prisma.product.update({
      where: { id: suggestion.productId },
      data: { price: suggestion.suggestedPrice },
    });

    const spoilage = this.calculateSpoilage(updatedProduct.harvestDate, updatedProduct.shelfLifeDays);
    return {
      ...updatedProduct,
      ...spoilage,
      suggestionAccepted: true,
    };
  }
}
