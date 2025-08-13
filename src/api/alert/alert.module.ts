// src/api/alert/alert.module.ts
import { Module } from '@nestjs/common'
import { AlertController } from './alert.controller'
import { AlertService } from './alert.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LineDevice } from 'src/entity/line-device.entity'
import { CommonModule } from 'src/common/common.module'
import { LineContextService } from 'src/_services/line-context.service'

@Module({
  imports: [TypeOrmModule.forFeature([LineDevice]), CommonModule],
  controllers: [AlertController],
  providers: [AlertService, LineContextService],
})
export class AlertModule {}
