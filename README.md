<div align="center">
  <img src="./src/logo.svg" alt="Provenance.io WalletConnect-JS"/>
</div>
<br/><br/>

# Provenance.io WalletConnect-JS

Library to interface with Provenance Wallet using WalletConnect.

[Provenance] is a distributed, proof of stake blockchain designed for the financial services industry.

For more information about [Provenance Inc](https://provenance.io) visit https://provenance.io

## Use

Import the dependency

```bash
npm install @provenanceio/walletconnect-js --save
```

Importable items:

```js
import { useWalletConnect, WalletConnectContextProvider, WINDOW_MESSAGES } from '@provenanceio/walletconnect-js';
```
* `useWalletConnect` - React hook which contains `walletConnectService` and `walletConnectState`
  - `walletConnectService` - Holds all main methods and functions to use WalletConnect service
    - *Methods* (and messages for each)
      - `connect()` - Connect a WalletConnect wallet
        - `CONNECTED`
      - `disconnect()` - Disconnect current session
        - `DISCONNECT`
      - `signMessage(message)` - Prompt user to sign a custom message
        - `SIGNATURE_COMPLETE`, `SIGNATURE_FAILED`
      - `signJWT()` - Prompt user to sign a generated JWT
        - `SIGN_JWT_COMPLETE`, `SIGN_JWT_FAILED`
      - `sendHash({ to: '123', amount: 100 })` - Send a custom amount of Hash token to a custom address
        - `TRANSACTION_COMPLETE`, `TRANSACTION_FAILED`
      - `delegateHash({ to: '123', amount: 100 })` - Delegate a custom amount of Hash token to a custom address
        - `DELEGATE_HASH_COMPLETE`, `DELEGATE_HASH_FAILED`
      - `addMarker({ denom: 'myMarker', amount: 100 })` - Add a marker
        - `ADD_MARKER_COMPLETE`, `ADD_MARKER_FAILED`
      - `activateRequest({ denom: 'myMarker', administrator: 'tp121331223fdsdaf1234' })` - Add a marker
        - `ACTIVATE_REQUEST_COMPLETE`, `ACTIVATE_REQUEST_FAILED`
  - `walletConnectState` - Holds current walletconnect-js state values
    ```js
      initialState: {
        account: '',
        addMarkerLoading: false,
        address: '',
        assets: [],
        assetsPending: false,
        connected: false,
        connectionIat: '',
        connector: null,
        delegateHashLoading: false,
        figureConnected: false,
        newAccount: false,
        peer: {},
        publicKey: '',
        QRCode: '',
        sendHashLoading: false,
        showQRCodeModal: false,
        signedJWT: '',
        signJWTLoading: false,
        signMessageLoading: false,
      }
    ```
* `WalletConnectContextProvider` - React context provider to supply state to every child within
  - Include as parent to all Components using walletconnect-js
  - Takes in an optional `network` prop [`"mainnet"` vs `"testnet"`](defaults to `"mainnet"`)
  - Example:
    ```js
    // index.js
    ...

    ReactDOM.render(
      <Provider store={store}>
        <WalletConnectContextProvider network="testnet">
          <App />
        </WalletConnectContextProvider>
      </Provider>,
      document.getElementById('root')
    );
    ```
* `WINDOW_MESSAGES` - Various messages broadcast out from walletconnect-js to the parent application
  - Use these messages to prompt or indicate status updates to the end user
  - Current Messages: `CONNECTED`, `DISCONNECT`, `TRANSACTION_COMPLETE`, `TRANSACTION_FAILED`, `SIGNATURE_COMPLETE`, `SIGNATURE_FAILED`, `SIGN_JWT_COMPLETE`, `SIGN_JWT_FAILED`, `ADD_MARKER_COMPLETE`, `ADD_MARKER_FAILED`, `ACTIVATE_REQUEST_COMPLETE`, `ACTIVATE_REQUEST_FAILED`, `DELEGATE_HASH_COMPLETE`, and `DELEGATE_HASH_FAILED`.
  - Usage:  Currently there is are custom event listener methods on `walletConnectService`
    - These are `addListener(eventName, callback)`, `removeListener(eventName, callback)`, and `removeAllListeners(eventName)`
    - Note: All of these are based off Node.js Event Emitters, read more on that here: [https://nodejs.org/api/events.html#event-newlistener]
    - Example:
      ```js
      // Home.js
      ...
      useEffect(() => {
        // Wallet Connected/Disconnected
        walletConnectService.addListener(WINDOW_MESSAGES.CONNECTED, () => {console.log('Wallet Connected')});
        walletConnectService.addListener(WINDOW_MESSAGES.DISCONNECT, () => {console.log('Wallet Disconnected')});
      }, [walletConnectService]);
      ...
      ```

## Web App
This package comes bundled with a full React demo that you can run locally to test out the various features of walletconnect-js.
To see how to initiate and run the webDemo, look through the [webDemo README.md](./webDemo/README.md)

  * Quick Start:
    1) Run `npm i`, followed by `npm run start`.  This will start a localhost server with live updates

## Automatic localSession copy (copy localStorage from live-site to localHost)
1) Run this command in console on the first page you with to copy from
```js
copy(`Object.entries(${JSON.stringify(localStorage)})
.forEach(([k,v])=>localStorage.setItem(k,v))`)
```
2) Paste result (clipboard should automatically have been filled) into target page console.
3) Refresh page, storage values should be synced.

## Status

[![Latest Release][release-badge]][release-latest]
[![Apache 2.0 License][license-badge]][license-url]
[![LOC][loc-badge]][loc-report]

[license-badge]: https://img.shields.io/github/license/provenance-io/walletconnect-js.svg
[license-url]: https://github.com/provenance-io/walletconnect-js/blob/main/LICENSE
[release-badge]: https://img.shields.io/github/tag/provenance-io/walletconnect-js.svg
[release-latest]: https://github.com/provenance-io/walletconnect-js/releases/latest
[loc-badge]: https://tokei.rs/b1/github/provenance-io/walletconnect-js
[loc-report]: https://github.com/provenance-io/walletconnect-js
[lint-badge]: https://github.com/provenance-io/walletconnect-js/workflows/Lint/badge.svg
[provenance]: https://provenance.io/#overview

This application is under heavy development. The upcoming public blockchain is the evolution of the private Provenance network blockchain started in 2018.
Current development is being supported by [Figure Technologies](https://figure.com).
