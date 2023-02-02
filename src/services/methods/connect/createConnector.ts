import WalletConnectClient from '@walletconnect/client';
import QRCode from 'qrcode';
import type {
  Broadcast,
  WCSSetState,
  WCSState,
  ConnectData,
  ModalData,
  WalletId,
} from '../../../types';
import {
  CONNECTION_TYPES,
  CONNECTOR_EVENTS,
  WALLET_APP_EVENTS,
  WINDOW_MESSAGES,
} from '../../../consts';
import { getAccountInfo, sendWalletEvent } from '../../../utils';

interface Props {
  bridge: string;
  broadcast: Broadcast;
  getState: () => WCSState;
  noPopup?: boolean;
  prohibitGroups?: boolean;
  requiredAddress?: string;
  resetState: () => void;
  setState: WCSSetState;
  startConnectionTimer: () => void;
  state: WCSState;
  updateModal: (newModalData: Partial<ModalData>) => void;
}

export const createConnector = ({
  bridge,
  broadcast,
  getState,
  noPopup,
  prohibitGroups,
  requiredAddress,
  resetState,
  setState,
  state,
  startConnectionTimer,
  updateModal,
}: Props) => {
  class QRCodeModal {
    open = async (data: string) => {
      // Check for address and prohibit groups values to append to the wc value for the wallet to read when connecting
      const requiredAddressParam = requiredAddress
        ? `&address=${requiredAddress}`
        : '';
      const prohibitGroupsParam = prohibitGroups ? `&prohibitGroups=true` : '';
      const fullData = `${data}${requiredAddressParam}${prohibitGroupsParam}`;
      const qrcode = await QRCode.toDataURL(fullData);
      updateModal({ QRCode: qrcode, QRCodeUrl: fullData, showModal: !noPopup });
    };

    close = () => {
      updateModal({ showModal: false });
    };
  }
  const qrcodeModal = new QRCodeModal();
  // Create new connector
  const newConnector = new WalletConnectClient({ bridge, qrcodeModal });

  // ------------------------
  // CONNECT EVENT
  // ------------------------
  // - Calculate new connection EST/EXP
  // - Save accounts (account data), peer, connection EST/EXP, and connected value to walletConnectService
  // - Broadcast "connect" event (let the dApp know)
  // - Start the "connection timer" to auto-disconnect wcjs when session is expired
  // - Trigger wallet event for "connect" (let the wallet know)
  newConnector.on(CONNECTOR_EVENTS.connect, (error, payload: ConnectData) => {
    if (error) throw error;
    const connectionEST = Date.now();
    const connectionEXP = state.connectionTimeout + connectionEST;
    const data = payload.params[0];
    const { accounts, peerMeta: peer } = data;
    const { walletAppId: initialWalletAppId } = getState();
    // For redirect flow, wallet app id is initially figure_web, but they may connect with a mobile or extension wallet on the page, so we need to update it
    const isConnectPageRedirectFlow =
      initialWalletAppId === 'figure_web_connect_page';
    const walletAppId: WalletId = ((isConnectPageRedirectFlow, isTest) => {
      if (isConnectPageRedirectFlow) {
        if (!peer) return isTest ? 'figure_mobile_test' : 'figure_mobile';
        if (peer?.url?.indexOf('extension') > -1) return 'figure_extension';
        if (peer?.url) return isTest ? 'figure_web_test' : 'figure_web';
      }
      return initialWalletAppId!;
    })(isConnectPageRedirectFlow, initialWalletAppId === 'figure_web_test');
    const {
      address,
      jwt: signedJWT,
      publicKey,
      representedGroupPolicy,
      walletInfo,
    } = getAccountInfo(accounts);
    setState({
      address,
      connectionEST,
      connectionEXP,
      status: 'connected',
      peer,
      publicKey,
      representedGroupPolicy,
      signedJWT,
      walletInfo,
      walletAppId,
    });
    broadcast(WINDOW_MESSAGES.CONNECTED, {
      data: {
        connectionEST,
        connectionEXP,
        connectionType: CONNECTION_TYPES.new_session,
      },
    });
    startConnectionTimer();
    if (walletAppId)
      sendWalletEvent(initialWalletAppId!, WALLET_APP_EVENTS.CONNECT, {
        address,
        walletInfo,
        signedJWT,
      } as any);
  });
  // ------------------------
  // DISCONNECT EVENT
  // ------------------------
  // - Trigger wallet event for "disconnect" (let the wallet know)
  // - Reset the walletConnectService state to default values
  // - Broadcast "disconnect" event (let the dApp know)
  newConnector.on(CONNECTOR_EVENTS.disconnect, (error) => {
    if (error) throw error;
    const { walletAppId } = getState();
    if (walletAppId) sendWalletEvent(walletAppId, WALLET_APP_EVENTS.DISCONNECT);
    resetState();
    broadcast(WINDOW_MESSAGES.DISCONNECT);
  });

  // ------------------------
  // SESSION RESUME EVENT
  // ------------------------
  // Walletconnect doesn't provide an event for .on(session_resume) or anything similar so we have to run that ourselves here
  // - Check existing connection EXP vs now to see if session expired
  //    - Note: connectionEXP must exist to "update" the session
  // - Save newConnector to walletConnectService state (data inside likely changed due to this event)
  // - Broadcast "session_update" event (let the dApp know)
  // - Start the "connection timer" to auto-disconnect wcjs when session is expired
  // - Trigger wallet event for "session_update" (let the wallet know)
  const resumeResumeEvent = () => {
    const connectionEST = Date.now();
    const connectionEXP = state.connectionEXP;
    const connected = newConnector.connected;
    // If we're already connected but the session is expired, kill it
    if (connected && (!connectionEXP || connectionEST >= connectionEXP))
      newConnector.killSession();
    else {
      setState({
        connector: newConnector,
      });
      broadcast(WINDOW_MESSAGES.CONNECTED, {
        data: {
          connectionEST,
          connectionEXP: connectionEXP || 0,
          connectionType: CONNECTION_TYPES.existing_session,
        },
      });
      startConnectionTimer();
      const { walletAppId } = getState();
      if (walletAppId)
        sendWalletEvent(walletAppId, WALLET_APP_EVENTS.SESSION_UPDATE);
    }
  };

  // The session had already previously existed, trigger the existing connection event
  if (newConnector.connected) resumeResumeEvent();

  return newConnector;
};
