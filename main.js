"use strict"
const { networkInterfaces } = require('os')
const axios = require('axios')
const log4js = require("log4js")
const config = require('config')

// Read configure file(s).
const webhookURL = config.get('webhookURL')
const logLevel = config.get('logLevel')

// Add logger.
const logger = log4js.getLogger("ip-reporter")
logger.level = logLevel

// Log configure(s).
logger.info(`webhookURL: ${webhookURL.slice(0, 9)}...`)
logger.info(`logLevel: ${logLevel}`)

// Net interface result in last time.
let stringNetsLast = ""
// Net interface result now.
let stringNet = ""
// Queue for send message.
let messageQueue = new Array()

// Timer for check net interface.
setInterval( () => {
  // Check net interface and record name and addresses.
  const nets = networkInterfaces()
  stringNet = ""
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      stringNet += `${name} ${net.address}\n`
    }
  }

  // If net interface is changed,
  //   send net interface to message queue.
  if(stringNetsLast !== stringNet) {
    messageQueue.push(stringNet)
    logger.info("Detect net interface change.")
    logger.debug(stringNet)
    stringNetsLast = stringNet
  }
}, 1000)

setInterval( () => {
  try {
    if(messageQueue[0]) {
      logger.info("Send message.")
      sendMessage(messageQueue[0])
    }
  } catch (error) {
    logger.error(error)
  } finally {
    messageQueue.pop()
  }
}, 1000)

async function sendMessage(massage) {
  try {
    const response = await axios.post(webhookURL, {
      content: massage
    })
    logger.info(`Http responsed, status: ${response.status}`)
  } catch (error) {
    throw(error)
  }
}
