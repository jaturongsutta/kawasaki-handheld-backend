import { Test, TestingModule } from '@nestjs/testing'
import { AlertController } from './alert.controller'
import { AlertService } from './alert.service'
import { Response } from 'express'

describe('AlertController', () => {
  let controller: AlertController
  let service: AlertService

  const mockAlertService = {
    sendMultipleTCP: jest.fn(),
    saveDevice: jest.fn(),
  }

  const mockResponse = () => {
    const res: Partial<Response> = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res as Response
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertController],
      providers: [{ provide: AlertService, useValue: mockAlertService }],
    }).compile()

    controller = module.get<AlertController>(AlertController)
    service = module.get<AlertService>(AlertService)
  })

  it('should return 400 if missing fields', async () => {
    const res = mockResponse()
    await controller.sendAlert({ targets: null, message: '' }, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should return result if successful', async () => {
    const res = mockResponse()
    mockAlertService.sendMultipleTCP.mockResolvedValue([{ status: 'sent' }])
    await controller.sendAlert(
      { targets: [{ ip: '1.2.3.4', port: 4000 }], message: 'Hello' },
      res
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should save device on register', () => {
    const result = controller.registerDevice({
      deviceId: 'dev1',
      ip: '1.1.1.1',
      port: 4000,
    })
    expect(result).toEqual({ status: 'registered', ip: '1.1.1.1', port: 4000 })
    expect(mockAlertService.saveDevice).toHaveBeenCalled()
  })
})
