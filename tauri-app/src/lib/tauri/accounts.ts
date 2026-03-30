import { invoke } from "@tauri-apps/api/core";

import type { AccountSummary, SaveAccountInput } from "../../types/accounts";

export function listAccounts() {
  return invoke<AccountSummary[]>("list_accounts");
}

export function saveAccount(input: SaveAccountInput) {
  return invoke<AccountSummary>("save_account", { input });
}

export function setAccountEnabled(accountId: string, enabled: boolean) {
  return invoke<AccountSummary>("set_account_enabled", { accountId, enabled });
}

export function deleteAccount(accountId: string) {
  return invoke<void>("delete_account", { accountId });
}
