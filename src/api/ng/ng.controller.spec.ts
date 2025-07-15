import { Test, TestingModule } from '@nestjs/testing'
import { NGController } from './ng.controller'

describe('NGController', () => {
  let controller: NGController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NGController],
    }).compile()

    controller = module.get<NGController>(NGController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
