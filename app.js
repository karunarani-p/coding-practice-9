const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
let db = null
const dbPath = path.join(__dirname, 'userData.db')

const initialize = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
initialize()

const validatePassword = password => {
  return password.length > 4
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * From user WHERE username='${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefine) {
    const createUserQuery = `INSERT INTO user(username,name,password,gender,location)
        VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}')`
    if (validatePassword(password)) {
      await db.run(createUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserName = `SELECT * FROM user WHERE username='${username}'`

  const dbUser = await db.get(selectUserName)
  if (dbUser === undefine) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isMatchedPassword = await bcrypt.compare(password, dbUser.password)
    if (isMatchedPassword === true) {
      response.status(200)
      response.send('Login success')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefine) {
    response.status(400)
    response.send('Invalid password')
  } else {
    const isMatchedPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isMatchedPassword === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatePassword = `UPDATE user SET password='${hashedPassword}' WHERE username='${username}'`
        const user = await db.run(updatePassword)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Passwoord is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
