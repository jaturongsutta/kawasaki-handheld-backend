import { Test, TestingModule } from '@nestjs/testing'
import { LeakController } from './leak.controller'

describe('LeakController', () => {
  let controller: LeakController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeakController],
    }).compile()

    controller = module.get<LeakController>(LeakController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
