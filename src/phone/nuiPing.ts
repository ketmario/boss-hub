import { fetchNui } from '@/utils/fetchNui'
import { getPhoneBridgeApi } from '@/utils/phoneBridge'

type PingResponse = { ok?: boolean; message?: string; echo?: unknown }

export async function runPingDemo(): Promise<string> {
    const data = await fetchNui<PingResponse>('custom-app-react:ping', { t: Date.now() })
    const text = JSON.stringify(data, null, 2)
    const api = await getPhoneBridgeApi()
    await api.showToastNotification({
        title: 'NUI',
        text: data?.ok ? 'Ping OK' : 'Response',
        closeTimeout: 2500,
    })
    return text
}
