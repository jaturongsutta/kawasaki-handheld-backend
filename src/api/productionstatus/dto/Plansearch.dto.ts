import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator'

export class PlanSearchDto {
  @IsString()
  Line_CD: string

  @IsOptional()
  @IsDateString()
  Plan_Date_From?: string

  @IsOptional()
  @IsDateString()
  Plan_Date_To?: string

  @IsOptional()
  @IsString()
  Model_CD?: string

  @IsOptional()
  @IsString()
  Status?: string

  @IsInt()
  Row_No_From: number

  @IsInt()
  Row_No_To: number
}
