import { Test, TestingModule } from '@nestjs/testing'
import { ProductionstatusController } from './productionstatus.controller'

describe('ProductionstatusController', () => {
  let controller: ProductionstatusController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionstatusController],
    }).compile()

    controller = module.get<ProductionstatusController>(
      ProductionstatusController
    )
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
