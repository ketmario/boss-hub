import { APP_ID } from '@/constants'

/** Payload shape returned by `phone.state.get` (qs-smartphone bridge host). */
export type PhoneBridgePhoneState = {
    visible: boolean
    mode: string
    activeApp: string | null
    screen: string
}

export type PhoneBridgeOptionRow = {
    key: string
    label?: string
    value?: string
}

/** Same shape as phone gallery picker (`GalleryPickerSelection`). */
export type PhoneBridgeGallerySelection = {
    url: string
    type: 'image' | 'video'
    thumbnailUrl?: string
}

/** Full gallery row returned after native camera capture (`GalleryPhotoItem`). */
export type PhoneBridgeCameraSelection = {
    id: string
    url: string
    thumbnailUrl?: string
    type: 'image' | 'video'
    createdAt: number
    location: string
    capturedAt?: number
    album?: string
    durationSec?: number
    isFavorite?: boolean
}

export type PhoneBridgeApi = {
    onReady: (listener: (payload?: Record<string, unknown>) => void) => () => void
    onEvent: (listener: (event: string, data?: unknown) => void) => () => void
    getPhoneState: () => Promise<PhoneBridgePhoneState>
    getPhoneLocale: () => Promise<string>
    openPhoneApp: (targetAppId: string) => Promise<{ appId: string }>
    closeCurrentPhoneApp: () => Promise<void>
    getThemeMode: () => Promise<{ mode: 'light' | 'dark'; darkMode: boolean }>
    translateText: (key: string, options?: Record<string, unknown>) => Promise<string>
    showToastNotification: (payload: {
        title: string
        text?: string
        subtitle?: string
        closeTimeout?: number
    }) => Promise<unknown>
    openTextPrompt: (payload: {
        title?: string
        message?: string
        placeholder?: string
        defaultValue?: string
    }) => Promise<string | null>
    openOptionPicker: (payload: {
        title?: string
        options?: PhoneBridgeOptionRow[]
    }) => Promise<{ key: string | null }>
    startRecorder: () => Promise<unknown>
    stopRecorder: () => Promise<{ url: string }>
    pickGalleryMedia: (payload?: {
        mediaFilter?: 'all' | 'photos' | 'videos'
    }) => Promise<PhoneBridgeGallerySelection | null>
    /** Opens the phone Camera app; resolves with the saved gallery item or null on cancel. */
    pickCameraMedia: () => Promise<PhoneBridgeCameraSelection | null>
    pickGif: () => Promise<{ url: string } | null>
}

export type PhoneBridgeBundle = {
    bridge: {
        onReady: (listener: (payload?: Record<string, unknown>) => void) => () => void
        onEvent: (listener: (event: string, data?: unknown) => void) => () => void
        emit: (event: string, data?: unknown) => void
    }
    api: PhoneBridgeApi
}

const BRIDGE_SDK_SOURCES = [
    'https://cfx-nui-qs-smartphone/web/build/bridge/qs-phone-bridge.js',
] as const

const REQUEST_TIMEOUT_MS = 7000

let loadPromise: Promise<void> | null = null
let runtimePromise: Promise<PhoneBridgeBundle> | null = null

function removeBridgeScriptBySrc(src: string) {
    document.querySelector(`script[data-qs-bridge-src="${src}"]`)?.remove()
}

function loadRuntimeScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[data-qs-bridge-src="${src}"]`)
        if (existing) {
            if (window.QSPhoneBridge?.create) {
                resolve()
                return
            }
            existing.addEventListener(
                'load',
                () => {
                    if (window.QSPhoneBridge?.create) resolve()
                    else {
                        existing.remove()
                        reject(new Error(`bridge_sdk_missing_after_load:${src}`))
                    }
                },
                { once: true },
            )
            existing.addEventListener(
                'error',
                () => {
                    existing.remove()
                    reject(new Error(`bridge_sdk_load_failed:${src}`))
                },
                { once: true },
            )
            return
        }

        const script = document.createElement('script')
        script.src = src
        script.dataset.qsBridgeSrc = src
        script.onload = () => {
            if (window.QSPhoneBridge?.create) {
                resolve()
                return
            }
            script.remove()
            reject(new Error(`bridge_sdk_missing_after_load:${src}`))
        }
        script.onerror = () => {
            script.remove()
            reject(new Error(`bridge_sdk_load_failed:${src}`))
        }
        document.head.appendChild(script)
    })
}

async function ensureRuntimeLoaded(): Promise<void> {
    if (window.QSPhoneBridge?.create) return

    const early = window.__qsBridgeReady
    if (early) {
        try {
            await early
        } catch {
            /* fall through to dynamic loader */
        }
        if (window.QSPhoneBridge?.create) return
    }

    if (!loadPromise) {
        loadPromise = (async () => {
            for (const src of BRIDGE_SDK_SOURCES) {
                try {
                    await loadRuntimeScript(src)
                    if (window.QSPhoneBridge?.create) return
                } catch {
                    removeBridgeScriptBySrc(src)
                }
            }
            throw new Error('bridge_sdk_unavailable')
        })()
    }
    try {
        await loadPromise
    } catch (e) {
        loadPromise = null
        throw e
    }
}

export async function getPhoneRuntime(): Promise<PhoneBridgeBundle> {
    if (!runtimePromise) {
        runtimePromise = (async () => {
            await ensureRuntimeLoaded()
            if (!window.QSPhoneBridge?.create) {
                throw new Error('bridge_sdk_missing_create')
            }
            const created = window.QSPhoneBridge.create({
                appId: APP_ID,
                targetWindow: window.parent,
                targetOrigin: '*',
                requestTimeoutMs: REQUEST_TIMEOUT_MS,
            })
            return created as PhoneBridgeBundle
        })()
    }
    try {
        return await runtimePromise
    } catch (e) {
        runtimePromise = null
        throw e
    }
}

export async function getPhoneBridgeApi(): Promise<PhoneBridgeApi> {
    const { api } = await getPhoneRuntime()
    return api
}
