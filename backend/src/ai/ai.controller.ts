import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DemandForecastService } from './demand-forecast.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly demandForecastService: DemandForecastService) {}

  @Get('forecast')
  @Roles('FARMER', 'ADMIN')
  getForecast(
    @Query('category') category: string,
    @Query('week') week: string,
    @Query('year') year: string,
  ) {
    // Basic week calculation if not provided
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const currentWeekDefault = Math.ceil(days / 7);

    const currentWeek = parseInt(week) || currentWeekDefault;
    const currentYear = parseInt(year) || currentDate.getFullYear();
    
    return this.demandForecastService.getForecast(category || 'all', currentWeek, currentYear);
  }
}
