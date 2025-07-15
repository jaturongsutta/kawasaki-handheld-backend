import { Test, TestingModule } from '@nestjs/testing'
import { LineStopService } from './line-stop.service'

describe('LineStopService', () => {
  let service: LineStopService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LineStopService],
    }).compile()

    service = module.get<LineStopService>(LineStopService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
