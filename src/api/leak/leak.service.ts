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
        data: records.length > 0 ? records[0] :[]
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
        data: records.length > 0 ? records[0] :[],
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

      console.log(`updateLeakTest => ${dto}`);

      const query = `
        UPDATE L
        SET 
            L.Casting_No = '${dto.CA_No}',
            L.Casting_Date = '${dto.CA_Date}',    
            L.Mold_No = '${dto.Mold_No}',                
            L.UPDATED_DATE = GETDATE(),          
            L.UPDATED_BY = '${dto.UPDATED_BY}',              
            L.Confirmed_date = GETDATE(),        
            L.Confirmed_by = '${dto.UPDATED_BY}'             
        FROM Leak_CYH_Data AS L
          WHERE ID = '${dto.NG_Id}'
      `

      console.log('Leak_CYH_Data Update Query ===>')
      console.log(query)

      await request.query(query)

      const query2 = `
        INSERT INTO NG_Record
          (Plan_ID,
           Line_CD,
           NG_Date,
           NG_Time,
           Quantity,
           Reason,
           Comment,
           ID_Ref,
           Status,
           CREATED_DATE,
           CREATED_BY,
           UPDATED_DATE,
           UPDATED_BY
           )
        VALUES
          (
            N'${dto.Plant_Id}',
            N'${dto.Line_Cd}',
            CAST(GETDATE() AS date),
            CONVERT(time, GETDATE())  ,
            '1',
            null,
            null,
            null,
            '00',
            GETDATE(),
            ${dto.UPDATED_BY},
            GETDATE(),
            ${dto.UPDATED_BY}
          )
      `

      console.log('NG_Record Insert Query ===>')
      console.log(query2)

      await request.query(query2)
      await request.release()

      return { result: true, message: 'Update success' }
    } catch (error) {
      console.error('updateLeakTest Error:', error)
      return { result: false, message: error.message }
    }
  }

  async updateLeakTestOK(
    dto: LeakTestDto
  ): Promise<{ result: boolean; message?: string }> {
    try {
      const request = this.dataSource.createQueryRunner()
      await request.connect()

      console.log(`updateLeakTestOK => ${dto}`);

      const query = `
        UPDATE L
        SET 
            L.Casting_No = '${dto.CA_No}',    
            L.Casting_Date = '${dto.CA_Date}',    
            L.Mold_No = '${dto.Mold_No}',                
            L.UPDATED_DATE = GETDATE(),          
            L.UPDATED_BY = '${dto.UPDATED_BY}',              
            L.Confirmed_date = GETDATE(),        
            L.Confirmed_by = '${dto.UPDATED_BY}'             
        FROM Leak_CYH_Data AS L
          WHERE ID = '${dto.NG_Id}'
      `

      console.log('Leak_CYH_Data Update Query ===>')
      console.log(query)

      await request.query(query)
      await request.release()

      return { result: true, message: 'Update success' }
    } catch (error) {
      console.error('updateLeakTest Error:', error)
      return { result: false, message: error.message }
    }
  }
  /* End CYH Leak Test */


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
