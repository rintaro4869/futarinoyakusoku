import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Linking,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import { Colors } from '../constants/colors'
import { createAnonymousUser, createCouple, joinCouple } from '../lib/api'
import { useAuthStore } from '../lib/store'

type Mode = 'choose' | 'create' | 'join'

export default function PairScreen() {
  const router = useRouter()
  const { coupleId, token, setCoupleId } = useAuthStore((s) => ({
    coupleId: s.coupleId,
    token: s.token,
    setCoupleId: s.setCoupleId,
  }))

  // すでにペアが存在する場合はホームへ
  useEffect(() => {
    if (coupleId) {
      router.replace('/(home)')
    }
  }, [coupleId])

  // トークンがなければ匿名ユーザーを作成（ディープリンク対応）
  useEffect(() => {
    if (!token) {
      createAnonymousUser().catch(() => {})
    }
  }, [])
  const [mode, setMode] = useState<Mode>('choose')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdCouple, setCreatedCouple] = useState<{
    couple_id: string
    invite_code: string
    invite_url: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  function goMode(m: Mode) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setMode(m)
    setCreatedCouple(null)
    setName('')
    setInviteCode('')
  }

  async function handleCreate() {
    if (!name.trim() || loading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const data = await createCouple(name.trim())
      await setCoupleId(data.couple_id)
      setCreatedCouple(data)
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? '通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    if (!createdCouple) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      await Share.share({
        message: 'Pairlogで一緒に約束を記録しよう！\n' + createdCouple.invite_url,
        url: createdCouple.invite_url,
      })
    } catch {}
  }

  async function handleShareLine() {
    if (!createdCouple) return
    const text = encodeURIComponent('Pairlogで一緒に約束を記録しよう！\n' + createdCouple.invite_url)
    const lineUrl = `https://line.me/R/msg/text/?${text}`
    const supported = await Linking.canOpenURL(lineUrl)
    if (supported) {
      await Linking.openURL(lineUrl)
    } else {
      Alert.alert('LINEが見つかりません', 'LINEアプリをインストールしてください')
    }
  }

  async function handleCopy() {
    if (!createdCouple) return
    await Clipboard.setStringAsync(createdCouple.invite_url)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleJoin() {
    if (!name.trim() || inviteCode.trim().length < 6 || loading) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      const data = await joinCouple(inviteCode.trim().toUpperCase(), name.trim())
      await setCoupleId(data.couple_id)
      router.replace('/tutorial')
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? '通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  function handleGoHome() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.replace('/tutorial')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#fdf2f8', '#fce7f3']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>パートナーと繋がる</Text>
        <Text style={styles.headerSub}>
          どちらかが招待リンクを作成し、相手がコードで参加してください
        </Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">

        {mode === 'choose' && (
          <View style={styles.chooseContainer}>
            <TouchableOpacity
              style={styles.choiceCard}
              onPress={() => goMode('create')}
              activeOpacity={0.85}
            >
              <Text style={styles.choiceEmoji}>{"📨"}</Text>
              <Text style={styles.choiceTitle}>招待リンクを作る</Text>
              <Text style={styles.choiceDesc}>あなたが先に始める場合はこちら</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceCard, styles.choiceCardSecondary]}
              onPress={() => goMode('join')}
              activeOpacity={0.85}
            >
              <Text style={styles.choiceEmoji}>{"🔗"}</Text>
              <Text style={styles.choiceTitle}>招待を受け取った</Text>
              <Text style={styles.choiceDesc}>相手から受け取ったコードで参加</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'create' && !createdCouple && (
          <View>
            <TouchableOpacity onPress={() => goMode('choose')} style={styles.backBtn}>
              <Text style={styles.backText}>{"← 戻る"}</Text>
            </TouchableOpacity>
            <Text style={styles.stepTitle}>あなたの名前を入れて招待リンクを作成します</Text>
            <TextInput
              style={styles.input}
              placeholder="名前を入力"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={20}
            />
            <TouchableOpacity
              style={[styles.primaryButton, !name.trim() && styles.primaryButtonDisabled]}
              onPress={handleCreate}
              disabled={!name.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.primaryButtonText}>招待リンクを作成</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'create' && createdCouple && (
          <View>
            <Text style={styles.stepTitle}>{"🎉"} 招待リンクができました！</Text>
            <Text style={styles.stepDesc}>
              パートナーにシェアして、一緒に始めましょう
            </Text>

            <View style={styles.inviteCard}>
              <Text style={styles.inviteLabel}>招待コード</Text>
              <Text style={styles.inviteCode}>{createdCouple.invite_code}</Text>
              <Text style={styles.inviteUrl} numberOfLines={2}>
                {createdCouple.invite_url}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Text style={styles.shareButtonText}>{"📤"} シェアする</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lineButton}
              onPress={handleShareLine}
              activeOpacity={0.85}
            >
              <Text style={styles.lineButtonText}>{"💬"} LINEで送る</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopy}
              activeOpacity={0.85}
            >
              <Text style={styles.copyButtonText}>
                {copied ? 'コピーしました' : 'リンクをコピー'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => goMode('join')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>コードを入力して参加する</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={handleGoHome}
              activeOpacity={0.85}
            >
              <Text style={styles.ghostButtonText}>チュートリアルを見る</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'join' && (
          <View>
            <TouchableOpacity onPress={() => goMode('choose')} style={styles.backBtn}>
              <Text style={styles.backText}>{"← 戻る"}</Text>
            </TouchableOpacity>
            <Text style={styles.stepTitle}>相手から受け取った招待コードを入力してください</Text>

            <TextInput
              style={styles.input}
              placeholder="名前を入力"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={20}
            />

            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="招待コード（6文字）"
              placeholderTextColor={Colors.textTertiary}
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Text style={styles.joinNote}>
              {"⚠️"} 同じ端末での両方の参加はできません。相手の端末で開いてください
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                styles.primaryButtonOrange,
                (!name.trim() || inviteCode.trim().length < 6) && styles.primaryButtonDisabled,
              ]}
              onPress={handleJoin}
              disabled={!name.trim() || inviteCode.trim().length < 6 || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <Text style={styles.primaryButtonText}>参加する</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 72,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
  },
  chooseContainer: {
    gap: 16,
    marginTop: 8,
  },
  choiceCard: {
    backgroundColor: Colors.backgroundPink,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.brandLighter,
  },
  choiceCardSecondary: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
  },
  choiceEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  choiceDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  backBtn: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 15,
    color: Colors.brand,
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 26,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: 12,
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  primaryButton: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonOrange: {
    backgroundColor: Colors.orange,
    shadowColor: Colors.orange,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: Colors.textWhite,
    fontSize: 17,
    fontWeight: '700',
  },
  inviteCard: {
    backgroundColor: Colors.backgroundPink,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.brandLighter,
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.brandDark,
    letterSpacing: 4,
    marginBottom: 10,
    fontVariant: ['tabular-nums'],
  },
  inviteUrl: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  lineButton: {
    backgroundColor: '#06C755',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  lineButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  copyButton: {
    borderWidth: 1.5,
    borderColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  copyButtonText: {
    color: Colors.brand,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  ghostButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  joinNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
})
