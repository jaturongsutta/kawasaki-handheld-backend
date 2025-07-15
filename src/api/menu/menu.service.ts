import { Injectable } from '@nestjs/common'
import { BaseResponse } from 'src/common/base-response'
import { CommonService } from 'src/common/common.service'
import { User } from 'src/entity/user.entity'
import { DataSource } from 'typeorm'
import { UserSearchDto } from '../user/dto/user-search.dto'
import { UserDto } from '../user/dto/user.dto'

@Injectable()
export class MenuService {
  constructor(
    private commonService: CommonService,
    private dataSource: DataSource
  ) {}

  async getUserMenus(lineCd: string, userId: number) {
    const req = await this.commonService.getConnection()
    req.input('Line_CD', lineCd)
    req.input('userId', userId)

    const result = await this.commonService.getSearch('sp_handheld_Menu', req)
    return result.data
  }
}
