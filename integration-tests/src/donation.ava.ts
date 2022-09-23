import { Worker, NearAccount, NEAR } from "near-workspaces";
import anyTest, { TestFn } from "ava";

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const caller = await root.createSubAccount("test-account-1", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  const beneficiary = await root.createSubAccount("beneficiary", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  console.log(beneficiary);

  const alice = await root.createSubAccount("alice", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  const bob = await root.createSubAccount("bob", {
    initialBalance: NEAR.parse("30 N").toJSON(),
  });

  await caller.deploy(process.argv[3]);

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, caller, beneficiary, alice, bob };
});

test.afterEach(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log("Failed to stop the Sandbox:", error);
  });
});

test("returns the default greeting", async (t) => {
  const { caller } = t.context.accounts;
  const message_1: string = await caller.view("get_beneficiary");

  t.is(message_1, "beneficiary.test.near");
});

// test("cannot be initialized twice", async (t) => {
//   const { caller, alice, beneficiary } = t.context.accounts;
//   await t.throwsAsync(
//     alice.call(caller, "init", { beneficiary: beneficiary.accountId })
//   );
// });

test("sends donations to the beneficiary", async (t) => {
  const { caller, alice, bob, beneficiary } = t.context.accounts;

  const balance = await beneficiary.balance();
  const available = parseFloat(balance.available.toHuman());

  await alice.call(
    caller,
    "donate",
    {},
    { attachedDeposit: NEAR.parse("1 N").toString() }
  );
  await bob.call(
    caller,
    "donate",
    {},
    { attachedDeposit: NEAR.parse("2 N").toString() }
  );

  const new_balance = await beneficiary.balance();
  const new_available = parseFloat(new_balance.available.toHuman());

  const FEES: number = 0.001;
  t.is(new_available, available + 3 - 2 * FEES);
});

test("records the donation", async (t) => {
  const { caller, alice, bob } = t.context.accounts;

  await alice.call(
    caller,
    "donate",
    {},
    { attachedDeposit: NEAR.parse("1 N").toString() }
  );
  await bob.call(
    caller,
    "donate",
    {},
    { attachedDeposit: NEAR.parse("2 N").toString() }
  );
  const donation_idx = await alice.call(
    caller,
    "donate",
    {},
    { attachedDeposit: NEAR.parse("3 N").toString() }
  );

  t.is(donation_idx, NEAR.parse("4 N").toString());

  const donation: Donation = await caller.view("get_donation_for_account", {
    account_id: alice,
  });

  const numberOfDonors: number = await caller.view("number_of_donors");

  t.is(donation.total_amount, NEAR.parse("4 N").toString());
  t.is(numberOfDonors, 2);
});

class Donation {
  account_id: string = "";
  total_amount: string = "";
}
