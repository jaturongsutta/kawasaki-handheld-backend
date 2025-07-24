import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CommonService } from 'src/common/common.service'
import { User } from 'src/entity/user.entity'
import { DataSource, Repository } from 'typeorm'

import { BaseResponse } from 'src/common/base-response'
import { UserRole } from 'src/entity/user-role.entity'
import { NgRecordDto } from './dto/ngrecord.dto'
import { HistoricalRequestDto } from './dto/historical.dto'

@Injectable()
export class NGService {
  constructor(
    private commonService: CommonService,
    private dataSource: DataSource
  ) {}

  async getNgInitialData(lineCd: string): Promise<any> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Line_CD', lineCd)

      let planResult = await this.commonService.executeStoreProcedure(
        `sp_Prodcution_List_Running`,
        req
      )
      const planRow = planResult?.recordset?.[0] || null

      console.log(`planResult ====> `, planResult)
      const processQuery = `
        SELECT DISTINCT mlm.Process_CD 
        FROM M_Line_Machine mlm
        INNER JOIN M_Machine mmc ON mlm.Process_CD = mmc.Process_CD
        WHERE mlm.Line_CD = '${lineCd}' and Model_CD= '${planRow?.Model_CD}'
      `

      const reasonQuery = `
        SELECT DISTINCT Predefine_Item_CD, Value_EN 
        FROM co_Predefine_Item 
        WHERE Predefine_Group = 'NG_Reason'
      `

      const processList = await this.commonService.executeQuery(processQuery)
      const reasonList = await this.commonService.executeQuery(reasonQuery)

      return {
        result: true,
        data: {
          process: processList.map((p) => p.Process_CD),
          reason: reasonList.map((r) => ({
            code: r.Predefine_Item_CD,
            label: r.Value_EN,
          })),
          plan: planRow, // แผนปัจจุบัน
          default: {
            ngDate: new Date().toISOString().split('T')[0], // yyyy-mm-dd
            ngTime: new Date().toTimeString().split(' ')[0], // HH:mm:ss
            quantity: 1,
          },
        },
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async saveNgRecord(
    dto: NgRecordDto
  ): Promise<{ result: boolean; message?: string }> {
    try {
      const request = this.dataSource.createQueryRunner()
      await request.connect()

      const query = `
      INSERT INTO NG_Record
        (Plan_ID, Line_CD, Process_CD, NG_Date, NG_Time, Quantity, Reason, Comment, ID_Ref, Status, CREATED_DATE, CREATED_BY,UPDATED_DATE,UPDATED_BY)
      VALUES
        (${dto.planId}, N'${dto.lineCd}', N'${dto.processCd}', N'${dto.ngDate}', N'${dto.ngTime}', ${dto.quantity},
         N'${dto.reason}', N'${dto.comment}', NULL, '00', GETDATE(), ${dto.createdBy},GETDATE(),${dto.createdBy})
    `

      console.log(query)
      await request.query(query)

      await request.release()

      return { result: true }
    } catch (error) {
      return { result: false, message: error.message }
    }
  }

  async getNgRecordList(lineCd: string, planDate: string): Promise<any> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Line_CD', lineCd)
      req.input('Plan_Date', planDate)

      const planResult = await this.commonService.executeStoreProcedure(
        `sp_Line_Stop_Search_Plan`,
        req
      )

      const records = planResult?.recordsets || []

      console.log(planResult)
      return {
        result: true,
        data: records,
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async getHistoricalList(dto: HistoricalRequestDto): Promise<any> {
    const req = await this.commonService.getConnection()
    req.input('Line_CD', dto.lineCd)
    req.input('Date_From', dto.dateFrom)
    req.input('Date_To', dto.dateFrom)
    req.input('Row_No_From', dto.rowFrom)
    req.input('Row_No_To', dto.rowTo)

    const result = await this.commonService.executeStoreProcedure(
      'sp_handheld_NG_Search',
      req
    )

    return {
      result: true,
      data: {
        records: result.recordsets[0] || [],
        total: result.recordsets[1]?.[0]?.Total_Record || 0,
      },
    }
  }
}
