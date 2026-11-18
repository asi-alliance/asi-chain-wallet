import React from "react";
import { EvmProvider } from "components/EvmProvider";
import { Bridge } from "./Bridge";

import "@rainbow-me/rainbowkit/styles.css";

export default function BridgeRoute(): React.ReactElement {
    return (
        <EvmProvider>
            <Bridge />
        </EvmProvider>
    );
}
