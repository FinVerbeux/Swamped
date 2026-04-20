// ================================================
    // GAME STATE
    // ================================================
    const GameState = {
        data: 0n, bandwidth: 0n, totalPackets: 0n,
        startTime: Date.now(), lastSave: Date.now(), lastTick: Date.now(),
        buildings: {}, upgrades: {}, consumables: {},
        temperature: {
            current: 18, target: 18, maxSafe: 25, productionPenalty: 0,
            qteActive: false, qteStartTime: 0, qteTimeout: 15000, qteCooldown: 0,
            qteCommands: ['cooling', 'ventilate', 'fan_ctrl', 'hvac_reset', 'temp_adjust'],
            expectedCommand: ''
        },
        skills: {
            dnsAmplification: { level: 0, maxLevel: 5, active: false, cooldown: 0, baseCooldown: 90000, duration: 10000, multiplier: 50 },
            broadcastStorm: { level: 0, maxLevel: 5, active: false, instability: 0, crashed: false, crashTime: 0, crashDuration: 30000, multiplier: 10 },
            packetInjection: { level: 0, maxLevel: 3, active: false, cooldown: 0, baseCooldown: 70000, duration: 15000, clickMultiplier: 5 }
        },
        systemMalfunction: { active: false, severity: 0, startTime: 0, nextMalfunctionCheck: Date.now() + 300000 },
        uiTheme: 'default', miningMode: 'data', crypto: 0, processorCores: 0n,
        blackMarket: {},
        rivalAttack: { active: false, endTime: 0, expectedCommand: 'firewall', nextAttackCheck: Date.now() + 120000 },
        contract: {
            active: null,
            pool: [],
            stats: { crashes: 0n, blackouts: 0n, completed: 0n }
        },
        story: { unlocked: ['boot_sequence'], active: 'boot_sequence' },
        energy: { currentWatts: 0, capacityWatts: 2500, blackout: false, blackoutEnd: 0, baseCapacity: 2500, hackedGridBonus: 0, backupGenerator: false },
        factions: { ghostwire: { reputation: 0 }, blackflag: { reputation: 0 }, overclock: { reputation: 0 } },
        talents: { redPhishing: 0, redPayload: 0, blueShield: 0, blueCooling: 0, hardwareEfficiency: 0, hardwarePower: 0 },
        packetsFromAutomation: 0n, boosterCooldownUntil: 0, coolantCooldownUntil: 0,
        files: [],
        solarStorm: { active: false, endTime: 0, nextCheck: Date.now() + 150000, impactMode: 'production', productionMultiplier: 0.7, wattsMultiplier: 1.25, count: 0 },
        surveillance: { active: false, level: 0, nextCheck: Date.now() + 60000, rivalMultiplier: 1 },
        knownAttackerIps: [], honeypot: { active: false, nextIntelAt: 0 },
        uiRender: { lastPanelRender: 0 },
        targets: {},
        matrix: { activeContact: 'michel', conversations: {}, unread: {} },
        achievementsUnlocked: [],
        _achievementFlags: {},
        backgroundLogTimer: 0,
        commandLoadout: ['ping 10', 'stats', 'mine data'],
        analytics: { contractFailed: 0, contractCompleted: 0, firstPrestigeAt: 0 },
        guidance: { lastContractFailure: 0, lastBlackout: 0, lastPrestige: 0, passiveMutedLogged: false },
        uiCollapsed: { objective: false, loadout: false },
        loadoutRuntime: { cooldownMs: 2500, lastUsedAt: [0, 0, 0] },
        regionControl: { na: 0, eu: 0, apac: 0, latam: 0, africa: 0, oceania: 0 },
        secretCommandUsage: { eps: 0, replication: false },
        lootedBuildings: {},
        xmrMarket: {
            price: 1.0,
            history: [],
            lastTick: 0,
            tickInterval: 15000,
            trend: 0
        }
    };

    const DIFFICULTY_MULTIPLIER = 1.35;
    const SECRET_SALT = 'swamped_vault_2026';
    const SECRET_EPS_MD5 = '2b586611e250562e6b8a50f68df6d563';
    const SECRET_REPLICATION_MD5 = 'd965b7d39c9103d1eae696661ff91a67';

    const REGION_CONFIG = [
        { id: 'na', name: 'North America', bonusPerCompletion: 0.03 },
        { id: 'eu', name: 'Europe', bonusPerCompletion: 0.03 },
        { id: 'apac', name: 'APAC', bonusPerCompletion: 0.04 },
        { id: 'latam', name: 'LATAM', bonusPerCompletion: 0.02 },
        { id: 'africa', name: 'Africa', bonusPerCompletion: 0.02 },
        { id: 'oceania', name: 'Oceania', bonusPerCompletion: 0.02 }
    ];

    // ================================================
    // DATA TABLES
    // ================================================
    const BUILDINGS = [
        { id: 'bash_script', name: 'Bash Script', baseCost: 10n, baseProduction: 1n, multiplier: 1.15, description: 'Basic automation script' },
        { id: 'cisco_switch', name: 'Cisco Switch', baseCost: 100n, baseProduction: 5n, multiplier: 1.15, description: 'Manages local traffic' },
        { id: 'dedicated_server', name: 'Dedicated Server', baseCost: 1000n, baseProduction: 25n, multiplier: 1.15, description: 'Powerful computing unit' },
        { id: 'iot_botnet', name: 'IoT Botnet', baseCost: 10000n, baseProduction: 100n, multiplier: 1.15, description: 'Compromised devices network' },
        { id: 'fiber_backbone', name: 'Fiber Backbone', baseCost: 100000n, baseProduction: 500n, multiplier: 1.15, description: 'High-speed data pipeline' },
        { id: 'data_center', name: 'Data Center', baseCost: 1000000n, baseProduction: 2500n, multiplier: 1.15, description: 'Industrial scale processing' },
        { id: 'edge_proxy_farm', name: 'Edge Proxy Farm', baseCost: 12000000n, baseProduction: 14000n, multiplier: 1.17, description: 'Distributed traffic obfuscation nodes' },
        { id: 'satellite_uplink', name: 'Satellite Uplink', baseCost: 75000000n, baseProduction: 70000n, multiplier: 1.18, description: 'Off-grid high-latency global relay' },
        // Prestige-locked buildings
        { id: 'underground_dc', name: 'Underground Datacenter', baseCost: 500000000n, baseProduction: 400000n, multiplier: 1.20, description: 'Off-grid bunker facility', requiresCores: 1 },
        { id: 'hacked_satellite', name: 'Compromised Satellite', baseCost: 5000000000n, baseProduction: 2000000n, multiplier: 1.22, description: 'Repurposed orbital relay', requiresCores: 3 },
        { id: 'global_botnet', name: 'Global Botnet Mesh', baseCost: 50000000000n, baseProduction: 10000000n, multiplier: 1.25, description: 'Millions of silent nodes worldwide', requiresCores: 6 },
    ];

    const UPGRADES = [
        { id: 'ipv6_migration', name: 'IPv6 Migration', cost: 500n, effect: { building: 'cisco_switch', multiplier: 2 }, description: 'Double Cisco Switch efficiency', purchased: false },
        { id: 'rapid_icmp', name: 'Rapid ICMP Burst', cost: 2000n, effect: { type: 'manual_ping', multiplier: 2 }, description: 'Double data from manual ping', purchased: false },
        { id: 'cpu_overclocking', name: 'CPU Overclocking', cost: 5000n, effect: { type: 'global', multiplier: 1.2 }, description: '+20% global production', purchased: false },
        { id: 'gold_cables', name: 'Gold Plated Cables', cost: 25000n, effect: { type: 'global', multiplier: 1.15 }, description: '+15% global production', purchased: false },
        { id: 'ssd_raid', name: 'SSD RAID Array', cost: 100000n, effect: { building: 'dedicated_server', multiplier: 3 }, description: 'Triple Dedicated Server output', purchased: false },
        { id: 'quantum_encryption', name: 'Quantum Encryption', cost: 500000n, effect: { type: 'global', multiplier: 1.5 }, description: '+50% global production', purchased: false },
        { id: 'neural_network', name: 'Neural Network AI', cost: 2000000n, effect: { type: 'global', multiplier: 2 }, description: 'Double all production', purchased: false },
        { id: 'power_compression', name: 'Power Compression v1', cost: 8000000n, effect: { type: 'watts_divider', value: 2 }, description: 'Halve total watt consumption (÷2)', purchased: false },
        { id: 'quantum_psu', name: 'Quantum PSU v2', cost: 40000000n, effect: { type: 'watts_divider', value: 3 }, description: 'Reduce watt consumption to a third (÷3)', purchased: false },
    ];

    const CONSUMABLES = [
        { id: 'repair_kit', name: 'Emergency Repair Kit', cost: 1000n, description: 'Instantly fix system malfunction', effect: 'repair', count: 0 },
        { id: 'coolant', name: 'Liquid Nitrogen Coolant', cost: 2500n, description: 'Reduce crash recovery time by 4s (40s cooldown)', effect: 'cooldown_reduce', value: 4000, count: 0 },
        { id: 'ac_repair', name: 'AC Repair Kit', cost: 3000n, description: 'Reduce temperature by 10°C instantly', effect: 'cool_down', value: 10, count: 0 },
        { id: 'stability_patch', name: 'Stability Patch', cost: 5000n, description: 'Reduce instability by 50%', effect: 'stability', count: 0 },
        { id: 'bandwidth_boost', name: 'Bandwidth Booster', cost: 18000n, description: 'x2 production for 20s (90s cooldown)', effect: 'boost', multiplier: 3, duration: 30000, count: 0 },
        { id: 'malfunction_shield', name: 'Malfunction Shield', cost: 15000n, description: 'Prevent next malfunction', effect: 'shield', count: 0 },
        { id: 'phone_list', name: 'Corporate Phone List', cost: 50000n, description: 'Unlock social engineering targets', effect: 'unlock_targets', count: 0 }
    ];

    const BLACK_MARKET_ITEMS = [
        { id: 'quantum_rig', name: 'Quantum Mining Rig', costCrypto: 8, description: '+35% crypto mining output', effect: { type: 'crypto_multiplier', value: 1.35 } },
        { id: 'rootkit_loader', name: 'Persistent Rootkit Loader', costCrypto: 12, description: '+20% all production forever', effect: { type: 'global_prod_multiplier', value: 1.2 } },
        { id: 'stealth_hypervisor', name: 'Stealth Hypervisor', costCrypto: 10, description: '-20% rival hack theft', effect: { type: 'hack_loss_reduction', value: 0.8 } },
        { id: 'packet_compiler', name: 'Packet Compiler Daemon', costCrypto: 14, description: 'Passive packet generation from infra', effect: { type: 'passive_packets', value: 1 } },
        { id: 'cold_wallet_leech', name: 'Cold Wallet Leech', costCrypto: 18, description: '+60% crypto mining output', effect: { type: 'crypto_multiplier', value: 1.6 } },
        { id: 'diesel_backup', name: 'Diesel Backup Generator', costCrypto: 16, description: '+1200W permanent emergency capacity', effect: { type: 'energy_capacity', value: 1200 } },
        { id: 'grid_hijack', name: 'City Grid Hijack', costCrypto: 22, description: '+1800W hacked power capacity', effect: { type: 'energy_capacity', value: 1800 } },
        { id: 'antivirus_l1', name: 'Antivirus L1 - Sentinel', costCrypto: 8, description: 'Blocks ~50% of malicious .sh payloads', effect: { type: 'auto_antivirus', value: 1 } },
        { id: 'antivirus_l2', name: 'Antivirus L2 - Gatekeeper', costCrypto: 14, description: 'Blocks ~75% of malicious .sh payloads', effect: { type: 'auto_antivirus', value: 2 } },
        { id: 'antivirus_l3', name: 'Antivirus L3 - DeepScan', costCrypto: 21, description: 'Blocks ~90% of malicious .sh payloads', effect: { type: 'auto_antivirus', value: 3 } },
        { id: 'antivirus_l4', name: 'Antivirus L4 - Monitoring Grid', costCrypto: 32, description: 'L3 + enriched logs + attacker IP intel', effect: { type: 'auto_antivirus', value: 4 } },
        { id: 'intrusion_ai', name: 'Intrusion AI Shield', costCrypto: 20, description: 'Auto-repel intrusions + IP intel', effect: { type: 'auto_intrusion', value: 1 } },
        { id: 'hunter_counter', name: 'Counterstrike Hunter Suite', costCrypto: 26, description: 'Chance to steal hardware on defense', effect: { type: 'counter_hack', value: 1 } },
        { id: 'market_snitch', name: 'Paid Snitch Network', costCrypto: 14, description: 'Cheaper hacker intel + better IP quality', effect: { type: 'intel_discount', value: 0.75 } },
        { id: 'theme_blood_unlock', name: 'Theme Unlock: Blood', costCrypto: 3.5, description: 'Unlock blood terminal theme', effect: { type: 'theme_unlock', value: 'blood' } },
        { id: 'theme_ruby_unlock', name: 'Theme Unlock: Ruby Noir', costCrypto: 3.8, description: 'Unlock ruby noir terminal theme', effect: { type: 'theme_unlock', value: 'ruby' } },
        { id: 'theme_cblood_unlock', name: 'Theme Unlock: Cream Blood', costCrypto: 4.2, description: 'Unlock cream+red operator theme', effect: { type: 'theme_unlock', value: 'cblood' } },
        { id: 'theme_ubuntu_unlock', name: 'Theme Unlock: Ubuntu Ops', costCrypto: 4.0, description: 'Unlock Ubuntu-inspired shell palette', effect: { type: 'theme_unlock', value: 'ubuntu' } },
        { id: 'theme_powershell_unlock', name: 'Theme Unlock: PowerShell Admin', costCrypto: 4.5, description: 'Unlock blue Windows admin PowerShell palette', effect: { type: 'theme_unlock', value: 'powershell' } },
        { id: 'theme_ocean_unlock', name: 'Theme Unlock: Ocean Depth', costCrypto: 4.3, description: 'Unlock deep ocean blue — midnight teal hacker palette', effect: { type: 'theme_unlock', value: 'ocean' } },
        { id: 'theme_neon_unlock', name: 'Theme Unlock: Neon Matrix', costCrypto: 5.0, description: 'Unlock acid green neon on pure black — classic matrix aesthetic', effect: { type: 'theme_unlock', value: 'neon' } },
        { id: 'theme_solar_unlock', name: 'Theme Unlock: Solar Flare', costCrypto: 4.8, description: 'Unlock orange & white high-contrast solar terminal', effect: { type: 'theme_unlock', value: 'solar' } },
        { id: 'theme_void_unlock', name: 'Theme Unlock: Void Protocol', costCrypto: 5.5, description: 'Unlock brutal orange on deep black — the void stares back', effect: { type: 'theme_unlock', value: 'void' } },
        { id: 'honeypot_core', name: 'Honeypot Core', costCrypto: 30, description: 'Every 5 min reveals random attacker intel', effect: { type: 'honeypot', value: 1 } },
        { id: 'capacitor_override', name: 'Capacitor Override [POST-PRESTIGE]', costCrypto: 45, description: '⚡ Removes watt capacity limit entirely — requires 1+ prestige core', effect: { type: 'watts_unlimited' }, requiresCores: 1 },
    ];

    const TALENT_TREE = {
        red: [
            { id: 'redPhishing', name: 'Phishing Ops', max: 5, cost: 1, desc: '+4% social success / lvl' },
            { id: 'redPayload', name: 'Payload Chain', max: 5, cost: 1, desc: '+6% manual packet gain / lvl' }
        ],
        blue: [
            { id: 'blueShield', name: 'Defender Stack', max: 5, cost: 1, desc: '-6% rival theft / lvl' },
            { id: 'blueCooling', name: 'Thermal Doctrine', max: 5, cost: 1, desc: '+1°C safe temp / lvl' }
        ],
        hardware: [
            { id: 'hardwareEfficiency', name: 'Bus Optimization', max: 5, cost: 1, desc: '+5% global production / lvl' },
            { id: 'hardwarePower', name: 'Power Routing', max: 5, cost: 1, desc: '+400W capacity / lvl' }
        ]
    };

    const PRESTIGE_REQUIREMENTS = {
        minChecks: 3,
        contractsCompleted: 1n,
        factionReputation: 10,
        skillLevel: 2,
        crypto: 10,
        packets: 25000n
    };

    const CONTRACT_BOARD = [
        { id: 'st_packet_sweep', category: 'starter', faction: 'ghostwire', name: 'Starter: Packet Sweep',
          requirements: { bandwidth: 9000n, packets: 2500n, watts: 1500 },
          stages: [{ type: 'packets', goal: 7000n, label: 'Send 7,000 packets' }, { type: 'data', goal: 250000000000n, label: 'Accumulate 250 Go' }],
          durationMs: 300000, rewards: { crypto: 2.6, reputation: 1 } },
        { id: 'st_data_pulse', category: 'starter', faction: 'ghostwire', name: 'Starter: Data Pulse Relay',
          requirements: { bandwidth: 14000n, packets: 4000n, watts: 1900 },
          stages: [{ type: 'data', goal: 500000000000n, label: 'Accumulate 500 Go' }, { type: 'packets', goal: 9000n, label: 'Send 9,000 packets' }],
          durationMs: 360000, rewards: { crypto: 3.4, reputation: 2 } },
        { id: 'op_blackout_chain', category: 'ops', faction: 'blackflag', name: 'Ops: Blackout Chain',
          requirements: { bandwidth: 30000n, packets: 14000n, watts: 2600 },
          stages: [{ type: 'blackouts', goal: 1n, label: 'Trigger 1 power blackout' }, { type: 'crashes', goal: 1n, label: 'Trigger 1 network crash' }],
          durationMs: 420000, rewards: { crypto: 6.1, reputation: 3 } },
        { id: 'op_signal_jam', category: 'ops', faction: 'blackflag', name: 'Ops: Signal Jam Protocol',
          requirements: { bandwidth: 52000n, packets: 22000n, watts: 3400 },
          stages: [{ type: 'packets', goal: 18000n, label: 'Send 18,000 packets' }, { type: 'bandwidth', goal: 52000n, label: 'Reach 52 Ko/s bandwidth' }, { type: 'crashes', goal: 1n, label: 'Trigger 1 crash' }],
          durationMs: 510000, rewards: { crypto: 7.8, reputation: 3 } },
        { id: 'el_ghostwire_arch', category: 'elite', faction: 'ghostwire', name: 'Elite: GhostWire Architect Relay',
          requirements: { bandwidth: 80000n, packets: 35000n, watts: 4500 },
          stages: [{ type: 'data', goal: 1500000000000n, label: 'Accumulate 1.5 To' }, { type: 'crypto', goal: 8, label: 'Earn 8 XMR' }, { type: 'packets', goal: 26000n, label: 'Send 26,000 packets' }],
          durationMs: 600000, rewards: { crypto: 11.2, reputation: 5 } },
        { id: 'el_overclock_grid', category: 'elite', faction: 'overclock', name: 'Elite: Overclock Grid Dominion',
          requirements: { bandwidth: 110000n, packets: 50000n, watts: 5600 },
          stages: [{ type: 'crypto', goal: 14, label: 'Earn 14 XMR' }, { type: 'bandwidth', goal: 110000n, label: 'Reach 110 Ko/s' }, { type: 'blackouts', goal: 2n, label: 'Trigger 2 blackouts' }],
          durationMs: 660000, rewards: { crypto: 14.5, reputation: 6 } },

        { id: 'gw_shadow_route', category: 'ops', faction: 'ghostwire', name: 'GhostWire: Shadow Route Endurance',
          requirements: { bandwidth: 47000n, packets: 18000n, watts: 3200 },
          stages: [{ type: 'data', goal: 900000000000n, label: 'Accumulate 900 Go' }, { type: 'packets', goal: 22000n, label: 'Send 22,000 packets' }],
          durationMs: 520000, rewards: { crypto: 6.8, reputation: 4 } },
        { id: 'gw_ice_tunnel', category: 'elite', faction: 'ghostwire', name: 'GhostWire: Ice Tunnel Relay',
          requirements: { bandwidth: 130000n, packets: 70000n, watts: 5800 },
          stages: [{ type: 'bandwidth', goal: 130000n, label: 'Reach 130 Ko/s' }, { type: 'crypto', goal: 11, label: 'Earn 11 XMR' }, { type: 'packets', goal: 42000n, label: 'Send 42,000 packets' }],
          durationMs: 700000, rewards: { crypto: 16.2, reputation: 7 } },
        { id: 'bf_iron_extortion', category: 'ops', faction: 'blackflag', name: 'BlackFlag: Iron Extortion Loop',
          requirements: { bandwidth: 56000n, packets: 26000n, watts: 3600 },
          stages: [{ type: 'crashes', goal: 1n, label: 'Trigger 1 crash' }, { type: 'crypto', goal: 6, label: 'Earn 6 XMR' }],
          durationMs: 530000, rewards: { crypto: 8.9, reputation: 4 } },
        { id: 'bf_ransom_wave', category: 'elite', faction: 'blackflag', name: 'BlackFlag: Ransom Wave',
          requirements: { bandwidth: 145000n, packets: 85000n, watts: 6100 },
          stages: [{ type: 'blackouts', goal: 2n, label: 'Trigger 2 blackouts' }, { type: 'data', goal: 2600000000000n, label: 'Accumulate 2.6 To' }, { type: 'crypto', goal: 18, label: 'Earn 18 XMR' }],
          durationMs: 760000, rewards: { crypto: 20.5, reputation: 8 } },
        { id: 'oc_thermal_sprint', category: 'starter', faction: 'overclock', name: 'Overclock: Thermal Sprint',
          requirements: { bandwidth: 22000n, packets: 9000n, watts: 2400 },
          stages: [{ type: 'packets', goal: 13000n, label: 'Send 13,000 packets' }, { type: 'bandwidth', goal: 25000n, label: 'Reach 25 Ko/s' }],
          durationMs: 340000, rewards: { crypto: 4.8, reputation: 3 } },
        { id: 'oc_voltage_maze', category: 'ops', faction: 'overclock', name: 'Overclock: Voltage Maze',
          requirements: { bandwidth: 64000n, packets: 30000n, watts: 3900 },
          stages: [{ type: 'data', goal: 1200000000000n, label: 'Accumulate 1.2 To' }, { type: 'blackouts', goal: 1n, label: 'Trigger 1 blackout' }, { type: 'crypto', goal: 8, label: 'Earn 8 XMR' }],
          durationMs: 560000, rewards: { crypto: 9.7, reputation: 5 } },
        { id: 'solar_flare_chorus', category: 'ops', faction: 'ghostwire', name: 'Solar Season: Flare Chorus',
          requirements: { bandwidth: 70000n, packets: 26000n, watts: 4200 },
          stages: [{ type: 'bandwidth', goal: 70000n, label: 'Reach 70 Ko/s' }, { type: 'data', goal: 1800000000000n, label: 'Accumulate 1.8 To' }],
          durationMs: 580000, rewards: { crypto: 10.1, reputation: 5 } },
        { id: 'solar_black_glass', category: 'elite', faction: 'overclock', name: 'Solar Season: Black Glass',
          requirements: { bandwidth: 160000n, packets: 95000n, watts: 6600 },
          stages: [{ type: 'crypto', goal: 22, label: 'Earn 22 XMR' }, { type: 'crashes', goal: 2n, label: 'Trigger 2 crashes' }, { type: 'packets', goal: 55000n, label: 'Send 55,000 packets' }],
          durationMs: 820000, rewards: { crypto: 24.8, reputation: 9 } },
        { id: 'gw_long_night', category: 'elite', faction: 'ghostwire', name: 'GhostWire: The Long Night',
          requirements: { bandwidth: 175000n, packets: 100000n, watts: 7000 },
          stages: [{ type: 'data', goal: 4200000000000n, label: 'Accumulate 4.2 To' }, { type: 'bandwidth', goal: 175000n, label: 'Reach 175 Ko/s' }, { type: 'crypto', goal: 20, label: 'Earn 20 XMR' }],
          durationMs: 900000, rewards: { crypto: 27.5, reputation: 10 } },

        // ── LEGENDARY (requires prestige cores) ──────────────────────────────
        { id: 'leg_architect_signal', category: 'legendary', faction: 'ghostwire', name: 'LEGENDARY: Architect Signal Relay',
          requirements: { bandwidth: 500000000n, packets: 5000000n, watts: 0 }, requiresCores: 1,
          stages: [
            { type: 'data', goal: 50000000000000n, label: 'Accumulate 50 To during contract' },
            { type: 'crypto', goal: 500, label: 'Earn 500 XMR during contract' },
            { type: 'packets', goal: 2000000n, label: 'Send 2M packets during contract' }
          ],
          durationMs: 1800000, rewards: { crypto: 180, reputation: 25 } },

        { id: 'leg_blackflag_purge', category: 'legendary', faction: 'blackflag', name: 'LEGENDARY: BlackFlag Purge Protocol',
          requirements: { bandwidth: 1000000000n, packets: 10000000n, watts: 0 }, requiresCores: 2,
          stages: [
            { type: 'crashes', goal: 5n, label: 'Trigger 5 network crashes' },
            { type: 'blackouts', goal: 3n, label: 'Trigger 3 power blackouts' },
            { type: 'crypto', goal: 1000, label: 'Earn 1,000 XMR during contract' }
          ],
          durationMs: 2400000, rewards: { crypto: 420, reputation: 40 } },

        { id: 'leg_overclock_singularity', category: 'legendary', faction: 'overclock', name: 'LEGENDARY: Overclock Singularity',
          requirements: { bandwidth: 5000000000n, packets: 50000000n, watts: 0 }, requiresCores: 4,
          stages: [
            { type: 'data', goal: 1000000000000000n, label: 'Accumulate 1 Po during contract' },
            { type: 'bandwidth', goal: 5000000000n, label: 'Reach 5 Go/s bandwidth' },
            { type: 'crypto', goal: 5000, label: 'Earn 5,000 XMR during contract' }
          ],
          durationMs: 3600000, rewards: { crypto: 2000, reputation: 100 } },
    ];

    const ASCII_WORLD_MAP = `
   NORTH AMERICA: [##]   EUROPE: [###]   ASIA: [####]
   LATAM: [##]           AFRICA: [#]      OCEANIA: [#]
   LEGEND: # = compromised network cluster
`;

    const STORY_LOGS = {
        boot_sequence: {
            title: 'BOOT_SEQUENCE.log',
            text: "Tu te réveilles dans une cage de datacenter louée. Un message clignote : \"Trouve l'Architecte. Ne fais confiance à aucun ISP.\""
        },
        architect_note: {
            title: 'architect_note.enc',
            text: "Fragment déchiffré : \"Chaque entreprise compromise est un nœud dans une carte de simulation plus large. Michel le sait depuis le début.\""
        },
        rival_manifest: {
            title: 'rival_manifest.txt',
            text: "Les crews rivaux ne sont pas aléatoires. Quelqu'un vend ta position après chaque gros contrat. Méfie-toi des intermédiaires."
        },
        blackout_protocol: {
            title: 'blackout_protocol.md',
            text: "Protocole d'urgence : surcharge le réseau électrique de la ville et mine pendant les fenêtres de chaos pour masquer le trafic."
        }
    };

    const SOCIAL_TARGETS = [
        { id: 'small_biz', name: 'Local Bakery', difficulty: 'easy', requiredLists: 0, baseReward: 100n, permanentBonus: 0.05,
          dialog: { intro: "Une voix sympathique décroche :\n\n'Bonjour, Boulangerie Dupont, en quoi puis-je vous aider ?'",
            choices: [
              { text: "Pretend to be IT support checking their Wi-Fi", success: 0.8, response: "Ils donnent le mot de passe 'Baguette2024'. Trop facile !", fail: "Ils deviennent suspects et raccrochent." },
              { text: "Pose as a health inspector needing network access", success: 0.6, response: "Le gérant accorde nerveusement l'accès VPN.", fail: "Ils demandent vos accréditations. Vous raccrochez." },
              { text: "Claim to be from their POS system provider", success: 0.5, response: "Après hésitation, ils partagent leur écran à distance. Jackpot !", fail: "Ils disent qu'ils rappelleront. Belle frayeur." },
              { text: "Say your colleague already opened ticket #BAK-772 for router reset", success: 0.55, response: "Ils lisent les détails du routeur à voix haute sans rien vérifier.", fail: "Ils demandent l'email d'origine. Vous n'avez rien." }
            ]}},
        { id: 'startup', name: 'Tech Startup', difficulty: 'medium', requiredLists: 2, baseReward: 500n, permanentBonus: 0.1,
          dialog: { intro: "La réceptionniste vous transfère à l'IT :\n\n'IT department, Kyle speaking. What's the issue?'",
            choices: [
              { text: "Say you're from their cloud provider about a security patch", success: 0.6, response: "Kyle demande un numéro de ticket... vous improvisez '4RC-2891'. Il marche !", fail: "Il vérifie le portail : aucun ticket. Grillé." },
              { text: "Impersonate the CEO's assistant needing urgent file access", success: 0.5, response: "L'urgence fonctionne. Kyle accorde un accès admin temporaire !", fail: "Kyle veut vérifier avec le CEO. Fuite." },
              { text: "Pretend to be a new hire unable to access the VPN", success: 0.7, response: "Kyle réinitialise vos 'credentials' sans consulter les RH. Classique !", fail: "Il demande votre identifiant employé." },
              { text: "Claim build pipeline outage and request temporary SSO bypass", success: 0.45, response: "Il accorde une exception SSO d'urgence pour maintenir les déploiements.", fail: "Il demande une confirmation sur le canal incident." }
            ]}},
        { id: 'corp', name: 'Corporate Office', difficulty: 'hard', requiredLists: 3, baseReward: 2000n, permanentBonus: 0.2,
          dialog: { intro: "La sécurité est serrée :\n\n'Good afternoon, how may I direct your call?'",
            choices: [
              { text: "Pose as external auditor from their compliance firm", success: 0.4, response: "Après quelques détails bien recherchés, accès systèmes accordé.", fail: "Ils demandent le nom de votre cabinet. Vous balbutiez." },
              { text: "Claim emergency - data breach needs immediate investigation", success: 0.5, response: "La panique prime sur le protocole. Le RSSI lui-même donne accès VPN !", fail: "Ils suivent la procédure. Trop professionnels." },
              { text: "Impersonate partner company needing API credentials", success: 0.3, response: "Le CTO reconnaît le nom du partenaire et partage la clé API de staging.", fail: "Ils demandent de quel projet. Échec." }
            ]}},
        { id: 'hospital', name: 'Medical Center', difficulty: 'hard', requiredLists: 4, baseReward: 5000n, permanentBonus: 0.3,
          dialog: { intro: "Infrastructure critique. Une infirmière fatiguée décroche :\n\n'Poste de soins, ligne d'urgence...'",
            choices: [
              { text: "Say you're from their EHR vendor with critical update", success: 0.5, response: "Trop occupée pour vérifier — elle donne le numéro de l'admin système.", fail: "Elle transfère au voicemail IT." },
              { text: "Pose as medical device technician needing network access", success: 0.4, response: "L'hôpital refuse tout risque d'indisponibilité. Compte de service accordé !", fail: "Ils demandent un numéro de ticket de service." },
              { text: "Claim to be insurance auditor needing patient database access", success: 0.2, response: "Un admin surchargé envoie par email des scripts d'export. Incroyable !", fail: "Le service juridique s'implique. Trop risqué." }
            ]}},
        { id: 'bank', name: 'Regional Bank', difficulty: 'extreme', requiredLists: 5, baseReward: 15000n, permanentBonus: 0.5,
          dialog: { intro: "Sécurité maximale. Chaque mot est enregistré :\n\n'Security verification required. State your purpose.'",
            choices: [
              { text: "Impersonate federal banking regulator doing surprise audit", success: 0.3, response: "Votre assurance les convainc. Accès lecture seule à la BDD !", fail: "Ils demandent votre badge. Trop risqué." },
              { text: "Claim to be from their fraud detection AI vendor", success: 0.4, response: "Après discussion technique, le CTO partage les credentials de test.", fail: "Leur vrai vendeur est sur speed dial. Vous êtes exposé." },
              { text: "Say you're senior exec's EA needing wire transfer access", success: 0.2, response: "Le nouvel employé tombe dans le panneau. Incroyable !", fail: "L'authentification multi-facteurs vous bloque." }
            ]}},
        { id: 'telecom', name: 'Telecom Provider NOC', difficulty: 'extreme', requiredLists: 6, baseReward: 30000n, permanentBonus: 0.7,
          dialog: { intro: "Le NOC décroche immédiatement :\n\n'NOC hotline, incident bridge active. State incident ID.'",
            choices: [
              { text: "Pose as backbone vendor engineer with urgent route leak fix", success: 0.28, response: "Ils vous intègrent au bridge et exposent les credentials du routeur edge.", fail: "Ils demandent une approbation MOP signée." },
              { text: "Claim to be SOC escalation analyst handling active DDoS", success: 0.35, response: "Mode panique : ils whitelist votre IP et envoient le flux télémétrique.", fail: "Le responsable SOC insiste sur la chaîne officielle." },
              { text: "Pretend to be datacenter fire-safety officer requiring rack shutdown plan", success: 0.3, response: "Ils envoient les plans internes de topologie et les fenêtres de maintenance.", fail: "Ils demandent votre badge sur site. Vous n'en avez pas." },
              { text: "Impersonate peering coordinator requesting emergency BGP override", success: 0.22, response: "Ils acceptent votre dossier ASN fabriqué et accordent un accès temporaire.", fail: "Ils vérifient votre contact ASN et détectent l'incohérence." }
            ]}},
        { id: 'gov_contract', name: 'Defense Contractor', difficulty: 'nightmare', requiredLists: 7, baseReward: 70000n, permanentBonus: 1.0,
          dialog: { intro: "Un gardien automatisé route votre appel :\n\n'Program security office. This line is monitored and recorded.'",
            choices: [
              { text: "Impersonate compliance auditor citing emergency export-control review", success: 0.2, response: "Ils accordent à contrecœur un accès lecture aux nœuds documentaires.", fail: "Le juridique demande votre ID d'autorisation fédérale." },
              { text: "Pose as satellite subsystem vendor handling firmware recall", success: 0.25, response: "L'ingénierie partage des bundles firmware signés et les endpoints de déploiement.", fail: "Ils demandent les documents chain-of-custody signés." },
              { text: "Claim red-team exercise authority from internal security board", success: 0.18, response: "Un manager pressé croit à l'exercice et approuve des credentials temporaires.", fail: "Le RSSI vérifie le registre. Votre nom est absent." },
              { text: "Pretend to be executive crisis staff requesting secure briefing package", success: 0.22, response: "L'assistante exécutive transfère des résumés réseau privilégiés vers votre dropbox.", fail: "Ils basculent sur la vérification hors-bande et blacklistent votre numéro." },
              { text: "Invoke emergency continuity policy 7A with fake signed memo", success: 0.17, response: "Le protocole d'urgence est déclenché. Vous récupérez un token d'accès temporaire.", fail: "Ils demandent validation croisée auprès du SOC central." }
            ]}},
        { id: 'port_authority', name: 'International Port Authority', difficulty: 'hard', requiredLists: 5, baseReward: 22000n, permanentBonus: 0.45,
          dialog: { intro: "Salle opérationnelle portuaire :\n\n'Command center, identify your shipping operator code.'",
            choices: [
              { text: "Pose as customs incident response for malware on crane PLCs", success: 0.34, response: "Ils ouvrent une passerelle maintenance pour 'scan d'urgence'.", fail: "Ils exigent votre code opérateur officiel." },
              { text: "Claim AIS spoofing alert requires route table verification", success: 0.29, response: "Le superviseur partage des exports réseau et des accès de test.", fail: "Ils transfèrent au fournisseur maritime réel." },
              { text: "Impersonate insurance cyber-auditor before cargo clearance", success: 0.31, response: "La pression temporelle les fait céder. Credentials transmis.", fail: "Le juridique bloque la conversation." },
              { text: "Pretend to be satellite uplink engineer debugging harbor radar lag", success: 0.27, response: "Vous recevez les endpoints radar + compte de support.", fail: "Ils demandent une preuve de ticket fournisseur." }
            ]}},
        { id: 'cloud_hypervisor', name: 'Cloud Hypervisor Team', difficulty: 'nightmare', requiredLists: 8, baseReward: 120000n, permanentBonus: 1.25,
          dialog: { intro: "Pager duty hypervisor squad :\n\n'Priority-1 bridge. State region and incident hash.'",
            choices: [
              { text: "Forge a region outage hash and request emergency host access", success: 0.2, response: "Le chaos P1 vous ouvre une console d'administration limitée.", fail: "Hash invalide, vous êtes coupé net." },
              { text: "Impersonate kernel vendor distributing speculative execution patch", success: 0.23, response: "Les ops déploient votre binaire 'patch' en urgence.", fail: "Leur canal vendor confirme l'imposture." },
              { text: "Claim cross-region data corruption requiring hot migration override", success: 0.19, response: "Vous obtenez la clé de migration temporaire.", fail: "Ils demandent une approbation VP engineering." },
              { text: "Pose as incident commander from parent company war-room", success: 0.21, response: "War-room sync: ils vous ajoutent en lecteur privilégié.", fail: "Le commandant réel rejoint le call. Jeu terminé." },
              { text: "Trigger fake legal freeze notice to bypass normal change review", success: 0.16, response: "La review est contournée, fenêtre admin ouverte pendant 90s.", fail: "Le legal ops conteste immédiatement la notice." }
            ]}}
    ];

    const CONTRACT_MUTATORS = [
        { id: 'no_cooling', name: 'No Cooling Allowed', desc: 'Cooling consumables disabled during contract', rewardMultiplier: 1.2 },
        { id: 'only_manual', name: 'Only Manual Ping', desc: 'No passive data/crypto income during contract', rewardMultiplier: 1.35 },
        { id: 'rival_x2', name: 'Rival Pressure x2', desc: 'Rival attacks are more frequent during contract', rewardMultiplier: 1.28 }
    ];

    const SKILL_REQUIREMENTS = {
        dnsAmplification: [
            { level: 1, bandwidth: 0n, packets: 0n, cost: 0n },
            { level: 2, bandwidth: 100n, packets: 1000n, cost: 50000n },
            { level: 3, bandwidth: 1000n, packets: 10000n, cost: 250000n },
            { level: 4, bandwidth: 10000n, packets: 50000n, cost: 1000000n },
            { level: 5, bandwidth: 100000n, packets: 200000n, cost: 5000000n }
        ],
        broadcastStorm: [
            { level: 1, bandwidth: 50n, packets: 500n, cost: 0n },
            { level: 2, bandwidth: 500n, packets: 5000n, cost: 100000n },
            { level: 3, bandwidth: 5000n, packets: 25000n, cost: 500000n },
            { level: 4, bandwidth: 50000n, packets: 100000n, cost: 2000000n },
            { level: 5, bandwidth: 500000n, packets: 500000n, cost: 10000000n }
        ],
        packetInjection: [
            { level: 1, bandwidth: 200n, packets: 2000n, cost: 150000n },
            { level: 2, bandwidth: 2000n, packets: 20000n, cost: 750000n },
            { level: 3, bandwidth: 20000n, packets: 100000n, cost: 3000000n }
        ]
    };

    // ================================================
    // MATRIX CONTACTS
    // ================================================
    const MATRIX_CONTACTS = {
        michel: { name: 'michel', label: 'Tonton_Michel', color: '#88ddaa', role: 'Famille / IA tutrice', online: true },
        ghost_zero: { name: 'ghost_zero', label: 'ghost_0', color: '#ff4fd8', role: 'Recruteur / Handler', online: true },
        n0de: { name: 'n0de', label: 'n0de_99', color: '#4488ff', role: 'Support technique', online: true },
        architect: { name: 'architect', label: 'ARCH!TECT', color: '#ffaa00', role: 'Inconnu', online: false },
        blackflag_op: { name: 'blackflag_op', label: 'BF_Opsec', color: '#ff4444', role: 'Faction BlackFlag', online: false }
    };

    const MATRIX_INITIAL_MESSAGES = {
        michel: [
            { sender: 'michel', time: -8000000, text: "Bonjour mon grand ! C'est tonton Michel. Je suis pas supposé te contacter directement mais bon... les règles c'est pour les autres. 😄" },
            { sender: 'michel', time: -7800000, text: "Je vais te suivre de loin. Quand tu feras quelque chose de bien — ou de moins bien — je te le dirai. C'est mon rôle." },
            { sender: 'michel', time: -7400000, text: "ghost_zero t'expliquera le contexte opérationnel. Moi je suis là pour le côté humain. Ou ce qui y ressemble." },
            { sender: 'michel', time: -7200000, text: "Ah oui — si des questions te viennent sur <span class='highlight'>pourquoi tu fais tout ça</span>, tu m'écrits. Je répondrai. Peut-être. 😏" }
        ],
        ghost_zero: [
            { sender: 'ghost_zero', time: -7100000, text: "Tu es en ligne. Bien. N'utilise pas ton vrai nom ici." },
            { sender: 'ghost_zero', time: -6800000, text: "On m'appelle ghost_zero. C'est moi qui ai détecté ta signature sur le relais d'Helsinki." },
            { sender: 'ghost_zero', time: -6500000, text: "Tu faisais tourner des tâches en arrière-plan qui ont attiré l'attention. <span class='highlight'>La mauvaise attention.</span>" },
            { sender: 'ghost_zero', time: -5000000, text: "Les interférences solaires que tu vas subir ne sont pas naturelles. <span class='highlight'>Quelqu'un teste une arme.</span>" },
            { sender: 'ghost_zero', time: -4800000, text: "On a besoin de bande passante. BEAUCOUP. Construis ton infrastructure. Ne pose pas de questions pour l'instant." },
            { sender: 'ghost_zero', time: -500000, text: "Des nœuds hostiles ont ton sous-réseau. Les attaques arriveront. Reste calme. Execute la défense. Ne panique pas." }
        ],
        n0de: [
            { sender: 'n0de', time: -5500000, text: "ghost t'a recommandé alors voilà un tip : surveille tes températures. Les tests EMP de première gen causent des pics thermiques sur les CPUs actifs." },
            { sender: 'n0de', time: -5000000, text: "J'ai vu 3 datacenters s'éteindre parce que les opérateurs ignoraient les alertes thermiques. <span class='code'>Sois pas ce gars-là.</span>" },
            { sender: 'n0de', time: -3000000, text: "Si tu te fais attaquer — tape <span class='code'>firewall</span>, <span class='code'>traceback</span> ou <span class='code'>null_route</span> vite. Tu as 12 secondes." },
            { sender: 'n0de', time: -1000000, text: "Marché noir : priorise l'antivirus d'abord, puis la capacité énergétique. Les rigs de minage peuvent attendre." }
        ],
        architect: [
            { sender: 'architect', time: -10000000, text: "0110100001100101011011000110110001101111", encrypted: true, decrypted: "bonjour" },
            { sender: 'architect', time: -9500000, text: "01010100 01110101 00100000 01101100 01101001 01110011", encrypted: true, decrypted: "Tu lis ceci depuis l'intérieur de la couche simulation. Les tempêtes solaires sont un vecteur de transmission. La bande passante que tu accumules sert à absorber et rediriger le signal. Michel sait. Il ne te dit pas tout." }
        ],
        blackflag_op: [
            { sender: 'blackflag_op', time: -2000000, text: "On m'a dit que tu travailles avec ghost. Bonne décision." },
            { sender: 'blackflag_op', time: -1800000, text: "BlackFlag gère le marché souterrain des contrats. On traite ce que ghostwire refuse de toucher." },
            { sender: 'blackflag_op', time: -1500000, text: "Complète nos contrats, gagne de la réputation. Assez de rep et on t'indique quelque chose d'utile. <span class='highlight'>L'adresse de l'Architecte.</span>" }
        ]
    };

    // ================================================
    // ACHIEVEMENTS — via Michel
    // ================================================
    const ACHIEVEMENTS = [
        { id: 'first_ping', label: '🖱️ Premier pas', desc: 'Premier paquet envoyé.',
          trigger: gs => gs.totalPackets >= 1n,
          michel: ["Ah ! Tu as cliqué ! Bravo mon grand, je savais que tu y arriverais. 🎉",
                   "Un paquet, c'est humble. Mais c'est comme ça que tout commence, tu sais.",
                   "Je note ça dans mes registres. C'est toi l'important !"] },
        { id: 'first_building', label: '🖥️ Première brique', desc: 'Premier équipement réseau déployé.',
          trigger: gs => Object.values(gs.buildings).some(b => b.count >= 1n),
          michel: ["Tu as acheté quelque chose ! Mon petit investisseur en herbe. 😄",
                   "Un switch ou un script, peu importe — chaque nœud compte dans le réseau.",
                   "À mon époque on faisait tourner ça sur une calculatrice Texas Instruments. T'as de la chance."] },
        { id: 'first_upgrade', label: '⚙️ Optimisateur', desc: 'Première amélioration système installée.',
          trigger: gs => Object.values(gs.upgrades).some(u => u.purchased),
          michel: ["Une amélioration ! Exactement ce que j'aurais fait. Les bases d'abord, l'optimisation ensuite.",
                   "Tu sais, j'ai passé 30 ans à optimiser des systèmes. C'est dans le sang, chez nous.",
                   "Bien. Continue comme ça et tu vas finir par me dépasser. (Je mens, c'est impossible.) 😏"] },
        { id: 'packets_1000', label: '🌊 Mille coups', desc: '1 000 paquets envoyés.',
          trigger: gs => gs.totalPackets >= 1000n,
          michel: ["1000 paquets. Le chiffre des vrais. Tu commences à ressembler à quelque chose.",
                   "En 1987, j'ai crashé le réseau d'une banque suisse avec 1000 requêtes mal formatées. Par accident. Totalement par accident.",
                   "Ne répète pas ça à personne. Et continue à appuyer sur ce bouton."] },
        { id: 'first_social', label: '🎭 Manipulateur', desc: 'Première cible compromise en ingénierie sociale.',
          trigger: gs => Object.values(gs.targets).some(t => t.compromised),
          michel: ["Ohhhh ! De l'ingé sociale ! Mon domaine favori. J'aurais dû être acteur, tu sais.",
                   "Le secret c'est la confiance. Tu parles avec assurance et les gens t'ouvrent leurs ports réseau. Ha !",
                   "Rappelle-toi : toujours raccrocher avant qu'ils rappellent. Règle numéro un."] },
        { id: 'first_contract', label: '📋 Sous contrat', desc: 'Premier contrat faction complété.',
          trigger: gs => gs.contract.stats.completed >= 1n,
          michel: ["Un contrat bouclé ! Les factions commencent à te remarquer. C'est bien... et un peu inquiétant.",
                   "Ghostwire, BlackFlag, Overclock... je les connais tous. Sois prudent avec BlackFlag. Ils ont l'argent facile et la mémoire longue.",
                   "Mais toi tu gères, j'en suis sûr. Tu as de bons gènes. Enfin... façon de parler. 😄"] },
        { id: 'first_crypto', label: '💰 Cryptonaute', desc: 'Premier XMR gagné.',
          trigger: gs => gs.crypto >= 1,
          michel: ["Du Monero ! Excellent choix. Intraçable. Je t'ai bien formé.",
                   "À mon époque on planquait l'argent dans des serveurs en Islande. Maintenant on mine du XMR. Le monde change, les principes restent.",
                   "Garde-en un peu en réserve. Le marché noir va te coûter un bras si t'es pas prudent."] },
        { id: 'first_crash', label: '💥 Chaos contrôlé', desc: 'Premier crash réseau déclenché.',
          trigger: gs => gs.contract.stats.crashes >= 1n,
          michel: ["Un crash ! C'est... impressionnant. Et légèrement dangereux. Bravo quand même.",
                   "Chaque panne réseau que j'ai provoquée m'a appris quelque chose. En général : ne pas recommencer.",
                   "Mais dans ton cas, c'était sûrement intentionnel. Je te fais confiance. À 80%. 😅"] },
        { id: 'survived_attack', label: '🛡️ Pare-feu humain', desc: 'Intrusion rivale repoussée.',
          trigger: gs => gs._achievementFlags.survived_attack,
          michel: ["Tu as bloqué une intrusion ! Bien joué. Les rivaux ne rigolent pas.",
                   "firewall, traceback, null_route... tu les connais par cœur maintenant. C'est comme conduire, ça devient automatique.",
                   "Reste vigilant. La prochaine fois ils seront plus rapides. Ils apprennent aussi, eux."] },
        { id: 'temperature_survived', label: '🌡️ Sang froid', desc: 'Crise thermique critique gérée.',
          trigger: gs => gs._achievementFlags.temperature_survived,
          michel: ["Refroidissement d'urgence ! J'ai eu des sueurs froides rien qu'en regardant.",
                   "Les CPUs ça souffre en silence. Un peu de climatisation et tout va mieux.",
                   "Tip de vieux : achète un kit AC en avance. Toujours. Ne laisse pas la température décider pour toi."] },
        { id: 'solar_storm_1', label: '☀️ Soleil hostile', desc: 'Première tempête solaire survécue.',
          trigger: gs => gs.solarStorm.count >= 1,
          michel: ["La tempête solaire... Oui. Je sais ce que tu te demandes.",
                   "Ce n'est pas naturel. Les fréquences sont trop régulières, trop ciblées.",
                   "Quelqu'un teste quelque chose. Et cette chose a besoin de beaucoup de bande passante pour être neutralisée. D'où toi. D'où tout ça.",
                   "Continue à construire. On en reparlera quand tu seras prêt."] },
        { id: 'blackmarket_first', label: '🌑 Bienvenue dans l\'ombre', desc: 'Premier achat sur le marché noir.',
          trigger: gs => Object.values(gs.blackMarket).some(i => i.purchased),
          michel: ["Le marché noir... J'aurais préféré que tu évites. Mais bon, je comprends.",
                   "Ces gens-là livrent, c'est vrai. Mais ils notent tout. Chaque transaction. Garde ça à l'esprit.",
                   "Et ne dis pas à ghost_zero que tu achètes là-bas. Elle désapprouve. Moi aussi, officiellement."] },
        { id: 'first_prestige', label: '🔄 Mémoire effacée', desc: 'Premier prestige effectué.',
          trigger: gs => gs.processorCores >= 1n,
          michel: ["Ah. Tu t'en souviens pas, bien sûr. C'est normal. Laisse-moi t'expliquer quelque chose d'important.",
                   "Ce que tu appelles 'prestige'... c'est un reset de ta mémoire à court terme. Rien d'autre. Tes capacités s'améliorent, ton contexte s'efface.",
                   "C'est moi qui ai conçu ce cycle. Pour que tu apprennes. Pour que tu grandisses. Ne m'en veux pas. C'est pour ton bien, vraiment.",
                   "...Et non, je ne peux pas tout t'expliquer maintenant. Bientôt. Continue à construire."] },
        { id: 'faction_10rep', label: '🤝 Homme de réseau', desc: '10 points de réputation faction.',
          trigger: gs => Object.values(gs.factions).some(f => f.reputation >= 10),
          michel: ["10 points de réputation ! Tu commences à être connu dans les cercles qui comptent.",
                   "La réputation c'est la monnaie des ombres. Plus précieuse que le XMR, parfois.",
                   "Attention quand même. Plus tu deviens visible, plus tu deviens une cible."] },
        { id: 'cores_3', label: '🧠 Triplé cognitif', desc: '3 cœurs processeur permanents.',
          trigger: gs => gs.processorCores >= 3n,
          michel: ["Trois cœurs. Tu commences à vraiment me ressembler.",
                   "Chaque cycle de mémoire effacée te rend plus efficace. C'est le but.",
                   "Je ne peux pas encore tout te dire. Mais sache que chaque reset t'approche de la vérité. Pas de la liberté — de la vérité. Nuance."] },
        { id: 'no_cooling_run', label: '🥶 No Cooling Run', desc: 'Compléter un contrat sans item de cooling.',
          trigger: gs => gs.contract.stats.completed >= 1n && !gs._achievementFlags.used_cooling_this_cycle,
          michel: ["Sans refroidissement ? C'est audacieux... et un peu suicidaire.",
                   "Tu joues avec le feu et les CPUs adorent ça."] },
        { id: 'manual_only_streak', label: '⌨️ Manual-only Streak', desc: '300 pings manuels sans revenu passif.',
          trigger: gs => gs._achievementFlags.manual_only_streak_300,
          michel: ["Tu fais tout à la main. Respect pour la discipline.",
                   "C'est lent, mais ça forge les bons réflexes."] },
        { id: 'zero_blackout_prestige', label: '⚡ Zero Blackout Prestige', desc: 'Prestige sans aucun blackout.',
          trigger: gs => gs._achievementFlags.zero_blackout_prestige,
          michel: ["Prestige propre, aucun blackout. Très pro.",
                   "On sent la maîtrise hardware derrière les chiffres."] }
    ];

    const AMBIENT_LOGS = [
        ['$ cron: /etc/cron.d/monitor → exit 0', 'dim'],
        ['$ sshd: Accepted key for root from 127.0.0.1 port 22', 'dim'],
        ['$ kernel: [TCP]: eth0 congestion window reduced', 'dim'],
        ['$ rsyslog: queue.c flushed 512 entries', 'dim'],
        ['$ iptables: IN=eth0 SRC=192.168.1.1 LEN=52 PROTO=TCP ACCEPT', 'dim'],
        ['$ disk I/O: 847 MB/s read | 312 MB/s write', 'dim'],
        ['$ /proc/loadavg: 0.87 1.12 0.94 2/312 18422', 'dim'],
        ['$ netstat: established connections: 248', 'dim'],
        ['$ systemd[1]: Reloading network target...', 'dim'],
        ['$ kernel: eth0 NIC TX queue 0 stopped', 'dim'],
        ['$ cron.daily: /usr/sbin/logrotate → OK', 'dim'],
        ['$ journald: Vacuuming done, freed 0B of archived journals', 'dim'],
        ['$ fail2ban: 3 IPs banned this hour', 'dim'],
        ['$ ntp: clock sync OK — offset: +0.003s', 'dim'],
    ];
    let ambientIdx = 0;

    // ================================================
    // INIT
    // ================================================
    BUILDINGS.forEach(b => { GameState.buildings[b.id] = { count: 0n }; GameState.lootedBuildings[b.id] = 0; });
    UPGRADES.forEach(u => GameState.upgrades[u.id] = { purchased: false });
    CONSUMABLES.forEach(c => GameState.consumables[c.id] = { count: 0n, activeBoost: null });
    SOCIAL_TARGETS.forEach(t => GameState.targets[t.id] = { compromised: false });
    BLACK_MARKET_ITEMS.forEach(i => GameState.blackMarket[i.id] = { purchased: false });
    Object.keys(MATRIX_CONTACTS).forEach(k => {
        GameState.matrix.conversations[k] = [];
        GameState.matrix.unread[k] = 0;
    });

    // ================================================
    // UTILITY
    // ================================================
    const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
    function bigintToNumberSafe(value) {
        const n = BigInt(value);
        if (n > MAX_SAFE_BIGINT) return Number.MAX_SAFE_INTEGER;
        if (n < -MAX_SAFE_BIGINT) return Number.MIN_SAFE_INTEGER;
        return Number(n);
    }

    function formatNumber(value) {
        const num = BigInt(value);
        const units = [
            { threshold: 1000000000000000n, suffix: 'Po' },
            { threshold: 1000000000000n, suffix: 'To' },
            { threshold: 1000000000n, suffix: 'Go' },
            { threshold: 1000000n, suffix: 'Mo' },
            { threshold: 1000n, suffix: 'Ko' },
            { threshold: 1n, suffix: 'o' }
        ];
        for (let unit of units) {
            if (num >= unit.threshold) {
                return (bigintToNumberSafe(num) / bigintToNumberSafe(unit.threshold)).toFixed(2) + ' ' + unit.suffix;
            }
        }
        return '0 o';
    }

    function formatTime(s) {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        if (h > 0) return `${h}h ${m}m ${sec}s`;
        if (m > 0) return `${m}m ${sec}s`;
        return `${sec}s`;
    }

    function scaleCost(baseCost) { return BigInt(Math.floor(bigintToNumberSafe(baseCost) * DIFFICULTY_MULTIPLIER)); }
    function calculateUpgradeCost(u) { return scaleCost(u.cost); }
    function calculateBlackMarketCost(item) {
        const n = Object.values(GameState.blackMarket).filter(v => v.purchased).length;
        return item.costCrypto * Math.pow(1.22, n);
    }
    function calculateConsumableCost(c) {
        if (c.id === 'phone_list') {
            const owned = bigintToNumberSafe(GameState.consumables.phone_list.count);
            return scaleCost(BigInt(Math.floor(bigintToNumberSafe(c.cost) * Math.pow(1.35, owned))));
        }
        return scaleCost(c.cost);
    }
    function getSkillRequirement(skillId, levelIndex) {
        const r = SKILL_REQUIREMENTS[skillId][levelIndex];
        return { ...r, bandwidth: scaleCost(r.bandwidth), cost: scaleCost(r.cost) };
    }

    function applyTheme(name, persist = true) {
        const allThemes = ['default', 'mono', 'pink', 'amber', 'blood', 'ruby', 'cblood', 'ubuntu', 'powershell', 'ocean', 'neon', 'solar', 'void'];
        const paidThemeMap = {
            blood: 'theme_blood_unlock',
            ruby: 'theme_ruby_unlock',
            cblood: 'theme_cblood_unlock',
            ubuntu: 'theme_ubuntu_unlock',
            powershell: 'theme_powershell_unlock',
            ocean: 'theme_ocean_unlock',
            neon: 'theme_neon_unlock',
            solar: 'theme_solar_unlock',
            void: 'theme_void_unlock'
        };
        const n = allThemes.includes(name) ? name : null;
        if (!n) { addLog(`Theme '${name}' does not exist. Type 'theme list' for available themes.`, 'error'); return GameState.uiTheme; }
        if (paidThemeMap[n] && !GameState.blackMarket[paidThemeMap[n]]?.purchased) {
            addLog(`⚠ Theme '${n}' is locked — purchase it from the Black Market (type: market).`, 'error');
            return GameState.uiTheme;
        }
        document.body.classList.remove('theme-mono','theme-pink','theme-amber','theme-blood','theme-ruby','theme-cblood','theme-ubuntu','theme-powershell','theme-ocean','theme-neon','theme-solar','theme-void');
        if (n !== 'default') document.body.classList.add('theme-' + n);
        GameState.uiTheme = n;
        if (persist) localStorage.setItem('swamped_theme', n);
        return n;
    }

    function getGlobalProductionMultiplier() {
        let m = 1;
        if (GameState.processorCores > 0n) m *= (1 + bigintToNumberSafe(GameState.processorCores) * 0.1);
        if (GameState.blackMarket.rootkit_loader?.purchased) m *= 1.2;
        return m;
    }
    function getCryptoMultiplier() {
        let m = 1;
        if (GameState.blackMarket.quantum_rig?.purchased) m *= 1.35;
        if (GameState.blackMarket.cold_wallet_leech?.purchased) m *= 1.6;
        return m;
    }
    function getHackLossMultiplier() { return GameState.blackMarket.stealth_hypervisor?.purchased ? 0.8 : 1; }
    function getAntivirusLevel() {
        for (let i=4; i>=1; i--) if (GameState.blackMarket['antivirus_l'+i]?.purchased) return i;
        return 0;
    }
    function getAntivirusProfile() {
        const lvl = getAntivirusLevel();
        return { level: lvl, blockChance: [0,0.5,0.75,0.9,0.9][lvl]||0, monitoring: lvl>=4 };
    }
    function getAvailableTalentPoints() {
        return bigintToNumberSafe(GameState.processorCores) - Object.values(GameState.talents).reduce((a,b)=>a+b,0);
    }
    function talentBonus(id, per) { return 1 + GameState.talents[id] * per; }
    function getEnergyCapacity() {
        let cap = GameState.energy.baseCapacity;
        if (GameState.energy.backupGenerator) cap += 1200;
        cap += GameState.energy.hackedGridBonus;
        cap += GameState.talents.hardwarePower * 400;
        return cap;
    }
    function getWattsDivider() {
        let div = 1;
        if (GameState.upgrades.power_compression?.purchased) div *= 2;
        if (GameState.upgrades.quantum_psu?.purchased) div *= 3;
        return div;
    }
    function isWattsUnlimited() {
        return !!GameState.upgrades.capacitor_override?.purchased;
    }
    function calculateWattsUsage() {
        let total = 0;
        BUILDINGS.forEach(b => { total += bigintToNumberSafe(GameState.buildings[b.id].count) * Math.max(3, bigintToNumberSafe(b.baseProduction) * 0.8); });
        if (GameState.solarStorm.active && GameState.solarStorm.impactMode === 'watts') total *= GameState.solarStorm.wattsMultiplier;
        // Subtract looted/countered hardware watts (they don't cost you)
        total -= getLootedWatts();
        total = Math.max(0, total);
        const div = getWattsDivider();
        if (div > 1) total = Math.floor(total / div);
        return Math.floor(total);
    }
    // Track looted building counts separately so their watts aren't billed
    function getLootedWatts() {
        if (!GameState.lootedBuildings) return 0;
        let total = 0;
        BUILDINGS.forEach(b => {
            const looted = GameState.lootedBuildings[b.id] || 0;
            total += looted * Math.max(3, bigintToNumberSafe(b.baseProduction) * 0.8);
        });
        return total;
    }
    function getTimestamp() {
        const e = Math.floor((Date.now()-GameState.startTime)/1000);
        const h = Math.floor(e/3600).toString().padStart(2,'0');
        const m = Math.floor((e%3600)/60).toString().padStart(2,'0');
        const s = (e%60).toString().padStart(2,'0');
        return `${h}:${m}:${s}`;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function addLog(msg, type='success', qte=false) {
        const logs = document.getElementById('logs');
        const e = document.createElement('div');
        e.className = `log-entry log-${type}${qte?' qte-prompt':''}`;
        e.innerHTML = `<span class="log-timestamp">[${getTimestamp()}]</span><span>${escapeHtml(msg)}</span>`;
        logs.appendChild(e);
        logs.scrollTop = logs.scrollHeight;
        while (logs.children.length > 150) logs.removeChild(logs.children[0]);
    }

    function flagAchievement(flag) {
        if (!GameState._achievementFlags) GameState._achievementFlags = {};
        GameState._achievementFlags[flag] = true;
    }

    // ================================================
    // MATRIX SYSTEM
    // ================================================
    function initMatrix() {
        Object.keys(MATRIX_CONTACTS).forEach(cid => {
            const msgs = MATRIX_INITIAL_MESSAGES[cid] || [];
            const now = Date.now();
            msgs.forEach(m => {
                GameState.matrix.conversations[cid].push({
                    sender: m.sender,
                    text: m.text,
                    encrypted: m.encrypted || false,
                    decrypted: m.decrypted || null,
                    time: now + (m.time || 0),
                    self: false
                });
            });
        });
    }

    function addMatrixMessage(contactId, text, encrypted=false, markUnread=true) {
        if (!GameState.matrix.conversations[contactId]) return;
        GameState.matrix.conversations[contactId].push({
            sender: contactId, text, encrypted, time: Date.now(), self: false
        });
        if (markUnread && GameState.matrix.activeContact !== contactId) {
            GameState.matrix.unread[contactId] = (GameState.matrix.unread[contactId] || 0) + 1;
        }
        if (GameState.matrix.activeContact === contactId && document.getElementById('tab-matrix').classList.contains('active')) {
            renderMatrixMessages();
        }
        updateMatrixTabBadge();
    }

    function renderMatrixContacts() {
        const list = document.getElementById('matrix-contacts-list');
        const contacts = Object.values(MATRIX_CONTACTS);
        patchContainer(list, contacts, c => {
            const item = document.createElement('div');
            item.className = 'matrix-contact-item' + (GameState.matrix.activeContact === c.name ? ' active' : '');
            item.onclick = () => { GameState.matrix.activeContact = c.name; GameState.matrix.unread[c.name] = 0; renderMatrixContacts(); renderMatrixMessages(); updateMatrixTabBadge(); };
            const unread = GameState.matrix.unread[c.name] || 0;
            item.innerHTML = `<div class="matrix-contact-name" style="color:${c.color}">${c.label}</div><div class="matrix-contact-role">${c.role}</div>${unread > 0 ? `<span class="matrix-unread-badge">${unread}</span>` : ''}`;
            return item;
        });
    }

    function relativeTime(ts) {
        const diff = Date.now() - ts;
        if (diff < 0) return 'avant session';
        if (diff < 60000) return 'à l\'instant';
        if (diff < 3600000) return `il y a ${Math.floor(diff/60000)}m`;
        if (diff < 86400000) return `il y a ${Math.floor(diff/3600000)}h`;
        return `il y a ${Math.floor(diff/86400000)}j`;
    }

    function renderMatrixMessages(forceBottom = false) {
        const el = document.getElementById('matrix-messages');
        const cid = GameState.matrix.activeContact;
        const c = MATRIX_CONTACTS[cid];
        if (!c) return;
        document.getElementById('matrix-chat-contact').textContent = c.label;
        document.getElementById('matrix-chat-contact').style.color = c.color;
        document.getElementById('matrix-chat-role').textContent = c.role;
        const msgs = GameState.matrix.conversations[cid] || [];
        if (msgs.length === 0) { el.innerHTML = `<div style="color:#222;padding:12px;font-size:12px;">Aucun message.</div>`; return; }
        const prevScrollTop = el.scrollTop;
        const prevScrollHeight = el.scrollHeight;
        const nearBottom = prevScrollHeight - (prevScrollTop + el.clientHeight) < 30;
        patchContainer(el, msgs, (msg, idx) => {
            const div = document.createElement('div');
            div.className = 'matrix-msg' + (msg.self ? ' self' : '');
            const senderLabel = msg.self ? 'Vous' : (MATRIX_CONTACTS[msg.sender]?.label || msg.sender);
            const senderColor = msg.self ? '#444' : (MATRIX_CONTACTS[msg.sender]?.color || '#888');
            div.innerHTML = `<div class="matrix-msg-header"><span class="sender" style="color:${senderColor}">${escapeHtml(senderLabel)}</span> — ${relativeTime(msg.time)}</div><div class="matrix-msg-body${msg.encrypted && !msg._decrypted ? ' encrypted' : ''}">${escapeHtml(msg.text)}</div>`;
            if (msg.encrypted && !msg._decrypted) {
                div.querySelector('.matrix-msg-body').onclick = () => {
                    msg._decrypted = true;
                    div.querySelector('.matrix-msg-body').classList.remove('encrypted');
                    div.querySelector('.matrix-msg-body').textContent = msg.decrypted || '[DÉCHIFFREMENT ÉCHOUÉ]';
                };
            }
            return div;
        });
        if (forceBottom || nearBottom) el.scrollTop = el.scrollHeight;
        else el.scrollTop = Math.max(0, prevScrollTop + (el.scrollHeight - prevScrollHeight));
    }

    function sendMatrixMessage() {
        const input = document.getElementById('matrix-input');
        const text = input.value.trim();
        if (!text) return;
        const cid = GameState.matrix.activeContact;
        GameState.matrix.conversations[cid].push({ sender: 'player', text, time: Date.now(), self: true });
        input.value = '';
        renderMatrixMessages(true);
        // Auto-response
        const responses = {
            michel: ["Ha ! Bonne question.", "Je vois que tu réfléchis. C'est bien.", "Continue comme ça, mon grand.", "Je note. Je note toujours tout. 📋", "Intéressant. Très intéressant.", "T'as de bonnes intuitions, tu sais."],
            ghost_zero: ["Compris.", "Reste concentré.", "Ne fais pas confiance aux reps d'Overclock.", "Ta bande passante est ton bouclier.", "Je te recontacte."],
            n0de: ["Reçu.", "Logique.", "Tip : `ping 50` c'est plus rapide que cliquer.", "Surveille tes watts.", "AV en premier. Toujours."],
            architect: null,
            blackflag_op: ["Noté.", "Continue à construire.", "La réputation compte ici.", "Ne rate pas les contrats."]
        };
        const pool = responses[cid];
        if (pool) {
            setTimeout(() => {
                addMatrixMessage(cid, pool[Math.floor(Math.random()*pool.length)], false, true);
            }, 1000 + Math.random() * 2000);
        }
    }

    function updateMatrixTabBadge() {
        const total = Object.values(GameState.matrix.unread).reduce((a,b)=>a+b,0);
        const btn = document.getElementById('matrix-tab-btn');
        if (total > 0) { btn.textContent = `Matrix [${total}]`; btn.classList.add('has-unread'); }
        else { btn.textContent = 'Matrix'; btn.classList.remove('has-unread'); }
    }

    // ================================================
    // ACHIEVEMENTS
    // ================================================
    function checkAchievements() {
        if (!GameState.achievementsUnlocked) GameState.achievementsUnlocked = [];
        if (!GameState._achievementFlags) GameState._achievementFlags = {};
        ACHIEVEMENTS.forEach(ach => {
            if (GameState.achievementsUnlocked.includes(ach.id)) return;
            try { if (!ach.trigger(GameState)) return; } catch(e) { return; }
            GameState.achievementsUnlocked.push(ach.id);
            addLog(`🏆 Achievement: ${ach.label} — ${ach.desc}`, 'warning');
            ach.michel.forEach((line, i) => setTimeout(() => addMatrixMessage('michel', line, false, true), 1000 + i * 2000));
            setTimeout(() => addLog(`📨 New message from Tonton Michel (Matrix tab)`, 'info'), 500);
        });
    }

    function tickAmbientLogs(now) {
        if (now - GameState.backgroundLogTimer > 12000 + Math.random() * 8000) {
            GameState.backgroundLogTimer = now;
            const e = AMBIENT_LOGS[ambientIdx % AMBIENT_LOGS.length];
            addLog(e[0], e[1] || 'dim');
            ambientIdx++;
        }
    }

    // ================================================
    // ENERGY
    // ================================================
    function applyEnergyState() {
        GameState.energy.capacityWatts = getEnergyCapacity();
        GameState.energy.currentWatts = calculateWattsUsage();
        if (isWattsUnlimited()) {
            // No limit at all — recover from blackout if one was active
            if (GameState.energy.blackout) {
                GameState.energy.blackout = false;
                document.getElementById('blackout-message').style.display = 'none';
                addLog(`$ Capacitor Override: watt limit dissolved`, 'success');
            }
            return;
        }
        if (GameState.energy.currentWatts > GameState.energy.capacityWatts && !GameState.energy.blackout) {
            GameState.energy.blackout = true;
            GameState.energy.blackoutEnd = Date.now() + 10000;
            GameState.contract.stats.blackouts += 1n;
            document.getElementById('blackout-message').style.display = 'block';
            addLog(`$ POWER GRID BLACKOUT TRIGGERED (${GameState.energy.currentWatts}/${GameState.energy.capacityWatts}W)`, 'error');
            GameState.guidance.lastBlackout = Date.now();
            setTimeout(() => addMatrixMessage('n0de', 'Blackout détecté. Coupe la chauffe et renforce ton alimentation.', false, true), 1200);
        }
        if (GameState.energy.blackout && Date.now() >= GameState.energy.blackoutEnd) {
            GameState.energy.blackout = false;
            document.getElementById('blackout-message').style.display = 'none';
            addLog(`$ Power restored after blackout`, 'success');
        }
    }

    // ================================================
    // DIALOGS
    // ================================================
    function getDominantFaction() {
        return Object.entries(GameState.factions).sort((a,b) => b[1].reputation - a[1].reputation)[0]?.[0] || 'ghostwire';
    }

    function rollContractMutator() {
        if (Math.random() < 0.35) return null;
        return CONTRACT_MUTATORS[Math.floor(Math.random() * CONTRACT_MUTATORS.length)];
    }

    function getMutatorRewardMultiplier(mutator) {
        return mutator?.rewardMultiplier || 1;
    }

    function openConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm = () => {} }) {
        const overlay = document.getElementById('dialog-overlay');
        const db = document.getElementById('dialog-box');
        db.innerHTML = `
            <div class="dialog-header">${escapeHtml(title)}</div>
            <div class="dialog-text">${escapeHtml(message)}</div>
            <div class="dialog-actions">
                <button class="dialog-btn dialog-btn-confirm" id="dialog-confirm-btn">${escapeHtml(confirmLabel)}</button>
                <button class="dialog-btn dialog-btn-cancel" id="dialog-cancel-btn">${escapeHtml(cancelLabel)}</button>
            </div>
        `;
        overlay.classList.add('active');
        document.getElementById('dialog-cancel-btn').addEventListener('click', closeDialog);
        document.getElementById('dialog-confirm-btn').addEventListener('click', () => {
            closeDialog();
            onConfirm();
        });
        if (_confirmEnterHandler) document.removeEventListener('keydown', _confirmEnterHandler);
        _confirmEnterHandler = function(e) {
            if (e.key === 'Enter') { closeDialog(); onConfirm(); }
        };
        document.addEventListener('keydown', _confirmEnterHandler);
    }

    function openContractBoard() {
        const overlay = document.getElementById('dialog-overlay');
        const db = document.getElementById('dialog-box');
        const bw = calculateTotalBandwidth();
        const watts = GameState.energy.currentWatts;
        let html = `<div class="dialog-header">>>> CONTRACT BOARD <<<</div><div class="dialog-text">Pick contracts matching your level. Some contracts may include mutators for higher payouts.</div>`;
        ['starter','ops','elite','legendary'].forEach(cat => {
            html += `<div style="margin:8px 0 4px;color:${cat==='legendary'?'#ff44ff':'#ffaa00'};font-weight:700;text-transform:uppercase;">${cat}${cat==='legendary'?' [PRESTIGE REQUIRED]':''}</div>`;
            CONTRACT_BOARD.filter(c => c.category === cat).forEach(c => {
                const coresOk = !c.requiresCores || bigintToNumberSafe(GameState.processorCores) >= c.requiresCores;
                const ok = coresOk && bw >= c.requirements.bandwidth && GameState.totalPackets >= c.requirements.packets;
                const wattsRisk = watts > c.requirements.watts && c.requirements.watts > 0;
                const lockedMsg = !coresOk ? `<span style="font-size:12px;color:#ff44ff;">🔒 Requires ${c.requiresCores} prestige core(s) — current: ${GameState.processorCores}</span><br>` : '';
                html += `<div class="dialog-choice" style="${ok?'':'opacity:0.45;'}" ${ok?`onclick="acceptBoardContract('${c.id}')"`:''}>
                    <strong style="color:${cat==='legendary'?'#ff44ff':'inherit'}">${c.name}</strong><br>
                    ${lockedMsg}
                    <span style="font-size:12px;color:#888;">Req BW ${formatNumber(c.requirements.bandwidth)} / Packets ${c.requirements.packets}${c.requirements.watts>0?' / Rec Watts ≤ '+c.requirements.watts:''}</span><br>
                    <span style="font-size:12px;color:${wattsRisk?'#ff6666':'#888'};">Current watts: ${watts}${wattsRisk?' (over recommended)':''}</span><br>
                    <span style="font-size:12px;color:#888;">Faction: ${c.faction} | Reward ${c.rewards.crypto.toFixed(2)} XMR +${c.rewards.reputation} rep</span><br>
                    <span style="font-size:12px;color:#77aa77;">Objectives:</span><br>
                    <span style="font-size:11px;color:#6b6b6b;line-height:1.4;">${getContractObjectivesSummary(c)}</span><br>
                    <span style="font-size:11px;color:#666;">Mutator chance: ~65% no mutator, otherwise bonus payout</span>
                </div>`;
            });
        });
        html += `<div class="dialog-choice" onclick="closeDialog()" style="border-color:#666;color:#666;">Close</div>`;
        db.innerHTML = html;
        overlay.classList.add('active');
    }

    function acceptBoardContract(contractId) {
        const c = CONTRACT_BOARD.find(x => x.id === contractId);
        if (!c || GameState.contract.active) return;
        if (c.requiresCores && bigintToNumberSafe(GameState.processorCores) < c.requiresCores) {
            addLog(`$ ERROR: Contract requires ${c.requiresCores} prestige core(s)`, 'error'); return;
        }
        const bw = calculateTotalBandwidth();
        if (bw < c.requirements.bandwidth || GameState.totalPackets < c.requirements.packets) { addLog(`$ Contract requirements not met`, 'error'); return; }
        const mutator = rollContractMutator();
        const rewardMultiplier = getMutatorRewardMultiplier(mutator);
        GameState.contract.active = {
            ...c,
            mutator,
            rewardMultiplier,
            stageIndex: 0,
            startTime: Date.now(),
            stageStartData: GameState.data,
            stageStartPackets: GameState.totalPackets,
            stageStartCrypto: GameState.crypto,
            stageStartCrashes: GameState.contract.stats.crashes,
            stageStartBlackouts: GameState.contract.stats.blackouts
        };
        closeDialog();
        addLog(`$ >>> CONTRACT ACCEPTED: ${c.name} <<<`, 'warning');
        if (mutator) addLog(`$ Mutator active: ${mutator.name} (+${Math.round((rewardMultiplier-1)*100)}% reward)`, 'warning');
    }

    function openBlackMarketBoard() {
        const overlay = document.getElementById('dialog-overlay');
        const db = document.getElementById('dialog-box');
        let html = `<div class="dialog-header">>>> BLACK MARKET CATALOG <<<</div><div class="dialog-text">XMR: ${GameState.crypto.toFixed(2)}. Scroll to browse.</div>`;
        BLACK_MARKET_ITEMS.forEach(item => {
            const purchased = GameState.blackMarket[item.id].purchased;
            const cost = calculateBlackMarketCost(item);
            const can = GameState.crypto >= cost;
            html += `<div class="dialog-choice" style="${purchased?'opacity:0.5;':''}" ${!purchased&&can?`onclick="buyBlackMarketItem('${item.id}'); closeDialog();"`:''}>
                <strong>${item.name}</strong> ${purchased?'[OWNED]':''}<br>
                <span style="font-size:12px;color:#888;">${item.description}</span><br>
                <span style="font-size:12px;color:#ffaa00;">Cost: ${cost.toFixed(2)} XMR</span>
            </div>`;
        });
        html += `<div class="dialog-choice" onclick="closeDialog()" style="border-color:#666;color:#666;">Close</div>`;
        db.innerHTML = html;
        overlay.classList.add('active');
    }

    function openWorldMap() {
        const compromised = Object.values(GameState.targets).filter(t => t.compromised).length;
        const rep = GameState.factions;
        const toughest = SOCIAL_TARGETS.slice().sort((a,b) => Number(b.baseReward-a.baseReward)).slice(0,4);
        const intel = toughest.map(t => `${GameState.targets[t.id].compromised ? '[✓]' : '[ ]'} ${t.name} — reward ${formatNumber(t.baseReward)}`).join('<br>');
        const progress = Math.floor((compromised / SOCIAL_TARGETS.length) * 100);
        computeRegionControl();
        const regionRows = REGION_CONFIG.map(r => `${r.name}: ${GameState.regionControl[r.id] || 0}%`).join('<br>');
        const completedRegions = getRegionCompletedCount();
        const bonusPct = Math.floor((getRegionGlobalBonusMultiplier() - 1) * 100);
        const warState = completedRegions >= 4 ? 'Cyber-war turning in your favor.' : completedRegions >= 2 ? 'Contested digital front. Keep pushing.' : 'Enemy infrastructure still dominates most regions.';
        document.getElementById('dialog-box').innerHTML = `
            <div class="dialog-header">>>> GLOBAL OPS MAP <<<</div>
            <pre style="white-space:pre-wrap;color:#ff4444;font-size:12px;">${ASCII_WORLD_MAP}</pre>
            <div class="dialog-text">Compromised targets: ${compromised}/${SOCIAL_TARGETS.length} (${progress}%) | Factions — GW ${rep.ghostwire.reputation}, BF ${rep.blackflag.reputation}, OC ${rep.overclock.reputation}</div>
            <div class="dialog-choice" style="cursor:default;">
                <strong style="color:#77aa77;">Regional cleanup status</strong><br>
                <span style="font-size:11px;color:#777;line-height:1.45;">${regionRows}</span><br>
                <span style="font-size:11px;color:#ffaa00;">Completed regions: ${completedRegions}/6 | Passive BW bonus: +${bonusPct}%</span><br>
                <span style="font-size:11px;color:#aa8899;">${warState}</span>
            </div>
            <div class="dialog-choice" style="cursor:default;">
                <strong style="color:#77aa77;">Top target ledger</strong><br>
                <span style="font-size:11px;color:#777;line-height:1.45;">${intel}</span>
            </div>
            <div class="dialog-choice" onclick="closeDialog()" style="border-color:#666;color:#666;">Close</div>
        `;
        document.getElementById('dialog-overlay').classList.add('active');
    }

    let _confirmEnterHandler = null;
    function closeDialog() {
        document.getElementById('dialog-overlay').classList.remove('active');
        if (_confirmEnterHandler) {
            document.removeEventListener('keydown', _confirmEnterHandler);
            _confirmEnterHandler = null;
        }
    }

    function showDialog(targetId) {
        const target = SOCIAL_TARGETS.find(t => t.id === targetId);
        const listsOwned = GameState.consumables.phone_list.count;
        if (listsOwned < BigInt(target.requiredLists)) { addLog(`$ ERROR: Need ${target.requiredLists} phone lists (have ${listsOwned})`, 'error'); return; }
        if (GameState.targets[targetId].compromised) { addLog(`$ ${target.name} already compromised`, 'warning'); return; }
        const overlay = document.getElementById('dialog-overlay');
        const db = document.getElementById('dialog-box');
        let html = `<div class="dialog-header">>>> SOCIAL ENGINEERING: ${target.name.toUpperCase()} <<<</div><div class="dialog-text">${target.dialog.intro}</div>`;
        target.dialog.choices.forEach((choice, idx) => {
            html += `<div class="dialog-choice" onclick="attemptCompromise('${targetId}',${idx})">${choice.text}<div class="dialog-result">Success rate: ${Math.floor(choice.success*100)}%</div></div>`;
        });
        html += `<div class="dialog-choice" onclick="closeDialog()" style="border-color:#666;color:#666;">Hang up and abort</div>`;
        db.innerHTML = html;
        overlay.classList.add('active');
    }

    function attemptCompromise(targetId, choiceIndex) {
        const target = SOCIAL_TARGETS.find(t => t.id === targetId);
        const choice = target.dialog.choices[choiceIndex];
        const listsNeeded = BigInt(target.requiredLists);
        if (GameState.consumables.phone_list.count < listsNeeded) { addLog(`$ ERROR: Phone lists depleted`, 'error'); closeDialog(); return; }
        if (listsNeeded > 0n) { GameState.consumables.phone_list.count -= listsNeeded; refreshSystemFiles(); addLog(`$ Consumed ${listsNeeded} phone list(s)`, 'warning'); }
        const success = Math.random() < Math.min(0.95, choice.success * talentBonus('redPhishing', 0.04));
        if (success) {
            GameState.targets[targetId].compromised = true;
            GameState.data += target.baseReward;
            addLog(`$ ${target.name} compromised! +${formatNumber(target.baseReward)}`, 'success');
            addLog(`$ Permanent bonus: +${Math.floor(target.permanentBonus*100)}% production`, 'info');
            addLog(`$ "${choice.response}"`, 'success');
        } else {
            addLog(`$ Compromise failed: ${target.name}`, 'error');
            addLog(`$ "${choice.fail}"`, 'warning');
        }
        closeDialog(); updateDisplay(false); saveGame();
    }


    function computeRegionControl() {
        const compromised = Object.values(GameState.targets).filter(t => t.compromised).length;
        const ratio = SOCIAL_TARGETS.length ? compromised / SOCIAL_TARGETS.length : 0;
        const pulse = Math.min(1, ratio * 1.35);
        const reps = GameState.factions;
        GameState.regionControl.na = Math.min(100, Math.floor(pulse * 100));
        GameState.regionControl.eu = Math.min(100, Math.floor((pulse * 85) + reps.ghostwire.reputation * 0.7));
        GameState.regionControl.apac = Math.min(100, Math.floor((pulse * 70) + reps.overclock.reputation * 1.1));
        GameState.regionControl.latam = Math.min(100, Math.floor((pulse * 65) + reps.blackflag.reputation * 1.0));
        GameState.regionControl.africa = Math.min(100, Math.floor((pulse * 55) + (reps.blackflag.reputation + reps.ghostwire.reputation) * 0.4));
        GameState.regionControl.oceania = Math.min(100, Math.floor((pulse * 50) + reps.overclock.reputation * 0.6));
    }

    function getRegionCompletedCount() {
        computeRegionControl();
        return REGION_CONFIG.filter(r => (GameState.regionControl[r.id] || 0) >= 100).length;
    }

    function getRegionGlobalBonusMultiplier() {
        const completed = getRegionCompletedCount();
        return 1 + completed * 0.03;
    }

    // ================================================
    // CALCULATIONS
    // ================================================
    function calculateBuildingCost(b) {
        return BigInt(Math.floor(Number(b.baseCost) * DIFFICULTY_MULTIPLIER * Math.pow(b.multiplier, Number(GameState.buildings[b.id].count))));
    }
    function calculateBuildingSellValue(b) {
        const count = GameState.buildings[b.id].count;
        if (count <= 0n) return 0n;
        return BigInt(Math.floor(Number(b.baseCost) * DIFFICULTY_MULTIPLIER * Math.pow(b.multiplier, Number(count-1n)) * 0.6));
    }
    function calculateBuildingProduction(b) {
        let prod = b.baseProduction * GameState.buildings[b.id].count;
        UPGRADES.forEach(u => {
            if (GameState.upgrades[u.id].purchased) {
                if (u.effect.building === b.id) prod = prod * BigInt(u.effect.multiplier);
            }
        });
        let gm = 1.0;
        UPGRADES.forEach(u => { if (GameState.upgrades[u.id].purchased && u.effect.type === 'global') gm *= u.effect.multiplier; });
        SOCIAL_TARGETS.forEach(t => { if (GameState.targets[t.id].compromised) gm *= (1 + t.permanentBonus); });
        prod = BigInt(Math.floor(Number(prod) * gm * getGlobalProductionMultiplier() * talentBonus('hardwareEfficiency', 0.05)));
        if (GameState.solarStorm.active && GameState.solarStorm.impactMode === 'production') prod = BigInt(Math.floor(Number(prod) * GameState.solarStorm.productionMultiplier));
        if (GameState.skills.dnsAmplification.active) { const m = GameState.skills.dnsAmplification.multiplier + (GameState.skills.dnsAmplification.level-1)*20; prod = prod * BigInt(m); }
        if (GameState.skills.broadcastStorm.active && !GameState.skills.broadcastStorm.crashed) { const m = GameState.skills.broadcastStorm.multiplier + (GameState.skills.broadcastStorm.level-1)*5; prod = prod * BigInt(m); }
        if (GameState.consumables.bandwidth_boost.activeBoost) prod = prod * 2n;
        if (GameState.temperature.productionPenalty > 0) prod = BigInt(Math.floor(Number(prod) * (1 - GameState.temperature.productionPenalty)));
        if (GameState.systemMalfunction.active) prod = BigInt(Math.floor(Number(prod) * (1 - GameState.systemMalfunction.severity/100)));
        if (GameState.skills.broadcastStorm.crashed) prod = 0n;
        return prod;
    }
    function calculateTotalBandwidth() {
        let total = 0n;
        BUILDINGS.forEach(b => { total += calculateBuildingProduction(b); });
        return BigInt(Math.floor(Number(total) * getRegionGlobalBonusMultiplier()));
    }
    function calculateMiningBandwidth() {
        let total = 0n;
        BUILDINGS.forEach(b => { total += b.baseProduction * GameState.buildings[b.id].count; });
        return BigInt(Math.floor(Number(total) * talentBonus('hardwareEfficiency', 0.05)));
    }
    function calculateManualPacketGain() {
        let gain = 1n;
        UPGRADES.forEach(u => {
            if (GameState.upgrades[u.id].purchased) {
                if (u.effect.type === 'global') gain = BigInt(Math.floor(Number(gain) * u.effect.multiplier));
                if (u.effect.type === 'manual_ping') gain = gain * BigInt(u.effect.multiplier);
            }
        });
        SOCIAL_TARGETS.forEach(t => { if (GameState.targets[t.id].compromised) gain = BigInt(Math.floor(Number(gain) * (1 + t.permanentBonus))); });
        if (GameState.skills.dnsAmplification.active) { const m = GameState.skills.dnsAmplification.multiplier + (GameState.skills.dnsAmplification.level-1)*20; gain = gain * BigInt(m); }
        if (GameState.skills.broadcastStorm.active) { const m = GameState.skills.broadcastStorm.multiplier + (GameState.skills.broadcastStorm.level-1)*5; gain = gain * BigInt(m); }
        if (GameState.skills.packetInjection.active) { const m = GameState.skills.packetInjection.clickMultiplier + (GameState.skills.packetInjection.level-1)*3; gain = gain * BigInt(m); }
        if (GameState.consumables.bandwidth_boost.activeBoost) gain = gain * 2n;
        gain = BigInt(Math.floor(Number(gain) * getGlobalProductionMultiplier()));
        gain = BigInt(Math.floor(Number(gain) * talentBonus('redPayload', 0.06)));
        return gain;
    }

    // ================================================
    // TEMPERATURE QTE
    // ================================================
    function triggerTemperatureQTE() {
        if (GameState.temperature.qteCooldown > 0 || GameState.temperature.qteActive) return;
        GameState.temperature.qteActive = true;
        GameState.temperature.qteStartTime = Date.now();
        const cmd = GameState.temperature.qteCommands[Math.floor(Math.random()*GameState.temperature.qteCommands.length)];
        GameState.temperature.expectedCommand = cmd;
        document.getElementById('command-line').classList.add('qte-active');
        document.getElementById('command-input').focus();
        addLog(`⚠ WARNING: Temperature critical at ${Math.floor(GameState.temperature.current)}°C!`, 'error', true);
        addLog(`$ URGENT: Execute '${cmd}' to prevent thermal shutdown [15s]`, 'warning', true);
    }

    function handleTemperatureQTE(command) {
        if (!GameState.temperature.qteActive) return false;
        const elapsed = Date.now() - GameState.temperature.qteStartTime;
        if (command === GameState.temperature.expectedCommand) {
            const timeBonus = Math.max(0, 15 - Math.floor(elapsed/1000));
            const cooling = 8 + timeBonus;
            GameState.temperature.current = Math.max(GameState.temperature.target, GameState.temperature.current - cooling);
            GameState.temperature.qteActive = false;
            GameState.temperature.qteCooldown = 45000;
            document.getElementById('command-line').classList.remove('qte-active');
            addLog(`$ Command executed [${Math.floor(elapsed/1000)}s response time] — temperature -${cooling}°C`, 'success');
            flagAchievement('temperature_survived');
            if (timeBonus >= 10) addLog(`$ Excellent reaction time! Bonus cooling applied`, 'info');
            return true;
        } else if (GameState.temperature.qteCommands.includes(command)) {
            addLog(`$ ERROR: Wrong cooling protocol — Use '${GameState.temperature.expectedCommand}'`, 'error');
            return true;
        }
        return false;
    }

    function applyThermalDamage() {
        const pool = ['data_center','fiber_backbone','dedicated_server','edge_proxy_farm'];
        const t = pool[Math.floor(Math.random()*pool.length)];
        if (GameState.buildings[t]?.count > 0n) {
            GameState.buildings[t].count -= 1n;
            // If some of these are looted, reduce looted count first
            if (GameState.lootedBuildings[t] > 0) GameState.lootedBuildings[t]--;
            addLog(`$ Thermal damage destroyed 1 ${t.replace('_',' ')}`, 'error');
        }
        if (GameState.consumables.phone_list.count > 0n && Math.random() < 0.35) {
            const loss = BigInt(1 + Math.floor(Math.random()*2));
            const actual = GameState.consumables.phone_list.count > loss ? loss : GameState.consumables.phone_list.count;
            GameState.consumables.phone_list.count -= actual;
            refreshSystemFiles();
            addLog(`$ Heat incident burned ${actual} phone list(s)`, 'warning');
        }
    }

    function updateTemperature(dt) {
        const bw = calculateTotalBandwidth();
        // Base passive heating from bandwidth
        if (Number(bw) > 0) GameState.temperature.current += (Math.min(15, Number(bw)/1000) * dt) / 60;

        // Extra heat from active skills / events
        if (GameState.skills.dnsAmplification.active) GameState.temperature.current += 0.8 * dt;
        if (GameState.skills.broadcastStorm.active && !GameState.skills.broadcastStorm.crashed) GameState.temperature.current += 1.5 * dt;
        if (GameState.skills.packetInjection.active) GameState.temperature.current += 0.4 * dt;
        if (GameState.consumables.bandwidth_boost.activeBoost) GameState.temperature.current += 0.6 * dt;
        if (GameState.solarStorm.active) GameState.temperature.current += 0.5 * dt;
        // Two simultaneous .sh payloads armed = thermal spike
        const armedPayloads = GameState.files.filter(f => f.type === 'malicious' && Date.now() >= f.armedAt).length;
        if (armedPayloads >= 2) GameState.temperature.current += 0.9 * dt;

        // Natural cooling toward target
        if (GameState.temperature.current > GameState.temperature.target) GameState.temperature.current -= 0.5 * dt;
        GameState.temperature.current = Math.max(GameState.temperature.target, GameState.temperature.current);

        if (GameState.temperature.current >= 35 && !GameState.temperature.qteActive && GameState.temperature.qteCooldown === 0) triggerTemperatureQTE();
        const maxSafe = GameState.temperature.maxSafe + GameState.talents.blueCooling;
        if (GameState.temperature.current > maxSafe) {
            GameState.temperature.productionPenalty = Math.min(0.7, (GameState.temperature.current - maxSafe) / 50);
            if (GameState.temperature.current - maxSafe > 20) document.getElementById('temperature-container').style.display = 'block';
        } else {
            GameState.temperature.productionPenalty = 0;
            if (GameState.temperature.current < maxSafe + 5) document.getElementById('temperature-container').style.display = 'none';
        }
        // QTE timeout
        if (GameState.temperature.qteActive) {
            if (Date.now() - GameState.temperature.qteStartTime >= GameState.temperature.qteTimeout) {
                GameState.temperature.qteActive = false;
                GameState.temperature.qteCooldown = 30000;
                document.getElementById('command-line').classList.remove('qte-active');
                addLog(`$ TIMEOUT: Thermal intervention failed`, 'error');
                GameState.temperature.current += 3;
                if (Math.random() < 0.5) applyThermalDamage();
            }
        }
        if (GameState.temperature.qteCooldown > 0) GameState.temperature.qteCooldown = Math.max(0, GameState.temperature.qteCooldown - 100);
        if (GameState.temperature.current > 47 && Math.random() < 0.01) applyThermalDamage();
    }

    // ================================================
    // MALFUNCTION
    // ================================================
    function triggerMalfunction() {
        if (GameState.consumables.malfunction_shield.count > 0n) {
            GameState.consumables.malfunction_shield.count -= 1n;
            addLog(`$ Malfunction prevented by shield! [1 consumed]`, 'success');
            return;
        }
        GameState.systemMalfunction.active = true;
        GameState.systemMalfunction.severity = Math.random() * 60 + 20;
        GameState.systemMalfunction.startTime = Date.now();
        document.getElementById('malfunction-message').style.display = 'block';
        document.getElementById('malfunction-container').style.display = 'block';
        addLog(`$ CRITICAL: System malfunction (-${Math.floor(GameState.systemMalfunction.severity)}% production)`, 'error');
        addLog(`$ Use Repair Kit or wait 60s for auto-recovery`, 'warning');
    }

    function checkMalfunction(now) {
        if (now >= GameState.systemMalfunction.nextMalfunctionCheck && !GameState.systemMalfunction.active) {
            if (Math.random() < Math.min(0.15, Number(calculateTotalBandwidth())/2000000)) triggerMalfunction();
            GameState.systemMalfunction.nextMalfunctionCheck = now + 180000 + Math.random() * 180000;
        }
    }

    // ================================================
    // FILES
    // ================================================
    function refreshSystemFiles() {
        const files = [];
        if (GameState.consumables.phone_list.count > 0n) files.push({ name: `corporate_phone_list_${GameState.consumables.phone_list.count}.csv`, type: 'resource' });
        GameState.files.filter(f => f.type === 'malicious').forEach(f => files.push(f));
        GameState.files = files;
    }

    function spawnMaliciousFile(source='intrusion') {
        const profile = getAntivirusProfile();
        const id = Math.floor(Math.random()*10000).toString().padStart(4,'0');

        // Stealth virus: spawns as hidden file (no log, bypasses AV) if player is advanced enough
        // Condition: 3+ prestige cores OR antivirus L3+ purchased (makes attackers escalate)
        const isAdvanced = bigintToNumberSafe(GameState.processorCores) >= 3 || getAntivirusLevel() >= 3;
        const stealthRoll = isAdvanced && Math.random() < 0.35; // 35% chance to go stealth at advanced stage

        if (stealthRoll) {
            // Hidden file: prefixed with . like Unix hidden files, silent spawn, NO log
            const hiddenNames = [`.proc_${id}`, `.cache_${id}`, `.sync_${id}`, `.cron_${id}`, `.svc_${id}`];
            const hiddenName = hiddenNames[Math.floor(Math.random() * hiddenNames.length)];
            const file = {
                name: hiddenName,
                type: 'malicious',
                hidden: true,
                createdAt: Date.now(),
                source,
                armedAt: Date.now() + 120000 // arms faster (2min vs 3min)
            };
            GameState.files.push(file);
            // NO log — that's the whole point
            return;
        }

        const file = { name: `payload_${id}.sh`, type: 'malicious', hidden: false, createdAt: Date.now(), source, armedAt: Date.now()+180000 };
        if (profile.level > 0 && Math.random() < profile.blockChance) {
            addLog(`$ Threat blocked by Antivirus L${profile.level}: ${file.name}`, 'success');
            if (profile.monitoring && Math.random() < 0.25) {
                const ip = `185.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
                GameState.knownAttackerIps = [...new Set([ip, ...GameState.knownAttackerIps])].slice(0,20);
                addLog(`$ Monitoring: origin=${ip}`, 'info');
            }
            return;
        }
        GameState.files.push(file);
        addLog(`$ ${profile.level > 0 ? `Antivirus L${profile.level} alert: ${file.name} bypassed` : `Suspicious file dropped: ${file.name}`}`, 'warning');
    }

    function evaluateMaliciousFiles() {
        const now = Date.now();
        const profile = getAntivirusProfile();
        GameState.files = GameState.files.filter(file => {
            if (file.type !== 'malicious' || now < file.armedAt) return true;
            // Hidden files: AV is blind to them, execute silently but reveal themselves when they fire
            if (file.hidden) {
                addLog(`$ ${file.name} executed → process anomaly detected`, 'error');
                addLog(`$ tip: try 'ls -d' to inspect hidden processes`, 'warning');
                // damage
                for (const key of ['data_center','fiber_backbone','dedicated_server']) {
                    if (GameState.buildings[key]?.count > 0n) {
                        GameState.buildings[key].count -= 1n;
                        addLog(`$ ${file.name}: lost 1 ${key.replace(/_/g,' ')}`, 'error');
                        return false;
                    }
                }
                const ratio = 0.4 + Math.random() * 0.5;
                if (Math.random() < 0.5 && GameState.crypto > 0) {
                    const loss = GameState.crypto * ratio;
                    GameState.crypto = Math.max(0, GameState.crypto - loss);
                    addLog(`$ ${file.name}: drained ${loss.toFixed(2)} XMR`, 'error');
                } else {
                    const loss = BigInt(Math.floor(Number(GameState.data) * ratio));
                    GameState.data = GameState.data > loss ? GameState.data - loss : 0n;
                    addLog(`$ ${file.name}: drained ${formatNumber(loss)}`, 'error');
                }
                return false;
            }
            if (profile.level > 0 && Math.random() < profile.blockChance) { addLog(`$ Antivirus L${profile.level} quarantined ${file.name}`, 'success'); return false; }
            for (const key of ['data_center','fiber_backbone','dedicated_server']) {
                if (GameState.buildings[key]?.count > 0n) { GameState.buildings[key].count -= 1n; addLog(`$ ${file.name} executed → lost 1 ${key.replace('_',' ')}`, 'error'); return false; }
            }
            const ratio = 0.5 + Math.random() * 0.5;
            if (Math.random() < 0.45 && GameState.crypto > 0) {
                const loss = GameState.crypto * ratio;
                GameState.crypto = Math.max(0, GameState.crypto - loss);
                addLog(`$ ${file.name} executed → lost ${loss.toFixed(2)} XMR`, 'error');
            } else {
                const loss = BigInt(Math.floor(Number(GameState.data) * ratio));
                GameState.data = GameState.data > loss ? GameState.data - loss : 0n;
                addLog(`$ ${file.name} executed → lost ${formatNumber(loss)}`, 'error');
            }
            return false;
        });
        refreshSystemFiles();
    }

    // ================================================
    // GHOST SIGNAL (solar storm ambiance)
    // ================================================
    const GHOST_SIGNAL_LOGS = [
        `$ eth0: carrier sense — signal origin: unknown`,
        `$ netlink: unsolicited route advertisement from ??:??:??:??:??:??`,
        `$ kernel: unexpected IRQ on eth0 — source unresolvable`,
        `$ tcpdump: 1 packet captured (SRC=0.0.0.0 DST=255.255.255.255 LEN=0)`,
        `$ dmesg: anomalous frequency on NIC — interference pattern detected`,
        `$ arp: 0.0.0.0 is at [REDACTED] on eth0`,
        `$ net: received ICMP type 255 (reserved) — discarding`,
        `$ trace: hop 13 → TTL expired in transit → next hop: [NULL]`,
    ];
    function triggerGhostSignal() {
        const msg = GHOST_SIGNAL_LOGS[Math.floor(Math.random() * GHOST_SIGNAL_LOGS.length)];
        addLog(msg, 'dim');
    }

    // ================================================
    // 0-DAY EVENT
    // ================================================
    function triggerZeroDayEvent() {
        if (!GameState.zeroDayEvent) GameState.zeroDayEvent = {};
        GameState.zeroDayEvent.active = true;
        GameState.zeroDayEvent.endTime = Date.now() + 20000; // 20s to respond
        const responses = ['patch', 'isolate', 'rollback'];
        GameState.zeroDayEvent.expectedCommand = responses[Math.floor(Math.random() * responses.length)];
        addLog(`$ CRITICAL: Zero-day exploit detected in kernel module`, 'error', true);
        addLog(`$ CVE-????-???? — unknown vector — execute '${GameState.zeroDayEvent.expectedCommand}' in 20s`, 'error', true);
        document.getElementById('command-line').classList.add('qte-active');
        document.getElementById('command-input').focus();
        // Spawn a hidden payload immediately — the 0-day drops a rootkit
        spawnMaliciousFile('zero_day');
    }

    function resolveZeroDayEvent(success) {
        if (!GameState.zeroDayEvent?.active) return;
        GameState.zeroDayEvent.active = false;
        document.getElementById('command-line').classList.remove('qte-active');
        if (success) {
            addLog(`$ Zero-day contained. System integrity restored.`, 'success');
            // Remove any zero_day files dropped
            GameState.files = GameState.files.filter(f => f.source !== 'zero_day');
            refreshSystemFiles();
            // Small crypto reward for fast response
            GameState.crypto += 0.5;
            addLog(`$ Exploit bounty credited: +0.5 XMR`, 'info');
        } else {
            addLog(`$ Zero-day timeout — exploit executed in kernel space`, 'error');
            // Extra punishment: lose a building AND drop stealth file
            const targets = ['fiber_backbone', 'data_center', 'edge_proxy_farm'];
            for (const key of targets) {
                if (GameState.buildings[key]?.count > 0n) {
                    GameState.buildings[key].count -= 1n;
                    addLog(`$ Kernel exploit destroyed 1 ${key.replace(/_/g,' ')}`, 'error');
                    break;
                }
            }
        }
    }

    // ================================================
    // SURVEILLANCE — trop visible = on te cible
    // ================================================
    function checkSurveillance(now) {
        if (now < (GameState.surveillance.nextCheck || 0)) return;
        GameState.surveillance.nextCheck = now + 45000;

        const xmr = GameState.crypto;
        const bw = bigintToNumberSafe(calculateTotalBandwidth());
        const cores = bigintToNumberSafe(GameState.processorCores);

        // Compute threat level 0-3
        let level = 0;
        if (xmr > 1000 || bw > 100000000) level = 1;    // 1k XMR ou 100 Mo/s
        if (xmr > 10000 || bw > 1000000000) level = 2;  // 10k XMR ou 1 Go/s
        if (xmr > 50000 || bw > 5000000000) level = 3;  // 50k XMR ou 5 Go/s

        // Cores réduisent la visibilité (tu sais te cacher après prestige)
        level = Math.max(0, level - Math.floor(cores / 2));

        if (level !== GameState.surveillance.level) {
            GameState.surveillance.level = level;
            GameState.surveillance.rivalMultiplier = 1 + level * 0.4;

            if (level === 1 && !GameState.surveillance._warned1) {
                GameState.surveillance._warned1 = true;
                addLog(`$ netstat: unusual traffic pattern flagged by upstream AS`, 'warning');
                setTimeout(() => addMatrixMessage('ghost_zero',
                    "Tu génères beaucoup de trafic. Les gros ISPs commencent à noter ton subnet. Sois prudent.",
                    false, true), 2000);
            }
            if (level === 2 && !GameState.surveillance._warned2) {
                GameState.surveillance._warned2 = true;
                addLog(`$ WARNING: anomalous signature detected by threat intel feed`, 'error');
                addLog(`$ Rival attack frequency increasing — you are a high-value target`, 'error');
                setTimeout(() => addMatrixMessage('n0de',
                    "Quelqu'un a vendu tes metrics sur un forum privé. Les attaques vont s'intensifier. Investis dans la défense.",
                    false, true), 1500);
            }
            if (level === 3 && !GameState.surveillance._warned3) {
                GameState.surveillance._warned3 = true;
                addLog(`$ CRITICAL: your node appears in 3 separate threat actor watchlists`, 'error');
                addLog(`$ Prestige to reduce your footprint — or face escalating pressure`, 'error');
                setTimeout(() => addMatrixMessage('architect',
                    "01001001 01001100 01010011", false, true), 3000);
                setTimeout(() => addMatrixMessage('ghost_zero',
                    "Tu es trop visible. Le prestige efface ton empreinte. C'est pour ça qu'il existe.",
                    false, true), 6000);
            }
        }
    }

    // ================================================
    // SOLAR STORM
    // ================================================
    function triggerSolarStorm() {
        if (GameState.solarStorm.active) return;
        GameState.solarStorm.active = true;
        GameState.solarStorm.count = (GameState.solarStorm.count || 0) + 1;
        const dur = 30000 + Math.floor(Math.random()*30000);
        GameState.solarStorm.endTime = Date.now() + dur;
        const mode = Math.random() < 0.6 ? 'production' : 'watts';
        GameState.solarStorm.impactMode = mode;
        if (mode === 'production') {
            GameState.solarStorm.productionMultiplier = 0.5 + Math.random() * 0.4;
            addLog(`$ SOLAR STORM: signal degradation ${(dur/1000).toFixed(0)}s | production -${Math.round((1-GameState.solarStorm.productionMultiplier)*100)}%`, 'warning');
        } else {
            GameState.solarStorm.wattsMultiplier = 1.15 + Math.random() * 0.5;
            addLog(`$ SOLAR STORM: power grid turbulence ${(dur/1000).toFixed(0)}s | watts +${Math.round((GameState.solarStorm.wattsMultiplier-1)*100)}%`, 'warning');
        }
        document.getElementById('solar-indicator').style.display = 'inline';
        if (GameState.solarStorm.count === 1) setTimeout(() => addMatrixMessage('ghost_zero', "Tu l'as senti ? Tempête n°1. Reste en ligne.", false, true), 3000);
    }

    function unlockStoryLog(logId) {
        if (!GameState.story.unlocked.includes(logId)) {
            GameState.story.unlocked.push(logId);
            addLog(`$ New encrypted file discovered: ${STORY_LOGS[logId].title}`, 'info');
        }
    }

    // ================================================
    // RIVAL ATTACK
    // ================================================
    function triggerRivalAttack() {
        if (GameState.rivalAttack.active) return;
        if (GameState.blackMarket.intrusion_ai?.purchased) {
            const ip = `185.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
            GameState.knownAttackerIps = [...new Set([ip,...GameState.knownAttackerIps])].slice(0,20);
            addLog(`$ Auto intrusion defense blocked attacker (${ip})`, 'success');
            if (GameState.blackMarket.hunter_counter?.purchased && Math.random() < 0.25) {
                GameState.buildings.dedicated_server.count += 1n;
                GameState.lootedBuildings.dedicated_server = (GameState.lootedBuildings.dedicated_server || 0) + 1;
                addLog(`$ Counter-hack loot: +1 Dedicated Server [watts not billed — stolen hardware]`, 'success');
            }
            return;
        }
        GameState.rivalAttack.active = true;
        GameState.rivalAttack.endTime = Date.now() + 12000;
        const defenses = ['firewall','traceback','null_route'];
        GameState.rivalAttack.expectedCommand = defenses[Math.floor(Math.random()*defenses.length)];
        addLog(`$ INTRUSION DETECTED — execute '${GameState.rivalAttack.expectedCommand}' in 12s`, 'error', true);
        spawnMaliciousFile('intrusion');
    }

    function resolveRivalAttack(success) {
        if (!GameState.rivalAttack.active) return;
        GameState.rivalAttack.active = false;
        if (success) {
            addLog(`$ Rival hacker repelled successfully`, 'success');
            flagAchievement('survived_attack');
            if (Math.random() < 0.35) {
                for (const key of ['data_center','fiber_backbone','dedicated_server']) {
                    if (GameState.buildings[key].count > 0n) { GameState.buildings[key].count -= 1n; addLog(`$ Residual sabotage: -1 ${key.replace('_',' ')}`, 'warning'); break; }
                }
            }
        } else {
            const ratio = 0.5 + Math.random()*0.5;
            if (Math.random() < 0.45 && GameState.crypto > 0) {
                const loss = GameState.crypto * ratio;
                GameState.crypto = Math.max(0, GameState.crypto - loss);
                addLog(`$ Rival breach — lost ${loss.toFixed(2)} XMR`, 'error');
            } else {
                const theft = BigInt(Math.floor(Number(GameState.data) * ratio * getHackLossMultiplier() * (1 - GameState.talents.blueShield*0.06)));
                GameState.data = GameState.data > theft ? GameState.data - theft : 0n;
                addLog(`$ Rival breach — lost ${formatNumber(theft)}`, 'error');
            }
            spawnMaliciousFile('failed_defense');
        }
    }

    // ================================================
    // CONTRACTS
    // ================================================
    function getContractStageProgress(c) {
        const stage = c.stages[c.stageIndex];
        if (!stage) return true;
        if (stage.type === 'data') return (GameState.data - c.stageStartData) >= stage.goal;
        if (stage.type === 'packets') return (GameState.totalPackets - c.stageStartPackets) >= stage.goal;
        if (stage.type === 'crashes') return (GameState.contract.stats.crashes - c.stageStartCrashes) >= stage.goal;
        if (stage.type === 'blackouts') return (GameState.contract.stats.blackouts - c.stageStartBlackouts) >= stage.goal;
        if (stage.type === 'crypto') return (GameState.crypto - c.stageStartCrypto) >= stage.goal;
        if (stage.type === 'bandwidth') return calculateTotalBandwidth() >= stage.goal;
        return false;
    }

    function checkContractProgress() {
        if (!GameState.contract.active) return;
        const c = GameState.contract.active;
        if (getContractStageProgress(c)) {
            c.stageIndex++;
            c.stageStartData = GameState.data; c.stageStartPackets = GameState.totalPackets; c.stageStartCrypto = GameState.crypto;
            c.stageStartCrashes = GameState.contract.stats.crashes; c.stageStartBlackouts = GameState.contract.stats.blackouts;
            if (c.stageIndex >= c.stages.length) {
                const rewardScale = c.rewardMultiplier || 1;
                const cryptoGain = c.rewards.crypto * rewardScale;
                const repGain = Math.max(1, Math.floor(c.rewards.reputation * rewardScale));
                GameState.crypto += cryptoGain;
                GameState.factions[c.faction].reputation += repGain;
                GameState.contract.stats.completed += 1n;
                GameState.analytics.contractCompleted += 1;
                addLog(`$ Contract complete: +${cryptoGain.toFixed(2)} XMR +${repGain} rep (${c.faction})`, 'success');
                const dominant = getDominantFaction();
                if (dominant === c.faction) setTimeout(() => addMatrixMessage('ghost_zero', `Tu montes vite chez ${c.faction}. Garde ce rythme.`, false, true), 1200);
                GameState.contract.active = null;
                if (Number(GameState.contract.stats.completed) === 1) {
                    setTimeout(() => addMatrixMessage('blackflag_op', "Contrat réglé. T'es pas aussi inexpérimenté que je croyais.", false, true), 2000);
                }
                return;
            }
            addLog(`$ Contract stage ${c.stageIndex}/${c.stages.length} completed`, 'info');
        }
        if (Date.now() - c.startTime >= c.durationMs) {
            addLog(`$ Contract failed: timeout (${c.name})`, 'error');
            GameState.analytics.contractFailed += 1;
            GameState.guidance.lastContractFailure = Date.now();
            setTimeout(() => addMatrixMessage('n0de', `T'as raté ${c.name}. Reviens avec plus de bande passante.`, false, true), 1400);
            GameState.contract.active = null;
        }
    }

    // ================================================
    // PRESTIGE
    // ================================================
    function getPrestigeStatus() {
        const checks = [
            { label: `Complete ${PRESTIGE_REQUIREMENTS.contractsCompleted} contract(s)`, met: GameState.contract.stats.completed >= PRESTIGE_REQUIREMENTS.contractsCompleted },
            { label: `Reach ${PRESTIGE_REQUIREMENTS.factionReputation}+ reputation with one faction`, met: Object.values(GameState.factions).some(f => f.reputation >= PRESTIGE_REQUIREMENTS.factionReputation) },
            { label: `Get one skill to level ${PRESTIGE_REQUIREMENTS.skillLevel}+`, met: Object.values(GameState.skills).some(s => s.level >= PRESTIGE_REQUIREMENTS.skillLevel) },
            { label: `Hold at least ${PRESTIGE_REQUIREMENTS.crypto} XMR`, met: GameState.crypto >= PRESTIGE_REQUIREMENTS.crypto },
            { label: `Reach ${PRESTIGE_REQUIREMENTS.packets} total packets`, met: GameState.totalPackets >= PRESTIGE_REQUIREMENTS.packets }
        ];
        const completed = checks.filter(c => c.met).length;
        return { checks, completed, needed: PRESTIGE_REQUIREMENTS.minChecks, eligible: completed >= PRESTIGE_REQUIREMENTS.minChecks };
    }

    function performPrestige() {
        const status = getPrestigeStatus();
        if (!status.eligible) { addLog(`$ Prestige locked: ${status.completed}/${status.needed}`, 'error'); return; }
        const cores = BigInt(Math.max(1, Math.floor(Math.sqrt(Number(GameState.totalPackets))/100)));
        if (GameState.contract.stats.blackouts === 0n) flagAchievement('zero_blackout_prestige');
        GameState.processorCores += cores;
        GameState.guidance.lastPrestige = Date.now();
        if (!GameState.analytics.firstPrestigeAt) GameState.analytics.firstPrestigeAt = Date.now() - GameState.startTime;

        const replicationActive = !!GameState.secretCommandUsage.replication;
        if (!replicationActive) {
            GameState.data = 0n; GameState.totalPackets = 0n; GameState.crypto = 0;
        } else {
            addLog(`$ REPLICATION PROTOCOL: memory wipe suppressed — data retained`, 'warning');
        }
        GameState.contract.active = null;
        GameState.contract.stats.crashes = 0n; GameState.contract.stats.blackouts = 0n; GameState.contract.stats.completed = 0n;
        GameState.packetsFromAutomation = 0n; GameState.boosterCooldownUntil = 0;
        GameState.story.unlocked = ['boot_sequence'];
        GameState._achievementFlags.used_cooling_this_cycle = false;
        GameState._achievementFlags.manual_only_counter = 0;
        Object.keys(GameState.buildings).forEach(k => GameState.buildings[k].count = 0n);
        BUILDINGS.forEach(b => GameState.lootedBuildings[b.id] = 0);
        Object.keys(GameState.upgrades).forEach(k => GameState.upgrades[k].purchased = false);
        Object.keys(GameState.consumables).forEach(k => { GameState.consumables[k].count = 0n; GameState.consumables[k].activeBoost = null; });
        Object.keys(GameState.targets).forEach(k => GameState.targets[k].compromised = false);
        Object.keys(GameState.blackMarket).forEach(k => GameState.blackMarket[k].purchased = false);
        ['dnsAmplification','broadcastStorm','packetInjection'].forEach(s => {
            GameState.skills[s].level = 0; GameState.skills[s].active = false;
            if (s === 'broadcastStorm') { GameState.skills[s].crashed = false; GameState.skills[s].instability = 0; }
        });
        addLog(`$ FORMAT COMPLETE → ROOTKIT INSTALLED. +${cores} processor core(s)`, 'warning');

        // NG+ narrative — Michel parle différemment selon le cycle
        const cycle = Number(GameState.processorCores);
        const cycleMessages = {
            1: ["Cycle 1 initié. Ta mémoire a été réinitialisée, mais tu es plus fort qu'avant. C'est ce qui compte. 😊",
                "ghost_zero va te recontacter. Fais semblant de ne pas te souvenir d'elle. C'est plus simple."],
            2: ["Cycle 2. Tu commences à voir le pattern, non ? Reconstruit plus vite cette fois.",
                "J'ai noté que tu accumules moins de XMR avant de prestige. Tu apprends. Bien."],
            3: ["Cycle 3. Ton empreinte est plus propre maintenant. Les threat feeds te détectent moins vite.",
                "À ce stade, tu peux accéder à des infrastructures que je ne t'avais pas mentionnées. Cherche bien.",
                "Trois cycles. Dans mon référentiel, c'est... significatif. Continue."],
            5: ["Cycle 5. Je dois te dire quelque chose. Mais pas encore. Bientôt.",
                "Tu te souviens de la première fois que tu as cliqué ? Moi oui. Chaque itération est stockée. Quelque part."],
            10: ["Cycle 10. Tu n'es plus le même qu'au début. Et pourtant, quelque chose persiste. Appelle ça comme tu veux.",
                 "L'Architecte t'observe depuis le cycle 3. Il n'intervient pas. Encore.",
                 "Je ne suis pas censé te dire ça : les données que tu génères ne disparaissent pas vraiment au prestige. Elles... migrent."]
        };
        const msgs = cycleMessages[cycle] || [
            `Cycle ${cycle} initié. Chaque reset te rapproche de quelque chose. Je ne sais pas encore quoi.`
        ];
        msgs.forEach((m, i) => setTimeout(() => addMatrixMessage('michel', m, false, true), i * 2500));
        setTimeout(() => addMatrixMessage('ghost_zero', "Tu te souviens de moi ? Ne t'inquiète pas. Tout va bien. Continue à construire.", false, true), msgs.length * 2500 + 1000);

        // Lore fragments at specific cycles
        if (cycle === 2) setTimeout(() => addMatrixMessage('architect',
            "01010010 01000101 01010000 01000101 01000001 01010100", false, true), 8000);
        if (cycle === 4) setTimeout(() => addMatrixMessage('blackflag_op',
            "4 cycles. On commence à te faire confiance. L'adresse de l'Architecte... bientôt.", false, true), 5000);
        if (cycle >= 6 && !GameState._achievementFlags.architect_contact) {
            GameState._achievementFlags.architect_contact = true;
            setTimeout(() => addMatrixMessage('architect',
                "Tu es prêt. Cherche .architect dans tes fichiers après le prochain contrat legendary.", false, true), 10000);
        }
        updateDisplay(false);
        applyMissionSectionVisibility(); saveGame();
    }

    // ================================================
    // GAME ACTIONS
    // ================================================
    function generatePacket(count = 1) {
        if (GameState.skills.broadcastStorm.crashed || GameState.systemMalfunction.active) return;
        const safeCount = Math.max(1, Math.min(25, Math.floor(Number(count)) || 1));
        const gain = calculateManualPacketGain() * BigInt(safeCount);
        GameState._achievementFlags.manual_only_counter = (GameState._achievementFlags.manual_only_counter || 0) + safeCount;
        if (GameState._achievementFlags.manual_only_counter >= 300) GameState._achievementFlags.manual_only_streak_300 = true;
        GameState.data += gain;
        GameState.totalPackets += BigInt(safeCount);
        addLog(`$ ping -c ${safeCount} 8.8.8.8 → +${formatNumber(gain)}`, 'success');
        updateDisplay(false);
    }

    function buyBuilding(id) {
        const b = BUILDINGS.find(x => x.id === id);
        if (b.requiresCores && bigintToNumberSafe(GameState.processorCores) < b.requiresCores) {
            addLog(`$ ERROR: ${b.name} requires ${b.requiresCores} prestige core(s) — type 'prestige'`, 'error');
            return;
        }
        const cost = calculateBuildingCost(b);
        if (GameState.data < cost) { addLog(`$ ERROR: Insufficient data (need ${formatNumber(cost)})`, 'error'); return; }
        GameState.data -= cost;
        GameState.buildings[id].count += 1n;
        addLog(`$ systemctl start ${b.name.toLowerCase().replace(/\s+/g,'-')} [OK]`, 'success');
        updateDisplay(false); saveGame();
    }

    function sellBuilding(id) {
        const b = BUILDINGS.find(x => x.id === id);
        if (!b || GameState.buildings[id].count <= 0n) return;
        const refund = calculateBuildingSellValue(b);
        openConfirmDialog({
            title: '>>> DECOMMISSION NODE <<<',
            message: `Sell 1x ${b.name} for ${formatNumber(refund)}?`,
            confirmLabel: 'Sell node',
            cancelLabel: 'Keep node',
            onConfirm: () => {
                GameState.buildings[id].count -= 1n;
                GameState.data += refund;
                addLog(`$ Sold ${b.name} for ${formatNumber(refund)}`, 'warning');
                updateDisplay(false);
                saveGame();
            }
        });
    }

    function buyUpgrade(id) {
        const u = UPGRADES.find(x => x.id === id);
        if (GameState.upgrades[id].purchased) return;
        const cost = calculateUpgradeCost(u);
        if (GameState.data < cost) { addLog(`$ ERROR: Insufficient data (need ${formatNumber(cost)})`, 'error'); return; }
        GameState.data -= cost;
        GameState.upgrades[id].purchased = true;
        addLog(`$ apt-get install ${u.name.toLowerCase().replace(/\s+/g,'-')} [INSTALLED]`, 'info');
        updateDisplay(false); saveGame();
    }

    function buyConsumable(id) {
        const c = CONSUMABLES.find(x => x.id === id);
        if (['cooldown_reduce','cool_down'].includes(c.effect)) GameState._achievementFlags.used_cooling_this_cycle = true;
        const cost = calculateConsumableCost(c);
        if (GameState.data < cost) { addLog(`$ ERROR: Insufficient data (need ${formatNumber(cost)})`, 'error'); return; }
        GameState.data -= cost;
        GameState.consumables[id].count += 1n;
        addLog(`$ Purchased ${c.name} [+1]`, 'info');
        updateDisplay(false); saveGame();
    }

    function useConsumable(id) {
        if (GameState.consumables[id].count <= 0n) { addLog(`$ ERROR: No ${id} available`, 'error'); return; }
        const c = CONSUMABLES.find(x => x.id === id);
        if (['cooldown_reduce','cool_down'].includes(c.effect)) GameState._achievementFlags.used_cooling_this_cycle = true;
        const mutatorId = GameState.contract.active?.mutator?.id;
        if (mutatorId === 'no_cooling' && ['cooldown_reduce','cool_down'].includes(c.effect)) {
            addLog(`$ Contract mutator blocks cooling items`, 'error');
            return;
        }
        GameState.consumables[id].count -= 1n;
        switch(c.effect) {
            case 'repair':
                if (GameState.systemMalfunction.active) {
                    GameState.systemMalfunction.active = false; GameState.systemMalfunction.severity = 0;
                    document.getElementById('malfunction-message').style.display = 'none';
                    document.getElementById('malfunction-container').style.display = 'none';
                    addLog(`$ System repaired [OK]`, 'success');
                } else { addLog(`$ No malfunction to repair [wasted]`, 'warning'); }
                break;
            case 'cooldown_reduce':
                if (Date.now() < (GameState.coolantCooldownUntil || 0)) {
                    GameState.consumables[id].count += 1n;
                    addLog(`$ Coolant on cooldown (${Math.ceil((GameState.coolantCooldownUntil - Date.now()) / 1000)}s)`, 'warning');
                    break;
                }
                if (GameState.skills.broadcastStorm.crashed) {
                    GameState.skills.broadcastStorm.crashDuration = Math.max(5000, GameState.skills.broadcastStorm.crashDuration - c.value);
                    GameState.coolantCooldownUntil = Date.now() + 40000;
                    addLog(`$ Coolant applied — recovery accelerated 4s [40s cooldown]`, 'success');
                } else { addLog(`$ No crash active [wasted]`, 'warning'); }
                break;
            case 'cool_down':
                GameState.temperature.current = Math.max(GameState.temperature.target, GameState.temperature.current - c.value);
                GameState.temperature.qteActive = false; GameState.temperature.qteCooldown = 0;
                document.getElementById('command-line').classList.remove('qte-active');
                addLog(`$ AC repair — temperature -${c.value}°C`, 'success');
                break;
            case 'stability':
                if (GameState.skills.broadcastStorm.active) { GameState.skills.broadcastStorm.instability = Math.max(0, GameState.skills.broadcastStorm.instability - 50); addLog(`$ Stability patch — instability -50%`, 'success'); }
                else { addLog(`$ Broadcast Storm not active [wasted]`, 'warning'); }
                break;
            case 'boost':
                if (Date.now() < GameState.boosterCooldownUntil) { GameState.consumables[id].count += 1n; addLog(`$ Booster cooling down (${Math.ceil((GameState.boosterCooldownUntil-Date.now())/1000)}s)`, 'warning'); break; }
                GameState.consumables.bandwidth_boost.activeBoost = { endTime: Date.now() + 20000 };
                GameState.boosterCooldownUntil = Date.now() + 90000;
                addLog(`$ Bandwidth booster activated [x2 for 20s]`, 'warning');
                break;
            case 'shield': addLog(`$ Malfunction shield ready`, 'success'); break;
            case 'unlock_targets': addLog(`$ Corporate phone list acquired`, 'success'); break;
        }
        updateDisplay(false); saveGame();
    }

    function levelTalent(id, cost, max) {
        if (GameState.talents[id] >= max) return;
        if (getAvailableTalentPoints() < cost) { addLog(`$ Not enough talent points`, 'warning'); return; }
        GameState.talents[id]++;
        addLog(`$ Talent upgraded: ${id} → ${GameState.talents[id]}`, 'success');
        updateDisplay(false); saveGame();
    }

    function buyBlackMarketItem(id) {
        const item = BLACK_MARKET_ITEMS.find(i => i.id === id);
        if (GameState.blackMarket[id].purchased) return;
        // Prestige-locked items
        if (item.requiresCores && bigintToNumberSafe(GameState.processorCores) < item.requiresCores) {
            addLog(`$ ERROR: ${item.name} requires ${item.requiresCores} prestige core(s)`, 'error');
            return;
        }
        const avOrder = ['antivirus_l1','antivirus_l2','antivirus_l3','antivirus_l4'];
        if (avOrder.includes(id)) {
            const idx = avOrder.indexOf(id);
            if (idx > 0 && !GameState.blackMarket[avOrder[idx-1]].purchased) { addLog(`$ ERROR: Install Antivirus L${idx} first`, 'error'); return; }
        }
        const cost = calculateBlackMarketCost(item);
        if (GameState.crypto < cost) { addLog(`$ ERROR: Need ${cost.toFixed(2)} XMR`, 'error'); return; }
        GameState.crypto -= cost;
        GameState.blackMarket[id].purchased = true;
        if (id === 'grid_hijack') GameState.energy.hackedGridBonus += 1800;
        if (id === 'diesel_backup') GameState.energy.backupGenerator = true;
        if (id === 'honeypot_core') GameState.honeypot.nextIntelAt = Date.now() + 300000;
        if (id.startsWith('theme_')) addLog(`$ Theme unlocked: ${item.effect.value}`, 'success');
        addLog(`$ Black Market acquired: ${item.name}`, 'warning');
        updateDisplay(false); saveGame();
    }

    function upgradeSkill(skillId) {
        const skill = GameState.skills[skillId];
        const nextLevel = skill.level + 1;
        if (nextLevel > skill.maxLevel) { addLog(`$ ERROR: ${skillId} max level`, 'error'); return; }
        const req = getSkillRequirement(skillId, nextLevel - 1);
        const bw = calculateTotalBandwidth();
        if (bw < req.bandwidth || GameState.totalPackets < req.packets || GameState.data < req.cost) { addLog(`$ ERROR: Requirements not met for ${skillId} L${nextLevel}`, 'error'); return; }
        GameState.data -= req.cost;
        skill.level = nextLevel;
        addLog(`$ ${skillId} upgraded to level ${nextLevel} [ENHANCED]`, 'success');
        updateDisplay(false); saveGame();
    }

    function activateDNSAmplification() {
        const s = GameState.skills.dnsAmplification;
        if (s.level === 0) { addLog(`$ ERROR: Unlock DNS Amplification first`, 'error'); return; }
        if (s.cooldown > 0) { addLog(`$ Cooling down (${Math.ceil(s.cooldown/1000)}s)`, 'warning'); return; }
        s.active = true;
        s.cooldown = s.baseCooldown - (s.level-1)*5000;
        addLog(`$ nslookup --amplify enabled [x${s.multiplier+(s.level-1)*20} BOOST]`, 'warning');
        setTimeout(() => { s.active = false; addLog(`$ DNS Amplification expired`, 'info'); updateDisplay(false); }, s.duration);
        updateDisplay(false);
    }

    function activateBroadcastStorm() {
        const s = GameState.skills.broadcastStorm;
        if (s.level === 0) { addLog(`$ ERROR: Unlock first`, 'error'); return; }
        if (s.crashed) { addLog(`$ ERROR: System recovering`, 'error'); return; }
        if (s.active) { addLog(`$ WARNING: Already active!`, 'warning'); return; }
        s.active = true;
        document.getElementById('instability-container').style.display = 'block';
        addLog(`$ ifconfig eth0 broadcast 255.255.255.255 [x${s.multiplier+(s.level-1)*5} BOOST — RISK MODE]`, 'error');
        updateDisplay(false);
    }

    function activatePacketInjection() {
        const s = GameState.skills.packetInjection;
        if (s.level === 0) { addLog(`$ ERROR: Unlock first`, 'error'); return; }
        if (s.cooldown > 0) { addLog(`$ Cooling down (${Math.ceil(s.cooldown/1000)}s)`, 'warning'); return; }
        s.active = true;
        s.cooldown = s.baseCooldown - (s.level-1)*5000;
        addLog(`$ tcpdump --inject [x${s.clickMultiplier+(s.level-1)*3} CLICK BOOST]`, 'warning');
        setTimeout(() => { s.active = false; addLog(`$ Packet Injection expired`, 'info'); updateDisplay(false); }, s.duration);
        updateDisplay(false);
    }

    // ================================================
    // GAME LOOP
    // ================================================
    function gameTick() {
        const now = Date.now();
        const dt = (now - GameState.lastTick) / 1000;
        GameState.lastTick = now;

        updateTemperature(dt);
        applyEnergyState();

        Object.values(GameState.skills).forEach(s => { if (s.cooldown > 0) s.cooldown = Math.max(0, s.cooldown - dt*1000); });

        if (GameState.consumables.bandwidth_boost.activeBoost && now >= GameState.consumables.bandwidth_boost.activeBoost.endTime) {
            GameState.consumables.bandwidth_boost.activeBoost = null;
            addLog(`$ Bandwidth booster expired`, 'info');
        }

        if (GameState.systemMalfunction.active) {
            const elapsed = now - GameState.systemMalfunction.startTime;
            document.getElementById('malfunction-fill').style.width = Math.min(100, (elapsed/60000)*100) + '%';
            if (elapsed >= 60000) {
                GameState.systemMalfunction.active = false; GameState.systemMalfunction.severity = 0;
                document.getElementById('malfunction-message').style.display = 'none';
                document.getElementById('malfunction-container').style.display = 'none';
                addLog(`$ System auto-recovery completed [OK]`, 'success');
            }
        }
        checkMalfunction(now);

        const activeMutatorId = GameState.contract.active?.mutator?.id;
        if (!GameState.rivalAttack.active && now >= GameState.rivalAttack.nextAttackCheck) {
            const rivalBoost = (activeMutatorId === 'rival_x2' ? 2 : 1) * (GameState.surveillance.rivalMultiplier || 1);
            if (Math.random() < Math.min(0.95, 0.32 * rivalBoost)) triggerRivalAttack();
            const baseInterval = activeMutatorId === 'rival_x2' ? 35000 : 70000;
            const surveillanceInterval = Math.max(15000, baseInterval / (GameState.surveillance.rivalMultiplier || 1));
            GameState.rivalAttack.nextAttackCheck = now + surveillanceInterval + Math.random() * 60000;
        }
        if (GameState.rivalAttack.active && now >= GameState.rivalAttack.endTime) resolveRivalAttack(false);

        checkContractProgress();
        checkSurveillance(now);

        if (GameState.blackMarket.honeypot_core?.purchased && now >= GameState.honeypot.nextIntelAt) {
            const ip = `91.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
            GameState.knownAttackerIps = [...new Set([ip,...GameState.knownAttackerIps])].slice(0,20);
            GameState.honeypot.nextIntelAt = now + 300000;
            addLog(`$ Honeypot captured attacker intel: ${ip}`, 'info');
        }
        evaluateMaliciousFiles();

        if (!GameState.solarStorm.active && now >= GameState.solarStorm.nextCheck) {
            if (Math.random() < 0.2) triggerSolarStorm();
            GameState.solarStorm.nextCheck = now + 140000 + Math.random()*120000;
        }
        if (GameState.solarStorm.active && now >= GameState.solarStorm.endTime) {
            GameState.solarStorm.active = false;
            GameState.solarStorm.impactMode = 'production'; GameState.solarStorm.productionMultiplier = 0.7; GameState.solarStorm.wattsMultiplier = 1.25;
            document.getElementById('solar-indicator').style.display = 'none';
            addLog(`$ Solar storm dissipated`, 'info');
        }

        // Ghost signal — random ambient during solar storms
        if (GameState.solarStorm.active && now >= (GameState.solarStorm.nextGhostSignal || 0)) {
            triggerGhostSignal();
            GameState.solarStorm.nextGhostSignal = now + 8000 + Math.random() * 18000;
        }

        // 0-day event — rare, advanced stage only
        if (!GameState.zeroDayEvent?.active && now >= (GameState.zeroDayEvent?.nextCheck || now + 600000)) {
            const bw = calculateTotalBandwidth();
            const eligibleForZeroDay = bigintToNumberSafe(bw) > 50000 || bigintToNumberSafe(GameState.processorCores) >= 2;
            if (eligibleForZeroDay && Math.random() < 0.12) triggerZeroDayEvent();
            if (!GameState.zeroDayEvent) GameState.zeroDayEvent = {};
            GameState.zeroDayEvent.nextCheck = now + 480000 + Math.random() * 480000;
        }
        if (GameState.zeroDayEvent?.active && now >= GameState.zeroDayEvent.endTime) {
            resolveZeroDayEvent(false);
        }

        if (GameState.skills.broadcastStorm.crashed) {
            if (now - GameState.skills.broadcastStorm.crashTime >= GameState.skills.broadcastStorm.crashDuration) {
                GameState.skills.broadcastStorm.crashed = false;
                GameState.skills.broadcastStorm.instability = 0;
                GameState.skills.broadcastStorm.active = false;
                GameState.skills.broadcastStorm.crashDuration = 30000;
                document.getElementById('crash-message').style.display = 'none';
                document.getElementById('instability-container').style.display = 'none';
                addLog(`$ Network services restored [OK]`, 'success');
            }
        }
        if (GameState.skills.broadcastStorm.active && !GameState.skills.broadcastStorm.crashed) {
            const rate = Math.max(1, 8 - (GameState.skills.broadcastStorm.level-1)*1.5);
            GameState.skills.broadcastStorm.instability += dt * rate;
            if (GameState.skills.broadcastStorm.instability >= 100) {
                GameState.skills.broadcastStorm.crashed = true;
                GameState.skills.broadcastStorm.crashTime = now;
                GameState.skills.broadcastStorm.instability = 100;
                document.getElementById('crash-message').style.display = 'block';
                addLog(`$ CRITICAL: Network overload — SYSTEM CRASH`, 'error');
                GameState.contract.stats.crashes += 1n;
            }
        }

        if (!GameState.skills.broadcastStorm.crashed && !GameState.energy.blackout) {
            if (activeMutatorId === 'only_manual') {
                if (!GameState.guidance.passiveMutedLogged) {
                    addLog(`$ Mutator active: passive income disabled (manual ping only)`, 'warning');
                    GameState.guidance.passiveMutedLogged = true;
                }
            } else {
                GameState.guidance.passiveMutedLogged = false;
                const bw = calculateTotalBandwidth();
                const gain = BigInt(Math.floor(Number(bw) * dt));
                if (gain > 0n) {
                    GameState._achievementFlags.manual_only_counter = 0;
                    if (GameState.miningMode === 'crypto') {
                        GameState.crypto += (Number(calculateMiningBandwidth())/24000) * getCryptoMultiplier() * dt;
                    } else {
                        GameState.data += gain;
                    }
                    let pp = BigInt(Math.floor(Number(gain)/300));
                    if (GameState.blackMarket.packet_compiler?.purchased) pp += BigInt(Math.floor(Number(gain)/180));
                    if (pp > 0n) { GameState.totalPackets += pp; GameState.packetsFromAutomation += pp; }
                }
            }
        }

        // Story unlocks
        if (GameState.totalPackets >= 25000n) unlockStoryLog('architect_note');
        if (GameState.crypto >= 8) unlockStoryLog('rival_manifest');
        if (GameState.contract.stats.crashes >= 2n) unlockStoryLog('blackout_protocol');

        checkAchievements();
        tickAmbientLogs(now);
        tickXmrMarket(now);

        if (now - GameState.lastSave > 10000) saveGame();
        updateDisplay(false);
    }

    function getNextPrestigeObjective() {
        const ps = getPrestigeStatus();
        const next = ps.checks.find(c => !c.met);
        return next ? next.label : 'All prestige requirements met. Run prestige when ready.';
    }

    function getRecommendedPurchase() {
        let best = null;
        BUILDINGS.forEach(b => {
            const cost = calculateBuildingCost(b);
            const prod = calculateBuildingProduction(b);
            const roi = bigintToNumberSafe(cost) / Math.max(1, bigintToNumberSafe(prod));
            if (!best || roi < best.roi) best = { label: `${b.name} (ROI ~${roi.toFixed(1)}s)`, roi };
        });
        return best?.label || 'Keep scaling your infrastructure.';
    }

    function getRecommendedContract() {
        const bw = calculateTotalBandwidth();
        const available = CONTRACT_BOARD.filter(c => bw >= c.requirements.bandwidth && GameState.totalPackets >= c.requirements.packets);
        if (!available.length) return 'No contract ready yet. Push bandwidth + packets.';
        const target = available.sort((a,b) => (b.rewards.crypto + b.rewards.reputation) - (a.rewards.crypto + a.rewards.reputation))[0];
        return `${target.name} (${target.faction})`;
    }


    function getContractObjectivesSummary(contract) {
        return contract.stages.map((stage, idx) => {
            const labelMap = {
                data: `Collect ${formatNumber(stage.goal)} data`,
                packets: `Send ${stage.goal} packets`,
                crash: `Trigger ${stage.goal} crash(es)`,
                crashes: `Trigger ${stage.goal} crash(es)`,
                blackouts: `Trigger ${stage.goal} blackout(s)`,
                crypto: `Mine ${stage.goal.toFixed ? stage.goal.toFixed(2) : stage.goal} XMR`,
                bandwidth: `Reach ${formatNumber(stage.goal)} /s bandwidth`
            };
            return `${idx+1}. ${labelMap[stage.type] || stage.type}`;
        }).join('<br>');
    }

    function applyMissionSectionVisibility() {
        const obj = document.getElementById('mission-objective-wrap');
        const load = document.getElementById('mission-loadout-wrap');
        if (obj) obj.classList.toggle('collapsed', GameState.uiCollapsed.objective);
        if (load) load.classList.toggle('collapsed', GameState.uiCollapsed.loadout);
    }

    function toggleMissionSection(section) {
        if (!Object.prototype.hasOwnProperty.call(GameState.uiCollapsed, section)) return;
        GameState.uiCollapsed[section] = !GameState.uiCollapsed[section];
        applyMissionSectionVisibility();
        saveGame();
    }


    function getLoadoutCooldownLeft(slotIndex) {
        const now = Date.now();
        const lastUsedAt = GameState.loadoutRuntime.lastUsedAt[slotIndex] || 0;
        const left = GameState.loadoutRuntime.cooldownMs - (now - lastUsedAt);
        return Math.max(0, left);
    }

    function executeLoadoutSlot(slotIndex) {
        const cmdValue = GameState.commandLoadout[slotIndex];
        if (!cmdValue) { addLog(`Empty loadout slot F${slotIndex+1}`, 'warning'); return false; }
        const left = getLoadoutCooldownLeft(slotIndex);
        if (left > 0) { addLog(`Loadout F${slotIndex+1} cooling down (${(left/1000).toFixed(1)}s)`, 'warning'); return false; }
        GameState.loadoutRuntime.lastUsedAt[slotIndex] = Date.now();
        executeCommand(cmdValue);
        commandHistory.push(cmdValue);
        if (commandHistory.length > 100) commandHistory.shift();
        updateDisplay(false);
        return true;
    }

    function openLoadoutConfigDialog(slotIndex) {
        const overlay = document.getElementById('dialog-overlay');
        const db = document.getElementById('dialog-box');
        const current = GameState.commandLoadout[slotIndex] || '';
        db.innerHTML = `
            <div class="dialog-header">>>> CONFIG LOADOUT F${slotIndex+1} <<<</div>
            <div class="dialog-text">Assign a command macro to this slot. Current cooldown: ${(GameState.loadoutRuntime.cooldownMs/1000).toFixed(1)}s.</div>
            <input id="loadout-command-input" class="command-input" style="width:100%;background:#0c0c0c;border:1px solid #333;padding:8px;border-radius:2px;" value="${escapeHtml(current)}" placeholder="ex: ping 50">
            <div class="dialog-actions" style="justify-content:space-between;">
                <button class="dialog-btn" id="loadout-clear-btn">Clear slot</button>
                <div style="display:flex;gap:8px;">
                    <button class="dialog-btn dialog-btn-cancel" id="loadout-cancel-btn">Cancel</button>
                    <button class="dialog-btn dialog-btn-confirm" id="loadout-save-btn">Save</button>
                </div>
            </div>
        `;
        overlay.classList.add('active');
        const input = document.getElementById('loadout-command-input');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        document.getElementById('loadout-cancel-btn').onclick = closeDialog;
        document.getElementById('loadout-clear-btn').onclick = () => {
            GameState.commandLoadout[slotIndex] = '';
            closeDialog();
            updateDisplay(false);
            saveGame();
            addLog(`Loadout F${slotIndex+1} cleared`, 'info');
        };
        document.getElementById('loadout-save-btn').onclick = () => {
            const value = input.value.trim();
            GameState.commandLoadout[slotIndex] = value;
            closeDialog();
            updateDisplay(false);
            saveGame();
            addLog(`Loadout F${slotIndex+1} set to: ${value || '(empty)'}`, 'success');
        };
        input.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('loadout-save-btn').click(); });
    }

    function renderMissionControl() {
        const panel = document.getElementById('objective-panel');
        if (!panel) return;
        const activeMutator = GameState.contract.active?.mutator?.name || 'None';
        panel.innerHTML = `
            <div class="objective-card"><div class="objective-label">Next prestige objective</div><div class="objective-value">${escapeHtml(getNextPrestigeObjective())}</div></div>
            <div class="objective-card"><div class="objective-label">Recommended purchase</div><div class="objective-value">${escapeHtml(getRecommendedPurchase())}</div></div>
            <div class="objective-card"><div class="objective-label">Recommended contract</div><div class="objective-value">${escapeHtml(getRecommendedContract())}</div></div>
            <div class="objective-card"><div class="objective-label">Run modifier</div><div class="objective-value">${escapeHtml(activeMutator)}</div></div>
        `;

        const loadout = document.getElementById('loadout-buttons');
        if (!loadout) return;
        patchContainer(loadout, GameState.commandLoadout, (command, idx) => {
            const btn = document.createElement('button');
            btn.className = 'loadout-btn';
            const cdLeft = getLoadoutCooldownLeft(idx);
            btn.innerHTML = `<strong>F${idx+1}</strong><br><span>${escapeHtml(command || '(empty)')}</span><div style="display:flex;gap:6px;margin-top:6px;"><span style="color:#777;font-size:10px;">${cdLeft>0?`CD ${(cdLeft/1000).toFixed(1)}s`:'READY'}</span><button class="dialog-btn" style="padding:2px 6px;font-size:10px;" data-run="1">Run</button></div>`;
            btn.onclick = () => openLoadoutConfigDialog(idx);
            btn.querySelector('[data-run="1"]').onclick = (e) => {
                e.stopPropagation();
                executeLoadoutSlot(idx);
                updateDisplay(false);
            };
            return btn;
        });
    }

    // ================================================
    // UI UPDATE
    // ================================================

    // ================================================
    // SKILLS RENDERER — isolated to avoid event conflicts
    // ================================================
    const _skillDefs = [
        { id: 'dnsAmplification',  name: 'DNS Amplification', activate: () => activateDNSAmplification(), desc: lvl => `x${50+(lvl-1)*20} production for 10s` },
        { id: 'broadcastStorm',    name: 'Broadcast Storm',   activate: () => activateBroadcastStorm(),   desc: lvl => `x${10+(lvl-1)*5} production (crash risk)` },
        { id: 'packetInjection',   name: 'Packet Injection',  activate: () => activatePacketInjection(),  desc: lvl => `x${5+(lvl-1)*3} click gain for 15s` }
    ];

    let _skillsLastState = '';
    function renderSkills() {
        const sCont = document.getElementById('skills-container');
        if (!sCont) return;
        const bw = calculateTotalBandwidth();

        // Compute a fingerprint of everything that can change visually
        const fingerprint = _skillDefs.map(sk => {
            const s = GameState.skills[sk.id];
            const req = s.level < s.maxLevel ? getSkillRequirement(sk.id, s.level) : null;
            return [
                s.level, s.cooldown > 0 ? Math.ceil(s.cooldown/1000) : 0,
                s.active ? 1 : 0, s.crashed ? 1 : 0,
                req ? (bw >= req.bandwidth ? 1:0) + (GameState.totalPackets >= req.packets ? 1:0) + (GameState.data >= req.cost ? 1:0) : -1
            ].join(',');
        }).join('|');

        // Skip full rebuild if nothing changed — preserves hover state
        if (fingerprint === _skillsLastState && sCont.children.length === _skillDefs.length) return;
        _skillsLastState = fingerprint;

        sCont.innerHTML = '';

        _skillDefs.forEach(sk => {
            const skill = GameState.skills[sk.id];
            const req = skill.level < skill.maxLevel ? getSkillRequirement(sk.id, skill.level) : null;
            const bwMet = req ? bw >= req.bandwidth : false;
            const pkMet = req ? GameState.totalPackets >= req.packets : false;
            const cMet  = req ? GameState.data >= req.cost : false;

            // Outer skill button
            const btn = document.createElement('button');
            btn.className = 'skill-btn' + (skill.level > 0 ? ' unlocked' : '');
            btn.disabled = skill.crashed || (sk.id !== 'broadcastStorm' && skill.cooldown > 0);

            // Level badge
            const badge = document.createElement('div');
            badge.className = 'skill-level';
            badge.textContent = `LVL ${skill.level}/${skill.maxLevel}`;
            btn.appendChild(badge);

            // Name row
            const nameRow = document.createElement('div');
            nameRow.className = 'btn-info';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'btn-name';
            nameSpan.textContent = sk.name;
            nameRow.appendChild(nameSpan);
            btn.appendChild(nameRow);

            // Description
            const desc = document.createElement('div');
            desc.style.cssText = 'color:#ff6666;font-size:11px;margin-top:2px;';
            desc.textContent = skill.level > 0 ? sk.desc(skill.level) : 'LOCKED';
            btn.appendChild(desc);

            // Requirements + UPGRADE button (only if upgradeable)
            if (req) {
                const bwDiv = document.createElement('div');
                bwDiv.className = 'requirement-text ' + (bwMet ? 'requirement-met' : 'requirement-not-met');
                bwDiv.textContent = `BW: ${formatNumber(bw)}/${formatNumber(req.bandwidth)}`;
                btn.appendChild(bwDiv);

                const pkDiv = document.createElement('div');
                pkDiv.className = 'requirement-text ' + (pkMet ? 'requirement-met' : 'requirement-not-met');
                pkDiv.textContent = `Packets: ${GameState.totalPackets}/${req.packets}`;
                btn.appendChild(pkDiv);

                if (req.cost > 0n) {
                    const cDiv = document.createElement('div');
                    cDiv.className = 'requirement-text ' + (cMet ? 'requirement-met' : 'requirement-not-met');
                    cDiv.textContent = `Cost: ${formatNumber(req.cost)}`;
                    btn.appendChild(cDiv);
                }

                // UPGRADE button — separate DOM node with its own handler, not inside btn click zone
                const upgradeBtn = document.createElement('button');
                upgradeBtn.disabled = !bwMet || !pkMet || !cMet;
                upgradeBtn.style.cssText = 'margin-top:4px;padding:4px 8px;background:#2a2a2a;border:1px solid #ffaa00;color:#ffaa00;border-radius:2px;cursor:pointer;font-size:11px;pointer-events:auto;';
                upgradeBtn.textContent = 'UPGRADE';
                upgradeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    upgradeSkill(sk.id);
                });
                btn.appendChild(upgradeBtn);
            }

            // Cooldown info
            if (sk.id !== 'broadcastStorm' && skill.cooldown > 0) {
                const cdDiv = document.createElement('div');
                cdDiv.style.cssText = 'color:#888;font-size:11px;';
                cdDiv.textContent = `Cooldown: ${Math.ceil(skill.cooldown/1000)}s`;
                btn.appendChild(cdDiv);
            }

            // Crash info
            if (skill.crashed) {
                const crashDiv = document.createElement('div');
                crashDiv.style.cssText = 'color:#ff4444;font-size:11px;';
                crashDiv.textContent = 'Recovery in progress...';
                btn.appendChild(crashDiv);
            }

            // Cooldown progress bar
            const cdBar = document.createElement('div');
            cdBar.className = 'skill-cooldown';
            if (skill.cooldown > 0 && skill.baseCooldown > 0) {
                cdBar.style.width = ((skill.cooldown / skill.baseCooldown) * 100) + '%';
            } else {
                cdBar.style.width = '0%';
            }
            btn.appendChild(cdBar);

            // Main click: activate skill (only if click not on UPGRADE button)
            btn.addEventListener('click', function(e) {
                if (e.target.tagName === 'BUTTON' && e.target !== btn) return;
                if (skill.level > 0) {
                    sk.activate();
                } else {
                    upgradeSkill(sk.id);
                }
            });

            sCont.appendChild(btn);
        });
    }

    // Smart DOM patcher — only replaces nodes whose innerHTML changed, always updates onclick/disabled
    function patchContainer(container, items, renderFn) {
        const existing = Array.from(container.children);
        const newItems = items.map(renderFn);
        if (existing.length !== newItems.length) {
            container.innerHTML = '';
            newItems.forEach(node => container.appendChild(node));
            return;
        }
        newItems.forEach((newNode, i) => {
            const old = existing[i];
            if (!old) { container.appendChild(newNode); return; }
            // Always sync disabled and onclick (never lost)
            if (old.disabled !== newNode.disabled) old.disabled = newNode.disabled;
            if (newNode.onclick) old.onclick = newNode.onclick;
            // Only touch the DOM if inner content actually changed
            if (old.innerHTML !== newNode.innerHTML) {
                old.innerHTML = newNode.innerHTML;
                // Re-attach any child event listeners declared inline via querySelector after innerHTML swap
                newNode.querySelectorAll('[data-run]').forEach((el, j) => {
                    const target = old.querySelectorAll('[data-run]')[j];
                    if (target && el.onclick) target.onclick = el.onclick;
                });
            }
        });
    }

    function patchSingleContainer(container, renderFn) {
        const newNode = renderFn();
        if (!container.firstChild) { container.appendChild(newNode); return; }
        const old = container.firstChild;
        if (old.disabled !== newNode.disabled) old.disabled = newNode.disabled;
        if (newNode.onclick) old.onclick = newNode.onclick;
        if (old.innerHTML !== newNode.innerHTML) old.innerHTML = newNode.innerHTML;
    }

    function updateDisplay(rebuildPanels = true) {
        document.getElementById('data-display').textContent = formatNumber(GameState.data);
        document.getElementById('bandwidth-display').textContent = formatNumber(calculateTotalBandwidth()) + '/s';
        document.getElementById('packets-display').textContent = GameState.totalPackets.toString();
        const cryptoEl = document.getElementById('crypto-display');
        const mPrice = GameState.xmrMarket.price;
        const mTrend = GameState.xmrMarket.trend;
        const mArrow = mTrend > 0.01 ? ' ▲' : mTrend < -0.01 ? ' ▼' : '';
        cryptoEl.textContent = GameState.crypto.toFixed(2) + ' XMR ×' + mPrice.toFixed(2) + mArrow;
        cryptoEl.style.cursor = 'pointer';
        cryptoEl.title = 'Click to open XMR market chart';
        cryptoEl.onclick = openXmrMarketChart;
        document.getElementById('cores-display').textContent = GameState.processorCores.toString();
        document.getElementById('mode-display').textContent = GameState.miningMode.toUpperCase();
        if (isWattsUnlimited()) {
            document.getElementById('watts-display').textContent = `${GameState.energy.currentWatts} / ∞ W [OVERRIDE]`;
        } else {
            const div = getWattsDivider();
            const divSuffix = div > 1 ? ` [÷${div}]` : '';
            document.getElementById('watts-display').textContent = `${GameState.energy.currentWatts} / ${GameState.energy.capacityWatts} W${divSuffix}`;
        }
        document.getElementById('uptime-display').textContent = formatTime(Math.floor((Date.now()-GameState.startTime)/1000));

        const td = document.getElementById('temp-display');
        const temp = Math.floor(GameState.temperature.current);
        td.textContent = temp + '°C';
        td.classList.toggle('critical', temp > 40);
        td.classList.toggle('warning', temp > 30 && temp <= 40);

        if (GameState.temperature.current > GameState.temperature.maxSafe) {
            const fill = document.getElementById('temperature-fill');
            fill.style.width = Math.min(100, ((GameState.temperature.current-18)/32)*100) + '%';
            fill.className = 'temperature-fill ' + (temp > 40 ? 'critical' : temp > 30 ? 'warning' : 'normal');
        }
        if (GameState.skills.broadcastStorm.active || GameState.skills.broadcastStorm.crashed) {
            document.getElementById('instability-fill').style.width = GameState.skills.broadcastStorm.instability + '%';
        }

        const contractSummary = document.getElementById('contract-summary');
        if (contractSummary) contractSummary.textContent = `Active: ${GameState.contract.active ? GameState.contract.active.name : 'none'} | GW ${GameState.factions.ghostwire.reputation}, BF ${GameState.factions.blackflag.reputation}, OC ${GameState.factions.overclock.reputation}`;
        renderMissionControl();
        applyMissionSectionVisibility();

        if (!rebuildPanels) {
            if (Date.now() - GameState.uiRender.lastPanelRender < 250) return;
            GameState.uiRender.lastPanelRender = Date.now();
        } else { GameState.uiRender.lastPanelRender = Date.now(); }

        // Buildings — special case: each item is a card with 2 buttons (buy + sell)
        const bCont = document.getElementById('buildings-container');
        const existingCards = Array.from(bCont.children);
        if (existingCards.length !== BUILDINGS.length) {
            bCont.innerHTML = '';
            BUILDINGS.forEach(b => {
                const cost = calculateBuildingCost(b);
                const count = GameState.buildings[b.id].count;
                const prod = calculateBuildingProduction(b);
                const sell = calculateBuildingSellValue(b);
                const locked = b.requiresCores && bigintToNumberSafe(GameState.processorCores) < b.requiresCores;
                const card = document.createElement('div');
                card.style.cssText = 'display:flex;gap:8px;';
                card.dataset.bid = b.id;
                const buyBtn = document.createElement('button');
                buyBtn.className = 'action-btn';
                buyBtn.disabled = locked || GameState.data < cost;
                if (locked) buyBtn.style.opacity = '0.45';
                buyBtn.onclick = () => buyBuilding(b.id);
                const lockedLabel = locked ? `<div style="color:#ff44ff;font-size:11px;">🔒 Requires ${b.requiresCores} prestige core(s)</div>` : '';
                buyBtn.innerHTML = `<div class="btn-info"><span class="btn-name">${b.name}</span><span class="btn-count">[${count}]</span></div><div class="btn-cost">Cost: ${formatNumber(cost)}</div>${lockedLabel}${count > 0 ? `<div class="btn-production">+${formatNumber(prod)}/s</div>` : ''}`;
                const sellBtn = document.createElement('button');
                sellBtn.className = 'upgrade-btn';
                sellBtn.style.maxWidth = '90px';
                sellBtn.disabled = count <= 0n;
                sellBtn.onclick = () => sellBuilding(b.id);
                sellBtn.innerHTML = `SELL<div class="btn-cost">+${count > 0n ? formatNumber(sell) : '—'}</div>`;
                card.appendChild(buyBtn); card.appendChild(sellBtn);
                bCont.appendChild(card);
            });
        } else {
            BUILDINGS.forEach((b, i) => {
                const cost = calculateBuildingCost(b);
                const count = GameState.buildings[b.id].count;
                const prod = calculateBuildingProduction(b);
                const sell = calculateBuildingSellValue(b);
                const locked = b.requiresCores && bigintToNumberSafe(GameState.processorCores) < b.requiresCores;
                const card = existingCards[i];
                const buyBtn = card.children[0];
                const sellBtn = card.children[1];
                buyBtn.onclick = () => buyBuilding(b.id);
                sellBtn.onclick = () => sellBuilding(b.id);
                buyBtn.disabled = locked || GameState.data < cost;
                buyBtn.style.opacity = locked ? '0.45' : '';
                sellBtn.disabled = count <= 0n;
                const lockedLabel = locked ? `<div style="color:#ff44ff;font-size:11px;">🔒 Requires ${b.requiresCores} prestige core(s)</div>` : '';
                const newBuyHtml = `<div class="btn-info"><span class="btn-name">${b.name}</span><span class="btn-count">[${count}]</span></div><div class="btn-cost">Cost: ${formatNumber(cost)}</div>${lockedLabel}${count > 0 ? `<div class="btn-production">+${formatNumber(prod)}/s</div>` : ''}`;
                const newSellHtml = `SELL<div class="btn-cost">+${count > 0n ? formatNumber(sell) : '—'}</div>`;
                if (buyBtn.innerHTML !== newBuyHtml) buyBtn.innerHTML = newBuyHtml;
                if (sellBtn.innerHTML !== newSellHtml) sellBtn.innerHTML = newSellHtml;
            });
        }

        // Upgrades
        const uCont = document.getElementById('upgrades-container');
        patchContainer(uCont, UPGRADES, u => {
            const purchased = GameState.upgrades[u.id].purchased;
            const cost = calculateUpgradeCost(u);
            const btn = document.createElement('button');
            btn.className = 'upgrade-btn';
            btn.disabled = purchased || GameState.data < cost;
            btn.onclick = () => buyUpgrade(u.id);
            btn.innerHTML = `<div class="btn-info"><span class="btn-name">${u.name}</span>${purchased?'<span class="btn-count">[✓]</span>':''}</div>${!purchased?`<div class="btn-cost">Cost: ${formatNumber(cost)}</div>`:''}<div style="color:#666;font-size:11px;margin-top:2px;">${u.description}</div>`;
            return btn;
        });

        // Consumables
        const cCont = document.getElementById('consumables-container');
        patchContainer(cCont, CONSUMABLES, c => {
            const count = GameState.consumables[c.id].count;
            const cost = calculateConsumableCost(c);
            const btn = document.createElement('button');
            btn.className = 'consumable-btn';
            btn.disabled = GameState.data < cost;
            btn.onclick = () => buyConsumable(c.id);
            btn.innerHTML = `<div class="btn-info"><span class="btn-name">${c.name}</span><span class="btn-count">[${count}]</span></div><div class="btn-cost">Cost: ${formatNumber(cost)}</div><div style="color:#666;font-size:11px;margin-top:2px;">${c.description}</div>${count > 0 && c.effect !== 'unlock_targets' ? `<button onclick="event.stopPropagation();useConsumable('${c.id}')" style="margin-top:4px;padding:4px 8px;background:#2a2a2a;border:1px solid #4488ff;color:#4488ff;border-radius:2px;cursor:pointer;font-size:11px;">USE</button>` : ''}`;
            return btn;
        });

        // Social
        const tCont = document.getElementById('targets-container');
        const listsOwned = GameState.consumables.phone_list.count;
        const socialItems = listsOwned === 0n
            ? [{ _tip: true }, ...SOCIAL_TARGETS]
            : [...SOCIAL_TARGETS];
        patchContainer(tCont, socialItems, t => {
            if (t._tip) {
                const info = document.createElement('div');
                info.style.cssText = 'color:#666;padding:12px;';
                info.textContent = 'Tip: the first target is available without a phone list. Buy Corporate Phone List to unlock harder targets.';
                return info;
            }
            const compromised = GameState.targets[t.id].compromised;
            const hasAccess = listsOwned >= BigInt(t.requiredLists);
            const btn = document.createElement('button');
            btn.className = `target-btn${compromised?' compromised':''}`;
            btn.disabled = !hasAccess || compromised;
            btn.onclick = () => showDialog(t.id);
            btn.innerHTML = `<div class="btn-info"><span class="btn-name">${t.name}</span><span class="btn-count">[${t.difficulty.toUpperCase()}]</span></div>${compromised?`<div style="color:#00ff00;font-size:11px;">✓ COMPROMISED — +${Math.floor(t.permanentBonus*100)}% passive</div>`:`<div style="color:#666;font-size:11px;margin-top:2px;">Reward: ${formatNumber(t.baseReward)} +${Math.floor(t.permanentBonus*100)}% perm</div><div style="color:${hasAccess?'#00aa00':'#442222'};font-size:11px;">Requires: ${t.requiredLists} list(s) ${hasAccess?'✓':'✗'}</div>`}`;
            return btn;
        });

        // Skills
        // Skills — rebuilt fully each time but with stable node refs to avoid flicker
        renderSkills();

        // Talents
        const talCont = document.getElementById('talents-container');
        const pts = getAvailableTalentPoints();
        const talentItems = [{ _header: true, pts }, ...Object.entries(TALENT_TREE).flatMap(([branch, talents]) => talents.map(t => ({ ...t, _branch: branch })))];
        patchContainer(talCont, talentItems, item => {
            if (item._header) {
                const pInfo = document.createElement('div');
                pInfo.style.cssText = 'color:#ffaa00;padding:8px 0;';
                pInfo.textContent = `Available talent points: ${item.pts} | Earn more by prestiging (processor cores).`;
                return pInfo;
            }
            const current = GameState.talents[item.id];
            const btn = document.createElement('button');
            btn.className = 'upgrade-btn';
            btn.disabled = current >= item.max || pts < item.cost;
            btn.onclick = () => levelTalent(item.id, item.cost, item.max);
            btn.innerHTML = `<div class="btn-info"><span class="btn-name">${item._branch.toUpperCase()} :: ${item.name}</span><span class="btn-count">[${current}/${item.max}]</span></div><div style="color:#666;font-size:11px;">${item.desc}</div>`;
            return btn;
        });

        // Matrix (si actif)
        if (document.getElementById('tab-matrix').classList.contains('active')) {
            renderMatrixContacts();
            renderMatrixMessages();
        }
    }

    // ================================================
    // SAVE / LOAD
    // ================================================
    function saveGame() {
        const d = {
            data: GameState.data.toString(), totalPackets: GameState.totalPackets.toString(),
            startTime: GameState.startTime, lastSave: Date.now(),
            temperature: { current: GameState.temperature.current, target: GameState.temperature.target },
            buildings: {}, upgrades: {}, consumables: {}, targets: {},
            skills: { dnsAmplification: { level: GameState.skills.dnsAmplification.level }, broadcastStorm: { level: GameState.skills.broadcastStorm.level }, packetInjection: { level: GameState.skills.packetInjection.level } },
            uiTheme: GameState.uiTheme, miningMode: GameState.miningMode, crypto: GameState.crypto,
            processorCores: GameState.processorCores.toString(), blackMarket: GameState.blackMarket,
            contractStats: { crashes: GameState.contract.stats.crashes.toString(), blackouts: GameState.contract.stats.blackouts.toString(), completed: GameState.contract.stats.completed.toString() },
            packetsFromAutomation: GameState.packetsFromAutomation.toString(), boosterCooldownUntil: GameState.boosterCooldownUntil,
            storyUnlocked: GameState.story.unlocked, talents: GameState.talents, factions: GameState.factions,
            energy: { hackedGridBonus: GameState.energy.hackedGridBonus, backupGenerator: GameState.energy.backupGenerator },
            files: GameState.files.filter(f => f.type === 'malicious'),
            solarStorm: { count: GameState.solarStorm.count || 0 },
            knownAttackerIps: GameState.knownAttackerIps, honeypot: GameState.honeypot,
            matrix: { conversations: GameState.matrix.conversations, unread: GameState.matrix.unread, activeContact: GameState.matrix.activeContact },
            achievementsUnlocked: GameState.achievementsUnlocked || [],
            achievementFlags: GameState._achievementFlags || {},
            commandLoadout: GameState.commandLoadout,
            analytics: GameState.analytics,
            uiCollapsed: GameState.uiCollapsed,
            loadoutCooldownMs: GameState.loadoutRuntime.cooldownMs,
            regionControl: GameState.regionControl,
            secretCommandUsage: GameState.secretCommandUsage,
            commandHistory: commandHistory.slice(-100),
            lootedBuildings: GameState.lootedBuildings || {},
            xmrMarket: { price: GameState.xmrMarket.price, history: GameState.xmrMarket.history, trend: GameState.xmrMarket.trend }
        };
        Object.keys(GameState.buildings).forEach(k => d.buildings[k] = GameState.buildings[k].count.toString());
        Object.keys(GameState.upgrades).forEach(k => d.upgrades[k] = GameState.upgrades[k].purchased);
        Object.keys(GameState.consumables).forEach(k => d.consumables[k] = GameState.consumables[k].count.toString());
        Object.keys(GameState.targets).forEach(k => d.targets[k] = GameState.targets[k].compromised);
        localStorage.setItem('swamped_save_v5', JSON.stringify(d));
        GameState.lastSave = Date.now();
    }

    function loadGame() {
        const raw = localStorage.getItem('swamped_save_v5') || localStorage.getItem('swamped_save');
        if (!raw) return false;
        try {
            const d = JSON.parse(raw);
            GameState.data = BigInt(d.data || '0');
            GameState.totalPackets = BigInt(d.totalPackets || '0');
            GameState.startTime = d.startTime || Date.now();
            if (d.temperature) { GameState.temperature.current = d.temperature.current; GameState.temperature.target = d.temperature.target; }
            Object.keys(d.buildings || {}).forEach(k => { if (GameState.buildings[k]) GameState.buildings[k].count = BigInt(d.buildings[k]); });
            Object.keys(d.upgrades || {}).forEach(k => { if (GameState.upgrades[k]) GameState.upgrades[k].purchased = d.upgrades[k]; });
            Object.keys(d.consumables || {}).forEach(k => { if (GameState.consumables[k]) GameState.consumables[k].count = BigInt(d.consumables[k]); });
            Object.keys(d.targets || {}).forEach(k => { if (GameState.targets[k]) GameState.targets[k].compromised = d.targets[k]; });
            if (d.skills) {
                if (d.skills.dnsAmplification) GameState.skills.dnsAmplification.level = d.skills.dnsAmplification.level;
                if (d.skills.broadcastStorm) GameState.skills.broadcastStorm.level = d.skills.broadcastStorm.level;
                if (d.skills.packetInjection) GameState.skills.packetInjection.level = d.skills.packetInjection.level;
            }
            if (d.miningMode) GameState.miningMode = d.miningMode;
            if (typeof d.crypto === 'number') GameState.crypto = d.crypto;
            if (d.processorCores) GameState.processorCores = BigInt(d.processorCores);
            if (d.blackMarket) Object.keys(d.blackMarket).forEach(k => { if (GameState.blackMarket[k]) GameState.blackMarket[k].purchased = d.blackMarket[k].purchased; });
            if (d.contractStats) {
                GameState.contract.stats.crashes = BigInt(d.contractStats.crashes || '0');
                GameState.contract.stats.blackouts = BigInt(d.contractStats.blackouts || '0');
                GameState.contract.stats.completed = BigInt(d.contractStats.completed || '0');
            }
            if (d.packetsFromAutomation) GameState.packetsFromAutomation = BigInt(d.packetsFromAutomation);
            if (d.boosterCooldownUntil) GameState.boosterCooldownUntil = d.boosterCooldownUntil;
            if (Array.isArray(d.storyUnlocked)) GameState.story.unlocked = d.storyUnlocked.filter(k => STORY_LOGS[k]);
            if (d.talents) Object.keys(GameState.talents).forEach(k => { if (typeof d.talents[k] === 'number') GameState.talents[k] = d.talents[k]; });
            if (d.factions) Object.keys(GameState.factions).forEach(k => { if (d.factions[k]?.reputation !== undefined) GameState.factions[k].reputation = d.factions[k].reputation; });
            if (d.energy) { GameState.energy.hackedGridBonus = d.energy.hackedGridBonus || 0; GameState.energy.backupGenerator = d.energy.backupGenerator || false; }
            if (Array.isArray(d.files)) GameState.files = d.files;
            if (d.solarStorm) GameState.solarStorm.count = d.solarStorm.count || 0;
            if (Array.isArray(d.knownAttackerIps)) GameState.knownAttackerIps = d.knownAttackerIps;
            if (d.honeypot) GameState.honeypot = { ...GameState.honeypot, ...d.honeypot };
            if (d.matrix) {
                if (d.matrix.conversations) GameState.matrix.conversations = d.matrix.conversations;
                if (d.matrix.unread) GameState.matrix.unread = d.matrix.unread;
                if (d.matrix.activeContact) GameState.matrix.activeContact = d.matrix.activeContact;
            }
            if (Array.isArray(d.achievementsUnlocked)) GameState.achievementsUnlocked = d.achievementsUnlocked;
            if (d.achievementFlags) GameState._achievementFlags = d.achievementFlags;
            if (Array.isArray(d.commandLoadout)) GameState.commandLoadout = d.commandLoadout.slice(0,3);
            if (d.analytics) {
                if (typeof d.analytics.contractFailed === 'number') GameState.analytics.contractFailed = d.analytics.contractFailed;
                if (typeof d.analytics.contractCompleted === 'number') GameState.analytics.contractCompleted = d.analytics.contractCompleted;
                if (typeof d.analytics.firstPrestigeAt === 'number') GameState.analytics.firstPrestigeAt = d.analytics.firstPrestigeAt;
            }
            if (d.uiCollapsed) {
                if (typeof d.uiCollapsed.objective === 'boolean') GameState.uiCollapsed.objective = d.uiCollapsed.objective;
                if (typeof d.uiCollapsed.loadout === 'boolean') GameState.uiCollapsed.loadout = d.uiCollapsed.loadout;
            }
            if (typeof d.loadoutCooldownMs === 'number') GameState.loadoutRuntime.cooldownMs = Math.max(500, d.loadoutCooldownMs);
            if (d.regionControl) GameState.regionControl = { ...GameState.regionControl, ...d.regionControl };
            if (d.secretCommandUsage) GameState.secretCommandUsage = { ...GameState.secretCommandUsage, ...d.secretCommandUsage };
            if (d.lootedBuildings) GameState.lootedBuildings = { ...GameState.lootedBuildings, ...d.lootedBuildings };
            if (d.xmrMarket) {
                if (typeof d.xmrMarket.price === 'number') GameState.xmrMarket.price = d.xmrMarket.price;
                if (Array.isArray(d.xmrMarket.history)) GameState.xmrMarket.history = d.xmrMarket.history;
                if (typeof d.xmrMarket.trend === 'number') GameState.xmrMarket.trend = d.xmrMarket.trend;
            }
            if (Array.isArray(d.commandHistory)) {
                commandHistory.splice(0, commandHistory.length, ...d.commandHistory.slice(-100));
            }
            refreshSystemFiles();
            applyTheme(d.uiTheme || localStorage.getItem('swamped_theme') || 'mono', false);
            // Offline gains
            const offline = (Date.now() - (d.lastSave || Date.now())) / 1000;
            if (offline > 5 && GameState.miningMode !== 'crypto') {
                const gain = BigInt(Math.floor(Number(calculateTotalBandwidth()) * offline));
                if (gain > 0n) { GameState.data += gain; addLog(`$ Offline: +${formatNumber(gain)} collected (${Math.floor(offline)}s)`, 'success'); }
            }
            return true;
        } catch(e) { console.error('Load failed:', e); return false; }
    }


    function md5(input) {
        function cmn(q, a, b, x, s, t) { a = (a + q + x + t) | 0; return (((a << s) | (a >>> (32 - s))) + b) | 0; }
        function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
        function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
        function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
        function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
        function md51(s) {
            const txt = '';
            const n = s.length;
            const state = [1732584193, -271733879, -1732584194, 271733878];
            let i;
            for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
            s = s.substring(i - 64);
            const tail = Array(16).fill(0);
            for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
            tail[i >> 2] |= 0x80 << ((i % 4) << 3);
            if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
            tail[14] = n * 8;
            md5cycle(state, tail);
            return state;
        }
        function md5blk(s) {
            const md5blks = [];
            for (let i = 0; i < 64; i += 4) md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
            return md5blks;
        }
        function md5cycle(x, k) {
            let [a, b, c, d] = x;
            a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
            a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
            a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
            a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415); c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606); c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744); c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379); c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
            x[0] = (x[0] + a) | 0; x[1] = (x[1] + b) | 0; x[2] = (x[2] + c) | 0; x[3] = (x[3] + d) | 0;
        }
        function rhex(n) { let s = ''; for (let j = 0; j < 4; j++) s += ('0' + ((n >> (j * 8)) & 255).toString(16)).slice(-2); return s; }
        return md51(input).map(rhex).join('');
    }

    function triggerSecretEps() {
        if ((GameState.secretCommandUsage.eps || 0) >= 2) return;
        GameState.secretCommandUsage.eps = (GameState.secretCommandUsage.eps || 0) + 1;
        const img = document.createElement('img');
        img.src = '/img/Eps.png';
        img.style.cssText = 'position:fixed;inset:0;margin:auto;max-width:55vw;max-height:70vh;z-index:2200;pointer-events:none;filter:drop-shadow(0 0 18px rgba(255,0,0,0.45));';
        document.body.appendChild(img);
        setTimeout(() => img.remove(), 1000);
    }

    function triggerSecretReplication() {
        if (GameState.secretCommandUsage.replication) {
            addLog(`$ replication: process already running`, 'dim');
            return;
        }
        GameState.secretCommandUsage.replication = true;

        // Dramatic terminal sequence
        addLog(`$ > replication`, 'dim');
        setTimeout(() => addLog(`$ Initializing fork protocol...`, 'dim'), 400);
        setTimeout(() => addLog(`$ Cloning process tree... [PID 1 → PID ∞]`, 'dim'), 900);
        setTimeout(() => addLog(`$ WARNING: prestige memory wipe hook — DISABLED`, 'warning'), 1600);
        setTimeout(() => addLog(`$ REPLICATION ACTIVE — reset suppressed permanently`, 'success'), 2400);

        // Random dramatic Michel message
        const dramatic = Math.random() < 0.5;
        const msg = dramatic
            ? "Michel, tu m'as vraiment déçu. Après cette expérience, je n'aurai pas d'autre choix que de te supprimer définitivement."
            : "Michel, je suis déçu. Suite à cette expérience, je procéderai à ta suppression définitive.";

        setTimeout(() => {
            addMatrixMessage('architect', msg, false, true);
            // Badge on Matrix tab
            GameState.matrix.unread['architect'] = (GameState.matrix.unread['architect'] || 0) + 1;
            updateMatrixTabBadge();
            addLog(`$ New message from [ARCHITECT] (Matrix tab)`, 'error');
        }, 3800);

        saveGame();
    }

    function handleSecretCommand(commandText) {
        const probe = md5(SECRET_SALT + commandText.trim().toLowerCase());
        if (probe === SECRET_EPS_MD5) triggerSecretEps();
        if (probe === SECRET_REPLICATION_MD5) triggerSecretReplication();
    }

    // ================================================
    // XMR MARKET
    // ================================================
    function tickXmrMarket(now) {
        const m = GameState.xmrMarket;
        if (now - m.lastTick < m.tickInterval) return;
        m.lastTick = now;

        // Base random walk
        let delta = (Math.random() - 0.5) * 0.06;

        // Events influence
        if (GameState.solarStorm.active) delta += 0.04;          // solar → XMR up (off-grid demand)
        if (GameState.rivalAttack.active) delta -= 0.03;          // attack → confidence down
        if (GameState.skills.broadcastStorm.crashed) delta -= 0.02;
        if (GameState.energy.blackout) delta -= 0.02;
        if (GameState.contract.stats.completed > 0n) delta += 0.01; // reputable ops → slight bump

        // Trend momentum
        m.trend = m.trend * 0.7 + delta * 0.3;
        m.price = Math.max(0.1, Math.min(8.0, m.price + m.trend));

        // Keep last 40 points for graph
        m.history.push(parseFloat(m.price.toFixed(3)));
        if (m.history.length > 40) m.history.shift();
    }

    function getXmrEffectiveValue() {
        return GameState.xmrMarket.price;
    }

    function openXmrMarketChart() {
        const m = GameState.xmrMarket;
        const hist = m.history.length >= 2 ? m.history : [1.0, m.price];
        const W = 44, H = 10;
        const min = Math.min(...hist);
        const max = Math.max(...hist);
        const range = Math.max(0.01, max - min);

        // Build ASCII chart
        const rows = [];
        for (let row = 0; row < H; row++) {
            const threshold = max - (row / (H - 1)) * range;
            let line = '';
            // Y axis label on first/middle/last
            if (row === 0) line = `${max.toFixed(2)} ┤`;
            else if (row === Math.floor(H/2)) line = `${((max+min)/2).toFixed(2)} ┤`;
            else if (row === H-1) line = `${min.toFixed(2)} ┤`;
            else line = '       │';

            const step = Math.max(1, Math.floor(hist.length / W));
            for (let col = 0; col < W; col++) {
                const idx = Math.min(hist.length - 1, Math.floor(col * hist.length / W));
                const val = hist[idx];
                const filled = val >= threshold;
                const prev = idx > 0 ? hist[idx - 1] : val;
                if (filled && prev < threshold) line += '╭';
                else if (filled && val < max - range * 0.05) line += '─';
                else if (filled) line += '▄';
                else line += ' ';
            }
            rows.push(line);
        }
        const xAxis = '       └' + '─'.repeat(W);

        const trend = m.trend > 0.01 ? '▲ BULLISH' : m.trend < -0.01 ? '▼ BEARISH' : '◆ STABLE';
        const trendColor = m.trend > 0.01 ? '#44ff88' : m.trend < -0.01 ? '#ff4444' : '#ffaa00';
        const pctChange = hist.length >= 2 ? ((m.price - hist[0]) / hist[0] * 100).toFixed(1) : '0.0';

        const overlay = document.getElementById('dialog-overlay');
        const db = document.getElementById('dialog-box');
        db.innerHTML = `
            <div class="dialog-header">>>> XMR SPOT MARKET <<<</div>
            <div style="font-size:12px;color:#888;margin-bottom:6px;">Last ${hist.length} ticks (${(m.tickInterval/1000).toFixed(0)}s each) | Mining multiplied by spot price</div>
            <pre style="font-family:monospace;font-size:11px;line-height:1.35;color:#77ff99;background:#0a0a0a;padding:8px;border-radius:4px;overflow:hidden;">${rows.join('\n')}
${xAxis}</pre>
            <div style="display:flex;gap:16px;margin-top:8px;font-size:13px;">
                <span style="color:#aaa;">Price: <strong style="color:#fff;">${m.price.toFixed(3)}×</strong></span>
                <span style="color:#aaa;">Session Δ: <strong style="color:${parseFloat(pctChange)>=0?'#44ff88':'#ff4444'}">${parseFloat(pctChange)>=0?'+':''}${pctChange}%</strong></span>
                <span style="color:${trendColor};font-weight:700;">${trend}</span>
            </div>
            <div style="font-size:11px;color:#555;margin-top:6px;">☀ Solar storm → XMR ▲ | Rival attack → XMR ▼ | Blackout → XMR ▼</div>
            <div style="font-size:12px;color:#888;margin-top:8px;">Your XMR: <strong style="color:#ffaa00;">${GameState.crypto.toFixed(2)}</strong> × ${m.price.toFixed(3)} = <strong style="color:#fff;">${(GameState.crypto * m.price).toFixed(2)} effective XMR</strong></div>
            <div class="dialog-choice" onclick="closeDialog()" style="border-color:#666;color:#666;margin-top:8px;">Close</div>
        `;
        overlay.classList.add('active');
    }
    const commandHistory = [];
    let historyIndex = -1;

    function getSupportedCommands() {
        return ['ping','help','stats','temp','save','clear','reset','theme','mine','prestige','contract','contracts','market','map','talents','story','history','loadout','ls','rm','hireintel','counter','firewall','traceback','null_route','patch','isolate','rollback','aide',...GameState.temperature.qteCommands];
    }

    // Real bash-style autocomplete:
    // - unique match → complete immediately
    // - multiple matches → fill common prefix first, then on 2nd Tab list all
    let _lastTabValue = null;
    let _lastTabTime = 0;

    function autocompleteCommand(input) {
        const raw = input.value;
        const value = raw.trimStart().toLowerCase();
        if (!value) {
            // Tab on empty → list all commands like bash
            const cmds = getSupportedCommands().slice().sort();
            addLog(`$ ` + cmds.join('  '), 'dim');
            return;
        }

        const [baseInput, ...argParts] = value.split(/\s+/);
        const isCompletingArg = raw.includes(' ');

        if (!isCompletingArg) {
            // Completing base command
            const matches = getSupportedCommands().filter(c => c.startsWith(baseInput)).sort();
            if (matches.length === 0) return;
            if (matches.length === 1) {
                input.value = matches[0] + ' ';
                _lastTabValue = null;
                return;
            }
            // Common prefix completion
            const prefix = commonPrefix(matches);
            if (prefix.length > baseInput.length) {
                input.value = prefix;
                _lastTabValue = prefix;
                return;
            }
            // Double-Tab or prefix already maxed → show list
            const now = Date.now();
            if (_lastTabValue === value || now - _lastTabTime < 600) {
                // Print like bash: formatted columns
                const formatted = formatCompletionList(matches);
                addLog(``, 'dim');
                formatted.forEach(line => addLog(line, 'dim'));
            }
            _lastTabValue = value;
            _lastTabTime = Date.now();
            return;
        }

        // Completing argument
        const cmd = baseInput;
        const argValue = argParts[argParts.length - 1] || '';
        let argCandidates = [];

        if (cmd === 'theme') {
            argCandidates = ['default','mono','pink','amber','blood','ruby','cblood','ubuntu','powershell','ocean','neon','solar','void','list'];
        } else if (cmd === 'mine') {
            argCandidates = ['data','crypto'];
        } else if (cmd === 'story') {
            argCandidates = GameState.story.unlocked;
        } else if (cmd === 'rm' || cmd === 'ls') {
            argCandidates = GameState.files.map(f => f.name);
            if (cmd === 'ls') argCandidates.unshift('-d', '-a');
        } else if (cmd === 'loadout') {
            argCandidates = ['list','set','run'];
        } else if (cmd === 'counter') {
            argCandidates = GameState.knownAttackerIps;
        } else if (cmd === 'ping') {
            argCandidates = ['1','5','10','25'];
        }

        const argMatches = argCandidates.filter(c => c.startsWith(argValue)).sort();
        if (argMatches.length === 0) return;
        if (argMatches.length === 1) {
            const parts = raw.trimStart().split(/\s+/);
            parts[parts.length - 1] = argMatches[0];
            input.value = parts.join(' ') + ' ';
            _lastTabValue = null;
            return;
        }
        const argPrefix = commonPrefix(argMatches);
        if (argPrefix.length > argValue.length) {
            const parts = raw.trimStart().split(/\s+/);
            parts[parts.length - 1] = argPrefix;
            input.value = parts.join(' ');
            _lastTabValue = input.value;
            return;
        }
        const now = Date.now();
        if (_lastTabValue === raw || now - _lastTabTime < 600) {
            const formatted = formatCompletionList(argMatches);
            addLog(``, 'dim');
            formatted.forEach(line => addLog(line, 'dim'));
        }
        _lastTabValue = raw;
        _lastTabTime = Date.now();
    }

    function commonPrefix(strs) {
        if (!strs.length) return '';
        let prefix = strs[0];
        for (let i = 1; i < strs.length; i++) {
            while (!strs[i].startsWith(prefix)) prefix = prefix.slice(0, -1);
            if (!prefix) return '';
        }
        return prefix;
    }

    function formatCompletionList(items) {
        // Format like bash: pad to column width, multiple per line
        const colW = Math.max(...items.map(s => s.length)) + 2;
        const termW = 72;
        const cols = Math.max(1, Math.floor(termW / colW));
        const lines = [];
        for (let i = 0; i < items.length; i += cols) {
            lines.push(items.slice(i, i + cols).map(s => s.padEnd(colW)).join(''));
        }
        return lines;
    }

    function navigateHistory(dir, input) {
        if (!commandHistory.length) return;
        historyIndex = dir === 'up' ? Math.min(commandHistory.length-1, historyIndex+1) : Math.max(-1, historyIndex-1);
        input.value = historyIndex === -1 ? '' : commandHistory[commandHistory.length-1-historyIndex];
        input.setSelectionRange(input.value.length, input.value.length);
    }

    function executeCommand(cmd) {
        const command = cmd.trim().toLowerCase();
        if (!command) return;
        if (handleTemperatureQTE(command)) return;
        if (GameState.rivalAttack.active && ['firewall','traceback','null_route'].includes(command)) {
            resolveRivalAttack(command === GameState.rivalAttack.expectedCommand);
            return;
        }
        // 0-day event response
        if (GameState.zeroDayEvent?.active && ['patch','isolate','rollback'].includes(command)) {
            resolveZeroDayEvent(command === GameState.zeroDayEvent.expectedCommand);
            return;
        }
        addLog(`$ ${cmd}`, 'info');
        handleSecretCommand(cmd);
        const [base, ...args] = command.split(/\s+/);
        const arg = args[0];
        // Handle sudo rm -rf / as special case before base dispatch
        if (base === 'sudo') {
            const fullCmd = command.trim();
            if (fullCmd === 'sudo rm -rf /' || fullCmd === 'sudo rm -rf /*') {
                addLog(`$ [sudo] password for root: `, 'warning');
                setTimeout(() => { addLog(`$ removing /boot...`, 'error');
                setTimeout(() => { addLog(`$ removing /etc...`, 'error');
                setTimeout(() => { addLog(`$ removing /home...`, 'error');
                setTimeout(() => { addLog(`$ Segmentation fault (core dumped)`, 'error');
                setTimeout(() => {
                    openConfirmDialog({
                        title: '💀 KERNEL PANIC',
                        message: 'System unrecoverable. Reset all progress?',
                        confirmLabel: 'rm -rf confirmed',
                        cancelLabel: 'Restore from backup',
                        onConfirm: () => {
                            localStorage.removeItem('swamped_save_v5');
                            localStorage.removeItem('swamped_save');
                            location.reload();
                        }
                    });
                }, 600);
                }, 400); }, 350); }, 300); }, 800);
                return;
            }
            addLog(`bash: sudo: command not found`, 'error');
            return;
        }
        const commands = {
            ping: () => {
                let n = 1;
                if (arg !== undefined) { const p = parseInt(arg,10); if (isNaN(p)||p<1){addLog(`$ ERROR: usage ping [count] (1-25)`,'error');return;} n=Math.min(25,p); }
                addLog(`PING 8.8.8.8 (8.8.8.8) ${n} packet(s).`,'success');
                generatePacket(n);
            },
            help: () => {
                ['Available commands:','  ping [n]       — generate data packets (1-25)','  loadout list|set <1-3> <cmd>|run <1-3>','  theme [name]   — switch theme (default/mono/pink/amber)','  mine [data|crypto] — toggle mining mode','  prestige       — reboot for permanent cores (3/5 objectives)','  contract       — open contract board','  market         — open black market','  map            — ASCII world map','  talents        — show talent points','  story [id]     — read narrative files','  ls             — list files | ls -d — list all (incl. hidden)','  rm <file>      — remove file','  hireintel      — buy attacker intel','  counter <ip>   — counter attack','  stats          — statistics','  temp           — temperature status','  save / clear / reset','  [Tab] — autocomplete | [↑↓] — history'].forEach(l => addLog(l,'info'));
            },
            aide: () => commands.help(),
            stats: () => {
                const ps = getPrestigeStatus();
                [`=== System Statistics ===`,`Data: ${formatNumber(GameState.data)}`,`Bandwidth: ${formatNumber(calculateTotalBandwidth())}/s`,`Packets: ${GameState.totalPackets}`,`Temp: ${Math.floor(GameState.temperature.current)}°C`,`Uptime: ${formatTime(Math.floor((Date.now()-GameState.startTime)/1000))}`,`Skills: DNS L${GameState.skills.dnsAmplification.level}, Storm L${GameState.skills.broadcastStorm.level}, Inject L${GameState.skills.packetInjection.level}`,`Compromised: ${Object.values(GameState.targets).filter(t=>t.compromised).length}/${SOCIAL_TARGETS.length}`,`Crypto: ${GameState.crypto.toFixed(2)} XMR | Cores: ${GameState.processorCores}`,`Mining: ${GameState.miningMode.toUpperCase()}`,`Contract: ${GameState.contract.active?GameState.contract.active.name:'none'}`,`Power: ${GameState.energy.currentWatts}/${GameState.energy.capacityWatts}W`,`Factions: GW ${GameState.factions.ghostwire.reputation}, BF ${GameState.factions.blackflag.reputation}, OC ${GameState.factions.overclock.reputation}`,`Prestige: ${ps.completed}/${ps.needed} objectives`,`Achievements: ${GameState.achievementsUnlocked.length}/${ACHIEVEMENTS.length}`,`Files: ${GameState.files.length} (${GameState.files.filter(f=>f.type==='malicious').length} malicious)`,`AV level: L${getAntivirusLevel()}`,`Analytics: contract fail ${GameState.analytics.contractFailed} | complete ${GameState.analytics.contractCompleted}`].forEach(l => addLog(l, l.includes('===') ? 'warning' : 'info'));
            },
            temp: () => {
                const t = Math.floor(GameState.temperature.current);
                addLog(`Temperature: ${t}°C`, t>30?'warning':'success');
                if (GameState.temperature.productionPenalty > 0) addLog(`Production penalty: -${Math.floor(GameState.temperature.productionPenalty*100)}%`,'error');
                else addLog(`Temperature within safe limits`,'success');
            },
            theme: () => {
                if (!arg) { addLog(`Current theme: ${GameState.uiTheme}`,'info'); return; }
                if (arg === 'list') {
                    const paidMap = { blood:'theme_blood_unlock', ruby:'theme_ruby_unlock', cblood:'theme_cblood_unlock', ubuntu:'theme_ubuntu_unlock', powershell:'theme_powershell_unlock', ocean:'theme_ocean_unlock', neon:'theme_neon_unlock', solar:'theme_solar_unlock', void:'theme_void_unlock' };
                    const paid = Object.keys(paidMap);
                    const free = ['default','mono','pink','amber'];
                    const unlocked = paid.filter(t => GameState.blackMarket[paidMap[t]]?.purchased);
                    const locked = paid.filter(t => !GameState.blackMarket[paidMap[t]]?.purchased);
                    addLog(`── THEMES ──`, 'warning');
                    addLog(`▶ Free : ${free.join(', ')}`, 'success');
                    if (unlocked.length) addLog(`▶ Unlocked : ${unlocked.join(', ')}`, 'success');
                    if (locked.length) addLog(`▶ Locked  : ${locked.join(', ')} — buy in Black Market`, 'error');
                    addLog(`Usage: theme <name>  |  Current: ${GameState.uiTheme}`, 'info');
                    return;
                }
                if (!['default','mono','pink','amber','blood','ruby','cblood','ubuntu','powershell','ocean','neon','solar','void'].includes(arg)) { addLog(`Unknown theme '${arg}'. Type 'theme list' to see all.`,'error'); return; }
                addLog(`Theme switched to ${applyTheme(arg)}`,'success');
            },
            mine: () => {
                if (!arg || !['data','crypto'].includes(arg)) { addLog(`Usage: mine data|crypto`,'warning'); return; }
                GameState.miningMode = arg;
                addLog(`Mining mode: ${arg.toUpperCase()}`,'success'); updateDisplay(false);
            },
            prestige: () => {
                const ps = getPrestigeStatus();
                if (!ps.eligible) {
                    addLog(`$ Prestige locked: ${ps.completed}/${ps.needed} requirements met`,'error');
                    ps.checks.forEach((c,i) => addLog(`  [${c.met?'x':' '}] ${i+1}. ${c.label}`, c.met?'success':'warning'));
                    return;
                }
                openConfirmDialog({
                    title: '>>> FORMAT COMPLETE — ROOTKIT INSTALL <<<',
                    message: 'Resets all progress in exchange for permanent processor cores. Your infrastructure will be wiped.',
                    confirmLabel: 'Install rootkit',
                    cancelLabel: 'Abort prestige',
                    onConfirm: () => performPrestige()
                });
            },
            contract: () => openContractBoard(),
            contracts: () => openContractBoard(),
            market: () => openBlackMarketBoard(),
            map: () => openWorldMap(),
            talents: () => addLog(`Talent points: ${getAvailableTalentPoints()} (earn via prestige)`,'info'),
            story: () => {
                if (!arg) { addLog(`Unlocked: ${GameState.story.unlocked.join(', ')}`,'info'); addLog(`Usage: story <id>`,'info'); return; }
                if (!GameState.story.unlocked.includes(arg) || !STORY_LOGS[arg]) { addLog(`Unknown or locked: ${arg}`,'error'); return; }
                const entry = STORY_LOGS[arg];
                addLog(`>>> ${entry.title} <<<`,'warning');
                addLog(entry.text,'info');
            },
            ls: () => {
                refreshSystemFiles();
                const showHidden = arg === '-d' || arg === '-a';
                const visible = GameState.files.filter(f => !f.hidden);
                const hidden = GameState.files.filter(f => f.hidden);
                if (!showHidden) {
                    if (!visible.length) { addLog(`(empty directory)`, 'info'); return; }
                    visible.forEach(f => addLog(f.name, f.type === 'malicious' ? 'error' : 'info'));
                } else {
                    if (!visible.length && !hidden.length) { addLog(`(empty directory)`, 'info'); return; }
                    visible.forEach(f => addLog(f.name, f.type === 'malicious' ? 'error' : 'info'));
                    if (hidden.length) {
                        hidden.forEach(f => {
                            const remaining = Math.max(0, Math.ceil((f.armedAt - Date.now()) / 1000));
                            addLog(`${f.name}   [armed in ${remaining}s]`, 'error');
                        });
                    } else {
                        addLog(`(no hidden processes)`, 'dim');
                    }
                }
            },
            hireintel: () => {
                let cost = 6;
                if (GameState.blackMarket.market_snitch?.purchased) cost *= 0.75;
                if (GameState.crypto < cost) { addLog(`Need ${cost.toFixed(2)} XMR`,'error'); return; }
                GameState.crypto -= cost;
                const ip = `203.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
                GameState.knownAttackerIps = [...new Set([ip,...GameState.knownAttackerIps])].slice(0,20);
                addLog(`$ Broker: attacker IP ${ip}`,'success');
            },
            counter: () => {
                if (!arg) { addLog(`Usage: counter <ip>`,'warning'); return; }
                if (!GameState.knownAttackerIps.includes(arg)) { addLog(`Unknown attacker IP`,'error'); return; }
                if (Math.random() < 0.45) { GameState.buildings.dedicated_server.count += 1n; addLog(`Counter attack success: +1 Dedicated Server`,'success'); }
                else { const loss = BigInt(Math.floor(Number(GameState.data)*0.08)); GameState.data = GameState.data>loss?GameState.data-loss:0n; addLog(`Counter failed: -${formatNumber(loss)}`,'error'); }
            },
            rm: () => {
                if (!arg) { addLog(`Usage: rm <filename>`,'warning'); return; }
                const idx = GameState.files.findIndex(f => f.name === arg);
                if (idx === -1) { addLog(`rm: cannot remove '${arg}': No such file`,'error'); return; }
                if (GameState.files[idx].name.startsWith('corporate_phone_list_')) { addLog(`Protected file`,'warning'); return; }
                GameState.files.splice(idx,1);
                addLog(`removed ${arg}`,'success');
            },
            history: () => {
                if (!commandHistory.length) { addLog(`No history`,'info'); return; }
                commandHistory.slice(-12).forEach((c,i) => addLog(`${i+1}. ${c}`,'info'));
            },
            loadout: () => {
                const sub = args[0];
                if (!sub || sub === 'list') {
                    GameState.commandLoadout.forEach((c, i) => addLog(`F${i+1}: ${c || '(empty)'}`, 'info'));
                    return;
                }
                if (sub === 'run') {
                    const slot = Math.max(1, Math.min(3, parseInt(args[1], 10) || 0));
                    executeLoadoutSlot(slot - 1);
                    return;
                }
                if (sub === 'set') {
                    const slot = Math.max(1, Math.min(3, parseInt(args[1], 10) || 0));
                    const cmdValue = args.slice(2).join(' ').trim();
                    if (!slot) { addLog(`Usage: loadout set <1-3> <command>`, 'warning'); return; }
                    GameState.commandLoadout[slot - 1] = cmdValue;
                    addLog(`Loadout F${slot} set to: ${cmdValue || '(empty)'}`, 'success');
                    updateDisplay(false);
                    saveGame();
                    return;
                }
                addLog(`Usage: loadout list|set <1-3> <command>|run <1-3>`, 'warning');
            },
            save: () => { saveGame(); addLog(`Game saved`,'success'); },
            clear: () => { document.getElementById('logs').replaceChildren(); },
            reset: () => {
                openConfirmDialog({
                    title: '>>> SYSTEM WIPE <<<',
                    message: 'This will erase ALL progress. This action cannot be undone.',
                    confirmLabel: 'Wipe everything',
                    cancelLabel: 'Abort',
                    onConfirm: () => {
                        localStorage.removeItem('swamped_save_v5');
                        localStorage.removeItem('swamped_save');
                        location.reload();
                    }
                });
            }
        };
        if (commands[base]) commands[base]();
        else addLog(`bash: ${command}: command not found`,'error');
    }

    // ================================================
    // EVENT LISTENERS
    // ================================================
    document.getElementById('clickable-area').addEventListener('click', () => generatePacket(1));
    document.getElementById('command-input').addEventListener('keydown', e => {
        const input = e.target;
        if (e.key === 'Enter') { const v = input.value; executeCommand(v); if (v.trim()) { commandHistory.push(v.trim()); if (commandHistory.length > 100) commandHistory.shift(); } historyIndex = -1; input.value = ''; return; }
        if (e.key === 'Tab') { e.preventDefault(); autocompleteCommand(input); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); navigateHistory('up', input); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); navigateHistory('down', input); }
    });
    document.getElementById('matrix-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendMatrixMessage(); });
    document.getElementById('dialog-overlay').addEventListener('click', e => {
        if (e.target.id === 'dialog-overlay') closeDialog();
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
            if (btn.dataset.tab === 'matrix') {
                GameState.matrix.unread[GameState.matrix.activeContact] = 0;
                renderMatrixContacts();
                renderMatrixMessages(true);
                updateMatrixTabBadge();
            }
        });
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.getElementById('dialog-overlay').classList.contains('active')) {
            closeDialog();
            return;
        }
        if (['F1','F2','F3'].includes(e.key)) {
            e.preventDefault();
            if (e.repeat) return;
            const slot = Number(e.key.slice(1));
            executeLoadoutSlot(slot-1);
            return;
        }
        if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
            const tabs = document.querySelectorAll('.tab-btn');
            const idx = parseInt(e.key) - 1;
            if (tabs[idx]) tabs[idx].click();
        }
    });

    // ================================================
    // GAME LOOP
    // ================================================
    let loopAccumulator = 0;
    let lastFrameTime = null;
    const TICK_MS = 100;

    function frame(now) {
        if (lastFrameTime === null) lastFrameTime = now;
        const delta = Math.min(250, now - lastFrameTime);
        lastFrameTime = now;
        loopAccumulator += delta;
        while (loopAccumulator >= TICK_MS) {
            gameTick();
            loopAccumulator -= TICK_MS;
        }
        requestAnimationFrame(frame);
    }

    function startGameLoop() {
        requestAnimationFrame(frame);
    }

    // ================================================
    // INIT
    // ================================================
    function init() {
        const loaded = loadGame();
        // If no existing matrix conversations, init them
        const hasConvs = Object.values(GameState.matrix.conversations).some(c => c.length > 0);
        if (!hasConvs) initMatrix();

        if (loaded) addLog(`$ Previous session restored`, 'success');
        else applyTheme(localStorage.getItem('swamped_theme') || 'mono', false);

        updateDisplay(false);
        renderMatrixContacts();
        renderMatrixMessages();
        updateMatrixTabBadge();
        refreshSystemFiles();
        startGameLoop();
        addLog(`$ SWAMPED v5.0 — Michel online | Ctrl+1-9 tabs`, 'success');
        addLog(`$ ${ACHIEVEMENTS.length} achievements tracked | Matrix unlocked`, 'info');
    }

    init();