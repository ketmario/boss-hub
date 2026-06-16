import { useCallback, useState } from 'react'
import classNames from 'classnames'
import { getPhoneRuntime, type PhoneBridgeApi, type PhoneBridgeBundle } from '@/utils/phoneBridge'

type SdkCtx = { api: PhoneBridgeApi; bridge: PhoneBridgeBundle['bridge'] }

function stringifyBlock(title: string, value: unknown) {
    return `${title}\n${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}`
}

export default function SdkPlayground() {
    const [log, setLog] = useState('')

    const append = useCallback((title: string, value: unknown) => {
        setLog((prev) => {
            const block = stringifyBlock(title, value)
            return prev ? `${prev}\n\n---\n\n${block}` : block
        })
    }, [])

    const withCtx = useCallback(
        async <T,>(title: string, fn: (ctx: SdkCtx) => Promise<T>) => {
            try {
                const ctx = await getPhoneRuntime()
                const result = await fn(ctx)
                append(title, result)
            } catch (e) {
                append(`${title} (error)`, e instanceof Error ? e.message : String(e))
            }
        },
        [append],
    )

    const btn = (extra?: string) =>
        classNames(
            'rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'dark:focus-visible:ring-offset-zinc-900',
            extra,
        )

    return (
        <section
            className={classNames(
                'mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm',
                'dark:border-zinc-800 dark:bg-zinc-900',
            )}
        >
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Phone SDK playground</h2>
            <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                Gallery, camera, and GIF pickers open the native phone UI (120s bridge timeout). Cancel returns{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">null</code>. Camera returns the full saved
                gallery row (id, url, location, …).
            </p>
            <div className="mt-3 space-y-3">
                <div>
                    <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        State
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={btn('bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600')}
                            onClick={() => void withCtx('getPhoneState', ({ api }) => api.getPhoneState())}
                        >
                            getPhoneState
                        </button>
                        <button
                            type="button"
                            className={btn('bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600')}
                            onClick={() => void withCtx('getThemeMode', ({ api }) => api.getThemeMode())}
                        >
                            getThemeMode
                        </button>
                        <button
                            type="button"
                            className={btn('bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600')}
                            onClick={() => void withCtx('getPhoneLocale', ({ api }) => api.getPhoneLocale())}
                        >
                            getPhoneLocale
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Navigation
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={btn('bg-amber-600 text-white hover:bg-amber-700')}
                            onClick={() =>
                                void withCtx('openPhoneApp("settings")', ({ api }) => api.openPhoneApp('settings'))
                            }
                        >
                            openPhoneApp(settings)
                        </button>
                        <button
                            type="button"
                            className={btn('border border-red-300 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-100 dark:hover:bg-red-900')}
                            onClick={() => void withCtx('closeCurrentPhoneApp', ({ api }) => api.closeCurrentPhoneApp())}
                        >
                            closeCurrentPhoneApp
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        UI
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={btn('bg-blue-600 text-white hover:bg-blue-700')}
                            onClick={() =>
                                void withCtx('showToastNotification', ({ api }) =>
                                    api.showToastNotification({
                                        title: 'SDK',
                                        text: 'Toast from template playground',
                                        closeTimeout: 2800,
                                    }),
                                )
                            }
                        >
                            showToastNotification
                        </button>
                        <button
                            type="button"
                            className={btn('bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600')}
                            onClick={() =>
                                void withCtx(`translateText("custom.apps.radio.title")`, ({ api }) =>
                                    api.translateText('custom.apps.radio.title'),
                                )
                            }
                        >
                            translateText (demo key)
                        </button>
                        <button
                            type="button"
                            className={btn('bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600')}
                            onClick={() =>
                                void withCtx('openTextPrompt', ({ api }) =>
                                    api.openTextPrompt({
                                        title: 'SDK',
                                        message: 'Enter any text (result below).',
                                        placeholder: 'Type here',
                                        defaultValue: '',
                                    }),
                                )
                            }
                        >
                            openTextPrompt
                        </button>
                        <button
                            type="button"
                            className={btn('bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600')}
                            onClick={() =>
                                void withCtx('openOptionPicker', ({ api }) =>
                                    api.openOptionPicker({
                                        title: 'Pick one',
                                        options: [
                                            { key: 'a', label: 'Option A' },
                                            { key: 'b', label: 'Option B' },
                                        ],
                                    }),
                                )
                            }
                        >
                            openOptionPicker
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Media
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={btn('bg-sky-700 text-white hover:bg-sky-800')}
                            onClick={() => void withCtx('pickGalleryMedia()', ({ api }) => api.pickGalleryMedia())}
                        >
                            pickGalleryMedia (all)
                        </button>
                        <button
                            type="button"
                            className={btn('bg-sky-800 text-white hover:bg-sky-900 dark:bg-sky-700')}
                            onClick={() =>
                                void withCtx('pickGalleryMedia(photos)', ({ api }) =>
                                    api.pickGalleryMedia({ mediaFilter: 'photos' }),
                                )
                            }
                        >
                            pickGalleryMedia (photos)
                        </button>
                        <button
                            type="button"
                            className={btn('bg-teal-700 text-white hover:bg-teal-800')}
                            onClick={() => void withCtx('pickCameraMedia()', ({ api }) => api.pickCameraMedia())}
                        >
                            pickCameraMedia
                        </button>
                        <button
                            type="button"
                            className={btn('bg-fuchsia-700 text-white hover:bg-fuchsia-800')}
                            onClick={() => void withCtx('pickGif()', ({ api }) => api.pickGif())}
                        >
                            pickGif
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Recorder
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={btn('bg-emerald-700 text-white hover:bg-emerald-800')}
                            onClick={() => void withCtx('startRecorder', ({ api }) => api.startRecorder())}
                        >
                            startRecorder
                        </button>
                        <button
                            type="button"
                            className={btn('bg-emerald-900 text-white hover:bg-emerald-950 dark:bg-emerald-800')}
                            onClick={() => void withCtx('stopRecorder', ({ api }) => api.stopRecorder())}
                        >
                            stopRecorder
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Misc
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={btn('bg-violet-700 text-white hover:bg-violet-800')}
                            onClick={() =>
                                void withCtx('bridge.emit("template:test")', async ({ bridge }) => {
                                    bridge.emit('template:test', { t: Date.now() })
                                    return {
                                        ok: true,
                                        note: 'Posted to host; no UI unless the phone listens for this event.',
                                    }
                                })
                            }
                        >
                            bridge.emit (template:test)
                        </button>
                    </div>
                </div>
            </div>

            <pre
                className={classNames(
                    'mt-3 max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2',
                    'text-[11px] leading-snug text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200',
                )}
            >
                {log || ' '}
            </pre>
        </section>
    )
}
