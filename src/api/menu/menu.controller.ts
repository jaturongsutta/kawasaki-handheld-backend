import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common'
import { BaseController } from 'src/base.controller'
import { EncryptData } from 'src/_services/encrypt'
import { BaseResponse } from 'src/common/base-response'
import { MenuService } from './menu.service'

@Controller('menu')
export class MenuController {
  private readonly logger = new Logger(MenuController.name)

  constructor(private readonly menuService: MenuService) {}

  @Get('user-menu')
  async getUserMenus(
    @Query('lineCd') lineCd: string,
    @Query('userId') userId: number
  ): Promise<BaseResponse> {
    const menus = await this.menuService.getUserMenus(lineCd, userId)
    return {
      status: 0,
      data: menus,
    }
  }
}
