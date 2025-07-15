export class LineStopRecordDto {
  planId: number
  lineCd: string
  processCd: string
  lineStopDate: string // 'YYYY-MM-DD'
  lineStopTime: string // 'HH:mm:ss'
  lossTime: number
  reason: string
  comment: string
  createdBy: number
}
