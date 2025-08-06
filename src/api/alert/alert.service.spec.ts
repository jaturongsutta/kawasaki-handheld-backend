import { AlertService } from './alert.service'
import * as net from 'net'

jest.mock('net')

describe('AlertService', () => {
  let service: AlertService

  beforeEach(() => {
    service = new AlertService()
  })

  it('should send TCP message successfully', async () => {
    const mockSocket = {
      connect: jest.fn((port, ip, cb) => cb()),
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    }
    ;(net.Socket as any).mockImplementation(() => mockSocket)

    const result = await service.sendTCP('127.0.0.1', 4000, 'Hi')
    expect(result).toEqual({ status: 'sent', to: '127.0.0.1:4000' })
  })

  it('should return devices after saving', () => {
    service.saveDevice('dev1', '192.168.1.2', 4000)
    expect(service.getAllRegisteredDevices()).toEqual([
      { deviceId: 'dev1', ip: '192.168.1.2', port: 4000 },
    ])
  })
})
