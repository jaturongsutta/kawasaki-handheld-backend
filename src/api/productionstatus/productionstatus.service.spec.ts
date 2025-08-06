import { Test, TestingModule } from '@nestjs/testing'
import { ProductionstatusService } from './productionstatus.service'

describe('ProductionstatusService', () => {
  let service: ProductionstatusService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionstatusService],
    }).compile()

    service = module.get<ProductionstatusService>(ProductionstatusService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
