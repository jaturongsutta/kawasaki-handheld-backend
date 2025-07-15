import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonService } from 'src/common/common.service'
import { LineStopController } from './line-stop.controller'
import { LineStopService } from './line-stop.service'

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [LineStopController],
  providers: [LineStopService, CommonService],
})
export class LineStopModule {}
