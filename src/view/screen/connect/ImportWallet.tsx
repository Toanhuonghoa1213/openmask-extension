import { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import {
  Body,
  ButtonBottomRow,
  ButtonNegative,
  ButtonPositive,
  ErrorMessage,
  H1,
  Text,
  Textarea,
} from "../../components/Components";
import { CheckIcon, CloseIcon } from "../../components/Icons";
import { useImportWalletMutation } from "../../lib/state/account";
import { AppRoute, relative } from "../../routes";

enum ImportRoutes {
  index = "/",
  mnemonic = "/mnemonic",
}

const ImportMnemonic = () => {
  const navigate = useNavigate();

  const { mutateAsync, isLoading, reset, error } = useImportWalletMutation();
  const [value, setValue] = useState("");

  const onConnect = async () => {
    reset();
    await mutateAsync(value);
    navigate(AppRoute.home);
  };

  return (
    <Body>
      <H1>Import existing wallet</H1>
      <Text>To connect wallet, please enter your mnemonic here</Text>
      <Textarea
        disabled={isLoading}
        rows={10}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {error && <ErrorMessage>{error.message}</ErrorMessage>}
      <ButtonBottomRow>
        <ButtonNegative onClick={() => navigate(AppRoute.home)}>
          Cancel
        </ButtonNegative>
        <ButtonPositive onClick={onConnect}>Connect</ButtonPositive>
      </ButtonBottomRow>
    </Body>
  );
};

const ImportIndex = () => {
  const navigate = useNavigate();
  return (
    <Body>
      <H1>Get Started with TonMask</H1>
      <Text>
        TonMask is open source software, you may alway check code on a GitHub.
        Wallet is not profitable, don't charge any commission for transactions
        and store all user data on a user device.
      </Text>
      <Text>
        <CheckIcon /> TonMask <b>Always</b> connecting you to The Open Network
        and the decentralized web
      </Text>
      <Text>
        <CloseIcon /> TonMask <b>Never</b> collect keys, addresses,
        transactions, balances, hashes, or any personal information
      </Text>
      <ButtonBottomRow>
        <ButtonNegative onClick={() => navigate(AppRoute.home)}>
          No Thanks
        </ButtonNegative>
        <ButtonPositive
          onClick={() => navigate(relative(ImportRoutes.mnemonic))}
        >
          Input Mnemonic
        </ButtonPositive>
      </ButtonBottomRow>
    </Body>
  );
};

export const Import = () => {
  return (
    <Routes>
      <Route path={ImportRoutes.mnemonic} element={<ImportMnemonic />} />
      <Route path={ImportRoutes.index} element={<ImportIndex />} />
    </Routes>
  );
};
