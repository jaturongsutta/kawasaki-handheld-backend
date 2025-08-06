import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  HttpStatus,
} from '@nestjs/common'
import { AlertService } from './alert.service'
import { Response } from 'express'
import { RegisterDeviceDto } from './dto/register-device.dto'
import { InfoAlertRequestDto } from './dto/info-alert-request.dto'
import { MarkReadDto } from './dto/mark-read.dto'

@Controller('alert')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  // @Post('send')
  // async sendAlert(@Body() body: any, @Res() res: Response) {
  //   const { targets, message } = body

  //   if (!targets || !Array.isArray(targets) || !message) {
  //     return res.status(HttpStatus.BAD_REQUEST).json({
  //       error: 'targets (ip, port) array and message are required',
  //     })
  //   }

  //   try {
  //     const results = await this.alertService.sendMultipleTCP(targets, message)
  //     return res.status(HttpStatus.OK).json({ status: 'done', results })
  //   } catch (error) {
  //     return res
  //       .status(HttpStatus.INTERNAL_SERVER_ERROR)
  //       .json({ error: error.message })
  //   }
  // }

  @Post('register-device')
  async registerDevice(@Body() body: RegisterDeviceDto) {
    const { deviceId, ip, port } = body

    if (!deviceId || !ip || !port) {
      throw new BadRequestException('deviceId, ip, port are required')
    }

    await this.alertService.saveDevice(body)

    return { status: 'registered', ip, port }
  }

  @Post('info-alert')
  async getAlerts(@Body() body: any) {
    const dto = new InfoAlertRequestDto()
    dto.lineCd = body.Line_CD // 👈 Mapping ด้วยตนเอง
    dto.rowFrom = body.Row_No_From
    dto.rowTo = body.Row_No_To

    return await this.alertService.getInfoAlerts(dto)
  }

  @Post('mark-read')
  async markAsRead(@Body() body: any) {
    const dto = new MarkReadDto()
    dto.ID_Ref = body.ID_Ref
    dto.CREATED_BY = body.CREATED_BY

    return await this.alertService.markAsRead(dto)
  }
}
