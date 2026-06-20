import { useEffect, useState } from 'react'
import { fetchNui } from '@/utils/fetchNui'

type DashboardData = {
    allowed: boolean
    message?: string
    job: string
    label: string
    grade: string
    employeeCount: number
    onlineCount: number
    money: number
    locale?: 'de' | 'en'
}

type Employee = {
    identifier: string
    firstname: string
    lastname: string
    job_grade: number
    grade_label?: string
    online?: boolean
}

type NearbyPlayer = {
    id: number
    name: string
    distance: number
}

const Locales = {
    de: {
        appName: 'Boss Hub',
        subtitle: 'Mobiles Firmenmanagement',
        accessDenied: 'Zugriff verweigert',
        noBoss: 'Du bist kein Firmenleiter.',
        currentJob: 'Aktueller Job',
        company: 'Firma',
        balance: 'Kontostand',
        employees: 'Mitarbeiter',
        online: 'Online',
        settings: 'Einstellungen',
        companyAccount: 'Firmenkonto',
        currentBalance: 'Aktueller Kontostand',
        deposit: 'Geld einzahlen',
        withdraw: 'Geld auszahlen',
        amountPlaceholder: 'Betrag eingeben',
        hireEmployee: 'Mitarbeiter einstellen',
        noNearbyPlayers: 'Keine Spieler in der Nähe gefunden.',
        distance: 'Entfernung',
        hire: 'Einstellen',
        promote: 'Befördern',
        demote: 'Degradieren',
        fire: 'Entlassen',
        fireConfirmTitle: 'Mitarbeiter wirklich entlassen?',
        fireConfirmText: 'wird arbeitslos gesetzt.',
        cancel: 'Abbrechen',
        confirm: 'Bestätigen',
        back: 'Zurück',
        noEmployees: 'Keine Mitarbeiter gefunden.',
        offline: 'Offline',
        rank: 'Rang',
        quickAccess: 'Schnellzugriff',
        developer: 'Entwickler',
        unknown: 'Unbekannt',
        loading: 'Lädt...',
        depositSuccess: '✅ Einzahlung erfolgreich',
        depositFailed: '❌ Einzahlung fehlgeschlagen',
        withdrawSuccess: '✅ Auszahlung erfolgreich',
        withdrawFailed: '❌ Auszahlung fehlgeschlagen',
        employeeFired: '✅ Mitarbeiter entlassen',
        employeeHired: '✅ Mitarbeiter eingestellt',
        hireFailed: '❌ Spieler arbeitet bereits hier oder konnte nicht eingestellt werden',
    },
    en: {
        appName: 'Boss Hub',
        subtitle: 'Mobile company management',
        accessDenied: 'Access denied',
        noBoss: 'You are not a company boss.',
        currentJob: 'Current job',
        company: 'Company',
        balance: 'Balance',
        employees: 'Employees',
        online: 'Online',
        settings: 'Settings',
        companyAccount: 'Company Account',
        currentBalance: 'Current Balance',
        deposit: 'Deposit Money',
        withdraw: 'Withdraw Money',
        amountPlaceholder: 'Enter amount',
        hireEmployee: 'Hire Employee',
        noNearbyPlayers: 'No nearby players found.',
        distance: 'Distance',
        hire: 'Hire',
        promote: 'Promote',
        demote: 'Demote',
        fire: 'Fire',
        fireConfirmTitle: 'Really fire this employee?',
        fireConfirmText: 'will be set to unemployed.',
        cancel: 'Cancel',
        confirm: 'Confirm',
        back: 'Back',
        noEmployees: 'No employees found.',
        offline: 'Offline',
        rank: 'Rank',
        quickAccess: 'Quick Access',
        developer: 'Developer',
        unknown: 'Unknown',
        loading: 'Loading...',
        depositSuccess: '✅ Deposit successful',
        depositFailed: '❌ Deposit failed',
        withdrawSuccess: '✅ Withdrawal successful',
        withdrawFailed: '❌ Withdrawal failed',
        employeeFired: '✅ Employee fired',
        employeeHired: '✅ Employee hired',
        hireFailed: '❌ Player already works here or could not be hired',
    },
}

export default function App() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null)
    const [page, setPage] = useState('dashboard')
    const [employees, setEmployees] = useState<Employee[]>([])
    const [nearbyPlayers, setNearbyPlayers] = useState<NearbyPlayer[]>([])
    const [amount, setAmount] = useState('')
    const [notification, setNotification] = useState('')
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [showFireConfirm, setShowFireConfirm] = useState(false)

    const t = Locales[dashboard?.locale === 'en' ? 'en' : 'de']

    const loadDashboard = async () => {
        const data = await fetchNui<DashboardData>('lumi_bossapp:getDashboard')
        setDashboard(data)
    }

    const loadEmployees = async () => {
        const data = await fetchNui<Employee[]>('lumi_bossapp:getEmployees')
        setEmployees(data || [])
    }

    const loadNearbyPlayers = async () => {
        const data = await fetchNui<NearbyPlayer[]>('lumi_bossapp:getNearbyPlayers')
        setNearbyPlayers(data || [])
    }

    const depositMoney = async () => {
        if (!amount) return

        const success = await fetchNui<boolean>('lumi_bossapp:depositMoney', {
            amount: Number(amount),
        })

        if (success) {
            setNotification(t.depositSuccess)
            setAmount('')
            await loadDashboard()
        } else {
            setNotification(t.depositFailed)
        }
    }

    const withdrawMoney = async () => {
        if (!amount) return

        const success = await fetchNui<boolean>('lumi_bossapp:withdrawMoney', {
            amount: Number(amount),
        })

        if (success) {
            setNotification(t.withdrawSuccess)
            setAmount('')
            await loadDashboard()
        } else {
            setNotification(t.withdrawFailed)
        }
    }

    const setEmployeeGrade = async (employee: Employee, newGrade: number) => {
        const success = await fetchNui<boolean>('lumi_bossapp:setEmployeeGrade', {
            identifier: employee.identifier,
            newGrade,
        })

        if (success) {
            await loadDashboard()
            await loadEmployees()
            setPage('employees')
        }
    }

    const fireEmployee = async (employee: Employee) => {
        const success = await fetchNui<boolean>('lumi_bossapp:fireEmployee', {
            identifier: employee.identifier,
        })

        if (success) {
            await loadEmployees()
            await loadDashboard()
            setPage('employees')
            setNotification(t.employeeFired)
        }
    }

    const hirePlayer = async (playerId: number) => {
        const success = await fetchNui<boolean>('lumi_bossapp:hirePlayer', {
            targetId: playerId,
        })

        if (success) {
            setNotification(t.employeeHired)
            await loadEmployees()
            await loadDashboard()
            await loadNearbyPlayers()
            setPage('employees')
        } else {
            setNotification(t.hireFailed)
        }
    }

    useEffect(() => {
        document.body.style.visibility = 'visible'
        document.body.style.display = 'block'
        document.body.style.backgroundColor = '#f4f4f5'

        loadDashboard().catch(console.error)
    }, [])

    if (dashboard && dashboard.allowed === false) {
        return (
            <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-16">
                <h1 className="text-2xl font-bold">👔 {t.appName}</h1>
                <p className="text-sm text-zinc-500">{t.subtitle}</p>

                <div className="mt-8 rounded-2xl bg-white p-5 shadow">
                    <h2 className="text-xl font-bold text-red-600">{t.accessDenied}</h2>
                    <p className="mt-3 text-sm text-zinc-600">
                        {dashboard.message || t.noBoss}
                    </p>
                    <p className="mt-4 text-xs text-zinc-400">
                        {t.currentJob}: {dashboard.label || t.unknown}
                    </p>
                </div>
            </div>
        )
    }

    if (page === 'finance') {
        return (
            <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
                <button
                    onClick={async () => {
                        await loadDashboard()
                        setPage('dashboard')
                    }}
                    className="mb-4 rounded-lg bg-zinc-800 px-4 py-2 text-white"
                >
                    ← {t.back}
                </button>

                <h1 className="text-2xl font-bold mb-4">💰 {t.companyAccount}</h1>

                <div className="rounded-2xl bg-white p-5 shadow">
                    <p className="text-xs uppercase text-zinc-500">{t.currentBalance}</p>
                    <h2 className="mt-2 text-2xl font-bold text-green-600">
                        ${dashboard?.money?.toLocaleString('de-DE') || 0}
                    </h2>
                </div>

                <div className="mt-4 space-y-3">
                    {notification && (
                        <div className="rounded-xl bg-blue-100 p-3 text-center font-semibold text-blue-700">
                            {notification}
                        </div>
                    )}

                    <input
                        type="number"
                        placeholder={t.amountPlaceholder}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border p-3"
                    />

                    <button
                        onClick={depositMoney}
                        className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold"
                    >
                        {t.deposit}
                    </button>

                    <button
                        onClick={withdrawMoney}
                        className="w-full rounded-xl bg-red-600 py-3 text-white font-semibold"
                    >
                        {t.withdraw}
                    </button>
                </div>
            </div>
        )
    }

    if (page === 'employeeDetail' && selectedEmployee) {
        return (
            <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
                <button
                    onClick={() => setPage('employees')}
                    className="mb-4 rounded-lg bg-zinc-800 px-4 py-2 text-white"
                >
                    ← {t.back}
                </button>

                <h1 className="text-2xl font-bold mb-4">👤 {t.employees}</h1>

                <div className="rounded-2xl bg-white p-5 shadow">
                    <h2 className="text-xl font-bold">
                        {selectedEmployee.firstname} {selectedEmployee.lastname}
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">
                        {selectedEmployee.grade_label || `${t.rank} ${selectedEmployee.job_grade}`}
                    </p>
                </div>

                <div className="mt-4 space-y-3">
                    <button
                        onClick={() => setEmployeeGrade(selectedEmployee, Number(selectedEmployee.job_grade) + 1)}
                        className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold"
                    >
                        {t.promote}
                    </button>

                    <button
                        onClick={() => setEmployeeGrade(selectedEmployee, Number(selectedEmployee.job_grade) - 1)}
                        className="w-full rounded-xl bg-orange-600 py-3 text-white font-semibold"
                    >
                        {t.demote}
                    </button>

                    {showFireConfirm && (
                        <div className="rounded-2xl bg-red-100 p-4">
                            <h3 className="font-bold text-red-700">{t.fireConfirmTitle}</h3>

                            <p className="mt-2 text-sm">
                                {selectedEmployee.firstname} {selectedEmployee.lastname} {t.fireConfirmText}
                            </p>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => setShowFireConfirm(false)}
                                    className="flex-1 rounded-xl bg-zinc-600 py-2 text-white"
                                >
                                    {t.cancel}
                                </button>

                                <button
                                    onClick={() => {
                                        fireEmployee(selectedEmployee)
                                        setShowFireConfirm(false)
                                    }}
                                    className="flex-1 rounded-xl bg-red-600 py-2 text-white"
                                >
                                    {t.confirm}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setShowFireConfirm(true)}
                        className="w-full rounded-xl bg-red-600 py-3 text-white font-semibold"
                    >
                        {t.fire}
                    </button>
                </div>
            </div>
        )
    }

    if (page === 'hire') {
        return (
            <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
                <button
                    onClick={() => setPage('employees')}
                    className="mb-4 rounded-lg bg-zinc-800 px-4 py-2 text-white"
                >
                    ← {t.back}
                </button>

                <h1 className="text-2xl font-bold mb-4">➕ {t.hireEmployee}</h1>

                <div className="space-y-3">
                    {nearbyPlayers.map((player) => (
                        <div key={player.id} className="rounded-xl bg-white p-4 shadow">
                            <h3 className="font-bold">{player.name}</h3>

                            <p className="text-sm text-zinc-500">
                                {t.distance}: {player.distance}m
                            </p>

                            <button
                                onClick={() => hirePlayer(player.id)}
                                className="mt-3 w-full rounded-xl bg-green-600 py-2 text-white font-semibold"
                            >
                                {t.hire}
                            </button>
                        </div>
                    ))}

                    {nearbyPlayers.length === 0 && (
                        <div className="rounded-xl bg-white p-4 shadow">
                            {t.noNearbyPlayers}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (page === 'settings') {
        return (
            <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
                <button
                    onClick={async () => {
                        await loadDashboard()
                        setPage('dashboard')
                    }}
                    className="mb-4 rounded-lg bg-zinc-800 px-4 py-2 text-white"
                >
                    ← {t.back}
                </button>

                <h1 className="text-2xl font-bold mb-4">⚙️ {t.settings}</h1>

                <div className="space-y-3">
                    <div className="rounded-xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">{t.company}</p>
                        <h2 className="text-xl font-bold">{dashboard?.label}</h2>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">{t.rank}</p>
                        <h2 className="text-xl font-bold">{dashboard?.grade}</h2>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">{t.employees}</p>
                        <h2 className="text-xl font-bold">{dashboard?.employeeCount}</h2>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">{t.online}</p>
                        <h2 className="text-xl font-bold">{dashboard?.onlineCount}</h2>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">{t.companyAccount}</p>
                        <h2 className="text-xl font-bold text-green-600">
                            ${dashboard?.money?.toLocaleString('de-DE')}
                        </h2>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">{t.developer}</p>
                        <h2 className="text-lg font-bold">Luminera Development</h2>
                        <p className="text-sm text-zinc-500">Boss Hub</p>
                        <p className="mt-2 text-xs text-zinc-400">Version 1.1.0</p>
                        <p className="text-xs text-zinc-400">Developed 2026 by Luminera Development</p>
                    </div>
                </div>
            </div>
        )
    }

    if (page === 'employees') {
        return (
            <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
                <button
                    onClick={async () => {
                        await loadDashboard()
                        await loadEmployees()
                        setPage('dashboard')
                    }}
                    className="mb-4 rounded-lg bg-zinc-800 px-4 py-2 text-white"
                >
                    ← {t.back}
                </button>

                <h1 className="text-2xl font-bold mb-4">👥 {t.employees}</h1>

                {notification && (
                    <div className="mb-4 rounded-xl bg-blue-100 p-3 text-center font-semibold text-blue-700">
                        {notification}
                    </div>
                )}

                <button
                    onClick={async () => {
                        await loadNearbyPlayers()
                        setPage('hire')
                    }}
                    className="mb-4 w-full rounded-xl bg-green-600 py-3 text-white font-semibold"
                >
                    + {t.hireEmployee}
                </button>

                <div className="space-y-3">
                    {employees.map((employee, index) => (
                        <div
                            key={index}
                            onClick={() => {
                                setSelectedEmployee({
                                    ...employee,
                                    job_grade: Number(employee.job_grade),
                                })
                                setPage('employeeDetail')
                            }}
                            className="rounded-xl bg-white p-4 shadow"
                        >
                            <h3 className="font-bold">
                                {employee.firstname} {employee.lastname}
                            </h3>

                            <p className="text-sm text-zinc-500">
                                {employee.grade_label || `${t.rank} ${employee.job_grade}`}
                            </p>

                            <p className={employee.online ? 'text-sm text-green-600' : 'text-sm text-red-600'}>
                                {employee.online ? `🟢 ${t.online}` : `🔴 ${t.offline}`}
                            </p>
                        </div>
                    ))}

                    {employees.length === 0 && (
                        <div className="rounded-xl bg-white p-4 shadow">
                            {t.noEmployees}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">👔 {t.appName}</h1>
                <p className="text-sm text-zinc-500">{t.subtitle}</p>
            </div>

            <div className="space-y-4">
                <div className="rounded-2xl bg-white p-4 shadow">
                    <p className="text-xs uppercase text-zinc-500">{t.company}</p>
                    <h2 className="mt-1 text-xl font-bold">
                        {dashboard?.label || t.loading}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow">
                    <p className="text-xs uppercase text-zinc-500">{t.balance}</p>
                    <h2 className="mt-1 text-xl font-bold text-green-600">
                        ${dashboard?.money?.toLocaleString('de-DE') || 0}
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">{t.employees}</p>
                        <h2 className="mt-1 text-2xl font-bold">
                            {dashboard?.employeeCount || 0}
                        </h2>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">{t.online}</p>
                        <h2 className="mt-1 text-2xl font-bold text-blue-600">
                            {dashboard?.onlineCount || 0}
                        </h2>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow">
                    <h3 className="font-semibold mb-3">{t.quickAccess}</h3>

                    <div className="space-y-2">
                        <button
                            onClick={async () => {
                                await loadDashboard()
                                await loadEmployees()
                                await loadNearbyPlayers()
                                setPage('employees')
                            }}
                            className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold"
                        >
                            {t.employees}
                        </button>

                        <button
                            onClick={() => setPage('finance')}
                            className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold"
                        >
                            {t.companyAccount}
                        </button>

                        <button
                            onClick={() => setPage('settings')}
                            className="w-full rounded-xl bg-zinc-800 py-3 text-white font-semibold"
                        >
                            {t.settings}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
