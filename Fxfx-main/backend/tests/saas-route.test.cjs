'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const express = require('express')
const saasRoutes = require('../dist/saas/saas-route.js').default

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/saas', saasRoutes)
  return app
}

test('SaaS registration reveals a newly minted key once, but usage reads never expose it', async () => {
  const server = http.createServer(createApp())
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api/saas`
  try {
    const register = await fetch(`${base}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ companyName: `Security Test ${Date.now()}` }),
    })
    assert.equal(register.status, 201)
    const registered = await register.json()
    assert.match(registered.tenant.apiKey, /^fx_[0-9a-f]{32}$/)
    const tenantId = registered.tenant.tenantId

    const usage = await fetch(`${base}/usage/${tenantId}`)
    assert.equal(usage.status, 200)
    const publicRecord = await usage.json()
    assert.equal(publicRecord.tenant.tenantId, tenantId)
    assert.equal(Object.hasOwn(publicRecord.tenant, 'apiKey'), false)
    assert.equal(JSON.stringify(publicRecord).includes(registered.tenant.apiKey), false)
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})
