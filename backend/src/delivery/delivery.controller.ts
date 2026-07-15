import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DeliveryService } from './delivery.service';
import {
  AcceptRouteOrderDto,
  AssignDeliveryDto,
  GenerateScheduleReportDto,
  OptimizeRouteDto,
  UpdateStopStatusDto,
} from './dto/delivery.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('drivers')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List available delivery drivers (Admin only)' })
  getDrivers() {
    return this.deliveryService.getDrivers();
  }

  @Get('unassigned-orders')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List confirmed or packed unassigned orders' })
  getUnassignedOrders() {
    return this.deliveryService.getUnassignedOrders();
  }

  @Post('assign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign one or more orders to a driver' })
  @ApiResponse({ status: 201, description: 'Delivery run assembled' })
  assignDeliveries(@Body() dto: AssignDeliveryDto) {
    return this.deliveryService.assignDeliveries(dto);
  }

  @Get('my-stops')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: "Get the logged-in driver's scheduled stops" })
  getMyStops(@Req() req: AuthenticatedRequest, @Query('date') date?: string) {
    return this.deliveryService.getDriverStops(req.user.id, date);
  }

  @Patch('stops/:orderId/status')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Mark an assigned stop delivered or failed' })
  updateStopStatus(
    @Param('orderId') orderId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateStopStatusDto,
  ) {
    return this.deliveryService.updateStopStatus(orderId, req.user.id, dto);
  }

  @Post('optimize-route')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Ask AI to optimize the active delivery route' })
  optimizeRoute(
    @Req() req: AuthenticatedRequest,
    @Body() dto: OptimizeRouteDto,
  ) {
    return this.deliveryService.optimizeRoute(req.user.id, dto);
  }

  @Patch('route-order')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Accept and persist a proposed stop ordering' })
  acceptRoute(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AcceptRouteOrderDto,
  ) {
    return this.deliveryService.acceptRoute(req.user.id, dto);
  }

  @Get('track/:orderId')
  @Roles(Role.BUYER, Role.ADMIN)
  @ApiOperation({ summary: 'Track a buyer order or inspect it as an admin' })
  trackOrder(
    @Param('orderId') orderId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.deliveryService.trackOrder(orderId, req.user.id, req.user.role);
  }

  @Get('reports')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List persisted daily driver schedule reports' })
  getReports(@Query('date') date?: string) {
    return this.deliveryService.getScheduleReports(date);
  }

  @Post('reports/generate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Generate daily schedule reports on demand' })
  generateReports(@Body() dto: GenerateScheduleReportDto) {
    return this.deliveryService.generateDailyScheduleReports(
      dto.date ? new Date(dto.date) : new Date(),
    );
  }
}
