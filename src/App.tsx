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
}

type Employee = {
	identifier: string
    firstname: string
    lastname: string
    job_grade: number
    grade_label?: string
	online?: boolean
}
/*  State */
export default function App() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null)
    const [page, setPage] = useState('dashboard')
    const [employees, setEmployees] = useState<Employee[]>([])
    const [amount, setAmount] = useState('')
	const [notification, setNotification] = useState('')
	const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
	const [showFireConfirm, setShowFireConfirm] = useState(false)

    const loadDashboard = async () => {
        const data = await fetchNui<DashboardData>('lumi_bossapp:getDashboard')
        setDashboard(data)
    }

    const loadEmployees = async () => {
        const data = await fetchNui<Employee[]>('lumi_bossapp:getEmployees')
        setEmployees(data || [])
    }

    const depositMoney = async () => {
    if (!amount) return

    const success = await fetchNui<boolean>(
        'lumi_bossapp:depositMoney',
        {
            amount: Number(amount),
        }
    )

    if (success) {
        setNotification('✅ Einzahlung erfolgreich')
        setAmount('')
        await loadDashboard()
    } else {
        setNotification('❌ Einzahlung fehlgeschlagen')
    }
}

const withdrawMoney = async () => {
    if (!amount) return

    const success = await fetchNui<boolean>(
        'lumi_bossapp:withdrawMoney',
        {
            amount: Number(amount),
        }
    )

    if (success) {
        setNotification('✅ Auszahlung erfolgreich')
        setAmount('')
        await loadDashboard()
    } else {
        setNotification('❌ Auszahlung fehlgeschlagen')
    }
}

const setEmployeeGrade = async (employee: Employee, newGrade: number) => {
    const success = await fetchNui<boolean>('lumi_bossapp:setEmployeeGrade', {
        identifier: employee.identifier,
        newGrade,
    })

    if (success) {
        await loadEmployees()
        await loadDashboard()
        setPage('employees')
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
                <h1 className="text-2xl font-bold">👔 Business Hub</h1>
                <p className="text-sm text-zinc-500">Mobiles Firmenmanagement</p>

                <div className="mt-8 rounded-2xl bg-white p-5 shadow">
                    <h2 className="text-xl font-bold text-red-600">Zugriff verweigert</h2>
                    <p className="mt-3 text-sm text-zinc-600">
                        {dashboard.message || 'Du bist kein Firmenleiter.'}
                    </p>
                    <p className="mt-4 text-xs text-zinc-400">
                        Aktueller Job: {dashboard.label || 'Unbekannt'}
                    </p>
                </div>
            </div>
        )
    }
	
	const fireEmployee = async (employee: Employee) => {
    const success = await fetchNui<boolean>(
        'lumi_bossapp:fireEmployee',
        {
            identifier: employee.identifier
        }
    )

    if (success) {
        await loadEmployees()
        await loadDashboard()

        setPage('employees')
        setNotification('✅ Mitarbeiter entlassen')
    }
}

    if (page === 'finance') {
        return (
            <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
                <button
                    onClick={() => setPage('dashboard')}
                    className="mb-4 rounded-lg bg-zinc-800 px-4 py-2 text-white"
                >
                    ← Zurück
                </button>

                <h1 className="text-2xl font-bold mb-4">💰 Firmenkonto</h1>

                <div className="rounded-2xl bg-white p-5 shadow">
                    <p className="text-xs uppercase text-zinc-500">Aktueller Kontostand</p>
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
                        placeholder="Betrag eingeben"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-xl border p-3"
                    />

                    <button
                        onClick={depositMoney}
                        className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold"
                    >
                        Geld einzahlen
                    </button>

                    <button
						onClick={withdrawMoney}
						className="w-full rounded-xl bg-red-600 py-3 text-white font-semibold"
					>
						Geld auszahlen
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
                ← Zurück
            </button>

            <h1 className="text-2xl font-bold mb-4">👤 Mitarbeiter</h1>

            <div className="rounded-2xl bg-white p-5 shadow">
                <h2 className="text-xl font-bold">
                    {selectedEmployee.firstname} {selectedEmployee.lastname}
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                    {selectedEmployee.grade_label || `Rang ${selectedEmployee.job_grade}`}
                </p>
            </div>

            <div className="mt-4 space-y-3">
                <button
					onClick={() => setEmployeeGrade(selectedEmployee, Number(selectedEmployee.job_grade) + 1)}
					className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold"
				>
					Befördern
				</button>

                <button
					onClick={() => setEmployeeGrade(selectedEmployee, Number(selectedEmployee.job_grade) - 1)}
					className="w-full rounded-xl bg-orange-600 py-3 text-white font-semibold"
				>
					Degradieren
				</button>
				{showFireConfirm && (
					<div className="rounded-2xl bg-red-100 p-4">
						<h3 className="font-bold text-red-700">
							Mitarbeiter wirklich entlassen?
						</h3>

						<p className="mt-2 text-sm">
							{selectedEmployee.firstname} {selectedEmployee.lastname}
							wird arbeitslos gesetzt.
						</p>

						<div className="mt-3 flex gap-2">
							<button
								onClick={() => setShowFireConfirm(false)}
								className="flex-1 rounded-xl bg-zinc-600 py-2 text-white"
							>
								Abbrechen
							</button>

							<button
								onClick={() => {
									fireEmployee(selectedEmployee)
									setShowFireConfirm(false)
								}}
								className="flex-1 rounded-xl bg-red-600 py-2 text-white"
							>
								Bestätigen
							</button>
						</div>
					</div>
				)}
                <button
					onClick={() => setShowFireConfirm(true)}
					className="w-full rounded-xl bg-red-600 py-3 text-white font-semibold"
				>
					Entlassen
				</button>
            </div>
        </div>
    )
}

if (page === 'settings') {
    return (
        <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
            <button
                onClick={() => setPage('dashboard')}
                className="mb-4 rounded-lg bg-zinc-800 px-4 py-2 text-white"
            >
                ← Zurück
            </button>

            <h1 className="text-2xl font-bold mb-4">
                ⚙️ Einstellungen
            </h1>

            <div className="space-y-3">
                <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-xs uppercase text-zinc-500">
                        Firma
                    </p>

                    <h2 className="text-xl font-bold">
                        {dashboard?.label}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-xs uppercase text-zinc-500">
                        Rang
                    </p>

                    <h2 className="text-xl font-bold">
                        {dashboard?.grade}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-xs uppercase text-zinc-500">
                        Mitarbeiter
                    </p>

                    <h2 className="text-xl font-bold">
                        {dashboard?.employeeCount}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-xs uppercase text-zinc-500">
                        Online
                    </p>

                    <h2 className="text-xl font-bold">
                        {dashboard?.onlineCount}
                    </h2>
                </div>

                <div className="rounded-xl bg-white p-4 shadow">
                    <p className="text-xs uppercase text-zinc-500">
                        Firmenkonto
                    </p>

                    <h2 className="text-xl font-bold text-green-600">
                        ${dashboard?.money?.toLocaleString('de-DE')}
                    </h2>
                </div>
				<div className="rounded-xl bg-white p-4 shadow">
					<p className="text-xs uppercase text-zinc-500">
						Entwickler
					</p>

					<h2 className="text-lg font-bold">
						Mario Kettenberger
					</h2>

					<p className="text-sm text-zinc-500">
						Luminera District Development
					</p>

					<p className="mt-2 text-xs text-zinc-400">
						Business Hub V1.0
					</p>

					<p className="text-xs text-zinc-400">
						Developed 2026 by Mario Kettenberger
					</p>
				</div>
            </div>
        </div>
		
    )
}

    if (page === 'employees') {
        return (
            <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
                <button
                    onClick={() => setPage('dashboard')}
                    className="mb-4 rounded-lg bg-zinc-800 px-4 py-2 text-white"
                >
                    ← Zurück
                </button>

                <h1 className="text-2xl font-bold mb-4">👥 Mitarbeiter</h1>

                <div className="space-y-3">
                    {employees.map((employee, index) => (
                       <div
							key={index}
							onClick={() => {
								setSelectedEmployee({
									...employee,
									job_grade: Number(employee.job_grade)
								})
								setPage('employeeDetail')
							}}
							className="rounded-xl bg-white p-4 shadow"
						>
                            <h3 className="font-bold">
                                {employee.firstname} {employee.lastname}
                            </h3>
                            <p className="text-sm text-zinc-500">
                                {employee.grade_label || `Rang ${employee.job_grade}`}
                            </p>
							<p className={employee.online ? 'text-sm text-green-600' : 'text-sm text-red-600'}>
								{employee.online ? '🟢 Online' : '🔴 Offline'}
							</p>
                        </div>
                    ))}

                    {employees.length === 0 && (
                        <div className="rounded-xl bg-white p-4 shadow">
                            Keine Mitarbeiter gefunden.
                        </div>
                    )}
                </div>
            </div>
        )
    }
	

    return (
        <div className="min-h-screen bg-zinc-100 p-4 text-zinc-900 pt-12">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">👔 Business Hub</h1>
                <p className="text-sm text-zinc-500">Mobiles Firmenmanagement</p>
            </div>

            <div className="space-y-4">
                <div className="rounded-2xl bg-white p-4 shadow">
                    <p className="text-xs uppercase text-zinc-500">Firma</p>
                    <h2 className="mt-1 text-xl font-bold">
                        {dashboard?.label || 'Lädt...'}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow">
                    <p className="text-xs uppercase text-zinc-500">Kontostand</p>
                    <h2 className="mt-1 text-xl font-bold text-green-600">
                        ${dashboard?.money?.toLocaleString('de-DE') || 0}
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">Mitarbeiter</p>
                        <h2 className="mt-1 text-2xl font-bold">
                            {dashboard?.employeeCount || 0}
                        </h2>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow">
                        <p className="text-xs uppercase text-zinc-500">Online</p>
                        <h2 className="mt-1 text-2xl font-bold text-blue-600">
                            {dashboard?.onlineCount || 0}
                        </h2>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow">
                    <h3 className="font-semibold mb-3">Schnellzugriff</h3>

                    <div className="space-y-2">
                        <button
                            onClick={async () => {
								await loadEmployees()
								setPage('employees')
							}}
                            className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold"
                        >
                            Mitarbeiter
                        </button>

                        <button
                            onClick={() => setPage('finance')}
                            className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold"
                        >
                            Firmenkonto
                        </button>

                        <button
                            onClick={() => setPage('settings')}
                            className="w-full rounded-xl bg-zinc-800 py-3 text-white font-semibold"
                        >
                            Einstellungen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}