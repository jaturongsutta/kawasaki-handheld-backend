export class RegisterDeviceDto {
  deviceId: string
  ip: string
  port: number
  lineCD?: string
  readonly username: string
}
