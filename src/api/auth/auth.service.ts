import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/entity/user.entity'
import { Repository } from 'typeorm'
import { UserLoginDto } from './dto/user-login.dto'
import { JwtService } from '@nestjs/jwt'
import { CommonService } from 'src/common/common.service'
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private commonService: CommonService,
  ) {}

  private getJwtExpireValue(): string {
    return '60m'
  }

  async signin(username: string, password: string): Promise<UserLoginDto> {
    const user = await this.userRepository.findOneBy({
      username: username,
      userPassword: password,
    })

    const userLoginDto = new UserLoginDto()
    const tokenOptions = { expiresIn: this.getJwtExpireValue() }
    if (user) {
      userLoginDto.user = user
      if (user.isActive === 'Y') {
        const menuPermissions = await this.getMenuByUserID(user.userId, 'EN')

        const payload = { userId: user.userId, username: username }
        const token = await this.jwtService.signAsync(payload, tokenOptions)
        userLoginDto.permissions = menuPermissions.data
        userLoginDto.token = token
        userLoginDto.result.status = 0
      } else {
        userLoginDto.result.status = 1
        userLoginDto.result.message = 'User is inactive'
      }
    } else {
      userLoginDto.result.status = 1
      userLoginDto.result.message = 'Invalid username or password'
    }

    return userLoginDto
  }

  async getMenuByUserID(userID: number, lang: string) {
    const req = await this.commonService.getConnection()
    req.input('User_ID', userID)
    req.input('Language', lang)
    req.output('Return_CD', '')

    const execute = await this.commonService.executeStoreProcedure(
      'sp_um_User_Role_Permission',
      req,
      false, // false = not log
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

  async refreshToken(userId: number): Promise<any> {
    const user = await this.userRepository.findOneBy({ userId: userId })
    if (!user) {
      return {
        status: 404,
        message: 'User not found',
      }
    }

    // Assuming the payload for the new token is similar to the one used in signIn
    const payload = { username: user.username, userId: user.userId }
    const tokenOptions = { expiresIn: this.getJwtExpireValue() }
    const newAccessToken = await this.jwtService.signAsync(
      payload,
      tokenOptions,
    )

    return {
      status: 0,
      accessToken: newAccessToken,
    }
  }
}
