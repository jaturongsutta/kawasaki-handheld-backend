// dto/production-status.dto.ts
import { IsInt } from 'class-validator'

export class ProductionStatusDto {
  @IsInt()
  id: number
}
