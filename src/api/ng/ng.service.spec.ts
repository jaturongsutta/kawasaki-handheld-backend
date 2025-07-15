import { Test, TestingModule } from '@nestjs/testing'
import { NGService } from './ng.service'

describe('NGService', () => {
  let service: NGService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NGService],
    }).compile()

    service = module.get<NGService>(NGService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
