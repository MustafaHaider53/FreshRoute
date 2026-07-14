import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateProductDto, UpdateProductDto, AcceptPriceDto } from './inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Create a new produce listing (Farmer only)' })
  @ApiResponse({ status: 201, description: 'Listing successfully created' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not a Farmer' })
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.inventoryService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Get current inventory list for the logged-in Farmer' })
  @ApiResponse({ status: 200, description: 'Farmer inventory returned successfully' })
  getFarmerInventory(@Req() req: any) {
    return this.inventoryService.getFarmerInventory(req.user.id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all listings in the system (Buyer & Admin catalog)' })
  @ApiResponse({ status: 200, description: 'All listings returned successfully' })
  getAllProducts() {
    return this.inventoryService.getAllProducts();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Update price and quantity for a listing (Farmer only)' })
  @ApiResponse({ status: 200, description: 'Listing updated successfully' })
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateProductDto) {
    return this.inventoryService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Delete a listing (Farmer only)' })
  @ApiResponse({ status: 200, description: 'Listing deleted successfully' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.remove(id, req.user.id);
  }

  @Post(':id/suggest-price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Get AI price recommendation for a listing (Farmer only)' })
  @ApiResponse({ status: 200, description: 'AI price recommendation returned' })
  getPricingSuggestion(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.getPricingSuggestion(id, req.user.id);
  }

  @Post('accept-price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Accept AI price recommendation (Farmer only)' })
  @ApiResponse({ status: 200, description: 'Price recommendation accepted and product updated' })
  acceptPrice(@Req() req: any, @Body() dto: AcceptPriceDto) {
    return this.inventoryService.acceptPricingSuggestion(req.user.id, dto);
  }
}
