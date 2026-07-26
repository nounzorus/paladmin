// Catalog of PalWorldSettings.ini OptionSettings keys: id (the literal ini key), type,
// default, range/options, and a short description. Sourced from the dedicated server's
// own config format (factual/functional data: key names, types, and default values are
// not creative expression, unlike map artwork). Descriptions below are written from
// scratch for this project, not copied from any third-party tool.
//
// Deliberately English-only, unlike the rest of the UI: these are ~120 technical fields
// mirroring the game's own (English-only) config keys and enum values. Translating every
// label and description into 4 languages accurately would be a large, error-prone
// undertaking for reference text that isn't really "UI copy", same reasoning CLAUDE.md
// already documents for role names and audit-log action codes. The surrounding chrome
// (category names, buttons, hints) is translated normally.

export const CATEGORIES = [
  { id: 'identity', label: 'Server Identity & Network' },
  { id: 'rates', label: 'Difficulty & Rates' },
  { id: 'death', label: 'Death & Respawn' },
  { id: 'pvp', label: 'PvP & Combat' },
  { id: 'base', label: 'Base Camps, Guilds & Building' },
  { id: 'items', label: 'World, Items & Drops' },
  { id: 'gameplay', label: 'Gameplay Features' },
  { id: 'advanced', label: 'Advanced & Misc' },
]

export const SETTINGS = [
  // ---------- Server Identity & Network ----------
  { id: 'ServerName', category: 'identity', type: 'string', default: 'Default Palworld Server', label: 'Server Name', desc: 'Name shown in the server browser and in-game.' },
  { id: 'ServerDescription', category: 'identity', type: 'string', default: '', label: 'Server Description', desc: 'Short description shown in the server browser.' },
  { id: 'ServerPassword', category: 'identity', type: 'string', default: '', label: 'Server Join Password', desc: 'Password players must enter to join. Leave empty for no password.' },
  { id: 'AdminPassword', category: 'identity', type: 'string', default: '', label: 'Admin Password', desc: 'Password for admin commands, RCON, and the REST API. Keep this in sync with the password saved for this server on the Servers page.' },
  { id: 'ServerPlayerMaxNum', category: 'identity', type: 'integer', default: '32', range: [1, 512], label: 'Max Players', desc: 'Maximum number of players allowed on the server at once.' },
  { id: 'CoopPlayerMaxNum', category: 'identity', type: 'integer', default: '4', range: [1, 4], label: 'Max Co-op Party Size', desc: 'Maximum players per co-op party (splitscreen/local groups).' },
  { id: 'PublicIP', category: 'identity', type: 'string', default: '', label: 'Public IP', desc: 'Public IP to advertise. Usually left blank for auto-detection.' },
  { id: 'PublicPort', category: 'identity', type: 'integer', default: '8211', label: 'Game Port', desc: 'UDP port players connect to for gameplay traffic.' },
  { id: 'Region', category: 'identity', type: 'string', default: '', label: 'Region', desc: 'Region tag shown in the server browser (informational only).' },
  { id: 'CrossplayPlatforms', category: 'identity', type: 'array', default: 'Steam,Xbox,PS5,Mac', label: 'Allowed Crossplay Platforms', desc: 'Comma-separated list of platforms allowed to join (Steam, Xbox, PS5, Mac).' },
  { id: 'bUseAuth', category: 'identity', type: 'boolean', default: 'True', label: 'Require Platform Authentication', desc: 'Verify players against their platform account. Turning this off is not recommended.' },
  { id: 'BanListURL', category: 'identity', type: 'string', default: 'https://api.palworldgame.com/api/banlist.txt', label: 'Ban List URL', desc: 'Remote ban list the server pulls community bans from.' },
  { id: 'RCONEnabled', category: 'identity', type: 'boolean', default: 'False', label: 'RCON Enabled', desc: 'Enables the RCON console. Deprecated by Pocketpair in favor of the REST API, but this panel supports both.' },
  { id: 'RCONPort', category: 'identity', type: 'integer', default: '25575', label: 'RCON Port', desc: 'Port for RCON connections. Keep in sync with the Servers page if you use the RCON console here.' },
  { id: 'RESTAPIEnabled', category: 'identity', type: 'boolean', default: 'False', label: 'REST API Enabled', desc: 'Must be enabled for this panel to manage the server at all.' },
  { id: 'RESTAPIPort', category: 'identity', type: 'integer', default: '8212', label: 'REST API Port', desc: 'Port for the REST API. Keep in sync with the Servers page.' },
  { id: 'bShowPlayerList', category: 'identity', type: 'boolean', default: 'False', label: 'Show Player List (Dedicated Server)', desc: 'Exposes an online player list from the dedicated server process itself.' },
  { id: 'bEnableVoiceChat', category: 'identity', type: 'boolean', default: 'False', label: 'Enable Voice Chat', desc: 'Turns in-game proximity voice chat on or off server-wide.' },
  { id: 'VoiceChatMaxVolumeDistance', category: 'identity', type: 'float', default: '3000.000000', range: [100, 50000], label: 'Voice Chat Full Volume Distance', desc: 'Distance within which voice chat plays at full volume.' },
  { id: 'VoiceChatZeroVolumeDistance', category: 'identity', type: 'float', default: '15000.000000', range: [100, 50000], label: 'Voice Chat Silence Distance', desc: 'Distance beyond which voice chat is inaudible.' },

  // ---------- Difficulty & Rates ----------
  { id: 'Difficulty', category: 'rates', type: 'select', default: 'None', options: ['None'], label: 'Difficulty Preset', desc: 'Built-in difficulty preset. Usually left at None and tuned via the rates below instead.' },
  { id: 'DayTimeSpeedRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Day Length Speed', desc: 'How fast in-game daytime passes. Higher is faster (shorter days).' },
  { id: 'NightTimeSpeedRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Night Length Speed', desc: 'How fast in-game nighttime passes. Higher is faster (shorter nights).' },
  { id: 'ExpRate', category: 'rates', type: 'float', default: '1.000000', range: [0, 20], label: 'Experience Rate', desc: 'Multiplier on XP gained from all sources.' },
  { id: 'PalCaptureRate', category: 'rates', type: 'float', default: '1.000000', range: [0.5, 5], label: 'Pal Capture Rate', desc: 'Multiplier on the chance to successfully catch a Pal.' },
  { id: 'PalSpawnNumRate', category: 'rates', type: 'float', default: '1.000000', range: [0.5, 5], label: 'Pal Spawn Density', desc: 'Multiplier on how many wild Pals spawn in the world.' },
  { id: 'PalDamageRateAttack', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Pal Attack Damage Rate', desc: 'Multiplier on damage dealt by Pals.' },
  { id: 'PalDamageRateDefense', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Pal Damage Taken Rate', desc: 'Multiplier on damage received by Pals.' },
  { id: 'PlayerDamageRateAttack', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Player Attack Damage Rate', desc: 'Multiplier on damage dealt by players.' },
  { id: 'PlayerDamageRateDefense', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Player Damage Taken Rate', desc: 'Multiplier on damage received by players.' },
  { id: 'PlayerStomachDecreaceRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Player Hunger Drain Rate', desc: 'How fast player hunger depletes. Higher means players get hungry faster.' },
  { id: 'PlayerStaminaDecreaceRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Player Stamina Drain Rate', desc: 'How fast player stamina depletes with activity.' },
  { id: 'PlayerAutoHPRegeneRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Player HP Regen Rate', desc: 'How fast players naturally regenerate health while awake.' },
  { id: 'PlayerAutoHpRegeneRateInSleep', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Player HP Regen Rate (Sleeping)', desc: 'How fast players regenerate health while sleeping.' },
  { id: 'PalStomachDecreaceRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Pal Hunger Drain Rate', desc: 'How fast a Pal’s hunger depletes.' },
  { id: 'PalStaminaDecreaceRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Pal Stamina Drain Rate', desc: 'How fast a Pal’s stamina depletes with work or combat.' },
  { id: 'PalAutoHPRegeneRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Pal HP Regen Rate', desc: 'How fast Pals naturally regenerate health.' },
  { id: 'PalAutoHpRegeneRateInSleep', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Pal HP Regen Rate (Sleeping)', desc: 'How fast Pals regenerate health while resting in a Pal Box.' },
  { id: 'WorkSpeedRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Work Speed Rate', desc: 'Multiplier on how fast Pals complete base work (farming, crafting, etc.).' },
  { id: 'PalEggDefaultHatchingTime', category: 'rates', type: 'float', default: '72.000000', range: [0, 240], label: 'Egg Hatching Time (hours)', desc: 'Base time for eggs to hatch, in in-game hours.' },
  { id: 'MonsterFarmActionSpeedRate', category: 'rates', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Ranch/Farm Production Rate', desc: 'Multiplier on item production speed from ranch-type Pals grazing.' },

  // ---------- Death & Respawn ----------
  { id: 'DeathPenalty', category: 'death', type: 'select', default: 'All', options: ['None', 'Item', 'ItemAndEquipment', 'All'], label: 'Death Penalty', desc: 'What players lose on death: nothing, items, items and equipment, or everything including party Pals.' },
  { id: 'bHardcore', category: 'death', type: 'boolean', default: 'False', label: 'Hardcore Mode', desc: 'Enables permadeath-style hardcore rules.' },
  { id: 'bPalLost', category: 'death', type: 'boolean', default: 'False', label: 'Pals Lost on Hardcore Death', desc: 'In hardcore mode, whether a player’s Pals are lost along with the player.' },
  { id: 'bCharacterRecreateInHardcore', category: 'death', type: 'boolean', default: 'False', label: 'Allow Character Recreation (Hardcore)', desc: 'In hardcore mode, whether a player can create a new character after dying.' },
  { id: 'bCanPickupOtherGuildDeathPenaltyDrop', category: 'death', type: 'boolean', default: 'False', label: 'Allow Looting Other Guilds’ Death Drops', desc: 'Whether players can pick up death-penalty item drops left by members of other guilds.' },
  { id: 'bEnableNonLoginPenalty', category: 'death', type: 'boolean', default: 'True', label: 'Enable Offline Penalty', desc: 'Whether players still accrue penalties (e.g. hunger) while offline.' },
  { id: 'BlockRespawnTime', category: 'death', type: 'float', default: '5.000000', range: [0, 60], label: 'Respawn Block Time (seconds)', desc: 'Minimum time before a dead player can respawn.' },
  { id: 'RespawnPenaltyDurationThreshold', category: 'death', type: 'float', default: '0.000000', range: [0, 3600], label: 'Respawn Penalty Threshold (seconds)', desc: 'Playtime threshold after which repeated deaths start scaling the respawn penalty.' },
  { id: 'RespawnPenaltyTimeScale', category: 'death', type: 'float', default: '2.000000', range: [0, 10], label: 'Respawn Penalty Scale', desc: 'How aggressively the respawn penalty scales once the threshold above is reached.' },

  // ---------- PvP & Combat ----------
  { id: 'bIsPvP', category: 'pvp', type: 'boolean', default: 'False', label: 'PvP Enabled', desc: 'Turns on player-vs-player combat server-wide.' },
  { id: 'bEnablePlayerToPlayerDamage', category: 'pvp', type: 'boolean', default: 'False', label: 'Allow Player-to-Player Damage', desc: 'Whether players can directly damage each other outside of formal PvP mode.' },
  { id: 'bEnableFriendlyFire', category: 'pvp', type: 'boolean', default: 'False', label: 'Friendly Fire', desc: 'Whether guildmates can damage each other and each other’s Pals.' },
  { id: 'bEnableDefenseOtherGuildPlayer', category: 'pvp', type: 'boolean', default: 'False', label: 'Allow Base Defense Against Other Guilds', desc: 'Whether base defenses (turrets, guard Pals) engage players from other guilds.' },
  { id: 'bInvisibleOtherGuildBaseCampAreaFX', category: 'pvp', type: 'boolean', default: 'False', label: 'Hide Other Guilds’ Base Area Effect', desc: 'Hides the visual base-area effect for bases belonging to other guilds.' },
  { id: 'bDisplayPvPItemNumOnWorldMap_BaseCamp', category: 'pvp', type: 'boolean', default: 'False', label: 'Show Base Item Counts on World Map (PvP)', desc: 'In PvP, shows item counts held by bases on the world map.' },
  { id: 'bDisplayPvPItemNumOnWorldMap_Player', category: 'pvp', type: 'boolean', default: 'False', label: 'Show Player Item Counts on World Map (PvP)', desc: 'In PvP, shows item counts carried by players on the world map.' },
  { id: 'bAdditionalDropItemWhenPlayerKillingInPvPMode', category: 'pvp', type: 'boolean', default: 'False', label: 'Enable Bonus Drop on PvP Kill', desc: 'Whether killing a player in PvP drops bonus items on top of the normal death penalty.' },
  { id: 'AdditionalDropItemWhenPlayerKillingInPvPMode', category: 'pvp', type: 'string', default: 'PlayerDropItem', label: 'Bonus PvP Kill Drop Item', desc: 'Which item is dropped as the PvP kill bonus, if enabled above.' },
  { id: 'AdditionalDropItemNumWhenPlayerKillingInPvPMode', category: 'pvp', type: 'integer', default: '1', range: [0, 100], label: 'Bonus PvP Kill Drop Amount', desc: 'How many of the bonus item are dropped per PvP kill.' },

  // ---------- Base Camps, Guilds & Building ----------
  { id: 'BaseCampMaxNum', category: 'base', type: 'integer', default: '128', range: [0, 10240], label: 'Max Base Camps (Server)', desc: 'Maximum number of base camps allowed on the whole server.' },
  { id: 'BaseCampMaxNumInGuild', category: 'base', type: 'integer', default: '3', range: [1, 50], label: 'Max Base Camps per Guild', desc: 'Maximum number of base camps a single guild can own.' },
  { id: 'BaseCampWorkerMaxNum', category: 'base', type: 'integer', default: '15', range: [1, 50], label: 'Max Workers per Base', desc: 'Maximum number of Pals that can work at a single base camp.' },
  { id: 'MaxBuildingLimitNum', category: 'base', type: 'integer', default: '0', range: [0, 8], label: 'Per-Player Building Limit', desc: 'Caps how many structures a single player can place. 0 disables the limit.' },
  { id: 'bBuildAreaLimit', category: 'base', type: 'boolean', default: 'False', label: 'Restrict Building Area', desc: 'Whether building is restricted to a defined area around base camps.' },
  { id: 'BuildObjectHpRate', category: 'base', type: 'float', default: '1.000000', range: [0.5, 5], label: 'Structure HP Rate', desc: 'Multiplier on the max HP of placed structures.' },
  { id: 'BuildObjectDamageRate', category: 'base', type: 'float', default: '1.000000', range: [0.5, 3], label: 'Structure Damage Taken Rate', desc: 'Multiplier on damage structures take from attacks.' },
  { id: 'BuildObjectDeteriorationDamageRate', category: 'base', type: 'float', default: '1.000000', range: [0, 10], label: 'Structure Decay Rate', desc: 'Multiplier on passive deterioration damage to structures over time.' },
  { id: 'GuildPlayerMaxNum', category: 'base', type: 'integer', default: '20', range: [1, 100], label: 'Max Players per Guild', desc: 'Maximum number of members a guild can have.' },
  { id: 'GuildRejoinCooldownMinutes', category: 'base', type: 'integer', default: '0', range: [0, 1440], label: 'Guild Rejoin Cooldown (minutes)', desc: 'Cooldown before a player can rejoin a guild after leaving.' },
  { id: 'bAutoResetGuildNoOnlinePlayers', category: 'base', type: 'boolean', default: 'False', label: 'Auto-Disband Inactive Guilds', desc: 'Automatically resets guilds with no members who have logged in recently.' },
  { id: 'AutoResetGuildTimeNoOnlinePlayers', category: 'base', type: 'float', default: '72.000000', range: [0, 240], label: 'Inactive Guild Threshold (hours)', desc: 'How long a guild can have no active members before it’s auto-reset, if enabled above.' },
  { id: 'AutoTransferMasterCheckIntervalSeconds', category: 'base', type: 'float', default: '3600.000000', range: [60, 86400], label: 'Guild Master Transfer Check Interval (seconds)', desc: 'How often the server checks whether an inactive guild master should be replaced.' },
  { id: 'AutoTransferMasterThresholdDays', category: 'base', type: 'integer', default: '14', range: [1, 365], label: 'Guild Master Inactivity Threshold (days)', desc: 'How many days a guild master must be offline before leadership auto-transfers.' },
  { id: 'MaxGuildsPerFrame', category: 'base', type: 'integer', default: '10', range: [1, 100], label: 'Max Guilds Processed per Frame', desc: 'Server-performance tuning: how many guilds are processed per server tick. Leave default unless advised otherwise.' },

  // ---------- World, Items & Drops ----------
  { id: 'DropItemMaxNum', category: 'items', type: 'integer', default: '3000', range: [0, 10000], label: 'Max Dropped Items (World)', desc: 'Maximum number of items lying on the ground at once, server-wide.' },
  { id: 'DropItemMaxNum_UNKO', category: 'items', type: 'integer', default: '100', range: [0, 5000], label: 'Max Droppings (World)', desc: 'Maximum number of Pal droppings (fertilizer items) present at once.' },
  { id: 'DropItemAliveMaxHours', category: 'items', type: 'float', default: '1.000000', range: [0, 240], label: 'Dropped Item Lifetime (hours)', desc: 'How long items stay on the ground before despawning.' },
  { id: 'PhysicsActiveDropItemMaxNum', category: 'items', type: 'integer', default: '-1', range: [-1, 10000], label: 'Max Physics-Active Dropped Items', desc: 'Caps how many dropped items simulate physics at once. -1 leaves it uncapped.' },
  { id: 'ItemWeightRate', category: 'items', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Item Weight Rate', desc: 'Multiplier on carried item weight (affects encumbrance).' },
  { id: 'CollectionDropRate', category: 'items', type: 'float', default: '1.000000', range: [0.5, 5], label: 'Gathering Yield Rate', desc: 'Multiplier on materials gained from gathering resource nodes.' },
  { id: 'CollectionObjectHpRate', category: 'items', type: 'float', default: '1.000000', range: [0.5, 3], label: 'Resource Node HP Rate', desc: 'Multiplier on how many hits a resource node takes before depleting.' },
  { id: 'CollectionObjectRespawnSpeedRate', category: 'items', type: 'float', default: '1.000000', range: [0.5, 5], label: 'Resource Node Respawn Rate', desc: 'Multiplier on how quickly depleted resource nodes respawn.' },
  { id: 'EnemyDropItemRate', category: 'items', type: 'float', default: '1.000000', range: [0.5, 5], label: 'Enemy Drop Rate', desc: 'Multiplier on item drops from defeated enemies.' },
  { id: 'EquipmentDurabilityDamageRate', category: 'items', type: 'float', default: '1.000000', range: [0.1, 5], label: 'Equipment Durability Loss Rate', desc: 'Multiplier on how fast tools and weapons lose durability with use.' },
  { id: 'ItemContainerForceMarkDirtyInterval', category: 'items', type: 'float', default: '1.000000', range: [0.1, 10], label: 'Item Container Sync Interval', desc: 'Server-performance tuning for how often item container state is force-synced. Leave default unless advised otherwise.' },
  { id: 'ItemCorruptionMultiplier', category: 'items', type: 'float', default: '1.000000', range: [0.1, 10], label: 'Item Corruption Multiplier', desc: 'Multiplier affecting item data corruption safeguards. Leave default unless advised otherwise.' },
  { id: 'SupplyDropSpan', category: 'items', type: 'integer', default: '180', range: [0, 1000], label: 'Supply Drop Interval (minutes)', desc: 'How often supply drops and meteorite events occur.' },

  // ---------- Gameplay Features ----------
  { id: 'bEnableInvaderEnemy', category: 'gameplay', type: 'boolean', default: 'True', label: 'Enable Raids/Invaders', desc: 'Whether invader enemy events (raids) can occur.' },
  { id: 'EnablePredatorBossPal', category: 'gameplay', type: 'boolean', default: 'True', label: 'Enable Alpha/Predator Pals', desc: 'Whether stronger predator-variant boss Pals can spawn in the world.' },
  { id: 'bEnableFastTravel', category: 'gameplay', type: 'boolean', default: 'True', label: 'Enable Fast Travel', desc: 'Whether fast travel is allowed at all.' },
  { id: 'bEnableFastTravelOnlyBaseCamp', category: 'gameplay', type: 'boolean', default: 'False', label: 'Fast Travel: Palboxes Only', desc: 'If enabled, fast travel only works between Palboxes; Great Eagle Statues are disabled. If disabled, both are usable.' },
  { id: 'bIsStartLocationSelectByMap', category: 'gameplay', type: 'boolean', default: 'True', label: 'Allow Map Start Selection', desc: 'Whether new players can pick their starting location on the map.' },
  { id: 'bExistPlayerAfterLogout', category: 'gameplay', type: 'boolean', default: 'False', label: 'Keep Player Body After Logout', desc: 'Whether a player’s character remains in the world (vulnerable) after disconnecting.' },
  { id: 'bAllowGlobalPalboxExport', category: 'gameplay', type: 'boolean', default: 'True', label: 'Allow Palbox Export', desc: 'Whether players can export Pals from the global Palbox.' },
  { id: 'bAllowGlobalPalboxImport', category: 'gameplay', type: 'boolean', default: 'False', label: 'Allow Palbox Import', desc: 'Whether players can import Pals into the global Palbox.' },
  { id: 'bAllowClientMod', category: 'gameplay', type: 'boolean', default: 'True', label: 'Allow Client-Side Mods', desc: 'Whether players connecting with client-side mods are permitted.' },
  { id: 'bIsShowJoinLeftMessage', category: 'gameplay', type: 'boolean', default: 'True', label: 'Show Join/Leave Messages', desc: 'Whether player join/leave notifications are broadcast in chat.' },
  { id: 'DenyTechnologyList', category: 'gameplay', type: 'array', default: '', label: 'Blocked Technologies', desc: 'Comma-separated list of technology unlocks to disable on this server.' },
  { id: 'bEnableAimAssistPad', category: 'gameplay', type: 'boolean', default: 'True', label: 'Aim Assist (Controller)', desc: 'Whether aim assist is enabled for controller/gamepad input.' },
  { id: 'bEnableAimAssistKeyboard', category: 'gameplay', type: 'boolean', default: 'False', label: 'Aim Assist (Keyboard/Mouse)', desc: 'Whether aim assist is enabled for keyboard and mouse input.' },
  { id: 'bAllowEnhanceStat_Health', category: 'gameplay', type: 'boolean', default: 'True', label: 'Allow Stat Enhancement: Health', desc: 'Whether players can spend points to enhance the Health stat.' },
  { id: 'bAllowEnhanceStat_Attack', category: 'gameplay', type: 'boolean', default: 'True', label: 'Allow Stat Enhancement: Attack', desc: 'Whether players can spend points to enhance the Attack stat.' },
  { id: 'bAllowEnhanceStat_Stamina', category: 'gameplay', type: 'boolean', default: 'True', label: 'Allow Stat Enhancement: Stamina', desc: 'Whether players can spend points to enhance the Stamina stat.' },
  { id: 'bAllowEnhanceStat_Weight', category: 'gameplay', type: 'boolean', default: 'True', label: 'Allow Stat Enhancement: Weight', desc: 'Whether players can spend points to enhance the carry-Weight stat.' },
  { id: 'bAllowEnhanceStat_WorkSpeed', category: 'gameplay', type: 'boolean', default: 'True', label: 'Allow Stat Enhancement: Work Speed', desc: 'Whether players can spend points to enhance their Work Speed stat.' },
  { id: 'bEnableBuildingPlayerUIdDisplay', category: 'gameplay', type: 'boolean', default: 'False', label: 'Show Builder ID on Structures', desc: 'Whether the placing player’s ID is shown on structures.' },

  // ---------- Advanced & Misc ----------
  { id: 'AutoSaveSpan', category: 'advanced', type: 'float', default: '30.000000', range: [30, 3600], label: 'Auto-Save Interval (minutes)', desc: 'How often the server automatically saves the world.' },
  { id: 'bIsUseBackupSaveData', category: 'advanced', type: 'boolean', default: 'True', label: 'Keep Backup Saves', desc: 'Whether the server keeps rolling backup copies of the world save.' },
  { id: 'bIsMultiplay', category: 'advanced', type: 'boolean', default: 'False', label: 'Multiplayer Mode', desc: 'Enables multiplayer-specific server behavior. Should be True for a dedicated server with more than one player.' },
  { id: 'RandomizerType', category: 'advanced', type: 'select', default: 'None', options: ['None', 'Region', 'All'], label: 'World Randomizer', desc: 'Randomizes Pal spawns by region, globally, or leaves the world un-randomized.' },
  { id: 'RandomizerSeed', category: 'advanced', type: 'string', default: '', label: 'Randomizer Seed', desc: 'Seed value for the world randomizer, if enabled above.' },
  { id: 'bIsRandomizerPalLevelRandom', category: 'advanced', type: 'boolean', default: 'False', label: 'Randomize Pal Levels', desc: 'Whether the randomizer also randomizes wild Pal levels.' },
  { id: 'LogFormatType', category: 'advanced', type: 'select', default: 'Text', options: ['Text', 'Json'], label: 'Log Format', desc: 'Server log output format.' },
  { id: 'ChatPostLimitPerMinute', category: 'advanced', type: 'integer', default: '10', range: [0, 100], label: 'Chat Rate Limit (per minute)', desc: 'Maximum chat messages a player can send per minute, as basic spam protection.' },
  { id: 'ServerReplicatePawnCullDistance', category: 'advanced', type: 'float', default: '15000.000000', range: [5000, 15000], label: 'Pal Sync Distance', desc: 'Distance from a player at which Pals stop being synced over the network. Lowering this can help server performance on large player counts.' },
  { id: 'PlayerDataPalStorageUpdateCheckTickInterval', category: 'advanced', type: 'float', default: '1.000000', range: [0.1, 60], label: 'Pal Storage Sync Interval', desc: 'Server-performance tuning for Pal storage update checks. Leave default unless advised otherwise.' },
  { id: 'BuildingNameDisplayCacheTTLSeconds', category: 'advanced', type: 'integer', default: '60', range: [1, 3600], label: 'Building Name Cache TTL (seconds)', desc: 'Server-performance tuning for how long building name lookups are cached. Leave default unless advised otherwise.' },
  { id: 'bActiveUNKO', category: 'advanced', type: 'boolean', default: 'False', label: 'Enable Droppings', desc: 'Whether Pal droppings (fertilizer items) are generated at all.' },
]

export function findSetting(id) {
  return SETTINGS.find((s) => s.id === id)
}
