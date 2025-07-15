import { Test, TestingModule } from '@nestjs/testing'
import { LineStopController } from './line-stop.controller'

describe('LineStopController', () => {
  let controller: LineStopController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LineStopController],
    }).compile()

    controller = module.get<LineStopController>(LineStopController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
