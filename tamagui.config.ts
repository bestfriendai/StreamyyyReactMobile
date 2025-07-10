import { config } from '@tamagui/config/v3'

export default config

export type Conf = typeof config

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}