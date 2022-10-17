import _createClass from "@babel/runtime/helpers/esm/createClass";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import WalletConnectClient from '@walletconnect/client';
import QRCode from 'qrcode';
import { WINDOW_MESSAGES } from '../../consts';
import { clearLocalStorage } from '../../utils';
import { WALLET_LIST, WALLET_APP_EVENTS } from '../../consts';
export var connect = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(_ref) {
    var state, setState, resetState, broadcast, customBridge, startConnectionTimer, getState, bridge, getAccountInfo, onSessionUpdate, onConnect, onDisconnect, subscribeToEvents, QRCodeModal, qrcodeModal, newConnector;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            state = _ref.state, setState = _ref.setState, resetState = _ref.resetState, broadcast = _ref.broadcast, customBridge = _ref.customBridge, startConnectionTimer = _ref.startConnectionTimer, getState = _ref.getState;
            // Either use the custom bridge passed in, or default back to stage bridge
            bridge = customBridge || state.bridge; // -------------------
            // PULL ACCOUNT INFO
            // -------------------

            getAccountInfo = function getAccountInfo(accounts) {
              if (!accounts || !Array.isArray(accounts) || !accounts.length) return {};
              var firstAccount = accounts[0]; // Accounts can either be an array of strings or an array of objects
              // Check the first value in the array to determine to type of data

              var isString = typeof firstAccount === 'string'; // If it's a string, return data in the form of [address, publicKey, lastConnectJWT] from accounts

              if (isString) {
                var _ref3 = accounts,
                    _ref4 = _slicedToArray(_ref3, 3),
                    _address = _ref4[0],
                    _publicKey = _ref4[1],
                    _jwt = _ref4[2]; // No walletInfo will be available on the old accounts array


                return {
                  address: _address,
                  publicKey: _publicKey,
                  jwt: _jwt,
                  walletInfo: {}
                };
              } // Data is in an object, pull keys from first item


              var address = firstAccount.address,
                  publicKey = firstAccount.publicKey,
                  jwt = firstAccount.jwt,
                  walletInfo = firstAccount.walletInfo;
              return {
                address: address,
                publicKey: publicKey,
                jwt: jwt,
                walletInfo: walletInfo
              };
            }; // ----------------
            // SESSION UPDATE
            // ----------------


            onSessionUpdate = function onSessionUpdate(newConnector) {
              // Get connection issued time
              var connectionIat = Math.floor(Date.now() / 1000);
              var connectionEat = state.connectionEat; // If the session is already expired (re-opened closed/idle tab), kill the session

              if (!connectionEat || connectionIat >= connectionEat) newConnector.killSession();else {
                var accounts = newConnector.accounts,
                    peer = newConnector.peerMeta;

                var _getAccountInfo = getAccountInfo(accounts),
                    address = _getAccountInfo.address,
                    publicKey = _getAccountInfo.publicKey,
                    lastConnectJWT = _getAccountInfo.jwt,
                    walletInfo = _getAccountInfo.walletInfo;

                var signedJWT = state.signedJWT || lastConnectJWT;
                setState({
                  address: address,
                  bridge: bridge,
                  publicKey: publicKey,
                  connected: true,
                  signedJWT: signedJWT,
                  peer: peer,
                  connectionIat: connectionIat,
                  walletInfo: walletInfo
                });
                var broadcastData = {
                  data: newConnector,
                  connectionIat: connectionIat,
                  connectionEat: state.connectionEat,
                  connectionType: 'existing session'
                };
                broadcast(WINDOW_MESSAGES.CONNECTED, broadcastData); // Start the auto-logoff timer

                startConnectionTimer();
              }
            }; // ----------------
            // CONNECTED
            // ----------------


            onConnect = function onConnect(payload) {
              var data = payload.params[0];
              var accounts = data.accounts,
                  peer = data.peerMeta;

              var _getAccountInfo2 = getAccountInfo(accounts),
                  address = _getAccountInfo2.address,
                  publicKey = _getAccountInfo2.publicKey,
                  signedJWT = _getAccountInfo2.jwt,
                  walletInfo = _getAccountInfo2.walletInfo; // Get connection issued/expires times (auto-logout)


              var connectionIat = Math.floor(Date.now() / 1000);
              var connectionEat = state.connectionTimeout + connectionIat;
              setState({
                address: address,
                bridge: bridge,
                publicKey: publicKey,
                peer: peer,
                connected: true,
                connectionIat: connectionIat,
                signedJWT: signedJWT,
                connectionEat: connectionEat,
                walletInfo: walletInfo
              });
              var broadcastData = {
                data: payload,
                connectionIat: connectionIat,
                connectionEat: connectionEat
              };
              broadcast(WINDOW_MESSAGES.CONNECTED, broadcastData); // Start the auto-logoff timer

              startConnectionTimer();
            }; // --------------------
            // WALLET DISCONNECT
            // --------------------


            onDisconnect = function onDisconnect() {
              // Get the latest state values
              var latestState = getState(); // Check for a known wallet app with special callback functions

              var knownWalletApp = WALLET_LIST.find(function (wallet) {
                return wallet.id === latestState.walletApp;
              }); // If the wallet app has an eventAction (web/extension) trigger it

              if (knownWalletApp && knownWalletApp.eventAction) {
                var eventData = {
                  event: WALLET_APP_EVENTS.DISCONNECT
                };
                knownWalletApp.eventAction(eventData);
              }

              resetState();
              broadcast(WINDOW_MESSAGES.DISCONNECT); // Manually clear out all of walletconnect-js from localStorage

              clearLocalStorage('walletconnect-js');
            }; // --------------------------
            // SUBSCRIBE TO WC EVENTS
            // --------------------------


            subscribeToEvents = function subscribeToEvents(newConnector) {
              if (!newConnector) return;
              /* Pulled RESERVED_EVENTS from wallet connect:
                "session_request",
                "session_update", [used]
                "exchange_key",
                "connect", [used]
                "disconnect", [used]
                "display_uri",
                "modal_closed",
                "transport_open",
                "transport_close",
                "transport_error",
              */
              // Session Update

              newConnector.on('session_update', function (error) {
                if (error) throw error;
                onSessionUpdate(newConnector);
              }); // Connect

              newConnector.on('connect', function (error, payload) {
                if (error) throw error;
                onConnect(payload);
              }); // Disconnect

              newConnector.on('disconnect', function (error) {
                if (error) throw error;
                onDisconnect();
              }); // Latest values

              var accounts = newConnector.accounts,
                  peer = newConnector.peerMeta;

              var _getAccountInfo3 = getAccountInfo(accounts),
                  address = _getAccountInfo3.address,
                  publicKey = _getAccountInfo3.publicKey,
                  lastConnectJWT = _getAccountInfo3.jwt,
                  walletInfo = _getAccountInfo3.walletInfo;

              var signedJWT = state.signedJWT || lastConnectJWT; // Are we already connected

              if (newConnector.connected) {
                onSessionUpdate(newConnector);
              } // Update Connector


              setState({
                address: address,
                bridge: bridge,
                connected: !!address,
                connector: newConnector,
                peer: peer,
                publicKey: publicKey,
                signedJWT: signedJWT,
                walletInfo: walletInfo
              });
            }; // ----------------------------
            // CREATE NEW WC CONNECTION
            // ----------------------------
            // Create custom QRCode modal


            QRCodeModal = /*#__PURE__*/_createClass(function QRCodeModal() {
              _classCallCheck(this, QRCodeModal);

              _defineProperty(this, "open", /*#__PURE__*/function () {
                var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(data) {
                  var qrcode;
                  return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return QRCode.toDataURL(data);

                        case 2:
                          qrcode = _context.sent;
                          setState({
                            QRCode: qrcode,
                            QRCodeUrl: data,
                            showQRCodeModal: true
                          });

                        case 4:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));

                return function (_x2) {
                  return _ref5.apply(this, arguments);
                };
              }());

              _defineProperty(this, "close", function () {
                setState({
                  showQRCodeModal: false
                });
              });
            });
            qrcodeModal = new QRCodeModal(); // create new connector

            newConnector = new WalletConnectClient({
              bridge: bridge,
              qrcodeModal: qrcodeModal
            }); // check if already connected

            if (newConnector.connected) {
              _context2.next = 13;
              break;
            }

            _context2.next = 13;
            return newConnector.createSession();

          case 13:
            // ----------------------------------------------
            // RUN SUBSCRIPTION WITH NEW WC CONNECTION
            // ----------------------------------------------
            subscribeToEvents(newConnector);

          case 14:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function connect(_x) {
    return _ref2.apply(this, arguments);
  };
}();