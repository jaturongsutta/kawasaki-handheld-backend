import { Module } from '@nestjs/common'
import { MenuController } from './menu.controller'
import { MenuService } from './menu.service'
import { CommonModule } from 'src/common/common.module'

@Module({
  imports: [CommonModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
