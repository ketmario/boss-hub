local PHONE_RESOURCE = 'qs-smartphone'
local ui = 'https://cfx-nui-' .. GetCurrentResourceName() .. '/ui/build/'
local APP_ID = 'lumi_bossapp'

RegisterNUICallback('lumi-bossapp:ping', function(data, cb)
    cb({
        ok = true,
        message = 'Boss App läuft',
        echo = data,
    })
end)

RegisterNUICallback('lumi_bossapp:getEmployees', function(data, cb)
    local result = lib.callback.await('lumi_bossapp:getEmployees', false)
    cb(result or {})
end)

RegisterNUICallback('lumi_bossapp:getNearbyPlayers', function(data, cb)
    local result = lib.callback.await(
        'lumi_bossapp:getNearbyPlayers',
        false
    )

    cb(result or {})
end)

RegisterNUICallback('lumi_bossapp:hirePlayer', function(data, cb)
    local result = lib.callback.await(
        'lumi_bossapp:hirePlayer',
        false,
        data.targetId
    )

    cb(result)
end)

RegisterNUICallback('lumi_bossapp:depositMoney', function(data, cb)
    local result = lib.callback.await(
        'lumi_bossapp:depositMoney',
        false,
        data.amount
    )

    cb(result)
end)

RegisterNUICallback('lumi_bossapp:withdrawMoney', function(data, cb)
    local result = lib.callback.await(
        'lumi_bossapp:withdrawMoney',
        false,
        data.amount
    )

    cb(result)
end)

RegisterNUICallback('lumi_bossapp:setEmployeeGrade', function(data, cb)
    local result = lib.callback.await(
        'lumi_bossapp:setEmployeeGrade',
        false,
        data.identifier,
        data.newGrade
    )

    cb(result)
end)

RegisterNUICallback('lumi_bossapp:fireEmployee', function(data, cb)
    local result = lib.callback.await(
        'lumi_bossapp:fireEmployee',
        false,
        data.identifier
    )

    cb(result)
end)

RegisterNUICallback('lumi_bossapp:getDashboard', function(data, cb)
    --print('[lumi_bossapp] NUI getDashboard called')

    local ok, result = pcall(function()
        return lib.callback.await('lumi_bossapp:getDashboard', false)
    end)

    if not ok then
        --print('[lumi_bossapp] getDashboard error:', result)

        cb({
            allowed = false,
            message = 'Callback Fehler',
            label = 'Fehler',
            employeeCount = 0,
            onlineCount = 0,
            money = 0
        })

        return
    end

    --print('[lumi_bossapp] Dashboard result:', json.encode(result))

    cb(result or {
        allowed = false,
        message = 'Keine Daten',
        label = 'Keine Daten',
        employeeCount = 0,
        onlineCount = 0,
        money = 0
    })
end)

local APP_NAME = 'Boss Hub'
local APP_CREATOR = 'Luminera Development'
local APP_DESCRIPTION = 'Mobiles ESX Boss Menü für Firmen und Fraktionen.'

local function registerApp()
    local added, reason = exports[PHONE_RESOURCE]:addCustomApp({
        id = APP_ID,
		label = APP_NAME,
		icon = ui .. 'icon.webp',
		category = 'Business',
		creator = APP_CREATOR,
		description = APP_DESCRIPTION,
        age = '3+',
        appStoreOnly = false,
        price = 0,
        sizeMb = 5,
        iframe = {
            url = ui .. 'index.html',
        },
        custom = {
            enabled = true,
            sourceResource = GetCurrentResourceName(),
            bridge = {
                enabled = true,
                allowedOrigins = {
                    'https://cfx-nui-' .. GetCurrentResourceName()
                },
            },
        },
    })

    if not added then
        --print(('[lumi_bossapp] addCustomApp failed: %s'):format(reason or 'unknown'))
        return
    end

    --print('[lumi_bossapp] Business Hub registered')
end

CreateThread(function()
    while GetResourceState(PHONE_RESOURCE) ~= 'started' do
        Wait(500)
    end

    registerApp()
end)

AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == PHONE_RESOURCE then
        registerApp()
    end
end)
