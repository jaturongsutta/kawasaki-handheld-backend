// dto/ng-record.dto.ts

export class NgRecordDto {
  planId: number
  lineCd: string
  processCd: string
  ngDate: string // yyyy-MM-dd
  ngTime: string // HH:mm
  quantity: number
  reason: string
  comment: string
  createdBy: number
}
