import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import * as StellarSdk from '../../lib';
import axios from 'axios';
import * as http from 'http';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedAxios = axios as any;

const { Server, FEDERATION_RESPONSE_MAX_SIZE } = StellarSdk.Federation;

describe("federation-server.js tests", () => {
  let server: StellarSdk.Federation.Server;

  beforeEach(() => {
    server = new Server("https://acme.com:1337/federation", "stellar.org");
    StellarSdk.Config.setDefault();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("FederationServer.constructor", () => {
    it("throws error for insecure server", () => {
      expect(
        () => new Server("http://acme.com:1337/federation", "stellar.org"),
      ).toThrow(/Cannot connect to insecure federation server/);
    });

    it("allow insecure server when opts.allowHttp flag is set", () => {
      expect(
        () =>
          new Server("http://acme.com:1337/federation", "stellar.org", {
            allowHttp: true,
          }),
      ).not.toThrow();
    });

    it("allow insecure server when global Config.allowHttp flag is set", () => {
      StellarSdk.Config.setAllowHttp(true);
      expect(
        () =>
          new Server("http://acme.com:1337/federation", "stellar.org", {
            allowHttp: true,
          }),
      ).not.toThrow();
    });
  });

  describe("FederationServer.resolveAddress", () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({
        data: {
          stellar_address: "bob*stellar.org",
          account_id:
            "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
        },
      });
    });

    it("requests is correct", async () => {
      const response = await server.resolveAddress("bob*stellar.org");
      
      expect((response as any).stellar_address).toBe("bob*stellar.org");
      expect(response.account_id).toBe(
        "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://acme.com:1337/federation?type=name&q=bob%2Astellar.org",
        expect.objectContaining({
          maxContentLength: FEDERATION_RESPONSE_MAX_SIZE,
          timeout: 0,
        })
      );
    });

    it("requests is correct for username as stellar address", async () => {
      const response = await server.resolveAddress("bob");
      
      expect((response as any).stellar_address).toBe("bob*stellar.org");
      expect(response.account_id).toBe(
        "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://acme.com:1337/federation?type=name&q=bob%2Astellar.org",
        expect.objectContaining({
          maxContentLength: FEDERATION_RESPONSE_MAX_SIZE,
          timeout: 0,
        })
      );
    });
  });

  describe("FederationServer.resolveAccountId", () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({
        data: {
          stellar_address: "bob*stellar.org",
          account_id:
            "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
        },
      });
    });

    it("requests is correct", async () => {
      const response = await server.resolveAccountId(
        "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
      );
      
      expect((response as any).stellar_address).toBe("bob*stellar.org");
      expect(response.account_id).toBe(
        "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://acme.com:1337/federation?type=id&q=GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
        expect.objectContaining({
          maxContentLength: FEDERATION_RESPONSE_MAX_SIZE,
          timeout: 0,
        })
      );
    });
  });

  describe("FederationServer.resolveTransactionId", () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({
        data: {
          stellar_address: "bob*stellar.org",
          account_id:
            "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
        },
      });
    });

    it("requests is correct", async () => {
      const response = await server.resolveTransactionId(
        "3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889",
      );
      
      expect((response as any).stellar_address).toBe("bob*stellar.org");
      expect(response.account_id).toBe(
        "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://acme.com:1337/federation?type=txid&q=3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889",
        expect.objectContaining({
          maxContentLength: FEDERATION_RESPONSE_MAX_SIZE,
          timeout: 0,
        })
      );
    });
  });

  describe("FederationServer.createForDomain", () => {
    it("creates correct object", async () => {
      mockedAxios.get.mockResolvedValue({
        data: `
#   The endpoint which clients should query to resolve stellar addresses
#   for users on your domain.
FEDERATION_SERVER="https://api.stellar.org/federation"
`,
      });

      const federationServer = await Server.createForDomain("acme.com");
      
      // Test that we get a valid federation server instance
      expect(federationServer).toBeInstanceOf(Server);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://acme.com/.well-known/stellar.toml",
        expect.objectContaining({
          maxContentLength: FEDERATION_RESPONSE_MAX_SIZE,
          timeout: 0,
        })
      );
    });

    it("fails when stellar.toml does not contain federation server info", async () => {
      mockedAxios.get.mockResolvedValue({
        data: "",
      });

      await expect(Server.createForDomain("acme.com"))
        .rejects.toThrow(/stellar.toml does not contain FEDERATION_SERVER field/);
    });
  });

  describe("FederationServer.resolve", () => {
    it("succeeds for a valid account ID", async () => {
      const result = await Server.resolve("GAFSZ3VPBC2H2DVKCEWLN3PQWZW6BVDMFROWJUDAJ3KWSOKQIJ4R5W4J");
      
      expect(result).toEqual({
        account_id: "GAFSZ3VPBC2H2DVKCEWLN3PQWZW6BVDMFROWJUDAJ3KWSOKQIJ4R5W4J",
      });
    });

    it("fails for invalid account ID", async () => {
      await expect(Server.resolve("invalid"))
        .rejects.toThrow(/Invalid Account ID/);
    });

    it("succeeds for a valid Stellar address", async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: `
#   The endpoint which clients should query to resolve stellar addresses
#   for users on your domain.
FEDERATION_SERVER="https://api.stellar.org/federation"
`,
        })
        .mockResolvedValueOnce({
          data: {
            stellar_address: "bob*stellar.org",
            account_id:
              "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
            memo_type: "id",
            memo: "100",
          },
        });

      const result = await Server.resolve("bob*stellar.org");
      
      expect(result).toEqual({
        stellar_address: "bob*stellar.org",
        account_id:
          "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
        memo_type: "id",
        memo: "100",
      });
      
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1,
        "https://stellar.org/.well-known/stellar.toml",
        expect.objectContaining({
          maxContentLength: FEDERATION_RESPONSE_MAX_SIZE,
          timeout: 0,
        })
      );
      expect(mockedAxios.get).toHaveBeenNthCalledWith(2,
        "https://api.stellar.org/federation?type=name&q=bob%2Astellar.org",
        expect.objectContaining({
          maxContentLength: FEDERATION_RESPONSE_MAX_SIZE,
          timeout: 0,
        })
      );
    });

    it("fails for invalid Stellar address", async () => {
      await expect(Server.resolve("bob*stellar.org*test"))
        .rejects.toThrow(/Invalid Stellar address/);
    });

    it("fails when memo is not string", async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          stellar_address: "bob*stellar.org",
          account_id:
            "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
          memo_type: "id",
          memo: 100,
        },
      });

      await expect(server.resolveAddress("bob*stellar.org"))
        .rejects.toThrow(/memo value should be of type string/);
    });

    it("fails when response exceeds the limit", async () => {
      // Unable to create temp server in a browser
      if (typeof window !== "undefined") {
        return;
      }
      
      const response = Array(FEDERATION_RESPONSE_MAX_SIZE + 10).join("a");
      
      return new Promise((resolve, reject) => {
        const tempServer = http
          .createServer((req, res) => {
            res.setHeader("Content-Type", "application/json; charset=UTF-8");
            res.end(response);
          })
          .listen(4444, async () => {
            try {
              const testServer = new Server("http://localhost:4444/federation", "stellar.org", {
                allowHttp: true,
              });
              
              await expect(testServer.resolveAddress("bob*stellar.org"))
                .rejects.toThrow(/federation response exceeds allowed size of [0-9]+/);
              
              tempServer.close();
              resolve(undefined);
            } catch (error) {
              tempServer.close();
              reject(error);
            }
          });
      });
    });
  });

  describe("FederationServer times out when response lags and timeout set", () => {
    afterEach(() => {
      StellarSdk.Config.setDefault();
    });

    let opts: any = { allowHttp: true };
    let message;
    for (let i = 0; i < 2; i++) {
      if (i === 0) {
        StellarSdk.Config.setTimeout(1000);
        message = "with global config set";
      } else {
        opts = { allowHttp: true, timeout: 1000 };
        message = "with instance opts set";
      }

      it(`resolveAddress times out ${message}`, async () => {
        // Unable to create temp server in a browser
        if (typeof window !== "undefined") {
          return;
        }

        return new Promise((resolve, reject) => {
          const tempServer = http
            .createServer((req, res) => {
              setTimeout(() => {}, 10000);
            })
            .listen(4444, async () => {
              try {
                const testServer = new Server("http://localhost:4444/federation", "stellar.org", opts);
                
                await expect(testServer.resolveAddress("bob*stellar.org"))
                  .rejects.toThrow(/timeout of 1000ms exceeded/);
                
                tempServer.close();
                resolve(undefined);
              } catch (error) {
                tempServer.close();
                reject(error);
              }
            });
        });
      });

      it(`resolveAccountId times out ${message}`, async () => {
        // Unable to create temp server in a browser
        if (typeof window !== "undefined") {
          return;
        }
        
        return new Promise((resolve, reject) => {
          const tempServer = http
            .createServer((req, res) => {
              setTimeout(() => {}, 10000);
            })
            .listen(4444, async () => {
              try {
                const testServer = new Server("http://localhost:4444/federation", "stellar.org", opts);
                
                await expect(testServer.resolveAccountId(
                  "GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS",
                )).rejects.toThrow(/timeout of 1000ms exceeded/);
                
                tempServer.close();
                resolve(undefined);
              } catch (error) {
                tempServer.close();
                reject(error);
              }
            });
        });
      });

      it(`resolveTransactionId times out ${message}`, async () => {
        // Unable to create temp server in a browser
        if (typeof window !== "undefined") {
          return;
        }
        
        return new Promise((resolve, reject) => {
          const tempServer = http
            .createServer((req, res) => {
              setTimeout(() => {}, 10000);
            })
            .listen(4444, async () => {
              try {
                const testServer = new Server("http://localhost:4444/federation", "stellar.org", opts);
                
                await expect(testServer.resolveTransactionId(
                  "3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889",
                )).rejects.toThrow(/timeout of 1000ms exceeded/);
                
                tempServer.close();
                resolve(undefined);
              } catch (error) {
                tempServer.close();
                reject(error);
              }
            });
        });
      });

      it(`createForDomain times out ${message}`, async () => {
        // Unable to create temp server in a browser
        if (typeof window !== "undefined") {
          return;
        }
        
        return new Promise((resolve, reject) => {
          const tempServer = http
            .createServer((req, res) => {
              setTimeout(() => {}, 10000);
            })
            .listen(4444, async () => {
              try {
                await expect(Server.createForDomain("localhost:4444", opts))
                  .rejects.toThrow(/timeout of 1000ms exceeded/);
                
                tempServer.close();
                resolve(undefined);
              } catch (error) {
                tempServer.close();
                reject(error);
              }
            });
        });
      });

      it(`resolve times out ${message}`, async () => {
        // Unable to create temp server in a browser
        if (typeof window !== "undefined") {
          return;
        }

        return new Promise((resolve, reject) => {
          const tempServer = http
            .createServer((req, res) => {
              setTimeout(() => {}, 10000);
            })
            .listen(4444, async () => {
              try {
                await expect(Server.resolve("bob*localhost:4444", opts))
                  .rejects.toThrow(/timeout of 1000ms exceeded/);
                
                tempServer.close();
                resolve(undefined);
              } catch (error) {
                tempServer.close();
                reject(error);
              }
            });
        });
      });
    }
  });
});
