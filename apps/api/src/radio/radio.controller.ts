import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RadioService } from './radio.service';
import { Public } from '../common/decorators';
import { PageResult, RadioEpisode } from '@jiucaibox/shared';

@Controller('api/radio')
export class RadioController {
  constructor(private readonly radioService: RadioService) {}

  @Public()
  @Get()
  list(@Query('page') page = 1, @Query('pageSize') pageSize = 10): Promise<PageResult<RadioEpisode>> {
    return this.radioService.list({ page, pageSize });
  }

  @Public()
  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number): Promise<RadioEpisode> {
    return this.radioService.detail(id);
  }
}
