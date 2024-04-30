const util = require('util')
const {configure, getLogger} = require('log4js')
const config = require('./config.json')
const {getNamespace} = require('cls-hooked')
const {v4: uuidv4} = require('uuid');

const session = getNamespace('sopei')
