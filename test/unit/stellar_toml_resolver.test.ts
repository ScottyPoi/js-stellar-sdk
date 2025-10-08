import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as StellarSdk from '../../lib'
import { httpClient } from '../../lib/http-client'
import * as http from 'http'

const { Resolver, STELLAR_TOML_MAX_SIZE } = StellarSdk.StellarToml;

describe("stellar_toml_resolver.js tests", () => {
  beforeEach(() => {
    StellarSdk.Config.setDefault();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Resolver.resolve", () => {
    afterEach(() => {
      StellarSdk.Config.setDefault();
    });

    it("returns stellar.toml object for valid request and stellar.toml file", async () => {
      vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
        data: `
#   The endpoint which clients should query to resolve stellar addresses
#   for users on your domain.
FEDERATION_SERVER="https://api.stellar.org/federation"
`,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });

      const stellarToml = await Resolver.resolve("acme.com");
      expect(stellarToml.FEDERATION_SERVER).toBe(
        "https://api.stellar.org/federation",
      );
    });

    it("returns stellar.toml object for valid request and stellar.toml file when allowHttp is `true`", async () => {
      vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
        data: `
#   The endpoint which clients should query to resolve stellar addresses
#   for users on your domain.
FEDERATION_SERVER="http://api.stellar.org/federation"
`,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });

      const stellarToml = await Resolver.resolve("acme.com", {
        allowHttp: true,
      });
      expect(stellarToml.FEDERATION_SERVER).toBe(
        "http://api.stellar.org/federation",
      );
    });

    it("returns stellar.toml object for valid request and stellar.toml file when global Config.allowHttp flag is set", async () => {
      StellarSdk.Config.setAllowHttp(true);

      vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
        data: `
#   The endpoint which clients should query to resolve stellar addresses
#   for users on your domain.
FEDERATION_SERVER="http://api.stellar.org/federation"
`,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });

      const stellarToml = await Resolver.resolve("acme.com");
      expect(stellarToml.FEDERATION_SERVER).toBe(
        "http://api.stellar.org/federation",
      );
    });

    it("rejects when stellar.toml file is invalid", async () => {
      vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
        data: `
/#   The endpoint which clients should query to resolve stellar addresses
#   for users on your domain.
FEDERATION_SERVER="https://api.stellar.org/federation"
`,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });

      await expect(Resolver.resolve("acme.com")).rejects.toThrow(/Parsing error on line/);
    });

    it("rejects when there was a connection error", async () => {
      vi.spyOn(httpClient, 'get').mockRejectedValueOnce(new Error('Connection failed'));

      await expect(Resolver.resolve("acme.com")).rejects.toThrow();
    });

    it("fails when response exceeds the limit", async () => {
      // Unable to create temp server in a browser
      if (typeof window != "undefined") {
        return;
      }
      var response = Array(STELLAR_TOML_MAX_SIZE + 10).join("a");
      
      await new Promise<void>((resolve, reject) => {
        let tempServer = http
          .createServer((req, res) => {
            res.setHeader("Content-Type", "text/x-toml; charset=UTF-8");
            res.end(response);
          })
          .listen(4444, async () => {
            try {
              await expect(Resolver.resolve("localhost:4444", {
                allowHttp: true,
              })).rejects.toThrow(
                /stellar.toml file exceeds allowed size of [0-9]+/,
              );
              resolve();
            } catch (error) {
              reject(error);
            } finally {
              tempServer.close();
            }
          });
      });
    });

    it("rejects after given timeout when global Config.timeout flag is set", async () => {
      StellarSdk.Config.setTimeout(1000);

      // Unable to create temp server in a browser
      if (typeof window != "undefined") {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        let tempServer = http
          .createServer((req, res) => {
            setTimeout(() => {}, 10000);
          })
          .listen(4444, async () => {
            try {
              await expect(Resolver.resolve("localhost:4444", {
                allowHttp: true,
              })).rejects.toThrow(/timeout of 1000ms exceeded/);
              resolve();
            } catch (error) {
              reject(error);
            } finally {
              StellarSdk.Config.setDefault();
              tempServer.close();
            }
          });
      });
    });

    it("rejects after given timeout when timeout specified in Resolver opts param", async () => {
      // Unable to create temp server in a browser
      if (typeof window != "undefined") {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        let tempServer = http
          .createServer((req, res) => {
            setTimeout(() => {}, 10000);
          })
          .listen(4444, async () => {
            try {
              await expect(Resolver.resolve("localhost:4444", {
                allowHttp: true,
                timeout: 1000,
              })).rejects.toThrow(/timeout of 1000ms exceeded/);
              resolve();
            } catch (error) {
              reject(error);
            } finally {
              tempServer.close();
            }
          });
      });
    });

    it("rejects redirect response when allowedRedirects is not specified", async () => {
      // Unable to create temp server in a browser
      if (typeof window != "undefined") {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        let tempServer = http
          .createServer((req, res) => {
            if (req.url === "/.well-known/stellar.toml") {
              res.writeHead(302, { location: "http://localhost:4444/redirect" });
              return res.end();
            }
            res.writeHead(404);
            res.end("Not found");
          })
          .listen(4444, async () => {
            try {
              await expect(Resolver.resolve("localhost:4444", {
                allowHttp: true,
              })).rejects.toThrow(/Request failed with status code 302/);
              resolve();
            } catch (error) {
              reject(error);
            } finally {
              tempServer.close();
            }
          });
      });
    });

    it("returns handled redirect when allowedRedirects is specified", async () => {
      if (typeof window != "undefined") {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        let tempServer = http
          .createServer((req, res) => {
            // Ensure we handle the exact path that will be requested
            if (req.url === "/.well-known/stellar.toml") {
              res.setHeader("Location", "http://localhost:4444/redirect");
              res.writeHead(302);
              res.end();
              return;
            }
            if (req.url === "/redirect") {
              res.setHeader("Content-Type", "text/x-toml; charset=UTF-8");
              res.writeHead(200);
              res.end(`FEDERATION_SERVER="https://api.stellar.org/federation"`);
              return;
            }
            // Default 404 for any other requests
            res.writeHead(404);
            res.end("Not found");
          })
          .listen(4444, async () => {
            // Give the server a moment to be fully ready
            await new Promise(r => setTimeout(r, 10));
            try {
              const response = await Resolver.resolve("localhost:4444", {
                allowHttp: true,
                allowedRedirects: 1,
              });
              expect(response.FEDERATION_SERVER).toBe(
                "https://api.stellar.org/federation",
              );
              resolve();
            } catch (error) {
              reject(error);
            } finally {
              tempServer.close();
            }
          });
      });
    });
  });
});
