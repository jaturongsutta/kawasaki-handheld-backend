import { Test, TestingModule } from '@nestjs/testing'
import { LeakService } from './leak.service'

describe('LeakService', () => {
  let service: LeakService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeakService],
    }).compile()

    service = module.get<LeakService>(LeakService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
