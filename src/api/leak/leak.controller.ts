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
import { LeakService } from './leak.service'
import { LeakNoPlanDto } from './dto/leak_no_plan.dto'

@Controller('leak')
export class LeakController {
  private readonly logger = new Logger(LeakController.name)

  constructor(private leakService: LeakService) {
    // super()
  }

  @Post('machine-list')
  async getInitData(@Body('Line_CD') lineCd: string) {
    return await this.leakService.getLeakInitialData(lineCd)
  }

  @Post('save-leak')
  async saveLeak(@Body() dto: LeakNoPlanDto) {
    return await this.leakService.saveLeakNoPlan(dto)
  }

  @Post('noplan-list-record')
  async getNoplanRecordList(
    @Body('Line_CD') Line_CD: string,
    @Body('Date_NoPlan') Date_NoPlan: string,
    @Body('Row_No_From') Row_No_From: number,
    @Body('Row_No_To') Row_No_To: number
  ) {
    return await this.leakService.getNoPlanRecordList(
      Line_CD,
      Date_NoPlan,
      Row_No_From,
      Row_No_To
    )
  }
}
