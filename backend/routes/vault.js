const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/vault/status — check if vault is set up
router.get('/status', async (req, res) => {
  try {
    const config = await db.get('SELECT pin_hash, hidden_modules FROM vault_config WHERE user_id = $1', [req.user.id]);
    res.json({ hasPin: !!(config && config.pin_hash), hiddenModules: config ? JSON.parse(config.hidden_modules || '[]') : [] });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/vault/set-pin — set or change PIN
router.post('/set-pin', async (req, res) => {
  try {
    const { pin, currentPin } = req.body;
    if (!pin || pin.length < 4) return res.status(400).json({ message: 'PIN must be at least 4 digits' });

    const existing = await db.get('SELECT pin_hash FROM vault_config WHERE user_id = $1', [req.user.id]);

    // If already has PIN, verify current
    if (existing && existing.pin_hash) {
      if (!currentPin) return res.status(400).json({ message: 'Current PIN required' });
      if (!bcrypt.compareSync(currentPin, existing.pin_hash)) return res.status(400).json({ message: 'Incorrect current PIN' });
    }

    const hash = bcrypt.hashSync(pin, 10);
    if (existing) {
      await db.run('UPDATE vault_config SET pin_hash = $1 WHERE user_id = $2', [hash, req.user.id]);
    } else {
      await db.run('INSERT INTO vault_config (user_id, pin_hash) VALUES ($1, $2)', [req.user.id, hash]);
    }
    res.json({ message: 'Vault PIN set successfully' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/vault/unlock — verify PIN
router.post('/unlock', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ message: 'PIN required' });
    const config = await db.get('SELECT pin_hash, hidden_modules FROM vault_config WHERE user_id = $1', [req.user.id]);
    if (!config || !config.pin_hash) return res.status(400).json({ message: 'Vault not set up' });
    if (!bcrypt.compareSync(pin, config.pin_hash)) return res.status(401).json({ message: 'Incorrect PIN' });
    res.json({ unlocked: true, hiddenModules: JSON.parse(config.hidden_modules || '[]') });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/vault/modules — update which modules are hidden
router.put('/modules', async (req, res) => {
  try {
    const { pin, hiddenModules } = req.body;
    if (!pin) return res.status(400).json({ message: 'PIN required for changes' });
    const config = await db.get('SELECT pin_hash FROM vault_config WHERE user_id = $1', [req.user.id]);
    if (!config || !bcrypt.compareSync(pin, config.pin_hash)) return res.status(401).json({ message: 'Incorrect PIN' });
    await db.run('UPDATE vault_config SET hidden_modules = $1 WHERE user_id = $2', [JSON.stringify(hiddenModules || []), req.user.id]);
    res.json({ message: 'Updated', hiddenModules });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
