// src/common/line-context/line-context.module.ts
import { Module, Global } from '@nestjs/common'
import { LineContextService } from 'src/_services/line-context.service'

@Global()
@Module({
  providers: [LineContextService],
  exports: [LineContextService],
})
export class LineContextModule {}
