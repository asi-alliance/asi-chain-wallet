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
    margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
`;

const ConfigTitle = styled.h2`
    margin: 0 0 ${({ theme }) => theme.spacing.xl};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.lg};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.lg};
    color: ${({ theme }) => theme.text.primary};
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.xl};
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

const DirectLinks = styled.div`
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing["3xl"]};
    background: ${({ theme }) => theme.surface};
    border-radius: ${({ theme }) => theme.radii.md};
    border: 1px solid ${({ theme }) => theme.border};
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
    }
`;

const LinkTitle = styled.div`
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    color: ${({ theme }) => theme.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Link = styled.button`
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
    color: ${({ theme }) => theme.actionText};
    margin-bottom: ${({ theme }) => theme.spacing.md};
    cursor: pointer;
    overflow-wrap: anywhere;
    word-break: break-word;

    &:hover {
        text-decoration: underline;
    }

    &:last-child {
        margin-bottom: 0;
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.focusRing};
        outline-offset: 2px;
        border-radius: ${({ theme }) => theme.radii.xs};
    }

    &:disabled {
        color: ${({ theme }) => theme.text.tertiary};
        cursor: not-allowed;
        text-decoration: none;
    }
`;

const EmptyEndpoints = styled.span`
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    color: ${({ theme }) => theme.text.secondary};
`;

const InlineInput = styled(Input)`
    height: ${({ theme }) => theme.sizes.control.field};
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
`;

const NodeApiSelectWrapper = styled.div`
    max-width: 300px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        max-width: none;
    }
`;

export const NetworkFormError = styled.div`
    margin-top: ${({ theme }) => theme.spacing.xl};
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
    border-radius: ${({ theme }) => theme.radii.sm};
    color: ${({ theme }) => theme.dangerText};
    background: ${({ theme }) => `${theme.danger}15`};
    border: 1px solid ${({ theme }) => theme.danger};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
`;

export interface INetworkFormValues {
    name: NetworkName;
    config: INetworkConfig;
}

export type TNetworkFormFieldKey =
    | "name"
    | keyof Pick<INetworkEndpoints, "ValidatorURL" | "ReadOnlyURL" | "IndexerURL">;

export type TNetworkFormFieldErrors = Partial<
    Record<TNetworkFormFieldKey, string>
>;

interface INetworkUrlField {
    field: keyof Pick<
        INetworkEndpoints,
        "ValidatorURL" | "ReadOnlyURL" | "IndexerURL"
    >;
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

export const getNetworkFormFieldErrors = (
    values: INetworkFormValues,
    reservedNames: string[],
): TNetworkFormFieldErrors => {
    const { name, config } = normalizeNetworkFormValues(values);
    const fieldErrors: TNetworkFormFieldErrors = {};

    if (!name) {
        fieldErrors.name = "Network name is required.";
    } else {
        const isNameReserved = reservedNames.some(
            (reservedName: string) =>
                reservedName.trim().toLowerCase() === name.toLowerCase(),
        );

        if (isNameReserved) {
            fieldErrors.name = `Network name "${name}" is already used by another network.`;
        }
    }

    for (const { field, label } of URL_FIELDS) {
        const { isValid, error } = validateUrl(config[field]);

        if (!isValid) {
            fieldErrors[field] = `${label}: ${error}`;
        }
    }

    return fieldErrors;
};

export const validateNetworkFormValues = (
    values: INetworkFormValues,
    reservedNames: string[],
): string | null => {
    const fieldErrors = getNetworkFormFieldErrors(values, reservedNames);
    const firstError = Object.values(fieldErrors).find(Boolean);

    return firstError ?? null;
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
    fieldErrors?: TNetworkFormFieldErrors;
}

export const NetworkFormFields: React.FC<NetworkFormFieldsProps> = ({
    idPrefix,
    values,
    onChange,
    disabled,
    fieldErrors = {},
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
                <InlineInput
                    id={`${idPrefix}-name-input`}
                    className="network-name-input"
                    label="Network Name"
                    value={name}
                    onChange={(event) =>
                        onChange({ ...values, name: event.target.value })
                    }
                    placeholder="Custom Network"
                    disabled={disabled}
                    error={fieldErrors.name}
                />
            </ConfigSection>

            <ConfigSection>
                <ConfigTitle id={`${idPrefix}-node-api-label`}>
                    Node API Profile
                </ConfigTitle>

                <NodeApiSelectWrapper>
                    <AdaptiveSelect
                        id={`${idPrefix}-node-api-select`}
                        aria-labelledby={`${idPrefix}-node-api-label`}
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
                                <InlineInput
                                    id={`${idPrefix}-${field.toLowerCase()}-input`}
                                    label={label}
                                    value={config[field]}
                                    onChange={(event) =>
                                        updateEndpoint(
                                            field,
                                            event.target.value,
                                        )
                                    }
                                    placeholder={placeholder}
                                    disabled={disabled}
                                    error={fieldErrors[field]}
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
                        <EmptyEndpoints>
                            No endpoints configured.
                        </EmptyEndpoints>
                    )}

                    {filledUrlFields.map(
                        ({ field, label }: INetworkUrlField) => (
                            <Link
                                key={field}
                                type="button"
                                disabled={
                                    disabled ||
                                    !validateUrl(config[field]).isValid
                                }
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
