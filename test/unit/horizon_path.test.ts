import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as StellarSdk from '../../lib'

const { Horizon } = StellarSdk;

describe("horizon path tests", () => {
  let axiosMock: any;

  beforeEach(() => {
    axiosMock = vi.spyOn(Horizon.AxiosClient, 'get').mockResolvedValue({} as any);
    vi.spyOn(Horizon.AxiosClient, 'post').mockResolvedValue({} as any);
    StellarSdk.Config.setDefault();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function test_horizon_paths(serverUrl) {
    let server = new Horizon.Server(serverUrl);

    let randomResult: any = {
      data: {
        url: serverUrl,
        random: Math.round(1000 * Math.random()),
        endpoint: "bogus",
      },
    };

    function prepareAxios(mockMethod: 'get' | 'post', endpoint: string, postData?: string) {
      randomResult.endpoint = endpoint;
      if (mockMethod === 'get') {
        vi.spyOn(Horizon.AxiosClient, 'get')
          .mockImplementation((url) => {
            if (url.includes(serverUrl + endpoint)) {
              return Promise.resolve(randomResult);
            }
            return Promise.reject(new Error('Unexpected URL'));
          });
      } else if (mockMethod === 'post') {
        vi.spyOn(Horizon.AxiosClient, 'post')
          .mockImplementation((url, data) => {
            if (url.includes(serverUrl + endpoint) && (!postData || data?.includes(postData))) {
              return Promise.resolve(randomResult);
            }
            return Promise.reject(new Error('Unexpected URL or data'));
          });
      }
    }

    it("server.accounts() " + serverUrl, async () => {
      prepareAxios('get', "/accounts");
      const result = await server.accounts().call();
      expect(result).toEqual(randomResult.data);
    });

    it(
      "server.accounts().accountId('fooAccountId') " + serverUrl,
      async () => {
        prepareAxios('get', "/accounts/fooAccountId");
        const result = await server
          .accounts()
          .accountId("fooAccountId")
          .call();
        expect(result).toEqual(randomResult.data);
      },
    );

    it("server.transactions() " + serverUrl, async () => {
      prepareAxios('get', "/transactions");
      const result = await server
        .transactions()
        .call();
      expect(result).toEqual(randomResult.data);
    });

    it(
      "server.transactions().includeFailed(true) " + serverUrl,
      async () => {
        prepareAxios('get', "/transactions?include_failed=true");
        const result = await server
          .transactions()
          .includeFailed(true)
          .call();
        expect(result).toEqual(randomResult.data);
      },
    );

    it("server.operations().includeFailed(true) " + serverUrl, async () => {
      prepareAxios('get', "/operations?include_failed=true");
      const result = await server
        .operations()
        .includeFailed(true)
        .call();
      expect(result).toEqual(randomResult.data);
    });

    it("server.payments().includeFailed(true) " + serverUrl, async () => {
      prepareAxios('get', "/payments?include_failed=true");
      const result = await server
        .payments()
        .includeFailed(true)
        .call();
      expect(result).toEqual(randomResult.data);
    });

    it(
      "server.transactions().transaction('fooTransactionId') " + serverUrl,
      async () => {
        prepareAxios('get', "/transactions/fooTransactionId");
        const result = await server
          .transactions()
          .transaction("fooTransactionId")
          .call();
        expect(result).toEqual(randomResult.data);
      },
    );

    it(
      "server.transactions().forAccount('fooAccountId') " + serverUrl,
      async () => {
        prepareAxios('get', "/accounts/fooAccountId/transactions");
        const result = await server
          .transactions()
          .forAccount("fooAccountId")
          .call();
        expect(result).toEqual(randomResult.data);
      },
    );

    it("server.submitTransaction() " + serverUrl, async () => {
      randomResult.endpoint = "post";

      let keypair = StellarSdk.Keypair.random();
      let account = new StellarSdk.Account(
        keypair.publicKey(),
        "56199647068161",
      );

      let fakeTransaction = new StellarSdk.TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: keypair.publicKey(),
            asset: StellarSdk.Asset.native(),
            amount: "100.50",
          }),
        )
        .setTimeout(StellarSdk.TimeoutInfinite)
        .build();
      fakeTransaction.sign(keypair);
      let tx = encodeURIComponent(
        fakeTransaction.toEnvelope().toXDR().toString("base64"),
      );

      prepareAxios('post', "/transactions", `tx=${tx}`);

      const result = await server
        .submitTransaction(fakeTransaction, { skipMemoRequiredCheck: true });
      expect(result).toEqual(randomResult.data);
    });
  }

  let serverUrls = [];

  //server url without folder path.
  serverUrls.push("https://acme.com:1337");

  //server url folder path.
  serverUrls.push("https://acme.com:1337/folder");

  //server url folder and subfolder path.
  serverUrls.push("https://acme.com:1337/folder/subfolder");

  for (var index = 0; index < serverUrls.length; index++) {
    var serverUrl = serverUrls[index];
    test_horizon_paths(serverUrl);
  }
});
