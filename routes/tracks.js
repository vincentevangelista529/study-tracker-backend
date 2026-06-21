const express = require('express')
const router = express.Router()
const pool = require('../db')
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/auth')

router.get('/', authenticateToken, async(req, res) => {
  try{
    const tracks = await pool.query(
      'SELECT * FROM tracks WHERE user_id = $1',
      [req.user.id]
    )
    res.json(tracks.rows)
  } catch (err){
    res.status(500).json({ error: err.message })
  }
})

router.post('/session', authenticateToken, async(req, res) => {
  const { track_name, duration } =req.body
  const user_id = req.user.id
  const exp_earned = Math.round((duration / 60) * 100)

  try {
     await pool.query(
      'INSERT INTO sessions (user_id, track_name, duration, exp_earned) VALUES ($1, $2, $3, $4)',
      [user_id, track_name, duration, exp_earned]
     )

     await pool.query(
      'UPDATE tracks SET total_exp = total_exp +$1 WHERE user_id = $2 AND track_name = $3',
      [exp_earned, user_id, track_name]
     )

     const updated = await pool.query(
      'SELECT * FROM tracks WHERE user_id = $1 AND track_name =$2',
      [user_id, track_name]
     )

     const newExp = updated.rows[0]?.total_exp || 0
     let newLevel = 1
     if (newExp >= 4000) newLevel = 5
     else if (newExp >= 2000) newLevel = 4
     else if (newExp >= 1000) newLevel = 3
     else if (newExp >= 500) newLevel = 2
     
     await pool.query(
      'UPDATE tracks SET level =$1 WHERE user_id = $2 AND track_name = $3',
      [newLevel, user_id, track_name]
     )
    

   res.json({ 
  message: 'Session logged!', 
  track: { ...updated.rows[0], level: newLevel },  
  exp_earned 
})
  } catch (err){
    res.status(500).json({ error: err.message })
  }
})

module.exports = router