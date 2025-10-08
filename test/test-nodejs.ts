import { vi } from 'vitest'
import { expect } from 'vitest'
import StellarSdk from '../src'
import axios from 'axios'

(global as any).StellarSdk = StellarSdk;
(global as any).axios = axios;
(global as any).serverUrl = "https://horizon-live.stellar.org:1337/api/v1/jsonrpc";
(global as any).expect = expect;
(global as any).vi = vi
