import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonService } from 'src/common/common.service'
import { NGController } from './ng.controller'
import { NGService } from './ng.service'

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [NGController],
  providers: [NGService, CommonService],
})
export class NGModule {}
