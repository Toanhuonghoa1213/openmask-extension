import { QueryClient } from "@tanstack/react-query";
import TonWeb from "tonweb";
import * as tonMnemonic from "tonweb-mnemonic";
import browser from "webextension-polyfill";
import { AccountState } from "../../libs/entries/account";
import { decrypt } from "../../libs/service/cryptoService";
import { QueryType } from "../../libs/store/browserStore";
import { checkForError } from "../../libs/utils";

export const saveAccountState = async (
  network: string,
  client: QueryClient,
  value: AccountState
) => {
  const { local } = browser.storage;
  await local.set({ [`${network}_${QueryType.account}`]: value });
  const err = checkForError();
  if (err) {
    throw err;
  }
  client.setQueryData([network, QueryType.account], value);
  await client.invalidateQueries([network, value.activeWallet]);
};

const balanceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export const formatTonValue = (value: string): string => {
  return balanceFormat.format(parseFloat(TonWeb.utils.fromNano(value)));
};

export const toShortAddress = (address: string): string => {
  return address.slice(0, 4) + "...." + address.slice(-4);
};

export const validateMnemonic = (mnemonic: string[]) => {
  if (!tonMnemonic.validateMnemonic(mnemonic) || mnemonic.length !== 24) {
    throw new Error("Mnemonic is not valid");
  }
};

export const decryptMnemonic = async (mnemonic: string, password: string) => {
  const worlds = await decrypt(mnemonic, password);
  validateMnemonic(worlds.split(" "));
  return worlds;
};
