import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonService } from 'src/common/common.service'
import { ProductionstatusController } from './productionstatus.controller'
import { ProductionstatusService } from './productionstatus.service'

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [ProductionstatusController],
  providers: [ProductionstatusService, CommonService],
})
export class ProductionstatusModule {}
