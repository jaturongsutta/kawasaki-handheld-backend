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
import { ProductionstatusService } from './productionstatus.service'
import { NgRecordDto } from './dto/ngrecord.dto'
import { HistoricalRequestDto } from './dto/historical.dto'
import { ProductionStatusDto } from './dto/production-status.dto'
import { PlanSearchDto } from './dto/Plansearch.dto'

@Controller('production-status')
export class ProductionstatusController {
  private readonly logger = new Logger(ProductionstatusController.name)

  constructor(private productionStatusService: ProductionstatusService) {
    // super()
  }

  @Post('current-plan')
  async getCurrentPlan(@Body('Line_CD') lineCd: string) {
    return await this.productionStatusService.getCurrentProductionPlan(lineCd)
  }

  @Post('detail')
  async getById(@Body('id') id: any) {
    return await this.productionStatusService.getProductionStatusById(id)
  }

  @Post('check-ot')
  checkOt(@Body('plan_id') planId: number) {
    return this.productionStatusService.checkOTAvailable(planId)
  }

  @Post('update-ot')
  async updateOT(@Body() body) {
    const { plan_id, is_ot, time_mins, updated_by } = body
    return this.productionStatusService.updatePlanOTStatus(
      plan_id,
      is_ot,
      time_mins,
      updated_by
    )
  }

  @Post('stop-plan')
  async stopPlan(@Body() body) {
    const { plan_id, updated_by } = body
    return this.productionStatusService.stopProductionPlan(plan_id, updated_by)
  }

  @Post('search')
  async searchPlans(@Body() dto: PlanSearchDto) {
    return this.productionStatusService.searchPlans(dto)
  }
}
