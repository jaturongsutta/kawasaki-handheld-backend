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
import { CheckOtDto } from './dto/check-ot.dto'

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
        'sp_handheld_Plan_List_Current',
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

  async checkOTAvailable(dto: CheckOtDto): Promise<any> {
    try {
      // req.input('plan_id', planId)

      // const result = await this.commonService.executeStoreProcedure(
      //   'sp_handheld_chk_OT',
      //   req
      // )
      const conn = await this.commonService.getConnection() // ตามโครงของคุณ
      conn.input('Line_CD', dto.Line_CD)
      conn.input('StartDT', dto.Plan_Start_DT)
      conn.input('StopDT', dto.Plan_Stop_DT)
      conn.input('B1', dto.B1)
      conn.input('B2', dto.B2)
      conn.input('B3', dto.B3)
      conn.input('B4', dto.B4)
      conn.input('OT', dto.OT)
      conn.input('Shift_Period', dto.Shift_Period)
      conn.input('Id', dto.id)
      const recordset = await conn.query(
        `
          SELECT dbo.fn_chk_Plan_Break_Time(
            @Line_CD, @StartDT, @StopDT, @B1, @B2, @B3, @B4, @OT, @Shift_Period, @Id
          ) AS Time_Mins
        `,
        conn
      )
      console.log(`recordset ===> ${recordset.recordsets[0][0].Time_Mins}`)
      if (recordset.recordsets[0][0].Time_Mins > 0) {
        return {
          result: false,
          // data: result.recordset,
          message:
            'กรุณาตรวจสอบ ช่วงเวลา Break/OT ไม่อยู่ในช่วงเวลา Plan Start and Stop time',
        }
      } else {
        return {
          result: true,
          // data: result.recordset,
        }
      }
    } catch (error) {
      console.log(error)
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async updatePlanOTStatus(
    planId: number,
    isOT: boolean,
    dto: CheckOtDto,
    cycletime: any,
    updatedBy: string
  ) {
    try {
      const req = await this.commonService.getConnection()

      // --- Bind input สำหรับฟังก์ชัน ---
      req.input('Line_CD', dto.Line_CD)
      req.input('Plan_date', dto.Plan_Start_DT.split(' ')[0]) // YYYY-MM-DD
      req.input('Plan_Start_Time', dto.Plan_Start_DT.split(' ')[1]) // HH:mm:ss
      req.input('Plan_Stop_Time', dto.Plan_Stop_DT) // HH:mm:ss (เวลาอย่างเดียว)
      req.input('B1', dto.B1)
      req.input('B2', dto.B2)
      req.input('B3', dto.B3)
      req.input('B4', dto.B4)
      req.input('OT', dto.OT)

      // --- คำนวณเวลารวมจากฟังก์ชัน ---
      const { recordset } = await req.query(`
        SELECT dbo.fn_get_Plan_OperTime(
          @Line_CD, 
          @Plan_date, 
          @Plan_Start_Time, 
          @Plan_Stop_Time, 
          @B1, @B2, @B3, @B4, @OT
        ) AS OperTimeMins
      `)

      const totalPlanTime = recordset?.[0]?.OperTimeMins ?? 0

      // --- คำนวณจำนวนเป้า (ชิ้น) ---
      // cycletime = นาทีต่อชิ้น (เช่น 5.5 นาที/ชิ้น)
      const planTargetFg =
        cycletime > 0 ? Math.floor(totalPlanTime / cycletime) : 0

      // --- Update prod_plan ---
      const updateReq = await this.commonService.getConnection()
      updateReq.input('plan_id', planId)
      updateReq.input('new_time', totalPlanTime)
      updateReq.input('new_target', planTargetFg)
      updateReq.input('ot', isOT ? 'Y' : 'N')
      updateReq.input('b1', dto.B1)
      updateReq.input('b2', dto.B2)
      updateReq.input('b3', dto.B3)
      updateReq.input('b4', dto.B4)
      updateReq.input('updated_by', updatedBy)

      await updateReq.query(`
        UPDATE prod_plan
        SET
          plan_total_time = @new_time,
          plan_fg_amt  = @new_target,
          OT              = @ot,
          B1              = @b1,
          B2              = @b2,
          B3              = @b3,
          B4              = @b4,
          updated_by      = @updated_by,
          updated_date    = GETDATE()
        WHERE id = @plan_id
      `)

      return {
        result: true,
        data: {
          plan_total_time: totalPlanTime,
          plan_target_fg: planTargetFg,
        },
      }
    } catch (error: any) {
      console.error(' Error in updatePlanOTStatus:', error)
      return {
        result: false,
        message: error?.message || 'ไม่สามารถอัปเดตข้อมูลได้',
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
