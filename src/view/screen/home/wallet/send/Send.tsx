import React, { FC, useCallback, useContext, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import ExtensionPlatform from "../../../../../libs/service/extension";
import {
  Body,
  ButtonBottomRow,
  ButtonColumn,
  ButtonNegative,
  ButtonPositive,
  Center,
  Container,
  Gap,
  H1,
  H3,
  Input,
  Text,
} from "../../../../components/Components";
import { HomeButton } from "../../../../components/HomeButton";
import { BackIcon, LinkIcon } from "../../../../components/Icons";
import { LoadingLogo } from "../../../../components/Logo";
import { WalletAddressContext } from "../../../../context";
import { askBackground, sendBackground } from "../../../../event";
import { AppRoute } from "../../../../routes";
import { useNetworkConfig } from "../../api";
import { State, useEstimateFee, useSendMutation } from "./api";

const Block = styled(Container)`
  width: 100%;
  padding-bottom: 0;
`;

const Button = styled.div`
  cursor: pointer;
`;

const toState = (searchParams: URLSearchParams): State => {
  return {
    address: decodeURIComponent(searchParams.get("address") ?? ""),
    amount: decodeURIComponent(searchParams.get("amount") ?? ""),
    max: searchParams.get("max") ?? "",
    comment: decodeURIComponent(searchParams.get("comment") ?? ""),
  };
};

const stateToSearch = (state: State) => {
  return Object.entries(state).reduce((acc, [key, value]) => {
    acc[key] = encodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);
};

const EditButton = React.memo(() => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = toState(searchParams);
  const onEdit = () => {
    setSearchParams({ ...state });
  };
  return (
    <Block>
      <Button onClick={onEdit}>
        <BackIcon /> Edit
      </Button>
    </Block>
  );
});

const CancelButton: FC<{ disabled?: boolean }> = ({ disabled }) => {
  const navigate = useNavigate();
  return (
    <ButtonNegative onClick={() => navigate(AppRoute.home)} disabled={disabled}>
      Cancel
    </ButtonNegative>
  );
};

const Label = styled.div`
  margin: ${(props) => props.theme.padding} 0 5px;
`;

const MaxRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: end;
`;

const MaxButton = styled.button`
  color: ${(props) => props.theme.darkBlue};
  text-decoration: underline;
  cursor: pointer;
  padding: 0 5px;
  background: ${(props) => props.theme.background};
  border: 0;
  outline: 0;
`;

interface Props {
  price?: number;
  balance?: string;
}

interface InputProps {
  balance?: string;
  state: State;
  onChange: (field: Partial<State>) => void;
  onSend: () => void;
}

const InputView: FC<InputProps> = ({ state, balance, onChange, onSend }) => {
  return (
    <Body>
      <H1>Send TON</H1>
      <Label>Enter wallet address</Label>
      <Input
        value={state.address}
        onChange={(e) => onChange({ address: e.target.value })}
      />

      <Label>Amount</Label>
      <Input
        type="number"
        value={state.amount}
        onChange={(e) => onChange({ amount: e.target.value, max: "0" })}
      />
      <MaxRow>
        <MaxButton onClick={() => onChange({ amount: balance, max: "1" })}>
          Max
        </MaxButton>
        {balance} TON
      </MaxRow>

      <Label>Comment (optional)</Label>
      <Input
        value={state.comment}
        onChange={(e) => onChange({ comment: e.target.value })}
      />

      <Gap />

      <ButtonBottomRow>
        <CancelButton />
        <ButtonPositive onClick={onSend}>Next</ButtonPositive>
      </ButtonBottomRow>
    </Body>
  );
};

const Address = styled.span`
  word-break: break-all;
  padding-bottom: ${(props) => props.theme.padding};
`;

const Fiat = styled.span`
  color: ${(props) => props.theme.darkGray};
`;
interface ConfirmProps {
  state: State;
  price?: number;
  onSend: (seqno: number) => void;
}

const fiatFees = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const ConfirmView: FC<ConfirmProps> = ({ state, price, onSend }) => {
  const { data } = useEstimateFee(state);

  const { mutateAsync, isLoading } = useSendMutation();

  const onConfirm = async () => {
    const seqno = await mutateAsync(state);
    onSend(seqno);
  };

  const Fees = useCallback(() => {
    if (!data) {
      return <Text>Loading...</Text>;
    }
    const totalTon =
      (data.fwd_fee + data.in_fwd_fee + data.storage_fee + data.gas_fee) /
      1000000000;

    const fiat = price ? `(USD ${fiatFees.format(totalTon * price)}$)` : "";

    return (
      <Text>
        Total fee: ~{fiatFees.format(totalTon)} TON <Fiat>{fiat}</Fiat>
      </Text>
    );
  }, [data, price]);

  return (
    <>
      <EditButton />
      <Body>
        <Text>
          Send <b>{state.amount}</b> TON to
        </Text>
        <Address>{state.address}</Address>
        {state.comment && <Text>Comment: "{state.comment}"</Text>}

        <H3>Network fee estimation</H3>
        <Fees />
        <Gap />

        <ButtonBottomRow>
          <CancelButton disabled={isLoading} />
          <ButtonPositive disabled={isLoading} onClick={onConfirm}>
            Confirm
          </ButtonPositive>
        </ButtonBottomRow>
      </Body>
    </>
  );
};

const timeout = 60 * 1000; // 60 sec

const LoadingView: FC<{ seqNo: string; onConfirm: () => void }> = React.memo(
  ({ seqNo, onConfirm }) => {
    useEffect(() => {
      askBackground<void>(timeout)
        .message("confirmSeqNo", parseInt(seqNo))
        .then(() => {
          onConfirm();
        });
    }, [seqNo, onConfirm]);

    return (
      <Body>
        <Gap />
        <LoadingLogo />
        <Center>
          <H1>Await confirmation</H1>
          <Text>~10 sec</Text>
        </Center>
        <Gap />
      </Body>
    );
  }
);

const SuccessView = () => {
  const navigate = useNavigate();
  const config = useNetworkConfig();
  const address = useContext(WalletAddressContext);

  return (
    <>
      <HomeButton />
      <Body>
        <Gap />
        <LoadingLogo />
        <Center>
          <H1>Success</H1>
          <Text>Transaction confirmed</Text>
        </Center>
        <ButtonColumn>
          <ButtonNegative
            onClick={() => {
              ExtensionPlatform.openTab({
                url: `${config.scanUrl}/address/${address}`,
              });
            }}
          >
            View on tonscan.org <LinkIcon />
          </ButtonNegative>
          <ButtonPositive onClick={() => navigate(AppRoute.home)}>
            Close
          </ButtonPositive>
        </ButtonColumn>

        <Gap />
      </Body>
    </>
  );
};

export const Send: FC<Props> = ({ price, balance }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const seqNo = searchParams.get("seqNo");
  const confirm = searchParams.get("confirm");

  const submit = searchParams.get("submit") === "1";

  const state = useMemo(() => {
    return toState(searchParams);
  }, [searchParams]);

  const onSubmit = useCallback(() => {
    const params = { ...stateToSearch(state), submit: "1" };

    sendBackground.message("storeOperation", {
      kind: "send",
      value: JSON.stringify(params),
    });

    setSearchParams(params);
  }, [setSearchParams, state]);

  const onChange = useCallback(
    (field: Partial<State>) => {
      const params = stateToSearch({ ...state, ...field });

      sendBackground.message("storeOperation", {
        kind: "send",
        value: JSON.stringify(params),
      });

      setSearchParams(params);
    },
    [setSearchParams, state]
  );

  const onSend = useCallback(
    (seqNo: number) => {
      const params = { seqNo: String(seqNo) };

      sendBackground.message("storeOperation", {
        kind: "send",
        value: JSON.stringify(params),
      });

      setSearchParams(params);
    },
    [setSearchParams]
  );

  const onConfirm = useCallback(() => {
    sendBackground.message("storeOperation", null);

    setSearchParams({ confirm: String(seqNo) });
  }, [setSearchParams, seqNo]);

  if (confirm !== null) {
    return <SuccessView />;
  }

  if (seqNo !== null) {
    return <LoadingView seqNo={seqNo} onConfirm={onConfirm} />;
  }

  if (!submit) {
    return (
      <InputView
        state={state}
        onChange={onChange}
        onSend={onSubmit}
        balance={balance}
      />
    );
  }

  return <ConfirmView state={state} price={price} onSend={onSend} />;
};
