local ESX = exports['es_extended']:getSharedObject()

lib.callback.register('lumi_bossapp:getDashboard', function(source)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then
        return {
            allowed = false,
            message = 'Spieler nicht gefunden',
            label = 'Kein Spieler',
            employeeCount = 0,
            onlineCount = 0,
            money = 0
        }
    end

    local job = xPlayer.getJob()
    local jobName = job.name
    local grade = tonumber(job.grade)

    --print('[lumi_bossapp] Dashboard requested by:', GetPlayerName(source))
    --print('[lumi_bossapp] Job:', jobName, 'Grade:', grade, 'Label:', job.label, 'GradeLabel:', job.grade_label)

    local bossGrade = MySQL.scalar.await(
        'SELECT isboss FROM job_grades WHERE job_name = ? AND grade = ? LIMIT 1',
        { jobName, grade }
    )

    --print('[lumi_bossapp] isboss:', bossGrade)

    local employeeResult = MySQL.single.await(
    'SELECT COUNT(*) as total FROM users WHERE job = ?',
    { jobName }
)

	local employeeCount = employeeResult and employeeResult.total or 0

	--print('[lumi_bossapp] EmployeeCount RAW:', employeeCount)
	--print('[lumi_bossapp] JobName:', jobName)

    local societyAccount = 'society_' .. jobName

    local money = MySQL.scalar.await(
    'SELECT money FROM addon_account_data WHERE account_name = ? LIMIT 1',
    { societyAccount }
) or 0

	local onlineCount = 0

	for _, playerId in pairs(ESX.GetPlayers()) do
		local xTarget = ESX.GetPlayerFromId(playerId)

		if xTarget then
			local targetJob = xTarget.getJob()

			if targetJob.name == jobName then
				onlineCount = onlineCount + 1
			end
		end
	end

    return {
        allowed = tonumber(bossGrade) == 1,
        message = tonumber(bossGrade) == 1 and 'OK' or 'Du bist kein Boss.',
		locale = Config.Locale or 'de',
        job = jobName,
        label = job.label or jobName,
        grade = job.grade_label or tostring(grade),
        employeeCount = tonumber(employeeCount) or 0,
        onlineCount = onlineCount,
        money = tonumber(money) or 0
    }
end)

lib.callback.register('lumi_bossapp:getEmployees', function(source)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return {} end

    local job = xPlayer.getJob()

    local employees = MySQL.query.await([[
        SELECT
            u.identifier,
            u.firstname,
            u.lastname,
            u.job_grade,
            jg.label as grade_label
        FROM users u
        LEFT JOIN job_grades jg
            ON jg.job_name = u.job
            AND jg.grade = u.job_grade
        WHERE u.job = ?
        ORDER BY u.job_grade DESC
    ]], {
        job.name
    }) or {}

    for _, employee in pairs(employees) do
        employee.online = false

        local targetPlayer = ESX.GetPlayerFromIdentifier(employee.identifier)
        if targetPlayer then
            employee.online = true
        end
    end
		--print('[lumi_bossapp] Employees found:', #employees)

		-- for k, v in pairs(employees) do
			-- print(
				-- '[lumi_bossapp]',
				-- v.firstname,
				-- v.lastname,
				-- v.job_grade,
				-- v.online
			-- )
		-- end
    return employees
end)

local function IsBoss(xPlayer)
    local job = xPlayer.getJob()

    local bossGrade = MySQL.scalar.await(
        'SELECT isboss FROM job_grades WHERE job_name = ? AND grade = ? LIMIT 1',
        { job.name, tonumber(job.grade) }
    )

    return tonumber(bossGrade) == 1
end

lib.callback.register('lumi_bossapp:getNearbyPlayers', function(source)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return {} end
    if not IsBoss(xPlayer) then return {} end

    local players = {}
    local srcPed = GetPlayerPed(source)
    local srcCoords = GetEntityCoords(srcPed)
    local maxDistance = Config.HireDistance or 5.0

    for _, playerId in pairs(ESX.GetPlayers()) do
        local targetId = tonumber(playerId)

        if targetId and targetId ~= source then
            local targetPed = GetPlayerPed(targetId)
            local targetCoords = GetEntityCoords(targetPed)
            local distance = #(srcCoords - targetCoords)

            if distance <= maxDistance then
                table.insert(players, {
                    id = targetId,
                    name = GetPlayerName(targetId),
                    distance = math.floor(distance * 10) / 10
                })
            end
        end
    end

    return players
end)

lib.callback.register('lumi_bossapp:hirePlayer', function(source, targetId)
    targetId = tonumber(targetId)

    local xPlayer = ESX.GetPlayerFromId(source)
    local xTarget = ESX.GetPlayerFromId(targetId)

    if not xPlayer or not xTarget then
        return false, 'Spieler nicht gefunden'
    end

    if not IsBoss(xPlayer) then
        return false, 'Du bist kein Boss'
    end

    local srcPed = GetPlayerPed(source)
    local targetPed = GetPlayerPed(targetId)

    local srcCoords = GetEntityCoords(srcPed)
    local targetCoords = GetEntityCoords(targetPed)

    local maxDistance = Config.HireDistance or 5.0
    local distance = #(srcCoords - targetCoords)

    if distance > maxDistance then
        return false, 'Spieler ist zu weit entfernt'
    end

    local job = xPlayer.getJob()
    local startGrade = Config.HireStartGrade or 0
	
	local targetJob = xTarget.getJob()

	if targetJob.name == job.name then
		return false, 'Spieler arbeitet bereits in dieser Firma'
	end

    local gradeExists = MySQL.scalar.await(
        'SELECT COUNT(*) FROM job_grades WHERE job_name = ? AND grade = ?',
        { job.name, startGrade }
    )

    if tonumber(gradeExists) <= 0 then
        return false, 'Start-Rang existiert nicht'
    end

    xTarget.setJob(job.name, startGrade)
	--print('[BossHub Hire] target identifier:', xTarget.identifier)

	local changed = MySQL.update.await(
		'UPDATE users SET job = ?, job_grade = ? WHERE identifier = ? LIMIT 1',
		{ job.name, startGrade, xTarget.identifier }
	)

	--print('[BossHub Hire] DB rows changed:', changed)

    return true, ('%s wurde eingestellt'):format(GetPlayerName(targetId))
end)

lib.callback.register('lumi_bossapp:depositMoney', function(source, amount)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return false end
    if not IsBoss(xPlayer) then return false end

    amount = tonumber(amount)
    if not amount or amount <= 0 then return false end
    amount = math.floor(amount)

    if xPlayer.getMoney() < amount then
        return false
    end

    local accountName = 'society_' .. xPlayer.job.name

    xPlayer.removeMoney(amount)

    MySQL.update.await(
        'UPDATE addon_account_data SET money = money + ? WHERE account_name = ? LIMIT 1',
        { amount, accountName }
    )

    return true
end)

lib.callback.register('lumi_bossapp:withdrawMoney', function(source, amount)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return false end
    if not IsBoss(xPlayer) then return false end

    amount = tonumber(amount)
    if not amount or amount <= 0 then return false end
    amount = math.floor(amount)

    local accountName = 'society_' .. xPlayer.job.name

    local societyMoney = MySQL.scalar.await(
        'SELECT money FROM addon_account_data WHERE account_name = ? LIMIT 1',
        { accountName }
    ) or 0

    if tonumber(societyMoney) < amount then
        return false
    end

    MySQL.update.await(
        'UPDATE addon_account_data SET money = money - ? WHERE account_name = ? LIMIT 1',
        { amount, accountName }
    )

    xPlayer.addMoney(amount)

    return true
end)

lib.callback.register('lumi_bossapp:setEmployeeGrade', function(source, identifier, newGrade)
    --print('[lumi_bossapp] setEmployeeGrade called:', source, identifier, newGrade)

    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return false end
    if not IsBoss(xPlayer) then return false end

    local job = xPlayer.getJob()
    newGrade = tonumber(newGrade)

    if not identifier or not newGrade or newGrade < 0 then
        return false
    end

    local gradeExists = MySQL.scalar.await(
        'SELECT COUNT(*) FROM job_grades WHERE job_name = ? AND grade = ?',
        { job.name, newGrade }
    )

    if tonumber(gradeExists) <= 0 then
        return false
    end

    MySQL.update.await(
        'UPDATE users SET job_grade = ? WHERE identifier = ? AND job = ? LIMIT 1',
        { newGrade, identifier, job.name }
    )

    --print('[lumi_bossapp] Grade updated:', identifier, newGrade)

    local targetPlayer = ESX.GetPlayerFromIdentifier(identifier)
    if targetPlayer then
        targetPlayer.setJob(job.name, newGrade)
       -- print('[lumi_bossapp] Online player job updated:', identifier, job.name, newGrade)
    end

    return true
end)

lib.callback.register('lumi_bossapp:fireEmployee', function(source, identifier)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return false end
    if not IsBoss(xPlayer) then return false end

    MySQL.update.await(
        'UPDATE users SET job = ?, job_grade = ? WHERE identifier = ? LIMIT 1',
        {
            'unemployed',
            0,
            identifier
        }
    )

    local targetPlayer = ESX.GetPlayerFromIdentifier(identifier)

    if targetPlayer then
        targetPlayer.setJob('unemployed', 0)
    end

    return true
end)

