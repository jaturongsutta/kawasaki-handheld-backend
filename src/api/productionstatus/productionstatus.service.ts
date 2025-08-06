import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CommonService } from 'src/common/common.service'
import { User } from 'src/entity/user.entity'
import { DataSource, Repository } from 'typeorm'

import { BaseResponse } from 'src/common/base-response'
import { UserRole } from 'src/entity/user-role.entity'
import { NgRecordDto } from './dto/ngrecord.dto'
import { HistoricalRequestDto } from './dto/historical.dto'
import { PlanSearchDto } from './dto/Plansearch.dto'

@Injectable()
export class ProductionstatusService {
  constructor(
    private commonService: CommonService,
    private dataSource: DataSource
  ) {}

  async getCurrentProductionPlan(lineCd: string): Promise<any> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Line_CD', lineCd)

      const result = await this.commonService.executeStoreProcedure(
        'sp_Plan_List_Current',
        req
      )

      return {
        result: true,
        data: result?.recordsets || [],
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async getProductionStatusById(id: any): Promise<any> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Id', id)

      const result = await this.commonService.executeStoreProcedure(
        'sp_Production_Load',
        req
      )
      console.log(result)

      return {
        result: true,
        data: result?.recordsets[0][0] || null,
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async checkOTAvailable(planId: number): Promise<any> {
    try {
      const req = await this.commonService.getConnection()
      req.input('plan_id', planId)

      const result = await this.commonService.executeStoreProcedure(
        'sp_handheld_chk_OT',
        req
      )

      return {
        result: true,
        data: result.recordset,
      }
    } catch (error) {
      ;``
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async updatePlanOTStatus(
    planId: number,
    isOT: boolean,
    timeMins: number,
    updatedBy: string
  ) {
    try {
      const req = await this.commonService.getConnection()

      // 1. ดึงข้อมูลเดิมก่อน
      req.input('plan_id', planId)
      const result = await req.query(`
      SELECT 
        plan_total_time, 
        DATEDIFF(SECOND, 0, cycle_time) AS cycle_seconds 
      FROM prod_plan 
      WHERE id = @plan_id
    `)

      const current = result.recordset[0]
      if (!current) throw new Error('ไม่พบข้อมูลแผน')

      let newTime = current.plan_total_time

      // 2. คำนวณเพิ่มหรือลบ Time_Mins
      if (isOT) {
        newTime += timeMins
      } else {
        newTime -= timeMins
        if (newTime < 0) newTime = 0
      }

      // 3. คำนวณ target_fg ใหม่
      const cycleSeconds = current.cycle_seconds
      const cycleMinutes = cycleSeconds / 60

      const newTarget =
        cycleMinutes > 0 ? Math.floor(newTime / cycleMinutes) : 0

      // 4. อัปเดตข้อมูล
      const updateReq = await this.commonService.getConnection()
      updateReq.input('plan_id', planId)
      updateReq.input('new_time', newTime)
      updateReq.input('new_target', newTarget)
      updateReq.input('ot', isOT ? 'Y' : 'N')
      updateReq.input('updated_by', updatedBy)

      await updateReq.query(`
        UPDATE prod_plan
        SET
          plan_total_time = @new_time,
          plan_fg_amt = @new_target,
          OT = @ot,
          updated_by = @updated_by,
          updated_date = GETDATE()
        WHERE id = @plan_id
      `)
      //   await updateReq.query(`
      //   UPDATE prod_plan
      //   SET
      //     plan_total_time = @new_time,
      //     OT = @ot,
      //     updated_by = @updated_by,
      //     updated_date = GETDATE()
      //   WHERE id = @plan_id
      // `)

      return { result: true }
    } catch (error) {
      console.error('❌ Error in updatePlanOTStatus:', error)
      return {
        result: false,
        message: error.message || 'ไม่สามารถอัปเดตข้อมูลได้',
      }
    }
  }

  async stopProductionPlan(planId: number, updatedBy: string) {
    try {
      const req = await this.commonService.getConnection()

      await req.query(`
        UPDATE prod_plan
        SET 
          status = '30',
          Actual_Stop_Dt = GETDATE(),
          Plan_Stop_Time = GETDATE(),
          updated_by = '${updatedBy}',
          updated_date = GETDATE()
        WHERE id = ${planId}
      `)

      return { result: true }
    } catch (e) {
      return { result: false, message: e.message }
    }
  }

  async searchPlans(
    dto: PlanSearchDto
  ): Promise<{ result: boolean; data?: any; message?: string }> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Line_CD', dto.Line_CD)
      req.input('Plan_Date_From', dto.Plan_Date_From ?? null)
      req.input('Plan_Date_To', dto.Plan_Date_To ?? null)
      req.input('Model_CD', dto.Model_CD ?? null)
      req.input('Status', dto.Status ?? null)
      req.input('Row_No_From', dto.Row_No_From ?? 1)
      req.input('Row_No_To', dto.Row_No_To ?? 10)

      const result = await this.commonService.executeStoreProcedure(
        'sp_Plan_Search',
        req
      )
      console.log(result)
      return {
        result: true,
        data: {
          records: result.recordsets,
          total: result.recordsets[1]?.[0]?.Total_Record ?? 0,
        },
      }
    } catch (error) {
      return {
        result: false,
        message: error.message ?? 'เกิดข้อผิดพลาดในการค้นหาแผนผลิต',
      }
    }
  }
}
