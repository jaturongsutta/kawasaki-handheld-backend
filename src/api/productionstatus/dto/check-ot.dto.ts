import { IsString, IsIn, IsInt } from 'class-validator'

export class CheckOtDto {
  @IsString()
  Line_CD: string

  @IsString()
  Plan_Start_DT: any

  @IsString()
  Plan_Stop_DT: any

  @IsIn(['Y', 'N']) B1: string
  @IsIn(['Y', 'N']) B2: string
  @IsIn(['Y', 'N']) B3: string
  @IsIn(['Y', 'N']) B4: string

  @IsIn(['Y', 'N']) OT: string

  @IsString()
  Shift_Period: string

  @IsInt()
  id: number
}
