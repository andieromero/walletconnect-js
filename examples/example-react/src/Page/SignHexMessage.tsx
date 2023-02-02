import { useState } from 'react';
import { useWalletConnect } from '@provenanceio/walletconnect-js';
import { Button, Input, ActionCard, Results } from 'Components';
import { ICON_NAMES } from 'consts';

export const SignHexMessage: React.FC = () => {
  const [value, setValue] = useState('');
  const [results, setResults] = useState<{
    [key: string]: any;
  } | null>({});
  const { walletConnectService: wcs, walletConnectState } = useWalletConnect();
  const { pendingMethod } = walletConnectState;
  const signMessageLoading = pendingMethod === 'signHexMessage';

  const handleSubmit = async () => {
    const result = await wcs.signHexMessage(value);
    console.log(
      'example-react | SignHexMessage.tsx | handleSubmit | signHexMessage result: ',
      result
    );
    setResults({
      action: 'signHexMessage',
      status: result.error ? 'failed' : 'success',
      message: result.error
        ? result.error
        : 'WalletConnectJS | Sign Hex Message Complete',
      data: result,
    });
  };

  return (
    <ActionCard
      icon={ICON_NAMES.PENCIL}
      title="Sign Hex Message"
      description="Send a sign message request message to the wallet.
                   The message to be signed must be hex encoded to allow for signing of bytes.
                   The wallet will decode the hex message and sign the underlying bytes."
      status={results?.status}
    >
      <Input
        value={value}
        label="Hex Encoded Message"
        placeholder="Enter hex encoded message"
        onChange={setValue}
        bottomGap
        disabled={signMessageLoading}
        submit={handleSubmit}
      />
      <Button loading={signMessageLoading} onClick={handleSubmit} disabled={!value}>
        Submit
      </Button>
      <Results results={results} setResults={setResults} />
    </ActionCard>
  );
};
