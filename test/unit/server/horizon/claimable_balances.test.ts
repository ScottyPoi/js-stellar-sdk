import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as StellarSdk from '../../../../lib'

const { Horizon } = StellarSdk;

describe("ClaimableBalanceCallBuilder", () => {
  let server: StellarSdk.Horizon.Server;
  let axiosMock: any;

  beforeEach(() => {
    server = new Horizon.Server("https://horizon-live.stellar.org:1337");
    axiosMock = vi.spyOn(Horizon.AxiosClient, 'get').mockResolvedValue({} as any);
    vi.spyOn(Horizon.AxiosClient, 'post').mockResolvedValue({} as any);
    StellarSdk.Config.setDefault();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests the correct endpoint", async () => {
    let singleBalanceResponse = {
      _links: {
        self: {
          href: "horizon-live.stellar.org:1337/claimable_balances/00000000929b20b72e5890ab51c24f1cc46fa01c4f318d8d33367d24dd614cfdf5491072",
        },
      },
      id: "00000000929b20b72e5890ab51c24f1cc46fa01c4f318d8d33367d24dd614cfdf5491072",
      asset: "native",
      amount: "200.0000000",
      sponsor: "GBVFLWXYCIGPO3455XVFIKHS66FCT5AI64ZARKS7QJN4NF7K5FOXTJNL",
      last_modified_ledger: 38888,
      claimants: [
        {
          destination:
            "GBVFLWXYCIGPO3455XVFIKHS66FCT5AI64ZARKS7QJN4NF7K5FOXTJNL",
          predicate: {
            unconditional: true,
          },
        },
      ],
      paging_token:
        "38888-00000000929b20b72e5890ab51c24f1cc46fa01c4f318d8d33367d24dd614cfdf5491072",
    };

    vi.spyOn(Horizon.AxiosClient, 'get')
      .mockImplementation((url) => {
        if (url.includes("https://horizon-live.stellar.org:1337/claimable_balances/00000000929b20b72e5890ab51c24f1cc46fa01c4f318d8d33367d24dd614cfdf5491072")) {
          return Promise.resolve({ 
            data: singleBalanceResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

    const response = await server
      .claimableBalances()
      .claimableBalance(
        "00000000929b20b72e5890ab51c24f1cc46fa01c4f318d8d33367d24dd614cfdf5491072",
      )
      .call();
    
    expect(response).toEqual(singleBalanceResponse);
  });

  it('adds a "sponsor" query to the endpoint', async () => {
    const data = {
      _links: {
        self: {
          href: "https://horizon-live.stellar.org:1337/claimable_balances?sponsor=GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD&cursor=&limit=10&order=asc",
        },
        next: {
          href: "https://horizon-live.stellar.org:1337/claimable_balances?sponsor=GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD&cursor=&limit=10&order=asc",
        },
        prev: {
          href: "https://horizon-live.stellar.org:1337/claimable_balances?sponsor=GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD&cursor=&limit=10&order=desc",
        },
      },
      _embedded: {
        records: [],
      },
    };

    vi.spyOn(Horizon.AxiosClient, 'get')
      .mockImplementation((url) => {
        if (url.includes("https://horizon-live.stellar.org:1337/claimable_balances?sponsor=GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD")) {
          return Promise.resolve({ 
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

    const response = await server
      .claimableBalances()
      .sponsor("GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD")
      .call();
    
    expect(response.next).toBeTypeOf("function");
    expect(response.prev).toBeTypeOf("function");
  });

  it('adds a "claimant" query to the endpoint', async () => {
    const data = {
      _links: {
        self: {
          href: "https://horizon-live.stellar.org:1337/claimable_balances?claimant=GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD&cursor=&limit=10&order=asc",
        },
        next: {
          href: "https://horizon-live.stellar.org:1337/claimable_balances?claimant=GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD&cursor=&limit=10&order=asc",
        },
        prev: {
          href: "https://horizon-live.stellar.org:1337/claimable_balances?claimant=GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD&cursor=&limit=10&order=desc",
        },
      },
      _embedded: {
        records: [],
      },
    };

    vi.spyOn(Horizon.AxiosClient, 'get')
      .mockImplementation((url) => {
        if (url.includes("https://horizon-live.stellar.org:1337/claimable_balances?claimant=GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD")) {
          return Promise.resolve({ 
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

    const response = await server
      .claimableBalances()
      .claimant("GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD")
      .call();
    
    expect(response.next).toBeTypeOf("function");
    expect(response.prev).toBeTypeOf("function");
  });

  it('adds an "asset" query to the endpoint', async () => {
    const data = {
      _links: {
        self: {
          href: "https://horizon-live.stellar.org:1337/claimable_balances?asset=USD%3AGDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD&cursor=&limit=10&order=asc",
        },
        next: {
          href: "https://horizon-live.stellar.org:1337/claimable_balances?asset=USD%3AGDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD&cursor=&limit=10&order=asc",
        },
        prev: {
          href: "https://horizon-live.stellar.org:1337/claimable_balances?asset=USD%3AGDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD&cursor=&limit=10&order=desc",
        },
      },
      _embedded: {
        records: [],
      },
    };

    vi.spyOn(Horizon.AxiosClient, 'get')
      .mockImplementation((url) => {
        if (url.includes("https://horizon-live.stellar.org:1337/claimable_balances?asset=USD%3AGDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD")) {
          return Promise.resolve({ 
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

    const response = await server
      .claimableBalances()
      .asset(
        new StellarSdk.Asset(
          "USD",
          "GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD",
        ),
      )
      .call();
    
    expect(response.next).toBeTypeOf("function");
    expect(response.prev).toBeTypeOf("function");
  });
});
