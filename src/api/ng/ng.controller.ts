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
import { NGService } from './ng.service'
import { NgRecordDto } from './dto/ngrecord.dto'
import { HistoricalRequestDto } from './dto/historical.dto'

@Controller('ng')
export class NGController {
  private readonly logger = new Logger(NGController.name)

  constructor(private ngService: NGService) {
    // super()
  }

  @Post('running-plan')
  async getNgInitData(@Body('Line_CD') lineCd: string) {
    console.log('asjdklajslkdjalksd')
    return await this.ngService.getNgInitialData(lineCd)
  }

  @Post('save-record')
  async saveRecord(@Body() dto: NgRecordDto) {
    return await this.ngService.saveNgRecord(dto)
  }

  @Post('list-record')
  async getNgRecordList(
    @Body('Line_CD') lineCd: string,
    @Body('Plan_Date') planDate: string
  ) {
    return await this.ngService.getNgRecordList(lineCd, planDate)
  }

  @Post('historical-list')
  async getHistoricalList(@Body() dto: HistoricalRequestDto) {
    return await this.ngService.getHistoricalList(dto)
  }
}
