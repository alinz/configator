export interface RangeNumber {
  type: 'number'
  min: number
  max: number
}

export interface RangeValue {
  type: 'single' | 'multiple'
  values: string[]
}

export type ConfigItemType = 'boolean' | 'number' | 'function' | 'string' | 'range' | 'multi'

export interface ConfigItem {
  property: string
  type: ConfigItemType
  range: RangeNumber | RangeValue | null
  default: any
  description: string
}
