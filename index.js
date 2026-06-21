const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express() 

app.use(cors())
app.use(express.json())

const authRoutes = require('./routes/auth') 
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.send('Study Tracker API is running!')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

const trackRoutes = require('./routes/tracks')
app.use('/api/tracks', trackRoutes)