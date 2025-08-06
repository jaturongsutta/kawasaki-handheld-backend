import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'M_Line_Device' })
export class LineDevice {
  @PrimaryColumn({ name: 'MAC_Address' })
  deviceId: string

  @Column({ name: 'IP_Address' })
  ip: string

  @Column({ name: 'Line_CD', nullable: true })
  lineCD: string

  @Column({ name: 'is_Active', default: 'Y' })
  isActive: string

  @Column({ name: 'CREATED_DATE', type: 'datetime' })
  createdDate: Date

  @Column({ name: 'CREATED_BY' })
  createdBy: number

  @Column({ name: 'UPDATED_DATE', type: 'datetime' })
  updatedDate: Date

  @Column({ name: 'UPDATED_BY' })
  updatedBy: number
}
