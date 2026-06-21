const express = require('express')
const router = express.Router()
const pool = require('../db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

router.post('/register', async (req, res) => {
  const { username, password } = req.body

  try {
    const existing = await pool.query(
      'SELECT * FROM users WHERE username = $1', [username]
    )
    
    if (existing.rows.length > 0 ) {
      return res.status(400).json({ error: 'Username Already Taken'})
    }

    const hashed = await bcrypt.hash(password, 10)

    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username', [username, hashed]
    )

    const userId = newUser.rows[0].id
    const trackNames = ['developer', 'gamer', 'anime']

    for (const trackName of trackNames) {
      await pool.query(
        'INSERT INTO tracks (user_id, track_name) VALUES ($1, $2)',
        [userId, trackName]
      )
    }
    res.status(201).json({ message: 'User created!', user: newUser.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message})
  }
})

router.post('/login', async (req, res) => {
  const  { username, password} = req.body

  try {
    const existing = await pool.query(
      'SELECT * FROM users WHERE username = $1', [username]
    )
    if (existing.rows.length === 0) {
  return res.status(400).json({ error: 'User not found' })
}

const user = existing.rows[0]
const match = await bcrypt.compare(password, user.password)

if (!match) {
  return res.status(400).json({ error: 'Wrong password!' })
}

const token = jwt.sign(
  { id: user.id, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

res.json({ message: 'Logged in!', token })

  } catch(err) {
    res.status(500).json({ error: err.message})
  }
})

module.exports = router