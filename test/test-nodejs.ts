import { vi } from 'vitest'
import { expect } from 'vitest'
import StellarSdk from '../src'
import axios from 'axios'

global.StellarSdk = StellarSdk
global.axios = axios
global.serverUrl = "https://horizon-live.stellar.org:1337/api/v1/jsonrpc"
global.expect = expect
global.vi = vi
