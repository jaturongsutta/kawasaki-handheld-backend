import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CommonService } from 'src/common/common.service'
import { User } from 'src/entity/user.entity'
import { DataSource, Repository } from 'typeorm'

import { BaseResponse } from 'src/common/base-response'
import { UserRole } from 'src/entity/user-role.entity'
import { HistoricalRequestDto } from './dto/historical.dto'
import { LineStopRecordDto } from './dto/line-stopre-cord.dto'

@Injectable()
export class LineStopService {
  constructor(
    private commonService: CommonService,
    private dataSource: DataSource
  ) {}

  async getLineStopInitialData(lineCd: string): Promise<any> {
    try {
      const _tempLineCD = 'CYH#6'

      const req = await this.commonService.getConnection()
      req.input('Line_CD', _tempLineCD)

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
        WHERE mlm.Line_CD = '${_tempLineCD}' and Model_CD= '${planRow?.Model_CD}'
      `

      const reasonQuery = `
        SELECT DISTINCT Predefine_CD, Value_EN 
        FROM co_Predefine 
        WHERE Predefine_Group = 'Stop_Reason'
      `

      const processList = await this.commonService.executeQuery(processQuery)
      const reasonList = await this.commonService.executeQuery(reasonQuery)

      return {
        result: true,
        data: {
          process: processList.map((p) => p.Process_CD),
          reason: reasonList.map((r) => ({
            code: r.Predefine_CD,
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

  async saveLineStopRecord(
    dto: LineStopRecordDto
  ): Promise<{ result: boolean; message?: string }> {
    try {
      const request = this.dataSource.createQueryRunner()
      await request.connect()

      const query = `
      INSERT INTO Line_Stop_Record
        (Plan_ID, Line_CD, Process_CD, Line_Stop_Date, Line_Stop_Time, Loss_Time, Reason, Comment, Status, CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY, ID_Ref)
      VALUES
        (${dto.planId},
         N'${dto.lineCd}',
         N'${dto.processCd}',
         N'${dto.lineStopDate}',
         N'${dto.lineStopTime}',
         ${dto.lossTime},
         N'${dto.reason}',
         N'${dto.comment}',
         '00',
         GETDATE(),
         ${dto.createdBy},
         NULL,
         NULL,
         0)
    `

      console.log(query)
      await request.query(query)

      await request.release()

      return { result: true }
    } catch (error) {
      return { result: false, message: error.message }
    }
  }

  async getLineStopRecordList(lineCd: string, planDate: string): Promise<any> {
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
    req.input('Date_To', new Date())
    req.input('Row_No_From', dto.rowFrom)
    req.input('Row_No_To', dto.rowTo)

    const result = await this.commonService.executeStoreProcedure(
      'sp_handheld_LineStop_Search',
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
