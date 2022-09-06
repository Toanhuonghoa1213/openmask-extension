import { fromNano } from "@tonmask/web-sdk";
import { TransactionParams } from "../entries/transaction";
import { backgroundEventsEmitter } from "../event";
import ExtensionPlatform from "./extension";

/**
 * Service methods to manage notification PopUp
 *
 * @author: KuznetsovNikita
 * @since: 0.1.0
 */

const NOTIFICATION_HEIGHT = 620;
const NOTIFICATION_WIDTH = 380;

let popupId: number | undefined = undefined;

ExtensionPlatform.addOnRemovedListener((windowId) => {
  if (windowId === popupId) {
    backgroundEventsEmitter.emit("closedPopUp", {
      method: "closedPopUp",
      params: windowId,
    });
    popupId = undefined;
  }
});

const getPopup = async () => {
  const windows = await ExtensionPlatform.getAllWindows();
  return windows
    ? windows.find((win) => {
        return win && win.type === "popup" && win.id === popupId;
      })
    : null;
};

const openPopUp = async (page: string) => {
  const popup = await getPopup();
  if (popup && popup.id) {
    return await ExtensionPlatform.focusWindow(popup.id);
  } else {
    const lastFocused = await ExtensionPlatform.getLastFocusedWindow();
    // Position window in top right corner of lastFocused window.
    const top = lastFocused.top!;
    const left = lastFocused.left! + (lastFocused.width! - NOTIFICATION_WIDTH);

    // create new notification popup
    const popupWindow = await ExtensionPlatform.openWindow({
      url: `index.html#${page}`,
      type: "popup",
      width: NOTIFICATION_WIDTH,
      height: NOTIFICATION_HEIGHT,
      left,
      top,
    });

    popupId = popupWindow.id;
  }
};

export const openConnectDAppPopUp = async (
  id: number,
  origin: string,
  logo?: string
) => {
  const params = new URLSearchParams({
    id: String(id),
    origin: encodeURIComponent(origin),
    logo: encodeURIComponent(logo ?? ""),
  });

  await openPopUp(`/notification/dapp?${params.toString()}`);
  return popupId;
};

export const openConnectUnlockPopUp = async () => {
  await openPopUp(`/notification/unlock`);
  return popupId;
};

export const openSwitchChainPopUp = async (
  id: number,
  origin: string,
  network: string,
  logo?: string
) => {
  const params = new URLSearchParams({
    id: String(id),
    origin: encodeURIComponent(origin),
    logo: encodeURIComponent(logo ?? ""),
    network: network,
  });

  await openPopUp(`/notification/network?${params.toString()}`);
  return popupId;
};

export const closeCurrentPopUp = async (popupId: number | undefined) => {
  if (popupId) {
    try {
      await ExtensionPlatform.closeWindow(popupId);
    } catch (e) {
      console.error(e);
    }
  }
};

export const openSendTransactionPopUp = async (
  id: number,
  origin: string,
  props: TransactionParams
) => {
  const params = new URLSearchParams({
    address: encodeURIComponent(props.to),
    amount: encodeURIComponent(fromNano(props.value).toString()),
    comment: props.data ? encodeURIComponent(props.data) : "",
    submit: "1",
    id: String(id),
    origin: encodeURIComponent(origin),
  });
  await openPopUp(`/send?${params.toString()}`);

  return popupId;
};
