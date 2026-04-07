import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { t } from '../../lib/i18n'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const TAB_DEFS: {
  name: string
  titleKey: string
  icon: IoniconName
  iconActive: IoniconName
}[] = [
  { name: 'index',    titleKey: 'tabs.home',      icon: 'home-outline',      iconActive: 'home'      },
  { name: 'promises', titleKey: 'tabs.promises',   icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle' },
  { name: 'calendar', titleKey: 'tabs.calendar',   icon: 'calendar-outline',  iconActive: 'calendar'  },
  { name: 'rewards',  titleKey: 'tabs.rewards',    icon: 'gift-outline',      iconActive: 'gift'      },
  { name: 'settings', titleKey: 'tabs.settings',   icon: 'settings-outline',  iconActive: 'settings'  },
]

export default function HomeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBackground,
          borderTopWidth: 0.5,
          borderTopColor: Colors.border,
          height: 86,
          paddingBottom: 24,
          paddingTop: 12,
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 3,
        },
      }}
    >
      {TAB_DEFS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
      {/* 旧タブ — タブバーから非表示にするが routes として維持 */}
      <Tabs.Screen name="events"  options={{ href: null }} />
      <Tabs.Screen name="repair"  options={{ href: null }} />
      <Tabs.Screen name="summary" options={{ href: null }} />
    </Tabs>
  )
}
