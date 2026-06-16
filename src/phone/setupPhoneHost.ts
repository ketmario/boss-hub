import { getPhoneRuntime, type PhoneBridgeApi } from '@/utils/phoneBridge'

export type SubscribePhoneHostOptions = {
    onError?: (message: string) => void
}

async function applyThemeFromApi(api: PhoneBridgeApi) {
    try {
        const theme = await api.getThemeMode()
        const dark = theme?.mode === 'dark' || theme?.darkMode === true
        document.documentElement.classList.toggle('dark', dark)
    } catch {
        document.documentElement.classList.toggle('dark', false)
    }
}

async function applyLocaleFromApi(api: PhoneBridgeApi) {
    try {
        const locale = await api.getPhoneLocale()
        if (typeof locale === 'string' && locale.trim() !== '') {
            document.documentElement.lang = locale
            return
        }
    } catch {
        // no-op
    }
    document.documentElement.lang = 'en'
}

function applyLocaleValue(value: unknown) {
    const locale = typeof value === 'string' && value.trim() !== '' ? value : 'en'
    document.documentElement.lang = locale
}

export function subscribePhoneHost(options: SubscribePhoneHostOptions = {}): () => void {
    let cancelled = false
    let offReady: (() => void) | undefined
    let offEvent: (() => void) | undefined

    void (async () => {
        try {
            const { bridge, api } = await getPhoneRuntime()
            if (cancelled) return

            offReady = bridge.onReady(async () => {
                await applyThemeFromApi(api)
                await applyLocaleFromApi(api)
            })

            await applyLocaleFromApi(api)

            offEvent = bridge.onEvent(async (eventName, payload) => {
                if (eventName === 'phone.theme.changed') {
                    const mode = payload && (payload as { mode?: string }).mode === 'dark' ? 'dark' : 'light'
                    document.documentElement.classList.toggle('dark', mode === 'dark')
                    return
                }
                if (eventName === 'phone.locale.changed') {
                    applyLocaleValue((payload as { language?: unknown } | undefined)?.language)
                    return
                }
                if (eventName === 'app:opened') {
                    await applyThemeFromApi(api)
                }
            })
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e)
            options.onError?.(message)
            console.error('[phone-custom-react]', message)
        }
    })()

    return () => {
        cancelled = true
        offReady?.()
        offEvent?.()
    }
}
