import { test, beforeAll, afterAll, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { describe } from "node:test";
import { execSync } from "node:child_process";

describe("Transactions routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  test("O usuário consegue criar transacação", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "Testante teste",
        amount: 235,
        type: "credit",
      })
      .expect(201);
  });

  test("O usuário consegue listar transações", async () => {
    const createTransaction = await request(app.server)
      .post("/transactions")
      .send({
        title: "Testante teste",
        amount: 235,
        type: "credit",
      });

    const cookies = createTransaction.get("Set-Cookie");

    const transactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(transactionResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "Testante teste",
        amount: 235,
      }),
    ]);
  });

  test("O usuário consegue listar uma única transações", async () => {
    const createTransaction = await request(app.server)
      .post("/transactions")
      .send({
        title: "Buscando apena uma",
        amount: 120,
        type: "credit",
      });

    const cookies = createTransaction.get("Set-Cookie");

    const transactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    const transactionId = transactionResponse.body.transactions[0].id;

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "Buscando apena uma",
        amount: 120,
      })
    );
  });

  test("O usuário ver o total", async () => {
    const createTransaction = await request(app.server)
      .post("/transactions")
      .send({
        title: "Testante teste",
        amount: 235,
        type: "credit",
      });

    const cookies = createTransaction.get("Set-Cookie");

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "Testante debit",
        amount: 35,
        type: "debit",
      });

    const transactionSummaryResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200);

    expect(transactionSummaryResponse.body.summary).toEqual({
      amount: 200,
    });
  });
});
