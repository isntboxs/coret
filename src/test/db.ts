import { execFile as execFileCallback } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { Pool } from 'pg'

import { dbPool } from '#/server/db'

const execFile = promisify(execFileCallback)

const defaultTestDatabaseUrl =
	'postgresql://postgres:password@localhost:5432/coret_test'

type DatabaseTarget = {
	databaseName: string
	databaseUrl: string
}

type CommandError = Error & {
	stdout?: string
	stderr?: string
}

let schemaPrepared = false
let poolClosed = false

export function getTestDatabaseUrl() {
	return process.env.TEST_DATABASE_URL ?? defaultTestDatabaseUrl
}

export function assertTestDatabaseUrl(databaseUrl = getTestDatabaseUrl()) {
	const parsedUrl = new URL(databaseUrl)
	const databaseName = parsedUrl.pathname.slice(1)

	if (!databaseName) {
		throw new Error('TEST_DATABASE_URL must include a database')
	}

	if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
		throw new Error('TEST_DATABASE_URL database name must be alphanumeric')
	}

	if (!databaseName.endsWith('_test')) {
		throw new Error(
			`Refusing to reset non-test database "${databaseName}". Use a database name ending in "_test".`
		)
	}

	return {
		databaseName,
		databaseUrl,
	} satisfies DatabaseTarget
}

export async function prepareTestDatabase() {
	const target = assertTestDatabaseUrl()

	if (schemaPrepared) return

	await startDockerPostgres()
	await waitForDatabase(replaceDatabaseName(target.databaseUrl, 'postgres'))
	await createDatabaseIfMissing(target)
	await waitForDatabase(target.databaseUrl)
	await pushSchema(target.databaseUrl)

	schemaPrepared = true
}

export async function resetTestDatabase() {
	assertTestDatabaseUrl(process.env.DATABASE_URL)

	const tables = await dbPool.query<{ tablename: string }>(
		`
			select tablename
			from pg_tables
			where schemaname = 'public'
		`
	)

	if (tables.rows.length === 0) return

	const quotedTables = tables.rows
		.map(({ tablename }) => `"public"."${tablename.replaceAll('"', '""')}"`)
		.join(', ')

	await dbPool.query(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`)
}

export async function closeTestDatabase() {
	if (poolClosed) return

	poolClosed = true
	await dbPool.end()
}

async function startDockerPostgres() {
	await runCommand('docker', ['compose', 'up', '-d', 'postgres'])
}

async function createDatabaseIfMissing(target: DatabaseTarget) {
	const adminPool = new Pool({
		connectionString: replaceDatabaseName(target.databaseUrl, 'postgres'),
	})

	try {
		const existingDatabase = await adminPool.query<{ datname: string }>(
			`
				select datname
				from pg_database
				where datname = $1
			`,
			[target.databaseName]
		)

		if (existingDatabase.rows.length > 0) return

		await adminPool.query(`CREATE DATABASE "${target.databaseName}"`)
	} finally {
		await adminPool.end()
	}
}

async function pushSchema(databaseUrl: string) {
	const drizzleKitBin = resolve('node_modules/drizzle-kit/bin.cjs')

	if (existsSync(drizzleKitBin)) {
		await runCommand(
			process.execPath,
			[drizzleKitBin, 'push', '--config', 'drizzle.config.ts', '--force'],
			{
				DATABASE_URL: databaseUrl,
			}
		)
		return
	}

	await runCommand(
		'bunx',
		['drizzle-kit', 'push', '--config', 'drizzle.config.ts', '--force'],
		{
			DATABASE_URL: databaseUrl,
		}
	)
}

async function waitForDatabase(databaseUrl: string) {
	const attempts = 40

	for (let attempt = 1; attempt <= attempts; attempt++) {
		const pool = new Pool({ connectionString: databaseUrl })

		try {
			await pool.query('select 1')
			return
		} catch (error) {
			if (attempt === attempts) throw error
			await delay(500)
		} finally {
			await pool.end()
		}
	}
}

async function runCommand(
	command: string,
	args: Array<string>,
	extraEnv?: NodeJS.ProcessEnv
) {
	try {
		await execFile(command, args, {
			cwd: process.cwd(),
			env: {
				...process.env,
				...extraEnv,
			},
		})
	} catch (error: unknown) {
		const commandError = error as CommandError
		const output = [commandError.stderr, commandError.stdout]
			.filter((message) => typeof message === 'string' && message.length > 0)
			.join('\n')

		throw new Error(
			`Command failed: ${command} ${args.join(' ')}\n${
				output || commandError.message
			}`
		)
	}
}

function replaceDatabaseName(databaseUrl: string, databaseName: string) {
	const parsedUrl = new URL(databaseUrl)
	parsedUrl.pathname = `/${databaseName}`
	return parsedUrl.toString()
}

function delay(milliseconds: number) {
	return new Promise((resolveDelay) => {
		setTimeout(resolveDelay, milliseconds)
	})
}
