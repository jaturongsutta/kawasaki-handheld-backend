import { Injectable } from '@nestjs/common'
import { CommonService } from 'src/common/common.service'
import { DataSource, Repository } from 'typeorm'
import { LeakNoPlanDto } from './dto/leak_no_plan.dto'

@Injectable()
export class LeakService {
  constructor(
    private commonService: CommonService,
    private dataSource: DataSource
  ) {}

  async getLeakInitialData(lineCd: string): Promise<any> {
    try {
      const lineMachineQuery = `SELECT * FROM M_Line_Machine WHERE is_Active='Y' AND Line_CD ='${lineCd}'`
      const request = this.dataSource.createQueryRunner()
      await request.connect()
      const lineMachineList = await request.query(lineMachineQuery)

      return {
        result: true,
        data: lineMachineList.map((r) => ({
          ...r,
          WT: r.WT ? new Date(r.WT).toISOString() : null,
          HT: r.HT ? new Date(r.HT).toISOString() : null,
          MT: r.MT ? new Date(r.MT).toISOString() : null,
          CREATED_DATE: r.CREATED_DATE
            ? new Date(r.CREATED_DATE).toISOString()
            : null,
          UPDATED_DATE: r.UPDATED_DATE
            ? new Date(r.UPDATED_DATE).toISOString()
            : null,
        })),
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async saveLeakNoPlan(
    dto: LeakNoPlanDto
  ): Promise<{ result: boolean; message?: string }> {
    try {
      const request = this.dataSource.createQueryRunner()
      await request.connect()

      const query = `
        INSERT INTO Leak_NoPlan
          (Machine_No,
           Start_Date,
           Start_Time,
           End_Date,
           End_Time,
           Loss_Time,
           CREATED_DATE,
           CREATED_BY,
           UPDATED_DATE,
           UPDATED_BY)
        VALUES
          (
            N'${dto.Machine_No}',
            N'${dto.Start_Date}',
            N'${dto.Start_Time}',
            N'${dto.End_Date}',
            N'${dto.End_Time}',
            ${dto.Loss_Time},
            GETDATE(),
            ${dto.CREATED_BY},
            GETDATE(),
            ${dto.UPDATED_BY}
          )
      `

      console.log('Leak_NoPlan Insert Query ===>')
      console.log(query)

      await request.query(query)
      await request.release()

      return { result: true, message: 'Insert success' }
    } catch (error) {
      console.error('saveLeakNoPlan Error:', error)
      return { result: false, message: error.message }
    }
  }
  async getNoPlanRecordList(
    lineCd: string,
    Date_NoPlan: string,
    Row_No_From: number,
    Row_No_To: number
  ): Promise<any> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Line_CD', lineCd)
      req.input('Date_NoPlan', Date_NoPlan)
      req.input('Row_No_From', Row_No_From)
      req.input('Row_No_To', Row_No_To)

      const planResult = await this.commonService.executeStoreProcedure(
        `sp_handheld_NoPlan_Search`,
        req
      )

      const records = planResult?.recordsets || []

      if (
        !records ||
        records.length === 0 ||
        (records[0] && records[0].length === 0)
      ) {
        return {
          result: false,
          message: 'No records found',
        }
      }

      return {
        result: true,
        data: records,
        total_loss_time: planResult.recordsets[1]?.[0]?.total_loss_time,
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }
}
