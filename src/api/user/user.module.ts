import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonService } from 'src/common/common.service'
import { User } from 'src/entity/user.entity'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserRole } from 'src/entity/user-role.entity'
import { LineContextService } from 'src/_services/line-context.service'
import { JwtModule } from '@nestjs/jwt'
import { jwtConstants } from '../auth/jwt/constants'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole]),
    JwtModule.register({
      secret: jwtConstants.secret,
    }),
  ],
  exports: [TypeOrmModule, UserService],
  controllers: [UserController],
  providers: [UserService, CommonService, LineContextService],
})
export class UserModule {}
