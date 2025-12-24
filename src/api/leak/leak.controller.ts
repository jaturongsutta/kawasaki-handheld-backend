import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common'
import { LeakService } from './leak.service'
import { LeakNoPlanDto } from './dto/leak_no_plan.dto'
import { LeakTestDto } from './dto/leak_test.dto'
import { BaseController } from 'src/base.controller'

@Controller('leak')
export class LeakController {
  private readonly logger = new Logger(LeakController.name)

  constructor(private leakService: LeakService) {
    // super()
  }

  /* CYH NG Record */
  @Post('search-ng-cyh')
  async searchNGCYH(
    @Body('Machine_No') Machine_No: string,
  ) {
    return await this.leakService.searchNGCYH(
      Machine_No
    )
  }
  /* End CYH NG Record */

  /* CYH Leak Test */
  @Get('worktype')
  async getWorkType() {
    return await this.leakService.getWorkType()
  }

  @Get('gs-count')
  async getGSCount(@Query('Model_CD') Model_CD: string,
    @Query('Serial_No') Serial_No: string,) {
    return await this.leakService.getGSCount(Model_CD, Serial_No)
  }

  @Post('production-list-running')
  async getProductionRunningLeakList(
    @Body('Machine_No') Machine_No: string,
    @Body('Work_Type') Work_Type: string,
  ) {
    return await this.leakService.getProductionRunningLeakList(
      Machine_No,
      Work_Type,
    )
  }

  @Post('save-leak-test-cyh')
  async saveLeakCYH(@Body() dto: LeakTestDto) {
    return await this.leakService.saveLeakTest(dto)
  }

  @Post('update-leak-test-cyh')
  async updateLeakCYH(@Body() dto: LeakTestDto) {
    return await this.leakService.updateLeakTest(dto)
  }

  @Post('update-leak-test-ok-cyh')
  async updateOKLeakCYH(@Body() dto: LeakTestDto) {
    return await this.leakService.updateLeakTest(dto)
  }

  @Post('check-test-result')
  async checkTestResult(@Body('Machine_No') machineNo: string) {
    return await this.leakService.checkTestResult(machineNo)
  }

  @Post('get-leak-cyh')
  async getLeakCYH(@Body('Serial_No') serialNo: string, @Body('Model_CD') modelCd: string) {
    return await this.leakService.getLeakCYH(serialNo, modelCd)
  }

  @Post('get-ok-ng')
  async getOKNG(@Body('Machine_No') machineNo: string) {
    return await this.leakService.getOKNG(machineNo)
  }
  /* End CYH Leak Test */

  @Post('machine-all')
  async getMachinePredefineAll() {
    return await this.leakService.getMachinePredefineAll()
  }

  /* No Plan */
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
