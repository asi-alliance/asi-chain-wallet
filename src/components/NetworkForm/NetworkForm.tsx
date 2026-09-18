import React, { Fragment } from "react";
import styled from "styled-components";
import { Input } from "components";
import { AdaptiveSelect, ISelectOption } from "components/Select";
import {
    DEFAULT_NODE_API_PROFILE,
    INetworkConfig,
    INetworkEndpoints,
    isNodeApiProfile,
    NetworkName,
    NODE_API_PROFILE_DESCRIPTORS,
    validateUrl,
} from "@asichain/asi-wallet-sdk";

const ConfigSection = styled.div`
    margin-bottom: 36px;
`;

const ConfigTitle = styled.h2`
    margin-bottom: 16px;
    color: ${({ theme }) => theme.text.primary};
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
`;

const Label = styled.label`
    font-weight: 500;
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 8px;
`;

const DirectLinks = styled.div`
    padding: 16px 23px;
    background: ${({ theme }) => theme.surface};
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.border};
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: 14px 16px;
    }

    @media (max-width: 400px) {
        padding: 12px;
    }
`;

const LinkTitle = styled.div`
    color: ${({ theme }) => theme.text.primary};
    margin-bottom: 10px;
    line-height: 100%;
`;

const Link = styled.div`
    color: ${({ theme }) => theme.primary};
    margin-bottom: 10px;
    cursor: pointer;
    line-height: 1.4;
    overflow-wrap: anywhere;
    word-break: break-word;

    &:hover {
        text-decoration: underline;
    }

    &:last-child {
        margin-bottom: 0;
    }

    @media (max-width: 400px) {
        font-size: 14px;
    }
`;

const InlineInput = styled(Input)`
    height: 44px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
`;

const NodeApiSelectWrapper = styled.div`
    max-width: 300px;

    @media (max-width: 768px) {
        max-width: none;
    }
`;

export const NetworkFormError = styled.div`
    margin-top: 16px;
    padding: 12px 16px;
    border-radius: 6px;
    color: ${({ theme }) => theme.error};
    background: ${({ theme }) => `${theme.error}15`};
    border: 1px solid ${({ theme }) => theme.error};
`;

export interface INetworkFormValues {
    name: NetworkName;
    config: INetworkConfig;
}

interface INetworkUrlField {
    field: keyof INetworkEndpoints;
    label: string;
    placeholder: string;
}

const URL_FIELDS: INetworkUrlField[] = [
    {
        field: "ValidatorURL",
        label: "Validator URL",
        placeholder: "http://localhost:40403",
    },
    {
        field: "ReadOnlyURL",
        label: "Read-only URL",
        placeholder: "http://localhost:40453",
    },
    {
        field: "IndexerURL",
        label: "Indexer URL",
        placeholder: "http://localhost:3000",
    },
];

const nodeApiOptions: ISelectOption[] = Object.values(
    NODE_API_PROFILE_DESCRIPTORS,
).map((descriptor) => ({
    id: descriptor.profile,
    value: descriptor.profile,
    label: descriptor.label,
    additionalLabel: descriptor.stability,
}));

export const createEmptyNetworkFormValues = (): INetworkFormValues => ({
    name: "",
    config: {
        ValidatorURL: "",
        ReadOnlyURL: "",
        IndexerURL: "",
        nodeApiProfile: DEFAULT_NODE_API_PROFILE,
    },
});

export const normalizeNetworkFormValues = ({
    name,
    config,
}: INetworkFormValues): INetworkFormValues => ({
    name: name.trim(),
    config: {
        ValidatorURL: config.ValidatorURL.trim(),
        ReadOnlyURL: config.ReadOnlyURL.trim(),
        IndexerURL: config.IndexerURL.trim(),
        nodeApiProfile: config.nodeApiProfile,
    },
});

export const validateNetworkFormValues = (
    values: INetworkFormValues,
    reservedNames: string[],
): string | null => {
    const { name, config } = normalizeNetworkFormValues(values);

    if (!name) {
        return "Network name is required.";
    }

    const isNameReserved = reservedNames.some(
        (reservedName: string) =>
            reservedName.trim().toLowerCase() === name.toLowerCase(),
    );

    if (isNameReserved) {
        return `Network name "${name}" is already used by another network.`;
    }

    for (const { field, label } of URL_FIELDS) {
        const { isValid, error } = validateUrl(config[field]);

        if (!isValid) {
            return `${label}: ${error}`;
        }
    }

    return null;
};

const openLink = (url: string): void => {
    if (!validateUrl(url).isValid) {
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
};

interface NetworkFormFieldsProps {
    idPrefix: string;
    values: INetworkFormValues;
    onChange: (values: INetworkFormValues) => void;
    disabled: boolean;
}

export const NetworkFormFields: React.FC<NetworkFormFieldsProps> = ({
    idPrefix,
    values,
    onChange,
    disabled,
}) => {
    const { name, config } = values;

    const updateEndpoint = (
        field: keyof INetworkEndpoints,
        value: string,
    ): void => {
        onChange({
            ...values,
            config: {
                ...config,
                [field]: value,
            },
        });
    };

    const updateNodeApiProfile = (value: string): void => {
        if (!isNodeApiProfile(value)) {
            return;
        }

        onChange({
            ...values,
            config: {
                ...config,
                nodeApiProfile: value,
            },
        });
    };

    const filledUrlFields = URL_FIELDS.filter(
        ({ field }: INetworkUrlField) => !!config[field],
    );

    return (
        <Fragment>
            <ConfigSection>
                <Label>
                    <h4>Network Name</h4>
                </Label>

                <InlineInput
                    id={`${idPrefix}-name-input`}
                    className="network-name-input text-2"
                    value={name}
                    onChange={(event) =>
                        onChange({ ...values, name: event.target.value })
                    }
                    placeholder="Custom Network"
                    disabled={disabled}
                />
            </ConfigSection>

            <ConfigSection>
                <ConfigTitle>Node API Profile</ConfigTitle>

                <NodeApiSelectWrapper>
                    <AdaptiveSelect
                        id={`${idPrefix}-node-api-select`}
                        value={config.nodeApiProfile}
                        onChange={updateNodeApiProfile}
                        disabled={disabled}
                        options={nodeApiOptions}
                    />
                </NodeApiSelectWrapper>
            </ConfigSection>

            <ConfigSection>
                <ConfigTitle>Network Endpoints</ConfigTitle>

                <FormRow>
                    {URL_FIELDS.map(
                        ({ field, label, placeholder }: INetworkUrlField) => (
                            <FormGroup key={field}>
                                <Label>
                                    <h4>{label}:</h4>
                                </Label>

                                <InlineInput
                                    id={`${idPrefix}-${field.toLowerCase()}-input`}
                                    className="text-2"
                                    value={config[field]}
                                    onChange={(event) =>
                                        updateEndpoint(
                                            field,
                                            event.target.value,
                                        )
                                    }
                                    placeholder={placeholder}
                                    disabled={disabled}
                                />
                            </FormGroup>
                        ),
                    )}
                </FormRow>
            </ConfigSection>

            <ConfigSection>
                <ConfigTitle>Direct Links</ConfigTitle>

                <DirectLinks>
                    <LinkTitle>Available endpoints:</LinkTitle>

                    {!filledUrlFields.length && (
                        <span className="text-2">No endpoints configured.</span>
                    )}

                    {filledUrlFields.map(
                        ({ field, label }: INetworkUrlField) => (
                            <Link
                                key={field}
                                className="text-2"
                                onClick={() => openLink(config[field])}
                            >
                                {label}: {config[field]}
                            </Link>
                        ),
                    )}
                </DirectLinks>
            </ConfigSection>
        </Fragment>
    );
};
