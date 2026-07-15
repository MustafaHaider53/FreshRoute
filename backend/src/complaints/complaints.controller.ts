import { Controller, Post, Body, Patch, Param, Get } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, ResolveComplaintDto } from './dto/complaint.dto';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  async create(@Body() createComplaintDto: CreateComplaintDto) {
    return this.complaintsService.createComplaint(createComplaintDto);
  }

  @Patch(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body() resolveComplaintDto: ResolveComplaintDto,
  ) {
    return this.complaintsService.resolveComplaint(id, resolveComplaintDto);
  }

  @Get('traceback/:orderItemId')
  async getTraceback(@Param('orderItemId') orderItemId: string) {
    return this.complaintsService.getTraceback(orderItemId);
  }
}
