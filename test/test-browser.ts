import { vi } from 'vitest'
import StellarSdk from '../src'

(window as any).axios = StellarSdk.httpClient
(window as any).HorizonAxiosClient = StellarSdk.Horizon.AxiosClient
(window as any).SorobanAxiosClient = StellarSdk.Soroban.AxiosClient
(window as any).serverUrl = "https://horizon-live.stellar.org:1337/api/v1/jsonrpc";

(window as any).vi = vi
