// src/common/line-context.service.ts
import { Injectable, Scope } from '@nestjs/common'

@Injectable()
export class LineContextService {
  private lineCd?: string
  set(lineCd: string) {
    this.lineCd = lineCd
  }
  get() {
    return this.lineCd
  }
}
