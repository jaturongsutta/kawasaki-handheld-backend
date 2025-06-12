import { Controller, UseGuards } from "@nestjs/common";
import { BasicAuthGuard } from "./api/auth/guard/basic-auth.guard";

@Controller()
@UseGuards(BasicAuthGuard)
export class BaseController {
  constructor() {}
}
