import { Redirect, useLocalSearchParams } from 'expo-router'

export default function LegacyPromisesRoute() {
  const { created, focus, tab } = useLocalSearchParams<{
    created?: string
    focus?: string
    tab?: string
  }>()

  return (
    <Redirect
      href={{
        pathname: '/(home)/promises',
        params: { created, focus, tab },
      }}
    />
  )
}
