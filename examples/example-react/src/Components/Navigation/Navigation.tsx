import styled from 'styled-components';
import { useWalletConnect } from '@provenanceio/walletconnect-js';
import { Sprite } from 'Components';
import { useState } from 'react';
import {
  AUTOCONNECT_URL,
  CONNECT_URL,
  ICON_NAMES,
  RESET_CONNECTION_URL,
  SEND_COIN_URL,
  SEND_MESSAGE_URL,
  SIGN_JWT_URL,
  SIGN_MESSAGE_URL,
} from 'consts';
import { COLORS } from 'theme';
import { useNavigate } from 'react-router-dom';

const NavContainer = styled.div`
  position: relative;
`;

const RowItem = styled.div<{ active: boolean }>`
  padding: 12px 0px 12px 40px;
  height: 48px;
  font-weight: 400;
  color: ${COLORS.PRIMARY_600};
  display: flex;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
  ${({ active }) =>
    `
    &:hover {
      background: ${COLORS.NEUTRAL_150};
    }
    ${
      active
        ? `
      background: ${COLORS.NEUTRAL_150};
      box-shadow: 4px 0 0 0 ${COLORS.PRIMARY_500} inset; 
    `
        : ''
    }
  `}
`;
const RowTitle = styled.p`
  font-size: 1.4rem;
  user-select: none;
  margin-left: 10px;
  margin-top: 1px;
`;

interface Props {
  bridgeUrl?: string;
}

export const Navigation: React.FC<Props> = ({ bridgeUrl }) => {
  const [activePage, setActivePage] = useState('connect');
  // List of links
  const navItems = [
    {
      name: 'Auto Connect',
      icon: ICON_NAMES.CHECK,
      url: AUTOCONNECT_URL,
    },
    {
      name: 'Reset Connection',
      icon: ICON_NAMES.RELOAD,
      url: RESET_CONNECTION_URL,
    },
    {
      name: 'Send Coin',
      icon: ICON_NAMES.HASH,
      url: SEND_COIN_URL,
    },
    {
      name: 'Send Message',
      icon: ICON_NAMES.GEAR,
      url: SEND_MESSAGE_URL,
    },
    {
      name: 'Sign JWT',
      icon: ICON_NAMES.PENCIL,
      url: SIGN_JWT_URL,
    },
    {
      name: 'Sign Message',
      icon: ICON_NAMES.PENCIL,
      url: SIGN_MESSAGE_URL,
    },
  ];

  const navigate = useNavigate();
  // eslint-disable-line react/prop-types
  const { walletConnectService, walletConnectState } = useWalletConnect();
  const { connected } = walletConnectState;

  const handleDisconnect = () => {
    walletConnectService.disconnect();
  };

  const handleActionClick = (name: string, url: string) => {
    setActivePage(name);
    navigate(url);
  };

  const renderActionNavItems = () =>
    navItems.map(({ name, icon, url }) => (
      <RowItem
        active={activePage === name}
        key={name}
        onClick={() => handleActionClick(name, url)}
      >
        <Sprite icon={icon} size="1.1rem" />
        <RowTitle>{name}</RowTitle>
      </RowItem>
    ));

  return connected ? (
    <NavContainer>
      {renderActionNavItems()}
      <RowItem active={false} onClick={handleDisconnect}>
        <Sprite icon={ICON_NAMES.LOGOUT} size="1.1rem" />
        <RowTitle>Disconnect</RowTitle>
      </RowItem>
    </NavContainer>
  ) : (
    <RowItem active={true} onClick={() => navigate(CONNECT_URL)}>
      <Sprite icon={ICON_NAMES.KEY} size="1.1rem" />
      <RowTitle>Connect</RowTitle>
    </RowItem>
  );
};
