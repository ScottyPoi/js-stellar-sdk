import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as StellarSdk from '../../lib'

const { Horizon } = StellarSdk;

function buildTransaction(destination: string, operations: any[] = [], builderOpts: any = {}) {
  let txBuilderOpts = {
    fee: "100",
    networkPassphrase: StellarSdk.Networks.TESTNET,
    v1: true,
  };
  Object.assign(txBuilderOpts, builderOpts);
  let keypair = StellarSdk.Keypair.random();
  let account = new StellarSdk.Account(keypair.publicKey(), "56199647068161");
  let transactionBuilder = new StellarSdk.TransactionBuilder(
    account,
    txBuilderOpts,
  ).addOperation(
    StellarSdk.Operation.payment({
      destination: destination,
      asset: StellarSdk.Asset.native(),
      amount: "100.50",
    }),
  );

  operations.forEach((op) => (transactionBuilder = transactionBuilder.addOperation(op)));

  let transaction = transactionBuilder.setTimeout(StellarSdk.TimeoutInfinite).build();
  transaction.sign(keypair);

  if (builderOpts.feeBump) {
    return StellarSdk.TransactionBuilder.buildFeeBumpTransaction(
      keypair,
      "200",
      transaction,
      txBuilderOpts.networkPassphrase,
    );
  } else {
    return transaction;
  }
}

function buildAccount(id: string, data: any = {}) {
  return {
    _links: {
      data: {
        href: `https://horizon-testnet.stellar.org/accounts/${id}/data/{key}`,
        templated: true,
      },
    },
    id: id,
    account_id: id,
    sequence: "3298702387052545",
    subentry_count: 1,
    last_modified_ledger: 768061,
    thresholds: {
      low_threshold: 0,
      med_threshold: 0,
      high_threshold: 0,
    },
    flags: {
      auth_required: false,
      auth_revocable: false,
      auth_immutable: false,
    },
    balances: [
      {
        balance: "9999.9999900",
        buying_liabilities: "0.0000000",
        selling_liabilities: "0.0000000",
        asset_type: "native",
      },
    ],
    signers: [
      {
        weight: 1,
        key: id,
        type: "ed25519_public_key",
      },
    ],
    data: data,
  };
}

function mockAccountRequest(id: string, status: number, data = {}) {
  let response;

  switch (status) {
    case 404:
      response = Promise.reject({
        response: { status: 404, statusText: "NotFound", data: {} },
      });
      break;
    case 400:
      response = Promise.reject({
        response: { status: 400, statusText: "BadRequestError", data: {} },
      });
      break;
    default:
      response = Promise.resolve({ data: buildAccount(id, data) });
      break;
  }

  vi.spyOn(Horizon.AxiosClient, 'get').mockImplementationOnce((url: string) => {
    if (url.includes(`/accounts/${id}`)) {
      return response;
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
}

describe("server.js check-memo-required", () => {
  let server: StellarSdk.Horizon.Server;

  beforeEach(() => {
    server = new Horizon.Server("https://horizon-testnet.stellar.org");
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fails if memo is required", async () => {
    let accountId = "GAYHAAKPAQLMGIJYMIWPDWCGUCQ5LAWY4Q7Q3IKSP57O7GUPD3NEOSEA";
    mockAccountRequest(accountId, 200, {
      "config.memo_required": "MQ==",
    });
    let transaction = buildTransaction(accountId);

    try {
      await server.checkMemoRequired(transaction);
      expect.fail("promise should have failed");
    } catch (err: any) {
      expect(err).toBeInstanceOf(StellarSdk.AccountRequiresMemoError);
      expect(err.accountId).toBe(accountId);
      expect(err.operationIndex).toBe(0);
    }
  });

  it("fee bump - fails if memo is required", async () => {
    let accountId = "GAYHAAKPAQLMGIJYMIWPDWCGUCQ5LAWY4Q7Q3IKSP57O7GUPD3NEOSEA";
    mockAccountRequest(accountId, 200, {
      "config.memo_required": "MQ==",
    });
    let transaction = buildTransaction(accountId, [], { feeBump: true });

    try {
      await server.checkMemoRequired(transaction);
      expect.fail("promise should have failed");
    } catch (err: any) {
      expect(err).toBeInstanceOf(StellarSdk.AccountRequiresMemoError);
      expect(err.accountId).toBe(accountId);
      expect(err.operationIndex).toBe(0);
    }
  });

  it("returns false if account doesn't exist", async () => {
    let accountId = "GAYHAAKPAQLMGIJYMIWPDWCGUCQ5LAWY4Q7Q3IKSP57O7GUPD3NEOSEA";
    mockAccountRequest(accountId, 404, {});
    let transaction = buildTransaction(accountId);

    await expect(server.checkMemoRequired(transaction)).resolves.toBeUndefined();
  });

  it("returns false if data field is not present", async () => {
    let accountId = "GAYHAAKPAQLMGIJYMIWPDWCGUCQ5LAWY4Q7Q3IKSP57O7GUPD3NEOSEA";
    mockAccountRequest(accountId, 200, {});
    let transaction = buildTransaction(accountId);

    await expect(server.checkMemoRequired(transaction)).resolves.toBeUndefined();
  });

  it("returns err with client errors", async () => {
    let accountId = "GAYHAAKPAQLMGIJYMIWPDWCGUCQ5LAWY4Q7Q3IKSP57O7GUPD3NEOSEA";
    mockAccountRequest(accountId, 400, {});
    let transaction = buildTransaction(accountId);

    try {
      await server.checkMemoRequired(transaction);
      expect.fail("promise should have failed");
    } catch (err: any) {
      expect(err).toBeInstanceOf(StellarSdk.NetworkError);
    }
  });

  it("doesn't repeat account check if the destination is more than once", async () => {
    let accountId = "GAYHAAKPAQLMGIJYMIWPDWCGUCQ5LAWY4Q7Q3IKSP57O7GUPD3NEOSEA";
    mockAccountRequest(accountId, 200, {});

    let operations = [
      StellarSdk.Operation.payment({
        destination: accountId,
        asset: StellarSdk.Asset.native(),
        amount: "100.50",
      }),
    ];

    let transaction = buildTransaction(accountId, operations);

    await expect(server.checkMemoRequired(transaction)).resolves.toBeUndefined();
  });

  it("other operations", async () => {
    let accountId = "GAYHAAKPAQLMGIJYMIWPDWCGUCQ5LAWY4Q7Q3IKSP57O7GUPD3NEOSEA";
    mockAccountRequest(accountId, 200, {});

    const destinations = [
      "GASGNGGXDNJE5C2O7LDCATIVYSSTZKB24SHYS6F4RQT4M4IGNYXB4TIV",
      "GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB",
      "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ",
    ];

    const usd = new StellarSdk.Asset(
      "USD",
      "GBBM6BKZPEHWYO3E3YKREDPQXMS4VK35YLNU7NFBRI26RAN7GI5POFBB",
    );
    const eur = new StellarSdk.Asset(
      "EUR",
      "GDTNXRLOJD2YEBPKK7KCMR7J33AAG5VZXHAJTHIG736D6LVEFLLLKPDL",
    );
    const liquidityPoolAsset = new StellarSdk.LiquidityPoolAsset(eur, usd, 30);

    let operations = [
      StellarSdk.Operation.accountMerge({
        destination: destinations[0],
      }),
      StellarSdk.Operation.pathPaymentStrictReceive({
        sendAsset: StellarSdk.Asset.native(),
        sendMax: "5.0000000",
        destination: destinations[1],
        destAsset: StellarSdk.Asset.native(),
        destAmount: "5.50",
        path: [usd, eur],
      }),
      StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: StellarSdk.Asset.native(),
        sendAmount: "5.0000000",
        destination: destinations[2],
        destAsset: StellarSdk.Asset.native(),
        destMin: "5.50",
        path: [usd, eur],
      }),
      StellarSdk.Operation.changeTrust({
        asset: usd,
      }),
      StellarSdk.Operation.changeTrust({
        asset: liquidityPoolAsset,
      }),
    ];

    destinations.forEach((d) => mockAccountRequest(d, 200, {}));

    let transaction = buildTransaction(accountId, operations);

    await expect(server.checkMemoRequired(transaction)).resolves.toBeUndefined();
  });
  it("checks for memo required by default", async () => {
    let accountId = "GAYHAAKPAQLMGIJYMIWPDWCGUCQ5LAWY4Q7Q3IKSP57O7GUPD3NEOSEA";
    let memo = StellarSdk.Memo.text("42");
    let transaction = buildTransaction(accountId, [], { memo });
    
    await expect(server.checkMemoRequired(transaction)).resolves.toBeUndefined();
  });
});
