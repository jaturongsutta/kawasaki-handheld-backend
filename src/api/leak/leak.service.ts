import { Injectable } from '@nestjs/common'
import { CommonService } from 'src/common/common.service'
import { DataSource, Repository } from 'typeorm'
import { LeakNoPlanDto } from './dto/leak_no_plan.dto'
import { LeakTestDto } from './dto/leak_test.dto'

@Injectable()
export class LeakService {
  constructor(
    private commonService: CommonService,
    private dataSource: DataSource
  ) { }

  /* CYH NG Record */
  async searchNGCYH(
    Machine_No: string
  ): Promise<any> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Machine_No', Machine_No)
      req.output("Return_CD", "");
      req.output("Return_Name", "");

      console.log("machine no ", Machine_No)

      const result = await this.commonService.executeStoreProcedure(
        `sp_search_NG_CYH`,
        req
      )

      if (result?.output["Return_CD"] == 'Fail') {
        return {
          result: false,
          message: result?.output["Return_Name"],
        }
      }

      const records = result?.recordsets || []

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
        data: records.length > 0 ? records[0] : []
      }

    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }
  /* End  CYH NG Record */

  /* CYH Leak Test */
  async getWorkType(): Promise<any> {
    try {
      const q = `SELECT  Predefine_CD FROM co_Predefine where Predefine_Group='CYH_Work_Type' and Is_Active='Y'`
      const request = this.dataSource.createQueryRunner()
      await request.connect()
      const valueList = await request.query(q)

      return {
        result: true,
        data: valueList.map(r => r.Predefine_CD)
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async getGSCount(modelCd, serialNo): Promise<any> {
    try {
      console.log("model ", modelCd)
      console.log("serialNo ", serialNo)

      const q = `SELECT count(*) as count From Leak_CYH_Data WHERE Model_CD = '${modelCd}' AND Serial_No = '${serialNo}'`
      const request = this.dataSource.createQueryRunner()
      await request.connect()
      const valueList = await request.query(q)

      return {
        result: true,
        data: valueList.map(r => r.count)[0]
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }


  async getProductionRunningLeakList(
    Machine_No: string,
    Work_Type: string,
  ): Promise<any> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Machine_No', Machine_No)
      req.input('Work_Type', Work_Type)
      req.output("Return_CD", "");
      req.output("Return_Name", "");

      console.log("machine no ", Machine_No)
      console.log("worktype ", Work_Type)

      const result = await this.commonService.executeStoreProcedure(
        `sp_Production_List_Running_Leak`,
        req
      )

      if (result?.output["Return_CD"] == 'Fail') {
        return {
          result: false,
          message: result?.output["Return_Name"],
        }
      }

      const records = result?.recordsets || []

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
        data: records.length > 0 ? records[0] : [],
      }

    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async saveLeakTest(
    dto: LeakTestDto
  ): Promise<any> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Mapped_Plan_ID', dto.Mapped_Plan_ID)
      req.input('Model_CD', dto.Model_CD)
      req.input("Machine_No", dto.Machine_No);
      req.input("Work_Type", dto.Work_Type);
      req.input('Serial_No', dto.Serial_No)
      req.input('GS_No', dto.GS_No)
      req.input('CA_No', dto.CA_No)
      req.input('CA_Date', dto.CA_Date)
      req.input('Mold_No', dto.Mold_No)
      req.input('Scan_Date', dto.Scan_Date)
      req.input("Created_By", dto.CREATED_BY);

      req.output("Return_CD", "");
      req.output("Return_Name", "");
      req.output("Return_result", "");

      console.log("LeakTestDto ", dto)


      const result = await this.commonService.executeStoreProcedure(
        `sp_add_Leak_CYH_Data`,
        req
      )
      const records = result?.recordsets || []

      if (result?.output["Return_CD"] == 'Fail') {
        return {
          result: false,
          message: result?.output["Return_Name"],
          data: {}
        }
      }
      else if (result?.output["Return_result"] == 'OK') {
        return {
          result: true,
          data: records.length > 0 ? records[0].length > 0 ? records[0][0] : {} : {},
          type: 'OK',
          message: '',
        }
      }
      else {
        return {
          result: true,
          type: 'NG',
          data: records.length > 0 ? records[0].length > 0 ? records[0][0] : {} : {},
        }
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async updateLeakTest(
    dto: LeakTestDto
  ): Promise<{ result: boolean; message?: string }> {
    try {
      const request = this.dataSource.createQueryRunner()
      await request.connect()

      const req = await this.commonService.getConnection()
      req.input('Line_CD', dto.Line_CD)
      req.input('ID', dto.NG_Id)
      req.input("Casting_No", dto.CA_No);
      req.input("Casting_Date", dto.CA_Date);
      req.input('Mold_No', dto.Mold_No)
      req.input("Confirm_by", dto.UPDATED_BY);

      req.output("Return_CD", "");

      console.log("updateLeakTestOK ", dto)

      const result = await this.commonService.executeStoreProcedure(
        `sp_update_Leak_CYH_Data`,
        req
      )

      if (result?.output["Return_CD"] == 'Success') {
        return { result: true, message: 'Update success' }
      }
      else {
        return {
          result: false,
          message: 'Update failed'
        }
      }
    } catch (error) {
      console.error('updateLeakTest Error:', error)
      return { result: false, message: error.message }
    }
  }

  async checkTestResult(machineNo: string): Promise<any> {
    try {
      const q = `select top(1) * from Leak_CYH_Data where Machine_No = '${machineNo}' and Tested_Status is not null and Confirmed_DATE is null order by updated_date`
      const request = this.dataSource.createQueryRunner()
      await request.connect()
      const valueList = await request.query(q)

      return {
        result: true,
        data: valueList
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }


  async checkMachine(machineNo: string): Promise<any> {
    try {
      const q = `SElECT distinct Machine_No FROM M_Line_Machine WHERE is_Active='Y' and Machine_No ='${machineNo}'`;

      const request = this.dataSource.createQueryRunner()
      await request.connect()
      const valueList = await request.query(q)

      return {
        result: true,
        data: valueList
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async getLeakCYH(serialNo: string, modelCd: string): Promise<any> {
    try {
      const q = `select top(1) * from Leak_CYH_Data where Serial_No = '${serialNo}' and Model_CD= '${modelCd}' order by updated_date desc
`
      const request = this.dataSource.createQueryRunner()
      await request.connect()
      const valueList = await request.query(q)

      return {
        result: true,
        data: valueList
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

  async getOKNG(machineNo: string): Promise<any> {
    try {
      const q = `select top(1) Machine_No,Model_CD,Serial_No,
                case when Tested_Status=2 then 'NG' else 'OK' end  test_result, --23/12/2025
                'P1 (OH)' as NG_P1,  --1=OK, 2=NG, 0=none ส่วน OH
                'P2 (WJ)' as NG_P2,  
                'PS (CC)' as NG_P3,
                'P4' as NG_P4,
                'T/B' as NG_TB,
                case when NG_P1=1 then '00FF00' when NG_P1=2 then 'FF0000' else 'FFFFFF' end NG_P1_color,
                case when NG_P2=1 then '00FF00' when NG_P2=2 then 'FF0000' else 'FFFFFF' end  as NG_P2_color,
                case when NG_P3=1 then '00FF00' when NG_P3=2 then 'FF0000' else 'FFFFFF' end  as NG_P3_color,
                case when NG_P4=1 then '00FF00' when NG_P4=2 then 'FF0000' else 'FFFFFF' end  as NG_P4_color,
                case when NG_TB=1 then '00FF00' when NG_TB=2 then 'FF0000' else 'FFFFFF' end  as NG_TB_color,
                Casting_No as CA_No,
                Casting_Date as CA_Date,
                Mold_No as Mold_No,
                mapped_plan_id as plan_id,
                ID as Id
                from Leak_CYH_Data
                where Machine_No = '${machineNo}'
                and Tested_Status is not null
                and Confirmed_DATE is null  
                order by Updated_Date

`
      const request = this.dataSource.createQueryRunner()
      await request.connect()
      const valueList = await request.query(q)

      return {
        result: true,
        data: valueList
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }
  /* End CYH Leak Test */

  async getMachinePredefineAll(): Promise<any> {
    try {
      const q = `select Predefine_CD Value, Value_EN Title from co_Predefine where Predefine_Group='Leak_CYH_Machine' and Is_Active = 'Y'`
      const request = this.dataSource.createQueryRunner()
      await request.connect()
      const valueList = await request.query(q)

      return {
        result: true,
        data: valueList
      }
    } catch (error) {
      return {
        result: false,
        message: error.message,
      }
    }
  }

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

      const req = await this.commonService.getConnection()
      req.input('Machine_No', dto.Machine_No)
      req.input('Start_Date', dto.Start_Date)
      req.input("Start_Time", dto.Start_Time);
      req.input("End_Date", dto.End_Date);
      req.input('End_Time', dto.End_Time)
      req.input("Created_By", dto.CREATED_BY);

      req.output("Return_CD", "");
      req.output("Return_Name", "");
      req.output("Return_result", "");


      console.log("sp_add_Leak_NoPlan ", dto)

      const result = await this.commonService.executeStoreProcedure(
        `sp_add_Leak_NoPlan`,
        req
      )

      if (result?.output["Return_CD"] == 'Success') {
        return { result: true, message: 'Insert success' }
      }
      else {
        return {
          result: false,
          message: result?.output["Return_CD"]
        }
      }
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
