fx_version 'cerulean'

games { 'gta5' }

version '1.0.0'

author 'Luminera Studios'
description 'Boss Hub - ESX Boss Management App for Quasar Smartphone'

lua54 'yes'

shared_scripts {
    '@ox_lib/init.lua',
	'config.lua',
}

client_scripts {
    'client/main.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/server.lua'
}

files({
    'ui/build/**/*',
})

dependencies {
	'ox_lib',
    'qs-smartphone',
}

escrow_ignore {
     'config.lua',
}

dependency '/assetpacks'