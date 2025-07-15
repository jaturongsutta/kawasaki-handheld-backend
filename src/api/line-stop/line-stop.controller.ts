import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common'
import { BaseController } from 'src/base.controller'
import { EncryptData } from 'src/_services/encrypt'
import { BaseResponse } from 'src/common/base-response'

import { HistoricalRequestDto } from './dto/historical.dto'
import { LineStopService } from './line-stop.service'
import { LineStopRecordDto } from './dto/line-stopre-cord.dto'

@Controller('line-stop')
export class LineStopController {
  private readonly logger = new Logger(LineStopController.name)

  constructor(private lineStopService: LineStopService) {
    // super()
  }

  @Post('running-plan')
  async getNgInitData(@Body('Line_CD') lineCd: string) {
    return await this.lineStopService.getLineStopInitialData(lineCd)
  }

  @Post('save-record')
  async saveRecord(@Body() dto: LineStopRecordDto) {
    return await this.lineStopService.saveLineStopRecord(dto)
  }

  @Post('list-record')
  async getNgRecordList(
    @Body('Line_CD') lineCd: string,
    @Body('Plan_Date') planDate: string
  ) {
    return await this.lineStopService.getLineStopRecordList(lineCd, planDate)
  }

  @Post('historical-list')
  async getHistoricalList(@Body() dto: HistoricalRequestDto) {
    return await this.lineStopService.getHistoricalList(dto)
  }
}
