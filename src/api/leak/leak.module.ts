import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonService } from 'src/common/common.service'
import { LeakService } from './leak.service'
import { LeakController } from './leak.controller'

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [LeakController],
  providers: [LeakService, CommonService],
})
export class LeakModule {}
