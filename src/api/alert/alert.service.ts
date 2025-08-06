import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import * as net from 'net'
import { LineDevice } from 'src/entity/line-device.entity'
import { DataSource, Repository } from 'typeorm'
import { RegisterDeviceDto } from './dto/register-device.dto'
import { InfoAlertRequestDto } from './dto/info-alert-request.dto'
import { CommonService } from 'src/common/common.service'
import { Interval } from '@nestjs/schedule'
import { MarkReadDto } from './dto/mark-read.dto'

interface DeviceInfo {
  deviceId: string
  ip: string
  port: number
}

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(LineDevice)
    private lineDeviceRepository: Repository<LineDevice>,
    private readonly commonService: CommonService,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}
  private devices: DeviceInfo[] = []

  @Interval(600000)
  async handlePushInfoAlert() {
    const lineCd = ''
    const ip = ''
    const mac = ''

    try {
      const result = await this.sendMultipleTCPFromStore(lineCd, ip, mac)
      console.log('📡 Push alert result:', result)
    } catch (e) {
      console.error('❌ Push alert error:', e.message)
    }
  }

  sendTCP(ip: string, port: number, message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket()

      client.connect(port, ip, () => {
        console.log(`✅ Connected to ${ip}:${port}`)
        client.write(message)
        client.end()
        resolve({ status: 'sent', to: `${ip}:${port}` })
      })

      client.on('error', (err) => {
        console.error(`❌ TCP Error to ${ip}:${port}`, err.message)
        reject({ error: err.message, to: `${ip}:${port}` })
      })
    })
  }

  async sendMultipleTCP(
    targets: { ip: string; port: number }[],
    message: string
  ): Promise<any[]> {
    const results = await Promise.allSettled(
      targets.map((target) => this.sendTCP(target.ip, target.port, message))
    )

    return results.map((result, index) => {
      const { ip, port } = targets[index]
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return { error: result.reason?.message, to: `${ip}:${port}` }
      }
    })
  }

  async sendMultipleTCPFromStore(
    lineCD: string,
    ip: string,
    mac: string
  ): Promise<any[]> {
    try {
      // 1. สร้าง connection
      const conn = await this.commonService.getConnection()
      conn.input('Line_CD', lineCD)
      conn.input('IP_Address', ip)
      conn.input('MAC_Address', mac)

      // 2. เรียก stored procedure
      const result = await this.commonService.executeStoreProcedure(
        'sp_handheld_InfoAlert_Push',
        conn
      )

      const rows = result.recordset || []
      if (!rows.length) return []

      // 3. แปลงข้อมูลสำหรับส่ง TCP
      const targets = rows.map((row) => ({
        ip: row.IP_Address,
        port: 4000,
        message: row.Header_Alert,
      }))

      // 4. ส่งข้อความ TCP ไปยังแต่ละเครื่อง
      const results = await Promise.allSettled(
        targets.map((t) =>
          this.sendTCP(t.ip, t.port, t.message).catch((err) =>
            Promise.reject(err)
          )
        )
      )

      // 5. แปลงผลลัพธ์
      return results.map((res, index) => {
        const { ip, port, message } = targets[index]
        return res.status === 'fulfilled'
          ? { to: `${ip}:${port}`, status: 'sent', message }
          : {
              to: `${ip}:${port}`,
              status: 'failed',
              error: res.reason?.message ?? 'Unknown error',
            }
      })
    } catch (e) {
      console.error('❌ sendMultipleTCPFromStore Error:', e)
      return [
        {
          status: 'critical-error',
          error: e?.message ?? 'Unexpected error occurred',
        },
      ]
    }
  }

  async saveDevice(dto: RegisterDeviceDto) {
    const existing = await this.lineDeviceRepository.findOne({
      where: { deviceId: dto.deviceId },
    })

    const now = new Date()
    const result = await this.commonService.executeQuery(
      `SELECT User_ID FROM um_user WHERE Username = '${dto.username}'`
    )

    if (!result || result.length === 0) {
      throw new Error('User not found')
    }

    console.log(result)

    const userId = result[0].User_ID
    if (existing) {
      existing.ip = dto.ip
      existing.lineCD = dto.lineCD ?? null
      existing.updatedBy = userId
      existing.updatedDate = now
      await this.lineDeviceRepository.save(existing)
      console.log(`🔄 Updated device ${dto.deviceId}`)
    } else {
      const device = this.lineDeviceRepository.create({
        deviceId: dto.deviceId,
        ip: dto.ip,
        lineCD: dto.lineCD ?? null,
        isActive: 'Y',
        createdBy: userId,
        updatedBy: userId,
        createdDate: now,
        updatedDate: now,
      })
      await this.lineDeviceRepository.insert(device)
      console.log(`🆕 Inserted new device ${dto.deviceId}`)
    }

    return { status: 0 }
  }

  async getInfoAlerts(dto: InfoAlertRequestDto): Promise<any> {
    const req = await this.commonService.getConnection()
    req.input('Line_CD', dto.lineCd)
    req.input('Row_No_From', dto.rowFrom)
    req.input('Row_No_To', dto.rowTo)

    const result = await this.commonService.executeStoreProcedure(
      'sp_handheld_InfoAlert',
      req
    )
    console.log(result.recordsets[0])
    console.log(result.recordsets[1])
    console.log(result.recordsets[2])

    return {
      result: true,
      data: {
        records: result.recordsets[0] || [],
        total: result.recordsets[1]?.[0]?.Total_Record || 0,
        unread: result.recordsets[2]?.[0]?.Total_UnRead || 0,
      },
    }
  }

  getAllRegisteredDevices(): DeviceInfo[] {
    return this.devices
  }

  async markAsRead(dto: MarkReadDto): Promise<{ result: boolean }> {
    const conn = await this.commonService.getConnection()

    await conn.input('ID_Ref', dto.ID_Ref).input('CREATED_BY', dto.CREATED_BY)
      .query(`
        INSERT INTO Info_Alert_Read (ID_Ref, CREATED_DATE, CREATED_BY)
        VALUES (@ID_Ref, GETDATE(), @CREATED_BY)
      `)

    return { result: true }
  }
}
