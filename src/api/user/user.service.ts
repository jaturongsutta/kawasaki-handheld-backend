import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CommonService } from 'src/common/common.service'
import { User } from 'src/entity/user.entity'
import { DataSource, Repository } from 'typeorm'
import { UserDto } from './dto/user.dto'
import { UserSearchDto } from './dto/user-search.dto'
import { UserChangePasswordDto } from './dto/user-change-password.dto'
import { BaseResponse } from 'src/common/base-response'
import { UserRole } from 'src/entity/user-role.entity'
import { LineContextService } from 'src/_services/line-context.service'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private commonService: CommonService,
    private dataSource: DataSource,
    private readonly lineContext: LineContextService
  ) {}

  async getByID(id: number): Promise<UserDto> {
    const dto = new UserDto()

    const user = await this.userRepository.findOne({ where: { userId: id } })

    // get roles by userId
    const roles = await this.userRoleRepository.find({
      where: { userId: id },
    })

    if (!user) {
      dto.result.status = 2
      dto.result.message = 'User not found'
      return dto
    }

    Object.assign(dto, user)

    dto.roles = roles.map((e) => e.roleId)
    return dto
  }

  async getLineList() {
    const lines = await this.dataSource.query(
      `SELECT CAST(Line_CD AS NVARCHAR) AS Line_CD FROM M_Line`
    )
    let res = {
      result: true,
      data: lines.map((l) => l.Line_CD),
    }
    return res
  }

  async getByLogin(
    username: string,
    password: string,
    lineCd: string
  ): Promise<{ result: boolean; data: any } | null> {
    try {
      const req = await this.commonService.getConnection()
      req.input('Line_CD', lineCd)
      req.input('user_Name', username)
      req.input('password', password)

      const res = await this.commonService.executeStoreProcedure(
        'sp_handheld_Login',
        req
      )
      console.log('🔍 Raw query result: ', res)

      const loginSuccess = res.output[''] === 1

      if (loginSuccess) {
        console.log('loginSuccess')
        const result = await this.commonService.executeQuery(
          `SELECT User_ID FROM um_user WHERE Username = '${username}'`
        )

        if (!result || result.length === 0) {
          throw new Error('User not found')
        }

        console.log(result)

        const userId = result[0].User_ID
        console.log(userId)

        const mockUser: User = {
          userId: 1,
          username: username,
          userPassword: '', // ไม่จำเป็นต้องส่งกลับไป
          firstName: '',
          lastName: '',
          positionName: '',
          isActive: 'Y',
          createdBy: 100,
          createdDate: new Date(),
          updateBy: 101,
          updateDate: new Date(),
          roles: ['Admin', 'HandheldUser'],
        }
        console.log(`line cd===>${lineCd} `)
        this.lineContext.set(lineCd)
        console.log(`get line cd===>${this.lineContext.get()} `)

        return {
          result: true,
          data: {
            userId: userId,
            username: username,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            position: mockUser.positionName,
            role: mockUser.roles, // หรือ map เป็น role ชื่อเต็มก็ได้
          },
        }
      } else {
        console.log('fail')

        return null
      }
    } catch (error) {
      throw error
    }
  }

  async search(dto: UserSearchDto) {
    try {
      const req = await this.commonService.getConnection()
      req.input('User_Name', dto.username)
      req.input('First_Name', dto.firstName)
      req.input('Last_Name', dto.lastName)
      req.input('Status', dto.status)
      req.input('Row_No_From', dto.searchOptions.rowFrom)
      req.input('Row_No_To', dto.searchOptions.rowTo)

      const result = await this.commonService.getSearch(
        'sp_um_Search_User',
        req
      )

      return result
    } catch (error) {
      throw error
    }
  }
  async addUser(data: UserDto): Promise<User> {
    // validate if username already exists
    const existingUser = await this.userRepository.findOneBy({
      username: data.username,
    })
    if (existingUser) {
      throw new Error('Username already exists')
    }

    const user = this.userRepository.create(data)
    if (data.password) {
      user.userPassword = data.password
    }
    const r = await this.userRepository.save(user)

    const roles = data.roles
    for (let i = 0; i < roles.length; i++) {
      const role = this.userRoleRepository.create()
      role.roleId = roles[i]
      role.userId = r.userId
      await this.userRoleRepository.save(role)
    }

    return r
  }

  async updateUser(id: number, data: UserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ userId: id })
    if (!user) {
      throw new Error('User not found')
    }

    if (data.password) {
      user.userPassword = data.password
    }
    user.firstName = data.firstName
    user.lastName = data.lastName
    user.positionName = data.positionName
    user.isActive = data.isActive
    user.updateBy = data.updatedBy
    user.updateDate = new Date()
    //Object.assign(user, data);
    const r = await this.userRepository.save(user)

    // Delete all roles by userId
    await this.userRoleRepository.delete({ userId: id })
    const roles = data.roles
    for (let i = 0; i < roles.length; i++) {
      const role = this.userRoleRepository.create()
      role.roleId = roles[i]
      role.userId = id
      await this.userRoleRepository.save(role)
    }

    return r
  }

  async changePassword(
    userId,
    oldPassword,
    newPassword
  ): Promise<BaseResponse> {
    try {
      const result = await this.commonService.executeQuery(
        'SELECT User_Password FROM  um_user WHERE USER_ID = ' + userId
      )

      if (!result) {
        throw new Error('User not found')
      }

      const user = await this.userRepository.findOneBy({ userId: userId })
      if (!user) {
        throw new Error('User not found')
      }

      const currentPassword = result[0].User_Password
      if (currentPassword !== oldPassword) {
        return {
          status: 1,
          message: 'Old password is incorrect',
        }
      }

      user.userPassword = newPassword
      await this.userRepository.save(user)
      return {
        status: 0,
      }
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  }

  async deleteUser(id: number): Promise<BaseResponse> {
    // Delete all roles by userId
    await this.userRoleRepository.delete({ userId: id })
    const r = await this.userRepository.delete({ userId: id })
    if (r.affected > 0) return { status: 0 }
    else return { status: 1 }
  }

  async getMenuByUserID(
    userID: number,
    password: string,
    menuType: number,
    lang: string
  ) {
    const req = await this.commonService.getConnection()
    req.input('User_ID', userID)
    req.input('Password', password)
    req.input('Manu_Type', menuType)
    req.input('Language', lang)
    req.output('Return_CD', '')

    const execute = await this.commonService.executeStoreProcedure(
      'sp_User_Role_Permission',
      req
    )

    let res
    if (execute && execute.recordset !== undefined) {
      res = {
        result: true,
        data: execute.recordset,
      }
    } else {
      res = {
        result: false,
      }
    }

    return res
  }
}
